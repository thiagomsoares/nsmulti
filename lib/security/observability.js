const { logger } = require('./logger');
const promClient = require('prom-client');

/**
 * Implementa métricas de observabilidade para o sistema multi-paciente
 */
class ObservabilityManager {
  constructor() {
    // Inicializa o registro de métricas Prometheus
    this.register = new promClient.Registry();
    
    // Adiciona métricas padrão do Node.js
    promClient.collectDefaultMetrics({ register: this.register });
    
    // Inicializa contadores e medidores
    this.initializeMetrics();
    
    logger.info('Sistema de observabilidade inicializado');
  }
  
  /**
   * Inicializa as métricas personalizadas
   */
  initializeMetrics() {
    // Contador de requisições HTTP
    this.httpRequestsTotal = new promClient.Counter({
      name: 'nightscout_http_requests_total',
      help: 'Total de requisições HTTP',
      labelNames: ['method', 'path', 'status'],
      registers: [this.register]
    });
    
    // Histograma de duração de requisições
    this.httpRequestDurationSeconds = new promClient.Histogram({
      name: 'nightscout_http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });
    
    // Contador de erros de autenticação
    this.authErrorsTotal = new promClient.Counter({
      name: 'nightscout_auth_errors_total',
      help: 'Total de erros de autenticação',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    // Contador de operações de pacientes
    this.patientOperationsTotal = new promClient.Counter({
      name: 'nightscout_patient_operations_total',
      help: 'Total de operações de pacientes',
      labelNames: ['operation', 'status'],
      registers: [this.register]
    });
    
    // Medidor de pacientes ativos
    this.activePatientsGauge = new promClient.Gauge({
      name: 'nightscout_active_patients',
      help: 'Número de pacientes ativos',
      registers: [this.register]
    });
    
    // Contador de acessos a dados
    this.dataAccessTotal = new promClient.Counter({
      name: 'nightscout_data_access_total',
      help: 'Total de acessos a dados',
      labelNames: ['collection', 'operation'],
      registers: [this.register]
    });
  }
  
  /**
   * Cria middleware para monitorar requisições HTTP
   */
  createRequestMiddleware() {
    return (req, res, next) => {
      // Marca o tempo de início
      const start = Date.now();
      
      // Intercepta o método end para capturar o status e calcular a duração
      const originalEnd = res.end;
      res.end = (...args) => {
        // Calcula a duração
        const duration = (Date.now() - start) / 1000;
        
        // Incrementa o contador de requisições
        this.httpRequestsTotal.inc({
          method: req.method,
          path: req.route ? req.route.path : req.path,
          status: res.statusCode
        });
        
        // Registra a duração
        this.httpRequestDurationSeconds.observe(
          {
            method: req.method,
            path: req.route ? req.route.path : req.path,
            status: res.statusCode
          },
          duration
        );
        
        // Chama o método original
        return originalEnd.apply(res, args);
      };
      
      next();
    };
  }
  
  /**
   * Registra erro de autenticação
   */
  recordAuthError(type) {
    this.authErrorsTotal.inc({ type });
  }
  
  /**
   * Registra operação de paciente
   */
  recordPatientOperation(operation, status) {
    this.patientOperationsTotal.inc({ operation, status });
  }
  
  /**
   * Atualiza o número de pacientes ativos
   */
  updateActivePatients(count) {
    this.activePatientsGauge.set(count);
  }
  
  /**
   * Registra acesso a dados
   */
  recordDataAccess(collection, operation) {
    this.dataAccessTotal.inc({ collection, operation });
  }
  
  /**
   * Cria endpoint para métricas Prometheus
   */
  createMetricsEndpoint(app) {
    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', this.register.contentType);
        res.end(await this.register.metrics());
      } catch (err) {
        logger.error('Erro ao gerar métricas:', err);
        res.status(500).end();
      }
    });
    
    logger.info('Endpoint de métricas configurado em /metrics');
  }
}

module.exports = ObservabilityManager;
