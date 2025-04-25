# Documentação de Segurança e Observabilidade

## Visão Geral

Este documento descreve a implementação de segurança e observabilidade do sistema Nightscout Multi-Paciente. O sistema foi projetado com foco em segurança, isolamento de dados e monitoramento abrangente.

## Componentes Implementados

### 1. Sistema de Logging

- **Logger Centralizado**: Implementado com Winston para registro consistente de eventos
- **Logs Estruturados**: Formato JSON para facilitar análise e pesquisa
- **Separação de Logs**: Arquivos separados para erros, eventos gerais e eventos de segurança
- **Níveis de Log**: Suporte a diferentes níveis (debug, info, warn, error)

### 2. Middlewares de Segurança

- **Helmet**: Configuração de cabeçalhos HTTP de segurança
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options
  - X-Content-Type-Options
  - XSS Protection

- **Rate Limiting**: Proteção contra ataques de força bruta e DoS
  - Limites diferentes para endpoints públicos e administrativos
  - Janelas de tempo configuráveis
  - Logging de tentativas de abuso

### 3. Testes de Segurança

- **Validação de JWT**: Testes para garantir que tokens inválidos sejam rejeitados
- **Expiração de Tokens**: Verificação de que tokens expirados não são aceitos
- **Isolamento de Pacientes**: Testes para garantir que dados de um paciente não sejam acessíveis por outro
- **Cabeçalhos de Segurança**: Verificação da presença de cabeçalhos HTTP de segurança

### 4. Observabilidade

- **Métricas Prometheus**: Exposição de métricas em formato compatível com Prometheus
- **Contadores e Histogramas**: Medição de requisições, erros e operações
- **Medidores**: Monitoramento de estatísticas em tempo real (ex: pacientes ativos)
- **Endpoint de Métricas**: Disponível em `/metrics` para integração com sistemas de monitoramento

## Métricas Implementadas

| Nome | Tipo | Descrição | Labels |
|------|------|-----------|--------|
| `nightscout_http_requests_total` | Counter | Total de requisições HTTP | method, path, status |
| `nightscout_http_request_duration_seconds` | Histogram | Duração das requisições HTTP | method, path, status |
| `nightscout_auth_errors_total` | Counter | Total de erros de autenticação | type |
| `nightscout_patient_operations_total` | Counter | Total de operações de pacientes | operation, status |
| `nightscout_active_patients` | Gauge | Número de pacientes ativos | - |
| `nightscout_data_access_total` | Counter | Total de acessos a dados | collection, operation |

## Eventos de Segurança Registrados

- Tentativas de login (sucesso/falha)
- Acesso a dados de pacientes
- Operações administrativas
- Tentativas de acesso não autorizado
- Excesso de limite de taxa (rate limit)
- Acesso a rotas inexistentes

## Integração com o Sistema

O sistema de segurança e observabilidade é inicializado durante a inicialização do servidor Nightscout:

```javascript
// No arquivo server.js
const SecurityManager = require('./lib/security');
const securityManager = new SecurityManager(app, env);
await securityManager.initialize();
```

## Configuração

As seguintes variáveis de ambiente podem ser configuradas:

- `LOG_LEVEL`: Nível de log (default: "info")
- `RUN_SECURITY_TESTS`: Se deve executar testes de segurança na inicialização (default: "false")
- `RATE_LIMIT_WINDOW_MS`: Janela de tempo para rate limiting em ms (default: 900000)
- `RATE_LIMIT_MAX`: Número máximo de requisições por janela (default: 100)
- `ADMIN_RATE_LIMIT_MAX`: Número máximo de requisições admin por janela (default: 30)

## Recomendações de Segurança

1. **HTTPS**: Sempre use HTTPS em produção
2. **Rotação de Chaves**: Implemente rotação periódica das chaves JWT
3. **Monitoramento**: Configure alertas para eventos de segurança suspeitos
4. **Backups**: Mantenha backups regulares do banco de dados
5. **Atualizações**: Mantenha todas as dependências atualizadas

## Próximos Passos

1. Implementar testes de penetração completos
2. Adicionar detecção de anomalias baseada em machine learning
3. Implementar auditoria completa de todas as operações
4. Integrar com sistemas SIEM (Security Information and Event Management)
