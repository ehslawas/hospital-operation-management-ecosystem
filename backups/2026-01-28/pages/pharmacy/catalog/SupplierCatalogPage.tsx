import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  FileText,
  ExternalLink,
  AlertCircle,
  Truck,
  CheckCircle,
  XCircle,
  TrendingUp,
  ShoppingCart,
  Filter
} from 'lucide-react'
import { supabase } from '@/services/supabase'
import { Button, Input, Select, Badge, Pagination, Modal, Spinner } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { PDFUpload } from '@/components/ui/PDFUpload'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import type { Supplier, SupplierType } from '@/types/pharmacy'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  getSupplierStatistics,
  type SupplierFilter,
  type SupplierStatistics,
} from '@/services/pharmacy/procurementService'

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
      case 'drug': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'non_drug': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-teal-50 text-teal-700 border-teal-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'inactive': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-rose-50 text-rose-700 border-rose-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-5 cursor-pointer group hover:shadow-lg transition-all duration-300 border border-white/60"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
            {supplier.company_name}
          </h3>
          <p className="text-xs text-slate-500 font-mono">{supplier.supplier_code}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); onEdit(e) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className={`text-xs font-semibold ${getTypeColor(supplier.supplier_type)}`}>
          {supplier.supplier_type === 'drug' ? 'Drug' : supplier.supplier_type === 'non_drug' ? 'Non-Drug' : 'Both'}
        </Badge>
        <Badge variant="outline" className={`text-xs font-semibold ${getStatusColor(supplier.status)}`}>
          {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {supplier.contact_person && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{supplier.contact_person}</span>
            {supplier.contact_person_phone && <span className="text-slate-400">• {supplier.contact_person_phone}</span>}
          </div>
        )}
        {supplier.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{supplier.phone}</span>
          </div>
        )}
      </div>

      {(supplier.account_document_url || supplier.mof_certificate_url || supplier.bumiputera_registration_certificate_url) && (
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
          {/* Document Icons */}
          {supplier.account_document_url && <a href={supplier.account_document_url} target="_blank" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600" title="Account Doc"><FileText className="w-4 h-4" /></a>}
          {supplier.mof_certificate_url && <a href={supplier.mof_certificate_url} target="_blank" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600" title="MOF Cert"><FileText className="w-4 h-4" /></a>}
          {supplier.bumiputera_registration_certificate_url && <a href={supplier.bumiputera_registration_certificate_url} target="_blank" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600" title="Bumi Cert"><FileText className="w-4 h-4" /></a>}
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
        if (result.data.ordersByYear.length > 0) setSelectedYear(result.data.ordersByYear[0].year)
      }
    } catch (error) { console.error(error) } finally { setIsLoadingStats(false) }
  }

  if (!supplier) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supplier Details" size="full">
      <div className="space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto px-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">{supplier.company_name}</h2>
                  <p className="text-sm text-slate-500 font-mono">{supplier.supplier_code}</p>
                </div>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{supplier.supplier_type === 'drug' ? 'Drug' : supplier.supplier_type === 'non_drug' ? 'Non-Drug' : 'Drug & Non-Drug'}</Badge>
                <Badge variant="outline" className={supplier.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}>{supplier.status}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Contact Person</p>
                    <p className="font-medium text-slate-800">{supplier.contact_person || '—'}</p>
                    <p className="text-sm text-slate-500">{supplier.contact_person_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Email</p>
                    <p className="font-medium text-blue-600">{supplier.email || '—'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Phone</p>
                    <p className="font-medium text-slate-800">{supplier.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Address</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{supplier.address || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {(supplier.registration_number || supplier.bank_name || supplier.account_number) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Registration & Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplier.registration_number && <div><p className="text-xs font-semibold text-slate-500 mb-1">Registration No.</p><p className="text-sm font-medium">{supplier.registration_number}</p></div>}
                  {supplier.bank_name && <div><p className="text-xs font-semibold text-slate-500 mb-1">Bank Name</p><p className="text-sm font-medium">{supplier.bank_name}</p></div>}
                  {supplier.account_number && <div><p className="text-xs font-semibold text-slate-500 mb-1">Account No.</p><p className="text-sm font-medium font-mono">{supplier.account_number}</p></div>}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.account_document_url ? (
                  <a href={supplier.account_document_url} target="_blank" className="flex items-center p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                    <FileText className="w-8 h-8 text-blue-500 mr-3" />
                    <div><p className="font-medium text-slate-700">Account Document</p><p className="text-xs text-slate-400">View PDF</p></div>
                  </a>
                ) : <div className="p-3 border rounded-xl border-dashed text-slate-400 flex items-center justify-center">No Account Doc</div>}

                {supplier.mof_certificate_url ? (
                  <a href={supplier.mof_certificate_url} target="_blank" className="flex items-center p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                    <FileText className="w-8 h-8 text-emerald-500 mr-3" />
                    <div><p className="font-medium text-slate-700">MOF Certificate</p><p className="text-xs text-slate-400">View PDF</p></div>
                  </a>
                ) : <div className="p-3 border rounded-xl border-dashed text-slate-400 flex items-center justify-center">No MOF Cert</div>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Order Statistics</h3>
              {isLoadingStats ? <Spinner /> : statistics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-slate-800">{statistics.totalOrders}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Total Value</p>
                      <p className="text-lg font-bold text-slate-800">RM {(statistics.totalValue / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                  {statistics.ordersByYear.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                      <p className="text-sm font-semibold mb-3">Recent Activity</p>
                      <div className="space-y-2">
                        {statistics.ordersByYear.slice(0, 3).map(y => (
                          <div key={y.year} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                            <span className="text-slate-600">{y.year}</span>
                            <span className="font-medium">{y.orderCount} orders</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <div className="text-center text-slate-400 py-4">No data available</div>}
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
  onSave: (data: Partial<Supplier>, files: { accountDoc?: File | null; mofCert?: File | null; bumiputeraCert?: File | null }) => Promise<void>
  supplier?: Supplier | null
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, onSave, supplier }) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({})
  const [accountDoc, setAccountDoc] = useState<File | null>(null)
  const [mofCert, setMofCert] = useState<File | null>(null)
  const [bumiputeraCert, setBumiputeraCert] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplier_code: supplier.supplier_code || '',
        company_name: supplier.company_name || '',
        contact_person: supplier.contact_person || '',
        contact_person_phone: supplier.contact_person_phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        status: supplier.status || 'active',
        supplier_type: supplier.supplier_type || 'both'
      })
    } else {
      setFormData({
        supplier_code: '',
        company_name: '',
        contact_person: '',
        contact_person_phone: '',
        email: '',
        address: '',
        status: 'active',
        supplier_type: 'both'
      })
    }
    setErrors({})
    setAccountDoc(null); setMofCert(null); setBumiputeraCert(null);
  }, [supplier, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.company_name) { setErrors({ company_name: 'Required' }); return; }
    setIsSaving(true)
    try {
      await onSave(formData, { accountDoc, mofCert, bumiputeraCert })
      onClose()
    } catch (e) { console.error(e) } finally { setIsSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier ? 'Edit Supplier' : 'Add New Supplier'} size="full">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto pr-2 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-700">Code</label><Input value={formData.supplier_code} onChange={e => setFormData({ ...formData, supplier_code: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-slate-700">Company Name *</label><Input value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} error={errors.company_name} /></div>
              <div>
                <label className="text-sm font-medium text-slate-700">Type</label>
                <Select value={formData.supplier_type || 'both'} onChange={e => setFormData({ ...formData, supplier_type: e.target.value as any })}><option value="both">Both</option><option value="drug">Drug</option><option value="non_drug">Non-Drug</option></Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value as any })}><option value="active">Active</option><option value="inactive">Inactive</option></Select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-700">PIC</label><Input value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-slate-700">PIC Phone</label><Input value={formData.contact_person_phone} onChange={e => setFormData({ ...formData, contact_person_phone: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-slate-700">Email</label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-slate-700">Address</label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold text-slate-800 mb-4">Documents Upload</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PDFUpload
              label="Account Doc"
              value={accountDoc}
              onChange={setAccountDoc}
              previewUrl={supplier?.account_document_url}
            />
            <PDFUpload
              label="MOF Cert"
              value={mofCert}
              onChange={setMofCert}
              previewUrl={supplier?.mof_certificate_url}
            />
            <PDFUpload
              label="Bumi Cert"
              value={bumiputeraCert}
              onChange={setBumiputeraCert}
              previewUrl={supplier?.bumiputera_registration_certificate_url}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>{isSaving ? <Spinner size="sm" /> : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// =====================================================
// MAIN PAGE
// =====================================================

export const SupplierCatalogPage: React.FC = () => {
  const { user } = useAuthStore()
  const isSessionReady = useIsSessionReady()
  const { success: showSuccess, error: showError } = useToastStore()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    if (isSessionReady && user?.hospital_id) {
      loadSuppliers()
    }
  }, [isSessionReady, user?.hospital_id, page, pageSize, search, typeFilter, statusFilter])

  const loadSuppliers = async () => {
    setIsLoading(true)
    try {
      const filter: SupplierFilter = { search: search || undefined, supplier_type: typeFilter as any || undefined, status: statusFilter as any || undefined }
      const res = await getSuppliers(user?.hospital_id, page, pageSize, filter)
      if (res.data) {
        setSuppliers(res.data.data)
        setTotal(res.data.total)
      }
    } finally { setIsLoading(false) }
  }

  const handleSave = async (data: Partial<Supplier>, files: { accountDoc?: File | null; mofCert?: File | null; bumiputeraCert?: File | null }) => {
    setIsLoading(true)
    try {
      console.log('handleSave called with data:', data)
      console.log('files:', files)

      // 1. Initial save/update to get/ensure supplier ID
      let result
      let supplierId = selectedSupplier?.id

      if (selectedSupplier) {
        console.log('Updating basic info for supplier:', selectedSupplier.id)
        result = await updateSupplier(selectedSupplier.id, data)
      } else {
        console.log('Creating new supplier with hospitalId:', user?.hospital_id || null)
        result = await createSupplier(user?.hospital_id || null, data)
        if (result.data) supplierId = result.data.id
      }

      if (result.error || !supplierId) {
        throw new Error(result.error || 'Failed to initialize supplier record')
      }

      // 2. Handle File Uploads if any
      const uploadPromises = []
      const fileUpdates: Partial<Supplier> = {}

      const uploadFile = async (file: File, type: string, fieldName: keyof Supplier) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${type}_${Date.now()}.${fileExt}`
        const filePath = `pharmacy/suppliers/${supplierId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)

        fileUpdates[fieldName as any] = publicUrl
      }

      if (files.accountDoc) uploadPromises.push(uploadFile(files.accountDoc, 'account_doc', 'account_document_url'))
      if (files.mofCert) uploadPromises.push(uploadFile(files.mofCert, 'mof_cert', 'mof_certificate_url'))
      if (files.bumiputeraCert) uploadPromises.push(uploadFile(files.bumiputeraCert, 'bumi_cert', 'bumiputera_registration_certificate_url'))

      if (uploadPromises.length > 0) {
        console.log('Uploading files...', uploadPromises.length)
        await Promise.all(uploadPromises)

        // 3. Update supplier with document URLs
        console.log('Updating supplier with document URLs:', fileUpdates)
        const updateResult = await updateSupplier(supplierId, fileUpdates)
        if (updateResult.error) throw new Error(updateResult.error)
      }

      console.log('Save successful!')
      showSuccess('Success', 'Supplier saved successfully')
      loadSuppliers()
      setShowAddModal(false)
      setShowEditModal(false)
    } catch (e: any) {
      console.error('Save failed:', e)
      showError('Error', e.message || 'Failed to save supplier')
      throw e
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <FinancialPageLayout
      title="Supplier Catalog"
      description="Manage your supplier database and documents."
      icon={Truck}
      breadcrumbs={[{ label: 'Catalogs', href: '#' }, { label: 'Suppliers' }]}
      actions={
        <Button onClick={() => { setSelectedSupplier(null); setShowAddModal(true) }} className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md">
          <Plus className="w-4 h-4 mr-2" /> New Supplier
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><Truck className="w-5 h-5 text-blue-50" /></div>
                <span className="text-sm font-medium text-blue-50">Total Suppliers</span>
              </div>
              <p className="text-3xl font-bold">{total}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-50" /></div>
                <span className="text-sm font-medium text-emerald-50">Active</span>
              </div>
              <p className="text-3xl font-bold">{suppliers.filter(s => s.status === 'active').length}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><XCircle className="w-5 h-5 text-amber-50" /></div>
                <span className="text-sm font-medium text-amber-50">Inactive</span>
              </div>
              <p className="text-3xl font-bold">{suppliers.filter(s => s.status === 'inactive').length}</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4 flex flex-col lg:flex-row gap-4 border border-white/40 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 h-10 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all" />
          </div>
          <div className="flex gap-3">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-10 px-3 bg-slate-50 border-transparent rounded-lg text-sm text-slate-600 focus:bg-white outline-none">
              <option value="">All Types</option>
              <option value="drug">Drug</option>
              <option value="non_drug">Non-Drug</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 bg-slate-50 border-transparent rounded-lg text-sm text-slate-600 focus:bg-white outline-none">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(s => (
              <SupplierCard
                key={s.id}
                supplier={s}
                onClick={() => { setSelectedSupplier(s); setShowDetailModal(true) }}
                onEdit={() => { setSelectedSupplier(s); setShowEditModal(true) }}
              />
            ))}
          </div>
        )}

        {total > pageSize && (
          <Pagination currentPage={page} totalPages={Math.ceil(total / pageSize)} onPageChange={setPage} total={total} pageSize={pageSize} onPageSizeChange={setPageSize} />
        )}
      </div>

      <SupplierDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        supplier={selectedSupplier}
        onEdit={() => { setShowDetailModal(false); setShowEditModal(true) }}
      />
      <SupplierFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSave}
      />
      <SupplierFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        supplier={selectedSupplier}
      />
    </FinancialPageLayout>
  )
}

export default SupplierCatalogPage
