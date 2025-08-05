import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Settings, 
  AlertTriangle, 
  ExternalLink,
  Gauge,
  HelpCircle,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/auth'
import { useMemo, memo } from 'react'
import { format } from 'date-fns'

const mainMenuItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: Gauge,
    description: 'Visão geral do sistema'
  },
  {
    href: '/alerts',
    label: 'Alertas',
    icon: AlertTriangle,
    description: 'Condomínios com problemas',
    showBadge: true
  },
  {
    href: '/search',
    label: 'Busca Avançada',
    icon: Search,
    description: 'Pesquisar relatórios'
  },
]

const secondaryMenuItems = [
  {
    href: '/settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Ajustes do sistema'
  },
]

// Memoized menu item component for better performance
const MenuItem = memo(({ item, isActive, alertsCount }: {
  item: typeof mainMenuItems[0]
  isActive: boolean
  alertsCount: number
}) => (
  <SidebarMenuItem>
    <NavLink to={item.href} className="w-full">
      <SidebarMenuButton
        isActive={isActive}
        className="sidebar-menu-item w-full justify-start h-10 xl:h-12 px-2 xl:px-3 group transition-all duration-200 hover:bg-primary/10"
      >
        <div className="flex items-center gap-2 xl:gap-3 flex-1 min-w-0">
          <div className={cn(
            "sidebar-icon flex items-center justify-center w-6 h-6 xl:w-8 xl:h-8 rounded-lg transition-colors flex-shrink-0",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted group-hover:bg-primary/20"
          )}>
            <item.icon className="h-3 w-3 xl:h-4 xl:w-4" />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0 overflow-hidden">
            <span className="sidebar-text font-medium text-xs xl:text-sm truncate w-full">{item.label}</span>
            <span className="sidebar-text text-xs xl:text-xs text-muted-foreground truncate w-full">{item.description}</span>
          </div>
          {item.showBadge && alertsCount > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs px-1 xl:px-2 py-1 flex-shrink-0">
              {alertsCount}
            </Badge>
          )}
        </div>
      </SidebarMenuButton>
    </NavLink>
  </SidebarMenuItem>
))

MenuItem.displayName = 'MenuItem'

export const AppSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { reports } = useAppStore()
  const { logout } = useAuth()

  // Calculate alerts count from latest date only
  const alertsCount = useMemo(() => {
    const allReports = Object.values(reports).flat()
    
    if (allReports.length === 0) return 0

    // Get latest date
    const reportsWithDates = allReports
      .map((report) => {
        const parts = report.date.split('/')
        if (parts.length !== 3) return null
        const [day, month, year] = parts.map(Number)
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null
        return { ...report, dateObj: new Date(year, month - 1, day) }
      })
      .filter(r => r !== null)
      .sort((a, b) => b!.dateObj.getTime() - a!.dateObj.getTime())

    const latestDate = reportsWithDates.length > 0 
      ? format(reportsWithDates[0]!.dateObj, 'dd/MM/yyyy')
      : null

    // Count alerts only from the latest date
    return allReports.filter(r => 
      r.date === latestDate && (r.status === 'alert' || r.status === 'error')
    ).length
  }, [reports])

  const renderMenuItem = (item: typeof mainMenuItems[0], _index: number) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href))
    
    return (
      <MenuItem 
        key={item.href}
        item={item}
        isActive={isActive}
        alertsCount={alertsCount}
      />
    )
  }

  return (
    <Sidebar className="border-r border-border/50 sidebar-compact-mode">
      <SidebarContent className="flex flex-col bg-gradient-to-b from-background to-muted/20">
        <SidebarHeader className="sidebar-responsive-padding border-b border-border/50">
          <div className="flex items-center sidebar-responsive-gap min-w-0 overflow-hidden">
            <img src="/tech.png" alt="Logo" className="h-10 xl:h-12 w-auto object-contain flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <h1 className="sidebar-responsive-title font-bold text-foreground truncate">IOT Monitor</h1>
              <span className="sidebar-responsive-subtitle text-muted-foreground truncate">Sistema de Monitoramento</span>
            </div>
          </div>
        </SidebarHeader>

        <div className="flex-1 px-4 py-4 space-y-6">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {mainMenuItems.map((item, index) => renderMenuItem(item, index))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          

          <SidebarSeparator className="mx-2" />

          {/* Secondary Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {secondaryMenuItems.map((item, index) => renderMenuItem(item, index))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <SidebarFooter className="p-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <CardTitle className="text-sm truncate">Precisa de Ajuda?</CardTitle>
              </div>
              <CardDescription className="text-xs truncate">
                Acesse nossa documentação completa
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs border-primary/30 hover:bg-primary/10 min-w-0"
                onClick={() => navigate('/docs')}
              >
                <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">Documentação</span>
              </Button>
            </CardContent>
          </Card>
          {/* Botão Sair */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 min-w-0"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Sair</span>
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}
