import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Droplets,
  Flame,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ReportFile } from '@/types'

const getServiceIcon = (serviceType: ReportFile['serviceType']) => {
  switch (serviceType) {
    case 'water':
      return <Droplets className="h-7 w-7 text-blue-500" />
    case 'gas':
      return <Flame className="h-7 w-7 text-orange-500" />
    default:
      return null
  }
}

const getStatusColor = (status: ReportFile['status']) => {
  switch (status) {
    case 'error':
      return 'destructive'
    case 'alert':
      return 'default'
    default:
      return 'secondary'
  }
}

const getStatusText = (status: ReportFile['status']) => {
  switch (status) {
    case 'error':
      return 'Crítico'
    case 'alert':
      return 'Alerta'
    default:
      return 'Normal'
  }
}

const AlertsOverview = () => {
  const navigate = useNavigate()
  const { reports, isLoading, error } = useAppStore()

  const { allAlertedReports, groupedByStatus, latestDate } = useMemo(() => {
    const allReports = Object.values(reports).flat()
    
    if (allReports.length === 0) {
      return { 
        allAlertedReports: [], 
        groupedByStatus: { error: [], alert: [] },
        latestDate: null 
      }
    }

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

    // Filter alerted reports ONLY from the latest date
    const allAlertedReports = allReports
      .filter((r) => {
        // Only include reports from the latest date AND with alerts
        return (r.date === latestDate) && (r.status === 'alert' || r.status === 'error')
      })
      .sort((a, b) => {
        // Sort by status (error first) then by name
        if (a.status !== b.status) {
          return a.status === 'error' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

    const groupedByStatus = {
      error: allAlertedReports.filter(r => r.status === 'error'),
      alert: allAlertedReports.filter(r => r.status === 'alert')
    }

    return { allAlertedReports, groupedByStatus, latestDate }
  }, [reports])

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="section-spacing">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
          <div className="content-grid-2">
            <Skeleton className="h-20 sm:h-24 w-full" />
            <Skeleton className="h-20 sm:h-24 w-full" />
          </div>
          <div className="content-grid space-y-3 sm:space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 sm:h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 lg:px-6 xl:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Alertas</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="-ml-4 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            </div>
            <h1 className="page-title">Condomínios com Alertas</h1>
          </div>
        </div>
        {latestDate && (
          <p className="page-subtitle flex items-center gap-2 mt-2">
            <Calendar className="h-4 w-4" />
            Alertas da data mais recente: {latestDate}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="content-grid-2 mb-8">
        <Card className="border-destructive/40 bg-destructive/5 hover:bg-destructive/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm sm:text-base font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-destructive">
              {groupedByStatus.error.length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Requerem ação imediata
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm sm:text-base font-medium">Alertas Moderados</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
              {groupedByStatus.alert.length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Monitoramento necessário
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {allAlertedReports.length === 0 ? (
        <Card className="text-center w-full max-w-4xl mx-auto">
          <CardContent className="card-responsive">
            <AlertTriangle className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Nenhum Alerta na Data Atual</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {latestDate 
                ? `Todos os condomínios estão funcionando normalmente em ${latestDate}.`
                : 'Nenhum dado disponível para verificação de alertas.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="section-spacing">
          <div className="page-header">
            <h2 className="text-lg sm:text-xl font-semibold">
              Alertas de {latestDate} ({allAlertedReports.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Condomínios que apresentaram alertas na data mais recente
            </p>
          </div>
          
          <div className="space-y-3">
            {allAlertedReports.map((report) => (
              <Card 
                key={report.id}
                className={cn(
                  "transition-all duration-300 hover:shadow-lg cursor-pointer group",
                  report.status === 'error' 
                    ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10" 
                    : "border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10"
                )}
                onClick={() => navigate(`/relatorio/${report.id}`)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Report Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getServiceIcon(report.serviceType)}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                          {report.name.replace(/^Dash\s*-?\s*/i, '')}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {report.date}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-center sm:text-right">
                        <p className="text-xs text-muted-foreground">Unidades afetadas</p>
                        <p className="text-lg sm:text-xl font-bold text-destructive">
                          {report.highConsumptionUnitsCount}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Badge 
                          variant={getStatusColor(report.status)}
                          className={cn(
                            "text-xs whitespace-nowrap",
                            report.status === 'alert' && 
                            "bg-yellow-500 hover:bg-yellow-600 text-black dark:text-white"
                          )}
                        >
                          {getStatusText(report.status)}
                        </Badge>
                        
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm" className="sm:hidden">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsOverview