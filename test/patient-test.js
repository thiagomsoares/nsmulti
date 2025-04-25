const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const Patient = require('../lib/models/patient');
const { validatePatient, formatPhoneE164, isValidE164 } = require('../lib/models/validation');
const { generatePatientToken, verifyPatientToken } = require('../lib/models/token');
const { createPatient } = require('../lib/models/patient-service');

describe('Patient Schema', function() {
  // Limpa a coleção de pacientes antes de cada teste
  beforeEach(async function() {
    await Patient.deleteMany({});
  });

  it('deve validar um paciente com dados corretos', function() {
    const patient = new Patient({
      name: 'João Silva',
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const validationResult = patient.validateSync();
    expect(validationResult).to.be.undefined;
  });

  it('deve rejeitar um paciente sem nome', function() {
    const patient = new Patient({
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const validationResult = patient.validateSync();
    expect(validationResult.errors.name).to.exist;
  });

  it('deve rejeitar um paciente com nome muito curto', function() {
    const patient = new Patient({
      name: 'Jo',
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const validationResult = patient.validateSync();
    expect(validationResult.errors.name).to.exist;
  });

  it('deve rejeitar um paciente com nome muito longo', function() {
    const patient = new Patient({
      name: 'a'.repeat(61),
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const validationResult = patient.validateSync();
    expect(validationResult.errors.name).to.exist;
  });

  it('deve rejeitar um paciente sem telefone', function() {
    const patient = new Patient({
      name: 'João Silva',
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const validationResult = patient.validateSync();
    expect(validationResult.errors.phone).to.exist;
  });

  it('deve rejeitar um telefone em formato inválido', function() {
    const patient = new Patient({
      name: 'João Silva',
      phone: '11999990000', // Sem o prefixo +
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const validationResult = patient.validateSync();
    expect(validationResult.errors.phone).to.exist;
  });

  it('deve verificar corretamente se o token está expirado', function() {
    // Token expirado (data no passado)
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    
    const patientExpired = new Patient({
      name: 'João Silva',
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: expiredDate
    });
    
    expect(patientExpired.isTokenExpired()).to.be.true;
    
    // Token válido (data no futuro)
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 1);
    
    const patientValid = new Patient({
      name: 'João Silva',
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: validDate
    });
    
    expect(patientValid.isTokenExpired()).to.be.false;
  });
});

describe('Validation Functions', function() {
  it('deve validar um paciente com dados corretos', function() {
    const patientData = {
      name: 'João Silva',
      phone: '+5511999990000',
      token: 'token-teste',
      tokenExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };
    
    const result = validatePatient(patientData);
    expect(result.valid).to.be.true;
  });
  
  it('deve formatar corretamente um telefone para E.164', function() {
    expect(formatPhoneE164('11999990000')).to.equal('+5511999990000');
    expect(formatPhoneE164('(11) 99999-0000')).to.equal('+5511999990000');
    expect(formatPhoneE164('+1 555 123 4567')).to.equal('+15551234567');
  });
  
  it('deve validar corretamente formatos E.164', function() {
    expect(isValidE164('+5511999990000')).to.be.true;
    expect(isValidE164('+15551234567')).to.be.true;
    expect(isValidE164('5511999990000')).to.be.false;
    expect(isValidE164('(11) 99999-0000')).to.be.false;
  });
});

describe('Token Functions', function() {
  it('deve gerar e verificar um token JWT', function() {
    const patientId = new mongoose.Types.ObjectId().toString();
    const token = generatePatientToken(patientId);
    
    expect(token).to.be.a('string');
    
    const verification = verifyPatientToken(token);
    expect(verification.valid).to.be.true;
    expect(verification.patientId).to.equal(patientId);
  });
  
  it('deve rejeitar um token inválido', function() {
    const verification = verifyPatientToken('invalid-token');
    expect(verification.valid).to.be.false;
  });
});

describe('Patient Service', function() {
  // Limpa a coleção de pacientes antes de cada teste
  beforeEach(async function() {
    await Patient.deleteMany({});
  });
  
  it('deve criar um novo paciente', async function() {
    const patientData = {
      name: 'João Silva',
      phone: '+5511999990000'
    };
    
    const result = await createPatient(patientData);
    
    expect(result.id).to.be.a('string');
    expect(result.token).to.be.a('string');
    
    // Verifica se o paciente foi salvo no banco
    const savedPatient = await Patient.findById(result.id);
    expect(savedPatient).to.exist;
    expect(savedPatient.name).to.equal(patientData.name);
    expect(savedPatient.phone).to.equal(patientData.phone);
  });
});
