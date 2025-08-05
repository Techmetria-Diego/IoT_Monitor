// Debug script para diagnosticar problemas OAuth Google Drive
// Execute no console do navegador (F12) para diagnosticar problemas

console.log('🔍 === DIAGNÓSTICO OAUTH GOOGLE DRIVE ===');

// 1. Verificar configuração atual
const debugOAuth = () => {
  console.log('\n1. 📋 VERIFICANDO CONFIGURAÇÃO ATUAL:');
  
  // Verificar localStorage
  const storage = localStorage.getItem('monitor-agua-storage');
  if (storage) {
    try {
      const data = JSON.parse(storage);
      const state = data?.state;
      console.log('✅ Estado atual do app:', {
        isConnected: state?.isConnected,
        hasAccessToken: !!state?.credentials?.accessToken,
        hasClientId: !!state?.credentials?.clientId,
        clientId: state?.credentials?.clientId?.substring(0, 20) + '...',
        tokenExpiresAt: state?.credentials?.tokenExpiresAt ? new Date(state?.credentials?.tokenExpiresAt).toISOString() : 'N/A'
      });
    } catch (e) {
      console.error('❌ Erro ao parsear localStorage:', e);
    }
  } else {
    console.log('⚠️ Nenhum estado salvo encontrado');
  }
  
  // Verificar URL atual
  console.log('🌐 URL atual:', window.location.href);
  console.log('🔗 Redirect URI que seria usado:', window.location.origin + '/auth/callback');
  
  // Verificar parâmetros da URL se estiver no callback
  if (window.location.pathname === '/auth/callback') {
    console.log('\n2. 🔄 ANÁLISE DO CALLBACK:');
    console.log('Query params:', window.location.search);
    console.log('Hash params:', window.location.hash);
    
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      console.log('📝 Parâmetros encontrados:');
      for (const [key, value] of params) {
        console.log(`  ${key}: ${key === 'code' ? value.substring(0, 20) + '...' : value}`);
      }
    }
    
    // Verificar estado OAuth
    const oauthState = localStorage.getItem('oauth_state');
    console.log('🔐 OAuth state armazenado:', oauthState);
  }
};

// 2. Testar conectividade básica
const testGoogleAPI = async () => {
  console.log('\n3. 🌐 TESTANDO CONECTIVIDADE:');
  
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'HEAD'
    });
    console.log('✅ Google APIs acessível:', response.status);
  } catch (e) {
    console.error('❌ Erro de conectividade:', e);
  }
};

// 3. Simular fluxo OAuth para teste
const simulateOAuthFlow = (clientId) => {
  if (!clientId) {
    console.error('❌ Client ID necessário para simulação');
    return;
  }
  
  console.log('\n4. 🎭 SIMULANDO FLUXO OAUTH:');
  const redirectUri = window.location.origin + '/auth/callback';
  const state = window.location.pathname;
  
  console.log('📤 Parâmetros que seriam enviados:');
  console.log({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.readonly');
  oauthUrl.searchParams.set('state', state);
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  
  console.log('🔗 URL OAuth completa:', oauthUrl.toString());
  console.log('➡️  Para testar, copie esta URL no navegador');
};

// 4. Interceptar chamadas de API
const interceptAPIRequests = () => {
  console.log('\n5. 🕵️ INTERCEPTANDO REQUISIÇÕES API:');
  
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (typeof url === 'string' && (url.includes('googleapis.com') || url.includes('oauth2.googleapis.com'))) {
      console.log('📡 API Request:', {
        url: url,
        method: options?.method || 'GET',
        headers: options?.headers || {},
        body: options?.body
      });
      
      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();
        
        if (!response.ok) {
          const errorText = await clonedResponse.text();
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        } else {
          console.log('✅ API Success:', response.status);
        }
        
        return response;
      } catch (error) {
        console.error('❌ Network Error:', error);
        throw error;
      }
    }
    
    return originalFetch(...args);
  };
  
  console.log('✅ Interceptor ativado - todas as chamadas para Google APIs serão logadas');
};

// Executar diagnóstico
debugOAuth();
testGoogleAPI();
interceptAPIRequests();

// Função auxiliar para obter clientId atual
const getCurrentClientId = () => {
  const storage = localStorage.getItem('monitor-agua-storage');
  if (storage) {
    try {
      const data = JSON.parse(storage);
      return data?.state?.credentials?.clientId;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const clientId = getCurrentClientId();
if (clientId) {
  simulateOAuthFlow(clientId);
} else {
  console.log('\n⚠️ Client ID não encontrado. Configure primeiro em /settings');
}

console.log('\n🎯 PRÓXIMOS PASSOS PARA DIAGNÓSTICO:');
console.log('1. Se estiver na página /settings, configure o Client ID e tente conectar');
console.log('2. Se estiver na página /auth/callback, verifique os parâmetros acima');
console.log('3. Todas as requisições Google APIs serão interceptadas e logadas');
console.log('4. Execute testTokenExchange(code, clientId) se tiver um código de autorização');

// Função para testar troca de código por token
window.testTokenExchange = async (code, clientId) => {
  console.log('\n🔄 TESTANDO TROCA DE CÓDIGO POR TOKEN:');
  
  if (!code || !clientId) {
    console.error('❌ Código e Client ID são obrigatórios');
    return;
  }
  
  const redirectUri = window.location.origin + '/auth/callback';
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        redirect_uri: redirectUri,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Token exchange bem-sucedido!', {
        access_token: data.access_token?.substring(0, 20) + '...',
        refresh_token: !!data.refresh_token,
        expires_in: data.expires_in
      });
    } else {
      console.error('❌ Erro na troca de token:', data);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
};

console.log('\n✅ Debug script carregado! Verifique os logs acima.');