# Documentação de Migração para Nightscout Multi-Paciente

## Visão Geral

Este documento descreve o processo de migração de um banco de dados Nightscout existente para suportar múltiplos pacientes. A migração adiciona o campo `patientId` a todas as coleções existentes e cria os índices necessários para otimizar consultas.

## Pré-requisitos

- Backup completo do banco de dados
- Acesso administrativo ao MongoDB
- Node.js 14+ instalado
- Permissões de escrita no diretório do projeto

## Arquivos de Migração

- **migrate-patient-id.js**: Script principal de migração
- **migrate.js**: Interface de linha de comando Node.js
- **migrate.sh**: Script shell com verificações adicionais

## Processo de Migração

A migração ocorre em três fases:

1. **Backup**: Cria um backup de todas as coleções antes de qualquer modificação
2. **Adição de patientId**: Adiciona o campo `patientId` a todos os documentos existentes
3. **Criação de Índices**: Cria índices para o campo `patientId` em todas as coleções

## Características de Segurança

- Backup automático antes da migração
- Suporte a rollback completo
- Processamento em lotes para minimizar impacto
- Logs detalhados de todas as operações
- Modo de simulação (dry-run) para testar sem fazer alterações

## Uso

### Usando o Script Shell (Recomendado)

```bash
./bin/migrate.sh
```

O script irá:
1. Verificar pré-requisitos
2. Solicitar confirmação de backup
3. Oferecer opção de modo de simulação
4. Permitir configurar o tamanho do lote
5. Executar a migração com logs detalhados

### Usando o Script Node.js Diretamente

```bash
# Migração normal
node ./bin/migrate.js

# Migração com opções
node ./bin/migrate.js --dry-run --batch=500

# Rollback (restaura a partir do backup)
node ./bin/migrate.js rollback
```

## Monitoramento

Durante a migração, o progresso é registrado em:
- Console (saída padrão)
- Arquivo de log em `logs/migration.log`
- Arquivo de log com timestamp em `logs/migration_YYYYMMDD_HHMMSS.log`

## Rollback

Em caso de problemas, é possível reverter a migração:

```bash
node ./bin/migrate.js rollback
```

Isso restaurará todas as coleções a partir dos backups criados durante a migração.

## Verificação Pós-Migração

Após a migração, verifique:

1. Se todas as coleções têm o campo `patientId`
2. Se os índices foram criados corretamente
3. Se a aplicação está funcionando normalmente

## Solução de Problemas

### Erro de Conexão com MongoDB

Verifique se:
- O MongoDB está em execução
- A URI de conexão está correta em `.env`
- As credenciais têm permissões suficientes

### Erro Durante a Migração

- Verifique os logs detalhados
- Execute o rollback se necessário
- Verifique o espaço em disco disponível

### Desempenho Lento

- Aumente o intervalo entre lotes (`--batch-interval`)
- Reduza o tamanho do lote (`--batch=N`)
- Execute durante períodos de baixo tráfego
