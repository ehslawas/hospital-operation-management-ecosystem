import React, { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Download, FileUp, Edit, Trash2, Package, TestTube2, CheckCircle, XCircle } from 'lucide-react'
import { Button, Input, Select, Badge, Table, TableHeader, TableRow, TableCell, TableBody, Pagination, Modal, Spinner, ConfirmationDialog } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import {
    getReagentCatalogKPIs,
    getReagentCatalog,
    createReagent,
    updateReagent,
    deleteReagent,
    exportReagentCatalog,
    batchImportReagents,
    type ReagentCatalogFilter,
} from '@/services/pharmacy/reagentCatalogService'
import { getNonDrugCategories } from '@/services/pharmacy/inventoryService'
import { getSuppliers } from '@/services/pharmacy/procurementService'
import type { NonDrugWithRelations, NonDrugCategory, Supplier } from '@/types/pharmacy'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

const ExcelImport = lazy(() => import('@/components/pharmacy/ExcelImport'))

// Reusing the modal from NonDrugCatalogPage but we can inline it or import if it was exported. 
// Since it wasn't exported, I'll redefine a simplified version here suited for Reagents.

interface ReagentFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Partial<NonDrugWithRelations>) => Promise<void>
    item?: NonDrugWithRelations | null
    categories: NonDrugCategory[]
    suppliers: Supplier[]
}

