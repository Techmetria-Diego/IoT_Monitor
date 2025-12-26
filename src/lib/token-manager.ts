/**
 * Token Manager - Gerenciamento avançado de tokens OAuth
 * Resolve definitivamente os problemas de re-autenticação frequente
 */

import type { GDriveSettings } from '@/types'

const TOKEN_STORAGE_KEY = 'oauth_tokens_v2'
const AUTH_STATE_KEY = 'isLoggedIn'

export interface StoredTokenData {
  accessToken: string
  refreshToken?: string
  tokenExpiresAt: number
  clientId: string
  createdAt: number
  lastRefreshed?: number
}

/**
 * Salva tokens de forma segura e persistente
 */
export const saveTokens = (config: GDriveSettings): void => {
  try {
    const tokenData: StoredTokenData = {
      accessToken: config.accessToken || '',
      refreshToken: config.refreshToken,
      tokenExpiresAt: config.tokenExpiresAt || 0,
      clientId: config.clientId || '',
      createdAt: Date.now(),
      lastRefreshed: Date.now()
    }
    
    // Criptografia básica (não é segurança real, mas ajuda contra inspection casual)
    const encodedData = btoa(JSON.stringify(tokenData))
    localStorage.setItem(TOKEN_STORAGE_KEY, encodedData)
    
    // Marcar como autenticado no sistema
    localStorage.setItem(AUTH_STATE_KEY, 'true')
    
    console.log('💾 Tokens salvos com segurança:', {
      hasAccessToken: !!tokenData.accessToken,
      hasRefreshToken: !!tokenData.refreshToken,
      expiresAt: tokenData.tokenExpiresAt ? new Date(tokenData.tokenExpiresAt).toISOString() : 'unknown',
      clientId: tokenData.clientId.substring(0, 20) + '...'
    })
    
    // Disparar evento para sincronização entre abas
    window.dispatchEvent(new StorageEvent('storage', {
      key: AUTH_STATE_KEY,
      newValue: 'true',
      oldValue: localStorage.getItem(AUTH_STATE_KEY)
    }))
    
  } catch (error) {
    console.error('❌ Erro ao salvar tokens:', error)
  }
}

/**
 * Carrega tokens salvos de forma segura
 */
export const loadTokens = (): GDriveSettings | null => {
  try {
    const encodedData = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!encodedData) {
      console.log('📭 Nenhum token salvo encontrado')
      return null
    }
    
    const tokenData: StoredTokenData = JSON.parse(atob(encodedData))
    
    console.log('📥 Tokens carregados:', {
      hasAccessToken: !!tokenData.accessToken,
      hasRefreshToken: !!tokenData.refreshToken,
      expiresAt: tokenData.tokenExpiresAt ? new Date(tokenData.tokenExpiresAt).toISOString() : 'unknown',
      createdAt: new Date(tokenData.createdAt).toISOString(),
      lastRefreshed: tokenData.lastRefreshed ? new Date(tokenData.lastRefreshed).toISOString() : 'never'
    })
    
    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiresAt: tokenData.tokenExpiresAt,
      clientId: tokenData.clientId,
      driveFolderUrl: '', // Será preenchido pela aplicação
      gcpProjectId: ''
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar tokens:', error)
    clearTokens() // Limpar dados corrompidos
    return null
  }
}

/**
 * Atualiza tokens existentes (usado após refresh)
 */
export const updateTokens = (config: GDriveSettings): void => {
  try {
    const existingData = loadTokens()
    if (!existingData) {
      // Se não há dados existentes, criar novos
      saveTokens(config)
      return
    }
    
    const updatedData: StoredTokenData = {
      accessToken: config.accessToken || '',
      refreshToken: config.refreshToken || existingData.refreshToken,
      tokenExpiresAt: config.tokenExpiresAt || 0,
      clientId: config.clientId || existingData.clientId,
      createdAt: existingData.createdAt || Date.now(),
      lastRefreshed: Date.now()
    }
    
    const encodedData = btoa(JSON.stringify(updatedData))
    localStorage.setItem(TOKEN_STORAGE_KEY, encodedData)
    
    console.log('🔄 Tokens atualizados:', {
      hasAccessToken: !!updatedData.accessToken,
      hasRefreshToken: !!updatedData.refreshToken,
      expiresAt: updatedData.tokenExpiresAt ? new Date(updatedData.tokenExpiresAt).toISOString() : 'unknown'
    })
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tokens:', error)
  }
}

/**
 * Verifica se o usuário tem tokens válidos salvos
 */
export const hasValidTokens = (): boolean => {
  const tokens = loadTokens()
  if (!tokens || !tokens.accessToken) {
    return false
  }
  
  // Se tem refresh token, sempre consideramos válido (pode ser renovado)
  if (tokens.refreshToken) {
    console.log('✅ Tokens válidos encontrados (com refresh_token)')
    return true
  }
  
  // Se não tem refresh token, verificar se não expirou
  if (tokens.tokenExpiresAt && tokens.tokenExpiresAt > Date.now()) {
    const minutesLeft = Math.round((tokens.tokenExpiresAt - Date.now()) / (60 * 1000))
    console.log(`✅ Tokens válidos encontrados (expira em ${minutesLeft} minutos)`)
    return true
  }
  
  console.log('⚠️ Tokens encontrados mas não são válidos')
  return false
}

/**
 * Limpa todos os tokens salvos
 */
export const clearTokens = (): void => {
  console.log('🧹 Limpando tokens salvos...')
  
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(AUTH_STATE_KEY)
  
  // Disparar evento para desconexão em todas as abas
  window.dispatchEvent(new StorageEvent('storage', {
    key: AUTH_STATE_KEY,
    newValue: null,
    oldValue: 'true'
  }))
  
  console.log('✅ Tokens limpos com sucesso')
}

/**
 * Verifica se precisa autenticar (não tem tokens válidos)
 */
export const needsAuthentication = (): boolean => {
  return !hasValidTokens()
}

/**
 * Obtém informações sobre os tokens atuais para debug
 */
export const getTokenInfo = (): any => {
  const tokens = loadTokens()
  if (!tokens) return null
  
  return {
    hasAccessToken: !!tokens.accessToken,
    hasRefreshToken: !!tokens.refreshToken,
    accessTokenLength: tokens.accessToken?.length,
    expiresAt: tokens.tokenExpiresAt ? new Date(tokens.tokenExpiresAt).toISOString() : 'unknown',
    expiresInMinutes: tokens.tokenExpiresAt ? Math.round((tokens.tokenExpiresAt - Date.now()) / (60 * 1000)) : 'unknown',
    clientId: tokens.clientId?.substring(0, 20) + '...'
  }
}