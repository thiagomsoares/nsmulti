// Modificação do arquivo server.js para integrar o suporte multi-paciente

// Importa o patch de multi-paciente
const applyMultiPatientPatch = require('./lib/multi-patient-patch');
const setupMultiPatient = require('./lib/multi-patient');

// Função para inicializar o suporte multi-paciente
function initMultiPatient(app, env, ctx, io) {
  // Verifica se o modo multi-paciente está ativado
  if (env.MULTI_PATIENT_ENABLED !== 'true') {
    console.log('Modo multi-paciente não está ativado. Defina MULTI_PATIENT_ENABLED=true para ativar.');
    return;
  }
  
  console.log('Inicializando suporte multi-paciente...');
  
  try {
    // Configura os endpoints e middlewares de multi-paciente
    setupMultiPatient(app, io, ctx);
    
    // Aplica patch aos endpoints existentes
    applyMultiPatientPatch(app, env);
    
    console.log('Suporte multi-paciente inicializado com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar suporte multi-paciente:', err);
  }
}

// Exporta a função de inicialização
module.exports = initMultiPatient;
