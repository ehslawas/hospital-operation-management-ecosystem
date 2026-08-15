// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Download, X, Edit, Trash2, Filter, FileUp, ChevronRight, Sparkles, Package, TrendingUp, CheckCircle, XCircle, CheckSquare, Square } from 'lucide-react'
import { Button, Input, Select, Badge, Table, Pagination, Modal, LoadingOverlay, Spinner } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, parseAndNormalizeDate, getFallbackContractDates } from '@/lib/utils'
import {
  getNonDrugCatalogKPIs,
  getNonDrugCatalog,
  searchNonDrugs,
  createNonDrug,
  updateNonDrug,
  deleteNonDrug,
  exportNonDrugCatalog,
  batchImportNonDrugs,
  batchUpdateNonDrugStatus,
  type NonDrugCatalogFilter,
} from '@/services/pharmacy/nonDrugCatalogService'
import { getNonDrugCategories } from '@/services/pharmacy/inventoryService'
import { getSuppliers } from '@/services/pharmacy/procurementService'
import { isSupabaseConfigured } from '@/services/supabase'
import type { NonDrugWithRelations, NonDrugCategory, Supplier } from '@/types/pharmacy'
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
// NON-DRUG FORM MODAL COMPONENT
// =====================================================

interface NonDrugFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<NonDrugWithRelations>) => Promise<void>
  nonDrug?: NonDrugWithRelations | null
  categories: NonDrugCategory[]
  suppliers: Supplier[]
}

