'use strict';

const mongoose = require('mongoose');
const Patient = require('./patient');
const { generatePatientToken, generatePatientId } = require('./token');
const env = require('../server/env')();

// Função para criar um novo paciente
async function createPatient(patientData) {
  try {
    // Gera um novo ID para o paciente
    const patientId = generatePatientId();
    
    // Gera um token JWT para o paciente
    const token = generatePatientToken(patientId.toString());
    
    // Calcula a data de expiração (90 dias a partir de agora)
    const tokenExpires = new Date();
    tokenExpires.setDate(tokenExpires.getDate() + 90);
    
    // Cria o objeto do paciente
    const Patient = mongoose.model('Patient');
    const patient = new Patient({
      _id: patientId,
      name: patientData.name,
      phone: patientData.phone,
      token: token,
      tokenExpires: tokenExpires,
      settings: patientData.settings || {}
    });
    
    // Salva o paciente no banco de dados
    await patient.save();
    
    // Retorna o ID e o token
    return {
      id: patientId.toString(),
      token: token
    };
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    throw err;
  }
}

// Função para buscar um paciente por ID
async function getPatientById(patientId) {
  try {
    const Patient = mongoose.model('Patient');
    return await Patient.findById(patientId);
  } catch (err) {
    console.error('Erro ao buscar paciente por ID:', err);
    throw err;
  }
}

// Função para buscar um paciente por token
async function getPatientByToken(token) {
  try {
    const Patient = mongoose.model('Patient');
    return await Patient.findOne({ token });
  } catch (err) {
    console.error('Erro ao buscar paciente por token:', err);
    throw err;
  }
}

// Função para listar todos os pacientes
async function listPatients() {
  try {
    const Patient = mongoose.model('Patient');
    return await Patient.find({}, { token: 0 });
  } catch (err) {
    console.error('Erro ao listar pacientes:', err);
    throw err;
  }
}

module.exports = {
  createPatient,
  getPatientById,
  getPatientByToken,
  listPatients
};
