// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { 
  Spinner, 
  Button, 
  Select, 
  Input, 
  AutoExpandingTextarea,
  ConfirmationDialog,
  Checkbox
} from '@/components/ui'
import { 
  IconShoppingCart, 
  IconPlus, 
  IconCheck, 
  IconFileSearch, 
  IconFilePen,
  IconX,
  IconPrinter,
  IconSave,
  IconAlertCircle,
  IconCalculator,
  IconSearch,
  IconMoney,
  IconBuilding,
  IconTag,
  IconFolder,
  IconUser,
  IconLayers,
  IconChevronLeft,
  IconChevronRight,
  IconActivity,
  IconPackage,
  IconHash,
  IconCurrencyDollar,
  IconInfoCircle,
  IconHistory
} from '@/components/ui/Icons'
import { supabase } from '@/services/supabase'
import { ROUTES } from '@/lib/constants'
import { 
  getActiveSuppliers, 
  getPurchaseOrderById, 
  createPurchaseOrder, 
  updatePurchaseOrder,
  createSupplier
} from '@/services/pharmacy/procurementService'
import { getBudgetForPO } from '@/services/pharmacy/budgetEngine'
import { 
  getWarrants,
  getWarrantSummary,
  WARRANT_VOTE_CODES,
  WARRANT_VOTE_ACTIVITIES,
  WARRANT_CATEGORIES,
  WARRANT_DEPARTMENTS,
  getSharedDepartments,
} from '@/services/pharmacy/warrantService'
import { getDrugCatalog } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog } from '@/services/pharmacy/nonDrugCatalogService'
import { cn, formatCurrency, isContractExpired, isApplVote, isCcVote } from '@/lib/utils'
import type { 
  PurchaseOrderWithRelations, 
  Supplier, 
  PurchaseOrderFormData, 
  Warrant, 
  Drug, 
  NonDrug 
} from '@/types/pharmacy'
import { getPharmacyPOSignatures, type PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'

type CatalogSource =
  | { mode: 'appl'; vote: 'appl' }
  | { mode: 'cc';   vote: 'cc'   }
  | { mode: 'free'               }

function deriveCatalogSource(voteCode?: string): CatalogSource {
  if (isApplVote(voteCode)) return { mode: 'appl', vote: 'appl' }
  if (isCcVote(voteCode)) return { mode: 'cc',   vote: 'cc'   }
  return { mode: 'free' }
}

// Constants
const VOTE_CODES = [
  { value: '080702', label: '080702 - CC/DP' },
  { value: '990102', label: '990102 - APPL' },
  { value: '080600 (APPL)', label: '080600 (APPL) - Duit Khas' },
  { value: '080600 (CC)', label: '080600 (CC) - Duit Khas' },
  { value: 'other', label: 'Others (Manual Entry)' },
]

const VOTE_ACTIVITIES = [
  { value: '27401', label: '27401 - Drugs' },
  { value: '27499', label: '27499 - Non-Drugs' },
  { value: '27404', label: '27404 - Vaccines' },
  { value: '27403', label: '27403 - Pathologist' },
  { value: '27402', label: '27402 - Medical Cylinder' },
  { value: '27501', label: '27501 - X-Ray' },
  { value: 'other', label: 'Others (Manual Entry)' },
]

const CATEGORIES = [
  ...WARRANT_CATEGORIES,
  { value: 'other', label: 'Others (Manual Entry)' },
]

const WARD_DEPARTMENTS = [
  'cssu_cssd', 
  'wound_care', 
  'general_ward', 
  'paediatric_ward', 
  'maternity_ward', 
  'emergency_trauma', 
  'klinik_pakar', 
  'anaesthesiology', 
  'rehabilitation'
];

interface POItem {
  item_type: 'drug' | 'non_drug'
  item_id: string
  quantity: number
  unit_price: number
  packaging_description: string
  item_name?: string
  item_code?: string
  supplier_name?: string
  contract_number?: string
  lead_time_days?: number | string
  contract_end_date?: string
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
  const [formData, setFormData] = useState<any>({
    supplier_id: '',
    vote_code: '',
    vote_activity: '',
    category: '',
    department: '',
    po_type: (location.state as any)?.type || 'regular',
    kkm_contract_number: '',
    inv_sq_number: '',
    program_name: '',
    manual_supplier_name: '',
    manual_supplier_address: '',
    manual_vote_code: '',
    manual_vote_activity: '',
    manual_category: '',
    manual_department: '',
    supplier_ids: [],
    items: [],
    modification_reason: '',
  })

  // Data loading
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warrants, setWarrants] = useState<Warrant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const isSubmittedRef = useRef(false)
  const isClearedRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingPO, setExistingPO] = useState<PurchaseOrderWithRelations | null>(null)
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)

  // Dynamically compute available vote codes from base list, active warrants, and current PO
  const dynamicVoteCodes = useMemo(() => {
    const baseCodes: { value: string; label: string }[] = [
      { value: '080702', label: '080702 - CC/DP' },
      { value: '990102', label: '990102 - APPL' },
      { value: '080600 (APPL)', label: '080600 (APPL) - Duit Khas' },
      { value: '080600 (CC)', label: '080600 (CC) - Duit Khas' },
    ]
    const baseValues = new Set(baseCodes.map((b) => b.value))

    // Pull all unique custom vote codes from warrants
    const customCodesFromWarrants = Array.from(
      new Set((warrants || []).map((w) => w.vote_code).filter(Boolean))
    )
      .filter((code) => !baseValues.has(code) && code !== 'other' && code !== 'others')
      .map((code) => ({ value: code, label: code }))

    // If current form has a custom vote_code that's not in the list, include it
    const currentCode = formData.vote_code
    const currentCustom =
      currentCode &&
      !baseValues.has(currentCode) &&
      currentCode !== 'other' &&
      currentCode !== 'others' &&
      !customCodesFromWarrants.some((c) => c.value === currentCode)
        ? [{ value: currentCode, label: currentCode }]
        : []

    return [
      ...baseCodes,
      ...customCodesFromWarrants,
      ...currentCustom,
      { value: 'other', label: 'Others (Manual Entry)' },
    ]
  }, [warrants, formData.vote_code])

  // Item selection
  const [itemSearch, setItemSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allItems, setAllItems] = useState<((Drug | NonDrug) & { item_type: 'drug' | 'non_drug' })[]>([])

  // Balance calculation
  const [balanceAfterPurchase, setBalanceAfterPurchase] = useState<number | null>(null)
  const [availableBudget, setAvailableBudget] = useState<number>(0)
  const [totalAllocation, setTotalAllocation] = useState<number>(0)
  const [previousExpenses, setPreviousExpenses] = useState<number>(0)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [manualItem, setManualItem] = useState({
    item_name: '',
    item_code: '',
    packaging_description: '',
    quantity: 1,
    unit_price: 0,
    item_type: 'drug' as 'drug' | 'non_drug'
  })

  const [signatures, setSignatures] = useState<PharmacyPOSignatures | null>(null)

  // Load signature settings
  useEffect(() => {
    if (!hospitalId) return

    const loadSignatures = async () => {
      const result = await getPharmacyPOSignatures(hospitalId, formData.department)
      if (result.data) {
        let finalSignatures = { ...result.data }
        
        // Always follow currently logged in user for applicant
        finalSignatures.applicantName = !editMode ? (user?.full_name || result.data.applicantName) : result.data.applicantName
        finalSignatures.applicantPosition = !editMode ? (user?.jawatan || result.data.applicantPosition) : result.data.applicantPosition
        
        // Try to resolve the head's position from their profile in the system
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, jawatan')
            .eq('full_name', result.data.headName)
            .maybeSingle()
            
          if (userData) {
            finalSignatures.headPosition = userData.jawatan
          }
        } catch (err) {
          console.warn('Error resolving head profile:', err)
        }
        
        setSignatures(finalSignatures)
      }
    }

    void loadSignatures()
  }, [hospitalId, formData.department])

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
            
            // Allow editing if not cancelled
            if (po.status === 'cancelled') {
              showError('Error', 'Cancelled purchase orders cannot be edited')
              navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', poId))
              return
            }

            setExistingPO(po)

            // Load item details and populate form
            const itemsWithDetails = (po.items || []).map((item) => {
              // Immediately use stored metadata as primary source
              return {
                item_type: item.item_type as 'drug' | 'non_drug',
                item_id: item.item_id,
                quantity: item.quantity_ordered,
                unit_price: Number(item.unit_price),
                packaging_description: item.packaging_description || '',
                item_name: item.item_name || 'Unknown Item',
                item_code: item.item_code || item.item_id,
              }
            })

            // Populate form with existing metadata first to prevent blank fields
            setFormData((prev: any) => ({
              ...prev,
              supplier_id: po.supplier_id,
              vote_code: po.vote_code || '',
              vote_activity: po.vote_activity || '',
              category: po.category || '',
              department: po.department || '',
              expected_delivery_date: po.expected_delivery_date,
              payment_terms: po.payment_terms,
              delivery_address: po.delivery_address,
              notes: po.notes,
              program_name: po.program_name || '',
              inv_sq_number: po.inv_sq_number || '',
              manual_supplier_name: po.manual_supplier_name || '',
              manual_supplier_address: po.manual_supplier_address || '',
              manual_vote_code: po.manual_vote_code || '',
              manual_vote_activity: po.manual_vote_activity || '',
              manual_category: po.manual_category || '',
              manual_department: po.manual_department || '',
              items: itemsWithDetails,
              modification_reason: '',
            }))

            // Background enrichment: Update from catalog if available (Standard, APPL, LP)
            void (async () => {
              const enrichedItems = await Promise.all(
                itemsWithDetails.map(async (item) => {
                  // Skip if no item_id or it is the string "null"
                  if (!item.item_id || item.item_id === 'null') {
                    return item
                  }

                  try {
                    // 1. Try Standard Catalogs
                    const table = item.item_type === 'drug' ? 'drugs' : 'non_drugs'
                    const nameCol = item.item_type === 'drug' ? 'drug_name' : 'item_name'
                    const codeCol = item.item_type === 'drug' ? 'drug_code' : 'item_code'

                    const { data: stdData } = await supabase
                      .from(table)
                      .select(`*, supplier:suppliers(*)`)
                      .eq('id', item.item_id)
                      .maybeSingle()
                    
                    if (stdData) {
                      return {
                        ...item,
                        item_name: stdData[nameCol] || item.item_name,
                        item_code: stdData[codeCol] || item.item_code,
                        supplier_name: stdData.cc_supplier_name || stdData.supplier?.company_name || item.supplier_name || '',
                        contract_number: stdData.cc_contract_number || item.contract_number || '',
                        lead_time_days: stdData.lead_time_days || item.lead_time_days || '',
                        contract_end_date: stdData.cc_contract_end_date || item.contract_end_date || '',
                      }
                    }

                    // 2. Try APPL Catalogs
                    const applTable = item.item_type === 'drug' ? 'appl_drugs' : 'appl_non_drugs'
                    const { data: applData } = await supabase
                      .from(applTable)
                      .select('item_name, item_code')
                      .eq('id', item.item_id)
                      .maybeSingle()

                    if (applData) {
                      return {
                        ...item,
                        item_name: applData.item_name || item.item_name,
                        item_code: applData.item_code || item.item_code
                      }
                    }

                    // 3. Try LP Catalogs
                    const lpTable = item.item_type === 'drug' ? 'lp_drugs' : 'lp_non_drugs'
                    const { data: lpData } = await supabase
                      .from(lpTable)
                      .select('item_name, item_code')
                      .eq('id', item.item_id)
                      .maybeSingle()

                    if (lpData) {
                      return {
                        ...item,
                        item_name: lpData.item_name || item.item_name,
                        item_code: lpData.item_code || item.item_code
                      }
                    }

                    // 4. Try Contract Catalog
                    const { data: contractData } = await supabase
                      .from('contracts')
                      .select('*')
                      .eq('id', item.item_id)
                      .maybeSingle()

                    if (contractData) {
                      return {
                        ...item,
                        item_name: contractData.contract_name || item.item_name,
                        item_code: contractData.item_code || item.item_code,
                        supplier_name: contractData.supplier_name || item.supplier_name || '',
                        contract_number: contractData.contract_number || item.contract_number || '',
                        lead_time_days: contractData.lead_time_days || contractData.delivery_timeframe || item.lead_time_days || '',
                        contract_end_date: contractData.contract_end_date || contractData.contract_expiry || item.contract_end_date || '',
                      }
                    }
                  } catch (err) {
                    // Ignore errors during enrichment
                  }
                  return item
                })
              )
              setFormData((prev: any) => ({ ...prev, items: enrichedItems }))

              // Self-healing: persist resolved names back to the DB
              for (const enriched of enrichedItems) {
                const original = itemsWithDetails.find(o => o.item_id === enriched.item_id)
                if (original && enriched.item_name !== original.item_name && enriched.item_name !== 'Unknown Item') {
                  // Find the database record ID for this PO item
                  const dbItem = (po.items || []).find((i: any) => i.item_id === enriched.item_id)
                  if (dbItem?.id) {
                    void supabase
                      .from('pharmacy_purchase_order_items')
                      .update({ 
                        item_name: enriched.item_name,
                        item_code: enriched.item_code 
                      })
                      .eq('id', dbItem.id)
                  }
                }
              }
            })()
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

  // Load draft from localStorage on mount (only for new PO creation)
  useEffect(() => {
    if (isLoading || !hospitalId || !userId) return

    if (editMode) {
      setIsDraftLoaded(true)
      return
    }

    const DRAFT_KEY = `po_draft_${hospitalId}_${userId}`
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        if (parsed && typeof parsed === 'object') {
          setFormData((prev: any) => ({
            ...prev,
            ...parsed
          }))
          showSuccess('Draft Restored', 'Your unsaved progress has been restored automatically.')
        }
      } catch (err) {
        console.error('Failed to parse purchase order draft:', err)
      }
    }
    setIsDraftLoaded(true)
  }, [hospitalId, userId, editMode, isLoading])

  // Auto-save draft to localStorage on form changes
  useEffect(() => {
    if (!editMode && hospitalId && userId && isDraftLoaded && !isSubmitting && !isSubmittedRef.current && !isClearedRef.current) {
      const DRAFT_KEY = `po_draft_${hospitalId}_${userId}`
      const hasContent = !!(
        formData.supplier_id ||
        formData.vote_code ||
        formData.vote_activity ||
        formData.category ||
        formData.department ||
        (formData.items && formData.items.length > 0) ||
        formData.notes ||
        formData.inv_sq_number ||
        formData.program_name
      )
      
      if (hasContent) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      } else {
        localStorage.removeItem(DRAFT_KEY)
      }
    }
  }, [formData, editMode, hospitalId, userId, isDraftLoaded, isSubmitting])

  // Prompt user before close/refresh if form has unsaved changes
  useEffect(() => {
    const isFormDirty = () => {
      if (editMode) return false
      return !!(
        formData.supplier_id ||
        formData.vote_code ||
        formData.vote_activity ||
        formData.category ||
        formData.department ||
        (formData.items && formData.items.length > 0) ||
        formData.notes ||
        formData.inv_sq_number ||
        formData.program_name
      )
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty() && !isSubmitting) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [formData, editMode, isSubmitting])

  // Load items when searching
  useEffect(() => {
    if (!hospitalId || !itemSearch.trim()) {
      setAllItems([])
      setShowSuggestions(false)
      return
    }

    const loadItems = async () => {
      try {
        const src = deriveCatalogSource(formData.vote_code)
        const combinedItems: Array<(Drug | NonDrug) & { item_type: 'drug' | 'non_drug' }> = []

        if (formData.po_type === 'sq') {
          // Invite Quotation (SQ): Make exception to search all active items across drugs, non-drugs, and contracts
          const [drugsRes, nonDrugsRes] = await Promise.all([
            getDrugCatalog(hospitalId, { search: itemSearch, status: 'active' }, 1, 50),
            getNonDrugCatalog(hospitalId, { search: itemSearch, status: 'active' }, 1, 50),
          ])

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

          // Also search contracts table for SQ mode
          const { data: contractsRes } = await supabase
            .from('contracts')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')
            .or(`contract_name.ilike.%${itemSearch}%,item_code.ilike.%${itemSearch}%,contract_number.ilike.%${itemSearch}%`)
            .limit(50)

          if (contractsRes) {
            contractsRes.forEach((contract) => {
              const alreadyExists = combinedItems.some(
                (existing) => 
                  (existing.item_code && contract.item_code && existing.item_code.toLowerCase() === contract.item_code.toLowerCase()) ||
                  (existing.drug_code && contract.item_code && existing.drug_code.toLowerCase() === contract.item_code.toLowerCase()) ||
                  (('drug_name' in existing && existing.drug_name.toLowerCase() === contract.contract_name.toLowerCase()) ||
                   ('item_name' in existing && existing.item_name.toLowerCase() === contract.contract_name.toLowerCase()))
              )
              if (!alreadyExists) {
                const isNonDrug = contract.contract_type === 'non_drug' || 
                                  contract.contract_type === 'non-drug' || 
                                  contract.contract_type?.toLowerCase().includes('non')
                
                combinedItems.push({
                  id: contract.id,
                  item_type: isNonDrug ? 'non_drug' : 'drug',
                  drug_name: contract.contract_name,
                  item_name: contract.contract_name,
                  drug_code: contract.item_code || '',
                  item_code: contract.item_code || '',
                  price: contract.unit_price || 0,
                  packaging_description: contract.metadata?.packaging_description || contract.sst_rate || '',
                  category: 'Contract Catalog',
                  supplier_id: contract.supplier_id,
                } as any)
              }
            })
          }
        } else if (src.mode === 'appl') {
          // Vote code 990102 - APPL: Strictly use APPL list from MyInventory drug & non-drug catalog
          const [drugsRes, nonDrugsRes] = await Promise.all([
            getDrugCatalog(hospitalId, { search: itemSearch, procurement_vote: 'appl', status: 'active' }, 1, 50),
            getNonDrugCatalog(hospitalId, { search: itemSearch, procurement_vote: 'appl', status: 'active' }, 1, 50),
          ])
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
        } else if (src.mode === 'cc') {
          // Vote code 080702 - CC: Allow finding any item in database catalog (drugs + non-drugs) regardless of contract table, plus contract items
          const [drugsRes, nonDrugsRes] = await Promise.all([
            getDrugCatalog(hospitalId, { search: itemSearch, status: 'active' }, 1, 50),
            getNonDrugCatalog(hospitalId, { search: itemSearch, status: 'active' }, 1, 50),
          ])

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

          // Also search contracts table for CC items under contract
          const { data: contractsRes } = await supabase
            .from('contracts')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')
            .or(`contract_name.ilike.%${itemSearch}%,item_code.ilike.%${itemSearch}%,contract_number.ilike.%${itemSearch}%`)
            .limit(50)

          if (contractsRes) {
            contractsRes.forEach((contract) => {
              const alreadyExists = combinedItems.some(
                (existing) => 
                  (existing.item_code && contract.item_code && existing.item_code.toLowerCase() === contract.item_code.toLowerCase()) ||
                  (existing.drug_code && contract.item_code && existing.drug_code.toLowerCase() === contract.item_code.toLowerCase()) ||
                  (('drug_name' in existing && existing.drug_name.toLowerCase() === contract.contract_name.toLowerCase()) ||
                   ('item_name' in existing && existing.item_name.toLowerCase() === contract.contract_name.toLowerCase()))
              )
              if (!alreadyExists) {
                const isNonDrug = contract.contract_type === 'non_drug' || 
                                  contract.contract_type === 'non-drug' || 
                                  contract.contract_type?.toLowerCase().includes('non')
                
                combinedItems.push({
                  id: contract.id,
                  item_type: isNonDrug ? 'non_drug' : 'drug',
                  drug_name: contract.contract_name,
                  item_name: contract.contract_name,
                  drug_code: contract.item_code || '',
                  item_code: contract.item_code || '',
                  price: contract.unit_price || 0,
                  packaging_description: contract.metadata?.packaging_description || contract.sst_rate || '',
                  category: 'Contract Catalog',
                  supplier_id: contract.supplier_id,
                } as any)
              }
            })
          }
        } else {
          // Unrestricted / Free mode (e.g. Vote Code 'other') - leave intact & untouched
          const [drugsRes, nonDrugsRes] = await Promise.all([
            getDrugCatalog(hospitalId, { search: itemSearch, status: 'active' }, 1, 50),
            getNonDrugCatalog(hospitalId, { search: itemSearch, status: 'active' }, 1, 50),
          ])

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

          // Also fetch from contracts table to ensure items defined in contract catalog are searchable
          const { data: contractsRes } = await supabase
            .from('contracts')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('status', 'active')
            .or(`contract_name.ilike.%${itemSearch}%,item_code.ilike.%${itemSearch}%,contract_number.ilike.%${itemSearch}%`)
            .limit(50)

          if (contractsRes) {
            contractsRes.forEach((contract) => {
              const alreadyExists = combinedItems.some(
                (existing) => 
                  (existing.item_code && contract.item_code && existing.item_code.toLowerCase() === contract.item_code.toLowerCase()) ||
                  (existing.drug_code && contract.item_code && existing.drug_code.toLowerCase() === contract.item_code.toLowerCase()) ||
                  (('drug_name' in existing && existing.drug_name.toLowerCase() === contract.contract_name.toLowerCase()) ||
                   ('item_name' in existing && existing.item_name.toLowerCase() === contract.contract_name.toLowerCase()))
              )
              if (!alreadyExists) {
                const isNonDrug = contract.contract_type === 'non_drug' || 
                                  contract.contract_type === 'non-drug' || 
                                  contract.contract_type?.toLowerCase().includes('non')
                
                const matchingMasterItem = combinedItems.find(
                  (m) => m.item_type === (isNonDrug ? 'non_drug' : 'drug') && 
                         (('drug_name' in m && m.drug_name === contract.contract_name) ||
                          ('item_name' in m && m.item_name === contract.contract_name))
                );
                const resolvedMasterCode = matchingMasterItem 
                  ? ('drug_code' in matchingMasterItem ? (matchingMasterItem as any).drug_code : (matchingMasterItem as any).item_code) 
                  : '';

                combinedItems.push({
                  id: contract.id,
                  item_type: isNonDrug ? 'non_drug' : 'drug',
                  drug_name: contract.contract_name,
                  item_name: contract.contract_name,
                  drug_code: contract.item_code || resolvedMasterCode || '',
                  item_code: contract.item_code || resolvedMasterCode || '',
                  price: contract.unit_price || 0,
                  packaging_description: contract.metadata?.packaging_description || contract.sst_rate || '',
                  category: 'Contract Catalog',
                  supplier_id: contract.supplier_id,
                } as any)
              }
            })
          }
        }

        setAllItems(combinedItems)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error loading items:', error)
      }
    }

    const timeout = setTimeout(() => {
      void loadItems()
    }, 300)

    return () => clearTimeout(timeout)
  }, [itemSearch, hospitalId, formData.vote_code])

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

  // Load expenses and calculate balance using unified engine
  useEffect(() => {
    if (!hospitalId || !formData.vote_code || !formData.vote_activity) {
      setPreviousExpenses(0)
      setTotalAllocation(0)
      setAvailableBudget(0)
      setBalanceAfterPurchase(null)
      return
    }

    const loadBudget = async () => {
      const budget = await getBudgetForPO(
        hospitalId,
        formData.vote_code as any,
        formData.vote_activity as any,
        (formData.department || 'all') as any,
        formData.category as any,
        editMode && poId ? poId : undefined
      )

      setTotalAllocation(budget.allocation)
      setPreviousExpenses(budget.expenses)
      setAvailableBudget(budget.balance)

      // Calculate balance after current PO items
      const poTotal = formData.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
      setBalanceAfterPurchase(budget.balance - poTotal)
    }

    loadBudget()
  }, [hospitalId, formData.vote_code, formData.vote_activity, formData.department, formData.category, formData.items, editMode, poId])

  // Auto-fill KKM Contract No. and unit prices from contracts database
  useEffect(() => {
    if (!hospitalId || !formData.supplier_id || formData.supplier_id === 'other' || !formData.items || formData.items.length === 0) {
      return
    }

    const autoFillContracts = async () => {
      try {
        let { data: supplierContracts } = await supabase
          .from('contracts')
          .select('*')
          .eq('supplier_id', formData.supplier_id)
          .eq('status', 'active')

        if ((!supplierContracts || supplierContracts.length === 0) && suppliers.length > 0) {
          const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
          if (selectedSupplier?.company_name) {
            const { data: allActive } = await supabase
              .from('contracts')
              .select('*')
              .eq('status', 'active')

            const cleanStr = (name: string) => name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/sdn\s*bhd/gi, '').replace(/sdn/gi, '').replace(/bhd/gi, '').trim() : '';
            const targetCleanName = cleanStr(selectedSupplier.company_name);

            const nameContracts = (allActive || []).filter((c: any) => {
              if (!c.supplier_name) return false;
              const cleanContractSupplier = cleanStr(c.supplier_name);
              return cleanContractSupplier === targetCleanName || 
                     cleanContractSupplier.includes(targetCleanName) || 
                     targetCleanName.includes(cleanContractSupplier);
            });

            if (nameContracts && nameContracts.length > 0) {
              supplierContracts = nameContracts;
            }
          }
        }

        if (supplierContracts && supplierContracts.length > 0) {
          const clean = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          let matchedContractNo = formData.kkm_contract_number || '';
          let itemsUpdated = false;

          const updatedItems = formData.items!.map((item) => {
            const cleanItemName = clean(item.item_name || '');
            const cleanItemCode = clean(item.item_code || '');
            const itemPrice = Number(item.unit_price || 0);

            // Find matching contract using same hierarchy as backend
            let matched = null;
            if (cleanItemCode) {
              matched = supplierContracts.find((c: any) => clean(c.item_code) === cleanItemCode);
            }
            if (!matched && cleanItemName) {
              matched = supplierContracts.find((c: any) => clean(c.contract_name) === cleanItemName);
            }
            if (!matched && cleanItemName) {
              matched = supplierContracts.find((c: any) => {
                const cleanContractName = clean(c.contract_name || '');
                return cleanContractName.includes(cleanItemName) || cleanItemName.includes(cleanContractName);
              });
            }

            if (matched) {
              const refDate = formData.order_date || new Date().toISOString();
              const expired = isContractExpired(matched, refDate);
              // Always fill the contract number when a match is found and contract is NOT expired
              if (!expired && !matchedContractNo) {
                matchedContractNo = matched.contract_number || '';
              }

              // If unit price is 0, or matches default catalog price but differs from contract price, autofill it
              // Only auto-fill price if currently zero (not set). In edit mode or when price is already entered, preserve the PO price.
              if (matched.unit_price && itemPrice === 0) {
                itemsUpdated = true;
                return {
                  ...item,
                  unit_price: Number(matched.unit_price)
                };
              }
            }
            return item;
          });

          // Check if we need to update state to prevent infinite loops
          const hasContractNoChange = matchedContractNo !== formData.kkm_contract_number;
          if (hasContractNoChange || itemsUpdated) {
            setFormData(prev => ({
              ...prev,
              kkm_contract_number: matchedContractNo,
              items: updatedItems
            }));
          }
        }
      } catch (err) {
        console.error('Error auto-filling contracts:', err)
      }
    }

    void autoFillContracts()
  }, [formData.supplier_id, formData.vote_code, formData.items?.map(it => `${it.item_id}_${it.unit_price}`).join(','), hospitalId])

  // Keep header KKM Contract No in sync with item contract number
  useEffect(() => {
    if (!formData.kkm_contract_number && formData.items && formData.items.length > 0) {
      const activeItemWithContract = formData.items.find(it => {
        const cNo = it.contract_number || (it as any).cc_contract_number;
        const refDate = formData.order_date || new Date().toISOString();
        return cNo && !isContractExpired(it, refDate);
      });
      if (activeItemWithContract) {
        const firstContractNo = activeItemWithContract.contract_number || (activeItemWithContract as any).cc_contract_number || '';
        setFormData(prev => ({
          ...prev,
          kkm_contract_number: firstContractNo
        }));
      }
    }
  }, [formData.items, formData.vote_code, formData.kkm_contract_number, formData.order_date])


  // No mock items: user will search and add real catalog items only

  const handleInputChange = (field: keyof PurchaseOrderFormData, value: any) => {
    setFormData((prev) => {
      if (field === 'vote_code' && prev.vote_code && prev.vote_code !== value && prev.items && prev.items.length > 0) {
        const confirmClear = window.confirm('Menukar Kod Vote akan mengosongkan senarai item kerana setiap Kod Vote menguatkuasakan katalog MyInventory yang berbeza. Teruskan?')
        if (!confirmClear) {
          return prev
        }
      }

      const newData = { ...prev, [field]: value };
      if (field === 'vote_code' && prev.vote_code && prev.vote_code !== value && prev.items && prev.items.length > 0) {
        newData.items = []
      }
      
      // 1. Auto-select Pharmaniaga for APPL (990102 / 080600 APPL)
      if (field === 'vote_code' && isApplVote(value)) {
        const pharmaniaga = suppliers.find(s => 
          s.company_name.toLowerCase().includes('pharmaniaga') &&
          s.company_name.toLowerCase().includes('logistic')
        ) || suppliers.find(s => 
          s.company_name.toLowerCase().includes('pharmaniaga')
        );
        if (pharmaniaga) {
          newData.supplier_id = pharmaniaga.id;
        }
        // Auto-select Pharmacy as department for APPL
        if (!newData.department) {
          newData.department = 'pharmacy';
        }
        if (!newData.vote_activity) {
          newData.vote_activity = '27401';
        }
        if (!newData.category && value === '990102') {
          newData.category = 'drug';
        }
      }

      // Auto fill KKM contract number if first item has contract
      if (field === 'vote_code' && isCcVote(value)) {
        if (!newData.kkm_contract_number) {
          const firstItem = newData.items?.[0]
          if (firstItem?.contract_number) {
            newData.kkm_contract_number = firstItem.contract_number
          }
        }
      }

      // 2. Auto-lock Category, Vote Code, and Activity for specific departments (Wards)
      if (field === 'department' && WARD_DEPARTMENTS.includes(value)) {
        newData.category = 'non_standard';
        newData.vote_code = '080702';
        newData.vote_activity = '27499';
      }

      // 3. Auto-select Category based on Activity code (if not already handled by department lock)
      if (field === 'vote_activity' && !WARD_DEPARTMENTS.includes(newData.department || '')) {
        const activityCategoryMap: Record<string, string> = {
          '27401': 'drug',
          '27499': 'non_drug',
          '27404': 'vaccine',
          '27403': 'pathologist',
          '27402': 'medical_cylinder',
          '27501': 'x_ray',
        };

        if (activityCategoryMap[value]) {
          newData.category = activityCategoryMap[value];
        }
      }

      // 4. Force Vote Code to 080702 for Invite Quotation (SQ)
      if (field === 'po_type' && value === 'sq') {
        newData.vote_code = '080702';
      }

      // Reset manual fields if not 'other'
      if (field === 'vote_code' && value !== 'other') newData.manual_vote_code = '';
      if (field === 'vote_activity' && value !== 'other') newData.manual_vote_activity = '';
      if (field === 'category' && value !== 'other') newData.manual_category = '';
      if (field === 'department' && value !== 'other') newData.manual_department = '';
      
      return newData;
    });
  }

  const addItem = (item: Drug | NonDrug & { item_type: 'drug' | 'non_drug' }) => {
    if (!formData.items) {
      setFormData((prev) => ({ ...prev, items: [] }))
    }

    if (formData.po_type === 'regular' && formData.items!.length >= 5) {
      showError('Maximum Items', 'Maximum 5 items per purchase order')
      return
    }

    const itemCodeStr = ('drug_code' in item ? item.drug_code : item.item_code) || '';
    const isCc = isCcVote(formData.vote_code) || (item as any).procurement_vote === 'cc';
    
    const supplierName = (item as any).cc_supplier_name || (item as any).supplier?.company_name || (item as any).supplier_name || (item as any).supplier?.name || '';
    const rawContractNo = (item as any).cc_contract_number || (item as any).kkm_contract_number || (item as any).contract_number || (item as any).supplier?.contract_number || '';
    const contractStart = (item as any).cc_contract_start_date || (item as any).contract_start_date || '';
    const contractEnd = (item as any).cc_contract_end_date || (item as any).contract_expiry || (item as any).contract_end_date || (item as any).expiry_date || '';
    const contractStatus = (item as any).cc_contract_status || (item as any).contract_status || '';
    const leadTime = (item as any).lead_time_days || (item as any).delivery_timeframe || (item as any).lead_time || '';

    const refDate = formData.order_date || new Date().toISOString();
    const itemIsExpired = isContractExpired({
      contract_end_date: contractEnd,
      cc_contract_end_date: contractEnd,
      cc_contract_status: contractStatus,
      contract_status: contractStatus
    }, refDate);

    const activeContractNo = itemIsExpired ? '' : rawContractNo;

    const newItem: POItem = {
      item_type: item.item_type,
      item_id: item.id,
      quantity: 1,
      unit_price: item.price ? Number(item.price) : 0,
      packaging_description: item.packaging_description || '',
      item_name: 'drug_name' in item ? item.drug_name : item.item_name,
      item_code: itemCodeStr,
      supplier_name: supplierName,
      contract_number: activeContractNo,
      cc_contract_start_date: contractStart,
      cc_contract_end_date: contractEnd,
      cc_contract_status: contractStatus,
      lead_time_days: leadTime,
      contract_end_date: contractEnd,
    }

    setFormData((prev: any) => {
      const updated = {
        ...prev,
        items: [...(prev.items || []), newItem],
        kkm_contract_number: activeContractNo || prev.kkm_contract_number,
      }


      if (supplierName) {
        const cleanName = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/sdn\s*bhd/gi, '').replace(/sdn/gi, '').replace(/bhd/gi, '').trim() : '';
        const targetClean = cleanName(supplierName);
        const matchedSupplier = suppliers.find(s => {
          const sClean = cleanName(s.company_name);
          return sClean.includes(targetClean) || targetClean.includes(sClean) || (targetClean.includes('ally') && sClean.includes('ally'));
        });

        if (matchedSupplier) {
          updated.supplier_id = matchedSupplier.id;
          updated.supplier_ids = [matchedSupplier.id];
        }
      }

      return updated
    })

    // Check if the item has an active contract in the database and auto-fill PO details
    const code = 'drug_code' in item ? item.drug_code : item.item_code;
    const name = 'drug_name' in item ? item.drug_name : item.item_name;

    void (async () => {
      try {
        let query = supabase
          .from('contracts')
          .select('*')
          .eq('status', 'active');

        // If supplier is already selected, restrict lookup to this supplier
        let useFallback = false;
        let selectedSupplierName = '';
        if (formData.supplier_id && formData.supplier_id !== 'other') {
          query = query.eq('supplier_id', formData.supplier_id);
          useFallback = true;
          selectedSupplierName = suppliers.find(s => s.id === formData.supplier_id)?.company_name || '';
        }

        let { data: matchedContracts } = await query;

        if ((!matchedContracts || matchedContracts.length === 0) && useFallback && selectedSupplierName) {
          const { data: allActive } = await supabase
            .from('contracts')
            .select('*')
            .eq('status', 'active')

          const cleanStr = (name: string) => name ? name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/sdn\s*bhd/gi, '').replace(/sdn/gi, '').replace(/bhd/gi, '').trim() : '';
          const targetCleanName = cleanStr(selectedSupplierName);

          const fallbackContracts = (allActive || []).filter((c: any) => {
            if (!c.supplier_name) return false;
            const cleanContractSupplier = cleanStr(c.supplier_name);
            return cleanContractSupplier === targetCleanName || 
                   cleanContractSupplier.includes(targetCleanName) || 
                   targetCleanName.includes(cleanContractSupplier);
          });

          if (fallbackContracts && fallbackContracts.length > 0) {
            matchedContracts = fallbackContracts;
          }
        }

        if (matchedContracts && matchedContracts.length > 0) {
          const clean = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          const cleanItemName = clean(name);
          const cleanItemCode = clean(code);

          let matched = null;
          if (cleanItemCode) {
            matched = matchedContracts.find((c: any) => clean(c.item_code) === cleanItemCode);
          }
          if (!matched && cleanItemName) {
            matched = matchedContracts.find((c: any) => clean(c.contract_name) === cleanItemName);
          }
          if (!matched && cleanItemName) {
            matched = matchedContracts.find((c: any) => {
              const cleanContractName = clean(c.contract_name || '');
              return cleanContractName.includes(cleanItemName) || cleanItemName.includes(cleanContractName);
            });
          }

          if (matched) {
            setFormData(prev => {
              const updated = { ...prev };
              const cNo = matched.contract_number || prev.kkm_contract_number || activeContractNo;
              
              if (!updated.kkm_contract_number && cNo) {
                updated.kkm_contract_number = cNo;
              }
              if ((!updated.supplier_id || updated.supplier_id === 'other') && matched.supplier_id) {
                updated.supplier_id = matched.supplier_id;
                updated.supplier_ids = [matched.supplier_id];
              }
              if (updated.vote_code !== '080702') {
                updated.vote_code = '080702';
              }
              if (updated.items) {
                updated.items = updated.items.map(it => {
                  if (it.item_id === item.id) {
                    return {
                      ...it,
                      unit_price: matched.unit_price ? Number(matched.unit_price) : it.unit_price,
                      packaging_description: matched.unit || it.packaging_description,
                      supplier_name: matched.supplier_name || it.supplier_name || supplierName,
                      contract_number: matched.contract_number || it.contract_number || activeContractNo,
                      lead_time_days: matched.lead_time_days || matched.delivery_timeframe || it.lead_time_days || leadTime,
                      contract_end_date: matched.contract_end_date || matched.contract_expiry || it.contract_end_date || contractEnd
                    };
                  }
                  return it;
                });
              }
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Error looking up contract for added item:', err);
      }
    })();

    setItemSearch('')
    setShowSuggestions(false)
    setAllItems([])
  }

  // Trigger lookups when KKM Contract No is entered manually
  useEffect(() => {
    const contractNo = formData.kkm_contract_number?.trim();
    if (!hospitalId || !contractNo || contractNo.length < 3) return;

    const lookupContract = async () => {
      try {
        const { data: matchedContracts } = await supabase
          .from('contracts')
          .select('*')
          .ilike('contract_number', contractNo)
          .eq('status', 'active');

        if (matchedContracts && matchedContracts.length > 0) {
          const firstContract = matchedContracts[0];
          
          setFormData(prev => {
            const updated = { ...prev };
            
            if (firstContract.supplier_id && updated.supplier_id !== firstContract.supplier_id) {
              updated.supplier_id = firstContract.supplier_id;
              updated.supplier_ids = [firstContract.supplier_id];
            }
            if (updated.vote_code !== '080702') {
              updated.vote_code = '080702';
            }
            if (!updated.vote_activity) {
              updated.vote_activity = '27401';
            }
            if (!updated.category) {
              updated.category = 'drug';
            }
            return updated;
          });

          // Resolve and add the items of these contracts to the PO
          for (const contract of matchedContracts) {
            const alreadyAdded = formData.items?.some(it => 
              it.item_code === contract.item_code || 
              it.item_name?.toLowerCase() === contract.contract_name?.toLowerCase()
            );
            if (alreadyAdded) continue;

            let catalogItem = null;
            if (contract.item_code) {
              const { data: drug } = await supabase
                .from('drugs')
                .select('*')
                .eq('drug_code', contract.item_code)
                .maybeSingle();
              if (drug) {
                catalogItem = { ...drug, item_type: 'drug' };
              } else {
                const { data: nonDrug } = await supabase
                  .from('non_drugs')
                  .select('*')
                  .eq('item_code', contract.item_code)
                  .maybeSingle();
                if (nonDrug) {
                  catalogItem = { ...nonDrug, item_type: 'non_drug' };
                }
              }
            }

            if (!catalogItem && contract.contract_name) {
              const firstWord = contract.contract_name.trim().split(/\s+/)[0];
              if (firstWord && firstWord.length >= 3) {
                const clean = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                const cleanContractName = clean(contract.contract_name);

                // 1. Try drugs table
                const { data: drugCandidates } = await supabase
                  .from('drugs')
                  .select('*')
                  .ilike('drug_name', `%${firstWord}%`);

                if (drugCandidates && drugCandidates.length > 0) {
                  const matched = drugCandidates.find((c: any) => clean(c.drug_name) === cleanContractName);
                  if (matched) {
                    catalogItem = { ...matched, item_type: 'drug' };
                  }
                }

                // 2. Try non_drugs table if still not resolved
                if (!catalogItem) {
                  const { data: nonDrugCandidates } = await supabase
                    .from('non_drugs')
                    .select('*')
                    .ilike('item_name', `%${firstWord}%`);

                  if (nonDrugCandidates && nonDrugCandidates.length > 0) {
                    const matched = nonDrugCandidates.find((c: any) => clean(c.item_name) === cleanContractName);
                    if (matched) {
                      catalogItem = { ...matched, item_type: 'non_drug' };
                    }
                  }
                }
              }
            }

            if (catalogItem) {
              const newItem: POItem = {
                item_type: catalogItem.item_type as 'drug' | 'non_drug',
                item_id: catalogItem.id,
                quantity: 1,
                unit_price: contract.unit_price ? Number(contract.unit_price) : (catalogItem.price ? Number(catalogItem.price) : 0),
                packaging_description: catalogItem.unit_of_measure || contract.unit || catalogItem.packaging_description || '',
                item_name: 'drug_name' in catalogItem ? catalogItem.drug_name : catalogItem.item_name,
                item_code: 'drug_code' in catalogItem ? catalogItem.drug_code : catalogItem.item_code,
              };

              setFormData(prev => {
                const currentItems = prev.items || [];
                const duplicate = currentItems.some(it => it.item_id === newItem.item_id);
                if (duplicate) return prev;
                return {
                  ...prev,
                  items: [...currentItems, newItem]
                };
              });
            }
          }
        }
      } catch (err) {
        console.error('Error looking up contract number:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      void lookupContract();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [formData.kkm_contract_number, hospitalId]);

  const addManualItem = () => {
    if (!manualItem.item_name) {
      showError('Validation Error', 'Please enter item name')
      return
    }
    if (manualItem.quantity <= 0) {
      showError('Validation Error', 'Quantity must be greater than 0')
      return
    }
    if (formData.po_type !== 'sq' && manualItem.unit_price <= 0) {
      showError('Validation Error', 'Price must be greater than 0')
      return
    }

    const newItem: any = {
      item_type: manualItem.item_type,
      item_id: `manual-${Date.now()}`,
      quantity: manualItem.quantity,
      unit_price: manualItem.unit_price,
      packaging_description: manualItem.packaging_description,
      item_name: manualItem.item_name,
      item_code: manualItem.item_code || 'MANUAL',
    }

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }))

    // Reset
    setManualItem({
      item_name: '',
      item_code: '',
      packaging_description: '',
      quantity: 1,
      unit_price: 0,
      item_type: 'drug'
    })
  }

  const removeItem = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items?.filter((_: any, i: number) => i !== index) || [],
    }))
  }

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items?.map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item)) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      if (!hospitalId || !userId) {
        showError('Error', 'User information not available')
        return
      }

      // Validation
      if (!formData.vote_code || !formData.vote_activity || !formData.category || !formData.department) {
        showError('Validation Error', 'Please fill in all required fields')
        return
      }

      // Supplier validation
      if (formData.po_type === 'sq') {
        if ((!formData.supplier_ids || formData.supplier_ids.length === 0) && !formData.supplier_id) {
          showError('Validation Error', 'Please select at least one supplier for quotation')
          return
        }
      } else {
        if (!formData.supplier_id) {
          showError('Validation Error', 'Please select a supplier')
          return
        }
      }

      if (formData.supplier_id === 'other' && !formData.manual_supplier_name) {
        showError('Validation Error', 'Please enter manual supplier name')
        return
      }

      if (!formData.items || formData.items.length === 0) {
        showError('Validation Error', 'Please add at least one item')
        return
      }

      // Relaxed validation for SQ and Manual PO: No item limit
      if (formData.po_type === 'regular' && formData.items.length > 5) {
        showError('Validation Error', 'Maximum 5 items per purchase order')
        return
      }

      // Validate items
      for (const item of formData.items) {
        if (item.quantity <= 0) {
          showError('Validation Error', 'Item quantity must be greater than 0')
          return
        }
        if (formData.po_type !== 'sq' && item.unit_price <= 0) {
          showError('Validation Error', 'Item price must be greater than 0')
          return
        }
      }

      // Manual budget fields validation (Required for all modes if 'other' is selected)
      if (formData.vote_code === 'other' && !formData.manual_vote_code) {
        showError('Validation Error', 'Please enter manual vote code')
        return
      }
      if (formData.vote_activity === 'other' && !formData.manual_vote_activity) {
        showError('Validation Error', 'Please enter manual activity')
        return
      }
      if (formData.category === 'other' && !formData.manual_category) {
        showError('Validation Error', 'Please enter manual category')
        return
      }
      if (formData.department === 'other' && !formData.manual_department) {
        showError('Validation Error', 'Please enter manual department')
        return
      }

      // Budget validation - BLOCK submission if balance will be negative (bypassed if vote code is manual/other)
      if (formData.vote_code !== 'other' && balanceAfterPurchase !== null && balanceAfterPurchase < 0) {
        showError('Budget Error', `Insufficient budget balance. You are over-budget by RM ${Math.abs(balanceAfterPurchase).toLocaleString(undefined, { minimumFractionDigits: 2 })}.`)
        return
      }

      // Modification reason validation
      if (editMode && existingPO && existingPO.status !== 'draft' && !formData.modification_reason) {
        showError('Validation Error', 'Please provide a modification reason for this active purchase order.')
        return
      }


      let finalSupplierId = formData.supplier_id
      let finalManualSupplierName = formData.manual_supplier_name
      let finalManualSupplierAddress = formData.manual_supplier_address

      if (formData.supplier_id === 'other' && formData.manual_supplier_name) {
        try {
          const supplierRes = await createSupplier(hospitalId, {
            company_name: formData.manual_supplier_name,
            address: formData.manual_supplier_address || '',
            supplier_type: formData.po_type === 'sq' ? 'both' : (formData.category === 'drug' ? 'drug' : 'non_drug'),
            status: 'active',
          })

          if (supplierRes.data) {
            finalSupplierId = supplierRes.data.id
            finalManualSupplierName = undefined
            finalManualSupplierAddress = undefined
            showSuccess('Supplier Added', `Successfully added "${formData.manual_supplier_name}" to the supplier catalog.`)
          } else {
            console.warn('Failed to automatically create supplier:', supplierRes.error)
          }
        } catch (err) {
          console.error('Error during auto-creating supplier:', err)
        }
      }

      const submitData: PurchaseOrderFormData = {
        supplier_id: (formData.po_type === 'sq' && formData.supplier_ids && formData.supplier_ids.length > 0)
          ? undefined as any
          : finalSupplierId,
        sq_suppliers: (formData.po_type === 'sq' && formData.supplier_ids && formData.supplier_ids.length > 0)
          ? formData.supplier_ids.map((id: string) => suppliers.find(s => s.id === id)?.company_name || 'Unknown Supplier')
          : undefined,
        vote_code: formData.vote_code!,
        vote_activity: formData.vote_activity!,
        category: formData.category!,
        department: formData.department!,
        expected_delivery_date: formData.expected_delivery_date,
        payment_terms: formData.payment_terms,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        po_type: formData.po_type,
        inv_sq_number: formData.inv_sq_number,
        program_name: formData.program_name,
        manual_supplier_name: finalManualSupplierName,
        manual_supplier_address: finalManualSupplierAddress,
        manual_vote_code: formData.manual_vote_code,
        manual_vote_activity: formData.manual_vote_activity,
        manual_category: formData.manual_category,
        manual_department: formData.manual_department,
        kkm_contract_number: formData.kkm_contract_number,
        items: formData.items.map((item: any) => ({
          item_type: item.item_type,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          packaging_description: item.packaging_description,
          contract_number: item.contract_number || item.cc_contract_number || formData.kkm_contract_number,
          lead_time_days: item.lead_time_days || item.lead_time,
          contract_end_date: item.contract_end_date || item.cc_contract_end_date,
        })),
        modification_reason: formData.modification_reason,
      } as any

      if (!editMode) {
        const result = await createPurchaseOrder(hospitalId, userId, submitData)
        if (result.error) {
          showError('Creation Error', result.error)
        } else {
          isSubmittedRef.current = true
          // Clear draft on successful creation
          const DRAFT_KEY = `po_draft_${hospitalId}_${userId}`
          localStorage.removeItem(DRAFT_KEY)
          // Also clear from state/prevent auto-save
          setFormData((prev: any) => ({ ...prev, items: [] }))

          showSuccess('Success', formData.po_type === 'sq' 
            ? 'Successfully created quotation invitation for all selected suppliers.'
            : 'Purchase order created successfully.')
          navigate(ROUTES.PHARMACY_PO)
        }
      } else if (editMode && poId) {
        // Update existing PO
        const result = await updatePurchaseOrder(poId, userId!, submitData)

        if (result.error) {
          showError('Error', result.error)
        } else {
          showSuccess('Success', 'Purchase order updated successfully')
          navigate(ROUTES.PHARMACY_PO_DETAIL.replace(':id', poId))
        }
      } else {
        // Create single new PO
        const result = await createPurchaseOrder(hospitalId, userId, submitData)

        if (result.error) {
          showError('Error', result.error)
        } else {
          isSubmittedRef.current = true
          // Clear draft on successful creation fallback
          const DRAFT_KEY = `po_draft_${hospitalId}_${userId}`
          localStorage.removeItem(DRAFT_KEY)
          // Also clear from state/prevent auto-save
          setFormData((prev: any) => ({ ...prev, items: [] }))

          showSuccess('Success', 'Purchase order created successfully')
          navigate(ROUTES.PHARMACY_PO)
        }
      }
    } catch (error) {
      console.error('Error saving purchase order:', error)
      showError('Error', editMode ? 'Failed to update purchase order' : 'Failed to create purchase order')
    } finally {
      isSubmittingRef.current = false
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
      navigate(ROUTES.PHARMACY_PO)
    }
  }

  const calculateTotals = () => {
    if (!formData.items || formData.items.length === 0) {
      return { subtotal: 0, total: 0 }
    }

    const subtotal = formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)
    const total = subtotal

    return { subtotal, total }
  }

  const totals = calculateTotals()


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading Procurement System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-x-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Professional Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-100 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/40 via-transparent to-slate-200/40"></div>
      </div>

      <div className="relative z-10">
      {/* Premium Enterprise Header */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate(ROUTES.PHARMACY_PO)}
              className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  {editMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                  Draft
                </span>
              </div>
              <nav className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.05em]">
                <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/financial')}>Financial</span>
                <IconChevronRight className="w-2.5 h-2.5 opacity-40" />
                <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/procurement')}>Procurement</span>
                <IconChevronRight className="w-2.5 h-2.5 opacity-40" />
                <span className="text-slate-900 font-bold">{editMode ? 'Edit' : 'New'}</span>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!editMode && hospitalId && userId && localStorage.getItem(`po_draft_${hospitalId}_${userId}`) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to discard this draft and start a new order?")) {
                    isClearedRef.current = true
                    const DRAFT_KEY = `po_draft_${hospitalId}_${userId}`
                    localStorage.removeItem(DRAFT_KEY)
                    setFormData({
                      supplier_id: '',
                      vote_code: '',
                      vote_activity: '',
                      category: '',
                      department: '',
                      po_type: 'regular',
                      kkm_contract_number: '',
                      inv_sq_number: '',
                      program_name: '',
                      manual_supplier_name: '',
                      manual_supplier_address: '',
                      manual_vote_code: '',
                      manual_vote_activity: '',
                      manual_category: '',
                      manual_department: '',
                      supplier_ids: [],
                      items: [],
                      modification_reason: '',
                    })
                    setTimeout(() => {
                      isClearedRef.current = false
                    }, 200)
                    showSuccess('Draft Discarded', 'The draft has been cleared successfully.')
                  }
                }}
                className="border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 transition-all rounded-xl h-10 px-5"
              >
                Discard Draft
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                if (editMode) {
                  setShowCancelDialog(true)
                } else {
                  if (hospitalId && userId) {
                    isClearedRef.current = true
                    const DRAFT_KEY = `po_draft_${hospitalId}_${userId}`
                    localStorage.removeItem(DRAFT_KEY)
                  }
                  navigate(ROUTES.PHARMACY_PO)
                }
              }}
              className="border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all rounded-xl h-10 px-5"
            >
              Cancel
            </Button>



            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="bg-indigo-600 text-white font-bold text-xs uppercase tracking-[0.05em] hover:bg-indigo-700 active:scale-[0.98] transition-all rounded-xl h-10 px-6 flex items-center gap-2 shadow-[0_1px_3px_rgba(79,70,229,0.4)]"
            >
              {isSubmitting ? <Spinner size="sm" /> : <IconSave className="w-4 h-4" />}
              {isSubmitting ? 'Processing...' : (editMode ? `Update ${formData.po_type === 'sq' ? 'SQ' : 'PO'}` : `Generate ${formData.po_type === 'sq' ? 'SQ' : 'PO'}`)}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Left Column: Configuration & Summary (Sticky) */}
            <div className="w-full lg:w-[400px] space-y-6 lg:sticky lg:top-24">
              
              {/* Section 1: Order Configuration */}
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">1. Configuration</h2>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                      formData.po_type === 'regular' ? 'bg-blue-100 text-blue-700' :
                      formData.po_type === 'manual' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {formData.po_type === 'regular' ? 'Purchase Order' : formData.po_type === 'manual' ? 'Manual' : 'Invite Quotation'}
                    </span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                </div>
                <div className="p-3 space-y-3">
                  {/* Procurement Type Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Procurement Type <span className="text-red-500">*</span></label>
                    <Select
                      value={formData.po_type}
                      onChange={(e) => {
                        const type = e.target.value;
                        handleInputChange('po_type', type);
                        if (type === 'sq' && formData.supplier_id && formData.supplier_id !== 'other') {
                          handleInputChange('supplier_ids', [formData.supplier_id]);
                        }
                      }}
                      className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:bg-indigo-50"
                    >
                      <option value="regular">Purchase Order (PO)</option>
                      <option value="manual">Manual Purchase Order</option>
                      <option value="sq">Invite Quotation (SQ)</option>
                    </Select>
                  </div>

                  {/* Program Name - Only for Manual PO */}
                  <AnimatePresence>
                    {formData.po_type === 'manual' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Program Name</label>
                        <Input
                          placeholder="e.g. Perkhidmatan Farmasi"
                          value={formData.program_name || ''}
                          onChange={(e) => handleInputChange('program_name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Supplier Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Supplier {formData.po_type === 'sq' ? '(Multiple Selection Enabled)' : ''} <span className="text-red-500">*</span>
                    </label>
                    
                    {formData.po_type === 'sq' ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-3">
                        {suppliers.length === 0 ? (
                          <div className="flex items-center gap-2 text-slate-400 italic text-sm py-2">
                            <Spinner size="sm" />
                            <span>Loading available suppliers...</span>
                          </div>
                        ) : (
                          suppliers.map((supplier) => (
                            <label key={supplier.id} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                              <Checkbox 
                                checked={formData.supplier_ids?.includes(supplier.id)}
                                onCheckedChange={(checked) => {
                                  const currentIds = formData.supplier_ids || [];
                                  let newIds: string[];
                                  if (checked) {
                                    newIds = [...currentIds, supplier.id];
                                  } else {
                                    newIds = currentIds.filter((id: string) => id !== supplier.id);
                                  }
                                  handleInputChange('supplier_ids', newIds);
                                  
                                  // Update single supplier_id for compatibility if needed
                                  if (newIds.length > 0) {
                                    handleInputChange('supplier_id', newIds[0]);
                                  } else {
                                    handleInputChange('supplier_id', '');
                                  }
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                  {supplier.company_name}
                                </span>
                                {supplier.supplier_code && (
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-tight">
                                    {supplier.supplier_code}
                                  </span>
                                )}
                              </div>
                            </label>
                          ))
                        )}
                        {suppliers.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 mt-2">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center">
                              {formData.supplier_ids?.length || 0} Supplier(s) selected
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={formData.supplier_id || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('supplier_id', value);
                          if (value !== 'other') {
                            // Clear manual fields if a database supplier is chosen
                            setFormData((prev: any) => ({
                              ...prev,
                              manual_supplier_name: '',
                              manual_supplier_address: '',
                              supplier_ids: value ? [value] : []
                            }));
                          } else {
                            setFormData((prev: any) => ({
                              ...prev,
                              supplier_ids: []
                            }));
                          }
                        }}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                        disabled={isLoading}
                      >
                        <option value="">{suppliers.length === 0 ? 'Loading Suppliers...' : 'Select a Supplier'}</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
                        ))}
                        <option value="other" className="font-bold text-indigo-600">Others (Manual Entry)</option>
                      </Select>
                    )}

                    {formData.supplier_id === 'other' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 space-y-3 overflow-hidden"
                      >
                        <AutoExpandingTextarea
                          placeholder="Manual Supplier Name..."
                          value={formData.manual_supplier_name || ''}
                          onChange={(e) => handleInputChange('manual_supplier_name', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900"
                        />
                        <AutoExpandingTextarea
                          placeholder="Manual Supplier Address..."
                          value={formData.manual_supplier_address || ''}
                          onChange={(e) => handleInputChange('manual_supplier_address', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Vote Code & Activity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Vote Code <span className="text-red-500">*</span></label>
                      <Select
                        value={formData.vote_code || ''}
                        onChange={(e) => handleInputChange('vote_code', e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                      >
                        {formData.po_type !== 'sq' && <option value="">Select</option>}
                        {dynamicVoteCodes.filter(code => 
                          formData.po_type !== 'sq' || code.value === '080702'
                        ).map((code) => (
                          <option key={code.value} value={code.value}>{code.label}</option>
                        ))}
                      </Select>
                      {formData.vote_code === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <AutoExpandingTextarea
                            placeholder="Enter Manual Vote Code..."
                            value={formData.manual_vote_code || ''}
                            onChange={(e) => handleInputChange('manual_vote_code', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                          />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Activity <span className="text-red-500">*</span></label>
                      <Select
                        value={formData.vote_activity || ''}
                        onChange={(e) => handleInputChange('vote_activity', e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                      >
                        <option value="">Select</option>
                        {VOTE_ACTIVITIES.map((activity) => (
                          <option key={activity.value} value={activity.value}>{activity.label}</option>
                        ))}
                      </Select>
                      {formData.vote_activity === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <AutoExpandingTextarea
                            placeholder="Enter Manual Activity..."
                            value={formData.manual_vote_activity || ''}
                            onChange={(e) => handleInputChange('manual_vote_activity', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* KKM Contract No - Only for CC/DP and not for SQ */}
                  <AnimatePresence>
                    {isCcVote(formData.vote_code) && formData.po_type !== 'sq' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">KKM Contract No.</label>
                        <Input
                          placeholder="e.g. KKM-2024-..."
                          value={formData.kkm_contract_number || ''}
                          onChange={(e) => handleInputChange('kkm_contract_number', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inv / SQ Number - Not for SQ */}
                  {formData.po_type !== 'sq' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Inv / SQ Number</label>
                      <Input
                        placeholder="e.g. INV-12345 or SQ-67890"
                        value={formData.inv_sq_number || ''}
                        onChange={(e) => handleInputChange('inv_sq_number', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                      />
                    </div>
                  )}

                  {/* Category & Department */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Department</label>
                      <Select
                        value={formData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                      >
                        <option value="">Select Department</option>
                        {WARRANT_DEPARTMENTS.map((dept) => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </Select>
                      {formData.department === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <AutoExpandingTextarea
                            placeholder="Enter Manual Department..."
                            value={formData.manual_department || ''}
                            onChange={(e) => handleInputChange('manual_department', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                          />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Category</label>
                      <Select
                        value={formData.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none transition-all hover:border-slate-300"
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </Select>
                      {formData.category === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <AutoExpandingTextarea
                            placeholder="Enter Manual Category..."
                            value={formData.manual_category || ''}
                            onChange={(e) => handleInputChange('manual_category', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {editMode && existingPO && existingPO.status !== 'draft' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm mb-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      <IconHistory className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Modification Reason</h3>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Required for active orders</p>
                    </div>
                  </div>
                  <textarea
                    placeholder="Briefly explain why this PO is being modified..."
                    value={(formData as any).modification_reason || ''}
                    onChange={(e) => handleInputChange('modification_reason' as any, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all min-h-[100px]"
                    required
                  />
                </motion.div>
              )}

              {/* Section 3: Financial Summary - Redesigned as Premium Statement */}
              <div className="bg-[#0F172A] rounded-2xl shadow-xl shadow-indigo-900/10 overflow-hidden border border-white/5 relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <IconCalculator className="w-24 h-24 text-white" />
                </div>
                <div className="p-4 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Budget Statement</h2>
                    <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 uppercase">
                      Live Update
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {balanceAfterPurchase !== null && (
                      <div className="space-y-4 pb-5 border-b border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Allocation</span>
                            <span className="text-sm font-bold text-white font-mono tracking-tight">{formatCurrency(totalAllocation)}</span>
                          </div>
                          <div className="text-right flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Balance</span>
                            <span className="text-sm font-bold text-indigo-400 font-mono tracking-tight">{formatCurrency(availableBudget)}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Final Balance</span>
                            <span className={`text-sm font-bold font-mono tracking-tight ${balanceAfterPurchase >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(balanceAfterPurchase)}
                            </span>
                          </div>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (totals.total / availableBudget) * 100)}%` }}
                              className={`h-full ${balanceAfterPurchase >= 0 ? 'bg-indigo-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                            />
                          </div>
                        </div>

                        {formData.vote_code !== 'other' && balanceAfterPurchase !== null && balanceAfterPurchase < 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3"
                          >
                            <IconAlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-tight">Critical Budget Warning</p>
                              <p className="text-[11px] font-bold text-rose-100/80 leading-relaxed">
                                This purchase exceeds the available budget by <span className="text-rose-300 font-black">{formatCurrency(Math.abs(balanceAfterPurchase))}</span>. Approval will be blocked.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {formData.vote_code === 'other' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3"
                          >
                            <IconInfoCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-tight">Manual Vote Code</p>
                              <p className="text-[11px] font-bold text-emerald-100/80 leading-relaxed">
                                Budget allocation bypassed for manual entry. Submission is allowed.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Subtotal</span>
                        <span className="text-xs font-semibold font-mono">{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.1em]">Total Payable</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-white/50">RM</span>
                            <span className="text-2xl font-black text-white font-mono tracking-tighter">
                              {totals.total.toFixed(2).split('.')[0]}
                              <span className="text-sm text-white/40">.{totals.total.toFixed(2).split('.')[1]}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Items (Workspace) */}
            <div className="flex-1 space-y-6">
              {/* Section 2: Order Items */}
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/60 overflow-hidden min-h-[400px] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
                  <div>
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">2. Order Items</h2>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Manage drugs and medical supplies for this procurement</p>
                  </div>
                  {formData.po_type === 'regular' && formData.items && formData.items.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider">Current Capacity</p>
                        <p className="text-[11px] font-bold text-slate-600">{formData.items.length} / 5 Items</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl border-2 border-slate-100 flex items-center justify-center relative">
                        <svg className="w-8 h-8 -rotate-90">
                          <circle cx="16" cy="16" r="14" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                          <circle cx="16" cy="16" r="14" fill="none" stroke="#4F46E5" strokeWidth="3" strokeDasharray={88} strokeDashoffset={88 - (formData.items.length / 5) * 88} strokeLinecap="round" className="transition-all duration-500" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-600">{formData.items.length}</span>
                      </div>
                    </div>
                  )}
                </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Omnibox Search or Manual Entry */}
              {formData.po_type !== 'manual' ? (
                (formData.po_type === 'sq' || !formData.items || formData.items.length < 5) && (
                  <div className="relative item-search-container max-w-3xl mx-auto w-full">
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-focus-within:scale-110 group-focus-within:text-indigo-600">
                        <IconSearch className="w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search catalog for drugs or supplies..."
                        value={itemSearch}
                        onChange={(e) => {
                          setItemSearch(e.target.value)
                          setShowSuggestions(!!e.target.value.trim())
                        }}
                        className="w-full pl-16 pr-6 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] text-sm text-slate-900 placeholder:text-slate-400 font-bold shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus:border-indigo-500 focus:shadow-[0_12px_40px_-8px_rgba(79,70,229,0.15)] focus:ring-4 focus:ring-indigo-50 outline-none transition-all hover:border-slate-300"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <kbd className="hidden sm:inline-flex items-center h-6 px-2 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-slate-400 shadow-sm">⌘ K</kbd>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showSuggestions && allItems.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute z-50 w-full mt-3 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden max-h-[400px] overflow-y-auto"
                        >
                          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Search Results {isApplVote(formData.vote_code) ? '(APPL Catalog)' : isCcVote(formData.vote_code) ? '(CC Catalog)' : ''}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{allItems.length} found</span>
                          </div>
                          {allItems.map((item) => (
                            <button
                              key={`${item.item_type}-${item.id}`}
                              type="button"
                              onClick={() => {
                                addItem(item)
                                setItemSearch('')
                                setShowSuggestions(false)
                              }}
                              className="w-full text-left px-5 py-4 hover:bg-indigo-50/30 border-b border-slate-100 last:border-b-0 flex items-center justify-between group transition-all"
                            >
                              <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.item_type === 'drug' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                                  {item.item_type === 'drug' ? <IconActivity className="w-5 h-5" /> : <IconPackage className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                      {'drug_name' in item ? item.drug_name : item.item_name}
                                    </span>
                                    {((item as any).procurement_vote === 'cc' || (item as any).category === 'Contract Catalog' || (item as any).kkm_contract_number || (item as any).contract_number) ? (
                                      <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                                        CC Contract
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 uppercase tracking-wider">
                                        Non-Contract
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                                      {('drug_code' in item ? item.drug_code : item.item_code)}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                      {typeof (item as any).category === 'object' && (item as any).category !== null 
                                        ? ((item as any).category as any).category_name 
                                        : ((item as any).category || 'General')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 tabular-nums">
                                  {item.price ? formatCurrency(Number(item.price)) : '—'}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 mt-1 flex items-center gap-1">
                                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Quick Add</span>
                                  <IconPlus className="w-3 h-3 text-indigo-600" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}

                      {showSuggestions && allItems.length === 0 && itemSearch.trim().length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute z-50 w-full mt-3 bg-white border border-amber-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden p-6 text-center"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3 text-amber-600">
                            <IconAlertCircle className="w-6 h-6 text-amber-600" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Item Tidak Wujud Dalam Katalog MyInventory {isApplVote(formData.vote_code) ? '(APPL)' : isCcVote(formData.vote_code) ? '(CC)' : ''}
                          </h4>
                          <p className="text-xs text-slate-600 max-w-md mx-auto mb-4 leading-relaxed">
                            Ubat/Item <span className="font-semibold text-slate-900">"{itemSearch}"</span> tidak ditemui dalam senarai {isApplVote(formData.vote_code) ? 'APPL' : isCcVote(formData.vote_code) ? 'CC' : 'Katalog'} MyInventory. Sila tambah ubat/item ini secara manual ke dalam katalog di modul <span className="font-bold text-teal-700">MyInventory</span> terlebih dahulu.
                          </p>
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSuggestions(false)}
                              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              Tutup
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setShowSuggestions(false)
                                navigate('/inventory/drug-inventory', { 
                                  state: { filter: isApplVote(formData.vote_code) ? 'appl' : isCcVote(formData.vote_code) ? 'cc' : 'all' } 
                                })
                              }}
                              className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-md hover:from-teal-700 hover:to-emerald-700"
                            >
                              Buka MyInventory →
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mx-auto w-full mb-6"
                >
                    <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center shrink-0">
                          <IconPlus className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add Manual Item</h3>
                      </div>
                      
                      <button
                        type="button"
                        onClick={addManualItem}
                        disabled={!manualItem.item_name || !manualItem.quantity || (formData.po_type !== 'sq' && !manualItem.unit_price)}
                        className="h-8 px-5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.95] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                        title="Add Item"
                      >
                        <IconPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                    
                    {/* Two-Row Data Entry Layout */}
                    <div className="space-y-4">
                      {/* Row 1: Item Name */}
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Description</label>
                        <AutoExpandingTextarea
                          placeholder="Enter drug or supply name..."
                          value={manualItem.item_name}
                          onChange={(e) => setManualItem(prev => ({ ...prev, item_name: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all min-h-[38px] shadow-sm"
                        />
                      </div>

                      {/* Row 2: Secondary Attributes */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="col-span-1 sm:col-span-3 space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Code</label>
                          <Input
                            placeholder="e.g. 080702"
                            value={manualItem.item_code}
                            onChange={(e) => setManualItem(prev => ({ ...prev, item_code: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-mono shadow-sm"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-4 space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Packaging</label>
                          <AutoExpandingTextarea
                            placeholder="e.g. Box of 10"
                            value={manualItem.packaging_description}
                            onChange={(e) => setManualItem(prev => ({ ...prev, packaging_description: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all min-h-[38px] shadow-sm"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left sm:text-right">Qty</label>
                          <Input
                            type="number"
                            min="1"
                            value={manualItem.quantity}
                            onChange={(e) => setManualItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-left sm:text-right shadow-sm"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-3 space-y-1.5">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left sm:text-right">Price (RM)</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualItem.unit_price}
                            onChange={(e) => setManualItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-left sm:text-right shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              {/* Items List */}
              <div className="space-y-2">
                {formData.items && formData.items.length > 0 ? (
                  formData.items.map((item: any, index: number) => (
                    <div key={`${item.item_id}-${index}`} className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                      <div className="flex flex-col lg:flex-row">
                        {/* Status Accent */}
                        <div className={`w-1 lg:w-1.5 shrink-0 ${item.item_type === 'drug' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                        
                        <div className="flex-1 p-3 flex flex-col lg:flex-row gap-3 items-center">
                          {/* Item Metadata */}
                          <div className="flex-1 min-w-0 w-full lg:w-auto">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug break-words">
                                  {item.item_name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                                    <IconActivity className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono truncate max-w-[150px]" title={item.item_code}>{item.item_code}</span>
                                  </div>
                                  <span className="text-slate-200 hidden sm:block">|</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] ${item.item_type === 'drug' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                    {item.item_type}
                                  </span>
                                </div>

                                {/* CC Item Contract Details Card - Only show if real contract details exist and not in SQ mode */}
                                {formData.po_type !== 'sq' && (item.contract_number || (item as any).cc_contract_number || item.supplier_name || (item as any).cc_supplier_name) && (
                                  <div className="mt-3 p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px] w-full">
                                    <div>
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Nama Pembekal</span>
                                      <span className="font-bold text-slate-800 truncate block" title={item.supplier_name || (item as any).cc_supplier_name || suppliers.find(s => s.id === formData.supplier_id)?.company_name || '-'}>
                                        {item.supplier_name || (item as any).cc_supplier_name || suppliers.find(s => s.id === formData.supplier_id)?.company_name || '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">No. Kontrak</span>
                                      <span className="inline-block font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded text-[10px] truncate max-w-full" title={item.contract_number || (item as any).cc_contract_number || formData.kkm_contract_number || '-'}>
                                        {item.contract_number || (item as any).cc_contract_number || formData.kkm_contract_number || '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Tarikh Mula</span>
                                      <span className="font-bold text-slate-800 block">
                                        {(item as any).cc_contract_start_date || (item as any).contract_start_date || '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Tarikh Tamat</span>
                                      <span className="font-bold text-slate-800 block">
                                        {item.contract_end_date || (item as any).cc_contract_end_date || '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Status Kontrak</span>
                                      <span className="inline-block font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                                        {(item as any).cc_contract_status || '-'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                                title="Remove item"
                              >
                                <IconX className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                  required
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Price (RM)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  required
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Packaging</label>
                                <textarea
                                  value={item.packaging_description}
                                  onChange={(e) => updateItem(index, 'packaging_description', e.target.value)}
                                  placeholder="e.g. Box of 10"
                                  rows={1}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none min-h-[32px] shadow-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Line Total Section */}
                          <div className="w-full lg:w-32 lg:h-auto lg:border-l border-slate-100 flex flex-col justify-center items-end lg:pl-4 mt-2 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-t-0">
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Line Total</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] font-bold text-slate-400">RM</span>
                                <span className="text-xl font-black text-slate-900 font-mono tracking-tighter">
                                  {item.quantity && item.unit_price ? (item.quantity * item.unit_price).toFixed(2).split('.')[0] : '0'}
                                  <span className="text-xs opacity-30">.{item.quantity && item.unit_price ? (item.quantity * item.unit_price).toFixed(2).split('.')[1] : '00'}</span>
                                </span>
                              </div>
                              <div className={cn(
                                "mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border",
                                item.unit_price > 0 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              )}>
                                {item.unit_price > 0 ? 'Valid Price' : 'Quotation Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                      <IconPackage className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Your order is empty</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">Start by searching for items in the catalog above</p>
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      <IconInfoCircle className="w-4 h-4" />
                      Add up to 5 items per order
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Professional Signatory Section */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-12 pb-8">
                  {/* Compact Requester Signature */}
                  <div className="group relative transition-all">
                    <div className="flex flex-col items-center">
                      <div className="text-center space-y-4 w-full">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">Authorized Requester</p>
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                            Tandatangan Pegawai Yang Memohon
                          </h4>
                        </div>
                        
                        {/* Signature Line */}
                        <div className="h-px w-full bg-slate-200 group-hover:bg-indigo-400 transition-all"></div>
                        
                        {signatures ? (
                          <div className="leading-tight">
                            <p className="text-[12px] font-black text-slate-800 uppercase">{signatures.applicantName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{signatures.applicantPosition}</p>
                          </div>
                        ) : (
                          <div className="h-8 w-48 bg-slate-50 animate-pulse rounded mx-auto"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Approver Signature */}
                  <div className="group relative transition-all">
                    <div className="flex flex-col items-center">
                      <div className="text-center space-y-4 w-full">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Authorized Approver</p>
                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                            Tandatangan Pegawai Yang Meluluskan
                          </h4>
                        </div>

                        {/* Approval Line */}
                        <div className="h-px w-full bg-slate-200 group-hover:bg-emerald-400 transition-all"></div>

                        {existingPO?.approved_by_user ? (
                          <div className="leading-tight text-center">
                            <p className="text-[12px] font-black text-slate-800 uppercase">{existingPO.approved_by_user.full_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{existingPO.approved_by_user.jawatan}</p>
                          </div>
                        ) : signatures ? (
                          <div className="leading-tight">
                            <p className="text-[12px] font-black text-slate-800 uppercase">{signatures.headName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{signatures.headPosition}</p>
                          </div>
                        ) : (
                          <div className="h-8 w-48 bg-slate-50 animate-pulse rounded mx-auto"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Supplier Info Section (Right Column) */}
              {formData.po_type === 'sq' && (formData.supplier_ids?.length || 0) > 0 && (
                <div className="bg-indigo-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-lg shadow-indigo-200">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <IconBuilding className="w-20 h-20" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <IconUser className="w-5 h-5 text-indigo-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight">Invitation Recipients</h3>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Separate SQ documents will be generated</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.supplier_ids?.map((id: string, idx: number) => {
                        const supplier = suppliers.find(s => s.id === id);
                        return (
                          <div key={id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10 group hover:bg-white/10 transition-all relative">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center text-[10px] font-black shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate pr-6">{supplier?.company_name || 'Loading...'}</p>
                              <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-tighter leading-none mt-0.5">{supplier?.supplier_code}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newIds = formData.supplier_ids?.filter((sid: string) => sid !== id) || [];
                                handleInputChange('supplier_ids', newIds);
                                if (newIds.length > 0) handleInputChange('supplier_id', newIds[0]);
                                else handleInputChange('supplier_id', '');
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <IconX className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

            </div>
          </div>
        </form>
      </main>

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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

