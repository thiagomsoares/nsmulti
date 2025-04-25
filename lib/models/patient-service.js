const mongoose = require('mongoose');
const Patient = require('./patient');
const { generatePatientToken, generatePatientId } = require('./token');

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
    throw err;
  }
}

// Função para buscar um paciente por ID
async function getPatientById(patientId) {
  try {
    return await Patient.findById(patientId);
  } catch (err) {
    throw err;
  }
}

// Função para atualizar um paciente
async function updatePatient(patientId, updateData) {
  try {
    // Filtra apenas os campos permitidos para atualização
    const allowedUpdates = {};
    
    if (updateData.name) allowedUpdates.name = updateData.name;
    if (updateData.phone) allowedUpdates.phone = updateData.phone;
    if (updateData.settings) allowedUpdates.settings = updateData.settings;
    if (updateData.active !== undefined) allowedUpdates.active = updateData.active;
    
    // Atualiza o paciente
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );
    
    return patient;
  } catch (err) {
    throw err;
  }
}

// Função para renovar o token de um paciente
async function renewPatientToken(patientId) {
  try {
    // Busca o paciente
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      throw new Error('Paciente não encontrado');
    }
    
    // Gera um novo token
    const newToken = generatePatientToken(patientId.toString());
    
    // Atualiza o token e a data de expiração
    patient.renewToken(newToken);
    
    // Salva as alterações
    await patient.save();
    
    return {
      token: newToken,
      expires: patient.tokenExpires
    };
  } catch (err) {
    throw err;
  }
}

// Função para desativar um paciente
async function deactivatePatient(patientId) {
  try {
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      throw new Error('Paciente não encontrado');
    }
    
    patient.deactivate();
    await patient.save();
    
    return { success: true };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createPatient,
  getPatientById,
  updatePatient,
  renewPatientToken,
  deactivatePatient
};
