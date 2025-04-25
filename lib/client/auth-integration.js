// Integração dos scripts de autenticação na UI do Nightscout

// Este arquivo deve ser adicionado ao bundle.js do Nightscout
// para integrar o suporte a autenticação baseada em token

(function () {
  'use strict';
  
  // Função para adicionar os scripts de autenticação à página
  function addAuthScripts() {
    // Adiciona o script de autenticação por token
    const tokenAuthScript = document.createElement('script');
    tokenAuthScript.src = '/token-auth.js';
    tokenAuthScript.async = false;
    document.head.appendChild(tokenAuthScript);
    
    // Adiciona o script da UI de login
    const loginUIScript = document.createElement('script');
    loginUIScript.src = '/patient-login-ui.js';
    loginUIScript.async = false;
    document.head.appendChild(loginUIScript);
  }
  
  // Função para adicionar CSS personalizado
  function addAuthStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .patient-auth-status {
        font-weight: bold;
      }
      
      #patient-login-modal .modal-dialog {
        margin-top: 100px;
      }
      
      #patient-login-modal .login-error {
        margin-top: 0;
        margin-bottom: 15px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Inicializa quando o documento estiver pronto
  $(document).ready(function() {
    // Verifica se o modo multi-paciente está ativado
    const isMultiPatientEnabled = $('body').data('multi-patient-enabled') === true;
    
    if (isMultiPatientEnabled) {
      // Adiciona os scripts de autenticação
      addAuthScripts();
      
      // Adiciona estilos personalizados
      addAuthStyles();
      
      console.log('Suporte a autenticação multi-paciente inicializado');
    }
  });
})();
