'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { getPatientById, listPatients } = require('../models/patient-service');

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
  
  // Rota para listar todos os pacientes (apenas para admin)
  router.get('/patients', checkAdminToken, async (req, res) => {
    try {
      const patients = await listPatients();
      
      res.json({
        status: 'success',
        patients
      });
    } catch (err) {
      console.error('Erro ao listar pacientes:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  });
  
  // Rota para obter um paciente específico (apenas para admin)
  router.get('/patients/:id', checkAdminToken, async (req, res) => {
    try {
      const patient = await getPatientById(req.params.id);
      
      if (!patient) {
        return res.status(404).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      res.json({
        status: 'success',
        patient: {
          id: patient._id,
          name: patient.name,
          phone: patient.phone,
          createdAt: patient.createdAt,
          active: patient.active
        }
      });
    } catch (err) {
      console.error('Erro ao buscar paciente:', err);
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
