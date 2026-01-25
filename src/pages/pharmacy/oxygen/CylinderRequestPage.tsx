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
    Edit2,
    Package2
} from 'lucide-react'
import {
    Badge,
    Button,
    Card,
    Table,
    Modal,
    Select,
    Input,
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
                <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white border-0 shadow-2xl overflow-hidden rounded-[20px]">
                    <DialogHeader className="px-6 py-5 border-b border-slate-100 flex flex-row justify-between items-start bg-white">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    {editingRequestId ? "Edit Request" : "New Oxygen Cylinder Request"}
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                                        FORM-REQ-01
                                    </Badge>
                                    <p className="text-xs text-slate-500">
                                        Create a formal request for medical oxygen cylinders.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                        <div className="max-w-5xl mx-auto space-y-6">

                            {/* Department & Requester Section */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Requesting Department"
                                        value={departmentId}
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                        options={departments.map(d => ({ value: d.id, label: d.department_name }))}
                                        className="bg-white border-slate-200"
                                        placeholder="Select Department"
                                    />
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Requester</label>
                                        <div className="h-10 px-3 bg-white border border-slate-200 rounded-lg flex items-center text-sm text-slate-600 shadow-sm cursor-not-allowed">
                                            {user?.full_name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Package2 className="w-4 h-4 text-blue-500" />
                                        Requested Items
                                    </h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Cylinder Size</th>
                                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Stock Status</th>
                                                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Quantity</th>
                                                <th className="px-5 py-3 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {requestItems.map((item) => {
                                                const balance = balances[item.cylinder_size_id]
                                                const isLow = balance && balance.available < 5
                                                return (
                                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-5">
                                                            <Select
                                                                value={item.cylinder_size_id}
                                                                onChange={(e) => updateItem(item.id, 'cylinder_size_id', e.target.value)}
                                                                options={sizes.map(s => ({ value: s.id, label: s.code }))}
                                                                placeholder="Select Size"
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="p-5 text-center">
                                                            {item.cylinder_size_id ? (
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isLow ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                                    <span className="text-xs font-semibold">
                                                                        {balance?.available || 0} Available
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">Select size first</span>
                                                            )}
                                                        </td>
                                                        <td className="p-5">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="text-center w-24 mx-auto"
                                                                min={1}
                                                            />
                                                        </td>
                                                        <td className="p-5 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                disabled={requestItems.length === 1}
                                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        {/* Add Item Footer inside the table context or right below */}
                                        <tfoot className="border-t border-slate-100 bg-slate-50/30">
                                            <tr>
                                                <td colSpan={4} className="p-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={handleAddItem}
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" /> Add Cylinder Type
                                                    </Button>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsCreateModalOpen(false)
                                setEditingRequestId(null)
                                setDepartmentId('')
                                setRequestItems([{ id: '1', cylinder_size_id: '', quantity: 1 }])
                            }}
                            className="h-11 px-6 text-slate-500 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateRequest}
                            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            isLoading={isCreating}
                            disabled={isCreating}
                        >
                            {editingRequestId ? 'Update Request' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FinancialPageLayout>
    )
}

export default CylinderRequestPage
