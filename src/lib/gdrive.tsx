import type {
  PeriodFolder,
  ReportFile,
  ReportDetails,
  UnitData,
  GDriveSettings,
} from '@/types'

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files'
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets'
// No more threshold - we read high consumption directly from the spreadsheet's TENDÊNCIA column
// const HIGH_CONSUMPTION_THRESHOLD = 3 // REMOVED - using spreadsheet data instead
const MAIN_FOLDER_ID = '1Rv4SQ8yutdF71WGOltUoUdFT3eTEmMYA'

// Custom Error classes for better error identification
export class GDriveApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GDriveApiError'
  }
}

export class InvalidCredentialsError extends GDriveApiError {
  constructor() {
    const message =
      'Credenciais de autenticação inválidas ou expiradas. Por favor, autentique-se novamente.'
    super(message)
    this.name = 'InvalidCredentialsError'
  }
}

export class ApiDisabledError extends GDriveApiError {
  constructor() {
    const message = 'A API do Google Drive não está ativada para este projeto.'
    super(message)
    this.name = 'ApiDisabledError'
  }
}

export class InvalidValueError extends GDriveApiError {
  constructor(details: string) {
    const message = `Valor inválido fornecido à API do Google Drive. Detalhes: ${details}`
    super(message)
    this.name = 'InvalidValueError'
  }
}

export class FileNotFoundError extends GDriveApiError {
  constructor(fileId?: string) {
    const message = fileId
      ? `O arquivo ou pasta com ID '${fileId}' não foi encontrado. Verifique se foi movido, excluído ou se o ID está correto.`
      : 'O arquivo ou pasta solicitado não foi encontrado.'
    super(message)
    this.name = 'FileNotFoundError'
  }
}

export class PermissionError extends GDriveApiError {
  constructor(fileId?: string) {
    const message = fileId
      ? `Permissão negada para acessar o arquivo ou pasta com ID '${fileId}'. Verifique as permissões de compartilhamento no Google Drive.`
      : 'Permissão negada. Verifique as permissões de compartilhamento no Google Drive.'
    super(message)
    this.name = 'PermissionError'
  }
}

// API request helper with automatic token refresh
const makeApiRequest = async (
  url: string,
  config: GDriveSettings,
  fileIdForError?: string,
): Promise<any> => {
  const requestUrl = new URL(url)
  const headers: HeadersInit = {}

  console.log(
    `[GDrive API Request] Making request to: ${
      requestUrl.origin
    }${requestUrl.pathname}?${requestUrl.searchParams.get('q') || ''}`,
    { folderId: fileIdForError },
  )

  // CORREÇÃO: Usar o config diretamente primeiro, só validar se der erro 401
  let currentConfig = config
  
  if (currentConfig.accessToken) {
    headers['Authorization'] = `Bearer ${currentConfig.accessToken}`
  } else {
    throw new InvalidCredentialsError()
  }

  const response = await fetch(requestUrl.toString(), { headers })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    console.error('[GDrive API Error] Response:', {
      status: response.status,
      statusText: response.statusText,
      url: requestUrl.toString(),
      folderIdUsed: fileIdForError,
      body: data,
    })
    const error = data.error

    switch (response.status) {
      case 400: {
        const details =
          error?.errors?.[0]?.message ||
          error?.message ||
          'Requisição malformada.'
        throw new InvalidValueError(details)
      }
      case 401: {
        console.log('🔐 Token inválido, tentando renovar...')
        
        // Tentar renovar o token antes de falhar
        try {
          currentConfig = await validateAndRefreshToken(config)
          console.log('🔄 Token renovado, tentando novamente...')
          
          // Tentar a requisição novamente com o token renovado
          const retryHeaders: HeadersInit = {
            'Authorization': `Bearer ${currentConfig.accessToken}`
          }
          
          const retryResponse = await fetch(requestUrl.toString(), { headers: retryHeaders })
          
          if (retryResponse.ok) {
            const result = retryResponse.json()
            return { data: await result, config: currentConfig }
          } else {
            console.log('🔐 Retry também falhou, token realmente inválido')
            throw new InvalidCredentialsError()
          }
        } catch (refreshError) {
          console.log('🔐 Falha na renovação de token:', refreshError)
          throw new InvalidCredentialsError()
        }
      }
      case 403: {
        if (
          error &&
          (error.message?.includes('API has not been used') ||
            error.message?.includes('is disabled') ||
            error.message?.includes('Sheets API'))
        ) {
          // Check if it's specifically the Sheets API that's disabled
          if (url.includes('sheets.googleapis.com')) {
            throw new GDriveApiError(
              'A API do Google Sheets não está habilitada no seu projeto. ' +
              'Acesse o Google Cloud Console, vá para "APIs & Services" > "Library" ' +
              'e habilite a "Google Sheets API" para seu projeto.'
            )
          }
          throw new ApiDisabledError()
        }
        throw new PermissionError(fileIdForError)
      }
      case 404:
        throw new FileNotFoundError(fileIdForError)
      default: {
        let errorMessage = `Falha na API: ${response.status} ${response.statusText}.`
        if (error?.message) {
          errorMessage = `Erro do Google Drive: ${error.message}`
          if (error.errors && error.errors.length > 0) {
            const specificError = error.errors[0]
            errorMessage += ` Detalhe: ${specificError.message} (Razão: ${specificError.reason})`
          }
        }
        throw new GDriveApiError(errorMessage)
      }
    }
  }

  const result = response.json()
  
  // Return both the result and updated config if token was refreshed
  return { data: await result, config: currentConfig }
}

// Helper to extract a clean report name from filename
// Helper to extract a clean report name from filename
const extractReportName = (filename: string): string => {
  const nameWithoutExtension = filename.replace(/\.xlsx$/i, '').trim()
  const parts = nameWithoutExtension.split('_')
  const nameParts: string[] = []

  for (const part of parts) {
    const lowerPart = part.toLowerCase()
    // Stop when we hit a suffix part
    if (
      lowerPart === 'água' ||
      lowerPart === 'gas' ||
      lowerPart === 'gás' ||
      /^\d{2}$/.test(part)
    ) {
      break
    }
    nameParts.push(part)
  }

  return nameParts.join(' ').trim() || nameWithoutExtension
}

