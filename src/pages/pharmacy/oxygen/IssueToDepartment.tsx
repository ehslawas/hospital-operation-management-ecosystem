import React, { useEffect, useState } from 'react'
import {
    ClipboardList,
    QrCode,
    ArrowRight,

    Truck,
    CheckCircle2
} from 'lucide-react'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import {
    Button,
    Input,
    Select,
    Card,
    Badge,
    Table,
    Modal
} from '@/components/ui'
import { QRScanner } from '@/components/medical-oxygen/QRScanner'
import { useToast } from '@/stores/toastStore'
import {
    getDeptRequests,
    issueCylindersToDepartment,
    createDeptRequest,
    approveDeptRequest,
    rejectDeptRequest,
    type OxygenDeptRequestWithRelations
} from '@/services/pharmacy/oxygenDepartmentService'
import { getOxygenCylinderSizes } from '@/services/pharmacy/oxygenService'
import { getDepartments } from '@/services/departmentService'
import { generateIssuanceNotePDF } from '@/services/pharmacy/IssuanceNotePDF'
import type { Column } from '@/types'
import { formatDate } from '@/lib/utils'

// Hardcoded department list from the user's reference photo for 100% accuracy
const GOVERNMENT_DEPARTMENTS = [
    "Radiology & Radiography",
    "CSSU/CSSD",
    "Asset Management",
    "Advanced Reports",
    "Emergency & Trauma",
    "Maternity Ward",
    "Pharmacy Logistics",
    "Paediatric Ward",
    "Haemodialysis",
    "Pharmacy Galenical & Prepacking",
    "Pathologist",
    "Pharmacy Substore",
    "Human Resources",
    "Operation Theater",
    "Financial & Billing",
    "Klinik Pakar",
    "General Ward",
    "Hospital Office",
    "Driver Room",
    "Front Desk",
    "Pharmacy Outpatient"
]

