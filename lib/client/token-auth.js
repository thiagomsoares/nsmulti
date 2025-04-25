// Modificações na UI para suportar autenticação baseada em token

// Arquivo para modificar o comportamento de autenticação na UI
// para suportar o novo sistema de token JWT para múltiplos pacientes

(function () {
  'use strict';
  
  // Armazena o token no localStorage
  function storeToken(token) {
    if (token) {
      localStorage.setItem('nightscout_patient_token', token);
      console.log('Token armazenado com sucesso');
      return true;
    }
    return false;
  }
  
  // Recupera o token do localStorage
  function getToken() {
    return localStorage.getItem('nightscout_patient_token');
  }
  
  // Remove o token do localStorage
  function removeToken() {
    localStorage.removeItem('nightscout_patient_token');
    console.log('Token removido');
  }
  
  // Verifica se o token está presente
  function hasToken() {
    return !!getToken();
  }
  
  // Adiciona o token ao cabeçalho de uma requisição
  function addTokenToRequest(xhr) {
    const token = getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    }
  }
  
  // Extrai o token da URL se presente
  function extractTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Armazena o token e remove da URL para evitar compartilhamento acidental
      storeToken(token);
      
      // Remove o parâmetro token da URL sem recarregar a página
      const newUrl = window.location.pathname + 
                    (urlParams.toString() ? '?' + urlParams.toString() : '') +
                    window.location.hash;
      
      window.history.replaceState({}, document.title, newUrl);
      return true;
    }
    
    return false;
  }
  
  // Inicializa o sistema de autenticação baseada em token
  function initTokenAuth() {
    console.log('Inicializando autenticação baseada em token');
    
    // Verifica se há um token na URL
    const tokenExtracted = extractTokenFromUrl();
    
    // Modifica o comportamento do jQuery.ajax para adicionar o token a todas as requisições
    const originalAjax = $.ajax;
    $.ajax = function(options) {
      const originalBeforeSend = options.beforeSend;
      
      options.beforeSend = function(xhr) {
        // Adiciona o token ao cabeçalho Authorization
        addTokenToRequest(xhr);
        
        // Chama o beforeSend original se existir
        if (originalBeforeSend) {
          originalBeforeSend.apply(this, arguments);
        }
      };
      
      return originalAjax.apply(this, arguments);
    };
    
    // Modifica o comportamento do socket.io para adicionar o token
    const originalConnect = io.connect;
    io.connect = function(url, options) {
      options = options || {};
      options.auth = options.auth || {};
      
      // Adiciona o token à autenticação do socket
      const token = getToken();
      if (token) {
        options.auth.token = token;
      }
      
      return originalConnect.call(this, url, options);
    };
    
    // Adiciona interface para gerenciamento de token
    window.Nightscout = window.Nightscout || {};
    window.Nightscout.tokenAuth = {
      hasToken: hasToken,
      getToken: getToken,
      storeToken: storeToken,
      removeToken: removeToken
    };
    
    // Se extraímos um token da URL, recarrega a página para aplicar a autenticação
    if (tokenExtracted) {
      console.log('Token extraído da URL, recarregando para aplicar autenticação');
      setTimeout(function() {
        window.location.reload();
      }, 100);
    }
  }
  
  // Inicializa quando o documento estiver pronto
  $(document).ready(function() {
    initTokenAuth();
  });
})();
