
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    ShoppingCart, Save, FileText, Trash2, Users, Search,
    ChevronRight, CheckCircle2, Building2, Store, Eye, X,
    AlertCircle, FileInput, Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Spinner, Badge, Select } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { createPurchaseOrder, updatePurchaseOrder, getActiveSuppliers, getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { searchDrugs } from '@/services/pharmacy/drugCatalogService'
import { searchNonDrugs } from '@/services/pharmacy/nonDrugCatalogService'
import { WARRANT_VOTE_CODES, WARRANT_VOTE_ACTIVITIES, WARRANT_CATEGORIES } from '@/services/pharmacy/warrantService'
import { ROUTES } from '@/lib/constants'
import type { PurchaseOrderFormData, POItem, Supplier, Drug, NonDrug } from '@/types/pharmacy'

export const InvSqCreatePage: React.FC = () => {
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
        po_type: 'sq',
        vote_code: '',
        vote_activity: '',
        category: 'drug',
        department: '',
        items: [],
        sq_suppliers: [],
    })

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    // Item Search
    const [itemSearch, setItemSearch] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [allItems, setAllItems] = useState<Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })>>([])
    const searchRef = useRef<HTMLDivElement>(null)

    // Supplier Search
    const [supplierSearch, setSupplierSearch] = useState('')

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!hospitalId) return
        const loadData = async () => {
            const res = await getActiveSuppliers(hospitalId)
            if (res.data) {
                setSuppliers(res.data)

                if (isEdit) {
                    const poRes = await getPurchaseOrderById(poId!)
                    if (poRes.data) {
                        const po = poRes.data
                        setFormData({
                            po_type: 'sq',
                            vote_code: po.vote_code,
                            vote_activity: po.vote_activity,
                            category: po.category,
                            department: po.department,
                            items: po.items?.map(item => ({
                                item_type: item.item_type,
                                item_id: item.item_id,
                                quantity: item.quantity_ordered,
                                unit_price: item.unit_price,
                                packaging_description: item.packaging_description,
                                item_name: item.item_name,
                                item_code: item.item_code,
                            })) || [],
                            sq_suppliers: po.sq_suppliers,
                            notes: po.notes,
                        })

                        if (po.sq_suppliers && po.sq_suppliers.length > 0) {
                            const selected = res.data.filter(s => po.sq_suppliers?.includes(s.company_name))
                            setSelectedSuppliers(selected)
                        }
                    }
                }
            }
        }
        void loadData()
    }, [hospitalId, isEdit, poId])

    // Search Items Side Effect
    useEffect(() => {
        if (!hospitalId || !itemSearch.trim()) {
            setAllItems([])
            setShowSuggestions(false)
            return
        }

        const loadItems = async () => {
            try {
                const [drugsRes, nonDrugsRes] = await Promise.all([
                    searchDrugs(hospitalId, itemSearch, 10),
                    searchNonDrugs(hospitalId, itemSearch, 10),
                ])

                const combinedItems: Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })> = []

                if (drugsRes.data) {
                    drugsRes.data.forEach((drug) => combinedItems.push({ ...drug, item_type: 'drug' }))
                }
                if (nonDrugsRes.data) {
                    nonDrugsRes.data.forEach((nonDrug) => combinedItems.push({ ...nonDrug, item_type: 'non_drug' }))
                }

                setAllItems(combinedItems)
                setShowSuggestions(combinedItems.length > 0)
            } catch (error) {
                console.error('Error loading items:', error)
            }
        }

        const timeout = setTimeout(() => {
            void loadItems()
        }, 300)

        return () => clearTimeout(timeout)
    }, [itemSearch, hospitalId])

    const toggleSupplier = (supplier: Supplier) => {
        if (selectedSuppliers.some(s => s.id === supplier.id)) {
            setSelectedSuppliers(prev => prev.filter(s => s.id !== supplier.id))
        } else {
            setSelectedSuppliers(prev => [...prev, supplier])
        }
    }

    const addItem = (item: (Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })) => {
        if ((formData.items?.length || 0) >= 10) {
            showError('Limit Reached', 'Maximum 10 items allowed for Quotation')
            return
        }

        const newItem: POItem = {
            item_type: item.item_type,
            item_id: item.id,
            quantity: 1,
            unit_price: 0,
            packaging_description: item.packaging_description || '',
            item_name: 'drug_name' in item ? item.drug_name : item.item_name,
            item_code: 'drug_code' in item ? item.drug_code : item.item_code,
        }

        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }))
        setItemSearch('')
        setShowSuggestions(false)
    }

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items?.filter((_, i) => i !== index) || []
        }))
    }

    const handleQuantityChange = (index: number, qty: number) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])]
            newItems[index] = { ...newItems[index], quantity: qty }
            return { ...prev, items: newItems }
        })
    }

    const handlePackagingChange = (index: number, pkg: string) => {
        setFormData(prev => {
            const newItems = [...(prev.items || [])]
            newItems[index] = { ...newItems[index], packaging_description: pkg }
            return { ...prev, items: newItems }
        })
    }

    const handleInputChange = (field: keyof PurchaseOrderFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        if (!hospitalId || !userId) {
            showError('Error', 'User information not available')
            return
        }

        if (selectedSuppliers.length === 0) {
            showError('Validation Error', 'Please select at least one supplier')
            return
        }

        if (!formData.items || formData.items.length === 0) {
            showError('Validation Error', 'Please add at least one item')
            return
        }

        setIsSubmitting(true)

        try {
            const submitData: PurchaseOrderFormData = {
                po_type: 'sq',
                supplier_id: undefined,
                manual_supplier_name: '',
                sq_suppliers: selectedSuppliers.map(s => s.company_name),
                vote_code: formData.vote_code || '080702',
                vote_activity: formData.vote_activity || '27401',
                category: formData.category || 'drug',
                department: formData.department || 'pharmacy',
                items: formData.items,
                notes: formData.notes || 'Invitation for Quotation',
            }

            const result = isEdit
                ? await updatePurchaseOrder(poId!, userId, submitData)
                : await createPurchaseOrder(hospitalId, userId, submitData)

            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', isEdit ? 'INV SQ updated successfully' : 'INV SQ created successfully')
                navigate(ROUTES.PHARMACY_PO)
            }
        } catch (error) {
            console.error('Error saving SQ:', error)
            showError('Error', 'Failed to create SQ')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.company_name.toLowerCase().includes(supplierSearch.toLowerCase())
    )

    // Actions Header
    const headerActions = (
        <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                onClick={() => navigate(ROUTES.PHARMACY_PO)}
                className="text-slate-500 hover:bg-slate-100"
            >
                Cancel
            </Button>
            <Button
                onClick={() => setShowPreview(true)}
                disabled={isSubmitting}
                className="bg-royal-blue hover:bg-blue-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all"
            >
                <Eye className="w-4 h-4" /> Review & Create SQ
            </Button>
        </div>
    )

    return (
        <FinancialPageLayout
            title={isEdit ? 'Edit Invitation for Quotation' : 'New Invitation for Quotation'}
            description="Create and send price requests to multiple suppliers simultaneously."
            icon={FileText}
            breadcrumbs={[
                { label: 'Procurement' },
                { label: 'Purchase Orders', href: ROUTES.PHARMACY_PO },
                { label: 'Create SQ' }
            ]}
            actions={headerActions}
        >
            <div className="space-y-8 pb-20">
                {/* 1. Request Details Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-6 relative overflow-hidden"
                >
                    {/* Decorative gradient blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <FileInput className="w-5 h-5 text-royal-blue" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Request Details</h2>
                            <p className="text-xs text-slate-500">Configure financial codes for this quotation request.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vote Code</label>
                            <Select
                                value={formData.vote_code}
                                onChange={(e) => handleInputChange('vote_code', e.target.value)}
                                className="bg-white/50 border-slate-200 focus:border-royal-blue focus:ring-royal-blue/20"
                            >
                                <option value="">Select Vote Code</option>
                                {WARRANT_VOTE_CODES.map(v => (
                                    <option key={v.value} value={v.value}>{v.value} - {v.label}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vote Activity</label>
                            <Select
                                value={formData.vote_activity}
                                onChange={(e) => handleInputChange('vote_activity', e.target.value)}
                                className="bg-white/50 border-slate-200 focus:border-royal-blue focus:ring-royal-blue/20"
                            >
                                <option value="">Select Activity</option>
                                {WARRANT_VOTE_ACTIVITIES.map(a => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                            <Select
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className="bg-white/50 border-slate-200 focus:border-royal-blue focus:ring-royal-blue/20"
                            >
                                {WARRANT_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 2. Supplier Selection (Left - 5 Cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Select Suppliers
                            </h2>
                            <Badge variant="outline" className="bg-white">
                                {selectedSuppliers.length} Selected
                            </Badge>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                            {/* Search */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search suppliers..."
                                        className="pl-9 bg-white border-slate-200"
                                        value={supplierSearch}
                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {filteredSuppliers.map(sup => {
                                    const isSelected = selectedSuppliers.some(s => s.id === sup.id)
                                    return (
                                        <motion.div
                                            key={sup.id}
                                            onClick={() => toggleSupplier(sup)}
                                            className={`
                                                group relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-inner'
                                                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`
                                                    p-2.5 rounded-lg transition-colors
                                                    ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}
                                                `}>
                                                    <Store className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-bold text-sm leading-tight mb-1 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        {sup.company_name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{sup.address || 'No address provided'}</p>
                                                </div>
                                                <div className={`
                                                    w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-indigo-300'}
                                                `}>
                                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                                {filteredSuppliers.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <p>No suppliers found matching "{supplierSearch}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Item Selection (Right - 7 Cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-emerald-500" />
                                Items to Quote
                            </h2>
                            <Badge variant={formData.items!.length >= 10 ? 'destructive' : 'secondary'}>
                                {formData.items?.length || 0}/10 Items
                            </Badge>
                        </div>

                        <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                            {/* Search */}
                            <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-20">
                                <div className="relative" ref={searchRef}>
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                        placeholder="Search for items to add to quotation..."
                                        className="pl-12 h-12 text-lg bg-white shadow-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                                        disabled={(formData.items?.length || 0) >= 10}
                                    />

                                    {/* Suggestions Dropdown */}
                                    <AnimatePresence>
                                        {showSuggestions && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 max-h-[400px] overflow-y-auto z-50 py-2"
                                            >
                                                {allItems.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => addItem(item)}
                                                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-start gap-3 transition-colors group border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="mt-1 p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                            {'drug_name' in item ? <div className="text-[10px] font-bold uppercase">Drug</div> : <div className="text-[10px] font-bold uppercase">Non</div>}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 group-hover:text-emerald-900">
                                                                {'drug_name' in item ? item.drug_name : item.item_name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-50">
                                                                    {'drug_code' in item ? item.drug_code : item.item_code}
                                                                </Badge>
                                                                <span className="text-xs text-slate-400">
                                                                    {item.packaging_description || 'No packaging info'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Added Items List */}
                            <div className="p-6 bg-slate-50/30 flex-1">
                                {formData.items!.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <ShoppingCart className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="font-medium">No items added yet</p>
                                        <p className="text-sm mt-1">Search above to add items to this quotation.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {formData.items!.map((item, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group hover:border-emerald-200 hover:shadow-md transition-all"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                                                {item.item_type === 'drug' ? 'Drug' : 'Item'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 leading-tight">{item.item_name}</h4>
                                                                <p className="text-xs text-slate-400 font-mono mt-0.5">{item.item_code}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Packaging</label>
                                                            <Input
                                                                value={item.packaging_description}
                                                                onChange={(e) => handlePackagingChange(index, e.target.value)}
                                                                className="h-8 text-xs bg-slate-50 border-slate-100 focus:bg-white"
                                                                placeholder="e.g. Box of 10"
                                                            />
                                                        </div>
                                                        <div className="w-24">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quantity</label>
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                                                className="h-8 text-xs font-bold text-center bg-slate-50 border-slate-100 focus:bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Review Quotation Request</h2>
                                    <p className="text-sm text-slate-500">Verify details before creating the invitation.</p>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                                {/* Summary stats */}
                                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vote Code</p>
                                        <p className="font-bold text-slate-800 text-lg">{formData.vote_code || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Activity</p>
                                        <p className="font-bold text-slate-800 text-lg">{formData.vote_activity || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Suppliers</p>
                                        <p className="font-bold text-indigo-600 text-lg">{selectedSuppliers.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Items</p>
                                        <p className="font-bold text-emerald-600 text-lg">{formData.items?.length || 0}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Store className="w-4 h-4 text-indigo-500" /> Selected Suppliers
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedSuppliers.map(s => (
                                                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                        {s.company_name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{s.company_name}</span>
                                                </div>
                                            ))}
                                            {selectedSuppliers.length === 0 && <p className="text-sm text-red-500">No suppliers selected!</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-emerald-500" /> Items List
                                        </h3>
                                        <div className="space-y-2">
                                            {formData.items?.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{item.item_name}</p>
                                                        <p className="text-xs text-slate-500">{item.quantity} x {item.packaging_description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!formData.items || formData.items.length === 0) && <p className="text-sm text-red-500">No items added!</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl">
                                <Button variant="outline" onClick={() => setShowPreview(false)}>Continue Editing</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || selectedSuppliers.length === 0 || !formData.items?.length}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                                >
                                    {isSubmitting ? <Spinner className="text-white" /> : <Save className="w-4 h-4 mr-2" />}
                                    {isEdit ? 'Confirm Update' : 'Confirm Creation'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FinancialPageLayout>
    )
}

export default InvSqCreatePage
