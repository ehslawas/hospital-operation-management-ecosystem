import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wind,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
  Hash,
  Download,
  ScanLine,
  CheckCircle2,
  RotateCcw,
  Settings,
  Save,
  Trash2,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useIsSessionReady } from '@/stores/authStore'
import {
  Badge,
  Button,
  Modal,
  Input,
  Table
} from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { mergePOWithSupplierDocs } from '@/services/pharmacy/pdfMergeService'
import { OxygenPurchaseOrderTemplate } from '@/components/pharmacy/oxygen/OxygenPOTemplates'
import { QRScanner } from '@/components/medical-oxygen/QRScanner'
import { OxygenAnalytics } from './OxygenAnalytics'

import {
  getOxygenSummary,
  getOxygenReceptionRecords,
  createOxygenReceptionRecord,
  getOxygenCylinderSizes,
  getOxygenCylinderTypes,
  getOxygenPricingConfig,
  getOxygenSystemSettings,
  updateOxygenPricing,
  updateOxygenSystemSettings,
  deleteOxygenReceptionRecord,
  updateOxygenReceptionRecord,
  updateOxygenReceptionPrices
} from '@/services/pharmacy/oxygenService'
import { getPharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'

import { JATA_LOGO_BASE64 } from '@/constants/logo'
import type {
  OxygenSummary,
  OxygenReceptionRecordWithRelations,
  OxygenCylinderSize,
  OxygenCylinderType,
  OxygenPricingConfig,
  OxygenSystemSettings
} from '@/types/pharmacy'
import type { ApiResponse, PaginatedResponse, Column } from '@/types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

// =====================================================
// STAT CARD COMPONENT
// =====================================================

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  link?: string
  subtitle?: string
}

const colorClasses = {
  primary: {
    bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
    light: 'bg-teal-50',
    icon: 'bg-teal-100 text-teal-600',
    text: 'text-teal-600',
    border: 'border-teal-200',
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    light: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    light: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
    light: 'bg-rose-50',
    icon: 'bg-rose-100 text-rose-600',
    text: 'text-rose-600',
    border: 'border-rose-200',
  },
  info: {
    bg: 'bg-gradient-to-br from-sky-500 to-sky-600',
    light: 'bg-sky-50',
    icon: 'bg-sky-100 text-sky-600',
    text: 'text-sky-600',
    border: 'border-sky-200',
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-500 to-violet-600',
    light: 'bg-violet-50',
    icon: 'bg-violet-100 text-violet-600',
    text: 'text-violet-600',
    border: 'border-violet-200',
  },
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  subtitle,
}) => {
  const colors = colorClasses[color]
  const isPositive = change !== undefined && change > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-xl xs:rounded-2xl p-3 xs:p-4 sm:p-5 transition-all duration-300 min-h-[120px] xs:min-h-[140px]',
        'bg-white border shadow-sm hover:shadow-md',
        colors.border
      )}
    >
      {/* Background pattern */}
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mt-3 relative z-10 min-w-0">
        <h3 className="text-2xl font-bold text-gray-900 truncate">{value}</h3>
        <p className="text-sm font-medium text-gray-600 mt-1 line-clamp-2">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{subtitle}</p>}
        {changeLabel && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{changeLabel}</p>}
      </div>
    </motion.div>
  )
}

