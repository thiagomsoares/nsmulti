# Análise de Autenticação e Middleware do Nightscout

## Mecanismos de Autenticação Atuais

Baseado na análise do código-fonte, os seguintes mecanismos de autenticação foram identificados:

1. **API_SECRET**
   - Implementação atual baseada em uma chave compartilhada
   - Usado para autenticar todas as operações de escrita
   - Definido como variável de ambiente
   - Verificado em vários pontos do código

2. **hashauth**
   - Implementado no lado do cliente
   - Usado para verificar se o cliente está autenticado antes de permitir operações
   - Método `isAuthenticated()` chamado antes de operações sensíveis

3. **Socket Authentication**
   - Evento `authorize` no WebSocket
   - Usado para autenticar conexões em tempo real

4. **Role-based Authorization**
   - Sistema de papéis (roles) para controle de acesso
   - Coleções `auth_roles` e `auth_subjects`
   - Configuração `authDefaultRoles` para definir papéis padrão

## Pontos de Modificação para Multi-Paciente

Para implementar autenticação multi-paciente, os seguintes componentes precisarão ser modificados:

1. **Middleware de Autenticação**
   - Criar novo middleware `verifyPatient` para validar tokens JWT
   - Criar novo middleware `verifyAdmin` para validar API_SECRET do administrador
   - Injetar `patientId` no objeto de requisição para requisições autenticadas

2. **Pontos de Integração**
   - `lib/server/app.js`: Adicionar middleware nas rotas da API
   - `lib/server/websocket.js`: Modificar evento `authorize` para suportar tokens de paciente
   - `lib/api3/security.js`: Integrar com o novo sistema de autenticação

3. **Fluxo de Autenticação do Cliente**
   - Modificar para aceitar token via query parameter na carga inicial
   - Armazenar token no localStorage
   - Adicionar header Authorization a todas as requisições

## Endpoints da API

Os principais endpoints da API que precisarão ser modificados:

1. **API v1 e v2**
   - Endpoints em `lib/api/index.js`
   - Todos os endpoints precisarão ser atualizados para filtrar por patientId

2. **API v3**
   - Endpoints em `lib/api3/generic/collection.js`
   - Implementa operações CRUD genéricas para todas as coleções
   - Pontos de modificação:
     - `searchOperation`: Adicionar filtro patientId
     - `createOperation`: Adicionar patientId aos novos documentos
     - `readOperation`: Verificar se o documento pertence ao paciente autenticado
     - `updateOperation`: Verificar propriedade antes de atualizar
     - `deleteOperation`: Verificar propriedade antes de excluir

3. **Novos Endpoints para Gerenciamento de Pacientes**
   - Criar endpoint POST `/api/v1/patients` para registro de pacientes
   - Criar endpoint GET `/api/v1/patients/:id` para detalhes do paciente
   - Criar endpoint PATCH `/api/v1/patients/:id` para atualização de pacientes
   - Criar endpoint DELETE `/api/v1/patients/:id` para desativação de pacientes

## Estratégia de Implementação

1. **Fase 1: Middleware de Autenticação**
   - Implementar middleware `verifyPatient` e `verifyAdmin`
   - Criar funções de geração e validação de token JWT

2. **Fase 2: Modificação de Endpoints**
   - Aplicar middleware nas rotas existentes
   - Modificar handlers para filtrar por patientId

3. **Fase 3: Novos Endpoints**
   - Implementar endpoints de gerenciamento de pacientes

4. **Fase 4: Atualização do Cliente**
   - Modificar frontend para suportar autenticação baseada em token
