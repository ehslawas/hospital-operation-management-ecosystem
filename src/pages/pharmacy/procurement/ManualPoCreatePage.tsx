import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Save, FileText, ChevronDown, Trash2, Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Spinner, Badge } from '@/components/ui'
import { createPurchaseOrder, updatePurchaseOrder, getPurchaseOrderById, getActiveSuppliers, getPurchaseOrders } from '@/services/pharmacy/procurementService'
import { WARRANT_DEPARTMENTS, WARRANT_VOTE_CODES, WARRANT_VOTE_ACTIVITIES, WARRANT_CATEGORIES, getWarrantSummary } from '@/services/pharmacy/warrantService'
import { ROUTES } from '@/lib/constants'
import type { PurchaseOrderFormData, WarrantSummary } from '@/types/pharmacy'

const VOTE_CODES = [
    ...WARRANT_VOTE_CODES.map(v => ({ value: v.value, label: `${v.value} - ${v.label}` })),
    { value: 'others', label: 'Others (Manual Entry)' },
]

const VOTE_ACTIVITIES = [
    ...WARRANT_VOTE_ACTIVITIES,
    { value: 'others', label: 'Others (Manual Entry)' },
]

const CATEGORIES = [
    ...WARRANT_CATEGORIES,
    { value: 'others', label: 'Others (Manual Entry)' },
]

