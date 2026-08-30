// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  ArrowLeft, 
  Search, 
  Calendar, 
  TrendingUp, 
  User, 
  MapPin, 
  Clock, 
  Printer, 
  Layers, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Download,
  Filter,
  Building2,
  PackageCheck,
  PackageMinus,
  Building,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  PlusCircle,
  MinusCircle,
  Package,
  Tag,
  Truck,
  Hash,
  Sparkles,
  Lock,
  Pencil,
  ClipboardCheck,
  History,
  RotateCcw,
  Trash2,
  FastForward,
  ShieldCheck,
  Scale,
  FileCheck,
  CheckCheck,
  AirVent,
  Activity,
  Boxes,
  Database
} from 'lucide-react'
import jsQR from 'jsqr'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { Table, Spinner, Input, Badge, Select, Button, Modal } from '@/components/ui'
import { ROUTES } from '@/shared/constants/routes'
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64'
import { 
  getCylinderLedgerItems,
  getCylinderTransactions,
  recordCylinderReceiptTransaction,
  recordCylinderIssueTransaction,
  recordCylinderCheckFoundTransaction,
  recordCylinderBringForwardTransaction,
  recordCylinderStoreVerification,
  getCylinderStoreVerificationHistory,
  deleteCylinderStoreVerificationRecord,
  getCylinderDepartmentBreakdown,
  clearCylinderTransactions,
  type CylinderLedgerItem,
  type CylinderTransactionRow,
  type CylinderDeptBreakdown,
  type CylinderStoreVerificationRecord
} from '../../services/cylinderKewPs4Service'

const DEFAULT_GAS_SUPPLIERS = [
  { id: 'sup-gas-001', company_name: 'Linde EOX Sdn Bhd (Caw. Miri)', supplier_code: 'SUP-LINDE-01' },
  { id: 'sup-gas-002', company_name: 'Borneo Indah Sdn Bhd', supplier_code: 'SUP-BORNEO-02' },
  { id: 'sup-gas-003', company_name: 'Smart Gas & Engineering Sdn Bhd', supplier_code: 'SUP-SMARTGAS-03' },
  { id: 'sup-gas-004', company_name: 'Air Products Malaysia Sdn Bhd', supplier_code: 'SUP-AIRPROD-04' },
  { id: 'sup-gas-005', company_name: 'Southern Oxygen Sdn Bhd', supplier_code: 'SUP-SOXY-05' }
]

const CLINICAL_WARM_DEPARTMENTS = [
  'Emergency & Trauma Dept (ETD)',
  'Intensive Care Unit (ICU)',
  'Dewan Bedah (Operation Theater)',
  'Wad Lelaki (General Ward)',
  'Wad Perempuan & Bersalin',
  'Wad Pediatrik (Kanak-kanak)',
  'Klinik Rawatan Harian (Daycare)',
  'Klinik Kesihatan Lawas (Zon Luar)',
  'Klinik Kesihatan Sundar',
  'Klinik Kesihatan Merapok',
  'Unit Hemodialisis',
  'Bilik Isolasi Bertekanan Negatif'
]