export const OxygenDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id
  const isSessionReady = useIsSessionReady()
  const toast = useToast()

  const [summary, setSummary] = useState<OxygenSummary | null>(null)
  const [receptions, setReceptions] = useState<OxygenReceptionRecordWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poGenerationData, setPoGenerationData] = useState<{
    record: OxygenReceptionRecordWithRelations
    groups: { cylinderType: string; items: any[]; totalAmount: number }[]
  } | null>(null)
  const [signatures, setSignatures] = useState<any>(null)
  const [prices, setPrices] = useState<OxygenPricingConfig[]>([])
  const [settings, setSettings] = useState<OxygenSystemSettings | null>(null)
  const [selectedReception, setSelectedReception] = useState<OxygenReceptionRecordWithRelations | null>(null)

  // Settings state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({})
  const [editingLoanRate, setEditingLoanRate] = useState<number>(0)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editingDateValue, setEditingDateValue] = useState('')



  // Variant Quantity State
  interface VariantEntry {
    combo_id: string
    display_name: string
    size_id: string
    size_code: string
    type_id: string
    type_name: string
    is_loaned: boolean
    refill_price: number
    loan_price: number
    quantity: number
    scanned_ids: string[]
  }
  const [variantQuantities, setVariantQuantities] = useState<VariantEntry[]>([])
  const [scanInput, setScanInput] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const scanInputRef = React.useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    delivery_order_no: '',
    sales_order_no: '',
    reception_date: new Date().toISOString().split('T')[0],
    refill_amount: 0,
    loan_amount: 0,
    cylinders: [] as {
      qr_code: string;
      cylinder_size_id: string;
      cylinder_type_id: string;
      serial_number?: string;
      refill_price: number;
      loan_price: number;
    }[]
  })

  // Initialize variant quantities from combos when data loads
  const initializeVariantQuantities = async () => {
    try {
      const { data: combos, error } = await supabase
        .from('pharmacy_oxygen_size_type_combos')
        .select(`
          id,
          display_name,
          display_order,
          size:pharmacy_oxygen_cylinder_sizes(id, code),
          type:pharmacy_oxygen_cylinder_types(id, name)
        `)
        .eq('is_active', true)
        .order('display_order')

      if (error || !combos) return

      const entries: VariantEntry[] = combos.map((combo: any) => {
        const sizeCode = combo.size?.code || ''
        const isLoaned = !sizeCode.startsWith('P')
        const refillPrice = prices.find(p => p.cylinder_size_code === sizeCode)?.refill_price || 0
        const loanPrice = isLoaned ? (settings?.loan_cylinder_rate || 14.00) : 0

        return {
          combo_id: combo.id,
          display_name: combo.display_name,
          size_id: combo.size?.id || '',
          size_code: sizeCode,
          type_id: combo.type?.id || '',
          type_name: combo.type?.name || '',
          is_loaned: isLoaned,
          refill_price: Number(refillPrice),
          loan_price: loanPrice,
          quantity: 0,
          scanned_ids: []
        }
      })

      setVariantQuantities(entries)
    } catch (err) {
      console.error('Failed to init variant quantities', err)
    }
  }

  // Calculate totals from variant quantities
  const variantTotals = variantQuantities.reduce((acc, v) => {
    const refillSubtotal = v.quantity * v.refill_price
    const loanSubtotal = v.quantity * v.loan_price
    return {
      totalUnits: acc.totalUnits + v.quantity,
      hospitalOwnedUnits: acc.hospitalOwnedUnits + (v.is_loaned ? 0 : v.quantity),
      loanedUnits: acc.loanedUnits + (v.is_loaned ? v.quantity : 0),
      refillTotal: acc.refillTotal + refillSubtotal,
      loanTotal: acc.loanTotal + loanSubtotal,
      grandTotal: acc.grandTotal + refillSubtotal + loanSubtotal
    }
  }, { totalUnits: 0, hospitalOwnedUnits: 0, loanedUnits: 0, refillTotal: 0, loanTotal: 0, grandTotal: 0 })

  const updateVariantQuantity = (comboId: string, newQty: number) => {
    setVariantQuantities(prev => prev.map(v => {
      if (v.combo_id === comboId) {
        // If reducing quantity, remove the last scanned ID (LIFO)
        const updatedScannedIds = v.scanned_ids.slice(0, newQty)
        return { ...v, quantity: Math.max(0, newQty), scanned_ids: updatedScannedIds }
      }
      return v
    }))
  }

  const processBarcode = (input: string) => {
    if (!input.trim()) return
    const code = input.trim().toUpperCase()

    // 1. Check for duplicates across ALL variants
    const isDuplicate = variantQuantities.some(v => v.scanned_ids.includes(code))

    if (isDuplicate) {
      toast.error('Duplicate Scan', `Cylinder ${code} has already been scanned.`)
      setScanInput('')
      return
    }

    // 2. Find matching variant (Naive matching: checks if Code contains Size Code or Name)
    // e.g. "101-N-X321" matches "101-N"
    const matchedVariant = variantQuantities.find(v =>
      code.includes(v.size_code.toUpperCase()) ||
      code.includes(v.display_name.toUpperCase())
    )

    if (matchedVariant) {
      setVariantQuantities(prev => prev.map(v => {
        if (v.combo_id === matchedVariant.combo_id) {
          return {
            ...v,
            quantity: v.quantity + 1,
            scanned_ids: [...v.scanned_ids, code]
          }
        }
        return v
      }))
      toast.success('Scanned', `Added ${matchedVariant.display_name} (${code})`)
      setScanInput('')
    } else {
      toast.error('Unknown Variant', `Could not match QR code "${code}" to any cylinder type.`)
    }
  }

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processBarcode(scanInput)
    }
  }


  const loadData = async () => {
    if (!isSessionReady || !hospitalId) return
    setIsLoading(true)

    try {
      const [summaryRes, recordsRes, pricingRes, settingsRes]: [
        ApiResponse<OxygenSummary>,
        ApiResponse<PaginatedResponse<OxygenReceptionRecordWithRelations>>,
        ApiResponse<OxygenPricingConfig[]>,
        ApiResponse<OxygenSystemSettings>
      ] = await Promise.all([
        getOxygenSummary(hospitalId),
        getOxygenReceptionRecords(hospitalId, 1, 10),
        getOxygenPricingConfig(hospitalId),
        getOxygenSystemSettings(hospitalId)
      ])

      if (summaryRes.error) throw new Error(summaryRes.error)

      setSummary(summaryRes.data)
      setReceptions(recordsRes.data?.data || [])
      setPrices(pricingRes.data || [])
      setSettings(settingsRes.data || null)
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [isSessionReady, hospitalId])

  // Load signature settings
  useEffect(() => {
    if (!isSessionReady || !hospitalId) return

    const loadSignatures = async () => {
      const result = await getPharmacyPOSignatures(hospitalId, 'pharmacy_logistics')
      if (result.data) {
        setSignatures(result.data)
      }
    }

    void loadSignatures()
  }, [isSessionReady, hospitalId])

  // Initialize variant quantities when prices/settings are loaded
  useEffect(() => {
    if (prices.length > 0 && settings) {
      void initializeVariantQuantities()

      // Also init editing state
      const priceMap: Record<string, number> = {}
      prices.forEach(p => {
        priceMap[p.cylinder_size_code] = p.refill_price
      })
      setEditingPrices(priceMap)
      setEditingLoanRate(settings.loan_cylinder_rate)
    }
  }, [prices, settings])

  // -- Event Handlers --

  const handleCreateReception = async () => {
    if (!hospitalId || !user?.id) return

    // Use latest settings for loan rate to prevent stale data
    const currentLoanRate = settings?.loan_cylinder_rate ?? 14.00

    // Convert variant quantities to cylinder items
    const cylinderItems: {
      cylinder_size_id: string
      cylinder_type_id: string
      qr_code: string
      serial_number?: string
      refill_price: number
      loan_price: number
    }[] = []

    let calculatedRefillTotal = 0
    let calculatedLoanTotal = 0

    variantQuantities.forEach(variant => {
      // Use current loan rate if it's a loan cylinder
      const itemLoanPrice = variant.is_loaned ? currentLoanRate : 0

      for (let i = 0; i < variant.quantity; i++) {
        // Use scanned ID if available, otherwise generate auto-ID
        const scannedId = variant.scanned_ids[i]
        const finalQrCode = scannedId || `${variant.display_name}-${Date.now()}-${i}`

        cylinderItems.push({
          cylinder_size_id: variant.size_id,
          cylinder_type_id: variant.type_id,
          qr_code: finalQrCode,
          refill_price: variant.refill_price,
          loan_price: itemLoanPrice
        })

        calculatedRefillTotal += variant.refill_price
        calculatedLoanTotal += itemLoanPrice
      }
    })

    if (cylinderItems.length === 0) {
      toast.error('Error', 'Please enter quantity for at least one cylinder variant')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createOxygenReceptionRecord({
        hospital_id: hospitalId,
        delivery_order_no: formData.delivery_order_no,
        sales_order_no: formData.sales_order_no,
        reception_date: formData.reception_date,
        refill_amount: calculatedRefillTotal,
        loan_amount: calculatedLoanTotal,
        vote_code: '080702',
        vote_activity: '27402',
        status: 'completed',
        created_by: user.id
      }, cylinderItems)

      if (res.error) throw new Error(res.error)

      toast.success('Success', `Oxygen reception recorded. Loan Rate used: RM ${currentLoanRate.toFixed(2)}`)

      setIsModalOpen(false)
      setFormData({
        delivery_order_no: '',
        sales_order_no: '',
        reception_date: new Date().toISOString().split('T')[0],
        refill_amount: 0,
        loan_amount: 0,
        cylinders: []
      })

      // Reset variant quantities
      setVariantQuantities(prev => prev.map(v => ({ ...v, quantity: 0, scanned_ids: [] })))
      setScanInput('')
      void loadData()
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to record reception')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecalculatePrices = async (reception: OxygenReceptionRecordWithRelations) => {
    if (!confirm('Are you sure you want to recalculate prices for this reception based on CURRENT System Settings?\n\nThis will update the Refill Amount and Loan Amount in the database permanently.')) {
      return
    }

    setIsSubmitting(true) // Reuse submitting state for loading indication
    try {
      const currentLoanRate = settings?.loan_cylinder_rate ?? 14.00
      const items = reception.items || []

      let newRefillTotal = 0
      let newLoanTotal = 0

      const itemUpdates = items.map(item => {
        const sizeCode = item.cylinder_size?.code || ''
        const isLoaned = !sizeCode.toUpperCase().startsWith('P')

        // Find current refill price for this size
        const refillPrice = prices.find(p => p.cylinder_size_code === sizeCode)?.refill_price || 0

        let newUnitPrice = refillPrice

        if (isLoaned) {
          newUnitPrice += currentLoanRate
          newLoanTotal += currentLoanRate
        }

        newRefillTotal += refillPrice

        return {
          id: item.id,
          unit_price: newUnitPrice
        }
      })

      const res = await updateOxygenReceptionPrices(reception.id, {
        refill_amount: newRefillTotal,
        loan_amount: newLoanTotal,
        items: itemUpdates
      })

      if (res.error) throw new Error(res.error)

      toast.success('Prices Updated', `Reception recalculated using Loan Rate RM ${currentLoanRate.toFixed(2)}`)
      setSelectedReception(null) // Close modal to refresh data view
      void loadData()

    } catch (err) {
      console.error(err)
      toast.error('Error', 'Failed to recalculate prices')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!hospitalId) return
    setIsSavingSettings(true)

    try {
      // 1. Update individual refill prices
      const pricePromises = Object.entries(editingPrices).map(([code, price]) => {
        return updateOxygenPricing(hospitalId, {
          hospital_id: hospitalId,
          cylinder_size_code: code,
          refill_price: price,
          effective_from: new Date().toISOString().split('T')[0]
        })
      })

      // 2. Update system settings (loan rate)
      const settingsPromise = updateOxygenSystemSettings({
        hospital_id: hospitalId,
        loan_cylinder_rate: editingLoanRate
      })

      const results = await Promise.all([...pricePromises, settingsPromise])
      const error = results.find(r => r.error)?.error

      if (error) throw new Error(error)

      toast.success('Settings Updated', 'Pricing calculations have been refreshed.')
      setIsSettingsModalOpen(false)
      void loadData()
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleDeleteRecord = async (id: string, doNo: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete record ${doNo}? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await deleteOxygenReceptionRecord(id)
      if (res.error) throw new Error(res.error)
      toast.success('Deleted', `Record ${doNo} has been removed.`)
      void loadData()
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to delete record')
    }
  }

  const handleUpdateDate = async () => {
    if (!selectedReception || !editingDateValue) return

    try {
      const res = await updateOxygenReceptionRecord(selectedReception.id, {
        reception_date: editingDateValue
      })

      if (res.error) throw new Error(res.error)

      toast.success('Updated', 'Reception date has been corrected.')
      setIsEditingDate(false)

      // Refresh data
      void loadData()

      // Update local state for the modal
      setSelectedReception(prev => prev ? { ...prev, reception_date: editingDateValue } : null)
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'Failed to update date')
    }
  }

  // Handle PO Generation Effect
  useEffect(() => {
    if (!poGenerationData) return

    const generate = async () => {
      // Allow DOM to render
      await new Promise(resolve => setTimeout(resolve, 500))

      const element = document.getElementById('full-po-print-container')
      if (element) {
        try {
          const result = await mergePOWithSupplierDocs({
            poElement: element,
            poNumber: poGenerationData.record.delivery_order_no,
            // Note: Supplier certs can be passed here if available in the record relation
            accountDocumentUrl: null,
            mofCertificateUrl: null,
            bumiputeraRegistrationCertificateUrl: null
          })

          if (result.success && result.pdfBlob) {
            const url = URL.createObjectURL(result.pdfBlob)
            window.open(url, '_blank')
          } else {
            throw new Error(result.error || 'Unknown error during PDF generation')
          }
        } catch (error) {
          console.error('Failed to generate PO', error)
          toast.error('Error', 'Failed to generate Purchase Order PDF')
        }
      }
      setPoGenerationData(null)
    }

    void generate()
  }, [poGenerationData])

  // ... existing initializeVariantQuantities ...

  const handlePreviewPO = (record: OxygenReceptionRecordWithRelations) => {
    const items = record.items || []
    const loanItems = items.filter(item => !item.cylinder_size?.code?.toUpperCase().startsWith('P'))

    // Calculate effective loan rate from the record itself to support historical prices
    // Use current system setting for the report to ensure it matches user configuration
    let effectiveLoanRate = settings?.loan_cylinder_rate ?? 14.00

    /* 
    // Historical Logic override (Disabled per user request)
    if (loanItems.length > 0 && record.loan_amount !== undefined && record.loan_amount !== null && Number(record.loan_amount) > 0) {
      effectiveLoanRate = Number(record.loan_amount) / loanItems.length
    }
    */

    if (items.length === 0) {
      toast.error('Cannot Generate PO', 'This record has no items associated with it.')
      return
    }

    toast.info('Generating PDF...', 'Preparing Purchase Order documents. Please wait.')

    const groups: { cylinderType: string; items: any[]; totalAmount: number, initialBalance: number }[] = []
    let allocatedBalance = summary?.kpis?.total_allocation || 130000

    // 1. Group items dynamically by Size Code
    const groupedBySize = items.reduce((acc, item) => {
      const sizeCode = item.cylinder_size?.code || 'Unknown'
      if (!acc[sizeCode]) acc[sizeCode] = []
      acc[sizeCode].push(item)
      return acc
    }, {} as Record<string, any[]>)

    // 2. Create Refill POs for each size
    // Sort to keep hospital-owned (starting with P) first for consistent balance deduction
    Object.entries(groupedBySize)
      .sort(([codeA], [codeB]) => {
        const isPA = codeA.toUpperCase().startsWith('P')
        const isPB = codeB.toUpperCase().startsWith('P')
        if (isPA && !isPB) return -1
        if (!isPA && isPB) return 1
        return codeA.localeCompare(codeB)
      })
      .forEach(([sizeCode, matchingItems]) => {
        let refillTotal = 0
        const refillItems = matchingItems.map(item => {
          // Heuristic: If it doesn't start with 'P', it's a loan cylinder with a fee subtracted from combined unit_price
          const isLoanPrefix = !sizeCode.toUpperCase().startsWith('P')

          // History Safe Logic: Use the STORED price. 
          // If the user wants new prices, they MUST click "Update Prices" on the record first.
          const storedPrice = Number(item.unit_price || 0)
          const loanPart = isLoanPrefix ? effectiveLoanRate : 0

          // Refill Price = Stored Price - Loan Part (if applicable)
          // We trust effectiveLoanRate is derived correctly from history or settings depending on strategy.
          // In "History Safe Mode" requested, effectiveLoanRate should ideally come from record too, 
          // BUT earlier we set effectiveLoanRate = settings?.loan_rate ?? 14.00. 
          // To be truly history safe for LOAN, we should use record.loan_amount / count if available.
          // However, user specifically complained about 14.00. 
          // Strategy: The "Update Prices" button fixes the record to match Current Settings.
          // So looking at Stored Price is correct.

          const refillPrice = isLoanPrefix ? (storedPrice - effectiveLoanRate) : storedPrice

          refillTotal += refillPrice
          return { ...item, unit_price: refillPrice } // Override for template display
        })

        if (refillTotal > 0) {
          const currentBalance = allocatedBalance
          allocatedBalance -= refillTotal

          groups.push({
            cylinderType: `Medical Oxygen - ${sizeCode}`,
            items: refillItems,
            totalAmount: refillTotal,
            initialBalance: currentBalance
          })
        }
      })

    // 3. Create Loan PO (Group final)
    // Consolidate ALL loan charges (already filtered above)
    if (loanItems.length > 0) {
      const totalLoanAmount = loanItems.length * effectiveLoanRate

      // For the Loan PO, we want the table to show "Loan Cylinder" as the item name
      // And the Unit Price should be the effective rate
      const displayLoanItems = loanItems.map(item => ({
        ...item,
        unit_price: effectiveLoanRate
      }))

      // Loan PO does NOT use the Refill allocation chain.
      // We pass undefined (or generic 0 logic in template needs handling)
      // User requested: "EXCEPT the LOAN... it using different money"
      // Template will show dashes if undefined.
      groups.push({
        cylinderType: 'LOAN CYLINDER / SEWAAN SILINDER',
        items: displayLoanItems,
        totalAmount: totalLoanAmount,
        initialBalance: undefined as any // Force undefined for template check
      })
    }

    setPoGenerationData({
      record,
      groups: groups
    })
  }

  const handlePreviewReport = (record: OxygenReceptionRecordWithRelations) => {
    toast.info('Generating PDF...', 'Preparing Official Reception Report...')
    const doc = new jsPDF()

    // Compact Layout Constants
    const pageWidth = doc.internal.pageSize.width
    const margin = 10 // Reduced margin to make use of full A4 width

    // Classification: Refill Hospital (starting with 'P') vs Loan Cylinder (others)
    const refillHospitalItems = record.items?.filter(i => i.cylinder_size?.code?.toUpperCase().startsWith('P')) || []
    const loanCylinderItems = record.items?.filter(i => !i.cylinder_size?.code?.toUpperCase().startsWith('P')) || []

    // Calculate effective loan rate from the record itself (historical accuracy)
    // Use current system setting for the report to ensure it matches user configuration
    // (Even if the record was saved with an older price)
    let effectiveLoanRate = settings?.loan_cylinder_rate ?? 14.00

    /* 
    // Historical Logic (Disabled per user request to follow current settings)
    if (loanCylinderItems.length > 0 && record.loan_amount !== undefined && record.loan_amount !== null && Number(record.loan_amount) > 0) {
      effectiveLoanRate = Number(record.loan_amount) / loanCylinderItems.length
    }
    */

    // Correct Pricing Logic: unit_price in DB includes the loan fee if it's a loan cylinder.
    // HISTORY SAFE MODE: Use stored values.
    const refillHospitalTotal = refillHospitalItems.reduce((sum, item) => sum + (item.unit_price || 0), 0)
    const refillLoanTotal = loanCylinderItems.reduce((sum, item) => sum + (Number(item.unit_price || 0) - effectiveLoanRate), 0)
    const loanFeesTotal = loanCylinderItems.length * effectiveLoanRate
    const grandTotal = refillHospitalTotal + refillLoanTotal + loanFeesTotal

    // Helper to chunk arrays
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = []
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
      }
      return chunks
    }

    const renderHeader = (doc: jsPDF) => {
      // Professional Logo Size & Position (Filling more space)
      doc.addImage(JATA_LOGO_BASE64, 'PNG', pageWidth / 2 - 10, 8, 20, 20)

      doc.setFont("times", "bold")
      doc.setFontSize(14)
      doc.text("KEMENTERIAN KESIHATAN MALAYSIA", pageWidth / 2, 34, { align: 'center' })
      doc.setFontSize(11)
      doc.text("HOSPITAL DAERAH LAWAS", pageWidth / 2, 40, { align: 'center' })

      doc.setFontSize(13)
      doc.text("LAPORAN PENERIMAAN BEKALAN GAS PERUBATAN", pageWidth / 2, 50, { align: 'center' })
      doc.setFontSize(10)
      doc.text("(KEW.PS-3)", pageWidth / 2, 55, { align: 'center' })
    }

    const generatePage = (items: typeof record.items) => {
      renderHeader(doc)

      // Professional Info Block (Optimized)
      const startY = 62
      autoTable(doc, {
        startY: startY,
        body: [
          ["NO. PESANAN / DO:", record.delivery_order_no?.toUpperCase() || '-'],
          ["TARIKH TERIMA:", formatDate(record.reception_date).toUpperCase()],
          ["DITERIMA OLEH:", (record.created_by_user?.full_name || 'SYSTEM').toUpperCase()],
          ["KOD UNDI / AKTIVITI:", `${record.vote_code || '080702'} / ${record.vote_activity || '27402'}`]
        ],
        theme: 'plain',
        styles: { font: 'times', fontSize: 10, cellPadding: 1.0 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 100 } },
        margin: { left: margin, right: margin }
      })

      // Group all items by Size Code
      const groupedItems = items?.reduce((acc, item) => {
        const key = item.cylinder_size?.code || 'Unknown'
        if (!acc[key]) {
          acc[key] = {
            code: key,
            qr_codes: [],
            count: 0,
            unit_refill_combined: item.unit_price || 0
          }
        }
        acc[key].qr_codes.push(item.cylinder?.qr_code || '-')
        acc[key].count += 1
        return acc
      }, {} as Record<string, { code: string, qr_codes: string[], count: number, unit_refill_combined: number }>)

      const tableBody: any[] = []
      let rowIdx = 1

      // Sort: Hospital first (P*) then others
      Object.values(groupedItems || {})
        .sort((a, b) => {
          const aP = a.code.toUpperCase().startsWith('P')
          const bP = b.code.toUpperCase().startsWith('P')
          if (aP && !bP) return -1
          if (!aP && bP) return 1
          return a.code.localeCompare(b.code)
        })
        .forEach((group) => {
          const isLoanPrefix = !group.code.toUpperCase().startsWith('P')
          const refillRate = isLoanPrefix ? (group.unit_refill_combined - effectiveLoanRate) : group.unit_refill_combined

          // Split QR codes into chunks of 10 to prevent row height overflow
          const qrChunks = chunkArray(group.qr_codes, 10)

          qrChunks.forEach((chunkElements, chunkIdx) => {
            const qrList = chunkElements.join(', ')
            const isFirstChunk = chunkIdx === 0
            const typeLabel = `${group.code}\n(REFILL)${isFirstChunk ? '' : ' (samb.)'}`

            if (isLoanPrefix) {
              // Row index only for the very first chunk of the REFILL line
              const rowNum = isFirstChunk ? rowIdx++ : ''

              tableBody.push([
                rowNum,
                typeLabel,
                qrList,
                isFirstChunk ? group.count + " UNIT" : '',
                isFirstChunk ? formatCurrency(refillRate) : '',
                isFirstChunk ? formatCurrency(group.count * refillRate) : ''
              ])
            } else {
              const rowNum = isFirstChunk ? rowIdx++ : ''
              const ownerTypeLabel = `${group.code}${isFirstChunk ? '' : ' (samb.)'}`

              tableBody.push([
                rowNum,
                ownerTypeLabel,
                qrList,
                isFirstChunk ? group.count + " UNIT" : '',
                isFirstChunk ? formatCurrency(refillRate) : '',
                isFirstChunk ? formatCurrency(group.count * refillRate) : ''
              ])
            }
          })

          // Add Rental Row if it's a loan cylinder (only once per group)
          if (isLoanPrefix) {
            tableBody.push([
              rowIdx++,
              `${group.code}\n(SEWAAN)`,
              "CAJ PINJAMAN / SEWAAN SILINDER",
              group.count + " UNIT",
              formatCurrency(effectiveLoanRate),
              formatCurrency(group.count * effectiveLoanRate)
            ])
          }
        })

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['BIL', 'JENIS / SAIZ', 'NO. SIRI / QR CODE', 'KUANTITI', 'KADAR (RM)', 'AMAUN (RM)']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', font: 'times', fontSize: 10 },
        styles: { font: 'times', fontSize: 9.5, cellPadding: 1.6, valign: 'middle', overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 'auto', fontSize: 8.5 }, // Clearer QR codes
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: margin, right: margin }
      })

      let finalY = (doc as any).lastAutoTable.finalY + 10
      const pageHeight = doc.internal.pageSize.height
      const requiredSpace = 90 // Approx space for Summary + Signatures

      // Check if we have enough space for Summary + Signatures, otherwise add new page
      if (finalY + requiredSpace > pageHeight - margin) {
        doc.addPage()
        finalY = 40 // Reset Y to top margin
      }

      // Professional Summary Block
      doc.setFontSize(11)
      doc.setFont("times", "bold")
      doc.text("RINGKASAN AMAUN KESELURUHAN", margin, finalY)
      finalY += 2
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, finalY, pageWidth - margin, finalY)
      finalY += 7

      doc.setFont("times", "normal")
      doc.setFontSize(10)

      doc.text(`1. JUMLAH REFILL HOSPITAL [${refillHospitalItems.length} UNIT]:`, margin, finalY)
      doc.text(formatCurrency(refillHospitalTotal), pageWidth - margin, finalY, { align: 'right' })
      finalY += 7

      doc.text(`2. JUMLAH REFILL (LOAN) [${loanCylinderItems.length} UNIT]:`, margin, finalY)
      doc.text(formatCurrency(refillLoanTotal), pageWidth - margin, finalY, { align: 'right' })
      finalY += 7

      doc.text(`3. JUMLAH SEWAAN (LOAN) [${loanCylinderItems.length} UNIT @ ${formatCurrency(effectiveLoanRate)}]:`, margin, finalY)
      doc.text(formatCurrency(loanFeesTotal), pageWidth - margin, finalY, { align: 'right' })
      finalY += 9

      doc.setFont("times", "bold")
      doc.setFontSize(11)
      doc.text("JUMLAH BESAR (1 + 2 + 3):", margin, finalY)
      doc.text(formatCurrency(grandTotal), pageWidth - margin, finalY, { align: 'right' })
      finalY += 14

      // Signature Block (Optimized)
      const currentY = finalY
      doc.setFontSize(10)
      doc.setFont("times", "normal")
      doc.text("Disediakan Oleh (Pegawai Penerima):", margin, currentY)
      doc.line(margin, currentY + 14, margin + 55, currentY + 14)
      doc.text(`Nama: ${(record.created_by_user?.full_name || '').toUpperCase()}`, margin, currentY + 20)
      doc.text("Jawatan: ...............................................", margin, currentY + 26)
      doc.text(`Tarikh: ${formatDate(new Date())}`, margin, currentY + 32)

      const rightColX = pageWidth / 2 + 5
      doc.text("Disahkan Oleh (Ketua Unit):", rightColX, currentY)
      doc.line(rightColX, currentY + 14, rightColX + 55, currentY + 14)
      doc.text("Nama: ...................................................", rightColX, currentY + 20)
      doc.text("Jawatan: ...............................................", rightColX, currentY + 26)
      doc.text("Tarikh: .................................................", rightColX, currentY + 32)

      // Footer
      doc.setFontSize(6)
      doc.setFont("times", "italic")
    }

    // Execute combined 1-page report
    generatePage(record.items || [])

    doc.save(`Reception_Report_${record.delivery_order_no}.pdf`)
    toast.success('Official PDF Generated', 'Combined 1-page report generated.')
  }

  const recordsColumns: Column<OxygenReceptionRecordWithRelations>[] = [
    { key: 'reception_date', label: 'Date', render: (val) => formatDate(String(val)) },
    { key: 'delivery_order_no', label: 'DO No', className: 'font-bold' },
    { key: 'sales_order_no', label: 'SO No', render: (val) => (val as string) || '-' },
    {
      key: 'refill_amount',
      label: 'Refill (RM)',
      className: 'text-right',
      render: (_, row) => {
        const refillTotal = row.items?.reduce((sum, item) => {
          const isLoan = !item.cylinder_size?.code?.toUpperCase().startsWith('P')
          return sum + (Number(item.unit_price || 0) - (isLoan ? 14.00 : 0))
        }, 0) || 0
        return formatCurrency(refillTotal)
      }
    },
    {
      key: 'loan_amount',
      label: 'Loan (RM)',
      className: 'text-right',
      render: (_, row) => {
        const loanItems = row.items?.filter(i => !i.cylinder_size?.code?.toUpperCase().startsWith('P')) || []
        const loanTotal = loanItems.length * 14.00
        return formatCurrency(loanTotal)
      }
    },
    {
      key: 'id',
      label: '',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedReception(row)}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePreviewPO(row)} title="Generate Purchase Orders">
            PO
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePreviewReport(row)} title="Generate Reception Report">
            Report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteRecord(row.id, row.delivery_order_no)}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            title="Delete Record"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const kpis = summary?.kpis

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Welcome & Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Wind className="w-6 h-6 text-sky-600" />
                Oxygen Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Financial monitoring, cylinder reception, and tracking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsModalOpen(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-2 text-slate-500" />
                Pricing Settings
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Receive Oxygen
              </Button>
            </div>
          </div>
        </motion.div>


        {/* Financial KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Financial Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <StatCard
              title="Total Allocation"
              value={formatCurrency(kpis?.total_allocation || 0)}
              subtitle={`FY ${new Date().getFullYear()} (080702 / 27402)`}
              icon={DollarSign}
              color="primary"
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(kpis?.expense || 0)}
              subtitle="Refill & Service costs"
              icon={TrendingUp}
              color="purple"
            />
            <StatCard
              title="Liabilities"
              value={formatCurrency(kpis?.liabilities || 0)}
              subtitle="Pending invoices"
              icon={AlertCircle}
              color="warning"
            />
            <StatCard
              title="Current Balance"
              value={formatCurrency(kpis?.balance || 0)}
              subtitle="Remaining allocation"
              icon={DollarSign}
              color="success"
            />
            <StatCard
              title="Loan Charges"
              value={formatCurrency(kpis?.loan_total || 0)}
              subtitle="Private cylinder fees"
              icon={Truck}
              color="info"
            />
          </div>
        </div>

        {/* Analytics Section */}
        <OxygenAnalytics />

        {/* Recent Receptions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col pt-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-sky-600" />
              Recent Receptions
            </h3>
            <Button variant="ghost" size="sm" className="text-xs text-sky-600 hover:text-sky-700">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="p-0">
            <Table
              data={receptions}
              columns={recordsColumns}
              isLoading={isLoading}
              emptyMessage="No reception records found"
              onRowClick={(row) => setSelectedReception(row)}
            />
          </div>
        </motion.div>

        {/* Modal for Reception */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record New Oxygen Reception"
          size="full"
          className="max-w-5xl"
        >
          <div className="flex h-full flex-col bg-slate-50/50">
            {/* 1. Top Section: Document Details (Ultra Compact) */}
            <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
                  <div className="h-3 w-1 rounded-full bg-sky-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Doc Info</h4>
                </div>

                <div className="flex flex-1 items-center gap-4">
                  <div className="relative group flex-1">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <Input
                        placeholder="Delivery Order No *"
                        value={formData.delivery_order_no}
                        onChange={e => setFormData({ ...formData, delivery_order_no: e.target.value })}
                        className="h-8 border-slate-200 pl-8 text-xs font-bold transition-all focus:border-sky-500 focus:ring-sky-500/10 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div className="relative group flex-1">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <Input
                        placeholder="Sales Order No"
                        value={formData.sales_order_no}
                        onChange={e => setFormData({ ...formData, sales_order_no: e.target.value })}
                        className="h-8 border-slate-200 pl-8 text-xs font-bold transition-all focus:border-sky-500 focus:ring-sky-500/10 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div className="relative w-40">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <Input
                      type="date"
                      value={formData.reception_date}
                      onChange={e => setFormData({ ...formData, reception_date: e.target.value })}
                      className="h-8 border-slate-200 pl-8 text-xs font-bold transition-all focus:border-sky-500 focus:ring-sky-500/10"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* 2. Middle Section: Full Width Table (Scrollable & Dense) */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Scan Bar */}
              <div
                onClick={() => scanInputRef.current?.focus()}
                className="mb-4 flex cursor-text items-center gap-2 rounded-xl bg-slate-900 p-2 shadow-lg ring-offset-slate-900 transition-all focus-within:ring-2 focus-within:ring-sky-500/50"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsScannerOpen(true)
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 hover:scale-105 active:scale-95"
                >
                  <ScanLine className="h-4 w-4" />
                </button>
                <div className="flex-1">
                  <input
                    ref={scanInputRef}
                    autoFocus
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScan}
                    placeholder="Scan Cylinder QR Code here..."
                    className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <Badge className="border border-white/10 bg-white/5 text-[9px] font-bold text-slate-400">
                  Press Enter
                </Badge>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-1 rounded-full bg-emerald-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Cylinder Variants</h4>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400">Please enter received quantities</span>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Variant</th>
                      <th className="px-4 py-2 text-center">Type</th>
                      <th className="px-4 py-2 text-center">Refill</th>
                      <th className="px-4 py-2 text-center">Loan</th>
                      <th className="px-4 py-2 text-center w-32">Qty</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {variantQuantities.map((variant) => {
                      const subtotal = variant.quantity * (variant.refill_price + variant.loan_price)
                      const isActive = variant.quantity > 0

                      return (
                        <tr
                          key={variant.combo_id}
                          className={cn(
                            "transition-colors hover:bg-slate-50/80",
                            isActive && "bg-sky-50/30"
                          )}
                        >
                          <td className="px-4 py-1.5">
                            <div className="flex items-center gap-2">
                              {variant.is_loaned && (
                                <div title="Loan Cyl" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{variant.display_name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[9px] font-medium uppercase text-slate-400 leading-none">
                                    {variant.is_loaned ? 'Loaned' : 'Owned'}
                                  </p>
                                  {variant.scanned_ids.length > 0 && (
                                    <span className="text-[9px] font-bold text-purple-500 flex items-center gap-1">
                                      <ScanLine className="h-2 w-2" />
                                      {variant.scanned_ids.length} scanned
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-1.5 text-center">
                            <span className="inline-block rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                              {variant.type_name}
                            </span>
                          </td>
                          <td className="px-4 py-1.5 text-center tabular-nums text-slate-600 font-medium">
                            {formatCurrency(variant.refill_price)}
                          </td>
                          <td className="px-4 py-1.5 text-center tabular-nums">
                            {variant.is_loaned ? (
                              <span className="font-bold text-amber-600">{formatCurrency(variant.loan_price)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-1.5">
                            <div className="flex items-center justify-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm w-24 mx-auto">
                              <button
                                onClick={() => updateVariantQuantity(variant.combo_id, variant.quantity - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              >
                                ΓêÆ
                              </button>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={variant.quantity === 0 ? '' : variant.quantity}
                                placeholder="0"
                                onChange={e => {
                                  const val = parseInt(e.target.value)
                                  updateVariantQuantity(variant.combo_id, isNaN(val) ? 0 : val)
                                }}
                                className="mx-1 h-6 flex-1 border-none bg-transparent p-0 text-center font-bold text-slate-900 focus:ring-0 text-xs"
                              />
                              <button
                                onClick={() => updateVariantQuantity(variant.combo_id, variant.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded bg-sky-50 text-sky-600 hover:bg-sky-100"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-1.5 text-right font-black tabular-nums text-slate-900">
                            {isActive ? formatCurrency(subtotal) : <span className="text-slate-300">-</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Bottom Section: Sticky Footer Summary (Compact) */}
            <div className="border-t border-slate-800 bg-slate-900 p-0">
              <div className="mx-auto flex w-full items-center justify-between px-6 py-3">

                {/* Left: Unit Breakdown */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total</p>
                      <p className="text-xl font-black text-white leading-none">{variantTotals.totalUnits} <span className="text-[10px] text-slate-500">UNITS</span></p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70">Owned</p>
                      <p className="text-sm font-bold text-emerald-400 leading-none">{variantTotals.hospitalOwnedUnits}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70">Loaned</p>
                      <p className="text-sm font-bold text-amber-400 leading-none">{variantTotals.loanedUnits}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Financials + Actions */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-[10px] text-slate-500">Refill: {formatCurrency(variantTotals.refillTotal)}</span>
                      <span className="text-[10px] text-slate-500">Loan: {formatCurrency(variantTotals.loanTotal)}</span>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-white leading-none">{formatCurrency(variantTotals.grandTotal)}</p>
                  </div>

                  <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                      className="h-9 px-4 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateReception}
                      disabled={isSubmitting || variantTotals.totalUnits === 0}
                      className="h-9 px-6 rounded-lg bg-sky-600 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-900/20 hover:bg-sky-500"
                    >
                      {isSubmitting ? 'Processing...' : 'Submit'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Detail Modal for Reception - NEW COMPACT DESIGN */}
        <Modal
          isOpen={!!selectedReception}
          onClose={() => setSelectedReception(null)}
          title=""
          size="3xl"
        >
          {selectedReception && (() => {
            // Aggregate items by size for summary
            const itemSummary = selectedReception.items?.reduce((acc: any[], item: any) => {
              const key = `${item.cylinder_size?.code || 'N/A'}`;
              const existing = acc.find(i => i.key === key);
              if (existing) {
                existing.qty += 1;
                existing.total += Number(item.unit_price || 0);
              } else {
                acc.push({
                  key,
                  size: item.cylinder_size?.code || 'N/A',
                  type: item.cylinder_type?.name || 'Medical Oxygen',
                  unit_price: Number(item.unit_price || 0),
                  qty: 1,
                  total: Number(item.unit_price || 0)
                });
              }
              return acc;
            }, []) || [];

            const totalUnits = selectedReception.items?.length || 0;

            return (
              <div className="bg-white -m-6 -mt-4 font-sans text-slate-900">
                {/* Clean Header Bar - Compact */}
                <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase tracking-widest text-slate-400">Reception Record</p>
                      <h2 className="text-xl font-bold tracking-tight text-white">{selectedReception.delivery_order_no}</h2>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400">Date</p>
                          {isEditingDate ? (
                            <Input
                              type="date"
                              value={editingDateValue}
                              onChange={e => setEditingDateValue(e.target.value)}
                              className="h-7 border-slate-700 bg-slate-800 text-[11px] font-bold text-white w-32"
                            />
                          ) : (
                            <p className="text-sm font-bold text-white">{formatDate(selectedReception.reception_date)}</p>
                          )}
                        </div>
                        <div className="mt-4">
                          {isEditingDate ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleUpdateDate}
                                className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                title="Save"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditingDate(false)}
                                className="h-6 w-6 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                title="Cancel"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsEditingDate(true)
                                setEditingDateValue(selectedReception.reception_date)
                              }}
                              className="h-6 w-6 p-0 text-slate-500 hover:text-white hover:bg-white/10"
                              title="Edit Date"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Received By</p>
                        <p className="text-sm font-bold text-white">{selectedReception.created_by_user?.full_name || 'System'}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                        selectedReception.status === 'completed'
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      )}>
                        {selectedReception.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content - Dense */}
                <div className="space-y-5 p-5">
                  {/* Financial Summary Cards - Compact */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Units</p>
                      <p className="text-2xl font-black text-slate-900">{totalUnits}</p>
                      <p className="text-[9px] text-slate-500">Cylinders</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Refill Charges</p>
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedReception.refill_amount)}</p>
                      <p className="text-[9px] text-slate-500">Service cost</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Loan Fees</p>
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedReception.loan_amount)}</p>
                      <p className="text-[9px] text-slate-500">Rental cost</p>
                    </div>
                    <div className="rounded-xl bg-sky-600 p-3 text-white shadow-md shadow-sky-600/10">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-sky-200">Grand Total</p>
                      <p className="text-2xl font-black">{formatCurrency(selectedReception.total_amount)}</p>
                      <p className="text-[9px] text-sky-100">All inclusive</p>
                    </div>
                  </div>

                  {/* Items Summary Table - Dense */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                          <th className="w-20 px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                          <th className="w-28 px-4 py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Price</th>
                          <th className="w-28 px-4 py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {itemSummary.map((item: any) => (
                          <tr key={item.key} className="group transition-colors hover:bg-slate-50/50">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 transition-colors group-hover:bg-sky-100">
                                  <Wind className="h-4 w-4 text-sky-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{item.type}</p>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Size: {item.size}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="inline-flex h-6 w-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700 shadow-sm">
                                {item.qty}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-600">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2.5 text-right text-sm font-black text-slate-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cylinder Serial Numbers - Ultra Compact */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serial Numbers</h3>
                      <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[10px] font-bold text-slate-500">{totalUnits} units</span>
                    </div>

                    <div className="space-y-4">
                      {itemSummary.map((group: any) => {
                        const groupItems = selectedReception.items?.filter(
                          (i: any) => (i.cylinder_size?.code || 'N/A') === group.size
                        ) || []

                        return (
                          <div key={group.key} className="rounded-lg border border-slate-100 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between border-b border-slate-50 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                                <h4 className="text-[10px] font-black uppercase text-slate-700">{group.size}</h4>
                                <span className="ml-1 rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                  {group.type}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400">{groupItems.length} units</span>
                            </div>

                            {/* Scrollable Grid Container */}
                            <div className="custom-scrollbar max-h-32 overflow-y-auto pr-2">
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
                                {groupItems.map((item: any, idx: number) => (
                                  <div
                                    key={item.id}
                                    className="group cursor-default rounded border border-slate-100 bg-slate-50 p-2 text-center transition-all hover:border-sky-400 hover:shadow-sm"
                                    title={item.cylinder?.qr_code || item.qr_code}
                                  >
                                    <p className="mb-0.5 text-[9px] font-bold text-slate-300 transition-colors group-hover:text-sky-400">#{idx + 1}</p>
                                    <p className="break-all text-[10px] font-black leading-tight tracking-tight text-slate-700">{item.cylinder?.qr_code || item.qr_code}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Footer Actions - Compact */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                      <span>Vote: <strong className="text-slate-600">{selectedReception.vote_code || '080702'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Activity: <strong className="text-slate-600">{selectedReception.vote_activity || '27402'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>SO: <strong className="text-slate-600">{selectedReception.sales_order_no || '-'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRecalculatePrices(selectedReception)}
                        className="h-8 gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Update record to use current price settings"
                        disabled={isSubmitting}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                        Update Prices
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewPO(selectedReception)}
                        className="h-8 gap-2 text-xs font-bold"
                        title="Generate Purchase Orders"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PO
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewReport(selectedReception)}
                        className="h-8 gap-2 text-xs font-bold"
                        title="Generate Reception Report"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Report
                      </Button>
                      <Button
                        onClick={() => setSelectedReception(null)}
                        size="sm"
                        className="h-8 bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Pricing Settings Modal */}
        <Modal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          title="Oxygen Pricing & Rates"
          size="lg"
        >
          <div className="space-y-6 p-1">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-1 rounded-full bg-sky-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Refill Price (by Size)</h4>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {prices.map(price => (
                  <div key={price.id} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700">{price.cylinder_size_code}</p>
                      <p className="text-[10px] text-slate-400">Standard refill rate</p>
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">RM</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingPrices[price.cylinder_size_code] || ''}
                          onChange={e => setEditingPrices({
                            ...editingPrices,
                            [price.cylinder_size_code]: Number(e.target.value)
                          })}
                          className="h-8 pl-9 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-1 rounded-full bg-amber-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Cylinder Loan Rate</h4>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">Fixed Loan Fee</p>
                    <p className="text-[10px] text-slate-400">Applicable to all loaned cylinders</p>
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">RM</span>
                      <Input
                        type="number"
                        step="0.10"
                        value={editingLoanRate}
                        onChange={e => setEditingLoanRate(Number(e.target.value))}
                        className="h-8 pl-9 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm"
              >
                {isSavingSettings ? (
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-2" />
                )}
                Save Pricing Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Camera Scanner Modal */}
        {
          isScannerOpen && (
            <QRScanner
              onScan={(result) => {
                if (result) {
                  processBarcode(result)
                  setIsScannerOpen(false)
                }
              }}
              onClose={() => setIsScannerOpen(false)}
            />
          )
        }
        {/* Hidden PO Print Templates (used by PDF generator) */}
        {/* We use an off-screen container instead of display:none to ensure browser renders it properly for capture */}
        <div
          style={{ position: 'fixed', left: '-10000px', top: '0', zIndex: -100, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <div id="full-po-print-container">
            {poGenerationData?.groups.map((group: any, idx: number) => (
              <OxygenPurchaseOrderTemplate
                key={idx}
                reception={poGenerationData.record}
                items={group.items}
                cylinderType={group.cylinderType}
                totalAmount={group.totalAmount}
                id={`po-template-${idx}`}
                className="block"
                signatures={signatures}
                initialBalance={group.initialBalance}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OxygenDashboardPage;
