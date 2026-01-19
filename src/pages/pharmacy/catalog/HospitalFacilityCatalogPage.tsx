/**
 * Hospital Facility Catalog Page
 * Modern, professional system to display and manage list of hospitals in Malaysia
 * Data sourced from Ministry of Health Malaysia (MOH)
 */

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Download,
  Building2,
  MapPin,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Globe,
} from 'lucide-react'
import { Button, Input, Select, Modal, Pagination, Table, TableHeader, TableRow, TableCell, TableBody, Badge, Spinner, ConfirmationDialog } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
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
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
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


  return (
    <FinancialPageLayout
      title="Hospital Facility Catalog"
      description="Manage list of hospitals in Malaysia. Data sourced from Ministry of Health Malaysia (MOH)."
      icon={Building2}
      breadcrumbs={[{ label: 'Catalogs', href: '#' }, { label: 'Hospitals' }]}
      actions={
        <div className="flex gap-2">
          <Button
            onClick={handleFetchFromMOH}
            variant="outline"
            disabled={isFetchingFromMOH}
            className="bg-white/50 backdrop-blur-sm text-green-700 border-green-200 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {isFetchingFromMOH
              ? fetchProgress
                ? `${fetchProgress.processed}/${fetchProgress.total}`
                : 'Fetching...'
              : 'Fetch from MOH'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting || facilities.length === 0} className="bg-white/50 backdrop-blur-sm text-blue-700 border-blue-200">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={() => { setSelectedFacility(null); setShowEditModal(true) }} className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Add Hospital
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><Building2 className="w-5 h-5 text-blue-50" /></div>
                <span className="text-sm font-medium text-blue-50">Total Hospitals</span>
              </div>
              <p className="text-3xl font-bold">{kpis.total}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><MapPin className="w-5 h-5 text-emerald-50" /></div>
                <span className="text-sm font-medium text-emerald-50">States Covered</span>
              </div>
              <p className="text-3xl font-bold">{kpis.by_state.length}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><Globe className="w-5 h-5 text-amber-50" /></div>
                <span className="text-sm font-medium text-amber-50">Cities Covered</span>
              </div>
              <p className="text-3xl font-bold">{kpis.by_city.length}</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-4 border border-white/40 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search hospitals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 h-10 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`border-slate-200 ${showFilters ? 'bg-slate-100' : 'bg-white'}`}>
                <Filter className="w-4 h-4 mr-2" /> Filters
                {(stateFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all') && (
                  <Badge variant="primary" className="ml-2">{[stateFilter !== 'all', cityFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length}</Badge>
                )}
              </Button>
              <Button variant="ghost" onClick={() => { loadFacilities(); loadKPIs(); }} className="text-slate-500">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">State</label>
                <Select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setCityFilter('all'); }} className="w-full">
                  <option value="all">All States</option>
                  {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">City</label>
                <Select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="w-full" disabled={stateFilter === 'all' || uniqueCities.length === 0}>
                  <option value="all">All Cities</option>
                  {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-100">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableCell as="th" className="font-semibold text-slate-600">Name</TableCell>
                <TableCell as="th" className="font-semibold text-slate-600">Location</TableCell>
                <TableCell as="th" className="font-semibold text-slate-600">Contact</TableCell>
                <TableCell as="th" className="font-semibold text-slate-600 text-center">Status</TableCell>
                <TableCell as="th" className="font-semibold text-slate-600 text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Spinner size="lg" /></TableCell></TableRow>
              ) : paginatedFacilities.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No hospitals found</TableCell></TableRow>
              ) : (
                paginatedFacilities.map(facility => (
                  <TableRow key={facility.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{facility.name}</p>
                        {facility.facility_code && <p className="text-xs text-slate-500 font-mono">{facility.facility_code}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-slate-600">
                        <span>{facility.city}, {facility.state}</span>
                        <span className="text-xs text-slate-400 line-clamp-1">{facility.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-slate-600">
                        <span>{facility.phone || '-'}</span>
                        <span className="text-xs text-slate-400">{facility.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={facility.status === 'active' ? 'success' : 'gray'}>{facility.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedFacility(facility); setShowEditModal(true); }}>
                          <Edit className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setFacilityToDelete(facility); setShowDeleteModal(true); }}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} total={kpis.total} pageSize={pageSize} onPageChange={setCurrentPage} className="border-t border-slate-100 p-4" />}
        </div>

        <EditModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedFacility(null); }}
          onSave={handleSave}
          facility={selectedFacility}
        />

        <ConfirmationDialog
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Hospital"
          message={`Are you sure you want to delete ${facilityToDelete?.name}? This action cannot be undone.`}
          variant="danger"
        />
      </div>
    </FinancialPageLayout>
  )
}

export default HospitalFacilityCatalogPage
