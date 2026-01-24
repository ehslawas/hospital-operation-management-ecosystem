import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Download, Edit, Trash2, FileUp, Package, CheckCircle2, XCircle } from 'lucide-react'
import { Button, Input, Select, Badge, Table, Pagination, Modal, Spinner, ConfirmationDialog, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { useToast } from '@/stores/toastStore'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import {
    getLpDrugCatalogKPIs,
    getLpDrugCatalog,
    createLpDrug,
    updateLpDrug,
    deleteLpDrug,
    exportLpDrugCatalog,
    batchImportLpDrugs,
    type LpDrugCatalogFilter,
} from '@/services/pharmacy/lpDrugCatalogService'
import type { LpDrug, LpDrugWithRelations } from '@/types/pharmacy'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

const ExcelImport = lazy(() => import('@/components/pharmacy/ExcelImport'))

// Form Modal Component
interface FormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: Partial<LpDrug>) => Promise<void>
    item?: LpDrugWithRelations | null
}

const FormModal: React.FC<FormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState<Partial<LpDrug>>({
        item_code: '',
        item_name: '',
        packaging_description: '',
        price: 0,
        notes: '',
        status: 'active',
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (item) {
            setFormData({
                item_code: item.item_code || '',
                item_name: item.item_name || '',
                packaging_description: item.packaging_description || '',
                price: item.price || 0,
                notes: item.notes || '',
                status: (item.status as 'active' | 'inactive') || 'active',
            })
        } else {
            setFormData({
                item_code: '',
                item_name: '',
                packaging_description: '',
                price: 0,
                notes: '',
                status: 'active',
            })
        }
    }, [item, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit LP Drug' : 'Add New LP Drug'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Item Code"
                    placeholder="e.g., APPL001"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    required
                />
                <Input
                    label="Item Name"
                    placeholder="e.g., Paracetamol 500mg"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                />
                <Input
                    label="Packaging"
                    placeholder="e.g., Box of 100 tablets"
                    value={formData.packaging_description}
                    onChange={(e) => setFormData({ ...formData, packaging_description: e.target.value })}
                />
                <Input
                    label="Price (RM)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
                <Input
                    label="Notes"
                    placeholder="Additional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </Select>
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading} className="bg-blue-600 hover:bg-blue-700">
                        {item ? 'Update' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// Main Component
export default function LpDrugCatalogPage() {
    const toasts = useToast()
    const { user } = useAuthStore()
    const isSessionReady = useIsSessionReady()

    const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0 })
    const [items, setItems] = useState<LpDrugWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filter, setFilter] = useState<LpDrugCatalogFilter>({})
    const [searchTerm, setSearchTerm] = useState('')
    const [showFormModal, setShowFormModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [editingItem, setEditingItem] = useState<LpDrugWithRelations | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchKPIs = useCallback(async () => {
        if (!user?.hospital_id) return
        const { data } = await getLpDrugCatalogKPIs(user.hospital_id)
        if (data) setKpis(data)
    }, [user?.hospital_id])

    const fetchItems = useCallback(async () => {
        if (!user?.hospital_id) return
        setLoading(true)
        const { data } = await getLpDrugCatalog(user.hospital_id, filter, page, DEFAULT_PAGE_SIZE)
        if (data) {
            setItems(data.data)
            setTotalPages(data.totalPages)
        }
        setLoading(false)
    }, [user?.hospital_id, filter, page])

    useEffect(() => {
        if (isSessionReady) {
            fetchKPIs()
            fetchItems()
        }
    }, [isSessionReady, fetchKPIs, fetchItems])

    const handleSearch = () => {
        setFilter({ ...filter, search: searchTerm })
        setPage(1)
    }

    const handleSave = async (data: Partial<LpDrug>) => {
        if (!user?.hospital_id || !user?.id) return

        if (editingItem) {
            const { error } = await updateLpDrug(editingItem.id, data)
            if (error) {
                toasts.error('Error', error)
            } else {
                toasts.success('Success', 'Item updated successfully')
                fetchKPIs()
                fetchItems()
            }
        } else {
            const { error } = await createLpDrug(user.hospital_id, user.id, data)
            if (error) {
                toasts.error('Error', error)
            } else {
                toasts.success('Success', 'Item created successfully')
                fetchKPIs()
                fetchItems()
            }
        }
    }

    const confirmDelete = (id: string) => {
        setDeletingId(id)
        setShowDeleteModal(true)
    }

    const handleDelete = async () => {
        if (!deletingId) return
        const { error } = await deleteLpDrug(deletingId)
        if (error) {
            toasts.error('Error', error)
        } else {
            toasts.success('Success', 'Item deleted successfully')
            fetchKPIs()
            fetchItems()
        }
        setShowDeleteModal(false)
        setDeletingId(null)
    }

    const handleExport = async () => {
        if (!user?.hospital_id) return

        const { data, error } = await exportLpDrugCatalog(user.hospital_id, filter)
        if (error || !data) {
            toasts.error('Error', error || 'Failed to export')
            return
        }

        const blob = new Blob([data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `lp-drug-catalog-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toasts.success('Success', 'Catalog exported successfully')
    }

    const handleImport = async (data: any[], _mappings: any[]) => {
        if (!user?.hospital_id || !user?.id) return { success: 0, errors: ['User context missing'] }

        const result = await batchImportLpDrugs(user.hospital_id, user.id, data)
        const error = result.error
        const importResult = result.data
        if (error) {
            toasts.error('Error', error)
            return { success: 0, errors: [error] }
        }

        if (importResult) {
            const message = `Imported ${importResult.success} items. ${importResult.errors.length} errors.`
            if (importResult.errors.length > 0) {
                toasts.warning('Partial Success', message)
                console.error('Import errors:', importResult.errors)
            } else {
                toasts.success('Success', message)
            }
            fetchKPIs()
            fetchItems()
            return { success: importResult.success, errors: importResult.errors }
        }
        return { success: 0, errors: [] }
    }

    return (
        <FinancialPageLayout
            title="LP Drug Catalog"
            description="Manage Local Purchase Drug items."
            icon={Package}
            breadcrumbs={[{ label: 'Catalogs', href: '#' }, { label: 'LP Drugs' }]}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowImportModal(true)} className="bg-white/50 backdrop-blur-sm text-blue-700 border-blue-200">
                        <FileUp className="w-4 h-4 mr-2" /> Import
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="bg-white/50 backdrop-blur-sm text-blue-700 border-blue-200">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Button onClick={() => { setEditingItem(null); setShowFormModal(true) }} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                        <Plus className="w-4 h-4 mr-2" /> Add Item
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
                                <div className="p-2 bg-white/20 rounded-lg"><Package className="w-5 h-5 text-blue-50" /></div>
                                <span className="text-sm font-medium text-blue-50">Total Items</span>
                            </div>
                            <p className="text-3xl font-bold">{kpis.total}</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-50" /></div>
                                <span className="text-sm font-medium text-emerald-50">Active</span>
                            </div>
                            <p className="text-3xl font-bold">{kpis.active}</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg"><XCircle className="w-5 h-5 text-amber-50" /></div>
                                <span className="text-sm font-medium text-amber-50">Inactive</span>
                            </div>
                            <p className="text-3xl font-bold">{kpis.inactive}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="glass-card rounded-xl p-4 flex flex-col lg:flex-row gap-4 border border-white/40 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search by code or name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full pl-9 pr-4 h-10 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all" />
                    </div>
                    <div className="flex gap-3">
                        <select value={filter.status || 'all'} onChange={e => { const status = e.target.value === 'all' ? undefined : (e.target.value as 'active' | 'inactive'); setFilter({ ...filter, status }); setPage(1); }} className="h-10 px-3 bg-slate-50 border-transparent rounded-lg text-sm text-slate-600 focus:bg-white outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableCell as="th" className="font-semibold text-slate-600">Item Code</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Item Name</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Packaging</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-right">Price</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-center">Status</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-right">Actions</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10"><Spinner size="lg" /></TableCell></TableRow>
                            ) : items.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No items found</TableCell></TableRow>
                            ) : (
                                items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">{item.item_code}</TableCell>
                                        <TableCell className="font-medium text-slate-700">{item.item_name}</TableCell>
                                        <TableCell className="text-sm text-slate-600">{item.packaging_description || '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-slate-700">{formatCurrency(item.price || 0)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={item.status === 'active' ? 'success' : 'gray'}>{item.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingItem(item); setShowFormModal(true) }}>
                                                    <Edit className="w-3.5 h-3.5 text-blue-500" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => confirmDelete(item.id)}>
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {totalPages > 0 && <Pagination currentPage={page} totalPages={totalPages} total={kpis.total} pageSize={DEFAULT_PAGE_SIZE} onPageChange={setPage} className="border-t border-slate-100 p-4" />}
                </div>

                <FormModal
                    isOpen={showFormModal}
                    onClose={() => { setShowFormModal(false); setEditingItem(null) }}
                    onSave={handleSave}
                    item={editingItem}
                />

                <ConfirmationDialog
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Delete Item"
                    message="Are you sure you want to delete this item? This action cannot be undone."
                    variant="danger"
                />

                {showImportModal && (
                    <Suspense fallback={<Spinner />}>
                        <ExcelImport
                            isOpen={showImportModal}
                            onClose={() => setShowImportModal(false)}
                            onImport={handleImport}
                            catalogType="drug"
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
            </div>
        </FinancialPageLayout>
    )
}
