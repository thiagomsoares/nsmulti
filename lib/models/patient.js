'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para pacientes
const patientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 60
  },
  phone: {
    type: String,
    required: true,
    trim: true
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
    type: Schema.Types.Mixed,
    default: {}
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Cria o modelo
mongoose.model('Patient', patientSchema);
