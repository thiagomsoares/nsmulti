const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { 
  addPatientIdToCollection, 
  createPatientIdIndex,
  backupCollection,
  restoreCollection
} = require('../lib/migration/migrate-patient-id');
const fs = require('fs');
const path = require('path');

describe('Database Migration Script', function() {
  let mongoServer;
  let db;
  let testCollectionName = 'test_collection';
  
  // Aumenta o timeout para testes de migração
  this.timeout(30000);
  
  before(async function() {
    // Cria uma instância do MongoDB em memória para testes
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Conecta ao MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    db = mongoose.connection.db;
    
    // Cria uma coleção de teste com documentos
    const collection = db.collection(testCollectionName);
    
    // Insere documentos de teste
    const testDocs = [];
    for (let i = 0; i < 100; i++) {
      testDocs.push({
        _id: new mongoose.Types.ObjectId(),
        name: `Test Document ${i}`,
        value: i
      });
    }
    
    await collection.insertMany(testDocs);
  });
  
  after(async function() {
    // Fecha a conexão e para o servidor
    await mongoose.disconnect();
    await mongoServer.stop();
    
    // Limpa arquivos de backup criados durante os testes
    const backupDir = path.join(__dirname, '../backup');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      for (const file of files) {
        fs.unlinkSync(path.join(backupDir, file));
      }
    }
  });
  
  it('deve adicionar patientId a todos os documentos', async function() {
    const patientId = new mongoose.Types.ObjectId();
    const collection = db.collection(testCollectionName);
    
    // Verifica que nenhum documento tem patientId inicialmente
    const initialCount = await collection.countDocuments({ patientId: { $exists: true } });
    expect(initialCount).to.equal(0);
    
    // Executa a migração
    const count = await addPatientIdToCollection(db, testCollectionName, patientId);
    
    // Verifica que todos os documentos foram atualizados
    const updatedCount = await collection.countDocuments({ patientId: patientId });
    expect(updatedCount).to.equal(100);
    expect(count).to.equal(100);
  });
  
  it('deve criar índice em patientId', async function() {
    // Cria o índice
    const result = await createPatientIdIndex(db, testCollectionName);
    expect(result).to.be.true;
    
    // Verifica se o índice foi criado
    const indexes = await db.collection(testCollectionName).indexes();
    const patientIdIndex = indexes.find(idx => idx.name === 'idx_patientId');
    
    expect(patientIdIndex).to.exist;
    expect(patientIdIndex.key).to.deep.equal({ patientId: 1 });
  });
  
  it('deve fazer backup e restaurar uma coleção', async function() {
    // Faz backup da coleção
    const backupCount = await backupCollection(db, testCollectionName);
    expect(backupCount).to.equal(100);
    
    // Verifica se o arquivo de backup foi criado
    const backupPath = path.join(__dirname, '../backup', `${testCollectionName}.json`);
    expect(fs.existsSync(backupPath)).to.be.true;
    
    // Modifica a coleção original
    await db.collection(testCollectionName).updateMany(
      {},
      { $set: { modified: true } }
    );
    
    // Verifica que a modificação foi aplicada
    const modifiedCount = await db.collection(testCollectionName).countDocuments({ modified: true });
    expect(modifiedCount).to.equal(100);
    
    // Restaura a partir do backup
    const restoreResult = await restoreCollection(db, testCollectionName);
    expect(restoreResult).to.be.true;
    
    // Verifica que a restauração removeu as modificações
    const restoredModifiedCount = await db.collection(testCollectionName).countDocuments({ modified: true });
    expect(restoredModifiedCount).to.equal(0);
    
    // Verifica que o número de documentos está correto
    const totalCount = await db.collection(testCollectionName).countDocuments();
    expect(totalCount).to.equal(100);
  });
});
