import React, { useState, useEffect } from 'react'
import {
    AirVent,
    RotateCcw,
    Send,
    Truck,
    Activity,
    History,
    ArrowRight,
    ClipboardList
} from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import {
    Card,
    Button,
    Badge,
    Table,
    Select,
    Input,
    Modal,
    Spinner
} from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import {
    getOxygenSummary,
    getOxygenCylinderInventory,
    getOxygenCylinderSizes,
    getCylinderMovements
} from '@/services/pharmacy/oxygenService'
import type {
    OxygenSummary,
    OxygenCylinderInventoryWithRelations,
    OxygenCylinderSize,
    OxygenCylinderMovementWithRelations
} from '@/types/pharmacy'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/stores/toastStore'


const InventoryDashboard: React.FC = () => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const isSessionReady = useIsSessionReady()
    const navigate = useNavigate()
    const toast = useToast()

    const [summary, setSummary] = useState<OxygenSummary | null>(null)
    const [inventoryList, setInventoryList] = useState<OxygenCylinderInventoryWithRelations[]>([])
    const [sizes, setSizes] = useState<OxygenCylinderSize[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Movements state
    const [selectedCylinder, setSelectedCylinder] = useState<OxygenCylinderInventoryWithRelations | null>(null)
    const [movements, setMovements] = useState<OxygenCylinderMovementWithRelations[]>([])
    const [isMovementsLoading, setIsMovementsLoading] = useState(false)

    // Filters
    const [statusFilter, setStatusFilter] = useState('')
    const [sizeFilter, setSizeFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')



    const loadData = async () => {
        if (!hospitalId) return
        setIsLoading(true)
        try {
            const [summaryRes, sizesRes, invRes] = await Promise.all([
                getOxygenSummary(hospitalId),
                getOxygenCylinderSizes(),
                getOxygenCylinderInventory(hospitalId, { status: statusFilter, size_id: sizeFilter, search: searchQuery }, 1, 50)
            ])

            if (summaryRes.data) setSummary(summaryRes.data)
            if (sizesRes.data) setSizes(sizesRes.data)
            if (invRes.data) setInventoryList(invRes.data.data)
        } catch (err) {
            console.error('Failed to load inventory dashboard data', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!isSessionReady || !hospitalId) return
        void loadData()
    }, [isSessionReady, hospitalId, statusFilter, sizeFilter, searchQuery])

    const viewHistory = async (cylinder: OxygenCylinderInventoryWithRelations) => {
        setSelectedCylinder(cylinder)
        setIsMovementsLoading(true)
        try {
            const res = await getCylinderMovements(cylinder.id)
            setMovements(res.data || [])
        } catch (err) {
            toast.error('Error', 'Failed to load movement history')
        } finally {
            setIsMovementsLoading(false)
        }
    }

    const inventoryColumns = [
        {
            key: 'qr_code',
            label: 'QR Code',
            className: 'font-mono text-[11px] font-black text-slate-900 tracking-tighter uppercase w-32'
        },
        {
            key: 'size_info',
            label: 'Size / Capacity',
            render: (v: any) => v ? (
                <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-xs">{v.code}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{v.capacity}{v.unit}</span>
                </div>
            ) : '-'
        },
        { key: 'type_info', label: 'Type', render: (v: any) => <span className="font-bold text-slate-600 text-xs uppercase italic">{v?.name || '-'}</span> },
        {
            key: 'current_location',
            label: 'Location',
            render: (v: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-tight">{v || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            className: 'text-right',
            render: (v: any) => (
                <Badge className={`font-black tracking-widest text-[9px] px-2 py-0.5 rounded-md border-none ${v === 'available' ? 'bg-emerald-100 text-emerald-700' :
                    v === 'issued' ? 'bg-indigo-100 text-indigo-700' :
                        v === 'empty' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-600'
                    }`}>
                    {String(v).toUpperCase()}
                </Badge>
            )
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (_: any, row: any) => (
                <Button variant="ghost" size="sm" onClick={() => viewHistory(row)} className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-tighter">
                    <History className="w-3 h-3 mr-1.5" />
                    Audit
                </Button>
            )
        }
    ]

    return (
        <div className="p-6 space-y-8 bg-slate-50/20 min-h-screen animate-fade-in">
            {/* Government Professional Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                            <AirVent className="w-6 h-6 text-slate-900" />
                        </div>
                        Cylinder Inventory System
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-[11px]">Real-time Tracking & Medical Gas Logistics</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Action Buttons - Compact Professional Style */}

                    {/* New Request Button */}
                    <button
                        onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_REQUEST)}
                        className="group relative flex items-center gap-3 px-4 py-2 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center border border-indigo-100">
                            <ClipboardList className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Action</h3>
                            <p className="text-xs font-black text-slate-900 tracking-tight">Request</p>
                        </div>
                    </button>

                    {/* Phase 01: Issue */}
                    <button
                        onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_ISSUE)}
                        className="group relative flex items-center gap-3 px-4 py-2 bg-slate-900 hover:bg-black border border-slate-900 rounded-xl shadow-md hover:shadow-lg shadow-slate-900/10 transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
                            <Send className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phase 01</h3>
                            <p className="text-xs font-black text-white tracking-tight">Issue</p>
                        </div>
                    </button>

                    {/* Phase 02: Return */}
                    <button
                        onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_RETURN)}
                        className="group relative flex items-center gap-3 px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center border border-emerald-100">
                            <RotateCcw className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Phase 02</h3>
                            <p className="text-xs font-black text-slate-900 tracking-tight">Return</p>
                        </div>
                    </button>

                    {/* Phase 03: Pickup */}
                    <button
                        onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_SUPPLIER_RETURN)}
                        className="group relative flex items-center gap-3 px-4 py-2 bg-white hover:bg-amber-50 border border-amber-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center border border-amber-100">
                            <Truck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Phase 03</h3>
                            <p className="text-xs font-black text-slate-900 tracking-tight">Pickup</p>
                        </div>
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-1" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadData()}
                        className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                        title="Sync Data"
                    >
                        <Activity className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* KPI Section - SLATE 900 THEME */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summary?.inventory_summary?.map((item) => (
                    <Card key={`${item.type_name}-${item.size_code}`} className="p-6 border-slate-200/60 shadow-xl shadow-slate-900/5 bg-white rounded-2xl relative overflow-hidden group hover:border-slate-900 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                            <AirVent className="w-20 h-20 text-slate-950" />
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                    Inventory Category
                                </h3>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                    P101<span className="text-slate-300 mx-2">/</span>{item.size_code}
                                </p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">balance :</span>
                                    <span className="text-xl font-black text-emerald-600 tracking-tight">{item.available}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">empty cylinder :</span>
                                    <span className="text-xl font-black text-rose-600 tracking-tight">{item.empty}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">average usage /month :</span>
                                    <span className="font-black text-slate-800">{item.avg_usage_month}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>



            {/* Inventory Status Table */}
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5 bg-white rounded-2xl flex flex-col">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <h2 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <Activity className="w-4 h-4 text-slate-900" />
                        Comprehensive Registry
                    </h2>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Select
                            value={sizeFilter}
                            onChange={e => setSizeFilter(e.target.value)}
                            options={[{ label: 'ALL SIZES', value: '' }, ...sizes.map(s => ({ label: s.code, value: s.id }))]}
                            className="h-10 text-[10px] font-black uppercase w-36 border-slate-200 bg-white"
                        />
                        <Select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            options={[
                                { label: 'ALL STATUS', value: '' },
                                { label: 'AVAILABLE', value: 'available' },
                                { label: 'ISSUED', value: 'issued' },
                                { label: 'EMPTY', value: 'empty' },
                                { label: 'RETURNED', value: 'returned' },
                            ]}
                            className="h-10 text-[10px] font-black uppercase w-36 border-slate-200 bg-white"
                        />
                        <Input
                            placeholder="SEARCH QR / SERIAL..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="h-10 w-56 text-[10px] font-black bg-white border-slate-200 focus:border-slate-900"
                        />
                    </div>
                </div>
                <Table
                    data={inventoryList}
                    columns={inventoryColumns}
                    isLoading={isLoading}
                    emptyMessage="No matching cylinder records found."
                />
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Registry Version 2.0 (Malaysian Government Protocol)</span>
                    <span>Total Inventory: {summary?.total_cylinders || inventoryList.length} Units</span>
                </div>
            </Card>

            {/* Professional Audit Modal */}
            <Modal
                isOpen={!!selectedCylinder}
                onClose={() => setSelectedCylinder(null)}
                title={`Movement Audit: ${selectedCylinder?.qr_code}`}
                size="lg"
            >
                {isMovementsLoading ? (
                    <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-slate-900" /></div>
                ) : (
                    <div className="space-y-6">
                        {movements.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-4">
                                <History className="w-12 h-12" />
                                <p className="font-black uppercase tracking-widest text-xs">No audit logs found</p>
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8 py-4">
                                {movements.map((move) => (
                                    <div key={move.id} className="relative">
                                        <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-xl bg-slate-900 flex items-center justify-center border-4 border-white shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                                <span>{formatDate(move.moved_at)}</span>
                                                <Badge className="bg-slate-200 text-slate-600 border-none font-black tracking-widest px-2 py-0.5 rounded text-[8px]">
                                                    {move.movement_type.toUpperCase()}
                                                </Badge>
                                            </p>
                                            <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                {move.from_location && <span className="opacity-40">{move.from_location}</span>}
                                                {move.from_location && <ArrowRight className="w-3" />}
                                                <span className="underline decoration-slate-200 underline-offset-4">{move.to_location}</span>
                                                {move.department && <span className="text-indigo-600 text-[10px] ml-1 uppercase">[{move.department.department_name}]</span>}
                                            </h4>
                                            {move.remarks && (
                                                <p className="text-xs text-slate-500 mt-2 font-medium italic border-l-2 border-slate-200 pl-3">
                                                    {move.remarks}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                    {(move.moved_by_user?.full_name || 'U')[0]}
                                                </div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    Processor: <span className="text-slate-900">{move.moved_by_user?.full_name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button onClick={() => setSelectedCylinder(null)} className="bg-slate-900 hover:bg-black text-white font-black px-8">Close Audit View</Button>
                        </div>
                    </div>
                )}
            </Modal>


        </div>
    )
}

export default InventoryDashboard
