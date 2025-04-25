#!/bin/bash

# Script para executar a migração de banco de dados
# Este script é um wrapper para o script de migração Node.js
# que adiciona verificações de segurança e logs adicionais

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_SCRIPT="$PROJECT_ROOT/bin/migrate.js"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/migration_${TIMESTAMP}.log"

# Verifica se o diretório de logs existe
if [ ! -d "$LOG_DIR" ]; then
  mkdir -p "$LOG_DIR"
fi

# Função para registrar mensagens
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
  log "ERRO: Node.js não está instalado. Por favor, instale o Node.js e tente novamente."
  exit 1
fi

# Verifica se o MongoDB está acessível
if ! command -v mongosh &> /dev/null; then
  log "AVISO: mongosh não está instalado. Não é possível verificar a conexão com o MongoDB."
else
  log "Verificando conexão com o MongoDB..."
  if ! mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    log "ERRO: Não foi possível conectar ao MongoDB. Verifique se o serviço está em execução."
    exit 1
  fi
  log "Conexão com MongoDB verificada com sucesso."
fi

# Verifica se o script de migração existe
if [ ! -f "$MIGRATION_SCRIPT" ]; then
  log "ERRO: Script de migração não encontrado em $MIGRATION_SCRIPT"
  exit 1
fi

# Verifica permissões de execução
if [ ! -x "$MIGRATION_SCRIPT" ]; then
  log "Adicionando permissão de execução ao script de migração..."
  chmod +x "$MIGRATION_SCRIPT"
fi

# Exibe informações sobre o ambiente
log "=== Informações do Ambiente ==="
log "Node.js: $(node --version)"
log "MongoDB: $(mongosh --version 2>/dev/null || echo 'Não disponível')"
log "Sistema: $(uname -a)"
log "Diretório do projeto: $PROJECT_ROOT"
log "============================"

# Exibe aviso
log "AVISO: Este script irá migrar o banco de dados Nightscout para suportar múltiplos pacientes."
log "É altamente recomendado fazer um backup completo do banco de dados antes de continuar."
log ""

# Solicita confirmação
read -p "Você já fez um backup do banco de dados? (s/N): " backup_confirmed
if [[ ! "$backup_confirmed" =~ ^[Ss]$ ]]; then
  log "Migração cancelada pelo usuário. Por favor, faça um backup antes de continuar."
  exit 1
fi

# Pergunta se é para executar em modo de simulação
read -p "Executar em modo de simulação (sem alterações reais)? (s/N): " dry_run
if [[ "$dry_run" =~ ^[Ss]$ ]]; then
  DRY_RUN_FLAG="--dry-run"
  log "Executando em modo de simulação (sem alterações reais)."
else
  DRY_RUN_FLAG=""
  log "Executando migração real."
fi

# Pergunta sobre o tamanho do lote
read -p "Tamanho do lote para processamento (padrão: 1000): " batch_size
if [[ -z "$batch_size" ]]; then
  batch_size=1000
fi

# Verifica se o tamanho do lote é um número válido
if ! [[ "$batch_size" =~ ^[0-9]+$ ]]; then
  log "ERRO: Tamanho do lote inválido. Usando o valor padrão (1000)."
  batch_size=1000
fi

# Executa o script de migração
log "Iniciando migração com tamanho de lote $batch_size..."
node "$MIGRATION_SCRIPT" migrate $DRY_RUN_FLAG --batch=$batch_size 2>&1 | tee -a "$LOG_FILE"

# Verifica o código de saída
EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -eq 0 ]; then
  log "Migração concluída com sucesso!"
else
  log "ERRO: Migração falhou com código de saída $EXIT_CODE"
  log "Verifique o arquivo de log para mais detalhes: $LOG_FILE"
fi

log "Log completo disponível em: $LOG_FILE"
exit $EXIT_CODE
