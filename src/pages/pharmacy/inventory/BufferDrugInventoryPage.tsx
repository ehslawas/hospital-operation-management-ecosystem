import React, { useEffect, useState, useMemo } from 'react'
import { AlertCircle, TrendingUp, DollarSign, Package } from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Badge, Card } from '@/components/ui'
import { getInventoryWithCatalogBackbone, getInventoryStats } from '@/services/pharmacy/inventoryService'
import type { StockBatchWithRelations, InventoryStats, DrugWithRelations } from '@/types/pharmacy'
import { format } from 'date-fns'
import { DrugDetailsModal } from './components/DrugDetailsModal'

// Standardized Components
import { StandardPageLayout } from '@/components/layouts/StandardPageLayout'
import { StandardDataTable, type Column } from '@/components/ui/StandardDataTable'
import { FilterToolbar } from '@/components/ui/FilterToolbar'

export const BufferDrugInventoryPage: React.FC = () => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const isSessionReady = useIsSessionReady()

    // Data State
    const [batches, setBatches] = useState<StockBatchWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<InventoryStats | null>(null)

    // Filter State
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Details Modal
    const [selectedDrug, setSelectedDrug] = useState<DrugWithRelations | null>(null)
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
    const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | undefined>(undefined)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

    const handleDrugClick = (item: StockBatchWithRelations) => {
        if (!item.drug) return

        console.log('Drug clicked (Buffer):', item.drug.drug_name, item.drug.id)

        // Extract all possible source IDs from the catalog item
        const ids: string[] = []
        if (item.unit_catalog_item) {
            if (item.unit_catalog_item.drug_id) ids.push(item.unit_catalog_item.drug_id)
            if (item.unit_catalog_item.contract_id) ids.push(item.unit_catalog_item.contract_id)
            if (item.unit_catalog_item.appl_drug_id) ids.push(item.unit_catalog_item.appl_drug_id)
            if (item.unit_catalog_item.lp_drug_id) ids.push(item.unit_catalog_item.lp_drug_id)
        }

        // Always include the resolved drug ID just in case
        if (item.drug.id && !ids.includes(item.drug.id)) {
            ids.push(item.drug.id)
        }

        setSelectedDrug(item.drug)
        setSelectedSourceIds(ids)
        setSelectedCatalogItemId(item.unit_catalog_item?.id)
        setIsDetailsModalOpen(true)
    }

    // Fetch Data
    const loadData = async () => {
        if (!isSessionReady || !hospitalId) return

        setIsLoading(true)
        try {
            const [inventoryData, statsData] = await Promise.all([
                getInventoryWithCatalogBackbone(hospitalId, {
                    item_type: 'drug'
                }),
                getInventoryStats(hospitalId)
            ])

            if (inventoryData.error) throw new Error(inventoryData.error)

            setBatches(inventoryData.data || [])
            setStats(statsData.data)
            setError(null)
        } catch (err) {
            console.error(err)
            setError('Failed to load inventory data. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isSessionReady && hospitalId) {
            loadData()
        }
    }, [isSessionReady, hospitalId])

    // Filtering & Pagination Logic
    const filteredData = useMemo(() => {
        let data = [...batches]

        // 1. Search
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            data = data.filter(b =>
                b.drug?.drug_name.toLowerCase().includes(lower) ||
                b.drug?.drug_code.toLowerCase().includes(lower) ||
                b.batch_number?.toLowerCase().includes(lower)
            )
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            data = data.filter(b => {
                if (statusFilter === 'active') return (b.quantity_on_hand || 0) > 0
                if (statusFilter === 'out_of_stock') return (b.quantity_on_hand || 0) <= 0
                if (statusFilter === 'expiring') {
                    if (!b.expiry_date) return false
                    const daysUntilExpiry = Math.ceil((new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return daysUntilExpiry <= 90 && daysUntilExpiry > 0
                }
                return true
            })
        }

        return data
    }, [batches, searchQuery, statusFilter])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page, pageSize])

    // Table Columns
    const columns: Column<StockBatchWithRelations>[] = [
        {
            header: "Item Code",
            className: "w-[120px]",
            cell: (item) => {
                const itemCode = item.drug?.drug_code || item.non_drug?.item_code || '-'
                return (
                    <span className="font-mono text-xs font-bold text-gray-700">
                        {itemCode}
                    </span>
                )
            }
        },
        {
            header: "Product Name",
            className: "min-w-[280px]",
            cell: (item) => {
                const name = item.drug?.drug_name || item.non_drug?.item_name || 'Unknown Item'
                const generic = item.drug?.generic_name || (item.non_drug as any)?.generic_name || ''
                return (
                    <div>
                        {item.drug ? (
                            <button
                                onClick={() => handleDrugClick(item)}
                                className="font-bold text-teal-600 hover:text-teal-800 hover:underline text-left text-sm"
                            >
                                {name}
                            </button>
                        ) : (
                            <div className="font-bold text-gray-900 text-sm">{name}</div>
                        )}
                        {generic && <div className="text-xs text-gray-500 mt-0.5">{generic}</div>}
                    </div>
                )
            }
        },
        {
            header: "FUKKM",
            className: "w-[150px]",
            cell: (item) => {
                const category = item.drug?.category || (item.non_drug as any)?.category
                return <span className="text-xs text-slate-500">{category?.category_name || '—'}</span>
            }
        },
        {
            header: "Therapeutic",
            className: "w-[150px]",
            cell: (item) => {
                const therapeutic = item.drug?.therapeutic_class || (item.non_drug as any)?.therapeutic_class
                return <span className="text-xs text-slate-500">{therapeutic?.category_name || '—'}</span>
            }
        },
        {
            header: "Source",
            className: "w-[100px]",
            cell: (item) => {
                const vote = item.unit_catalog_item?.procurement_vote?.toLowerCase()
                const hasContract = !!item.unit_catalog_item?.contract_id
                const hasAppl = !!item.unit_catalog_item?.appl_drug_id
                const hasLp = !!item.unit_catalog_item?.lp_drug_id

                let source = "N/A"
                let bgColor = "bg-slate-50"
                let textColor = "text-slate-600"
                let borderColor = "border-slate-200"

                if (vote === 'cc' || hasContract) {
                    source = 'CC'
                    bgColor = "bg-amber-50"
                    textColor = "text-amber-700"
                    borderColor = "border-amber-200"
                } else if (vote === 'appl' || hasAppl) {
                    source = 'APPL'
                    bgColor = "bg-emerald-50"
                    textColor = "text-emerald-700"
                    borderColor = "border-emerald-200"
                } else if (vote === 'lp' || hasLp) {
                    source = 'LP'
                    bgColor = "bg-orange-50"
                    textColor = "text-orange-700"
                    borderColor = "border-orange-200"
                } else if (item.unit_catalog_item?.drug_id) {
                    source = 'MASTER'
                    bgColor = "bg-blue-50"
                    textColor = "text-blue-700"
                    borderColor = "border-blue-200"
                }

                return (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bgColor} ${textColor} ${borderColor}`}>
                        {source}
                    </span>
                )
            }
        },
        {
            header: "Batch Info",
            className: "w-[180px]",
            cell: (item) => (
                <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                        <span className="font-mono font-medium text-gray-900 mr-2">#{item.batch_number}</span>
                    </div>
                    {item.expiry_date && (
                        <div className="flex items-center text-xs text-gray-500">
                            <span className={new Date(item.expiry_date) < new Date() ? 'text-rose-600 font-bold' : ''}>
                                Exp: {format(new Date(item.expiry_date), 'dd MMM yyyy')}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Stock Level",
            className: "w-[120px] text-right",
            cell: (item) => {
                const qty = item.quantity_on_hand || 0
                const isLow = qty < 10 && qty > 0
                const isOut = qty === 0

                return (
                    <div className="text-right">
                        <div className={`text-sm font-bold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-teal-600'}`}>
                            {qty.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">units</span>
                    </div>
                )
            }
        }
    ]

    return (
        <StandardPageLayout
            title="Drug Inventory"
            description="Real-time overview of pharmaceutical stock, value, and critical items."
            breadcrumbs={[
                { label: 'Pharmacy', href: '/pharmacy' },
                { label: 'Inventory' },
                { label: 'Drugs' }
            ]}
        >
            {/* KPI Stats Section */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Package className="w-16 h-16 text-emerald-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                </div>
                                <Badge variant="gray" className="bg-emerald-100/50 text-emerald-700 border-none">Active</Badge>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalItems}</div>
                            <div className="text-sm font-medium text-gray-500">Total Drug Items</div>
                        </div>
                    </Card>

                    <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-blue-50 to-white relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-16 h-16 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <Badge variant="gray" className="bg-blue-100/50 text-blue-700 border-none">Estimated</Badge>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                <span className="text-lg text-gray-400 mr-1">RM</span>
                                {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm font-medium text-gray-500">Total Stock Value</div>
                        </div>
                    </Card>

                    <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-rose-50 to-white relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertCircle className="w-16 h-16 text-rose-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <Badge variant="gray" className="bg-rose-100/50 text-rose-700 border-none">Action Needed</Badge>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.outOfStock}</div>
                            <div className="text-sm font-medium text-gray-500">Out of Stock Items</div>
                        </div>
                    </Card>

                    <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-amber-50 to-white relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-16 h-16 text-amber-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <TrendingUp className="w-5 h-5 text-amber-600" />
                                </div>
                                <Badge variant="gray" className="bg-amber-100/50 text-amber-700 border-none">Next 90 Days</Badge>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.expiringSoon}</div>
                            <div className="text-sm font-medium text-gray-500">Expiring Items</div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filter Toolbar */}
            <FilterToolbar
                searchTerm={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
                statusFilter={{
                    value: statusFilter,
                    onChange: (val) => { setStatusFilter(val); setPage(1); },
                    options: [
                        { label: 'All Statuses', value: 'all' },
                        { label: 'Active', value: 'active' },
                        { label: 'Out of Stock', value: 'out_of_stock' },
                        { label: 'Expiring Soon', value: 'expiring' }
                    ]
                }}
                pageSize={{
                    value: pageSize,
                    onChange: (val) => { setPageSize(val); setPage(1); }
                }}
                onClearAll={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setPage(1)
                }}
            />

            {/* Data Table */}
            <StandardDataTable
                columns={columns}
                data={paginatedData}
                isLoading={isLoading}
                error={error}
                pagination={{
                    page,
                    pageSize,
                    totalItems: filteredData.length,
                    onPageChange: setPage
                }}
                keyExtractor={(item) => item.id}
                emptyMessage="No drug items found matching your criteria."
            />

            {/* Item Details Modal */}
            <DrugDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                drug={selectedDrug}
                sourceIds={selectedSourceIds}
                catalogItemId={selectedCatalogItemId}
            />
        </StandardPageLayout>
    )
}

export default BufferDrugInventoryPage
