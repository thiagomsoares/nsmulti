const { verifyPatientToken } = require('../models/token');
const Patient = require('../models/patient');

/**
 * Middleware para verificar token de paciente
 * 
 * Extrai o token do header Authorization, verifica sua validade,
 * e injeta o patientId no objeto de requisição.
 */
function verifyPatient(req, res, next) {
  // Extrai o token do header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token de autenticação não fornecido ou formato inválido'
    });
  }
  
  // Remove o prefixo 'Bearer ' para obter apenas o token
  const token = authHeader.substring(7);
  
  // Verifica o token
  const verification = verifyPatientToken(token);
  
  if (!verification.valid) {
    return res.status(401).json({
      status: 'error',
      message: 'Token de autenticação inválido',
      details: verification.error
    });
  }
  
  // Verifica se o paciente existe e está ativo
  Patient.findByToken(token)
    .then(patient => {
      if (!patient) {
        return res.status(401).json({
          status: 'error',
          message: 'Paciente não encontrado ou inativo'
        });
      }
      
      // Verifica se o token está expirado
      if (patient.isTokenExpired()) {
        return res.status(401).json({
          status: 'error',
          message: 'Token expirado'
        });
      }
      
      // Injeta o patientId no objeto de requisição
      req.patientId = verification.patientId;
      
      // Continua para o próximo middleware
      next();
    })
    .catch(err => {
      console.error('Erro ao verificar paciente:', err);
      res.status(500).json({
        status: 'error',
        message: 'Erro interno ao verificar autenticação'
      });
    });
}

/**
 * Middleware para verificar API_SECRET do administrador
 * 
 * Verifica se o header API-Secret corresponde ao ADMIN_API_SECRET
 * definido nas variáveis de ambiente.
 */
function verifyAdmin(req, res, next) {
  const apiSecret = req.headers['api-secret'];
  const adminApiSecret = process.env.ADMIN_API_SECRET;
  
  if (!apiSecret || apiSecret !== adminApiSecret) {
    return res.status(401).json({
      status: 'error',
      message: 'Acesso não autorizado'
    });
  }
  
  // Continua para o próximo middleware
  next();
}

/**
 * Middleware para aplicar rate limiting
 * 
 * Limita o número de requisições por IP:
 * - 100 req/min para endpoints normais
 * - 10 req/min para endpoints admin
 */
function rateLimiter(isAdmin = false) {
  const limits = {};
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = isAdmin ? 10 : 100; // 10 req/min para admin, 100 req/min para normal
  
  return function(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Inicializa contador para este IP se não existir
    if (!limits[ip]) {
      limits[ip] = {
        count: 0,
        resetTime: Date.now() + windowMs
      };
    }
    
    // Reseta contador se o tempo expirou
    if (Date.now() > limits[ip].resetTime) {
      limits[ip].count = 0;
      limits[ip].resetTime = Date.now() + windowMs;
    }
    
    // Incrementa contador
    limits[ip].count++;
    
    // Verifica se excedeu o limite
    if (limits[ip].count > maxRequests) {
      return res.status(429).json({
        status: 'error',
        message: 'Muitas requisições, tente novamente mais tarde'
      });
    }
    
    // Adiciona headers de rate limit
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - limits[ip].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(limits[ip].resetTime / 1000));
    
    // Continua para o próximo middleware
    next();
  };
}

module.exports = {
  verifyPatient,
  verifyAdmin,
  rateLimiter
};