// Helper to determine service type from filename
const getServiceType = (filename: string): 'water' | 'gas' | 'unknown' => {
  const lowerCaseName = filename.toLowerCase()
  if (lowerCaseName.includes('_água')) {
    return 'water'
  }
  if (lowerCaseName.includes('_gás')) {
    return 'gas'
  }
  return 'unknown'
}

// Helper to count reports in a period folder
const countReportsInPeriod = async (
  periodId: string,
  config: GDriveSettings,
): Promise<number> => {
  const dailyFolderRegex = /^\d{2}_\d{2}_\d{4}$/
  const dailyFoldersQuery = `'${periodId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  const dailyFoldersUrl = `${DRIVE_API_URL}?q=${encodeURIComponent(
    dailyFoldersQuery,
  )}&fields=files(id,name)`
  const result = await makeApiRequest(dailyFoldersUrl, config, periodId)
  const allFoldersData = result.data || result

  const dailyFolders =
    allFoldersData.files?.filter((folder: any) =>
      dailyFolderRegex.test(folder.name),
    ) || []

  if (dailyFolders.length === 0) {
    return 0
  }

  const reportCounts = await Promise.all(
    dailyFolders.map(async (dailyFolder: any) => {
      const reportsQuery = `'${dailyFolder.id}' in parents and mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and trashed = false`
      const reportsUrl = `${DRIVE_API_URL}?q=${encodeURIComponent(
        reportsQuery,
      )}&fields=files(id,name)`
      const reportsResult = await makeApiRequest(
        reportsUrl,
        config,
        dailyFolder.id,
      )
      const reportsData = reportsResult.data || reportsResult
      const filteredFiles = reportsData.files?.filter((file: any) => 
        !file.name.toLowerCase().includes('servicepoints-techmetria')
      ) || []
      return filteredFiles.length
    }),
  )

  return reportCounts.reduce((sum, count) => sum + count, 0)
}

const getTendency = (consumo: number): UnitData['tendencia'] => {
  if (consumo < 0) return 'Crédito/Erro'
  if (consumo === 0) return 'Sem Consumo'
  if (consumo > 20) return 'Aumento Crítico'  // Using a high fixed value for fallback only
  if (consumo > 10) return 'Aumento'          // Using a medium fixed value for fallback only
  return 'Estável'
}

// Helper function to read XLSX file as Google Sheets
// Alternative method: Try to read XLSX directly (fallback approach)
const readXlsxDirectly = async (
  fileId: string,
  config: GDriveSettings,
  caller?: string
): Promise<{ values: any[][] }> => {
  console.log('🔄 Attempting direct XLSX read as fallback...')
  
  try {
    // Download the XLSX file content
    const fileResponse = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      }
    })
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to download XLSX file: ${fileResponse.statusText}`)
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer()
    console.log('📥 Downloaded XLSX file, size:', arrayBuffer.byteLength, 'bytes')
    
    // Import XLSX library dynamically
    console.log('📚 Importing XLSX library...')
    const XLSX = await import('xlsx')
    console.log('✅ XLSX library imported successfully')
    
    // Parse the XLSX file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('📚 Workbook loaded, sheets:', workbook.SheetNames)
    
    // Get the first sheet (or you could make this configurable)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convert to JSON format (array of arrays)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Return as array of arrays instead of array of objects
      raw: false, // Convert values to strings to maintain consistency
      defval: '' // Default value for empty cells
    })
    
    console.log(`✅ Successfully parsed XLSX file by [${caller}]:`, jsonData.length, 'rows')
    
    // Show data comparison for debugging
    if (caller) {
      console.log(`🔍 [${caller}] Data preview - First 5 rows:`)
      for (let i = 0; i < Math.min(5, (jsonData as any[][]).length); i++) {
        const row = (jsonData as any[][])[i]
        console.log(`  [${caller}] Row ${i + 1}:`, row?.slice(0, 5) || 'empty')
      }
    }
    
    return { values: jsonData as any[][] }
    
  } catch (error) {
    console.error('❌ Direct XLSX read failed:', error)
    console.error('� REFUSING to use mock data in direct read - will let conversion try')
    throw error
  }
}

const readXlsxAsSheets = async (
  fileId: string,
  config: GDriveSettings,
  caller?: string
): Promise<{ values: any[][] }> => {
  console.log(`🔍 readXlsxAsSheets called by [${caller || 'unknown'}] with fileId:`, fileId.substring(0, 8) + '...', 'Full ID:', fileId)
  
  // First try direct XLSX reading (more reliable)
  try {
    console.log('🔄 Attempting direct XLSX read first...')
    const directResult = await readXlsxDirectly(fileId, config, caller)
    
    // Check if we got real data (not mock data) - be more strict
    if (directResult.values && directResult.values.length > 12) {
      // Check for real headers in row 12 (index 11)
      const headerRow = directResult.values[11]
      if (headerRow && headerRow.length > 5 && 
          (headerRow.some(h => h && h.toString().includes('DESCRIÇÃO')) ||
           headerRow.some(h => h && h.toString().includes('CONSUMO')))) {
        console.log('✅ Direct XLSX read successful with REAL data, rows:', directResult.values.length)
        console.log('📋 Headers detected:', headerRow)
        return directResult
      }
    }
    console.log('⚠️ Direct XLSX read returned insufficient or mock data')
  } catch (directError) {
    console.error('❌ Direct XLSX read failed:', directError)
  }
  
  // Fallback: try Google Sheets conversion
  try {
    console.log('📄 Attempting to convert XLSX to Google Sheets as fallback...')
    const copyResponse = await fetch(`${DRIVE_API_URL}/${fileId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `temp_conversion_${Date.now()}`,
        mimeType: 'application/vnd.google-apps.spreadsheet'
      })
    })

    if (!copyResponse.ok) {
      console.error('❌ Failed to convert XLSX to Sheets:', copyResponse.status, copyResponse.statusText)
      throw new Error(`Failed to convert XLSX to Sheets: ${copyResponse.statusText}`)
    }

    const copyData = await copyResponse.json()
    const sheetsFileId = copyData.id
    console.log('✅ Successfully converted to Google Sheets. ID:', sheetsFileId)

    try {
      // Read data from the converted Google Sheets file
      const sheetsUrl = `${SHEETS_API_URL}/${sheetsFileId}/values/A:Z`
      console.log('📊 Reading data from converted sheets...')
      console.log('🔗 Sheets URL:', sheetsUrl)
      const sheetsResult = await makeApiRequest(sheetsUrl, config, sheetsFileId)
      const sheetsResponse = sheetsResult.data || sheetsResult
      
      console.log('✅ Successfully read data. Rows count:', sheetsResponse.values?.length || 0)
      if (sheetsResponse.values && sheetsResponse.values.length > 0) {
        console.log('📋 First row (headers):', sheetsResponse.values[0])
        if (sheetsResponse.values.length > 1) {
          console.log('📋 Second row (sample data):', sheetsResponse.values[1])
        }
      }
      return { values: sheetsResponse.values || [] }
    } finally {
      // Clean up: delete the temporary Google Sheets file
      console.log('🧹 Cleaning up temporary file:', sheetsFileId)
      await fetch(`${DRIVE_API_URL}/${sheetsFileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        }
      }).catch(err => console.warn('⚠️ Failed to cleanup temp file:', err))
    }
  } catch (error) {
    console.error('❌ Google Sheets conversion also failed:', error)
    console.error('� REFUSING to use mock data - will throw error instead')
    throw new GDriveApiError(`Failed to read real data from file ${fileId}: ${error}`)
  }
}

