const { expect } = require('chai');
const express = require('express');
const { patchEndpoint, patchApiV3 } = require('../lib/middleware/endpoint-patcher');
const { verifyPatient } = require('../lib/middleware/auth');

describe('Endpoint Patcher', function() {
  let app;
  
  beforeEach(function() {
    // Cria uma nova aplicação Express para cada teste
    app = express();
    
    // Adiciona alguns endpoints de teste
    app.get('/api/v1/entries', (req, res) => {
      res.json({ success: true, data: 'entries' });
    });
    
    app.get('/api/v1/treatments', (req, res) => {
      res.json({ success: true, data: 'treatments' });
    });
    
    // Configura um router para API v3 simulada
    const apiV3Router = express.Router();
    apiV3Router.get('/collection/:collection', (req, res) => {
      res.json({ success: true, collection: req.params.collection });
    });
    
    app.use('/api/v3', apiV3Router);
  });
  
  it('deve adicionar middleware de autenticação ao endpoint', function() {
    // Encontra o handler original
    const originalHandler = app._router.stack.find(layer => 
      layer.route && layer.route.path === '/api/v1/entries'
    ).route.stack[0].handle;
    
    // Aplica o patch
    patchEndpoint(app, 'get', '/api/v1/entries', originalHandler);
    
    // Verifica se o endpoint foi modificado
    const patchedRoute = app._router.stack.find(layer => 
      layer.route && layer.route.path === '/api/v1/entries'
    );
    
    // Deve ter mais middlewares agora (original + auth + filter)
    expect(patchedRoute.route.stack.length).to.be.greaterThan(1);
    
    // Verifica se o middleware de autenticação foi adicionado
    const hasAuthMiddleware = patchedRoute.route.stack.some(layer => 
      layer.name === 'verifyPatient' || 
      layer.handle.name === 'verifyPatient'
    );
    
    expect(hasAuthMiddleware).to.be.true;
  });
  
  it('deve manter a funcionalidade original do endpoint', function() {
    // Encontra o handler original
    const originalHandler = app._router.stack.find(layer => 
      layer.route && layer.route.path === '/api/v1/entries'
    ).route.stack[0].handle;
    
    // Aplica o patch
    patchEndpoint(app, 'get', '/api/v1/entries', originalHandler);
    
    // Cria uma requisição simulada
    const req = {
      patientId: '123',
      addPatientFilter: query => ({ ...query, patientId: '123' }),
      collection: {
        find: (query) => query
      }
    };
    
    // Cria uma resposta simulada
    const res = {
      json: data => {
        // Verifica se a resposta contém os dados originais
        expect(data.success).to.be.true;
        expect(data.data).to.equal('entries');
      }
    };
    
    // Executa o handler modificado
    const patchedRoute = app._router.stack.find(layer => 
      layer.route && layer.route.path === '/api/v1/entries'
    );
    
    // Executa o último middleware (handler modificado)
    const modifiedHandler = patchedRoute.route.stack[patchedRoute.route.stack.length - 1].handle;
    modifiedHandler(req, res);
  });
  
  it('deve adicionar filtro de patientId às consultas', function() {
    // Encontra o handler original
    const originalHandler = app._router.stack.find(layer => 
      layer.route && layer.route.path === '/api/v1/entries'
    ).route.stack[0].handle;
    
    // Aplica o patch
    patchEndpoint(app, 'get', '/api/v1/entries', originalHandler);
    
    // Cria uma requisição simulada com uma função find que podemos espionar
    let capturedQuery = null;
    const req = {
      patientId: '123',
      addPatientFilter: query => ({ ...query, patientId: '123' }),
      collection: {
        find: (query) => {
          capturedQuery = query;
          return query;
        }
      }
    };
    
    // Cria uma resposta simulada
    const res = {
      json: () => {}
    };
    
    // Executa o handler modificado
    const patchedRoute = app._router.stack.find(layer => 
      layer.route && layer.route.path === '/api/v1/entries'
    );
    
    // Executa o último middleware (handler modificado)
    const modifiedHandler = patchedRoute.route.stack[patchedRoute.route.stack.length - 1].handle;
    modifiedHandler(req, res);
    
    // Verifica se o filtro de patientId foi adicionado à consulta
    expect(capturedQuery).to.have.property('patientId');
    expect(capturedQuery.patientId).to.equal('123');
  });
});
