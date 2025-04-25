'use strict';

const { verifyToken } = require('../models/token');

/**
 * Integração do sistema de autenticação multi-paciente com o sistema de autenticação do Nightscout
 */
function init(env, ctx) {
  console.log('Inicializando integração de autenticação multi-paciente...');
  
  // Verifica se env.enclave existe
  if (!env.enclave) {
    env.enclave = {};
  }
  
  // Verifica se a função verifyJWT já existe
  const originalVerifyJWT = env.enclave.verifyJWT || function(token) {
    throw new Error('Token inválido');
  };
  
  // Sobrescreve a função de verificação de JWT para também aceitar tokens do sistema multi-paciente
  env.enclave.verifyJWT = function(token) {
    try {
      // Tenta verificar o token usando o sistema original
      return originalVerifyJWT(token);
    } catch (err) {
      // Se falhar, tenta verificar usando o sistema multi-paciente
      const verification = verifyToken(token);
      
      if (verification.valid) {
        console.log('Token multi-paciente válido:', verification.decoded.patientId);
        
        // Retorna um objeto compatível com o sistema original
        return {
          accessToken: token,
          authorized: true,
          subject: verification.decoded.patientId,
          permissionGroups: ['api:*:read', 'api:*:write', 'api:profile:read', 'api:profile:create', 'api:profile:update']
        };
      }
      
      // Se ambos falharem, propaga o erro original
      throw err;
    }
  };
  
  // Adiciona uma função para verificar se um token é de admin
  env.enclave.isMultiPatientToken = function(token) {
    try {
      const verification = verifyToken(token);
      return verification.valid;
    } catch (err) {
      return false;
    }
  };
  
  // Sobrescreve a função de autorização para reconhecer tokens multi-paciente
  const originalResolve = ctx.authorization.resolve;
  ctx.authorization.resolve = function(data, callback) {
    // Tenta usar a função original primeiro
    try {
      // Se o token for um token multi-paciente válido, adiciona as permissões necessárias
      if (data.token) {
        const verification = verifyToken(data.token);
        if (verification.valid) {
          console.log('Resolvendo permissões para token multi-paciente:', verification.decoded.patientId);
          
          // Cria um objeto de permissões compatível com o sistema original
          const admin = require('shiro-trie').new();
          admin.add(['api:*:read', 'api:*:write', 'api:profile:read', 'api:profile:create', 'api:profile:update']);
          
          const result = { 
            shiros: [admin],
            subject: verification.decoded.patientId
          };
          
          if (callback) { callback(null, result); }
          return result;
        }
      }
      
      // Se não for um token multi-paciente, usa a função original
      return originalResolve(data, callback);
    } catch (err) {
      console.error('Erro ao resolver permissões:', err);
      // Se a função original falhar, tenta um fallback
      if (callback) { callback(err, { shiros: [] }); }
      return { shiros: [] };
    }
  };
  
  console.log('Integração de autenticação multi-paciente configurada com sucesso');
}

module.exports = init;
