'use strict';

const mongoose = require('mongoose');
const Patient = require('./patient');
const { generatePatientToken, generatePatientId } = require('./token');
const env = require('../server/env')();

// Aumenta o timeout padrão do Mongoose para 30 segundos
mongoose.set('bufferTimeoutMS', 30000);

// Função para criar um novo paciente
async function createPatient(patientData) {
  try {
    // Verifica se o MongoDB está conectado
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB não está conectado. Estado atual:', mongoose.connection.readyState);
      throw new Error('Banco de dados não está conectado. Tente novamente em alguns instantes.');
    }

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
    
    console.log('Tentando salvar paciente:', patientData.name);
    
    // Salva o paciente no banco de dados com timeout explícito
    const savedPatient = await patient.save();
    console.log('Paciente salvo com sucesso:', savedPatient._id);
    
    // Retorna o ID e o token
    return {
      id: patientId.toString(),
      token: token
    };
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    
    // Tratamento específico para erros de timeout
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      throw new Error('Timeout ao salvar paciente. Verifique a conexão com o MongoDB e tente novamente.');
    }
    
    throw err;
  }
}

// Função para criar paciente usando MongoDB diretamente
async function createPatientDirect(patientData) {
  try {
    // Gera um novo ID para o paciente
    const patientId = generatePatientId();
    
    // Gera um token JWT para o paciente
    const token = generatePatientToken(patientId.toString());
    
    // Calcula a data de expiração (90 dias a partir de agora)
    const tokenExpires = new Date();
    tokenExpires.setDate(tokenExpires.getDate() + 90);
    
    // Cria o objeto do paciente
    const patient = {
      _id: patientId,
      name: patientData.name,
      phone: patientData.phone,
      token: token,
      tokenExpires: tokenExpires,
      settings: patientData.settings || {}
    };
    
    console.log('Tentando salvar paciente direto:', patientData.name);
    
    // Usa o driver MongoDB nativo
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    console.log('URI de conexão:', uri);
    
    const client = new MongoClient(uri, { 
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');
    
    const db = client.db();
    console.log('Usando banco:', db.databaseName);
    
    // Insere o paciente diretamente
    const result = await db.collection('patients').insertOne(patient);
    console.log('Paciente salvo com sucesso:', result.insertedId);
    
    await client.close();
    console.log('Conexão fechada');
    
    // Retorna o ID e o token
    return {
      id: patientId.toString(),
      token: token
    };
  } catch (err) {
    console.error('Erro ao criar paciente diretamente:', err);
    throw err;
  }
}

// Função para buscar um paciente por ID usando MongoDB diretamente
async function getPatientById(patientId) {
  try {
    console.log('Buscando paciente por ID direto:', patientId);
    
    // Usa o driver MongoDB nativo
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    console.log('URI de conexão:', uri);
    
    const client = new MongoClient(uri, { 
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');
    
    const db = client.db();
    console.log('Usando banco:', db.databaseName);
    
    // Converte o ID para ObjectId se necessário
    let objectId;
    try {
      objectId = new ObjectId(patientId);
    } catch (err) {
      console.error('ID inválido:', patientId);
      return null;
    }
    
    // Busca o paciente diretamente
    const patient = await db.collection('patients').findOne({ _id: objectId });
    console.log('Paciente encontrado:', patient ? patient._id : 'não encontrado');
    
    await client.close();
    console.log('Conexão fechada');
    
    return patient;
  } catch (err) {
    console.error('Erro ao buscar paciente por ID direto:', err);
    throw err;
  }
}

// Função para buscar um paciente por token usando MongoDB diretamente
async function getPatientByToken(token) {
  try {
    console.log('Buscando paciente por token direto:', token.substring(0, 20) + '...');
    
    // Usa o driver MongoDB nativo
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    const client = new MongoClient(uri, { 
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');
    
    const db = client.db();
    
    // Busca o paciente pelo token
    const patient = await db.collection('patients').findOne({ token });
    console.log('Paciente encontrado:', patient ? patient._id : 'não encontrado');
    
    await client.close();
    console.log('Conexão fechada');
    
    return patient;
  } catch (err) {
    console.error('Erro ao buscar paciente por token direto:', err);
    throw err;
  }
}

// Função para listar todos os pacientes usando MongoDB diretamente
async function listPatients() {
  try {
    console.log('Listando pacientes direto');
    
    // Usa o driver MongoDB nativo
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    console.log('URI de conexão:', uri);
    
    const client = new MongoClient(uri, { 
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');
    
    const db = client.db();
    console.log('Usando banco:', db.databaseName);
    
    // Busca todos os pacientes, excluindo o campo token
    const patients = await db.collection('patients').find({}, { projection: { token: 0 } }).toArray();
    console.log('Pacientes encontrados:', patients.length);
    
    await client.close();
    console.log('Conexão fechada');
    
    return patients;
  } catch (err) {
    console.error('Erro ao listar pacientes direto:', err);
    throw err;
  }
}

module.exports = {
  createPatient,
  createPatientDirect,
  getPatientById,
  getPatientByToken,
  listPatients
};
