// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  RefreshCw,
  Settings,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
  LayoutGrid,
  List,
  ChevronRight,
  Sparkles,
  Plus,
  Edit,
  UploadCloud,
  X,
} from 'lucide-react'
import { Button, Input, Badge, Modal, LoadingOverlay, Spinner, DataTable } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatCurrency } from '@/lib/utils'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import {
  getSyncConfig,
  saveSyncConfig,
  syncContractsFromGoogleSheets,
  extractSheetId,
  type GoogleSheetsSyncConfig,
  type SyncResult,
} from '@/services/pharmacy/googleSheetsService'

interface Contract {
  id: string
  contract_number?: string
  contract_name: string
  supplier_name?: string
  contract_type?: string
  start_date?: string
  end_date?: string
  value?: number
  unit_price?: number
  sst_rate?: string
  document_url?: string
  item_code?: string
  currency?: string
  status: string
  metadata?: any
  last_synced_at?: string
}

// =====================================================
// SYNC CONFIGURATION MODAL
// =====================================================

interface SyncConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: GoogleSheetsSyncConfig) => Promise<void>
  config?: GoogleSheetsSyncConfig | null
}

const SyncConfigModal: React.FC<SyncConfigModalProps> = ({ isOpen, onClose, onSave, config }) => {
  const [formData, setFormData] = useState<GoogleSheetsSyncConfig>({
    sheet_id: '',
    sheet_name: 'Sheet1',
    range: '',
    sync_type: 'contracts',
    auto_sync_enabled: false,
    sync_interval_minutes: 60,
    api_key: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (config) {
      setFormData({
        sheet_id: config.sheet_id || '',
        sheet_name: config.sheet_name || 'Sheet1',
        range: config.range || '',
        sync_type: config.sync_type || 'contracts',
        auto_sync_enabled: config.auto_sync_enabled || false,
        sync_interval_minutes: config.sync_interval_minutes || 60,
        api_key: config.api_key || '',
      })
    } else {
      setFormData({
        sheet_id: '',
        sheet_name: 'Sheet1',
        range: '',
        sync_type: 'contracts',
        auto_sync_enabled: false,
        sync_interval_minutes: 60,
        api_key: '',
      })
    }
    setErrors({})
  }, [config, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.sheet_id.trim()) {
      newErrors.sheet_id = 'Google Sheet ID or URL is required'
      setErrors(newErrors)
      return false
    }

    // Extract sheet ID from URL if user pasted full URL
    const extractedId = extractSheetId(formData.sheet_id)
    if (!extractedId) {
      newErrors.sheet_id = 'Invalid Google Sheet ID or URL. Please check the format.'
      setErrors(newErrors)
      return false
    }

    // Update form with extracted ID for display
    if (extractedId !== formData.sheet_id) {
      setFormData(prev => ({ ...prev, sheet_id: extractedId }))
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Sheets Sync Configuration" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>How to get your Google Sheet ID:</strong>
            <br />
            1. Open your Google Sheet
            <br />
            2. Look at the URL: <code className="bg-blue-100 px-1 rounded">https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit</code>
            <br />
            3. Copy the <code className="bg-blue-100 px-1 rounded">SHEET_ID_HERE</code> part, or paste the full URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google Sheet ID or URL <span className="text-rose-500">*</span>
          </label>
          <Input
            value={formData.sheet_id}
            onChange={e => {
              setFormData({ ...formData, sheet_id: e.target.value })
              if (errors.sheet_id) setErrors({ ...errors, sheet_id: '' })
            }}
            placeholder="Enter Sheet ID or full URL"
            error={errors.sheet_id}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name</label>
          <Input
            value={formData.sheet_name}
            onChange={e => setFormData({ ...formData, sheet_name: e.target.value })}
            placeholder="Sheet1"
          />
          <p className="mt-1 text-xs text-gray-500">Name of the worksheet tab (default: Sheet1)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Range (Optional)</label>
          <Input
            value={formData.range}
            onChange={e => setFormData({ ...formData, range: e.target.value })}
            placeholder="A1:Z1000"
          />
          <p className="mt-1 text-xs text-gray-500">Specific range to sync (e.g., A1:Z1000). Leave empty for all data.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key <span className="text-amber-600">(Recommended)</span>
          </label>
          <Input
            type="password"
            value={formData.api_key}
            onChange={e => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="Enter Google Sheets API key"
          />
          <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
            <p className="text-sm text-blue-900 font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span>
              For View-Only Sheets (You Don't Own the Document)
            </p>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-2">✅ Recommended Solution:</p>
                <p className="text-xs text-blue-700">
                  <strong>Ask the sheet owner</strong> to make it publicly viewable:
                </p>
                <ol className="ml-4 mt-1 text-xs text-blue-700 list-decimal space-y-1">
                  <li>Owner opens the Google Sheet</li>
                  <li>Click <strong>"Share"</strong> button (top right)</li>
                  <li>Click <strong>"Change"</strong> next to "Restricted"</li>
                  <li>Select <strong>"Anyone with the link"</strong></li>
                  <li>Set permission to <strong>"Viewer"</strong></li>
                  <li>Click <strong>"Done"</strong></li>
                </ol>
                <p className="text-xs text-blue-600 mt-2 italic">
                  This is the easiest solution and doesn't require any technical setup!
                </p>
              </div>
              
              <div className="bg-white p-3 rounded border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-2">🔧 Alternative (If owner can't make it public):</p>
                <p className="text-xs text-amber-700 mb-2">
                  Use a <strong>Service Account</strong> with API key:
                </p>
                <ol className="ml-4 text-xs text-amber-700 list-decimal space-y-1">
                  <li>
                    Create a service account in{' '}
                    <a
                      href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Create a JSON key for the service account</li>
                  <li>Share the Google Sheet with the service account email (as Viewer)</li>
                  <li>Use the service account credentials to generate an API key</li>
                  <li>Enter the API key below</li>
                </ol>
                <p className="text-xs text-amber-600 mt-2 italic">
                  Note: This requires technical knowledge and Google Cloud Console access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_sync"
            checked={formData.auto_sync_enabled}
            onChange={e => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <label htmlFor="auto_sync" className="text-sm font-medium text-gray-700">
            Enable automatic sync
          </label>
        </div>

        {formData.auto_sync_enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval (minutes)</label>
            <Input
              type="number"
              value={formData.sync_interval_minutes}
              onChange={e => setFormData({ ...formData, sync_interval_minutes: parseInt(e.target.value) || 60 })}
              min={5}
              max={1440}
            />
            <p className="mt-1 text-xs text-gray-500">How often to automatically sync (minimum: 5 minutes)</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// MAIN CONTRACT CATALOG PAGE
// =====================================================

export const ContractCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncConfig, setSyncConfig] = useState<GoogleSheetsSyncConfig | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'almost_expired' | 'expired'>('all')
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    loadContracts()
    loadSyncConfig()
  }, [])

  // Auto-sync if enabled
  useEffect(() => {
    if (!syncConfig?.auto_sync_enabled || !syncConfig.sync_interval_minutes) return

    const interval = setInterval(() => {
      handleSync()
    }, syncConfig.sync_interval_minutes * 60 * 1000)

    return () => clearInterval(interval)
  }, [syncConfig])

  const loadContracts = async () => {
    setIsLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setContracts([])
        return
      }

      let query = supabase
        .from('contracts_view')
        .select('*')
        .order('contract_name', { ascending: true })

      if (user?.hospital_id) {
        query = query.eq('hospital_id', user.hospital_id)
      }

      if (searchQuery) {
        query = query.or(
          `contract_name.ilike.%${searchQuery}%,contract_number.ilike.%${searchQuery}%,supplier_name.ilike.%${searchQuery}%`
        )
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setContracts((data || []) as Contract[])
    } catch (error) {
      console.error('Error loading contracts:', error)
      showError('Error', 'Failed to load contracts')
      setContracts([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadSyncConfig = async () => {
    if (!user?.hospital_id) return

    try {
      const result = await getSyncConfig(user.hospital_id)
      if (result.data) {
        setSyncConfig(result.data)
      }
    } catch (error) {
      console.error('Error loading sync config:', error)
    }
  }

  const handleSaveConfig = async (config: GoogleSheetsSyncConfig) => {
    if (!user?.hospital_id) {
      showError('Error', 'Hospital ID not found')
      return
    }

    try {
      // Extract sheet ID from URL if needed
      const extractedSheetId = extractSheetId(config.sheet_id)
      if (!extractedSheetId) {
        showError('Invalid Sheet ID', 'Please provide a valid Google Sheet ID or URL')
        return
      }

      const result = await saveSyncConfig({
        ...config,
        sheet_id: extractedSheetId, // Save the extracted ID
        hospital_id: user.hospital_id,
        id: syncConfig?.id,
      })

      if (result.error) {
        showError('Error', result.error)
        return
      }

      if (result.data) {
        setSyncConfig(result.data)
        showSuccess('Success', 'Sync configuration saved successfully')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      showError('Error', 'Failed to save configuration')
    }
  }

  const handleSync = async () => {
    if (!user?.hospital_id || !syncConfig) {
      showError('Error', 'Please configure Google Sheets sync first')
      return
    }

    setIsSyncing(true)
    try {
      const result = await syncContractsFromGoogleSheets(user.hospital_id, syncConfig)

      if (result.error) {
        showError('Sync Error', result.error)
      } else if (result.data) {
        const syncResult = result.data
        showSuccess(
          'Sync Complete',
          `Processed: ${syncResult.rowsProcessed} | Created: ${syncResult.rowsCreated} | Updated: ${syncResult.rowsUpdated} | Deleted: ${syncResult.rowsDeleted}`
        )
        await loadContracts()
        await loadSyncConfig()
      }
    } catch (error) {
      console.error('Error syncing:', error)
      showError('Error', 'Failed to sync contracts')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAddContract = () => {
    setSelectedContract(null)
    setShowFormModal(true)
  }

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract)
    setShowFormModal(true)
  }

  const handleSaveContract = async (formData: Partial<Contract>) => {
    if (!user?.hospital_id) {
      showError('Error', 'Hospital ID not found')
      return
    }

    try {
      const hashData = JSON.stringify({
        n: formData.contract_name,
        num: formData.contract_number,
        s: formData.supplier_name,
        p: formData.unit_price,
        sd: formData.start_date,
        ed: formData.end_date,
        u: formData.currency || 'MYR',
        v: 9
      })
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashData))
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const syncHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const existingMetadata = selectedContract?.metadata || {}
      const changeHistory = existingMetadata.change_history || []
      
      const newLog = {
        action: selectedContract?.id ? 'updated' : 'created',
        user_email: user?.email || 'System User',
        timestamp: new Date().toISOString(),
        details: selectedContract?.id 
          ? `Updated details: name "${formData.contract_name}"`
          : `Manually added to catalog`
      }
      
      const updatedMetadata = {
        ...existingMetadata,
        change_history: [newLog, ...changeHistory]
      }

      const contractData = {
        hospital_id: user.hospital_id,
        contract_name: formData.contract_name?.trim(),
        contract_number: formData.contract_number?.trim() || null,
        supplier_name: formData.supplier_name?.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        sst_rate: formData.sst_rate || null,
        unit_price: formData.unit_price || null,
        status: formData.status || 'active',
        document_url: formData.document_url || null,
        item_code: formData.item_code?.trim() || null,
        sync_hash: syncHash,
        last_synced_at: new Date().toISOString(),
        metadata: updatedMetadata,
      }

      if (selectedContract?.id) {
        const { error } = await supabase
          .from('contracts')
          .update({
            ...contractData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedContract.id)

        if (error) throw error
        showSuccess('Success', 'Contract updated successfully')
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert({
            ...contractData,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
        showSuccess('Success', 'Contract added successfully')
      }

      setShowFormModal(false)
      await loadContracts()
    } catch (error) {
      console.error('Error saving contract:', error)
      showError('Error', 'Failed to save contract record')
    }
  }

  const isAlmostExpired = (endDateStr?: string) => {
    if (!endDateStr) return false
    const endDate = new Date(endDateStr)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 60 // Expiring within 60 days
  }

  const isExpired = (endDateStr?: string, status?: string) => {
    if (status?.toLowerCase() === 'expired') return true
    if (!endDateStr) return false
    const endDate = new Date(endDateStr)
    const now = new Date()
    return endDate.getTime() < now.getTime()
  }

  const getStatusColor = (status: string, endDate?: string) => {
    if (isExpired(endDate, status)) {
      return 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5'
    }
    if (isAlmostExpired(endDate)) {
      return 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-500/5'
    }
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5'
      case 'terminated':
        return 'bg-slate-50 text-slate-600 border-slate-100'
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100'
    }
  }

  const filteredContracts = contracts.filter(contract => {
    // 1. Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        contract.contract_name?.toLowerCase().includes(query) ||
        contract.contract_number?.toLowerCase().includes(query) ||
        contract.supplier_name?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    // 2. Status/Expiry filter
    if (statusFilter === 'active') {
      return contract.status?.toLowerCase() === 'active' && !isAlmostExpired(contract.end_date)
    }
    if (statusFilter === 'almost_expired') {
      return isAlmostExpired(contract.end_date)
    }
    if (statusFilter === 'expired') {
      return isExpired(contract.end_date, contract.status)
    }

    return true
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-20">
          <span className="text-slate-400">Pharmacy</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Catalog</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold tracking-wide">Contract Catalog</span>
        </nav>

        {/* Gradient Header Monument */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                Contract Catalog
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                KKM Centralized Medical Procurement Contracts and Price Schedules
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Manage Sync
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing || !syncConfig}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-xs font-bold uppercase tracking-wider hover:from-slate-800 hover:to-indigo-900 transition-all shadow-md shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? 'Synchronizing...' : 'Force Sync'}
            </button>
            <button
              onClick={handleAddContract}
              className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-teal-700 transition-all shadow-md shadow-teal-600/10 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contract
            </button>
          </div>
        </div>

        {/* Elevated Dashboard KPI Stats Panel wrapped in a luxurious white background card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-6 relative z-10 space-y-6">
          {/* Elevated Dashboard KPI Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Contracts */}
            <div className="bg-blue-50/50 border-2 border-blue-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-blue-50 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900/60 uppercase tracking-widest">Total Contracts</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{contracts.length}</h3>
                  <p className="text-xs font-bold text-blue-600 mt-2">Active sheet-synced contracts</p>
                </div>
              </div>
            </div>

            {/* Active Contracts */}
            <div className="bg-emerald-50/50 border-2 border-emerald-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900/60 uppercase tracking-widest">Active Contracts</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
                    {contracts.filter(c => c.status?.toLowerCase() === 'active').length}
                  </h3>
                  <p className="text-xs font-bold text-emerald-600 mt-2">Valid and operational rates</p>
                </div>
              </div>
            </div>

            {/* Expired Contracts */}
            <div className="bg-amber-50/50 border-2 border-amber-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-amber-50 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-amber-100 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900/60 uppercase tracking-widest">Expired / Pending</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                    {contracts.filter(c => c.status?.toLowerCase() === 'expired' || c.status?.toLowerCase() === 'pending').length}
                  </h3>
                  <p className="text-xs font-bold text-amber-600 mt-2">Expired or pending renewal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

      {/* Sync Status Banner */}
      {syncConfig && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50/50 backdrop-blur-sm rounded-3xl border-2 border-slate-200/50 p-5 overflow-hidden relative"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                syncConfig.last_sync_status === 'success' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {syncConfig.last_sync_status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Sync Status: {syncConfig.last_sync_status?.toUpperCase()}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <p className="text-xs font-bold text-slate-500">
                    Last active: {syncConfig.last_sync_at ? new Date(syncConfig.last_sync_at).toLocaleString() : 'Never'}
                  </p>
                  {syncConfig.auto_sync_enabled && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      Auto-sync: Every {syncConfig.sync_interval_minutes}m
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {syncConfig.sheet_id && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${syncConfig.sheet_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
              >
                <span>View Source Repository</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}
          </div>
          
          {syncConfig.last_sync_error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {syncConfig.last_sync_error}
            </div>
          )}
        </motion.div>
      )}

      {/* Elegant Status & Expiry Filter Pills */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white p-4 rounded-3xl border-2 border-slate-200/60 shadow-sm">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
              : 'bg-slate-50 border border-slate-200/85 text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          All Contracts ({contracts.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
              : 'bg-slate-50 border border-slate-200/85 text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          Active ({contracts.filter(c => c.status?.toLowerCase() === 'active' && !isAlmostExpired(c.end_date)).length})
        </button>
        <button
          onClick={() => setStatusFilter('almost_expired')}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
            statusFilter === 'almost_expired'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10 animate-pulse'
              : 'bg-slate-50 border border-slate-200/85 text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Almost Expired ({contracts.filter(c => isAlmostExpired(c.end_date)).length})
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            statusFilter === 'expired'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10'
              : 'bg-slate-50 border border-slate-200/85 text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          Already Expired ({contracts.filter(c => isExpired(c.end_date, c.status)).length})
        </button>
      </div>

      {/* Search and Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-slate-200/60 p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search contracts by name, number, or supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/80 border-slate-200 focus:ring-teal-500/20 transition-all rounded-2xl"
          />
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid
          </button>
        </div>
      </div>

      {/* Contracts View */}
      {isLoading ? (
        <LoadingOverlay />
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {syncConfig ? 'No matching contracts' : 'Configure Google Sheets Sync'}
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {syncConfig
              ? searchQuery
                ? 'We couldn\'t find any contracts matching your search. Try adjusting your query.'
                : 'Your catalog is empty. Click "Sync Now" to import records from your configured Google Sheet.'
              : 'Integrate your Google Sheets contract database to automatically sync and manage records here.'}
          </p>
          {!syncConfig && (
            <Button onClick={() => setShowConfigModal(true)} size="lg" className="rounded-2xl">
              <Settings className="w-4 h-4 mr-2" />
              Configure Sync
            </Button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
          <DataTable
            data={filteredContracts}
            columns={[
              {
                key: 'contract_name',
                header: 'Item Name',
                render: (item) => (
                  <div className="flex flex-col max-w-md">
                    <span className="font-bold text-slate-900 leading-tight">{item.contract_name}</span>
                    {item.item_code && (
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">{item.item_code}</span>
                    )}
                  </div>
                )
              },
              {
                key: 'contract_number',
                header: 'KKM Contract No',
                render: (item) => (
                  <span className="text-sm font-mono font-semibold text-slate-600">
                    {item.contract_number || '-'}
                  </span>
                )
              },
              {
                key: 'supplier_name',
                header: 'Supplier',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{item.supplier_name || 'N/A'}</span>
                  </div>
                )
              },
              {
                key: 'start_date',
                header: 'Date Start',
                render: (item) => (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                )
              },
              {
                key: 'end_date',
                header: 'Date End',
                render: (item) => (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                )
              },
              {
                key: 'sst_rate',
                header: 'SST & Document',
                render: (item) => {
                  const isUrl = (val: any) => typeof val === 'string' && (val.startsWith('http') || val.includes('drive.google.com'));
                  const rawSst = item.sst_rate;
                  const rawDoc = item.document_url;
                  
                  const hasSstRate = rawSst && !isUrl(rawSst);
                  const docUrl = isUrl(rawSst) ? rawSst : (isUrl(rawDoc) ? rawDoc : null);
                  
                  return (
                    <div className="flex items-center gap-2">
                      {hasSstRate && (
                        <span className="text-sm font-bold text-slate-600">
                          {rawSst}%
                        </span>
                      )}
                      {docUrl && (
                        <a 
                          href={docUrl.startsWith('http') ? docUrl : `https://${docUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-700 border border-teal-100 hover:border-teal-200 transition-all text-[11px] font-bold flex items-center gap-1 shadow-sm inline-flex shrink-0 whitespace-nowrap animate-pulse"
                          title="View Document"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </a>
                      )}
                      {!hasSstRate && !docUrl && (
                        <span className="text-sm font-bold text-slate-400">-</span>
                      )}
                    </div>
                  )
                }
              },
              {
                key: 'unit_price',
                header: 'Price',
                render: (item) => (
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">
                      {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                    </span>
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 border-2 ${getStatusColor(item.status, item.end_date)}`}
                  >
                    {isExpired(item.end_date, item.status) ? 'Expired' : (isAlmostExpired(item.end_date) ? 'Almost Expired' : (item.status || 'Unknown'))}
                  </Badge>
                )
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (item) => (
                  <div className="flex items-center gap-1.5 justify-end w-16">
                    <button
                      onClick={() => handleEditContract(item)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
                      title="Edit Contract"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }
            ]}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredContracts.map((contract, idx) => (
              <motion.div
                key={contract.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.03 }}
                className="group relative bg-white rounded-3xl border-2 border-slate-200 p-6 hover:border-teal-400/50 hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <Badge
                      variant="outline"
                      className={`mb-3 text-[10px] uppercase tracking-widest font-black border-2 ${getStatusColor(contract.status, contract.end_date)}`}
                    >
                      {isExpired(contract.end_date, contract.status) ? 'Expired' : (isAlmostExpired(contract.end_date) ? 'Almost Expired' : (contract.status || 'Unknown'))}
                    </Badge>
                    <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                      {contract.contract_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Building2 className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supplier</span>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">
                        {contract.supplier_name || 'Not Assigned'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Number</span>
                      <span className="text-xs font-mono font-bold text-slate-600 truncate">
                        {contract.contract_number || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price</span>
                      <span className="text-xs font-black text-slate-900">
                        {contract.unit_price ? formatCurrency(contract.unit_price) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex flex-col p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SST & Doc</span>
                      <span className="text-xs font-bold text-slate-600 truncate">
                        {(() => {
                          const isUrl = (val: any) => typeof val === 'string' && (val.startsWith('http') || val.includes('drive.google.com'));
                          const rawSst = contract.sst_rate;
                          const rawDoc = contract.document_url;
                          const hasSstRate = rawSst && !isUrl(rawSst);
                          const docUrl = isUrl(rawSst) ? rawSst : (isUrl(rawDoc) ? rawDoc : null);

                          if (hasSstRate) {
                            return `${rawSst}%`;
                          } else if (docUrl) {
                            return (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Doc Link</span>
                              </a>
                            );
                          }
                          return 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 pt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      <span>{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <span className="text-[10px] text-slate-300 uppercase tracking-tighter italic">Expiry Date</span>
                  </div>
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditContract(contract)
                    }}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-md border border-slate-200 transition-all"
                    title="Edit Contract"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      </div> {/* Close the white background card container */}
      </div> {/* Close the w-full padding container */}

      {/* Sync Config Modal */}
      <SyncConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
        config={syncConfig}
      />

      {/* Manual Contract Form Modal */}
      <ContractFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveContract}
        contract={selectedContract}
      />
    </div>
  )
}

// =====================================================
// MANUAL CONTRACT ADD/EDIT FORM MODAL
// =====================================================

interface ContractFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Contract>) => Promise<void>
  contract?: Contract | null
}

const ContractFormModal: React.FC<ContractFormModalProps> = ({ isOpen, onClose, onSave, contract }) => {
  const [formData, setFormData] = useState<Partial<Contract>>({
    contract_name: '',
    contract_number: '',
    supplier_name: '',
    start_date: '',
    end_date: '',
    unit_price: undefined,
    status: 'active',
    document_url: '',
    item_code: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (contract) {
      setFormData({
        contract_name: contract.contract_name || '',
        contract_number: contract.contract_number || '',
        supplier_name: contract.supplier_name || '',
        start_date: contract.start_date ? contract.start_date.split('T')[0] : '',
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        unit_price: contract.unit_price,
        status: contract.status || 'active',
        document_url: contract.document_url || '',
        item_code: contract.item_code || '',
      })
    } else {
      setFormData({
        contract_name: '',
        contract_number: '',
        supplier_name: '',
        start_date: '',
        end_date: '',
        unit_price: undefined,
        status: 'active',
        document_url: '',
        item_code: '',
      })
    }
    setErrors({})
  }, [contract, isOpen])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(20)
    try {
      const { uploadFile } = await import('@/services/supabase')
      const path = `pharmacy/contracts/${Date.now()}_${file.name}`
      setUploadProgress(50)
      const { url, error } = await uploadFile('pharmacy-procurement', path, file)
      setUploadProgress(80)
      if (error) {
        throw new Error(error)
      }
      if (url) {
        setFormData(prev => ({ ...prev, document_url: url }))
      }
      setUploadProgress(100)
    } catch (err) {
      console.error('File upload failed:', err)
      alert(err instanceof Error ? err.message : 'File upload failed')
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.contract_name?.trim()) {
      newErrors.contract_name = 'Contract (Item) Name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving contract form:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-50 backdrop-blur-[3px]"
          />

          {/* Slide-over Right Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl z-50 border-l border-slate-200/80 flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {contract ? 'Edit Contract Record' : 'Add Contract Record Manually'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {contract ? 'Update contract details' : 'Enter contract fields manually'}
                </p>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable Content Form Body split in two-columns if editing */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
                
                {/* Left Side: Form Controls */}
                <form onSubmit={handleSubmit} id="manual-contract-form" className="flex-1 space-y-5 w-full">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Contract / Item Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={formData.contract_name}
                      onChange={e => setFormData({ ...formData, contract_name: e.target.value })}
                      placeholder="e.g. Paracetamol 500mg Tablet"
                      error={errors.contract_name}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Item Code / Drug Code
                    </label>
                    <Input
                      value={formData.item_code || ''}
                      onChange={e => setFormData({ ...formData, item_code: e.target.value })}
                      placeholder="e.g. A10AB01 or SKU code"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        KKM Contract Number
                      </label>
                      <Input
                        value={formData.contract_number}
                        onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                        placeholder="e.g. KKM-123/2026/F(I)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Supplier Name
                      </label>
                      <Input
                        value={formData.supplier_name}
                        onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                        placeholder="e.g. Pharmaniaga Logistics"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        End Date (Expiry)
                      </label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Unit Price (RM)
                      </label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.unit_price !== undefined ? formData.unit_price : ''}
                        onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || undefined })}
                        placeholder="e.g. 1.2500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-10 px-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-semibold text-slate-700"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>

                  {/* Premium Document Upload Section */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      SST Document / Contract PDF
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-center hover:bg-slate-100/50 hover:border-teal-400/50 transition-all relative">
                      {isUploading ? (
                        <div className="w-full flex flex-col items-center gap-2 py-4">
                          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                          <span className="text-xs font-bold text-slate-505">Uploading Document ({uploadProgress}%)</span>
                          <div className="w-40 bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      ) : formData.document_url ? (
                        <div className="flex flex-col items-center gap-3 py-2 text-center w-full">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 block truncate max-w-[280px] mb-1">Document uploaded successfully!</span>
                            <a
                              href={formData.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-black text-teal-600 hover:text-teal-700 underline uppercase tracking-wider"
                            >
                              View Uploaded Document
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, document_url: '' }))}
                            className="px-3 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-600 transition-colors"
                          >
                            Replace Document
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center py-2">
                          <UploadCloud className="w-9 h-9 text-slate-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-xl px-3 py-1.5 border border-slate-200 text-xs font-bold text-teal-600 hover:text-teal-700 hover:border-teal-200 transition-all shadow-sm">
                              <span>Upload File</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileUpload}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-2 pt-1 text-xs text-slate-500 font-bold">or drag and drop</p>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF, PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </form>

                {/* Right Side: Visual Chronological Timeline Logs */}
                {contract && (
                  <div className="w-full lg:w-[20rem] lg:border-l lg:border-slate-100 lg:pl-6 shrink-0 flex flex-col self-stretch mt-6 lg:mt-0 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="mb-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <span>📋</span>
                        <span>Audit Trail & Activity Logs</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chronological record of all updates</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[480px] scrollbar-thin">
                      {(() => {
                        const getLogs = () => {
                          const list = []
                          if (contract?.metadata?.change_history && Array.isArray(contract.metadata.change_history)) {
                            list.push(...contract.metadata.change_history)
                          }
                          if (list.length === 0) {
                            if (contract?.last_synced_at) {
                              list.push({
                                action: 'synced',
                                user_email: 'Google Sheets Sync',
                                timestamp: contract.last_synced_at,
                                details: 'Initial import from Google Sheets'
                              })
                            } else {
                              list.push({
                                action: 'created',
                                user_email: 'System Initializer',
                                timestamp: contract?.created_at || new Date().toISOString(),
                                details: 'Manual contract record created'
                              })
                            }
                          }
                          return list
                        }

                        return getLogs().map((log: any, idx: number) => (
                          <div key={idx} className="relative pl-5 border-l border-slate-100 last:border-l-0 pb-3">
                            <div className={`absolute -left-[4.5px] top-1 w-2 h-2 rounded-full border bg-white ${
                              log.action === 'created' ? 'border-emerald-500' :
                              log.action === 'synced' ? 'border-blue-500' : 'border-amber-500'
                            }`} />
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                  log.action === 'created' ? 'bg-emerald-50 text-emerald-600' :
                                  log.action === 'synced' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">
                                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 leading-snug">
                                {log.details}
                              </p>
                              <p className="text-[9px] text-slate-400 font-semibold italic">
                                By: {log.user_email}
                              </p>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isUploading}>
                Cancel
              </Button>
              <Button form="manual-contract-form" type="submit" disabled={isSaving || isUploading}>
                {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                {contract ? 'Update Contract' : 'Add Contract'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ContractCatalogPage

