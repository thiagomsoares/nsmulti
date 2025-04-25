'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { getPatientById, listPatients, createPatientDirect } = require('../models/patient-service');

function configure(app, env, ctx) {
  const router = express.Router();
  
  // Middleware para verificar token de administrador
  function checkAdminToken(req, res, next) {
    const authHeader = req.headers.authorization || req.headers['api-secret'] || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Usa o token definido no .env ou o padrão
    const adminToken = env.settings.admin_token || process.env.ADMIN_API_SECRET || 'a7d8e9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6';
    
    console.log('Token recebido:', token);
    console.log('Token esperado:', adminToken);
    
    if (token !== adminToken) {
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
  
  // Rota para criar um novo paciente
  router.post('/patients', checkAdminToken, async (req, res) => {
    try {
      // Verifica se os dados necessários foram enviados
      if (!req.body.name || !req.body.phone) {
        return res.status(400).json({ status: 'error', message: 'Nome e telefone são obrigatórios' });
      }
      
      // Tenta criar o paciente usando o driver MongoDB diretamente
      try {
        console.log('Criando paciente direto:', req.body);
        const result = await createPatientDirect(req.body);
        console.log('Paciente criado com sucesso:', result);
        res.json({ status: 'success', id: result.id, token: result.token });
      } catch (err) {
        console.error('Erro ao criar paciente:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error: ' + err.message });
      }
    } catch (err) {
      console.error('Erro ao criar paciente:', err);
      res.status(500).json({ status: 'error', message: 'Internal server error: ' + err.message });
    }
  });
  
  // Registra as rotas
  app.use('/api/v1', router);
  
  return router;
}

module.exports = configure;
