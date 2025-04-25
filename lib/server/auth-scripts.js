// Modificações no arquivo server.js para servir os scripts de autenticação

// Este arquivo deve ser adicionado ao diretório lib/server
// para servir os scripts de autenticação do cliente

const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Função para configurar as rotas para servir os scripts de autenticação
 * 
 * @param {Object} app - Aplicação Express
 * @param {Object} env - Objeto de ambiente
 */
function setupAuthScripts(app, env) {
  // Verifica se o modo multi-paciente está ativado
  if (env.MULTI_PATIENT_ENABLED !== 'true') {
    console.log('Modo multi-paciente não está ativado. Scripts de autenticação não serão servidos.');
    return;
  }
  
  console.log('Configurando rotas para scripts de autenticação...');
  
  // Caminho para os scripts de autenticação
  const clientDir = path.join(__dirname, '../client');
  
  // Verifica se os arquivos existem
  const tokenAuthPath = path.join(clientDir, 'token-auth.js');
  const loginUIPath = path.join(clientDir, 'patient-login-ui.js');
  
  if (!fs.existsSync(tokenAuthPath) || !fs.existsSync(loginUIPath)) {
    console.error('Erro: Scripts de autenticação não encontrados em', clientDir);
    return;
  }
  
  // Configura as rotas para servir os scripts
  app.get('/token-auth.js', (req, res) => {
    res.sendFile(tokenAuthPath);
  });
  
  app.get('/patient-login-ui.js', (req, res) => {
    res.sendFile(loginUIPath);
  });
  
  console.log('Rotas para scripts de autenticação configuradas com sucesso');
  
  // Adiciona middleware para injetar dados na página HTML
  app.use((req, res, next) => {
    // Armazena a função original send
    const originalSend = res.send;
    
    // Sobrescreve a função send
    res.send = function(body) {
      // Verifica se é uma resposta HTML
      if (typeof body === 'string' && body.includes('<html')) {
        // Adiciona atributos data ao body
        body = body.replace('<body', '<body data-multi-patient-enabled="true"');
        
        // Adiciona o script de integração antes do </body>
        const scriptPath = path.join(clientDir, 'auth-integration.js');
        if (fs.existsSync(scriptPath)) {
          const scriptContent = fs.readFileSync(scriptPath, 'utf8');
          body = body.replace('</body>', `<script>${scriptContent}</script></body>`);
        }
      }
      
      // Chama a função original
      return originalSend.call(this, body);
    };
    
    next();
  });
}

module.exports = setupAuthScripts;
