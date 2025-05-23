'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Verifica se as chaves RSA existem
function checkRSAKeys() {
  const privateKeyPath = path.join(__dirname, '../keys/private.key');
  const publicKeyPath = path.join(__dirname, '../keys/public.key');
  
  try {
    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
      console.error('Chaves RSA não encontradas. Crie as chaves em keys/private.key e keys/public.key');
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao verificar chaves RSA:', err);
    return false;
  }
}

// Função principal para inicializar o suporte multi-paciente
function init(app, env, ctx) {
  console.log('DEBUG: Iniciando módulo multi-paciente');
  if (!env) {
    console.error('ERRO: env não definido no init do multi-paciente!');
    return;
  }
  if (!env.settings) {
    console.warn('env.settings não existia, criando objeto vazio.');
    env.settings = {};
  }
  console.log('DEBUG: env.settings antes =', JSON.stringify(env.settings));
  
  // Configuração manual para habilitar o suporte multi-paciente
  env.settings.enable_multi_patient = true;
  console.log('DEBUG: env.settings depois =', JSON.stringify(env.settings));
  
  // Verificar se o token de administrador está definido
  if (!env.settings.admin_token) {
    // Usar o token padrão se não estiver definido no ambiente
    env.settings.admin_token = 'a7d8e9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6';
    console.log('Token de administrador padrão configurado. Recomendado alterar em produção.');
  }
  
  console.log('Suporte multi-paciente habilitado manualmente.');
  
  // Verifica se as chaves RSA existem
  if (!checkRSAKeys()) {
    console.error('Suporte multi-paciente requer chaves RSA. Configuração incompleta.');
    return;
  }
  
  // Inicializa os modelos
  require('./models/patient');
  
  // Integra o sistema de autenticação multi-paciente com o sistema original
  require('./authorization/multi-patient-auth')(env, ctx);
  
  // Configura o middleware de autenticação
  const auth = require('./middleware/auth')(env, ctx);
  
  // Configura as rotas de paciente
  const patientRoutes = require('./middleware/patient-routes')(app, env, ctx);
  
  // Configura o middleware de registro de pacientes
  const registration = require('./middleware/registration')(app, env, ctx);
  
  // Configura o middleware de filtro de paciente
  const patientFilter = require('./middleware/patient-filter')(app, env, ctx);
  
  // Aplica o middleware de filtro de paciente a todas as rotas relevantes
  app.use('/api/v1/entries', auth.checkToken, patientFilter.addPatientFilter);
  app.use('/api/v1/treatments', auth.checkToken, patientFilter.addPatientFilter);
  app.use('/api/v1/devicestatus', auth.checkToken, patientFilter.addPatientFilter);
  app.use('/api/v1/profile', auth.checkToken, patientFilter.addPatientFilter);
  app.use('/api/v1/food', auth.checkToken, patientFilter.addPatientFilter);
  
  // Inicializa o servidor
  require('./server/multi-patient-init')(app, env, ctx);
  
  console.log('Módulo multi-paciente integrado');
}

module.exports = init;
