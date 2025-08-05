import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  LayoutGrid,
  List,
  FileText,
  Calendar,
  AlertCircle,
  ShieldCheck,
  FolderSearch,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Droplets,
  Flame,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ReportFile } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PeriodDetails = () => {
  const { periodoId } = useParams<{ periodoId: string }>()
  const navigate = useNavigate()
  const {
    isLoading,
    error,
    reports,
    currentPeriod,
    fetchReportsByPeriod,
    isConnected,
    startAuthentication,
  } = useAppStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (!isConnected) {
      toast.error('Não conectado ao Google Drive.', {
        description:
          'Por favor, configure a conexão na página de Configurações.',
        action: {
          label: 'Configurações',
          onClick: () => navigate('/settings'),
        },
      })
      navigate('/')
      return
    }

    if (periodoId) {
      // Always force refresh to get latest calculated values
      fetchReportsByPeriod(periodoId, true).catch(() => {
        // Error is handled by the component's error state display
      })
    }
  }, [periodoId, fetchReportsByPeriod, isConnected, navigate])

  const reportList = periodoId ? reports[periodoId] || [] : []

  const sortedReportList = [...reportList].sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/').map(Number)
    const dateA = new Date(yearA, monthA - 1, dayA)

    const [dayB, monthB, yearB] = b.date.split('/').map(Number)
    const dateB = new Date(yearB, monthB - 1, dayB)

    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime()
    }

    return a.name.localeCompare(b.name)
  })

  const { fetchReportDetails } = useAppStore()
  const handleReportClick = async (reportId: string) => {
    await fetchReportDetails(reportId)
    navigate(`/relatorio/${reportId}`)
  }

  const getStatusProps = (status: ReportFile['status']) => {
    switch (status) {
      case 'error':
        return {
          icon: XCircle,
          label: 'Crítico',
          className: 'bg-destructive/10 text-destructive border-destructive/20',
          iconClassName: 'text-destructive',
        }
      case 'alert':
        return {
          icon: AlertTriangle,
          label: 'Alerta',
          className:
            'bg-yellow-400/10 text-yellow-600 border-yellow-400/20 dark:text-yellow-400',
          iconClassName: 'text-yellow-500',
        }
      default:
        return {
          icon: CheckCircle2,
          label: 'Normal',
          className:
            'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
          iconClassName: 'text-green-500',
        }
    }
  }

  const getServiceIcon = (
    serviceType: ReportFile['serviceType'],
    className: string,
  ) => {
    switch (serviceType) {
      case 'water':
        return <Droplets className={cn('text-primary', className)} />
      case 'gas':
        return <Flame className={cn('text-orange-500', className)} />
      default:
        return <FileText className={cn('text-primary', className)} />
    }
  }

  const renderReportCard = (report: ReportFile, index: number) => {
    const statusProps = getStatusProps(report.status)

    return (
      <Card
        key={report.id}
        className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col group animate-fade-in-up h-full border-2 border-border/80 hover:border-primary/30"
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => handleReportClick(report.id)}
      >
        <CardHeader className="p-4 pb-3">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border-2 border-primary/30 shadow-sm">
              {getServiceIcon(report.serviceType, 'h-5 w-5')}
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold border-2 shadow-sm shrink-0', statusProps.className)}
            >
              <statusProps.icon
                className={cn('h-3 w-3 mr-1.5', statusProps.iconClassName)}
              />
              {statusProps.label}
            </Badge>
          </div>
          <CardTitle className="text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem]">
            {report.name.replace(/^Dash\s*-?\s*/i, '')}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs mt-2">
            <div className="p-1 rounded bg-muted border border-border">
              <Calendar className="h-3 w-3" />
            </div>
            <span className="font-medium">{report.date}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 flex-grow">
          <div className="bg-muted/50 rounded-lg p-3 border-2 border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-1.5 rounded bg-background border border-border shadow-sm">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">Unidades em Alerta</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'font-bold text-lg px-2.5 py-1 rounded-lg border-2 shadow-sm min-w-[2.5rem] text-center',
                    report.highConsumptionUnitsCount > 0
                      ? 'text-destructive bg-destructive/15 border-destructive/40'
                      : 'text-muted-foreground bg-muted/70 border-border',
                  )}
                >
                  {report.highConsumptionUnitsCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderReportRow = (report: ReportFile, index: number) => {
    const statusProps = getStatusProps(report.status)
    return (
      <TableRow
        key={report.id}
        className="cursor-pointer transition-colors hover:bg-accent animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => handleReportClick(report.id)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            {getServiceIcon(report.serviceType, 'h-5 w-5 flex-shrink-0')}
            <span className="truncate">{report.name.replace(/^Dash\s*-?\s*/i, '')}</span>
          </div>
        </TableCell>
        <TableCell>{report.date}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn('text-xs font-semibold', statusProps.className)}
          >
            <statusProps.icon
              className={cn('h-3.5 w-3.5 mr-1.5', statusProps.iconClassName)}
            />
            {statusProps.label}
          </Badge>
        </TableCell>
        <TableCell className="text-center font-semibold">
          <span
            className={cn(
              report.highConsumptionUnitsCount > 0 && 'text-destructive',
            )}
          >
            {report.highConsumptionUnitsCount}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-5 w-5" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  if (!isLoading && error) {
    if (error.type === 'ApiDisabledError') {
      return (
        <div className="page-container animate-fade-in">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API do Google Drive Desativada</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os relatórios. A API do Google Drive não
              está ativada para este projeto. Por favor, contate o administrador
              do sistema para ativá-la.
            </AlertDescription>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Períodos
              </Button>
            </div>
          </Alert>
        </div>
      )
    }
    if (error.type === 'InvalidCredentialsError') {
      return (
        <div className="page-container animate-fade-in">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sessão Expirada</AlertTitle>
            <AlertDescription>
              Sua conexão com o Google Drive expirou. Por favor, autentique-se
              novamente.
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button
                variant="destructive"
                onClick={startAuthentication}
                className="text-destructive-foreground"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Reautenticar
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Períodos
              </Button>
            </div>
          </Alert>
        </div>
      )
    }
    return (
      <div className="page-container animate-fade-in">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os relatórios</AlertTitle>
          <AlertDescription>
            {error.message}
            <br />A pasta para este período pode ter sido movida, excluída ou
            você não tem permissão para acessá-la.
          </AlertDescription>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Períodos
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4 -ml-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Períodos
            </Button>
            <h1 className="page-title">
              Relatórios de {currentPeriod?.name?.replace(/^\d{2}\s*-\s*/, '').replace(/\s*-\s*\d{4}$/, (match) => ` de ${match.trim().slice(-4)}`) || '...'}
            </h1>
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value: 'grid' | 'list') =>
              value && setViewMode(value)
            }
            className="flex-shrink-0"
          >
            <ToggleGroupItem value="grid" aria-label="Visualização em Grade">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Visualização em Lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {(isLoading || (!sortedReportList.length && !error)) &&
        (viewMode === 'grid' ? (
          <div className="content-grid-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 sm:h-72 lg:h-80 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="content-grid space-y-3 sm:space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-lg" />
            ))}
          </div>
        ))}

      {!isLoading && !error && sortedReportList.length === 0 && (
        <Card className="animate-fade-in w-full max-w-4xl mx-auto">
          <CardContent className="card-responsive text-center">
            <FolderSearch className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-lg sm:text-xl font-semibold mb-4">
              Nenhum Relatório Encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Não encontramos nenhum relatório para este período. Verifique se
              as pastas de dia (ex: "01_06_2025") e os arquivos .xlsx existem
              dentro da pasta do período.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        sortedReportList.length > 0 &&
        (viewMode === 'grid' ? (
          <div className="content-grid-4">
            {sortedReportList.map(renderReportCard)}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Relatório</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">
                    Unidades em Alerta
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{sortedReportList.map(renderReportRow)}</TableBody>
            </Table>
          </Card>
        ))}
    </div>
  )
}

export default PeriodDetails
