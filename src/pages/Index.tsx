import { useEffect, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Folder,
  FileText,
  AlertCircle,
  Settings,
  FolderSearch,
} from 'lucide-react'
import { AlertSummaryCard } from '@/components/AlertSummaryCard'
import { format } from 'date-fns'

// Memoized period card component for better performance
interface PeriodCardProps {
  period: any
  index: number
  onClick: () => void
}

const PeriodCard = memo(({ period, index, onClick }: PeriodCardProps) => (
  <Card
    className="cursor-pointer bg-card hover:bg-accent/50 border-border rounded-lg shadow-sm hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 hover:-translate-y-1 animate-fade-in-up group flex flex-row items-center gap-2 p-4 min-h-[56px]"
    style={{ animationDelay: `${index * 50}ms` }}
    onClick={onClick}
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
      <Folder className="h-6 w-6 text-primary" />
    </div>
    <div className="flex flex-col justify-center flex-1 min-w-0">
      <div className="text-2xl font-bold text-card-foreground mb-1 truncate group-hover:text-primary transition-colors">
        {period.name.replace(/^[0-9]{2}\s*-\s*/, '').replace(/\s*-\s*[0-9]{4}$/, (match) => ` de ${match.trim().slice(-4)}`)}
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <FileText className="h-3 w-3 flex-shrink-0" />
        <span className="font-semibold text-base text-primary">{period.reportCount}</span>
        <span className="text-sm">{period.reportCount === 1 ? 'relatório' : 'relatórios'}</span>
      </div>
    </div>
  </Card>
))

const Index = () => {
  const navigate = useNavigate()
  const {
    isConnected,
    isLoading,
    error,
    periods,
    reports,
    connectToDrive,
    credentials,
    // invalidateReportsCache,
    validateAndReconnect,
  } = useAppStore()

  const handlePeriodClick = useMemo(() => (periodId: string) => {
    navigate(`/periodo/${periodId}`)
  }, [navigate])

  useEffect(() => {
    const initializeConnection = async () => {
      if (isConnected && credentials.accessToken) {
        // First validate if the token is still valid
        const isValidToken = await validateAndReconnect()
        
        if (isValidToken) {
          // Token is valid, try to reconnect
          try {
            await connectToDrive(credentials)
          } catch {
            console.log('🔐 Reconnection failed, token might be expired')
            // Error is handled in the store
          }
        }
        // If token is invalid, validateAndReconnect already updated the state
      }
    }

    initializeConnection()
  }, [isConnected, connectToDrive, credentials, validateAndReconnect])


  const { alertedReports, latestDateString } = useMemo(() => {
    const allReports = Object.values(reports).flat()
    if (allReports.length === 0) {
      return { alertedReports: [], latestDateString: null }
    }

    const reportsWithDates = allReports
      .map((report) => {
        const parts = report.date.split('/')
        if (parts.length !== 3) return null
        const [day, month, year] = parts.map(Number)
        if (
          isNaN(day) ||
          isNaN(month) ||
          isNaN(year) ||
          month < 1 ||
          month > 12 ||
          day < 1 ||
          day > 31
        ) {
          return null
        }
        return { ...report, dateObj: new Date(year, month - 1, day) }
      })
      .filter(
        (r): r is NonNullable<typeof r> =>
          r !== null && !isNaN(r.dateObj.getTime()),
      )

    if (reportsWithDates.length === 0) {
      return { alertedReports: [], latestDateString: null }
    }

    reportsWithDates.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())

    const latestDate = reportsWithDates[0].dateObj
    const latestDateString = format(latestDate, 'dd/MM/yyyy')

    const alertedReports = reportsWithDates
      .filter((r) => r.date === latestDateString)
      .filter((r) => r.status === 'alert' || r.status === 'error')

    return { alertedReports, latestDateString }
  }, [reports])

  return (
    <div className="page-container animate-fade-in">
      {!isConnected ? (
        <section className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md mx-auto">
            <Card className="card-responsive text-center">
              <CardHeader className="page-header">
                <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-6">
                  <Settings className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                </div>
                <CardTitle className="page-title">
                  Conecte-se ao Google Drive
                </CardTitle>
              </CardHeader>
              <CardContent className="section-spacing">
                <p className="page-subtitle mx-auto">
                  Para começar, acesse a página de configurações e forneça suas
                  credenciais do Google Drive.
                </p>
                <Button
                  onClick={() => navigate('/settings')}
                  size="lg"
                  className="button-responsive text-primary-foreground w-full sm:w-auto"
                >
                  Ir para Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : (
        <section className="section-spacing">
          <div className="w-full">
            <AlertSummaryCard
              alertedReports={alertedReports}
              latestDate={latestDateString}
              isLoading={isLoading}
            />
          </div>


          <div className="page-header">
            <h2 className="page-title">Períodos Disponíveis</h2>
          </div>
          
          {isLoading && !periods.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-screen-xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="w-full max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Períodos</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{error.message}</p>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings')}
                  >
                    Ir para Configurações
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : periods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-screen-xl mx-auto">
              {periods.map((period, index) => (
                <PeriodCard
                  key={period.id}
                  period={period}
                  index={index}
                  onClick={() => handlePeriodClick(period.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="animate-fade-in max-w-md mx-auto">
              <CardContent className="card-responsive text-center">
                <FolderSearch className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Nenhum Período Encontrado
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Não encontramos nenhuma pasta de período na sua pasta do
                  Google Drive. Verifique se as pastas existem e seguem o padrão
                  de nomenclatura esperado (ex: "06 - Junho - 2025").
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  )
}

export default Index
