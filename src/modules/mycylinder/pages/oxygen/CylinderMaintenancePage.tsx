// @ts-nocheck
// CylinderMaintenancePage.tsx
// React page component for managing medical cylinder maintenance requests

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/services/supabase'
import {
  Wrench,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ChevronRight,
  Eye,
  Check,
  X,
  Loader2,
  DollarSign,
  Building,
  Info
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getCylinderMaintenanceRequests,
  getCylinderMaintenanceDetails,
  createCylinderMaintenanceRequest,
  updateCylinderMaintenanceStatus
} from '../../services/cylinderMaintenanceService'
import type { CylinderMaintenanceWithRelations, OxygenCylinderWithRelations } from '@/types/pharmacy'

export const CylinderMaintenancePage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  // State
  const [requests, setRequests] = useState<CylinderMaintenanceWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'create' | 'history'>('active')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Details Modal
  const [selectedRequest, setSelectedRequest] = useState<CylinderMaintenanceWithRelations | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Form State
  const [suppliers, setSuppliers] = useState<{ id: string; company_name: string }[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedBudgetSource, setSelectedBudgetSource] = useState<'warrant' | 'appl' | 'cc' | 'lp'>('warrant')
  const [justification, setJustification] = useState('')
  const [notes, setNotes] = useState('')
  
  // Available Cylinders for Maintenance Form
  const [availableCylinders, setAvailableCylinders] = useState<OxygenCylinderWithRelations[]>([])
  const [isLoadingCylinders, setIsLoadingCylinders] = useState(false)
  const [searchCylinderTerm, setSearchCylinderTerm] = useState('')
  const [selectedCylinders, setSelectedCylinders] = useState<
    {
      cylinder: OxygenCylinderWithRelations
      maintenance_type: 'replacing_valve' | 'painting' | 'general_maintenance' | 'hydrostatic_testing' | 'other'
      cost: number
      notes: string
    }[]
  >([])
  const [showCylinderPicker, setShowCylinderPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [cylinderSizes, setCylinderSizes] = useState<{ id: string; code: string }[]>([])
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all')

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)
    const res = await getCylinderMaintenanceRequests(hospitalId)
    if (res.error) {
      setError(res.error)
    } else {
      setRequests(res.data || [])
    }
    setIsLoading(false)
  }, [hospitalId])

  // Fetch details
  const fetchRequestDetails = async (id: string) => {
    setIsDetailsLoading(true)
    setDetailsError(null)
    const res = await getCylinderMaintenanceDetails(id)
    if (res.error) {
      setDetailsError(res.error)
    } else {
      setSelectedRequest(res.data)
    }
    setIsDetailsLoading(false)
  }

  // Fetch initial data
  useEffect(() => {
    if (hospitalId) {
      fetchRequests()
      loadSuppliers()
    }
  }, [hospitalId, fetchRequests])

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, company_name')
        .order('company_name', { ascending: true })
      if (!error && data) {
        const filtered = data.filter(s => {
          const name = (s.company_name || '').toLowerCase();
          return name.includes('linde') || name.includes('borneo indah');
        });
        setSuppliers(filtered)
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }

  // Load available cylinders for picker
  const loadAvailableCylinders = async () => {
    if (!hospitalId) return
    setIsLoadingCylinders(true)
    try {
      const { data, error: err } = await supabase
        .from('pharmacy_oxygen_cylinder_inventory')
        .select(`
          *,
          size_info:pharmacy_oxygen_cylinder_sizes(*),
          type_info:pharmacy_oxygen_cylinder_types(*)
        `)
        .eq('hospital_id', hospitalId)
        .neq('status', 'maintenance')
        .neq('status', 'disposed')

      if (err) throw err
      setAvailableCylinders(data || [])
    } catch (err: any) {
      console.error('Failed to load cylinders:', err)
    } finally {
      setIsLoadingCylinders(false)
    }
  }

  const loadSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_oxygen_cylinder_sizes')
        .select('id, code')
        .order('code', { ascending: true })
      if (!error && data) {
        setCylinderSizes(data)
      }
    } catch (err) {
      console.error('Failed to load sizes:', err)
    }
  }

  useEffect(() => {
    if (showCylinderPicker) {
      loadAvailableCylinders()
      loadSizes()
    }
  }, [showCylinderPicker, hospitalId])

  // Filtered available cylinders for picker dialog
  const filteredAvailableCylinders = useMemo(() => {
    return availableCylinders.filter(cyl => {
      const isAlreadySelected = selectedCylinders.some(item => item.cylinder.id === cyl.id)
      if (isAlreadySelected) return false
      
      const sizeMatch = selectedSizeFilter === 'all' || cyl.cylinder_size_id === selectedSizeFilter
      
      const searchMatch = searchCylinderTerm === '' || 
        cyl.serial_number.toLowerCase().includes(searchCylinderTerm.toLowerCase()) ||
        (cyl.notes && cyl.notes.toLowerCase().includes(searchCylinderTerm.toLowerCase()))
      
      return sizeMatch && searchMatch
    })
  }, [availableCylinders, selectedCylinders, searchCylinderTerm, selectedSizeFilter])

  // Filtered requests based on search & tab
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchSearch =
        req.maintenance_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.supplier?.company_name && req.supplier.company_name.toLowerCase().includes(searchQuery.toLowerCase()))

      const isHistory = ['completed', 'cancelled'].includes(req.status)
      const tabMatch = activeTab === 'history' ? isHistory : !isHistory

      const statusMatch = statusFilter === 'all' || req.status === statusFilter

      return matchSearch && tabMatch && statusMatch
    })
  }, [requests, searchQuery, activeTab, statusFilter])

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user) return
    if (selectedCylinders.length === 0) {
      alert('Please add at least one cylinder for maintenance')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSubmitSuccess(false)

    const payload = {
      hospital_id: hospitalId,
      supplier_id: selectedSupplier || null,
      budget_source: selectedBudgetSource,
      justification: justification,
      notes: notes,
      requested_by: user.id,
      items: selectedCylinders.map(item => ({
        cylinder_id: item.cylinder.id,
        maintenance_type: item.maintenance_type,
        cost: item.cost,
        notes: item.notes
      }))
    }

    const res = await createCylinderMaintenanceRequest(payload)
    if (res.error) {
      setError(res.error)
    } else {
      setSubmitSuccess(true)
      // Reset form
      setSelectedSupplier('')
      setSelectedBudgetSource('warrant')
      setJustification('')
      setNotes('')
      setSelectedCylinders([])
      
      // Refresh requests list
      await fetchRequests()
      
      // Navigate to list tab
      setTimeout(() => {
        setActiveTab('active')
        setSubmitSuccess(false)
      }, 1500)
    }
    setIsSubmitting(false)
  }

  // Update Status in Details View
  const handleUpdateStatus = async (id: string, newStatus: any) => {
    setIsDetailsLoading(true)
    const res = await updateCylinderMaintenanceStatus(id, newStatus)
    if (res.error) {
      setDetailsError(res.error)
    } else {
      // Re-fetch details & general list
      await fetchRequestDetails(id)
      await fetchRequests()
    }
    setIsDetailsLoading(false)
  }

  // Helper formatting functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            <Clock className="w-3 h-3" /> Draft
          </span>
        )
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Dalam Semakan
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
            <CheckCircle className="w-3 h-3" /> Diluluskan
          </span>
        )
      case 'sent_to_supplier':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <Wrench className="w-3 h-3" /> Dihantar ke Pembekal
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Loader2 className="w-3 h-3 animate-spin" /> Sedang Diselenggara
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Selesai
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" /> Batal
          </span>
        )
      default:
        return <span className="text-xs text-slate-500 uppercase">{status}</span>
    }
  }

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case 'replacing_valve':
        return 'Replacing Valve'
      case 'painting':
        return 'Painting'
      case 'general_maintenance':
        return 'General Maintenance'
      case 'hydrostatic_testing':
        return 'Hydrostatic Testing'
      default:
        return 'Other Maintenance'
    }
  }

  const calculateFormTotal = () => {
    return selectedCylinders.reduce((sum, item) => sum + Number(item.cost || 0), 0)
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-[1400px] mx-auto min-h-screen bg-slate-50 text-slate-800">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#00a68a]" /> Cylinder Maintenance Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage purchase orders and request maintenance tasks like valve replacement, painting, and audits exclusive for medical cylinders.
          </p>
        </div>

        {activeTab !== 'create' && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00a68a] hover:bg-[#009278] active:scale-98 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm shadow-[#00a68a]/10"
          >
            <Plus className="w-4 h-4" /> Create Maintenance Order
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('active')
            setStatusFilter('all')
          }}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-all duration-200',
            activeTab === 'active'
              ? 'border-[#00a68a] text-[#00a68a]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          )}
        >
          Active Requests
        </button>
        <button
          onClick={() => {
            setActiveTab('history')
            setStatusFilter('all')
          }}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-all duration-200',
            activeTab === 'history'
              ? 'border-[#00a68a] text-[#00a68a]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          )}
        >
          Maintenance History
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-all duration-200',
            activeTab === 'create'
              ? 'border-[#00a68a] text-[#00a68a]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          )}
        >
          New Request Form
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab !== 'create' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search maintenance number or supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/12 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  statusFilter === 'all'
                    ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                All Status
              </button>
              {activeTab === 'active' ? (
                <>
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'draft'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending_approval')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'pending_approval'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Dalam Semakan
                  </button>
                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'approved'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setStatusFilter('sent_to_supplier')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'sent_to_supplier'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Dihantar
                  </button>
                  <button
                    onClick={() => setStatusFilter('in_progress')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'in_progress'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Diselenggara
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'completed'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      statusFilter === 'cancelled'
                        ? 'bg-[#e6f7f4] text-[#00a68a] border-[#00a68a]/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Grid/Table List */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-[#00a68a] animate-spin" />
              <span className="ml-2 text-sm text-slate-500 font-medium">Loading maintenance requests...</span>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex gap-3 items-center">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
              <Wrench className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-md font-bold text-slate-700">No requests found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-[300px]">
                No cylinder maintenance requests matched the filters or have been created yet.
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 bg-[#00a68a] text-white text-sm font-semibold rounded-xl hover:bg-[#009278] transition-all"
                >
                  Create Maintenance Request
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">No. Rujukan</th>
                      <th className="px-6 py-4">Pembekal</th>
                      <th className="px-6 py-4">Peruntukan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Tarikh Mohon</th>
                      <th className="px-6 py-4 text-right">Kos Total</th>
                      <th className="px-6 py-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {req.maintenance_no}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {req.supplier?.company_name || 'Tiada Pembekal'}
                        </td>
                        <td className="px-6 py-4 uppercase text-xs font-semibold text-slate-500">
                          {req.budget_source || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(req.requested_date).toLocaleDateString('ms-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(req.total_cost || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedRequest(req)
                              fetchRequestDetails(req.id)
                              setShowDetailsModal(true)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Papar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Create Form Tab */
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex gap-3 items-center">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex gap-3 items-center">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">Maintenance request created successfully! Redirecting...</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Main Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* General details card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  1. Butiran Am Permohonan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Pembekal Selenggaraan
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={e => setSelectedSupplier(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00a68a]"
                    >
                      <option value="">-- Sila Pilih Pembekal --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Sumber Peruntukan
                    </label>
                    <select
                      value={selectedBudgetSource}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                    >
                      <option value="warrant">Warrant (Vote: 080702 / Act: 27402) - Medical Oxygen</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Justifikasi Keperluan
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Sila nyatakan justifikasi permohonan selenggaraan ini..."
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00a68a] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Nota Tambahan (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#00a68a] resize-none"
                  />
                </div>
              </div>

              {/* Cylinders table card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    2. Senarai Silinder & Jenis Selenggaraan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCylinderPicker(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#e6f7f4] text-[#00a68a] hover:bg-[#d0f2eb] rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Silinder
                  </button>
                </div>

                {selectedCylinders.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center">
                    <Wrench className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Tiada silinder dipilih.</p>
                    <button
                      type="button"
                      onClick={() => setShowCylinderPicker(true)}
                      className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Pilih dari Inventori
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="px-4 py-3">No. Siri Silinder</th>
                          <th className="px-4 py-3">Jenis / Saiz</th>
                          <th className="px-4 py-3">Jenis Selenggaraan</th>
                          <th className="px-4 py-3 text-right">Anggaran Kos (RM)</th>
                          <th className="px-4 py-3 text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCylinders.map((item, idx) => (
                          <tr key={item.cylinder.id} className="hover:bg-slate-50/20">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">
                              {item.cylinder.serial_number}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.cylinder.type_info?.type_name || '-'} / {item.cylinder.size_info?.code || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={item.maintenance_type}
                                onChange={e => {
                                  const updated = [...selectedCylinders]
                                  updated[idx].maintenance_type = e.target.value as any
                                  setSelectedCylinders(updated)
                                }}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#00a68a]"
                              >
                                <option value="replacing_valve">Replacing Valve</option>
                                <option value="painting">Painting</option>
                                <option value="general_maintenance">General Maintenance</option>
                                <option value="hydrostatic_testing">Hydrostatic Testing</option>
                                <option value="other">Other</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.cost}
                                onChange={e => {
                                  const updated = [...selectedCylinders]
                                  updated[idx].cost = parseFloat(e.target.value) || 0
                                  setSelectedCylinders(updated)
                                }}
                                className="w-20 px-2 py-1 text-right border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#00a68a] font-mono"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = selectedCylinders.filter((_, i) => i !== idx)
                                  setSelectedCylinders(updated)
                                }}
                                className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-slate-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Summary & Action */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Ringkasan Kos
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Jumlah Silinder:</span>
                    <span className="font-semibold text-slate-800">{selectedCylinders.length} unit</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Purata Kos / Unit:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedCylinders.length > 0
                        ? formatCurrency(calculateFormTotal() / selectedCylinders.length)
                        : 'RM 0.00'}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Jumlah Anggaran:</span>
                    <span className="text-lg font-mono font-bold text-[#00a68a]">
                      {formatCurrency(calculateFormTotal())}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedCylinders.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00a68a] hover:bg-[#009278] active:scale-98 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Hantar permohonan...
                      </>
                    ) : (
                      'Hantar Ke Semakan'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all duration-200 text-center"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* Details View Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900">
                      {selectedRequest.maintenance_no}
                    </span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID Permohonan: <span className="font-mono">{selectedRequest.id}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
                {isDetailsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 text-[#00a68a] animate-spin" />
                    <span className="ml-2 text-slate-500">Loading details...</span>
                  </div>
                ) : detailsError ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex gap-3 items-center">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="font-medium">{detailsError}</p>
                  </div>
                ) : (
                  <>
                    {/* General Request Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Tarikh Dimohon
                        </span>
                        <p className="font-medium text-slate-800">
                          {new Date(selectedRequest.requested_date).toLocaleDateString('ms-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Dimohon Oleh
                        </span>
                        <p className="font-medium text-slate-800">
                          {selectedRequest.requested_by_user?.full_name || 'Sistem'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Sumber Budget
                        </span>
                        <p className="font-medium text-slate-800 uppercase">
                          {selectedRequest.budget_source || '-'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Pembekal
                        </span>
                        <p className="font-medium text-slate-800 truncate">
                          {selectedRequest.supplier?.company_name || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Justification & Notes */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Justifikasi / Catatan
                      </h4>
                      <div className="p-3 bg-white border border-slate-100 rounded-lg text-slate-600 italic">
                        {selectedRequest.justification || 'Tiada justifikasi disediakan.'}
                      </div>
                      {selectedRequest.notes && (
                        <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded border border-slate-100/50">
                          <strong>Catatan Tambahan:</strong> {selectedRequest.notes}
                        </p>
                      )}
                    </div>

                    {/* Item list */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Senarai Silinder Terlibat
                      </h4>
                      
                      <div className="overflow-hidden border border-slate-100 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                              <th className="px-4 py-3">No. Siri</th>
                              <th className="px-4 py-3">Saiz / Jenis</th>
                              <th className="px-4 py-3">Jenis Selenggaraan</th>
                              <th className="px-4 py-3 text-right">Kos Selenggara</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedRequest.items?.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-3 font-mono font-bold text-slate-900">
                                  {item.cylinder?.serial_number || 'Silinder Rujukan'}
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                   {item.cylinder?.type_info?.type_name || '-'} / {item.cylinder?.size_info?.code || '-'}
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {getMaintenanceTypeLabel(item.maintenance_type)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                                  {formatCurrency(item.cost || 0)}
                                </td>
                              </tr>
                            ))}
                            {/* Totals row */}
                            <tr className="bg-slate-50 font-bold">
                              <td colSpan={3} className="px-4 py-3 text-right text-slate-700">
                                Jumlah Keseluruhan:
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-[#00a68a] text-sm tabular-nums">
                                {formatCurrency(selectedRequest.total_cost || 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Workflow status updates action buttons */}
                    <div className="border-t border-slate-200 pt-4 flex flex-wrap gap-2 justify-end">
                      {selectedRequest.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'pending_approval')}
                            className="px-4 py-2 bg-[#00a68a] text-white hover:bg-[#009278] rounded-xl text-xs font-semibold shadow-sm transition-all"
                          >
                            Hantar Untuk Semakan
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'cancelled')}
                            className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
                          >
                            Batal Permohonan
                          </button>
                        </>
                      )}

                      {selectedRequest.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                            className="px-4 py-2 bg-[#00a68a] text-white hover:bg-[#009278] rounded-xl text-xs font-semibold shadow-sm transition-all"
                          >
                            Luluskan Permohonan
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'cancelled')}
                            className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
                          >
                            Tolak
                          </button>
                        </>
                      )}

                      {selectedRequest.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, 'sent_to_supplier')}
                          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          Hantar ke Pembekal
                        </button>
                      )}

                      {selectedRequest.status === 'sent_to_supplier' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                          className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          Mula Proses Selenggaraan
                        </button>
                      )}

                      {selectedRequest.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                          className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          Selesai & Kembalikan Silinder
                        </button>
                      )}

                      {['approved', 'sent_to_supplier', 'in_progress'].includes(selectedRequest.status) && (
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, 'cancelled')}
                          className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
                        >
                          Batal Permohonan
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Cylinders Dialog Picker */}
      <AnimatePresence>
        {showCylinderPicker && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-md">Pilih Silinder dari Inventori</h3>
                <button
                  type="button"
                  onClick={() => setShowCylinderPicker(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Picker Search */}
               <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari no. siri silinder..."
                    value={searchCylinderTerm}
                    onChange={e => setSearchCylinderTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#00a68a]"
                  />
                </div>
                <select
                  value={selectedSizeFilter}
                  onChange={e => setSelectedSizeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#00a68a] bg-white text-slate-700"
                >
                  <option value="all">Semua Saiz</option>
                  {cylinderSizes.map(size => (
                    <option key={size.id} value={size.id}>
                      {size.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Picker list */}
              <div className="overflow-y-auto flex-1 p-4">
                {isLoadingCylinders ? (
                  <div className="py-8 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#00a68a]" />
                    <span className="ml-2 text-xs text-slate-500">Loading cylinders...</span>
                  </div>
                ) : filteredAvailableCylinders.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">
                    Tiada silinder yang sedia diselenggara ditemui.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableCylinders.map(cyl => (
                      <div
                        key={cyl.id}
                        onClick={() => {
                          setSelectedCylinders([
                            ...selectedCylinders,
                            {
                              cylinder: cyl,
                              maintenance_type: 'general_maintenance',
                              cost: 0,
                              notes: ''
                            }
                          ])
                          setShowCylinderPicker(false)
                          setSearchCylinderTerm('')
                        }}
                        className="flex items-center justify-between p-3 border border-slate-200 hover:border-[#00a68a] hover:bg-[#e6f7f4]/10 rounded-xl cursor-pointer transition-all group"
                      >
                        <div>
                          <p className="font-mono font-bold text-xs text-slate-900 group-hover:text-[#00a68a]">
                            {cyl.serial_number}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {cyl.type_info?.type_name || 'Oksigen'} / {cyl.size_info?.code || '-'} (Status: {cyl.status})
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#00a68a]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default CylinderMaintenancePage
