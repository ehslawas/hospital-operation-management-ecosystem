import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Edit,
  History,
  RefreshCw,
  Filter,
  Building2,
  Package,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import {
  Button,
  Input,
  Select,
  Badge,
  Table,
  Modal,
  LoadingOverlay,
  Spinner,
} from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import {
  getUnitCatalogs,
  getUnitCatalogSummary,
  createUnitCatalog,
  updateUnitCatalog,
  deleteUnitCatalog,
  getUnitCatalogChanges,
  syncUnitCatalogCounts,
  getAvailableDepartments,
} from '@/services/pharmacy/unitCatalogService'
import { getUsers } from '@/services/userService'
import { getDrugCategories, getNonDrugCategories } from '@/services/pharmacy/inventoryService'
import { getHospitalModules } from '@/services/moduleService'
import type {
  UnitCatalogWithRelations,
  UnitCatalogWithItemCounts,
  UnitCatalogFormData,
  UnitCatalogStatus,
  UnitCatalogChangeWithRelations,
  UnitCatalogFilter,
} from '@/types/pharmacy'
import { ROUTES, MODULE_DEFINITIONS } from '@/lib/constants'

// =====================================================
// KPI CARD COMPONENT
// =====================================================

interface KPICardProps {
  title: string
  value: number | string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
  icon: React.ReactNode
  subtitle?: string
}

const KPICard: React.FC<KPICardProps> = ({ title, value, color, icon, subtitle }) => {
  const colorClasses = {
    primary: 'bg-violet-50 border-violet-200 text-violet-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
    </motion.div>
  )
}

// =====================================================
// FORM MODAL COMPONENT
// =====================================================

interface UnitCatalogFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: UnitCatalogFormData) => Promise<void>
  catalog?: UnitCatalogWithRelations | null
  hospitalId: string
}

