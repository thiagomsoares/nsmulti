const { logger } = require('./logger');
const SecurityTester = require('./tester');
const ObservabilityManager = require('./observability');
const setupSecurityMiddleware = require('./middleware');

/**
 * Classe principal para gerenciamento de segurança e observabilidade
 */
class SecurityManager {
  constructor(app, env) {
    this.app = app;
    this.env = env;
    this.securityTester = new SecurityTester(env);
    this.observability = new ObservabilityManager();
    
    logger.info('Inicializando gerenciador de segurança e observabilidade');
  }
  
  /**
   * Inicializa todos os componentes de segurança e observabilidade
   */
  async initialize() {
    try {
      // Configura middlewares de segurança
      setupSecurityMiddleware(this.app, this.env);
      
      // Configura middleware de observabilidade
      this.app.use(this.observability.createRequestMiddleware());
      
      // Configura endpoint de métricas
      this.observability.createMetricsEndpoint(this.app);
      
      // Executa testes de segurança iniciais
      if (this.env.RUN_SECURITY_TESTS === 'true') {
        await this.runSecurityTests();
      }
      
      logger.info('Gerenciador de segurança e observabilidade inicializado com sucesso');
      return true;
    } catch (err) {
      logger.error('Erro ao inicializar gerenciador de segurança:', err);
      return false;
    }
  }
  
  /**
   * Executa testes de segurança
   */
  async runSecurityTests() {
    try {
      const results = await this.securityTester.runAllTests();
      
      // Verifica se todos os testes passaram
      const allPassed = Object.values(results).every(result => result.success);
      
      if (allPassed) {
        logger.info('Todos os testes de segurança passaram');
      } else {
        logger.warn('Alguns testes de segurança falharam', { results });
      }
      
      return results;
    } catch (err) {
      logger.error('Erro ao executar testes de segurança:', err);
      throw err;
    }
  }
  
  /**
   * Registra evento de autenticação
   */
  recordAuthEvent(eventType, userId, success, details = {}) {
    // Registra no log
    logger.info('Evento de autenticação', {
      eventType,
      userId,
      success,
      ...details
    });
    
    // Registra métrica
    if (!success) {
      this.observability.recordAuthError(eventType);
    }
  }
  
  /**
   * Registra operação de paciente
   */
  recordPatientOperation(operation, status, patientId) {
    // Registra no log
    logger.info('Operação de paciente', {
      operation,
      status,
      patientId
    });
    
    // Registra métrica
    this.observability.recordPatientOperation(operation, status);
  }
  
  /**
   * Atualiza contagem de pacientes ativos
   */
  async updatePatientStats(db) {
    try {
      // Conta pacientes ativos
      const activeCount = await db.collection('patients').countDocuments({ active: true });
      
      // Atualiza métrica
      this.observability.updateActivePatients(activeCount);
      
      logger.debug('Estatísticas de pacientes atualizadas', { activeCount });
    } catch (err) {
      logger.error('Erro ao atualizar estatísticas de pacientes:', err);
    }
  }
}

module.exports = SecurityManager;
