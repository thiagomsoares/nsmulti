'use strict';

const { verifyToken } = require('../models/token');
const { getPatientByToken } = require('../models/patient-service');

function configure(env, ctx) {
  // Middleware para verificar token JWT
  async function checkToken(req, res, next) {
    // Extrai o token do cabeçalho Authorization
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Se não houver token, continua sem autenticação
    if (!token) {
      return next();
    }
    
    // Verifica o token JWT
    const verification = verifyToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    // Extrai o ID do paciente do token
    const { patientId } = verification.decoded;
    
    // Busca o paciente no banco de dados
    try {
      const patient = await getPatientByToken(token);
      
      if (!patient) {
        return res.status(401).json({
          status: 'error',
          message: 'Patient not found'
        });
      }
      
      // Verifica se o token está expirado
      if (patient.tokenExpires < new Date()) {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired'
        });
      }
      
      // Adiciona o ID do paciente à requisição
      req.patientId = patientId;
      
      next();
    } catch (err) {
      console.error('Erro ao verificar token:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
  
  return {
    checkToken
  };
}

module.exports = configure;