const UnitCatalogFormModal: React.FC<UnitCatalogFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  catalog,
  hospitalId,
}) => {
  const [formData, setFormData] = useState<UnitCatalogFormData>({
    department_id: '',
    module_code: '' as string,
    status: 'active' as UnitCatalogStatus,
    responsible_user_id: null,
    notes: null,
    update_reason: null,
  })

  const [availableDepartments, setAvailableDepartments] = useState<
    Array<{ id: string; department_code: string; department_name: string; module_code: string }>
  >([])
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; employee_id: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [departmentsError, setDepartmentsError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && hospitalId) {
      loadAvailableDepartments()
      loadUsers()
      if (catalog) {
        setFormData({
          department_id: catalog.department_id,
          module_code: typeof catalog.module_code === 'string' ? catalog.module_code : '',
          status: catalog.status,
          responsible_user_id: catalog.responsible_user_id || null,
          notes: catalog.notes || null,
          update_reason: null,
        })
      } else {
        setFormData({
          department_id: '',
          module_code: '' as string,
          status: 'active' as UnitCatalogStatus,
          responsible_user_id: null,
          notes: null,
          update_reason: null,
        })
      }
    }
  }, [isOpen, catalog, hospitalId])

  const loadAvailableDepartments = async () => {
    setIsLoadingDepartments(true)
    setDepartmentsError(null)
    try {
      const result = await getAvailableDepartments(hospitalId)
      if (result.data) {
        setAvailableDepartments(result.data)
        // Auto-select module code if only one department selected
        if (result.data.length === 1 && !catalog) {
          const moduleCode = typeof result.data[0].module_code === 'string' ? result.data[0].module_code : ''
          setFormData((prev) => ({ ...prev, department_id: result.data[0].id, module_code: moduleCode }))
        }
        if (result.data.length === 0) {
          setDepartmentsError('No departments available. Please activate modules for this hospital first.')
        }
      } else if (result.error) {
        setDepartmentsError(result.error)
        console.error('Error loading departments:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load departments'
      setDepartmentsError(errorMessage)
      console.error('Error loading departments:', error)
    } finally {
      setIsLoadingDepartments(false)
    }
  }

  const loadUsers = async () => {
    try {
      const result = await getUsers({ hospitalId, pageSize: 1000 })
      if (result.data && Array.isArray(result.data)) {
        setUsers(
          result.data.map((u) => ({
            id: u.id,
            full_name: u.full_name,
            employee_id: u.employee_id || '',
          }))
        )
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleDepartmentChange = (departmentId: string) => {
    const department = availableDepartments.find((d) => d.id === departmentId)
    setFormData((prev) => ({
      ...prev,
      department_id: departmentId,
      module_code: (department?.module_code && typeof department.module_code === 'string' ? department.module_code : prev.module_code) || '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.department_id) return

    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving catalog:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const moduleCodeStr = typeof formData.module_code === 'string'
    ? formData.module_code
    : (formData.module_code ? String(formData.module_code) : '')
  const moduleName =
    MODULE_DEFINITIONS.find((m) => m.code === moduleCodeStr)?.name || moduleCodeStr || ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={catalog ? 'Edit Unit Catalog' : 'Add Unit Catalog'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Department *"
          value={formData.department_id}
          onChange={(e) => {
            console.log('Department changed:', e.target.value)
            handleDepartmentChange(e.target.value)
          }}
          options={availableDepartments.map((d) => ({
            value: d.id,
            label: `${d.department_name} (${d.department_code})`,
          }))}
          placeholder={
            isLoadingDepartments
              ? 'Loading departments...'
              : availableDepartments.length === 0
                ? 'No departments available'
                : 'Select a department'
          }
          required
          disabled={!!catalog || isLoadingDepartments || availableDepartments.length === 0}
          error={departmentsError || undefined}
          helperText={
            departmentsError
              ? undefined
              : availableDepartments.length === 0 && !isLoadingDepartments
                ? 'No departments available for this hospital. Please activate modules and ensure departments are created.'
                : availableDepartments.length > 0
                  ? `${availableDepartments.length} department(s) available`
                  : undefined
          }
        />
        {availableDepartments.length === 0 && !isLoadingDepartments && !departmentsError && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="font-medium mb-1">No departments found</p>
            <p className="text-xs">
              Make sure modules are activated for this hospital and departments are created that match the activated modules.
            </p>
          </div>
        )}

        <Input
          label="Module"
          value={moduleName}
          disabled
          helperText="Auto-populated from department"
        />

        <Select
          label="Status *"
          value={formData.status}
          onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as UnitCatalogStatus }))}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          required
        />

        <Select
          label="Responsible Person"
          value={formData.responsible_user_id || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, responsible_user_id: e.target.value || null }))
          }
          options={[
            { value: '', label: 'None' },
            ...users.map((u) => ({
              value: u.id,
              label: `${u.full_name}${u.employee_id ? ` (${u.employee_id})` : ''}`,
            })),
          ]}
        />

        {catalog && (
          <Input
            label="Update Reason"
            value={formData.update_reason || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, update_reason: e.target.value || null }))}
            placeholder="Reason for this update (optional)"
          />
        )}

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value || null }))}
            placeholder="Additional notes (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !formData.department_id}>
            {isSaving ? <Spinner size="sm" /> : catalog ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// CHANGE HISTORY MODAL
// =====================================================

interface ChangeHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  catalogId: string
  hospitalId?: string
}

