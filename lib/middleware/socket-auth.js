const { verifyPatientToken } = require('../models/token');

/**
 * Middleware para injetar patientId em requisições WebSocket
 * 
 * Verifica o token fornecido na mensagem de autorização e
 * injeta o patientId no objeto de socket.
 */
function socketAuthMiddleware(io) {
  io.use((socket, next) => {
    // Verifica se há dados de autenticação
    const { token } = socket.handshake.auth;
    
    if (!token) {
      return next(new Error('Token de autenticação não fornecido'));
    }
    
    // Verifica o token
    const verification = verifyPatientToken(token);
    
    if (!verification.valid) {
      return next(new Error('Token de autenticação inválido'));
    }
    
    // Injeta o patientId no objeto de socket
    socket.patientId = verification.patientId;
    
    // Continua para o próximo middleware
    next();
  });
}

/**
 * Modifica o evento 'authorize' do WebSocket para suportar tokens de paciente
 * 
 * Esta função deve ser chamada após a configuração do WebSocket no servidor.
 */
function patchWebSocketAuthorize(io, ctx) {
  io.on('connection', (socket) => {
    // Sobrescreve o handler do evento 'authorize'
    socket.on('authorize', async function authorize(message, callback) {
      try {
        // Verifica se é uma autorização por token (novo método)
        if (message.token) {
          const verification = verifyPatientToken(message.token);
          
          if (!verification.valid) {
            return callback({ result: 'Not authorized' });
          }
          
          // Injeta o patientId no objeto de socket
          socket.patientId = verification.patientId;
          
          // Retorna sucesso
          return callback({ result: 'success' });
        }
        
        // Caso contrário, usa o método de autorização original (API_SECRET)
        // Isso mantém a compatibilidade com clientes existentes
        const apiSecret = ctx.settings.api_secret;
        
        if (message.secret === apiSecret) {
          // Não injeta patientId, pois é o método antigo
          return callback({ result: 'success' });
        }
        
        return callback({ result: 'Not authorized' });
      } catch (err) {
        console.error('Erro na autorização WebSocket:', err);
        return callback({ result: 'Error during authorization' });
      }
    });
  });
}

module.exports = {
  socketAuthMiddleware,
  patchWebSocketAuthorize
};
