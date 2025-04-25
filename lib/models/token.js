const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Carrega as chaves RSA para assinatura JWT
const privateKeyPath = path.join(__dirname, '../../keys/private.key');
const publicKeyPath = path.join(__dirname, '../../keys/public.key');

let privateKey, publicKey;

try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  publicKey = fs.readFileSync(publicKeyPath, 'utf8');
} catch (err) {
  console.error('Erro ao carregar chaves RSA:', err);
  process.exit(1);
}

// Função para gerar token JWT para um paciente
function generatePatientToken(patientId) {
  // Payload do token
  const payload = {
    patientId,
    type: 'patient',
    iat: Math.floor(Date.now() / 1000)
  };

  // Opções do token
  const options = {
    algorithm: 'RS256',
    expiresIn: '90d' // 90 dias
  };

  // Gera o token JWT
  return jwt.sign(payload, privateKey, options);
}

// Função para verificar token JWT
function verifyPatientToken(token) {
  try {
    // Verifica o token usando a chave pública
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    // Verifica se é um token de paciente
    if (decoded.type !== 'patient') {
      return { valid: false, error: 'Token type invalid' };
    }
    
    return { 
      valid: true, 
      patientId: decoded.patientId 
    };
  } catch (err) {
    return { 
      valid: false, 
      error: err.message 
    };
  }
}

// Função para gerar um ID aleatório para novos pacientes
function generatePatientId() {
  return new mongoose.Types.ObjectId();
}

module.exports = {
  generatePatientToken,
  verifyPatientToken,
  generatePatientId
};
