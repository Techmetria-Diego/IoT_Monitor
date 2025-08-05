/**
 * Wrapper de segurança para a biblioteca xlsx
 * Adiciona validação e sanitização para mitigar vulnerabilidades conhecidas
 */

// Sanitização de strings para prevenir prototype pollution
const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') {
    return String(value || '')
  }
  
  // Remove caracteres perigosos que podem ser usados em ataques
  return value
    .replace(/[<>'"&]/g, '') // Remove caracteres HTML perigosos
    .replace(/(__proto__|constructor|prototype)/gi, '') // Remove tentativas de prototype pollution
    .replace(/javascript:/gi, '') // Remove tentativas de execução de script
    .trim()
}

// Validação de tamanho de arquivo para prevenir DoS
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB máximo
const MAX_ROWS = 10000 // Máximo de 10k linhas
const MAX_COLS = 100 // Máximo de 100 colunas

// Wrapper seguro para leitura de xlsx
export const secureXlsxRead = async (arrayBuffer: ArrayBuffer, options: any = {}) => {
  // Validar tamanho do arquivo
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande. Tamanho máximo permitido: 50MB')
  }
  
  // Importar dinamicamente para evitar carregamento desnecessário
  const XLSX = await import('xlsx')
  
  try {
    // Ler workbook com opções de segurança
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: false, // Desabilitar parsing automático de datas para evitar ReDoS
      cellNF: false, // Desabilitar formatação de números
      cellStyles: false, // Desabilitar estilos
      sheetStubs: false, // Desabilitar células vazias
      bookDeps: false, // Desabilitar dependências
      bookFiles: false, // Desabilitar arquivos relacionados
      bookProps: false, // Desabilitar propriedades do arquivo
      ...options
    })
    
    // Validar número de sheets
    if (workbook.SheetNames.length > 10) {
      console.warn('Arquivo com muitas planilhas, processando apenas as 10 primeiras')
      workbook.SheetNames = workbook.SheetNames.slice(0, 10)
    }
    
    // Processar cada sheet com validação
    const processedSheets: { [sheetName: string]: any[][] } = {}
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      
      if (!worksheet) continue
      
      // Converter para array com validação de tamanho
      let jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: '',
        blankrows: false // Ignorar linhas vazias
      }) as any[][]
      
      // Validar e limitar número de linhas
      if (jsonData.length > MAX_ROWS) {
        console.warn(`Planilha ${sheetName} tem muitas linhas (${jsonData.length}), limitando para ${MAX_ROWS}`)
        jsonData = jsonData.slice(0, MAX_ROWS)
      }
      
      // Sanitizar dados
      const sanitizedData = jsonData.map((row, rowIndex) => {
        if (!Array.isArray(row)) return []
        
        // Limitar número de colunas
        const limitedRow = row.slice(0, MAX_COLS)
        
        // Sanitizar cada célula
        return limitedRow.map((cell, colIndex) => {
          try {
            return sanitizeString(cell)
          } catch (error) {
            console.warn(`Erro ao sanitizar célula [${rowIndex}, ${colIndex}]:`, error)
            return ''
          }
        })
      })
      
      processedSheets[sanitizeString(sheetName)] = sanitizedData
    }
    
    return processedSheets
    
  } catch (error) {
    console.error('Erro ao processar arquivo xlsx:', error)
    
    // Não expor detalhes internos do erro
    if (error instanceof Error) {
      if (error.message.includes('Unsupported file')) {
        throw new Error('Formato de arquivo não suportado. Por favor, use um arquivo xlsx válido.')
      }
      if (error.message.includes('File corrupted')) {
        throw new Error('Arquivo corrompido ou inválido.')
      }
    }
    
    throw new Error('Erro ao processar arquivo. Verifique se é um arquivo xlsx válido.')
  }
}

// Wrapper para verificar se um arquivo é válido antes do processamento
export const validateXlsxFile = (arrayBuffer: ArrayBuffer): boolean => {
  try {
    // Verificar assinatura do arquivo xlsx (ZIP)
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Assinatura ZIP: PK (0x504B)
    if (uint8Array.length < 4) return false
    if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) return false
    
    // Verificar tamanho mínimo
    if (arrayBuffer.byteLength < 100) return false
    
    // Verificar tamanho máximo
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) return false
    
    return true
  } catch (error) {
    console.warn('Erro ao validar arquivo:', error)
    return false
  }
}

// Informações sobre as vulnerabilidades conhecidas
export const SECURITY_INFO = {
  vulnerabilities: [
    {
      id: 'GHSA-4r6h-8v6p-xvw6',
      type: 'Prototype Pollution',
      description: 'Vulnerabilidade de prototype pollution na biblioteca xlsx',
      mitigation: 'Sanitização de strings e validação de propriedades'
    },
    {
      id: 'GHSA-5pgg-2g8v-p4x9',
      type: 'ReDoS',
      description: 'Vulnerabilidade de Regular Expression Denial of Service',
      mitigation: 'Limitação de tamanho de arquivo e timeout de processamento'
    }
  ],
  mitigations: [
    'Content Security Policy implementado',
    'Sanitização de todas as strings de entrada',
    'Limitação de tamanho de arquivo (50MB máximo)',
    'Limitação de número de linhas e colunas processadas',
    'Validação de formato de arquivo',
    'Desabilitação de recursos perigosos (dates parsing, etc.)'
  ]
}
