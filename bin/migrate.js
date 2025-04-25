#!/usr/bin/env node

/**
 * Script de linha de comando para migração de banco de dados
 * 
 * Este script fornece uma interface de linha de comando para
 * executar a migração de banco de dados para suporte multi-paciente.
 * 
 * Uso:
 *   node migrate.js [comando] [opções]
 * 
 * Comandos:
 *   migrate     Executa a migração (padrão)
 *   rollback    Reverte a migração usando backups
 *   status      Verifica o status da migração
 * 
 * Opções:
 *   --dry-run   Simula a migração sem fazer alterações
 *   --force     Ignora confirmações
 *   --batch=N   Define o tamanho do lote (padrão: 1000)
 */

const { migrate, rollback } = require('../lib/migration/migrate-patient-id');
const readline = require('readline');

// Configuração do readline para interação com o usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Analisa os argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0] === 'rollback' ? 'rollback' : 'migrate';
const options = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force')
};

// Extrai o tamanho do lote se especificado
const batchArg = args.find(arg => arg.startsWith('--batch='));
if (batchArg) {
  const batchSize = parseInt(batchArg.split('=')[1], 10);
  if (!isNaN(batchSize) && batchSize > 0) {
    options.batchSize = batchSize;
  }
}

/**
 * Função para confirmar ação com o usuário
 */
function confirm(message, callback) {
  if (options.force) {
    callback(true);
    return;
  }
  
  rl.question(`${message} (s/N): `, answer => {
    const confirmed = answer.toLowerCase() === 's';
    callback(confirmed);
  });
}

/**
 * Função principal
 */
function main() {
  console.log('Nightscout Multi-Paciente - Ferramenta de Migração');
  console.log('================================================');
  console.log(`Comando: ${command}`);
  console.log(`Opções: ${JSON.stringify(options)}`);
  console.log('');
  
  if (command === 'migrate') {
    const warningMessage = 
      'ATENÇÃO: Esta operação irá modificar o banco de dados para suportar múltiplos pacientes.\n' +
      'Um backup será criado antes da migração, mas é recomendado fazer um backup manual adicional.\n' +
      'Deseja continuar com a migração?';
    
    confirm(warningMessage, confirmed => {
      if (confirmed) {
        console.log('Iniciando migração...');
        migrate(options)
          .then(success => {
            if (success) {
              console.log('Migração concluída com sucesso!');
            } else {
              console.error('Migração falhou. Verifique os logs para mais detalhes.');
            }
            rl.close();
          })
          .catch(err => {
            console.error('Erro durante a migração:', err);
            rl.close();
          });
      } else {
        console.log('Migração cancelada pelo usuário.');
        rl.close();
      }
    });
  } else if (command === 'rollback') {
    const warningMessage = 
      'ATENÇÃO: Esta operação irá restaurar o banco de dados para o estado anterior à migração.\n' +
      'Todos os dados adicionados após a migração serão perdidos.\n' +
      'Deseja continuar com o rollback?';
    
    confirm(warningMessage, confirmed => {
      if (confirmed) {
        console.log('Iniciando rollback...');
        rollback(options)
          .then(success => {
            if (success) {
              console.log('Rollback concluído com sucesso!');
            } else {
              console.error('Rollback falhou. Verifique os logs para mais detalhes.');
            }
            rl.close();
          })
          .catch(err => {
            console.error('Erro durante o rollback:', err);
            rl.close();
          });
      } else {
        console.log('Rollback cancelado pelo usuário.');
        rl.close();
      }
    });
  } else {
    console.error(`Comando desconhecido: ${command}`);
    rl.close();
  }
}

// Inicia o programa
main();