// Helper function to calculate report status based on real data
const calculateReportStatus = async (
  fileId: string,
  config: GDriveSettings,
): Promise<{ status: ReportFile['status']; highConsumptionUnitsCount: number }> => {
  try {
    const sheetData = await readXlsxAsSheets(fileId, config, 'calculateReportStatus')
    
    if (!sheetData.values || sheetData.values.length < 2) {
      return { status: 'normal', highConsumptionUnitsCount: 0 }
    }

    // Find the header row by looking for the row that contains "DESCRIÇÃO" or "CONSUMO"
    let headerRowIndex = -1
    let originalHeaders: any[] = []
    
    for (let i = 0; i < Math.min(20, sheetData.values.length); i++) {
      const row = sheetData.values[i]
      if (row && row.length > 0) {
        const rowText = row.join(' ').toUpperCase()
        if (rowText.includes('DESCRIÇÃO') || rowText.includes('DESCRICAO')) {
          headerRowIndex = i
          originalHeaders = row
          break
        }
      }
    }
    
    if (headerRowIndex === -1) {
      return { status: 'normal', highConsumptionUnitsCount: 0 }
    }
    const normalizedHeaders = originalHeaders.map((h: string) => {
      const headerText = h.trim().toLowerCase()
      const originalText = h.trim()
      
      // Map exact column names to standard field names - using SAME logic as fetchReportDetails
      if (headerText.includes('descrição') || originalText === 'DESCRIÇÃO' || originalText === 'Descrição') {
        return 'unidade'
      }
      else if (headerText.includes('nº série') || headerText.includes('numero') || originalText.includes('SÉRIE') || originalText.includes('Nº SÉRIE')) {
        return 'numeroserie'
      }
      else if (headerText.includes('dispositivo') || originalText.includes('DISPOSITIVO')) {
        return 'dispositivo'
      }
      else if (headerText.includes('lido de') || originalText.includes('LIDO DE')) {
        return 'lidode'
      }
      else if (headerText.includes('leitura anterior') || originalText.includes('LEITURA ANTERIOR')) {
        return 'leituraanterior'
      }
      else if (headerText.includes('leitura atual') || originalText.includes('LEITURA ATUAL')) {
        return 'leituraatual'
      }
      else if (headerText.includes('consumo') || originalText.includes('CONSUMO') || originalText.includes('Consumo')) {
        console.log(`✅ MATCHED CONSUMO: "${originalText}" → consumo`)
        return 'consumo'
      }
      else if (headerText.includes('projeção') || headerText.includes('projecao') || originalText.includes('PROJEÇÃO')) {
        return 'projecao30dias'
      }
      else if (headerText.includes('tendência') || headerText.includes('tendencia') || originalText.includes('TENDÊNCIA')) {
        return 'tendencia'
      }
      // Skip DISPOSITIVO and STATUS columns (not used) - SAME AS fetchReportDetails
      else if (originalText.includes('DISPOSITIVO') || originalText.includes('STATUS')) {
        console.log(`🚫 SKIPPING: "${originalText}" (not used)`)
        return 'skip'
      }
      
      // Fallback normalization
      return headerText.replace(/\s+/g, '').replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ç]/g, 'c')
    })

    const headerIndexMap: { [key: string]: number } = {}
    normalizedHeaders.forEach((header, index) => {
      if (header !== 'skip') {  // Don't map skipped columns - SAME LOGIC AS fetchReportDetails
        headerIndexMap[header] = index
      }
    })

    // We need both consumo and tendencia columns to determine high consumption
    const consumoIndex = headerIndexMap['consumo']
    const tendenciaIndex = headerIndexMap['tendencia']
    
    if (consumoIndex === undefined) {
      return { status: 'normal', highConsumptionUnitsCount: 0 }
    }

    let highConsumptionUnitsCount = 0
    // Start from row after headers
    const dataStartIndex = headerRowIndex + 1
    // Get report name for debugging
    let reportName = 'Unknown'
    try {
      const fileResponse = await fetch(`${DRIVE_API_URL}/${fileId}?fields=name`, {
        headers: { 'Authorization': `Bearer ${config.accessToken}` }
      })
      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        reportName = fileData.name || 'Unknown'
      }
    } catch (_e) {
      // Ignore name fetch errors for debugging
    }
    console.log(`🔍 calculateReportStatus [${reportName}] - FileID: ${fileId}`)
    console.log(`🔍 calculateReportStatus [${reportName}] - Using TENDÊNCIA column from spreadsheet (no threshold calculation)`)
    console.log(`🔍 calculateReportStatus [${reportName}] - Consumo index: ${consumoIndex}, Tendência index: ${tendenciaIndex}`)
    console.log(`🔍 calculateReportStatus [${reportName}] - Total data rows: ${sheetData.values.length - dataStartIndex}`)
    console.log(`🔍 calculateReportStatus [${reportName}] - Headers:`, originalHeaders)
    console.log(`🔍 calculateReportStatus [${reportName}] - Normalized headers:`, normalizedHeaders)
    
    const allConsumptionValues = []
    const highConsumptionDetails = []
    let processedRows = 0
    let emptyRowsSkipped = 0
    
    for (let i = dataStartIndex; i < sheetData.values.length; i++) {
      const row = sheetData.values[i]
      if (row.every((cell: any) => !cell)) {
        emptyRowsSkipped++
        continue
      }
      
      processedRows++
      const consumo = parseFloat(row[consumoIndex]) || 0
      allConsumptionValues.push(consumo)
      
      // Determine high consumption based on TENDÊNCIA column from spreadsheet
      let isHighConsumption = false
      if (tendenciaIndex !== undefined && row[tendenciaIndex]) {
        const tendencia = String(row[tendenciaIndex]).trim().toLowerCase()
        // Look specifically for "alto consumo" in the TENDÊNCIA column
        isHighConsumption = tendencia.includes('alto consumo') || tendencia.includes('alto') && tendencia.includes('consumo')
        
        // Debug log for the first few units to verify the logic
        if (processedRows <= 5) {
          console.log(`🔍 Row ${processedRows}: tendencia="${row[tendenciaIndex]}" → normalized="${tendencia}" → isHigh=${isHighConsumption}`)
        }
      } else {
        // Fallback: if no tendência column, consider consumption > 10m³ as high (this should rarely happen)
        isHighConsumption = consumo > 10
      }
      
      if (isHighConsumption) {
        highConsumptionUnitsCount++
        const unidade = row[headerIndexMap['unidade']] || `Linha ${i + 1}`
        const tendenciaValue = tendenciaIndex !== undefined ? row[tendenciaIndex] : 'N/A'
        highConsumptionDetails.push({ unidade, consumo, tendencia: tendenciaValue })
      }
    }
    
    console.log(`🔍 calculateReportStatus [${reportName}] - Processed rows: ${processedRows}, Skipped empty: ${emptyRowsSkipped}`)
    
    console.log(`📊 calculateReportStatus [${reportName}] - All consumption values:`, allConsumptionValues.slice(0, 10), allConsumptionValues.length > 10 ? `... and ${allConsumptionValues.length - 10} more` : '')
    console.log(`📊 calculateReportStatus [${reportName}] - High consumption details:`, highConsumptionDetails)
    console.log(`📊 calculateReportStatus [${reportName}] - High consumption count: ${highConsumptionUnitsCount} (based on TENDÊNCIA column)`)
    console.log(`📊 calculateReportStatus [${reportName}] - Data signature:`, JSON.stringify(sheetData.values).slice(0, 100) + '...')
    console.log(`📊 calculateReportStatus [${reportName}] - Raw data hash:`, JSON.stringify(sheetData.values).length)

    let status: ReportFile['status'] = 'normal'
    if (highConsumptionUnitsCount > 2) {
      status = 'error'
    } else if (highConsumptionUnitsCount > 0) {
      status = 'alert'
    }

    console.log(`📊 calculateReportStatus - Result: status=${status}, count=${highConsumptionUnitsCount}`)
    return { status, highConsumptionUnitsCount }
  } catch (error) {
    console.error('Error calculating report status:', error)
    // Return safe default values for failed cases
    return {
      status: 'normal' as const,
      highConsumptionUnitsCount: 0
    }
  }
}

