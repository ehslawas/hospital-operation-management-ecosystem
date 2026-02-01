import React, { useEffect, useState, useMemo } from 'react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    Badge, Spinner, Table, TableHeader, TableBody, TableRow, TableCell,
    Card, CardContent
} from '@/components/ui'
import { Pill, MapPin, Activity, BarChart3, AlertCircle } from 'lucide-react'
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts'
import { getItemTransactions, getItemStockLocations, getItemAssignedLocations } from '@/services/pharmacy/inventoryService'
import type { DrugWithRelations, StockBatchWithRelations, StockTransaction, StockLocationItemWithRelations } from '@/types/pharmacy'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

interface DrugDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    drug: DrugWithRelations | null
    sourceIds?: string[]
    catalogItemId?: string
}

export const DrugDetailsModal: React.FC<DrugDetailsModalProps> = ({ isOpen, onClose, drug, sourceIds, catalogItemId }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [locations, setLocations] = useState<StockBatchWithRelations[]>([])
    const [assignedLocations, setAssignedLocations] = useState<StockLocationItemWithRelations[]>([])
    const [transactions, setTransactions] = useState<StockTransaction[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && drug?.id) {
            console.log('Opening details for drug:', drug.drug_name)
            void loadDetails()
        }
    }, [isOpen, drug])

    const loadDetails = async () => {
        if (!drug) return
        setIsLoading(true)
        setError(null)

        try {
            const idsToQuery = sourceIds && sourceIds.length > 0 ? sourceIds : [drug.id]

            console.log('DrugDetailsModal: Loading details for drug:', {
                id: drug.id,
                name: drug.drug_name,
                idsToQuery,
                catalogItemId,
                min: drug.min_stock_level,
                max: drug.max_stock_level
            })

            const [locationsRes, transactionsRes, assignedRes] = await Promise.all([
                getItemStockLocations(idsToQuery, 'drug'),
                getItemTransactions(idsToQuery, 'drug', 6),
                catalogItemId ? getItemAssignedLocations(catalogItemId) : Promise.resolve({ data: [], error: null })
            ])

            console.log('DrugDetailsModal: Locations Response:', locationsRes)
            console.log('DrugDetailsModal: Transactions Response:', transactionsRes)
            console.log('DrugDetailsModal: Assigned Response:', assignedRes)

            if (locationsRes.error) throw new Error(locationsRes.error)
            if (transactionsRes.error) throw new Error(transactionsRes.error)
            if (assignedRes.error) throw new Error(assignedRes.error)

            setLocations(locationsRes.data || [])
            setTransactions(transactionsRes.data || [])
            setAssignedLocations(assignedRes.data || [])
        } catch (err) {
            console.error('DrugDetailsModal: Error loading details:', err)
            setError(err instanceof Error ? err.message : 'Failed to load details')
        } finally {
            setIsLoading(false)
        }
    }

    // Merge physical locations with assigned locations
    const mergedLocations = useMemo(() => {
        // Start with all physical batches
        const all: (Partial<StockBatchWithRelations> & { isAssignedOnly?: boolean })[] = [...locations]

        // Add assigned locations that don't have active stock
        assignedLocations.forEach(al => {
            const hasStockInThisLocation = locations.some(l => l.location_id === al.location_id)
            if (!hasStockInThisLocation && al.location) {
                all.push({
                    id: `assigned-${al.id}`,
                    location_id: al.location_id,
                    location: al.location,
                    batch_number: 'N/A',
                    quantity_on_hand: 0,
                    isAssignedOnly: true
                })
            }
        })

        return all
    }, [locations, assignedLocations])

    // Process data for chart
    const chartData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), 5 - i)
            return {
                month: format(date, 'MMM yy'),
                startDate: startOfMonth(date),
                endDate: endOfMonth(date),
                received: 0,
                issued: 0
            }
        })

        transactions.forEach(tx => {
            const txDate = new Date(tx.transaction_date)
            const monthData = last6Months.find(m =>
                isWithinInterval(txDate, { start: m.startDate, end: m.endDate })
            )

            if (monthData) {
                if (tx.transaction_type === 'receipt' || tx.transaction_type === 'transfer_in' || tx.transaction_type === 'adjust_in') {
                    monthData.received += tx.quantity
                } else if (tx.transaction_type === 'issue' || tx.transaction_type === 'transfer_out' || tx.transaction_type === 'adjust_out' || tx.transaction_type === 'dispose') {
                    monthData.issued += tx.quantity
                }
            }
        })

        return last6Months
    }, [transactions])

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()} size="xl">
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {!drug ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Spinner size="lg" />
                        <p className="text-gray-500 animate-pulse">Initializing view...</p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-100 rounded-lg">
                                        <Pill className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold">{drug.drug_name}</DialogTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                                {drug.drug_code}
                                            </code>
                                            <Badge variant={drug.status === 'active' ? 'success' : 'gray'}>
                                                {drug.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Spinner size="lg" />
                                <p className="text-sm text-gray-500">Fetching detailed information...</p>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : (
                            <div className="space-y-6 mt-4 p-6">
                                {/* Row 1: Location & Buffer */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Locations */}
                                    <Card className="border-gray-200 shadow-none">
                                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-teal-600" />
                                            <h3 className="font-semibold text-gray-900">Detailed Locations</h3>
                                        </div>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50/50">
                                                        <TableCell as="th" className="text-xs uppercase py-2 font-bold">Location</TableCell>
                                                        <TableCell as="th" className="text-xs uppercase py-2 text-right font-bold">Details</TableCell>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {assignedLocations.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={2} className="text-center py-8 text-gray-400 text-sm">
                                                                No assigned locations found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        assignedLocations.map((al) => (
                                                            <TableRow key={al.id}>
                                                                <TableCell className="text-sm py-3">
                                                                    <div className="font-medium text-gray-900">
                                                                        {al.location?.location_name || 'Unassigned'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-sm py-3 text-right">
                                                                    <div className="flex flex-wrap justify-end gap-1.5">
                                                                        {al.shelf && (
                                                                            <Badge variant="gray" className="text-[10px] py-0 px-1.5 border-gray-200 text-gray-500 font-medium">
                                                                                SHELF: {al.shelf}
                                                                            </Badge>
                                                                        )}
                                                                        {al.level && (
                                                                            <Badge variant="gray" className="text-[10px] py-0 px-1.5 border-gray-200 text-gray-500 font-medium">
                                                                                LVL: {al.level}
                                                                            </Badge>
                                                                        )}
                                                                        {al.column_name && (
                                                                            <Badge variant="gray" className="text-[10px] py-0 px-1.5 border-gray-200 text-gray-500 font-medium">
                                                                                COL: {al.column_name}
                                                                            </Badge>
                                                                        )}
                                                                        {!al.shelf && !al.level && !al.column_name && (
                                                                            <span className="text-xs text-gray-300 italic">No shelf details</span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    {/* Buffer Level */}
                                    <Card className="border-gray-200 shadow-none">
                                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-teal-600" />
                                            <h3 className="font-semibold text-gray-900">Buffer Levels</h3>
                                        </div>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {/* Limits Row */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1.5 text-center">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Min Limit</span>
                                                        <div className="py-2.5 px-3 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900">
                                                            {drug.min_stock_level}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 text-center">
                                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Buffer Level</span>
                                                        <div className="py-2.5 px-3 bg-blue-50/10 border border-blue-200 rounded-lg text-sm font-bold text-blue-600">
                                                            {drug.reorder_point || Math.floor((drug.min_stock_level + (drug.max_stock_level || 0)) / 2) || '-'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 text-center">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Max Limit</span>
                                                        <div className="py-2.5 px-3 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900">
                                                            {drug.max_stock_level || '—'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="relative pt-1">
                                                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100">
                                                        <div
                                                            style={{ width: `${Math.min(100, (drug.current_stock || 0) / (drug.max_stock_level || Math.max(drug.min_stock_level * 2, drug.current_stock || 1)) * 100)}%` }}
                                                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${(drug.current_stock || 0) <= drug.min_stock_level ? 'bg-rose-500' : 'bg-teal-500'
                                                                }`}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                                                        <span>Min: {drug.min_stock_level}</span>
                                                        <span>Current: {drug.current_stock || 0}</span>
                                                        <span>Max: {drug.max_stock_level || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Total Summary */}
                                                <div className="flex items-center justify-between text-sm py-3 px-4 bg-gray-50/30 rounded-xl border border-gray-100">
                                                    <span className="font-medium text-gray-600">Total Available</span>
                                                    <Badge variant={(drug.current_stock || 0) <= drug.min_stock_level ? 'error' : 'success'} className="font-bold px-3">
                                                        {drug.current_stock || 0} UNITS
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Row 2: Usage Chart */}
                                <Card className="border-gray-200 shadow-none">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-teal-600" />
                                            <h3 className="font-semibold text-gray-900">Stock Movement (Last 6 Months)</h3>
                                        </div>
                                        <div className="flex gap-4 text-xs">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <div className="w-2.5 h-2.5 bg-teal-500 rounded-sm"></div>
                                                <span>Purchasing (In)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></div>
                                                <span>Usage (Out)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="month"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f9fafb' }}
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: '1px solid #e5e7eb',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                    />
                                                    <Bar dataKey="received" name="Purchasing" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="issued" name="Usage" fill="#e11d48" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4 px-6 pb-6 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mr-auto flex items-center gap-1 italic">
                                <AlertCircle className="w-3 h-3" />
                                Read-only mode. All data is for reference only.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
