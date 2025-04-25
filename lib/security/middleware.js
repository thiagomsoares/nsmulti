const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger, logSecurityEvent } = require('./logger');

/**
 * Configura middlewares de segurança para a aplicação Express
 * 
 * @param {Object} app - Aplicação Express
 * @param {Object} env - Objeto de ambiente
 */
function setupSecurityMiddleware(app, env) {
  logger.info('Configurando middlewares de segurança...');
  
  // Adiciona cabeçalhos de segurança com Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      }
    },
    // Habilita HSTS com preload
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    // Previne clickjacking
    frameguard: {
      action: 'deny'
    },
    // Previne MIME sniffing
    noSniff: true,
    // Previne XSS
    xssFilter: true
  }));
  
  // Configura limitador de taxa para endpoints públicos
  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por janela
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logSecurityEvent('rate_limit_exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(options.statusCode).json({
        status: 'error',
        message: options.message
      });
    }
  });
  
  // Configura limitador de taxa para endpoints de administração
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 30, // limite mais restritivo para endpoints admin
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logSecurityEvent('admin_rate_limit_exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(options.statusCode).json({
        status: 'error',
        message: options.message
      });
    }
  });
  
  // Aplica limitador de taxa a endpoints públicos
  app.use('/api/v1/', publicLimiter);
  app.use('/api/v2/', publicLimiter);
  app.use('/api/v3/', publicLimiter);
  
  // Aplica limitador de taxa a endpoints de administração
  app.use('/api/v1/patients', adminLimiter);
  
  // Middleware para registrar tentativas de acesso a rotas inexistentes
  app.use((req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Captura respostas 404
      if (res.statusCode === 404) {
        logSecurityEvent('route_not_found', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent']
        });
      }
      
      // Captura respostas 401 e 403
      if (res.statusCode === 401 || res.statusCode === 403) {
        logSecurityEvent('unauthorized_access', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
          statusCode: res.statusCode
        });
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  });
  
  logger.info('Middlewares de segurança configurados com sucesso');
}

module.exports = setupSecurityMiddleware;
