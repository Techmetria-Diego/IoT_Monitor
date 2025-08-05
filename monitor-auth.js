// MONITOR DE AUTENTICAÇÃO EM TEMPO REAL
// Execute no console para monitorar todo o fluxo OAuth

console.log('🔍 INICIANDO MONITOR DE AUTENTICAÇÃO...');

// Função para verificar estado atual
const checkCurrentState = () => {
  console.log('\n📊 ESTADO ATUAL DA APLICAÇÃO:');
  
  // LocalStorage
  const storage = localStorage.getItem('monitor-agua-storage');
  if (storage) {
    try {
      const data = JSON.parse(storage);
      const state = data?.state;
      console.log('📦 Zustand Store:', {
        isConnected: state?.isConnected,
        isLoading: state?.isLoading,
        hasError: !!state?.error,
        errorMessage: state?.error?.message,
        hasAccessToken: !!state?.credentials?.accessToken,
        hasRefreshToken: !!state?.credentials?.refreshToken,
        periodsCount: state?.periods?.length || 0
      });
    } catch (e) {
      console.log('❌ Erro ao parsear store:', e);
    }
  } else {
    console.log('⚠️ Nenhum estado Zustand encontrado');
  }
  
  // LocalStorage simples
  console.log('🗂️ LocalStorage OAuth:', {
    oauth_state: localStorage.getItem('oauth_state'),
    oauth_return_path: localStorage.getItem('oauth_return_path'),
    isLoggedIn: localStorage.getItem('isLoggedIn')
  });
  
  // URL atual
  console.log('🌐 Contexto:', {
    currentPath: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });
};

// Monitor de mudanças no localStorage
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
  console.log(`📝 [STORAGE] SET: ${key} = ${key.includes('oauth') || key === 'isLoggedIn' ? value : '[hidden]'}`);
  return originalSetItem.call(this, key, value);
};

localStorage.removeItem = function(key) {
  console.log(`🗑️ [STORAGE] REMOVE: ${key}`);
  return originalRemoveItem.call(this, key);
};

// Monitor de mudanças na URL
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    console.log(`🌐 [URL] Mudança: ${lastUrl} → ${window.location.href}`);
    lastUrl = window.location.href;
    
    // Se entramos no callback, fazer debug
    if (window.location.pathname === '/auth/callback') {
      console.log('🔄 [MONITOR] Entramos no callback, aguardando processamento...');
      setTimeout(checkCurrentState, 1000);
    }
  }
});

urlObserver.observe(document.body, { childList: true, subtree: true });

// Monitor de erros não capturados
window.addEventListener('error', (event) => {
  console.error('🚨 [MONITOR] Erro não capturado:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 [MONITOR] Promise rejeitada:', event.reason);
});

// Interceptar console.error para capturar erros do sistema
const originalConsoleError = console.error;
console.error = function(...args) {
  if (args[0] && args[0].includes && (args[0].includes('[CALLBACK]') || args[0].includes('[STORE]'))) {
    console.log('🚨 [MONITOR] Erro crítico detectado:', args);
  }
  return originalConsoleError.apply(console, args);
};

// Verificar estado inicial
checkCurrentState();

// Função para forçar verificação manual
window.checkAuthState = checkCurrentState;

// Função para testar conexão manual
window.testManualConnection = async () => {
  console.log('🧪 [TEST] Iniciando teste manual de conexão...');
  
  const storage = localStorage.getItem('monitor-agua-storage');
  if (!storage) {
    console.log('❌ [TEST] Nenhum estado encontrado');
    return;
  }
  
  try {
    const data = JSON.parse(storage);
    const credentials = data?.state?.credentials;
    
    if (!credentials?.accessToken) {
      console.log('❌ [TEST] Nenhum token de acesso encontrado');
      return;
    }
    
    console.log('🔄 [TEST] Testando acesso à pasta principal...');
    const response = await fetch('https://www.googleapis.com/drive/v3/files/1Rv4SQ8yutdF71WGOltUoUdFT3eTEmMYA', {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [TEST] Acesso à pasta bem-sucedido:', data.name);
    } else {
      const error = await response.json();
      console.error('❌ [TEST] Erro no acesso:', error);
    }
  } catch (e) {
    console.error('❌ [TEST] Erro no teste:', e);
  }
};

console.log('✅ MONITOR ATIVO!');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('  - window.checkAuthState() : Verificar estado atual');
console.log('  - window.testManualConnection() : Testar conexão manual');
console.log('🔍 Agora tente o fluxo de autenticação e observe os logs...');