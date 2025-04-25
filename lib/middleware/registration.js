'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { createPatient } = require('../models/patient-service');

function configure(app, env, ctx) {
  const router = express.Router();
  
  // Middleware para verificar token de administrador
  function checkAdminToken(req, res, next) {
    const authHeader = req.headers.authorization || req.headers['api-secret'] || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (token !== env.settings.admin_token) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Invalid admin token'
      });
    }
    
    next();
  }
  
  // Middleware para validar dados do paciente
  function validatePatientData(req, res, next) {
    const { name, phone } = req.body;
    
    if (!name || typeof name !== 'string' || name.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid name: must be at least 3 characters'
      });
    }
    
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid phone number'
      });
    }
    
    next();
  }
  
  // Rota para criar um novo paciente
  router.post('/patients', checkAdminToken, bodyParser.json(), validatePatientData, async (req, res) => {
    try {
      const patientData = {
        name: req.body.name,
        phone: req.body.phone,
        settings: req.body.settings
      };
      
      const patient = await createPatient(patientData);
      
      res.status(201).json({
        status: 'success',
        patient
      });
    } catch (err) {
      console.error('Erro ao criar paciente:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  });
  
  // Registra as rotas
  app.use('/api/v1', router);
  
  return router;
}

module.exports = configure;
