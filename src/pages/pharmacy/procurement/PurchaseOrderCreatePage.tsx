import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingCart, Plus, Save, AlertCircle,
  FileText, ChevronDown, Search, Trash2, Package
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Input, Spinner, Badge, ConfirmationDialog } from '@/components/ui'
import { FinancialPageLayout } from '@/components/pharmacy/financial/FinancialPageLayout'
import { createPurchaseOrder, updatePurchaseOrder, getActiveSuppliers, getPurchaseOrderById } from '@/services/pharmacy/procurementService'
import { supabase } from '@/services/supabase'
import { findContractByDrugName, findContractByNumber, calculateMatchScore } from '@/services/pharmacy/contractCatalogService'
import { getDrugCatalog, searchDrugs } from '@/services/pharmacy/drugCatalogService'
import { searchNonDrugs } from '@/services/pharmacy/nonDrugCatalogService'
import { searchApplDrugs } from '@/services/pharmacy/applDrugCatalogService'
import { searchApplNonDrugs } from '@/services/pharmacy/applNonDrugCatalogService'
import { getWarrants, WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'
import type { PurchaseOrderFormData, Supplier, Drug, NonDrug, Warrant, PurchaseOrderWithRelations, POItem, DrugWithRelations, NonDrugWithRelations } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

// Constants
const VOTE_CODES = [
  { value: '080702', label: '080702 CC' },
  { value: '990102', label: '990102 APPL' },
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
  const isSessionReady = useIsSessionReady()
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
    if (!isSessionReady || !hospitalId) return

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

                  const isAPPL = po.vote_code === '990102'

                  if (item.item_type === 'drug') {
                    if (isAPPL) {
                      const { data: applDrug } = await supabase
                        .from('appl_drugs')
                        .select('item_name, item_code')
                        .eq('id', item.item_id)
                        .single()

                      if (applDrug) {
                        item_name = applDrug.item_name || 'Unknown Item'
                        item_code = applDrug.item_code || item.item_id
                      }
                    } else {
                      const { data: drug } = await supabase
                        .from('drugs')
                        .select('drug_name, drug_code')
                        .eq('id', item.item_id)
                        .single()

                      if (drug) {
                        item_name = drug.drug_name || 'Unknown Drug'
                        item_code = drug.drug_code || item.item_id
                      }
                    }
                  } else {
                    if (isAPPL) {
                      const { data: applNonDrug } = await supabase
                        .from('appl_non_drugs')
                        .select('item_name, item_code')
                        .eq('id', item.item_id)
                        .single()

                      if (applNonDrug) {
                        item_name = applNonDrug.item_name || 'Unknown Item'
                        item_code = applNonDrug.item_code || item.item_id
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
  }, [isSessionReady, hospitalId, editMode, poId, navigate, showError])


  // Auto-mapping for Vote Code 990102 (APPL)
  useEffect(() => {
    if (!isSessionReady || formData.vote_code === '990102' && hospitalId) {
      // Auto-set supplier to Pharmaniaga
      const pharmaniagaSupplier = suppliers.find(s =>
        s.company_name.toLowerCase().includes('pharmaniaga')
      )

      if (pharmaniagaSupplier && formData.supplier_id !== pharmaniagaSupplier.id) {
        setFormData(prev => ({
          ...prev,
          supplier_id: pharmaniagaSupplier.id
        }))
        showSuccess('Auto-filled', 'Supplier set to Pharmaniaga for vote code 990102')
      }
    }
  }, [isSessionReady, formData.vote_code, hospitalId, suppliers, formData.supplier_id])

  // Auto-mapping for Vote Activity to Category
  useEffect(() => {
    const activity = formData.vote_activity
    if (!activity) return

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
  }, [formData.vote_activity])

  // Main item loading effect (Handling both Standard and APPL catalogs)

  useEffect(() => {
    if (!isSessionReady || !hospitalId || !itemSearch.trim()) {
      setAllItems([])
      setShowSuggestions(false)
      return
    }

    const loadItems = async () => {
      try {
        if (formData.vote_code === '990102') {
          const [applDrugsRes, applNonDrugsRes] = await Promise.all([
            searchApplDrugs(hospitalId, itemSearch, 10),
            searchApplNonDrugs(hospitalId, itemSearch, 10),
          ])

          const combinedItems: Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })> = []

          if (applDrugsRes && applDrugsRes.data) {
            applDrugsRes.data.forEach((drug) => {
              combinedItems.push({
                ...drug,
                item_type: 'drug',
                drug_name: drug.item_name,
                drug_code: drug.item_code,
              } as unknown as Drug & { item_type: 'drug' })
            })
          }

          if (applNonDrugsRes && applNonDrugsRes.data) {
            applNonDrugsRes.data.forEach((nonDrug) => {
              combinedItems.push({ ...nonDrug, item_type: 'non_drug' } as NonDrug & { item_type: 'non_drug' })
            })
          }

          setAllItems(combinedItems)
          setShowSuggestions(combinedItems.length > 0)
          return
        }

        // Normal item loading for other vote codes
        const isDrugCategory = formData.category === 'drug' || formData.category === 'vaccine' || formData.category === 'insulin' || formData.category === 'hepc'
        const isNonDrugCategory = formData.category === 'non_drug' || formData.category === 'reagent' || formData.category === 'medical_oxygen'

        let drugsRes: { data: DrugWithRelations[] | null; error: string | null } = { data: [] as DrugWithRelations[], error: null }
        let nonDrugsRes: { data: NonDrugWithRelations[] | null; error: string | null } = { data: [] as NonDrugWithRelations[], error: null }

        if (isDrugCategory) {
          drugsRes = await searchDrugs(hospitalId, itemSearch, 15)
        } else if (isNonDrugCategory) {
          nonDrugsRes = await searchNonDrugs(hospitalId, itemSearch, 15)
        } else {
          const [dRes, ndRes] = await Promise.all([
            searchDrugs(hospitalId, itemSearch, 10),
            searchNonDrugs(hospitalId, itemSearch, 10),
          ])
          drugsRes = dRes as any
          nonDrugsRes = ndRes as any
        }

        const combinedItems: Array<(Drug & { item_type: 'drug' }) | (NonDrug & { item_type: 'non_drug' })> = []

        if (drugsRes && drugsRes.data) {
          drugsRes.data.forEach((drug) => {
            combinedItems.push({ ...drug, item_type: 'drug' } as Drug & { item_type: 'drug' })
          })
        }

        if (nonDrugsRes && nonDrugsRes.data) {
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
  }, [itemSearch, isSessionReady, hospitalId, formData.category, formData.vote_code])

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
    if (!isSessionReady || !formData.vote_code || !formData.vote_activity || !hospitalId || !formData.department) {
      setBalanceAfterPurchase(null)
      return
    }

    const calculateBalance = async () => {
      try {
        const poTotal = formData.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0

        const matchingWarrants = warrants.filter(
          (w) => w.vote_code === formData.vote_code &&
            w.vote_activity === formData.vote_activity &&
            w.department === formData.department
        )

        const totalAllocation = matchingWarrants.reduce((sum, w) => sum + Number(w.amount), 0)

        const currentYear = new Date().getFullYear()
        const expenseTable = formData.vote_code === '080702' ? 'pharmacy_cc_expenses' : 'pharmacy_appl_expenses'

        const { data: expenses, error: expenseError } = await supabase
          .from(expenseTable)
          .select('po_id, amount, status')
          .eq('hospital_id', hospitalId)
          .eq('fiscal_year', currentYear)
          .eq('vote_activity', formData.vote_activity)
          .eq('department', formData.department)
          .neq('status', 'cancelled')

        if (expenseError) {
          console.error(`Balance Error: Failed to fetch expenses from ${expenseTable}:`, expenseError)
        }

        let previousSpending = 0
        if (!expenseError && expenses) {
          expenses.forEach(exp => {
            if (exp.po_id !== poId) {
              previousSpending += Number(exp.amount || 0)
            }
          })
        }

        const available = totalAllocation - previousSpending
        const balance = available - poTotal

        setAvailableBudget(available)
        setBalanceAfterPurchase(balance)
      } catch (err) {
        console.error('Error calculating balance:', err)
      }
    }

    void calculateBalance()
  }, [isSessionReady, formData.vote_code, formData.vote_activity, formData.items, warrants, hospitalId, poId, formData.department])

  // Storage key for auto-save
  const STORAGE_KEY = 'draft_purchase_order'

  // Load saved progress on mount
  useEffect(() => {
    if (editMode) return

    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          items: parsedData.items || []
        }))
        showSuccess('Restored Progress', 'Your previous draft has been restored.')
      } catch (error) {
        console.error('Error parsing saved progress:', error)
      }
    }
  }, [editMode])

  // Auto-save progress
  useEffect(() => {
    if (editMode) return

    const timeout = setTimeout(() => {
      const hasSignificantData =
        formData.supplier_id ||
        formData.vote_code ||
        formData.vote_activity ||
        (formData.items && formData.items.length > 0)

      if (hasSignificantData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [formData, editMode])

  // Bi-directional KKM Sync
  useEffect(() => {
    if (!isSessionReady || formData.vote_code !== '080702' || !hospitalId || !formData.kkm_contract_number?.trim()) {
      return
    }

    const checkContract = async () => {
      const contractNum = formData.kkm_contract_number!.trim()
      if (contractNum.length < 4) return

      try {
        const { data: contract } = await findContractByNumber(hospitalId, contractNum)

        if (contract && contract.item_name) {
          const tokens = contract.item_name.split(/[\s\-\(\)\.]+/).filter(t => t.length > 2)
          const broadSearchTerm = tokens.length > 0 ? tokens[0] : contract.item_name.split(' ')[0]

          if (!broadSearchTerm) return

          const { data: drugResult } = await getDrugCatalog(hospitalId, { search: broadSearchTerm }, 1, 20)

          if (drugResult && drugResult.data && drugResult.data.length > 0) {
            const candidates = drugResult.data
            let bestDrug: Drug | null = null
            let bestScore = 0

            for (const drug of candidates) {
              const score = calculateMatchScore(contract.item_name, drug.drug_name)
              if (score > bestScore && score > 0.4) {
                bestScore = score
                bestDrug = drug
              }
            }

            if (bestDrug) {
              const drug = bestDrug
              const isAlreadyAdded = formData.items?.some(i => i.item_id === drug.id)
              if (!isAlreadyAdded) {
                showSuccess('Item Found', `Contract matched: ${contract.item_name}. Item added.`)

                const newItem: POItem = {
                  item_type: 'drug',
                  item_id: drug.id,
                  quantity: 1,
                  unit_price: contract.unit_price ?? drug.price ?? 0,
                  packaging_description: contract.unit || drug.packaging_description || '',
                  item_name: contract.item_name || drug.drug_name,
                  item_code: drug.drug_code
                }

                setFormData(prev => ({
                  ...prev,
                  items: [...(prev.items || []), newItem]
                }))
              }
            }
          }
        }
      } catch (err) {
        console.error('Error auto-syncing contract:', err)
      }
    }

    const timeout = setTimeout(checkContract, 800)
    return () => clearTimeout(timeout)

  }, [formData.kkm_contract_number, formData.vote_code, isSessionReady, hospitalId])


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

    if (formData.vote_code === '080702' && hospitalId) {
      try {
        const itemName = newItem.item_name || ''
        const { data: contract } = await findContractByDrugName(hospitalId, itemName)

        if (contract && contract.contract_number) {
          const updates: Partial<PurchaseOrderFormData> = {}

          if (!formData.kkm_contract_number) {
            showSuccess('Contract Found', `Found contract ${contract.contract_number} for this item.`)
            updates.kkm_contract_number = contract.contract_number
          }

          setFormData(prev => {
            const currentItems = [...(prev.items || [])]
            const addedItemIndex = currentItems.length - 1
            if (addedItemIndex >= 0) {
              const itemToUpdate = currentItems[addedItemIndex]
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
    const isAPPLStrict = formData.vote_code === '990102' &&
      (formData.vote_activity === '27499' || formData.vote_activity === '27401')

    if (isAPPLStrict && (field === 'unit_price' || field === 'packaging_description')) {
      showError('Restricted', 'This item detail is managed by the APPL catalog and cannot be edited.')
      return
    }

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
          item_name: item.item_name,
          item_code: item.item_code,
        })),
      }

      if (editMode && poId) {
        const result = await updatePurchaseOrder(poId, userId!, submitData)
        if (result.error) {
          showError('Error', result.error)
        } else {
          showSuccess('Success', 'Purchase order updated successfully')
          localStorage.removeItem(STORAGE_KEY)
          navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', poId))
        }
      } else {
        const result = await createPurchaseOrder(hospitalId, userId, submitData)
        if (result.error) {
          showError('Error', result.error)
        } else {
          showSuccess('Success', 'Purchase order created successfully')
          localStorage.removeItem(STORAGE_KEY)
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
      localStorage.removeItem(STORAGE_KEY)
      navigate(ROUTES.PHARMACY_PO)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const totals = {
    total: formData.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
  }

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        onClick={() => setShowCancelDialog(true)}
        className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`gap-2 shadow-lg transition-all ${isSubmitting ? 'bg-slate-100' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl'}`}
      >
        {isSubmitting ? <Spinner size="sm" className="text-blue-600" /> : <Save className="w-4 h-4" />}
        {isSubmitting ? (editMode ? 'Updating...' : 'Saving...') : (editMode ? 'Update Order' : 'Create Order')}
      </Button>

    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <FinancialPageLayout
      title={editMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
      description="Create and manage procurement orders with automated budget checking."
      icon={ShoppingCart}
      breadcrumbs={[
        { label: 'Procurement', href: '#' },
        { label: 'Purchase Orders', href: ROUTES.PHARMACY_PO },
        { label: editMode ? 'Edit' : 'Create' }
      ]}
      actions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Info & Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Info Card */}
          <div className="glass-card rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-800">Order Details</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Supplier <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={formData.supplier_id || ''}
                    onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                    required
                    className="w-full h-10 pl-3 pr-8 bg-white/50 border border-blue-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer"
                    disabled={isLoading || suppliers.length === 0}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.company_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Vote Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={formData.vote_code || ''}
                      onChange={(e) => handleInputChange('vote_code', e.target.value)}
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white/50 border border-blue-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select</option>
                      {VOTE_CODES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Activity <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={formData.vote_activity || ''}
                      onChange={(e) => handleInputChange('vote_activity', e.target.value)}
                      required
                      className="w-full h-10 pl-3 pr-8 bg-white/50 border border-blue-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select</option>
                      {VOTE_ACTIVITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {formData.vote_code === '080702' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">KKM Contract No.</label>
                  <Input
                    value={formData.kkm_contract_number || ''}
                    onChange={(e) => handleInputChange('kkm_contract_number', e.target.value)}
                    placeholder="e.g. KKM-2024-..."
                    className="bg-white/50 border-blue-100 focus:border-blue-300 h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Category <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    required
                    className="w-full h-10 pl-3 pr-8 bg-white/50 border border-blue-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Department <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    required
                    className="w-full h-10 pl-3 pr-8 bg-white/50 border border-blue-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {WARRANT_DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-4">Budget Summary</h3>

              <div className="mb-2">
                <p className="text-blue-200 text-xs uppercase mb-1">Total Amount</p>
                <p className="text-3xl font-bold tracking-tight">{formatCurrency(totals.total)}</p>
              </div>

              <div className="w-full h-px bg-white/20 my-4" />

              {balanceAfterPurchase !== null ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-100">Available:</span>
                    <span className="font-mono font-medium">{formatCurrency(availableBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-white">Balance:</span>
                    <span className={`font-mono px-2 py-0.5 rounded ${balanceAfterPurchase < 0 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}>
                      {formatCurrency(balanceAfterPurchase)}
                    </span>
                  </div>
                  {balanceAfterPurchase < 0 && (
                    <div className="flex items-center gap-2 text-xs bg-red-500/20 p-2 rounded-lg text-red-100 border border-red-400/30">
                      <AlertCircle className="w-3 h-3" />
                      <span>Exceeds budget allocation</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-blue-200 italic">Select vote code & department to see budget.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card rounded-2xl p-6 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Items to Purchase</h3>
                  <p className="text-xs text-slate-500">Add logic items from catalog</p>
                </div>
              </div>
              {formData.items && formData.items.length > 0 && (
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {formData.items.length} / 5 Items
                </span>
              )}
            </div>

            {/* Search Bar */}
            {(!formData.items || formData.items.length < 5) && (
              <div className="relative mb-6 z-20 item-search-container">
                <div className="relative group">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value)
                      setShowSuggestions(!!e.target.value.trim())
                    }}
                    onFocus={() => {
                      if (itemSearch.trim() && allItems.length > 0) setShowSuggestions(true)
                    }}
                    placeholder="Search for drugs, non-drugs, or enter SKU..."
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-blue-100 focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all focus:ring-4 focus:ring-blue-500/10 outline-none"
                  />
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && allItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-[500px] overflow-y-auto z-50 divide-y divide-slate-50"

                    >
                      {allItems.map((item) => (
                        <div
                          key={`${item.item_type}-${item.id}`}
                          onClick={() => addItem(item)}
                          className="p-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{'drug_name' in item ? item.drug_name : item.item_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={item.item_type === 'drug' ? 'success' : 'info'} className="text-[10px] py-0 px-1.5 h-5">
                                {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                              </Badge>
                              <span className="text-xs text-slate-500 font-mono">{'drug_code' in item ? item.drug_code : item.item_code}</span>
                              {item.price && <span className="text-xs font-bold text-emerald-600 ml-1">{formatCurrency(Number(item.price))}</span>}
                            </div>
                          </div>
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {formData.items?.map((item, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.item_name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 font-mono">{item.item_code}</span>
                            <Badge variant={item.item_type === 'drug' ? 'success' : 'info'} className="text-[10px] py-0 px-1.5 h-4">
                              {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Unit Price</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          readOnly={formData.vote_code === '990102' && (formData.vote_activity === '27499' || formData.vote_activity === '27401')}
                          className={`h-9 text-sm ${formData.vote_code === '990102' && (formData.vote_activity === '27499' || formData.vote_activity === '27401') ? 'bg-slate-50 text-slate-500' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Total (MYR)</label>
                        <div className="h-9 flex items-center px-3 bg-slate-50 rounded-md border border-slate-200 text-sm font-bold text-slate-700">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Packaging</label>
                        <Input
                          value={item.packaging_description}
                          onChange={(e) => updateItem(index, 'packaging_description', e.target.value)}
                          placeholder="e.g. Box of 10"
                          className="h-9 text-sm"
                          readOnly={formData.vote_code === '990102' && (formData.vote_activity === '27499' || formData.vote_activity === '27401')}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {(!formData.items || formData.items.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <ShoppingCart className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-slate-600">Your cart is empty</p>
                  <p className="text-sm">Search for products above to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false)
          setCancelReason('')
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Order?"
        message={editMode
          ? `Are you sure you want to stop editing purchase order ${existingPO?.po_number || ''}? Unsaved changes will be lost.`
          : 'Are you sure you want to cancel creating this purchase order? All progress will be lost.'}
        variant="danger"
        confirmText="Yes, Cancel Order"
        cancelText="Continue Editing"
      >
        <div className="space-y-2 mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Reason for cancellation <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Briefly explain why you are cancelling..."
          />
        </div>
      </ConfirmationDialog>

    </FinancialPageLayout>
  )
}

export default PurchaseOrderCreatePage
