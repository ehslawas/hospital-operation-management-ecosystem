import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Pill, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Table, TableBody, TableCell, TableHeader, TableRow, Spinner, Input, Badge, Select } from '@/components/ui'
import { getDrugCatalog as getDrugs } from '@/services/pharmacy/drugCatalogService'
import { getDrugCategories } from '@/services/pharmacy/inventoryService'
import type { DrugWithRelations, DrugCategory } from '@/types/pharmacy'
import type { DrugCatalogFilter } from '@/services/pharmacy/drugCatalogService'
import { DrugDetailsModal } from './components/DrugDetailsModal'

export const DrugInventoryPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()

  const [drugs, setDrugs] = useState<DrugWithRelations[]>([])
  const [categories, setCategories] = useState<DrugCategory[]>([])
  const [therapeuticClasses, setTherapeuticClasses] = useState<DrugCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [therapeuticClassId, setTherapeuticClassId] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Details Modal
  const [selectedDrug, setSelectedDrug] = useState<DrugWithRelations | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      const res = await getDrugCategories()
      if (res.data) {
        // Split categories into FUKKM (standard) and Therapeutic Classes
        // Classification Logic:
        // FUKKM Categories: Short codes (e.g., A, B, C, A*) - Length usually <= 3
        // Therapeutic Classes: Descriptive codes (e.g., ANTIBIOTICS) - Length > 3

        const allCats = res.data
        const therapeutic = allCats.filter(c => (c.category_code?.length || 0) > 3)
        const fukkm = allCats.filter(c => (c.category_code?.length || 0) <= 3)

        setCategories(fukkm)
        setTherapeuticClasses(therapeutic)
      }
    }
    void loadCategories()
  }, [])

  // Load drugs with filters
  const loadDrugs = useCallback(async () => {
    if (!isSessionReady || !hospitalId) return

    setIsLoading(true)
    setError(null)

    const filter: DrugCatalogFilter = {
      search: search || undefined,
      category_id: categoryId || undefined,
      therapeutic_class_id: therapeuticClassId || undefined,
      status: status === 'all' ? undefined : (status as 'active' | 'inactive'),
    }

    const res = await getDrugs(hospitalId, filter as unknown as DrugCatalogFilter, page, pageSize)

    if (res.error) {
      setError(res.error)
      setDrugs([])
    } else if (res.data) {
      setDrugs(res.data.data)
      setTotalPages(res.data.totalPages)
      setTotal(res.data.total)
    }

    setIsLoading(false)
  }, [isSessionReady, hospitalId, search, categoryId, therapeuticClassId, status, page])

  useEffect(() => {
    void loadDrugs()
  }, [loadDrugs])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, categoryId, therapeuticClassId, status])

  const renderStatusBadge = (itemStatus: 'active' | 'inactive') => {
    return itemStatus === 'active' ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="gray">Inactive</Badge>
    )
  }

  const renderStockBadge = (stockStatus?: string) => {
    if (!stockStatus) return <Badge variant="gray">—</Badge>
    const map: Record<string, { color: 'success' | 'warning' | 'error' | 'secondary'; label: string }> = {
      in_stock: { color: 'success', label: 'In Stock' },
      low_stock: { color: 'warning', label: 'Low' },
      critical: { color: 'error', label: 'Critical' },
      out_of_stock: { color: 'secondary', label: 'Out' },
    }
    const cfg = map[stockStatus] || { color: 'secondary', label: stockStatus }
    return <Badge variant={cfg.color as any}>{cfg.label}</Badge>
  }

  const handleDrugClick = (drug: DrugWithRelations) => {
    console.log('Drug clicked:', drug.drug_name, drug.id)
    setSelectedDrug(drug)
    setIsDetailsModalOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="w-6 h-6 text-teal-600" />
          Drug Inventory
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and view all drugs registered in your hospital pharmacy.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Code, name or generic name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Category (FUKKM)</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Therapeutic Class</label>
          <Select value={therapeuticClassId} onChange={(e) => setTherapeuticClassId(e.target.value)}>
            <option value="">All Classes</option>
            {therapeuticClasses.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="w-3 h-3" />
          <span>{total} drugs</span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load drugs</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell as="th">Code</TableCell>
                  <TableCell as="th">Drug Name</TableCell>
                  <TableCell as="th">Generic</TableCell>
                  <TableCell as="th">Form</TableCell>
                  <TableCell as="th">Strength</TableCell>
                  <TableCell as="th">Category (FUKKM)</TableCell>
                  <TableCell as="th">Therapeutic Class</TableCell>
                  <TableCell as="th" className="text-center">Controlled</TableCell>
                  <TableCell as="th" className="text-center">Stock</TableCell>
                  <TableCell as="th" className="text-center">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-8">
                      No drugs found matching your filters.
                    </TableCell>
                  </TableRow>
                )}

                {drugs.map((drug) => (
                  <TableRow key={drug.id}>
                    <TableCell className="font-mono text-xs text-gray-700">
                      {drug.drug_code}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      <button
                        onClick={() => handleDrugClick(drug)}
                        className="text-teal-600 hover:text-teal-800 hover:underline text-left transition-colors duration-150"
                      >
                        {drug.drug_name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {drug.generic_name || '—'}
                    </TableCell>
                    <TableCell className="text-xs uppercase text-gray-500">
                      {drug.dosage_form}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {drug.strength || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {drug.category?.category_name || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {drug.therapeutic_class?.category_name || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {drug.is_controlled ? (
                        <Badge variant="error">Yes</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStockBadge(drug.stock_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusBadge(drug.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Item Details Modal */}
      <DrugDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        drug={selectedDrug}
      />
    </div>
  )
}

export default DrugInventoryPage

