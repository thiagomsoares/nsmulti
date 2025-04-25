const mongoose = require('mongoose');
const validator = require('validator');

// Define o schema da coleção patients
const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do paciente é obrigatório'],
    trim: true,
    minlength: [3, 'Nome deve ter pelo menos 3 caracteres'],
    maxlength: [60, 'Nome não pode exceder 60 caracteres']
  },
  phone: {
    type: String,
    required: [true, 'Telefone do paciente é obrigatório'],
    trim: true,
    validate: {
      validator: function(v) {
        // Validação de formato E.164 (+5511999990000)
        return /^\+[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} não é um número de telefone válido no formato E.164 (ex: +5511999990000)`
    }
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tokenExpires: {
    type: Date,
    required: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Adiciona índices para otimização de consultas
patientSchema.index({ phone: 1 });
patientSchema.index({ name: 1 });
patientSchema.index({ token: 1 }, { unique: true });

// Método para verificar se o token está expirado
patientSchema.methods.isTokenExpired = function() {
  return this.tokenExpires < new Date();
};

// Método para gerar nova data de expiração (90 dias a partir de agora)
patientSchema.methods.generateExpirationDate = function() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 90);
  return expirationDate;
};

// Método para renovar token
patientSchema.methods.renewToken = function(newToken) {
  this.token = newToken;
  this.tokenExpires = this.generateExpirationDate();
};

// Método para desativar paciente
patientSchema.methods.deactivate = function() {
  this.active = false;
};

// Método para reativar paciente
patientSchema.methods.activate = function() {
  this.active = true;
};

// Método estático para buscar paciente por token
patientSchema.statics.findByToken = function(token) {
  return this.findOne({ token, active: true });
};

// Método estático para buscar paciente por telefone
patientSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone, active: true });
};

// Cria o modelo a partir do schema
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
