import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/app-store'

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const settings = useAppStore((state) => state.settings)
  const theme = settings?.theme || 'light'
  const [currentTheme, setCurrentTheme] = useState<string>('light')

  // Sistema de detecção de tema do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = () => {
      const root = window.document.documentElement
      
      // Remove todas as classes de tema
      root.classList.remove('light', 'dark')
      
      let appliedTheme = 'light'
      
      if (theme === 'system') {
        appliedTheme = mediaQuery.matches ? 'dark' : 'light'
      } else {
        appliedTheme = theme
      }
      
      // Aplica o tema
      root.classList.add(appliedTheme)
      setCurrentTheme(appliedTheme)
      
      console.log('🎨 Tema aplicado:', {
        setting: theme,
        applied: appliedTheme,
        systemPreference: mediaQuery.matches ? 'dark' : 'light'
      })
    }

    // Aplicar tema inicial
    updateTheme()
    
    // Listener para mudanças no tema do sistema (apenas se tema for 'system')
    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme])

  // Debug: log mudanças de tema
  useEffect(() => {
    console.log('🔍 ThemeProvider - Estado:', {
      storeSetting: theme,
      currentApplied: currentTheme,
      htmlClass: document.documentElement.className
    })
  }, [theme, currentTheme])

  return <>{children}</>
}
