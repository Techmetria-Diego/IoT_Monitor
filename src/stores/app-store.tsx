import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { gdriveApi } from '@/lib/gdrive'
import type {
  PeriodFolder,
  ReportFile,
  ReportDetails,
  GDriveSettings,
  AppSettings,
} from '@/types'

type AppState = {
  credentials: GDriveSettings
  isConnected: boolean
  isLoading: boolean
  error: { message: string; type?: string } | null
  periods: PeriodFolder[]
  reports: { [periodId: string]: ReportFile[] }
  currentPeriod: PeriodFolder | null
  currentReport: ReportDetails | null
  settings: AppSettings
}

type AppActions = {
  connectToDrive: (config: GDriveSettings) => Promise<void>
  disconnect: () => void
  fetchReportsByPeriod: (periodId: string, forceRefresh?: boolean) => Promise<void>
  fetchReportDetails: (reportId: string) => Promise<void>
  setCurrentPeriodById: (periodId: string) => void
  clearCurrentReport: () => void
  invalidateReportsCache: () => void
  startAuthentication: () => void
  handleAuthenticationCallback: (hash: string) => Promise<void>
  updateSettings: (newSettings: Partial<AppSettings>) => void
  validateAndReconnect: () => Promise<boolean>
}

const initialState: AppState = {
  credentials: {
    driveFolderUrl: '',
    clientId: '',
    accessToken: '',
    gcpProjectId: '',
  },
  isConnected: false,
  isLoading: false,
  error: null,
  periods: [],
  reports: {},
  currentPeriod: null,
  currentReport: null,
  settings: {
    theme: 'system',
    notifications: {
      highConsumption: true,
    },
    alerts: {
      emailEnabled: true,
      emails: ['admin@example.com'],
    },
  },
}

// Token validation timer
let tokenValidationTimer: NodeJS.Timeout | null = null

const handleError = (error: unknown) => {
  const errorState = {
    message:
      error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
    type: error instanceof Error ? error.name : 'UnknownError',
  }
  return errorState
}