export const IssueToDepartment: React.FC = () => {
    const { user } = useAuthStore()
    const hospitalId = user?.hospital_id
    const isSessionReady = useIsSessionReady()
    const toast = useToast()
    // const [activeTab, setActiveTab] = useState<'requests' | 'manual'>('requests')


    // Data State
    const [pendingRequests, setPendingRequests] = useState<OxygenDeptRequestWithRelations[]>([])
    const [approvedRequests, setApprovedRequests] = useState<OxygenDeptRequestWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [departments, setDepartments] = useState<any[]>([])
    const [sizes, setSizes] = useState<any[]>([])

    // Issue Form State
    const [selectedRequest, setSelectedRequest] = useState<OxygenDeptRequestWithRelations | null>(null)
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
    const [issuanceStep, setIssuanceStep] = useState<'info' | 'scan'>('info')
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [issueForm, setIssueForm] = useState({
        department_id: '',
        scannedQRs: [] as string[],
        requester_name: '',
        issuer_name: user?.full_name || ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastIssuedRecord, setLastIssuedRecord] = useState<any>(null)
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    // Approval State
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
    const [requestToApprove, setRequestToApprove] = useState<OxygenDeptRequestWithRelations | null>(null)
    const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
    const [rejectionReason, setRejectionReason] = useState('')
    const [isApproving, setIsApproving] = useState(false)

    // Create Request Form State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState({
        department_id: '',
        items: [{ size_id: '', qty: 1 }]
    })

    useEffect(() => {
        if (!isSessionReady || !hospitalId) return
        loadData()
        loadMasterData()
    }, [isSessionReady, hospitalId])

    const handleProceedToScan = () => {
        const deptId = selectedRequest ? selectedRequest.department_id : issueForm.department_id
        if (!deptId) {
            toast.error('Required', 'Please select a destination department')
            return
        }
        if (!issueForm.requester_name) {
            toast.error('Required', 'Please enter the requester name')
            return
        }
        setIssuanceStep('scan')
    }

    const loadData = async () => {
        if (!user?.hospital_id) return
        setIsLoading(true)

        // Load both pending and approved requests
        const [pendingRes, approvedRes] = await Promise.all([
            getDeptRequests(user.hospital_id, { status: 'pending' }),
            getDeptRequests(user.hospital_id, { status: 'approved' })
        ])

        if (!pendingRes.error) setPendingRequests(pendingRes.data?.data || [])
        if (!approvedRes.error) setApprovedRequests(approvedRes.data?.data || [])
        setIsLoading(false)
    }

    const loadMasterData = async () => {
        if (!user?.hospital_id) return
        const [dRes, sRes] = await Promise.all([
            getDepartments({ hospitalId: user.hospital_id }),
            getOxygenCylinderSizes()
        ])

        if (dRes.data) setDepartments(dRes.data)
        if (sRes.data) setSizes(sRes.data)
    }

    const handleScan = (qr: string) => {
        if (issueForm.scannedQRs.includes(qr)) {
            toast.error('Duplicate', 'This cylinder is already scanned')
            return
        }
        setIssueForm(prev => ({ ...prev, scannedQRs: [...prev.scannedQRs, qr] }))
        setIsScannerOpen(false)
        toast.success('Scanned', `Cylinder ${qr} added`)
    }

    const handleIssueSubmit = async () => {
        if (!user?.hospital_id || !user?.id) return

        const deptId = selectedRequest ? selectedRequest.department_id : issueForm.department_id
        if (!deptId) {
            toast.error('Error', 'Please select a department')
            return
        }

        if (!issueForm.requester_name) {
            toast.error('Error', 'Requester name is required')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await issueCylindersToDepartment(user.hospital_id, {
                request_id: selectedRequest?.request_id,
                department_id: deptId,
                issued_by: user.id,
                issued_at: new Date().toISOString(),
                cylinders: issueForm.scannedQRs,
                requester_name: issueForm.requester_name,
                issuer_name: issueForm.issuer_name
            })

            if (res.error) throw new Error(res.error)

            toast.success('Success', 'Cylinders issued successfully')

            // Capture for tracking and PDF
            const resData = res.data as any;
            const targetDept = departments.find(d => d.id === deptId)
            setLastIssuedRecord({
                dept_name: targetDept?.department_name || targetDept?.name || 'Unknown',
                requester: issueForm.requester_name,
                issuer: issueForm.issuer_name,
                date: new Date().toISOString(),
                cylinders: issueForm.scannedQRs,
                requestId: resData?.request_id || selectedRequest?.request_id
            })

            setIsIssueModalOpen(false)
            setIssueForm({ department_id: '', scannedQRs: [], requester_name: '', issuer_name: user?.full_name || '' })
            setSelectedRequest(null)
            loadData()
            setIsSuccessModalOpen(true)
        } catch (err) {
            toast.error('Failed', err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePrintNote = () => {
        if (!lastIssuedRecord) return
        generateIssuanceNotePDF(lastIssuedRecord)
    }

    const handleCreateRequest = async () => {
        if (!user?.hospital_id || !user?.id) return
        try {
            await createDeptRequest(user.hospital_id, {
                department_id: createForm.department_id,
                requested_by: user.id,
                items: createForm.items.map(i => ({ cylinder_size_id: i.size_id, quantity: i.qty }))
            })
            toast.success('Created', 'Request created successfully')
            setIsCreateModalOpen(false)
            loadData()
        } catch (err) {
            toast.error('Error', 'Failed to create request')
        }
    }

    // Helper to open issue modal for a request
    const openIssueForRequest = (req: OxygenDeptRequestWithRelations) => {
        setSelectedRequest(req)
        setIssueForm(prev => ({
            ...prev,
            department_id: req.department_id,
            scannedQRs: [],
            requester_name: req.requester?.full_name || ''
        }))
        setIsIssueModalOpen(true)
    }

    // Approval handlers
    const handleOpenApproval = (req: OxygenDeptRequestWithRelations, action: 'approve' | 'reject') => {
        setRequestToApprove(req)
        setApprovalAction(action)
        setRejectionReason('')
        setIsApprovalModalOpen(true)
    }

    const handleApprovalSubmit = async () => {
        if (!requestToApprove || !user?.id) return

        if (approvalAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Required', 'Please provide a rejection reason')
            return
        }

        setIsApproving(true)
        try {
            if (approvalAction === 'approve') {
                const res = await approveDeptRequest(requestToApprove.request_id, user.id)
                if (res.error) throw new Error(res.error)
                toast.success('Approved', 'Request has been approved')
            } else {
                const res = await rejectDeptRequest(requestToApprove.request_id, user.id, rejectionReason)
                if (res.error) throw new Error(res.error)
                toast.success('Rejected', 'Request has been rejected')
            }

            setIsApprovalModalOpen(false)
            setRequestToApprove(null)
            setRejectionReason('')
            loadData()
        } catch (err) {
            toast.error('Failed', err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsApproving(false)
        }
    }

    // Column definitions for pending requests (need approval)
    const pendingRequestColumns: Column<OxygenDeptRequestWithRelations>[] = [
        { key: 'request_id', label: 'Request ID', className: 'font-mono font-black text-slate-900 tracking-tight text-sm' },
        { key: 'created_at', label: 'Date', render: (v) => formatDate(String(v)) },
        { key: 'department', label: 'Department', render: (v: any) => <span className="font-black text-slate-700 uppercase text-sm">{v?.department_name || '-'}</span> },
        {
            key: 'items',
            label: 'Requested Items',
            render: (v: any) => {
                const items = (v || []) as any[]
                return (
                    <div className="flex flex-wrap gap-1">
                        {items.map((i, idx) => (
                            <Badge key={idx} variant="gray" className="text-[10px] bg-slate-100 text-slate-800 border-none font-black uppercase">
                                {i.size?.code}: {i.quantity}
                            </Badge>
                        ))}
                    </div>
                )
            }
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => handleOpenApproval(row, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-lg"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Approve
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenApproval(row, 'reject')}
                        className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold h-8 px-4 rounded-lg"
                    >
                        Reject
                    </Button>
                </div>
            )
        }
    ]

    // Column definitions for approved requests (ready to process)
    const approvedRequestColumns: Column<OxygenDeptRequestWithRelations>[] = [
        { key: 'request_id', label: 'Request ID', className: 'font-mono font-black text-slate-900 tracking-tight text-sm' },
        { key: 'created_at', label: 'Date', render: (v) => formatDate(String(v)) },
        { key: 'department', label: 'Department', render: (v: any) => <span className="font-black text-slate-700 uppercase text-sm">{v?.department_name || '-'}</span> },
        {
            key: 'items',
            label: 'Requested Items',
            render: (v: any) => {
                const items = (v || []) as any[]
                return (
                    <div className="flex flex-wrap gap-1">
                        {items.map((i, idx) => (
                            <Badge key={idx} variant="gray" className="text-[10px] bg-slate-100 text-slate-800 border-none font-black uppercase">
                                {i.size?.code}: {i.quantity}
                            </Badge>
                        ))}
                    </div>
                )
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: () => (
                <Badge variant="success" className="font-black tracking-widest text-[9px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    APPROVED
                </Badge>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <Button size="sm" onClick={() => openIssueForRequest(row)} className="bg-slate-900 hover:bg-black text-white font-bold h-8 px-4 rounded-lg">
                    Process
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-slate-50/50 animate-fade-in font-sans relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/40 to-blue-50/40 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-50/40 to-teal-50/40 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/2" />

            <div className="p-6 space-y-8 max-w-[1600px] mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                <ArrowRight className="w-6 h-6 text-slate-900" />
                            </div>
                            Issue to Department
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-[11px]">Cylinder Inventory Management & Issuance</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">

                        <Button onClick={() => { setSelectedRequest(null); setIsIssueModalOpen(true); }} className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white h-11 px-6 font-black rounded-xl shadow-lg shadow-slate-200">
                            <QrCode className="w-4 h-4 mr-2" />
                            Manual Issue
                        </Button>
                    </div>
                </div>

                {/* Pending Requests - Require Approval */}
                <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5 bg-white rounded-2xl">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
                        <h3 className="font-black text-amber-800 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <ClipboardList className="w-4 h-4 text-amber-700" />
                            Pending Approval ({pendingRequests.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <Table
                            data={pendingRequests}
                            columns={pendingRequestColumns}
                            isLoading={isLoading}
                            emptyMessage="No pending requests found."
                        />
                    </div>
                </Card>

                {/* Approved Requests - Ready to Process */}
                <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-900/5 bg-white rounded-2xl">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                        <h3 className="font-black text-emerald-800 flex items-center gap-2 uppercase tracking-widest text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Approved Requests ({approvedRequests.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <Table
                            data={approvedRequests}
                            columns={approvedRequestColumns}
                            isLoading={isLoading}
                            emptyMessage="No approved requests found."
                        />
                    </div>
                </Card>

                {/* Issue Modal - GOVERNMENT PROFESSIONAL DESIGN (STEP-BASED) */}
                <Modal
                    isOpen={isIssueModalOpen}
                    onClose={() => {
                        setIsIssueModalOpen(false)
                        setIssuanceStep('info')
                    }}
                    title={selectedRequest ? `Issue Note: ${selectedRequest.request_id}` : 'Manual Cylinder Issue'}
                    size={issuanceStep === 'info' ? 'sm' : 'lg'}
                >
                    <div className="space-y-6">
                        {issuanceStep === 'info' ? (
                            /* STEP 1: OFFICIAL INFORMATION ENTRY */
                            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ClipboardList className="w-6 h-6 text-slate-900" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Issuance Details</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Official Movement Documentation</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Destination Department</label>
                                        {selectedRequest ? (
                                            <div className="h-14 flex items-center px-5 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <p className="font-black text-slate-900 uppercase tracking-tight">{selectedRequest.department?.department_name}</p>
                                            </div>
                                        ) : (
                                            <Select
                                                value={issueForm.department_id}
                                                onChange={e => setIssueForm(p => ({ ...p, department_id: e.target.value }))}
                                                options={[
                                                    { label: "SELECT DEPARTMENT", value: "" },
                                                    ...GOVERNMENT_DEPARTMENTS.map(d => ({ label: d.toUpperCase(), value: d }))
                                                ]}
                                                className="h-14 font-black border-slate-200 bg-white rounded-2xl focus:ring-0 focus:border-slate-900 text-xs tracking-tight"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Requester Name</label>
                                        <Input
                                            placeholder="ENTER FORMAL NAME (E.G. SN. AMRI AMIT)"
                                            value={issueForm.requester_name}
                                            onChange={e => setIssueForm(p => ({ ...p, requester_name: e.target.value }))}
                                            className="h-14 font-black border-slate-200 bg-white rounded-2xl focus:border-slate-900 px-5 text-xs placeholder:text-slate-300 uppercase tracking-tight"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Date</label>
                                            <p className="font-black text-slate-900 text-xs px-1">{formatDate(new Date().toISOString())}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Authorized Issuer</label>
                                            <p className="font-black text-slate-900 text-xs px-1 uppercase tracking-tight">{issueForm.issuer_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleProceedToScan}
                                    className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 group"
                                >
                                    Proceed to Unit Scan
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        ) : (
                            /* STEP 2: UNIT SCANNING & MANIFEST */
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                                {/* Manifest Header Summary */}
                                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Movement To</p>
                                        <h4 className="font-black text-lg tracking-tight uppercase leading-none">
                                            {selectedRequest?.department?.department_name || issueForm.department_id}
                                        </h4>
                                        <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                            REQ: <span className="text-slate-300 underline decoration-slate-600 underline-offset-4">{issueForm.requester_name}</span>
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIssuanceStep('info')}
                                        className="text-slate-400 hover:text-white h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-800"
                                    >
                                        Change Details
                                    </Button>
                                </div>

                                {/* Scanning Area */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <QrCode className="w-4 h-4 text-slate-400" />
                                            Inventory Manifest
                                        </h4>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsScannerOpen(true)}
                                            className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 font-black px-4 h-9 rounded-xl transition-all"
                                        >
                                            <QrCode className="w-3 h-3 mr-2" />
                                            Launch Scanner
                                        </Button>
                                    </div>

                                    <div className="border-2 border-slate-100 rounded-2xl p-6 min-h-[200px] bg-slate-50/30 flex flex-wrap gap-3 content-start overflow-y-auto max-h-[300px]">
                                        {issueForm.scannedQRs.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center w-full py-12 space-y-4 opacity-40">
                                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-slate-200">
                                                    <QrCode className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em]">Ready for Intake</p>
                                                    <p className="text-slate-400 text-[9px] font-medium mt-1">Scan QR or enter identifier below</p>
                                                </div>
                                            </div>
                                        ) : (
                                            issueForm.scannedQRs.map(qr => (
                                                <Badge key={qr} variant="gray" className="bg-white border border-slate-200/60 text-slate-900 pl-4 pr-2 py-3 flex items-center gap-4 transition-all hover:border-slate-900 hover:shadow-lg hover:shadow-slate-100 rounded-xl font-mono text-sm group">
                                                    <span className="font-black tracking-tight">{qr}</span>
                                                    <button
                                                        onClick={() => setIssueForm(p => ({ ...p, scannedQRs: p.scannedQRs.filter(q => q !== qr) }))}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                    >
                                                        &times;
                                                    </button>
                                                </Badge>
                                            ))
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 px-1">
                                        <div className="flex-1 text-left">
                                            <Input
                                                placeholder="SCAN OR TYPE QR IDENTIFIER..."
                                                className="h-14 font-black border-slate-200 bg-white focus:border-slate-900 rounded-2xl shadow-sm px-6 text-xs placeholder:text-slate-300 uppercase tracking-tight"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleScan(e.currentTarget.value)
                                                        e.currentTarget.value = ''
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="h-14 px-6 bg-slate-900 text-white rounded-2xl flex flex-col justify-center items-center shadow-lg shadow-slate-200 min-w-[100px]">
                                            <span className="text-[18px] font-black leading-none">{issueForm.scannedQRs.length}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsIssueModalOpen(false)
                                            setIssuanceStep('info')
                                        }}
                                        className="text-slate-400 font-black hover:text-slate-600 uppercase tracking-widest text-[10px] h-12"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleIssueSubmit}
                                        disabled={isSubmitting || issueForm.scannedQRs.length === 0}
                                        isLoading={isSubmitting}
                                        className={`h-12 px-10 rounded-xl font-black text-white shadow-xl uppercase tracking-widest text-[11px] transition-all duration-300 ${issueForm.scannedQRs.length > 0
                                            ? 'bg-slate-900 hover:bg-black shadow-slate-200'
                                            : 'bg-slate-200 shadow-none cursor-not-allowed text-slate-400'
                                            }`}
                                    >
                                        Complete Issuance
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Post-Success Professional Modal */}
                <Modal
                    isOpen={isSuccessModalOpen}
                    onClose={() => setIsSuccessModalOpen(false)}
                    title="Issuance Confirmation"
                    size="sm"
                >
                    <div className="text-center space-y-8 pt-4 pb-4">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-slate-200 transform rotate-12 transition-transform hover:rotate-0">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Transaction Logged</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Movement Reference: {lastIssuedRecord?.requestId || 'AUTOGEN'}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-left space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destination</span>
                                <span className="font-black text-slate-900 uppercase text-lg block leading-none">{lastIssuedRecord?.dept_name}</span>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-200 pt-4">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Requester</span>
                                    <span className="font-black text-slate-800 text-sm">{lastIssuedRecord?.requester}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cylinders</span>
                                    <span className="font-black text-slate-800 text-lg">{lastIssuedRecord?.cylinders?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={handlePrintNote} className="bg-slate-900 hover:bg-black w-full font-black h-14 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                                <Truck className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="text-white text-xs">Print Official Note</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Borang KEW.PS-11</div>
                                </div>
                            </Button>
                            <Button variant="ghost" onClick={() => setIsSuccessModalOpen(false)} className="w-full text-slate-400 font-black h-12 uppercase tracking-widest text-[10px]">
                                Back to Module
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Simulating QR Scanner */}
                {isScannerOpen && (
                    <QRScanner
                        onScan={handleScan}
                        onClose={() => setIsScannerOpen(false)}
                    />
                )}

                {/* Create Request Modal (Simulation) */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create Internal Request"
                >
                    <div className="space-y-4">
                        <Select
                            label="Department"
                            value={createForm.department_id}
                            onChange={e => setCreateForm(p => ({ ...p, department_id: e.target.value }))}
                            options={departments.map(d => ({ label: d.department_name || d.name, value: d.id }))}
                        />


                        {createForm.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Select
                                    className="flex-1"
                                    value={item.size_id}
                                    onChange={e => {
                                        const newItems = [...createForm.items]
                                        newItems[idx].size_id = e.target.value
                                        setCreateForm(p => ({ ...p, items: newItems }))
                                    }}
                                    options={sizes.map(s => ({ label: s.code, value: s.id }))}
                                />

                                <Input
                                    type="number"
                                    className="w-24"
                                    value={item.qty}
                                    onChange={e => {
                                        const newItems = [...createForm.items]
                                        newItems[idx].qty = Number(e.target.value)
                                        setCreateForm(p => ({ ...p, items: newItems }))
                                    }}
                                />
                            </div>
                        ))}

                        <Button className="w-full mt-4" onClick={handleCreateRequest}>Create Request</Button>
                    </div>
                </Modal>

                {/* Approval/Rejection Modal */}
                <Modal
                    isOpen={isApprovalModalOpen}
                    onClose={() => setIsApprovalModalOpen(false)}
                    title={approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                    className="max-w-2xl"
                >
                    <div className="space-y-6 p-6">
                        {requestToApprove && (
                            <>
                                {/* Request Details */}
                                <Card className="p-6 border-slate-200 bg-slate-50/50 rounded-2xl">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request ID</p>
                                                <p className="font-mono font-black text-slate-900 text-sm mt-1">{requestToApprove.request_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                                <p className="font-bold text-slate-700 text-sm mt-1">{formatDate(requestToApprove.created_at)}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                                            <p className="font-black text-slate-900 text-lg mt-1 uppercase">{requestToApprove.department?.department_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested Items</p>
                                            <div className="flex flex-wrap gap-2">
                                                {requestToApprove.items?.map((item: any, idx: number) => (
                                                    <Badge key={idx} className="bg-white border border-slate-200 text-slate-700 font-black text-xs px-3 py-1.5">
                                                        {item.size?.code}: {item.quantity} units
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Rejection Reason (only for reject action) */}
                                {approvalAction === 'reject' && (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                            Rejection Reason *
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="ENTER DETAILED REASON FOR REJECTION..."
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            className="w-full font-bold border-2 border-slate-200 bg-slate-50/30 rounded-xl text-sm placeholder:text-slate-300 uppercase p-4 focus:outline-none focus:border-slate-900"
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsApprovalModalOpen(false)}
                                        className="flex-1 h-12 rounded-xl font-black uppercase text-xs"
                                        disabled={isApproving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleApprovalSubmit}
                                        className={`flex-1 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl ${approvalAction === 'approve'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                                            }`}
                                        isLoading={isApproving}
                                        disabled={isApproving}
                                    >
                                        {approvalAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            </div>
        </div>
    )
}

export default IssueToDepartment
