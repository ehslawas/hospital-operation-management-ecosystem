// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useId } from 'react'
import { useNavigate } from 'react-router-dom'
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
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconSend,
  IconCheckCircle,
  IconSettings,
  IconChevronRight,
  IconHistory,
  IconUpload
} from '@/components/ui/Icons'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Button, Spinner, Badge, ConfirmationDialog, Modal, Input, Select } from '@/components/ui'
import { uploadLPO, checkDuplicateLPO } from '@/services/pharmacy/lpoService'
import { extractLpoNumberFromPdf, extractDatesFromPdf } from '@/lib/pdfParser'
import { 
  getPurchaseOrderById, 
  rejectPurchaseOrder, 
  deletePurchaseOrder, 
  submitPurchaseOrder, 
  approvePurchaseOrder, 
  sendPurchaseOrder 
} from '@/services/pharmacy/procurementService'
import { supabase } from '@/services/supabase'
import { getWarrants } from '@/services/pharmacy/warrantService'
import { getPharmacyPOSignatures, updatePharmacyPOSignatures, type PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'
import { generatePurchaseOrderPdf, openPdfForPrint, cleanupPdfUrl } from '@/services/pharmacy/poPdfService'
import { getBudgetForPO } from '@/services/pharmacy/budgetEngine'
import type { PurchaseOrderWithRelations, PurchaseOrderItem } from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'
import { cn, formatCurrency, formatDateTime, isContractExpired } from '@/lib/utils'

const getStatusColor = (status: string) => {
  switch (status || '') {
    case 'completed': return 'bg-emerald-50 border-emerald-200 text-emerald-700'
    case 'pending_approval':
    case 'draft': return 'bg-amber-50 border-amber-200 text-amber-700'
    case 'cancelled': return 'bg-rose-50 border-rose-200 text-rose-700'
    case 'approved':
    case 'sent': return 'bg-blue-50 border-blue-200 text-blue-700'
    default: return 'bg-slate-50 border-slate-200 text-slate-700'
  }
}

interface PurchaseOrderDetailViewProps {
  id?: string
  onClose?: () => void
  isSlideOver?: boolean
  onMutate?: () => void
}

export const PurchaseOrderDetailView: React.FC<PurchaseOrderDetailViewProps> = ({ id, onClose, isSlideOver, onMutate }) => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success: showSuccess, error: showError } = useToastStore()
  const hospitalId = user?.hospital_id
  const reactId = useId()
  const uniquePrintContainerId = `po-print-container-${reactId.replace(/:/g, '')}`

  const [order, setOrder] = useState<PurchaseOrderWithRelations | null>(null)
  const [items, setItems] = useState<Array<PurchaseOrderItem & { item_name?: string; item_code?: string; packaging_description?: string }>>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  
  // Compute display logs (including synthetic ones)
  const displayLogs = useMemo(() => {
    const dbLogs = [...logs]
    
    // Add synthetic mod if it exists and isn't in DB
    if (order?.notes?.includes('Edit Request')) {
      const lines = order.notes.split('\n')
      const modLine = lines.find(l => l.includes('Edit Request'))
      if (modLine) {
        let fallbackUser = (order as any)?.creator?.full_name || 'Authorized Officer'
        let fallbackReason = ''
        let fallbackDateStr = order.updated_at || new Date().toISOString()

        if (modLine.includes('[Edit Request]')) {
          // New Structured Format: [Edit Request] By: Name | Reason: Text | Date: ISO
          const userMatch = modLine.match(/By: (.*?) \|/)
          const reasonMatch = modLine.match(/Reason: (.*?) \|/)
          const dateMatch = modLine.match(/Date: (.*?)$/)
          
          if (userMatch) fallbackUser = userMatch[1]
          if (reasonMatch) fallbackReason = reasonMatch[1]
          if (dateMatch) fallbackDateStr = dateMatch[1]
        } else {
          // Old Format: [Date] Name Edit Request: Reason
          const modParts = modLine.split(' Edit Request: ')
          fallbackReason = modParts[1] || modLine.replace(/.*Edit Request:\s*/i, '')
          const header = modParts[0] || ''
          const dateMatch = header.match(/\[(.*?)\]/)
          if (dateMatch) fallbackDateStr = dateMatch[1]
          fallbackUser = header.replace(/\[.*?\]/, '').trim() || fallbackUser
        }
        
        const hasModLog = logs.some(l => l.action === 'modified' && l.notes?.includes(fallbackReason))
        if (!hasModLog) {
          dbLogs.push({
            id: 'synthetic-mod-history',
            action: 'modified',
            notes: fallbackReason,
            created_at: fallbackDateStr && !isNaN(Date.parse(fallbackDateStr)) ? new Date(fallbackDateStr).toISOString() : (order.updated_at || new Date().toISOString()),
            approver: { full_name: fallbackUser }
          })
        }
      }
    }

    return dbLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [logs, order?.notes, order?.updated_at, (order as any)?.creator?.full_name])

  const latestMod = useMemo(() => 
    displayLogs.find(l => l.action === 'modified'),
  [displayLogs])
  
  const [invitedSuppliers, setInvitedSuppliers] = useState<string[]>([])
  
  // Action Dialog States
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editReason, setEditReason] = useState('')
  const [isSavingEditReason, setIsSavingEditReason] = useState(false)
  
  const [isPrinting, setIsPrinting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const printContentRef = useRef<HTMLDivElement>(null)
  
  const [showSettings, setShowSettings] = useState(false)
  const [signatures, setSignatures] = useState<PharmacyPOSignatures>({
    applicantName: 'KAMRIAH BT HAJI MAIL',
    applicantPosition: 'PENOLONG PEGAWAI FARMASI U7 TBK 2',
    headName: 'TAN YUANG ZHANG',
    headPosition: 'PEGAWAI FARMASI UF 12',
  })
  const [tempSignatures, setTempSignatures] = useState<PharmacyPOSignatures>(signatures)
  const [isSavingSignatures, setIsSavingSignatures] = useState(false)
  const [hospitalUsers, setHospitalUsers] = useState<any[]>([])

  // LPO Upload/Change Modal state
  const [isUploadLpoModalOpen, setIsUploadLpoModalOpen] = useState(false)
  const [isUploadingLpo, setIsUploadingLpo] = useState(false)
  const [lpoUploadData, setLpoUploadData] = useState<{
    lpo_number: string
    document_date: string
    document_file?: File
    expected_delivery_date?: string
  }>({
    lpo_number: '',
    document_date: new Date().toISOString().split('T')[0]
  })
  const lpoFileInputRef = useRef<HTMLInputElement>(null)

  const handleLpoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showError("Invalid Format", "Only PDF files are allowed for LPO documents")
        e.target.value = ''
        return
      }
      setLpoUploadData(prev => ({ ...prev, document_file: file }))

      const fileName = file.name.replace(/\.[^/.]+$/, "")
      const lpoMatch = fileName.match(/(LPO[-_]?\d+)/i)
      let identifiedLPO = lpoMatch ? lpoMatch[1].toUpperCase() : ''

      try {
        const textExtractedLpo = await extractLpoNumberFromPdf(file)
        if (textExtractedLpo) identifiedLPO = textExtractedLpo
        const extractedDates = await extractDatesFromPdf(file)
        
        setLpoUploadData(prev => {
          const updated = { ...prev }
          if (identifiedLPO) updated.lpo_number = identifiedLPO
          if (extractedDates.documentDate) updated.document_date = extractedDates.documentDate
          if (extractedDates.expectedDeliveryDate) updated.expected_delivery_date = extractedDates.expectedDeliveryDate
          return updated
        })
        if (identifiedLPO || extractedDates.documentDate) {
          showSuccess("Document Analyzed", "LPO number and dates automatically extracted from PDF!")
        }
      } catch (err) {
        console.error("PDF metadata extraction failed:", err)
      }
    }
  }

  const handleLpoUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id || !id) return

    if (!lpoUploadData.lpo_number || !lpoUploadData.document_date || !lpoUploadData.document_file) {
      showError('Required Fields Missing', 'Please fill in all required fields and select a PDF document')
      return
    }

    setIsUploadingLpo(true)
    try {
      const dupRes = await checkDuplicateLPO(hospitalId, lpoUploadData.lpo_number, id)
      if (dupRes.data?.isDuplicate) {
        throw new Error(`Duplicate LPO: This number is already linked to ${dupRes.data.existingPoNumber}`)
      }

      const { error } = await uploadLPO(
        hospitalId,
        id,
        user.id,
        lpoUploadData
      )
      if (error) throw new Error(error)

      showSuccess('LPO Updated', `LPO ${lpoUploadData.lpo_number} successfully linked to this PO`)
      setIsUploadLpoModalOpen(false)
      setLpoUploadData({ lpo_number: '', document_date: new Date().toISOString().split('T')[0] })
      loadOrder()
      if (onMutate) onMutate()
    } catch (err) {
      showError('Upload Failed', err instanceof Error ? err.message : String(err))
    } finally {
      setIsUploadingLpo(false)
    }
  }

  // Load hospital users
  useEffect(() => {
    if (!hospitalId) return
    const fetchUsers = async () => {
      try {
        const { data: rawUsers } = await supabase
          .from('users')
          .select('id, full_name, jawatan')
          .eq('hospital_id', hospitalId)
          .order('full_name', { ascending: true })
        if (rawUsers) {
          setHospitalUsers(rawUsers)
        }
      } catch (err) {
        console.error('Error loading users:', err)
      }
    }
    void fetchUsers()
  }, [hospitalId])

  // Load signature settings
  useEffect(() => {
    if (!hospitalId) return

    const loadSignatures = async () => {
      const result = await getPharmacyPOSignatures(hospitalId, order?.department)
      if (result.data) {
        setSignatures(result.data)
        setTempSignatures(result.data)
      }
    }

    void loadSignatures()
  }, [hospitalId, order?.department])

  const loadOrder = async () => {
    if (!id || !hospitalId) return
    setIsLoading(true)
    try {
      const result = await getPurchaseOrderById(id)
      if (result.error) {
        showError('Error', result.error)
        if (!isSlideOver) {
          navigate(ROUTES.PHARMACY_PO)
        } else if (onClose) {
          onClose()
        }
        return
      }

      if (result.data) {
        const poData = result.data
        setOrder(poData)
        
        // Resolve item details (names/codes) with fallback to stored values
        const resolvedItems = (poData.items || []).map((item) => {
          return {
            ...item,
            item_name: item.item_name || 'Unknown Item',
            item_code: item.item_code || item.item_id
          }
        })
        
        setItems(resolvedItems)

        // Enrich items with catalog data in the background (don't block UI)
        void (async () => {
          const enrichedItems = await Promise.all(
            resolvedItems.map(async (item) => {
              // Skip if no item_id or it is the string "null"
              if (!item.item_id || item.item_id === 'null') {
                return item
              }

              // Skip if we already have valid names and codes (manual items or already resolved)
              if (item.item_name !== 'Unknown Item' && !item.item_code?.match(/^[0-9a-f]{8}-/i)) {
                // However, still allow enrichment if it's just a fallback name
              }

              try {
                // 1. Try myInventory Catalogs (drugs / non_drugs)
                const isDrug = !item.item_type || item.item_type.toLowerCase().includes('drug')
                const table = isDrug ? 'drugs' : 'non_drugs'
                const nameCol = isDrug ? 'drug_name' : 'item_name'
                const codeCol = isDrug ? 'drug_code' : 'item_code'

                let stdData: any = null
                
                // A. Match by ID
                if (item.item_id && item.item_id !== 'null') {
                  const { data: stdById } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', item.item_id)
                    .maybeSingle()
                  if (stdById) stdData = stdById
                }

                // B. Match by Code (if ID didn't match or was legacy seed)
                if ((!stdData || !stdData.cc_contract_number) && item.item_code) {
                  const cleanCode = item.item_code.replace(/[^a-z0-9]/gi, '');
                  const { data: candidatesByCode } = await supabase
                    .from(table)
                    .select('*');
                  
                  if (candidatesByCode) {
                    const matchedByCode = candidatesByCode.find((c: any) => {
                      const cCode = (c[codeCol] || c.drug_code || c.item_code || '').replace(/[^a-z0-9]/gi, '');
                      return cCode && cleanCode && (cCode === cleanCode || cCode.includes(cleanCode) || cleanCode.includes(cCode));
                    });
                    if (matchedByCode && (matchedByCode.cc_contract_number || !stdData)) {
                      stdData = matchedByCode;
                    }
                  }

                  // If still not found, try drugs table directly if table wasn't drugs
                  if (!stdData && !isDrug) {
                    const { data: drugCandidates } = await supabase.from('drugs').select('*');
                    if (drugCandidates) {
                      const matchedDrug = drugCandidates.find((c: any) => {
                        const cCode = (c.drug_code || c.item_code || '').replace(/[^a-z0-9]/gi, '');
                        return cCode && cleanCode && (cCode === cleanCode || cCode.includes(cleanCode) || cleanCode.includes(cCode));
                      });
                      if (matchedDrug) stdData = matchedDrug;
                    }
                  }
                }

                // C. Match by Name (if code didn't yield a contract item)
                if ((!stdData || !stdData.cc_contract_number) && item.item_name && item.item_name !== 'Unknown Item') {
                  const normItemName = item.item_name.replace(/\+/g, 'dan').toLowerCase().trim();
                  const { data: candidatesByName } = await supabase
                    .from(table)
                    .select('*');
                  
                  if (candidatesByName) {
                    const matchedByName = candidatesByName.find((c: any) => {
                      const cName = (c[nameCol] || c.drug_name || c.item_name || '').replace(/\+/g, 'dan').toLowerCase().trim();
                      return cName === normItemName || cName.includes(normItemName) || normItemName.includes(cName);
                    });
                    if (matchedByName && (matchedByName.cc_contract_number || !stdData)) {
                      stdData = matchedByName;
                    }
                  }
                }
                
                let cNo = stdData ? (stdData.cc_contract_number || stdData.kkm_contract_number || stdData.contract_number) : null
                let lTime = stdData ? (stdData.delivery_period || null) : null // NOTE: do NOT fall back to lead_time_days here — that is the inventory reorder lead time (defaults to 7), not the contract delivery period
                let cEnd = stdData ? (stdData.cc_contract_end_date || stdData.contract_end_date || stdData.contract_expiry) : null
                let myPrice = stdData?.price ? Number(stdData.price) : null
                
                let rawPkg = stdData?.packaging_description || stdData?.unit_of_measure || null;
                if (!rawPkg || rawPkg === 'unit') {
                  if (stdData?.packaging_description && stdData.packaging_description !== 'unit') rawPkg = stdData.packaging_description;
                  else if (stdData?.unit_of_measure && stdData.unit_of_measure !== 'unit') rawPkg = stdData.unit_of_measure;
                }
                let myPkg = rawPkg;

                // Fallback: if cNo is present but lTime or cEnd is missing, look up contracts catalog by contract_number
                if (cNo && (!lTime || !cEnd)) {
                  try {
                    const cleanNo = cNo.trim();
                    const { data: contractByNo } = await supabase
                      .from('contracts')
                      .select('*')
                      .ilike('contract_number', `%${cleanNo}%`)
                      .limit(1)
                      .maybeSingle();

                    if (contractByNo) {
                      lTime = lTime || contractByNo.delivery_period || contractByNo.metadata?.['tempoh serahan'] || contractByNo.delivery_timeframe;
                      cEnd = cEnd || contractByNo.end_date || contractByNo.contract_end_date || contractByNo.contract_expiry;
                      if (!myPrice && contractByNo.unit_price) myPrice = Number(contractByNo.unit_price);
                    }
                  } catch (_cErr) {}
                }

                // Fallback: if contract number is missing on drug/non_drug record, search contracts catalog by supplier and item name keywords
                if (!cNo && item.item_name) {
                  try {
                    const cleanName = item.item_name.replace(/\+/g, 'dan').toLowerCase();
                    const words = cleanName.split(/\s+/).filter(w => w.length > 2);
                    const suppName = poData?.manual_supplier_name || poData?.supplier?.company_name;

                    let query = supabase.from('contracts').select('*');
                    if (poData?.supplier_id) {
                      query = query.eq('supplier_id', poData.supplier_id);
                    } else if (suppName) {
                      const firstWord = suppName.split(' ')[0];
                      query = query.ilike('supplier_name', `%${firstWord}%`);
                    }

                    const { data: candidateContracts } = await query;
                    let matchedContract: any = null;
                    if (candidateContracts && candidateContracts.length > 0) {
                      matchedContract = candidateContracts.find((c: any) => {
                        const cName = (c.contract_name || '').toLowerCase();
                        return words.every(w => cName.includes(w));
                      }) || candidateContracts.find((c: any) => {
                        const cName = (c.contract_name || '').toLowerCase();
                        const mainWords = words.filter(w => w !== 'dan' && w !== 'injection' && w !== 'tablet');
                        return mainWords.length > 0 && mainWords.every(w => cName.includes(w));
                      });
                    }

                    if (!matchedContract) {
                      const { data: nameContracts } = await supabase
                        .from('contracts')
                        .select('*')
                        .ilike('contract_name', `%${words[0] || ''}%`);
                      if (nameContracts) {
                        matchedContract = nameContracts.find((c: any) => {
                          const cName = (c.contract_name || '').toLowerCase();
                          const mainWords = words.filter(w => w !== 'dan' && w !== 'injection' && w !== 'tablet');
                          return mainWords.length > 0 && mainWords.every(w => cName.includes(w));
                        });
                      }
                    }

                    if (matchedContract) {
                      cNo = matchedContract.contract_number;
                      lTime = lTime || matchedContract.delivery_period || matchedContract.lead_time_days || matchedContract.delivery_timeframe;
                      cEnd = cEnd || matchedContract.end_date || matchedContract.contract_end_date || matchedContract.contract_expiry;
                      if (!myPrice && matchedContract.unit_price) myPrice = Number(matchedContract.unit_price);
                    }
                  } catch (cErr) {
                    // Ignore lookup error
                  }
                }

                if (stdData || cNo) {
                  return {
                    ...item,
                    item_name: stdData ? (stdData[nameCol] || stdData.drug_name || stdData.item_name || item.item_name) : item.item_name,
                    item_code: stdData ? (stdData[codeCol] || stdData.drug_code || stdData.item_code || item.item_code) : item.item_code,
                    // unit_price intentionally NOT overwritten — preserve the stored purchase price
                    packaging_description: (myPkg && myPkg !== 'unit') ? myPkg : (item.packaging_description && item.packaging_description !== 'unit' ? item.packaging_description : (myPkg || item.packaging_description)),
                    contract_number: cNo || (item as any).contract_number,
                    delivery_period: lTime ? (typeof lTime === 'number' ? `${lTime} hari` : lTime) : (item as any).delivery_period,
                    lead_time_days: lTime || (item as any).lead_time_days,
                    contract_end_date: cEnd || (item as any).contract_end_date,
                    cc_contract_status: stdData?.cc_contract_status || stdData?.contract_status || (item as any).cc_contract_status || (item as any).contract_status
                  }

                }

                // 2. Try APPL Catalogs
                const applTable = item.item_type === 'drug' ? 'appl_drugs' : 'appl_non_drugs'
                const { data: applData } = await supabase
                  .from(applTable)
                  .select('*')
                  .eq('id', item.item_id)
                  .maybeSingle()

                if (applData) {
                  const cNo = (applData as any).cc_contract_number || (applData as any).kkm_contract_number || (applData as any).contract_number
                  const lTime = (applData as any).delivery_period || (applData as any).lead_time_days
                  const cEnd = (applData as any).cc_contract_end_date || (applData as any).contract_end_date
                  return {
                    ...item,
                    item_name: applData.item_name || item.item_name,
                    item_code: applData.item_code || item.item_code,
                    contract_number: cNo || (item as any).contract_number,
                    delivery_period: lTime ? (typeof lTime === 'number' ? `${lTime} hari` : lTime) : (item as any).delivery_period,
                    lead_time_days: lTime || (item as any).lead_time_days,
                    contract_end_date: cEnd || (item as any).contract_end_date
                  }
                }

                // 3. Try LP Catalogs
                const lpTable = item.item_type === 'drug' ? 'lp_drugs' : 'lp_non_drugs'
                const { data: lpData } = await supabase
                  .from(lpTable)
                  .select('*')
                  .eq('id', item.item_id)
                  .maybeSingle()

                if (lpData) {
                  const cNo = (lpData as any).cc_contract_number || (lpData as any).kkm_contract_number || (lpData as any).contract_number
                  const lTime = (lpData as any).delivery_period || (lpData as any).lead_time_days
                  const cEnd = (lpData as any).cc_contract_end_date || (lpData as any).contract_end_date
                  return {
                    ...item,
                    item_name: lpData.item_name || item.item_name,
                    item_code: lpData.item_code || item.item_code,
                    contract_number: cNo || (item as any).contract_number,
                    delivery_period: lTime ? (typeof lTime === 'number' ? `${lTime} hari` : lTime) : (item as any).delivery_period,
                    lead_time_days: lTime || (item as any).lead_time_days,
                    contract_end_date: cEnd || (item as any).contract_end_date
                  }
                }

                // 4. Try Contracts Catalog
                const { data: contractData } = await supabase
                  .from('contracts')
                  .select('*')
                  .eq('id', item.item_id)
                  .maybeSingle()

                if (contractData) {
                  const cNo = contractData.contract_number || (item as any).contract_number
                  const lTime = contractData.delivery_period || contractData.delivery_timeframe || contractData.lead_time_days || (item as any).delivery_period
                  const cEnd = contractData.contract_end_date || contractData.contract_expiry || (item as any).contract_end_date
                  return {
                    ...item,
                    item_name: contractData.contract_name || item.item_name,
                    item_code: contractData.item_code || item.item_code,
                    contract_number: cNo,
                    delivery_period: lTime ? (typeof lTime === 'number' ? `${lTime} hari` : lTime) : (item as any).delivery_period,
                    lead_time_days: lTime || (item as any).lead_time_days,
                    contract_end_date: cEnd
                  }
                }

                if (item.item_name && item.item_name !== 'Unknown Item') {
                  const { data: contractByName } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('contract_name', item.item_name)
                    .limit(1)
                    .maybeSingle()
                  
                  if (contractByName) {
                    const cNo = contractByName.contract_number || (item as any).contract_number
                    const lTime = contractByName.delivery_period || contractByName.delivery_timeframe || contractByName.lead_time_days || (item as any).delivery_period
                    const cEnd = contractByName.contract_end_date || contractByName.contract_expiry || (item as any).contract_end_date
                    return {
                      ...item,
                      item_name: contractByName.contract_name || item.item_name,
                      item_code: contractByName.item_code || item.item_code,
                      contract_number: cNo,
                      delivery_period: lTime ? (typeof lTime === 'number' ? `${lTime} hari` : lTime) : (item as any).delivery_period,
                      lead_time_days: lTime || (item as any).lead_time_days,
                      contract_end_date: cEnd
                    }
                  }
                }
              } catch (err) {
                // Silently ignore 406 or other lookup errors during background enrichment
              }
              return item
            })
          )
          setItems(enrichedItems)
          
          // Self-healing: if order header contract number is missing, backfill from item contract number
          // BUT skip expired contracts — if the contract is expired, don't backfill it
          const orderRefDate = poData?.order_date || poData?.created_at;
          const firstActiveContractNo = enrichedItems.find(i => {
            const cNo = (i as any).contract_number;
            if (!cNo) return false;
            return !isContractExpired(i, orderRefDate);
          })?.contract_number;
          if (firstActiveContractNo) {
            setOrder(prev => (prev && (!prev.kkm_contract_number || prev.kkm_contract_number === '-')) ? { ...prev, kkm_contract_number: firstActiveContractNo } : prev);
            if (poData?.id && (!poData.kkm_contract_number || poData.kkm_contract_number === '-')) {
              void supabase
                .from('pharmacy_purchase_orders')
                .update({ kkm_contract_number: firstActiveContractNo })
                .eq('id', poData.id);
            }
          }

          // --- Self-Healing Logic ---
          // If we found new names or codes, save them back to the DB to fix legacy records permanently
          for (const enriched of enrichedItems) {
            const original = resolvedItems.find(o => o.id === enriched.id)
            if (original) {
              const nameChanged = enriched.item_name !== original.item_name && enriched.item_name !== 'Unknown Item';
              const codeChanged = enriched.item_code !== original.item_code && enriched.item_code && 
                                  enriched.item_code !== poData.kkm_contract_number && 
                                  enriched.item_code !== poData.supplier?.contract_number;
              if (nameChanged || codeChanged) {
                void supabase
                  .from('pharmacy_purchase_order_items')
                  .update({ 
                    item_name: enriched.item_name,
                    item_code: enriched.item_code 
                  })
                  .eq('id', enriched.id)
              }
            }
          }
        })()
        
        // Use pre-fetched logs from service if available
        if ((poData as any).activity_logs) {
          setLogs((poData as any).activity_logs)
        }
        
        // Define parallel tasks
        const tasks = []

        // Task 1: Load balance from budget engine
        if (poData.vote_code && poData.vote_activity) {
          const loadBalance = async () => {
            try {
              const budget = await getBudgetForPO(
                hospitalId,
                poData.vote_code as any,
                poData.vote_activity as any,
                (poData.department || 'all') as any,
                poData.category as any,
                poData.id, // Exclude current PO from expenses to get "Balance Before"
                poData.order_date // Use PO date for historical accuracy
              )
              
              setBalance(budget.balance)
            } catch (error) {
              console.error('Error loading balance:', error)
            }
          }
          tasks.push(loadBalance())
        }

        // Task 2: Fetch invited suppliers if it's an Invite Quotation
        if (poData.po_type === 'sq') {
          const loadInvited = async () => {
            try {
              // 1. Try sq_suppliers from current PO
              if (poData.sq_suppliers && poData.sq_suppliers.length > 0) {
                setInvitedSuppliers(poData.sq_suppliers)
                return
              }

              // 2. Fallback: Fetch sibling suppliers
              const { data: siblings, error: siblingError } = await supabase
                .from('pharmacy_purchase_orders')
                .select('manual_supplier_name, sq_suppliers, supplier:suppliers(company_name)')
                .eq('hospital_id', hospitalId)
                .eq('po_type', 'sq')
                .eq('order_date', poData.order_date)
                .eq('vote_code', poData.vote_code)
                .eq('vote_activity', poData.vote_activity)
                .eq('total_amount', poData.total_amount)

              if (!siblingError && siblings) {
                // Try to get sq_suppliers from any sibling if current one doesn't have it
                const firstWithSuppliers = siblings.find(s => s.sq_suppliers && s.sq_suppliers.length > 0)
                if (firstWithSuppliers?.sq_suppliers) {
                  setInvitedSuppliers(firstWithSuppliers.sq_suppliers)
                  return
                }

                // Or fallback to manual names
                const names = siblings
                  .map(s => s.manual_supplier_name || (s.supplier as any)?.company_name)
                  .filter(Boolean) as string[]
                setInvitedSuppliers(Array.from(new Set(names)))
              }
            } catch (err) {
              console.error('Error fetching invited suppliers:', err)
            }
          }
          tasks.push(loadInvited())
        }

        // Task 3: Fetch activity logs (only if not pre-fetched)
        if (!(poData as any).activity_logs) {
          const loadLogs = async () => {
            try {
              const { data: logData } = await supabase
                .from('approval_logs')
                .select('*, approver:users!approval_logs_approved_by_fkey1(full_name)')
                .eq('entity_type', 'purchase_order')
                .eq('entity_id', poData.id)
                .order('created_at', { ascending: false })
              
              if (logData) setLogs(logData)
            } catch (err) {
              console.error('Error loading logs:', err)
            }
          }
          tasks.push(loadLogs())
        }

        // Run all secondary tasks in parallel
        if (tasks.length > 0) {
          await Promise.all(tasks)
        }
      }
    } catch (error) {
      console.error('Error loading purchase order:', error)
      showError('Error', 'Failed to load purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrder()
  }, [id, hospitalId])


  // Action Handlers
  const handleApprove = async () => {
    if (!order || !user?.id) return
    setIsApproving(true)
    try {
      const res = await approvePurchaseOrder(order.id, user.id)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Approved', 'The purchase order has been approved.')
      void loadOrder()
      onMutate?.()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to approve PO')
    } finally {
      setIsApproving(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!order || !user?.id) return
    setIsCancelling(true)
    try {
      const res = await rejectPurchaseOrder(order.id, user.id, cancelReason)
      if (res.error) throw new Error(res.error)
      showSuccess('PO Cancelled', 'The purchase order has been cancelled.')
      setShowCancelDialog(false)
      void loadOrder()
      onMutate?.()
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to cancel PO')
    } finally {
      setIsCancelling(false)
    }
  }


  const handlePrint = async () => {
    if (!order) {
      showError('Error', 'Unable to print. Please try again.')
      return
    }

    setIsPrinting(true)
    
    try {
      console.error(`[PO-PRINT] Starting Vector PDF Generation for ${order.po_number}`);

      const result = await generatePurchaseOrderPdf({
        order,
        items,
        signatures: signatures || tempSignatures,
        balance,
        accountDocumentUrl: order.supplier?.account_document_url,
        mofCertificateUrl: order.supplier?.mof_certificate_url,
        bumiputeraCertificateUrl: order.supplier?.bumiputera_registration_certificate_url,
        invitedSuppliers
      })

      if (result.success && result.pdfUrl) {
        openPdfForPrint(result.pdfUrl)
        setTimeout(() => {
          if (result.pdfUrl) {
            cleanupPdfUrl(result.pdfUrl)
          }
        }, 60000)
        showSuccess('PDF Generated', 'Vector PDF generated successfully.')
      } else {
        showError('Print Error', result.error || 'Failed to generate PDF')
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      showError('Print Error', error?.message || 'Failed to generate PDF.')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleConfirmEdit = async () => {
    if (!order || !user?.id) return
    if (!editReason.trim()) {
      showError('Required', 'Please provide a reason for editing.')
      return
    }

    setIsSavingEditReason(true)
    try {
      // Record the edit reason in notes before navigating
      const currentNotes = order.notes || ''
      const timestamp = new Date().toISOString()
      const userName = user?.full_name || 'Officer'
      const newNotes = `[Edit Request] By: ${userName} | Reason: ${editReason} | Date: ${timestamp}\n${currentNotes}`.trim()
      
      // Update the PO with the reason and user
      const { error } = await supabase
        .from('pharmacy_purchase_orders')
        .update({ notes: newNotes })
        .eq('id', order.id)

      if (error) throw error

      // Also log the modification in approval_logs
      await supabase
        .from('approval_logs')
        .insert({
          entity_type: 'purchase_order',
          entity_id: order.id,
          action: 'modified',
          approved_by: user.id,
          notes: `Edit Requested: ${editReason}`,
          created_at: new Date().toISOString()
        })

      setShowEditDialog(false)
      onMutate?.()
      navigate(ROUTES.PHARMACY_PO_CREATE, {
        state: { mode: 'edit', poId: order.id, editReason: editReason },
      })
    } catch (err) {
      console.error('Error recording edit reason:', err)
      showError('Error', 'Failed to process edit request')
    } finally {
      setIsSavingEditReason(false)
    }
  }

  const handleEdit = () => {
    setEditReason('')
    setShowEditDialog(true)
  }

  const handleCancel = () => {
    setCancelReason('')
    setShowCancelDialog(false) // Reset first
    setTimeout(() => setShowCancelDialog(true), 10)
  }

  const handleSaveSignatures = async () => {
    if (!hospitalId) return
    setIsSavingSignatures(true)
    try {
      const result = await updatePharmacyPOSignatures(tempSignatures, hospitalId, user?.id, order?.department)
      if (result.error) throw new Error(result.error)
      setSignatures(tempSignatures)
      showSuccess('Settings Updated', 'Officer signatures have been updated.')
      setShowSettings(false)
    } catch (err) {
      showError('Error', 'Failed to update signature settings.')
    } finally {
      setIsSavingSignatures(false)
    }
  }


  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).toUpperCase()
  }

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'gray' | 'primary'; label: string }> = {
      draft: { color: 'gray', label: 'Draft' },
      pending_approval: { color: 'warning', label: 'Pending Approval' },
      approved: { color: 'success', label: 'Approved' },
      sent: { color: 'info', label: 'Sent' },
      partial_received: { color: 'warning', label: 'Partial Received' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' },
    }
    const statusInfo = statusMap[status] || { color: 'gray', label: status }
    return <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
  }

  // --- High-Fidelity Render Helpers ---

  const ITEMS_PER_PAGE_1 = 8
  const ITEMS_PER_PAGE_CONT = 20

  const splitItems = () => {
    if (items.length === 0) return [[]]
    
    const pages = []
    // Page 1
    pages.push(items.slice(0, ITEMS_PER_PAGE_1))
    
    // Continuation pages
    let remaining = items.slice(ITEMS_PER_PAGE_1)
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, ITEMS_PER_PAGE_CONT))
      remaining = remaining.slice(ITEMS_PER_PAGE_CONT)
    }
    
    console.log(`[PO-DEBUG] splitItems: total items=${items.length}, pages=${pages.length}, items per page=[${pages.map(p => p.length).join(', ')}]`)
    return pages
  }

  const itemPages = splitItems()
  console.log(`[PO-DEBUG] itemPages.length=${itemPages.length}, will render ${itemPages.length} item pages + 1 final page = ${itemPages.length + 1} total page-shadow elements`)


  const renderWatermark = () => (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] overflow-hidden">
      <img
        src="/512px-Jata_MalaysiaV2.svg.png"
        alt="Watermark"
        className="w-[480px] h-[480px] object-contain"
      />
    </div>
  )

  const renderPage1Content = (pageItems: typeof items, isLastPage: boolean, pageNum: number = 1) => (
    <div className="po-print-page bg-white border border-gray-800 flex flex-col relative" data-page-num={pageNum} style={{ fontFamily: "'Times New Roman', serif", minHeight: '268mm' }}>
      {renderWatermark()}

      {/* Government Document Header */}
      <div className="border-b border-gray-800 bg-white py-2 px-6">
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex-shrink-0">
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              className="w-[80px] h-[80px] object-contain"
            />
          </div>

          <div className="w-1 h-16 bg-gray-800 flex-shrink-0"></div>

          <div className="flex-1 text-center flex flex-col justify-center py-0.5">
            <h1 className="text-[16pt] font-bold text-gray-900 uppercase m-0 p-0 leading-tight tracking-tight">
              KEMENTERIAN KESIHATAN
            </h1>
            <h2 className="text-[14pt] font-bold text-gray-800 uppercase m-0 p-0 leading-tight tracking-tight">
              MINISTRY OF HEALTH
            </h2>
            <h2 className="text-[14pt] font-bold text-gray-800 uppercase m-0 p-0 leading-tight tracking-tight">
              MALAYSIA
            </h2>
            <p className="text-[11pt] font-bold text-gray-700 m-0 p-0 leading-normal mt-1">
              Hospital Daerah Lawas
            </p>
          </div>

          <div className="w-1 h-16 bg-gray-800 flex-shrink-0"></div>
        </div>
        <div className="text-center border-t-2 border-gray-800 pt-1 pb-1">
          <h3 className="text-[13.5pt] font-bold text-gray-900 uppercase tracking-wide">
            {order?.po_type === 'sq' ? 'Pelawaan Sebut Harga' : 'Borang Permohonan Untuk Pengeluaran Pesanan Kerajaan'}
          </h3>
          <p className="text-[11pt] font-semibold text-gray-700 mt-0.5 italic">
            {order?.po_type === 'sq' ? 'Invite Quotation' : 'Application Form for Government Purchase Order'}
          </p>
        </div>
      </div>

      {/* Document Information Section */}
      <div className="px-8 py-1 border-b-2 border-gray-800">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr>
              <td className="w-1/2 align-top pr-4">
                <div className="space-y-0.5">
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">No. Pesanan / PO Number</label>
                    <p className="text-[10.5pt] font-bold text-gray-900">
                      {order?.po_type === 'sq' ? '-' : order?.po_number}
                    </p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">Kod Undi / Vote Code</label>
                    <p className="text-[10.5pt] font-bold text-gray-900">{order?.vote_code === 'other' ? order.manual_vote_code : (order?.vote_code || '-')}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">Aktiviti Undi / Vote Activity</label>
                    <p className="text-[10.5pt] font-bold text-gray-900">{order?.vote_activity === 'other' ? order.manual_vote_activity : (order?.vote_activity || '-')}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">
                      {order?.po_type === 'sq' ? 'INV SQ No.' : 'No. Kontrak / Contract No.'}
                    </label>
                    <p className="text-[10.5pt] font-bold text-gray-900">
                      {order?.po_type === 'sq'
                        ? (order?.inv_sq_number || '-')
                        : (order?.vote_code === '990102' || order?.po_type === 'manual'
                          ? '-'
                          : (() => {
                              const refD = order?.order_date || order?.created_at;
                              const purchasedUnderSQ = !!(order?.inv_sq_number && order?.po_type !== 'sq');
                              const anyItemExpired = items && items.length > 0 && items.some((it: any) => isContractExpired(it, refD));
                              return (purchasedUnderSQ || anyItemExpired) ? '-' : (order?.kkm_contract_number || order?.supplier?.contract_number || '-');
                            })()
                        )}
                    </p>
                  </div>
                  {order?.inv_sq_number && order?.po_type !== 'sq' && (
                    <div className="border-b border-gray-300 pb-0.5">
                      <label className="text-[8pt] font-bold text-gray-600 uppercase block">Inv / SQ Number</label>
                      <p className="text-[10.5pt] font-bold text-gray-900">{order.inv_sq_number}</p>
                    </div>
                  )}
                  {order?.program_name && (
                    <div className="border-b border-gray-300 pb-0.5">
                      <label className="text-[8.5pt] font-bold text-gray-600 uppercase block">Program</label>
                      <p className="text-[11.5pt] font-bold text-gray-900 uppercase">{order.program_name}</p>
                    </div>
                  )}
                </div>
              </td>
              <td className="w-1/2 align-top pl-4">
                <div className="space-y-0.5">
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">Jabatan / Department</label>
                    <p className="text-[10.5pt] font-bold text-gray-900 uppercase">{order?.department === 'other' ? order.manual_department : (order?.department || '-')}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">Tarikh Pesanan / Order Date</label>
                    <p className="text-[10.5pt] font-bold text-gray-900">{order?.order_date ? formatDate(order.order_date) : '-'}</p>
                  </div>
                  <div className="border-b border-gray-300 pb-0.5">
                    <label className="text-[8pt] font-bold text-gray-600 uppercase block">Kategori / Category</label>
                    <p className="text-[10.5pt] font-bold text-gray-900 uppercase">{order?.category === 'other' ? order.manual_category : (order?.category?.replace('_', ' ') || '-')}</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Supplier Section */}
      <div className="px-8 py-1 border-b-2 border-gray-800">
        <h4 className="text-[9pt] font-bold text-gray-900 uppercase mb-1.5">Maklumat Pembekal / Supplier Information</h4>
        <div className="grid grid-cols-1 gap-2">
          {order?.po_type === 'sq' ? (
            <div className="border border-gray-500 p-3 bg-white">
              <label className="text-[8pt] font-bold text-gray-600 uppercase block mb-1.5 border-b border-gray-100 pb-1">Senarai Pembekal Yang Dipelawa / List of Invited Suppliers</label>
              {invitedSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {invitedSuppliers.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center text-[9pt] font-black bg-gray-800 text-white rounded-sm">{idx + 1}</span>
                      <p className="text-[11.5pt] font-bold text-gray-900 uppercase leading-none">{name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 py-2">
                  <Spinner size="sm" />
                  <p className="text-[10pt] font-bold uppercase italic">Fetching invited suppliers...</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="border border-gray-500 p-2 bg-white">
                <label className="text-[8pt] font-bold text-gray-600 uppercase block mb-0.5">Nama Syarikat / Company Name</label>
                <p className="text-[12pt] font-bold text-gray-900 uppercase">{order?.manual_supplier_name || order?.supplier?.company_name || '-'}</p>
              </div>
              <div className="border border-gray-500 p-2 bg-white min-h-[60px]">
                <label className="text-[8pt] font-bold text-gray-600 uppercase block mb-0.5">Alamat / Address</label>
                <p className="text-[10pt] text-gray-900 whitespace-pre-line leading-tight">{order?.manual_supplier_address || order?.supplier?.address || '-'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="px-4 py-1.5 flex-1 overflow-hidden">
        <h4 className="text-[11pt] font-bold text-gray-900 uppercase mb-1.5">Butir-butir Barang / Items Purchased {!isLastPage && '(Sambungan)'}</h4>
        <table className="w-full border-collapse border-2 border-gray-800">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[4%]">Bil</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[37%]">Nama Item / Item Name</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[12%]">Kod Item / Item Code</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[9%]">Kuantiti / Quantity</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[11%]">Harga Unit / Unit Price</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[16%]">Pembungkusan / Packaging</th>
              <th className="border border-gray-800 px-2 py-1.5 text-[9pt] font-bold uppercase text-center w-[11%]">Jumlah / Total</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, index) => {
              const contractNo = (item as any).contract_number || order?.kkm_contract_number || order?.supplier?.contract_number;
              const rawDeliveryPeriod = (item as any).delivery_period || order?.supplier?.delivery_period;
              const deliveryPeriod = rawDeliveryPeriod ? String(rawDeliveryPeriod).trim() : 'Tempoh serahan adalah tidak melebihi 30 hari daripada tarikh pesanan untuk 1 bulan pertama tempoh kontrak. Selepas 1 bulan pertama tempoh kontrak dan seterusnya, tempoh serahan adalah tidak melebihi 21 hari daripada tarikh pesanan. Pengiraan tempoh pesanan bermula sehari selepas tarikh pesanan rasmi dikeluarkan.';
              const contractEndDate = (item as any).contract_end_date || order?.supplier?.contract_end_date;
              const refD = order?.order_date || order?.created_at;
              const purchasedUnderSQ = !!(order?.inv_sq_number && order?.po_type !== 'sq');
              const contractIsExpired = purchasedUnderSQ || isContractExpired(item, refD);
              return (
                <tr key={item.id} className="align-top">
                  <td className="border border-gray-800 px-1 py-1 text-center font-bold text-[9pt]">{index + 1}</td>
                  <td className="border border-gray-800 px-2 py-1">
                    <div className="font-bold text-[9.5pt] mb-0.5">{item.item_name}</div>
                    {order?.vote_code !== '990102' && order?.po_type !== 'manual' && order?.po_type !== 'sq' && contractNo && !contractIsExpired && (
                      <div className="space-y-0 text-[7.5pt] leading-tight text-gray-700 italic">
                        <p><span className="font-bold not-italic">No. Kontrak:</span> {contractNo}</p>
                        <p><span className="font-bold not-italic">Tempoh Serahan:</span> {deliveryPeriod}</p>
                        <p><span className="font-bold not-italic">Tamat Kontrak:</span> {contractEndDate ? formatDate(contractEndDate) : '-'}</p>
                      </div>
                    )}
                  </td>
                <td className="border border-gray-800 px-2 py-1 text-center text-[8.5pt] font-medium">
                  {(!item.item_code || item.item_code === contractNo || item.item_code === order?.kkm_contract_number || item.item_code === order?.supplier?.contract_number) ? '-' : item.item_code}
                </td>
                <td className="border border-gray-800 px-2 py-1 text-center font-bold text-[9.5pt]">{item.quantity_ordered}</td>
                <td className="border border-gray-800 px-2 py-1 text-right font-medium text-[9pt]">{formatCurrency(item.unit_price)}</td>
                <td className="border border-gray-800 px-2 py-1 text-center text-[8.5pt]">{item.packaging_description}</td>
                <td className="border border-gray-800 px-2 py-1 text-right font-bold text-[9.5pt]">{formatCurrency(item.quantity_ordered * item.unit_price)}</td>
                </tr>
              );
            })}
            {isLastPage && (
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
                <td colSpan={6} className="border border-gray-800 px-2 py-1 text-[9.5pt] uppercase text-right">
                  JUMLAH KESELURUHAN / TOTAL AMOUNT:
                </td>
                <td className="border border-gray-800 px-2 py-1 text-[10.5pt] text-right">
                  {formatCurrency(items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0))}
                </td>
              </tr>
            )}
            {!isLastPage && (
              <tr>
                <td colSpan={7} className="border border-gray-800 px-4 py-2 text-[10pt] italic text-center bg-gray-50 font-bold">
                  *** Bersambung ke halaman sebelah / Continued on next page ***
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Area - Anchored to bottom */}
      <div className="mt-auto">
        {/* Financial Summary and Signature - Only on last page */}
        {isLastPage && (
          <div className="px-6 py-2 bg-white border-t border-gray-800 w-full mb-0 break-inside-avoid">
            <div className="flex gap-6 items-end">
              <div className="w-[55%] flex flex-col justify-end items-center pb-2">
                <div className="text-center w-full">
                  <div className="border-b-2 border-gray-800 w-[80%] mx-auto mb-2"></div>
                  <p className="text-[11pt] font-bold text-gray-900 mb-1 leading-tight">(Tandatangan)</p>
                  <p className="text-[10pt] font-bold text-gray-800 mb-1 leading-tight">Pegawai Yang Mengesahkan Peruntukan</p>
                  <p className="text-[10pt] font-bold text-gray-800 leading-tight">Pengarah Hospital Lawas</p>
                </div>
              </div>
              <div className="w-[45%] flex flex-col justify-end">
                <table className="w-full border-collapse border border-gray-800 bg-white" style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">BAKI SEBELUM /<br />BALANCE BEFORE:</td>
                      <td className="px-2 py-1.5 text-[10.5pt] font-bold text-right">
                        {balance !== null ? `RM ${balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 bg-gray-50">
                      <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">JUMLAH /<br />TOTAL AMOUNT:</td>
                      <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">
                        {formatCurrency(items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">BAKI SELEPAS /<br />BALANCE AFTER:</td>
                      <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">
                        {balance !== null ? `RM ${(balance - items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Official Footer */}
        <div className="px-8 py-1 w-full text-center border-t border-gray-800">
          <p className="text-[8pt] font-bold text-gray-800 uppercase tracking-tight">
            Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
          </p>
          <p className="text-[7pt] text-gray-600 italic mt-0.5">
            Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
          </p>
        </div>
      </div>
    </div>
  )

  const renderContinuationPage = (pageItems: typeof items, pageNum: number, isLastPage: boolean) => (
    <div className="po-print-page bg-white border border-gray-800 flex flex-col relative" data-page-num={pageNum} style={{ fontFamily: "'Times New Roman', serif", minHeight: '268mm' }}>
      {renderWatermark()}
      {/* Header Section */}
      <div className="border-b border-gray-800 border bg-white pt-1 pb-1 px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img
            src="/512px-Jata_MalaysiaV2.svg.png"
            alt="Jata Negara"
            className="w-[40px] h-[40px] object-contain"
          />
          <h1 className="text-[12pt] font-bold text-gray-900 uppercase">KEMENTERIAN KESIHATAN MALAYSIA</h1>
        </div>
        <div className="text-right">
          <p className="text-[10pt] font-bold">No. Pesanan: {order?.po_number}</p>
          <p className="text-[9pt] font-bold italic text-gray-600">Halaman {pageNum} (Sambungan)</p>
        </div>
      </div>

      {/* Items Table Section */}
      <div className="px-6 py-2">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[4%]">BIL</th>
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[38%]">NAMA ITEM / ITEM NAME</th>
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[12%]">KOD ITEM / ITEM CODE</th>
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[8%]">KUANTITI / QUANTITY</th>
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[12%]">HARGA UNIT / UNIT PRICE</th>
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[13%]">JUMLAH / TOTAL</th>
              <th className="border border-gray-800 px-1 py-1 text-[8pt] font-bold uppercase text-center w-[13%]">PEMBUNGKUSAN / PACKAGING</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, index) => {
              // Calculate global index
              const globalIdx = ITEMS_PER_PAGE_1 + (pageNum - 2) * ITEMS_PER_PAGE_CONT + index;
              return (
                <tr key={item.id} className="align-top">
                  <td className="border border-gray-800 px-1 py-1 text-center font-bold text-[9pt]">{globalIdx + 1}</td>
                  <td className="border border-gray-800 px-2 py-1">
                    <div className="font-bold text-[9.5pt] mb-1">{item.item_name}</div>
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-center text-[8.5pt] font-medium">
                    {(!item.item_code || 
                      item.item_code === (item as any).contract_number || 
                      item.item_code === order?.kkm_contract_number || 
                      item.item_code === order?.supplier?.contract_number) ? '-' : item.item_code}
                  </td>
                  <td className="border border-gray-800 px-2 py-1 text-center font-bold text-[9.5pt]">{item.quantity_ordered}</td>
                  <td className="border border-gray-800 px-2 py-1 text-right font-medium text-[9pt]">{formatCurrency(item.unit_price)}</td>
                  <td className="border border-gray-800 px-2 py-1 text-right font-bold text-[9.5pt]">{formatCurrency(item.quantity_ordered * item.unit_price)}</td>
                  <td className="border border-gray-800 px-2 py-1 text-center text-[8.5pt]">{item.packaging_description}</td>
                </tr>
              )
            })}
            {isLastPage && (
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-800">
                <td colSpan={5} className="border border-gray-800 px-2 py-2 text-[10pt] uppercase text-right">
                  JUMLAH KESELURUHAN / TOTAL AMOUNT:
                </td>
                <td className="border border-gray-800 px-2 py-2 text-[11pt] text-right">
                  {formatCurrency(items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0))}
                </td>
                <td className="border border-gray-800"></td>
              </tr>
            )}
            {!isLastPage && (
              <tr>
                <td colSpan={7} className="border border-gray-800 px-4 py-2 text-[10pt] italic text-center bg-gray-50 font-bold">
                  *** Bersambung ke halaman sebelah / Continued on next page ***
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Area - Anchored to bottom */}
      <div className="mt-auto">
        {/* Financial Summary and Signature - Positioned at bottom of LAST Page of items */}
        {isLastPage && (
          <div className="px-8 py-2 bg-white border-t-2 border-gray-800 w-full mb-1 break-inside-avoid">
            <div className="flex gap-6 items-end">
              <div className="w-[55%] flex flex-col justify-end items-center pb-2">
                <div className="text-center w-full">
                  <div className="border-b-2 border-gray-800 w-[80%] mx-auto mb-2"></div>
                  <p className="text-[11pt] font-bold text-gray-900 mb-1 leading-tight">(Tandatangan)</p>
                  <p className="text-[10pt] font-bold text-gray-800 mb-1 leading-tight">Pegawai Yang Mengesahkan Peruntukan</p>
                  <p className="text-[10pt] font-bold text-gray-800 leading-tight">Pengarah Hospital Lawas</p>
                </div>
              </div>
              <div className="w-[45%] flex flex-col justify-end">
                <table className="w-full border-collapse border-2 border-gray-800 bg-white" style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">BAKI SEBELUM /<br />BALANCE BEFORE:</td>
                      <td className="px-2 py-1.5 text-[10.5pt] font-bold text-right">
                        {balance !== null ? `RM ${balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '-'}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 bg-gray-50">
                      <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">JUMLAH /<br />TOTAL AMOUNT:</td>
                      <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">
                        {formatCurrency(items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 text-[9pt] font-bold uppercase border-r border-gray-800 leading-tight">BAKI SELEPAS /<br />BALANCE AFTER:</td>
                      <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">
                        {balance !== null ? `RM ${(balance - items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Official Footer */}
        <div className="px-8 py-1 w-full text-center border-t border-gray-800">
          <p className="text-[8pt] font-bold text-gray-800 uppercase tracking-tight">
            Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
          </p>
          <p className="text-[7pt] text-gray-600 italic mt-0.5">
            Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
          </p>
        </div>
      </div>
    </div>
  )

  const renderPage2Content = (pageNum: number) => (
    <div className="po-print-page bg-white border-2 border-gray-800 flex flex-col relative" data-page-num={pageNum} style={{ fontFamily: "'Times New Roman', serif" }}>
      {renderWatermark()}
      {/* Section 3: Supplier Details */}
      <div className="px-8 pt-8 pb-4 border-b-2 border-gray-800">
        <h4 className="text-[11pt] font-bold text-gray-900 uppercase mb-4 text-center underline">MAKLUMAT PEMBEKAL (SAMBUNGAN)</h4>
        <div className="flex justify-center">
          <table className="w-full max-w-2xl border-collapse border-2 border-gray-800">
            <tbody>
              <tr>
                <td className="border border-gray-800 px-4 py-3 font-bold bg-gray-100 text-[10pt] w-[30%]">Nama Pembekal :</td>
                <td className="border border-gray-800 px-4 py-3 font-bold text-[11pt] uppercase">
                  {order?.po_type === 'sq' ? (
                    <div className="space-y-1">
                      {invitedSuppliers.map((s, i) => (
                        <div key={i} className="flex gap-2">
                          <span>{i + 1}.</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {order?.manual_supplier_name || order?.supplier?.company_name}
                      <br />
                      <span className="font-normal text-[9pt] normal-case">{order?.manual_supplier_address || order?.supplier?.address}</span>
                    </>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 px-4 py-3 font-bold bg-gray-100 text-[10pt]">No. Telefon :</td>
                <td className="border border-gray-800 px-4 py-3 font-bold text-[11pt]">{order?.supplier?.phone || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Federal Treasury Registration */}
      <div className="px-8 py-4 border-b-2 border-gray-800">
        <p className="text-[11pt] mb-3">Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
        <div className="border-b border-black w-full h-4 mb-4"></div>
        <p className="text-[11pt] mb-3">No. Rujukan Pendaftaran :</p>
        <div className="border-b border-black w-full h-4"></div>
      </div>

      {/* Section 4: Purchase Order Details */}
      <div className="px-8 py-4 border-b-2 border-gray-800">
        <p className="text-[11pt] font-bold text-gray-900 mb-4">Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
        <div className="ml-6 space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-[11pt] w-8">(i)</span>
            <div className="flex-1 text-[11pt]">
              No. rujukan surat mampu : <span className="border-b border-dotted border-black px-12 ml-2"></span>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11pt] w-8">(ii)</span>
            <div className="flex-1 text-[11pt]">
              No. rujukan kontrak : <span className="font-bold underline decoration-dotted underline-offset-4 ml-2">{order?.kkm_contract_number || '...................................................'}</span>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11pt] w-8">(iii)</span>
            <div className="flex-1 text-[11pt]">
              Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.: <span className="border-b border-dotted border-black px-20 ml-2"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 Signature */}
      <div className="px-8 py-4 border-b-2 border-gray-800">
        <div className="flex justify-between items-end">
          <div className="pb-2">
            <p className="text-[11pt] font-bold">Tarikh : <span className="font-serif ml-2 underline decoration-dotted">{order?.order_date ? formatDate(order.order_date) : '-'}</span></p>
          </div>
          <div className="text-center">
            <div className="w-64 border-b border-dotted border-black mb-2 mx-auto"></div>
            <p className="text-[10pt] font-bold mb-1">(Tandatangan Pegawai yang Memohon)</p>
            <div className="text-left space-y-0.5">
              <p className="text-[10pt] font-bold">Nama : {signatures.applicantName}</p>
              <p className="text-[10pt] font-bold">Jawatan : {signatures.applicantPosition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Approval */}
      <div className="px-8 py-4 border-b-2 border-gray-800">
        <h4 className="text-[11pt] font-bold mb-2 uppercase">5. Akaun Ketua Bahagian.</h4>
        <div className="ml-6 space-y-1 mb-4">
          <div className="flex gap-4">
            <span className="text-[11pt]">(i)</span>
            <p className="text-[11pt]">Adalah disahkan pembelian ini telah dimasukkan dalam cadangan anggaran Belanjawan tahunan.</p>
          </div>
          <div className="flex gap-4">
            <span className="text-[11pt]">(ii)</span>
            <p className="text-[11pt]">Pembelian ini adalah diperlukan.</p>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <div className="pb-2">
            <p className="text-[11pt] font-bold">Tarikh : <span className="font-serif ml-2 underline decoration-dotted">{order?.order_date ? formatDate(order.order_date) : '-'}</span></p>
          </div>
          <div className="text-center">
            <div className="w-72 border-b border-dotted border-black mb-2 mx-auto"></div>
            <p className="text-[10pt] font-bold mb-1">(Tandatangan Ketua Bahagian)</p>
            <p className="text-[10pt] font-bold uppercase">{signatures.headName}</p>
            <p className="text-[10pt] font-bold uppercase">{signatures.headPosition}</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-[11pt] font-bold uppercase">Permohonan diluluskan/tidak diluluskan</p>
        </div>

        <div className="flex justify-between items-end">
          <div className="pb-2">
            <p className="text-[11pt] font-bold">Tarikh : <span className="border-b border-dotted border-black px-24 ml-2"></span></p>
          </div>
          <div className="text-center">
            <div className="w-72 border-b border-dotted border-black mb-2 mx-auto"></div>
            <p className="text-[10pt] font-bold mb-1">(Tandatangan Pegawai Yang Meluluskan)</p>
            <p className="text-[10pt] font-bold">Pengarah Hospital Daerah, Lawas.</p>
          </div>
        </div>
      </div>

      {/* Section 6: Financial Department Use */}
      <div className="px-8 py-2">
        <h4 className="text-[11pt] font-bold mb-2 text-center uppercase">UNTUK KEGUNAAN BAHAGIAN KEWANGAN</h4>
        
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1">
            <h5 className="text-[11pt] font-bold">6. Kerani Kewangan</h5>
            <div className="ml-6 space-y-1">
              <p className="text-[10pt]">(iii) Sila Keluarkan Pesanan Kerajaan</p>
              <p className="text-[10pt]">(iv) Sila dapatkan Sebut harga.</p>
            </div>
          </div>
          
          <div className="text-center shrink-0 pt-4">
            <div className="w-72 border-b border-dotted border-black mb-2 mx-auto"></div>
            <p className="text-[10pt] font-bold mb-1">(Bahagian Kewangan)</p>
            <p className="text-[10pt] font-bold">B.P. Pengarah Hospital Daerah, Lawas.</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[11pt] font-bold whitespace-nowrap">Catatan :</span>
            <div className="flex-1 border-b border-dotted border-black h-4"></div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-[11pt] font-bold whitespace-nowrap">No. Rujukan Pesanan Kerajaan:</span>
            <div className="flex-1 border-b border-dotted border-black h-4"></div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11pt] font-bold whitespace-nowrap">Tarikh:</span>
            <div className="flex-1 border-b border-dotted border-black h-4 w-48"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-8 py-4 bg-slate-50 border-t-2 border-slate-900 w-full">
        <div className="text-center">
          <p className="text-[9pt] font-bold text-slate-800">
            Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
          </p>
          <p className="text-[9pt] text-slate-700 mt-0.5">
            Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
          </p>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Procurement Data...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-10 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-md mx-auto">
          <p className="text-slate-500 font-medium text-sm">Purchase order not found</p>
          <Button onClick={() => isSlideOver ? onClose?.() : navigate(ROUTES.PHARMACY_PO)} className="mt-4 rounded-lg font-semibold text-xs px-4">
            {isSlideOver ? 'Close Panel' : 'Back to List'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#f8fafc] flex flex-col",
      isSlideOver && "min-h-0 bg-transparent"
    )}>
      {/* Screen Preview Styles */}
      <style>{`
        .printable-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 1.5rem 0;
          background: transparent;
        }
        .page-shadow {
          width: 210mm;
          min-height: 297mm;
          padding: 2mm;
          background: white;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
          margin-bottom: 2.5rem;
          box-sizing: border-box;
          display: block;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.03);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .page-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .po-print-page {
          width: 100%;
          min-height: 287mm;
          display: flex;
          flex-direction: column;
          background: white;
          border: 1px solid #e2e8f0;
          box-sizing: border-box;
          position: relative;
        }
      `}</style>
      {/* Header Controls - Hidden during print */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50 no-print shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100/80 rounded-xl transition-all text-slate-500 hover:text-slate-900 active:scale-90"
          >
            <IconX className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="bg-gradient-to-r from-slate-905 to-slate-800 bg-clip-text">Purchase Order</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-200/40 flex items-center gap-1",
                order.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                order.status === 'pending_approval' || order.status === 'draft' ? "bg-amber-50 text-amber-700 border-amber-100" :
                order.status === 'cancelled' ? "bg-rose-50 text-rose-700 border-rose-100" :
                "bg-blue-50 text-blue-700 border-blue-100"
              )}>
                {order.status.replace('_', ' ')}
              </span>
            </h1>
            <span className="text-slate-200">|</span>
            <span className="text-sm text-slate-400 font-semibold tabular-nums">{order?.po_number}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order && order.status !== 'cancelled' && (
            <>
              {/* Approve Button */}
              {order.status === 'draft' && (
                <Button 
                  onClick={handleApprove} 
                  className="bg-slate-900 hover:bg-black text-white font-semibold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 no-print"
                  disabled={isApproving}
                >
                  {isApproving ? <Spinner size="sm" /> : <IconCheckCircle className="w-4 h-4" />}
                  Approve Order
                </Button>
              )}
              {/* Settings Button */}
              <button 
                onClick={() => setShowSettings(true)}
                className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 shadow-sm group no-print"
                title="Signature Configuration"
              >
                <IconSettings className="w-4.5 h-4.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              {/* Print Button */}
              {['approved', 'sent', 'partial_received', 'completed'].includes(order.status) && (
                <Button 
                  onClick={handlePrint} 
                  variant="outline" 
                  className="bg-white border-slate-200 text-slate-700 font-semibold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 shadow-sm transition-all active:scale-95 no-print" 
                  disabled={isPrinting}
                >
                  {isPrinting ? <Spinner size="sm" /> : <IconPrinter className="w-4 h-4 opacity-70" />}
                  Print
                </Button>
              )}

              {/* Upload / Change LPO Button */}
              {['approved', 'sent', 'partial_received', 'completed'].includes(order.status) && (
                <Button 
                  onClick={() => {
                    setLpoUploadData({
                      lpo_number: (order as any).lpo_number || '',
                      document_date: (order as any).document_date || new Date().toISOString().split('T')[0]
                    })
                    setIsUploadLpoModalOpen(true)
                  }} 
                  variant="outline" 
                  className="bg-blue-50 border-blue-200 text-blue-700 font-semibold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 hover:bg-blue-100 shadow-sm transition-all active:scale-95 no-print"
                >
                  <IconUpload className="w-4 h-4 opacity-80" /> Change / Upload LPO
                </Button>
              )}

              {/* Edit Button */}
              <Button 
                onClick={handleEdit} 
                variant="outline" 
                className="bg-white border-slate-200 text-slate-700 font-semibold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 shadow-sm transition-all active:scale-95 no-print"
              >
                <IconEdit className="w-4 h-4 opacity-70" /> Modify
              </Button>

              {/* Cancel Button */}
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                className="bg-white border-rose-100 text-rose-600 font-semibold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 hover:bg-rose-50 transition-all active:scale-95 no-print"
              >
                <IconX className="w-4 h-4" /> Revoke
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide bg-[#f8fafc]">
        {order?.status === 'cancelled' && order.notes && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-start gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm mb-6 max-w-[210mm] mx-auto">
            <div className="w-10 h-10 bg-white rounded-lg border border-rose-100 flex items-center justify-center shrink-0 shadow-sm">
              <IconAlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-rose-950 font-bold text-xs uppercase tracking-wide">Revocation Log</p>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              </div>
              <p className="text-rose-700 text-sm font-medium leading-relaxed mb-2">
                {order.notes.replace(/^(Cancelled|Rejected):\s*/i, '') || 'No reason provided'}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-100/50">
                <p className="text-rose-900/60 font-semibold text-[10px] uppercase tracking-wide">Cancelled By:</p>
                <p className="text-rose-700 text-xs font-semibold">{(order as any).cancelled_by_name || 'Pegawai Bertanggungjawab'}</p>
                {(order as any).cancelled_at && (
                  <span className="text-rose-400 text-xs font-normal ml-1">â€¢ {formatDateTime((order as any).cancelled_at)}</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Modification Log Section */}
        {latestMod && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-4 no-print animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm mb-6 max-w-[210mm] mx-auto">
            <div className="w-10 h-10 bg-white rounded-lg border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
              <IconFilePen className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-amber-950 font-bold text-xs uppercase tracking-wide">Modification History</p>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              </div>
              <p className="text-amber-800 text-sm font-medium leading-relaxed mb-3">
                {latestMod.notes?.replace(/^Edit Requested:\s*/i, '') || 'PO details were modified.'}
              </p>
              <div className="flex items-center gap-4 pt-2.5 border-t border-amber-100/50">
                <div className="flex items-center gap-1.5">
                  <p className="text-amber-900/60 font-semibold text-[10px] uppercase tracking-wide">Modified By:</p>
                  <p className="text-amber-800 text-xs font-semibold">{latestMod.approver?.full_name || 'Authorized Officer'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-amber-900/60 font-semibold text-[10px] uppercase tracking-wide">Date:</p>
                  <p className="text-amber-800 text-xs font-semibold">{formatDateTime(latestMod.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Document View - Used for both screen display and print capture */}
        <div 
          ref={printContentRef} 
          id={uniquePrintContainerId}
          className="printable-area"
        >

        {itemPages.map((pageItems, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === itemPages.length - 1;
          const pageNum = idx + 1;
          
          return (
            <div 
              key={`${order.id}-page-${pageNum}`} 
              id={`po-page-${order.po_number}-${pageNum}`} 
              className="page-shadow" 
              data-page-num={pageNum}
            >
              {isFirst 
                ? renderPage1Content(pageItems, isLast, pageNum) 
                : renderContinuationPage(pageItems, pageNum, isLast)
              }
            </div>
          )
        })}
        
        <div 
          key={`${order.id}-final-page`}
          id={`po-page-${order.po_number}-${itemPages.length + 1}`}
          className="page-shadow" 
          data-page-num={itemPages.length + 1}
        >
          {renderPage2Content(itemPages.length + 1)}
        </div>
      </div>

      {/* Activity History - Screen Only */}
      {logs.length > 0 && (
        <div className="max-w-[210mm] mx-auto w-full no-print mt-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                  <IconHistory className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Activity History</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Audit trail for this procurement record</p>
                </div>
              </div>
            </div>
            <div className="p-0">
              {displayLogs.map((log, idx) => (
                <div 
                  key={log.id} 
                  className={cn(
                    "p-5 flex items-start gap-4 transition-colors hover:bg-slate-50/30",
                    idx !== displayLogs.length - 1 && "border-b border-slate-100"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 mt-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      log.action === 'modified' ? "bg-amber-500" : 
                      log.action === 'approved' ? "bg-emerald-500" : "bg-slate-300"
                    )}></div>
                    {idx !== displayLogs.length - 1 && <div className="w-px h-full min-h-[36px] bg-slate-200"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold uppercase border",
                          log.action === 'modified' ? "bg-amber-50 border-amber-100 text-amber-600" : 
                          log.action === 'approved' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-500"
                        )}>
                          {log.action}
                        </span>
                        <p className="text-sm font-medium text-slate-800">{log.approver?.full_name || 'System User'}</p>
                      </div>
                      <time className="text-xs font-normal text-slate-400 tabular-nums">{formatDateTime(log.created_at)}</time>
                    </div>
                    {log.notes && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 mt-1">
                        <p className="text-xs font-normal text-slate-600 leading-relaxed italic">{log.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Action Dialogs */}
      <Modal
        isOpen={showEditDialog}
        onClose={() => !isSavingEditReason && setShowEditDialog(false)}
        title="Modify Purchase Order"
        size="md"
      >
        <div className="p-5 space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <IconAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              Modifying an active PO requires an audit trail entry. Please state the reason for this change.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-0.5">Modification Reason</label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g., Update item quantities based on revised budget..."
              className="w-full h-28 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-lg font-semibold text-xs px-4 h-9">Discard</Button>
            <Button 
              onClick={handleConfirmEdit} 
              disabled={!editReason.trim() || isSavingEditReason}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs px-5 h-9 shadow-sm transition-all active:scale-95"
            >
              {isSavingEditReason ? <Spinner size="sm" /> : 'Continue to Edit'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCancelDialog}
        onClose={() => !isCancelling && setShowCancelDialog(false)}
        title="Revoke Purchase Order"
        size="md"
      >
        <div className="p-5 space-y-5">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <IconAlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-rose-800 leading-relaxed">
              This action will permanently invalidate this PO. This cannot be undone.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-0.5">Reason for Revocation</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Duplicated order or supplier stock unavailability..."
              className="w-full h-28 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-100 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="rounded-lg font-semibold text-xs px-4 h-9">Discard</Button>
            <Button 
              onClick={handleConfirmCancel} 
              disabled={!cancelReason.trim() || isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs px-5 h-9 shadow-sm transition-all active:scale-95"
            >
              {isCancelling ? <Spinner size="sm" /> : 'Confirm Revocation'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Officer Signatures"
        size="md"
      >
        <div className="p-5 space-y-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2.5 py-0.5 rounded w-fit">Applying Officer</p>
              <div className="space-y-3 px-1">
                <Select
                  label="Name"
                  value={(tempSignatures.applicantName || '').toUpperCase()}
                  onChange={(e) => {
                    const chosen = hospitalUsers.find(u => u.full_name.toUpperCase() === e.target.value.toUpperCase())
                    if (chosen) {
                      setTempSignatures(prev => ({
                        ...prev,
                        applicantName: chosen.full_name.toUpperCase(),
                        applicantPosition: (chosen.jawatan || '').toUpperCase()
                      }))
                    } else {
                      setTempSignatures(prev => ({
                        ...prev,
                        applicantName: '',
                        applicantPosition: ''
                      }))
                    }
                  }}
                  className="mb-2"
                >
                  <option value="">-- Choose Saved User --</option>
                  {hospitalUsers.map(u => (
                    <option key={u.id} value={u.full_name.toUpperCase()}>
                      {u.full_name.toUpperCase()} ({u.jawatan ? u.jawatan.toUpperCase() : 'NO POSITION'})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Position"
                  value={(tempSignatures.applicantPosition || '').toUpperCase()}
                  onChange={(e) => setTempSignatures({ ...tempSignatures, applicantPosition: e.target.value.toUpperCase() })}
                  placeholder="Enter position..."
                />
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2.5 py-0.5 rounded w-fit">Approving Officer</p>
              <div className="space-y-3 px-1">
                <Select
                  label="Name"
                  value={(tempSignatures.headName || '').toUpperCase()}
                  onChange={(e) => {
                    const chosen = hospitalUsers.find(u => u.full_name.toUpperCase() === e.target.value.toUpperCase())
                    if (chosen) {
                      setTempSignatures(prev => ({
                        ...prev,
                        headName: chosen.full_name.toUpperCase(),
                        headPosition: (chosen.jawatan || '').toUpperCase()
                      }))
                    } else {
                      setTempSignatures(prev => ({
                        ...prev,
                        headName: '',
                        headPosition: ''
                      }))
                    }
                  }}
                  className="mb-2"
                >
                  <option value="">-- Choose Saved User --</option>
                  {hospitalUsers.map(u => (
                    <option key={u.id} value={u.full_name.toUpperCase()}>
                      {u.full_name.toUpperCase()} ({u.jawatan ? u.jawatan.toUpperCase() : 'NO POSITION'})
                    </option>
                  ))}
                </Select>
                <Input
                  label="Position"
                  value={(tempSignatures.headPosition || '').toUpperCase()}
                  onChange={(e) => setTempSignatures({ ...tempSignatures, headPosition: e.target.value.toUpperCase() })}
                  placeholder="Enter position..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="rounded-lg font-semibold text-xs px-4 h-9">Cancel</Button>
            <Button 
              onClick={handleSaveSignatures} 
              className="bg-slate-900 hover:bg-black text-white rounded-lg font-semibold text-xs px-5 h-9 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <IconSave className="w-4 h-4" /> Save Configuration
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload / Change LPO Modal */}
      {isUploadLpoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsUploadLpoModalOpen(false)}></div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md relative z-10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Upload / Change LPO Document</h3>
              <button 
                onClick={() => setIsUploadLpoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleLpoUploadSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  LPO Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lpoUploadData.lpo_number}
                  onChange={(e) => setLpoUploadData({ ...lpoUploadData, lpo_number: e.target.value })}
                  placeholder="e.g. C0260000000140103"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Document Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={lpoUploadData.document_date}
                  onChange={(e) => setLpoUploadData({ ...lpoUploadData, document_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expected Delivery Date (ETA) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={lpoUploadData.expected_delivery_date || ''}
                  onChange={(e) => setLpoUploadData({ ...lpoUploadData, expected_delivery_date: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  LPO Document PDF <span className="text-red-500">*</span>
                </label>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => lpoFileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    <IconUpload className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a PDF file</span>
                        <input 
                          ref={lpoFileInputRef}
                          type="file" 
                          className="sr-only" 
                          accept=".pdf"
                          required
                          onChange={handleLpoFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Strictly PDF format only.
                    </p>
                    <p className="text-xs font-semibold text-blue-600">
                      {lpoUploadData.document_file ? lpoUploadData.document_file.name : 'PDF up to 10MB'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadLpoModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingLpo}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isUploadingLpo ? (
                    <>
                      <Spinner size="sm" />
                      Uploading...
                    </>
                  ) : (
                    'Upload & Link LPO'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetailView;
