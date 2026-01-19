import React, { useEffect, useState } from 'react'
import {
    ClipboardList,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    ArrowRight,
    Trash2,
    Printer,
    Edit2
} from 'lucide-react'
import {
    Badge,
    Button,
    Card,
    Table,
    Modal,
    Select,
    Input
} from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import {
    getDeptRequests,
    createDeptRequest,
    updateDeptRequest,
    getCylinderBalance,
    type OxygenDeptRequestWithRelations,
    type CylinderBalance
} from '@/services/pharmacy/oxygenDepartmentService'
import { getOxygenCylinderSizes } from '@/services/pharmacy/oxygenService'
import { formatDate } from '@/lib/utils'
import type { Department } from '@/types'
import type { OxygenCylinderSize } from '@/types/pharmacy'
import { supabase } from '@/services/supabase'
import { generateRequestForm } from '@/lib/pdf/generateRequestForm'

export const CylinderRequestPage: React.FC = () => {
    const { user } = useAuthStore()
    const toast = useToast()

    // State
    const [requests, setRequests] = useState<OxygenDeptRequestWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    // Master Data
    const [sizes, setSizes] = useState<OxygenCylinderSize[]>([])
    const [departments, setDepartments] = useState<Department[]>([])

    // Create/Edit Request Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null)

    // Multi-Item Form State
    const [departmentId, setDepartmentId] = useState('')
    const [requestItems, setRequestItems] = useState<{ id: string; cylinder_size_id: string; quantity: number }[]>([
        { id: '1', cylinder_size_id: '', quantity: 1 }
    ])

    // Balance Cache for multiple items
    const [balances, setBalances] = useState<Record<string, CylinderBalance>>({})

    // Load master data
    useEffect(() => {
        const loadMasterData = async () => {
            const [sizesRes, deptsRes] = await Promise.all([
                getOxygenCylinderSizes(),
                supabase.from('departments').select('*').eq('hospital_id', user?.hospital_id || '')
            ])
            setSizes(sizesRes.data || [])
            setDepartments(deptsRes.data || [])
        }
        if (user?.hospital_id) void loadMasterData()
    }, [user?.hospital_id])

    // Load requests
    useEffect(() => {
        loadRequests()
    }, [user?.hospital_id, page])

    const loadRequests = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)
        const res = await getDeptRequests(user.hospital_id, {}, page, 10)
        if (res.data) {
            setRequests(res.data.data)
            setTotal(res.data.total)
        }
        setIsLoading(false)
    }

    // Load balance for a specific item
    const checkBalance = async (sizeId: string) => {
        if (!user?.hospital_id || !sizeId || balances[sizeId]) return

        const res = await getCylinderBalance(user.hospital_id, sizeId)
        if (res.data) {
            setBalances(prev => ({ ...prev, [sizeId]: res.data! }))
        }
    }

    const updateItem = (id: string, field: 'cylinder_size_id' | 'quantity', value: any) => {
        setRequestItems(prev => prev.map(item => {
            if (item.id === id) {
                if (field === 'cylinder_size_id') checkBalance(value)
                return { ...item, [field]: value }
            }
            return item
        }))
    }

    const handleAddItem = () => {
        setRequestItems(prev => [...prev, { id: Date.now().toString(), cylinder_size_id: '', quantity: 1 }])
    }

    const handleRemoveItem = (id: string) => {
        if (requestItems.length === 1) return
        setRequestItems(prev => prev.filter(item => item.id !== id))
    }

    const handleEdit = (request: OxygenDeptRequestWithRelations) => {
        setEditingRequestId(request.id)
        setDepartmentId(request.department_id)
        setRequestItems(request.items.map(item => ({
            id: item.id,
            cylinder_size_id: item.cylinder_size_id,
            quantity: item.quantity
        })))
        setIsCreateModalOpen(true)
    }

    const handleCreateRequest = async () => {
        if (!departmentId) {
            toast.error('Department is required')
            return
        }

        const validItems = requestItems.filter(i => i.cylinder_size_id && i.quantity > 0)
        if (validItems.length === 0) {
            toast.error('At least one valid cylinder must be selected')
            return
        }

        setIsCreating(true)
        try {
            let res
            if (editingRequestId) {
                res = await updateDeptRequest(editingRequestId, {
                    department_id: departmentId,
                    items: validItems
                })
            } else {
                res = await createDeptRequest(user?.hospital_id || '', {
                    department_id: departmentId,
                    requested_by: user?.id || '',
                    items: validItems
                })
            }

            if (res.error) throw new Error(res.error)

            toast.success(editingRequestId ? 'Request updated successfully' : 'Request submitted successfully')
            setIsCreateModalOpen(false)
            setDepartmentId('')
            setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
            setEditingRequestId(null)
            loadRequests()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save request')
        }
        setIsCreating(false)
    }

    const handlePrint = (request: OxygenDeptRequestWithRelations) => {
        generateRequestForm({
            id: request.request_id,
            created_at: request.created_at,
            department_name: request.department.department_name,
            requester_name: request.requester.full_name,
            status: request.status,
            items: request.items.map(item => ({
                cylinder_size_code: item.size.code,
                quantity: item.quantity,
                quantity_approved: item.quantity_issued > 0 ? item.quantity_issued : undefined
            })),
            approved_by: request.approved_by || undefined,
            approved_at: request.approved_at || undefined
        })
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                            <ClipboardList className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Oxygen Requisitions</h1>
                            <p className="text-slate-500 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Official Departmental Cylinder Requests
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => {
                        setEditingRequestId(null)
                        setDepartmentId('')
                        setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
                        setIsCreateModalOpen(true)
                    }}
                    className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-sm"
                >
                    <Plus className="w-5 h-5 mr-3" /> Create New Request
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Requests', value: total, icon: ClipboardList, color: 'blue' },
                    { label: 'Pending Approval', value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: 'amber' },
                    { label: 'Current Approved', value: requests.filter(r => r.status === 'approved').length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Weekly Growth', value: '+12%', icon: TrendingUp, color: 'indigo' }
                ].map((kpi, i) => (
                    <Card key={i} className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity`}>
                            <kpi.icon className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-slate-900">{kpi.value}</h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Request History */}
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Request History</h2>
                </div>
                <Table
                    isLoading={isLoading}
                    data={requests}
                    columns={[
                        {
                            key: 'request_id',
                            label: 'Request ID',
                            render: (val) => <span className="font-mono font-bold text-blue-600">{val}</span>
                        },
                        {
                            key: 'department',
                            label: 'Department',
                            render: (val) => <span className="font-semibold text-slate-700">{val?.department_name}</span>
                        },
                        {
                            key: 'requester',
                            label: 'Requester',
                            render: (val) => <span className="font-medium text-slate-600">{val?.full_name}</span>
                        },
                        {
                            key: 'items',
                            label: 'Items',
                            render: (val: any[]) => (
                                <div className="flex flex-col gap-1">
                                    {val.map((item, idx) => (
                                        <div key={idx} className="text-xs font-medium text-slate-500">
                                            {item.size?.code}: <span className="text-slate-900">{item.quantity} units</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        },
                        {
                            key: 'created_at',
                            label: 'Date',
                            render: (val) => <span className="text-slate-500 text-sm">{formatDate(val)}</span>
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (val) => {
                                const colors = {
                                    pending: 'amber',
                                    approved: 'emerald',
                                    rejected: 'rose',
                                    completed: 'blue',
                                    cancelled: 'slate'
                                }
                                return (
                                    <Badge className={`bg-${colors[val as keyof typeof colors] || 'slate'}-50 text-${colors[val as keyof typeof colors] || 'slate'}-600 border-none px-3 py-1 font-bold uppercase text-[10px] tracking-widest`}>
                                        {val}
                                    </Badge>
                                )
                            }
                        },
                        {
                            key: 'actions',
                            label: 'Action',
                            render: (_, row: OxygenDeptRequestWithRelations) => (
                                <div className="flex items-center gap-1">
                                    {row.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(row)}
                                            title="Edit Pending Request"
                                            className="hover:bg-amber-50 hover:text-amber-600"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePrint(row)}
                                        title="Print Request (KEW.PS-8)"
                                        className="hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </Button>
                                </div>
                            )
                        }
                    ]}
                />
            </Card>

            {/* Create/Edit Request Modal */}
            {isCreateModalOpen && (
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false)
                        setEditingRequestId(null)
                        setDepartmentId('')
                        setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
                    }}
                    title={editingRequestId ? "Edit Requisition Record" : "Official Oxygen Cylinder Request"}
                    className="max-w-5xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden"
                >
                    <div className="flex flex-col h-[90vh]">
                        {/* Formal Official Header */}
                        <div className="bg-slate-50 p-8 border-b border-slate-200 flex-shrink-0">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">Medical Gas Requisition</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Operating Procedure: KEW.PS-8 Compliance</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Session</div>
                                    <div className="text-sm font-bold text-slate-800 font-mono tracking-tighter uppercase">{new Date().toDateString()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Source Department / Unit"
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    options={departments.map(d => ({ value: d.id, label: d.department_name }))}
                                    className="bg-white border-slate-200"
                                />
                                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Requester</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-sm font-bold text-slate-700">{user?.full_name?.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Item Table */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                            <table className="w-full border-separate border-spacing-y-4">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                        <th className="pb-4 text-left font-black">Cylinder Specification</th>
                                        <th className="pb-4 text-center font-black">Live Availability</th>
                                        <th className="pb-4 text-center font-black w-32">Qty Required</th>
                                        <th className="pb-4 text-right font-black w-14"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requestItems.map((item) => {
                                        const balance = balances[item.cylinder_size_id]
                                        const isLow = balance && balance.available < 5
                                        return (
                                            <tr key={item.id} className="group animate-in slide-in-from-top-2 duration-300">
                                                <td className="align-middle">
                                                    <Select
                                                        value={item.cylinder_size_id}
                                                        onChange={(e) => updateItem(item.id, 'cylinder_size_id', e.target.value)}
                                                        options={sizes.map(s => ({ value: s.id, label: s.code }))}
                                                        placeholder="Select Specification"
                                                        className="border-slate-200 group-hover:border-blue-400 transition-colors bg-white rounded-xl h-14"
                                                    />
                                                </td>
                                                <td className="text-center align-middle px-4">
                                                    {item.cylinder_size_id ? (
                                                        <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border ${isLow ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'} transition-all`}>
                                                            <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                            <div className="flex flex-col items-start leading-none">
                                                                <span className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{isLow ? 'Urgent Depleted' : 'Stock In Store'}</span>
                                                                <span className="text-sm font-black tracking-tighter">{balance?.available || 0} UNITS</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Awaiting Selection</span>
                                                    )}
                                                </td>
                                                <td className="align-middle">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="text-center h-14 font-black text-slate-800 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 rounded-xl"
                                                        min={1}
                                                    />
                                                </td>
                                                <td className="text-right align-middle">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="h-9 w-9 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all scale-95 group-hover:scale-100"
                                                        disabled={requestItems.length === 1}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {/* Add Item Row */}
                                    <tr>
                                        <td colSpan={4} className="pt-4">
                                            <button
                                                onClick={handleAddItem}
                                                className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add Cylinder Specification
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Summary / Confirmation Note */}
                        <div className="px-8 flex items-start gap-3 p-4 bg-slate-50 border-y border-slate-200 flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                                Official Declaration: I hereby confirm that the above requested items are required for departmental use and all information provided is accurate according to current clinical requirements.
                            </p>
                        </div>

                        {/* Formal Footer Actions */}
                        <div className="p-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Total Line Items: <span className="text-slate-900 ml-1">{requestItems.length}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Total Quantity: <span className="text-slate-900 ml-1">{requestItems.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateModalOpen(false)
                                        setEditingRequestId(null)
                                        setDepartmentId('')
                                        setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
                                    }}
                                    className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-300 bg-white"
                                    disabled={isCreating}
                                >
                                    Cancel Request
                                </Button>
                                <Button
                                    onClick={handleCreateRequest}
                                    className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all"
                                    isLoading={isCreating}
                                    disabled={isCreating}
                                >
                                    {editingRequestId ? 'Update Requisition Record' : 'Submit Official Requisition'} <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default CylinderRequestPage
