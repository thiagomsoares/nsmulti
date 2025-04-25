# Nightscout Multi-Paciente

## Visão Geral

O módulo Nightscout Multi-Paciente é uma extensão para o Nightscout CGM Remote Monitor que permite gerenciar múltiplos pacientes em uma única instância. Esta implementação permite que profissionais de saúde, clínicas e hospitais monitorem vários pacientes com diabetes através de uma única instalação do Nightscout.

![Nightscout Multi-Paciente](https://cloud.githubusercontent.com/assets/751143/8425633/93c94dc0-1ebc-11e5-99e7-71a8f464caac.png)

## Funcionalidades

- **Gerenciamento de Múltiplos Pacientes**: Crie, visualize e gerencie vários pacientes em uma única instância.
- **Autenticação Segura**: Sistema de autenticação baseado em tokens JWT para pacientes e administradores.
- **Filtro de Dados por Paciente**: Visualize dados específicos de cada paciente de forma isolada.
- **Migração de Dados**: Ferramentas para migrar uma instalação existente do Nightscout para o modo multi-paciente.
- **Segurança e Observabilidade**: Logs detalhados, métricas e testes de segurança automatizados.

## Requisitos do Sistema

- Node.js 16.x (recomendado) ou 14.x
- MongoDB 4.x ou superior
- Nightscout 15.x ou superior

## Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório | Valor Padrão |
|----------|-----------|-------------|--------------|
| `MONGODB_URI` | URI de conexão com MongoDB | Sim | `mongodb://localhost:27017/nightscout-multi` |
| `ADMIN_API_SECRET` | Chave secreta para administração | Sim | - |
| `ENABLE_MULTI_PATIENT` | Habilita suporte multi-paciente | Sim | `true` |
| `LOG_LEVEL` | Nível de log | Não | `info` |
| `RUN_SECURITY_TESTS` | Executa testes de segurança na inicialização | Não | `false` |

### Importante: Configuração do MongoDB

Ao configurar a conexão com o MongoDB, é essencial incluir o parâmetro `authSource` se o usuário foi criado em um banco diferente:

```
MONGODB_URI=mongodb://usuario:senha@host:porta/nightscout?authSource=admin&tls=false
```

Onde:
- `usuario:senha`: Credenciais de acesso ao MongoDB
- `host:porta`: Endereço e porta do servidor MongoDB
- `nightscout`: Nome do banco de dados
- `authSource=admin`: Indica que o usuário foi criado no banco `admin` (ajuste conforme necessário)
- `tls=false`: Desativa TLS para conexões locais (em produção, considere usar TLS)

## Problemas Resolvidos

Durante o desenvolvimento, identificamos e corrigimos os seguintes problemas:

1. **Falha na Conexão com MongoDB**: 
   - **Problema**: O MongoDB não conseguia autenticar o usuário.
   - **Solução**: Adicionamos o parâmetro `authSource=admin` na URI de conexão, pois o usuário foi criado no banco `admin`.
   - **Implementação**: Modificamos o arquivo `.env` para incluir o parâmetro correto.

2. **Timeouts no Mongoose**: 
   - **Problema**: O Mongoose estava apresentando timeouts durante operações de criação e busca de pacientes.
   - **Solução**: Implementamos funções alternativas usando o driver MongoDB nativo, que oferece mais controle sobre os timeouts.
   - **Implementação**: Criamos as funções `createPatientDirect` e `getPatientById` no arquivo `lib/models/patient-service.js`.

3. **Verificação de Token de Administrador**:
   - **Problema**: A função `checkAdminToken` não estava recuperando corretamente o token de administrador.
   - **Solução**: Atualizamos a função para buscar o token de `env.settings.admin_token` ou `process.env.ADMIN_API_SECRET`.
   - **Implementação**: Modificamos a função no arquivo `lib/middleware/patient-routes.js`.

## API

### Endpoints

#### Pacientes

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/api/v1/patients` | Admin | Criar novo paciente |
| GET | `/api/v1/patients` | Admin | Listar todos os pacientes |
| GET | `/api/v1/patients/:id` | Admin | Obter paciente específico |
| PATCH | `/api/v1/patients/:id` | Admin | Atualizar paciente |
| DELETE | `/api/v1/patients/:id` | Admin | Desativar paciente |

### Autenticação

#### Admin
- Tipo: API_SECRET
- Header: `Authorization`
- Formato: `Bearer {secret}`

#### Paciente
- Tipo: JWT
- Algoritmo: RS256
- Header: `Authorization`
- Formato: `Bearer {token}`
- Expiração: 90 dias

## Modelo de Dados

### Coleção `patients`

```javascript
{
  name: String,          // Nome do paciente
  phone: String,         // Telefone do paciente
  token: String,         // Token JWT para autenticação
  createdAt: Date,       // Data de criação
  tokenExpires: Date,    // Data de expiração do token
  settings: Object,      // Configurações personalizadas
  active: Boolean        // Status do paciente
}
```

### Campos adicionados às coleções existentes

Todas as coleções de dados do Nightscout (`entries`, `treatments`, `devicestatus`, etc.) recebem um campo adicional `patientId` para identificar a qual paciente os dados pertencem.

## Guia de Instalação

### Instalação em Ambiente Local

1. Clone o repositório:
   ```
   git clone https://github.com/thiagomsoares/nsmulti.git
   cd nsmulti
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   ADMIN_API_SECRET=sua_chave_secreta
   MONGODB_URI=mongodb://usuario:senha@host:porta/nightscout?authSource=admin&tls=false
   NODE_ENV=development
   PORT=3000
   ENABLE_MULTI_PATIENT=true
   ```

4. Execute o servidor:
   ```
   node -r dotenv/config lib/server/server.js
   ```

### Instalação com Docker

1. Construa a imagem Docker:
   ```
   docker build -t nightscout-multi .
   ```

2. Execute o contêiner:
   ```
   docker run -p 3000:3000 --env-file .env nightscout-multi
   ```

## Guia de Testes

### Criação de Paciente

Para criar um novo paciente, use o seguinte comando curl:

```bash
curl -X POST http://localhost:3000/api/v1/patients \
  -H "Authorization: Bearer a7d8e9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6" \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","phone":"11999998888"}'
```

Resposta esperada:
```json
{
  "status": "success",
  "id": "60f1a2b3c4d5e6f7g8h9i0j1",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Listagem de Pacientes

Para listar todos os pacientes:

```bash
curl -X GET http://localhost:3000/api/v1/patients \
  -H "Authorization: Bearer a7d8e9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6"
```

Resposta esperada:
```json
{
  "status": "success",
  "patients": [
    {
      "_id": "60f1a2b3c4d5e6f7g8h9i0j1",
      "name": "João Silva",
      "phone": "11999998888",
      "createdAt": "2025-04-25T11:30:00.000Z",
      "active": true
    }
  ]
}
```

### Busca de Paciente por ID

Para buscar um paciente específico:

```bash
curl -X GET http://localhost:3000/api/v1/patients/60f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer a7d8e9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6"
```

Resposta esperada:
```json
{
  "status": "success",
  "patient": {
    "id": "60f1a2b3c4d5e6f7g8h9i0j1",
    "name": "João Silva",
    "phone": "11999998888",
    "createdAt": "2025-04-25T11:30:00.000Z",
    "active": true
  }
}
```

### Acesso aos Dados do Paciente

Para acessar os dados do paciente, use o token JWT retornado na criação:

```bash
curl -X GET http://localhost:3000/api/v1/entries \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Migração de Dados

Para migrar uma instalação existente do Nightscout para o modo multi-paciente:

1. Faça backup de todas as coleções:
   ```
   node bin/migrate.js backup
   ```

2. Adicione o campo `patientId` a todos os documentos:
   ```
   node bin/migrate.js update --patientId=default
   ```

3. Crie índices para o campo `patientId`:
   ```
   node bin/migrate.js index
   ```

## Solução de Problemas

### Erro de Autenticação no MongoDB

Se encontrar erros de autenticação ao conectar ao MongoDB, verifique:

1. Se as credenciais estão corretas
2. Se o parâmetro `authSource` está configurado corretamente
3. Se o usuário tem permissões de leitura e escrita no banco de dados

### Timeout ao Criar ou Consultar Pacientes

Se encontrar erros de timeout ao trabalhar com pacientes:

1. Verifique a conexão com o MongoDB
2. Aumente os timeouts de conexão nas configurações
3. Verifique se o banco de dados está acessível e respondendo

### Logs para Depuração

Para obter mais informações sobre erros, verifique os logs do servidor:

```bash
tail -f logs/error.log
```

## Segurança

O módulo multi-paciente implementa várias camadas de segurança:

- **Autenticação**: Tokens JWT para pacientes e API_SECRET para administradores
- **Autorização**: Verificação de permissões em cada requisição
- **Limitação de Taxa**: Proteção contra ataques de força bruta
- **Logs de Segurança**: Registro detalhado de eventos de segurança
- **Métricas**: Monitoramento de tentativas de acesso não autorizado

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## Licença

Este projeto é licenciado sob a [Licença AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html).
