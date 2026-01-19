import React, { useState, useEffect } from 'react'
import {
    Printer,
    Truck,
    CheckCircle2,
    QrCode,
    Search,
    ArrowRight,
    Activity
} from 'lucide-react'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authStore'
import {
    Button,
    Card,
    Table,
    Badge,
    Input
} from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { QRScanner } from '@/components/medical-oxygen/QRScanner'
import { getOxygenCylinderInventory, updateCylinderStatus } from '@/services/pharmacy/oxygenService'
import { generateSupplierReturnPDF } from '@/services/pharmacy/SupplierReturnPDF'

export const SupplierReturn: React.FC = () => {
    const { user } = useAuthStore()

    // Step Logic
    const [returnStep, setReturnStep] = useState<'info' | 'selection'>('info')
    const [returnForm, setReturnForm] = useState({
        vendor_name: 'LINDE EOX SDN BHD (CAW. MIRI)',
        return_date: new Date().toISOString()
    })

    const [emptyCylinders, setEmptyCylinders] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [recentReturns, setRecentReturns] = useState<any[]>([])
    const toast = useToast()

    useEffect(() => {
        if (user?.hospital_id) {
            if (returnStep === 'selection') {
                loadEmptyCylinders()
            }
            void loadReturnHistory()
        }
    }, [user?.hospital_id, returnStep])

    const loadReturnHistory = async () => {
        if (!user?.hospital_id) return
        try {
            // Fetch movements of type 'sent_to_supplier'
            const { data, error } = await supabase
                .from('pharmacy_oxygen_cylinder_movements')
                .select(`
                    id, 
                    moved_at, 
                    to_location,
                    remarks,
                    cylinder:pharmacy_oxygen_cylinder_inventory(
                        qr_code,
                        size:pharmacy_oxygen_cylinder_sizes(code)
                    )
                `)
                .eq('hospital_id', user.hospital_id)
                .eq('movement_type', 'sent_to_supplier')
                .order('moved_at', { ascending: false })
                .limit(100)

            if (error) throw error

            // Group by batch (approximate time window of 1 min and same remarks)
            if (data) {
                const groups: any[] = []
                data.forEach((move: any) => {
                    const time = new Date(move.moved_at).getTime()
                    // Find existing group within 60 seconds diff and same remarks
                    const existing = groups.find(g =>
                        Math.abs(new Date(g.date).getTime() - time) < 60000 &&
                        g.remarks === move.remarks
                    )

                    const sizeCode = move.cylinder?.size?.code || 'Unknown'

                    if (existing) {
                        existing.qty++
                        if (!existing.sizes[sizeCode]) existing.sizes[sizeCode] = 0
                        existing.sizes[sizeCode]++
                    } else {
                        groups.push({
                            id: move.id, // use first ID as key
                            date: move.moved_at,
                            remarks: move.remarks,
                            qty: 1,
                            sizes: { [sizeCode]: 1 }
                        })
                    }
                })
                setRecentReturns(groups)
            }
        } catch (e) {
            console.error('Failed to load return history', e)
        }
    }

    const loadEmptyCylinders = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)
        const res = await getOxygenCylinderInventory(
            user.hospital_id,
            { status: 'empty' },
            1,
            500
        )
        if (res.data) setEmptyCylinders(res.data.data)
        setIsLoading(false)
    }

    const handleProceedToSelection = () => {
        if (!returnForm.vendor_name) {
            toast.error('Required', 'Please select vendor')
            return
        }
        setReturnStep('selection')
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const handleScan = async (qr: string) => {
        const cyl = emptyCylinders.find(c => c.qr_code.toUpperCase() === qr.toUpperCase())
        if (cyl) {
            if (selectedIds.has(cyl.id)) {
                toast.error('Duplicate', 'Already in manifest')
            } else {
                toggleSelection(cyl.id)
                toast.success('Added', `${qr} added to manifest`)
            }
        } else {
            toast.error('Invalid Unit', 'Cylinder not found in EMPTY inventory')
        }
        setIsScannerOpen(false)
    }

    const selectAll = () => {
        if (selectedIds.size === filteredCylinders.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredCylinders.map(c => c.id)))
        }
    }

    const filteredCylinders = emptyCylinders.filter(c =>
        c.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleProcessReturn = async () => {
        if (!user?.hospital_id || !user?.id || selectedIds.size === 0) return

        setIsProcessing(true)
        const selectedItems = emptyCylinders.filter(c => selectedIds.has(c.id))

        try {
            for (const cyl of selectedItems) {
                await updateCylinderStatus(
                    user.hospital_id,
                    cyl.id,
                    'returned',
                    'Supplier',
                    user.id,
                    `Returned to ${returnForm.vendor_name}`
                )
            }

            generateSupplierReturnPDF(selectedItems, returnForm, user)

            toast.success('Registry Updated', `${selectedItems.length} units marked as RETURNED.`)
            setReturnStep('info')
            setSelectedIds(new Set())
            // Refresh history after return
            void loadReturnHistory()
        } catch (e) {
            toast.error('Sync Error', 'Failed to update registry units')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="p-6 space-y-8 bg-slate-50/20 min-h-screen animate-fade-in">
            {/* Government Professional Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                            <Truck className="w-6 h-6 text-slate-900" />
                        </div>
                        Return to Supplier
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-[11px]">Vendor Pickup & Status Archiving Protocol</p>
                </div>
                {returnStep === 'selection' && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            setReturnStep('info')
                            setSelectedIds(new Set())
                        }}
                        className="border-slate-300 text-slate-700 font-black h-11 px-6 rounded-xl hover:bg-slate-50"
                    >
                        Back to Protocol
                    </Button>
                )}
            </div>

            {returnStep === 'info' ? (
                /* STEP 1: FORMAL VENDOR DATA ENTRY */
                <div className="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-10 border-slate-200/60 shadow-2xl shadow-slate-900/5 bg-white rounded-[2rem] space-y-10">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-slate-200 transform -rotate-6">
                                <Truck className="w-10 h-10" />
                            </div>
                            <div className="pt-4">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Initiate Vendor Return</h2>
                                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Official Logistics Documentation</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Vendor / Supplier</label>
                                <Input
                                    value={returnForm.vendor_name}
                                    onChange={e => setReturnForm(p => ({ ...p, vendor_name: e.target.value }))}
                                    className="h-16 font-black border-slate-200 bg-slate-50/30 rounded-2xl focus:border-slate-900 px-6 text-sm uppercase tracking-tight"
                                    disabled
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleProceedToSelection}
                            className="w-full bg-slate-900 hover:bg-black text-white h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-200 group"
                        >
                            Proceed to Unit Selection
                            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Card>
                </div>
            ) : (
                /* STEP 2: INVENTORY SELECTION & MANIFEST */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Manifest Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-8 border-slate-200/60 shadow-xl shadow-slate-900/5 bg-white rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                <Truck className="w-24 h-24 text-slate-900" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Returning To</h3>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase">{returnForm.vendor_name}</p>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Items Selected</h3>
                                        <p className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{selectedIds.size}</p>
                                    </div>
                                    <Button
                                        onClick={() => setIsScannerOpen(true)}
                                        className="h-12 w-12 rounded-xl bg-slate-900 text-white shadow-lg hover:bg-black"
                                    >
                                        <QrCode className="w-6 h-6" />
                                    </Button>
                                </div>

                                <Button
                                    className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 ${selectedIds.size > 0
                                        ? 'bg-slate-900 text-white hover:bg-black shadow-xl'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border-none'
                                        }`}
                                    onClick={handleProcessReturn}
                                    disabled={isProcessing || selectedIds.size === 0}
                                    isLoading={isProcessing}
                                >
                                    Confirm & Print Manifest
                                    <Printer className="w-4 h-4 ml-3" />
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-6 border-slate-200 bg-white/50 rounded-2xl">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Protocol Note</h3>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
                                All selected cylinders will be archived as <span className="text-slate-900 underline">RETURNED</span>. This protocol is irreversible without administrative clearance.
                            </p>
                        </Card>
                    </div>

                    {/* Inventory Table Area */}
                    <Card className="lg:col-span-3 overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5 bg-white rounded-3xl flex flex-col min-h-[600px]">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="SEARCH BY QR OR SERIAL..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 border-slate-100 bg-slate-50/50 focus:border-slate-900 rounded-xl font-black text-xs tracking-tight placeholder:text-slate-300 uppercase"
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    placeholder="SCAN / TYPE QR..."
                                    className="h-12 w-64 border-slate-100 bg-slate-50/50 focus:border-slate-900 rounded-xl font-black text-xs tracking-tight placeholder:text-slate-300 uppercase px-4"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value
                                            if (val) {
                                                handleScan(val)
                                                e.currentTarget.value = ''
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectAll}
                                className="text-slate-400 font-black hover:text-slate-900 h-12 px-6 rounded-xl uppercase text-[10px] tracking-widest whitespace-nowrap"
                            >
                                {selectedIds.size === filteredCylinders.length ? 'Deselect All' : 'Select All Available'}
                            </Button>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <Table
                                isLoading={isLoading}
                                data={filteredCylinders}
                                columns={[
                                    {
                                        key: 'select',
                                        label: '',
                                        render: (_: any, row: any) => (
                                            <div
                                                onClick={() => toggleSelection(row.id)}
                                                className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.has(row.id)
                                                    ? 'bg-slate-900 border-slate-900 text-white'
                                                    : 'border-slate-200 hover:border-slate-400 bg-white'
                                                    }`}
                                            >
                                                {selectedIds.has(row.id) && <CheckCircle2 className="w-5 h-5" />}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'qr_code',
                                        label: 'MANIFEST CODE',
                                        render: (v) => <span className="font-mono font-black text-slate-900 text-sm tracking-tighter uppercase">{v}</span>
                                    },
                                    {
                                        key: 'serial_number',
                                        label: 'SERIAL NO.',
                                        render: (v) => <span className="font-black text-slate-500 text-xs">{v || 'NOT REGISTERED'}</span>
                                    },
                                    {
                                        key: 'size_info',
                                        label: 'SIZE',
                                        render: (v: any) => <Badge className="bg-slate-100 text-slate-900 border-none font-black text-[10px] px-3 py-1">{v?.code || 'N/A'}</Badge>
                                    },
                                    {
                                        key: 'status',
                                        label: 'STATE',
                                        render: () => <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] tracking-widest px-3 py-1">EMPTY</Badge>
                                    }
                                ]}
                                emptyMessage="No EMPTY cylinders available for return protocol."
                            />
                        </div>
                    </Card>
                </div>
            )}

            {isScannerOpen && (
                <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
            )}

            {/* RECENT RETURNS HISTORY TABLE */}
            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5 bg-white rounded-3xl">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h2 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <Activity className="w-4 h-4 text-slate-900" />
                        Recent Logistics Manifests
                    </h2>
                </div>
                <Table
                    data={recentReturns}
                    columns={[
                        {
                            key: 'date',
                            label: 'DATE / TIME',
                            render: (v) => <span className="text-[11px] font-black text-slate-500 uppercase">{new Date(v).toLocaleString('en-GB')}</span>
                        },
                        {
                            key: 'sizes',
                            label: 'OXYGEN TYPE SUMMARY',
                            render: (v) => (
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(v).map(([code, count]) => (
                                        <Badge key={code} className="bg-white border border-slate-200 text-slate-700 font-black text-[10px] px-2 py-0.5">
                                            {code}: {String(count)}
                                        </Badge>
                                    ))}
                                </div>
                            )
                        },
                        {
                            key: 'qty',
                            label: 'QUANTITY',
                            render: (v) => <span className="text-sm font-black text-slate-900">{v}</span>
                        },
                        {
                            key: 'remarks',
                            label: 'LOGISTICS DETAILS',
                            render: (v) => <span className="text-[10px] text-slate-400 font-bold uppercase italic">{v || '-'}</span>
                        }
                    ]}
                    emptyMessage="No recent return records found in registry."
                />
            </Card>
        </div>
    )
}

export default SupplierReturn
