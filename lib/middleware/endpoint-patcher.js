const { verifyPatient, patientFilter, addPatientId } = require('../middleware/patient-filter');

/**
 * Função para aplicar filtro de paciente a um endpoint existente
 * 
 * Esta função modifica um endpoint existente para adicionar
 * verificação de token e filtro de patientId.
 * 
 * @param {Object} app - Aplicação Express
 * @param {string} method - Método HTTP (get, post, put, delete)
 * @param {string} path - Caminho do endpoint
 * @param {Function} originalHandler - Handler original do endpoint
 */
function patchEndpoint(app, method, path, originalHandler) {
  // Armazena o handler original
  const originalRoute = app._router.stack.find(layer => {
    return layer.route && 
           layer.route.path === path && 
           layer.route.methods[method.toLowerCase()];
  });
  
  if (!originalRoute) {
    console.warn(`Aviso: Endpoint ${method.toUpperCase()} ${path} não encontrado para patch`);
    return;
  }
  
  // Remove a rota original
  app._router.stack = app._router.stack.filter(layer => layer !== originalRoute);
  
  // Cria uma nova rota com os middlewares de autenticação e filtro
  app[method.toLowerCase()](path, verifyPatient, patientFilter, addPatientId, (req, res, next) => {
    // Modifica a função de consulta para adicionar filtro de patientId
    const originalFind = req.collection.find;
    req.collection.find = function(query, options) {
      // Adiciona o filtro de patientId à consulta
      const filteredQuery = req.addPatientFilter(query || {});
      return originalFind.call(this, filteredQuery, options);
    };
    
    // Chama o handler original
    originalHandler(req, res, next);
  });
  
  console.log(`Endpoint ${method.toUpperCase()} ${path} modificado para suportar multi-paciente`);
}

/**
 * Função para aplicar filtro de paciente a todos os endpoints de uma coleção
 * 
 * @param {Object} app - Aplicação Express
 * @param {string} collectionName - Nome da coleção
 */
function patchCollectionEndpoints(app, collectionName) {
  // Endpoints comuns para coleções
  const endpoints = [
    { method: 'get', path: `/api/v1/${collectionName}` },
    { method: 'get', path: `/api/v1/${collectionName}/:id` },
    { method: 'post', path: `/api/v1/${collectionName}` },
    { method: 'put', path: `/api/v1/${collectionName}/:id` },
    { method: 'delete', path: `/api/v1/${collectionName}/:id` },
    { method: 'get', path: `/api/v2/${collectionName}` },
    { method: 'get', path: `/api/v2/${collectionName}/:id` }
  ];
  
  // Aplica patch a cada endpoint
  for (const endpoint of endpoints) {
    const handler = findEndpointHandler(app, endpoint.method, endpoint.path);
    if (handler) {
      patchEndpoint(app, endpoint.method, endpoint.path, handler);
    }
  }
}

/**
 * Função para encontrar o handler de um endpoint
 * 
 * @param {Object} app - Aplicação Express
 * @param {string} method - Método HTTP
 * @param {string} path - Caminho do endpoint
 * @returns {Function|null} - Handler do endpoint ou null se não encontrado
 */
function findEndpointHandler(app, method, path) {
  const route = app._router.stack.find(layer => {
    return layer.route && 
           layer.route.path === path && 
           layer.route.methods[method.toLowerCase()];
  });
  
  if (route && route.route.stack && route.route.stack.length > 0) {
    return route.route.stack[route.route.stack.length - 1].handle;
  }
  
  return null;
}

/**
 * Função para aplicar filtro de paciente a todos os endpoints da API v3
 * 
 * @param {Object} app - Aplicação Express
 */
function patchApiV3(app) {
  // Encontra o router da API v3
  const apiV3Router = app._router.stack.find(layer => {
    return layer.name === 'router' && 
           layer.regexp && 
           layer.regexp.toString().includes('/api/v3');
  });
  
  if (!apiV3Router || !apiV3Router.handle || !apiV3Router.handle.stack) {
    console.warn('Aviso: Router da API v3 não encontrado');
    return;
  }
  
  // Adiciona middleware de autenticação e filtro a todas as rotas da API v3
  for (const layer of apiV3Router.handle.stack) {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods);
      
      for (const method of methods) {
        const handler = layer.route.stack[layer.route.stack.length - 1].handle;
        
        // Remove os handlers existentes
        layer.route.stack = [];
        
        // Adiciona os middlewares de autenticação e filtro
        layer.route.stack.push({ 
          handle: verifyPatient, 
          name: 'verifyPatient' 
        });
        
        layer.route.stack.push({ 
          handle: patientFilter, 
          name: 'patientFilter' 
        });
        
        layer.route.stack.push({ 
          handle: addPatientId, 
          name: 'addPatientId' 
        });
        
        // Adiciona o handler original modificado
        layer.route.stack.push({
          handle: (req, res, next) => {
            // Modifica a função de consulta para adicionar filtro de patientId
            if (req.api3 && req.api3.collection) {
              const originalFind = req.api3.collection.find;
              req.api3.collection.find = function(query, options) {
                // Adiciona o filtro de patientId à consulta
                const filteredQuery = req.addPatientFilter(query || {});
                return originalFind.call(this, filteredQuery, options);
              };
            }
            
            // Chama o handler original
            handler(req, res, next);
          },
          name: 'modifiedHandler'
        });
        
        console.log(`Endpoint ${method.toUpperCase()} /api/v3${path} modificado para suportar multi-paciente`);
      }
    }
  }
}

/**
 * Função principal para aplicar filtro de paciente a todos os endpoints existentes
 * 
 * @param {Object} app - Aplicação Express
 */
function patchAllEndpoints(app) {
  // Coleções a serem modificadas
  const collections = [
    'entries',
    'treatments',
    'devicestatus',
    'profile',
    'food',
    'activity',
    'settings'
  ];
  
  // Aplica patch a cada coleção
  for (const collection of collections) {
    patchCollectionEndpoints(app, collection);
  }
  
  // Aplica patch à API v3
  patchApiV3(app);
  
  console.log('Todos os endpoints foram modificados para suportar multi-paciente');
}

module.exports = {
  patchEndpoint,
  patchCollectionEndpoints,
  patchApiV3,
  patchAllEndpoints
};
