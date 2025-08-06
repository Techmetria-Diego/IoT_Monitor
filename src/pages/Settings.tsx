import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SecurityStatusCard } from '@/components/SecurityStatusCard'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  LogOut,
  LogIn,
  Save,
  Bell,
  Palette,
  FolderGit2,
  Mail,
  PlusCircle,
  Trash2,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { AppSettings } from '@/types'

const gdriveSchema = z.object({
  gcpProjectId: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(val),
      'ID do projeto inválido.',
    ),
  clientId: z
    .string()
    .min(1, 'O Client ID é obrigatório.')
    .refine(
      (id) => id.endsWith('.apps.googleusercontent.com'),
      'Formato de Client ID inválido.',
    ),
})

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    highConsumption: z.boolean(),
  }),
  alerts: z.object({
    emailEnabled: z.boolean(),
    emails: z.array(z.string().email('Formato de e-mail inválido.')),
  }),
}).refine(
  (data) => {
    if (data.alerts.emailEnabled && data.alerts.emails.length === 0) {
      return false
    }
    return true
  },
  {
    message: 'Adicione pelo menos um e-mail para receber alertas, ou desative a opção.',
    path: ['alerts', 'emails'],
  }
)

const emailSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
})

const SettingsPage = () => {
  const {
    disconnect,
    isConnected,
    isLoading,
    error,
    credentials,
    startAuthentication,
    settings,
    updateSettings,
  } = useAppStore()

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  })

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const gdriveForm = useForm<z.infer<typeof gdriveSchema>>({
    resolver: zodResolver(gdriveSchema),
    defaultValues: {
      clientId: credentials.clientId,
      gcpProjectId: credentials.gcpProjectId,
    },
  })

  useEffect(() => {
    settingsForm.reset(settings)
  }, [settings, settingsForm])

  const onSettingsSubmit = (data: AppSettings) => {
    updateSettings(data)
    toast.success('Preferências salvas com sucesso!')
    settingsForm.reset(data) // Resets dirty state
  }

  const onGDriveSubmit = (data: z.infer<typeof gdriveSchema>) => {
    useAppStore.setState((state) => ({
      credentials: { ...state.credentials, ...data },
      isConnected: false,
      error: null,
    }))
    startAuthentication()
  }

  const handleAddEmail = (data: z.infer<typeof emailSchema>) => {
    const currentEmails = settingsForm.getValues('alerts.emails') || []
    if (currentEmails.includes(data.email)) {
      toast.warning('Este e-mail já foi adicionado.')
      return
    }
    settingsForm.setValue('alerts.emails', [...currentEmails, data.email], {
      shouldDirty: true,
    })
    emailForm.reset()
  }

  const handleRemoveEmail = (index: number) => {
    const currentEmails = settingsForm.getValues('alerts.emails') || []
    const newEmails = currentEmails.filter((_, i) => i !== index)
    settingsForm.setValue('alerts.emails', newEmails, {
      shouldDirty: true,
    })
  }

  const renderErrorAlert = () => {
    if (!error || isLoading) return null

    if (error.type === 'ApiDisabledError') {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API do Google Drive Desativada</AlertTitle>
          <AlertDescription>
            Não foi possível conectar. A API do Google Drive não está ativada
            para este projeto no Google Cloud. Por favor, contate o
            administrador do sistema para ativá-la.
          </AlertDescription>
        </Alert>
      )
    }

    if (error.type !== 'InvalidCredentialsError') {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Conexão</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )
    }

    return null
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">
          Personalize a aparência, notificações e a conexão com o Google Drive.
        </p>
      </div>

      <Form {...settingsForm}>
        <form
          onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
          className="section-spacing"
        >
          <Card>
            <CardHeader className="card-responsive pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Palette className="h-5 w-5" /> Aparência
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Escolha como o aplicativo deve ser exibido.
              </CardDescription>
            </CardHeader>
            <CardContent className="card-responsive pt-0">
              <FormField
                control={settingsForm.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ThemeToggle
                        value={field.value}
                        onValueChange={(newTheme) => {
                          field.onChange(newTheme)
                          // Aplicar tema imediatamente
                          const root = document.documentElement
                          root.classList.remove('light', 'dark')
                          
                          if (newTheme === 'system') {
                            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                            root.classList.add(systemTheme)
                            console.log('🎨 Tema sistema aplicado imediatamente:', systemTheme)
                          } else {
                            root.classList.add(newTheme)
                            console.log('🎨 Tema aplicado imediatamente:', newTheme)
                          }
                          
                          // Salvar no store
                          updateSettings({ theme: newTheme })
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="card-responsive pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="h-5 w-5" /> Notificações do Sistema
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Gerencie como você recebe alertas e notificações no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="card-responsive pt-0">
              <FormField
                control={settingsForm.control}
                name="notifications.highConsumption"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Alertas de Alto Consumo
                      </FormLabel>
                      <FormDescription>
                        Receber notificações quando uma unidade apresentar
                        consumo acima do normal.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="card-responsive pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Mail className="h-5 w-5" /> Alertas por E-mail
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure os e-mails que receberão alertas de alto consumo.
              </CardDescription>
            </CardHeader>
            <CardContent className="card-responsive pt-0 space-y-6">
              <FormField
                control={settingsForm.control}
                name="alerts.emailEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Ativar alertas por e-mail
                      </FormLabel>
                      <FormDescription>
                        Enviar um e-mail quando for detectado alto consumo.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  E-mails para alertas
                </h4>
                <Form {...emailForm}>
                  <form
                    onSubmit={emailForm.handleSubmit(handleAddEmail)}
                    className="flex flex-col sm:flex-row items-start gap-2"
                  >
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input
                              placeholder="exemplo@email.com"
                              {...field}
                              disabled={
                                !settingsForm.watch('alerts.emailEnabled')
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={!settingsForm.watch('alerts.emailEnabled')}
                      className="text-primary-foreground w-full sm:w-auto"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </form>
                </Form>
                <div className="space-y-2 pt-2">
                  {settingsForm.watch('alerts.emails')?.length > 0 ? (
                    <ul className="divide-y rounded-md border">
                      {settingsForm.watch('alerts.emails').map((email, index) => (
                        <li
                          key={`email-${index}`}
                          className="flex items-center justify-between p-3"
                        >
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleRemoveEmail(index)}
                            disabled={
                              !settingsForm.watch('alerts.emailEnabled')
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum e-mail adicionado.
                    </p>
                  )}
                  <FormMessage>
                    {settingsForm.formState.errors.alerts?.emails?.message}
                  </FormMessage>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center sm:justify-end">
            <Button
              type="submit"
              disabled={
                !settingsForm.formState.isDirty ||
                settingsForm.formState.isSubmitting
              }
              className="text-primary-foreground w-full sm:w-auto button-responsive"
            >
              {settingsForm.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>

      <Separator className="my-8" />

      <Card>
        <CardHeader className="card-responsive pb-4">
          <CardTitle className="text-lg sm:text-xl">Conexão com Google Drive</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Gerencie a integração com o Google Drive usando OAuth 2.0.
          </CardDescription>
        </CardHeader>
        <Form {...gdriveForm}>
          <form onSubmit={gdriveForm.handleSubmit(onGDriveSubmit)}>
            <CardContent className="card-responsive space-y-6">
              {isConnected && (
                <Alert
                  variant="default"
                  className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                >
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertTitle className="text-success">
                    Conectado ao Google Drive
                  </AlertTitle>
                  <AlertDescription>
                    O sistema está conectado e pronto para sincronizar os dados.
                  </AlertDescription>
                </Alert>
              )}
              <Card className="bg-muted/50">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FolderGit2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Pasta Principal do Drive
                    </CardTitle>
                    <CardDescription className="text-xs">
                      ID: 1Rv4SQ8yutdF71WGOltUoUdFT3eTEmMYA
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    O sistema está configurado para ler os dados da pasta
                    principal pré-definida. Para alterar a pasta, por favor
                    contate o suporte.
                  </p>
                </CardContent>
              </Card>
              <FormField
                control={gdriveForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu Client ID do Google OAuth 2.0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Encontrado nas credenciais do seu projeto no Google Cloud
                      Console.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={gdriveForm.control}
                name="gcpProjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Projeto Google Cloud (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: meu-projeto-123456" {...field} />
                    </FormControl>
                    <FormDescription>
                      Fornecer o ID do projeto gera um link direto para ativar a
                      API em caso de erro.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {renderErrorAlert()}
            </CardContent>
            <CardFooter className="card-responsive flex flex-col sm:flex-row justify-between gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="text-primary-foreground w-full sm:w-auto button-responsive"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguardando...
                  </>
                ) : isConnected ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Reautenticar
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Conectar com Google
                  </>
                )}
              </Button>
              {isConnected && (
                <Button
                  variant="destructive"
                  onClick={disconnect}
                  type="button"
                  className="w-full sm:w-auto button-responsive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Desconectar
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Security Status Card */}
      <div className="section-spacing">
        <SecurityStatusCard />
      </div>
    </div>
  )
}

export default SettingsPage
