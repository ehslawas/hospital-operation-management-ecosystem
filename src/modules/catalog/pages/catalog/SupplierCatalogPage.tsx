// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  X,
  Edit,
  Download,
  FileUp,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  FileText,
  ExternalLink,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button, Input, Select, Badge, Pagination, Modal, LoadingOverlay, Spinner } from '@/components/ui'
import { PDFUpload } from '@/components/ui/PDFUpload'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import type { Supplier, SupplierType } from '@/types/pharmacy'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  getSupplierStatistics,
  type SupplierFilter,
  type SupplierStatistics,
} from '@/services/pharmacy/procurementService'
import { cn, formatCurrency } from '@/lib/utils'

// =====================================================
// KPI CARD
// =====================================================

interface KPICardProps {
  title: string
  value: number
  color: 'primary' | 'success' | 'warning' | 'error'
  icon?: React.ReactNode
}

const KPICard: React.FC<KPICardProps> = ({ title, value, color, icon }) => {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 text-teal-700',
    success: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
    warning: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-700',
    error: 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 text-rose-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-6 ${colorClasses[color]} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold opacity-90">{title}</p>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>
      <p className="text-4xl font-bold">{value.toLocaleString()}</p>
    </motion.div>
  )
}

// =====================================================
// SUPPLIER CARD
// =====================================================

