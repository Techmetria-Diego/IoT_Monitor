import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AUTH_KEY } from './auth-constants'

const AuthContext = createContext({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialLoginState = localStorage.getItem(AUTH_KEY) === 'true'
  console.log('🔄 [AUTH] Inicializando AuthProvider...', { initialLoginState, authKey: AUTH_KEY })
  
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoginState)

  useEffect(() => {
    console.log('🔄 [AUTH] useEffect executado, estado atual:', isLoggedIn)
    
    const syncAuth = () => {
      const newState = localStorage.getItem(AUTH_KEY) === 'true'
      console.log('🔄 [AUTH] Storage event recebido, novo estado:', newState)
      setIsLoggedIn(newState)
    }
    window.addEventListener('storage', syncAuth)
    
    // ✅ IMPORTANTE: Verificar se já há uma conexão válida com Google Drive na inicialização
    const checkExistingGoogleAuth = () => {
      console.log('🔍 [AUTH] Verificando autenticação existente do Google Drive...')
      try {
        const storedData = localStorage.getItem('monitor-agua-storage')
        console.log('🔍 [AUTH] Dados do Zustand store:', !!storedData)
        
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          const state = parsedData?.state
          console.log('🔍 [AUTH] Estado do store:', {
            isConnected: state?.isConnected,
            hasAccessToken: !!state?.credentials?.accessToken,
            hasCredentials: !!state?.credentials
          })
          
          // Se há credenciais válidas e está conectado, marcar como logado automaticamente
          if (state?.isConnected && state?.credentials?.accessToken) {
            console.log('✅ [AUTH] Detectado login do Google Drive existente, sincronizando sistema de autenticação...')
            localStorage.setItem(AUTH_KEY, 'true')
            setIsLoggedIn(true)
          } else {
            console.log('⚠️ [AUTH] Google Drive não está conectado ou sem credenciais válidas')
          }
        } else {
          console.log('⚠️ [AUTH] Nenhum dado do Zustand store encontrado')
        }
      } catch (error) {
        console.error('❌ [AUTH] Erro ao verificar autenticação existente:', error)
      }
    }
    
    // Verificar na inicialização
    checkExistingGoogleAuth()
    
    // CORREÇÃO: Também verificar periodicamente (para capturar mudanças do callback)
    const intervalId = setInterval(() => {
      const currentAuthState = localStorage.getItem(AUTH_KEY) === 'true'
      if (currentAuthState !== isLoggedIn) {
        console.log('🔄 [AUTH] Estado de auth mudou via polling:', currentAuthState)
        setIsLoggedIn(currentAuthState)
      }
    }, 1000) // Verificar a cada 1 segundo
    
    return () => {
      window.removeEventListener('storage', syncAuth)
      clearInterval(intervalId)
    }
  }, [])

  const login = () => {
    console.log('🔐 [AUTH] Executando login...')
    localStorage.setItem(AUTH_KEY, 'true')
    setIsLoggedIn(true)
    console.log('✅ [AUTH] Login executado, novo estado:', true)
  }
  const logout = () => {
    console.log('🚪 [AUTH] Executando logout...')
    localStorage.removeItem(AUTH_KEY)
    setIsLoggedIn(false)
    console.log('✅ [AUTH] Logout executado, novo estado:', false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
