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
  },
  {
    href: '/alerts',
    label: 'Alertas',
    icon: AlertTriangle,
    showBadge: true
  },
  {
    href: '/search',
    label: 'Busca Avançada',
    icon: Search,
  },
]

const secondaryMenuItems = [
  {
    href: '/settings',
    label: 'Configurações',
    icon: Settings,
  },
]

// Modern menu item component with clean design
const MenuItem = memo(({ item, isActive, alertsCount }: {
  item: typeof mainMenuItems[0]
  isActive: boolean
  alertsCount: number
}) => (
  <SidebarMenuItem>
    <NavLink to={item.href} className="w-full">
      <SidebarMenuButton
        className={cn(
          "w-full justify-start h-11 px-3 rounded-xl transition-all duration-200 border-0",
          "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700"
            : "bg-card text-card-foreground hover:bg-accent/50 shadow-sm hover:shadow-md"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0",
            isActive
              ? "bg-white/20 text-white hover:text-white hover:bg-white/30"
              : "bg-accent text-muted-foreground"
          )}>
            <item.icon className="h-4 w-4" />
          </div>
          <span className={cn(
            "font-medium text-sm truncate flex-1 transition-colors duration-200",
            isActive && "text-white hover:text-white"
          )}>{item.label}</span>
          {item.showBadge && alertsCount > 0 && (
            <Badge variant="destructive" className="text-xs px-2 py-1 rounded-full shadow-sm">
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
    <Sidebar className="border-r-0 sidebar-compact-mode shadow-xl">
      <SidebarContent className="flex flex-col bg-background border-r border-border">
        <SidebarHeader className="sidebar-responsive-padding p-6 border-b border-border">
          <div className="flex items-center sidebar-responsive-gap min-w-0 overflow-hidden">
            <img src="/tech.png" alt="Logo" className="h-10 xl:h-12 w-auto object-contain flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <h1 className="sidebar-responsive-title font-bold text-foreground truncate">IOT Monitor</h1>
              <span className="sidebar-responsive-subtitle text-muted-foreground leading-tight">Sistema de Monitoramento</span>
            </div>
          </div>
        </SidebarHeader>

        <div className="flex-1 px-4 py-6 space-y-8">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {mainMenuItems.map((item, index) => renderMenuItem(item, index))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-3" />

          {/* Secondary Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {secondaryMenuItems.map((item, index) => renderMenuItem(item, index))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <SidebarFooter className="p-4 space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm truncate text-card-foreground">Precisa de Ajuda?</CardTitle>
              </div>
              <CardDescription className="text-xs truncate text-muted-foreground">
                Acesse nossa documentação completa
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 min-w-0 transition-all"
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
            className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 min-w-0 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium">Sair</span>
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}
