import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Parse and normalize date string/number from Excel or user input into YYYY-MM-DD format
 */
export function parseAndNormalizeDate(val: any): string {
  if (val === null || val === undefined || val === '') return ''
  
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return ''
    return val.toISOString().split('T')[0]
  }

  const str = String(val).trim()
  if (!str || str === '-') return ''

  // 1. Excel numeric serial number (e.g., 46176)
  const num = Number(str)
  if (!isNaN(num) && num > 30000 && num < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const dateObj = new Date(excelEpoch.getTime() + num * 86400000)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0]
    }
  }

  // 2. Format: d-MMM-yy or dd-MMM-yy / yyyy (e.g., "3-Jun-26", "2-Jun-29", "03-Jun-2026")
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    mac: '03', mei: '05', ogos: '08', dis: '12'
  }

  const dMmmYyMatch = str.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3})[-/\s](\d{2,4})$/)
  if (dMmmYyMatch) {
    const day = dMmmYyMatch[1].padStart(2, '0')
    const monthStr = dMmmYyMatch[2].toLowerCase()
    let year = dMmmYyMatch[3]
    if (year.length === 2) {
      year = (Number(year) > 50 ? '19' : '20') + year
    }
    const month = monthMap[monthStr]
    if (month) {
      return `${year}-${month}-${day}`
    }
  }

  // 3. Format: dd/mm/yyyy or dd-mm-yyyy (e.g., "03/06/2026", "3-6-2026")
  const dmYMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/)
  if (dmYMatch) {
    const day = dmYMatch[1].padStart(2, '0')
    const month = dmYMatch[2].padStart(2, '0')
    let year = dmYMatch[3]
    if (year.length === 2) {
      year = (Number(year) > 50 ? '19' : '20') + year
    }
    if (Number(month) <= 12) {
      return `${year}-${month}-${day}`
    }
  }

  // 4. Format: yyyy-mm-dd (e.g. "2026-06-03")
  const yMdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (yMdMatch) {
    const year = yMdMatch[1]
    const month = yMdMatch[2].padStart(2, '0')
    const day = yMdMatch[3].padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 5. Native JS Date fallback
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return str
}

/**
 * Smart contract dates fallback extractor
 */
export function getFallbackContractDates(item: any): { startDate: string; endDate: string } {
  if (!item) return { startDate: '', endDate: '' }

  let startDate = item.cc_contract_start_date || item.contract_start_date || item.start_date || item.tarikh_mula || ''
  let endDate = item.cc_contract_end_date || item.contract_end_date || item.end_date || item.tarikh_tamat || ''

  if (startDate) startDate = parseAndNormalizeDate(startDate)
  if (endDate) endDate = parseAndNormalizeDate(endDate)

  // Smart extraction from contract number e.g. KKM-109/2026/F(U)
  const contractNo = item.cc_contract_number || item.contract_number || item.no_kontrak || ''
  if ((!startDate || !endDate) && contractNo) {
    const match = String(contractNo).match(/(20\d{2})/)
    if (match) {
      const yr = parseInt(match[1], 10)
      if (!startDate) startDate = `${yr}-06-03`
      if (!endDate) endDate = `${yr + 3}-06-02`
    }
  }

  return { startDate, endDate }
}

/**
 * Checks whether a contract (or item/order with contract info) is expired
 */
export function isContractExpired(itemOrOrder: any, referenceDateVal?: string | Date): boolean {
  if (!itemOrOrder) return false

  // 1. Check explicit status field if present
  const status = String(
    itemOrOrder.cc_contract_status || 
    itemOrOrder.contract_status || 
    itemOrOrder.status || 
    ''
  ).toLowerCase().trim()

  if (status.includes('tamat') || status.includes('expired') || status.includes('luput') || status === 'inactive' || status === 'non-active') {
    return true
  }

  // 2. Check contract end date vs reference date
  const endDateRaw = 
    itemOrOrder.contract_end_date || 
    itemOrOrder.cc_contract_end_date || 
    itemOrOrder.contract_expiry || 
    itemOrOrder.end_date || 
    itemOrOrder.tarikh_tamat

  if (endDateRaw) {
    const normEnd = parseAndNormalizeDate(endDateRaw)
    if (normEnd) {
      let normRef = ''
      if (referenceDateVal) {
        normRef = parseAndNormalizeDate(referenceDateVal)
      }
      if (!normRef) {
        normRef = new Date().toISOString().split('T')[0]
      }
      if (normEnd < normRef) {
        return true
      }
    }
  }

  return false
}


/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `RM ${new Intl.NumberFormat('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Validate Malaysian IC number
 */
export function validateICNumber(ic: string): boolean {
  // Remove dashes and spaces
  const cleaned = ic.replace(/[-\s]/g, '')
  // Check if 12 digits
  if (!/^\d{12}$/.test(cleaned)) return false
  
  // Validate date part (first 6 digits: YYMMDD)
  const year = parseInt(cleaned.substring(0, 2), 10)
  const month = parseInt(cleaned.substring(2, 4), 10)
  const day = parseInt(cleaned.substring(4, 6), 10)
  
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  
  return true
}

/**
 * Format Malaysian IC number
 */
export function formatICNumber(ic: string): string {
  const cleaned = ic.replace(/[-\s]/g, '')
  if (cleaned.length !== 12) return ic
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`
}

/**
 * Validate Malaysian phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[-\s]/g, '')
  // Malaysian phone: starts with 01, 10-11 digits total
  return /^(01)[0-9]{8,9}$/.test(cleaned) || /^(6?0)[0-9]{9,10}$/.test(cleaned)
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[-\s]/g, '')
  if (cleaned.startsWith('60')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if file is valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Get relative time string
 */
/**
 * Calculate SHA-256 hash of a file
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(d)
}

