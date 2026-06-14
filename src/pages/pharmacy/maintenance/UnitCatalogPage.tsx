import React, { useState, useEffect } from 'react'
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
import {
  getCatalogItems,
  addCatalogItem,
  addCatalogItems,
  updateCatalogItem,
  deleteCatalogItem,
  toggleCatalogItem,
} from '@/services/pharmacy/unitCatalogItemService'
import { getDrugCatalog } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog } from '@/services/pharmacy/nonDrugCatalogService'
import type {
  UnitCatalogItemWithRelations,
  UnitCatalogItemFormData,
  CatalogItemType,
  DrugWithRelations,
  NonDrugWithRelations,
} from '@/types/pharmacy'
import { getUsers } from '@/services/userService'
import { getHospitalModules } from '@/services/moduleService'
import type {
  UnitCatalogWithRelations,
  UnitCatalogWithItemCounts,
  UnitCatalogFormData,
  UnitCatalogStatus,
  UnitCatalogChangeWithRelations,
  UnitCatalogFilter,
} from '@/types/pharmacy'
import { MODULE_DEFINITIONS } from '@/lib/constants'

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
    if (isOpen) {
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
      if (result.data?.data) {
        setUsers(
          result.data.data.map((u) => ({
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
}

const ChangeHistoryModal: React.FC<ChangeHistoryModalProps> = ({ isOpen, onClose, catalogId }) => {
  const [changes, setChanges] = useState<UnitCatalogChangeWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && catalogId) {
      loadChanges()
    }
  }, [isOpen, catalogId])

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

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return '[Object]'
      }
    }
    try {
      return String(value)
    } catch {
      return '—'
    }
  }

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change History" size="lg">
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
                        <p className="font-medium">{formatFieldName(change.field_name)}</p>
                        <p className="text-sm text-gray-600">
                          Changed by {change.changed_by_user?.full_name || 'Unknown'} on{' '}
                          {new Date(change.changed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Old Value</p>
                        <p className="text-sm font-mono bg-red-50 p-2 rounded">
                          {formatValue(change.old_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">New Value</p>
                        <p className="text-sm font-mono bg-green-50 p-2 rounded">
                          {formatValue(change.new_value)}
                        </p>
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
// CATALOG ITEMS MODAL
// =====================================================

interface CatalogItemsModalProps {
  isOpen: boolean
  onClose: () => void
  catalog: UnitCatalogWithItemCounts
  onRefresh?: () => void
}

const CatalogItemsModal: React.FC<CatalogItemsModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onRefresh,
}) => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  
  const [activeTab, setActiveTab] = useState<CatalogItemType>('drug')
  const [items, setItems] = useState<UnitCatalogItemWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Add Items Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableItems, setAvailableItems] = useState<DrugWithRelations[] | NonDrugWithRelations[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [defaultMinLimit, setDefaultMinLimit] = useState(1)
  const [defaultMaxLimit, setDefaultMaxLimit] = useState<number | null>(null)
  const [defaultActive, setDefaultActive] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (isOpen && catalog?.id) {
      loadItems()
    }
  }, [isOpen, catalog?.id, activeTab])

  // Load available items when Add Modal opens
  useEffect(() => {
    if (showAddModal && catalog?.hospital_id) {
      const timeoutId = setTimeout(() => {
        loadAvailableItems()
      }, searchQuery ? 500 : 0) // Debounce search by 500ms

      return () => clearTimeout(timeoutId)
    }
  }, [showAddModal, catalog?.hospital_id, activeTab, searchQuery, currentPage])

  const loadItems = async () => {
    if (!catalog?.id) return
    setIsLoading(true)
    try {
      const result = await getCatalogItems(catalog.id, activeTab, 1, 1000)
      if (result.data?.data) {
        setItems(result.data.data)
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      showError('Error', 'Failed to load items')
      console.error('Error loading items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (item: UnitCatalogItemWithRelations) => {
    if (!user?.id || !catalog?.id) return
    setIsSaving(true)
    try {
      const result = await toggleCatalogItem(
        item.id,
        catalog.id,
        catalog.hospital_id,
        user.id,
        !item.is_active
      )
      if (result.error) {
        showError('Error', result.error)
      } else {
        showSuccess('Success', 'Item status updated')
        await loadItems()
        onRefresh?.()
      }
    } catch (error) {
      showError('Error', 'Failed to update item')
      console.error('Error updating item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: UnitCatalogItemWithRelations) => {
    if (!user?.id || !catalog?.id) return
    const itemName = activeTab === 'drug' 
      ? item.drug?.drug_name || 'this item'
      : item.non_drug?.item_name || 'this item'
    
    if (!confirm(`Are you sure you want to remove ${itemName} from this catalog?`)) {
      return
    }

    setIsSaving(true)
    try {
      const result = await deleteCatalogItem(item.id, catalog.id, catalog.hospital_id, user.id)
      if (result.error) {
        showError('Error', result.error)
      } else {
        showSuccess('Success', 'Item removed from catalog')
        await loadItems()
        onRefresh?.()
      }
    } catch (error) {
      showError('Error', 'Failed to remove item')
      console.error('Error removing item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const loadAvailableItems = async () => {
    if (!catalog?.hospital_id) return
    setIsLoadingAvailable(true)
    try {
      // Get existing item IDs to filter them out
      const existingDrugIds = new Set(
        items
          .filter((i) => i.item_type === 'drug' && i.drug_id)
          .map((i) => i.drug_id!)
          .filter((id): id is string => !!id)
      )
      const existingNonDrugIds = new Set(
        items
          .filter((i) => i.item_type === 'non_drug' && i.non_drug_id)
          .map((i) => i.non_drug_id!)
          .filter((id): id is string => !!id)
      )

      if (activeTab === 'drug') {
        const result = await getDrugCatalog(
          catalog.hospital_id,
          {
            search: searchQuery.trim() || undefined,
            status: 'active' as const,
          },
          currentPage,
          20
        )
        if (result.data?.data) {
          // Filter out items already in catalog
          const available = result.data.data.filter(
            (drug: DrugWithRelations) => !existingDrugIds.has(drug.id)
          )
          setAvailableItems(available)
          setTotalPages(result.data.totalPages)
        } else if (result.error) {
          showError('Error', result.error)
        }
      } else {
        const result = await getNonDrugCatalog(
          catalog.hospital_id,
          {
            search: searchQuery.trim() || undefined,
            status: 'active' as const,
          },
          currentPage,
          20
        )
        if (result.data?.data) {
          // Filter out items already in catalog
          const available = result.data.data.filter(
            (nonDrug: NonDrugWithRelations) => !existingNonDrugIds.has(nonDrug.id)
          )
          setAvailableItems(available)
          setTotalPages(result.data.totalPages)
        } else if (result.error) {
          showError('Error', result.error)
        }
      }
    } catch (error) {
      showError('Error', 'Failed to load available items')
      console.error('Error loading available items:', error)
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  const handleToggleSelection = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedItemIds.size === availableItems.length) {
      setSelectedItemIds(new Set())
    } else {
      setSelectedItemIds(new Set(availableItems.map((item: any) => item.id)))
    }
  }

  const handleAddItems = async () => {
    if (!user?.id || !catalog?.id || selectedItemIds.size === 0) return

    setIsSaving(true)
    try {
      const itemsToAdd: UnitCatalogItemFormData[] = Array.from(selectedItemIds).map((itemId) => {
        const item = availableItems.find((i: any) => i.id === itemId)
        if (!item) return null

        return {
          item_type: activeTab,
          drug_id: activeTab === 'drug' ? itemId : null,
          non_drug_id: activeTab === 'non_drug' ? itemId : null,
          is_active: defaultActive,
          min_limit: defaultMinLimit,
          max_limit: defaultMaxLimit || null,
        }
      }).filter(Boolean) as UnitCatalogItemFormData[]

      const result = await addCatalogItems(catalog.id, catalog.hospital_id, user.id, itemsToAdd)
      if (result.error) {
        showError('Error', result.error)
      } else {
        showSuccess('Success', `Added ${itemsToAdd.length} item(s) to catalog`)
        setShowAddModal(false)
        setSelectedItemIds(new Set())
        setSearchQuery('')
        await loadItems()
        onRefresh?.()
      }
    } catch (error) {
      showError('Error', 'Failed to add items')
      console.error('Error adding items:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const itemColumns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: UnitCatalogItemWithRelations) => (
        <span className="font-mono text-sm">
          {activeTab === 'drug' ? item.drug?.drug_code : item.non_drug?.item_code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (item: UnitCatalogItemWithRelations) => (
        <span className="text-sm font-medium">
          {activeTab === 'drug' ? item.drug?.drug_name : item.non_drug?.item_name}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Active',
      render: (item: UnitCatalogItemWithRelations) => (
        <button
          onClick={() => handleToggleActive(item)}
          disabled={isSaving}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            item.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'limits',
      label: 'Min / Max',
      render: (item: UnitCatalogItemWithRelations) => (
        <span className="text-sm">
          {item.min_limit} / {item.max_limit ? item.max_limit : '∞'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: UnitCatalogItemWithRelations) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDelete(item)}
          disabled={isSaving}
        >
          Remove
        </Button>
      ),
    },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Items - ${catalog.department?.department_name || 'Unit'}`}
      size="full"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('drug')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'drug'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Drugs ({catalog.drug_items_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('non_drug')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'non_drug'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Non-Drugs ({catalog.non_drug_items_count || 0})
            </button>
          </div>
        </div>

        {/* Items Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <Table
              columns={itemColumns}
              data={items}
              emptyMessage={`No ${activeTab === 'drug' ? 'drug' : 'non-drug'} items found. Click 'Add Items' to add some.`}
            />
          </div>
        )}

        {/* Add Items Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          <Button
            onClick={() => {
              setShowAddModal(true)
              setSelectedItemIds(new Set())
              setSearchQuery('')
              setCurrentPage(1)
            }}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
        </div>
      </div>

      {/* Add Items Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedItemIds(new Set())
          setSearchQuery('')
          setCurrentPage(1)
        }}
        title={`Add ${activeTab === 'drug' ? 'Drug' : 'Non-Drug'} Items`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Search */}
          <Input
            label="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={`Search by code or name...`}
            leftIcon={<Search className="w-4 h-4" />}
          />

          {/* Default Settings */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Limit</label>
              <Input
                type="number"
                value={defaultMinLimit.toString()}
                onChange={(e) => setDefaultMinLimit(parseInt(e.target.value) || 1)}
                min="1"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Limit</label>
              <Input
                type="number"
                value={defaultMaxLimit?.toString() || ''}
                onChange={(e) => setDefaultMaxLimit(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                min="1"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Active Status</label>
              <button
                onClick={() => setDefaultActive(!defaultActive)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  defaultActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {defaultActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>

          {/* Items List */}
          {isLoadingAvailable ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {availableItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {activeTab === 'drug' ? 'drugs' : 'non-drugs'} found. Try a different search.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.size === availableItems.length && availableItems.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Name</th>
                        {activeTab === 'drug' && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Generic</th>
                        )}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {availableItems.map((item: any) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedItemIds.has(item.id) ? 'bg-violet-50' : ''
                          }`}
                          onClick={() => handleToggleSelection(item.id)}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedItemIds.has(item.id)}
                              onChange={() => handleToggleSelection(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-mono text-sm">
                              {activeTab === 'drug' ? item.drug_code : item.item_code}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium">
                              {activeTab === 'drug' ? item.drug_name : item.item_name}
                            </span>
                          </td>
                          {activeTab === 'drug' && (
                            <td className="px-4 py-2">
                              <span className="text-xs text-gray-600">{item.generic_name || '—'}</span>
                            </td>
                          )}
                          <td className="px-4 py-2">
                            <span className="text-xs text-gray-600">
                              {activeTab === 'drug' ? item.unit_of_measure : item.unit_of_measure}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">
                  {selectedItemIds.size} item(s) selected
                </span>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedItemIds(new Set())
                      setSearchQuery('')
                      setCurrentPage(1)
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddItems}
                    disabled={isSaving || selectedItemIds.size === 0}
                  >
                    {isSaving ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add {selectedItemIds.size} Item(s)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Modal>
  )
}

// =====================================================
// MAIN UNIT CATALOG PAGE
// =====================================================

export const UnitCatalogPage: React.FC = () => {
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
  const [selectedCatalogForItems, setSelectedCatalogForItems] = useState<UnitCatalogWithItemCounts | null>(null)
  const [showItemsModal, setShowItemsModal] = useState(false)
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
      render: (catalog: UnitCatalogWithRelations) => (
        <div>
          <p className="font-medium">{catalog.department?.department_name || '—'}</p>
          <p className="text-xs text-gray-500">{catalog.department?.department_code || ''}</p>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      render: (catalog: UnitCatalogWithRelations) => {
        const code = typeof catalog.module_code === 'string' ? catalog.module_code : String(catalog.module_code || '')
        return <Badge variant="secondary">{moduleName(code)}</Badge>
      },
    },
    {
      key: 'items',
      label: 'Catalog Items',
      render: (catalog: UnitCatalogWithItemCounts) => (
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
      render: (catalog: UnitCatalogWithRelations) => {
        const colors: Record<string, 'success' | 'warning' | 'error'> = {
          active: 'success',
          inactive: 'warning',
          suspended: 'error',
        }
        const statusStr = typeof catalog.status === 'string' ? catalog.status : String(catalog.status || 'active')
        return <Badge variant={colors[statusStr] || 'secondary'}>{statusStr}</Badge>
      },
    },
    {
      key: 'responsible',
      label: 'Responsible',
      render: (catalog: UnitCatalogWithRelations) => (
        <span className="text-sm">
          {catalog.responsible_user?.full_name || <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      render: (catalog: UnitCatalogWithRelations) => (
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
      render: (catalog: UnitCatalogWithItemCounts) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCatalogForItems(catalog)
              setShowItemsModal(true)
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
      />

      {/* Catalog Items Modal */}
      {selectedCatalogForItems && (
        <CatalogItemsModal
          isOpen={showItemsModal}
          onClose={() => {
            setShowItemsModal(false)
            setSelectedCatalogForItems(null)
          }}
          catalog={selectedCatalogForItems}
          onRefresh={() => {
            loadCatalogs()
            loadSummary()
          }}
        />
      )}
    </div>
  )
}

export default UnitCatalogPage

