import { Navigate } from 'react-router-dom'
import { useAuth } from './auth'

import { ReactNode } from 'react'
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  
  console.log('🛡️ [PRIVATE_ROUTE] Verificando acesso...', { 
    isLoggedIn, 
    currentPath: window.location.pathname,
    authKey: localStorage.getItem('isLoggedIn')
  })
  
  if (!isLoggedIn) {
    console.log('🚫 [PRIVATE_ROUTE] Acesso negado, redirecionando para login')
    return <Navigate to="/login" replace />
  }
  
  console.log('✅ [PRIVATE_ROUTE] Acesso permitido')
  return children
}