export const ManualPoCreatePage: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { mode, poId } = (location.state as { mode?: string, poId?: string }) || {}
    const isEdit = mode === 'edit' && !!poId

    const { user } = useAuthStore()
    const { success: showSuccess, error: showError } = useToastStore()
    const hospitalId = user?.hospital_id
    const userId = user?.id

    // Form state
    const [formData, setFormData] = useState<Partial<PurchaseOrderFormData>>({
        po_type: 'manual',
        supplier_id: '',
        manual_supplier_name: '',
        vote_code: '',
        vote_activity: '',
        category: 'non_standard',
        department: '',
        items: [],
    })

    const [suppliers, setSuppliers] = useState<any[]>([])
    const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false)
    const [isOthersVoteCode, setIsOthersVoteCode] = useState(false)
    const [isOthersVoteActivity, setIsOthersVoteActivity] = useState(false)
    const [isOthersDepartment, setIsOthersDepartment] = useState(false)
    const [isOthersCategory, setIsOthersCategory] = useState(false)
    const [manualDepartment, setManualDepartment] = useState('')
    const [manualVoteCode, setManualVoteCode] = useState('')
    const [manualVoteActivity, setManualVoteActivity] = useState('')
    const [manualCategory, setManualCategory] = useState('')

    // Financial states
    const [warrantSummary, setWarrantSummary] = useState<WarrantSummary | null>(null)
    const [isRefreshingWarrant, setIsRefreshingWarrant] = useState(false)
    const [currentPoTotal, setCurrentPoTotal] = useState(0)

    useEffect(() => {
        if (!hospitalId) return
        const loadSuppliers = async () => {
            const res = await getActiveSuppliers(hospitalId)
            if (res.data) setSuppliers(res.data)
        }
        void loadSuppliers()

        if (isEdit) {
            const loadPo = async () => {
                const res = await getPurchaseOrderById(poId!)
                if (res.data) {
                    const po = res.data
                    setFormData({
                        po_type: 'manual',
                        supplier_id: po.supplier_id,
                        manual_supplier_name: po.manual_supplier_name,
                        vote_code: po.vote_code,
                        vote_activity: po.vote_activity,
                        category: po.category,
                        department: po.department,
                        expected_delivery_date: po.expected_delivery_date,
                        payment_terms: po.payment_terms,
                        delivery_address: po.delivery_address,
                        notes: po.notes,
                        items: po.items?.map(item => ({
                            item_type: item.item_type,
                            item_id: item.item_id,
                            item_name: item.item_name,
                            item_code: item.item_code,
                            quantity: item.quantity_ordered,
                            unit_price: item.unit_price,
                            packaging_description: item.packaging_description,
                        })) || [],
                    })

                    // Handle \"Others\" state for edit
                    if (!VOTE_CODES.some(c => c.value === po.vote_code)) {
                        setIsOthersVoteCode(true)
                        setManualVoteCode(po.vote_code || '')
                    }
                    if (!VOTE_ACTIVITIES.some(a => a.value === po.vote_activity)) {
                        setIsOthersVoteActivity(true)
                        setManualVoteActivity(po.vote_activity || '')
                    }
                    if (!WARRANT_DEPARTMENTS.some(d => d.label === po.department)) {
                        setIsOthersDepartment(true)
                        setManualDepartment(po.department || '')
                    }
                    if (!WARRANT_CATEGORIES.some(c => c.value === po.category)) {
                        setIsOthersCategory(true)
                        setManualCategory(po.category || '')
                    }
                }
            }
            void loadPo()
        }
    }, [hospitalId, isEdit, poId])

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate live total
    useEffect(() => {
        const total = (formData.items || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)
        setCurrentPoTotal(total)
    }, [formData.items])

    // Load Warrant Summary when financial filters change
    useEffect(() => {
        if (!hospitalId) return

        const refreshWarrant = async () => {
            const finalVoteCode = isOthersVoteCode ? manualVoteCode : formData.vote_code
            const finalVoteActivity = isOthersVoteActivity ? manualVoteActivity : formData.vote_activity
            const finalDepartment = isOthersDepartment ? manualDepartment : formData.department
            const finalCategory = isOthersCategory ? manualCategory : formData.category

            if (finalVoteCode && finalVoteActivity && finalDepartment && finalCategory) {
                setIsRefreshingWarrant(true)
                try {
                    // finalDepartment is now the value (unit code like 'pharmacy')
                    // unless it's a manual entry from 'Others'
                    const deptValue = isOthersDepartment
                        ? finalDepartment
                        : (WARRANT_DEPARTMENTS.find(d => d.value === finalDepartment)?.value || finalDepartment)

                    const res = await getWarrantSummary(hospitalId, new Date().getFullYear(), {
                        voteCode: finalVoteCode as any,
                        department: deptValue as any,
                        category: finalCategory as any
                    })
                    if (res.data) setWarrantSummary(res.data)
                } finally {
                    setIsRefreshingWarrant(false)
                }
            } else {
                setWarrantSummary(null)
            }
        }

        void refreshWarrant()
    }, [
        hospitalId,
        formData.vote_code, formData.vote_activity, formData.department, formData.category,
        manualVoteCode, manualVoteActivity, manualDepartment, manualCategory,
        isOthersVoteCode, isOthersVoteActivity, isOthersDepartment, isOthersCategory
    ])



    // Empty item template
    const emptyItem = {
        item_type: 'manual' as const,
        item_name: '',
        item_code: '',
        quantity: 1,
        unit_price: 0,
        packaging_description: '',
    }

    const handleInputChange = (field: keyof PurchaseOrderFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleItemChange = (index: number, field: string, value: any) => {
        setFormData((prev) => {
            const newItems = [...(prev.items || [])]
            newItems[index] = { ...newItems[index], [field]: value }
            return { ...prev, items: newItems }
        })
    }

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), { ...emptyItem }]
        }))
    }

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items?.filter((_, i) => i !== index) || []
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!hospitalId || !userId) {
            showError('Error', 'User information not available')
            return
        }

        if (!formData.manual_supplier_name?.trim()) {
            showError('Validation Error', 'Please enter a supplier name')
            return
        }

        if (!formData.vote_code || !formData.vote_activity || !formData.department) {
            showError('Validation Error', 'Please fill in all required fields')
            return
        }

        // Filter out items that are completely empty (accidental clicks)
        const finalItems = (formData.items || []).filter(item =>
            item.item_name?.trim() || item.item_code?.trim() || Number(item.unit_price) > 0
        )

        if (finalItems.length === 0) {
            showError('Validation Error', 'Please add at least one item with a name')
            return
        }

        // Validate remaining items
        for (let i = 0; i < finalItems.length; i++) {
            const item = finalItems[i];
            if (!item.item_name?.trim()) {
                showError('Validation Error', `Item #${i + 1} must have a name`);
                return;
            }
            if (Number(item.quantity) <= 0) {
                showError('Validation Error', `Item #${i + 1} quantity must be greater than 0`);
                return;
            }
            if (Number(item.unit_price) <= 0) {
                showError('Validation Error', `Item #${i + 1} price must be greater than 0`);
                return;
            }
        }

        setIsSubmitting(true)

        try {
            const finalVoteCode = isOthersVoteCode ? manualVoteCode : formData.vote_code
            const finalVoteActivity = isOthersVoteActivity ? manualVoteActivity : formData.vote_activity
            const finalDepartment = isOthersDepartment ? manualDepartment : formData.department
            const finalCategory = isOthersCategory ? manualCategory : formData.category

            const submitData: PurchaseOrderFormData = {
                po_type: 'manual',
                supplier_id: formData.supplier_id || undefined,
                manual_supplier_name: formData.manual_supplier_name!,
                vote_code: finalVoteCode!,
                vote_activity: finalVoteActivity!,
                category: finalCategory!,
                department: finalDepartment!,
                expected_delivery_date: formData.expected_delivery_date,
                payment_terms: formData.payment_terms,
                delivery_address: formData.delivery_address,
                notes: formData.notes,
                status: 'pending_approval',
                items: finalItems as any[],
            }

            const result = isEdit
                ? await updatePurchaseOrder(poId!, userId, submitData)
                : await createPurchaseOrder(hospitalId, userId, submitData)

            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', isEdit ? 'Manual Purchase Order updated successfully' : 'Manual Purchase Order created successfully')
                navigate(ROUTES.PHARMACY_PO)
            }
        } catch (error) {
            console.error('Error saving purchase order:', error)
            showError('Error', 'Failed to create purchase order')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
                                    <ShoppingCart className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-wide uppercase">
                                        {isEdit ? 'Edit Manual Purchase Order' : 'Manual Purchase Order'}
                                    </h1>
                                    <p className="text-sm text-emerald-100 mt-0.5 font-medium">
                                        Create PO for items not in system catalog
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(ROUTES.PHARMACY_PO)}
                                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-sm"
                            >
                                Cancel
                            </Button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 h-8 px-4 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-lg hover:shadow-xl border-2 border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                                {isSubmitting ? 'Sending...' : isEdit ? 'Update Manual PO' : 'Send for Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-600 rounded-lg p-2">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Manual PO Details</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Searchable Supplier Dropdown */}
                                <div className="space-y-2 relative">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Supplier Name <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            value={formData.manual_supplier_name}
                                            onChange={(e) => {
                                                handleInputChange('manual_supplier_name', e.target.value)
                                                handleInputChange('supplier_id', '') // Clear ID if typing
                                                setShowSupplierSuggestions(true)
                                            }}
                                            onFocus={() => setShowSupplierSuggestions(true)}
                                            placeholder="Search existing or enter new..."
                                            className="h-11 border-orange-200 focus:ring-orange-500 pr-10"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    {showSupplierSuggestions && (
                                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[500px] overflow-y-auto z-[60]">
                                            {suppliers
                                                .filter(s => s.company_name?.toLowerCase().includes((formData.manual_supplier_name || '').toLowerCase()))
                                                .map((sup, idx) => (
                                                    <button
                                                        key={sup.id || `sup-${idx}`}
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange('manual_supplier_name', sup.company_name)
                                                            handleInputChange('supplier_id', sup.id)
                                                            setShowSupplierSuggestions(false)
                                                        }}
                                                        className="w-full text-left px-6 py-5 hover:bg-emerald-50 text-base font-semibold border-b border-gray-100 last:border-0 transition-colors"
                                                    >
                                                        {sup.company_name}
                                                    </button>
                                                ))
                                            }
                                            <button
                                                type="button"
                                                onClick={() => setShowSupplierSuggestions(false)}
                                                className="w-full text-center py-4 text-sm text-blue-600 bg-gray-50 font-bold hover:bg-gray-100 transition-colors"
                                            >
                                                Done / Close
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Vote Code */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Vote Code <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={isOthersVoteCode ? 'others' : formData.vote_code || ''}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === 'others') {
                                                    setIsOthersVoteCode(true)
                                                    handleInputChange('vote_code', '')
                                                } else {
                                                    setIsOthersVoteCode(false)
                                                    handleInputChange('vote_code', val)
                                                }
                                            }}
                                            required
                                            className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="">Select Vote Code</option>
                                            {VOTE_CODES.map((code) => (
                                                <option key={code.value} value={code.value}>
                                                    {code.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {isOthersVoteCode && (
                                        <Input
                                            value={manualVoteCode}
                                            onChange={(e) => setManualVoteCode(e.target.value)}
                                            placeholder="Enter Vote Code manually..."
                                            className="mt-2"
                                        />
                                    )}
                                </div>

                                {/* Vote Activity */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Vote Activity <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={isOthersVoteActivity ? 'others' : formData.vote_activity || ''}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === 'others') {
                                                    setIsOthersVoteActivity(true)
                                                    handleInputChange('vote_activity', '')
                                                } else {
                                                    setIsOthersVoteActivity(false)
                                                    handleInputChange('vote_activity', val)
                                                }
                                            }}
                                            required
                                            className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="">Select Activity</option>
                                            {VOTE_ACTIVITIES.map((act) => (
                                                <option key={act.value} value={act.value}>
                                                    {act.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {isOthersVoteActivity && (
                                        <Input
                                            value={manualVoteActivity}
                                            onChange={(e) => setManualVoteActivity(e.target.value)}
                                            placeholder="Enter Vote Activity manually..."
                                            className="mt-2"
                                        />
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Category <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={isOthersCategory ? 'others' : formData.category || ''}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === 'others') {
                                                    setIsOthersCategory(true)
                                                    handleInputChange('category', '')
                                                } else {
                                                    setIsOthersCategory(false)
                                                    handleInputChange('category', val)
                                                }
                                            }}
                                            required
                                            className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="">Select Category</option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {isOthersCategory && (
                                        <Input
                                            value={manualCategory}
                                            onChange={(e) => setManualCategory(e.target.value)}
                                            placeholder="Enter Category manually..."
                                            className="mt-2"
                                        />
                                    )}
                                </div>

                                {/* Department */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Department <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={isOthersDepartment ? 'others' : formData.department || ''}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === 'others') {
                                                    setIsOthersDepartment(true)
                                                    handleInputChange('department', '')
                                                } else {
                                                    setIsOthersDepartment(false)
                                                    handleInputChange('department', val)
                                                }
                                            }}
                                            className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {WARRANT_DEPARTMENTS.map((d, idx) => (
                                                <option key={`${d.value}-${idx}`} value={d.value}>{d.label}</option>
                                            ))}
                                            <option value="others">Others (Manual Entry)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {isOthersDepartment && (
                                        <Input
                                            value={manualDepartment}
                                            onChange={(e) => setManualDepartment(e.target.value)}
                                            placeholder="Enter Department manually..."
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary Tracking */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 rounded-lg p-2 text-white">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Warrant Allocation & Summary</h2>
                            </div>
                            {isRefreshingWarrant && (
                                <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
                                    <Spinner size="sm" /> Calculating live balance...
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Allocation</span>
                                    <span className="text-xl font-extrabold text-blue-800">
                                        RM {warrantSummary ? warrantSummary.total_allocation.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-1">Utilized / Liabilities</span>
                                    <span className="text-xl font-extrabold text-red-600">
                                        RM {warrantSummary ? warrantSummary.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                                    </span>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-100 flex flex-col items-center justify-center text-center shadow-inner">
                                    <span className="text-xs font-bold text-emerald-600 uppercase mb-1">Current PO Total</span>
                                    <span className="text-xl font-extrabold text-emerald-800">
                                        RM {currentPoTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 ${(warrantSummary?.total_balance ?? 0) - currentPoTotal < 0
                                    ? 'bg-red-600 border-red-700 text-white animate-pulse'
                                    : 'bg-indigo-600 border-indigo-700 text-white'
                                    }`}>
                                    <span className="text-xs font-bold uppercase opacity-80 mb-1">Projected Balance</span>
                                    <span className="text-2xl font-black">
                                        RM {warrantSummary
                                            ? (warrantSummary.total_balance - currentPoTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            : '0.00'
                                        }
                                    </span>
                                    {(warrantSummary?.total_balance ?? 0) - currentPoTotal < 0 && (
                                        <span className="text-[10px] font-bold mt-1 uppercase">Insufficient Funds!</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-600 rounded-lg p-2">
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Manual Items</h2>
                            </div>
                            <Button size="sm" onClick={addItem} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                <Plus className="w-4 h-4" /> Add Item
                            </Button>
                        </div>

                        <div className="p-6">
                            {(!formData.items || formData.items.length === 0) ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                        <ShoppingCart className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="font-semibold text-gray-600">No items added to this PO.</p>
                                    <p className="text-sm mt-1">Click the "Add Item" button above to start.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-gray-50/30">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-gray-100/80 text-gray-700 uppercase text-[10px] font-black tracking-widest border-b border-gray-200">
                                                <th className="px-4 py-3 text-center w-12">#</th>
                                                <th className="px-4 py-3">Item Name & Description</th>
                                                <th className="px-4 py-3 w-40">Item Code</th>
                                                <th className="px-4 py-3 w-36 text-right">Unit Price (RM)</th>
                                                <th className="px-4 py-3 w-24 text-center">Qty</th>
                                                <th className="px-4 py-3 w-44">Packaging Info</th>
                                                <th className="px-4 py-3 w-40 text-right">Total (RM)</th>
                                                <th className="px-4 py-3 w-16 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, index) => (
                                                <tr key={index} className="bg-white border-b border-gray-100 hover:bg-emerald-50/20 transition-colors group">
                                                    <td className="px-4 py-3 text-center font-bold text-gray-400 text-xs">{index + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            value={item.item_name}
                                                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                            placeholder="Enter item name..."
                                                            className="border-gray-200 focus:border-emerald-500 h-9 text-sm font-semibold text-gray-800"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            value={item.item_code}
                                                            onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                                                            placeholder="Optional"
                                                            className="border-gray-200 focus:border-emerald-500 h-9 text-xs font-medium"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            className="text-right border-gray-200 focus:border-emerald-500 h-9 text-sm font-bold text-gray-700"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="text-center border-gray-200 focus:border-emerald-500 h-9 text-sm font-bold text-gray-700"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            value={item.packaging_description}
                                                            onChange={(e) => handleItemChange(index, 'packaging_description', e.target.value)}
                                                            placeholder="e.g. Pack of 12"
                                                            className="border-gray-200 focus:border-emerald-500 h-9 text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-sm font-black text-gray-900 pr-2">
                                                            {(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 font-bold border-t-2 border-gray-100">
                                                <td colSpan={6} className="px-6 py-4 text-right text-gray-600 uppercase text-xs tracking-widest">
                                                    Grand Total
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-xl font-black text-emerald-800">
                                                        RM {currentPoTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(-1)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                        >
                            {isSubmitting ? (
                                <><Spinner className="w-4 h-4 mr-2" /> Saving...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Send for Approval</>
                            )}
                        </Button>
                    </div>
                </form>
            </div >
        </div >
    )
}

export default ManualPoCreatePage
