# Análise de Coleções MongoDB do Nightscout

## Coleções Identificadas

Baseado na análise do código-fonte, as seguintes coleções MongoDB foram identificadas:

1. **entries** - Leituras de CGM (Continuous Glucose Monitoring)
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/server/entries.js`, `lib/server/websocket.js`
   - Valor padrão: `entries`

2. **treatments** - Tratamentos (insulina, carboidratos, etc.)
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/server/treatments.js`, `lib/server/websocket.js`
   - Valor padrão: `treatments`

3. **devicestatus** - Status dos dispositivos conectados
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/server/devicestatus.js`, `lib/server/websocket.js`
   - Valor padrão: `devicestatus`

4. **profile** - Perfis de configuração do usuário
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/server/profile.js`, `lib/server/websocket.js`
   - Valor padrão: `profile`

5. **food** - Banco de dados de alimentos
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/server/food.js`, `lib/server/websocket.js`
   - Valor padrão: `food`

6. **activity** - Registro de atividades
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/server/activity.js`, `lib/server/websocket.js`
   - Valor padrão: `activity`

7. **settings** - Configurações do sistema
   - Definida em: `lib/server/env.js`
   - Usada em: `lib/api3/generic/setup.js`
   - Valor padrão: `settings`

8. **auth_roles** - Papéis de autenticação
   - Prefixo definido em: `lib/server/env.js` (`authentication_collections_prefix`)
   - Usada em: `lib/authorization/storage.js`
   - Valor padrão: `auth_roles`

9. **auth_subjects** - Sujeitos de autenticação
   - Prefixo definido em: `lib/server/env.js` (`authentication_collections_prefix`)
   - Usada em: `lib/authorization/storage.js`
   - Valor padrão: `auth_subjects`

## Modificações Necessárias para Multi-Paciente

Para implementar o suporte multi-paciente, todas as coleções acima precisarão ser modificadas para incluir um campo `patientId`. As seguintes alterações serão necessárias:

1. **Modificação de Schema**:
   - Adicionar campo `patientId` a todas as coleções
   - Criar índices para o campo `patientId` em todas as coleções

2. **Modificação de Queries**:
   - Atualizar todas as operações de leitura para filtrar por `patientId`
   - Atualizar todas as operações de escrita para incluir `patientId`

3. **Pontos de Modificação Principais**:
   - `lib/storage/mongo-storage.js`: Ponto central para acesso às coleções
   - `lib/server/*.js`: Módulos específicos para cada tipo de dado
   - `lib/server/websocket.js`: Manipulação de operações em tempo real

## Nova Coleção de Pacientes

Além das modificações nas coleções existentes, será necessário criar uma nova coleção:

**patients** - Informações dos pacientes
   - Campos: `_id`, `name`, `phone`, `token`, `createdAt`, `tokenExpires`, `settings`
   - Índices: `{ token: 1 }`, `{ phone: 1 }`, `{ name: 1 }`

Esta coleção será o ponto central para gerenciar os pacientes no sistema multi-tenant.
