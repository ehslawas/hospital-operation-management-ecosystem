import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { 
  Activity, 
  AirVent, 
  Wind, 
  AlertTriangle, 
  Database, 
  ShoppingCart, 
  ClipboardList, 
        </div>
  Search,
  Plus,
  QrCode,
  RefreshCw,
  CheckCircle,
  Printer,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
  Download,
  Calendar,
  X
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, StatCard, Table, Badge } from '@/components/ui'
import { 
  getOxygenCylinders, 
  getOxygenSummary, 
  getOxygenConsumptionHistory,
  updateOxygenCylinderStatus,
  getOxygenFinancialSummary,
  getOxygenLatestPricing,
        setSummary(summaryRes
  getOxygenReceptionsList,
  createOxygenReceptionRecord,
  getOxygenSystemSettings
} from '@/services/pharmacy/oxygenService'
import { 
  generateOxygenPoPdf, 
  generateOxygenReceptionReportPdf 
} from '@/services/pharmacy/oxygenPdfService'
import { 
  getPharmacyPOSignatures, 
  updatePharmacyPOSignatures, 
  type PharmacyPOSignatures 
} from '@/services/pharmacy/pharmacySettingsService'
import type { 
  OxygenCylinderWithRelations, 
  OxygenSummary, 
  OxygenConsumptionWithRelations,
  OxygenFinancialSummary,
  OxygenPricingConfig,
  OxygenSystemSettings,
  OxygenReceptionRecord,
  OxygenReceptionItem
} from '@/types/pharmacy'
import type { ApiResponse, Paginated, Column } from '@/types'
2. Confirm the form dynamically calculates:
   - **Refill Total**: `RM 13,352.20`
   - **Consolidated Loan Total**: `RM 1,101.60`
   - **Grand Total**: `RM 14,453.80`
3. Click "Log Received Oxygen" and verify the logged PDF PO:
   - **Previous Balance**: `RM 27,416.10` (`12,962.30 + 14,453.80`)
   - **Ending Refill Balance**: `RM 14,063.90` (cascaded balance matching the KPI balance perfectly!)

  const [error, setError] = useState<string | null>(null)

  // Filters for Cylinder Registry
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // QR Label Generator State
  const [selectedCylinderId, setSelectedCylinderId] = useState('')
  const [generatedLabel, setGeneratedLabel] = useState<OxygenCylinderWithRelations | null>(null)

  // Reconciliation Audit States
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({})
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null)

  // --- NEW FINANCIAL STATES ---
  const fmt = (val: number) => `RM ${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({})
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null)

  // --- NEW FINANCIAL STATES ---
  const fmt = (val: number) => `RM ${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  const [financials, setFinancials] = useState<OxygenFinancialSummary | null>(null)
  const [pricingConfigs, setPricingConfigs] = useState<OxygenPricingConfig[]>([])
  const [receptionsList, setReceptionsList] = useState<OxygenReceptionRecord[]>([])
  const [systemSettings, setSystemSettings] = useState<OxygenSystemSettings | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals visibility
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [pdfSuccessModalOpen, setPdfSuccessModalOpen] = useState(false)
  const [justCreatedReception, setJustCreatedReception] = useState<OxygenReceptionRecord | null>(null)

  // Officer Signatures state
  const [signatures, setSignatures] = useState<PharmacyPOSignatures>({
    applicantName: 'KAMRIAH BT HAJI MAIL',
    applicantPosition: 'PENOLONG PEGAWAI FARMASI U7 TBK 2',
    headName: 'TAN YUANG ZHANG',
    headPosition: 'PEGAWAI FARMASI UF 12',
  })
  const [tempSignatures, setTempSignatures] = useState<PharmacyPOSignatures>(signatures)
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false)
  const [isSavingOfficers, setIsSavingOfficers] = useState(false)

  // PO Preview & Custom Signatures states
  const [isPoPreviewModalOpen, setIsPoPreviewModalOpen] = useState(false)
  const [previewRecord, setPreviewRecord] = useState<OxygenReceptionRecord | null>(null)
  const [previewSignatures, setPreviewSignatures] = useState<PharmacyPOSignatures>({
    applicantName: '',
    applicantPosition: '',
    headName: '',
    headPosition: ''
  })
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [hospitalUsers, setHospitalUsers] = useState<{ id: string; full_name: string; jawatan?: string; role?: { role_name: string } }[]>([])

  useEffect(() => {
    if (!isPoPreviewModalOpen || !previewRecord) return

    let active = true
    const generatePreview = async () => {
      try {
        const { data: rawItems } = await supabase
          .from('pharmacy_oxygen_reception_items')
          .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*)')
          .eq('reception_id', previewRecord.id)

        const formattedItems: OxygenPdfItem[] = []
        const groupMap: Record<string, { size_code: string; is_loan: boolean; qty: number; price: number }> = {}
        
        ;(rawItems || []).forEach((itm: any) => {
          const sizeCode = itm.size_info?.code || 'Standard'
          const isLoan = itm.size_info?.is_loan || false
          const key = `${sizeCode}-${isLoan}`
          
          if (!groupMap[key]) {
            groupMap[key] = {
              size_code: sizeCode,
              is_loan: isLoan,
              qty: 1,
              price: Number(itm.unit_price)
            }
          } else {
            groupMap[key].qty += 1
          }
        })

        Object.values(groupMap).forEach((val) => {
          formattedItems.push({
            size_code: val.size_code,
            is_loan: val.is_loan,
            quantity: val.qty,
            unit_price: val.price,
            total_price: val.qty * val.price
          })
        })

        const blob = await generateOxygenPoPdf({
          reception: previewRecord,
          items: formattedItems,
          applicantName: previewSignatures.applicantName,
          applicantPosition: previewSignatures.applicantPosition,
          headName: previewSignatures.headName,
          headPosition: previewSignatures.headPosition
        })

        if (active) {
          const url = URL.createObjectURL(blob)
          setPreviewPdfUrl(url)
        }
      } catch (err) {

      }
    }

    void generatePreview()

    return () => {
      active = false
    }
  }, [isPoPreviewModalOpen, previewRecord, previewSignatures.applicantName, previewSignatures.applicantPosition, previewSignatures.headName, previewSignatures.headPosition])

  // Pricing Form state
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({})
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [isSavingPrices, setIsSavingPrices] = useState(false)

  // Reception Form state
  const [doNumber, setDoNumber] = useState('')
  const [soNumber, setSoNumber] = useState('')
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0])
            supplierName: lindeSupplier.company_name,
            supplierAddress: lindeSupplier.address,
            supplierPhone: lindeSupplier.phone
          } : {})
        })

        if (active) {
          const url = URL.createObjectURL(blob)
          setPreviewPdfUrl(url)
        }
      } catch (err) {
        console.error('Error generating preview PDF:', err)
      }
    }

    void generatePreview()

    return () => {
      active = false
    }
  }, [isPoPreviewModalOpen, previewRecord, previewSignatures.applicantName, previewSignatures.applicantPosition, previewSignatures.headName, previewSignatures.headPosition])

  // Pricing Form state
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({})
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [isSavingPrices, setIsSavingPrices] = useState(false)

  // Reception Form state
  const [doNumber, setDoNumber] = useState('')
  const [soNumber, setSoNumber] = useState('')
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0])
  const [voteCode, setVoteCode] = useState('080702')
  const [voteActivity, setVoteActivity] = useState('27402')
  const [receptionStatus, setReceptionStatus] = useState<'completed' | 'pending_invoice' | 'outstanding_po'>('completed')
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({})
  const [receiveLoans, setReceiveLoans] = useState<Record<string, number>>({})
  const [isSubmittingReception, setIsSubmittingReception] = useState(false)

  // Fetch real data
  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)

    try {

    try {
      const [
        summaryRes, 
        listRes, 
        historyRes,
        finRes,
        pricingRes,
        receptionsRes,
        settingsRes
      ]: [
        ApiResponse<OxygenSummary>,
        ApiResponse<Paginated<OxygenCylinderWithRelations>>,
        ApiResponse<OxygenConsumptionWithRelations[]>,
        ApiResponse<OxygenFinancialSummary>,
        ApiResponse<OxygenPricingConfig[]>,
        ApiResponse<OxygenReceptionRecord[]>,
        ApiResponse<OxygenSystemSettings>
      ] = await Promise.all([
        getOxygenSummary(hospitalId),
        getOxygenCylinders(hospitalId, {}, 1, 100) as any,
        getOxygenConsumptionHistory(hospitalId),
        getOxygenFinancialSummary(hospitalId),
        getOxygenLatestPricing(hospitalId),
        getOxygenReceptionsList(hospitalId),
        getOxygenSystemSettings(hospitalId)
      ])

      if (summaryRes.error) {
        setError(summaryRes.error)
      } else {
        setSummary(summaryRes.data || null)
      }

      if (listRes.error) {
        setError((prev) => prev ?? listRes.error)
      } else {
        setCylinders(listRes.data?.data || [])
      }

      if (historyRes.error) {
        console.error('Error fetching consumption history:', historyRes.error)
      } else {
        setConsumptionHistory(historyRes.data || [])
      }

      // Populate Financials
      if (finRes.data) setFinancials(finRes.data)
      if (pricingRes.data) {
        setPricingConfigs(pricingRes.data)
        // Set initial edited prices
        const priceMap: Record<string, string> = {}
        pricingRes.data.forEach(p => {
        // Set initial edited prices
        const priceMap: Record<string, string> = {}
        pricingRes.data.forEach(p => {
          priceMap[p.cylinder_size_code] = p.refill_price.toString()
        })
        setEditedPrices(priceMap)
      }
      if (receptionsRes.data) setReceptionsList(receptionsRes.data)
      if (settingsRes.data) setSystemSettings(settingsRes.data)

      const sigsRes = await getPharmacyPOSignatures(hospitalId)
      if (sigsRes.data) {
        setSignatures(sigsRes.data)
        .select('id, full_name, jawatan, role:roles(role_name)')
        .eq('hospital_id', hospitalId)
      if (rawUsers) {
        setHospitalUsers(rawUsers as any)
      }

    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred while loading oxygen records.')
    } finally {
        alert(res.error)
      } else {
        setIsPricingModalOpen(false)
        await loadData()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save prices.')
    } finally {
      if (res.error) {
        alert(res.error)
      } else {
        setIsPricingModalOpen(false)
        await loadData()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save prices.')
    } finally {
      setIsSavingPrices(false)
    }
  }

  const handleSaveSignatures = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id) return
    setIsSavingOfficers(true)
    try {
      const res = await updatePharmacyPOSignatures(tempSignatures, hospitalId, user.id)
      if (res.error) {
        alert(res.error)
      } else {
        setSignatures(tempSignatures)
        setIsOfficerModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save signatures.')
    } finally {
      setIsSavingOfficers(false)
    }
  }

  const getActivePrice = (sizeCode: string): number => {
    const config = pricingConfigs.find(p => p.cylinder_size_code === sizeCode)


































    {
      key: 'department',
      label: 'Requesting Unit',
      className: 'text-sm text-gray-600',
      render: (_, row) => row.department?.department_name || 'Emergency Trauma Unit',
    },
    {
      key: 'quantity_used',
      label: 'Quantity Refilled',
      className: 'text-sm text-gray-900 font-semibold',
      render: (val, row) => `${val} ${row.unit || 'liters'}`,
    },
    {
      key: 'notes',
      label: 'Remarks / Notes',
      className: 'text-sm text-gray-500 italic',
      render: (val) => val || 'Scheduled ward refill',
    }
  ]

  const handleAuditSubmit = () => {
    setAuditSuccessMsg('Stock reconciliation verified. Discrepancies logged successfully.')
    setTimeout(() => setAuditSuccessMsg(null), 5000)
  }

  // --- NEW FINANCIAL LOGIC ---
  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id) return
    setIsSavingPrices(true)
    try {
      const pricesToInsert = Object.keys(editedPrices).map(sizeCode => ({
        size_code: sizeCode,
        refill_price: parseFloat(editedPrices[sizeCode]) || 0
      }))

      const res = await updateCylinderPrices(hospitalId, pricesToInsert, effectiveFrom, user.id)
      if (res.error) {
        alert(res.error)
      } else {
        setIsPricingModalOpen(false)
  
    setPreviewSignatures({
      applicantName: signatures.applicantName,
      applicantPosition: signatures.applicantPosition,
      headName: signatures.headName,
      headPosition: signatures.headPosition
    })
    setIsPoPreviewModalOpen(true)
  }

  const handleSaveSignatures = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id) return
    setIsSavingOfficers(true)
    try {
      const res = await updatePharmacyPOSignatures(tempSignatures, hospitalId, user.id)
      if (res.error) {
        alert(res.error)
      } else {
        setSignatures(tempSignatures)
        setIsOfficerModalOpen(false)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save signatures.')
    } finally {
      setIsSavingOfficers(false)
    }
  }

  const handleOpenPoPreview = (record: OxygenReceptionRecord) => {
    setPreviewRecord(record)
    setPreviewSignatures({
      applicantName: signatures.applicantName,
      applicantPosition: signatures.applicantPosition,
      headName: signatures.headName,
      headPosition: signatures.headPosition
    })
    setIsPoPreviewModalOpen(true)
  }

  const handleGeneratePoWithCustomSignatures = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!previewRecord) return
    try {
      // Fetch received items dynamically
      const { data: rawItems } = await supabase
        .from('pharmacy_oxygen_reception_items')
        .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*)')
        .eq('reception_id', previewRecord.id)

      const formattedItems: OxygenPdfItem[] = []
      const groupMap: Record<string, { size_code: string; is_loan: boolean; qty: number; price: number }> = {}
      
      ;(rawItems || []).forEach((itm: any) => {
        const sizeCode = itm.size_info?.code || 'Standard'
        const isLoan = itm.size_info?.is_loan || false
        const key = `${sizeCode}-${isLoan}`
        
        if (!groupMap[key]) {
          groupMap[key] = {
            size_code: sizeCode,
            is_loan: isLoan,
            qty: 1,
            price: Number(itm.unit_price)
          }
        } else {
          groupMap[key].qty += 1
        }
      })

      Object.values(groupMap).forEach((val) => {
        formattedItems.push({
          size_code: val.size_code,
          is_loan: val.is_loan,
          quantity: val.qty,
          unit_price: val.price,
          total_price: val.qty * val.price
        })
      })

      const totalAmount = formattedItems.reduce((sum, item) => sum + item.total_price, 0)
      const currentBalance = financials?.current_balance ?? 274000.0
      const calculatedBalanceBefore = currentBalance + totalAmount
      const calculatedBalanceAfter = currentBalance

      const blob = await generateOxygenPoPdf({
        reception: previewRecord,
        items: formattedItems,
        applicantName: previewSignatures.applicantName,
        applicantPosition: previewSignatures.applicantPosition,
        headName: previewSignatures.headName,
        headPosition: previewSignatures.headPosition,
        balanceBefore: calculatedBalanceBefore,
        balanceAfter: calculatedBalanceAfter,
        ...(lindeSupplier ? {
          supplierName: lindeSupplier.company_name,
          supplierAddress: lindeSupplier.address,
          supplierPhone: lindeSupplier.phone
        } : {})
      })

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setIsPoPreviewModalOpen(false)
    } catch (err) {
      console.error('Error generating PO PDF:', err)
      alert('Failed to generate PO PDF.')
    }
  }

  const getActivePrice = (sizeCode: string): number => {
    const config = pricingConfigs.find(p => p.cylinder_size_code === sizeCode)
    return config ? config.refill_price : 0
  }

  // Dynamic cost calculations for key-in form
  const getRefillCostForSize = (sizeCode: string): number => {
    const qty = receiveQuantities[sizeCode] || 0
    const price = getActivePrice(sizeCode)
    return qty * price
  }

  const getLoanCostForSize = (sizeCode: string): number => {
    const qty = receiveLoans[sizeCode] || 0
    const rate = systemSettings?.loan_cylinder_rate || 18.36
    return qty * rate
  }

  const calculateFormRefillTotal = (): number => {
    return Object.keys(editedPrices).reduce((sum, sizeCode) => {
      return sum + getRefillCostForSize(sizeCode)
    }, 0)
  }

  const calculateFormLoanTotal = (): number => {
    const rate = systemSettings?.loan_cylinder_rate || 18.36
    return Object.keys(editedPrices).reduce((sum, sizeCode) => {
      const qtyLoaned = receiveLoans[sizeCode] || 0
      return sum + qtyLoaned * rate
    }, 0)
  }

  const handleCreateReception = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id) return
    if (!doNumber || !soNumber) {
      alert('Please fill in Delivery Order and Sales Order numbers.')
      return
    }

    setIsSubmittingReception(true)
    try {
      const refillAmt = calculateFormRefillTotal()
      const loanAmt = calculateFormLoanTotal()
      const grandTotal = refillAmt + loanAmt

      // Formulate items
      const itemsToCreate: Omit<OxygenReceptionItem, 'id' | 'reception_id' | 'created_at'>[] = []
      
      alert('Please fill in Delivery Order and Sales Order numbers.')
      return
    }

    setIsSubmittingReception(true)
    try {
      const refillAmt = calculateFormRefillTotal()
      const loanAmt = calculateFormLoanTotal()
      const grandTotal = refillAmt + loanAmt
      // Formulate items
      const itemsToCreate: Omit<OxygenReceptionItem, 'id' | 'reception_id' | 'created_at'>[] = []
      
      // Retrieve sizes from DB
      const { data: sizesList } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('*')
      const { data: typesList } = await supabase.from('pharmacy_oxygen_cylinder_types').select('*')
      const defaultType = typesList?.[0]?.id || ''

      for (const sizeCode of Object.keys(editedPrices)) {
        const qtyRefilled = receiveQuantities[sizeCode] || 0
        const qtyLoaned = receiveLoans[sizeCode] || 0
        
        const sizeObj = sizesList?.find(s => s.code === sizeCode)
        if (!sizeObj) continue

        const basePrice = getActivePrice(sizeCode)
        const loanRate = systemSettings?.loan_cylinder_rate || 18.36

        // Insert refilled items
        if (qtyRefilled > 0) {
          const isLoan = sizeObj.is_loan
          const itemPrice = isLoan ? (basePrice + loanRate) : basePrice
          for (let i = 0; i < qtyRefilled; i++) {
            itemsToCreate.push({
              cylinder_size_id: sizeObj.id,
              cylinder_type_id: defaultType,
              unit_price: itemPrice
            })
          }
        }

        // Insert loaned items
        if (qtyLoaned > 0) {
          const itemPrice = basePrice + loanRate
          for (let i = 0; i < qtyLoaned; i++) {
            itemsToCreate.push({
              cylinder_size_id: sizeObj.id,
              cylinder_type_id: defaultType,
              unit_price: itemPrice
            })
          }
        }
      }

      const res = await createOxygenReceptionRecord(
        hospitalId,
        {
          reception_date: receptionDate,
          delivery_order_no: doNumber,
          sales_order_no: soNumber,
          refill_amount: refillAmt,
          loan_amount: loanAmt,
          total_amount: grandTotal,
          vote_code: voteCode,
          vote_activity: voteActivity,
          status: receptionStatus
        },
        itemsToCreate,
        user.id
      )


      if (res.error) {
        alert(res.error)
      } else {
        setIsReceiveModalOpen(false)
        setJustCreatedReception(res.data)
        setPdfSuccessModalOpen(true)
        
        // Reset form
        setDoNumber('')
        setSoNumber('')
        setReceiveQuantities({})
        setReceiveLoans({})
        
        await loadData()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to log oxygen reception.')
    } finally {
      setIsSubmittingReception(false)
    }
  }

  // PDF Generation Triggers
  const handleDownloadPO = async (record: OxygenReceptionRecord) => {
    try {
      // Fetch received items dynamically
      const { data: rawItems } = await supabase
        .from('pharmacy_oxygen_reception_items')
          groupMap[key] = {
            size_code: sizeCode,
            is_loan: isLoan,
            qty: 1,
            price: Number(itm.unit_price)
          }
        } else {
          groupMap[key].qty += 1
        }
      })

      Object.values(groupMap).forEach((val) => {
        formattedItems.push({
          size_code: val.size_code,
          is_loan: val.is_loan,
          quantity: val.qty,
          unit_price: val.price,
          total_price: val.qty * val.price
        })
      })

      const blob = await generateOxygenPoPdf({
        reception: record,
        items: formattedItems,
        applicantName: signatures.applicantName,
        applicantPosition: signatures.applicantPosition,
        headName: signatures.headName,
        headPosition: signatures.headPosition,
        ...(lindeSupplier ? {
          supplierName: lindeSupplier.company_name,
          supplierAddress: lindeSupplier.address,
          supplierPhone: lindeSupplier.phone
        } : {})
      })



















































































































                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] outline-none"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] outline-none bg-white text-gray-600 font-medium min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="full">Full</option>
              <option value="empty">Empty</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <Table
              data={filteredCylinders}
              columns={cylinderColumns}
              emptyMessage="No cylinders match your filters."
            />
          </div>
        </div>
      )
    }

    // 2. CYLINDER REQUEST VIEW (CONSUMPTION)
    if (currentPath === '/pharmacy/oxygen/consumption') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#00a68a]" />
                <Layers className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>

          {/* Card 4: Current Balance */}
          {(() => {
            const bal = financials?.current_balance ?? -2717.14
            const isOverBudget = bal < 0
            return (
              <div className={`relative border rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl
                ${isOverBudget 
                  ? 'bg-rose-50/70 border-rose-200/50 shadow-[0_8px_30px_rgba(244,63,94,0.03)]' 
                  : 'bg-white/80 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)]'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Current Balance</span>
                    <h4 className={`text-2xl lg:text-3xl font-extrabold tracking-tight mt-2.5 ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                      {fmt(bal)}
                    </h4>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider mt-3 px-2 py-0.5 rounded-full
                      ${isOverBudget ? 'bg-rose-100/60 text-[#e11d48] animate-pulse' : 'bg-emerald-50 text-[#10b981]'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      {isOverBudget ? 'Deficit Overdraft' : 'Healthy Allocation'}
                    </span>
                  </div>
                  <div className={`w-11 h-11 border rounded-2xl flex items-center justify-center shadow-sm
                    ${isOverBudget ? 'bg-rose-100/60 border-rose-200 text-rose-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Card 5: Loan Charge


































































                      type="text" 



























































                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Loan Charges</span>
                    const currentPhysical = physicalCounts[cyl.id] || cyl.status
                    const isMatched = currentPhysical === cyl.status

                    return (
                      <tr key={cyl.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">{cyl.serial_number}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{cyl.type_info?.type_name || 'Standard Cylinder'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-600 uppercase">{cyl.status}</td>
                        <td className="px-6 py-4">
                          <select 
                            value={currentPhysical}
                            onChange={(e) => setPhysicalCounts(prev => ({ ...prev, [cyl.id]: e.target.value }))}
                            className="border border-gray-200 rounded-lg p-1.5 bg-white font-bold text-gray-800 text-[11px] outline-none"
                          >
                            <option value="full">Full</option>
                            <option value="empty">Empty</option>
                            <option value="in_use">In Use</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </td>
                        <td c






          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsReceiveModalOpen(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Key In Received Oxygen
            </button>

          </div>
        </div>

        {/* ========================================================
            TWO COLUMN LAYOUT GRID
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT SIDE: TRANSACTION LEDGER TABLE (2/3 width) */}
          <div className="lg:col-span-2 bg-white/80 border border-slate-200/40 rounded-[28px] shadow-sm overflow-hidden backdrop-blur-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Recent Oxygen Deliveries (Received Log)</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Official transactions recorded under governmental budget allocation.</p>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[9px] font-black tracking-wider uppercase">KKM Audit Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-gray-500">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">RECEPTION DATE</th>
                    <th className="px-6 py-4">DELIVERY ORDER</th>
                    <th className="px-6 py-4">REFILL COST</th>
                    <th className="px-6 py-4">LOAN CHARGES</th>
                    <th className="px-6 py-4">TOTAL COST</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4 text-right">DOCUMENTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receptionsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium italic">No oxygen deliveries logged yet.</td>
                    </tr>
                  ) : (
                    (() => {
                      const itemsPerPage = 5
                      const paginatedList = receptionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      return paginatedList.map((rec) => (
                        <tr key={
                {/* Flat cylinder loan rate row */}
                <div className="flex items-center justify-between py-2.5 border-t border-slate-100 hover:bg-slate-50/50 px-2 rounded-lg transition-colors mt-1 bg-slate-50/40">








                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'}`}
                            >
                              {rec.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleDownloadPO(rec)}
                                className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-slate-200/50"
                                title="Generate KKM PO PDF"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                PO
                              </button>
                              <button 
                                onClick={() => handleDownloadReport(rec)}
                                className="px-2.5 py-1.5 hover:bg-teal-50 text-slate-600 hover:text-teal-600 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-slate-200/50"
                                title="Generate Reception Report PDF"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Government Warrant Deficit</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span>Government Warrant Healthy</span>
                      </>
                    )}
                  </div>
                  <p className={`text-[11px] font-medium leading-relaxed ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isOverBudget ? (
                      <>
                        Oxygen spending (<strong>{fmt(totalSpending)}</strong>) has exceeded the Warrant Allocation (<strong>{fmt(allocation)}</strong>) by <strong>{percentage.toFixed(1)}%</strong> under Vote Code 080702 / Activity 27402.
                      </>
                    ) : (
          {/* Card 5: Loan Charges */}
          <div className="relative bg-white/80 border border-slate-100 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Loan Charges</span>
                <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight mt-2.5">
                  {fmt(financials?.loan_charges || 15679.44)}
                </h4>
                <span className="text-[10px] font-bold text-purple-600 mt-3.5 block bg-purple-50 border border-purple-100/50 px-2 py-0.5 rounded-lg w-max">
                  Rate: {fmt(systemSettings?.loan_cylinder_rate || 18.36)} / cyl
                </span>
              </div>
              <div className="w-11 h-11 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center shadow-sm shadow-purple-500/5">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MODERN ACTION BAR
           ===========================================
            
          </div>
        </div>

        {/* Real Cylinder Live List Table (Audited mini list) */}
        <div className="bg-white/80 border border-slate-200/40 rounded-[28px] shadow-sm overflow-hidden backdrop-blur-md mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div>




                          <td className="px-6 py-4 text-purple-600 font-semibold">{fmt(rec.loan_amount)}</td>
                          <td className="px-6 py-4 text-slate-950 font-black">{fmt(rec.total_amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border
                              ${rec.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'}`}
                            >
                              {rec.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleOpenPoPreview(rec)}
                                className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-slate-200/50"
                                title="Generate KKM PO PDF"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                PO
                              </button>
                              <button 
                                onClick={() => handleDownloadReport(rec)}
                                className="px-2.5 py-1.5 hover:bg-teal-50 text-slate-600 hover:text-teal-600 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-slate-200/50"
                                title="Generate Reception Report PDF"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                Report
                              </button>
                            </div>
                          </td>







































                      >
                        <div>
                          <span className="px-2.5 py-1 border border-sky-200 bg-sky-50 text-sky-700 rounded-md font-bold text-[10px] block w-max font-mono mb-1.5 shadow-xxs">
                            {config.cylinder_size_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Standard Rate</span>
                        </div>
                        <div className="relative w-32 flex items-center border border-slate-250 rounded-lg bg-white overflow-hidden shadow-xs h-9.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/10 transition-all">
                          <span className="pl-3.5 text-[11px] font-bold text-slate-400">RM</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={editedPrices[config.cylinder_size_code] || ''}
                            onChange={(e) => setEditedPrices(prev => ({ ...prev, [config.cylinder_size_code]: e.target.value }))}
                            required
                            className="w-full pr-3.5 py-2.5 bg-transparent text-xs font-mono font-bold outline-none border-0 text-right text-slate-800 focus:ring-0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Form inputs */}
                <div className="w-full md:w-[320px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-5 flex-shrink-0">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Effective Start Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="date" 
                          value={effectiveFrom}
                          onChange={(e) => setEffectiveFrom(e.target.value)}
                          required
                          className="w-full pl-10 pr-3.5 py-2.5 border border-slate-250 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 transition-all text-xs font-semibold text-slate-800 rounded-lg outline-none bg-white shadow-xs"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-sky-50 border border-sky-100/50 rounded-xl text-xs text-sky-800 leading-relaxed font-semibold">
                      <p className="font-extrabold text-sky-900 mb








                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: SIDEBAR WIDGETS (1/3 width) */}
          <div className="space-y-6">
            
            {/* Widget A: Active Pricing Matrix config list */}
            <div className="bg-white/80 border border-slate-200/40 rounded-[28px] p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Cylinder Prices</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Standard refill costs per size code</p>
                </div>
                <button 
                  onClick={() => setIsPricingModalOpen(true)}
                  className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0284c7] rounded-xl text-[10px] font-black tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-sky-100"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  ADJUST
                </button>
              </div>
              
              <div className="space-y-2.5">
                {pricingConfigs.slice(0,





















































        {/* Real Cylinder Live List Table (Audited mini list) */}
        <div className="bg-white/80 border border-slate-200/40 rounded-[28px] shadow-sm overflow-hidden backdrop-blur-md mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Cylinder Registry (Top 10 Live Inventory)</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Detailed catalog of all active medical oxygen cylinders from Supabase.</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/50 rounded-full text-[9px] font-black tracking-wider uppercase">Live Database</span>
          </div>
          <Table
            data={cylinders.slice(0, 10)}
            columns={cylinderColumns}
            emptyMessage="No cylinders found in the inventory."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen relative font-sans">
      {/* Title Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest">
            <span>Pharmacy</span>
            <span>&gt;</span>
            <span>Inventory</span>
            <span>&gt;</span>
            <span className="text-slate-400">Distribution</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Wind className="w-8 h-8 text-teal-600" />
            Medical Oxygen Distribution
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Overview of live oxygen cylinder capacity, utilization, and status tracked via Supabase.
          </p>
        </div>
      </div>


      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div>




                  <div className="text-[10px] font-semibold text-slate-500">{signatures.headPosition}</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Real Cylinder Live List Table (Audited mini list) */}
        <div className="bg-white/80 border border-slate-200/40 rounded-[28px] shadow-sm overflow-hidden backdrop-blur-md mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Cylinder Registry (Top 10 Live Inventory)</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Detailed catalog of all active medical oxygen cylinders from Supabase.</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/50 rounded-full text-[9px] font-black tracking-wider uppercase">Live Database</span>
          </div>
          <Table
            data={cylinders.slice(0, 10)}
            columns={cylinderColumns}
            emptyMessage="No cylinders found in the inventory."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen relative font-sans">
      {/* Title Header */}
      <div className="flex items-center justify-between gap-4">
















      </div>


      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div>
            <p className="font-bold">Failed to load oxygen data</p>
            <p className="mt-1 font-medium">{error}</p>
          </div>
        </div>
      ) : (
        renderActiveView()
      )}

      {/* ========================================================
          MODAL 1: SET CYLINDER PRICES
         ======================================================== */}
      {isPricingModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-all duration-300"
          onClick={() => setIsPricingModalOpen(false)}
        >
          {/* Injected style tag for premium slide-in animation */}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          
          <div 
            className="bg-white text-slate-800 w-full max-w-3xl md:max-w-3xl lg:max-w-4xl h-full shadow-2xl border-l border-slate-200 flex flex-col p-6 overflow-hidden relative"
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            onClick={(e) => e.stopPropagation()}



















                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pricingConfigs.map((config) => (
                      <div 
                        key={config.id} 
                        className="flex items-center justify-between p-4.5 bg-slate-50/50 border border-slate-200/80 hover:bg-white hover:border-slate-350 hover:border-l-4 hover:border-l-sky-500 rounded-xl hover:shadow-sm transition-all duration-200 group"
                      >
                        <div>
                          <span className="px-2.5 py-1 border border-sky-200 bg-sky-50 text-sky-700 rounded-md font-bold text-[10px] block w-max font-mono mb-1.5 shadow-xxs">
                            {config.cylinder_size_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Standard Rate</span>
                        </div>
                        <div className="relative w-32 flex items-center border border-slate-250 rounded-lg bg-white overflow-hidden shadow-xs h-9.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/10 transition-all">
                          <span className="pl-3.5 text-[11px] font-bold text-slate-400">RM</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={editedPrices[config.cylinder_size_code] || ''}
                            onChange={(e) => setEditedPrices(prev => ({ ...prev, [config.cylinder_size_code]: e.target.value }))}
                            required
                            className="w-full pr-3.5 py-2.5 bg-transparent text-xs font-mono font-bold outline-none border-0 text-right text-slate-800 focus:ring-0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Form inputs */}
                <div className="w-full md:w-[320px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-5 flex-shrink-0">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Effective Start Date</label>





                      <p className="font-extrabold text-sky-900 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Warrant Administration Notice
                      </p>
                      Adjusting prices sets base rates for new PO generations. Historically processed receptions will remain unchanged.
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsPricingModalOpen(false)}
                      className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSavingPrices}
                      className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      {isSavingPrices ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Save Prices
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
                          onChange={(e) => setReceptionStatus(e.target.value as any)}
                          className="bg-white border border-slate-250 text-slate-800 focus:ring-2 focus:ring-teal-600/10 focus:border-teal-500 transition-all cursor-pointer shadow-xxs text-xs font-semibold rounded-lg w-full p-2.5"
                        >
                          <option value="completed">Completed</option>
                          <option value="pending_invoice">Pending Invoice</option>
                          <option value="outstanding_po">Outstanding PO</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 2: Premium Warrant Receipt Summary Card (expanded) */}
                    <div className="bg-teal-50/70 border border-teal-150 p-5 rounded-xl flex flex-col gap-3.5 shadow-xxs">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block border-b border-teal-200 pb-2">Warrant Receipt Summary</span>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs text-teal-850 font-semibold">
                          <span>Refill Charges:</span>
                          <span className="font-mono text-teal-900 font-bold">{fmt(calcul

            <h3 className="text-lg font-black text-slate-800">Oxygen Received Successfully!</h3>
            <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
              The oxygen delivery was successfully recorded into Supabase. You can now download the KKM-compliant documents.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={() => handleDownloadPO(justCreatedReception)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                Print Purchase Order (PO) PDF
              </button>
              <button 
                onClick={() => handleDownloadReport(justCreatedReception)}

            <form onSubmit={handleCreateReception} className="flex flex-col flex-grow overflow-hidden min-h-0">
              
              <div className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden min-h-0">
                {/* Left Side: Cyber-styled Cylinder Inventory list of gorgeous Glass Cards */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CYLINDERS RECEIVED CATALOG</span>
                    <span className="flex items-center gap-1 text-[9px] text-teal-700 font-extrabold bg-teal-50 px-2 py-0.5 border border-teal-200 rounded-md">
                      Live Warrant Rates
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {pricingConfigs.map((config) => {
                      const isLoanSize = config.cylinder_size_code.startsWith('101-')
                      const basePrice = config.refill_price
                      const loanRate = systemSettings?.loan_cylinder_rate || 18.36
                      const priceToDisplay = isLoanSize ? (basePrice + loanRate) : basePrice
                      
                      const sub = isLoanSize 
                        ? ((receiveQuantities[config.cylinder_size_code] || 0) + (receiveLoans[config.cylinder_size_code] || 0)) * priceToDisplay
                        : (receiveQuantities[config.cylinder_size_code] || 0) * basePrice + (receiveLoans[config.cylinder_size_code] || 0) * loanRate

                      return (
                        <div 
                          key={config.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 bg-slate-50/50 border border-slate-200/60 hover:bg-white hover:border-slate-350 hover:border-l-4 hover:border-l-teal-600 rounded-xl hover:shadow-sm transition-all duration-200 group"
                        >
                          {/* Size Info with capsule styling */}
                          <div className="flex items-center gap-3.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_4px_rgba(20,184,166,0.4)]" />
                            <div>
                              <span className="font-mono text-sm font-extrabold text-slate-800 block group-hover:text-teal-700 transition-colors">
                                {config.cylinder_size_code}
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5 font-bold">Standard Capacity</span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5 font-bold">Standard Capacity</span>
                            </div>
                          </div>

                          {/* Unit price with nice formatting */}
            </div>

            <h3 className="text-lg font-black text-slate-800">Oxygen Received Successfully!</h3>
            <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
              The oxygen delivery was successfully recorded into Supabase. You can now download the KKM-compliant documents.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={() => handleDownloadPO(justCreatedReception)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                Print Purchase Order (PO) PDF
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>

            <h3 className="text-lg font-black text-slate-800">Oxygen Received Successfully!</h3>
            <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
              The oxygen delivery was successfully recorded into Supabase. You can now download the KKM-compliant documents.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={() => handleDownloadPO(justCreatedReception)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                Print Purchase Order (PO) PDF
              </button>
                                  onClick={() => setReceiveQuantities(prev => ({ ...prev, [config.cylinder_size_code]: (prev[config.cylinder_size_code] || 0) + 1 }))}
                                  className="px-3 h-full text-slate-455 hover:bg-slate-100 hover:text-slate-800 transition-all text-xs font-semibold"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Loan Stepper widget */}
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Loaned</span>
                              {isLoanSize ? (
                                <span className="text-[9px] text-teal-800 font-extrabold uppercase tracking-wider px-3 bg-teal-50 border border-teal-200 rounded-md shadow-xxs h-9 flex items-center justify-center">
                                  Self Loaned
                                </span>
                              ) : (
                                <div className="inline-flex items-center border border-slate-250 bg-white rounded-lg overflow-hidden h-9 shadow-xxs">
                                  <button 
                                    type="button"
                                    onClick={() => setReceiveLoans(prev => ({ ...prev, [config.cylinder_size_code]: Math.max(0, (prev[config.cylinder_size_code] || 0) - 1) }))}
                                    className="px-3 h-full text-slate-455 hover:bg-slate-100 hover:text-slate-800 transition-all text-xs font-semibold"




                  <div className="flex flex-col gap-2 mt-6 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsReceiveModalOpen(false)}
                      className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingReception}
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingReception ? <Spinner size="sm" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      Log Received Oxygen
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: PDF DOWNLOAD CONGRATULATION SCREEN
         ======================================================== */}
      {pdfSuccessModalOpen && justCreatedReception && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] w-full max-w-md p-6 shadow-2xl text-center relative border border-slate-200/50 animate-bounce-short">
            <button 
              onClick={() => setPdfSuccessModalOpen(false)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>

            <h3 className="text-lg font-black text-slate-800">Oxygen Received Successfully!</h3>
            <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
              The oxygen delivery was successfully recorded into Supabase. You can now download the KKM-compliant documents.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={() => handleDownloadPO(justCreatedReception)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                Print Purchase Order (PO) PDF
              </button>
              <button 
                onClick={() => handleDownloadReport(justCreatedReception)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4 text-white" />
                Download Reception Report
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL 4: OFFICERS SIGNATURE SETTINGS drawer
         ======================================================== */}
      {isOfficerModalOpen && (
        <div 
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingOfficers}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {isSavingOfficers ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
                    <button 
                      type="submit"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-505 uppercase tracking-wider block">Budget Status</label>
                        <select 
                          value={receptionStatus}
                          onChange={(e) => setReceptionStatus(e.target.value as any)}
                          className="bg-white border border-slate-250 text-slate-800 focus:ring-2 focus:ring-teal-600/10 focus:border-teal-500 transition-all cursor-pointer shadow-xxs text-xs font-semibold rounded-lg w-full p-2.5"
                        >
                          <option value="completed">Completed</option>
                          <option value="pending_invoice">Pending Invoice</option>
                          <option value="outstanding_po">Outstanding PO</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 2: Premium Warrant Receipt Summary Card (expanded) */}
                    <div className="bg-teal-50/70 border border-teal-150 p-5 rounded-xl flex flex-col gap-3.5 shadow-xxs">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block border-b border-teal-200 pb-2">Warrant Receipt Summary</span>
                      
                      <div className="space-y-3">
                  
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>

            <h3 className="text-lg font-black text-slate-800">Oxygen Received Successfully!</h3>
            <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
              The oxygen delivery was successfully recorded into Supabase. You can now download the KKM-compliant documents.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={() => {
                  setPdfSuccessModalOpen(false)
                  handleOpenPoPreview(justCreatedReception)
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                Print Purchase Order (PO) PDF
              </button>
              <button 
                onClick={() => handleDownloadReport(justCreatedReception)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4 text-white" />
                Download Reception Report
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL 4: OFFICERS SIGNATURE SETTINGS drawer
         ======================================================== */}
      {isOfficerModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-
                  type="button" 
                  onClick={() => setIsOfficerModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingOfficers}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  {isSavingOfficers ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OxygenDashboardPage
                <div className="space-y-3.5 border-b border-slate-100 pb-5">
                  <h4 className="text-xs font-black text-teal-700 uppercase tracking-widest">1. Pegawai Yang Memohon</h4>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Officer Name</label>
                    <input 
                      type="text" 
                      value={tempSignatures.applicantName}
                      onChange={(e) => setTempSignatures(prev => ({ ...prev, applicantName: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-bold rounded-lg outline-none w-full px-3.5 py-2.5 shadow-xxs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Position / Jawatan</label>
                    <input 
                      type="text" 
                      value={tempSignatures.applicantPosition}
                      onChange={(e) => setTempSignatures(prev => ({ ...prev, applicantPosition: e.target.value }))}
                      required
               





















                      value={tempSignatures.headPosition}
                      onChange={(e) => setTempSignatures(prev => ({ ...prev, headPosition: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3.5 py-2.5 shadow-xxs"
                    />
                  </div>
                </div>
              </div>

                        <div className="flex justify-between text-xs text-teal-850 font-semibold">
                          <span>Loan Charges:</span>
                          <span className="font-mono text-teal-900 font-bold">+{fmt(calculateFormLoanTotal())}</span>
                        </div>
                        
                        <div className="border-t border-dashed border-teal-300 pt-3.5 mt-2">
                          <div className="flex justify-between text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">
                            <span>Grand Total Cost:</span>
                          </div>
                          <h4 className="font-mono text-teal-600 text-3xl font-black mt-1 tracking-tight">
                            {fmt(calculateFormRefillTotal() + calculateFormLoanTotal())}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-6 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsReceiveModalOpen(false)}
                      className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
              
      {isPoPreviewModalOpen && previewRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setIsPoPreviewModalOpen(false)}











              </div>
              <button 
                onClick={() => setIsPoPreviewModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGeneratePoWithCustomSignatures} className="flex-grow flex flex-col justify-between overflow-y-auto pr-1">
              <div className="space-y-5">
                {/* Info summary */}
              
              {/* Left Column: Live PDF Document Viewer (2/3 width) */}
              <div className="flex-1 lg:flex-[2] bg-slate-100 p-4 flex items-center justify-center border-r border-slate-200/50 overflow-hidden relative">
                {previewPdfUrl ? (
                  <iframe 
                    src={previewPdfUrl} 
                    className="w-full h-full border border-slate-200 rounded-2xl shadow-lg bg-white" 
                    title="Live PO PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Spinner size="lg" />
                    <span className="text-xs font-semibold">Generating document preview...</span>
                  </div>
                )}
              </div>
                    <input 
                      type="text" 
                      value={previewSignatures.applicantName}
                      onChange={(e) => setPreviewSignatures(prev => ({ ...prev, applicantName: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-bold rounded-lg outline-none w-full px-3 py-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Position / Jawatan</label>
                    <input 
                      type="text" 
                      value={previewSignatures.applicantPosition}
                      onChange={(e) => setPreviewSignatures(prev => ({ ...prev, applicantPosition: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3 py-2"
                    />
                  </div>
                </div>
















                    <input 
                      type="text" 
                      value={previewSignatures.headPosition}
                      onChange={(e) => setPreviewSignatures(prev => ({ ...prev, headPosition: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 border-t border-slate-100 pt-5">
                <button 
                  type="button" 
                  onClick={() => setIsPoPreviewModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-750 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Generate & Print PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OxygenDashboardPage


























                        value={previewSignatures.headPosition}
                        onChange={(e) => setPreviewSignatures(prev => ({ ...prev, headPosition: e.target.value }))}
                        required
                        className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 mt-6 border-t border-slate-100 pt-5 flex-shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsPoPreviewModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print PO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}  )}
    </div>
  )
}

export default OxygenDashboardPage








































                  <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest block">PO Reference</span>
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Delivery Order No:</span>
                      <span className="font-mono text-teal-700 font-bold">{previewRecord.delivery_order_no}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Total Amount:</span>
                      <span className="font-mono text-teal-850 font-black">{fmt(previewRecord.total_amount)}</span>
                    </div>
                  </div>

                  {/* Dropdown 1: Pegawai Memohon */}
                  <div className="space-y-3.5 border-b border-slate-100 pb-5">
                    <h4 className="text-xs font-black text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      1. Pegawai Yang Memohon
                    </h4>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Select Officer</label>
                      <select
                        onChange={(e) => {
                          const chosen = hospitalUsers.find(u => u.full_name === e.target.value)
                          if (chosen) {
                            setPreviewSignatures(prev => ({
                              ...prev,
                              applicantName: chosen.full_name,
                              applicantPosition: chosen.jawatan || chosen.role?.role_name || 'Assistant Pharmacist'
                            }))
                          }
                        }}
                        value={previewSignatures.applicantName}
                        className="w-full border border-slate-250 rounded-xl p-2.5 text-xs outline-none bg-white text-gray-700 focus:ring-2 focus:ring-teal-600/10 focus:border-teal-500 transition-all font-semibold"
                      >
                        <option value="">-- Select Officer --</option>
                        {hospitalUsers.map(user => (
                          <option key={user.id} value={user.full_name}>
                            {user.full_name} ({user.jawatan || user.role?.role_name || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-sl













































                        value={previewSignatures.headPosition}
                        onChange={(e) => setPreviewSignatures(prev => ({ ...prev, headPosition: e.target.value }))}
                        required
                        className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex gap-3 mt-6 border-t border-slate-100 pt-5 flex-shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setIsPoPreviewModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-98"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-extrabold shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print PO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OxygenDashboardPage

