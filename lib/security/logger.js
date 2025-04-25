const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Configuração do diretório de logs
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Cria o logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'nightscout-multi' },
  transports: [
    // Escreve logs de erro e acima no arquivo error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Escreve logs de todos os níveis no arquivo combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    // Escreve logs de segurança em um arquivo separado
    new winston.transports.File({ 
      filename: path.join(logDir, 'security.log'),
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.json()
      )
    })
  ]
});

// Se não estamos em produção, também logamos no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Função para registrar eventos de segurança
function logSecurityEvent(eventType, data) {
  logger.info({
    type: 'security',
    eventType,
    ...data
  });
}

// Função para registrar eventos de autenticação
function logAuthEvent(eventType, userId, success, details = {}) {
  logSecurityEvent('auth', {
    eventType,
    userId,
    success,
    ...details
  });
}

// Função para registrar eventos de acesso a dados
function logDataAccessEvent(eventType, userId, patientId, collection, success, details = {}) {
  logSecurityEvent('data_access', {
    eventType,
    userId,
    patientId,
    collection,
    success,
    ...details
  });
}

// Função para registrar eventos de administração
function logAdminEvent(eventType, userId, action, success, details = {}) {
  logSecurityEvent('admin', {
    eventType,
    userId,
    action,
    success,
    ...details
  });
}

module.exports = {
  logger,
  logSecurityEvent,
  logAuthEvent,
  logDataAccessEvent,
  logAdminEvent
};
