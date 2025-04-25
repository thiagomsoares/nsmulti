const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Script de migração para adicionar patientId a todas as coleções existentes
 * 
 * Este script implementa uma migração em duas fases:
 * 1. Adiciona patientId (default) a todos os documentos existentes
 * 2. Cria índices em background para o campo patientId
 * 
 * A migração é projetada para zero downtime, com suporte a rollback
 * e monitoramento de progresso.
 */

// Configuração
const config = {
  // ID do paciente padrão para dados existentes
  defaultPatientId: mongoose.Types.ObjectId(),
  
  // Coleções a serem migradas
  collections: [
    'entries',
    'treatments',
    'devicestatus',
    'profile',
    'food',
    'activity',
    'settings'
  ],
  
  // Tamanho do lote para processamento em batch
  batchSize: 1000,
  
  // Intervalo entre lotes (ms) para reduzir impacto
  batchInterval: 100,
  
  // Diretório para backups
  backupDir: path.join(__dirname, '../backup'),
  
  // Arquivo de log
  logFile: path.join(__dirname, '../logs/migration.log')
};

// Garantir que os diretórios existam
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

if (!fs.existsSync(path.dirname(config.logFile))) {
  fs.mkdirSync(path.dirname(config.logFile), { recursive: true });
}

// Stream de log
const logStream = fs.createWriteStream(config.logFile, { flags: 'a' });

/**
 * Função para registrar mensagens de log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Escreve no arquivo de log
  logStream.write(logMessage);
  
  // Exibe no console
  console.log(logMessage.trim());
}

/**
 * Função para criar backup de uma coleção
 */
async function backupCollection(db, collectionName) {
  const backupPath = path.join(config.backupDir, `${collectionName}.json`);
  const writeStream = fs.createWriteStream(backupPath);
  const collection = db.collection(collectionName);
  
  log(`Iniciando backup da coleção ${collectionName}`);
  
  // Contador para monitoramento
  let count = 0;
  
  // Cria cursor para iterar sobre todos os documentos
  const cursor = collection.find({});
  
  // Processa documentos em lotes
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    writeStream.write(JSON.stringify(doc) + '\n');
    count++;
    
    if (count % 10000 === 0) {
      log(`Backup em andamento: ${count} documentos processados na coleção ${collectionName}`);
    }
  }
  
  // Fecha o stream
  writeStream.end();
  
  log(`Backup concluído: ${count} documentos salvos da coleção ${collectionName}`);
  return count;
}

/**
 * Função para restaurar backup de uma coleção
 */
async function restoreCollection(db, collectionName) {
  const backupPath = path.join(config.backupDir, `${collectionName}.json`);
  
  if (!fs.existsSync(backupPath)) {
    log(`Erro: Backup não encontrado para coleção ${collectionName}`);
    return false;
  }
  
  log(`Iniciando restauração da coleção ${collectionName}`);
  
  // Limpa a coleção atual
  await db.collection(collectionName).deleteMany({});
  
  // Cria stream de leitura
  const fileStream = fs.createReadStream(backupPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  // Contador para monitoramento
  let count = 0;
  
  // Processa linha por linha
  for await (const line of rl) {
    if (line.trim()) {
      const doc = JSON.parse(line);
      await db.collection(collectionName).insertOne(doc);
      count++;
      
      if (count % 10000 === 0) {
        log(`Restauração em andamento: ${count} documentos processados na coleção ${collectionName}`);
      }
    }
  }
  
  log(`Restauração concluída: ${count} documentos restaurados na coleção ${collectionName}`);
  return true;
}

/**
 * Função para adicionar patientId a todos os documentos de uma coleção
 */
async function addPatientIdToCollection(db, collectionName, patientId) {
  const collection = db.collection(collectionName);
  
  log(`Iniciando migração da coleção ${collectionName}`);
  
  // Contador para monitoramento
  let count = 0;
  let total = await collection.countDocuments({});
  
  log(`Total de documentos na coleção ${collectionName}: ${total}`);
  
  // Processa em lotes para reduzir impacto
  let lastId = null;
  
  while (true) {
    // Constrói a query para o próximo lote
    let query = {};
    if (lastId) {
      query._id = { $gt: lastId };
    }
    
    // Adiciona filtro para documentos sem patientId
    query.patientId = { $exists: false };
    
    // Busca o próximo lote
    const batch = await collection.find(query)
      .sort({ _id: 1 })
      .limit(config.batchSize)
      .toArray();
    
    if (batch.length === 0) {
      break; // Todos os documentos processados
    }
    
    // Atualiza cada documento no lote
    for (const doc of batch) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { patientId: patientId } }
      );
      
      lastId = doc._id;
      count++;
      
      if (count % 1000 === 0) {
        const progress = Math.round((count / total) * 100);
        log(`Progresso: ${progress}% (${count}/${total}) na coleção ${collectionName}`);
      }
    }
    
    // Pausa entre lotes para reduzir impacto
    await new Promise(resolve => setTimeout(resolve, config.batchInterval));
  }
  
  log(`Migração concluída: ${count} documentos atualizados na coleção ${collectionName}`);
  return count;
}