const ReagentFormModal: React.FC<ReagentFormModalProps> = ({ isOpen, onClose, onSave, item, categories, suppliers }) => {
    const [formData, setFormData] = useState<Partial<NonDrugWithRelations>>({})
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (item) {
            setFormData({
                item_code: item.item_code || '',
                item_name: item.item_name || '',
                packaging_description: item.packaging_description || '',
                price: item.price || 0,
                notes: item.notes || '',
                status: (item.status as 'active' | 'inactive') || 'active',
                category_id: item.category_id || '',
                supplier_id: item.supplier_id || '',
                procurement_vote: (item.procurement_vote as any) || '',
            })
        } else {
            setFormData({
                item_code: '',
                item_name: '',
                packaging_description: '',
                price: 0,
                notes: '',
                status: 'active',
                category_id: '',
                supplier_id: '',
                procurement_vote: undefined,
            })
        }
    }, [item, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Reagent' : 'Add New Reagent'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Reagent Code</label>
                        <Input value={formData.item_code || ''} onChange={e => setFormData({ ...formData, item_code: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Reagent Name</label>
                        <Input value={formData.item_name || ''} onChange={e => setFormData({ ...formData, item_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Category</label>
                        <Select value={formData.category_id || ''} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Supplier</label>
                        <Select value={formData.supplier_id || ''} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Procurement Vote</label>
                        <Select value={formData.procurement_vote || ''} onChange={e => setFormData({ ...formData, procurement_vote: e.target.value as any })}>
                            <option value="">Select Vote</option>
                            <option value="appl">APPL</option>
                            <option value="cc">CC</option>
                            <option value="dp">DP</option>
                            <option value="lp">LP</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Price (RM)</label>
                        <Input type="number" step="0.01" value={formData.price || 0} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    )
}

export const ReagentsCatalogPage: React.FC = () => {
    const { user } = useAuthStore()
    const isSessionReady = useIsSessionReady()
    const { success: showSuccess, error: showError } = useToastStore()

    const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0 })
    const [items, setItems] = useState<NonDrugWithRelations[]>([])
    const [categories, setCategories] = useState<NonDrugCategory[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Pagination & Filters
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [supplierFilter, setSupplierFilter] = useState('')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<NonDrugWithRelations | null>(null)

    useEffect(() => {
        if (isSessionReady && user?.hospital_id) {
            loadData()
            loadMetadata()
        }
    }, [isSessionReady, user?.hospital_id, page, pageSize, search, categoryFilter, supplierFilter])

    const loadMetadata = async () => {
        const cats = await getNonDrugCategories()
        if (cats.data) setCategories(cats.data)

        const sups = await getSuppliers(undefined, 1, 1000)
        if (sups.data?.data) setSuppliers(sups.data.data)

        if (user?.hospital_id) {
            const stats = await getReagentCatalogKPIs(user.hospital_id)
            if (stats.data) setKpis(stats.data)
        }
    }

    const loadData = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)
        try {
            const filter: ReagentCatalogFilter = {
                search: search || undefined,
                category_id: categoryFilter || undefined,
                supplier_id: supplierFilter || undefined
            }
            const res = await getReagentCatalog(user.hospital_id, filter, page, pageSize)
            if (res.data) {
                setItems(res.data.data)
                setTotal(res.data.total)
                setTotalPages(res.data.totalPages)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async (data: Partial<NonDrugWithRelations>) => {
        if (!user?.hospital_id) return
        try {
            if (selectedItem) {
                await updateReagent(selectedItem.id, data)
                showSuccess('Updated', 'Reagent updated successfully')
            } else {
                await createReagent(user.hospital_id, user.id || '', data)
                showSuccess('Created', 'Reagent created successfully')
            }
            loadData()
            setShowAddModal(false)
            setShowEditModal(false)
        } catch (e) {
            showError('Error', 'Failed to save reagent')
        }
    }

    const handleDelete = async () => {
        if (!selectedItem) return
        await deleteReagent(selectedItem.id)
        showSuccess('Deleted', 'Reagent deleted successfully')
        setShowDeleteModal(false)
        loadData()
    }

    const handleImport = async (data: any[]) => {
        if (!user?.hospital_id || !user?.id) return { success: 0, errors: ['User context missing'] }
        const res = await batchImportReagents(user.hospital_id, user.id, data)
        if (res.data) {
            showSuccess('Imported', `Successfully imported ${res.data.success} items`)
            loadData()
            return res.data
        }
        return { success: 0, errors: ['Import failed'] }
    }

    const headerActions = (
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowImportModal(true)} className="bg-white/50 backdrop-blur-sm text-blue-700 border-blue-200">
                <FileUp className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button variant="outline" onClick={() => exportReagentCatalog(user?.hospital_id || '')} className="bg-white/50 backdrop-blur-sm text-emerald-700 border-emerald-200">
                <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={() => { setSelectedItem(null); setShowAddModal(true) }} className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md">
                <Plus className="w-4 h-4 mr-2" /> New Reagent
            </Button>
        </div>
    )

    return (
        <FinancialPageLayout
            title="Reagents Catalog"
            description="Manage laboratory reagents and testing supplies."
            icon={TestTube2}
            breadcrumbs={[{ label: 'Catalogs', href: '#' }, { label: 'Reagents' }]}
            actions={headerActions}
        >
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg"><Package className="w-5 h-5 text-blue-50" /></div>
                                <span className="text-sm font-medium text-blue-50">Total Reagents</span>
                            </div>
                            <p className="text-3xl font-bold">{kpis.total}</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-50" /></div>
                                <span className="text-sm font-medium text-emerald-50">Active Items</span>
                            </div>
                            <p className="text-3xl font-bold">{kpis.active}</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg"><XCircle className="w-5 h-5 text-amber-50" /></div>
                                <span className="text-sm font-medium text-amber-50">Inactive Items</span>
                            </div>
                            <p className="text-3xl font-bold">{kpis.inactive}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="glass-card rounded-xl p-4 flex flex-col lg:flex-row gap-4 border border-white/40 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search reagents..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 h-10 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-10 px-3 bg-slate-50 border-transparent rounded-lg text-sm text-slate-600 focus:bg-white outline-none">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                        </select>
                        <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="h-10 px-3 bg-slate-50 border-transparent rounded-lg text-sm text-slate-600 focus:bg-white outline-none">
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableCell as="th" className="font-semibold text-slate-600">Reagent Code</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 w-[30%]">Reagent Name</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Category</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Supplier</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-center">Vote</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-right">Price</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-center">Status</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-right">Actions</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10"><Spinner size="lg" /></TableCell></TableRow>
                            ) : items.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-500">No reagents found</TableCell></TableRow>
                            ) : (
                                items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-700">{item.item_code}</TableCell>
                                        <TableCell className="text-slate-600">{item.item_name}</TableCell>
                                        <TableCell><Badge variant="primary" className="bg-slate-50 text-slate-600">{item.category?.category_name || '—'}</Badge></TableCell>
                                        <TableCell className="text-slate-600 text-sm">{item.supplier?.company_name || '—'}</TableCell>
                                        <TableCell className="text-center"><span className="uppercase text-xs font-bold text-slate-500">{item.procurement_vote || '—'}</span></TableCell>
                                        <TableCell className="text-right font-mono text-slate-700">{formatCurrency(item.price || 0)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={item.status === 'active' ? 'success' : 'gray'}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowEditModal(true) }}>
                                                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setShowDeleteModal(true) }}>
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {totalPages > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} onPageSizeChange={setPageSize} className="border-t border-slate-100 p-4" />}
                </div>
            </div>

            {/* Dialogs */}
            <ReagentFormModal
                isOpen={showAddModal || showEditModal}
                onClose={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setSelectedItem(null)
                }}
                onSave={handleSave}
                item={selectedItem}
                categories={categories}
                suppliers={suppliers}
            />
            <ConfirmationDialog
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Reagent"
                message={`Are you sure you want to delete ${selectedItem?.item_name}?`}
                variant="danger"
            />
            {showImportModal && (
                <Suspense fallback={<Spinner />}>
                    <ExcelImport
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onImport={handleImport}
                        catalogType="non_drug"
                        targetFields={[
                            { key: 'item_code', label: 'Item Code', required: true, type: 'string' as const },
                            { key: 'item_name', label: 'Item Name', required: true, type: 'string' as const },
                            { key: 'packaging_description', label: 'Packaging Description', required: false, type: 'string' as const },
                            { key: 'price', label: 'Price (RM)', required: false, type: 'number' as const },
                            { key: 'notes', label: 'Notes', required: false, type: 'string' as const },
                        ]}
                    />
                </Suspense>
            )}
        </FinancialPageLayout>
    )
}

export default ReagentsCatalogPage
