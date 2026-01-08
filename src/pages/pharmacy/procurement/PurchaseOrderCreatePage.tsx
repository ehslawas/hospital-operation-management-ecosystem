import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Plus, X, Printer, Save, AlertCircle, Calculator } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Select, Spinner, Badge, ConfirmationDialog } from '@/components/ui'
import { createPurchaseOrder, updatePurchaseOrder, getActiveSuppliers, getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { getDrugCatalog } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog } from '@/services/pharmacy/nonDrugCatalogService'
import { getWarrants, WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'
import { supabase } from '@/services/supabase'
import type { PurchaseOrderFormData, Supplier, Drug, NonDrug, Department, Warrant, PurchaseOrderWithRelations } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

// Constants
const VOTE_CODES = [
  { value: '080702', label: '080702 - CC/DP' },
  { value: '990102', label: '990102 - APPL' },
]

const VOTE_ACTIVITIES = [
  { value: '27401', label: '27401' },
  { value: '27499', label: '27499' },
  { value: '27404', label: '27404' },
  { value: '27403', label: '27403' },
  { value: '27402', label: '27402' },
  { value: '27501', label: '27501' },
]

const CATEGORIES = [
  { value: 'drug', label: 'Drug' },
  { value: 'non_drug', label: 'Non-Drug' },
  { value: 'non_standard', label: 'Non-Standard' },
  { value: 'reagent', label: 'Reagent' },
  { value: 'vaccine', label: 'Vaccine' },
  { value: 'insulin', label: 'Insulin' },
  { value: 'hepc', label: 'HEPC' },
  { value: 'medical_oxygen', label: 'Medical Oxygen' },
]

interface POItem {
  item_type: 'drug' | 'non_drug'
  item_id: string
  quantity: number
  unit_price: number
  packaging_description: string
  item_name?: string
  item_code?: string
}

export const PurchaseOrderCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id
  const userId = user?.id

  // Check if we're in edit mode
  const editMode = (location.state as any)?.mode === 'edit'
  const poId = (location.state as any)?.poId as string | undefined

  // Form state
  const [formData, setFormData] = useState<Partial<PurchaseOrderFormData>>({
    supplier_id: '',
    vote_code: '',
    vote_activity: '',
    category: '',
    department: '',
    items: [],
  })

  // Data loading
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warrants, setWarrants] = useState<Warrant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingPO, setExistingPO] = useState<PurchaseOrderWithRelations | null>(null)

  // Item selection
  const [itemSearch, setItemSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allItems, setAllItems] = useState<Array<Drug | NonDrug & { item_type: 'drug' | 'non_drug' }>>([])

  // Balance calculation
  const [balanceAfterPurchase, setBalanceAfterPurchase] = useState<number | null>(null)
  const [availableBudget, setAvailableBudget] = useState<number>(0)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Load initial data and existing PO if in edit mode
  useEffect(() => {
    if (!hospitalId) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [suppliersRes, warrantsRes] = await Promise.all([
          getActiveSuppliers(hospitalId),
          getWarrants(hospitalId, {}),
        ])

        if (suppliersRes.data) setSuppliers(suppliersRes.data)
        if (warrantsRes.data) setWarrants(warrantsRes.data)

        // Load existing PO if in edit mode
        if (editMode && poId) {
          const poResult = await getPurchaseOrderById(poId)
          if (poResult.error) {
            showError('Error', poResult.error)
            navigate(ROUTES.PHARMACY_PO)
            return
          }

          if (poResult.data) {
            const po = poResult.data
            
            // Check if PO can be edited (only draft status)
            if (po.status !== 'draft') {
              showError('Error', 'Only draft purchase orders can be edited')
              navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', poId))
              return
            }

            setExistingPO(po)

            // Load item details and populate form
            const itemsWithDetails = await Promise.all(
              (po.items || []).map(async (item) => {
                try {
                  let item_name = 'Unknown Item'
                  let item_code = item.item_id

                  if (item.item_type === 'drug') {
                    const { data: drug } = await supabase
                      .from('drugs')
                      .select('drug_name, drug_code')
                      .eq('id', item.item_id)
                      .single()
                    
                    if (drug) {
                      item_name = drug.drug_name || 'Unknown Drug'
                      item_code = drug.drug_code || item.item_id
                    }
                  } else {
                    const { data: nonDrug } = await supabase
                      .from('non_drugs')
                      .select('item_name, item_code')
                      .eq('id', item.item_id)
                      .single()
                    
                    if (nonDrug) {
                      item_name = nonDrug.item_name || 'Unknown Item'
                      item_code = nonDrug.item_code || item.item_id
                    }
                  }

                  return {
                    item_type: item.item_type,
                    item_id: item.item_id,
                    quantity: item.quantity_ordered,
                    unit_price: item.unit_price,
                    packaging_description: item.packaging_description || '',
                    item_name,
                    item_code,
                  }
                } catch (error) {
                  console.error('Error loading item details:', error)
                  return {
                    item_type: item.item_type,
                    item_id: item.item_id,
                    quantity: item.quantity_ordered,
                    unit_price: item.unit_price,
                    packaging_description: item.packaging_description || '',
                    item_name: 'Unknown Item',
                    item_code: item.item_id,
                  }
                }
              })
            )

            // Populate form with existing PO data
            setFormData({
              supplier_id: po.supplier_id,
              vote_code: po.vote_code || '',
              vote_activity: po.vote_activity || '',
              category: po.category || '',
              department: po.department || '',
              expected_delivery_date: po.expected_delivery_date,
              payment_terms: po.payment_terms,
              delivery_address: po.delivery_address,
              notes: po.notes,
              items: itemsWithDetails,
            })
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        showError('Error', 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [hospitalId, editMode, poId, navigate, showError])

  // Load items when searching
  useEffect(() => {
    if (!hospitalId || !itemSearch.trim()) {
      setAllItems([])
      setShowSuggestions(false)
      return
    }

    const loadItems = async () => {
      try {
        const [drugsRes, nonDrugsRes] = await Promise.all([
          getDrugCatalog(hospitalId, { search: itemSearch }, 1, 10),
          getNonDrugCatalog(hospitalId, { search: itemSearch }, 1, 10),
        ])

        const combinedItems: Array<Drug | NonDrug & { item_type: 'drug' | 'non_drug' }> = []
        
        if (drugsRes.data) {
          drugsRes.data.data.forEach((drug) => {
            combinedItems.push({ ...drug, item_type: 'drug' } as Drug & { item_type: 'drug' })
          })
        }
        
        if (nonDrugsRes.data) {
          nonDrugsRes.data.data.forEach((nonDrug) => {
            combinedItems.push({ ...nonDrug, item_type: 'non_drug' } as NonDrug & { item_type: 'non_drug' })
          })
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.item-search-container')) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSuggestions])

  // Calculate balance after purchase
  useEffect(() => {
    if (!formData.vote_code || !formData.vote_activity || !formData.items || formData.items.length === 0) {
      setBalanceAfterPurchase(null)
      return
    }

    const calculateBalance = () => {
      // Get total from current PO items
      const poTotal = formData.items!.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const totalAmount = poTotal

      // Find matching warrant for vote code and activity
      const matchingWarrants = warrants.filter(
        (w) => w.vote_code === formData.vote_code && w.vote_activity === formData.vote_activity
      )

      const totalAllocation = matchingWarrants.reduce((sum, w) => sum + Number(w.amount), 0)

      // Get committed amount from pending/approved POs (simplified - would need to query actual POs)
      // For now, just show available budget minus current PO
      const balance = totalAllocation - totalAmount
      setAvailableBudget(totalAllocation)
      setBalanceAfterPurchase(balance)
    }

    calculateBalance()
  }, [formData.vote_code, formData.vote_activity, formData.items, warrants])

  // No mock items: user will search and add real catalog items only

  const handleInputChange = (field: keyof PurchaseOrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addItem = (item: Drug | NonDrug & { item_type: 'drug' | 'non_drug' }) => {
    if (!formData.items) {
      setFormData((prev) => ({ ...prev, items: [] }))
    }

    if (formData.items!.length >= 5) {
      showError('Maximum Items', 'Maximum 5 items per purchase order')
      return
    }

    const newItem: POItem = {
      item_type: item.item_type,
      item_id: item.id,
      quantity: 1,
      unit_price: item.price ? Number(item.price) : 0,
      packaging_description: item.packaging_description || '',
      item_name: 'drug_name' in item ? item.drug_name : item.item_name,
      item_code: 'drug_code' in item ? item.drug_code : item.item_code,
    }

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }))

    setItemSearch('')
    setShowSuggestions(false)
    setAllItems([])
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items?.map((item, i) => (i === index ? { ...item, [field]: value } : item)) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hospitalId || !userId) {
      showError('Error', 'User information not available')
      return
    }

    // Validation
    if (!formData.vote_code || !formData.vote_activity || !formData.category || !formData.department) {
      showError('Validation Error', 'Please fill in all required fields')
      return
    }

    if (!formData.supplier_id) {
      showError('Validation Error', 'Please select a supplier')
      return
    }

    if (!formData.items || formData.items.length === 0) {
      showError('Validation Error', 'Please add at least one item')
      return
    }

    if (formData.items.length > 5) {
      showError('Validation Error', 'Maximum 5 items per purchase order')
      return
    }

    // Validate items
    for (const item of formData.items) {
      if (item.quantity <= 0) {
        showError('Validation Error', 'Item quantity must be greater than 0')
        return
      }
      if (item.unit_price <= 0) {
        showError('Validation Error', 'Item price must be greater than 0')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const submitData: PurchaseOrderFormData = {
        supplier_id: formData.supplier_id!,
        vote_code: formData.vote_code!,
        vote_activity: formData.vote_activity!,
        category: formData.category!,
        department: formData.department!,
        expected_delivery_date: formData.expected_delivery_date,
        payment_terms: formData.payment_terms,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          item_type: item.item_type,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          packaging_description: item.packaging_description,
        })),
      }

      if (editMode && poId) {
        // Update existing PO
        const result = await updatePurchaseOrder(poId, userId!, submitData)

        if (result.error) {
          showError('Error', result.error)
        } else {
          showSuccess('Success', 'Purchase order updated successfully')
          navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', poId))
        }
      } else {
        // Create new PO
        const result = await createPurchaseOrder(hospitalId, userId, submitData)

        if (result.error) {
          showError('Error', result.error)
        } else {
          showSuccess('Success', 'Purchase order created successfully')
          navigate(ROUTES.PHARMACY_PO)
        }
      }
    } catch (error) {
      console.error('Error saving purchase order:', error)
      showError('Error', editMode ? 'Failed to update purchase order' : 'Failed to create purchase order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      showError('Validation Error', 'Please provide a reason for cancelling.')
      return
    }

    setShowCancelDialog(false)
    setCancelReason('')
    if (editMode && poId) {
      navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', poId))
    } else {
      navigate(ROUTES.PHARMACY_PO)
    }
  }

  const calculateTotals = () => {
    if (!formData.items || formData.items.length === 0) {
      return { subtotal: 0, total: 0 }
    }

    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const total = subtotal

    return { subtotal, total }
  }

  const totals = calculateTotals()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            {editMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          {editMode && existingPO && (
            <p className="text-sm text-gray-600 mt-1">PO Number: {existingPO.po_number}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCancelDialog(true)}
            className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
          >
            Cancel
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="flex items-center gap-2">
            {isSubmitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? (editMode ? 'Updating...' : 'Saving...') : (editMode ? 'Update' : 'Save')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Basic Information</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.supplier_id || ''}
                onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                required
                className="text-sm w-full"
                disabled={isLoading || suppliers.length === 0}
              >
                <option value="">{suppliers.length === 0 ? 'Loading...' : 'Select'}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vote Code <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.vote_code || ''}
                onChange={(e) => handleInputChange('vote_code', e.target.value)}
                required
                className="text-sm w-full"
                disabled={isLoading}
              >
                <option value="">Select</option>
                {VOTE_CODES.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vote Activity <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.vote_activity || ''}
                onChange={(e) => handleInputChange('vote_activity', e.target.value)}
                required
                className="text-sm w-full"
                disabled={isLoading}
              >
                <option value="">Select</option>
                {VOTE_ACTIVITIES.map((activity) => (
                  <option key={activity.value} value={activity.value}>
                    {activity.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
                className="text-sm w-full"
                disabled={isLoading}
              >
                <option value="">Select</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                required
                className="text-sm w-full"
                disabled={isLoading}
              >
                <option value="">Select</option>
                {WARRANT_DEPARTMENTS.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Items to Purchase</h2>
            <div className="text-sm text-gray-500">
              {formData.items && formData.items.length > 0 && `${formData.items.length}/5 items`}
            </div>
          </div>

          {/* Add Item Search */}
          {(!formData.items || formData.items.length < 5) && (
            <div className="relative item-search-container">
              <Input
                type="text"
                placeholder="Type drug or non-drug name to search..."
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value)
                  if (e.target.value.trim()) {
                    setShowSuggestions(true)
                  } else {
                    setShowSuggestions(false)
                  }
                }}
                onFocus={() => {
                  if (itemSearch.trim() && allItems.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                className="text-sm"
              />
              {showSuggestions && allItems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {allItems.map((item) => (
                    <div
                      key={`${item.item_type}-${item.id}`}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => addItem(item)}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {'drug_name' in item ? item.drug_name : item.item_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {('drug_code' in item ? item.drug_code : item.item_code)} • {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'} • {item.price ? formatCurrency(Number(item.price)) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.items && formData.items.length > 0 ? (
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {item.item_name} ({item.item_code})
                      </div>
                      <div className="text-xs text-gray-500">
                        Type: {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price (MYR)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                      <Input
                        type="text"
                        value={formatCurrency(item.quantity * item.unit_price)}
                        readOnly
                        className="bg-gray-50 text-sm h-8"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Packaging Description
                      </label>
                      <Input
                        value={item.packaging_description}
                        onChange={(e) => updateItem(index, 'packaging_description', e.target.value)}
                        placeholder="e.g., Box of 10 vials"
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No items added yet</p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-base font-semibold">
                <span>Total Amount:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {balanceAfterPurchase !== null && (
              <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-900 font-medium text-sm">
                  <Calculator className="w-4 h-4" />
                  Budget Information
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Available Budget:</span>
                  <span className="font-medium">{formatCurrency(availableBudget)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">PO Total:</span>
                  <span className="font-medium">{formatCurrency(totals.total)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-blue-300 pt-1">
                  <span className="text-blue-900">Balance After Purchase:</span>
                  <span
                    className={balanceAfterPurchase >= 0 ? 'text-green-700' : 'text-red-700'}
                  >
                    {formatCurrency(balanceAfterPurchase)}
                  </span>
                </div>
                {balanceAfterPurchase < 0 && (
                  <div className="flex items-start gap-2 text-red-700 text-xs bg-red-50 p-1.5 rounded">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Warning: This purchase will exceed available budget</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false)
          setCancelReason('')
        }}
        onConfirm={handleConfirmCancel}
        title="Are you sure?"
        message={editMode
          ? `Are you sure you want to cancel editing purchase order ${existingPO?.po_number || ''}?`
          : 'Are you sure you want to cancel creating this purchase order?'}
        variant="danger"
        confirmText="Cancel"
        cancelText="Stay on page"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reason for cancellation <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please provide a reason for cancelling..."
          />
          <p className="text-xs text-gray-500">
            The reason will be recorded for this action.
          </p>
        </div>
      </ConfirmationDialog>

      {/* Item Selection Modal */}
    </div>
  )
}

export default PurchaseOrderCreatePage

