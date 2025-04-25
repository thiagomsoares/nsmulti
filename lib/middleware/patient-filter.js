const express = require('express');
const { verifyPatient } = require('./auth');

/**
 * Middleware para injetar filtro de patientId em todas as consultas
 * 
 * Este middleware deve ser aplicado a todas as rotas que acessam
 * dados específicos de pacientes para garantir o isolamento de dados.
 */
function patientFilter(req, res, next) {
  // Verifica se o patientId foi injetado pelo middleware verifyPatient
  if (!req.patientId) {
    return res.status(401).json({
      status: 'error',
      message: 'Autenticação de paciente necessária'
    });
  }
  
  // Injeta uma função auxiliar para filtrar consultas
  req.addPatientFilter = function(query) {
    // Cria uma cópia do objeto de consulta para não modificar o original
    const filteredQuery = { ...query };
    
    // Adiciona o filtro de patientId
    filteredQuery.patientId = req.patientId;
    
    return filteredQuery;
  };
  
  // Continua para o próximo middleware
  next();
}

/**
 * Middleware para adicionar patientId a novos documentos
 * 
 * Este middleware deve ser aplicado a todas as rotas que criam
 * novos documentos para garantir que o patientId seja adicionado.
 */
function addPatientId(req, res, next) {
  // Verifica se o patientId foi injetado pelo middleware verifyPatient
  if (!req.patientId) {
    return res.status(401).json({
      status: 'error',
      message: 'Autenticação de paciente necessária'
    });
  }
  
  // Injeta uma função auxiliar para adicionar patientId a documentos
  req.addPatientIdToDoc = function(doc) {
    // Cria uma cópia do documento para não modificar o original
    const docWithPatientId = { ...doc };
    
    // Adiciona o patientId
    docWithPatientId.patientId = req.patientId;
    
    return docWithPatientId;
  };
  
  // Continua para o próximo middleware
  next();
}

/**
 * Função para aplicar middleware de autenticação e filtro a uma rota
 * 
 * Esta função facilita a aplicação dos middlewares necessários para
 * garantir a autenticação e o isolamento de dados entre pacientes.
 */
function applyPatientAuth(router, method, path, ...handlers) {
  // Verifica o método HTTP
  if (!router[method]) {
    throw new Error(`Método HTTP inválido: ${method}`);
  }
  
  // Aplica os middlewares de autenticação e filtro
  router[method](path, verifyPatient, patientFilter, addPatientId, ...handlers);
}

module.exports = {
  patientFilter,
  addPatientId,
  applyPatientAuth
};
