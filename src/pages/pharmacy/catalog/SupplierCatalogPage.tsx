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
  FileText,
  ExternalLink,
  AlertCircle,
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
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
            {supplier.company_name}
          </h3>
          <p className="text-xs text-gray-500 font-mono">{supplier.supplier_code}</p>
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
      {(supplier.account_document_url || supplier.mof_certificate_url) && (
        <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{supplier.company_name}</h2>
                  <p className="text-sm text-gray-600 font-mono">{supplier.supplier_code}</p>
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

            {/* Registration & Bank Details */}
            {(supplier.registration_number || supplier.bank_name || supplier.account_number) && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Registration & Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplier.registration_number && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Registration Number</p>
                      <p className="text-sm text-gray-900">{supplier.registration_number}</p>
                    </div>
                  )}
                  {supplier.bank_name && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Bank Name</p>
                      <p className="text-sm text-gray-900">{supplier.bank_name}</p>
                    </div>
                  )}
                  {supplier.account_number && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Account Number</p>
                      <p className="text-sm text-gray-900 font-mono">{supplier.account_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {(supplier.account_document_url || supplier.mof_certificate_url) && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplier.account_document_url && (
                    <a
                      href={supplier.account_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-teal-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Account Document</p>
                        <p className="text-xs text-gray-500">Click to view PDF</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
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
                        <p className="font-semibold text-gray-900">MOF Certificate</p>
                        <p className="text-xs text-gray-500">Click to view PDF</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Order Statistics
              </h3>

              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : statistics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        RM {statistics.totalValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {statistics.averageOrderValue > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Average Order Value</p>
                      <p className="text-xl font-bold text-gray-900">
                        RM {statistics.averageOrderValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}

                  {statistics.lastOrderDate && (
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Last Order</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(statistics.lastOrderDate).toLocaleDateString('en-MY', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {statistics.ordersByYear.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-3">Orders by Year</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {statistics.ordersByYear.map(yearData => (
                          <button
                            key={yearData.year}
                            onClick={() => setSelectedYear(yearData.year)}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                              selectedYear === yearData.year
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-gray-900">{yearData.year}</span>
                              <span className="text-sm font-semibold text-blue-600">
                                {yearData.orderCount} orders
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              RM {yearData.totalValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {statistics.totalOrders === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No orders yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Unable to load statistics</p>
                </div>
              )}
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
  onSave: (data: Partial<Supplier>, files: { accountDoc?: File | null; mofCert?: File | null }) => Promise<void>
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
    }
    setErrors({})
  }, [supplier, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplier_code?.trim()) {
      newErrors.supplier_code = 'Supplier code is required'
    }
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
      await onSave(formData, { accountDoc, mofCert })
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
                Supplier Code <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.supplier_code || ''}
                onChange={e => {
                  setFormData({ ...formData, supplier_code: e.target.value })
                  if (errors.supplier_code) setErrors({ ...errors, supplier_code: '' })
                }}
                required
                error={errors.supplier_code}
              />
            </div>
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

        {/* Registration & Bank */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Registration & Bank Details
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Registration No.</label>
              <Input
                value={formData.registration_number || ''}
                onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <Input
                value={formData.bank_name || ''}
                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No.</label>
              <Input
                value={formData.bank_account || ''}
                onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (Display)</label>
              <Input
                value={formData.account_number || ''}
                onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="e.g. 8600-XXXXXX-01"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Input
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Supporting Documents (PDF)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PDFUpload
              label="Supplier Account Number Document (PDF)"
              value={accountDoc}
              onChange={setAccountDoc}
              extractFirstPageOnly={true}
              helperText="Upload bank letter or official document confirming supplier account number. Only the first page will be saved."
              maxSize={50 * 1024 * 1024} // 50MB
            />
            <PDFUpload
              label="MOF Certificate (PDF)"
              value={mofCert}
              onChange={setMofCert}
              extractFirstPageOnly={false}
              helperText="Upload latest MOF registration certificate for this supplier. All pages will be saved."
              maxSize={50 * 1024 * 1024} // 50MB
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
    files: { accountDoc?: File | null; mofCert?: File | null }
  ) => {
    try {
      // Validate required fields
      if (!data.supplier_code?.trim()) {
        showError('Validation Error', 'Supplier code is required')
        return
      }
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
    <div className="space-y-6 p-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Suppliers"
          value={kpis.total}
          color="primary"
          icon={<Building2 className="w-6 h-6" />}
        />
        <KPICard
          title="Active"
          value={kpis.active}
          color="success"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <KPICard
          title="Blacklisted"
          value={kpis.blacklisted}
          color="error"
          icon={<AlertCircle className="w-6 h-6" />}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => {
              setCurrentPage(1)
              loadSuppliers()
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Select
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
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
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blacklisted">Blacklisted</option>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('')
              setTypeFilter('')
              setCurrentPage(1)
            }}
            disabled={!hasActiveFilters}
            className="md:col-span-2"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Supplier Catalog</h2>
        <Button
          onClick={() => {
            setSelectedSupplier(null)
            setShowAddModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingOverlay />
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'Get started by adding your first supplier'}
          </p>
          {!hasActiveFilters && (
            <Button
              onClick={() => {
                setSelectedSupplier(null)
                setShowAddModal(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
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