const NonDrugFormModal: React.FC<NonDrugFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  nonDrug,
  categories,
  suppliers,
}) => {
  const [formData, setFormData] = useState<Partial<NonDrugWithRelations & { packaging_description?: string }>>({
    item_code: '',
    item_name: '',
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
    unit_of_measure: 'unit',
    packaging_description: '',
    cc_contract_number: '',
    cc_contract_start_date: '',
    cc_contract_end_date: '',
    cc_contract_status: 'active',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (nonDrug) {
      setFormData({
        item_code: nonDrug.item_code || '',
        item_name: nonDrug.item_name || '',
        category_id: nonDrug.category_id || '',
        supplier_id: nonDrug.supplier_id || '',
        procurement_vote: nonDrug.procurement_vote,
        sku: nonDrug.sku || '',
        pku: nonDrug.pku || '',
        price: nonDrug.price || 0,
        status: nonDrug.status || 'active',
        min_stock_level: nonDrug.min_stock_level || 0,
        max_stock_level: nonDrug.max_stock_level || 0,
        reorder_level: nonDrug.reorder_level || 0,
        unit_of_measure: nonDrug.unit_of_measure || 'unit',
        packaging_description: (nonDrug as any).packaging_description || '',
        cc_contract_number: (nonDrug as any).cc_contract_number || '',
        cc_contract_start_date: (nonDrug as any).cc_contract_start_date || '',
        cc_contract_end_date: (nonDrug as any).cc_contract_end_date || '',
        cc_contract_status: (nonDrug as any).cc_contract_status || 'active',
      })
    } else {
      setFormData({
        item_code: '',
        item_name: '',
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
        unit_of_measure: 'unit',
        packaging_description: '',
        cc_contract_number: '',
        cc_contract_start_date: '',
        cc_contract_end_date: '',
        cc_contract_status: 'active',
      })
    }
  }, [nonDrug, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving non-drug:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={nonDrug ? 'Edit Non-Drug Item' : 'Add New Non-Drug Item'} size="full">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Non-Drug Code *</label>
              <Input
                value={formData.item_code || ''}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Non-Drug Name *</label>
              <Input
                value={formData.item_name || ''}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Category</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <Select
                value={formData.supplier_id || ''}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.company_name || 'Unknown Supplier'}
                  </option>
                ))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (RM)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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

        {/* Contract Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Contract Details
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Number</label>
              <Input
                value={(formData as any).cc_contract_number || ''}
                onChange={(e) => setFormData({ ...formData, cc_contract_number: e.target.value })}
                placeholder="e.g. KK/SUM/2024/001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Status</label>
              <Select
                value={(formData as any).cc_contract_status || 'active'}
                onChange={(e) => setFormData({ ...formData, cc_contract_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Start Date</label>
              <Input
                type="date"
                value={(formData as any).cc_contract_start_date || ''}
                onChange={(e) => setFormData({ ...formData, cc_contract_start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract End Date</label>
              <Input
                type="date"
                value={(formData as any).cc_contract_end_date || ''}
                onChange={(e) => setFormData({ ...formData, cc_contract_end_date: e.target.value })}
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
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Spinner size="sm" /> : nonDrug ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// MAIN NON-DRUG CATALOG PAGE
// =====================================================

export const NonDrugCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0 })
  const [nonDrugs, setNonDrugs] = useState<NonDrugWithRelations[]>([])
  const [categories, setCategories] = useState<NonDrugCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | undefined>(undefined)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<NonDrugWithRelations[]>([])
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
  const [selectedNonDrug, setSelectedNonDrug] = useState<NonDrugWithRelations | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Multi-Selection & Bulk Status Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === sortedNonDrugs.length && sortedNonDrugs.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedNonDrugs.map((item) => item.id))
    }
  }, [sortedNonDrugs, selectedIds])

  const handleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleToggleSingleStatus = async (item: NonDrugWithRelations) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active'
    try {
      const result = await updateNonDrug(item.id, { status: nextStatus })
      if (result.error) {
        showError('Error', result.error)
        return
      }
      showSuccess('Success', `Non-drug status updated to ${nextStatus}`)
      await loadNonDrugs()
      await loadKPIs()
    } catch (error) {
      showError('Error', 'Failed to update non-drug status')
    }
  }

  const handleBulkStatusChange = async (targetStatus: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return
    setIsBulkUpdating(true)
    try {
      const result = await batchUpdateNonDrugStatus(selectedIds, targetStatus)
      if (result.error) {
        showError('Error', result.error)
        return
      }
      showSuccess(
        'Success',
        `Successfully ${targetStatus === 'active' ? 'activated' : 'deactivated'} ${result.data?.successCount || selectedIds.length} item(s)`
      )
      setSelectedIds([])
      await loadNonDrugs()
      await loadKPIs()
    } catch (error) {
      showError('Error', 'Failed to bulk update status')
    } finally {
      setIsBulkUpdating(false)
    }
  }

  // Load initial data
  useEffect(() => {
    if (user?.hospital_id) {
      loadKPIs()
      loadCategories()
      loadSuppliers()
    }
  }, [user?.hospital_id])

  // Load non-drugs when filters change
  useEffect(() => {
    if (user?.hospital_id) {
      loadNonDrugs()
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
      const result = await getNonDrugCatalogKPIs(user.hospital_id)
      if (result.data) {
        setKpis(result.data)
      }
    } catch (error) {
      console.error('Error loading KPIs:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await getNonDrugCategories()
      if (result.data) {
        setCategories(result.data)
        console.log('Loaded categories:', result.data.length)
      } else {
        console.warn('No categories loaded:', result.error)
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
        console.log('Loaded suppliers:', result.data.data.length)
      } else {
        console.warn('No suppliers loaded:', result.error)
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }

  const loadNonDrugs = async () => {
    if (!user?.hospital_id) {
      console.log('loadNonDrugs: No user hospital_id')
      return
    }
    console.log('loadNonDrugs called with hospital_id:', user.hospital_id)
    setIsLoading(true)
    try {
      const filter: NonDrugCatalogFilter = {
        search: searchQuery?.trim() || undefined,
        category_id: categoryFilter?.trim() || undefined,
        supplier_id: supplierFilter?.trim() || undefined,
        procurement_vote: procurementVoteFilter?.trim() ? (procurementVoteFilter as 'appl' | 'cc' | 'dp' | 'lp') : undefined,
        status: statusFilter?.trim() ? (statusFilter as 'active' | 'inactive') : undefined,
      }
      console.log('Loading with filters:', filter)
      console.log('Supabase configured:', isSupabaseConfigured())

      const result = await getNonDrugCatalog(user.hospital_id, filter, currentPage, pageSize)
      if (result.data) {
        console.log('Loaded non-drugs:', {
          count: result.data.data.length,
          total: result.data.total,
          page: result.data.page,
          totalPages: result.data.totalPages
        })
        setNonDrugs(result.data.data)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      } else if (result.error) {
        console.error('Error loading non-drugs:', result.error)
        showError('Error', result.error)
      }
    } catch (error) {
      showError('Error', 'Failed to load non-drug items')
      console.error('Error loading non-drugs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSearchSuggestions = async () => {
    if (!user?.hospital_id) return
    try {
      const result = await searchNonDrugs(user.hospital_id, searchQuery, 10)
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
    loadNonDrugs()
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setSupplierFilter('')
    setProcurementVoteFilter('')
    setStatusFilter('')
    setCurrentPage(1)
    setSortConfig(undefined) // Reset sort when clearing filters
  }

  const handleSaveNonDrug = async (data: Partial<NonDrugWithRelations>) => {
    if (!user?.hospital_id) return
    try {
      if (selectedNonDrug) {
        // Update
        const result = await updateNonDrug(selectedNonDrug.id, data)
        if (result.error) {
          showError('Error', result.error)
          throw new Error(result.error)
        }
        showSuccess('Success', 'Non-drug item updated successfully')
      } else {
        // Create
        const result = await createNonDrug(user.hospital_id, data)
        if (result.error) {
          showError('Error', result.error)
          throw new Error(result.error)
        }
        showSuccess('Success', 'Non-drug item created successfully')
      }
      await loadNonDrugs()
      await loadKPIs()
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedNonDrug(null)
    } catch (error) {
      console.error('Error saving non-drug:', error)
    }
  }

  const handleDeleteNonDrug = async () => {
    if (!selectedNonDrug) return
    try {
      console.log('Deleting non-drug:', {
        id: selectedNonDrug.id,
        code: selectedNonDrug.item_code,
        name: selectedNonDrug.item_name
      })
      
      const result = await deleteNonDrug(selectedNonDrug.id)
      if (result.error) {
        console.error('Delete error:', result.error)
        showError('Error', result.error)
        return
      }
      
      console.log('Delete successful, reloading data...')
      showSuccess('Success', 'Non-drug item deleted successfully')
      setShowDeleteModal(false)
      setSelectedNonDrug(null)
      
      // Wait a bit to ensure deletion is committed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await loadNonDrugs()
      await loadKPIs()
    } catch (error) {
      showError('Error', 'Failed to delete non-drug item')
      console.error('Error deleting non-drug:', error)
    }
  }

  const handleExport = async () => {
    if (!user?.hospital_id) return
    setIsExporting(true)
    try {
      const filter: NonDrugCatalogFilter = {
        search: searchQuery?.trim() || undefined,
        category_id: categoryFilter?.trim() || undefined,
        supplier_id: supplierFilter?.trim() || undefined,
        procurement_vote: procurementVoteFilter?.trim() ? (procurementVoteFilter as 'appl' | 'cc' | 'dp' | 'lp') : undefined,
        status: statusFilter?.trim() ? (statusFilter as 'active' | 'inactive') : undefined,
      }

      const result = await exportNonDrugCatalog(user.hospital_id, filter)
      if (result.data) {
        // Download CSV
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `non-drug-catalog-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showSuccess('Success', 'Non-drug catalog exported successfully')
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      showError('Error', 'Failed to export non-drug catalog')
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
      const result = await batchImportNonDrugs(user.hospital_id, data, onProgress)
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
        
        console.log('Reloading non-drugs after import...')
        await loadNonDrugs()
        await loadKPIs()
        
        if (result.data.success > 0) {
          showSuccess('Success', `Successfully imported ${result.data.success} non-drug item(s). Please refresh the page if items don't appear.`)
        }
        return result.data
      } else if (result.error) {
        console.error('Import error:', result.error)
        showError('Error', result.error)
        return { success: 0, errors: [result.error] }
      }
      return { success: 0, errors: ['Unknown error'] }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import non-drugs'
      console.error('Import exception:', error)
      showError('Error', errorMsg)
      return { success: 0, errors: [errorMsg] }
    }
  }

  const nonDrugImportFields = [
    { key: 'item_code', label: 'Non-Drug Code', required: true, type: 'string' as const },
    { key: 'item_name', label: 'Non-Drug Name', required: true, type: 'string' as const },
    { key: 'cc_contract_number', label: 'Contract Number / CC No', required: false, type: 'string' as const },
    { key: 'cc_contract_start_date', label: 'Contract Start Date', required: false, type: 'string' as const },
    { key: 'cc_contract_end_date', label: 'Contract End Date', required: false, type: 'string' as const },
    { key: 'category_id', label: 'Item Category', required: false, type: 'select' as const },
    { key: 'packaging_description', label: 'Packaging Description', required: false, type: 'string' as const },
    { key: 'sku', label: 'SKU', required: false, type: 'string' as const },
    { key: 'pku', label: 'PKU', required: false, type: 'string' as const },
    { key: 'procurement_vote', label: 'Procurement Vote', required: false, type: 'select' as const },
    { key: 'supplier_id', label: 'Supplier', required: false, type: 'select' as const },
    { key: 'status', label: 'Status', required: false, type: 'select' as const },
    { key: 'price', label: 'Unit Price (RM)', required: false, type: 'number' as const },
    { key: 'unit_of_measure', label: 'Unit of Measure', required: false, type: 'string' as const },
    { key: 'min_stock_level', label: 'Min Stock Level', required: false, type: 'number' as const },
    { key: 'max_stock_level', label: 'Max Stock Level', required: false, type: 'number' as const },
    { key: 'reorder_level', label: 'Reorder Level', required: false, type: 'number' as const },
  ]

  // Sort data based on sortConfig
  const sortedNonDrugs = useMemo(() => {
    if (!sortConfig) return nonDrugs

    return [...nonDrugs].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Handle different column types
      switch (sortConfig.key) {
        case 'item_code':
          aValue = a.item_code || ''
          bValue = b.item_code || ''
          break
        case 'item_name':
          aValue = a.item_name || ''
          bValue = b.item_name || ''
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
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
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
  }, [nonDrugs, sortConfig])

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={sortedNonDrugs.length > 0 && selectedIds.length === sortedNonDrugs.length}
          onChange={handleSelectAll}
          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
      ),
      sortable: false,
      render: (_value: unknown, item: NonDrugWithRelations) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(item.id)}
          onChange={(e) => {
            e.stopPropagation()
            handleSelectRow(item.id)
          }}
          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
      ),
    },
    {
      key: 'item_code',
      label: 'NON-DRUG CODE',
      sortable: true,
    },
    {
      key: 'item_name',
      label: 'NON-DRUG NAME',
      sortable: true,
      className: 'min-w-[350px] w-[35%]',
      render: (_value: unknown, item: NonDrugWithRelations) => (
        <div className="max-w-full">
          <p className="text-sm font-medium text-gray-900 break-words whitespace-normal">{item.item_name}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'ITEM CATEGORY',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => item.category?.category_name || '-',
    },
    {
      key: 'packaging_description',
      label: 'PACKAGING DESCRIPTION',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => (item as any).packaging_description || '-',
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => item.sku || '-',
    },
    {
      key: 'pku',
      label: 'PKU',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => item.pku || '-',
    },
    {
      key: 'procurement_vote',
      label: 'PROCUREMENT VOTE',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => (item.procurement_vote?.toUpperCase() || '-'),
    },
    {
      key: 'cc_contract_number',
      label: 'NO. KONTRAK',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => (item as any).cc_contract_number || '-',
    },
    {
      key: 'cc_contract_start_date',
      label: 'TARIKH MULA',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => {
        const { startDate } = getFallbackContractDates(item)
        if (!startDate) return '-'
        return new Date(startDate).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
      },
    },
    {
      key: 'cc_contract_end_date',
      label: 'TARIKH TAMAT',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => {
        const { endDate } = getFallbackContractDates(item)
        if (!endDate) return '-'
        return new Date(endDate).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
      },
    },
    {
      key: 'cc_contract_status',
      label: 'STATUS KONTRAK',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => {
        const { startDate, endDate } = getFallbackContractDates(item)
        if (!startDate || !endDate) return '-'
        const start = new Date(startDate)
        const end = new Date(endDate)
        const today = new Date()
        if (today >= start && today <= end) return 'Aktif'
        if (today > end) return 'Tamat'
        return 'Belum Mula'
      },
    },
    {
      key: 'price',
      label: 'UNIT PRICE (RM)',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => formatCurrency(item.price || 0),
    },
    {
      key: 'supplier',
      label: 'SUPPLIER',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => item.supplier?.supplier_name || '-',
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (_value: unknown, item: NonDrugWithRelations) => {
        const isAct = item.status === 'active'
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleSingleStatus(item)
            }}
            title={isAct ? 'Click to deactivate' : 'Click to activate'}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all shadow-sm ${
              isAct
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isAct ? 'Active' : 'Inactive'}
          </button>
        )
      },
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      sortable: false,
      render: (_value: unknown, item: NonDrugWithRelations) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedNonDrug(item)
              setShowEditModal(true)
            }}
            title="Edit item details"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedNonDrug(item)
              setShowDeleteModal(true)
            }}
            title="Delete item"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const hasActiveFilters = searchQuery || categoryFilter || supplierFilter || procurementVoteFilter || statusFilter

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* Premium Ambient Radial Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-teal-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Enhanced Breadcrumb navigation */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="text-slate-400">Pharmacy</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Catalog</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold tracking-wide">Non-Drug Catalog</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                Non-Drug Catalog
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Comprehensive Database of Medical Disposables & Surgical Supplies
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Import Document
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
            <button
              onClick={() => {
                setSelectedNonDrug(null)
                setShowAddModal(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-xs font-bold uppercase tracking-wider hover:from-slate-800 hover:to-indigo-900 transition-all shadow-md shadow-slate-900/10 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Non-Drug
            </button>
          </div>
        </div>

        {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Items */}
            <div className="bg-blue-50/50 border-2 border-blue-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-blue-50 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900/60 uppercase tracking-widest">Total Inventory Items</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{kpis.total}</h3>
                  <p className="text-xs font-bold text-blue-600 mt-2">Total non-drugs in catalog</p>
                </div>
              </div>
            </div>

            {/* Active Items */}
            <div className="bg-emerald-50/50 border-2 border-emerald-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900/60 uppercase tracking-widest">Active Stock Items</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{kpis.active}</h3>
                  <p className="text-xs font-bold text-emerald-600 mt-2">Available for procurement</p>
                </div>
              </div>
            </div>

            {/* Inactive Items */}
            <div className="bg-amber-50/50 border-2 border-amber-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-amber-50 hover:border-amber-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-amber-100 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <X className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900/60 uppercase tracking-widest">Inactive Items</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">{kpis.inactive}</h3>
                  <p className="text-xs font-bold text-amber-600 mt-2">Suspended or discontinued</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Main Catalog Content */}
      <div className="space-y-6 relative z-20">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 shadow-xl overflow-hidden">
          {/* Action Bar / Filters */}
          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                  className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {searchSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setSearchQuery(item.item_name)
                          setShowSuggestions(false)
                          handleSearch()
                        }}
                      >
                        <p className="font-semibold text-slate-950 text-sm">{item.item_name}</p>
                        <p className="text-xs text-slate-400">{item.item_code}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                  setSortConfig(undefined)
                }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
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
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">All Suppliers</option>
                {suppliers.length > 0 ? (
                  suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.company_name || 'Unknown Supplier'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No suppliers available</option>
                )}
              </Select>

              <Select
                value={procurementVoteFilter}
                onChange={(e) => {
                  setProcurementVoteFilter(e.target.value)
                  setCurrentPage(1)
                  setSortConfig(undefined)
                }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
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
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>

              <button
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Sticky/Floating Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 mb-4 border border-slate-800"
            >
              <div className="flex items-center gap-3">
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-extrabold tracking-wide">
                  {selectedIds.length} Selected
                </span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  Select multi-item action to activate or deactivate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  disabled={isBulkUpdating}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Activate Selected ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  disabled={isBulkUpdating}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Deactivate Selected ({selectedIds.length})
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-6">
            <Table
              data={sortedNonDrugs}
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
              emptyMessage="No non-drug items found"
            />
          </div>
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                total={total}
              />
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Modals */}
      <NonDrugFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedNonDrug(null)
        }}
        onSave={handleSaveNonDrug}
        categories={categories}
        suppliers={suppliers}
      />

      <NonDrugFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedNonDrug(null)
        }}
        onSave={handleSaveNonDrug}
        nonDrug={selectedNonDrug}
        categories={categories}
        suppliers={suppliers}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedNonDrug(null)
        }}
        title="Delete Non-Drug Item"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete "{selectedNonDrug?.item_name}"?</p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedNonDrug(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteNonDrug}>
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
          targetFields={nonDrugImportFields}
          title="Import Non-Drug Items from Document"
          description="Upload an Excel file, PDF, or image to import non-drug items. Our AI will automatically extract and import catalog information from any document."
          catalogType="non_drug"
        />
      </Suspense>
    </div>
  )
}

export default NonDrugCatalogPage

