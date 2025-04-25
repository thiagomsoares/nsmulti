const express = require('express');
const { registrationRouter, setupSwagger } = require('./middleware/registration');
const patientRoutes = require('./middleware/patient-routes');
const { socketAuthMiddleware, patchWebSocketAuthorize } = require('./middleware/socket-auth');
const swaggerUi = require('swagger-ui-express');

/**
 * Função para integrar o suporte multi-paciente ao aplicativo Nightscout
 * 
 * Esta função deve ser chamada no arquivo server.js para adicionar
 * os endpoints e middlewares necessários para o suporte multi-paciente.
 */
function setupMultiPatient(app, io, ctx) {
  // Adiciona os endpoints de registro e gerenciamento de pacientes
  app.use('/api/v1', registrationRouter);
  app.use('/api/v1', patientRoutes);
  
  // Configura a documentação Swagger
  setupSwagger(app);
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(null, {
    swaggerUrl: '/api/v1/swagger.json',
    swaggerOptions: {
      docExpansion: 'list'
    }
  }));
  
  // Configura a autenticação WebSocket
  socketAuthMiddleware(io);
  patchWebSocketAuthorize(io, ctx);
  
  console.log('Suporte multi-paciente configurado com sucesso');
  
  return app;
}

module.exports = setupMultiPatient;
