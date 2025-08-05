import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle, Settings, Menu, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SidebarTrigger } from './ui/sidebar'

export const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { 
    currentPeriod, 
    currentReport, 
    isConnected, 
    isLoading, 
    credentials, 
    connectToDrive, 
    invalidateReportsCache,
    validateAndReconnect
  } = useAppStore()

  const getPageTitle = () => {
    const path = location.pathname
    if (path.startsWith('/relatorio/')) {
      return currentReport?.name
        ? `Relatório: ${currentReport.name.replace(/^Dash\s*-?\s*/i, '')}`
        : 'Detalhes do Relatório'
    }
    if (path.startsWith('/periodo/')) {
      return currentPeriod?.name
        ? `Período: ${currentPeriod.name.replace(/^\d{2}\s*-\s*/, '').replace(/\s*-\s*\d{4}$/, (match) => ` de ${match.trim().slice(-4)}`)}`
        : 'Relatórios do Período'
    }
    if (path === '/settings') {
      return 'Configurações'
    }
    if (path === '/search') {
      return 'Busca Avançada'
    }
    if (path === '/docs') {
      return 'Documentação'
    }
    return 'Dashboard'
  }

  const handleSyncData = async () => {
    if (isConnected && credentials) {
      try {
        // First validate token before sync
        const isValid = await validateAndReconnect()
        if (!isValid) {
          console.log('🔐 Token validation failed during sync')
          return
        }
        
        invalidateReportsCache()
        await connectToDrive(credentials)
      } catch (error) {
        console.error('Erro ao sincronizar dados:', error)
      }
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all duration-300',
        scrolled
          ? 'bg-background/90 shadow-md backdrop-blur-lg'
          : 'bg-background',
      )}
    >
      <div className="w-full flex h-16 items-center justify-between px-4 md:h-20 lg:px-6 xl:px-8">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="lg:hidden">
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-foreground">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Monitor Água</h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSyncData}
                  disabled={isLoading}
                  className="text-secondary-foreground hover:text-primary"
                >
                  <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sincronizar Dados</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-secondary-foreground hover:text-primary"
              >
                <HelpCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajuda</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="text-secondary-foreground hover:text-primary"
              >
                <Settings className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configurações</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
