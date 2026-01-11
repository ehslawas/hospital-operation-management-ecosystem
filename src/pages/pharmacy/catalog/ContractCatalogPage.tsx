/**
 * Contract Catalog Page
 * Excel upload-based contract management system
 * Modern, professional UI with comprehensive functionality
 */

import React, { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Upload,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X as XIcon,
} from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { ExcelImport } from '@/components/pharmacy/ExcelImport'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import {
  getContracts,
  getContractKPIs,
  batchImportContracts,
  exportContractCatalog,
  deleteContract,
} from '@/services/pharmacy/contractCatalogService'
import { getStorageUrl } from '@/services/supabase'
import type { ContractWithRelations, ContractCatalogKPIs, ContractCatalogFilter } from '@/types/pharmacy'

// =====================================================
// KPI CARD COMPONENT
// =====================================================

interface KPICardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'amber' | 'red' | 'gray'
  subtitle?: string
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 border-amber-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200',
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border-gray-200',
  }

  const iconBgClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-red-500/10',
    gray: 'bg-gray-500/10',
  }

  return (
    <div className={`bg-white rounded-xl border ${colorClasses[color]} shadow-sm hover:shadow-md transition-all duration-200 p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs font-medium text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]} border ${colorClasses[color].split(' ')[0]}`}>
          <div className={colorClasses[color].split(' ')[1]}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MAIN CONTRACT CATALOG PAGE
// =====================================================

export const ContractCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  // State
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [kpis, setKpis] = useState<ContractCatalogKPIs>({
    total: 0,
    active: 0,
    expired: 0,
    expiring_soon: 0,
    pending: 0,
    total_value: 0,
    contracts_by_supplier: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Default sort: alphabetically by item name (A-Z)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'item_name',
    direction: 'asc'
  })

  // Load data
  useEffect(() => {
    if (user?.hospital_id) {
      loadContracts()
      loadKPIs()
    }
  }, [user?.hospital_id])

  const loadContracts = async () => {
    if (!user?.hospital_id) return

    setIsLoading(true)
    try {
      // For "expiring_soon", we'll filter client-side after fetching all active contracts
      // So fetch all contracts when expiring_soon filter is selected
      const filter: ContractCatalogFilter = {
        search: searchQuery || undefined,
        status: statusFilter !== 'all' && statusFilter !== 'expiring_soon' ? (statusFilter as any) : undefined,
        supplier_name: supplierFilter !== 'all' ? supplierFilter : undefined,
      }

      const result = await getContracts(user.hospital_id, filter)
      if (result.data) {
        setContracts(result.data)
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      console.error('Error loading contracts:', error)
      showError('Error', 'Failed to load contracts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadKPIs = async () => {
    if (!user?.hospital_id) return

    try {
      const result = await getContractKPIs(user.hospital_id)
      if (result.data) {
        setKpis(result.data)
      }
    } catch (error) {
      console.error('Error loading KPIs:', error)
    }
  }

  // Helper function to check if contract is expiring soon (within 60 days)
  const isExpiringSoon = (contract: ContractWithRelations): boolean => {
    if (!contract.end_date || contract.status !== 'active') return false
    const now = new Date()
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const endDate = new Date(contract.end_date)
    return endDate >= now && endDate <= sixtyDaysFromNow
  }

  // Handle search and filter changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadContracts()
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery, statusFilter, supplierFilter])

  // Get unique suppliers for filter dropdown (from all contracts, not filtered)
  const uniqueSuppliers = useMemo(() => {
    const suppliers = contracts
      .map(c => c.supplier_name)
      .filter((name): name is string => Boolean(name))
    return Array.from(new Set(suppliers)).sort()
  }, [contracts])

  // Handle import
  const handleImport = async (
    data: any[],
    mappings: any[],
    onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
  ) => {
    if (!user?.hospital_id) {
      return { success: 0, errors: ['User not authenticated'] }
    }

    console.log('handleImport called with:', {
      dataCount: data.length,
      hospital_id: user.hospital_id,
      sampleData: data.slice(0, 2),
      mappings: mappings,
    })

    // CRITICAL VALIDATION: Check if mappings look correct BEFORE importing
    // Verify that Drug Name column doesn't contain dates (common misalignment)
    const itemNameMapping = mappings.find(m => m.targetField === 'item_name')
    if (itemNameMapping) {
      const sampleRows = data.slice(0, Math.min(10, data.length))
      const itemNameColumn = itemNameMapping.excelColumn
      
      // Check first 10 rows to see if item_name contains dates
      const misalignedRows = sampleRows.filter(row => {
        const itemNameValue = row[itemNameColumn]
        if (!itemNameValue) return false
        
        const itemNameStr = String(itemNameValue).trim()
        // Check if it looks like a date (DD-Mon-YYYY, DD/MM/YYYY, etc.)
        return /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(itemNameStr) ||
               /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/i.test(itemNameStr) ||
               /^\d{1,2}-[A-Za-z]{3}-\d{4}$/i.test(itemNameStr)
      })
      
      if (misalignedRows.length > 0) {
        const errorMsg = `Column misalignment detected! The "Drug Name" column appears to contain dates instead of item names. Please check that your Excel file columns match the expected format:\n\n` +
          `Expected: Drug Name | No Kontrak | Kontrak Mula | Kontrak Tamat | Pembekal | Unit | Harga (RM) | Tempoh Serahan | SST\n\n` +
          `Mappings: ${mappings.map(m => `${m.excelColumn} -> ${m.targetField}`).join(', ')}\n\n` +
          `Sample data in Drug Name column: ${misalignedRows.map(r => r[itemNameColumn]).slice(0, 3).join(', ')}`
        
        console.error('[IMPORT] Column misalignment detected:', {
          mappings,
          sampleMisaligned: misalignedRows.slice(0, 3),
        })
        
        return { success: 0, errors: [errorMsg] }
      }
    }

    // Ask user if they want to replace existing contracts (if there are existing ones)
    const existingContractsCount = contracts.length
    let replaceExisting = false
    
    if (existingContractsCount > 0) {
      const shouldReplace = confirm(
        `You currently have ${existingContractsCount} contract(s) in the system.\n\n` +
        `Your Excel file contains ${data.length} contract(s).\n\n` +
        `Would you like to:\n` +
        `- OK: Replace ALL existing contracts with the new import (recommended if re-importing)\n` +
        `- Cancel: Keep existing contracts and add new ones (may create duplicates)`
      )
      
      replaceExisting = shouldReplace
      
      if (replaceExisting) {
        console.log('[IMPORT] User chose to replace existing contracts')
      } else {
        console.log('[IMPORT] User chose to keep existing contracts and add new ones')
      }
    }

    try {
      const result = await batchImportContracts(user.hospital_id, data, onProgress, replaceExisting)
      console.log('Import result:', result)

      if (result.data) {
        await new Promise(resolve => setTimeout(resolve, 100))

        // Reset filters and reload
        setSearchQuery('')
        setStatusFilter('all')
        setSupplierFilter('all')

        await loadContracts()
        await loadKPIs()

        if (result.data.success > 0) {
          showSuccess('Success', `Successfully imported ${result.data.success} contract(s)`)
        }
        return result.data
      } else if (result.error) {
        console.error('Import error:', result.error)
        showError('Error', result.error)
        return { success: 0, errors: [result.error] }
      }
      return { success: 0, errors: ['Unknown error'] }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import contracts'
      console.error('Import exception:', error)
      showError('Error', errorMsg)
      return { success: 0, errors: [errorMsg] }
    }
  }

  // Excel import field configuration
  const contractImportFields = [
    { key: 'item_name', label: 'Drug Name', required: true, type: 'string' as const },
    { key: 'contract_number', label: 'No Kontrak', required: true, type: 'string' as const },
    { key: 'start_date', label: 'Kontrak Mula', required: false, type: 'date' as const },
    { key: 'end_date', label: 'Kontrak Tamat', required: false, type: 'date' as const },
    { key: 'supplier_name', label: 'Pembekal', required: false, type: 'string' as const },
    { key: 'unit', label: 'Unit', required: false, type: 'string' as const },
    { key: 'unit_price', label: 'Harga (RM)', required: false, type: 'number' as const },
    { key: 'delivery_period', label: 'Tempoh Serahan', required: false, type: 'string' as const },
    { key: 'sst_rate', label: 'SST', required: false, type: 'string' as const },
    { key: 'status', label: 'Status', required: false, type: 'select' as const },
  ]

  // Handle export
  const handleExport = async () => {
    if (!user?.hospital_id) return

    setIsExporting(true)
    try {
      // For export, use sortedContracts (which includes client-side filtering for expiring_soon)
      // Export all filtered contracts, not just current page
      const contractsToExport = sortedContracts
      
      if (contractsToExport.length === 0) {
        showError('Error', 'No contracts to export')
        setIsExporting(false)
        return
      }

      // Build CSV from filtered contracts
      const headers = [
        'Drug Name',
        'No Kontrak',
        'Kontrak Mula',
        'Kontrak Tamat',
        'Pembekal',
        'Unit',
        'Harga (RM)',
        'Tempoh Serahan',
        'SST',
        'Status',
      ]

      const rows = contractsToExport.map(contract => [
        contract.item_name || '',
        contract.contract_number || '',
        contract.start_date || '',
        contract.end_date || '',
        contract.supplier_name || '',
        contract.unit || '',
        contract.unit_price?.toFixed(2) || '',
        contract.delivery_period || '',
        contract.sst_rate || '',
        contract.status || '',
      ])

      // Build CSV
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contract-catalog-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      showSuccess('Success', `Successfully exported ${contractsToExport.length} contract(s)`)
    } catch (error) {
      console.error('Error exporting contracts:', error)
      showError('Error', 'Failed to export contracts')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle delete
  const handleDelete = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return

    try {
      const result = await deleteContract(contractId)
      if (result.error) {
        showError('Error', result.error)
      } else {
        showSuccess('Success', 'Contract deleted successfully')
        loadContracts()
        loadKPIs()
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      showError('Error', 'Failed to delete contract')
    }
  }

  // Sort contracts - default to alphabetical A-Z by item name
  const sortedContracts = useMemo(() => {
    // Filter contracts client-side for "expiring_soon" since it's date-based
    let filteredContracts = [...contracts]
    
    if (statusFilter === 'expiring_soon') {
      filteredContracts = contracts.filter(c => isExpiringSoon(c))
    }
    
    // If no sort config, default to alphabetical by item name
    const activeSortConfig = sortConfig || { key: 'item_name', direction: 'asc' }

    return filteredContracts.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (activeSortConfig.key) {
        case 'item_name':
          // Remove leading/trailing whitespace and parentheses for better sorting
          aValue = (a.item_name || '').trim().replace(/^[\(\[]|[\)\]]$/g, '').toLowerCase()
          bValue = (b.item_name || '').trim().replace(/^[\(\[]|[\)\]]$/g, '').toLowerCase()
          break
        case 'contract_number':
          aValue = (a.contract_number || '').trim().toLowerCase()
          bValue = (b.contract_number || '').trim().toLowerCase()
          break
        case 'supplier_name':
          aValue = (a.supplier_name || '').trim().toLowerCase()
          bValue = (b.supplier_name || '').trim().toLowerCase()
          break
        case 'start_date':
          aValue = a.start_date || ''
          bValue = b.start_date || ''
          break
        case 'end_date':
          aValue = a.end_date || ''
          bValue = b.end_date || ''
          break
        case 'unit_price':
          aValue = a.unit_price || 0
          bValue = b.unit_price || 0
          break
        case 'status':
          aValue = (a.status || '').toLowerCase()
          bValue = (b.status || '').toLowerCase()
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Case-insensitive alphabetical comparison
        const comparison = aValue.localeCompare(bValue, undefined, { 
          sensitivity: 'base',
          numeric: true,
          ignorePunctuation: true
        })
        return activeSortConfig.direction === 'asc' ? comparison : -comparison
      } else {
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        return activeSortConfig.direction === 'asc' ? comparison : -comparison
      }
    })
  }, [contracts, sortConfig, statusFilter])

  // Paginated contracts
  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedContracts.slice(startIndex, endIndex)
  }, [sortedContracts, currentPage, pageSize])

  // Calculate pagination info
  const totalPages = Math.ceil(sortedContracts.length / pageSize)
  const startItem = sortedContracts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, sortedContracts.length)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, supplierFilter, sortConfig])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (statusFilter !== 'all') count++
    if (supplierFilter !== 'all') count++
    return count
  }, [searchQuery, statusFilter, supplierFilter])

  // Handle sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Get status color - matches database constraint: 'active', 'expired', 'terminated', 'pending'
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'terminated':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      // Backwards compatibility for old status values
      case 'expiring':
        return 'bg-amber-100 text-amber-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon - matches database constraint
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4" />
      case 'expired':
        return <XCircle className="w-4 h-4" />
      case 'terminated':
        return <XCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      // Backwards compatibility
      case 'expiring':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Format currency
  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null || typeof amount !== 'number') return '-'
    if (isNaN(amount)) return '-'
    return `RM ${amount.toFixed(2)}`
  }

  // Helper to get PDF URL - handles Supabase storage paths, absolute URLs, and relative paths
  // Tries multiple bucket names as fallback if 'contracts' bucket doesn't exist
  const getPdfUrl = (contract: ContractWithRelations): string | null => {
    // Priority 1: document_url field
    if (contract.document_url) {
      const url = contract.document_url.trim()
      
      // If it's already a complete absolute URL (http/https), return as-is
      if (url.match(/^https?:\/\//i)) {
        console.log('[PDF] Using complete absolute URL from document_url:', url)
        return url
      }
      
      // If it's a complete Supabase storage URL (includes full domain), return as-is
      if (url.includes('storage/v1/object/public/') && url.match(/^https?:\/\/.*\.supabase\.co/)) {
        console.log('[PDF] Using complete Supabase storage URL from document_url:', url)
        return url
      }
      
      // If it contains storage path but missing domain, extract bucket and reconstruct
      if (url.includes('storage/v1/object/public/')) {
        const pathMatch = url.match(/storage\/v1\/object\/public\/(.+)/)
        if (pathMatch) {
          const fullPath = pathMatch[1]
          const [bucket, ...pathParts] = fullPath.split('/')
          const constructedUrl = getStorageUrl(bucket, pathParts.join('/'))
          console.log('[PDF] Reconstructed storage URL from document_url:', { original: url, bucket, path: pathParts.join('/'), constructed: constructedUrl })
          return constructedUrl
        }
      }
      
      // If it looks like a bucket/path format (bucket-name/filename.pdf)
      if (url.match(/^[^\/\s]+\/.+$/)) {
        const [bucket, ...pathParts] = url.split('/')
        const constructedUrl = getStorageUrl(bucket, pathParts.join('/'))
        console.log('[PDF] Using bucket/path format from document_url:', { bucket, path: pathParts.join('/'), url: constructedUrl })
        return constructedUrl
      }
      
      // If it starts with /, treat as relative path - use 'documents' bucket first (most likely to exist)
      if (url.startsWith('/')) {
        const cleanPath = url.substring(1) // Remove leading slash
        // Use 'documents' bucket first as it's more likely to exist than 'contracts'
        const testUrl = getStorageUrl('documents', cleanPath)
        console.log(`[PDF] Using 'documents' bucket for relative path '${cleanPath}':`, testUrl)
        return testUrl
      }
      
      // Default: try 'documents' bucket first for filename (more likely to exist)
      // Only if it looks like a filename (has extension or is reasonable length)
      if (url.match(/\.[a-z]{2,4}$/i) || (url.length > 0 && url.length < 200)) {
        const testUrl = getStorageUrl('documents', url)
        console.log(`[PDF] Using 'documents' bucket for filename '${url}':`, testUrl)
        return testUrl
      }
    }

    // Priority 2: sst_rate field - check if it contains a URL (from Excel hyperlink or text)
    if (contract.sst_rate) {
      const sstValue = contract.sst_rate.trim()
      
      // FIRST: Check if it contains a complete URL pattern (might be from Excel hyperlink)
      // Excel hyperlinks are often stored as text that includes URLs
      const urlPattern = /(https?:\/\/[^\s\)]+)/i
      const urlMatch = sstValue.match(urlPattern)
      if (urlMatch) {
        const extractedUrl = urlMatch[1]
        console.log('[PDF] Extracted URL from sst_rate (Excel hyperlink?):', { original: sstValue, extracted: extractedUrl })
        return extractedUrl
      }
      
      // Check if the entire value is a complete absolute URL
      if (sstValue.match(/^https?:\/\//i)) {
        console.log('[PDF] Using absolute URL from sst_rate:', sstValue)
        return sstValue
      }
      
      // Check if it contains a Supabase URL pattern (even if not at start)
      if (sstValue.includes('supabase.co') || sstValue.includes('storage/v1/object/public/')) {
        // Extract URL if it's embedded in text
        const supabaseUrlPattern = /(https?:\/\/[^\s\)]*supabase\.co[^\s\)]*)/i
        const supabaseMatch = sstValue.match(supabaseUrlPattern)
        if (supabaseMatch) {
          const extractedUrl = supabaseMatch[1]
          console.log('[PDF] Extracted Supabase URL from sst_rate:', { original: sstValue, extracted: extractedUrl })
          return extractedUrl
        }
        
        // If it's a complete Supabase storage URL (includes full domain)
        if (sstValue.includes('storage/v1/object/public/') && sstValue.match(/^https?:\/\/.*\.supabase\.co/)) {
          console.log('[PDF] Using complete Supabase storage URL from sst_rate:', sstValue)
          return sstValue
        }
        
        // Check if it contains storage path (partial) - reconstruct with domain
        if (sstValue.includes('storage/v1/object/public/')) {
          const pathMatch = sstValue.match(/storage\/v1\/object\/public\/(.+)/)
          if (pathMatch) {
            const fullPath = pathMatch[1]
            const [bucket, ...pathParts] = fullPath.split('/')
            const constructedUrl = getStorageUrl(bucket, pathParts.join('/'))
            console.log('[PDF] Reconstructed storage URL from sst_rate:', { original: sstValue, bucket, path: pathParts.join('/'), constructed: constructedUrl })
            return constructedUrl
          }
        }
      }
      
      // Check if it looks like a PDF file path or contains PDF reference
      // Only if it doesn't look like a URL already
      if (!sstValue.includes('://') && !sstValue.includes('supabase') && !sstValue.includes('storage')) {
        if (sstValue.match(/\.(pdf|PDF)$/i) || sstValue.includes('pdf') || sstValue.match(/^[^\/\s]+\/.+$/)) {
          // If it's a bucket/path format (e.g., "documents/contracts/file.pdf")
          if (sstValue.match(/^[^\/\s]+\/.+$/)) {
            const [bucket, ...pathParts] = sstValue.split('/')
            const constructedUrl = getStorageUrl(bucket, pathParts.join('/'))
            console.log('[PDF] Using bucket/path format from sst_rate:', { bucket, path: pathParts.join('/'), url: constructedUrl })
            return constructedUrl
          }
          // Otherwise, assume it's just a filename and try 'documents' bucket
          const testUrl = getStorageUrl('documents', sstValue)
          console.log(`[PDF] Using 'documents' bucket for PDF filename '${sstValue}':`, testUrl)
          return testUrl
        }
      }
      
      // Last resort: if sst_rate looks like it might contain a URL but didn't match patterns above
      // Try to extract any URL-like string
      const anyUrlPattern = /(https?:\/\/[^\s\)]+[^\s\)\.])/i
      const anyUrlMatch = sstValue.match(anyUrlPattern)
      if (anyUrlMatch) {
        const extractedUrl = anyUrlMatch[1]
        console.log('[PDF] Extracted potential URL from sst_rate:', { original: sstValue, extracted: extractedUrl })
        return extractedUrl
      }
    }

    return null
  }

  // Handle PDF click - prevent navigation if URL is invalid
  const handlePdfClick = async (e: React.MouseEvent<HTMLButtonElement>, contract: ContractWithRelations) => {
    e.preventDefault()
    e.stopPropagation()

    const pdfUrl = getPdfUrl(contract)
    
    console.log('[PDF] Attempting to open PDF for contract:', {
      contract_number: contract.contract_number,
      item_name: contract.item_name,
      document_url: contract.document_url,
      sst_rate: contract.sst_rate,
      resolved_url: pdfUrl
    })

    if (!pdfUrl) {
      showError('Error', 'PDF document URL not available for this contract. Please check that document_url or sst_rate contains a valid PDF path.')
      return
    }

    // Validate and open PDF URL
    try {
      // Always ensure it's an absolute URL
      let finalUrl = pdfUrl
      
      // If it's already an absolute URL, use it directly
      if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
        // If it's a relative path, prepend current origin (this shouldn't happen, but handle it)
        if (pdfUrl.startsWith('/')) {
          finalUrl = window.location.origin + pdfUrl
        } else {
          // This shouldn't happen if getStorageUrl works correctly, but log it
          console.warn('[PDF] URL is not absolute, attempting to use as-is:', pdfUrl)
          finalUrl = pdfUrl
        }
      }

      // Validate URL format
      try {
        const urlObj = new URL(finalUrl)
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          showError('Error', 'Invalid PDF URL format. URL must start with http:// or https://')
          return
        }
      } catch (urlError) {
        console.error('[PDF] Invalid URL format:', finalUrl, urlError)
        showError('Error', `Invalid PDF URL format: ${finalUrl}. Please check the document_url or sst_rate value in the database.`)
        return
      }

      // Validate URL before opening - check if it points to a valid domain
      const urlObj = new URL(finalUrl)
      
      // Check if this is a Supabase storage URL that might fail
      if (urlObj.pathname.includes('/storage/v1/object/public/')) {
        // Extract bucket name from path for better error message
        const bucketMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)/)
        const bucketName = bucketMatch ? bucketMatch[1] : 'unknown'
        
        // Try to fetch the URL first to check if bucket exists
        // Note: CORS might prevent this, but we'll try
        try {
          const response = await fetch(finalUrl, { method: 'HEAD', mode: 'no-cors' })
          // If we get here, the request was sent (can't read response due to CORS)
        } catch (fetchError) {
          // CORS error is expected, but we can still try to open the URL
          console.log('[PDF] CORS check completed (expected to fail), proceeding to open URL')
        }
        
        // Open PDF in new tab
        console.log('[PDF] Opening PDF URL (Supabase storage):', { url: finalUrl, bucket: bucketName })
      } else {
        console.log('[PDF] Opening PDF URL (external):', finalUrl)
      }

      const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer')
      
      // Check if popup was blocked or if there's an error
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup might have been blocked - try alternative method
        console.warn('[PDF] Popup might have been blocked, trying alternative method')
        // Create a temporary link and click it
        const link = document.createElement('a')
        link.href = finalUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)
      } else {
        // Monitor the opened window for errors (with timeout)
        // Note: We can't directly detect 404s, but we can show helpful message
        setTimeout(() => {
          try {
            // Try to access the window's location - if it redirects to an error page, we'll know
            // This is a best-effort check
            if (newWindow.location && newWindow.location.href.includes('404') || newWindow.location.href.includes('error')) {
              console.warn('[PDF] Detected potential error in opened window')
              showError('Error', 'The PDF file could not be found. The storage bucket might not exist. Please create the bucket in Supabase Dashboard → Storage → New Bucket.')
            }
          } catch (e) {
            // Cross-origin error is expected if PDF loads successfully - ignore
            console.log('[PDF] Cannot access window location (expected for cross-origin):', e)
          }
        }, 1000)
      }

    } catch (error) {
      console.error('[PDF] Error opening PDF:', error, { pdfUrl: finalUrl, contract })
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Provide helpful error message if it's a bucket-related error
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('404')) {
        showError(
          'Storage Bucket Not Found',
          `The storage bucket for PDF documents does not exist.\n\n` +
          `To fix this:\n` +
          `1. Go to Supabase Dashboard → Storage\n` +
          `2. Click "New Bucket"\n` +
          `3. Create a bucket named "documents" (or "contracts", "files", etc.)\n` +
          `4. Set it to Public\n` +
          `5. Upload your PDF files to this bucket\n\n` +
          `Current PDF URL: ${finalUrl || pdfUrl}`
        )
      } else {
        showError('Error', `Failed to open PDF document: ${errorMessage}`)
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Contract Catalog
        </h1>
        <p className="text-gray-600 mt-1">
          Manage procurement contracts • {kpis.total} contract{kpis.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total"
          value={kpis.total}
          icon={<FileText className="w-6 h-6" />}
          color="gray"
        />
        <KPICard
          title="Active"
          value={kpis.active}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Expired"
          value={kpis.expired}
          icon={<XCircle className="w-6 h-6" />}
          color="red"
        />
        <KPICard
          title="Expiring Soon"
          value={kpis.expiring_soon}
          icon={<AlertCircle className="w-6 h-6" />}
          color="amber"
          subtitle="Within 60 days"
        />
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search contracts by name, number, or supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="min-w-[160px] py-2.5 pl-4 pr-10 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="relative">
              <Select
                value={supplierFilter}
                onChange={e => setSupplierFilter(e.target.value)}
                className="min-w-[180px] py-2.5 pl-4 pr-10 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Suppliers</option>
                {uniqueSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </Select>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setSupplierFilter('all')
                }}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-2 text-sm"
              >
                <XIcon className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
              <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
              <span className="font-semibold text-gray-900">{sortedContracts.length}</span> contracts
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Upload className="w-4 h-4" />
                Upload Excel
              </Button>
              <Button
                onClick={handleExport}
                variant="secondary"
                disabled={isExporting || contracts.length === 0}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading contracts...</p>
        </div>
      ) : paginatedContracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'all' || supplierFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : sortedContracts.length === 0
              ? 'Upload an Excel file to import contracts'
              : 'No contracts match your current page selection'}
          </p>
          {sortedContracts.length === 0 && (
            <Button onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Excel File
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('item_name')}
                  >
                    Drug Name {sortConfig.key === 'item_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('contract_number')}
                  >
                    No Kontrak {sortConfig.key === 'contract_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('start_date')}
                  >
                    Kontrak Mula {sortConfig.key === 'start_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('end_date')}
                  >
                    Kontrak Tamat {sortConfig.key === 'end_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('supplier_name')}
                  >
                    Pembekal {sortConfig.key === 'supplier_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50">
                    Unit
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('unit_price')}
                  >
                    Harga (RM) {sortConfig.key === 'unit_price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50">
                    Tempoh Serahan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50">
                    SST
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedContracts.map((contract) => {
                  // Determine row styling based on status
                  const isExpiring = isExpiringSoon(contract)
                  const isExpired = contract.status === 'expired'
                  
                  const rowClass = isExpiring
                    ? 'bg-amber-50/50 hover:bg-amber-100/50 border-l-4 border-amber-400 transition-colors'
                    : isExpired
                    ? 'bg-red-50/50 hover:bg-red-100/50 border-l-4 border-red-400 transition-colors'
                    : 'hover:bg-gray-50/50 transition-colors'
                  
                  return (
                  <tr key={contract.id} className={rowClass}>
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium max-w-xs">
                      <div className="break-words">{contract.item_name}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                      {contract.contract_number}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(contract.start_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(contract.end_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {contract.supplier_name || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {contract.unit || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                      {formatCurrency(contract.unit_price)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {contract.delivery_period || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        {/* Show SST rate value if available and not a URL/PDF */}
                        {contract.sst_rate && 
                         !contract.sst_rate.match(/^(https?:\/\/|.*\.pdf$|.*pdf|contracts\/)/i) && 
                         !contract.document_url && (
                          <span className="text-gray-900">{contract.sst_rate}</span>
                        )}
                        {/* Show PDF link if document_url exists or sst_rate is a URL/PDF */}
                        {getPdfUrl(contract) ? (
                          <button
                            type="button"
                            onClick={(e) => handlePdfClick(e, contract)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer transition-colors text-left"
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="break-words">View PDF</span>
                          </button>
                        ) : !contract.sst_rate && !contract.document_url && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {getStatusIcon(contract.status)}
                        {isExpiring ? 'Expiring Soon' : contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  Show
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="inline-block w-20 py-1.5 px-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  per page
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-all"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-700">
                Page <span className="font-semibold">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        targetFields={contractImportFields}
        catalogType="contract"
      />
    </div>
  )
}

export default ContractCatalogPage
