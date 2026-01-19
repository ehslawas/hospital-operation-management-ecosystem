import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Select, Badge } from '@/components/ui'
import { Plus, Trash2, FileText, ShoppingCart, Calculator, Search, Wind } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { supabase } from '@/services/supabase'
import { getOxygenCylinderSizes } from '@/services/pharmacy/oxygenService'
import { createPurchaseOrder } from '@/services/pharmacy/procurementService'
import type { OxygenCylinderSize, PurchaseOrderFormData, POItem } from '@/types/pharmacy'
import { formatCurrency } from '@/lib/utils'

interface CreateOxygenOrderModalProps {
    isOpen: boolean
    onClose: () => void
}

export const CreateOxygenOrderModal: React.FC<CreateOxygenOrderModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuthStore()
    const toast = useToast()
    const [supplier, setSupplier] = useState<{ id: string, name: string } | null>(null)
    const [isLoadingSupplier, setIsLoadingSupplier] = useState(false)
    const [sizes, setSizes] = useState<OxygenCylinderSize[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [items, setItems] = useState<{ sizeId: string, quantity: number }[]>([])
    const [selectedSize, setSelectedSize] = useState<string>('')
    const [notes, setNotes] = useState('')

    // Fetch Linde Supplier and Sizes
    useEffect(() => {
        const init = async () => {
            setIsLoadingSupplier(true)
            try {
                // Fetch Sizes
                const sizesRes = await getOxygenCylinderSizes()
                if (sizesRes.data) setSizes(sizesRes.data)

                // Fetch Supplier
                const { data } = await supabase
                    .from('suppliers')
                    .select('id, company_name')
                    .ilike('company_name', '%LINDE%')
                    .limit(1)
                    .maybeSingle()

                if (data) {
                    setSupplier({ id: data.id, name: data.company_name })
                } else {
                    // Fallback using mock ID if not found (development safety)
                    console.warn('Linde supplier not found in DB, using fallback')
                    setSupplier({ id: 'sup-017', name: 'Linde Malaysia Sdn Bhd (Medical Oxygen)' })
                }
            } catch (err) {
                console.error('Error initializing oxygen order modal', err)
            } finally {
                setIsLoadingSupplier(false)
            }
        }

        if (isOpen) {
            init()
        }
    }, [isOpen])

    const handleAddItem = () => {
        if (!selectedSize) return

        // Check if already added
        const existing = items.find(i => i.sizeId === selectedSize)
        if (existing) {
            toast.error("Item Exists", "This cylinder size is already in the list. Please update quantity instead.")
            return
        }

        setItems([...items, { sizeId: selectedSize, quantity: 1 }])
        setSelectedSize('')
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleUpdateQuantity = (index: number, quantity: number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], quantity: quantity > 0 ? quantity : 1 }
        setItems(newItems)
    }

    const handleSubmit = async () => {
        if (!user?.hospital_id || !supplier) return

        if (items.length === 0) {
            toast.error('Validation Error', 'Please add at least one cylinder size to the order')
            return
        }

        setIsSubmitting(true)
        try {
            const poItems: POItem[] = items.map(item => {
                const size = sizes.find(s => s.id === item.sizeId)
                return {
                    item_type: 'manual',
                    item_name: `Medical Oxygen Cylinder - ${size?.code || 'Unknown'}`,
                    item_code: size?.code,
                    quantity: item.quantity,
                    unit_price: 0,
                    packaging_description: 'Cylinder'
                }
            })

            const payload: PurchaseOrderFormData = {
                supplier_id: supplier.id,
                vote_code: '080702',
                vote_activity: '27402',
                category: 'medical_oxygen',
                department: 'pharmacy',
                po_type: 'regular',
                payment_terms: '30 Days',
                delivery_address: 'Medical Gas Store, Hospital Daerah Lawas',
                notes: notes,
                items: poItems
            }

            const res = await createPurchaseOrder(user.hospital_id, user.id, payload)

            if (res.error) throw new Error(res.error)

            toast.success('Success', `Purchase Order ${res.data?.po_number} created successfully`)
            onClose()
            setItems([])
            setNotes('')

        } catch (err) {
            console.error(err)
            toast.error('Error', 'Failed to create purchase order')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Supplier Request (Medical Oxygen)"
            size="4xl"
        >
            <div className="space-y-6 bg-slate-50/50 p-1">
                {/* Basic Information - Professional Government Style */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 rounded-lg p-2 shadow-sm">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Basic Information</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Supplier <span className="text-red-600">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        value={supplier?.name || "Loading..."}
                                        disabled
                                        className="bg-slate-50 border-slate-200 text-slate-700 font-bold"
                                    />
                                    {isLoadingSupplier && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Vote Code <span className="text-red-600">*</span>
                                </label>
                                <Input value="080702 - CC/DP" disabled className="bg-slate-50 border-slate-200 text-slate-700 font-bold" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Vote Activity <span className="text-red-600">*</span>
                                </label>
                                <Input value="27402" disabled className="bg-slate-50 border-slate-200 text-slate-700 font-bold" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Category <span className="text-red-600">*</span>
                                </label>
                                <Input value="Medical Oxygen" disabled className="bg-slate-50 border-slate-200 text-slate-700 font-bold" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Department <span className="text-red-600">*</span>
                                </label>
                                <Input value="Pharmacy" disabled className="bg-slate-50 border-slate-200 text-slate-700 font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-600 rounded-lg p-2 shadow-sm">
                                <ShoppingCart className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Items to Purchase</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Search / Add Bar */}
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Wind className="h-4 w-4 text-slate-400" />
                                </div>
                                <Select
                                    value={selectedSize}
                                    onChange={(e) => setSelectedSize(e.target.value)}
                                    options={[
                                        { label: 'Select Oxygen Cylinder Size...', value: '' },
                                        ...sizes.map(s => ({ label: `${s.code} - ${s.name} (${s.capacity} ${s.unit})`, value: s.id }))
                                    ]}
                                    className="pl-10 h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10 shadow-sm transition-all"
                                />
                            </div>
                            <Button
                                onClick={handleAddItem}
                                disabled={!selectedSize}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </div>

                        {/* Items Table */}
                        {items.length > 0 ? (
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Item Description</th>
                                            <th className="px-6 py-4 text-center">Unit</th>
                                            <th className="px-6 py-4 text-center w-32">Quantity</th>
                                            <th className="px-6 py-4 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items.map((item, idx) => {
                                            const size = sizes.find(s => s.id === item.sizeId)
                                            return (
                                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">Medical Oxygen Cylinder - {size?.code}</span>
                                                            <span className="text-xs text-slate-500">{size?.name} ({size?.capacity}{size?.unit})</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="outline" className="font-mono bg-white">CYLINDER</Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 0)}
                                                            className="text-center font-bold h-9 border-slate-200 focus:border-emerald-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <ShoppingCart className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500">No items added yet</p>
                                <p className="text-xs text-slate-400 mt-1">Select a cylinder size above to populate the order.</p>
                            </div>
                        )}

                        {/* Remarks */}
                        <div className="pt-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Remarks</label>
                            <textarea
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
                                placeholder="Enter any specific delivery instructions or important notes..."
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="bg-blue-600 rounded-2xl shadow-lg text-white overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                <Calculator className="w-6 h-6 text-blue-200" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Total Request Estimate</h3>
                                <p className="text-blue-200 text-sm">{items.length} items in manifest</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-white/20 text-blue-100 hover:bg-white/10 hover:text-white hover:border-white/40 h-12 px-6"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                disabled={items.length === 0 || !supplier}
                                className="bg-white text-blue-700 hover:bg-blue-50 h-12 px-8 font-black uppercase tracking-widest text-xs shadow-lg"
                            >
                                Create Purchase Order
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