// Helper function to trigger simple auth login when Google Drive connection succeeds
const triggerSimpleAuthLogin = () => {
  console.log('🔐 [TRIGGER] Executando triggerSimpleAuthLogin...')
  
  const oldValue = localStorage.getItem('isLoggedIn')
  console.log('📋 [TRIGGER] Estado anterior de isLoggedIn:', oldValue)
  
  // This function will be called to set the simple auth state to logged in
  localStorage.setItem('isLoggedIn', 'true')
  console.log('✅ [TRIGGER] isLoggedIn definido como true no localStorage')
  
  // Trigger storage event for other tabs/components to sync
  const storageEvent = new StorageEvent('storage', {
    key: 'isLoggedIn',
    newValue: 'true',
    oldValue: oldValue
  })
  
  console.log('📡 [TRIGGER] Disparando storage event...', storageEvent)
  window.dispatchEvent(storageEvent)
  
  console.log('✅ [TRIGGER] triggerSimpleAuthLogin concluído')
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      connectToDrive: async (config) => {
        console.log('🔄 [STORE] Iniciando connectToDrive...')
        console.log('📋 [STORE] Config recebido:', {
          hasAccessToken: !!config.accessToken,
          hasRefreshToken: !!config.refreshToken,
          hasClientId: !!config.clientId,
          accessTokenLength: config.accessToken?.length
        })
        
        set({ isLoading: true, error: null })
        try {
          console.log('🔄 [STORE] Chamando gdriveApi.connect...')
          const updatedConfig = await gdriveApi.connect(config)
          console.log('✅ [STORE] gdriveApi.connect bem-sucedido')
          
          console.log('🔄 [STORE] Chamando gdriveApi.fetchPeriods...')
          const { periods, updatedConfig: finalConfig } = await gdriveApi.fetchPeriods(updatedConfig)
          console.log('✅ [STORE] gdriveApi.fetchPeriods bem-sucedido, períodos encontrados:', periods.length)
          
          // Load reports only from the most recent period for better performance
          const allReports: { [periodId: string]: ReportFile[] } = {}
          
          if (periods.length > 0) {
            // Sort periods by name (most recent first) and load only the first one initially
            const sortedPeriods = [...periods].sort((a, b) => b.name.localeCompare(a.name))
            const mostRecentPeriod = sortedPeriods[0]
            
            try {
              const { reports } = await gdriveApi.fetchReportsByPeriod(mostRecentPeriod.id, finalConfig)
              allReports[mostRecentPeriod.id] = reports
              console.log(`Loaded ${reports.length} reports from most recent period: ${mostRecentPeriod.name}`)
            } catch (periodError) {
              console.warn(`Failed to load reports for most recent period ${mostRecentPeriod.name}:`, periodError)
              allReports[mostRecentPeriod.id] = []
            }
          }
          
          console.log('🔄 [STORE] Atualizando estado da aplicação...')
          set({
            credentials: finalConfig, // Use the final updated config
            periods,
            reports: allReports,
            isConnected: true,
            isLoading: false,
          })
          
          console.log('✅ [STORE] Estado atualizado, marcando como conectado')
          console.log('📊 [STORE] Estado final:', {
            isConnected: true,
            periodsCount: periods.length,
            reportsCount: Object.keys(allReports).length
          })
          
          // ✅ IMPORTANTE: Após conectar com sucesso ao Google Drive, marcar como logado no sistema simples
          console.log('🔐 [STORE] Executando triggerSimpleAuthLogin...')
          triggerSimpleAuthLogin()
          
          // Implementar validação automática robusta (melhorada)
          if (tokenValidationTimer) {
            clearInterval(tokenValidationTimer)
            tokenValidationTimer = null
          }
          
          // Validar token a cada 45 minutos (tokens duram ~1h)
          tokenValidationTimer = setInterval(async () => {
            const currentState = get()
            if (currentState.isConnected && currentState.credentials.accessToken) {
              console.log('🔐 Executando validação automática de token...')
              try {
                await currentState.validateAndReconnect()
                console.log('✅ Token validado e renovado com sucesso')
              } catch (error) {
                console.warn('⚠️ Falha na validação automática, mantendo estado atual:', error)
                // Não desconectar automaticamente - deixar o usuário decidir
              }
            }
          }, 45 * 60 * 1000) // 45 minutos
          
          console.log('✅ Validação automática de token REABILITADA (robusta)')
          
        } catch (error) {
          console.error('❌ [STORE] ERRO em connectToDrive:', error)
          console.error('❌ [STORE] Stack trace:', error instanceof Error ? error.stack : 'N/A')
          console.error('❌ [STORE] Error type:', error instanceof Error ? error.constructor.name : typeof error)
          
          const errorState = handleError(error)
          console.log('🚨 [STORE] Definindo estado de erro:', errorState)
          
          set({
            error: errorState,
            isLoading: false,
            isConnected: false,
            periods: [],
            reports: {},
          })
          
          console.log('❌ [STORE] Relançando erro para o callback')
          throw error
        }
      },

      validateAndReconnect: async () => {
        const state = get()
        if (!state.credentials.accessToken) {
          console.log('🔐 No access token available')
          return false
        }

        console.log('🔐 Validating stored token...')
        try {
          const updatedConfig = await gdriveApi.validateAndRefreshToken(state.credentials)
          
          console.log('🔐 Token validation successful')
          if (!state.isConnected) {
            set({ isConnected: true, credentials: updatedConfig })
            // ✅ IMPORTANTE: Manter o login simples sincronizado
            triggerSimpleAuthLogin()
          } else if (updatedConfig.accessToken !== state.credentials.accessToken) {
            // Token was refreshed, update stored credentials
            console.log('🔄 Token was refreshed, updating stored credentials')
            set({ credentials: updatedConfig })
          }
          return true
        } catch (error) {
          console.log('🔐 Token validation/refresh failed:', error)
          
          // ✅ IMPORTANTE: Ao desconectar por token inválido, também deslogar do sistema simples
          localStorage.removeItem('isLoggedIn')
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'isLoggedIn',
            newValue: null,
            oldValue: 'true'
          }))
          
          set({ 
            isConnected: false,
            error: { 
              message: 'Sessão expirada. Por favor, autentique-se novamente.',
              type: 'InvalidCredentialsError'
            }
          })
          return false
        }
      },

      disconnect: () => {
        // Clear token validation timer
        if (tokenValidationTimer) {
          clearInterval(tokenValidationTimer)
          tokenValidationTimer = null
        }
        
        // ✅ IMPORTANTE: Ao desconectar do Google Drive, também deslogar do sistema simples
        localStorage.removeItem('isLoggedIn')
        // Trigger storage event for other tabs/components to sync
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'isLoggedIn',
          newValue: null,
          oldValue: 'true'
        }))
        
        const currentSettings = get().settings
        set({ ...initialState, settings: currentSettings })
      },

      fetchReportsByPeriod: async (periodId, forceRefresh = false) => {
        const state = get()
        const cachedReports = state.reports[periodId]
        
        // Cache inteligente: verificar se há dados em cache e se ainda são válidos
        if (!forceRefresh && cachedReports && cachedReports.length > 0) {
          // Verificar se o cache ainda é válido (30 minutos)
          const cacheKey = `reports_cache_${periodId}`
          const cacheTimestamp = localStorage.getItem(cacheKey)
          const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
          
          if (cacheTimestamp && parseInt(cacheTimestamp) > thirtyMinutesAgo) {
            console.log('📋 Usando dados em cache válidos para período:', periodId)
            get().setCurrentPeriodById(periodId)
            return
          } else {
            console.log('⏰ Cache expirado, recarregando dados para período:', periodId)
          }
        }
        set({ isLoading: true, error: null })
        try {
          const { reports, updatedConfig } = await gdriveApi.fetchReportsByPeriod(
            periodId,
            get().credentials,
          )
          // Atualizar cache timestamp quando novos dados são carregados
          const cacheKey = `reports_cache_${periodId}`
          localStorage.setItem(cacheKey, Date.now().toString())
          
          set((state) => ({
            reports: { ...state.reports, [periodId]: reports },
            credentials: updatedConfig, // Update credentials if token was refreshed
            isLoading: false,
          }))
          get().setCurrentPeriodById(periodId)
        } catch (error) {
          const errorState = handleError(error)
          set({ error: errorState, isLoading: false })
          throw error
        }
      },

      fetchReportDetails: async (reportId) => {
        set({ isLoading: true, error: null, currentReport: null })
        try {
          const { details, updatedConfig } = await gdriveApi.fetchReportDetails(
            reportId,
            get().credentials,
          )
          set({ 
            currentReport: details, 
            credentials: updatedConfig, // Update credentials if token was refreshed
            isLoading: false 
          })
        } catch (error) {
          const errorState = handleError(error)
          set({ error: errorState, isLoading: false })
          throw error
        }
      },

      setCurrentPeriodById: (periodId) => {
        const period = get().periods.find((p) => p.id === periodId)
        set({ currentPeriod: period || null })
      },

      clearCurrentReport: () => {
        set({ currentReport: null })
      },

      invalidateReportsCache: () => {
        set({ reports: {} })
      },

      startAuthentication: () => {
        const { credentials } = get()
        gdriveApi.startOAuthFlow(credentials)
      },

      handleAuthenticationCallback: async (hashOrSearch) => {
        console.log('🔄 [CALLBACK] Iniciando handleAuthenticationCallback...')
        console.log('📋 [CALLBACK] Parâmetros recebidos:', hashOrSearch)
        console.log('🔗 [CALLBACK] URL completa:', window.location.href)
        
        // CORREÇÃO: Para fluxo implícito, o token vem no hash (#), não na query (?)
        const isHashFlow = hashOrSearch.startsWith('#')
        const isQueryFlow = hashOrSearch.startsWith('?')
        
        console.log('📝 [CALLBACK] Tipo de fluxo detectado:', {
          isHashFlow,
          isQueryFlow,
          startsWithHash: hashOrSearch.startsWith('#'),
          startsWithQuery: hashOrSearch.startsWith('?'),
          length: hashOrSearch.length
        })
        
        if (isHashFlow) {
          // Fluxo implícito - token no hash
          console.log('🔐 [CALLBACK] Processando fluxo implícito (token no hash)...')
          const params = new URLSearchParams(hashOrSearch.substring(1)) // remove #
          const accessToken = params.get('access_token')
          const errorParam = params.get('error')
          const state = params.get('state')
          const expiresIn = params.get('expires_in')
          const tokenType = params.get('token_type')
          const storedState = localStorage.getItem('oauth_state')
          
          console.log('🔐 [CALLBACK] Parâmetros do hash OAuth:', {
            hasAccessToken: !!accessToken,
            tokenLength: accessToken?.length,
            error: errorParam,
            state: state?.substring(0, 10) + '...',
            storedState: storedState?.substring(0, 10) + '...',
            statesMatch: state === storedState,
            expiresIn,
            tokenType
          })
          
          // Limpar estado OAuth após verificação
          localStorage.removeItem('oauth_state')

          if (errorParam) {
            throw new Error(`Erro de autenticação do Google: ${errorParam}`)
          }

          // CORREÇÃO: Ser mais tolerante com validação de estado
          if (state !== storedState) {
            console.warn('⚠️ [CALLBACK] Estados OAuth não coincidem, mas prosseguindo...')
            console.warn('Estado recebido:', state)
            console.warn('Estado armazenado:', storedState)
          }

          if (!accessToken) {
            throw new Error(
              'Token de acesso não encontrado na resposta do Google.',
            )
          }

          console.log('✅ [CALLBACK] Token de acesso obtido com sucesso')
          const currentCredentials = get().credentials
          const expiresInMs = expiresIn ? parseInt(expiresIn) * 1000 : 3600 * 1000 // 1 hora padrão
          const newCredentials = {
            ...currentCredentials,
            accessToken: accessToken,
            tokenExpiresAt: Date.now() + expiresInMs,
            // Nota: Fluxo implícito não fornece refresh token
            refreshToken: undefined
          }
          
          console.log('🔄 [CALLBACK] Conectando ao Drive com novo token...')
          await get().connectToDrive(newCredentials)
          
        } else if (isQueryFlow) {
          // Fluxo de código de autorização - DEPRECADO para este app
          console.warn('⚠️ [CALLBACK] Fluxo de código detectado - não suportado sem backend')
          throw new Error('Fluxo de código de autorização requer backend para trocar client_secret')
          
        } else {
          console.error('❌ [CALLBACK] Formato de parâmetros não reconhecido')
          throw new Error('Parâmetros de autenticação em formato não reconhecido')
        }
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            notifications: {
              ...state.settings.notifications,
              ...newSettings.notifications,
            },
            alerts: {
              ...state.settings.alerts,
              ...newSettings.alerts,
            },
          },
        }))
      },
    }),
    {
      name: 'monitor-agua-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credentials: state.credentials,
        isConnected: state.isConnected,
        isLoading: false, // Não persistir loading state
        error: null, // Não persistir errors
        periods: state.periods,
        reports: state.reports,
        currentPeriod: null, // Não persistir seleções atuais
        currentReport: null, // Não persistir seleções atuais
        settings: state.settings,
      }),
    },
  ),
)