// Temporary: Generate realistic mock data that matches real spreadsheet structure
// COMMENTED OUT - FORCING REAL DATA ONLY
/*
const generateRealisticMockData = (reportName: string) => {
  console.log('🎭 Generating realistic mock data for:', reportName)
  
  // Simulating Excel structure with empty rows at the top (rows 1-11 are empty/headers)
  const baseData = [
    // Row 1-11: Empty or header rows (simulating Excel structure)
    [], [], [], [], [], [], [], [], [], [], [],
    // Row 12: Column headers (this is where data actually starts) - using REAL column names
    ['DESCRIÇÃO', 'Nº SÉRIE', 'DISPOSITIVO', 'LIDO DE', 'LEITURA ANTERIOR (m³)', 'LEITURA ATUAL (m³)', 'CONSUMO (m³)', 'PROJEÇÃO 30 DIAS (m³)', 'STATUS', 'TENDÊNCIA'],
    // Row 13+: Actual data (10 columns to match header)
    ['101', 'SN88410', 'DEVICE001', '01/08/2025', '5240', '5250', '10.00', '300.00', 'OK', 'Estável'],
    ['102', 'SN86229', 'DEVICE002', '01/08/2025', '3549', '3555', '6.00', '180.00', 'OK', 'Estável'],
    ['103', 'SN39045', 'DEVICE003', '01/08/2025', '5881', '5917', '36.00', '1080.00', 'ALERT', 'Aumento Crítico'],
    ['104', 'SN54590', 'DEVICE004', '01/08/2025', '4227', '4228', '1.00', '30.00', 'OK', 'Estável'],
    ['105', 'SN58522', 'DEVICE005', '01/08/2025', '5752', '5753', '1.00', '30.00', 'OK', 'Estável'],
    ['106', 'SN18178', 'DEVICE006', '01/08/2025', '5670', '5679', '9.00', '270.00', 'OK', 'Estável'],
  ]
  
  return { values: baseData }
}
*/


