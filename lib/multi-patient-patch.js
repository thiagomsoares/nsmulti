const { patchAllEndpoints } = require('./middleware/endpoint-patcher');

/**
 * Função para aplicar patch de multi-paciente ao servidor Nightscout
 * 
 * Esta função deve ser chamada após a inicialização do servidor
 * para modificar todos os endpoints existentes para suportar
 * filtragem por patientId.
 * 
 * @param {Object} app - Aplicação Express
 * @param {Object} env - Objeto de ambiente
 */
function applyMultiPatientPatch(app, env) {
  console.log('Aplicando patch de multi-paciente ao servidor Nightscout...');
  
  // Verifica se o modo multi-paciente está ativado
  if (env.MULTI_PATIENT_ENABLED !== 'true') {
    console.log('Modo multi-paciente não está ativado. Defina MULTI_PATIENT_ENABLED=true para ativar.');
    return;
  }
  
  try {
    // Aplica patch a todos os endpoints existentes
    patchAllEndpoints(app);
    
    console.log('Patch de multi-paciente aplicado com sucesso!');
  } catch (err) {
    console.error('Erro ao aplicar patch de multi-paciente:', err);
  }
}

module.exports = applyMultiPatientPatch;
