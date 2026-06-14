import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import React, { useState, useEffect } from 'react'
import {
    Send,
    RotateCcw,
    Truck,
    ArrowRight,
    Search,
    ChevronRight,
    Building2,
    Warehouse,
    LayoutGrid,
    ChevronDown
} from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import {
    Button,
    Badge,
    Input,
    Modal,
    Spinner
} from '@/components/ui'
import {
    getOxygenSummary,
    getCylinderMovements,
    getOxygenDistribution,
    type LocationInventory
} from '@/services/pharmacy/oxygenService'
import type {
    OxygenSummary,
    OxygenCylinderInventoryWithRelations,
    OxygenCylinderMovementWithRelations
} from '@/types/pharmacy'
import { cn, formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'

interface InventoryItemConfig {
    label: string
    subLabel?: string
    filter: (item: any) => boolean
    icon?: React.ReactNode
    colorTheme?: string
    accentColor?: string
}

const InventoryDashboard: React.FC = () => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const isSessionReady = useIsSessionReady()
    const navigate = useNavigate()

    // Data State
    const [summary, setSummary] = useState<OxygenSummary | null>(null)
    const [locations, setLocations] = useState<LocationInventory[]>([])
    const [isLoadingLocations, setIsLoadingLocations] = useState(false)

    // View & Search
    const [searchQuery, setSearchQuery] = useState('')

    // Drill Down State
    const [selectedLocation, setSelectedLocation] = useState<LocationInventory | null>(null)

    // History & Movements State

    // Movements Modal
    const [selectedCylinder, setSelectedCylinder] = useState<OxygenCylinderInventoryWithRelations | null>(null)
    const [movements, setMovements] = useState<OxygenCylinderMovementWithRelations[]>([])
    const [isMovementsLoading, setIsMovementsLoading] = useState(false)
    const [expandedGridKeys, setExpandedGridKeys] = useState<string[]>([])
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())


    // Initial Data Load
    useEffect(() => {
        if (!isSessionReady || !hospitalId) return
        loadDashboardData()

        // Auto-refresh on window focus
        const handleFocus = () => {
            loadDashboardData()
        }
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [isSessionReady, hospitalId])

    const loadDashboardData = async () => {
        if (isLoadingLocations) return
        setIsLoadingLocations(true)
        try {
            const [sumRes, locRes] = await Promise.all([
                getOxygenSummary(hospitalId!),
                getOxygenDistribution(hospitalId!)
            ])
            if (sumRes.data) setSummary(sumRes.data)
            if (locRes.data) setLocations(locRes.data)
            setLastUpdated(new Date())
        } catch (err) {
            console.error('Failed to load dashboard data', err)
        } finally {
            setIsLoadingLocations(false)
        }
    }


    const toggleRegistryGrid = (key: string) => {
        setExpandedGridKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        )
    }

    const loadCylinderMovements = async (cylinderId: string) => {
        setIsMovementsLoading(true)
        const res = await getCylinderMovements(cylinderId)
        if (res.data) setMovements(res.data)
        setIsMovementsLoading(false)
    }

    useEffect(() => {
        if (selectedCylinder) {
            loadCylinderMovements(selectedCylinder.id)
        } else {
            setMovements([])
        }
    }, [selectedCylinder])

    // Configuration with themes
    const cylinderConfigs: InventoryItemConfig[] = [
        {
            label: 'P101 - D (0.5m³)',
            filter: (i) => i.size_code === 'P101-D',
            accentColor: 'border-l-blue-500'
        },
        {
            label: 'P101 - E (0.7m³)',
            filter: (i) => i.size_code === 'P101-E',
            accentColor: 'border-l-indigo-500'
        },
        {
            label: 'P101 - F (1.4m³)',
            subLabel: 'BULLNOSE',
            filter: (i) => i.size_code === 'P101-F' && (i.type_code === 'BN' || i.type_name?.toLowerCase().includes('bullnose')),
            accentColor: 'border-l-emerald-500'
        },
        {
            label: 'P101 - F (1.4m³)',
            subLabel: 'PIN INDEX',
            filter: (i) => i.size_code === 'P101-F' && (i.type_code === 'PI' || i.type_name?.toLowerCase().includes('pin')),
            accentColor: 'border-l-teal-500'
        },
        {
            label: 'P101 - HS (6.4m³)',
            filter: (i) => i.size_code === 'P101-HS',
            accentColor: 'border-l-amber-500'
        },
        {
            label: '101 - F (1.4m³)',
            subLabel: 'LOAN',
            filter: (i) => i.size_code === '101-F',
            accentColor: 'border-l-cyan-500'
        },
        {
            label: '101 - N (8.0m³)',
            subLabel: 'LOAN',
            filter: (i) => i.size_code === '101-N',
            accentColor: 'border-l-slate-500'
        },
    ]

    const getStatsForConfig = (config: InventoryItemConfig) => {
        const items = summary?.inventory_summary || []
        const matchingItems = items.filter(config.filter)

        const system = matchingItems.reduce((acc, item) => ({
            balance: acc.balance + item.available,
            empty: acc.empty + item.empty,
            issued: acc.issued + item.issued,
            usage: acc.usage + item.avg_usage_month
        }), { balance: 0, empty: 0, issued: 0, usage: 0 })

        let verifiedBalance = 0
        let verifiedEmpty = 0

        locations.forEach(loc => {
            const matching = (loc.cylinders || []).filter(config.filter)
            matching.forEach(c => {
                const isVerified = c.last_reconciled_at && (new Date().getTime() - new Date(c.last_reconciled_at).getTime() < 24 * 60 * 60 * 1000)
                if (isVerified) {
                    if (c.status === 'available') verifiedBalance++
                    if (c.status === 'empty') verifiedEmpty++
                }
            })
        })

        return { ...system, verifiedBalance, verifiedEmpty }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            <span className="hover:text-slate-800 transition-colors cursor-pointer">Pharmacy</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="hover:text-slate-800 transition-colors cursor-pointer">Inventory</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-indigo-600">Distribution</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Oxygen Distribution
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                                Monitor real-time cylinder distribution across hospital wards.
                            </p>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                Last Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                <button
                                    onClick={() => loadDashboardData()}
                                    disabled={isLoadingLocations}
                                    className="p-1 hover:bg-slate-100 rounded-md transition-colors text-indigo-600 disabled:opacity-50"
                                >
                                    <RotateCcw className={cn("w-3 h-3", isLoadingLocations && "animate-spin")} />
                                </button>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_ISSUE)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-200 h-14 px-8 gap-3 rounded-2xl font-black text-lg transition-all hover:-translate-y-1 active:scale-95 border-b-4 border-indigo-800"
                        >
                            <Send className="w-6 h-6" /> Issue Cylinder
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_RETURN)}
                                className="bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-100 h-14 px-6 gap-3 rounded-2xl font-black transition-all hover:-translate-y-1 active:scale-95 border-b-4 border-rose-800"
                            >
                                <RotateCcw className="w-5 h-5" /> Returns
                            </Button>

                            <Button
                                onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_SUPPLIER_RETURN)}
                                className="bg-sky-600 hover:bg-sky-700 text-white shadow-xl shadow-sky-100 h-14 px-6 gap-3 rounded-2xl font-black transition-all hover:-translate-y-1 active:scale-95 border-b-4 border-sky-800"
                            >
                                <Truck className="w-5 h-5" /> Supplier
                            </Button>

                            {/* RECOVERY BUTTON */}
                            <Button
                                onClick={async () => {
                                    if (confirm('Attempt smart recovery of 101-N cylinders from adjustment logs?')) {
                                        const { recoverFromAdjustmentLogs } = await import('@/services/pharmacy/oxygenService')
                                        await recoverFromAdjustmentLogs(hospitalId!)
                                        await loadDashboardData()
                                    }
                                }}
                                className="bg-indigo-900 hover:bg-indigo-950 text-white h-14 px-6 rounded-2xl font-black transition-all border-b-4 border-black"
                            >
                                <RotateCcw className="w-5 h-5" /> Recover Backup
                            </Button>


                        </div>
                    </div>
                </header>

                {/* KPI Overview Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
                    {cylinderConfigs.map((config, idx) => {
                        const stats = getStatsForConfig(config)
                        return (
                            <div key={idx} className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden group ${config.accentColor} border-l-4 hover:-translate-y-1`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <LayoutGrid className="w-8 h-8 text-slate-400" />
                                </div>
                                <div className="flex flex-col mb-6">
                                    <span className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{config.subLabel || 'Standard'}</span>
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight leading-tight">{config.label}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">{stats.balance}</span>
                                        <div className="flex flex-col -mb-1">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">System</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter -mt-1">Ready</span>
                                        </div>
                                        {stats.verifiedBalance > 0 && (
                                            <Badge variant="success" className="ml-auto text-[9px] px-1 py-0">{stats.verifiedBalance} Verified</Badge>
                                        )}
                                    </div>

                                    <div className="flex items-baseline gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <span className="text-2xl font-black text-rose-500 tracking-tighter tabular-nums">{stats.empty}</span>
                                        <div className="flex flex-col -mb-1">
                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter">System</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter -mt-1">Empty</span>
                                        </div>
                                        {stats.verifiedEmpty > 0 && (
                                            <Badge variant="error" className="ml-auto text-[9px] px-1 py-0">{stats.verifiedEmpty} Verified</Badge>
                                        )}
                                    </div>

                                    {stats.issued > 0 && (
                                        <div className="flex items-baseline gap-2 opacity-80 group-hover:opacity-100 transition-opacity pt-2 border-t border-slate-50 border-dashed">
                                            <span className="text-xl font-black text-blue-500 tracking-tighter tabular-nums">{stats.issued}</span>
                                            <div className="flex flex-col -mb-1">
                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Issued</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter -mt-1">At Wards</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 h-1 w-12 bg-slate-100 rounded-full group-hover:w-full group-hover:bg-indigo-100 transition-all duration-500" />
                            </div>
                        )
                    })}
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                            <LayoutGrid className="w-3.5 h-3.5" /> Distribution View
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search location or QR..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {isLoadingLocations ? (
                            [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />)
                        ) : (
                            locations
                                .filter(loc => loc.location_id !== 'Store') // Remove Medical Cylinder Store as requested
                                .map((loc) => {
                                    const verifiedCyls = (loc.cylinders || []).filter(c => c.last_reconciled_at && (new Date().getTime() - new Date(c.last_reconciled_at).getTime() < 24 * 60 * 60 * 1000))
                                    const verifiedCount = verifiedCyls.length
                                    const totalCount = loc.total_cylinders

                                    const percentVerified = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0
                                    return (
                                        <motion.div
                                            key={loc.location_id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={() => setSelectedLocation(loc)}
                                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group hover:-translate-y-1"
                                        >
                                            <div className={`h-1.5 w-full ${loc.type === 'store' ? 'bg-indigo-500' : percentVerified < 100 ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {loc.type === 'store' ? <Warehouse className="w-4 h-4 text-slate-400" /> : <Building2 className="w-4 h-4 text-slate-400" />}
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{loc.type}</span>
                                                        </div>
                                                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{loc.location_name}</h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-2xl font-bold text-slate-900">{totalCount}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase">Stored Assets</span>
                                                        {verifiedCount > 0 && (
                                                            <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                                                                {verifiedCount} Verified
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 mb-6">
                                                    <div className="flex justify-between text-xs font-medium">
                                                        <span className="text-emerald-600">{verifiedCount} Verified</span>
                                                        <span className="text-slate-400">{totalCount - verifiedCount} Pending</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                        <div style={{ width: `${percentVerified}%` }} className="bg-emerald-500 h-full transition-all duration-500" />
                                                    </div>
                                                </div>

                                                {/* Mini List of Cylinders */}
                                                <div className="mt-auto border-t border-slate-100 pt-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Inventory List</p>
                                                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {(loc.cylinders || []).slice(0, 10).map((cyl) => {
                                                            const isVerified = cyl.last_reconciled_at && (new Date().getTime() - new Date(cyl.last_reconciled_at).getTime() < 24 * 60 * 60 * 1000)
                                                            return (
                                                                <div
                                                                    key={cyl.id}
                                                                    className={cn(
                                                                        "flex items-center justify-between group cursor-pointer p-1.5 rounded transition-all",
                                                                        isVerified ? "bg-indigo-50/50 border border-indigo-100/50 shadow-sm" : "hover:bg-slate-50"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={cn(
                                                                            "w-2 h-2 rounded-full",
                                                                            cyl.status === 'available' ? 'bg-emerald-400' :
                                                                                cyl.status === 'empty' ? 'bg-rose-400' : 'bg-amber-400'
                                                                        )} />
                                                                        <div className="flex flex-col">
                                                                            <span className={cn(
                                                                                "text-xs font-mono font-bold tracking-tight",
                                                                                isVerified ? "text-indigo-600" : "text-slate-600 group-hover:text-indigo-600"
                                                                            )}>{cyl.qr_code}</span>
                                                                            <span className="text-[8px] text-slate-400 font-medium truncate max-w-[120px]">
                                                                                {cyl.location || 'Store'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] font-bold text-slate-300">{cyl.size_code}</span>
                                                                        {isVerified && <span className="text-[7px] font-black uppercase text-indigo-400 tracking-tighter">Verified</span>}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        {loc.cylinders && loc.cylinders.length === 0 && (
                                                            <p className="text-xs text-slate-400 italic">No verified cylinders yet</p>
                                                        )}
                                                    </div>
                                                    {(loc.cylinders || []).length > 10 && (
                                                        <div className="text-center mt-2">
                                                            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase">
                                                                + {(loc.cylinders || []).length - 10} More
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })
                        )}
                    </div>
                </div>

                {/* Drill Down Modal: Official Registry View (High Density) */}
                <Modal
                    isOpen={!!selectedLocation}
                    onClose={() => setSelectedLocation(null)}
                    title={selectedLocation ? `Location Inventory Registry: ${selectedLocation.location_name}` : ''}
                    size="full"
                >
                    <div className="space-y-6 py-2">
                        {/* Compact Summary Ribbon */}
                        <div className="flex flex-wrap items-center gap-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="flex items-center gap-4 pr-8 border-r border-slate-200">
                                <Building2 className="w-6 h-6 text-indigo-500" />
                                <span className="text-base font-bold text-slate-800">{selectedLocation?.location_name}</span>
                            </div>
                            <div className="flex items-center gap-12">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Assets:</span>
                                    <span className="text-xl font-black text-slate-900">{selectedLocation?.total_cylinders}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available:</span>
                                    <span className="text-xl font-black text-emerald-600">{selectedLocation?.available_cylinders}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Empty:</span>
                                    <span className="text-xl font-black text-rose-600">{selectedLocation?.empty_cylinders}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">In Use:</span>
                                    <span className="text-xl font-black text-blue-600">{selectedLocation?.issued_cylinders}</span>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Breakdown Table */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="divide-x divide-slate-100">
                                        <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[180px]">Cylinder Size</th>
                                        <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[120px]">Status</th>
                                        <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Registry (IDs)</th>
                                        <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-[120px]">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {selectedLocation?.items.map((item, idx) => {
                                        const avail = selectedLocation.cylinders.filter(c => c.size_code === item.size && c.status === 'available');
                                        const empty = selectedLocation.cylinders.filter(c => c.size_code === item.size && c.status === 'empty');
                                        const issued = selectedLocation.cylinders.filter(c => c.size_code === item.size && c.status === 'issued');
                                        const returned = selectedLocation.cylinders.filter(c => c.size_code === item.size && c.status === 'returned_to_supplier');

                                        const availKey = `${idx}-avail`;
                                        const emptyKey = `${idx}-empty`;
                                        const issuedKey = `${idx}-issued`;
                                        const returnedKey = `${idx}-returned`;

                                        const isAvailExpanded = expandedGridKeys.includes(availKey);
                                        const isEmptyExpanded = expandedGridKeys.includes(emptyKey);
                                        const isIssuedExpanded = expandedGridKeys.includes(issuedKey);
                                        const isReturnedExpanded = expandedGridKeys.includes(returnedKey);

                                        return (
                                            <React.Fragment key={`reg-row-${idx}`}>
                                                {/* Available Row */}
                                                {avail.length > 0 && (
                                                    <>
                                                        <tr className="group hover:bg-emerald-50/10 transition-colors">
                                                            <td className="px-5 py-4 align-top text-sm font-bold text-slate-700">Size {item.size}</td>
                                                            <td className="px-5 py-4 align-top">
                                                                <Badge variant="success" className="text-[11px] px-2 py-0.5 font-bold uppercase">Ready</Badge>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleRegistryGrid(availKey)}
                                                                    className="text-xs font-extrabold text-indigo-600 cursor-pointer flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                                                                >
                                                                    {isAvailExpanded ? 'HIDE' : 'VIEW'} TAGS/IDs ({avail.length})
                                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isAvailExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 align-top text-right text-sm font-black text-slate-900">{avail.length}</td>
                                                        </tr>
                                                        {isAvailExpanded && (
                                                            <tr className="bg-emerald-50/5 border-b border-emerald-100 shadow-inner">
                                                                <td colSpan={4} className="px-6 py-6">
                                                                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
                                                                        {avail.map(cyl => (
                                                                            <div key={cyl.id} className="text-[11px] font-mono py-2 px-1 bg-white border border-emerald-200 rounded-md text-emerald-700 text-center font-extrabold shadow-sm hover:border-emerald-500 hover:ring-1 hover:ring-emerald-100 transition-all cursor-default">
                                                                                {cyl.qr_code}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )}
                                                {/* Empty Row */}
                                                {empty.length > 0 && (
                                                    <>
                                                        <tr className="group hover:bg-rose-50/10 transition-colors bg-rose-50/5">
                                                            <td className="px-5 py-4 align-top text-sm font-bold text-slate-700">Size {item.size}</td>
                                                            <td className="px-5 py-4 align-top">
                                                                <Badge variant="error" className="text-[11px] px-2 py-0.5 font-bold uppercase">Empty</Badge>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleRegistryGrid(emptyKey)}
                                                                    className="text-xs font-extrabold text-rose-500 cursor-pointer flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                                                                >
                                                                    {isEmptyExpanded ? 'HIDE' : 'VIEW'} TAGS/IDs ({empty.length})
                                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isEmptyExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 align-top text-right text-sm font-black text-slate-900">{empty.length}</td>
                                                        </tr>
                                                        {isEmptyExpanded && (
                                                            <tr className="bg-rose-50/5 border-b border-rose-100 shadow-inner">
                                                                <td colSpan={4} className="px-6 py-6">
                                                                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
                                                                        {empty.map(cyl => (
                                                                            <div key={cyl.id} className="text-[11px] font-mono py-2 px-1 bg-white border border-rose-200 rounded-md text-rose-700 text-center font-extrabold shadow-sm italic transition-all hover:border-rose-500 hover:ring-1 hover:ring-rose-100 cursor-default">
                                                                                {cyl.qr_code}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )}

                                                {/* Issued (In Use) Row */}
                                                {issued.length > 0 && (
                                                    <>
                                                        <tr className="group hover:bg-blue-50/10 transition-colors bg-blue-50/5">
                                                            <td className="px-5 py-4 align-top text-sm font-bold text-slate-700">Size {item.size}</td>
                                                            <td className="px-5 py-4 align-top">
                                                                <Badge variant="info" className="text-[11px] px-2 py-0.5 font-bold uppercase">In Use</Badge>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleRegistryGrid(issuedKey)}
                                                                    className="text-xs font-extrabold text-blue-600 cursor-pointer flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                                                                >
                                                                    {isIssuedExpanded ? 'HIDE' : 'VIEW'} TAGS/IDs ({issued.length})
                                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isIssuedExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 align-top text-right text-sm font-black text-slate-900">{issued.length}</td>
                                                        </tr>
                                                        {isIssuedExpanded && (
                                                            <tr className="bg-blue-50/5 border-b border-blue-100 shadow-inner">
                                                                <td colSpan={4} className="px-6 py-6">
                                                                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
                                                                        {issued.map(cyl => (
                                                                            <div key={cyl.id} className="text-[11px] font-mono py-2 px-1 bg-white border border-blue-200 rounded-md text-blue-700 text-center font-extrabold shadow-sm transition-all hover:border-blue-500 hover:ring-1 hover:ring-blue-100 cursor-default">
                                                                                {cyl.qr_code}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )}
                                                {/* Return to Supplier Row */}
                                                {returned.length > 0 && (
                                                    <>
                                                        <tr className="group hover:bg-amber-50/10 transition-colors bg-amber-50/5">
                                                            <td className="px-5 py-4 align-top text-sm font-bold text-slate-700">Size {item.size}</td>
                                                            <td className="px-5 py-4 align-top">
                                                                <Badge variant="warning" className="text-[11px] px-2 py-0.5 font-bold uppercase">Supplier</Badge>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleRegistryGrid(returnedKey)}
                                                                    className="text-xs font-extrabold text-amber-600 cursor-pointer flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                                                                >
                                                                    {isReturnedExpanded ? 'HIDE' : 'VIEW'} TAGS/IDs ({returned.length})
                                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isReturnedExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 align-top text-right text-sm font-black text-slate-900">{returned.length}</td>
                                                        </tr>
                                                        {isReturnedExpanded && (
                                                            <tr className="bg-amber-50/5 border-b border-amber-100 shadow-inner">
                                                                <td colSpan={4} className="px-6 py-6">
                                                                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
                                                                        {returned.map(cyl => (
                                                                            <div key={cyl.id} className="text-[11px] font-mono py-2 px-1 bg-white border border-amber-200 rounded-md text-amber-700 text-center font-extrabold shadow-sm transition-all hover:border-amber-500 hover:ring-1 hover:ring-amber-100 cursor-default">
                                                                                {cyl.qr_code}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>

                {/* Audit Modal (Refined) */}
                <Modal
                    isOpen={!!selectedCylinder}
                    onClose={() => setSelectedCylinder(null)}
                    title={`Audit Trail: ${selectedCylinder?.qr_code}`}
                    size="lg"
                >
                    {isMovementsLoading ? (
                        <div className="py-20 flex justify-center"><Spinner className="w-8 h-8 text-indigo-600" /></div>
                    ) : (
                        <div className="space-y-8 p-1">
                            {/* Header Status */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
                                    <Badge className={`text-sm py-1 px-3 ${selectedCylinder?.status === 'available' ? 'bg-emerald-600 text-white' :
                                        selectedCylinder?.status === 'issued' ? 'bg-indigo-600 text-white' :
                                            'bg-slate-600 text-white'
                                        }`}>
                                        {selectedCylinder?.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedCylinder?.current_location}</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-slate-200">
                                {movements.map((move, idx) => (
                                    <div key={move.id} className="relative">
                                        <div className={`absolute -left-[28px] top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                            {idx === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <div className="group">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xs font-mono font-medium text-slate-500">{formatDate(move.moved_at)}</span>
                                                <Badge variant="gray" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200">
                                                    {move.movement_type}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-slate-700 flex items-center gap-2 mt-1">
                                                <span className="font-medium">{move.from_location}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                                                <span className="font-bold text-slate-900">{move.to_location}</span>
                                            </div>
                                            {move.remarks && (
                                                <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">{move.remarks}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {(move.moved_by_user?.full_name || 'Sys').substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-xs text-slate-400">{move.moved_by_user?.full_name || 'System'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal>
            </div >
        </div >
    )
}

export default InventoryDashboard
