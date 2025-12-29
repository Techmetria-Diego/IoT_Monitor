import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/auth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const handleAuthenticationCallback = useAppStore(
    (state) => state.handleAuthenticationCallback,
  )

  useEffect(() => {
    const processAuth = async () => {
      console.log('🔄 [CALLBACK] Processando callback de autenticação...')
      console.log('🌐 [CALLBACK] URL atual:', window.location.href)
      console.log('📋 [CALLBACK] Search params:', window.location.search)
      console.log('📋 [CALLBACK] Hash params:', window.location.hash)
      
      // Debug completo do localStorage
      console.log('🗂️ [CALLBACK] Estado localStorage:')
      console.log('  - oauth_state:', localStorage.getItem('oauth_state'))
      console.log('  - oauth_return_path:', localStorage.getItem('oauth_return_path'))
      console.log('  - isLoggedIn:', localStorage.getItem('isLoggedIn'))
      
      try {
        // CORREÇÃO: Usar oauth_return_path em vez de oauth_state para redirecionamento
        const redirectPath = localStorage.getItem('oauth_return_path') || '/'
        console.log('📍 [CALLBACK] Caminho de redirecionamento:', redirectPath)
        
        // Check for both code (new flow) and hash (legacy flow)
        const authParams = window.location.search || window.location.hash
        console.log('🔐 [CALLBACK] Parâmetros de auth:', authParams)
        
        if (!authParams || authParams.length < 10) {
          console.error('❌ [CALLBACK] URL não contém parâmetros OAuth válidos')
          console.error('❌ [CALLBACK] window.location.href:', window.location.href)
          console.error('❌ [CALLBACK] window.location.search:', window.location.search)
          console.error('❌ [CALLBACK] window.location.hash:', window.location.hash)
          throw new Error('Nenhum parâmetro de autenticação encontrado na URL. Verifique se a URI de redirecionamento está configurada corretamente no Google Cloud Console.')
        }
        
        // Parse dos parâmetros para debug
        if (authParams.startsWith('?')) {
          const params = new URLSearchParams(authParams.substring(1))
          console.log('📝 [CALLBACK] Parâmetros parseados:')
          for (const [key, value] of params) {
            if (key === 'code') {
              console.log(`  - ${key}: ${value.substring(0, 20)}...`)
            } else {
              console.log(`  - ${key}: ${value}`)
            }
          }
        }
        
        console.log('🔄 [CALLBACK] Chamando handleAuthenticationCallback...')
        const startTime = Date.now()
        
        await handleAuthenticationCallback(authParams)
        
        const endTime = Date.now()
        console.log(`✅ [CALLBACK] handleAuthenticationCallback concluído em ${endTime - startTime}ms`)
        
        // ✅ IMPORTANTE: Integrar os dois sistemas de autenticação
        // Após a autenticação com Google ser bem-sucedida, marcar o usuário como logado no sistema simples
        // NOTA: O connectToDrive já chama triggerSimpleAuthLogin, mas vamos garantir
        console.log('🔐 [CALLBACK] Fazendo login no sistema simples...')
        login()
        
        // Verificar se realmente conectou
        const isActuallyConnected = localStorage.getItem('isLoggedIn') === 'true'
        console.log('🔍 [CALLBACK] Verificação final - isLoggedIn:', isActuallyConnected)
        
        if (!isActuallyConnected) {
          console.error('❌ [CALLBACK] ERRO: Autenticação concluída mas isLoggedIn não foi definido!')
          throw new Error('Falha ao salvar estado de autenticação')
        }
        
        // Limpar dados OAuth após sucesso
        localStorage.removeItem('oauth_return_path')
        
        console.log('✅ [CALLBACK] Autenticação bem-sucedida, redirecionando para:', redirectPath)
        toast.success('Autenticação com o Google bem-sucedida!')
        
        // Aguardar um pouco antes de redirecionar para garantir que o estado foi salvo
        setTimeout(() => {
          console.log('🔄 [CALLBACK] Executando redirecionamento...')
          navigate(redirectPath)
        }, 100)
        
      } catch (error) {
        console.error('❌ [CALLBACK] ERRO no processamento de autenticação:', error)
        console.error('❌ [CALLBACK] Stack trace:', error instanceof Error ? error.stack : 'N/A')
        console.error('❌ [CALLBACK] Error type:', error instanceof Error ? error.constructor.name : typeof error)
        console.error('❌ [CALLBACK] URL atual:', window.location.href)
        console.error('❌ [CALLBACK] Hash:', window.location.hash)
        console.error('❌ [CALLBACK] Search:', window.location.search)
        
        const errorMessage =
          error instanceof Error ? error.message : 'Falha na autenticação.'
        
        console.log('🚨 [CALLBACK] Mostrando toast de erro:', errorMessage)
        toast.error('Erro na Autenticação', {
          description: errorMessage,
          duration: 10000, // Mostrar por 10 segundos
        })
        
        // Limpar dados OAuth em caso de erro
        localStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_return_path')
        
        console.log('🔄 [CALLBACK] Redirecionando para settings devido ao erro')
        // Aguardar 3 segundos antes de redirecionar para dar tempo de ler o erro
        setTimeout(() => {
          navigate('/settings')
        }, 3000)
      }
    }

    processAuth()
  }, [handleAuthenticationCallback, navigate, login])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="relative flex flex-col items-center gap-6 p-8">
        {/* Animated logo/spinner */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
        
        {/* Text content */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Autenticando</h2>
          <p className="text-sm text-muted-foreground animate-pulse">
            Conectando com sua conta Google...
          </p>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  )
}

export default AuthCallbackPage
