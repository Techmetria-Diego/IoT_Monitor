import { useEffect } from 'react'
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
  AlertCircle,
  Users,
  Droplets,
  Flame,
  TriangleAlert,
  ShieldCheck,
  Download,
  ChevronDown,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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
    settings,
    invalidateReportsCache,
    credentials,
    reports,
  } = useAppStore()
  const isMobile = useIsMobile()

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

    if (reportId) {
      fetchReportDetails(reportId)
    }
    return () => {
      clearCurrentReport()
    }
  }, [reportId, fetchReportDetails, clearCurrentReport, isConnected, navigate])

  useEffect(() => {
    if (currentReport) {
      if (
        settings.notifications.highConsumption &&
        settings.alerts.emailEnabled &&
        currentReport.highConsumptionUnitsCount > 0 &&
        settings.alerts.emails.length > 0
      ) {
        toast.info('Alerta de Alto Consumo Detectado', {
          description: `Um e-mail de alerta simulado foi enviado para ${settings.alerts.emails.join(
            ', ',
          )}.`,
        })
      }
    }
  }, [currentReport, settings])

  const downloadExcel = async () => {
    if (!reportId || !credentials.accessToken) {
      toast.error('Não é possível baixar o relatório. Verifique a conexão.')
      return
    }

    try {
      toast.loading('Preparando download do Excel...')
      
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
      toast.success('Relatório Excel baixado com sucesso!')
    } catch (error) {
      toast.dismiss()
      toast.error('Erro ao baixar o relatório Excel. Tente novamente.')
      console.error('Erro no download Excel:', error)
    }
  }

  // Função para obter o ícone do serviço
  const getServiceIcon = (serviceType?: 'water' | 'gas' | 'unknown') => {
    switch (serviceType) {
      case 'water':
        return <Droplets className="h-6 w-6 text-blue-500" />
      case 'gas':
        return <Flame className="h-6 w-6 text-orange-500" />
      default:
        return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  // Buscar o serviceType do relatório atual
  const getCurrentReportServiceType = (): 'water' | 'gas' | 'unknown' => {
    if (!reportId || !reports) return 'unknown'
    
    // Buscar em todos os períodos pelo reportId atual
    for (const periodReports of Object.values(reports)) {
      const report = periodReports.find(r => r.id === reportId)
      if (report) {
        return report.serviceType || 'unknown'
      }
    }
    return 'unknown'
  }

  const downloadPDF = async () => {
    if (!currentReport) {
      toast.error('Não há dados para gerar o PDF.')
      return
    }

    const toastId = toast.loading('Gerando PDF...', {
      description: 'Criando documento com os dados do relatório',
    })

    try {
      // Criar PDF em formato paisagem para caber todas as colunas da tabela
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      let yPosition = margin

      // Cores
      const primaryColor: [number, number, number] = [59, 130, 246] // blue-500
      const dangerColor: [number, number, number] = [239, 68, 68] // red-500
      const successColor: [number, number, number] = [34, 197, 94] // green-500
      const textColor: [number, number, number] = [31, 41, 55] // gray-800
      const mutedColor: [number, number, number] = [107, 114, 128] // gray-500

      // Título do relatório (remover prefixos como "Dash", "Dash -", etc.)
      const cleanedName = currentReport.name
        .replace(/^(Dash\s*-?\s*|Dashboard\s*-?\s*)/i, '')
        .trim()
      
      pdf.setFontSize(20)
      pdf.setTextColor(...primaryColor)
      pdf.text(`Relatório: ${cleanedName}`, margin, yPosition)
      yPosition += 12

      // Data de geração
      pdf.setFontSize(10)
      pdf.setTextColor(...mutedColor)
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition)
      yPosition += 10

      // Linha divisória
      pdf.setDrawColor(...primaryColor)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10

      // Resumo estatístico
      const totalUnidades = currentReport.units.length
      const unidadesAlerta = currentReport.units.filter(u => u.isHighConsumption).length
      const consumoTotal = currentReport.units.reduce((acc, u) => acc + u.consumo, 0)
      const consumoMedio = totalUnidades > 0 ? consumoTotal / totalUnidades : 0

      pdf.setFontSize(12)
      pdf.setTextColor(...textColor)
      
      // Cards de resumo em linha
      const cardWidth = (pageWidth - margin * 2 - 30) / 4
      const cardHeight = 20
      const cardY = yPosition

      // Card 1: Total de Unidades
      pdf.setFillColor(240, 249, 255) // blue-50
      pdf.roundedRect(margin, cardY, cardWidth, cardHeight, 2, 2, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(...mutedColor)
      pdf.text('Total de Unidades', margin + 5, cardY + 7)
      pdf.setFontSize(16)
      pdf.setTextColor(...primaryColor)
      pdf.text(String(totalUnidades), margin + 5, cardY + 15)

      // Card 2: Unidades em Alerta
      const card2X = margin + cardWidth + 10
      pdf.setFillColor(254, 242, 242) // red-50
      pdf.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(...mutedColor)
      pdf.text('Unidades em Alerta', card2X + 5, cardY + 7)
      pdf.setFontSize(16)
      pdf.setTextColor(...dangerColor)
      pdf.text(String(unidadesAlerta), card2X + 5, cardY + 15)

      // Card 3: Consumo Total
      const card3X = margin + (cardWidth + 10) * 2
      pdf.setFillColor(240, 253, 244) // green-50
      pdf.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(...mutedColor)
      pdf.text('Consumo Total', card3X + 5, cardY + 7)
      pdf.setFontSize(16)
      pdf.setTextColor(...successColor)
      pdf.text(`${consumoTotal.toFixed(2)} m³`, card3X + 5, cardY + 15)

      // Card 4: Consumo Médio
      const card4X = margin + (cardWidth + 10) * 3
      pdf.setFillColor(249, 250, 251) // gray-50
      pdf.roundedRect(card4X, cardY, cardWidth, cardHeight, 2, 2, 'F')
      pdf.setFontSize(10)
      pdf.setTextColor(...mutedColor)
      pdf.text('Consumo Médio', card4X + 5, cardY + 7)
      pdf.setFontSize(16)
      pdf.setTextColor(20, 30, 40)
      pdf.text(`${consumoMedio.toFixed(2)} m³`, card4X + 5, cardY + 15)

      yPosition = cardY + cardHeight + 15

      // Título da tabela
      pdf.setFontSize(14)
      pdf.setTextColor(...textColor)
      pdf.text('Detalhamento por Unidade', margin, yPosition)
      yPosition += 8

      // Preparar dados da tabela
      const tableHeaders = [
        'Unidade',
        'Nº Série',
        'Dispositivo',
        'Última Leitura',
        'Leit. Anterior',
        'Leit. Atual',
        'Consumo (m³)',
        'Projeção 30d',
        'Tendência'
      ]

      const tableData = currentReport.units.map(unit => [
        getUnitNumber(unit.unidade),
        unit.numeroDeSerie || 'N/A',
        unit.dispositivo || 'N/A',
        formatDateBrazilian(unit.dataLeitura || ''),
        unit.leituraAnterior.toFixed(2),
        unit.leituraAtual.toFixed(2),
        unit.consumo.toFixed(2),
        unit.projecao30Dias.toFixed(2),
        unit.tendencia
      ])

      // Calcular largura disponível da tabela (mesma dos cards)
      const tableWidth = pageWidth - (margin * 2)

      // Gerar tabela com autoTable
      autoTable(pdf, {
        startY: yPosition,
        head: [tableHeaders],
        body: tableData,
        margin: { left: margin, right: margin },
        tableWidth: tableWidth,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
          overflow: 'ellipsize',
          halign: 'center',
          valign: 'middle',
          textColor: [20, 20, 20],
        },
        headStyles: {
          fillColor: [45, 110, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 26 }, // Unidade
          1: { cellWidth: 28 }, // Nº Série
          2: { cellWidth: 34 }, // Dispositivo
          3: { cellWidth: 42 }, // Última Leitura (data e hora)
          4: { cellWidth: 28 }, // Leit. Anterior
          5: { cellWidth: 28 }, // Leit. Atual
          6: { cellWidth: 28 }, // Consumo
          7: { cellWidth: 30 }, // Projeção 30d
          8: { cellWidth: 'auto' }, // Tendência (preenche o resto)
        },
        didParseCell: (data) => {
          // Destacar linhas com alto consumo
          if (data.section === 'body') {
            const rowIndex = data.row.index
            const unit = currentReport.units[rowIndex]
            if (unit && unit.isHighConsumption) {
              data.cell.styles.fillColor = [254, 226, 226] // red-100
              data.cell.styles.textColor = dangerColor
            }
          }
          // Colorir coluna de tendência
          if (data.section === 'body' && data.column.index === 8) {
            const tendencia = String(data.cell.raw).toLowerCase()
            if (tendencia.includes('alto consumo') || tendencia.includes('aumento')) {
              data.cell.styles.textColor = dangerColor
              data.cell.styles.fontStyle = 'bold'
            } else if (tendencia.includes('estável') || tendencia.includes('normal')) {
              data.cell.styles.textColor = successColor
            }
          }
        },
      })

      // Rodapé em todas as páginas
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        const pageHeight = pdf.internal.pageSize.getHeight()
        pdf.setFontSize(8)
        pdf.setTextColor(...mutedColor)
        pdf.text(
          `Página ${i} de ${pageCount} | IOT Monitor - Sistema de Monitoramento de Consumo`,
          margin,
          pageHeight - 10
        )
        pdf.text(
          `© ${new Date().getFullYear()} Techmetria`,
          pageWidth - margin - 40,
          pageHeight - 10
        )
      }

      // Salvar PDF
      const sanitizedName = currentReport.name
        .replace(/^(Dash\s*-?\s*|Dashboard\s*-?\s*)/i, '')
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .trim()
      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `${sanitizedName}_Relatorio_${timestamp}.pdf`

      pdf.save(fileName)

      toast.dismiss(toastId)
      toast.success('PDF gerado com sucesso!', {
        description: `Arquivo "${fileName}" salvo`,
      })
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Erro ao gerar PDF', {
        description: 'Tente novamente',
      })
      console.error('Erro na geração do PDF:', error)
    }
  }


  const getTendencyBadge = (tendencia: string, isHighConsumption: boolean) => {
    // Check if it's high consumption based on the TENDÊNCIA column
    const isHighConsumptionFromTendencia = tendencia.toLowerCase().includes('alto consumo')
    const shouldBeRed = isHighConsumption || isHighConsumptionFromTendencia
    
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs whitespace-nowrap",
          shouldBeRed 
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300" 
            : "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
        )}
      >
        {tendencia}
      </Badge>
    )
  }

  const renderDesktopTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Nº de Série</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Última Leitura</TableHead>
              <TableHead className="text-right">Leitura Anterior</TableHead>
              <TableHead className="text-right">Leitura Atual</TableHead>
              <TableHead className="text-right">Consumo (m³)</TableHead>
              <TableHead className="text-right">Projeção 30d</TableHead>
              <TableHead>Tendência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReport?.units.map((unit, index) => (
              <TableRow
                key={unit.id || index}
                className={cn(unit.isHighConsumption && 'bg-destructive/10')}
              >
                <TableCell className="font-medium">{getUnitNumber(unit.unidade)}</TableCell>
                <TableCell>{unit.numeroDeSerie}</TableCell>
                <TableCell className="whitespace-nowrap">{unit.dispositivo || 'N/A'}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDateBrazilian(unit.dataLeitura || '')}</TableCell>
                <TableCell className="text-right">
                  {unit.leituraAnterior.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {unit.leituraAtual.toFixed(2)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-semibold whitespace-nowrap',
                    unit.isHighConsumption && 'text-destructive',
                  )}
                >
                  {unit.isHighConsumption && (
                    <TriangleAlert className="inline-block h-4 w-4 mr-2 text-destructive" />
                  )}
                  {unit.consumo.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {unit.projecao30Dias.toFixed(2)}
                </TableCell>
                <TableCell>
                  {getTendencyBadge(unit.tendencia, unit.isHighConsumption)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )

  const renderMobileList = () => (
    <div className="content-grid space-y-4 sm:space-y-6">
      {currentReport?.units.map((unit, index) => (
        <Card
          key={unit.id || index}
          className={cn(
            unit.isHighConsumption && 'border-destructive bg-destructive/5',
          )}
        >
          <CardHeader className="card-responsive pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-base sm:text-lg">Unidade: {getUnitNumber(unit.unidade)}</span>
              <div className="flex items-center gap-1 self-start sm:self-center">
                {getTendencyBadge(unit.tendencia, unit.isHighConsumption)}
              </div>
            </CardTitle>
            <CardDescription className="text-sm">
              Nº de Série: {unit.numeroDeSerie} | Dispositivo: {unit.dispositivo || 'N/A'} | Última Leitura: {formatDateBrazilian(unit.dataLeitura || '')}
            </CardDescription>
          </CardHeader>
          <CardContent className="card-responsive pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Leitura Anterior</p>
                <p className="font-medium text-base">{unit.leituraAnterior.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Leitura Atual</p>
                <p className="font-medium text-base">{unit.leituraAtual.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Consumo (m³)</p>
                <p
                  className={cn(
                    'font-bold text-base',
                    unit.isHighConsumption && 'text-destructive',
                  )}
                >
                  {unit.consumo.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Projeção 30d</p>
                <p className="font-medium text-base">{unit.projecao30Dias.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Dados para os gráficos
  const tendenciaData = {
    labels: ['Alto Consumo', 'Normal'],
    datasets: [{
      data: [
        currentReport?.units?.filter(u => u.isHighConsumption).length || 0,
        currentReport?.units?.filter(u => !u.isHighConsumption).length || 0
      ],
      backgroundColor: ['#ef4444', '#10b981'],
      borderWidth: 0
    }]
  };


  // Função para formatar data no formato brasileiro
  function formatDateBrazilian(dateString: string): string {
    if (!dateString || dateString.trim() === '') return 'N/A'
    
    const trimmedDate = dateString.trim()
    
    try {
      let date: Date
      
      // Se já está no formato brasileiro (dd/MM/aaaa), retorna como está
      if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmedDate)) {
        return trimmedDate
      }
      
      // Verifica se é um número (serial date do Excel)
      const numericDate = parseFloat(trimmedDate)
      if (!isNaN(numericDate) && numericDate > 40000 && numericDate < 50000) {
        // Converte número serial do Excel para data (base: 1 de janeiro de 1900)
        const excelEpoch = new Date(1900, 0, 1)
        date = new Date(excelEpoch.getTime() + (numericDate - 2) * 24 * 60 * 60 * 1000)
      }
      // Tenta parsear diferentes formatos ISO
      else if (trimmedDate.includes('-')) {
        // Formatos como: 2025-08-04, 2025-08-04 9:02:44, 2025-08-04T09:02:44
        let isoString = trimmedDate
        const hasOriginalTime = trimmedDate.includes(' ') || trimmedDate.includes('T')
        
        // Se tem espaço no lugar do T, substitui
        if (isoString.includes(' ') && !isoString.includes('T')) {
          isoString = isoString.replace(' ', 'T')
        }
        
        // Se não tem horário, adiciona 00:00:00
        if (!isoString.includes('T') && !isoString.includes(' ')) {
          isoString += 'T00:00:00'
        }
        
        // Se o horário não tem segundos, adiciona :00
        if (isoString.includes('T') && isoString.split('T')[1].split(':').length === 2) {
          isoString += ':00'
        }
        
        date = new Date(isoString)
        
        // Salva informação se tinha horário original
        ;(date as any)._hasOriginalTime = hasOriginalTime
      }
      // Outros formatos, tenta parsear diretamente
      else {
        date = new Date(trimmedDate)
      }
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        // Se não conseguiu parsear de forma alguma, força formato brasileiro assumindo que seja ISO
        if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          const parts = trimmedDate.split(/[-T\s]/);
          if (parts.length >= 3) {
            const [year, month, day] = parts;
            const hasTime = parts.length > 3 && parts[3];
            if (hasTime) {
              const timePart = parts[3];
              return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${timePart}`;
            }
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
          }
        }
        return 'N/A'
      }
      
      // Formatar para dd/MM/aaaa HH:mm:ss
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      
      // Se tinha horário original ou se o horário não é 00:00:00, mostra com horário
      if ((date as any)._hasOriginalTime || !(hours === '00' && minutes === '00' && seconds === '00')) {
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
      }
      
      // Se não tinha horário original e é 00:00:00, só mostra a data
      return `${day}/${month}/${year}`
    } catch (_error) {
      // Como último recurso, tenta extrair manualmente do formato ISO
      if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = trimmedDate.split(/[-T\s]/);
        if (parts.length >= 3) {
          const [year, month, day] = parts;
          const hasTime = parts.length > 3 && parts[3];
          if (hasTime) {
            const timePart = parts[3];
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${timePart}`;
          }
          return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
      }
      return 'N/A'
    }
  }

  // Função para extrair apenas o número da unidade
  function getUnitNumber(unidade = '') {
    // Verifica se contém "área comum" (case insensitive)
    const lowerUnidade = unidade.toLowerCase();
    
    // Se contém "área comum", procura por "AC" ou "Área Comum" no texto original
    if (lowerUnidade.includes('área comum') || lowerUnidade.includes('area comum')) {
      // Procura por "AC" isolado (com espaços ou no final/início)
      const acMatch = unidade.match(/\b(AC)\b/i);
      if (acMatch) {
        return acMatch[1];
      }
      
      // Procura por "Área Comum" com qualquer capitalização
      const areaComumMatch = unidade.match(/(Á|á)rea\s+(C|c)omum/i);
      if (areaComumMatch) {
        return areaComumMatch[0];
      }
      
      // Fallback para "Área Comum" se não encontrou nenhum padrão específico
      return "Área Comum";
    }
    
    // Verifica padrão "Bloco XX - AC - XXXX" e formata como "AC.XX"
    const blocoACMatch = unidade.match(/Bloco\s+(\d+)\s*-\s*AC\s*-\s*(\d+)/i);
    if (blocoACMatch) {
      const numeroBloco = blocoACMatch[1].padStart(2, '0'); // Garante 2 dígitos para o bloco
      return `AC.${numeroBloco}`;
    }
    
    // Verifica padrão "Bloco XX - APTO - XXXX" e formata como "XXXX.XX"
    const blocoAptoMatch = unidade.match(/Bloco\s+(\d+)\s*-\s*APTO\s*-\s*(\d+)/i);
    if (blocoAptoMatch) {
      const numeroBloco = blocoAptoMatch[1].padStart(2, '0'); // Garante 2 dígitos para o bloco
      const numeroApto = blocoAptoMatch[2];
      return `${numeroApto}.${numeroBloco}`;
    }
    
    // Para unidades normais, procura por padrões como "Apto-XXXX.XX" ou "XXXX.XX"
    const match = unidade.match(/\d+\.\d+|\d{4}|\d{3}/);
    return match ? match[0] : unidade;
  }

  const topConsumos = currentReport?.units ? [...currentReport.units].sort((a, b) => b.consumo - a.consumo).slice(0, 5) : [];
  const consumoChartData = {
    labels: topConsumos.map(u => getUnitNumber(u.unidade)),
    datasets: [{
      label: 'Consumo (m³)',
      data: topConsumos.map(u => u.consumo),
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  };

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="section-spacing">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
          <div className="content-grid-3">
            <Skeleton className="h-24 sm:h-28 w-full" />
            <Skeleton className="h-24 sm:h-28 w-full" />
            <Skeleton className="h-24 sm:h-28 w-full" />
          </div>
          <Skeleton className="h-64 sm:h-80 lg:h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container animate-fade-in">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {error.type === 'InvalidCredentialsError'
              ? 'Sessão Expirada'
              : 'Não foi possível carregar o relatório'}
          </AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <div className="mt-4 flex gap-2">
            {error.type === 'InvalidCredentialsError' && (
              <Button variant="destructive" onClick={startAuthentication}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Reautenticar
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  if (!currentReport) {
    return (
      <div className="page-container animate-fade-in text-center">
        <p>Nenhum dado de relatório para exibir.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                // Invalidate cache when going back to force refresh
                if (invalidateReportsCache) {
                  invalidateReportsCache()
                }
                navigate(-1)
              }}
              className="-ml-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Relatórios
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!reportId || !credentials.accessToken}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Relatório
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar como Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar como PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h1 className="page-title flex items-center gap-3">
            Relatório: {currentReport.name.replace(/^Dash\s*-?\s*/i, '')}
            {getServiceIcon(getCurrentReportServiceType())}
          </h1>
        </div>
      </div>

      <div className="section-spacing">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Total de Unidades */}
          <Card className="flex flex-row items-center bg-card border-border rounded-2xl shadow-md hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 p-5 min-h-[110px]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Total de Unidades</span>
              <span className="text-3xl font-bold text-blue-800 dark:text-blue-300">{currentReport?.totalUnits}</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">unidades monitoradas</span>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-4">
              <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
          </Card>

          {/* Card Unidades em Alerta */}
          <Card className="flex flex-row items-center bg-card border-border rounded-2xl shadow-md hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 p-5 min-h-[110px]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Unidades em Alerta</span>
              <span className="text-3xl font-bold text-red-800 dark:text-red-300">{currentReport?.highConsumptionUnitsCount}</span>
              <span className="text-xs text-red-600 dark:text-red-400 mt-1">consumo elevado</span>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 ml-4">
              <TriangleAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
          </Card>

          {/* Card Consumo Médio */}
          <Card className="flex flex-row items-center bg-card border-border rounded-2xl shadow-md hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 p-5 min-h-[110px]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Consumo Médio</span>
              <span className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">{currentReport?.averageConsumption.toFixed(2)}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">m³ por unidade</span>
            </div>
            <div className={cn(
              "flex items-center justify-center w-14 h-14 rounded-full ml-4",
              getCurrentReportServiceType() === 'gas' 
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            )}>
              {getCurrentReportServiceType() === 'gas' ? (
                <Flame className="h-7 w-7 text-orange-600 dark:text-orange-400" />
              ) : (
                <Droplets className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </Card>
        </div>

        {/* Cards de Gráficos: Distribuição por Tendência e Top 5 Maiores Consumos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="bg-card border-border rounded-2xl shadow-md dark:shadow-xl overflow-hidden">
            <CardHeader className="px-4 py-3 border-b border-border bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                <span><i className="fas fa-chart-pie text-xl" /></span>
                Distribuição por Tendência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {/* Gráfico Doughnut - Tendência */}
              <div className="w-full h-[280px] flex flex-col">
                <div className="flex-1 flex justify-center items-center">
                  <div className="w-[240px] h-[240px]">
                    <Doughnut 
                      data={tendenciaData} 
                      options={{ 
                        responsive: true,
                        maintainAspectRatio: true,
                        layout: {
                          padding: 0
                        },
                        plugins: { 
                          legend: { display: false } 
                        }
                      }} 
                    />
                  </div>
                </div>
                {/* Legenda customizada */}
                <div className="flex gap-4 justify-center mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-500 inline-block" />
                    <span className="text-sm text-red-600 font-semibold">Alto Consumo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-green-500 inline-block" />
                    <span className="text-sm text-green-600 font-semibold">Normal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-2xl shadow-md dark:shadow-xl overflow-hidden">
            <CardHeader className="px-4 py-3 border-b border-border bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                <span><i className="fas fa-chart-bar text-xl" /></span>
                Top 5 Maiores Consumos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {/* Gráfico Bar - Top Consumos */}
              <div className="w-full h-[280px]">
                <Bar 
                  data={consumoChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                      padding: {
                        top: 10,
                        bottom: 5,
                        left: 5,
                        right: 5
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: { 
                        enabled: true,
                        callbacks: {
                          title: function(context) {
                            const index = context[0].dataIndex;
                            return `Unidade: ${topConsumos[index]?.unidade || 'N/A'}`;
                          },
                          label: function(context) {
                            return `Consumo: ${context.parsed.y.toFixed(2)} m³`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 0,
                          minRotation: 0,
                          font: { size: 12 },
                          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                          padding: 5
                        },
                        grid: { 
                          display: false
                        },
                        border: {
                          display: false
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: { 
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6'
                        },
                        border: {
                          display: false
                        },
                        ticks: { 
                          font: { size: 12 }, 
                          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                          padding: 8,
                          callback: function(value) {
                            return value + ' m³';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {isMobile ? renderMobileList() : renderDesktopTable()}
      </div>
    </div>
  )
}

export default ReportDetails