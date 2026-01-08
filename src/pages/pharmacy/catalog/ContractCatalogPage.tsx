import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  Settings,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Save,
} from 'lucide-react'
import { Button, Input, Badge, Modal, LoadingOverlay, Spinner } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
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
  const [searchQuery, setSearchQuery] = useState('')

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
        .from('contracts')
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'terminated':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  const filteredContracts = contracts.filter(contract => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      contract.contract_name?.toLowerCase().includes(query) ||
      contract.contract_number?.toLowerCase().includes(query) ||
      contract.supplier_name?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contract Catalog</h2>
          <p className="text-sm text-gray-600 mt-1">
            Synced from Google Sheets • {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowConfigModal(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Sync
          </Button>
          <Button
            onClick={handleSync}
            disabled={isSyncing || !syncConfig}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {/* Sync Status */}
      {syncConfig && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {syncConfig.last_sync_status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : syncConfig.last_sync_status === 'failed' ? (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              ) : (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Last Sync:{' '}
                  {syncConfig.last_sync_at
                    ? new Date(syncConfig.last_sync_at).toLocaleString()
                    : 'Never'}
                </p>
                {syncConfig.last_sync_error && (
                  <p className="text-xs text-rose-600 mt-1">{syncConfig.last_sync_error}</p>
                )}
                {syncConfig.auto_sync_enabled && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-sync enabled (every {syncConfig.sync_interval_minutes} minutes)
                  </p>
                )}
              </div>
            </div>
            {syncConfig.sheet_id && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${syncConfig.sheet_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
              >
                View Google Sheet
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search contracts by name, number, or supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contracts Grid */}
      {isLoading ? (
        <LoadingOverlay />
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {syncConfig ? 'No contracts found' : 'Configure Google Sheets Sync'}
          </h3>
          <p className="text-gray-600 mb-4">
            {syncConfig
              ? searchQuery
                ? 'Try adjusting your search query'
                : 'Click "Sync Now" to import contracts from Google Sheets'
              : 'Set up Google Sheets sync to automatically import contracts'}
          </p>
          {!syncConfig && (
            <Button onClick={() => setShowConfigModal(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Sync
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map(contract => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-teal-300 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{contract.contract_name}</h3>
                  {contract.contract_number && (
                    <p className="text-xs text-gray-500 font-mono">{contract.contract_number}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold border-2 ${getStatusColor(contract.status)}`}
                >
                  {contract.status?.charAt(0).toUpperCase() + contract.status?.slice(1)}
                </Badge>
              </div>

              <div className="space-y-2">
                {contract.supplier_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{contract.supplier_name}</span>
                  </div>
                )}
                {contract.contract_type && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{contract.contract_type}</span>
                  </div>
                )}
                {(contract.start_date || contract.end_date) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {contract.start_date && new Date(contract.start_date).toLocaleDateString()}
                      {contract.start_date && contract.end_date && ' - '}
                      {contract.end_date && new Date(contract.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {contract.value && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">
                      {contract.currency || 'MYR'} {contract.value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {contract.last_synced_at && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Last synced: {new Date(contract.last_synced_at).toLocaleString()}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Sync Config Modal */}
      <SyncConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
        config={syncConfig}
      />
    </div>
  )
}

export default ContractCatalogPage