const ChangeHistoryModal: React.FC<ChangeHistoryModalProps> = ({ isOpen, onClose, catalogId, hospitalId }) => {
  const [changes, setChanges] = useState<UnitCatalogChangeWithRelations[]>([])
  const [users, setUsers] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && catalogId) {
      loadChanges()
      if (hospitalId) {
        loadUsers()
        loadCategories()
      }
    }
  }, [isOpen, catalogId, hospitalId])

  const loadChanges = async () => {
    setIsLoading(true)
    try {
      const result = await getUnitCatalogChanges(catalogId)
      if (result.data) {
        setChanges(result.data)
      }
    } catch (error) {
      console.error('Error loading changes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const result = await getUsers({ hospitalId, pageSize: 1000 })
      if (result.data && Array.isArray(result.data)) {
        const userMap: Record<string, string> = {}
        result.data.forEach(u => {
          userMap[u.id] = u.full_name
        })
        setUsers(userMap)
      }
    } catch (error) {
      console.error('Error loading users for history:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const [drugRes, nonDrugRes] = await Promise.all([
        getDrugCategories(hospitalId),
        getNonDrugCategories()
      ])

      const catMap: Record<string, string> = {}
      if (drugRes.data) {
        drugRes.data.forEach(c => {
          catMap[c.id] = c.category_name
        })
      }
      if (nonDrugRes.data) {
        nonDrugRes.data.forEach(c => {
          catMap[c.id] = c.category_name
        })
      }
      setCategories(catMap)
    } catch (error) {
      console.error('Error loading categories for history:', error)
    }
  }

  const formatFieldName = (name: string): string => {
    if (!name) return ''
    return name
      .replace(/^is_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace('Id', '')
      .trim()
  }

  const formatValue = (value: any, fieldName: string): React.ReactNode => {
    if (value === null || value === undefined) return '—'

    // Handle ID resolution for top-level fields
    if ((fieldName === 'responsible_user_id' || fieldName === 'last_updated_by') && typeof value === 'string' && users[value]) {
      return users[value]
    }

    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') {
      // Resolve IDs for specific fields
      if ((fieldName === 'category_id' || fieldName === 'therapeutic_class_id' || fieldName === 'item_category_id') && categories[value]) {
        return categories[value]
      }

      // Format procurement vote labels
      if (fieldName === 'procurement_vote') {
        const labels: Record<string, string> = {
          appl: 'APPL (Ministry)',
          cc: 'Contract (Consession)',
          lp: 'Local Purchase',
          dp: 'Direct Purchase'
        }
        return labels[value] || value.toUpperCase()
      }

      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return new Date(value).toLocaleString()
      }
      return value
    }

    if (typeof value === 'object') {
      try {
        // Prettify small JSON objects
        const keys = Object.keys(value)
        if (keys.length > 0) {
          // Fields to ignore in objects (noise)
          const ignoreFields = ['id', 'catalog_id', 'hospital_id', 'non_drug_id', 'drug_id', 'item_id']

          return (
            <div className="space-y-1">
              {Object.entries(value).map(([key, val]) => {
                if (ignoreFields.includes(key)) return null
                if (val === null || val === undefined) return null

                // Resolve nested user IDs
                let displayVal: React.ReactNode = String(val)
                if ((key === 'responsible_user_id' || key === 'last_updated_by') && typeof val === 'string' && users[val]) {
                  displayVal = users[val]
                } else if ((key === 'category_id' || key === 'therapeutic_class_id' || key === 'item_category_id') && typeof val === 'string' && categories[val]) {
                  displayVal = categories[val]
                } else if (key === 'procurement_vote' && typeof val === 'string') {
                  const labels: Record<string, string> = {
                    appl: 'APPL (Ministry)',
                    cc: 'Contract (Consession)',
                    lp: 'Local Purchase',
                    dp: 'Direct Purchase'
                  }
                  displayVal = labels[val] || val.toUpperCase()
                } else if (typeof val === 'boolean') {
                  displayVal = val ? 'Yes' : 'No'
                } else if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
                  displayVal = new Date(val).toLocaleString()
                }

                return (
                  <div key={key} className="flex gap-2 text-xs">
                    <span className="font-semibold text-gray-500 whitespace-nowrap">{formatFieldName(key)}:</span>
                    <span>{displayVal}</span>
                  </div>
                )
              })}
            </div>
          )
        }
        return JSON.stringify(value)
      } catch {
        return '[Object]'
      }
    }
    return String(value)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change History" size="3xl">
      <div className="relative min-h-[200px]">
        {isLoading ? (
          <LoadingOverlay />
        ) : (
          <>
            {changes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No changes recorded</div>
            ) : (
              <div className="space-y-4">
                {changes.map((change) => (
                  <div key={change.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {change.item_name && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                              {change.item_name}
                            </span>
                          </div>
                        )}
                        <p className="font-medium text-slate-800">{formatFieldName(change.field_name)}</p>
                        <p className="text-xs text-gray-500">
                          Changed by {change.changed_by_user?.full_name || 'System'} on{' '}
                          {new Date(change.changed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Old Value</p>
                        <div className="text-sm font-mono bg-red-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {formatValue(change.old_value, change.field_name)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">New Value</p>
                        <div className="text-sm font-mono bg-green-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {formatValue(change.new_value, change.field_name)}
                        </div>
                      </div>
                    </div>
                    {change.change_reason && (
                      <p className="text-xs text-gray-500 mt-2">Reason: {change.change_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}



// =====================================================
// MAIN UNIT CATALOG PAGE
// =====================================================

export const UnitCatalogPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  const [summary, setSummary] = useState<{
    total_units: number
    active_units: number
    inactive_units: number
    suspended_units: number
    units_with_drug_access: number
    units_with_non_drug_access: number
    total_drug_items: number
    total_non_drug_items: number
    units_near_capacity: number
    units_at_capacity: number
  } | null>(null)

  const [catalogs, setCatalogs] = useState<UnitCatalogWithItemCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedCatalog, setSelectedCatalog] = useState<UnitCatalogWithRelations | null>(null)

  // Available modules for filter
  const [availableModules, setAvailableModules] = useState<Array<{ code: string; name: string }>>([])

  useEffect(() => {
    if (user?.hospital_id) {
      loadSummary()
      loadModules()
    }
  }, [user?.hospital_id])

  useEffect(() => {
    if (user?.hospital_id) {
      loadCatalogs()
    }
  }, [user?.hospital_id, searchQuery, moduleFilter, statusFilter])

  const loadSummary = async () => {
    if (!user?.hospital_id) return
    try {
      const result = await getUnitCatalogSummary(user.hospital_id)
      if (result.data) {
        setSummary(result.data)
      }
    } catch (error) {
      console.error('Error loading summary:', error)
    }
  }

  const loadModules = async () => {
    if (!user?.hospital_id) return
    try {
      const result = await getHospitalModules(user.hospital_id)
      if (result.data) {
        const enabledModules = result.data
          .filter((m) => m.is_enabled)
          .map((m) => {
            const def = MODULE_DEFINITIONS.find((d) => d.code === m.module_code)
            return {
              code: m.module_code,
              name: def?.name || m.module_code,
            }
          })
        setAvailableModules(enabledModules)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    }
  }

  const loadCatalogs = async () => {
    if (!user?.hospital_id) return
    setIsLoading(true)
    try {
      const filters: UnitCatalogFilter = {
        search: searchQuery || undefined,
        module_code: moduleFilter !== 'all' ? moduleFilter : undefined,
        status: statusFilter !== 'all' ? (statusFilter as UnitCatalogStatus) : undefined,
      }

      const result = await getUnitCatalogs(user.hospital_id, filters)
      if (result.data) {
        setCatalogs(result.data)
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      showError('Error', 'Failed to load unit catalogs')
      console.error('Error loading catalogs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: UnitCatalogFormData) => {
    if (!user?.hospital_id || !user?.id) return

    try {
      if (selectedCatalog) {
        const result = await updateUnitCatalog(selectedCatalog.id, user.id, data)
        if (result.error) {
          showError('Error', result.error)
          throw new Error(result.error)
        }
        showSuccess('Success', 'Unit catalog updated successfully')
      } else {
        const result = await createUnitCatalog(user.hospital_id, user.id, data)
        if (result.error) {
          showError('Error', result.error)
          throw new Error(result.error)
        }
        showSuccess('Success', 'Unit catalog created successfully')
      }

      await loadCatalogs()
      await loadSummary()
      setSelectedCatalog(null)
    } catch (error) {
      console.error('Error saving catalog:', error)
    }
  }

  const handleDelete = async (catalog: UnitCatalogWithRelations) => {
    if (!user?.id) return
    const deptName = catalog.department?.department_name || 'this department'
    if (!confirm(`Are you sure you want to delete the catalog for ${deptName}?`)) {
      return
    }

    try {
      const result = await deleteUnitCatalog(catalog.id, user.id)
      if (result.error) {
        showError('Error', result.error)
        return
      }
      showSuccess('Success', 'Unit catalog deleted successfully')
      await loadCatalogs()
      await loadSummary()
    } catch (error) {
      console.error('Error deleting catalog:', error)
    }
  }

  const handleSync = async () => {
    if (!user?.hospital_id) return
    setIsSyncing(true)
    try {
      const result = await syncUnitCatalogCounts(user.hospital_id)
      if (result.error) {
        showError('Error', result.error)
      } else {
        showSuccess('Success', `Synced ${result.data?.synced || 0} unit catalog(s)`)
        await loadCatalogs()
        await loadSummary()
      }
    } catch (error) {
      showError('Error', 'Failed to sync counts')
      console.error('Error syncing:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const moduleName = (code: string | undefined) => {
    if (!code || typeof code !== 'string') return ''
    return MODULE_DEFINITIONS.find((m) => m.code === code)?.name || code
  }

  const tableColumns = [
    {
      key: 'department',
      label: 'Department',
      render: (_: any, catalog: UnitCatalogWithRelations) => (
        <div>
          <p className="font-medium">{catalog.department?.department_name || '—'}</p>
          <p className="text-xs text-gray-500">{catalog.department?.department_code || ''}</p>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      render: (_: any, catalog: UnitCatalogWithRelations) => {
        const code = typeof catalog.module_code === 'string' ? catalog.module_code : String(catalog.module_code || '')
        return <Badge variant="gray">{moduleName(code)}</Badge>
      },
    },
    {
      key: 'items',
      label: 'Catalog Items',
      render: (_: any, catalog: UnitCatalogWithItemCounts) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="success" className="text-xs">
              {catalog.drug_items_count || 0} Drugs
            </Badge>
            <Badge variant="info" className="text-xs">
              {catalog.non_drug_items_count || 0} Non-Drugs
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            {catalog.active_drug_items_count || 0} active drugs, {catalog.active_non_drug_items_count || 0} active non-drugs
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, catalog: UnitCatalogWithRelations) => {
        const colors: Record<string, 'success' | 'warning' | 'error'> = {
          active: 'success',
          inactive: 'warning',
          suspended: 'error',
        }
        const statusStr = typeof catalog.status === 'string' ? catalog.status : String(catalog.status || 'active')
        return <Badge variant={colors[statusStr] || 'gray'}>{statusStr}</Badge>
      },
    },
    {
      key: 'responsible',
      label: 'Responsible',
      render: (_: any, catalog: UnitCatalogWithRelations) => (
        <span className="text-sm">
          {catalog.responsible_user?.full_name || <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      render: (_: any, catalog: UnitCatalogWithRelations) => (
        <div className="text-xs">
          {catalog.last_updated_at ? (
            <>
              <p>{new Date(catalog.last_updated_at).toLocaleDateString()}</p>
              <p className="text-gray-500">
                by {catalog.last_updated_by_user?.full_name || 'Unknown'}
              </p>
            </>
          ) : (
            <span className="text-gray-400">Never</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, catalog: UnitCatalogWithItemCounts) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigate(ROUTES.PHARMACY_UNIT_CATALOG_ITEMS.replace(':id', catalog.id))
            }}
            title="Manage Items"
          >
            <Package className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCatalog(catalog)
              setShowEditModal(true)
            }}
            title="Edit Unit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCatalog(catalog)
              setShowHistoryModal(true)
            }}
            title="View History"
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (!user?.hospital_id) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hospital assigned. Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-violet-600" />
            Unit Catalog
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage what each department can indent, capacity limits, and track inventory counts.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Counts
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard
            title="Total Units"
            value={summary.total_units}
            color="primary"
            icon={<Building2 />}
          />
          <KPICard
            title="Active"
            value={summary.active_units}
            color="success"
            icon={<CheckCircle2 />}
          />
          <KPICard
            title="With Items"
            value={summary.units_with_items}
            color="info"
            icon={<Package />}
          />
          <KPICard
            title="Drug Items"
            value={summary.total_drug_items}
            color="success"
            icon={<Package />}
            subtitle={`${summary.total_active_drug_items} active`}
          />
          <KPICard
            title="Non-Drug Items"
            value={summary.total_non_drug_items}
            color="primary"
            icon={<Package />}
            subtitle={`${summary.total_active_non_drug_items} active`}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Modules' },
              ...availableModules.map((m) => ({ value: m.code, label: m.name })),
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />

        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table
            columns={tableColumns}
            data={catalogs}
            emptyMessage="No unit catalogs found. Click 'Add Unit' to create one."
          />
        </div>
      )}

      {/* Modals */}
      <UnitCatalogFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedCatalog(null)
        }}
        onSave={handleSave}
        hospitalId={user.hospital_id}
      />

      <UnitCatalogFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedCatalog(null)
        }}
        onSave={handleSave}
        catalog={selectedCatalog}
        hospitalId={user.hospital_id}
      />

      <ChangeHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false)
          setSelectedCatalog(null)
        }}
        catalogId={selectedCatalog?.id || ''}
        hospitalId={user.hospital_id}
      />

    </div>
  )
}

export default UnitCatalogPage

