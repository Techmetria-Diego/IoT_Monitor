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
        
        if (!authParams) {
          throw new Error('Nenhum parâmetro de autenticação encontrado na URL')
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
        console.log('🔐 [CALLBACK] Fazendo login no sistema simples...')
        login()
        
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
        
        const errorMessage =
          error instanceof Error ? error.message : 'Falha na autenticação.'
        
        console.log('🚨 [CALLBACK] Mostrando toast de erro:', errorMessage)
        toast.error('Erro na Autenticação', {
          description: errorMessage,
        })
        
        // Limpar dados OAuth em caso de erro
        localStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_return_path')
        
        console.log('🔄 [CALLBACK] Redirecionando para settings devido ao erro')
        navigate('/settings')
      }
    }

    processAuth()
  }, [handleAuthenticationCallback, navigate, login])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">
        Autenticando com o Google...
      </p>
    </div>
  )
}

export default AuthCallbackPage
