'use strict';

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Carrega as chaves RSA
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

// Função para gerar ID de paciente
function generatePatientId() {
  return new mongoose.Types.ObjectId();
}

// Função para gerar token JWT para paciente
function generatePatientToken(patientId) {
  // Gerar token JWT com chave privada
  const token = jwt.sign(
    { 
      patientId: patientId,
      type: 'patient'
    },
    privateKey,
    { 
      algorithm: 'RS256',
      expiresIn: '90d'
    }
  );

  return token;
}

// Função para verificar token JWT
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    return {
      valid: true,
      decoded
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message
    };
  }
}

module.exports = {
  generatePatientId,
  generatePatientToken,
  verifyToken
};