// Function to validate if token is still valid and refresh if needed
const validateAndRefreshToken = async (config: GDriveSettings): Promise<GDriveSettings> => {
  try {
    if (!config.accessToken) {
      throw new InvalidCredentialsError()
    }
    
    // Check if token is about to expire (within 5 minutes)
    const now = Date.now()
    const tokenExpiresAt = config.tokenExpiresAt || 0
    const fiveMinutesFromNow = now + (5 * 60 * 1000)
    
    console.log('🔐 Token validation:', {
      tokenExpiresAt: tokenExpiresAt > 0 ? new Date(tokenExpiresAt).toISOString() : 'unknown',
      now: new Date(now).toISOString(),
      expiresInMinutes: tokenExpiresAt > 0 ? Math.round((tokenExpiresAt - now) / (60 * 1000)) : 'unknown',
      needsRefresh: tokenExpiresAt > 0 && tokenExpiresAt < fiveMinutesFromNow
    })
    
    // If token expires within 5 minutes, try to refresh it
    if (tokenExpiresAt > 0 && tokenExpiresAt < fiveMinutesFromNow && config.refreshToken) {
      console.log('🔄 Token expires soon, attempting refresh...')
      
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: config.refreshToken,
            client_id: config.clientId || '',
          }),
        })
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          console.log('✅ Token refresh successful')
          
          const newConfig = {
            ...config,
            accessToken: refreshData.access_token,
            tokenExpiresAt: now + (refreshData.expires_in * 1000),
            // Keep existing refresh token unless a new one is provided
            refreshToken: refreshData.refresh_token || config.refreshToken,
          }
          
          return newConfig
        } else {
          console.log('❌ Token refresh failed:', refreshResponse.status, refreshResponse.statusText)
          throw new InvalidCredentialsError()
        }
      } catch (refreshError) {
        console.log('❌ Token refresh error:', refreshError)
        throw new InvalidCredentialsError()
      }
    }
    
    // CORREÇÃO IMPORTANTE: Não fazer validação de token para tokens recém-obtidos
    // Se o token foi obtido recentemente (menos de 5 minutos), assumir que é válido
    if (tokenExpiresAt > 0 && tokenExpiresAt > now) {
      console.log('🔐 Token ainda válido por mais', Math.round((tokenExpiresAt - now) / (60 * 1000)), 'minutos')
      return config
    }
    
    // CORREÇÃO: Para tokens sem informação de expiração, ser mais tolerante
    // Em vez de fazer uma validação que pode falhar, simplesmente retornar o config
    if (tokenExpiresAt === 0) {
      console.log('🔐 Token sem informação de expiração, assumindo válido')
      return config
    }
    
    // Se chegou aqui, o token pode estar expirado, mas vamos tentar usar mesmo assim
    // Se realmente estiver inválido, o erro aparecerá nas chamadas da API
    console.log('⚠️ Token pode estar expirado, mas prosseguindo...')
    return config
    
  } catch (error) {
    console.log('🔐 Token validation/refresh error:', error)
    throw new InvalidCredentialsError()
  }
}

// Legacy function - kept for backward compatibility
const validateToken = async (config: GDriveSettings): Promise<boolean> => {
  try {
    await validateAndRefreshToken(config)
    return true
  } catch (_error) {
    return false
  }
}

