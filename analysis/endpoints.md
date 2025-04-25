# Análise de Endpoints da API do Nightscout

## Estrutura da API

Baseado na análise do código-fonte, o Nightscout possui três versões de API:

1. **API v1** - API original
   - Rota base: `/api/v1`
   - Definida em: `lib/api/index.js`

2. **API v2** - Extensão da API v1
   - Rota base: `/api/v2`
   - Compartilha implementação com API v1

3. **API v3** - API mais recente com estrutura genérica
   - Rota base: `/api/v3`
   - Definida em: `lib/api3/index.js`
   - Implementação genérica em: `lib/api3/generic/collection.js`

## Endpoints Principais

### API v3 (Genérica)

A API v3 implementa operações CRUD genéricas para todas as coleções:

1. **GET /api/v3/:collection**
   - Busca documentos da coleção
   - Implementado em: `searchOperation`
   - Suporta filtragem, ordenação e paginação

2. **POST /api/v3/:collection**
   - Cria novo documento na coleção
   - Implementado em: `createOperation`

3. **GET /api/v3/:collection/:id**
   - Lê documento específico por ID
   - Implementado em: `readOperation`

4. **PUT /api/v3/:collection/:id**
   - Atualiza documento específico
   - Implementado em: `updateOperation`

5. **DELETE /api/v3/:collection/:id**
   - Remove documento específico
   - Implementado em: `deleteOperation`

6. **GET /api/v3/:collection/history**
   - Retorna histórico de alterações
   - Implementado em: `historyOperation`

### Endpoints Específicos

Além dos endpoints genéricos, existem endpoints específicos:

1. **GET /api/v3/version**
   - Retorna informações de versão
   - Definido em: `lib/api3/index.js`

2. **GET /api/v3/status**
   - Retorna status do sistema
   - Definido em: `lib/api3/index.js`

3. **GET /api/v3/lastModified**
   - Retorna timestamps de última modificação
   - Definido em: `lib/api3/index.js`

## Modificações Necessárias para Multi-Paciente

Para implementar suporte multi-paciente, os seguintes endpoints precisarão ser criados:

### Novos Endpoints para Gerenciamento de Pacientes

1. **POST /api/v1/patients**
   - Cria novo paciente
   - Requer autenticação de administrador (API_SECRET)
   - Retorna: `{ id, token }`

2. **GET /api/v1/patients/:id**
   - Obtém detalhes do paciente
   - Requer autenticação de administrador

3. **PATCH /api/v1/patients/:id**
   - Atualiza informações do paciente
   - Requer autenticação de administrador

4. **DELETE /api/v1/patients/:id**
   - Desativa paciente
   - Requer autenticação de administrador

### Modificações em Endpoints Existentes

Todos os endpoints existentes precisarão ser modificados para:

1. **Autenticação**
   - Verificar token do paciente no header Authorization
   - Extrair patientId do token verificado

2. **Filtragem**
   - Adicionar filtro `{ patientId: req.patientId }` a todas as consultas
   - Adicionar patientId a todos os documentos criados

3. **Verificação de Propriedade**
   - Verificar se o documento pertence ao paciente autenticado antes de operações de leitura/atualização/exclusão

## Estratégia de Implementação

1. **Middleware de Autenticação**
   - Implementar middleware que verifica token e injeta patientId no objeto de requisição

2. **Refatoração Progressiva**
   - Modificar endpoints um por um, começando pelos mais críticos
   - Manter compatibilidade com clientes existentes

3. **Testes**
   - Testar cada endpoint modificado para garantir que:
     - Filtra corretamente por patientId
     - Não permite acesso a dados de outros pacientes
     - Mantém compatibilidade com clientes existentes
