import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Plus, X, Printer, Save, AlertCircle, Calculator, Building2, FileText, ChevronDown, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Spinner, Badge, ConfirmationDialog } from '@/components/ui'
import { createPurchaseOrder, updatePurchaseOrder, getActiveSuppliers, getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { supabase } from '@/services/supabase'
import { findContractByDrugName, findContractByNumber, calculateMatchScore } from '@/services/pharmacy/contractCatalogService'
import { getDrugCatalog, searchDrugs } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog, searchNonDrugs } from '@/services/pharmacy/nonDrugCatalogService'
import { getWarrants, WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'
import type { PurchaseOrderFormData, Supplier, Drug, NonDrug, Department, Warrant, PurchaseOrderWithRelations, POItem } from '@/types/pharmacy'
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
    department: '',
    kkm_contract_number: '',
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
  const [allItems, setAllItems] = useState<Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })>>([])

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

            // Check if PO can be edited (draft or pending_approval)
            if (po.status !== 'draft' && po.status !== 'pending_approval') {
              showError('Error', 'Only draft or pending purchase orders can be edited')
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
              kkm_contract_number: po.kkm_contract_number || '',
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
          searchDrugs(hospitalId, itemSearch, 10),
          searchNonDrugs(hospitalId, itemSearch, 10),
        ])

        const combinedItems: Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })> = []

        if (drugsRes.data) {
          drugsRes.data.forEach((drug) => {
            combinedItems.push({ ...drug, item_type: 'drug' } as Drug & { item_type: 'drug' })
          })
        }

        if (nonDrugsRes.data) {
          nonDrugsRes.data.forEach((nonDrug) => {
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
    if (!formData.vote_code || !formData.vote_activity || !hospitalId) {
      setBalanceAfterPurchase(null)
      return
    }

    const calculateBalance = async () => {
      // Get total from current PO items
      const poTotal = formData.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0

      // Find matching warrant for vote code and activity
      const matchingWarrants = warrants.filter(
        (w) => w.vote_code === formData.vote_code && w.vote_activity === formData.vote_activity
      )

      const totalAllocation = matchingWarrants.reduce((sum, w) => sum + Number(w.amount), 0)

      // Fetch all previous POs for the same vote/activity to calculate previous spending
      const currentYear = new Date().getFullYear()
      const { data: relatedPOs, error: poError } = await supabase
        .from('pharmacy_purchase_orders')
        .select('id, total_amount')
        .eq('hospital_id', hospitalId)
        .eq('vote_code', formData.vote_code)
        .eq('vote_activity', formData.vote_activity)
        .gte('order_date', `${currentYear}-01-01`)
        .lte('order_date', `${currentYear}-12-31`)
        .neq('status', 'cancelled')

      let previousSpending = 0
      if (!poError && relatedPOs) {
        // If editing, exclude the current PO from previous spending
        relatedPOs.forEach(p => {
          if (p.id !== poId) {
            previousSpending += Number(p.total_amount || 0)
          }
        })
      }

      const available = totalAllocation - previousSpending
      const balance = available - poTotal

      setAvailableBudget(available)
      setBalanceAfterPurchase(balance)
    }

    void calculateBalance()
  }, [formData.vote_code, formData.vote_activity, formData.items, warrants, hospitalId, poId])

  // No mock items: user will search and add real catalog items only

  // Bi-directional KKM Sync: Contract Number -> Item
  useEffect(() => {
    // Only proceed if Vote Code is 080702, hospitalId is set, and we have a contract number
    if (formData.vote_code !== '080702' || !hospitalId || !formData.kkm_contract_number?.trim()) {
      return
    }

    const checkContract = async () => {
      const contractNum = formData.kkm_contract_number!.trim()

      // Minimum length to avoid spamming
      if (contractNum.length < 4) return

      try {
        const { data: contract } = await findContractByNumber(hospitalId, contractNum)

        if (contract && contract.item_name) {
          // Found a contract! Now try to find the corresponding drug item
          // STRATEGY: 
          // 1. Broad Search: Use first significant word of contract item name
          // 2. Local Filter: Use fuzzy token matching to find best item

          const tokens = contract.item_name.split(/[\s\-\(\)\.]+/).filter(t => t.length > 2)
          const broadSearchTerm = tokens.length > 0 ? tokens[0] : contract.item_name.split(' ')[0]

          if (!broadSearchTerm) return

          // Fetch candidates (increase limit to 20 to find good matches)
          const { data: drugResult } = await getDrugCatalog(hospitalId, { search: broadSearchTerm }, 1, 20)

          if (drugResult && drugResult.data && drugResult.data.length > 0) {
            const candidates = drugResult.data
            let bestDrug: Drug | null = null
            let bestScore = 0

            // Find best match among candidates
            for (const drug of candidates) {
              const score = calculateMatchScore(contract.item_name, drug.drug_name)
              // console.log(`Match Check: ${contract.item_name} vs ${drug.drug_name} = ${score}`)
              if (score > bestScore && score > 0.4) {
                bestScore = score
                bestDrug = drug
              }
            }

            if (bestDrug) {
              const drug = bestDrug // Use the best match

              // Verify it's not already in the list
              const isAlreadyAdded = formData.items?.some(i => i.item_id === drug.id)
              if (!isAlreadyAdded) {
                // Auto-add the item
                showSuccess('Item Found', `Contract matched: ${contract.item_name}. Item added.`)

                const newItem: POItem = {
                  item_type: 'drug',
                  item_id: drug.id,
                  quantity: 1,
                  // STRICT SYNC: Use Contract Price, Packaging, and Name if available
                  unit_price: contract.unit_price ?? drug.price ?? 0,
                  // Map contract 'unit' to 'packaging_description'
                  packaging_description: contract.unit || drug.packaging_description || '',
                  // Use Contract Name as source of truth
                  item_name: contract.item_name || drug.drug_name,
                  item_code: drug.drug_code
                }

                setFormData(prev => ({
                  ...prev,
                  items: [...(prev.items || []), newItem]
                }))
              }
            } else {
              console.log('No good fuzzy match found for:', contract.item_name)
            }
          }
        }
      } catch (err) {
        console.error('Error auto-syncing contract:', err)
      }
    }

    // Debounce to prevent too many requests while typing
    const timeout = setTimeout(checkContract, 800)
    return () => clearTimeout(timeout)

  }, [formData.kkm_contract_number, formData.vote_code, hospitalId])


  const handleInputChange = (field: keyof PurchaseOrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addItem = async (item: (Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })) => {
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

    // Bi-directional KKM Sync: Item -> Contract Number
    // Only for Vote Code 080702
    if (formData.vote_code === '080702' && hospitalId) {
      // Check if we need to auto-fill contract number OR update item details from contract
      // (even if contract number exists, we might want to sync details if it matches)

      try {
        const itemName = newItem.item_name || ''
        const { data: contract } = await findContractByDrugName(hospitalId, itemName)

        if (contract && contract.contract_number) {
          const updates: Partial<PurchaseOrderFormData> = {}

          // Auto-fill Contract Num if missing
          if (!formData.kkm_contract_number) {
            showSuccess('Contract Found', `Found contract ${contract.contract_number} for this item.`)
            updates.kkm_contract_number = contract.contract_number
          }

          // Auto-update Item Price/Packaging if contract has it
          // We need to update the item we just added (last item in array)
          // BUT state update is async, so 'prev.items' in next render will have it. 
          // Here we are inside addItem, 'setFormData' is queued. 
          // We should modify the setFormData call above or update it here.

          // Better approach: modify logic above to await contract SEARCH before setting state? 
          // No, that delays UI. Let's update state again.

          setFormData(prev => {
            const currentItems = [...(prev.items || [])]
            const addedItemIndex = currentItems.length - 1
            if (addedItemIndex >= 0) {
              const itemToUpdate = currentItems[addedItemIndex]
              // Ensure it's the same item we just tried to add (check ID)
              if (itemToUpdate.item_id === newItem.item_id) {
                currentItems[addedItemIndex] = {
                  ...itemToUpdate,
                  unit_price: contract.unit_price ?? itemToUpdate.unit_price,
                  packaging_description: contract.unit || itemToUpdate.packaging_description,
                  item_name: contract.item_name || itemToUpdate.item_name
                }
              }
            }

            return {
              ...prev,
              ...updates,
              items: currentItems
            }
          })
        }
      } catch (err) {
        console.error('Error finding contract for item:', err)
      }
    }

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
        kkm_contract_number: formData.kkm_contract_number,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Professional Government Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl 4k:max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-wide uppercase">
                    {editMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
                  </h1>
                  {editMode && existingPO && (
                    <p className="text-sm text-blue-100 mt-0.5 font-medium">
                      PO Number: <span className="font-bold">{existingPO.po_number}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-white/5 backdrop-blur-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 h-8 px-4 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl border-2 border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? (editMode ? 'Updating...' : 'Saving...') : (editMode ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information - Professional Government Style */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Basic Information</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Supplier <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.supplier_id || ''}
                      onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                      disabled={isLoading || suppliers.length === 0}
                    >
                      <option value="">{suppliers.length === 0 ? 'Loading...' : 'Select Supplier'}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vote Code <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.vote_code || ''}
                      onChange={(e) => handleInputChange('vote_code', e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                      disabled={isLoading}
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
                </div>

                {formData.vote_code === '080702' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      KKM Contract Number
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={formData.kkm_contract_number || ''}
                        onChange={(e) => handleInputChange('kkm_contract_number', e.target.value)}
                        placeholder="Enter KKM Contract Number"
                        className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vote Activity <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.vote_activity || ''}
                      onChange={(e) => handleInputChange('vote_activity', e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                      disabled={isLoading}
                    >
                      <option value="">Select Vote Activity</option>
                      {VOTE_ACTIVITIES.map((activity) => (
                        <option key={activity.value} value={activity.value}>
                          {activity.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                      disabled={isLoading}
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
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Department <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                      disabled={isLoading}
                    >
                      <option value="">Select Department</option>
                      {WARRANT_DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section - Modern Professional Design */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Items to Purchase</h2>
                </div>
                {formData.items && formData.items.length > 0 && (
                  <Badge variant="info" className="text-sm font-semibold px-3 py-1">
                    {formData.items.length}/5 items
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Add Item Search */}
              {(!formData.items || formData.items.length < 5) && (
                <div className="relative item-search-container">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                      className="pl-11 h-12 text-sm border-2 focus:border-blue-500"
                    />
                  </div>
                  {showSuggestions && allItems.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                      {allItems.map((item) => (
                        <div
                          key={`${item.item_type}-${item.id}`}
                          className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => addItem(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">
                                {'drug_name' in item ? item.drug_name : item.item_name}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600">
                                <span className="font-mono">{'drug_code' in item ? item.drug_code : item.item_code}</span>
                                <span className="text-gray-400">•</span>
                                <Badge variant={item.item_type === 'drug' ? 'success' : 'info'} className="text-xs px-2 py-0.5">
                                  {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                                </Badge>
                                {item.price && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-semibold text-blue-600">{formatCurrency(Number(item.price))}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-blue-600 flex-shrink-0 ml-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData.items && formData.items.length > 0 ? (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50/50 hover:border-blue-300 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-100 rounded-lg px-3 py-1.5">
                              <span className="text-xs font-bold text-blue-700">#{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-bold text-base text-gray-900">
                                {(item as any as POItem).item_name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono text-gray-600">{(item as any as POItem).item_code}</span>
                                <span className="text-gray-300">•</span>
                                <Badge variant={item.item_type === 'drug' ? 'success' : 'info'} className="text-xs">
                                  {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 w-8 p-0 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                            className="h-10 text-sm font-medium border-2"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Unit Price (MYR)</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            required
                            className="h-10 text-sm font-medium border-2"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Total</label>
                          <Input
                            type="text"
                            value={formatCurrency(item.quantity * item.unit_price)}
                            readOnly
                            className="bg-blue-50 border-2 border-blue-200 text-blue-900 font-bold h-10 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Packaging Description
                          </label>
                          <Input
                            value={item.packaging_description}
                            onChange={(e) => updateItem(index, 'packaging_description', e.target.value)}
                            placeholder="e.g., Box of 10 vials"
                            className="h-10 text-sm border-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-600 mb-1">No items added yet</p>
                  <p className="text-sm text-gray-500">Search and add items to your purchase order</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Section - Professional Government Style */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Summary</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Amount Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold uppercase tracking-wide text-blue-100">Total Amount</span>
                    <div className="bg-white/20 rounded-lg p-2">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(totals.total)}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs text-blue-100">
                      {formData.items?.length || 0} {formData.items?.length === 1 ? 'item' : 'items'} in this order
                    </div>
                  </div>
                </div>

                {/* Budget Information Card */}
                {balanceAfterPurchase !== null && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm uppercase tracking-wide mb-4">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      Budget Information
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Available Budget:</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(availableBudget)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-700">PO Total:</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(totals.total)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Balance After Purchase:</span>
                        <span
                          className={`text-lg font-bold ${balanceAfterPurchase >= 0 ? 'text-green-700' : 'text-red-700'}`}
                        >
                          {formatCurrency(balanceAfterPurchase)}
                        </span>
                      </div>
                      {balanceAfterPurchase < 0 && (
                        <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 border border-red-200 p-3 rounded-lg mt-3">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">Warning: This purchase will exceed available budget</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
      </div>
    </div>
  )
}

export default PurchaseOrderCreatePage

