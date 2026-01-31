import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Package, Search, Filter, Calendar } from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { Table, TableBody, TableCell, TableHeader, TableRow, Spinner, Input, Badge, Select } from '@/components/ui'
import { getInventoryWithCatalogBackbone } from '@/services/pharmacy/inventoryService'
import type { StockBatchWithRelations } from '@/types/pharmacy'
import { format } from 'date-fns'

export const BufferDrugInventoryPage: React.FC = () => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const isSessionReady = useIsSessionReady()

    const [batches, setBatches] = useState<StockBatchWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<'all' | 'active' | 'out_of_stock'>('all')

    const loadBatches = useCallback(async () => {
        if (!isSessionReady || !hospitalId) return

        setIsLoading(true)
        setError(null)

        const res = await getInventoryWithCatalogBackbone(hospitalId, {
            item_type: 'drug',
            status: status === 'all' ? undefined : status
        })

        if (res.error) {
            setError(res.error)
            setBatches([])
        } else if (res.data) {
            setBatches(res.data)
        }

        setIsLoading(false)
    }, [isSessionReady, hospitalId, status])

    useEffect(() => {
        void loadBatches()
    }, [loadBatches])

    // Client-side filtering for search
    const filteredBatches = batches.filter(batch => {
        if (!search) return true
        const term = search.toLowerCase()
        const drugName = batch.drug?.drug_name?.toLowerCase() || ''
        const drugCode = batch.drug?.drug_code?.toLowerCase() || ''
        const batchNo = batch.batch_number?.toLowerCase() || ''

        return drugName.includes(term) || drugCode.includes(term) || batchNo.includes(term)
    })

    const renderSourceBadge = (source?: string) => {
        if (!source) return <span className="text-gray-400">-</span>

        const colors: Record<string, 'primary' | 'gray' | 'success' | 'warning' | 'error' | 'info'> = {
            'appl': 'success',
            'contract': 'primary',
            'lp': 'warning',
            'quotation': 'gray'
        }

        return <Badge variant={colors[source.toLowerCase()] || 'gray'}>{source.toUpperCase()}</Badge>
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-6 h-6 text-teal-600" />
                    Drug Inventory
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Monitor drug stock levels, batches, and expiry dates.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <Input
                            placeholder="Search code, name, or batch..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full md:w-48">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                        <option value="all">All Statuses</option>
                        <option value="active">Active (Has Stock)</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </Select>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Filter className="w-3 h-3" />
                    <span>{filteredBatches.length} batches found</span>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <Spinner size="lg" />
                </div>
            )}

            {/* Error */}
            {!isLoading && error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium">Failed to load inventory</p>
                        <p className="mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell as="th">Item Code</TableCell>
                                <TableCell as="th">Item Name</TableCell>
                                <TableCell as="th">Source</TableCell>
                                <TableCell as="th">Packaging</TableCell>
                                <TableCell as="th">Batch No.</TableCell>
                                <TableCell as="th">Expiry Date</TableCell>
                                <TableCell as="th" className="text-right">Quantity</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBatches.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                                        No drugs found matching your filters.
                                    </TableCell>
                                </TableRow>
                            )}

                            {filteredBatches.map((batch) => (
                                <TableRow key={batch.id}>
                                    <TableCell className="font-mono text-xs text-gray-700">
                                        {batch.drug?.drug_code || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-gray-900">
                                        {batch.drug?.drug_name || 'Unknown Drug'}
                                    </TableCell>
                                    <TableCell>
                                        {renderSourceBadge(batch.drug?.procurement_vote)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                                        <span title={batch.drug?.packaging_description || ''}>
                                            {batch.drug?.packaging_description || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-gray-700">
                                        {batch.batch_number}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {batch.expiry_date ? format(new Date(batch.expiry_date), 'dd MMM yyyy') : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-gray-900">
                                        {batch.quantity_on_hand?.toLocaleString() || 0}
                                        <span className="text-xs text-gray-500 font-normal ml-1">
                                            {batch.drug?.unit_of_measure || 'units'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

export default BufferDrugInventoryPage
