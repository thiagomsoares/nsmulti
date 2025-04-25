// Componente de login baseado em token para a UI do Nightscout

(function () {
  'use strict';
  
  // Template HTML para o modal de login
  const loginModalTemplate = `
    <div id="patient-login-modal" class="modal fade" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <h4 class="modal-title">Login de Paciente</h4>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger login-error" style="display: none;"></div>
            <form id="patient-login-form">
              <div class="form-group">
                <label for="patient-token">Token de Acesso</label>
                <input type="text" class="form-control" id="patient-token" placeholder="Cole seu token de acesso aqui">
                <p class="help-block">O token foi fornecido pelo seu administrador.</p>
              </div>
              <div class="checkbox">
                <label>
                  <input type="checkbox" id="remember-token" checked> Lembrar meu token neste dispositivo
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="patient-login-button">Entrar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Adiciona o modal de login ao DOM
  function addLoginModal() {
    $('body').append(loginModalTemplate);
    
    // Configura o handler de login
    $('#patient-login-button').click(function() {
      const token = $('#patient-token').val().trim();
      const remember = $('#remember-token').is(':checked');
      
      if (!token) {
        showLoginError('Por favor, insira um token válido.');
        return;
      }
      
      // Armazena o token
      if (window.Nightscout && window.Nightscout.tokenAuth) {
        window.Nightscout.tokenAuth.storeToken(token);
        
        // Fecha o modal
        $('#patient-login-modal').modal('hide');
        
        // Recarrega a página para aplicar a autenticação
        setTimeout(function() {
          window.location.reload();
        }, 500);
      } else {
        showLoginError('Erro interno: Sistema de autenticação não inicializado.');
      }
    });
    
    // Permite submeter o formulário pressionando Enter
    $('#patient-login-form').on('submit', function(e) {
      e.preventDefault();
      $('#patient-login-button').click();
    });
  }
  
  // Exibe mensagem de erro no modal de login
  function showLoginError(message) {
    const $error = $('.login-error');
    $error.text(message);
    $error.show();
  }
  
  // Adiciona botão de login à barra de navegação
  function addLoginButton() {
    const $navbarRight = $('.navbar-right');
    
    if ($navbarRight.length) {
      // Verifica se já está autenticado
      const isAuthenticated = window.Nightscout && 
                             window.Nightscout.tokenAuth && 
                             window.Nightscout.tokenAuth.hasToken();
      
      if (isAuthenticated) {
        // Adiciona botão de logout
        $navbarRight.prepend(`
          <li class="patient-auth-status">
            <a href="#" id="patient-logout-button">
              <i class="glyphicon glyphicon-log-out"></i> Sair
            </a>
          </li>
        `);
        
        // Configura o handler de logout
        $('#patient-logout-button').click(function(e) {
          e.preventDefault();
          
          if (window.Nightscout && window.Nightscout.tokenAuth) {
            window.Nightscout.tokenAuth.removeToken();
            
            // Recarrega a página
            window.location.reload();
          }
        });
      } else {
        // Adiciona botão de login
        $navbarRight.prepend(`
          <li class="patient-auth-status">
            <a href="#" id="patient-login-button-nav">
              <i class="glyphicon glyphicon-log-in"></i> Entrar
            </a>
          </li>
        `);
        
        // Configura o handler para abrir o modal de login
        $('#patient-login-button-nav').click(function(e) {
          e.preventDefault();
          $('#patient-login-modal').modal('show');
        });
      }
    }
  }
  
  // Inicializa a UI de autenticação
  function initAuthUI() {
    // Adiciona o modal de login
    addLoginModal();
    
    // Adiciona o botão de login/logout à barra de navegação
    addLoginButton();
    
    // Se não estiver autenticado e a configuração exigir autenticação, mostra o modal de login
    const requireAuth = $('body').data('require-auth') === true;
    const isAuthenticated = window.Nightscout && 
                           window.Nightscout.tokenAuth && 
                           window.Nightscout.tokenAuth.hasToken();
    
    if (requireAuth && !isAuthenticated) {
      $('#patient-login-modal').modal({
        backdrop: 'static', // Não fecha ao clicar fora
        keyboard: false     // Não fecha com ESC
      });
    }
  }
  
  // Inicializa quando o documento estiver pronto e após o token-auth.js
  $(document).ready(function() {
    // Aguarda a inicialização do sistema de token
    const checkInterval = setInterval(function() {
      if (window.Nightscout && window.Nightscout.tokenAuth) {
        clearInterval(checkInterval);
        initAuthUI();
      }
    }, 100);
    
    // Timeout de segurança após 5 segundos
    setTimeout(function() {
      clearInterval(checkInterval);
      if (!window.Nightscout || !window.Nightscout.tokenAuth) {
        console.error('Sistema de autenticação por token não inicializado');
      }
    }, 5000);
  });
})();
