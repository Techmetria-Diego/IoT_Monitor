import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search as SearchIcon,
  Calendar as CalendarIcon,
  X,
  ArrowUpDown,
  Eye,
  FileText,
  Image,
  File,
  FolderSearch,
  RotateCcw,
  Grid3X3,
  List,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SearchResultFile } from '@/types'
import { useAppStore } from '@/stores/app-store'
import { FilePreview } from '@/components/FilePreview'
import { toast } from 'sonner'

const searchSchema = z.object({
  condominium: z.string().min(0).max(100, 'Máximo 100 caracteres'),
  period: z.string().optional(),
})

type SortKey = keyof SearchResultFile
type SortDirection = 'asc' | 'desc'

const SearchPage = () => {
  const {
    reports,
    periods,
    fetchReportsByPeriod,
  } = useAppStore()
  const [results, setResults] = useState<SearchResultFile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey
    direction: SortDirection
  }>({ key: 'modifiedTime', direction: 'desc' })
  const [fileToPreview, setFileToPreview] = useState<SearchResultFile | null>(
    null,
  )

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      condominium: '',
      period: 'all',
    },
  })

  const onSubmit = async (values: z.infer<typeof searchSchema>) => {
    setIsSearching(true)
    setHasSearched(true)
    toast.info('Realizando busca avançada...', {
      description: 'Buscando relatórios de condomínios',
    })
    let filteredResults: SearchResultFile[] = []
    try {
      // Se período selecionado, busca os relatórios desse período
      if (values.period && values.period !== 'all') {
        await fetchReportsByPeriod(values.period, true)
        const periodReports = reports[values.period] || []
        // Converter ReportFile para SearchResultFile
        filteredResults = periodReports
          .filter((file) => {
            return !values.condominium || file.name.toLowerCase().includes(values.condominium.toLowerCase())
          })
          .map((file): SearchResultFile => ({
            id: file.id,
            name: file.name,
            type: 'spreadsheet',
            size: 1024,
            modifiedTime: new Date().toISOString(),
            owner: 'Sistema',
            path: `/periodos/${file.periodId}/${file.name}`
          }))
      } else {
        // Busca em todos os períodos
        const allReports = Object.values(reports).flat()
        filteredResults = allReports
          .filter((file) => {
            return !values.condominium || file.name.toLowerCase().includes(values.condominium.toLowerCase())
          })
          .map((file): SearchResultFile => ({
            id: file.id,
            name: file.name,
            type: 'spreadsheet',
            size: 1024,
            modifiedTime: new Date().toISOString(),
            owner: 'Sistema',
            path: `/periodos/${file.periodId}/${file.name}`
          }))
      }
      setResults(filteredResults)
      setIsSearching(false)
      if (filteredResults.length > 0) {
        toast.success(`${filteredResults.length} relatório${filteredResults.length > 1 ? 's' : ''} encontrado${filteredResults.length > 1 ? 's' : ''}.`, {
          description: 'Busca concluída com sucesso',
        })
      } else {
        toast.info('Nenhum relatório encontrado', {
          description: 'Tente ajustar os filtros de busca',
        })
      }
    } catch (err) {
      setIsSearching(false)
      toast.error('Erro ao buscar relatórios', {
        description: String(err),
      })
    }
  }

  const clearSearch = () => {
    form.reset({
      condominium: '',
      period: 'all',
    })
    setResults([])
    setHasSearched(false)
    toast.info('Filtros limpos', {
      description: 'Todos os campos foram redefinidos',
    })
  }

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedResults = [...results].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  const getFileIcon = (type: SearchResultFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />
      case 'spreadsheet':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'text':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getFileTypeLabel = (type: SearchResultFile['type']) => {
    switch (type) {
      case 'spreadsheet':
        return 'Planilha'
      case 'pdf':
        return 'PDF'
      case 'image':
        return 'Imagem'
      case 'text':
        return 'Texto'
      default:
        return 'Arquivo'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const formatShortDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR })
  }

  const renderFileCard = (file: SearchResultFile, index: number) => (
    <Card
      key={file.id}
      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in-up border-2 border-border/50 hover:border-primary/30"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => setFileToPreview(file)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-muted border-2 border-border shadow-sm">
              {getFileIcon(file.type)}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold line-clamp-2 leading-5">
                {file.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {getFileTypeLabel(file.type)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            {formatFileSize(file.size)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Modificado</span>
            <span className="font-medium">{formatShortDate(file.modifiedTime)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Proprietário</span>
            <span className="font-medium truncate max-w-[120px]" title={file.owner}>
              {file.owner?.split?.('@')?.[0] || file.owner || 'N/A'}
            </span>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <span className="block truncate" title={file.path}>
              📁 {file.path}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <Card className="animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="animate-spin mb-4">
              <SearchIcon className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Buscando arquivos...</h3>
            <p className="text-muted-foreground max-w-md">
              Analisando o Google Drive para encontrar arquivos que correspondam aos seus critérios.
            </p>
          </CardContent>
        </Card>
      )
    }

    if (hasSearched && results.length === 0) {
      return (
        <Card className="animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderSearch className="h-16 w-16 text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Não encontramos arquivos que correspondam aos filtros especificados. 
              Tente ajustar os critérios de busca.
            </p>
            <Button variant="outline" onClick={clearSearch}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <SearchIcon className="h-16 w-16 text-muted-foreground" />
            <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Busca Avançada</h3>
          <p className="text-muted-foreground max-w-md">
            Configure os filtros ao lado e clique em "Buscar" para encontrar arquivos específicos no sistema.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="page-container animate-fade-in">
      <FilePreview
        file={fileToPreview}
        onOpenChange={() => setFileToPreview(null)}
      />
      
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/15 border-2 border-primary/30">
                <SearchIcon className="h-6 w-6 text-primary" />
              </div>
              Busca Avançada
            </h1>
            <p className="page-subtitle">
              Encontre arquivos e relatórios com filtros precisos e inteligentes.
            </p>
          </div>

          {/* Filters Section - Moved to top */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    {/* Filter Fields Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Condominium Field */}
                      <FormField
                        control={form.control}
                        name="condominium"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                              <SearchIcon className="h-4 w-4 text-primary" />
                              Condomínio
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Ex: Alpha, Beta, Gamma..."
                                  className="h-11 border-2 focus:border-primary/50 transition-colors"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Period Field */}
                      <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-semibold flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              Período
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 border-2 focus:border-primary/50 transition-colors">
                                  <SelectValue placeholder="Selecione um período" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Todos os períodos
                                  </div>
                                </SelectItem>
                                {periods.map((period) => (
                                  <SelectItem key={period.id} value={period.id}>
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      {period.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={isSearching}
                        className="h-11 bg-primary hover:bg-primary/90 flex-1 sm:flex-initial sm:min-w-[180px] transition-all shadow-md hover:shadow-lg"
                        size="lg"
                      >
                        <SearchIcon className="mr-2 h-4 w-4" />
                        {isSearching ? 'Buscando...' : 'Buscar Relatórios'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearSearch}
                        className="h-11 border-2 hover:bg-muted transition-colors min-w-[120px]"
                        disabled={isSearching}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Results Header */}
          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {results.length} relatório{results.length > 1 ? 's' : ''} encontrado{results.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value: 'grid' | 'list') => value && setViewMode(value)}
                className="border"
              >
                <ToggleGroupItem value="grid" aria-label="Visualização em Grade">
                  <Grid3X3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Visualização em Lista">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Results Content */}
        {results.length > 0 ? (
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedResults.map(renderFileCard)}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Tipo</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('name')}
                            className="h-auto p-0 font-semibold"
                          >
                            Nome do Arquivo
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('modifiedTime')}
                            className="h-auto p-0 font-semibold"
                          >
                            Modificado em
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('size')}
                            className="h-auto p-0 font-semibold"
                          >
                            Tamanho
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults.map((file, index) => (
                        <TableRow 
                          key={file.id}
                          className="cursor-pointer hover:bg-accent/50 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={() => setFileToPreview(file)}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getFileIcon(file.type)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="max-w-[250px] truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {getFileTypeLabel(file.type)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {formatDate(file.modifiedTime)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {formatFileSize(file.size)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFileToPreview(file)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  )
}

export default SearchPage
