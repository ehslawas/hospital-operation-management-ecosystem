import { useState, useEffect } from 'react'
import {
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Badge, LoadingOverlay, Input, Select, StatCard, Button
} from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { louService } from '@/services/pharmacy/louService'
import { LOU } from '@/types/pharmacy/procurementNew'
import {
    FileText, Mail, Search, Package, Clock, X, FileBadge
} from 'lucide-react'
import { format } from 'date-fns'
import { AnimatePresence } from 'framer-motion'
import { LOUGeneratorModal } from '@/components/pharmacy/procurement/LOUGeneratorModal'

export default function LOUManagementPage() {
    // State
    const [lous, setLous] = useState<LOU[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedLOU, setSelectedLOU] = useState<LOU | null>(null)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Initial Fetch
    const fetchLOUs = async () => {
        setIsLoading(true)
        try {
            const data = await louService.getAllLOUs()
            // Fallback to mock data if empty (for demo purposes)
            if (!data || data.length === 0) {
                setLous([
                    {
                        id: 'mock-1',
                        lpo_id: 'lpo-123',
                        receiving_id: 'rec-123',
                        po_number: 'PO-2024-001-PH',
                        lpo_number: 'LPO/2026/01/055',
                        do_numbers: ['DO-998877'],
                        supplier_name: 'Pharmaniaga Logistics Sdn Bhd',
                        items_count: 2,
                        requires_lou: true,
                        lou_reason: 'Short expiry date (< 18 months)',
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        items: [
                            {
                                id: 'item-1',
                                lou_id: 'mock-1',
                                receiving_item_id: 'ri-1',
                                item_id: 'i-1',
                                item_name: 'Paracetamol 500mg Tablet (Blister Pack)',
                                item_code: 'DRUG-001',
                                item_type: 'drug',
                                quantity_received: 5000,
                                batch_number: 'BATCH-ABC-123',
                                expiry_date: '2026-06-15T00:00:00Z',
                                manufactured_date: '2024-06-15T00:00:00Z',
                                status: 'pending',
                                created_at: new Date().toISOString()
                            },
                            {
                                id: 'item-2',
                                lou_id: 'mock-1',
                                receiving_item_id: 'ri-2',
                                item_id: 'i-2',
                                item_name: 'Amoxicillin 250mg Capsule',
                                item_code: 'DRUG-055',
                                item_type: 'drug',
                                quantity_received: 2000,
                                batch_number: 'BATCH-XYZ-789',
                                expiry_date: '2026-02-20T00:00:00Z',
                                manufactured_date: '2024-02-20T00:00:00Z',
                                status: 'pending',
                                created_at: new Date().toISOString()
                            }
                        ]
                    }
                ])
            } else {
                setLous(data)
            }
        } catch (error) {
            console.error(error)
            setLous([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLOUs()
    }, [])

    // Calculations
    const filteredLous = lous.filter(l => {
        const matchesSearch =
            l.lpo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.items?.some(i => i.item_name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'all' || l.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const stats = {
        total: lous.length,
        pending: lous.filter(l => l.status === 'pending').length,
        generated: lous.filter(l => l.status === 'generated').length,
        sent: lous.filter(l => l.status === 'sent').length
    }

    return (
        <FinancialPageLayout
            title="LOU Management"
            description="Manage Letters of Undertaking for conditional deliveries and track supplier compliance."
            icon={FileBadge}
            breadcrumbs={[{ label: 'Procurement', href: '#' }, { label: 'LOU Management' }]}
        >
            <AnimatePresence>
                {selectedLOU && (
                    <LOUGeneratorModal
                        isOpen={!!selectedLOU}
                        lou={selectedLOU}
                        onClose={() => setSelectedLOU(null)}
                        onSendEmail={() => {
                            // Mock email send
                            alert('Email sent successfully!')
                            setSelectedLOU(null)
                            fetchLOUs()
                        }}
                    />
                )}
            </AnimatePresence>
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total LOUs"
                        value={stats.total}
                        icon={Package}
                        color="primary"
                        change={12}
                        subtitle="Active records"
                    />
                    <StatCard
                        title="Pending Action"
                        value={stats.pending}
                        icon={Clock}
                        color="warning"
                        subtitle="Requires Generation"
                    />
                    <StatCard
                        title="Generated"
                        value={stats.generated}
                        icon={FileText}
                        color="info"
                        subtitle="Ready to Merge"
                    />
                    <StatCard
                        title="Sent to Supplier"
                        value={stats.sent}
                        icon={Mail}
                        color="success"
                        subtitle="Completed"
                    />
                </div>

                {/* Filters & Search */}
                <div className="glass-card rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center gap-4 border border-white/40 shadow-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by PO, LPO, Supplier, or Item Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all text-sm outline-none placeholder:text-slate-400 h-11 w-full"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { label: 'All Statuses', value: 'all' },
                                { label: 'Pending', value: 'pending' },
                                { label: 'Generated', value: 'generated' },
                                { label: 'Sent', value: 'sent' },
                                { label: 'Acknowledged', value: 'acknowledged' }
                            ]}
                            className="h-11 rounded-xl bg-slate-50 border-transparent"
                        />
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm('')
                                setStatusFilter('all')
                            }}
                            className="h-11 border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                    <TableHead className="font-semibold text-slate-600">LPO Number</TableHead>
                                    <TableHead className="font-semibold text-slate-600">DO Number</TableHead>
                                    <TableHead className="min-w-[300px] font-semibold text-slate-600">Item Name</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Quantity</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Expiry Info</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLous.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Package className="w-8 h-8 text-slate-300 mb-2" />
                                                <p>No LOU records found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLous.map((lou) => {
                                        const itemCount = lou.items?.length || 0
                                        const firstItem = lou.items?.[0]
                                        const multiItemLabel = itemCount > 1 ? ` (+${itemCount - 1} others)` : ''

                                        return (
                                            <TableRow
                                                key={lou.id}
                                                className="hover:bg-slate-50 transition-colors border-b border-slate-50"
                                            >
                                                <TableCell className="font-mono text-xs text-slate-600 pl-4">
                                                    {lou.lpo_number || (lou as any).lpo?.lpo_number}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {lou.do_numbers?.[0] || '-'}
                                                    {lou.do_numbers && lou.do_numbers.length > 1 && <span className="text-[10px] text-slate-400 ml-1">(+{lou.do_numbers.length - 1})</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span
                                                            onClick={() => setSelectedLOU(lou)}
                                                            className="font-medium text-blue-600 text-sm cursor-pointer hover:underline hover:text-blue-700 w-fit"
                                                        >
                                                            {firstItem?.item_name || 'No Items'}
                                                            <span className="text-slate-400 text-xs font-normal no-underline ml-1">{multiItemLabel}</span>
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">{lou.supplier_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">PO: {lou.po_number || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {firstItem?.quantity_received || 0}
                                                </TableCell>
                                                <TableCell>
                                                    {firstItem ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-[10px] text-slate-500">
                                                                Exp: <span className="font-mono font-bold">{firstItem.expiry_date ? format(new Date(firstItem.expiry_date), 'dd/MM/yy') : '-'}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">
                                                                Batch: <span className="font-mono">{firstItem.batch_number || '-'}</span>
                                                            </div>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={lou.status === 'sent' ? 'success' : lou.status === 'generated' ? 'info' : 'warning'}>
                                                        {lou.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {isLoading && <LoadingOverlay />}
            </div>
        </FinancialPageLayout>
    )
}
