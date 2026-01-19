import React, { useEffect, useState } from 'react'
import {
    Search,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    FileUp,
} from 'lucide-react'
import { Button, Badge, Table, TableHeader, TableRow, TableCell, TableBody, Pagination, Spinner, ConfirmationDialog } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { ExcelImport } from '@/components/pharmacy/ExcelImport'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import {
    getContractNonDrugs,
    getContractNonDrugKPIs,
    batchImportContractNonDrugs,
    deleteContractNonDrug,
} from '@/services/pharmacy/contractNonDrugCatalogService'
import type { ContractWithRelations, ContractCatalogKPIs, ContractCatalogFilter } from '@/types/pharmacy'
import { motion } from 'framer-motion'

export const ContractNonDrugCatalogPage: React.FC = () => {
    const { user } = useAuthStore()
    const { success: showSuccess, error: showError } = useToastStore()

    // State
    const [contracts, setContracts] = useState<ContractWithRelations[]>([])
    const [kpis, setKpis] = useState<ContractCatalogKPIs>({
        total: 0,
        active: 0,
        expired: 0,
        expiring_soon: 0,
        pending: 0,
        total_value: 0,
        contracts_by_supplier: [],
    })
    const [isLoading, setIsLoading] = useState(true)
    const [showImportModal, setShowImportModal] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedContract, setSelectedContract] = useState<ContractWithRelations | null>(null)

    // Load data
    useEffect(() => {
        if (user?.hospital_id) {
            loadContracts()
            loadKPIs()
        }
    }, [user?.hospital_id, searchQuery, statusFilter])

    const loadContracts = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)
        try {
            const filter: ContractCatalogFilter = {
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
            }
            const result = await getContractNonDrugs(user.hospital_id, filter)
            if (result.data) setContracts(result.data)
        } finally {
            setIsLoading(false)
        }
    }

    const loadKPIs = async () => {
        if (!user?.hospital_id) return
        const result = await getContractNonDrugKPIs(user.hospital_id)
        if (result.data) setKpis(result.data)
    }

    const handleDelete = async () => {
        if (!selectedContract) return
        const res = await deleteContractNonDrug(selectedContract.id)
        if (!res.error) {
            showSuccess('Deleted', 'Contract deleted')
            loadContracts()
            loadKPIs()
        } else {
            showError('Error', res.error)
        }
        setShowDeleteModal(false)
    }

    const handleImport = async (data: any[]) => {
        if (!user?.hospital_id) return { success: 0, errors: [] }
        const res = await batchImportContractNonDrugs(user.hospital_id, data)
        if (res.data) {
            showSuccess('Imported', `Successfully imported ${res.data.success} contracts`)
            loadContracts()
            loadKPIs()
            return res.data
        }
        return { success: 0, errors: ['Import failed'] }
    }

    const contractImportFields = [
        { key: 'item_name', label: 'Item Name', required: true, type: 'string' as const },
        { key: 'contract_number', label: 'No Kontrak', required: true, type: 'string' as const },
        { key: 'start_date', label: 'Kontrak Mula', required: false, type: 'date' as const },
        { key: 'end_date', label: 'Kontrak Tamat', required: false, type: 'date' as const },
        { key: 'supplier_name', label: 'Pembekal', required: false, type: 'string' as const },
        { key: 'unit', label: 'Unit', required: false, type: 'string' as const },
        { key: 'unit_price', label: 'Harga (RM)', required: false, type: 'number' as const },
        { key: 'delivery_period', label: 'Tempoh Serahan', required: false, type: 'string' as const },
        { key: 'sst_rate', label: 'SST', required: false, type: 'string' as const },
    ]

    // Pagination logic
    const paginatedContracts = contracts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    const totalPages = Math.ceil(contracts.length / pageSize)

    return (
        <FinancialPageLayout
            title="Contract Non-Drug Catalog"
            description="Manage non-drug procurement contracts and agreements."
            icon={FileText}
            breadcrumbs={[{ label: 'Catalogs', href: '#' }, { label: 'Contract Non-Drug' }]}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowImportModal(true)} className="bg-white/50 backdrop-blur-sm text-blue-700 border-blue-200">
                        <FileUp className="w-4 h-4 mr-2" /> Import Excel
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-400 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg"><FileText className="w-5 h-5 text-slate-50" /></div>
                            <span className="text-sm font-medium text-slate-50">Total</span>
                        </div>
                        <p className="text-3xl font-bold">{kpis.total}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-50" /></div>
                            <span className="text-sm font-medium text-emerald-50">Active</span>
                        </div>
                        <p className="text-3xl font-bold">{kpis.active}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg"><Clock className="w-5 h-5 text-amber-50" /></div>
                            <span className="text-sm font-medium text-amber-50">Expiring</span>
                        </div>
                        <p className="text-3xl font-bold">{kpis.expiring_soon}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-400 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg"><XCircle className="w-5 h-5 text-rose-50" /></div>
                            <span className="text-sm font-medium text-rose-50">Expired</span>
                        </div>
                        <p className="text-3xl font-bold">{kpis.expired}</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="glass-card rounded-xl p-4 flex flex-col lg:flex-row gap-4 border border-white/40 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search non-drug contracts..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 h-10 bg-slate-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-10 px-3 bg-slate-50 border-transparent rounded-lg text-sm text-slate-600 focus:bg-white outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expiring_soon">Expiring Soon</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>

                {/* Table */}
                <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableCell as="th" className="font-semibold text-slate-600">Item Name</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Contract No.</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Start Date</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">End Date</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600">Supplier</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-right">Price</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-center">Status</TableCell>
                                <TableCell as="th" className="font-semibold text-slate-600 text-right">Actions</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10"><Spinner size="lg" /></TableCell></TableRow>
                            ) : paginatedContracts.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-500">No non-drug contracts found.</TableCell></TableRow>
                            ) : (
                                paginatedContracts.map(contract => (
                                    <TableRow key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-700">{contract.item_name}</TableCell>
                                        <TableCell className="text-slate-600">{contract.contract_number}</TableCell>
                                        <TableCell className="text-slate-600">{contract.start_date || '-'}</TableCell>
                                        <TableCell className="text-slate-600">{contract.end_date || '-'}</TableCell>
                                        <TableCell className="text-slate-600">{contract.supplier_name || '-'}</TableCell>
                                        <TableCell className="text-right font-semibold text-slate-700">
                                            RM {contract.unit_price?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={contract.status === 'active' ? 'primary' : contract.status === 'expired' ? 'error' : 'gray'}>
                                                {contract.status?.toUpperCase() || 'UNKNOWN'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setSelectedContract(contract); setShowDeleteModal(true); }}
                                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            pageSize={pageSize}
                            total={contracts.length}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                )}
            </div>

            <ExcelImport
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
                targetFields={contractImportFields}
                title="Import Non-Drug Contracts"
                description="Upload an Excel file containing non-drug contract data."
                catalogType="contract_non_drug"
            />

            <ConfirmationDialog
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Contract"
                message="Are you sure you want to delete this contract? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </FinancialPageLayout>
    )
}

export default ContractNonDrugCatalogPage
