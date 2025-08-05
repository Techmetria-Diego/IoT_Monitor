import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Eye, CheckCircle2, Droplets, Flame, Loader2 } from 'lucide-react'
import { ReportFile } from '@/types'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'

interface AlertSummaryCardProps {
  alertedReports: ReportFile[]
  latestDate: string | null
  isLoading?: boolean
}

const getServiceIcon = (serviceType: ReportFile['serviceType']) => {
  switch (serviceType) {
    case 'water':
      return <Droplets className="h-4 w-4 text-blue-500 flex-shrink-0" />
    case 'gas':
      return <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
    default:
      return null
  }
}

export const AlertSummaryCard = ({
  alertedReports,
  latestDate,
  isLoading = false,
}: AlertSummaryCardProps) => {
  const navigate = useNavigate()
  const hasAlerts = alertedReports.length > 0

  // Show loading state if still loading and no data yet
  if (isLoading && alertedReports.length === 0 && !latestDate) {
    return (
      <Card className="animate-fade-in-up transition-all duration-300 overflow-hidden border-muted">
        <CardHeader className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-muted-foreground">
                Carregando alertas...
              </CardTitle>
              <CardDescription className="text-sm">
                Verificando relatórios recentes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'animate-fade-in-up transition-all duration-300 overflow-hidden',
        hasAlerts
          ? 'border-destructive/40 bg-destructive/5 dark:bg-destructive/10'
          : 'border-green-500/30 bg-green-500/5 dark:bg-green-500/10',
      )}
    >
      <CardHeader className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-full',
              hasAlerts ? 'bg-destructive/10' : 'bg-green-500/10',
            )}
          >
            {hasAlerts ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            )}
          </div>
          <div>
            <CardTitle
              className={cn(
                'text-xl font-bold',
                hasAlerts
                  ? 'text-destructive'
                  : 'text-green-700 dark:text-green-400',
              )}
            >
              {hasAlerts
                ? `${alertedReports.length} Condomínio${
                    alertedReports.length > 1 ? 's' : ''
                  } com Alertas`
                : 'Nenhum Alerta Recente'}
            </CardTitle>
            <CardDescription className="text-sm">
              {hasAlerts
                ? `Ações podem ser necessárias para a data de ${latestDate}.`
                : latestDate
                  ? `Tudo certo com os relatórios de ${latestDate}.`
                  : 'Nenhum relatório encontrado para verificar alertas.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {hasAlerts && (
        <>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Condomínios com maior urgência:
              </h4>
              <ul className="space-y-2">
                {alertedReports.slice(0, 3).map((report) => (
                  <li
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/80 transition-colors cursor-pointer shadow-sm border"
                    onClick={() => navigate(`/relatorio/${report.id}`)}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {getServiceIcon(report.serviceType)}
                      <span className="font-semibold truncate">
                        {report.name.replace(/^Dash\s*-?\s*/i, '')}
                      </span>
                    </div>
                    <Badge
                      variant={
                        report.status === 'error' ? 'destructive' : 'default'
                      }
                      className={cn(
                        'flex-shrink-0',
                        report.status === 'alert' &&
                          'bg-yellow-500 hover:bg-yellow-600 text-black',
                      )}
                    >
                      {report.status === 'error' ? 'Crítico' : 'Alerta'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
            {alertedReports.length > 3 && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                e mais {alertedReports.length - 3}...
              </p>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 p-4 border-t">
            <Button
              variant="destructive"
              className="w-full text-destructive-foreground shadow-md hover:shadow-lg transition-shadow"
              onClick={() => navigate('/alerts')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver todos os condomínios com alertas
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
