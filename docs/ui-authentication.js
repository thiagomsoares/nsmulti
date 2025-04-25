// Documentação da UI de Autenticação por Token

/**
 * # Autenticação por Token na UI do Nightscout
 * 
 * Este documento descreve como a autenticação por token foi implementada
 * na interface do usuário do Nightscout para suportar múltiplos pacientes.
 * 
 * ## Arquivos Implementados
 * 
 * 1. **token-auth.js**: Implementa o sistema base de autenticação por token
 * 2. **patient-login-ui.js**: Implementa a interface de login para pacientes
 * 3. **auth-integration.js**: Integra os scripts de autenticação na página
 * 4. **auth-scripts.js**: Configura o servidor para servir os scripts
 * 
 * ## Fluxo de Autenticação
 * 
 * 1. O usuário acessa a página do Nightscout
 * 2. O sistema verifica se há um token na URL ou no localStorage
 * 3. Se não houver token, exibe o botão de login na barra de navegação
 * 4. O usuário clica no botão de login e insere seu token
 * 5. O token é armazenado no localStorage
 * 6. Todas as requisições subsequentes incluem o token no cabeçalho Authorization
 * 
 * ## Integração com o Servidor
 * 
 * O servidor foi modificado para:
 * 
 * 1. Servir os scripts de autenticação
 * 2. Injetar atributos data-* na página HTML
 * 3. Incluir o script de integração automaticamente
 * 
 * ## Uso do Token
 * 
 * O token é usado de três formas:
 * 
 * 1. **Requisições AJAX**: Adicionado como cabeçalho Authorization
 * 2. **WebSockets**: Adicionado na autenticação do socket
 * 3. **URL**: Pode ser passado como parâmetro de query para login inicial
 * 
 * ## Segurança
 * 
 * 1. O token é armazenado apenas no localStorage do navegador
 * 2. O token é removido da URL após ser extraído
 * 3. O token nunca é enviado em texto plano (sempre via HTTPS)
 * 4. O token pode ser revogado pelo administrador
 * 
 * ## Compatibilidade
 * 
 * A implementação mantém compatibilidade com:
 * 
 * 1. Clientes existentes que usam API_SECRET
 * 2. Aplicativos móveis que podem passar o token via URL
 * 3. Diferentes navegadores e dispositivos
 */
