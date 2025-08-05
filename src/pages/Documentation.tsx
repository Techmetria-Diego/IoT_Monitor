import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Book, 
  Settings, 
  Search, 
  AlertTriangle, 
  Gauge, 
  Database, 
  Cloud, 
  Shield, 
  FileText, 
  Users, 
  Monitor,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  FolderTree,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'

const Documentation = () => {
  return (
    <div className="page-container animate-fade-in">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="page-header text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Book className="h-12 w-12 text-primary" />
            <h1 className="page-title">Documentação do Sistema</h1>
          </div>
          <p className="page-subtitle max-w-3xl mx-auto">
            Guia completo para utilização do Sistema de Monitoramento IOT de Qualidade da Água
          </p>
        </div>

        <div className="section-spacing space-y-8">
          {/* Visão Geral */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Visão Geral do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O Sistema de Monitoramento IoT é uma plataforma web desenvolvida para gerenciar e visualizar dados 
                de consumo de água e gás em condomínios. O sistema conecta-se ao Google Drive para sincronizar planilhas Excel 
                e oferece funcionalidades avançadas de busca, alertas automáticos e análise detalhada de dados.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Gestão de Dados</h4>
                  <p className="text-sm text-muted-foreground">Sincronização automática com planilhas Excel</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Sistema de Alertas</h4>
                  <p className="text-sm text-muted-foreground">Detecção automática de alto consumo</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Busca Avançada</h4>
                  <p className="text-sm text-muted-foreground">Filtros personalizados por período e condomínio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades Principais */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Funcionalidades Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Gauge className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Dashboard</h4>
                      <p className="text-sm text-muted-foreground">
                        Visualização geral dos períodos disponíveis, resumo de alertas e estatísticas do sistema.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Sistema de Alertas</h4>
                      <p className="text-sm text-muted-foreground">
                        Detecção automática de unidades com alto consumo baseada na coluna TENDÊNCIA das planilhas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Busca Avançada</h4>
                      <p className="text-sm text-muted-foreground">
                        Pesquisa por período real, condomínio e outras características com filtros dinâmicos.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Configurações</h4>
                      <p className="text-sm text-muted-foreground">
                        Gerenciamento de credenciais OAuth do Google e configuração da pasta principal do Drive.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Cloud className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Sincronização</h4>
                      <p className="text-sm text-muted-foreground">
                        Sincronização automática com planilhas Excel do Google Drive via APIs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Relatórios Detalhados</h4>
                      <p className="text-sm text-muted-foreground">
                        Visualização completa de dados de consumo com análise de tendências por unidade.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Como Usar */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Como Usar o Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">1. Primeira Configuração</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acesse a página de Configurações e configure sua integração com Google Drive:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Insira o Client ID do Google OAuth 2.0</li>
                    <li>• Configure o ID da pasta principal do Google Drive</li>
                    <li>• Faça login com sua conta Google para autorizar o acesso</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">2. Navegação no Dashboard</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    O Dashboard é sua página inicial, onde você pode:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Visualizar resumo de alertas do período mais recente</li>
                    <li>• Acessar períodos disponíveis clicando nos cards</li>
                    <li>• Monitorar o status geral do sistema</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">3. Sistema de Alertas</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Monitore unidades com alto consumo automaticamente:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Alertas baseados na coluna TENDÊNCIA das planilhas</li>
                    <li>• Status calculado automaticamente (Normal/Alerta/Erro)</li>
                    <li>• Contagem de unidades com alto consumo por condomínio</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">4. Busca Avançada</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use filtros dinâmicos para encontrar relatórios específicos:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Filtre por períodos reais carregados do Google Drive</li>
                    <li>• Busque por nome de condomínio (Alpha, Beta, etc.)</li>
                    <li>• Visualize resultados em grade ou lista</li>
                    <li>• Acesse relatórios detalhados diretamente</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Relatórios */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Interpretação dos Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-400">Normal</h4>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Nenhuma unidade com alto consumo detectada
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">Alerta</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">
                      1-2 unidades com alto consumo detectadas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-400">Erro</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      3 ou mais unidades com alto consumo detectadas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estrutura de Dados */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary" />
                Estrutura de Dados no Google Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O sistema espera uma estrutura específica de pastas no Google Drive para funcionar corretamente:
              </p>
              <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div>📁 Pasta Principal (configurada nas Configurações)</div>
                  <div className="ml-4">├── 📁 01 - Janeiro - 2025</div>
                  <div className="ml-8">│   ├── � 01_01_2025</div>
                  <div className="ml-12">│   │   ├── 📄 Alpha_água_01.xlsx</div>
                  <div className="ml-12">│   │   ├── 📄 Beta_gás_01.xlsx</div>
                  <div className="ml-12">│   │   └── 📄 ...</div>
                  <div className="ml-8">│   ├── 📁 02_01_2025</div>
                  <div className="ml-8">│   └── 📁 ...</div>
                  <div className="ml-4">├── 📁 02 - Fevereiro - 2025</div>
                  <div className="ml-4">└── 📁 ...</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Importante:</h5>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Pastas de período: "XX - Mês - YYYY"</li>
                  <li>• Pastas diárias: "DD_MM_YYYY"</li>
                  <li>• Arquivos Excel (.xlsx) com dados de consumo</li>
                  <li>• Coluna TENDÊNCIA para detecção de alto consumo</li>
                  <li>• Estrutura case-sensitive</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tecnologias */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Tecnologias Utilizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">Frontend</Badge>
                  <p className="text-sm font-medium">React</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">TypeScript</Badge>
                  <p className="text-sm font-medium">Tipagem</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">Tailwind CSS</Badge>
                  <p className="text-sm font-medium">Estilização</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">Zustand</Badge>
                  <p className="text-sm font-medium">Estado Global</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">React Router</Badge>
                  <p className="text-sm font-medium">Navegação</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">Google APIs</Badge>
                  <p className="text-sm font-medium">Drive + Sheets</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">shadcn/ui</Badge>
                  <p className="text-sm font-medium">Componentes</p>
                </div>
                <div className="text-center p-3">
                  <Badge variant="secondary" className="mb-2">OAuth 2.0</Badge>
                  <p className="text-sm font-medium">Autenticação</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Disponíveis */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Ações e Controles do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <RefreshCw className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Sincronização</h4>
                    <p className="text-sm text-muted-foreground">
                      Botão na barra superior para atualizar dados do Google Drive
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Download className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Download de Relatórios</h4>
                    <p className="text-sm text-muted-foreground">
                      Acesso direto às planilhas Excel originais do Google Drive
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Upload className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Cache Inteligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema otimizado para reduzir chamadas à API
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suporte */}
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Suporte e Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Este sistema foi desenvolvido para ser robusto e fácil de usar. Em caso de problemas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Problemas Comuns:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• <strong>Erro de conexão:</strong> Verifique as credenciais OAuth e conexão</li>
                    <li>• <strong>Dados não aparecem:</strong> Confirme a estrutura de pastas e planilhas</li>
                    <li>• <strong>Sincronização lenta:</strong> Aguarde o processamento das planilhas Excel</li>
                    <li>• <strong>Alertas incorretos:</strong> Verifique a coluna TENDÊNCIA nas planilhas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Melhores Práticas:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Mantenha a estrutura de pastas e planilhas consistente</li>
                    <li>• Sincronize regularmente os dados</li>
                    <li>• Use nomes padronizados para os arquivos Excel</li>
                    <li>• Monitore alertas de alto consumo diariamente</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Documentation