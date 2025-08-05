// DIAGNÓSTICO ESPECÍFICO DE SINCRONIZAÇÃO DE AUTENTICAÇÃO
// Execute no console para identificar problemas de sincronização

console.log('🔍 DIAGNÓSTICO DE SINCRONIZAÇÃO DE AUTENTICAÇÃO...');

// Função para verificar estado completo
const fullAuthCheck = () => {
  console.log('\n📊 ESTADO COMPLETO DE AUTENTICAÇÃO:');
  
  // 1. Sistema simples (AuthProvider)
  const simpleAuthState = localStorage.getItem('isLoggedIn');
  console.log('🔐 Sistema Simples (isLoggedIn):', simpleAuthState);
  
  // 2. Sistema Google Drive (Zustand)
  const zustandData = localStorage.getItem('monitor-agua-storage');
  let googleAuthState = null;
  if (zustandData) {
    try {
      const parsed = JSON.parse(zustandData);
      googleAuthState = {
        isConnected: parsed?.state?.isConnected,
        hasAccessToken: !!parsed?.state?.credentials?.accessToken,
        hasRefreshToken: !!parsed?.state?.credentials?.refreshToken,
        tokenExpiresAt: parsed?.state?.credentials?.tokenExpiresAt
      };
    } catch (e) {
      console.error('❌ Erro ao parsear Zustand data:', e);
    }
  }
  console.log('🔗 Sistema Google Drive (Zustand):', googleAuthState);
  
  // 3. Verificar se estão sincronizados
  const shouldBeLoggedIn = googleAuthState?.isConnected && googleAuthState?.hasAccessToken;
  const isCurrentlyLoggedIn = simpleAuthState === 'true';
  
  console.log('📋 ANÁLISE DE SINCRONIZAÇÃO:');
  console.log('  - Deveria estar logado (Google):', shouldBeLoggedIn);
  console.log('  - Está logado (Sistema simples):', isCurrentlyLoggedIn);
  console.log('  - Sincronizado:', shouldBeLoggedIn === isCurrentlyLoggedIn);
  
  if (shouldBeLoggedIn && !isCurrentlyLoggedIn) {
    console.log('🚨 PROBLEMA: Google conectado mas sistema simples não está logado!');
    return 'DESSINC_GOOGLE_OK_SIMPLE_NOK';
  } else if (!shouldBeLoggedIn && isCurrentlyLoggedIn) {
    console.log('🚨 PROBLEMA: Sistema simples logado mas Google não está conectado!');
    return 'DESSINC_SIMPLE_OK_GOOGLE_NOK';
  } else if (shouldBeLoggedIn && isCurrentlyLoggedIn) {
    console.log('✅ SUCESSO: Ambos os sistemas sincronizados e conectados');
    return 'SYNC_OK';
  } else {
    console.log('⚠️ INFO: Ambos os sistemas desconectados (estado esperado)');
    return 'SYNC_DISCONNECTED';
  }
};

// Função para forçar sincronização
const forceSyncAuth = () => {
  console.log('\n🔧 FORÇANDO SINCRONIZAÇÃO...');
  
  const zustandData = localStorage.getItem('monitor-agua-storage');
  if (zustandData) {
    try {
      const parsed = JSON.parse(zustandData);
      const state = parsed?.state;
      
      if (state?.isConnected && state?.credentials?.accessToken) {
        console.log('🔄 Google Drive conectado, forçando login no sistema simples...');
        localStorage.setItem('isLoggedIn', 'true');
        
        // Disparar evento de storage
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'isLoggedIn',
          newValue: 'true',
          oldValue: localStorage.getItem('isLoggedIn')
        }));
        
        console.log('✅ Sincronização forçada concluída');
      } else {
        console.log('⚠️ Google Drive não está conectado, não há nada para sincronizar');
      }
    } catch (e) {
      console.error('❌ Erro na sincronização forçada:', e);
    }
  } else {
    console.log('⚠️ Nenhum dado do Zustand encontrado');
  }
};