export const CylinderKewPs4LedgerPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { language } = useLanguage()
  const hospitalId = user?.hospital_id || 'hosp-lawas-001'

  // Data states
  const [cylinderItems, setCylinderItems] = useState<CylinderLedgerItem[]>([])
  const [selectedSizeId, setSelectedSizeId] = useState<string>('size-004')
  const [selectedItem, setSelectedItem] = useState<CylinderLedgerItem | null>(null)
  const [ledgerRows, setLedgerRows] = useState<CylinderTransactionRow[]>([])
  const [deptBreakdown, setDeptBreakdown] = useState<CylinderDeptBreakdown[]>([])
  const [storeVerificationLogs, setStoreVerificationLogs] = useState<CylinderStoreVerificationRecord[]>([])

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [activeDatePreset, setActiveDatePreset] = useState<'today' | 'week' | 'month' | '3months' | 'all'>('all')
  const [selectedTxType, setSelectedTxType] = useState<string>('all')
  const [selectedWard, setSelectedWard] = useState<string>('all')
  const [refSearch, setRefSearch] = useState<string>('')

  // UI Loading States
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Mobile responsive UI states
  const [mobileTab, setMobileTab] = useState<'ledger' | 'summary' | 'departments'>('ledger')
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState<boolean>(false)

  // Check & Found Modal State (Semakan & Penemuan)
  const [isCheckFoundModalOpen, setIsCheckFoundModalOpen] = useState(false)
  const [checkFoundPhysicalQty, setCheckFoundPhysicalQty] = useState('')
  const [checkFoundDate, setCheckFoundDate] = useState(() => new Date().toISOString().split('T')[0])
  const [checkFoundOfficer, setCheckFoundOfficer] = useState('')
  const [checkFoundRemarks, setCheckFoundRemarks] = useState('')
  const [isSubmittingCheckFound, setIsSubmittingCheckFound] = useState(false)
  const [checkFoundStatus, setCheckFoundStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Bring Forward Modal State (Bawa Ke Hadapan)
  const [isBringForwardModalOpen, setIsBringForwardModalOpen] = useState(false)
  const [bfQty, setBfQty] = useState('')
  const [bfPeriodType, setBfPeriodType] = useState<'previous_year' | 'previous_month' | 'initial_balance'>('previous_year')
  const [bfRefNum, setBfRefNum] = useState('')
  const [bfDate, setBfDate] = useState(() => new Date().toISOString().split('T')[0])
  const [bfOfficer, setBfOfficer] = useState('')
  const [bfRemarks, setBfRemarks] = useState('')
  const [isSubmittingBf, setIsSubmittingBf] = useState(false)
  const [bfStatus, setBfStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Store Verification Modal State (KEW.PS-14 Verifikasi Stor Tahunan)
  const [isStoreVerificationModalOpen, setIsStoreVerificationModalOpen] = useState(false)
  const [verificationYear, setVerificationYear] = useState<number>(() => new Date().getFullYear())
  const [verificationPhysicalCount, setVerificationPhysicalCount] = useState<string>('')
  const [verificationVerifierName, setVerificationVerifierName] = useState<string>('')
  const [verificationVerifierIc, setVerificationVerifierIc] = useState<string>('')
  const [verificationVerifierJawatan, setVerificationVerifierJawatan] = useState<string>('Pegawai Farmasi Kanan (Penguatkuasa Luar)')
  const [verificationDate, setVerificationDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [verificationRemarks, setVerificationRemarks] = useState<string>('')
  const [isVerificationCertified, setIsVerificationCertified] = useState<boolean>(false)
  const [isSubmittingVerification, setIsSubmittingVerification] = useState<boolean>(false)
  const [verificationStatus, setVerificationStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isVerificationHistoryModalOpen, setIsVerificationHistoryModalOpen] = useState(false)

  // Reset & Clear Ledger State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [clearPasswordInput, setClearPasswordInput] = useState('')
  const [clearScope, setClearScope] = useState<'selected' | 'all'>('selected')
  const [isSubmittingClear, setIsSubmittingClear] = useState(false)
  const [clearStatus, setClearStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // QR Scanner Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrScanResult, setQrScanResult] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Load catalog items on mount
  const loadCatalog = async () => {
    setIsLoadingCatalog(true)
    const res = await getCylinderLedgerItems(hospitalId)
    if (res.data && res.data.length > 0) {
      setCylinderItems(res.data)
      const target = res.data.find(i => i.size_id === selectedSizeId || i.id === selectedSizeId || i.item_code === '101-N') || res.data[0]
      if (target) {
        setSelectedSizeId(target.size_id || target.id)
        setSelectedItem(target)
      }
    }
    setIsLoadingCatalog(false)
  }

  useEffect(() => {
    loadCatalog()
  }, [hospitalId])

  // Load ledger details whenever selected size or filters change
  const loadLedgerDetails = async () => {
    if (!selectedSizeId) return
    setIsLoadingDetails(true)

    const [txRes, deptRes, verRes] = await Promise.all([
      getCylinderTransactions(hospitalId, {
        sizeId: selectedSizeId,
        transaction_type: selectedTxType,
        date_from: dateFrom,
        date_to: dateTo,
        search_query: refSearch,
        ward_name: selectedWard
      }),
      getCylinderDepartmentBreakdown(hospitalId, selectedSizeId, dateFrom, dateTo),
      getCylinderStoreVerificationHistory(hospitalId, selectedSizeId)
    ])

    if (txRes.data) {
      setLedgerRows(txRes.data)
    }
    if (deptRes.data) {
      setDeptBreakdown(deptRes.data)
    }
    if (verRes.data) {
      setStoreVerificationLogs(verRes.data)
    }

    setIsLoadingDetails(false)
  }

  useEffect(() => {
    loadLedgerDetails()
  }, [selectedSizeId, selectedTxType, dateFrom, dateTo, refSearch, selectedWard, hospitalId])

  // Handle Size Selection
  const handleSelectSize = (item: CylinderLedgerItem) => {
    setSelectedSizeId(item.size_id || item.id)
    setSelectedItem(item)
    setIsMobileSearchExpanded(false)
  }

  // Date Preset Helpers
  const applyDatePreset = (preset: 'today' | 'week' | 'month' | '3months' | 'all') => {
    setActiveDatePreset(preset)
    const now = new Date()
    const toStr = now.toISOString().split('T')[0]
    setDateTo(toStr)

    if (preset === 'today') {
      setDateFrom(toStr)
    } else if (preset === 'week') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      setDateFrom(d.toISOString().split('T')[0])
    } else if (preset === 'month') {
      const d = new Date()
      d.setMonth(d.getMonth() - 1)
      setDateFrom(d.toISOString().split('T')[0])
    } else if (preset === '3months') {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      setDateFrom(d.toISOString().split('T')[0])
    } else {
      setDateFrom('')
      setDateTo('')
    }
  }

  // Stock Balance Calculations
  const currentStockBalance = useMemo(() => {
    if (ledgerRows && ledgerRows.length > 0) {
      return ledgerRows[0].runningBalance
    }
    return selectedItem?.current_stock || 0
  }, [ledgerRows, selectedItem])

  const stockPercentage = useMemo(() => {
    if (!selectedItem) return 0
    const max = selectedItem.max_stock || 100
    return Math.min(Math.round((currentStockBalance / max) * 100), 100)
  }, [selectedItem, currentStockBalance])

  const isLowStock = useMemo(() => {
    if (!selectedItem) return false
    return currentStockBalance <= (selectedItem.min_stock || 0)
  }, [selectedItem, currentStockBalance])

  // Filter items in catalog search
  const filteredCatalogItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return cylinderItems
    return cylinderItems.filter(item =>
      item.item_code.toLowerCase().includes(q) ||
      item.item_name.toLowerCase().includes(q) ||
      item.gas_type.toLowerCase().includes(q)
    )
  }, [cylinderItems, searchQuery])

  // Total fleet metrics
  const totalFleetCount = useMemo(() => {
    return cylinderItems.reduce((sum, item) => sum + (item.total_fleet || 0), 0)
  }, [cylinderItems])

  const totalFullCentral = useMemo(() => {
    return cylinderItems.reduce((sum, item) => sum + (item.current_stock || 0), 0)
  }, [cylinderItems])

  const totalInUseWards = useMemo(() => {
    return cylinderItems.reduce((sum, item) => sum + (item.in_use_stock || 0), 0)
  }, [cylinderItems])

  const lowStockAlertCount = useMemo(() => {
    return cylinderItems.filter(i => i.current_stock <= (i.min_stock || 0)).length
  }, [cylinderItems])

  // ==========================================
  // HANDLERS FOR ACTIONS & MODALS
  // ==========================================

  // Open Check & Found Modal
  const openCheckFoundModal = () => {
    setCheckFoundPhysicalQty(currentStockBalance.toString())
    setCheckFoundDate(new Date().toISOString().split('T')[0])
    setCheckFoundOfficer(user?.full_name || 'Pegawai Pemeriksa Stor')
    setCheckFoundRemarks('Semakan Kiraan Stok Fizikal Silinder / Audit Dalaman')
    setCheckFoundStatus(null)
    setIsCheckFoundModalOpen(true)
  }

  const handleSubmitCheckFound = async (e: React.FormEvent) => {
    e.preventDefault()
    const physical = parseInt(checkFoundPhysicalQty, 10)
    if (isNaN(physical) || physical < 0) {
      setCheckFoundStatus({ type: 'error', text: 'Sila masukkan kuantiti fizikal yang sah (≥ 0).' })
      return
    }

    setIsSubmittingCheckFound(true)
    setCheckFoundStatus(null)

    const res = await recordCylinderCheckFoundTransaction(hospitalId, {
      size_id: selectedSizeId,
      item_code: selectedItem?.item_code,
      item_name: selectedItem?.item_name,
      physical_quantity: physical,
      officer_name: checkFoundOfficer.trim() || (user?.full_name || 'Pegawai Pemeriksa Stor'),
      check_date: checkFoundDate,
      remarks: checkFoundRemarks.trim() || undefined
    })

    setIsSubmittingCheckFound(false)
    if (res.error) {
      setCheckFoundStatus({ type: 'error', text: res.error })
    } else {
      setCheckFoundStatus({ type: 'success', text: 'Pelarasan semakan fizikal berjaya disimpan dan dikemaskini dalam lejar!' })
      await loadLedgerDetails()
      await loadCatalog()
      setTimeout(() => setIsCheckFoundModalOpen(false), 1200)
    }
  }

  // Open Bring Forward Modal
  const openBringForwardModal = (initialQty?: string) => {
    setBfQty(initialQty || currentStockBalance.toString())
    setBfPeriodType('previous_year')
    setBfRefNum(`BF-${new Date().getFullYear()}/01`)
    setBfDate(new Date().toISOString().split('T')[0])
    setBfOfficer(user?.full_name || 'Pegawai Stor Oksigen')
    setBfRemarks(`Baki bawa ke hadapan bagi silinder saiz ${selectedItem?.item_code || ''}`)
    setBfStatus(null)
    setIsBringForwardModalOpen(true)
  }

  const handleSubmitBringForward = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(bfQty, 10)
    if (isNaN(qty) || qty < 0) {
      setBfStatus({ type: 'error', text: 'Sila masukkan kuantiti baki yang sah (≥ 0).' })
      return
    }

    setIsSubmittingBf(true)
    setBfStatus(null)

    const res = await recordCylinderBringForwardTransaction(hospitalId, {
      size_id: selectedSizeId,
      item_code: selectedItem?.item_code,
      item_name: selectedItem?.item_name,
      balance_quantity: qty,
      period_type: bfPeriodType,
      ref_number: bfRefNum.trim(),
      bf_date: bfDate,
      officer_name: bfOfficer.trim() || (user?.full_name || 'Pegawai Stor Oksigen'),
      remarks: bfRemarks.trim() || undefined
    })

    setIsSubmittingBf(false)
    if (res.error) {
      setBfStatus({ type: 'error', text: res.error })
    } else {
      setBfStatus({ type: 'success', text: `Baki pembukaan sebanyak ${qty} tabung berjaya direkodkan dalam lejar!` })
      await loadLedgerDetails()
      await loadCatalog()
      setTimeout(() => setIsBringForwardModalOpen(false), 1200)
    }
  }

  // Open Store Verification Modal (KEW.PS-14)
  const openStoreVerificationModal = () => {
    setVerificationYear(new Date().getFullYear())
    setVerificationPhysicalCount(currentStockBalance.toString())
    setVerificationVerifierName(user?.full_name || 'Dr. Ahmad Razif (JKN Sarawak)')
    setVerificationVerifierIc('820412-13-5491')
    setVerificationVerifierJawatan('Pegawai Farmasi Kanan (Penguatkuasa Luar)')
    setVerificationDate(new Date().toISOString().split('T')[0])
    setVerificationRemarks('Verifikasi Stor Tahunan Silinder Oksigen mengikut tatacara KEW.PS-14')
    setIsVerificationCertified(false)
    setVerificationStatus(null)
    setIsStoreVerificationModalOpen(true)
  }

  const handleSubmitStoreVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    const phys = parseInt(verificationPhysicalCount, 10)
    if (isNaN(phys) || phys < 0) {
      setVerificationStatus({ type: 'error', text: 'Sila masukkan kuantiti semakan fizikal yang sah.' })
      return
    }
    if (!verificationVerifierName.trim()) {
      setVerificationStatus({ type: 'error', text: 'Sila masukkan Nama Pegawai Pemverifikasi Luar.' })
      return
    }
    if (!isVerificationCertified) {
      setVerificationStatus({ type: 'error', text: 'Sila tandakan pengesahan perakuan sebelum menyimpan.' })
      return
    }

    setIsSubmittingVerification(true)
    setVerificationStatus(null)

    const res = await recordCylinderStoreVerification(hospitalId, {
      size_id: selectedSizeId,
      item_code: selectedItem?.item_code || '101-N',
      item_name: selectedItem?.item_name || 'Medical Oxygen Cylinder',
      verification_year: verificationYear,
      physical_count: phys,
      kewps_balance: currentStockBalance,
      system_count: currentStockBalance,
      verifier_name: verificationVerifierName.trim(),
      verifier_ic: verificationVerifierIc.trim() || undefined,
      verifier_jawatan: verificationVerifierJawatan.trim() || undefined,
      verified_at: verificationDate,
      remarks: verificationRemarks.trim() || undefined
    })

    setIsSubmittingVerification(false)
    if (res.error) {
      setVerificationStatus({ type: 'error', text: res.error })
    } else {
      setVerificationStatus({ type: 'success', text: `Verifikasi Stor Tahunan ${verificationYear} berjaya disahkan dan direkodkan!` })
      await loadLedgerDetails()
      await loadCatalog()
      setTimeout(() => setIsStoreVerificationModalOpen(false), 1200)
    }
  }

  // Clear / Reset Ledger
  const handleClearLedger = async () => {
    if (clearPasswordInput !== 'home123' && clearPasswordInput !== 'admin123') {
      setClearStatus({ type: 'error', text: 'Kata laluan keselamatan tidak sah.' })
      return
    }

    setIsSubmittingClear(true)
    setClearStatus(null)

    const targetSize = clearScope === 'selected' ? selectedSizeId : 'all'
    const res = await clearCylinderTransactions(hospitalId, targetSize)

    setIsSubmittingClear(false)
    if (res.error) {
      setClearStatus({ type: 'error', text: res.error })
    } else {
      setClearStatus({ type: 'success', text: 'Lejar berjaya ditetapkan semula.' })
      await loadLedgerDetails()
      await loadCatalog()
      setTimeout(() => setIsClearModalOpen(false), 1000)
    }
  }

  // ==========================================
  // PRINT GENERATOR: OFFICIAL KEW.PS-4 KAD PETAK
  // ==========================================
  const handlePrintLedger = () => {
    if (!selectedItem) return

    const printWin = window.open('', '_blank')
    if (!printWin) return

    const itemCode = selectedItem.item_code
    const itemName = selectedItem.item_name
    const uom = selectedItem.unit_of_measure
    const location = selectedItem.location
    const minStock = selectedItem.min_stock || 0
    const maxStock = selectedItem.max_stock || 0

    const rowsHtml = ledgerRows.map(row => {
      const isReceipt = row.receiptQty !== null && row.receiptQty !== undefined
      const isIssue = row.issueQty !== null && row.issueQty !== undefined
      const isBf = row.transaction_type === 'bring_forward'
      const isVer = row.transaction_type === 'store_verification'

      const dateDisplay = new Date(row.transaction_date).toLocaleDateString('ms-MY', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })

      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${dateDisplay}</td>
          <td style="font-weight: bold; font-family: monospace;">${row.transaction_number || '—'}</td>
          <td>${row.source_destination || '—'}</td>
          <td style="text-align: right; font-weight: bold; color: ${isReceipt || isBf ? '#047857' : '#334155'}; font-family: monospace;">
            ${row.receiptQty !== null ? row.receiptQty : '—'}
          </td>
          <td style="text-align: right; font-weight: bold; color: ${isIssue ? '#b91c1c' : '#334155'}; font-family: monospace;">
            ${row.issueQty !== null ? row.issueQty : '—'}
          </td>
          <td style="text-align: right; font-weight: 900; background: #f8fafc; font-family: monospace;">
            ${row.runningBalance}
          </td>
          <td style="font-size: 8.5pt; text-align: center;">${row.officer_name || 'Pegawai Stor'}</td>
        </tr>
      `
    }).join('')

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KEW.PS-4 Kad Petak Silinder - ${itemCode} - Hospital Lawas</title>
        <style>
          @page { size: A4 landscape; margin: 12mm 15mm; }
          body { font-family: 'Arial', sans-serif; font-size: 9pt; color: #000; margin: 0; padding: 0; }
          .header-box { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .kewps-tag { border: 2px solid #000; padding: 4px 10px; font-weight: bold; font-size: 13pt; font-family: monospace; }
          .meta-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 12px; border: 1px solid #000; padding: 8px; font-size: 8.5pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt; }
          th, td { border: 1px solid #000; padding: 4px 6px; }
          th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
          .footer { margin-top: 15px; font-size: 7.5pt; color: #475569; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${JATA_NEGARA_BASE64}" style="height: 48px; width: auto;" alt="Jata Negara" />
            <div>
              <div style="font-size: 8.5pt; font-weight: bold; letter-spacing: 0.5px;">KEMENTERIAN KESIHATAN MALAYSIA</div>
              <div style="font-size: 12pt; font-weight: 900; text-transform: uppercase;">HOSPITAL LAWAS, SARAWAK</div>
              <div style="font-size: 8pt; color: #475569;">PENGURUSAN STOR GAS PERUBATAN & SILINDER OKSIGEN</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="kewps-tag">KEW.PS-4</div>
            <div style="font-size: 8pt; font-weight: bold; margin-top: 3px;">KAD PETAK SILINDER (DIGITAL)</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <strong>Perihal Stok (Gas & Silinder):</strong> ${itemName}<br/>
            <strong>Jenis Gas:</strong> ${selectedItem.gas_type}<br/>
            <strong>Kapasiti:</strong> ${selectedItem.capacity_m3} m³ (${selectedItem.capacity_liters} Liters)
          </div>
          <div>
            <strong>No. Kod Silinder:</strong> ${itemCode}<br/>
            <strong>Unit Pengukuran:</strong> ${uom}<br/>
            <strong>Status Pemilikan:</strong> ${selectedItem.is_loan ? 'Pinjaman Pembekal (Loan)' : 'Milik Kerajaan (KKM)'}
          </div>
          <div>
            <strong>Lokasi Stor:</strong> ${location}<br/>
            <strong>Kuantiti Minima:</strong> ${minStock} ${uom}<br/>
            <strong>Kuantiti Maksima:</strong> ${maxStock} ${uom}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 10%;">Tarikh</th>
              <th rowspan="2" style="width: 16%;">No. Rujukan / DO / Inden</th>
              <th rowspan="2" style="width: 24%;">Terima Daripada / Keluar Kepada</th>
              <th colspan="3" style="width: 30%;">Kuantiti (${uom})</th>
              <th rowspan="2" style="width: 20%;">Tandatangan & Nama Pegawai</th>
            </tr>
            <tr>
              <th style="width: 10%;">Terima</th>
              <th style="width: 10%;">Keluar</th>
              <th style="width: 10%;">Baki</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px;">Tiada rekod transaksi.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>Dokumen Rasmi KEW.PS-4 • Hospital Lawas • Dijana Automatik Menerusi H.O.M.E. System pada ${new Date().toLocaleString('ms-MY')}</div>
          <div>Muka Surat 1 / 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `)
    printWin.document.close()
  }

  // ==========================================
  // PRINT GENERATOR: KEW.PS-14 VERIFICATION CERTIFICATE
  // ==========================================
  const handlePrintVerificationCert = (customRecord?: CylinderStoreVerificationRecord) => {
    const record = customRecord || (storeVerificationLogs.length > 0 ? storeVerificationLogs[0] : null)
    if (!record && !selectedItem) return

    const printWin = window.open('', '_blank')
    if (!printWin) return

    const phys = record ? record.physical_count : currentStockBalance
    const kew = record ? record.kewps_balance : currentStockBalance
    const sys = record ? record.system_count : currentStockBalance
    const isTally = record ? record.is_tally : true
    const verYear = record ? record.verification_year : new Date().getFullYear()
    const verName = record ? record.verifier_name : (user?.full_name || 'Dr. Ahmad Razif')
    const verIc = record?.verifier_ic || '820412-13-5491'
    const verJawatan = record?.verifier_jawatan || 'Pegawai Farmasi Kanan'

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sijil Verifikasi Stor KEW.PS-14 - ${selectedItem?.item_code}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 20mm; }
          body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #000; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
          .cert-box { border: 2px solid #000; padding: 20px; border-radius: 4px; margin-top: 15px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9.5pt; }
          th, td { border: 1px solid #000; padding: 6px 8px; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${JATA_NEGARA_BASE64}" style="height: 55px; width: auto; margin-bottom: 6px;" alt="Jata Negara" />
          <div style="font-weight: bold; font-size: 10pt;">KEMENTERIAN KESIHATAN MALAYSIA</div>
          <div style="font-weight: 900; font-size: 13pt;">HOSPITAL LAWAS, SARAWAK</div>
          <div style="font-size: 9pt; color: #475569;">PEKELILING PERBENDAHARAAN TATACARA PENGURUSAN STOR KERAJAAN</div>
          <div style="font-weight: 900; font-size: 12pt; margin-top: 8px; text-decoration: underline;">BORANG & SIJIL VERIFIKASI STOR TAHUNAN (KEW.PS-14)</div>
        </div>

        <p>Dengan ini diperakui bahawa verifikasi stor tahunan bagi tahun <strong>${verYear}</strong> telah dijalankan ke atas item silinder oksigen perubatan berikut:</p>

        <table>
          <tr>
            <th style="width: 30%; text-align: left;">Perihal Silinder</th>
            <td>${selectedItem?.item_name || 'Medical Oxygen Cylinder'}</td>
          </tr>
          <tr>
            <th style="text-align: left;">Kod Silinder</th>
            <td style="font-family: monospace; font-weight: bold;">${selectedItem?.item_code || '101-N'}</td>
          </tr>
          <tr>
            <th style="text-align: left;">Lokasi Penyimpanan</th>
            <td>${selectedItem?.location || 'Stor Gas Perubatan Utama'}</td>
          </tr>
        </table>

        <div style="margin: 15px 0; font-weight: bold;">Keputusan Semakan 3-Hala (Physical vs KEW.PS-4 vs Sistem PHiS/H.O.M.E.):</div>

        <table>
          <thead>
            <tr>
              <th>1. Kiraan Stok Fizikal</th>
              <th>2. Baki Kad Petak KEW.PS-4</th>
              <th>3. Baki Rekod Sistem</th>
              <th>Status Padanan</th>
            </tr>
          </thead>
          <tbody>
            <tr style="text-align: center; font-weight: bold; font-size: 11pt;">
              <td>${phys} Tabung</td>
              <td>${kew} Tabung</td>
              <td>${sys} Tabung</td>
              <td style="color: ${isTally ? '#047857' : '#b91c1c'};">${isTally ? '✓ SEPADAN (TALLY)' : '⚠ TERDAPAT PERBEZAAN'}</td>
            </tr>
          </tbody>
        </table>

        <div class="cert-box">
          <div style="font-weight: bold; margin-bottom: 10px;">PERAKUAN PEGAWAI PEMVERIFIKASI LUAR:</div>
          <p style="font-size: 9pt; text-align: justify;">
            Saya dengan ini memperakui bahawa semakan fizikal dan semakan silang dengan Buku Rekod KEW.PS-4 telah dilaksanakan dengan teliti dan lengkap pada tarikh <strong>${new Date().toLocaleDateString('ms-MY')}</strong>.
          </p>
          <br/><br/>
          <div style="display: flex; justify-content: space-between;">
            <div>
              ____________________________<br/>
              <strong>(${verName})</strong><br/>
              No. K/P: ${verIc}<br/>
              Jawatan: ${verJawatan}
            </div>
            <div>
              Tarikh: ${new Date().toLocaleDateString('ms-MY')}<br/>
              Cap Rasmi Jabatan:
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `)
    printWin.document.close()
  }

  // Export to CSV
  const handleExportCsv = () => {
    if (!selectedItem || ledgerRows.length === 0) return

    const headers = ['Tarikh', 'No Rujukan', 'Daripada / Kepada', 'Terima', 'Keluar', 'Baki', 'No Siri', 'Pegawai Bertanggungjawab', 'Catatan']
    const rows = ledgerRows.map(r => [
      `"${new Date(r.transaction_date).toLocaleDateString('ms-MY')}"`,
      `"${r.transaction_number || ''}"`,
      `"${r.source_destination || ''}"`,
      r.receiptQty || '',
      r.issueQty || '',
      r.runningBalance,
      `"${(r.serial_numbers || []).join(', ')}"`,
      `"${r.officer_name || ''}"`,
      `"${r.remarks || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `KEWPS4_CYLINDER_${selectedItem.item_code}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 text-slate-800 pb-28 lg:pb-8 w-full">
      
      {/* TOP BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to={ROUTES.HUB} className="hover:text-slate-900 transition-colors">HOME</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={ROUTES.PHARMACY_OXYGEN} className="hover:text-slate-900 transition-colors">
          {language === 'ms' ? 'OKSIGEN PERUBATAN' : 'MEDICAL OXYGEN'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-teal-600 font-bold uppercase">
          {language === 'ms' ? 'LEJAR & KAD PETAK KEW.PS-4' : 'KEW.PS-4 CYLINDER LEDGER'}
        </span>
      </div>

      {/* LUXURY EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] uppercase tracking-wider font-bold">
                  KEW.PS-4 DIGITAL CYLINDER PORTAL
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Hospital Lawas • KKM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <AirVent className="w-8 h-8 text-teal-400" />
                <span>Lejar & Kad Petak KEW.PS-4 Silinder Oksigen</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                Pusat Kawalan & Rekod Pergerakan Silinder Gas Perubatan — Penerimaan DO Pembekal, Pengeluaran Wad, Imbasan QR & Verifikasi Stor Tahunan mengikut Tatacara Pengurusan Stor Kerajaan (TPS).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={() => setIsQrModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold px-3.5 py-2.5 shadow-lg gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                Imbas QR
              </Button>
              <Button
                onClick={handlePrintLedger}
                disabled={!selectedItem || ledgerRows.length === 0}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs gap-1.5 px-3.5 py-2.5 shadow-sm border border-slate-700 disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                Cetak KEW.PS-4
              </Button>
              <Button
                onClick={handleExportCsv}
                disabled={!selectedItem || ledgerRows.length === 0}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs gap-1.5 px-3.5 py-2.5 shadow-sm border border-slate-700 disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Eksport CSV
              </Button>
            </div>
          </div>

          {/* QUICK METRICS GLASS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Jumlah Silinder Fleet</span>
              <span className="text-xl font-black font-mono text-teal-300">{totalFleetCount}</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Baki Penuh Stor Utama</span>
              <span className="text-xl font-black font-mono text-emerald-300">{totalFullCentral}</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Silinder Di Wad/Klinik</span>
              <span className="text-xl font-black font-mono text-cyan-300">{totalInUseWards}</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Amaran Paras Minima</span>
              <span className="text-xl font-black font-mono text-amber-300">{lowStockAlertCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CYLINDER SELECTOR SIDEBAR (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* MOBILE SEARCH PILL */}
          {selectedItem && !isMobileSearchExpanded && (
            <div className="lg:hidden bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Silinder Dipilih</span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">{selectedItem.item_code}</span>
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate mt-0.5">{selectedItem.item_name}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchExpanded(true)}
                className="shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-teal-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Tukar</span>
              </button>
            </div>
          )}

          {/* SEARCH BOX & CYLINDER LIST */}
          <div className={`bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-5 ${
            selectedItem && !isMobileSearchExpanded ? 'hidden lg:block' : 'block'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4 text-teal-600" />
                <span>Saiz & Jenis Silinder</span>
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {cylinderItems.length} Saiz
              </Badge>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Cari kod atau saiz silinder..."
                className={`pl-9 ${searchQuery ? 'pr-8' : ''} rounded-xl text-xs py-1.5`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of Cylinder Sizes */}
            {isLoadingCatalog ? (
              <div className="flex items-center justify-center p-8">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredCatalogItems.map(item => {
                  const isSelected = selectedSizeId === (item.size_id || item.id)
                  const isItemLow = item.current_stock <= (item.min_stock || 0)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSize(item)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                          : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-800">{item.item_code}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">({item.capacity_m3}m³)</span>
                          {item.is_loan && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-bold">LOAN</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 truncate font-medium mt-0.5">{item.gas_type}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-mono font-black text-sm ${isItemLow ? 'text-rose-600' : 'text-slate-800'}`}>
                          {item.current_stock}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase">{item.unit_of_measure}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ACTIVE CYLINDER STOCK GAUGE (Desktop only) */}
          {selectedItem && (
            <div className="hidden lg:block bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-black text-xs text-teal-400 uppercase tracking-wider">Kedudukan Paras Stok</span>
                <Badge variant="outline" className="text-slate-300 border-slate-700 font-mono text-[10px]">
                  {selectedItem.unit_of_measure}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Baki Penuh Stor:</span>
                  <span className="font-mono text-teal-300 font-black text-sm">
                    {currentStockBalance} {selectedItem.unit_of_measure}
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 flex">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLowStock ? 'bg-rose-500' : currentStockBalance <= (selectedItem.buffer_stock || 20) ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Min: {selectedItem.min_stock}</span>
                  <span>Buffer: {selectedItem.buffer_stock}</span>
                  <span>Max: {selectedItem.max_stock}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase">Di Wad/Klinik</span>
                  <span className="font-mono font-bold text-cyan-300">{selectedItem.in_use_stock || 0}</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase">Kosong di Stor</span>
                  <span className="font-mono font-bold text-amber-300">{selectedItem.empty_stock || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: KEW.PS-4 LEDGER WORKSPACE (9 cols) */}
        <div className="lg:col-span-9 space-y-6">

          {!selectedItem ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Search className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-800 tracking-tight">Sila Pilih Saiz Silinder</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Sila pilih saiz dan jenis silinder pada ruangan sebelah kiri untuk memaparkan Kad Petak & Lejar Transaksi (KEW.PS-4).
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ZONE A: ACTIVE CYLINDER HERO CARD */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
                      {selectedItem.item_code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                      Kapasiti: <span className="font-bold text-slate-800">{selectedItem.capacity_m3} m³ ({selectedItem.capacity_liters}L)</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-teal-50 text-teal-800 border-teal-200/70">
                      {selectedItem.gas_type}
                    </span>
                    {selectedItem.is_loan && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-800 border-amber-200/70">
                        PINJAMAN (LOAN)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {storeVerificationLogs.some(r => r.size_id === selectedSizeId && r.verification_year === new Date().getFullYear()) && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verifikasi {new Date().getFullYear()}: Tally</span>
                      </span>
                    )}

                    <Badge 
                      variant={isLowStock ? 'danger' : 'success'}
                      className="text-xs px-3 py-1 font-bold"
                    >
                      {isLowStock ? '⚠ STOK MINIMA' : '● STOK MENCUKUPI'}
                    </Badge>
                  </div>
                </div>

                {/* Main Title & Location */}
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {selectedItem.item_name}
                  </h2>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">LOKASI:</span>
                      <span className="font-mono font-bold">{selectedItem.location}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
                      <CheckCheck className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{language === 'ms' ? 'Diselaraskan Automatik Dari Penerimaan DO Oksigen & Permohonan Wad' : 'Auto-Synchronized From Oxygen DO Receipts & Ward Dispatches'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={openStoreVerificationModal}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 shadow-sm transition-all inline-flex items-center justify-center cursor-pointer"
                      title="Verifikasi Stor Tahunan (Semakan Fizikal vs KEW.PS-4)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span>Store Verification</span>
                    </button>

                    <button
                      type="button"
                      onClick={openCheckFoundModal}
                      className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 border border-slate-300 rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 transition-all inline-flex items-center justify-center cursor-pointer"
                      title="Check & Found Audit"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-slate-700" />
                      <span>Check & Found</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openBringForwardModal()}
                      className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 border border-slate-300 rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 transition-all inline-flex items-center justify-center cursor-pointer"
                      title="Bawa Ke Hadapan baki lejar"
                    >
                      <FastForward className="w-3.5 h-3.5 text-slate-700" />
                      <span>Bring Forward</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClearPasswordInput('')
                        setClearStatus(null)
                        setIsClearModalOpen(true)
                      }}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-black text-xs gap-1.5 px-3.5 py-2.5 transition-all inline-flex items-center justify-center cursor-pointer border border-amber-500"
                      title="Set Semula Lejar (Dilindungi PIN)"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-950" />
                      <span>Set Semula</span>
                    </button>

                    {storeVerificationLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsVerificationHistoryModalOpen(true)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 transition-all inline-flex items-center justify-center cursor-pointer"
                        title="Lihat Sejarah Log Verifikasi Stor"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Sejarah ({storeVerificationLogs.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ZONE C: FILTERS & PRESET STRIP */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Penapis Lejar KEW.PS-4</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => applyDatePreset('today')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        activeDatePreset === 'today' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('week')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        activeDatePreset === 'week' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('month')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        activeDatePreset === 'month' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('3months')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        activeDatePreset === '3months' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      3 Bulan
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        activeDatePreset === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Semua
                    </button>
                  </div>
                </div>

                {/* Filter Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tarikh Mula</label>
                    <Input
                      type="date"
                      className="text-xs py-1.5 rounded-xl font-mono"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value)
                        setActiveDatePreset('all')
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tarikh Akhir</label>
                    <Input
                      type="date"
                      className="text-xs py-1.5 rounded-xl font-mono"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value)
                        setActiveDatePreset('all')
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jenis Transaksi</label>
                    <Select
                      className="text-xs py-1.5 rounded-xl font-medium"
                      value={selectedTxType}
                      onChange={(e) => setSelectedTxType(e.target.value)}
                    >
                      <option value="all">Semua Jenis Transaksi</option>
                      <option value="receipt">Penerimaan DO Pembekal (+)</option>
                      <option value="issue">Pengeluaran ke Wad (-)</option>
                      <option value="store_verification">Verifikasi Stor (KEW.PS-14)</option>
                      <option value="check_found">Semak & Penemuan</option>
                      <option value="bring_forward">Bawa Ke Hadapan</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan / Wad Destinasi</label>
                    <Select
                      className="text-xs py-1.5 rounded-xl font-medium"
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                    >
                      <option value="all">Semua Jabatan / Wad</option>
                      {CLINICAL_WARM_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* ZONE E: DIGITAL KEW.PS-4 TRANSACTION TABLE */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <span>Buku Daftar Transaksi (Digital KEW.PS-4 Silinder)</span>
                  </h3>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {ledgerRows.length} Rekod
                  </Badge>
                </div>

                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-20">
                    <Spinner size="lg" />
                  </div>
                ) : ledgerRows.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-medium text-sm space-y-4 bg-slate-50/50 rounded-2xl p-6 border border-dashed border-slate-200">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="space-y-1.5">
                      <p className="font-black text-slate-800 text-base">Tiada Rekod Pergerakan Ditemui</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Tiada transaksi dikesan bagi penapis ini. Sila tukar tarikh atau tekan <button type="button" onClick={() => applyDatePreset('all')} className="text-teal-600 font-bold underline cursor-pointer">"Semua"</button>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-3 w-12 text-center">#</th>
                            <th className="py-3 px-3">Tarikh & Masa</th>
                            <th className="py-3 px-3">No. Rujukan / DO</th>
                            <th className="py-3 px-4">Daripada / Kepada</th>
                            <th className="py-3 px-3 text-right text-emerald-700">Terima (+)</th>
                            <th className="py-3 px-3 text-right text-rose-700">Keluar (-)</th>
                            <th className="py-3 px-3 text-right font-black">Baki</th>
                            <th className="py-3 px-3">Pegawai Stor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ledgerRows.map(row => {
                            const isReceipt = row.receiptQty !== null && row.receiptQty !== undefined
                            const isIssue = row.issueQty !== null && row.issueQty !== undefined
                            const isBf = row.transaction_type === 'bring_forward'
                            const isVer = row.transaction_type === 'store_verification'

                            return (
                              <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                                  {row.index}
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                                  {new Date(row.transaction_date).toLocaleString('ms-MY', {
                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                                  {row.transaction_number}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">{row.source_destination}</div>
                                  {row.remarks && (
                                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{row.remarks}</div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                                  {row.receiptQty !== null ? `+${row.receiptQty}` : '—'}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                                  {row.issueQty !== null ? `-${row.issueQty}` : '—'}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                                  {row.runningBalance}
                                </td>
                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                  {row.officer_name}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden space-y-3">
                      {ledgerRows.map(row => (
                        <div key={row.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                            <span className="font-mono font-bold text-slate-400">#{row.index}</span>
                            <span className="font-mono font-bold text-teal-700">{row.transaction_number}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(row.transaction_date).toLocaleDateString('ms-MY')}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-slate-800">{row.source_destination}</div>
                          {row.remarks && <div className="text-[11px] text-slate-500">{row.remarks}</div>}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-mono">
                            <div>
                              {row.receiptQty && <span className="text-emerald-700 font-bold">Terima: +{row.receiptQty}</span>}
                              {row.issueQty && <span className="text-rose-700 font-bold">Keluar: -{row.issueQty}</span>}
                            </div>
                            <div>
                              <span className="text-slate-400">Baki: </span>
                              <span className="font-black text-slate-900">{row.runningBalance} {selectedItem.unit_of_measure}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ZONE F: WARD & DEPARTMENT CONSUMPTION BREAKDOWN */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Pengagihan Mengikut Wad & Jabatan ({selectedItem.item_code})</span>
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {deptBreakdown.length} Unit
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deptBreakdown.map(dept => (
                    <div key={dept.department_name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800 truncate">{dept.department_name}</span>
                        <span className="font-mono text-teal-700">{dept.total_issued} Tabung</span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-600 h-full rounded-full" 
                          style={{ width: `${Math.min(Math.round((dept.total_issued / 50) * 100), 100)}%` }} 
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                        <span>Sedang Guna: <strong>{dept.currently_in_use}</strong></span>
                        <span>Permohonan: {dept.requests_count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* STORE VERIFICATION MODAL (KEW.PS-14)       */}
      {/* ========================================== */}
      <Modal
        isOpen={isStoreVerificationModalOpen}
        onClose={() => setIsStoreVerificationModalOpen(false)}
        title="Verifikasi Stor Tahunan (KEW.PS-14)"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitStoreVerification} className="space-y-4 text-xs">
          {verificationStatus && (
            <div className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
              verificationStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {verificationStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{verificationStatus.text}</span>
            </div>
          )}

          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Verifikasi Bagi:</span>
              <span className="font-bold text-teal-300">{selectedItem?.item_name} ({selectedItem?.item_code})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Baki Kad Petak KEW.PS-4</span>
                <span className="font-mono font-black text-base text-teal-300">{currentStockBalance} Tabung</span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Baki Sistem Database</span>
                <span className="font-mono font-black text-base text-cyan-300">{currentStockBalance} Tabung</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Kiraan Fizikal Sebenar (Tabung) *</label>
              <Input
                type="number"
                min="0"
                required
                value={verificationPhysicalCount}
                onChange={(e) => setVerificationPhysicalCount(e.target.value)}
                className="font-mono text-sm py-1.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Tahun Verifikasi *</label>
              <Input
                type="number"
                required
                value={verificationYear}
                onChange={(e) => setVerificationYear(parseInt(e.target.value, 10))}
                className="font-mono text-xs py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Nama Pegawai Pemverifikasi Luar *</label>
              <Input
                required
                value={verificationVerifierName}
                onChange={(e) => setVerificationVerifierName(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">No. Kad Pengenalan Pegawai</label>
              <Input
                value={verificationVerifierIc}
                onChange={(e) => setVerificationVerifierIc(e.target.value)}
                className="font-mono text-xs py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Jawatan & Gred Pegawai</label>
            <Input
              value={verificationVerifierJawatan}
              onChange={(e) => setVerificationVerifierJawatan(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Catatan Verifikasi</label>
            <Input
              value={verificationRemarks}
              onChange={(e) => setVerificationRemarks(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div className="p-3 bg-slate-50 border rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="certVerify"
              checked={isVerificationCertified}
              onChange={(e) => setIsVerificationCertified(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-teal-600"
            />
            <label htmlFor="certVerify" className="text-[11px] text-slate-700 leading-snug cursor-pointer">
              Saya dengan ini memperakui bahawa semakan fizikal dan semakan silang dengan Buku Rekod KEW.PS-4 telah disahkan mengikut Tatacara Pengurusan Stor Kerajaan.
            </label>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsStoreVerificationModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingVerification} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {isSubmittingVerification ? 'Menyimpan...' : 'Sahkan & Jana KEW.PS-14'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* CHECK & FOUND MODAL                        */}
      {/* ========================================== */}
      <Modal
        isOpen={isCheckFoundModalOpen}
        onClose={() => setIsCheckFoundModalOpen(false)}
        title="Semakan & Penemuan Stok (Check & Found)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitCheckFound} className="space-y-4 text-xs">
          {checkFoundStatus && (
            <div className={`p-3 rounded-xl font-bold ${
              checkFoundStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {checkFoundStatus.text}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-600 mb-1">Kiraan Fizikal Sebenar *</label>
            <Input
              type="number"
              min="0"
              required
              value={checkFoundPhysicalQty}
              onChange={(e) => setCheckFoundPhysicalQty(e.target.value)}
              className="font-mono text-sm py-1.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Nama Pegawai Audit</label>
            <Input
              required
              value={checkFoundOfficer}
              onChange={(e) => setCheckFoundOfficer(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Sebab & Catatan Semakan</label>
            <Input
              value={checkFoundRemarks}
              onChange={(e) => setCheckFoundRemarks(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsCheckFoundModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingCheckFound} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
              {isSubmittingCheckFound ? 'Menyimpan...' : 'Simpan Pelarasan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* BRING FORWARD MODAL                        */}
      {/* ========================================== */}
      <Modal
        isOpen={isBringForwardModalOpen}
        onClose={() => setIsBringForwardModalOpen(false)}
        title="Bawa Ke Hadapan Baki Pembukaan (Bring Forward)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitBringForward} className="space-y-4 text-xs">
          {bfStatus && (
            <div className={`p-3 rounded-xl font-bold ${
              bfStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {bfStatus.text}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-600 mb-1">Kuantiti Baki Pembukaan (Tabung) *</label>
            <Input
              type="number"
              min="0"
              required
              value={bfQty}
              onChange={(e) => setBfQty(e.target.value)}
              className="font-mono text-sm py-1.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Tempoh Baki</label>
            <Select
              value={bfPeriodType}
              onChange={(e) => setBfPeriodType(e.target.value as any)}
              className="text-xs py-1.5"
            >
              <option value="previous_year">Tahun Lepas</option>
              <option value="previous_month">Bulan Lepas</option>
              <option value="initial_balance">Baki Pembukaan Baru</option>
            </Select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">No. Rujukan</label>
            <Input
              value={bfRefNum}
              onChange={(e) => setBfRefNum(e.target.value)}
              className="font-mono text-xs py-1.5"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsBringForwardModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingBf} className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
              {isSubmittingBf ? 'Menyimpan...' : 'Simpan Baki Pembukaan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* CLEAR / RESET LEDGER MODAL                 */}
      {/* ========================================== */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Set Semula / Padam Rekod Lejar"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          {clearStatus && (
            <div className={`p-3 rounded-xl font-bold ${
              clearStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {clearStatus.text}
            </div>
          )}

          <p className="text-slate-600">
            Tindakan ini akan mengosongkan rekod transaksi bagi membolehkan rekod baru dimulakan. Tindakan ini dilindungi kata laluan kebenaran.
          </p>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Skop Penetapan Semula</label>
            <Select
              value={clearScope}
              onChange={(e) => setClearScope(e.target.value as any)}
              className="text-xs py-1.5"
            >
              <option value="selected">Saiz Semasa Sahaja ({selectedItem?.item_code})</option>
              <option value="all">Semua Saiz Silinder</option>
            </Select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Kata Laluan Pentadbir (PIN: home123)</label>
            <Input
              type="password"
              placeholder="Masukkan kata laluan..."
              value={clearPasswordInput}
              onChange={(e) => setClearPasswordInput(e.target.value)}
              className="text-xs py-1.5 font-mono"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsClearModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleClearLedger} disabled={isSubmittingClear} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              {isSubmittingClear ? 'Memadam...' : 'Sahkan Set Semula'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================== */}
      {/* VERIFICATION HISTORY MODAL                 */}
      {/* ========================================== */}
      <Modal
        isOpen={isVerificationHistoryModalOpen}
        onClose={() => setIsVerificationHistoryModalOpen(false)}
        title="Sejarah Log Verifikasi Stor Tahunan (KEW.PS-14)"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {storeVerificationLogs.length === 0 ? (
            <p className="text-center py-6 text-slate-400">Tiada rekod verifikasi terdahulu.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {storeVerificationLogs.map(log => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">Verifikasi Tahun {log.verification_year}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        log.is_tally ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.is_tally ? 'TALLY (SEPADAN)' : 'VARIANS'}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      Pegawai: <strong>{log.verifier_name}</strong> • Tarikh: {new Date(log.verified_at).toLocaleDateString('ms-MY')}
                    </div>
                    <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                      Fizikal: {log.physical_count} | KEW.PS-4: {log.kewps_balance} | Sistem: {log.system_count}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handlePrintVerificationCert(log)}
                      className="bg-emerald-600 text-white rounded-xl text-xs font-bold gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Sijil
                    </Button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteCylinderStoreVerificationRecord(log.id)
                        await loadLedgerDetails()
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700 transition-colors"
                      title="Padam rekod"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================== */}
      {/* QR SCANNER MODAL                           */}
      {/* ========================================== */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Imbas Kod QR / Barcode Silinder"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center text-xs">
          <div className="w-full aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 border border-slate-800 relative overflow-hidden">
            <QrCode className="w-16 h-16 text-teal-400 animate-pulse mb-2" />
            <p className="font-bold text-white text-sm">Kamera Pengimbas Aktif</p>
            <p className="text-slate-400 text-[11px]">Halakan kod QR silinder ke hadapan kamera</p>
            <div className="absolute inset-x-8 top-1/2 h-0.5 bg-teal-400/80 shadow-lg animate-bounce" />
          </div>

          <div className="p-3 bg-slate-50 border rounded-xl text-left text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Panduan Imbasan:</p>
            <p>• Menyokong Kod QR Fizikal Silinder KKM & Barcode Pembekal (Linde, Borneo Indah).</p>
            <p>• Imbasan akan memaparkan Kad Petak KEW.PS-4 saiz silinder yang sepadan secara automatik.</p>
          </div>

          <Button onClick={() => setIsQrModalOpen(false)} className="w-full bg-slate-900 text-white font-bold">
            Tutup Pengimbas
          </Button>
        </div>
      </Modal>

    </div>
  )
}

export default CylinderKewPs4LedgerPage
