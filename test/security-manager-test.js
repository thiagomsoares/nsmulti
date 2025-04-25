const { expect } = require('chai');
const SecurityManager = require('../lib/security/index');
const express = require('express');

describe('Security Manager', function() {
  let securityManager;
  let app;
  let env;
  
  before(function() {
    // Configura ambiente de teste
    app = express();
    env = {
      JWT_PUBLIC_KEY_PATH: '/home/ubuntu/nightscout-multi/keys/public.pem',
      JWT_PRIVATE_KEY_PATH: '/home/ubuntu/nightscout-multi/keys/private.pem',
      RUN_SECURITY_TESTS: 'false',
      MULTI_PATIENT_ENABLED: 'true'
    };
  });
  
  it('deve inicializar corretamente', async function() {
    securityManager = new SecurityManager(app, env);
    expect(securityManager).to.be.an('object');
    expect(securityManager.app).to.equal(app);
    expect(securityManager.env).to.equal(env);
    expect(securityManager.securityTester).to.be.an('object');
    expect(securityManager.observability).to.be.an('object');
  });
  
  it('deve registrar eventos de autenticação', function() {
    securityManager = new SecurityManager(app, env);
    
    // Este teste verifica apenas se o método não lança exceções
    expect(() => {
      securityManager.recordAuthEvent('login', 'user123', true, { ip: '127.0.0.1' });
    }).to.not.throw();
    
    expect(() => {
      securityManager.recordAuthEvent('login_failed', 'user123', false, { ip: '127.0.0.1', reason: 'invalid_password' });
    }).to.not.throw();
  });
  
  it('deve registrar operações de paciente', function() {
    securityManager = new SecurityManager(app, env);
    
    // Este teste verifica apenas se o método não lança exceções
    expect(() => {
      securityManager.recordPatientOperation('create', 'success', 'patient123');
    }).to.not.throw();
    
    expect(() => {
      securityManager.recordPatientOperation('update', 'failed', 'patient123');
    }).to.not.throw();
  });
  
  it('deve atualizar estatísticas de pacientes', async function() {
    securityManager = new SecurityManager(app, env);
    
    // Mock do banco de dados
    const mockDb = {
      collection: () => ({
        countDocuments: async () => 5
      })
    };
    
    // Este teste verifica apenas se o método não lança exceções
    await expect(securityManager.updatePatientStats(mockDb)).to.be.fulfilled;
  });
});
