const express = require('express');
const { verifyAdmin, rateLimiter } = require('./auth');
const { createPatient } = require('../models/patient-service');
const { validatePatient, formatPhoneE164, isValidE164 } = require('../models/validation');
const Patient = require('../models/patient');
const swaggerJsdoc = require('swagger-jsdoc');

// Cria um router para o endpoint de registro de pacientes
const router = express.Router();

/**
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Registra um novo paciente
 *     description: Cria um novo paciente e retorna seu ID e token de acesso
 *     tags: [Patients]
 *     security:
 *       - ApiSecretAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do paciente (3-60 caracteres)
 *                 minLength: 3
 *                 maxLength: 60
 *               phone:
 *                 type: string
 *                 description: Telefone no formato E.164 (ex. +5511999990000)
 *                 pattern: ^\+[1-9]\d{1,14}$
 *               settings:
 *                 type: object
 *                 description: Configurações específicas do paciente
 *     responses:
 *       201:
 *         description: Paciente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID único do paciente
 *                     token:
 *                       type: string
 *                       description: Token JWT para autenticação
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: Conflito - paciente já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/patients', verifyAdmin, rateLimiter(true), async (req, res) => {
  try {
    // Registra o início da operação para monitoramento de performance
    const startTime = Date.now();
    
    // Valida os dados de entrada
    const { name, phone, settings } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome e telefone são obrigatórios'
      });
    }
    
    // Formata o telefone para E.164
    const formattedPhone = formatPhoneE164(phone);
    
    // Verifica se o telefone está no formato E.164
    if (!isValidE164(formattedPhone)) {
      return res.status(400).json({
        status: 'error',
        message: 'Telefone deve estar no formato E.164 (ex: +5511999990000)'
      });
    }
    
    // Verifica se já existe um paciente com este telefone
    const existingPatient = await Patient.findByPhone(formattedPhone);
    if (existingPatient) {
      return res.status(409).json({
        status: 'error',
        message: 'Já existe um paciente com este telefone'
      });
    }
    
    // Cria o paciente
    const patientData = {
      name,
      phone: formattedPhone,
      settings
    };
    
    // Valida os dados do paciente
    const validation = validatePatient(patientData);
    if (!validation.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Dados inválidos',
        errors: validation.errors
      });
    }
    
    // Cria o paciente no banco de dados
    const result = await createPatient(patientData);
    
    // Calcula o tempo de resposta para monitoramento
    const responseTime = Date.now() - startTime;
    console.log(`Paciente criado em ${responseTime}ms`);
    
    // Retorna o ID e o token
    res.status(201).json({
      status: 'success',
      data: {
        id: result.id,
        token: result.token
      }
    });
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno ao criar paciente'
    });
  }
});

// Configuração do Swagger para documentação
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nightscout Multi-Paciente API',
      version: '1.0.0',
      description: 'API para gerenciamento de múltiplos pacientes no Nightscout'
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    components: {
      securitySchemes: {
        ApiSecretAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'api-secret'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./lib/middleware/registration.js', './lib/middleware/patient-routes.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Função para registrar a documentação Swagger
function setupSwagger(app) {
  app.get('/api/v1/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = {
  registrationRouter: router,
  setupSwagger
};
