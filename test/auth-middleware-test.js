const chai = require('chai');
const expect = chai.expect;
const { verifyPatientToken } = require('../lib/models/token');
const { verifyPatient, verifyAdmin, rateLimiter } = require('../lib/middleware/auth');

// Mock objects
const mockReq = (headers = {}) => ({
  headers,
  ip: '127.0.0.1'
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  res.setHeader = (name, value) => {
    if (!res.headers) res.headers = {};
    res.headers[name] = value;
    return res;
  };
  return res;
};

describe('Authentication Middleware', function() {
  describe('verifyAdmin', function() {
    it('deve permitir acesso com API_SECRET correto', function() {
      // Salva o valor original
      const originalSecret = process.env.ADMIN_API_SECRET;
      
      // Define um valor para teste
      process.env.ADMIN_API_SECRET = 'test-secret';
      
      const req = mockReq({ 'api-secret': 'test-secret' });
      const res = mockRes();
      let nextCalled = false;
      
      verifyAdmin(req, res, () => { nextCalled = true; });
      
      expect(nextCalled).to.be.true;
      
      // Restaura o valor original
      process.env.ADMIN_API_SECRET = originalSecret;
    });
    
    it('deve negar acesso com API_SECRET incorreto', function() {
      // Salva o valor original
      const originalSecret = process.env.ADMIN_API_SECRET;
      
      // Define um valor para teste
      process.env.ADMIN_API_SECRET = 'test-secret';
      
      const req = mockReq({ 'api-secret': 'wrong-secret' });
      const res = mockRes();
      let nextCalled = false;
      
      verifyAdmin(req, res, () => { nextCalled = true; });
      
      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(401);
      expect(res.body.status).to.equal('error');
      
      // Restaura o valor original
      process.env.ADMIN_API_SECRET = originalSecret;
    });
  });
  
  describe('rateLimiter', function() {
    it('deve permitir requisições dentro do limite', function() {
      const limiter = rateLimiter();
      const req = mockReq();
      const res = mockRes();
      let nextCalled = false;
      
      limiter(req, res, () => { nextCalled = true; });
      
      expect(nextCalled).to.be.true;
      expect(res.headers).to.have.property('X-RateLimit-Limit');
      expect(res.headers).to.have.property('X-RateLimit-Remaining');
      expect(res.headers).to.have.property('X-RateLimit-Reset');
    });
    
    it('deve usar limites diferentes para admin e normal', function() {
      const normalLimiter = rateLimiter(false);
      const adminLimiter = rateLimiter(true);
      
      const reqNormal = mockReq();
      const resNormal = mockRes();
      normalLimiter(reqNormal, resNormal, () => {});
      
      const reqAdmin = mockReq();
      const resAdmin = mockRes();
      adminLimiter(reqAdmin, resAdmin, () => {});
      
      expect(resNormal.headers['X-RateLimit-Limit']).to.equal(100);
      expect(resAdmin.headers['X-RateLimit-Limit']).to.equal(10);
    });
  });
});