// Função para testar storage events
const testStorageEvents = () => {
  console.log('\n🧪 TESTANDO STORAGE EVENTS...');
  
  let eventReceived = false;
  
  const testHandler = (event) => {
    if (event.key === 'isLoggedIn') {
      eventReceived = true;
      console.log('✅ Storage event recebido:', {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue
      });
    }
  };
  
  window.addEventListener('storage', testHandler);
  
  // Simular mudança
  const oldValue = localStorage.getItem('isLoggedIn');
  localStorage.setItem('isLoggedIn', 'test-value');
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'isLoggedIn',
    newValue: 'test-value',
    oldValue: oldValue
  }));
  
  setTimeout(() => {
    // Restaurar valor original
    if (oldValue) {
      localStorage.setItem('isLoggedIn', oldValue);
    } else {
      localStorage.removeItem('isLoggedIn');
    }
    
    window.removeEventListener('storage', testHandler);
    
    if (eventReceived) {
      console.log('✅ Storage events funcionando corretamente');
    } else {
      console.log('❌ Storage events NÃO estão funcionando!');
    }
  }, 100);
};

// Função para simular login completo
const simulateCompleteLogin = async () => {
  console.log('\n🎭 SIMULANDO LOGIN COMPLETO...');
  
  // 1. Verificar se temos credenciais válidas
  const zustandData = localStorage.getItem('monitor-agua-storage');
  if (!zustandData) {
    console.log('❌ Nenhum dado do Zustand encontrado - precisa autenticar primeiro');
    return;
  }
  
  let parsed;
  try {
    parsed = JSON.parse(zustandData);
  } catch (e) {
    console.log('❌ Erro ao parsear dados do Zustand');
    return;
  }
  
  const state = parsed?.state;
  if (!state?.credentials?.accessToken) {
    console.log('❌ Nenhum token de acesso encontrado - precisa autenticar primeiro');
    return;
  }
  
  console.log('🔄 Testando token de acesso...');
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files/1Rv4SQ8yutdF71WGOltUoUdFT3eTEmMYA', {
      headers: {
        'Authorization': `Bearer ${state.credentials.accessToken}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Token válido, simulando login completo...');
      
      // Atualizar estado do Zustand
      parsed.state.isConnected = true;
      localStorage.setItem('monitor-agua-storage', JSON.stringify(parsed));
      
      // Atualizar sistema simples
      localStorage.setItem('isLoggedIn', 'true');
      
      // Disparar eventos
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'isLoggedIn',
        newValue: 'true',
        oldValue: 'false'
      }));
      
      console.log('✅ Login simulado concluído!');
      console.log('🔄 Recarregando página em 2 segundos...');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } else {
      console.log('❌ Token inválido ou expirado');
    }
  } catch (error) {
    console.log('❌ Erro ao testar token:', error);
  }
};

// Executar diagnóstico inicial
const diagResult = fullAuthCheck();

// Disponibilizar funções globalmente
window.fullAuthCheck = fullAuthCheck;
window.forceSyncAuth = forceSyncAuth;
window.testStorageEvents = testStorageEvents;
window.simulateCompleteLogin = simulateCompleteLogin;

console.log('\n✅ DIAGNÓSTICO CARREGADO!');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('  - window.fullAuthCheck() : Verificar estado completo');
console.log('  - window.forceSyncAuth() : Forçar sincronização');
console.log('  - window.testStorageEvents() : Testar eventos de storage');
console.log('  - window.simulateCompleteLogin() : Simular login completo');

// Sugestão baseada no diagnóstico
if (diagResult === 'DESSINC_GOOGLE_OK_SIMPLE_NOK') {
  console.log('\n💡 SUGESTÃO: Execute window.forceSyncAuth() para sincronizar');
} else if (diagResult === 'DESSINC_SIMPLE_OK_GOOGLE_NOK') {
  console.log('\n💡 SUGESTÃO: Reconecte com o Google Drive');
} else if (diagResult === 'SYNC_DISCONNECTED') {
  console.log('\n💡 SUGESTÃO: Tente autenticar com o Google Drive');
}