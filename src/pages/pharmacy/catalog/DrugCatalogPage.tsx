import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Download, X, Edit, Trash2, Filter, FileUp } from 'lucide-react'
import { Button, Input, Select, Badge, Table, Pagination, Modal, LoadingOverlay, Spinner } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import {
  getDrugCatalogKPIs,
  getDrugCatalog,
  searchDrugs,
  createDrug,
  updateDrug,
  deleteDrug,
  exportDrugCatalog,
  batchImportDrugs,
  type DrugCatalogFilter,
} from '@/services/pharmacy/drugCatalogService'
import { getDrugCategories } from '@/services/pharmacy/inventoryService'
import { getSuppliers } from '@/services/pharmacy/procurementService'
import type { DrugWithRelations, DrugCategory, Supplier } from '@/types/pharmacy'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

const ExcelImport = lazy(() => import('@/components/pharmacy/ExcelImport'))

// =====================================================
// KPI CARD COMPONENT
// =====================================================

interface KPICardProps {
  title: string
  value: number
  color: 'primary' | 'success' | 'warning' | 'error'
}

const KPICard: React.FC<KPICardProps> = ({ title, value, color }) => {
  const colorClasses = {
    primary: 'bg-teal-50 border-teal-200 text-teal-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 p-4 ${colorClasses[color]}`}
    >
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </motion.div>
  )
}

// =====================================================
// DRUG FORM MODAL COMPONENT
// =====================================================

interface DrugFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<DrugWithRelations>) => Promise<void>
  drug?: DrugWithRelations | null
  categories: DrugCategory[]
  suppliers: Supplier[]
}

