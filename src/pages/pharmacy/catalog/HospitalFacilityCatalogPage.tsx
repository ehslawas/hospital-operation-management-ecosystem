/**
 * Hospital Facility Catalog Page
 * Modern, professional system to display and manage list of hospitals in Malaysia
 * Data sourced from Ministry of Health Malaysia (MOH)
 */

import React, { useEffect, useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Download,
  Building2,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
} from 'lucide-react'
import { Button, Input, Select, Modal, Pagination } from '@/components/ui'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import {
  getHospitalFacilities,
  getHospitalFacilityKPIs,
  createHospitalFacility,
  updateHospitalFacility,
  deleteHospitalFacility,
  exportHospitalFacilities,
  importHospitalsFromMOH,
} from '@/services/pharmacy/hospitalFacilityCatalogService'
import type {
  HospitalFacilityWithRelations,
  HospitalFacilityCatalogKPIs,
  HospitalFacilityCatalogFilter,
} from '@/types/pharmacy'

// Malaysian States
const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Malacca',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
].sort()

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

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-blue-300 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}

// =====================================================
// EDIT MODAL COMPONENT
// =====================================================

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (facility: any) => Promise<void>
  facility?: HospitalFacilityWithRelations | null
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, facility }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    facility_code: '',
    status: 'active' as 'active' | 'inactive',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name || '',
        address: facility.address || '',
        city: facility.city || '',
        state: facility.state || '',
        phone: facility.phone || '',
        email: facility.email || '',
        facility_code: facility.facility_code || '',
        status: facility.status || 'active',
      })
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        facility_code: '',
        status: 'active',
      })
    }
  }, [facility, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving facility:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={facility ? 'Edit Hospital Facility' : 'Add Hospital Facility'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
          <Input
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Hospital Kuala Lumpur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <Select
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
            >
              <option value="">Select State</option>
              {MALAYSIAN_STATES.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facility Code</label>
            <Input
              value={formData.facility_code}
              onChange={e => setFormData({ ...formData, facility_code: e.target.value })}
              placeholder="Optional code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : facility ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// MAIN HOSPITAL FACILITY CATALOG PAGE
// =====================================================

export const HospitalFacilityCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  // State
  const [facilities, setFacilities] = useState<HospitalFacilityWithRelations[]>([])
  const [kpis, setKpis] = useState<HospitalFacilityCatalogKPIs>({
    total: 0,
    by_state: [],
    by_city: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isFetchingFromMOH, setIsFetchingFromMOH] = useState(false)
  const [fetchProgress, setFetchProgress] = useState<{
    processed: number
    total: number
    success: number
    failed: number
  } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false) // Collapsible filters

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<HospitalFacilityWithRelations | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [facilityToDelete, setFacilityToDelete] = useState<HospitalFacilityWithRelations | null>(null)

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  })

  // Load data
  useEffect(() => {
    if (user?.hospital_id) {
      loadFacilities()
      loadKPIs()
    }
  }, [user?.hospital_id])

  const loadFacilities = async () => {
    if (!user?.hospital_id) return

    setIsLoading(true)
    try {
      const filter: HospitalFacilityCatalogFilter = {
        search: searchQuery || undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
        city: cityFilter !== 'all' ? cityFilter : undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      }

      const result = await getHospitalFacilities(user.hospital_id, filter)
      if (result.data) {
        setFacilities(result.data)
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      console.error('Error loading facilities:', error)
      showError('Error', 'Failed to load hospital facilities')
    } finally {
      setIsLoading(false)
    }
  }

  const loadKPIs = async () => {
    if (!user?.hospital_id) return

    try {
      const result = await getHospitalFacilityKPIs(user.hospital_id)
      if (result.data) {
        setKpis(result.data)
      }
    } catch (error) {
      console.error('Error loading KPIs:', error)
    }
  }

  // Handle search and filter changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadFacilities()
      setCurrentPage(1) // Reset to first page when filters change
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchQuery, stateFilter, cityFilter, statusFilter])

  // Get unique cities for filter dropdown (based on current state filter)
  const uniqueCities = useMemo(() => {
    const filtered = facilities.filter(f => !stateFilter || stateFilter === 'all' || f.state === stateFilter)
    const cities = filtered
      .map(f => f.city)
      .filter((city): city is string => Boolean(city))
    return Array.from(new Set(cities)).sort()
  }, [facilities, stateFilter])

  // Get unique states for filter dropdown
  const uniqueStates = useMemo(() => {
    const states = facilities.map(f => f.state).filter((state): state is string => Boolean(state))
    return Array.from(new Set(states)).sort()
  }, [facilities])

  // Handle create/update
  const handleSave = async (formData: any) => {
    if (!user?.hospital_id) return

    try {
      if (selectedFacility) {
        // Update
        const result = await updateHospitalFacility(selectedFacility.id, formData)
        if (result.data) {
          showSuccess('Success', 'Hospital facility updated successfully')
          loadFacilities()
          loadKPIs()
        } else if (result.error) {
          showError('Error', result.error)
        }
      } else {
        // Create
        const result = await createHospitalFacility(user.hospital_id, formData)
        if (result.data) {
          showSuccess('Success', 'Hospital facility created successfully')
          loadFacilities()
          loadKPIs()
        } else if (result.error) {
          showError('Error', result.error)
        }
      }
    } catch (error) {
      console.error('Error saving facility:', error)
      showError('Error', 'Failed to save hospital facility')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!facilityToDelete) return

    try {
      const result = await deleteHospitalFacility(facilityToDelete.id)
      if (result.error) {
        showError('Error', result.error)
      } else {
        showSuccess('Success', 'Hospital facility deleted successfully')
        setShowDeleteModal(false)
        setFacilityToDelete(null)
        loadFacilities()
        loadKPIs()
      }
    } catch (error) {
      console.error('Error deleting facility:', error)
      showError('Error', 'Failed to delete hospital facility')
    }
  }

  // Handle fetch from MOH
  const handleFetchFromMOH = async () => {
    if (!user?.hospital_id) return

    if (!confirm('This will fetch and import hospitals from the MOH website. This may take a few minutes. Continue?')) {
      return
    }

    setIsFetchingFromMOH(true)
    setFetchProgress({ processed: 0, total: 0, success: 0, failed: 0 })

    try {
      const result = await importHospitalsFromMOH(
        user.hospital_id,
        (progress) => {
          setFetchProgress(progress)
        }
      )

      if (result.data) {
        const { success, failed, errors } = result.data
        if (success > 0) {
          showSuccess(
            'Success',
            `Successfully imported ${success} hospital${success !== 1 ? 's' : ''} from MOH website${failed > 0 ? ` (${failed} failed)` : ''}`
          )
          // Reload facilities
          await loadFacilities()
          await loadKPIs()
        } else if (failed > 0) {
          showError(
            'Import Failed',
            `Failed to import ${failed} hospital${failed !== 1 ? 's' : ''}. ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`
          )
        }
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      console.error('Error fetching from MOH:', error)
      showError('Error', 'Failed to fetch hospitals from MOH website')
    } finally {
      setIsFetchingFromMOH(false)
      setFetchProgress(null)
    }
  }

  // Handle export
  const handleExport = async () => {
    if (!user?.hospital_id) return

    setIsExporting(true)
    try {
      const filter: HospitalFacilityCatalogFilter = {
        search: searchQuery || undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
        city: cityFilter !== 'all' ? cityFilter : undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
      }

      const result = await exportHospitalFacilities(user.hospital_id, filter)
      if (result.data) {
        // Download file
        const url = window.URL.createObjectURL(result.data)
        const link = document.createElement('a')
        link.href = url
        link.download = `hospital_facilities_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        showSuccess('Success', 'Hospital facilities exported successfully')
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      console.error('Error exporting facilities:', error)
      showError('Error', 'Failed to export hospital facilities')
    } finally {
      setIsExporting(false)
    }
  }

  // Sort facilities
  const sortedFacilities = useMemo(() => {
    return [...facilities].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.name || '').trim().toLowerCase()
          bValue = (b.name || '').trim().toLowerCase()
          break
        case 'state':
          aValue = (a.state || '').trim().toLowerCase()
          bValue = (b.state || '').trim().toLowerCase()
          break
        case 'city':
          aValue = (a.city || '').trim().toLowerCase()
          bValue = (b.city || '').trim().toLowerCase()
          break
        case 'status':
          aValue = (a.status || '').toLowerCase()
          bValue = (b.status || '').toLowerCase()
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, undefined, {
          sensitivity: 'base',
          numeric: true,
          ignorePunctuation: true,
        })
        return sortConfig.direction === 'asc' ? comparison : -comparison
      } else {
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        return sortConfig.direction === 'asc' ? comparison : -comparison
      }
    })
  }, [facilities, sortConfig])

  // Pagination
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sortedFacilities.length / pageSize)) : 1
  const paginatedFacilities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedFacilities.slice(startIndex, endIndex)
  }, [sortedFacilities, currentPage, pageSize])

  // Reset to first page when page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  // Handle sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4" />
      case 'inactive':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Hospital Facility Catalog
        </h1>
        <p className="text-gray-600 mt-1">
          Manage list of hospitals in Malaysia • {facilities.length} hospital{facilities.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Hospitals"
          value={kpis.total}
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="States Covered"
          value={kpis.by_state.length}
          icon={<MapPin className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Cities Covered"
          value={kpis.by_city.length}
          icon={<MapPin className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search and Main Actions Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex gap-2 w-full lg:w-auto flex-shrink-0">
              <Button
                onClick={handleFetchFromMOH}
                variant="primary"
                disabled={isFetchingFromMOH}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isFetchingFromMOH
                  ? fetchProgress
                    ? `${fetchProgress.processed}/${fetchProgress.total}`
                    : 'Fetching...'
                  : 'Fetch from MOH'}
              </Button>
              <Button
                onClick={() => {
                  setSelectedFacility(null)
                  setShowEditModal(true)
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add
              </Button>
              <Button
                onClick={handleExport}
                variant="secondary"
                disabled={isExporting || facilities.length === 0}
                size="sm"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                onClick={() => {
                  loadFacilities()
                  loadKPIs()
                }}
                variant="secondary"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(stateFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all') && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {[stateFilter !== 'all', cityFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilters && (
            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
                  <Select
                    value={stateFilter}
                    onChange={e => {
                      setStateFilter(e.target.value)
                      setCityFilter('all') // Reset city filter when state changes
                    }}
                    className="w-full"
                  >
                    <option value="all">All States</option>
                    {uniqueStates.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                  <Select
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                    className="w-full"
                    disabled={stateFilter === 'all' || uniqueCities.length === 0}
                  >
                    <option value="all">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                  <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              {(stateFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all') && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setStateFilter('all')
                      setCityFilter('all')
                      setStatusFilter('all')
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading hospital facilities...</p>
        </div>
      ) : sortedFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || stateFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Click "Add Hospital" to add a new hospital facility'}
          </p>
          <Button
            onClick={() => {
              setSelectedFacility(null)
              setShowEditModal(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Hospital
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    Hospital Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50">
                    Address
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('city')}
                  >
                    City {sortConfig.key === 'city' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('state')}
                  >
                    State {sortConfig.key === 'state' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50">
                    Contact
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky top-0 bg-gray-50 w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedFacilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{facility.name}</div>
                          {facility.facility_code && (
                            <div className="text-xs text-gray-500 font-mono">{facility.facility_code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{facility.address || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{facility.city || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{facility.state || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="space-y-1">
                        {facility.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{facility.phone}</span>
                          </div>
                        )}
                        {facility.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs">{facility.email}</span>
                          </div>
                        )}
                        {!facility.phone && !facility.email && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          facility.status
                        )}`}
                      >
                        {getStatusIcon(facility.status)}
                        {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedFacility(facility)
                            setShowEditModal(true)
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setFacilityToDelete(facility)
                            setShowDeleteModal(true)
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sortedFacilities.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={sortedFacilities.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          )}
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedFacility(null)
        }}
        onSave={handleSave}
        facility={selectedFacility}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setFacilityToDelete(null)
        }}
        title="Delete Hospital Facility"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{facilityToDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false)
                setFacilityToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default HospitalFacilityCatalogPage

