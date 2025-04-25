'use strict';

function configure(app, env, ctx) {
  // Middleware para adicionar filtro de paciente às consultas
  function addPatientFilter(req, res, next) {
    // Se não houver ID de paciente na requisição, continua sem filtro
    if (!req.patientId) {
      return next();
    }
    
    // Guarda a função original de find
    const originalFind = req.query.find;
    
    // Sobrescreve a função find para adicionar o filtro de paciente
    req.query.find = function(query) {
      // Adiciona o filtro de paciente à consulta
      query = query || {};
      query.patientId = req.patientId;
      
      // Chama a função original de find com a consulta modificada
      if (originalFind) {
        return originalFind(query);
      }
      
      return query;
    };
    
    next();
  }
  
  return {
    addPatientFilter
  };
}

module.exports = configure;
