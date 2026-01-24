import React, { useState, useEffect, useRef } from 'react'

import { useNavigate, useLocation } from 'react-router-dom'
import {
    ShoppingCart, Save, FileText, ChevronDown, Trash2, Plus, X,
    Calculator, Wallet, TrendingUp, AlertCircle, Package
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Spinner, ConfirmationDialog, AutoExpandingTextarea } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { createPurchaseOrder, updatePurchaseOrder, getPurchaseOrderById, getActiveSuppliers } from '@/services/pharmacy/procurementService'
import { WARRANT_DEPARTMENTS, WARRANT_VOTE_CODES, WARRANT_VOTE_ACTIVITIES, WARRANT_CATEGORIES, getWarrantSummary } from '@/services/pharmacy/warrantService'
import { ROUTES } from '@/lib/constants'
import type { PurchaseOrderFormData, WarrantSummary } from '@/types/pharmacy'

const VOTE_CODES = [
    ...WARRANT_VOTE_CODES.map(v => ({ value: v.value, label: `${v.value} ${v.label}` })),
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
    const isSessionReady = useIsSessionReady()
    const { success: showSuccess, error: showError } = useToastStore()
    const hospitalId = user?.hospital_id
    const userId = user?.id

    // Form state
    const [formData, setFormData] = useState<Partial<PurchaseOrderFormData>>({
        po_type: 'manual',
        supplier_id: '',
        manual_supplier_name: '',
        manual_supplier_address: '',
        vote_code: '',
        vote_activity: '',
        category: 'non_drug',
        department: '',
        program_name: '',
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

    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const supplierRef = useRef<HTMLDivElement>(null)

    // Click outside to close supplier suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
                setShowSupplierSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!isSessionReady || !hospitalId) return
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
                        manual_supplier_address: po.manual_supplier_address,
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

                    // Handle "Others" state for edit
                    if (!VOTE_CODES.some(c => c.value === po.vote_code)) {
                        setIsOthersVoteCode(true)
                        setManualVoteCode(po.vote_code || '')
                    }
                    if (!VOTE_ACTIVITIES.some(a => a.value === po.vote_activity)) {
                        setIsOthersVoteActivity(true)
                        setManualVoteActivity(po.vote_activity || '')
                    }
                    if (!WARRANT_DEPARTMENTS.some(d => d.value === po.department)) {
                        setIsOthersDepartment(true)
                        setManualDepartment(po.department || '')
                    }
                    if (!CATEGORIES.some(c => c.value === po.category)) {
                        setIsOthersCategory(true)
                        setManualCategory(po.category || '')
                    }
                    if (po.program_name) {
                        setFormData(prev => ({ ...prev, program_name: po.program_name }))
                    }
                }
            }
            void loadPo()
        }
    }, [isSessionReady, hospitalId, isEdit, poId])

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate live total
    useEffect(() => {
        const total = (formData.items || []).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)
        setCurrentPoTotal(total)
    }, [formData.items])

    // Activity to Category Auto-mapping
    useEffect(() => {
        const activity = formData.vote_activity
        if (!activity || isOthersVoteActivity) return

        let autoCategory = ''
        if (activity === '27401') autoCategory = 'drug'
        else if (activity === '27499') autoCategory = 'non_drug'
        else if (activity === '27404') autoCategory = 'vaccine'
        else if (activity === '27403') autoCategory = 'reagent'

        if (autoCategory && formData.category !== autoCategory) {
            setFormData(prev => ({
                ...prev,
                category: autoCategory
            }))
            showSuccess('Auto-filled', `Category set to ${autoCategory} for activity ${activity}`)
        }
    }, [formData.vote_activity, isOthersVoteActivity])

    // Load Warrant Summary when financial filters change
    useEffect(() => {
        if (!isSessionReady || !hospitalId) return

        const refreshWarrant = async () => {
            const finalVoteCode = isOthersVoteCode ? manualVoteCode : formData.vote_code
            const finalVoteActivity = isOthersVoteActivity ? manualVoteActivity : formData.vote_activity
            const finalDepartment = isOthersDepartment ? manualDepartment : formData.department
            const finalCategory = isOthersCategory ? manualCategory : formData.category

            if (finalVoteCode && finalVoteActivity && finalDepartment && finalCategory) {
                setIsRefreshingWarrant(true)
                try {
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
        isSessionReady,
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!hospitalId || !userId) {
            showError('Error', 'User information not available')
            return
        }

        if (!formData.manual_supplier_name?.trim()) {
            showError('Validation Error', 'Please enter a supplier name')
            return
        }

        // Filter out items that are completely empty
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
                manual_supplier_address: formData.manual_supplier_address,
                vote_code: finalVoteCode,
                vote_activity: finalVoteActivity,
                category: finalCategory,
                department: finalDepartment,
                expected_delivery_date: formData.expected_delivery_date,
                payment_terms: formData.payment_terms,
                delivery_address: formData.delivery_address,
                notes: formData.notes,
                program_name: isOthersVoteCode ? formData.program_name : undefined,
                status: 'pending_approval',
                items: finalItems as any[],
            }

            const result = isEdit
                ? await updatePurchaseOrder(poId!, userId, submitData)
                : await createPurchaseOrder(hospitalId, userId, submitData)

            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', isEdit ? 'Manual PO updated successfully' : 'Manual PO created successfully')
                navigate(ROUTES.PHARMACY_PO)
            }
        } catch (error) {
            console.error('Error saving purchase order:', error)
            showError('Error', 'Failed to create purchase order')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 2,
        }).format(amount)
    }

    const headerActions = (
        <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                onClick={() => setShowCancelDialog(true)}
                className="text-slate-500 hover:bg-slate-100"
            >
                Cancel
            </Button>
            <Button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className={`gap-2 shadow-lg transition-all ${isSubmitting ? 'bg-slate-100' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-xl'}`}
            >
                {isSubmitting ? <Spinner size="sm" className="text-emerald-600" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? 'Sending...' : isEdit ? 'Update Manual PO' : 'Send for Approval'}
            </Button>
        </div>
    )

    return (
        <FinancialPageLayout
            title={isEdit ? 'Edit Manual Purchase Order' : 'Manual Purchase Order'}
            description="Create procurement orders for items not in the official system catalog."
            icon={ShoppingCart}
            breadcrumbs={[
                { label: 'Procurement', href: '#' },
                { label: 'Purchase Orders', href: ROUTES.PHARMACY_PO },
                { label: 'Manual' }
            ]}
            actions={headerActions}
        >
            <div className="space-y-8 pb-20">
                {/* Details Section */}
                <div className="glass-card rounded-2xl p-6 relative z-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none opacity-50" />

                    <div className="flex items-center gap-3 mb-6 relative">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Manual PO Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                        {/* Supplier Section */}
                        <div className="space-y-4 lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            <div className="space-y-2 relative item-search-container" ref={supplierRef}>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier Name <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <Input
                                        value={formData.manual_supplier_name}
                                        onChange={(e) => {
                                            handleInputChange('manual_supplier_name', e.target.value)
                                            handleInputChange('supplier_id', '')
                                            setShowSupplierSuggestions(true)
                                        }}
                                        onFocus={() => setShowSupplierSuggestions(true)}
                                        placeholder="Search or enter new..."
                                        className="h-11 bg-white/50 border-slate-200 focus:border-emerald-500 rounded-xl pr-10"
                                    />
                                    {formData.manual_supplier_name ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleInputChange('manual_supplier_name', '')
                                                handleInputChange('supplier_id', '')
                                                handleInputChange('manual_supplier_address', '')
                                                setShowSupplierSuggestions(false)
                                            }}
                                            className="absolute right-10 top-3 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                                    )}
                                </div>

                                {showSupplierSuggestions && suppliers.length > 0 && (
                                    <AnimatePresence>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 max-h-[600px] overflow-y-auto"
                                        >
                                            {suppliers
                                                .filter(s => s.company_name?.toLowerCase().includes((formData.manual_supplier_name || '').toLowerCase()))
                                                .map((sup) => (
                                                    <div
                                                        key={sup.id}
                                                        onClick={() => {
                                                            handleInputChange('manual_supplier_name', sup.company_name)
                                                            handleInputChange('supplier_id', sup.id)
                                                            if (sup.address) handleInputChange('manual_supplier_address', sup.address)
                                                            setShowSupplierSuggestions(false)
                                                        }}
                                                        className="p-4 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors font-medium text-slate-700"
                                                    >
                                                        {sup.company_name}
                                                    </div>
                                                ))
                                            }
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier Address</label>
                                <AutoExpandingTextarea
                                    value={formData.manual_supplier_address || ''}
                                    onChange={(e) => handleInputChange('manual_supplier_address', e.target.value)}
                                    placeholder="Full mailing address..."
                                    className="h-auto bg-white/50 border-slate-200 focus:border-emerald-500 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Standard Selects */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vote Code</label>
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
                                            handleInputChange('program_name', '')
                                        }
                                    }}
                                    className="w-full h-11 pl-3 pr-10 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="">Select Vote Code</option>
                                    {VOTE_CODES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {isOthersVoteCode && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-2 mt-2"
                                >
                                    <Input
                                        value={manualVoteCode}
                                        onChange={(e) => setManualVoteCode(e.target.value)}
                                        placeholder="Enter Manual Vote Code..."
                                        className="h-10 border-emerald-200"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vote Activity</label>
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
                                    className="w-full h-11 pl-3 pr-10 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="">Select Activity</option>
                                    {VOTE_ACTIVITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {isOthersVoteActivity && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                    <Input
                                        value={manualVoteActivity}
                                        onChange={(e) => setManualVoteActivity(e.target.value)}
                                        placeholder="Enter Manual Activity..."
                                        className="mt-2 h-10"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
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
                                    className="w-full h-11 pl-3 pr-10 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {isOthersCategory && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                    <Input
                                        value={manualCategory}
                                        onChange={(e) => setManualCategory(e.target.value)}
                                        placeholder="Enter Manual Category..."
                                        className="mt-2 h-10"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
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
                                    className="w-full h-11 pl-3 pr-10 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none appearance-none"
                                >
                                    <option value="">Select Department</option>
                                    {WARRANT_DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    <option value="others">Others (Manual Entry)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {isOthersDepartment && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                    <Input
                                        value={manualDepartment}
                                        onChange={(e) => setManualDepartment(e.target.value)}
                                        placeholder="Enter Manual Department..."
                                        className="mt-2 h-10"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Full Width Program Name */}
                        <AnimatePresence mode="wait">
                            {isOthersVoteCode && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="lg:col-span-3 space-y-2 overflow-hidden"
                                >
                                    <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider ml-1">Program Name</label>
                                    <AutoExpandingTextarea
                                        value={formData.program_name || ''}
                                        onChange={(e) => handleInputChange('program_name', e.target.value)}
                                        placeholder="eg: Taklimat Perolehan Hospital 2026"
                                        className="h-auto bg-white/50 border-emerald-200 focus:border-emerald-500 rounded-xl"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Warrant Summary KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Allocation */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group border-l-4 border-l-blue-500"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet className="w-12 h-12 text-blue-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Allocation</p>
                        <h4 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            {formatCurrency(warrantSummary?.total_allocation || 0)}
                            {isRefreshingWarrant && <Spinner className="w-3 h-3" />}
                        </h4>
                        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                className="h-full bg-blue-500"
                            />
                        </div>
                    </motion.div>

                    {/* Utilized */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group border-l-4 border-l-orange-500"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-12 h-12 text-orange-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Utilized / Liabilities</p>
                        <h4 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            {formatCurrency(warrantSummary?.total_expenses || 0)}
                            {isRefreshingWarrant && <Spinner className="w-3 h-3" />}
                        </h4>
                        <div className="mt-2 text-[10px] font-bold text-orange-500 uppercase">
                            {(warrantSummary?.usage_percentage || 0).toFixed(1)}% Consumption
                        </div>
                    </motion.div>

                    {/* Current PO */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card p-6 rounded-2xl relative overflow-hidden group border-l-4 border-l-emerald-500"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-12 h-12 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current PO Total</p>
                        <h4 className="text-2xl font-black text-emerald-700">
                            {formatCurrency(currentPoTotal)}
                        </h4>
                        <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase">
                            {formData.items?.length || 0} Manual Items
                        </div>
                    </motion.div>

                    {/* Balance */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className={`p-6 rounded-2xl relative overflow-hidden group border-l-4 shadow-lg ${(warrantSummary?.total_balance || 0) - currentPoTotal < 0
                            ? 'bg-red-500 border-l-red-700 text-white animate-pulse'
                            : 'glass-card border-l-violet-500'
                            }`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Calculator className="w-12 h-12" />
                        </div>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${(warrantSummary?.total_balance || 0) - currentPoTotal < 0 ? 'text-red-100' : 'text-slate-500'
                            }`}>Projected Balance</p>
                        <h4 className={`text-2xl font-black ${(warrantSummary?.total_balance || 0) - currentPoTotal < 0 ? 'text-white' : 'text-violet-700'
                            }`}>
                            {formatCurrency((warrantSummary?.total_balance || 0) - currentPoTotal)}
                        </h4>
                        {(warrantSummary?.total_balance || 0) - currentPoTotal < 0 && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase">
                                <AlertCircle className="w-3 h-3" /> Over Budget
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Items Section */}
                <div className="glass-card rounded-2xl p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Manual Items</h2>
                                <p className="text-xs text-slate-500">Add logic items manually without catalog IDs.</p>
                            </div>
                        </div>
                        <Button
                            onClick={addItem}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-emerald-200 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </Button>
                    </div>

                    <div className="overflow-hidden bg-slate-50/50 rounded-xl border border-slate-100">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">#</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name & Description</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Price (MYR)</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Qty</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">Total</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence mode="popLayout">
                                    {(formData.items || []).map((item, index) => (
                                        <motion.tr
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white hover:bg-emerald-50/30 transition-colors"
                                        >
                                            <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-2">
                                                    <AutoExpandingTextarea
                                                        value={item.item_name}
                                                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                        placeholder="Full item name and description..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:bg-white focus:border-emerald-500 transition-all shadow-sm"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <AutoExpandingTextarea
                                                            value={item.item_code}
                                                            onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                                                            placeholder="Item Code (Optional)"
                                                            className="min-h-[32px] text-[10px] font-mono py-1.5 rounded-lg"
                                                            maxHeight="100px"
                                                        />
                                                        <AutoExpandingTextarea
                                                            value={item.packaging_description}
                                                            onChange={(e) => handleItemChange(index, 'packaging_description', e.target.value)}
                                                            placeholder="Packaging (e.g. Box of 10)"
                                                            className="min-h-[32px] text-[10px] py-1.5 rounded-lg"
                                                            maxHeight="100px"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="h-10 text-right font-bold text-slate-700"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="h-10 text-center font-bold text-slate-700"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900">
                                                    {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-100">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-xl font-black text-emerald-800">
                                            {formatCurrency(currentPoTotal)}
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>

                        {(!formData.items || formData.items.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
                                <ShoppingCart className="w-12 h-12 mb-3 text-slate-200" />
                                <p className="font-semibold text-slate-600">No manual items added</p>
                                <p className="text-sm">Click "Add Item" to describe what you need to purchase</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Final Actions Summary */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Selection</p>
                        <p className="text-sm font-bold text-slate-700">
                            {formData.manual_supplier_name || 'No Supplier'} • {formData.items?.length || 0} Items
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setShowCancelDialog(true)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleSubmit()}
                            disabled={isSubmitting}
                            className={`gap-2 min-w-[180px] h-11 ${isSubmitting ? 'bg-slate-100' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-200 shadow-lg'}`}
                        >
                            {isSubmitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                            {isSubmitting ? 'Processing...' : 'Send for Approval'}
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={() => navigate(ROUTES.PHARMACY_PO)}
                title="Discard Changes?"
                message="Are you sure you want to cancel? All entries in this manual PO will be permanently lost."
                variant="danger"
                confirmText="Yes, Discard All"
                cancelText="Stay on Page"
            />
        </FinancialPageLayout>
    )
}

export default ManualPoCreatePage
