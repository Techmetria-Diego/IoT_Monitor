export interface PeriodFolder {
  id: string
  name: string // e.g., "06 - Junho - 2025"
  lastModified: string
  reportCount: number
}

export interface ReportFile {
  id: string // fileId of the .xlsx file
  name: string // e.g., "Condomínio Alpha"
  date: string // e.g., "06/06/2025"
  periodId: string
  status: 'normal' | 'alert' | 'error'
  highConsumptionUnitsCount: number
  alertBudget: number
  serviceType: 'water' | 'gas' | 'unknown'
}

export interface UnitData {
  id: string | number
  unidade: string
  numeroDeSerie?: string
  dispositivo?: string
  leituraAnterior: number
  leituraAtual: number
  consumo: number
  projecao30Dias: number
  tendencia:
    | 'Aumento Crítico'
    | 'Aumento'
    | 'Estável'
    | 'Crédito/Erro'
    | 'Sem Consumo'
  dataLeitura?: string
  isHighConsumption: boolean
  [key: string]: any // To accommodate other columns
}

export interface ReportDetails {
  id: string
  name: string
  totalUnits: number
  highConsumptionUnitsCount: number
  averageConsumption: number
  units: UnitData[]
}

export interface GDriveSettings {
  driveFolderUrl?: string
  clientId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: number
  gcpProjectId?: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    highConsumption: boolean
  }
  alerts: {
    emailEnabled: boolean
    emails: string[]
  }
}

export interface SearchResultFile {
  id: string
  name: string
  type: 'pdf' | 'image' | 'spreadsheet' | 'text'
  size: number // in bytes
  modifiedTime: string
  owner: string
  path: string
}
