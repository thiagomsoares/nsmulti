const request = require('supertest');
const express = require('express');
const { expect } = require('chai');
const { registrationRouter } = require('../lib/middleware/registration');

// Mock do modelo Patient e serviço de pacientes
jest.mock('../lib/models/patient', () => ({
  findByPhone: jest.fn()
}));

jest.mock('../lib/models/patient-service', () => ({
  createPatient: jest.fn()
}));

// Importa os mocks após a configuração
const Patient = require('../lib/models/patient');
const { createPatient } = require('../lib/models/patient-service');

describe('Patient Registration Endpoint', function() {
  let app;
  
  beforeEach(() => {
    // Configura o app Express para testes
    app = express();
    app.use(express.json());
    app.use('/api/v1', registrationRouter);
    
    // Configura o ambiente para testes
    process.env.ADMIN_API_SECRET = 'test-admin-secret';
    
    // Reseta os mocks
    jest.clearAllMocks();
  });
  
  it('deve retornar 401 sem API-Secret', async function() {
    const response = await request(app)
      .post('/api/v1/patients')
      .send({
        name: 'Test Patient',
        phone: '+5511999990000'
      });
    
    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('error');
  });
  
  it('deve retornar 401 com API-Secret inválido', async function() {
    const response = await request(app)
      .post('/api/v1/patients')
      .set('api-secret', 'invalid-secret')
      .send({
        name: 'Test Patient',
        phone: '+5511999990000'
      });
    
    expect(response.status).to.equal(401);
    expect(response.body.status).to.equal('error');
  });
  
  it('deve retornar 400 sem nome ou telefone', async function() {
    const response = await request(app)
      .post('/api/v1/patients')
      .set('api-secret', 'test-admin-secret')
      .send({
        name: 'Test Patient'
        // Sem telefone
      });
    
    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('error');
  });
  
  it('deve retornar 400 com telefone em formato inválido', async function() {
    const response = await request(app)
      .post('/api/v1/patients')
      .set('api-secret', 'test-admin-secret')
      .send({
        name: 'Test Patient',
        phone: '11999990000' // Sem o prefixo +
      });
    
    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('error');
  });
  
  it('deve retornar 409 se o paciente já existir', async function() {
    // Configura o mock para simular um paciente existente
    Patient.findByPhone.mockResolvedValue({ 
      _id: '123', 
      name: 'Existing Patient' 
    });
    
    const response = await request(app)
      .post('/api/v1/patients')
      .set('api-secret', 'test-admin-secret')
      .send({
        name: 'Test Patient',
        phone: '+5511999990000'
      });
    
    expect(response.status).to.equal(409);
    expect(response.body.status).to.equal('error');
  });
  
  it('deve criar um paciente com sucesso', async function() {
    // Configura o mock para simular que não existe paciente
    Patient.findByPhone.mockResolvedValue(null);
    
    // Configura o mock para simular a criação bem-sucedida
    createPatient.mockResolvedValue({
      id: '123',
      token: 'test-token'
    });
    
    const response = await request(app)
      .post('/api/v1/patients')
      .set('api-secret', 'test-admin-secret')
      .send({
        name: 'Test Patient',
        phone: '+5511999990000'
      });
    
    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal('success');
    expect(response.body.data).to.have.property('id');
    expect(response.body.data).to.have.property('token');
  });
  
  it('deve formatar o telefone corretamente', async function() {
    // Configura o mock para simular que não existe paciente
    Patient.findByPhone.mockResolvedValue(null);
    
    // Configura o mock para simular a criação bem-sucedida
    createPatient.mockResolvedValue({
      id: '123',
      token: 'test-token'
    });
    
    const response = await request(app)
      .post('/api/v1/patients')
      .set('api-secret', 'test-admin-secret')
      .send({
        name: 'Test Patient',
        phone: '(11) 99999-0000' // Formato brasileiro comum
      });
    
    expect(response.status).to.equal(201);
    
    // Verifica se o telefone foi formatado corretamente
    expect(createPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+5511999990000'
      })
    );
  });
});
