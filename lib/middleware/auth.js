'use strict';

const { verifyToken } = require('../models/token');
const { getPatientByToken } = require('../models/patient-service');

function configure(env, ctx) {
  // Middleware para verificar token JWT
  async function checkToken(req, res, next) {
    console.log('Verificando token de autenticação...');
    
    // Extrai o token do cabeçalho Authorization
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Se não houver token, continua sem autenticação
    if (!token) {
      console.log('Nenhum token fornecido');
      return next();
    }
    
    console.log('Token recebido:', token.substring(0, 20) + '...');
    
    // Verifica o token JWT
    const verification = verifyToken(token);
    
    if (!verification.valid) {
      console.log('Token inválido');
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }
    
    // Extrai o ID do paciente do token
    const { patientId } = verification.decoded;
    console.log('ID do paciente:', patientId);
    
    // Busca o paciente no banco de dados
    try {
      const patient = await getPatientByToken(token);
      
      if (!patient) {
        console.log('Paciente não encontrado');
        return res.status(401).json({
          status: 'error',
          message: 'Paciente não encontrado'
        });
      }
      
      // Verifica se o token está expirado
      if (patient.tokenExpires < new Date()) {
        console.log('Token expirado');
        return res.status(401).json({
          status: 'error',
          message: 'Token expirado'
        });
      }
      
      console.log('Autenticação bem-sucedida para o paciente:', patient.name);
      
      // Adiciona o ID do paciente à requisição
      req.patientId = patientId;
      
      // Adiciona o objeto do paciente à requisição
      req.patient = patient;
      
      // Configura o sistema de autorização do Nightscout
      if (ctx && ctx.authorization) {
        // Cria um objeto de autorização compatível com o Nightscout
        req.auth_token = token;
        
        // Define o usuário como autorizado
        req.authorized = {
          token: token,
          subject: patientId,
          permissionGroups: ['api:*:read', 'api:*:write']
        };
      }
      
      next();
    } catch (err) {
      console.error('Erro ao verificar token:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
  
  return {
    checkToken
  };
}

module.exports = configure;
