// Instruções para integrar o suporte multi-paciente ao Nightscout

/**
 * Para integrar o suporte multi-paciente ao Nightscout, adicione o seguinte código
 * ao arquivo server.js, logo após a inicialização do servidor e antes de iniciar
 * a escuta na porta.
 */

// Adicione esta linha no início do arquivo, junto com os outros imports
const initMultiPatient = require('./lib/server/multi-patient-init');

// Adicione este bloco após a inicialização do app Express e antes de app.listen()
// Geralmente após a linha que configura as rotas (app.use('/', routes))
initMultiPatient(app, env, ctx, io);

/**
 * Adicione as seguintes variáveis de ambiente ao arquivo .env:
 * 
 * MULTI_PATIENT_ENABLED=true
 * ADMIN_API_SECRET=seu-segredo-admin-aqui
 */
