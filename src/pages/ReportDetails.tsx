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
  TriangleAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { UnitData } from '@/types'
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
import html2canvas from 'html2canvas';

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

  // Função auxiliar para preparar elementos para captura
  const prepareElementsForCapture = async () => {
    // Aguardar que todos os gráficos Chart.js sejam renderizados
    const charts = document.querySelectorAll('canvas')
    const chartPromises = Array.from(charts).map(chart => {
      return new Promise<void>((resolve) => {
        // Verificar se o canvas tem conteúdo renderizado
        if (chart instanceof HTMLCanvasElement) {
          const ctx = chart.getContext('2d')
          if (ctx) {
            // Aguardar um pouco mais para garantir renderização
            setTimeout(() => resolve(), 800)
          } else {
            resolve()
          }
        } else {
          resolve()
        }
      })
    })
    
    await Promise.all(chartPromises)
    
    // Aguardar que todas as imagens sejam carregadas
    const images = document.querySelectorAll('img')
    const imagePromises = Array.from(images).map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve()
        } else {
          img.addEventListener('load', () => resolve())
          img.addEventListener('error', () => resolve())
          // Fallback timeout
          setTimeout(() => resolve(), 1500)
        }
      })
    })
    
    await Promise.all(imagePromises)
    
    // Aguardar que as fontes sejam carregadas
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready
    }
    
    // Delay adicional para garantir renderização completa
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

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

  const downloadPDF = async () => {
    if (!currentReport) {
      toast.error('Não há dados para gerar o PDF.')
      return
    }

    try {
      toast.loading('Preparando captura do PDF...', {
        description: 'Aguardando renderização completa dos elementos'
      })

      // Aguardar todos os elementos estarem carregados
      await prepareElementsForCapture()

      // Encontrar o container principal da página
      const reportElement = document.querySelector('.page-container') as HTMLElement
      if (!reportElement) {
        throw new Error('Container da página não encontrado')
      }

      // Salvar estado original
      const originalScrollY = window.scrollY
      const originalOverflow = document.body.style.overflow
      
      // Preparar página para captura
      window.scrollTo(0, 0)
      document.body.style.overflow = 'visible'
      
      // Garantir que o elemento esteja completamente visível
      reportElement.style.position = 'static'
      reportElement.style.width = 'auto'
      reportElement.style.height = 'auto'
      reportElement.style.transform = 'none'
      reportElement.style.maxWidth = 'none'
      reportElement.style.overflow = 'visible'
      
      // Forçar re-layout
      void reportElement.offsetHeight
      
      // Aguardar estabilização
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.loading('Capturando página...', {
        description: 'Gerando imagem em alta resolução'
      })

      // Configurações otimizadas para captura completa da largura
      const canvasOptions = {
        allowTaint: true,
        useCORS: true,
        scale: 2, // Escala alta para qualidade
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: reportElement.scrollWidth, // Capturar largura completa
        height: reportElement.scrollHeight, // Capturar altura completa
        logging: false,
        imageTimeout: 30000,
        removeContainer: false,
        foreignObjectRendering: true,
        ignoreElements: (element: Element) => {
          // Ignorar apenas elementos que realmente atrapalham
          const ignoredClasses = [
            'dropdown-menu', 'toast', 'tooltip', 'sonner-toast',
            'sonner-toaster', 'fixed', 'absolute'
          ]
          return ignoredClasses.some(cls => element.classList.contains(cls)) ||
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'STYLE' ||
                 (element as HTMLElement).style.position === 'fixed'
        },
        onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
          try {
            // Aguardar fontes carregarem no documento clonado
            if (clonedDoc.fonts) {
              clonedDoc.fonts.ready.then(() => {
                console.log('Fontes carregadas no documento clonado')
              })
            }

            // Forçar renderização correta dos gráficos Chart.js
            const originalCharts = reportElement.querySelectorAll('canvas')
            const clonedCharts = clonedElement.querySelectorAll('canvas')
            
            clonedCharts.forEach((clonedCanvas, index) => {
              const originalCanvas = originalCharts[index]
              if (originalCanvas && originalCanvas instanceof HTMLCanvasElement) {
                const clonedCtx = clonedCanvas.getContext('2d')
                if (clonedCtx) {
                  // Definir dimensões exatas
                  clonedCanvas.width = originalCanvas.width
                  clonedCanvas.height = originalCanvas.height
                  clonedCanvas.style.width = originalCanvas.style.width
                  clonedCanvas.style.height = originalCanvas.style.height
                  
                  // Copiar pixel por pixel
                  clonedCtx.drawImage(originalCanvas, 0, 0)
                  
                  // Garantir visibilidade
                  clonedCanvas.style.display = 'block'
                  clonedCanvas.style.visibility = 'visible'
                  clonedCanvas.style.opacity = '1'
                }
              }
            })

            // Copiar estilos computados para todos os elementos
            const originalElements = reportElement.querySelectorAll('*')
            const clonedElements = clonedElement.querySelectorAll('*')
            
            clonedElements.forEach((clonedEl, index) => {
              const originalEl = originalElements[index]
              if (originalEl && originalEl instanceof HTMLElement && clonedEl instanceof HTMLElement) {
                const computedStyle = window.getComputedStyle(originalEl)
                
                // Lista de propriedades críticas para copiar
                const criticalProperties = [
                  'fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor',
                  'borderColor', 'borderWidth', 'borderStyle', 'borderRadius',
                  'padding', 'margin', 'width', 'height', 'display', 'position',
                  'textAlign', 'lineHeight', 'letterSpacing', 'wordSpacing',
                  'background', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
                  'boxShadow', 'textShadow', 'opacity', 'transform'
                ]
                
                criticalProperties.forEach(prop => {
                  try {
                    const value = computedStyle.getPropertyValue(prop)
                    if (value) {
                      clonedEl.style.setProperty(prop, value, 'important')
                    }
                  } catch (_e) {
                    // Ignorar propriedades que falham
                  }
                })

                // Preservar classes CSS importantes
                if (originalEl.className) {
                  clonedEl.className = originalEl.className
                }
              }
            })

            // Remover elementos que podem causar problemas na renderização
            const problematicSelectors = [
              '.sonner-toaster', '.toast', '[role="dialog"]', 
              '[data-radix-portal]', '.dropdown-menu', '[data-state="open"]',
              '.fixed', '[style*="position: fixed"]'
            ]
            
            problematicSelectors.forEach(selector => {
              clonedElement.querySelectorAll(selector).forEach(el => {
                el.remove()
              })
            })

            // Garantir que o layout seja preservado
            clonedElement.style.width = reportElement.scrollWidth + 'px'
            clonedElement.style.minHeight = reportElement.scrollHeight + 'px'
            clonedElement.style.display = 'block'
            clonedElement.style.position = 'static'

          } catch (error) {
            console.warn('Erro no processamento do clone:', error)
          }
        }
      }

      // Capturar o canvas
      const canvas = await html2canvas(reportElement, canvasOptions)
      
      // Restaurar estado original
      window.scrollTo(0, originalScrollY)
      document.body.style.overflow = originalOverflow

      toast.loading('Gerando PDF...', {
        description: 'Convertendo para documento PDF'
      })

      // Obter dados da imagem em máxima qualidade
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calcular dimensões para uma página A4 real (sem tentar forçar tudo em uma página)
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      // Dimensões do PDF em mm (A4)
      const pdfWidth = 210 // A4 width
      const pdfHeight = 297 // A4 height
      const margin = 15 // Margem de 15mm para melhor legibilidade
      const usableWidth = pdfWidth - (margin * 2)
      const usableHeight = pdfHeight - (margin * 2)
      
      // Calcular escala baseada na largura disponível (considerando que a escala do canvas é 2)
      // Como usamos scale: 2 no html2canvas, precisamos dividir as dimensões por 2
      const actualCanvasWidth = canvasWidth / 2
      const actualCanvasHeight = canvasHeight / 2
      
      // Converter pixels para mm (96 DPI padrão: 1 inch = 25.4mm, 96 pixels = 25.4mm)
      const pixelsToMm = 25.4 / 96
      
      // Dimensões do conteúdo em mm
      const contentWidthMm = actualCanvasWidth * pixelsToMm
      const contentHeightMm = actualCanvasHeight * pixelsToMm
      
      // Calcular escala para caber na largura da página
      const scaleToFit = Math.min(usableWidth / contentWidthMm, 1) // Não aumentar, apenas reduzir se necessário
      
      // Dimensões finais da imagem no PDF (em mm)
      const finalWidth = contentWidthMm * scaleToFit
      const finalHeight = contentHeightMm * scaleToFit
      
      console.log('PDF Layout:', {
        canvasSize: { width: canvasWidth, height: canvasHeight },
        actualSize: { width: actualCanvasWidth, height: actualCanvasHeight },
        contentSize: { width: contentWidthMm, height: contentHeightMm },
        pdfSize: { width: pdfWidth, height: pdfHeight },
        usableArea: { width: usableWidth, height: usableHeight },
        scaleToFit,
        finalSize: { width: finalWidth, height: finalHeight },
        willNeedMultiplePages: finalHeight > usableHeight
      })
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Verificar se precisa de múltiplas páginas
      if (finalHeight > usableHeight) {
        // Conteúdo muito alto - dividir em múltiplas páginas
        const pagesNeeded = Math.ceil(finalHeight / usableHeight)
        
        for (let page = 0; page < pagesNeeded; page++) {
          if (page > 0) {
            pdf.addPage('a4', 'portrait')
          }
          
          // Calcular qual parte do canvas capturar para esta página
          const pageStartMm = page * usableHeight
          const pageHeightMm = Math.min(usableHeight, finalHeight - pageStartMm)
          
          // Converter de volta para pixels do canvas original
          const pageStartPixels = (pageStartMm / scaleToFit / pixelsToMm) * 2 // Multiplicar por 2 devido ao scale
          const pageHeightPixels = (pageHeightMm / scaleToFit / pixelsToMm) * 2
          
          // Criar canvas temporário para essa seção
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')
          
          if (tempCtx) {
            tempCanvas.width = canvasWidth
            tempCanvas.height = Math.min(pageHeightPixels, canvasHeight - pageStartPixels)
            
            // Copiar seção do canvas original
            tempCtx.fillStyle = '#ffffff'
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
            tempCtx.drawImage(
              canvas, 
              0, pageStartPixels, canvasWidth, tempCanvas.height, // Fonte
              0, 0, canvasWidth, tempCanvas.height // Destino
            )
            
            const sectionData = tempCanvas.toDataURL('image/png', 1.0)
            
            // Adicionar a seção no PDF
            pdf.addImage(
              sectionData,
              'PNG',
              margin, // X sempre na margem
              margin, // Y sempre na margem para cada página
              finalWidth,
              pageHeightMm,
              `page-${page}`,
              'MEDIUM'
            )
          }
        }
      } else {
        // Conteúdo cabe em uma página - centralizar verticalmente
        const yOffset = margin + (usableHeight - finalHeight) / 2
        
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yOffset,
          finalWidth,
          finalHeight,
          'main-page',
          'MEDIUM'
        )
      }

      // Gerar nome do arquivo
      const sanitizedName = currentReport.name
        .replace(/^Dash\s*-?\s*/i, '')
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .trim()
      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `${sanitizedName}_Relatorio_${timestamp}.pdf`

      // Salvar o PDF
      pdf.save(fileName)
      
      toast.dismiss()
      toast.success('PDF gerado com sucesso!', {
        description: 'Arquivo salvo com fidelidade pixel-perfect'
      })

    } catch (error) {
      toast.dismiss()
      toast.error('Erro ao gerar PDF', {
        description: 'Verifique se todos os elementos estão carregados e tente novamente'
      })
      console.error('Erro na geração do PDF:', error)
    }
  }

  const getTendencyIcon = (tendencia: UnitData['tendencia']) => {
    switch (tendencia) {
      case 'Aumento Crítico':
      case 'Aumento':
        return <TrendingUp className="h-4 w-4 text-destructive" />
      case 'Estável':
        return <Minus className="h-4 w-4 text-muted-foreground" />
      case 'Crédito/Erro':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
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
                <TableCell className="font-medium">{unit.unidade}</TableCell>
                <TableCell>{unit.numeroDeSerie}</TableCell>
                <TableCell className="text-right">
                  {unit.leituraAnterior.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {unit.leituraAtual.toFixed(2)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-semibold',
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
                  <div className="flex items-center gap-2">
                    {getTendencyIcon(unit.tendencia)}
                    {getTendencyBadge(unit.tendencia, unit.isHighConsumption)}
                  </div>
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
              <span className="text-base sm:text-lg">Unidade: {unit.unidade}</span>
              <div className="flex items-center gap-1 self-start sm:self-center">
                {getTendencyIcon(unit.tendencia)}
                {getTendencyBadge(unit.tendencia, unit.isHighConsumption)}
              </div>
            </CardTitle>
            <CardDescription className="text-sm">
              Nº de Série: {unit.numeroDeSerie}
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

  // Função para extrair label curto da unidade
  function getShortLabel(unidade = '') {
    // Extrai apenas números ou o final do nome
    const match = unidade.match(/\d{2,4}/);
    return match ? match[0] : unidade.slice(-6);
  }

  const topConsumos = currentReport?.units ? [...currentReport.units].sort((a, b) => b.consumo - a.consumo).slice(0, 5) : [];
  const consumoChartData = {
    labels: topConsumos.map(u => getShortLabel(u.unidade)),
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
          <h1 className="page-title">
            Relatório: {currentReport.name.replace(/^Dash\s*-?\s*/i, '')}
          </h1>
        </div>
      </div>

      <div className="section-spacing">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Total de Unidades */}
          <Card className="flex flex-row items-center bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 min-h-[110px]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-blue-700 mb-1">Total de Unidades</span>
              <span className="text-3xl font-bold text-blue-800">{currentReport?.totalUnits}</span>
              <span className="text-xs text-blue-600 mt-1">unidades monitoradas</span>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 ml-4">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
          </Card>

          {/* Card Unidades em Alerta */}
          <Card className="flex flex-row items-center bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 min-h-[110px]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-red-700 mb-1">Unidades em Alerta</span>
              <span className="text-3xl font-bold text-red-800">{currentReport?.highConsumptionUnitsCount}</span>
              <span className="text-xs text-red-600 mt-1">consumo elevado</span>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 ml-4">
              <TriangleAlert className="h-7 w-7 text-red-600" />
            </div>
          </Card>

          {/* Card Consumo Médio */}
          <Card className="flex flex-row items-center bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 min-h-[110px]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-emerald-700 mb-1">Consumo Médio</span>
              <span className="text-3xl font-bold text-emerald-800">{currentReport?.averageConsumption.toFixed(2)}</span>
              <span className="text-xs text-emerald-600 mt-1">m³ por unidade</span>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 ml-4">
              <Droplets className="h-7 w-7 text-emerald-600" />
            </div>
          </Card>
        </div>

        {/* Cards de Gráficos: Distribuição por Tendência e Top 5 Maiores Consumos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="bg-white rounded-2xl shadow-md overflow-hidden">
            <CardHeader className="px-4 py-3 border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
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

          <Card className="bg-white rounded-2xl shadow-md overflow-hidden">
            <CardHeader className="px-4 py-3 border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
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
                          color: '#374151',
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
                          color: '#f3f4f6'
                        },
                        border: {
                          display: false
                        },
                        ticks: { 
                          font: { size: 12 }, 
                          color: '#374151',
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