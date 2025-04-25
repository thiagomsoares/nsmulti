const mongoose = require('mongoose');
const Patient = require('./patient');

// Função para validar um paciente
function validatePatient(patient) {
  // Cria uma instância do modelo para validação
  const patientDoc = new Patient(patient);
  
  // Executa validação do Mongoose
  const validationError = patientDoc.validateSync();
  
  if (validationError) {
    // Formata as mensagens de erro para retorno
    const errors = {};
    
    if (validationError.errors) {
      Object.keys(validationError.errors).forEach(key => {
        errors[key] = validationError.errors[key].message;
      });
    }
    
    return {
      valid: false,
      errors
    };
  }
  
  return {
    valid: true
  };
}

// Função para formatar telefone no padrão E.164
function formatPhoneE164(phone) {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com +, adiciona
  if (!phone.startsWith('+')) {
    // Assume que é um número brasileiro se não tiver código do país
    if (cleaned.length <= 11) {
      cleaned = `55${cleaned}`;
    }
    cleaned = `+${cleaned}`;
  }
  
  return cleaned;
}

// Função para verificar se o telefone está no formato E.164
function isValidE164(phone) {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

module.exports = {
  validatePatient,
  formatPhoneE164,
  isValidE164
};
