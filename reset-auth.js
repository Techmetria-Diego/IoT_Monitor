// SCRIPT DE RESET COMPLETO DO SISTEMA DE AUTENTICAÇÃO
// Execute no console do navegador para limpar todo o estado corrompido

console.log('🔄 INICIANDO RESET COMPLETO DO SISTEMA DE AUTENTICAÇÃO...');

// 1. Limpar todos os dados do localStorage relacionados à autenticação
const keysToRemove = [
  'monitor-agua-storage',
  'oauth_state', 
  'oauth_return_path',
  'isLoggedIn'
];

console.log('🧹 Limpando localStorage...');
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`  ❌ Removendo: ${key}`);
    localStorage.removeItem(key);
  }
});

// 2. Limpar sessionStorage também
console.log('🧹 Limpando sessionStorage...');
sessionStorage.clear();

// 3. Limpar quaisquer timers que possam estar rodando
if (window.tokenValidationTimer) {
  clearInterval(window.tokenValidationTimer);
  window.tokenValidationTimer = null;
  console.log('⏰ Timer de validação limpo');
}

// 4. Forçar reset do estado Zustand se possível
try {
  // Tentar acessar o store e resetar
  const storeElement = document.querySelector('[data-testid="app"]') || document.body;
  if (window.useAppStore) {
    // Se conseguimos acessar o store diretamente
    window.useAppStore.getState().disconnect();
    console.log('🔄 Estado Zustand resetado via store');
  }
} catch (e) {
  console.log('⚠️ Não foi possível resetar store Zustand diretamente');
}

// 5. Recarregar a página para garantir estado limpo
console.log('✅ RESET COMPLETO REALIZADO!');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. A página será recarregada em 3 segundos');
console.log('2. Vá para /settings');
console.log('3. Configure o Client ID novamente');
console.log('4. Tente conectar com o Google Drive');

// Countdown para reload
let countdown = 3;
const countdownInterval = setInterval(() => {
  console.log(`⏳ Recarregando em ${countdown}...`);
  countdown--;
  
  if (countdown < 0) {
    clearInterval(countdownInterval);
    console.log('🔄 Recarregando página...');
    window.location.reload();
  }
}, 1000);

// Função para cancelar o reload se necessário
window.cancelReload = () => {
  clearInterval(countdownInterval);
  console.log('❌ Reload cancelado');
};

console.log('💡 Para cancelar o reload: execute window.cancelReload()');