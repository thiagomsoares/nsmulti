#!/bin/bash

# Script para iniciar o Nightscout Multi-Paciente

echo "Iniciando Nightscout Multi-Paciente..."
echo "Verificando configurações..."

# Verifica se o arquivo .env existe
if [ ! -f .env ]; then
  echo "ERRO: Arquivo .env não encontrado!"
  exit 1
fi

# Verifica se a variável MONGODB_URI está configurada
if ! grep -q "MONGODB_URI" .env; then
  echo "ERRO: MONGODB_URI não configurado no arquivo .env!"
  exit 1
fi

# Verifica se a variável MULTI_PATIENT_ENABLED está configurada
if ! grep -q "ENABLE_MULTI_PATIENT=true" .env; then
  echo "AVISO: Habilitando suporte multi-paciente..."
  echo "ENABLE_MULTI_PATIENT=true" >> .env
fi

# Verifica se o MongoDB está acessível
echo "Verificando conexão com MongoDB..."
node -e "
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conexão com MongoDB estabelecida com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
  echo "ERRO: Não foi possível conectar ao MongoDB. Verifique as configurações em .env"
  exit 1
fi

echo "Iniciando servidor Nightscout Multi-Paciente..."
npm start