export const gdriveApi = {
  validateToken,
  validateAndRefreshToken,
  
  connect: async (config: GDriveSettings): Promise<GDriveSettings> => {
    console.log('🔄 Iniciando conexão com Google Drive...')
    console.log('📋 Config recebido:', {
      hasAccessToken: !!config.accessToken,
      hasRefreshToken: !!config.refreshToken,
      hasClientId: !!config.clientId,
      tokenExpiresAt: config.tokenExpiresAt ? new Date(config.tokenExpiresAt).toISOString() : 'N/A'
    })
    
    if (!config || !config.accessToken) {
      console.error('❌ Config inválido ou sem token de acesso')
      throw new InvalidCredentialsError()
    }
    
    const folderId = MAIN_FOLDER_ID
    console.log('🔄 Testando conexão com pasta principal:', folderId)
    
    // CORREÇÃO: Testar conexão diretamente sem validação prévia
    // Se der erro, será tratado em makeApiRequest
    const result = await makeApiRequest(
      `${DRIVE_API_URL}/${folderId}?fields=id,name`,
      config,
      folderId,
    )
    
    console.log('✅ Conexão com Google Drive bem-sucedida!')
    
    // Return updated config (in case token was refreshed)
    return result.config || config
  },

  fetchPeriods: async (config: GDriveSettings): Promise<{ periods: PeriodFolder[], updatedConfig: GDriveSettings }> => {
    if (!config || !config.accessToken) throw new InvalidCredentialsError()
    const folderId = MAIN_FOLDER_ID

    const periodFolderRegex = /^\d{2}\s-\s[\wç\s]+ - \d{4}$/i
    const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name != 'Base'`
    const fields = 'files(id, name, modifiedTime)'
    const url = `${DRIVE_API_URL}?q=${encodeURIComponent(
      query,
    )}&fields=${encodeURIComponent(fields)}&orderBy=name desc`

    const result = await makeApiRequest(url, config, folderId)
    const data = result.data || result
    const updatedConfig = result.config || config

    const validPeriodFolders = data.files.filter((file: any) =>
      periodFolderRegex.test(file.name) && !file.name.toLowerCase().includes('servicepoints-techmetria'),
    )

    const periods: PeriodFolder[] = await Promise.all(
      validPeriodFolders.map(async (file: any) => {
        const reportCount = await countReportsInPeriod(file.id, updatedConfig)
        return {
          id: file.id,
          name: file.name,
          lastModified: file.modifiedTime,
          reportCount: reportCount,
        }
      }),
    )

    return { periods, updatedConfig }
  },

  fetchReportsByPeriod: async (
    periodId: string,
    config: GDriveSettings,
  ): Promise<{ reports: ReportFile[], updatedConfig: GDriveSettings }> => {
    if (!periodId) throw new GDriveApiError('ID do período não fornecido.')
    if (!config || !config.accessToken) throw new InvalidCredentialsError()

    const dailyFolderRegex = /^\d{2}_\d{2}_\d{4}$/
    const dailyFoldersQuery = `'${periodId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    const dailyFoldersUrl = `${DRIVE_API_URL}?q=${encodeURIComponent(
      dailyFoldersQuery,
    )}&fields=files(id, name)`
    const dailyFoldersResult = await makeApiRequest(
      dailyFoldersUrl,
      config,
      periodId,
    )
    const allFoldersData = dailyFoldersResult.data || dailyFoldersResult
    const updatedConfig = dailyFoldersResult.config || config

    const dailyFolders =
      allFoldersData.files?.filter((folder: any) =>
        dailyFolderRegex.test(folder.name),
      ) || []

    if (dailyFolders.length === 0) {
      return { reports: [], updatedConfig }
    }

    let allReports: ReportFile[] = []

    for (const dailyFolder of dailyFolders) {
      const reportsQuery = `'${dailyFolder.id}' in parents and mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and trashed = false`
      const reportsUrl = `${DRIVE_API_URL}?q=${encodeURIComponent(
        reportsQuery,
      )}&fields=files(id, name)`
      const reportsResult = await makeApiRequest(
        reportsUrl,
        updatedConfig,
        dailyFolder.id,
      )
      const reportsData = reportsResult.data || reportsResult

      if (reportsData.files) {
        const filteredFiles = reportsData.files.filter((file: any) => 
          !file.name.toLowerCase().includes('servicepoints-techmetria')
        )
        
        // Process each file to get real data-based status
        const reports = await Promise.all(filteredFiles.map(async (file: any) => {
          console.log(`🔄 Processing report: ${file.name}`)
          const { status, highConsumptionUnitsCount } = await calculateReportStatus(file.id, updatedConfig)
          console.log(`📋 Report ${file.name}: ${highConsumptionUnitsCount} units in alert (status: ${status})`)
          
          // DIAGNOSTIC: Double-check with direct details fetch for first few files
          if (filteredFiles.indexOf(file) < 2) {
            try {
              const detailsResult = await gdriveApi.fetchReportDetails(file.id, updatedConfig)
              const details = 'details' in detailsResult ? detailsResult.details : detailsResult
              const detailsCount = details.units.filter((u: UnitData) => u.isHighConsumption).length
              console.log(`🔍 DIAGNOSTIC - Report ${file.name}:`)
              console.log(`  - calculateReportStatus count: ${highConsumptionUnitsCount}`)
              console.log(`  - fetchReportDetails count: ${detailsCount}`)
              console.log(`  - Match: ${highConsumptionUnitsCount === detailsCount ? '✅' : '❌'}`)
              if (highConsumptionUnitsCount !== detailsCount) {
                console.warn(`⚠️ MISMATCH detected for ${file.name}! Using fetchReportDetails count.`)
                return {
                  id: file.id,
                  name: extractReportName(file.name),
                  date: dailyFolder.name.replace(/_/g, '/'),
                  periodId: periodId,
                  status: detailsCount > 2 ? 'error' : detailsCount > 0 ? 'alert' : 'normal',
                  highConsumptionUnitsCount: detailsCount,
                  alertBudget: 20,
                  serviceType: getServiceType(file.name),
                }
              }
            } catch (_e) {
              console.error(`Failed diagnostic check for ${file.name}:`, _e)
            }
          }

          return {
            id: file.id,
            name: extractReportName(file.name),
            date: dailyFolder.name.replace(/_/g, '/'),
            periodId: periodId,
            status: status,
            highConsumptionUnitsCount: highConsumptionUnitsCount,
            alertBudget: 20, // This can remain as a default value
            serviceType: getServiceType(file.name),
          }
        }))
        
        allReports = [...allReports, ...reports]
      }
    }

    const sortedReports = allReports.sort((a, b) => a.name.localeCompare(b.name))
    return { reports: sortedReports, updatedConfig }
  },

  fetchReportDetails: async (
    reportId: string,
    config: GDriveSettings,
  ): Promise<{ details: ReportDetails, updatedConfig: GDriveSettings }> => {
    if (!reportId) throw new GDriveApiError('ID do relatório não fornecido.')
    if (!config || !config.accessToken) throw new InvalidCredentialsError()

    const fileDetailsResult = await makeApiRequest(
      `${DRIVE_API_URL}/${reportId}?fields=name`,
      config,
      reportId,
    )
    const fileDetails = fileDetailsResult.data || fileDetailsResult
    const updatedConfig = fileDetailsResult.config || config
    const reportName = extractReportName(fileDetails.name)
    console.log(`🔍 fetchReportDetails [${reportName}] - FileID: ${reportId}`)
    console.log('📋 fetchReportDetails called for reportId:', reportId, 'reportName:', reportName)

    // Try to read real data from XLSX file, fallback to mock data if it fails
    const sheetData = await readXlsxAsSheets(reportId, updatedConfig, 'fetchReportDetails')
    console.log('📊 Received sheet data with', sheetData.values?.length || 0, 'rows')

    if (!sheetData.values || sheetData.values.length < 2) {
      throw new GDriveApiError(
        'A planilha está vazia ou não contém dados suficientes.',
      )
    }

    // Find the header row by looking for the row that contains "DESCRIÇÃO"
    let headerRowIndex = -1
    let originalHeaders: any[] = []
    
    console.log('🔍 Searching for header row containing "DESCRIÇÃO"...')
    for (let i = 0; i < Math.min(20, sheetData.values.length); i++) {
      const row = sheetData.values[i]
      console.log(`Row ${i + 1}:`, row?.slice(0, 5) || 'empty')
      
      if (row && row.length > 0) {
        const rowText = row.join(' ').toUpperCase()
        if (rowText.includes('DESCRIÇÃO') || rowText.includes('DESCRICAO')) {
          headerRowIndex = i
          originalHeaders = row
          console.log(`✅ Found headers at row ${i + 1} (index ${i})`)
          break
        }
      }
    }
    
    if (headerRowIndex === -1) {
      throw new GDriveApiError(
        'Não foi possível encontrar a linha de cabeçalhos contendo "DESCRIÇÃO". Verifique se a planilha está no formato correto.',
      )
    }
    const unitData: UnitData[] = []
    let totalConsumption = 0

    const normalizedHeaders = originalHeaders.map((h: string, index: number) => {
      const headerText = h.trim().toLowerCase()
      const originalText = h.trim()
      
      console.log(`🔍 fetchReportDetails - Processing header ${index}: "${originalText}" -> "${headerText}"`)
      
      // Map exact column names to standard field names - using REAL column structure
      // DESCRIÇÃO → unidade
      if (headerText.includes('descrição') || headerText.includes('descricao') || 
          originalText === 'DESCRIÇÃO' || originalText === 'Descrição' || originalText === 'DESCRICAO' ||
          originalText.toUpperCase().includes('DESCRI')) {
        console.log(`✅ MATCHED DESCRIÇÃO: "${originalText}" → unidade`)
        return 'unidade'
      } 
      // Nº SÉRIE → numeroserie  
      else if (headerText.includes('nº série') || originalText === 'Nº SÉRIE' || originalText === 'Nº Série') {
        console.log(`✅ MATCHED Nº SÉRIE: "${originalText}" → numeroserie`)
        return 'numeroserie'
      } 
      // LIDO DE → dataleitura (comes BEFORE leitura anterior/atual in real structure)
      else if (headerText.includes('lido de') || originalText === 'LIDO DE' || originalText === 'Lido de') {
        console.log(`✅ MATCHED LIDO DE: "${originalText}" → dataleitura`)
        return 'dataleitura'
      }
      // LEITURA ANTERIOR (m³) → leituraanterior
      else if (headerText.includes('leitura anterior') || originalText.includes('LEITURA ANTERIOR') || originalText.includes('Leitura Anterior')) {
        console.log(`✅ MATCHED LEITURA ANTERIOR: "${originalText}" → leituraanterior`)
        return 'leituraanterior'
      } 
      // LEITURA ATUAL (m³) → leituraatual
      else if (headerText.includes('leitura atual') || originalText.includes('LEITURA ATUAL') || originalText.includes('Leitura Atual')) {
        console.log(`✅ MATCHED LEITURA ATUAL: "${originalText}" → leituraatual`)
        return 'leituraatual'
      } 
      // CONSUMO (m³) → consumo
      else if (headerText.includes('consumo') || originalText.includes('CONSUMO') || originalText.includes('Consumo')) {
        console.log(`✅ MATCHED CONSUMO: "${originalText}" → consumo`)
        return 'consumo'
      } 
      // PROJEÇÃO 30 DIAS (m³) → projecao30dias
      else if (headerText.includes('projeção 30 dias') || originalText.includes('PROJEÇÃO 30 DIAS') || originalText.includes('Projeção 30 dias')) {
        console.log(`✅ MATCHED PROJEÇÃO 30 DIAS: "${originalText}" → projecao30dias`)
        return 'projecao30dias'
      } 
      // TENDÊNCIA → tendencia
      else if (headerText.includes('tendência') || headerText.includes('tendencia') || originalText.includes('TENDÊNCIA') || originalText.includes('Tendência')) {
        console.log(`✅ MATCHED TENDÊNCIA: "${originalText}" → tendencia`)
        return 'tendencia'
      }
      // Skip DISPOSITIVO and STATUS columns (not used)
      else if (originalText.includes('DISPOSITIVO') || originalText.includes('STATUS')) {
        console.log(`🚫 SKIPPING: "${originalText}" (not used)`)
        return 'skip'
      }
      
      // Fallback: normalize for any other columns
      return headerText.replace(/\s+/g, '').replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ç]/g, 'c')
    })

    console.log('🔍 DEBUGGING HEADER MAPPING:')
    console.log('📋 Original headers from row 12:', originalHeaders)
    console.log('📋 Normalized headers:', normalizedHeaders)

    const headerIndexMap: { [key: string]: number } = {}
    normalizedHeaders.forEach((header, index) => {
      if (header !== 'skip') {  // Don't map skipped columns
        headerIndexMap[header] = index
      }
      console.log(`  📍 Column ${index}: "${originalHeaders[index]}" → "${header}" ${header === 'skip' ? '(SKIPPED)' : ''}`)
    })

    console.log('🗺️ Complete header index map:', headerIndexMap)
    console.log('🔎 Looking for required columns:')
    console.log(`  - unidade (DESCRIÇÃO): ${headerIndexMap['unidade'] !== undefined ? 'FOUND at index ' + headerIndexMap['unidade'] : 'NOT FOUND'}`)
    console.log(`  - numeroserie (Nº Série): ${headerIndexMap['numeroserie'] !== undefined ? 'FOUND at index ' + headerIndexMap['numeroserie'] : 'NOT FOUND'}`)
    console.log(`  - leituraanterior: ${headerIndexMap['leituraanterior'] !== undefined ? 'FOUND at index ' + headerIndexMap['leituraanterior'] : 'NOT FOUND'}`)
    console.log(`  - leituraatual: ${headerIndexMap['leituraatual'] !== undefined ? 'FOUND at index ' + headerIndexMap['leituraatual'] : 'NOT FOUND'}`)
    console.log(`  - consumo: ${headerIndexMap['consumo'] !== undefined ? 'FOUND at index ' + headerIndexMap['consumo'] : 'NOT FOUND'}`)

    const requiredHeaders = [
      'unidade',
      'leituraanterior',
      'leituraatual',
      'consumo',
    ]
    
    // Check if we have any mapped headers at all
    const mappedCount = Object.keys(headerIndexMap).length
    console.log(`📊 Total mapped headers: ${mappedCount}`)
    
    // If no headers were mapped, it might be an issue with the data source
    if (mappedCount === 0) {
      console.log('⚠️ No headers were mapped! Checking if this is mock data...')
      if (sheetData.values.length <= 13) {
        console.log('📝 Appears to be mock data, let me check the structure...')
        for (let i = 0; i < sheetData.values.length; i++) {
          console.log(`Row ${i + 1}:`, sheetData.values[i])
        }
      }
    }
    
    for (const reqHeader of requiredHeaders) {
      if (headerIndexMap[reqHeader] === undefined) {
        console.log(`❌ Missing required header: ${reqHeader}`)
        console.log(`Available headers:`, Object.keys(headerIndexMap))
        throw new GDriveApiError(
          `A coluna obrigatória '${reqHeader}' não foi encontrada na planilha. ` +
          `Colunas disponíveis: ${Object.keys(headerIndexMap).join(', ')}. ` +
          `Verifique se a linha 12 contém os cabeçalhos: DESCRIÇÃO, Nº Série, Leitura Anterior, Leitura Atual, Consumo, Projeção 30 dias, Tendencia, Lido de.`,
        )
      }
    }

    // Start from row after headers
    const dataStartIndex = headerRowIndex + 1
    console.log(`📊 Starting data processing from row ${dataStartIndex + 1} (index ${dataStartIndex})`)
    
    for (let i = dataStartIndex; i < sheetData.values.length; i++) {
      const row = sheetData.values[i]
      if (row.every((cell: any) => !cell)) continue // Skip empty rows

      const consumo = parseFloat(row[headerIndexMap['consumo']]) || 0
      
      // Determine high consumption based on TENDÊNCIA column from spreadsheet
      let isHighConsumption = false
      if (headerIndexMap['tendencia'] !== undefined && row[headerIndexMap['tendencia']]) {
        const tendencia = String(row[headerIndexMap['tendencia']]).trim().toLowerCase()
        // Look specifically for "alto consumo" in the TENDÊNCIA column
        isHighConsumption = tendencia.includes('alto consumo') || tendencia.includes('alto') && tendencia.includes('consumo')
        
        // Debug log for the first few units to verify the logic
        if (i - dataStartIndex <= 5) {
          console.log(`🔍 fetchReportDetails Row ${i - dataStartIndex + 1}: tendencia="${row[headerIndexMap['tendencia']]}" → normalized="${tendencia}" → isHigh=${isHighConsumption}`)
        }
      } else {
        // Fallback: if no tendência column, consider consumption > 10m³ as high (this should rarely happen)
        isHighConsumption = consumo > 10
      }
      
      totalConsumption += consumo

      const serialNumber = row[headerIndexMap['numeroserie']] || 'N/A'
      
      // Debug log for first few units
      if (i <= 3) {
        console.log(`Unit ${i} serial number:`, serialNumber, 'from index:', headerIndexMap['numeroserie'], 'row value:', row[headerIndexMap['numeroserie']])
      }

      const unit: UnitData = {
        id: `unit-${i}`,
        unidade: row[headerIndexMap['unidade']] || `Unidade ${i}`,
        numeroDeSerie: serialNumber,
        leituraAnterior:
          parseFloat(row[headerIndexMap['leituraanterior']]) || 0,
        leituraAtual: parseFloat(row[headerIndexMap['leituraatual']]) || 0,
        consumo,
        projecao30Dias: parseFloat(row[headerIndexMap['projecao30dias']]) || (consumo * 30),
        tendencia: row[headerIndexMap['tendencia']] || getTendency(consumo),
        dataLeitura: row[headerIndexMap['dataleitura']] || '',
        isHighConsumption,
      }

      // Add any other dynamic columns
      originalHeaders.forEach((header: string, index: number) => {
        if (!Object.prototype.hasOwnProperty.call(unit, header)) {
          unit[header] = row[index] ?? ''
        }
      })

      unitData.push(unit)
    }

    const highConsumptionUnitsCount = unitData.filter(
      (u) => u.isHighConsumption,
    ).length
    
    const highConsumptionUnits = unitData.filter(u => u.isHighConsumption)
    const allConsumptionValues = unitData.map(u => u.consumo)
    console.log(`🔍 fetchReportDetails [${reportName}] - Total data rows: ${unitData.length}`)
    console.log(`🔍 fetchReportDetails [${reportName}] - Consumption values:`, allConsumptionValues)
    console.log(`🔍 fetchReportDetails [${reportName}] - High consumption count: ${highConsumptionUnitsCount}`)
    console.log(`🔍 fetchReportDetails [${reportName}] - High consumption units:`, highConsumptionUnits.map(u => ({ unidade: u.unidade, consumo: u.consumo })))
    console.log(`🔍 fetchReportDetails [${reportName}] - Raw data hash:`, JSON.stringify(sheetData.values).length)
    const averageConsumption =
      unitData.length > 0 ? totalConsumption / unitData.length : 0

    const details = {
      id: reportId,
      name: reportName,
      totalUnits: unitData.length,
      highConsumptionUnitsCount,
      averageConsumption,
      units: unitData,
    }

    return { details, updatedConfig }
  },

  startOAuthFlow: (config: GDriveSettings) => {
    console.log('🔄 Iniciando fluxo OAuth (IMPLÍCITO)...', { clientId: config.clientId?.substring(0, 20) + '...' })
    
    if (!config.clientId) {
      throw new GDriveApiError(
        'Client ID não configurado para autenticação OAuth.',
      )
    }
    const redirectUri = `${window.location.origin}/auth/callback`
    const scope = 'https://www.googleapis.com/auth/drive.readonly'
    
    // CORREÇÃO CRÍTICA: Gerar estado único e seguro em vez de usar pathname
    const state = crypto.randomUUID ? crypto.randomUUID() : 
                  Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    const currentPath = window.location.pathname // Salvar o path separadamente

    localStorage.setItem('oauth_state', state)
    localStorage.setItem('oauth_return_path', currentPath) // Salvar path de retorno separadamente
    
    console.log('🔐 Estado OAuth gerado:', state)
    console.log('📍 Caminho de retorno salvo:', currentPath)
    console.log('🔗 Redirect URI:', redirectUri)
    
    // Definir timeout para limpeza de estado (10 minutos)
    setTimeout(() => {
      if (localStorage.getItem('oauth_state') === state) {
        console.log('⏰ Limpando estado OAuth expirado')
        localStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_return_path')
      }
    }, 10 * 60 * 1000)

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    oauthUrl.searchParams.set('client_id', config.clientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('response_type', 'token') // CORREÇÃO: Usar fluxo implícito (token) em vez de code
    oauthUrl.searchParams.set('scope', scope)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('include_granted_scopes', 'true')
    // CORREÇÃO: Remover parâmetros relacionados ao fluxo de código
    // oauthUrl.searchParams.set('access_type', 'offline') // Não disponível no fluxo implícito
    // oauthUrl.searchParams.set('prompt', 'consent') // Não necessário para fluxo implícito

    console.log('🌐 URL OAuth gerada:', oauthUrl.toString())
    window.location.href = oauthUrl.toString()
  },
}
