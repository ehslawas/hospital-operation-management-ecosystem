import React, { useState, useEffect } from 'react'
import {
    Activity,
    Search,
    History,
    RefreshCw,
    MapPin,
    Building2,
    ArrowRight,
    FileText,
    CheckCircle2,
    AlertCircle,
    Box,
    QrCode,
    Trash2,
    Users
} from 'lucide-react'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Button,
    Input,
    Badge,
    Table,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { QRScanner } from '@/components/medical-oxygen/QRScanner'
import {
    getStockSummaryByStatus,
    adjustCylinderStatus,
    bulkAdjustCylinderStatus,
    getAdjustmentHistory,
    type CylinderStockSummary
} from '@/services/pharmacy/oxygenReconciliationService'
import { findCylinderByQR } from '@/services/pharmacy/oxygenService'
import { getDepartmentsByHospital } from '@/services/departmentService'
import type { OxygenCylinderInventoryWithRelations } from '@/types/pharmacy'
import type { Department } from '@/types'
import { cn } from '@/lib/utils'

const StockReconciliation: React.FC = () => {
    const { user } = useAuthStore()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('adjust')
    const [stats, setStats] = useState<CylinderStockSummary[]>([])
    const [departments, setDepartments] = useState<Department[]>([])

    // Mode State
    const [isBulkMode, setIsBulkMode] = useState(false)

    // Selection/Staging State
    const [searchQuery, setSearchQuery] = useState('')
    const [foundCylinder, setFoundCylinder] = useState<OxygenCylinderInventoryWithRelations | null>(null)
    const [stagedCylinders, setStagedCylinders] = useState<OxygenCylinderInventoryWithRelations[]>([])

    // Adjustment Input State
    const [adjustmentReason, setAdjustmentReason] = useState('')
    const [newStatus, setNewStatus] = useState('')
    const [newLocation, setNewLocation] = useState('')
    const [newDepartmentId, setNewDepartmentId] = useState('')

    // UI State
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // History State
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        loadStats()
        loadDepartments()
        if (activeTab === 'history') loadHistory()
    }, [activeTab, user?.hospital_id])

    const loadDepartments = async () => {
        if (!user?.hospital_id) return
        const depts = await getDepartmentsByHospital(user.hospital_id)
        setDepartments(depts)
    }

    const loadStats = async () => {
        if (!user?.hospital_id) return
        const res = await getStockSummaryByStatus(user.hospital_id)
        if (!res.error && res.data) setStats(res.data)
    }

    const loadHistory = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)
        const res = await getAdjustmentHistory(user.hospital_id)
        if (!res.error && res.data) setHistory(res.data.data)
        setIsLoading(false)
    }

    const handleSearch = async (codeToSearch?: string) => {
        const query = codeToSearch || searchQuery
        if (!query || !user?.hospital_id) return

        setIsLoading(true)
        const res = await findCylinderByQR(user.hospital_id, query)

        if (!res.error && res.data) {
            if (isBulkMode) {
                // Check if already staged
                if (stagedCylinders.some(c => c.id === res.data!.id)) {
                    toast.error('Duplicate', 'This cylinder is already in the list.')
                } else {
                    setStagedCylinders([...stagedCylinders, res.data])
                    toast.success('Added', `Cylinder ${res.data.serial_number || res.data.qr_code} added to list.`)
                }
                setSearchQuery('')
            } else {
                setFoundCylinder(res.data)
                setNewStatus(res.data.status)
                setNewLocation(res.data.current_location || '')
                setNewDepartmentId(res.data.department_id || '')
                setSearchQuery('')
            }
        } else {
            toast.error('Not Found', 'No cylinder matching that ID was found.')
            if (!isBulkMode) setFoundCylinder(null)
        }
        setIsLoading(false)
    }

    const removeFromStaging = (id: string) => {
        setStagedCylinders(stagedCylinders.filter(c => c.id !== id))
    }

    const clearSelection = () => {
        setFoundCylinder(null)
        setStagedCylinders([])
        setNewStatus('')
        setNewLocation('')
        setNewDepartmentId('')
        setAdjustmentReason('')
    }

    const handleSubmitAdjustment = async () => {
        if (!user?.hospital_id || !user?.id) return

        const hasSelection = isBulkMode ? stagedCylinders.length > 0 : foundCylinder !== null
        if (!hasSelection) return

        setIsSubmitting(true)

        let res;
        if (isBulkMode) {
            res = await bulkAdjustCylinderStatus(
                user.hospital_id,
                stagedCylinders.map(c => c.id),
                newStatus,
                adjustmentReason,
                `Bulk Update: Location=${newLocation || 'N/A'}, Dept=${newDepartmentId || 'N/A'}`,
                user.id,
                stagedCylinders.map(c => ({ id: c.id, status: c.status })),
                newLocation || undefined,
                newDepartmentId === 'none' ? null : (newDepartmentId || undefined)
            )
        } else {
            res = await adjustCylinderStatus(
                user.hospital_id,
                foundCylinder!.id,
                newStatus,
                adjustmentReason,
                `Manual Reconciliation: Location=${newLocation || 'N/A'}, Dept=${newDepartmentId || 'N/A'}`,
                user.id,
                foundCylinder!.status,
                newLocation || undefined,
                newDepartmentId === 'none' ? null : (newDepartmentId || undefined)
            )
        }

        if (!res.error) {
            toast.success('Success', isBulkMode ? `${stagedCylinders.length} cylinders updated.` : 'Cylinder updated successfully.')
            clearSelection()
            setSearchQuery('')
            loadStats()
            if (activeTab === 'history') loadHistory()
        } else {
            toast.error('Failed', res.error || 'Update failed')
        }
        setIsSubmitting(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'issued': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'empty': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'damaged': return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'returned_to_supplier': return 'bg-slate-100 text-slate-700 border-slate-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-4 border-b pb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 md:gap-3">
                            <RefreshCw className="h-5 w-5 md:h-8 md:w-8 text-blue-600 animate-spin-slow shrink-0" />
                            <span className="truncate">Reconciliation</span>
                        </h1>
                        <p className="hidden xs:block text-slate-500 mt-1 font-medium text-xs md:text-base">Oxygen Cylinder Management</p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border shrink-0">
                        <Button
                            variant={!isBulkMode ? "secondary" : "ghost"}
                            className={cn("rounded-md px-2 md:px-4 h-8 md:h-9 text-xs md:text-sm shadow-sm transition-all", !isBulkMode ? "bg-white text-blue-600" : "text-slate-600")}
                            onClick={() => { setIsBulkMode(false); clearSelection(); }}
                        >
                            Single
                        </Button>
                        <Button
                            variant={isBulkMode ? "secondary" : "ghost"}
                            className={cn("rounded-md px-2 md:px-4 h-8 md:h-9 text-xs md:text-sm shadow-sm transition-all", isBulkMode ? "bg-white text-blue-600" : "text-slate-600")}
                            onClick={() => { setIsBulkMode(true); clearSelection(); }}
                        >
                            Bulk
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                    <TabsList className="bg-slate-100/80 p-1 border h-11 w-max sm:w-auto min-w-full sm:min-w-0 flex whitespace-nowrap">
                        <TabsTrigger value="adjust" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 px-3 md:px-6 h-9 flex-1 sm:flex-none text-xs md:text-sm">
                            <Activity className="h-4 w-4" />
                            Adjustment
                        </TabsTrigger>
                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 px-3 md:px-6 h-9 flex-1 sm:flex-none text-xs md:text-sm">
                            <Box className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 px-3 md:px-6 h-9 flex-1 sm:flex-none text-xs md:text-sm">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="adjust" className="space-y-2 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: IDENTIFICATION & STAGING */}
                        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                <CardHeader className="bg-slate-50/50 border-b pb-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                                                <QrCode className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <span className="truncate">{isBulkMode ? "Bulk Scanning" : "Step 1: Identify Cylinder"}</span>
                                        </CardTitle>
                                        <Badge variant="gray" className="bg-white font-medium text-slate-500 border-slate-200 w-fit">
                                            {isBulkMode ? "Continuous Mode" : "Precise Selection"}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {isBulkMode
                                            ? "Scan multiple cylinders to apply changes in one go."
                                            : "Scan OR enter Serial Number/QR Code to fetch details."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="relative flex flex-col gap-3 group">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <Input
                                                placeholder={isBulkMode ? "Scan next cylinder..." : "Enter ID or S/N..."}
                                                className="pl-10 h-14 sm:pr-[260px] bg-slate-50 border-slate-200 rounded-xl text-lg focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm w-full"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSearch()
                                                }}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:absolute sm:right-2 sm:inset-y-2 z-20">
                                            <Button
                                                onClick={() => setIsScannerOpen(true)}
                                                variant="outline"
                                                className="h-12 sm:h-10 rounded-xl px-4 border-slate-200 hover:bg-white hover:border-blue-300 transition-all text-blue-600 font-semibold flex items-center justify-center gap-2 shadow-sm bg-white/50 backdrop-blur-sm sm:bg-white"
                                            >
                                                <QrCode className="h-5 w-5" />
                                                <span className="sm:hidden lg:inline">Scanner</span>
                                            </Button>
                                            <Button
                                                onClick={() => handleSearch()}
                                                className="h-12 sm:h-10 rounded-xl px-8 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all text-white font-bold flex items-center justify-center gap-2"
                                                disabled={isLoading || !searchQuery}
                                            >
                                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-5 w-5" />}
                                                <span>Find</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Found/Staged List UI */}
                                    {isBulkMode ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    Staging List
                                                    <Badge variant="primary" className="rounded-full px-2 py-0 text-xs">
                                                        {stagedCylinders.length}
                                                    </Badge>
                                                </h3>
                                                {stagedCylinders.length > 0 && (
                                                    <Button variant="ghost" size="sm" onClick={() => setStagedCylinders([])} className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                        Clear All
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                                {stagedCylinders.map((cyl) => (
                                                    <div key={cyl.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-all group/item">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                                <Box className="h-4 w-4 text-blue-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 leading-none">
                                                                    {cyl.serial_number || 'No Serial'}
                                                                </p>
                                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                                    {cyl.qr_code}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFromStaging(cyl.id)}
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {stagedCylinders.length === 0 && (
                                                    <div className="col-span-full py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                                                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                                            <Box className="h-6 w-6 text-slate-300" />
                                                        </div>
                                                        <p className="text-slate-400 text-sm font-medium">No cylinders staged yet.</p>
                                                        <p className="text-slate-300 text-xs mt-1">Scan or find cylinders to add them here.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        foundCylinder ? (
                                            <div className="bg-white border rounded-2xl p-5 shadow-sm border-emerald-100 bg-emerald-50/10 animate-in zoom-in-95 duration-300 relative">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2 h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                                                    onClick={() => clearSelection()}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">Identity</Label>
                                                        <p className="font-bold text-slate-900 truncate">S/N: {foundCylinder.serial_number || 'N/A'}</p>
                                                        <p className="text-sm text-slate-500 font-mono mt-0.5">{foundCylinder.qr_code}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">Specification</Label>
                                                        <p className="text-sm font-semibold text-slate-700">{foundCylinder.type_info?.name} ({foundCylinder.type_info?.code})</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{foundCylinder.size_info?.capacity}m³ {foundCylinder.size_info?.code}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">Current Status</Label>
                                                        <Badge className={cn("rounded-md px-2 py-0.5 border text-[11px] font-bold shadow-none", getStatusColor(foundCylinder.status))}>
                                                            {foundCylinder.status.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-emerald-100/50">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-9 w-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                            <MapPin className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Current Location</Label>
                                                            <p className="text-sm font-bold text-slate-700">{foundCylinder.current_location || 'Not Specified'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-9 w-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                            <Building2 className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">Current Department</Label>
                                                            <p className="text-sm font-bold text-slate-700">{(foundCylinder as any).department?.department_name || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-16 px-4 flex flex-col items-center justify-center text-center opacity-40">
                                                <Search className="h-16 w-16 text-slate-200 mb-4" />
                                                <p className="text-lg font-medium text-slate-500">Wait for Cylinder Identification</p>
                                                <p className="text-sm text-slate-400 max-w-xs mt-2">Scan or search for a cylinder to begin the reconciliation process.</p>
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: ACTION PANEL */}
                        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                            <Card className={cn(
                                "border-slate-200 shadow-xl transition-all duration-300 relative",
                                (isBulkMode ? stagedCylinders.length === 0 : !foundCylinder) ? "opacity-60 grayscale-[0.5]" : "opacity-100 shadow-blue-200/40 border-blue-200"
                            )}>
                                {(isBulkMode ? stagedCylinders.length === 0 : !foundCylinder) && (
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-6 rounded-2xl">
                                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-semibold">Action Required</p>
                                        <p className="text-sm text-slate-400 px-8 mt-1 italic">Identify {isBulkMode ? "cylinders" : "a cylinder"} first to unlock the update panel.</p>
                                    </div>
                                )}
                                <CardHeader className="border-b pb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        {isBulkMode ? `Update (${stagedCylinders.length}) Cylinders` : "Step 2: Update Information"}
                                    </CardTitle>
                                    <CardDescription>Select the new status and location details below.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Status Selection */}
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Update Cylinder Status</Label>
                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                                            {['available', 'issued', 'empty', 'damaged', 'returned_to_supplier'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setNewStatus(status)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all group",
                                                        newStatus === status
                                                            ? "border-blue-500 bg-blue-50/50 shadow-inner"
                                                            : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-tighter mb-1",
                                                        newStatus === status ? "text-blue-600" : "text-slate-400"
                                                    )}>
                                                        {status.replace(/_/g, ' ')}
                                                    </span>
                                                    {newStatus === status && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Location & Department */}
                                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin className="h-3 w-3" />
                                                New Current Location
                                            </Label>
                                            <Input
                                                placeholder="e.g. Storage Area B, Rack 4..."
                                                className="bg-slate-50 border-slate-200 focus:bg-white rounded-lg h-10 border-transparent transition-all border-dashed"
                                                value={newLocation}
                                                onChange={(e) => setNewLocation(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Building2 className="h-3 w-3" />
                                                Assign to Department
                                            </Label>
                                            <Select value={newDepartmentId} onValueChange={setNewDepartmentId}>
                                                <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white rounded-lg h-10 border-transparent transition-all border-dashed">
                                                    <SelectValue placeholder="Select Department (Optional)" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px]">
                                                    <SelectItem value="none" className="text-slate-400 italic">No Department / Clear</SelectItem>
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.id} value={dept.id}>
                                                            {dept.department_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="h-3 w-3" />
                                            Reason for Adjustment
                                        </Label>
                                        <Input
                                            placeholder="Stock count mismatch, received from supplier, etc."
                                            className="bg-slate-50 border-slate-200 focus:bg-white rounded-lg h-11"
                                            value={adjustmentReason}
                                            onChange={(e) => setAdjustmentReason(e.target.value)}
                                        />
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-4 flex gap-3">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 rounded-xl h-12 font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                            onClick={() => clearSelection()}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-[2] rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold group"
                                            disabled={isSubmitting || !newStatus || !adjustmentReason}
                                            onClick={handleSubmitAdjustment}
                                        >
                                            {isSubmitting ? (
                                                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                <CheckCircle2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                            )}
                                            {isBulkMode ? `Confirm Update (x${stagedCylinders.length})` : "Confirm Update"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {['available', 'issued', 'empty', 'damaged', 'returned_to_supplier'].map((status) => {
                            const stat = stats.find(s => s.status === status)
                            return (
                                <Card key={status} className="border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className={cn("h-1.5", getStatusColor(status).split(' ')[0])} />
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-2 text-slate-500 font-semibold text-[11px] uppercase tracking-widest">
                                            {status.replace(/_/g, ' ')}
                                            <div className={cn("h-2 w-2 rounded-full", getStatusColor(status).split(' ')[0])} />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-extrabold text-slate-900 leading-none">{stat?.count || 0}</span>
                                            <span className="text-xs text-slate-400 font-medium pb-1">Units</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-slate-200 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">Adjustment History</CardTitle>
                            <CardDescription>Showing the latest {history.length} audit entries.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <thead className="bg-slate-50/50">
                                        <tr className="border-b">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">Date & Time</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">Cylinder</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">Change</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">Reason</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">Performed By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {history.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-slate-900">{new Date(item.created_at).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(item.created_at).toLocaleTimeString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Box className="h-4 w-4 text-blue-500" />
                                                        <span className="text-sm font-bold text-slate-700">{item.cylinder?.serial_number || item.cylinder?.qr_code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="gray" className={cn("text-[10px] px-1.5 py-0 h-5", getStatusColor(item.old_status))}>
                                                            {item.old_status}
                                                        </Badge>
                                                        <ArrowRight className="h-3 w-3 text-slate-300" />
                                                        <Badge variant="gray" className={cn("text-[10px] px-1.5 py-0 h-5", getStatusColor(item.new_status))}>
                                                            {item.new_status}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 line-clamp-1 italic">"{item.reason}"</p>
                                                    {item.remarks && <p className="text-[10px] text-slate-400 mt-0.5">{item.remarks}</p>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center border border-white">
                                                            <Users className="h-3 w-3 text-slate-500" />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{item.adjuster?.full_name || 'System'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-30">
                                                        <History className="h-12 w-12 text-slate-300 mb-3" />
                                                        <p className="text-slate-500 font-medium">No adjustment records found.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {isScannerOpen && (
                <QRScanner
                    onScan={(code) => {
                        handleSearch(code)
                        if (!isBulkMode) setIsScannerOpen(false)
                    }}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    )
}

export default StockReconciliation