const DrugFormModal: React.FC<DrugFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  drug,
  categories,
  suppliers,
}) => {
  const [formData, setFormData] = useState<Partial<DrugWithRelations & { packaging_description?: string; item_sub_class?: string }>>({
    drug_code: '',
    drug_name: '',
    generic_name: '',
    brand_name: '',
    dosage_form: 'tablet',
    strength: '',
    unit_of_measure: 'tablet',
    category_id: '',
    supplier_id: '',
    procurement_vote: undefined,
    sku: '',
    pku: '',
    price: 0,
    status: 'active',
    min_stock_level: 0,
    max_stock_level: 0,
    reorder_level: 0,
    lead_time_days: 7,
    is_controlled: false,
    requires_prescription: false,
    storage_conditions: '',
    packaging_description: '',
    item_sub_class: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (drug) {
      setFormData({
        drug_code: drug.drug_code,
        drug_name: drug.drug_name,
        generic_name: drug.generic_name,
        brand_name: drug.brand_name,
        dosage_form: drug.dosage_form,
        strength: drug.strength,
        unit_of_measure: drug.unit_of_measure,
        category_id: drug.category_id || '',
        supplier_id: drug.supplier_id || '',
        procurement_vote: drug.procurement_vote,
        sku: drug.sku || '',
        pku: drug.pku || '',
        price: drug.price || 0,
        status: drug.status,
        min_stock_level: drug.min_stock_level,
        max_stock_level: drug.max_stock_level,
        reorder_level: drug.reorder_level,
        lead_time_days: drug.lead_time_days,
        is_controlled: drug.is_controlled,
        requires_prescription: drug.requires_prescription,
        storage_conditions: drug.storage_conditions,
        packaging_description: (drug as any).packaging_description || '',
        item_sub_class: (drug as any).item_sub_class || '',
      })
    } else {
      setFormData({
        drug_code: '',
        drug_name: '',
        generic_name: '',
        brand_name: '',
        dosage_form: 'tablet',
        strength: '',
        unit_of_measure: 'tablet',
        category_id: '',
        supplier_id: '',
        procurement_vote: undefined,
        sku: '',
        pku: '',
        price: 0,
        status: 'active',
        min_stock_level: 0,
        max_stock_level: 0,
        reorder_level: 0,
        lead_time_days: 7,
        is_controlled: false,
        requires_prescription: false,
        storage_conditions: '',
        packaging_description: '',
        item_sub_class: '',
      })
    }
  }, [drug, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving drug:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={drug ? 'Edit Drug' : 'Add New Drug'} size="full">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
              <Input
                value={formData.drug_code || ''}
                onChange={(e) => setFormData({ ...formData, drug_code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drug Name *</label>
              <Input
                value={formData.drug_name || ''}
                onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
              <Input
                value={formData.generic_name || ''}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <Input
                value={formData.brand_name || ''}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Catalog Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Catalog Information
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Sub Class</label>
              <Input
                value={(formData as any).item_sub_class || ''}
                onChange={(e) => setFormData({ ...formData, item_sub_class: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drug Category</label>
              <Select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Description</label>
              <Input
                value={(formData as any).packaging_description || ''}
                onChange={(e) => setFormData({ ...formData, packaging_description: e.target.value })}
                placeholder="Enter packaging description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <Input
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PKU</label>
              <Input
                value={formData.pku || ''}
                onChange={(e) => setFormData({ ...formData, pku: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <Select
                value={formData.supplier_id || ''}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.supplier_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procurement Vote</label>
              <Select
                value={formData.procurement_vote || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    procurement_vote: e.target.value as 'appl' | 'cc' | 'dp' | 'lp' | undefined,
                  })
                }
              >
                <option value="">Select Procurement Vote</option>
                <option value="appl">APPL</option>
                <option value="cc">CC</option>
                <option value="dp">DP</option>
                <option value="lp">LP</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={formData.status || 'active'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'inactive',
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (RM)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Drug Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Drug Details
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Form</label>
              <Select
                value={formData.dosage_form || 'tablet'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dosage_form: e.target.value as any,
                  })
                }
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="injection">Injection</option>
                <option value="syrup">Syrup</option>
                <option value="suspension">Suspension</option>
                <option value="cream">Cream</option>
                <option value="ointment">Ointment</option>
                <option value="drops">Drops</option>
                <option value="inhaler">Inhaler</option>
                <option value="patch">Patch</option>
                <option value="suppository">Suppository</option>
                <option value="powder">Powder</option>
                <option value="solution">Solution</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
              <Input
                value={formData.strength || ''}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <Input
                value={formData.unit_of_measure || ''}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Stock Management Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Stock Management
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <Input
                type="number"
                value={formData.min_stock_level || 0}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
              <Input
                type="number"
                value={formData.max_stock_level || 0}
                onChange={(e) =>
                  setFormData({ ...formData, max_stock_level: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <Input
                type="number"
                value={formData.reorder_level || 0}
                onChange={(e) =>
                  setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (Days)</label>
              <Input
                type="number"
                value={formData.lead_time_days || 7}
                onChange={(e) =>
                  setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 7 })
                }
              />
            </div>
          </div>
        </div>

        {/* Additional Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Additional Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_controlled || false}
                  onChange={(e) => setFormData({ ...formData, is_controlled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Controlled Substance</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_prescription || false}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_prescription: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Requires Prescription</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Conditions</label>
              <Input
                value={formData.storage_conditions || ''}
                onChange={(e) => setFormData({ ...formData, storage_conditions: e.target.value })}
                placeholder="e.g., Store below 25°C"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Spinner size="sm" /> : drug ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// MAIN DRUG CATALOG PAGE
// =====================================================

export const DrugCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0 })
  const [drugs, setDrugs] = useState<DrugWithRelations[]>([])
  const [categories, setCategories] = useState<DrugCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<DrugWithRelations[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [supplierFilter, setSupplierFilter] = useState<string>('')
  const [procurementVoteFilter, setProcurementVoteFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedDrug, setSelectedDrug] = useState<DrugWithRelations | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Load initial data
  useEffect(() => {
    if (user?.hospital_id) {
      loadKPIs()
      loadCategories()
      loadSuppliers()
    }
  }, [user?.hospital_id])

  // Load drugs when filters change
  useEffect(() => {
    if (user?.hospital_id) {
      loadDrugs()
    }
  }, [currentPage, pageSize, categoryFilter, supplierFilter, procurementVoteFilter, statusFilter, searchQuery, user?.hospital_id])

  // Search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2 && user?.hospital_id) {
      const timer = setTimeout(() => {
        loadSearchSuggestions()
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  const loadKPIs = async () => {
    if (!user?.hospital_id) return
    try {
      const result = await getDrugCatalogKPIs(user.hospital_id)
      if (result.data) {
        setKpis(result.data)
      }
    } catch (error) {
      console.error('Error loading KPIs:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await getDrugCategories()
      if (result.data) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const result = await getSuppliers(undefined, 1, 1000) // Get all suppliers
      if (result.data?.data) {
        setSuppliers(result.data.data)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const loadDrugs = async () => {
    if (!user?.hospital_id) return
    setIsLoading(true)
    try {
      const filter: DrugCatalogFilter = {
        search: searchQuery || undefined,
        category_id: categoryFilter || undefined,
        supplier_id: supplierFilter || undefined,
        procurement_vote: procurementVoteFilter as any,
        status: statusFilter as any,
      }

      const result = await getDrugCatalog(user.hospital_id, filter, currentPage, pageSize)
      if (result.data) {
        setDrugs(result.data.data)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      showError('Error', 'Failed to load drugs')
      console.error('Error loading drugs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSearchSuggestions = async () => {
    if (!user?.hospital_id) return
    try {
      const result = await searchDrugs(user.hospital_id, searchQuery, 10)
      if (result.data) {
        setSearchSuggestions(result.data)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error loading search suggestions:', error)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setSortConfig(undefined) // Reset sort when searching
    loadDrugs()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setSupplierFilter('')
    setProcurementVoteFilter('')
    setStatusFilter('')
    setCurrentPage(1)
    setSortConfig(undefined) // Reset sort when clearing filters
    // loadDrugs will be called by useEffect when filters change
  }

  const handleSaveDrug = async (data: Partial<DrugWithRelations>) => {
    if (!user?.hospital_id) return
    try {
      if (selectedDrug) {
        // Update
        const result = await updateDrug(selectedDrug.id, data)
        if (result.error) {
          showError('Error', result.error)
          throw new Error(result.error)
        }
        showSuccess('Success', 'Drug updated successfully')
      } else {
        // Create
        const result = await createDrug(user.hospital_id, data)
        if (result.error) {
          showError('Error', result.error)
          throw new Error(result.error)
        }
        showSuccess('Success', 'Drug created successfully')
      }
      await loadDrugs()
      await loadKPIs()
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedDrug(null)
    } catch (error) {
      console.error('Error saving drug:', error)
    }
  }

  const handleDeleteDrug = async () => {
    if (!selectedDrug) return
    try {
      const result = await deleteDrug(selectedDrug.id)
      if (result.error) {
        showError('Error', result.error)
        return
      }
      showSuccess('Success', 'Drug deleted successfully')
      setShowDeleteModal(false)
      setSelectedDrug(null)
      await loadDrugs()
      await loadKPIs()
    } catch (error) {
      showError('Error', 'Failed to delete drug')
      console.error('Error deleting drug:', error)
    }
  }

  const handleExport = async () => {
    if (!user?.hospital_id) return
    setIsExporting(true)
    try {
      const filter: DrugCatalogFilter = {
        search: searchQuery || undefined,
        category_id: categoryFilter || undefined,
        supplier_id: supplierFilter || undefined,
        procurement_vote: procurementVoteFilter as any,
        status: statusFilter as any,
      }

      const result = await exportDrugCatalog(user.hospital_id, filter)
      if (result.data) {
        // Download CSV
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `drug-catalog-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showSuccess('Success', 'Drug catalog exported successfully')
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      showError('Error', 'Failed to export drug catalog')
      console.error('Error exporting:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (
    data: any[],
    mappings: any[],
    onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
  ) => {
    if (!user?.hospital_id) {
      console.error('handleImport: No user hospital_id')
      return { success: 0, errors: ['User not authenticated'] }
    }

    console.log('handleImport called with:', {
      dataCount: data.length,
      hospital_id: user.hospital_id,
      sampleData: data.slice(0, 2)
    })

    try {
      const result = await batchImportDrugs(user.hospital_id, data, onProgress)
      console.log('Import result:', result)
      
      if (result.data) {
        // Force a small delay to ensure data is persisted
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Reset to first page and clear filters to show all imported items
        setCurrentPage(1)
        setSearchQuery('')
        setCategoryFilter('')
        setSupplierFilter('')
        setProcurementVoteFilter('')
        setStatusFilter('')
        
        console.log('Reloading drugs after import...')
        await loadDrugs()
        await loadKPIs()
        
        if (result.data.success > 0) {
          showSuccess('Success', `Successfully imported ${result.data.success} drug(s). Please refresh the page if items don't appear.`)
        }
        return result.data
      } else if (result.error) {
        console.error('Import error:', result.error)
        showError('Error', result.error)
        return { success: 0, errors: [result.error] }
      }
      return { success: 0, errors: ['Unknown error'] }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import drugs'
      console.error('Import exception:', error)
      showError('Error', errorMsg)
      return { success: 0, errors: [errorMsg] }
    }
  }

  const drugImportFields = [
    { key: 'drug_code', label: 'Drug/Non-Drug Code', required: true, type: 'string' as const },
    { key: 'drug_name', label: 'Drug/Non-Drug Name', required: true, type: 'string' as const },
    { key: 'item_sub_class', label: 'Item Sub Class', required: false, type: 'string' as const },
    { key: 'category_id', label: 'Drug Category', required: false, type: 'select' as const },
    { key: 'packaging_description', label: 'Packaging Description', required: false, type: 'string' as const },
    { key: 'sku', label: 'SKU', required: false, type: 'string' as const },
    { key: 'pku', label: 'PKU', required: false, type: 'string' as const },
    { key: 'procurement_vote', label: 'Procurement Vote', required: false, type: 'select' as const },
    { key: 'price', label: 'Unit Price (RM)', required: false, type: 'number' as const },
    { key: 'supplier_id', label: 'Supplier', required: false, type: 'select' as const },
    { key: 'status', label: 'Status', required: false, type: 'select' as const },
    { key: 'generic_name', label: 'Generic Name', required: false, type: 'string' as const },
    { key: 'brand_name', label: 'Brand Name', required: false, type: 'string' as const },
    { key: 'dosage_form', label: 'Dosage Form', required: false, type: 'select' as const },
    { key: 'strength', label: 'Strength', required: false, type: 'string' as const },
    { key: 'unit_of_measure', label: 'Unit of Measure', required: false, type: 'string' as const },
    { key: 'min_stock_level', label: 'Min Stock Level', required: false, type: 'number' as const },
    { key: 'max_stock_level', label: 'Max Stock Level', required: false, type: 'number' as const },
    { key: 'reorder_level', label: 'Reorder Level', required: false, type: 'number' as const },
    { key: 'lead_time_days', label: 'Lead Time (Days)', required: false, type: 'number' as const },
    { key: 'storage_conditions', label: 'Storage Conditions', required: false, type: 'string' as const },
  ]

  // Sort data based on sortConfig
  const sortedDrugs = useMemo(() => {
    if (!sortConfig) return drugs

    return [...drugs].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Handle different column types
      switch (sortConfig.key) {
        case 'drug_code':
          aValue = a.drug_code || ''
          bValue = b.drug_code || ''
          break
        case 'drug_name':
          aValue = a.drug_name || ''
          bValue = b.drug_name || ''
          break
        case 'item_sub_class':
          aValue = (a as any).item_sub_class || ''
          bValue = (b as any).item_sub_class || ''
          break
        case 'category':
          aValue = a.category?.category_name || ''
          bValue = b.category?.category_name || ''
          break
        case 'packaging_description':
          aValue = (a as any).packaging_description || ''
          bValue = (b as any).packaging_description || ''
          break
        case 'sku':
          aValue = a.sku || ''
          bValue = b.sku || ''
          break
        case 'pku':
          aValue = a.pku || ''
          bValue = b.pku || ''
          break
        case 'procurement_vote':
          aValue = a.procurement_vote || ''
          bValue = b.procurement_vote || ''
          break
        case 'supplier':
          aValue = a.supplier?.supplier_name || ''
          bValue = b.supplier?.supplier_name || ''
          break
        case 'price':
          aValue = a.price || 0
          bValue = b.price || 0
          break
        default:
          return 0
      }

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' })
        return sortConfig.direction === 'asc' ? comparison : -comparison
      } else {
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }
    })
  }, [drugs, sortConfig])

  const columns = [
    {
      key: 'drug_code',
      label: 'DRUG/NON-DRUG CODE',
      sortable: true,
    },
    {
      key: 'drug_name',
      label: 'DRUG NAME',
      sortable: true,
      className: 'min-w-[320px] max-w-[480px]',
    },
    {
      key: 'item_sub_class',
      label: 'ITEM SUB CLASS',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => (drug as any).item_sub_class || '-',
    },
    {
      key: 'category',
      label: 'DRUG CATEGORY',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => drug.category?.category_name || '-',
    },
    {
      key: 'packaging_description',
      label: 'PACKAGING DESCRIPTION',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => (drug as any).packaging_description || '-',
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => drug.sku || '-',
    },
    {
      key: 'pku',
      label: 'PKU',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => drug.pku || '-',
    },
    {
      key: 'procurement_vote',
      label: 'PROCUREMENT VOTE',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => (drug.procurement_vote?.toUpperCase() || '-'),
    },
    {
      key: 'price',
      label: 'UNIT PRICE(RM)',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => formatCurrency(drug.price || 0),
    },
    {
      key: 'supplier',
      label: 'SUPPLIER',
      sortable: true,
      render: (_value: unknown, drug: DrugWithRelations) => drug.supplier?.supplier_name || '-',
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      sortable: false,
      render: (_value: unknown, drug: DrugWithRelations) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDrug(drug)
              setShowEditModal(true)
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDrug(drug)
              setShowDeleteModal(true)
            }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const hasActiveFilters =
    searchQuery || categoryFilter || supplierFilter || procurementVoteFilter || statusFilter

  return (
    <div className="space-y-6 p-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total" value={kpis.total} color="primary" />
        <KPICard title="Active" value={kpis.active} color="success" />
        <KPICard title="Inactive" value={kpis.inactive} color="warning" />
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.length < 2) {
                  setShowSuggestions(false)
                }
              }}
              onFocus={() => {
                if (searchSuggestions.length > 0) setShowSuggestions(true)
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              className="pl-10"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchSuggestions.map((drug) => (
                  <div
                    key={drug.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearchQuery(drug.drug_name)
                      setShowSuggestions(false)
                      handleSearch()
                    }}
                  >
                    <p className="font-medium">{drug.drug_name}</p>
                    <p className="text-xs text-gray-500">{drug.drug_code}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
              setSortConfig(undefined)
            }}
            placeholder="Category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </Select>

          <Select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value)
              setCurrentPage(1)
              setSortConfig(undefined)
            }}
            placeholder="Supplier"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.supplier_name}
              </option>
            ))}
          </Select>

          <Select
            value={procurementVoteFilter}
            onChange={(e) => {
              setProcurementVoteFilter(e.target.value)
              setCurrentPage(1)
              setSortConfig(undefined)
            }}
            placeholder="Procurement Vote"
          >
            <option value="">All Votes</option>
            <option value="appl">APPL</option>
            <option value="cc">CC</option>
            <option value="dp">DP</option>
            <option value="lp">LP</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
              setSortConfig(undefined)
            }}
            placeholder="Status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          <Button variant="outline" onClick={handleClearFilters} disabled={!hasActiveFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Drug Catalog</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <FileUp className="w-4 h-4 mr-2" />
            Import from Document
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
          <Button
            onClick={() => {
              setSelectedDrug(null)
              setShowAddModal(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Drug
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table
              data={sortedDrugs}
              columns={columns}
              sortConfig={sortConfig}
              onSort={(key) => {
                setSortConfig((prev) => {
                  if (prev?.key === key) {
                    return prev.direction === 'asc'
                      ? { key, direction: 'desc' }
                      : undefined
                  }
                  return { key, direction: 'asc' }
                })
              }}
              isLoading={isLoading}
              emptyMessage="No drugs found"
            />
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              total={total}
            />
          )}
        </>
      )}

      {/* Modals */}
      <DrugFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedDrug(null)
        }}
        onSave={handleSaveDrug}
        categories={categories}
        suppliers={suppliers}
      />

      <DrugFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedDrug(null)
        }}
        onSave={handleSaveDrug}
        drug={selectedDrug}
        categories={categories}
        suppliers={suppliers}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedDrug(null)
        }}
        title="Delete Drug"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete "{selectedDrug?.drug_name}"?</p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedDrug(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDrug}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Suspense fallback={<div className="p-4 text-center">Loading import dialog...</div>}>
        <ExcelImport
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          targetFields={drugImportFields}
          title="Import Drugs from Document"
          description="Upload an Excel file, PDF, or image to import drugs. Our AI will automatically extract and import catalog information from any document."
          catalogType="drug"
        />
      </Suspense>
    </div>
  )
}

export default DrugCatalogPage

