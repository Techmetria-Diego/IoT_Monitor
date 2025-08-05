import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  AlertCircle,
  Droplets,
  TriangleAlert,
  Activity,
  Calendar,
  Filter,
  X,
  Search,
  Building,
  FileText,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'


const ReportDetails = () => {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const {
    isLoading,
    error,
    currentReport,
    fetchReportDetails,
    clearCurrentReport,
    isConnected,
    startAuthentication,
    credentials,
  } = useAppStore()

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tendencia: '',
    consumoMin: '',
    consumoMax: '',
    apartamento: '',
  })

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    if (!currentReport?.units) return []
    
    return currentReport.units.filter(unit => {
      // Filtro por tendência
      if (filtros.tendencia && !unit.tendencia.toLowerCase().includes(filtros.tendencia.toLowerCase())) {
        return false
      }
      
      // Filtro por consumo mínimo
      if (filtros.consumoMin && unit.consumo < parseFloat(filtros.consumoMin)) {
        return false
      }
      
      // Filtro por consumo máximo
      if (filtros.consumoMax && unit.consumo > parseFloat(filtros.consumoMax)) {
        return false
      }
      
      // Filtro por apartamento
      if (filtros.apartamento && !unit.unidade.toLowerCase().includes(filtros.apartamento.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [currentReport?.units, filtros])

  // Estatísticas dos dados filtrados
  const estatisticas = useMemo(() => {
    if (!dadosFiltrados.length) {
      return {
        totalUnidades: 0,
        consumoTotal: 0,
        media: 0,
        altoConsumo: 0,
        projecaoMensal: 0
      }
    }
    
    const consumoTotal = dadosFiltrados.reduce((acc, unit) => acc + unit.consumo, 0)
    const altoConsumo = dadosFiltrados.filter(unit => unit.isHighConsumption).length
    const media = consumoTotal / dadosFiltrados.length
    const projecaoMensal = dadosFiltrados.reduce((acc, unit) => acc + unit.projecao30Dias, 0)
    
    return {
      totalUnidades: dadosFiltrados.length,
      consumoTotal,
      media,
      altoConsumo,
      projecaoMensal
    }
  }, [dadosFiltrados])

  useEffect(() => {
    if (!isConnected) {
      startAuthentication()
      return
    }

    if (reportId && credentials.driveFolderUrl) {
      clearCurrentReport()
      fetchReportDetails(reportId)
    }
  }, [reportId, credentials.driveFolderUrl, isConnected, fetchReportDetails, clearCurrentReport, startAuthentication])

  const aplicarFiltros = () => {
    toast.success('Filtros aplicados com sucesso!')
  }

  const limparFiltros = () => {
    setFiltros({
      tendencia: '',
      consumoMin: '',
      consumoMax: '',
      apartamento: '',
    })
    toast.info('Filtros limpos')
  }

  const downloadRelatorio = async () => {
    if (!reportId || !credentials.accessToken) {
      toast.error('Não é possível baixar o relatório. Verifique a conexão.')
      return
    }

    try {
      toast.loading('Preparando download...')
      
      // Fazer download do arquivo Excel do Google Drive
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${reportId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentReport?.name || 'Relatório'}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success('Relatório baixado com sucesso!')
    } catch (error) {
      toast.dismiss()
      toast.error('Erro ao baixar o relatório. Tente novamente.')
      console.error('Erro no download:', error)
    }
  }

  const getTendencyBadge = (tendencia: string, isHighConsumption: boolean) => {
    const variants = {
      'Estável': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'Aumento': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'Aumento Crítico': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    }
    
    return (
      <Badge className={cn(
        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
        isHighConsumption ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' : variants[tendencia] || variants['Estável']
      )}>
        {isHighConsumption ? 'ALTO CONSUMO' : tendencia.toUpperCase()}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar relatório</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os dados do relatório. Tente novamente.
        </AlertDescription>
      </Alert>
    )
  }

  if (!currentReport) {
    return (
      <div className="text-center py-8">
        <p>Relatório não encontrado.</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Voltar para Home
        </Button>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header Premium com Gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-8 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16 3xl:-mx-20">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Droplets className="text-2xl h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {currentReport?.name?.replace(/^Dash\s*-?\s*/i, '') || 'Relatório de Consumo'}
                </h1>
                <p className="text-blue-100">Sistema de Análise de Consumo</p>
                <p className="text-sm text-blue-200">
                  Arquivo: {currentReport?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex gap-3 mb-4">
                <Button
                  variant="outline"
                  onClick={downloadRelatorio}
                  className="text-white border-white/30 hover:bg-white/20"
                  disabled={!reportId || !credentials.accessToken}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Excel
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </div>
              <p className="text-sm text-blue-100">Período de Análise</p>
              <p className="font-semibold">Dados em tempo real</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total de Unidades */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total de Unidades
              </CardTitle>
              <div className="bg-blue-100 p-3 rounded-full dark:bg-blue-400/20">
                <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {estatisticas.totalUnidades}
              </div>
            </CardContent>
          </Card>

          {/* Consumo Total */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Consumo Total
              </CardTitle>
              <div className="bg-green-100 p-3 rounded-full dark:bg-green-400/20">
                <Droplets className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {estatisticas.consumoTotal.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">m³</p>
            </CardContent>
          </Card>

          {/* Alto Consumo */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Alto Consumo
              </CardTitle>
              <div className="bg-red-100 p-3 rounded-full dark:bg-red-400/20">
                <TriangleAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {estatisticas.altoConsumo}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
            </CardContent>
          </Card>

          {/* Média por Unidade */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Média/Unidade
              </CardTitle>
              <div className="bg-purple-100 p-3 rounded-full dark:bg-purple-400/20">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {estatisticas.media.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">m³</p>
            </CardContent>
          </Card>

          {/* Projeção Mensal */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-600/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Projeção Mensal
              </CardTitle>
              <div className="bg-yellow-100 p-3 rounded-full dark:bg-yellow-400/20">
                <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {estatisticas.projecaoMensal.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">m³</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avançados */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="filtro-tendencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tendência
                </label>
                <Select value={filtros.tendencia} onValueChange={(value) => setFiltros(prev => ({ ...prev, tendencia: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="estável">Estável</SelectItem>
                    <SelectItem value="aumento">Aumento</SelectItem>
                    <SelectItem value="crítico">Aumento Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="filtro-consumo-min" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consumo Mínimo (m³)
                </label>
                <Input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  value={filtros.consumoMin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, consumoMin: e.target.value }))}
                />
              </div>
              
              <div>
                <label htmlFor="filtro-consumo-max" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Consumo Máximo (m³)
                </label>
                <Input
                  type="number"
                  placeholder="10,00"
                  step="0.01"
                  min="0"
                  value={filtros.consumoMax}
                  onChange={(e) => setFiltros(prev => ({ ...prev, consumoMax: e.target.value }))}
                />
              </div>
              
              <div>
                <label htmlFor="filtro-apartamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar Unidade
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 101"
                  value={filtros.apartamento}
                  onChange={(e) => setFiltros(prev => ({ ...prev, apartamento: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={aplicarFiltros} className="bg-blue-600 hover:bg-blue-700">
                <Search className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={limparFiltros}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela Detalhada */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhamento por Unidade
              </CardTitle>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>{dadosFiltrados.length}</span> registros encontrados
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-700">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unidade
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dispositivo
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Consumo (m³)
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Projeção 30 dias
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tendência
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data Leitura
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dadosFiltrados.map((unit, index) => (
                    <TableRow key={unit.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {unit.unidade}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {unit.numeroDeSerie}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {unit.consumo.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {unit.projecao30Dias.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        {getTendencyBadge(unit.tendencia, unit.isHighConsumption)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {unit.dataLeitura || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>© 2025 Sistema de Análise de Consumo IoT</p>
          <p className="text-sm mt-2">Desenvolvido com tecnologia avançada para gestão predial</p>
        </div>
      </div>
    </div>
  )
}

export default ReportDetails
