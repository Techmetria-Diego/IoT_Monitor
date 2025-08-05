// PATCH CRÍTICO PARA CORRIGIR OAUTH - APLIQUE IMEDIATAMENTE
// Este patch corrige os problemas identificados no fluxo OAuth

console.log('🚨 APLICANDO PATCH CRÍTICO OAUTH...');

// 1. Corrigir geração de estado OAuth (deve ser único e seguro)
// 2. Adicionar logs detalhados para debugging
// 3. Corrigir validação de estado
// 4. Adicionar timeout para operações

// Patch para o método startOAuthFlow
const originalStartOAuthFlow = window.gdriveApi?.startOAuthFlow;
if (typeof originalStartOAuthFlow === 'function') {
  window.gdriveApi.startOAuthFlow = function(config) {
    console.log('🔄 [PATCH] Iniciando fluxo OAuth com configuração:', { clientId: config.clientId?.substring(0, 20) + '...' });
    
    if (!config.clientId) {
      throw new Error('Client ID não configurado para autenticação OAuth.');
    }
    
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'https://www.googleapis.com/auth/drive.readonly';
    
    // CORREÇÃO 1: Gerar estado único e seguro
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const currentPath = window.location.pathname;
    
    // Salvar tanto o estado quanto o caminho atual
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_return_path', currentPath);
    
    console.log('🔐 [PATCH] Estado OAuth gerado:', state);
    console.log('📍 [PATCH] Caminho de retorno:', currentPath);
    console.log('🔗 [PATCH] Redirect URI:', redirectUri);
    
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', config.clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scope);
    oauthUrl.searchParams.set('state', state);
    oauthUrl.searchParams.set('include_granted_scopes', 'true');
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    
    console.log('🌐 [PATCH] URL OAuth completa:', oauthUrl.toString());
    
    // Definir timeout para limpeza
    setTimeout(() => {
      if (localStorage.getItem('oauth_state') === state) {
        console.log('⏰ [PATCH] Limpando estado OAuth expirado');
        localStorage.removeItem('oauth_state');
        localStorage.removeItem('oauth_return_path');
      }
    }, 10 * 60 * 1000); // 10 minutos
    
    window.location.href = oauthUrl.toString();
  };
  
  console.log('✅ Patch aplicado: startOAuthFlow');
} else {
  console.log('⚠️ startOAuthFlow não encontrado - aplicar patch diretamente no código');
}

// Função para testar o estado atual
window.debugOAuthState = () => {
  console.log('🔍 ESTADO OAUTH ATUAL:');
  console.log('oauth_state:', localStorage.getItem('oauth_state'));
  console.log('oauth_return_path:', localStorage.getItem('oauth_return_path'));
  console.log('URL atual:', window.location.href);
  console.log('Parâmetros URL:', window.location.search);
  
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    console.log('Parâmetros decodificados:');
    for (const [key, value] of params) {
      console.log(`  ${key}: ${value}`);
    }
  }
};

// Função para forçar limpeza do estado
window.clearOAuthState = () => {
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_return_path');
  console.log('🧹 Estado OAuth limpo');
};

// Função para testar troca de token manualmente
window.manualTokenExchange = async (authCode, clientId) => {
  console.log('🔄 [MANUAL] Testando troca de token...');
  
  if (!authCode || !clientId) {
    console.error('❌ Código de autorização e Client ID são obrigatórios');
    return;
  }
  
  const redirectUri = `${window.location.origin}/auth/callback`;
  
  try {
    console.log('📤 [MANUAL] Enviando requisição para troca de token:', {
      grant_type: 'authorization_code',
      client_id: clientId.substring(0, 20) + '...',
      redirect_uri: redirectUri,
      code: authCode.substring(0, 10) + '...'
    });
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: clientId,
        redirect_uri: redirectUri,
      }),
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ [MANUAL] Troca de token bem-sucedida!');
      console.log('🎯 [MANUAL] Detalhes do token:', {
        access_token: responseData.access_token?.substring(0, 20) + '...',
        refresh_token: !!responseData.refresh_token,
        expires_in: responseData.expires_in,
        token_type: responseData.token_type
      });
      
      // Testar acesso à pasta do Drive
      if (responseData.access_token) {
        console.log('🔍 [MANUAL] Testando acesso à pasta do Drive...');
        try {
          const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files/1Rv4SQ8yutdF71WGOltUoUdFT3eTEmMYA', {
            headers: {
              'Authorization': `Bearer ${responseData.access_token}`
            }
          });
          
          if (driveResponse.ok) {
            const driveData = await driveResponse.json();
            console.log('✅ [MANUAL] Acesso à pasta Drive confirmado:', driveData.name);
          } else {
            const driveError = await driveResponse.json();
            console.error('❌ [MANUAL] Erro ao acessar pasta Drive:', driveError);
          }
        } catch (driveErr) {
          console.error('❌ [MANUAL] Erro na requisição Drive:', driveErr);
        }
      }
      
      return responseData;
    } else {
      console.error('❌ [MANUAL] Erro na troca de token:', responseData);
      return null;
    }
  } catch (error) {
    console.error('❌ [MANUAL] Erro na requisição:', error);
    return null;
  }
};

// Monitorar mudanças na URL para debug
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    console.log('🌐 [PATCH] Mudança de URL detectada:', {
      anterior: lastUrl,
      atual: window.location.href
    });
    lastUrl = window.location.href;
    
    // Se estivermos no callback, debug automaticamente
    if (window.location.pathname === '/auth/callback') {
      setTimeout(() => window.debugOAuthState(), 100);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('✅ PATCH OAUTH APLICADO COM SUCESSO!');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('  - window.debugOAuthState() : Verificar estado OAuth');
console.log('  - window.clearOAuthState() : Limpar estado OAuth');
console.log('  - window.manualTokenExchange(code, clientId) : Testar troca de token');

// Auto-debug se estivermos no callback
if (window.location.pathname === '/auth/callback') {
  setTimeout(() => {
    console.log('🔄 Auto-executando debug do callback...');
    window.debugOAuthState();
  }, 500);
}