interface SupplierCardProps {
  supplier: Supplier
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick, onEdit }) => {
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'drug':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'non_drug':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-teal-100 text-teal-700 border-teal-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'inactive':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-rose-100 text-rose-700 border-rose-200'
    }
  }

  const typeLabel =
    supplier.supplier_type === 'drug'
      ? 'Drug'
      : supplier.supplier_type === 'non_drug'
      ? 'Non-Drug'
      : 'Both'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border-2 border-gray-200 p-6 cursor-pointer hover:border-teal-300 hover:shadow-xl transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-teal-600 transition-colors">
            {supplier.company_name}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onEdit(e)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant="outline"
          className={`text-xs font-semibold border-2 ${getTypeColor(supplier.supplier_type)}`}
        >
          {typeLabel}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs font-semibold border-2 ${getStatusColor(supplier.status)}`}
        >
          {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
        </Badge>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {supplier.contact_person && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{supplier.contact_person}</span>
            {supplier.contact_person_phone && (
              <span className="text-gray-500">• {supplier.contact_person_phone}</span>
            )}
          </div>
        )}
        {supplier.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{supplier.phone}</span>
          </div>
        )}
        {supplier.address && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{supplier.address}</span>
          </div>
        )}
      </div>

      {/* Documents */}
      {(supplier.account_document_url || supplier.mof_certificate_url || supplier.bumiputera_registration_certificate_url) && (
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
          {supplier.account_document_url && (
            <a
              href={supplier.account_document_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <FileText className="w-3 h-3" />
              Account Doc
            </a>
          )}
          {supplier.mof_certificate_url && (
            <a
              href={supplier.mof_certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <FileText className="w-3 h-3" />
              MOF Cert
            </a>
          )}
          {supplier.bumiputera_registration_certificate_url && (
            <a
              href={supplier.bumiputera_registration_certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <FileText className="w-3 h-3" />
              Bumi Cert
            </a>
          )}
        </div>
      )}
    </motion.div>
  )
}

// =====================================================
// SUPPLIER DETAIL MODAL
// =====================================================

interface SupplierDetailModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  onEdit: () => void
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({ isOpen, onClose, supplier, onEdit }) => {
  const { user } = useAuthStore()
  const { error: showError } = useToastStore()
  const [statistics, setStatistics] = useState<SupplierStatistics | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && supplier) {
      loadStatistics()
    } else {
      setStatistics(null)
      setSelectedYear(null)
    }
  }, [isOpen, supplier])

  const loadStatistics = async () => {
    if (!supplier) return

    setIsLoadingStats(true)
    try {
      const result = await getSupplierStatistics(supplier.id, user?.hospital_id)
      if (result.data) {
        setStatistics(result.data)
        // Set to latest year by default
        if (result.data.ordersByYear.length > 0) {
          setSelectedYear(result.data.ordersByYear[0].year)
        }
      } else if (result.error) {
        showError('Error', result.error)
      }
    } catch (error) {
      console.error('Error loading supplier statistics:', error)
      showError('Error', 'Failed to load supplier statistics')
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (!supplier) return null

  const selectedYearData = selectedYear
    ? statistics?.ordersByYear.find(y => y.year === selectedYear)
    : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supplier Details" size="full">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border-2 border-teal-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{supplier.company_name}</h2>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant="outline"
                  className={
                    supplier.supplier_type === 'drug'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : supplier.supplier_type === 'non_drug'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-teal-100 text-teal-700 border-teal-200'
                  }
                >
                  {supplier.supplier_type === 'drug'
                    ? 'Drug'
                    : supplier.supplier_type === 'non_drug'
                    ? 'Non-Drug'
                    : 'Drug & Non-Drug'}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    supplier.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : supplier.status === 'inactive'
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-rose-100 text-rose-700 border-rose-200'
                  }
                >
                  {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.contact_person && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Person in Charge</p>
                    <p className="text-sm font-medium text-gray-900">{supplier.contact_person}</p>
                    {supplier.contact_person_phone && (
                      <p className="text-xs text-gray-600 mt-1">{supplier.contact_person_phone}</p>
                    )}
                  </div>
                )}
                {supplier.email && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Email</p>
                    <a
                      href={`mailto:${supplier.email}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      {supplier.email}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {supplier.phone && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Phone</p>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                )}
                {supplier.address && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Address</p>
                    <p className="text-sm text-gray-900">{supplier.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            {(supplier.account_document_url || supplier.mof_certificate_url || supplier.bumiputera_registration_certificate_url) && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplier.account_document_url && (
                    <a
                      href={supplier.account_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-teal-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Account Document</p>
                        <p className="text-[10px] text-gray-500">Click to view PDF</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                  {supplier.mof_certificate_url && (
                    <a
                      href={supplier.mof_certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-teal-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">MOF Certificate</p>
                        <p className="text-[10px] text-gray-500">Click to view PDF</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                  {supplier.bumiputera_registration_certificate_url && (
                    <a
                      href={supplier.bumiputera_registration_certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-teal-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Bumi Certificate</p>
                        <p className="text-[10px] text-gray-500">Click to view PDF</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm overflow-hidden relative group">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-teal-600 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Order Analysis
                  </h3>
                  {!isLoadingStats && statistics && statistics.totalOrders > 0 && (
                    <div className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      Active
                    </div>
                  )}
                </div>

                {isLoadingStats ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-teal-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-teal-600 rounded-full border-t-transparent animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Calculating statistics...</p>
                  </div>
                ) : statistics ? (
                  <div className="space-y-6">
                    {/* Primary Stats */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 group/card hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Procurement</p>
                          <div className="p-2 bg-white rounded-lg border border-gray-100 text-teal-600">
                            <DollarSign className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-3xl font-black text-gray-900 tabular-nums">
                          {formatCurrency(statistics.totalValue)}
                        </p>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-900">{statistics.totalOrders}</span>
                          <span className="text-sm text-gray-500 font-medium">total orders processed</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Value</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(statistics.averageOrderValue).split('.')[0]}
                            <span className="text-xs opacity-50">.{formatCurrency(statistics.averageOrderValue).split('.')[1] || '00'}</span>
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Order</p>
                          <p className="text-sm font-bold text-gray-900">
                            {statistics.lastOrderDate 
                              ? new Date(statistics.lastOrderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Yearly Breakdown */}
                    {statistics.ordersByYear.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Annual Breakdown</p>
                          <Calendar className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                          {statistics.ordersByYear.map(yearData => (
                            <button
                              key={yearData.year}
                              onClick={() => setSelectedYear(yearData.year)}
                              className={`w-full group/year p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                selectedYear === yearData.year
                                  ? 'border-teal-600 bg-white shadow-lg shadow-teal-100'
                                  : 'border-gray-100 bg-gray-50/50 hover:border-teal-200 hover:bg-white'
                              }`}
                            >
                              <div className="relative z-10 flex items-center justify-between">
                                <div>
                                  <span className={`text-lg font-black ${selectedYear === yearData.year ? 'text-teal-600' : 'text-gray-900'}`}>
                                    {yearData.year}
                                  </span>
                                  <p className="text-xs font-bold text-gray-500 mt-0.5">
                                    {formatCurrency(yearData.totalValue)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-1 inline-block ${
                                    selectedYear === yearData.year ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {yearData.orderCount} Orders
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-400">Recorded</p>
                                </div>
                              </div>
                              {selectedYear === yearData.year && (
                                <div className="absolute top-0 right-0 w-1 h-full bg-teal-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {statistics.totalOrders === 0 && (
                      <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">No Orders Found</h4>
                        <p className="text-xs text-gray-500 px-4">There is no historical procurement data recorded for this supplier.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-100">
                    <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-rose-900">Unable to load analysis</p>
                    <p className="text-xs text-rose-600 mt-1">Please verify your connection and try again.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// =====================================================
// SUPPLIER FORM MODAL
// =====================================================

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    data: Partial<Supplier>,
    files: { accountDoc?: File | null; mofCert?: File | null; bumiCert?: File | null }
  ) => Promise<void>
  supplier?: Supplier | null
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplier,
}) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    supplier_code: '',
    company_name: '',
    contact_person: '',
    contact_person_phone: '',
    email: '',
    phone: '',
    address: '',
    registration_number: '',
    bank_account: '',
    bank_name: '',
    supplier_type: 'both',
    status: 'active',
    account_number: '',
    notes: '',
  })

  const [accountDoc, setAccountDoc] = useState<File | null>(null)
  const [mofCert, setMofCert] = useState<File | null>(null)
  const [bumiCert, setBumiCert] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplier_code: supplier.supplier_code,
        company_name: supplier.company_name,
        contact_person: supplier.contact_person,
        contact_person_phone: supplier.contact_person_phone,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        registration_number: supplier.registration_number,
        bank_account: supplier.bank_account,
        bank_name: supplier.bank_name,
        supplier_type: supplier.supplier_type || 'both',
        status: supplier.status,
        account_number: supplier.account_number,
        notes: supplier.notes,
      })
      setAccountDoc(null)
      setMofCert(null)
      setBumiCert(null)
    } else {
      setFormData({
        supplier_code: '',
        company_name: '',
        contact_person: '',
        contact_person_phone: '',
        email: '',
        phone: '',
        address: '',
        registration_number: '',
        bank_account: '',
        bank_name: '',
        supplier_type: 'both',
        status: 'active',
        account_number: '',
        notes: '',
      })
      setAccountDoc(null)
      setMofCert(null)
      setBumiCert(null)
    }
    setErrors({})
  }, [supplier, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.company_name?.trim()) {
      newErrors.company_name = 'Company name is required'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
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
    setErrors({})
    try {
      await onSave(formData, { accountDoc, mofCert, bumiCert })
      onClose()
    } catch (error) {
      console.error('Error saving supplier:', error)
      setErrors({ submit: 'Failed to save supplier. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
      size="full"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
        {errors.submit && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{errors.submit}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.company_name || ''}
                onChange={e => {
                  setFormData({ ...formData, company_name: e.target.value })
                  if (errors.company_name) setErrors({ ...errors, company_name: '' })
                }}
                required
                error={errors.company_name}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type</label>
              <Select
                value={(formData.supplier_type as SupplierType) || 'both'}
                onChange={e =>
                  setFormData({
                    ...formData,
                    supplier_type: e.target.value as SupplierType,
                  })
                }
              >
                <option value="both">Drug & Non-Drug</option>
                <option value="drug">Drug Only</option>
                <option value="non_drug">Non-Drug Only</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={formData.status || 'active'}
                onChange={e =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Supplier['status'],
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Contact & Address
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Person In Charge (PIC)</label>
              <Input
                value={formData.contact_person || ''}
                onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIC Phone</label>
              <Input
                value={formData.contact_person_phone || ''}
                onChange={e => setFormData({ ...formData, contact_person_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Phone</label>
              <Input
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) setErrors({ ...errors, email: '' })
                }}
                error={errors.email}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>


        {/* Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Supporting Documents (PDF)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PDFUpload
              label="Account Document (PDF)"
              value={accountDoc}
              onChange={setAccountDoc}
              extractFirstPageOnly={true}
              helperText="Bank letter or official document confirming account number. First page only."
              maxSize={50 * 1024 * 1024}
            />
            <PDFUpload
              label="MOF Certificate (PDF)"
              value={mofCert}
              onChange={setMofCert}
              extractFirstPageOnly={false}
              helperText="Latest MOF registration certificate for this supplier."
              maxSize={50 * 1024 * 1024}
            />
            <PDFUpload
              label="Bumi Certificate (PDF)"
              value={bumiCert}
              onChange={setBumiCert}
              extractFirstPageOnly={false}
              helperText="Bumiputera registration certificate if applicable."
              maxSize={50 * 1024 * 1024}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Spinner size="sm" /> : supplier ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// MAIN SUPPLIER CATALOG PAGE
// =====================================================

export const SupplierCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12) // Changed to 12 for grid layout
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [kpis, setKpis] = useState({ total: 0, active: 0, blacklisted: 0 })

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    loadSuppliers()
  }, [currentPage, pageSize, statusFilter, typeFilter, searchQuery])

  const loadSuppliers = async () => {
    setIsLoading(true)
    try {
      const filter: SupplierFilter = {
        search: searchQuery || undefined,
        status: (statusFilter as any) || 'all',
        supplier_type: (typeFilter as any) || 'all',
      }

      const result = await getSuppliers(user?.hospital_id, currentPage, pageSize, filter)
      
      if (result.error) {
        showError('Error Loading Suppliers', result.error)
        setSuppliers([])
        setTotal(0)
        setTotalPages(0)
        setKpis({ total: 0, active: 0, blacklisted: 0 })
        return
      }

      if (result.data) {
        setSuppliers(result.data.data)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)

        // Calculate KPIs from all suppliers (not just current page)
        // For accurate KPIs, we'd need to fetch all suppliers, but for performance we'll use current page
        const all = result.data.data
        setKpis({
          total: result.data.total,
          active: all.filter(s => s.status === 'active').length,
          blacklisted: all.filter(s => s.status === 'blacklisted').length,
        })
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load suppliers'
      showError('Error', errorMessage)
      setSuppliers([])
      setTotal(0)
      setTotalPages(0)
      setKpis({ total: 0, active: 0, blacklisted: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSupplier = async (
    data: Partial<Supplier>,
    files: { accountDoc?: File | null; mofCert?: File | null; bumiCert?: File | null }
  ) => {
    try {
      // Validate required fields
      if (!data.company_name?.trim()) {
        showError('Validation Error', 'Company name is required')
        return
      }

      let result
      if (selectedSupplier) {
        result = await updateSupplier(selectedSupplier.id, data)
      } else {
        result = await createSupplier(user?.hospital_id || null, data)
      }

      if (result.error || !result.data) {
        showError('Error', result.error || 'Failed to save supplier')
        return
      }

      const saved = result.data

      // Upload PDFs to Supabase Storage if configured
      if (isSupabaseConfigured()) {
        const bucket = supabase.storage.from('supplier-docs')
        const updates: Partial<Supplier> = {}

        try {
          if (files.accountDoc) {
            const path = `${user?.hospital_id || 'global'}/${saved.id}/account-${Date.now()}-${files.accountDoc.name}`
            const { error: uploadError, data: uploadData } = await bucket.upload(path, files.accountDoc, {
              upsert: true,
            })
            
            if (uploadError) {
              console.error('Error uploading account document:', uploadError)
              showError('Upload Error', `Failed to upload account number document: ${uploadError.message}`)
            } else {
              const { data: publicUrl } = bucket.getPublicUrl(path)
              updates.account_document_url = publicUrl.publicUrl
            }
          }

            if (files.mofCert) {
              const path = `${user?.hospital_id || 'global'}/${saved.id}/mof-${Date.now()}-${files.mofCert.name}`
              const { error: uploadError } = await bucket.upload(path, files.mofCert, { upsert: true })
              
              if (uploadError) {
                console.error('Error uploading MOF certificate:', uploadError)
                showError('Upload Error', `Failed to upload MOF certificate: ${uploadError.message}`)
              } else {
                const { data: publicUrl } = bucket.getPublicUrl(path)
                updates.mof_certificate_url = publicUrl.publicUrl
              }
            }

            if (files.bumiCert) {
              const path = `${user?.hospital_id || 'global'}/${saved.id}/bumi-${Date.now()}-${files.bumiCert.name}`
              const { error: uploadError } = await bucket.upload(path, files.bumiCert, { upsert: true })
              
              if (uploadError) {
                console.error('Error uploading Bumiputera certificate:', uploadError)
                showError('Upload Error', `Failed to upload Bumiputera certificate: ${uploadError.message}`)
              } else {
                const { data: publicUrl } = bucket.getPublicUrl(path)
                updates.bumiputera_registration_certificate_url = publicUrl.publicUrl
              }
            }

          // Update supplier with document URLs if any were uploaded
          if (Object.keys(updates).length > 0) {
            const updateResult = await updateSupplier(saved.id, updates)
            if (updateResult.error) {
              console.error('Error updating supplier with document URLs:', updateResult.error)
              showError('Warning', 'Supplier saved but document URLs could not be updated')
            }
          }
        } catch (uploadError) {
          console.error('Error during file upload:', uploadError)
          showError('Upload Error', 'An error occurred while uploading documents')
        }
      }

      showSuccess('Success', selectedSupplier ? 'Supplier updated successfully' : 'Supplier created successfully')
      setSelectedSupplier(null)
      setShowAddModal(false)
      setShowEditModal(false)
      await loadSuppliers()
    } catch (error) {
      console.error('Error saving supplier:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save supplier'
      showError('Error', errorMessage)
    }
  }

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowDetailModal(true)
  }

  const handleEditClick = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setShowEditModal(true)
  }

  const hasActiveFilters = searchQuery || statusFilter || typeFilter

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
          <span className="text-slate-800 font-extrabold tracking-wide">Supplier Catalog</span>
        </nav>

        {/* Gradient Header Monument */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:rotate-2 transition-transform duration-300">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
                Supplier Catalog
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Registry of Verified Pharmaceutical & Medical Equipment Vendors
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setSelectedSupplier(null)
                setShowAddModal(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-xs font-bold uppercase tracking-wider hover:from-slate-800 hover:to-indigo-900 transition-all shadow-md shadow-slate-900/10 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Elevated Dashboard KPI Metrics Section wrapped in a luxurious white background card */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl mb-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Suppliers */}
            <div className="bg-blue-50/50 border-2 border-blue-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-blue-50 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900/60 uppercase tracking-widest">Total Registered</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{kpis.total}</h3>
                  <p className="text-xs font-bold text-blue-600 mt-2">Total verified vendors</p>
                </div>
              </div>
            </div>

            {/* Active Suppliers */}
            <div className="bg-emerald-50/50 border-2 border-emerald-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900/60 uppercase tracking-widest">Active Vendors</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{kpis.active}</h3>
                  <p className="text-xs font-bold text-emerald-600 mt-2">Eligible for purchase orders</p>
                </div>
              </div>
            </div>

            {/* Blacklisted Suppliers */}
            <div className="bg-rose-50/50 border-2 border-rose-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:bg-rose-50 hover:border-rose-200 hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-rose-100 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-rose-900/60 uppercase tracking-widest">Blacklisted Vendors</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-rose-950 mt-1">{kpis.blacklisted}</h3>
                  <p className="text-xs font-bold text-rose-600 mt-2">Restricted from transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 shadow-xl relative z-20 space-y-6">
          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by supplier name, code or PIC..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1)
                      loadSuppliers()
                    }
                  }}
                  className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setCurrentPage(1)
                  loadSuppliers()
                }}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Select
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">All Types</option>
                <option value="drug">Drug Only</option>
                <option value="non_drug">Non-Drug Only</option>
                <option value="both">Drug & Non-Drug</option>
              </Select>

              <Select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </Select>

              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('')
                  setTypeFilter('')
                  setCurrentPage(1)
                }}
                disabled={!hasActiveFilters}
                className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 md:col-span-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Grid or Empty state */}
          {isLoading ? (
            <LoadingOverlay />
          ) : suppliers.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No suppliers found</h3>
              <p className="text-slate-600 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by adding your first supplier'}
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedSupplier(null)
                    setShowAddModal(true)
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Supplier
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {suppliers.map(supplier => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onClick={() => handleSupplierClick(supplier)}
                    onEdit={e => handleEditClick(supplier, e)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
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
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <SupplierFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedSupplier(null)
        }}
        onSave={handleSaveSupplier}
      />

      <SupplierFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedSupplier(null)
        }}
        onSave={handleSaveSupplier}
        supplier={selectedSupplier || undefined}
      />

      <SupplierDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedSupplier(null)
        }}
        supplier={selectedSupplier}
        onEdit={() => {
          setShowDetailModal(false)
          setShowEditModal(true)
        }}
      />
    </div>
  )
}

export default SupplierCatalogPage
