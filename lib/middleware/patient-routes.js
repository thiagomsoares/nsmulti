const express = require('express');
const { verifyPatient, verifyAdmin, rateLimiter } = require('./auth');
const Patient = require('../models/patient');
const { createPatient, getPatientById, updatePatient, deactivatePatient } = require('../models/patient-service');
const { validatePatient, formatPhoneE164, isValidE164 } = require('../models/validation');

// Cria um router para os endpoints de pacientes
const router = express.Router();

/**
 * POST /api/v1/patients
 * Cria um novo paciente
 * Requer autenticação de administrador
 */
router.post('/patients', verifyAdmin, rateLimiter(true), async (req, res) => {
  try {
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

/**
 * GET /api/v1/patients/:id
 * Obtém detalhes de um paciente
 * Requer autenticação de administrador
 */
router.get('/patients/:id', verifyAdmin, rateLimiter(true), async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Busca o paciente
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Paciente não encontrado'
      });
    }
    
    // Retorna os dados do paciente (exceto o token por segurança)
    res.json({
      status: 'success',
      data: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
        createdAt: patient.createdAt,
        tokenExpires: patient.tokenExpires,
        settings: patient.settings,
        active: patient.active
      }
    });
  } catch (err) {
    console.error('Erro ao buscar paciente:', err);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno ao buscar paciente'
    });
  }
});

/**
 * PATCH /api/v1/patients/:id
 * Atualiza informações de um paciente
 * Requer autenticação de administrador
 */
router.patch('/patients/:id', verifyAdmin, rateLimiter(true), async (req, res) => {
  try {
    const patientId = req.params.id;
    const { name, phone, settings, active } = req.body;
    
    // Verifica se o paciente existe
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Paciente não encontrado'
      });
    }
    
    // Prepara os dados para atualização
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (settings !== undefined) updateData.settings = settings;
    if (active !== undefined) updateData.active = active;
    
    // Se o telefone foi fornecido, formata e valida
    if (phone !== undefined) {
      const formattedPhone = formatPhoneE164(phone);
      
      if (!isValidE164(formattedPhone)) {
        return res.status(400).json({
          status: 'error',
          message: 'Telefone deve estar no formato E.164 (ex: +5511999990000)'
        });
      }
      
      // Verifica se o telefone já está em uso por outro paciente
      if (formattedPhone !== patient.phone) {
        const existingPatient = await Patient.findByPhone(formattedPhone);
        if (existingPatient && existingPatient._id.toString() !== patientId) {
          return res.status(409).json({
            status: 'error',
            message: 'Já existe outro paciente com este telefone'
          });
        }
      }
      
      updateData.phone = formattedPhone;
    }
    
    // Atualiza o paciente
    const updatedPatient = await updatePatient(patientId, updateData);
    
    // Retorna os dados atualizados
    res.json({
      status: 'success',
      data: {
        id: updatedPatient._id,
        name: updatedPatient.name,
        phone: updatedPatient.phone,
        createdAt: updatedPatient.createdAt,
        tokenExpires: updatedPatient.tokenExpires,
        settings: updatedPatient.settings,
        active: updatedPatient.active
      }
    });
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno ao atualizar paciente'
    });
  }
});

/**
 * DELETE /api/v1/patients/:id
 * Desativa um paciente
 * Requer autenticação de administrador
 */
router.delete('/patients/:id', verifyAdmin, rateLimiter(true), async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Verifica se o paciente existe
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Paciente não encontrado'
      });
    }
    
    // Desativa o paciente
    await deactivatePatient(patientId);
    
    // Retorna sucesso
    res.json({
      status: 'success',
      message: 'Paciente desativado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao desativar paciente:', err);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno ao desativar paciente'
    });
  }
});

module.exports = router;
