import React, { useEffect, useState } from 'react'
import {
    ClipboardList,
    Plus,
    CheckCircle2,
    Clock,
    TrendingUp,
    Trash2,
    Printer,
    Edit2,
    Package2
} from 'lucide-react'
import {
    Badge,
    Button,
    Table,
    Select,
    StatCard,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { getDeptRequests, createDeptRequest, updateDeptRequest, getCylinderBalance, deleteDeptRequest, type OxygenDeptRequestWithRelations, type CylinderBalance } from '@/services/pharmacy/oxygenDepartmentService'
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
    }, [user?.hospital_id])

    const loadRequests = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)
        const res = await getDeptRequests(user.hospital_id, {}, 1, 10)
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

    const handleDelete = async (request: OxygenDeptRequestWithRelations) => {
        if (!confirm('Are you sure you want to delete this requisition? This action cannot be undone.')) return

        try {
            const { error } = await deleteDeptRequest(request.id)
            if (error) throw new Error(error)

            toast.success("Request deleted successfully")
            loadRequests()
        } catch (error) {
            console.error('Error deleting request:', error)
            toast.error("Failed to delete request")
        }
    }

    return (
        <FinancialPageLayout
            title="Oxygen Requisitions"
            description="Manage departmental oxygen cylinder requests and track formal requisitions."
            icon={ClipboardList}
            breadcrumbs={[{ label: 'Medical Oxygen', href: '/pharmacy/oxygen' }, { label: 'Department Requests' }]}
        >
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Requests"
                        value={total}
                        icon={ClipboardList}
                        color="primary"
                        subtitle="All records"
                    />
                    <StatCard
                        title="Pending Approval"
                        value={requests.filter(r => r.status === 'pending').length}
                        icon={Clock}
                        color="warning"
                        subtitle="Awaiting action"
                    />
                    <StatCard
                        title="Approved"
                        value={requests.filter(r => r.status === 'approved').length}
                        icon={CheckCircle2}
                        color="success"
                        subtitle="Processed"
                    />
                    <StatCard
                        title="Weekly Growth"
                        value="12%"
                        change={12}
                        icon={TrendingUp}
                        color="info"
                        subtitle="Volume increase"
                    />
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full md:w-auto flex-1">
                        {/* Placeholder for potential Search/Filter if needed in future, currently empty as per original functionality, 
                            but could add 'Search' input if API supports it later. 
                            Preserving Layout space for consistency with LOU page. */}
                    </div>
                    <div>
                        <Button
                            onClick={() => {
                                setEditingRequestId(null)
                                setDepartmentId('')
                                setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
                                setIsCreateModalOpen(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Create New Request
                        </Button>
                    </div>
                </div>

                {/* Request History */}
                <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
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
                                        pending: 'warning',
                                        approved: 'success',
                                        rejected: 'error',
                                        completed: 'info',
                                        cancelled: 'default'
                                    }
                                    return (
                                        <Badge variant={colors[val as keyof typeof colors] as any}>
                                            {val}
                                        </Badge>
                                    )
                                }
                            },
                            {
                                key: 'actions',
                                label: 'Action',
                                className: 'text-right',
                                render: (_, row: OxygenDeptRequestWithRelations) => (
                                    <div className="flex items-center justify-end gap-1">
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
                                        {row.status === 'pending' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(row)}
                                                title="Delete Request"
                                                className="hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>


            {/* Create/Edit Request Modal */}
            {/* Create/Edit Request Modal using Dialog Primitive for LOU style */}
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => !open && setIsCreateModalOpen(false)}>
                <DialogContent className="max-w-5xl flex flex-col p-0 gap-0 bg-slate-50 border-0 shadow-2xl overflow-hidden rounded-[24px]">
                    {/* Header with modern gradient and pattern */}
                    <DialogHeader className="px-8 py-6 bg-white border-b border-slate-100 flex flex-row justify-between items-start relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />

                        <div className="flex items-center gap-5 relative z-10 w-full">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                                <div className="relative p-3.5 bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 shadow-lg shadow-blue-500/10">
                                    <ClipboardList className="w-7 h-7 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                                        {editingRequestId ? "Edit Requisition" : "New Cylinder Request"}
                                    </DialogTitle>
                                    <Badge className="bg-blue-600 text-white shadow-md shadow-blue-500/20 border-0 px-2 py-0.5 text-[10px] tracking-wider font-bold">
                                        FORM-REQ-01
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    Create a formal oxygen supply request for your department.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Section 1: Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Requesting Department</label>
                                <Select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    options={departments.map(d => ({ value: d.id, label: d.department_name }))}
                                    className="h-12 bg-white border-slate-200 shadow-sm text-slate-800 font-semibold rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Select Department..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Requester</label>
                                <div className="h-12 px-4 bg-slate-100/50 border border-slate-200 rounded-xl flex items-center text-sm font-medium text-slate-500 shadow-inner">
                                    {user?.full_name}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Items List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Package2 className="w-4 h-4 text-blue-500" />
                                    Required Cylinders
                                </h3>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-medium">
                                    {requestItems.length} {requestItems.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {requestItems.map((item, index) => {
                                    const balance = balances[item.cylinder_size_id]
                                    const isLow = balance && balance.available < 5
                                    return (
                                        <div
                                            key={item.id}
                                            className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 p-4 flex flex-col sm:flex-row items-center gap-5"
                                        >
                                            {/* Counter Index */}
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                                                {index + 1}
                                            </div>

                                            {/* Size Select */}
                                            <div className="flex-1 w-full sm:w-auto min-w-[280px]">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Cylinder Type</div>
                                                <Select
                                                    value={item.cylinder_size_id}
                                                    onChange={(e) => updateItem(item.id, 'cylinder_size_id', e.target.value)}
                                                    options={sizes.map(s => {
                                                        const labelMap: Record<string, string> = {
                                                            'P101-D': 'P101-D (PI 0.5m3)',
                                                            'P101-E': 'P101-E (PI 0.7m3)',
                                                            'P101-F': 'P101-F (PI 1.4m3)',
                                                            '101-F': '101-F (PI 1.4m3)',
                                                            'P101-G': 'P101-G (BN 3.4m3)',
                                                            'P101-H': 'P101-H (BN 6.8m3)',
                                                            'P101-HS': 'P101-HS (BN 6.4m3)',
                                                            '101-N': '101-N (BN 8.0m3)'
                                                        }
                                                        return {
                                                            value: s.id,
                                                            label: labelMap[s.code] || `${s.code} (PI ${s.capacity}${s.unit})`
                                                        }
                                                    })}
                                                    placeholder="Select Size..."
                                                    className="w-full bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                                                />
                                            </div>

                                            {/* Stock Indicator */}
                                            <div className="w-full sm:w-40 flex flex-col justify-center">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">Availability</div>
                                                {item.cylinder_size_id ? (
                                                    <div className={`h-10 w-full flex items-center justify-center gap-2 rounded-lg border ${isLow ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                        <span className="text-xs font-bold">{balance?.available || 0} In Stock</span>
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-full flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400 text-xs italic">
                                                        -
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quantity Stepper */}
                                            <div className="w-full sm:w-32 flex flex-col justify-center">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">Quantity</div>
                                                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                                                    <button
                                                        onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm border border-slate-100 text-slate-600 hover:text-blue-600 active:scale-95 transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <div className="flex-1 text-center font-bold text-slate-800 text-sm w-10">
                                                        {item.quantity}
                                                    </div>
                                                    <button
                                                        onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm border border-slate-100 text-slate-600 hover:text-blue-600 active:scale-95 transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Remove Button */}
                                            <div className="sm:pt-5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    disabled={requestItems.length === 1}
                                                    className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-0"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <Button
                                variant="ghost"
                                onClick={handleAddItem}
                                className="w-full h-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 group"
                            >
                                <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="font-semibold">Add Another Cylinder Size</span>
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shadow-lg z-20">
                        <div className="text-xs text-slate-400 font-medium pl-2">
                            All requests are subject to approval.
                        </div>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setEditingRequestId(null)
                                    setDepartmentId('')
                                    setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
                                }}
                                className="h-12 px-6 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateRequest}
                                className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-slate-900/20 hover:shadow-blue-600/30 font-bold tracking-wide transition-all transform hover:-translate-y-0.5"
                                isLoading={isCreating}
                                disabled={isCreating}
                            >
                                {editingRequestId ? 'Update Application' : 'Submit Requisition'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FinancialPageLayout>
    )
}

export default CylinderRequestPage
