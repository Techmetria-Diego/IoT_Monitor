import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppStore((state) => state.settings?.theme || 'light')

  // Debug: verificar o que está chegando do store
  useEffect(() => {
    console.log('🔍 ThemeProvider - tema recebido do store:', theme)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement

    // Garantir que pelo menos uma classe de tema esteja aplicada
    root.classList.remove('light', 'dark')

    try {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
        console.log('🎨 Tema sistema aplicado:', systemTheme)
      } else if (theme === 'dark' || theme === 'light') {
        root.classList.add(theme)
        console.log('🎨 Tema aplicado:', theme)
      } else {
        // Fallback para tema light se algo der errado
        root.classList.add('light')
        console.log('🎨 Fallback para tema light')
      }
    } catch (error) {
      console.error('Erro ao aplicar tema:', error)
      root.classList.add('light') // Fallback seguro
    }
  }, [theme])

  return <>{children}</>
}