/**
 * Função para criar índice em uma coleção
 */
async function createPatientIdIndex(db, collectionName) {
  const collection = db.collection(collectionName);
  
  log(`Criando índice em patientId para coleção ${collectionName}`);
  
  try {
    // Cria índice em background para não bloquear operações
    await collection.createIndex(
      { patientId: 1 },
      { background: true, name: 'idx_patientId' }
    );
    
    log(`Índice criado com sucesso para coleção ${collectionName}`);
    return true;
  } catch (err) {
    log(`Erro ao criar índice para coleção ${collectionName}: ${err.message}`);
    return false;
  }
}

/**
 * Função principal de migração
 */
async function migrate() {
  // Conecta ao MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nightscout-multi';
  
  log(`Iniciando migração para multi-paciente`);
  log(`URI do MongoDB: ${mongoUri}`);
  log(`ID do paciente padrão: ${config.defaultPatientId}`);
  
  try {
    // Conecta ao MongoDB
    const client = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.connection.db;
    
    log('Conexão com MongoDB estabelecida');
    
    // Fase 1: Backup de todas as coleções
    log('=== FASE 0: BACKUP ===');
    for (const collectionName of config.collections) {
      await backupCollection(db, collectionName);
    }
    
    // Fase 2: Adiciona patientId a todos os documentos
    log('=== FASE 1: ADIÇÃO DE PATIENTID ===');
    for (const collectionName of config.collections) {
      await addPatientIdToCollection(db, collectionName, config.defaultPatientId);
    }
    
    // Fase 3: Cria índices
    log('=== FASE 2: CRIAÇÃO DE ÍNDICES ===');
    for (const collectionName of config.collections) {
      await createPatientIdIndex(db, collectionName);
    }
    
    log('Migração concluída com sucesso');
    
    // Fecha a conexão
    await mongoose.disconnect();
    log('Conexão com MongoDB fechada');
    
    // Fecha o stream de log
    logStream.end();
    
    return true;
  } catch (err) {
    log(`ERRO FATAL: ${err.message}`);
    log(`Stack: ${err.stack}`);
    
    // Fecha o stream de log
    logStream.end();
    
    return false;
  }
}

/**
 * Função de rollback
 */
async function rollback() {
  // Conecta ao MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nightscout-multi';
  
  log(`Iniciando rollback da migração`);
  log(`URI do MongoDB: ${mongoUri}`);
  
  try {
    // Conecta ao MongoDB
    const client = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.connection.db;
    
    log('Conexão com MongoDB estabelecida');
    
    // Restaura todas as coleções
    log('=== ROLLBACK: RESTAURAÇÃO DE BACKUP ===');
    for (const collectionName of config.collections) {
      await restoreCollection(db, collectionName);
    }
    
    log('Rollback concluído com sucesso');
    
    // Fecha a conexão
    await mongoose.disconnect();
    log('Conexão com MongoDB fechada');
    
    // Fecha o stream de log
    logStream.end();
    
    return true;
  } catch (err) {
    log(`ERRO FATAL DURANTE ROLLBACK: ${err.message}`);
    log(`Stack: ${err.stack}`);
    
    // Fecha o stream de log
    logStream.end();
    
    return false;
  }
}

// Executa a função apropriada com base nos argumentos
if (process.argv[2] === 'rollback') {
  rollback();
} else {
  migrate();
}

module.exports = {
  migrate,
  rollback,
  addPatientIdToCollection,
  createPatientIdIndex,
  backupCollection,
  restoreCollection
};
