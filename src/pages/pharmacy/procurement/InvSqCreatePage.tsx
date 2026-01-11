import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Save, FileText, Trash2, Users, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Spinner } from '@/components/ui'
import { createPurchaseOrder, updatePurchaseOrder, getActiveSuppliers, getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { searchDrugs } from '@/services/pharmacy/drugCatalogService'
import { searchNonDrugs } from '@/services/pharmacy/nonDrugCatalogService'
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
        vote_code: '', // Not really needed for SQ but good to have context
        vote_activity: '',
        category: 'drug',
        department: '',
        items: [],
        sq_suppliers: [], // List of selected supplier names/IDs
    })

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)


    // Item Search
    const [itemSearch, setItemSearch] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [allItems, setAllItems] = useState<Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })>>([])

    useEffect(() => {
        if (!hospitalId) return
        const loadData = async () => {
            const res = await getActiveSuppliers(hospitalId)
            if (res.data) {
                setSuppliers(res.data)

                // If editing, load PO details
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

                        // Pre-select suppliers based on company names
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

    // Search Items
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
            unit_price: 0, // No price for SQ
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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
                vote_code: '080702', // Default dummy
                vote_activity: '27401', // Default dummy
                category: 'drug', // Default dummy
                department: 'pharmacy',
                items: formData.items,
                notes: 'Invitation for Quotation',
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-900 via-violet-800 to-violet-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-wide uppercase">
                                        {isEdit ? 'Edit Invitation for Quotation (INV SQ)' : 'Invitation for Quotation (INV SQ)'}
                                    </h1>
                                    <p className="text-sm text-violet-100 mt-0.5 font-medium">
                                        Request price quotations from multiple suppliers
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
                                className="flex items-center gap-2 h-8 px-4 rounded-xl bg-white text-violet-900 hover:bg-violet-50 font-semibold shadow-lg hover:shadow-xl border-2 border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                                {isSubmitting ? 'Saving...' : isEdit ? 'Update SQ' : 'Create SQ'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Supplier Selection */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-fit">
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                            <div className="bg-violet-600 rounded-lg p-2">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Select Suppliers</h2>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            <div className="space-y-2">
                                {suppliers.map(sup => (
                                    <label key={sup.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-violet-50 hover:border-violet-200 cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={selectedSuppliers.some(s => s.id === sup.id)}
                                            onChange={() => toggleSupplier(sup)}
                                            className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                        />
                                        <span className="text-gray-900 font-medium">{sup.company_name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Item Selection & List */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                                <div className="bg-blue-600 rounded-lg p-2">
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Items to Quote</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Search Input */}
                                <div className="relative item-search-container z-10">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                        placeholder="Search items to add (max 10)..."
                                        className="pl-9"
                                        disabled={formData.items!.length >= 10}
                                    />
                                    {showSuggestions && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[500px] overflow-y-auto z-50">
                                            {allItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => addItem(item)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col gap-0.5 border-b border-gray-50 last:border-0"
                                                >
                                                    <span className="font-medium text-gray-900">
                                                        {'drug_name' in item ? item.drug_name : item.item_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Code: {'drug_code' in item ? item.drug_code : item.item_code}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* List */}
                                <div className="space-y-3">
                                    {formData.items!.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.item_name}</p>
                                                <p className="text-xs text-gray-500">{item.item_code}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 uppercase font-bold">Qty:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                                                        className="w-16 h-8 rounded border border-gray-300 px-2 text-center"
                                                    />
                                                </div>
                                                <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.items!.length === 0 && (
                                        <p className="text-center text-gray-400 text-sm py-4">No items added yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default InvSqCreatePage
