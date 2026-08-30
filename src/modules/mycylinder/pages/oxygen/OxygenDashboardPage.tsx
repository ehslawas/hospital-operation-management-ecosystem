// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { 
  Activity, 
  AirVent, 
  Wind, 
  AlertTriangle, 
  AlertCircle,
  Database, 
  ShoppingCart, 
  ClipboardList, 
  FileText,
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
  CalendarDays,
  List,
  Sparkles,
  X,
  ChevronDown,
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  CheckCheck,
  ScrollText
} from 'lucide-react'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/stores/authStore'
import { useLanguage } from '@/shared/contexts/LanguageContext'
import { Spinner, StatCard, Table, Badge, DataTable } from '@/components/ui'
import { CylinderKpiCards } from '@/components/oxygen/CylinderKpiCards'
import { StoreBalanceGrid } from '@/components/oxygen/StoreBalanceGrid'
import { UnitDistributionTable } from '@/components/oxygen/UnitDistributionTable'
import { StoreUsageBalanceTable } from '@/components/oxygen/StoreUsageBalanceTable'
import { SupplierReturnsSection } from '@/components/oxygen/SupplierReturnsSection'
import { CreateReturnDocumentModal } from '@/components/oxygen/CreateReturnDocumentModal'
import { ScanEmptyCylinderModal } from '@/components/oxygen/ScanEmptyCylinderModal'
import { ScanReconciliationModal } from '@/components/oxygen/ScanReconciliationModal'
import { AuditReconciliationSummaryModal, AuditChangeItem } from '@/components/oxygen/AuditReconciliationSummaryModal'
import { ReturnDocumentPrintView } from '@/components/oxygen/ReturnDocumentPrintView'
import { CreateRequestDocumentModal } from '@/components/oxygen/CreateRequestDocumentModal'
import { RequestDocumentPrintView } from '@/components/oxygen/RequestDocumentPrintView'
import { CylinderDispatchKpiCards } from '@/components/oxygen/CylinderDispatchKpiCards'
import { CylinderDispatchTable } from '@/components/oxygen/CylinderDispatchTable'
import { ManualIssueModal } from '@/components/oxygen/ManualIssueModal'
import { UnitRequestModal } from '@/components/oxygen/UnitRequestModal'
import { DispatchRequestDetailModal } from '@/components/oxygen/DispatchRequestDetailModal'
import { CylinderDispatchPrintView } from '@/components/oxygen/CylinderDispatchPrintView'
import {
  getCylinderDispatchRequests,
  getCylinderDispatchKPI,
  getClinicalDepartments,
  createManualIssue,
  createUnitRequest,
  approveRequest,
  rejectRequest,
  issueRequest,
  completeRequest,
  cancelRequest
} from '@/services/pharmacy/cylinderDispatchService'
import { 
  getOxygenCylinders, 
  getOxygenSummary, 
  getOxygenConsumptionHistory,
  updateOxygenCylinderStatus,
  getOxygenFinancialSummary,
  getOxygenLatestPricing,
  updateCylinderPrices,
  getOxygenPricingHistory,
  getOxygenReceptionsList,
  createOxygenReceptionRecord,
  getOxygenSystemSettings,
  getCylinderInventoryByType,
  getCylindersByDepartment,
  getStoreUsageBalance,
  getReturnDocuments,
  getRequestDocuments,
  assignCylinderQrTag,
  deactivateCylinderQrTag,
  getOxygenCylinderTypes,
  generateNewCylindersWithQr,
  addSupplierTaggedLoanCylinders,
  clearCylinderInventory,
} from '@/services/pharmacy/oxygenService'
import { 
  generateOxygenPoPdf, 
  generateOxygenReceptionReportPdf 
} from '@/services/pharmacy/oxygenPdfService'
import { extractSerialsFromDocument } from '@/shared/lib/pdfParser'
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
  OxygenReceptionItem,
  OxygenReturnDocumentWithRelations,
  OxygenRequestDocumentWithRelations,
  OxygenCylinderTypeInfo,
} from '@/types/pharmacy'
import type { ApiResponse, Paginated, Column } from '@/types'
import { supabase, isSupabaseConfigured } from '@/services/supabase'

export const OxygenDashboardPage: React.FC = () => {
  const { user } = useAuthStore()
  const { language } = useLanguage()
  const hospitalId = user?.hospital_id
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  // Existing distribution and inventory states
  const [summary, setSummary] = useState<OxygenSummary | null>(null)
  const [cylinders, setCylinders] = useState<OxygenCylinderWithRelations[]>([])
  const [taggedCylindersList, setTaggedCylindersList] = useState<OxygenCylinderWithRelations[]>([])
  const [consumptionHistory, setConsumptionHistory] = useState<OxygenConsumptionWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cylinder Inventory Dashboard states (implementation plan)
  const [cylinderAggregates, setCylinderAggregates] = useState<any[]>([])
  const [deptDistribution, setDeptDistribution] = useState<any[]>([])
  const [ledgerData, setLedgerData] = useState<any[]>([])
  const [returnDocs, setReturnDocs] = useState<OxygenReturnDocumentWithRelations[]>([])
  const [requestDocs, setRequestDocs] = useState<OxygenRequestDocumentWithRelations[]>([])
  const [cylinderActiveTab, setCylinderActiveTab] = useState<'overview' | 'unit_monitor' | 'store_balance' | 'supplier_returns'>('overview')
  const [supplierReturnsSubTab, setSupplierReturnsSubTab] = useState<'returns' | 'requests'>('returns')
  const [supplierReturnsDropdownOpen, setSupplierReturnsDropdownOpen] = useState(false)
  const [ledgerStartDate, setLedgerStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [ledgerEndDate, setLedgerEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isLedgerLoading, setIsLedgerLoading] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [selectedDepleteCombo, setSelectedDepleteCombo] = useState<any | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [sessionScannedCylinders, setSessionScannedCylinders] = useState<OxygenCylinderWithRelations[]>([])
  const [printDocId, setPrintDocId] = useState<string | null>(null)
  const [printRequestId, setPrintRequestId] = useState<string | null>(null)

  // Filters for Cylinder Registry
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // QR Label Generator State
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [generateQuantity, setGenerateQuantity] = useState<number>(1)
  const [generatedLabels, setGeneratedLabels] = useState<OxygenCylinderWithRelations[]>([])
  const [cylinderTypes, setCylinderTypes] = useState<OxygenCylinderTypeInfo[]>([])
  const [qrActiveTab, setQrActiveTab] = useState<'generate' | 'monitor'>('generate')
  const [qrSearchTerm, setQrSearchTerm] = useState('')
  const [qrSizeFilter, setQrSizeFilter] = useState('')
  const [qrTypeFilter, setQrTypeFilter] = useState('')
  const [qrPage, setQrPage] = useState(1)
  const [qrPageSize, setQrPageSize] = useState(10)
  const [isAssigningTag, setIsAssigningTag] = useState(false)
  const [supplierTagRows, setSupplierTagRows] = useState<string[]>([''])

  // OCR Auto-Extraction States
  const [deliveryDocFiles, setDeliveryDocFiles] = useState<File[]>([])
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [ocrExtractedTags, setOcrExtractedTags] = useState<{ serial: string; selected: boolean }[]>([])
  const [showOcrReview, setShowOcrReview] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDeliveryDocFiles(Array.from(e.target.files))
      setOcrError(null)
      setShowOcrReview(false)
    }
  }

  const handleRunOcr = async () => {
    if (deliveryDocFiles.length === 0) return
    setIsOcrProcessing(true)
    setOcrError(null)
    setShowOcrReview(false)
    
    try {
      const serials = await extractSerialsFromDocument(deliveryDocFiles)
      setOcrExtractedTags(serials.map(s => ({ serial: s, selected: true })))
      setShowOcrReview(true)
    } catch (err: any) {
      console.error(err)
      setOcrError(err.message || 'Failed to extract serial numbers. Please try again or enter manually.')
    } finally {
      setIsOcrProcessing(false)
    }
  }

  const handleApplyExtractedTags = () => {
    const selectedTags = ocrExtractedTags
      .filter(t => t.selected)
      .map(t => t.serial)
    
    if (selectedTags.length > 0) {
      setSupplierTagRows(selectedTags)
      setShowOcrReview(false)
      setDeliveryDocFiles([])
    }
  }

  useEffect(() => {
    if (selectedTypeId) {
      const type = cylinderTypes.find(t => t.id === selectedTypeId)
      const isLoan = type ? (((type.type_name || '').toLowerCase().includes('loan')) || (type.type_code || '').startsWith('101-')) : false
      if (isLoan) {
        setGenerateQuantity(1)
      }
    }
    setSupplierTagRows([''])
    setDeliveryDocFiles([])
    setOcrExtractedTags([])
    setShowOcrReview(false)
    setOcrError(null)
  }, [selectedTypeId, cylinderTypes])

  const selectedType = cylinderTypes.find(t => t.id === selectedTypeId)
  const isLoanSelected = selectedType ? (((selectedType.type_name || '').toLowerCase().includes('loan')) || (selectedType.type_code || '').startsWith('101-')) : false
  const isOcrEligible = selectedType ? (selectedType.type_code === '101-N' || selectedType.type_code === '101-F') : false

  // Reconciliation Audit States
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({})
  const [physicalLocations, setPhysicalLocations] = useState<Record<string, string>>({})
  const [physicalScannedBy, setPhysicalScannedBy] = useState<Record<string, { user: string; timestamp?: string }>>({})
  const [verifiedCylinderIds, setVerifiedCylinderIds] = useState<Set<string>>(new Set())
  const [reconciliationTab, setReconciliationTab] = useState<'system' | 'scanned'>('system')
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null)
  const [reconciliationLogs, setReconciliationLogs] = useState<any[]>([])
  const [isSavingReconciliation, setIsSavingReconciliation] = useState(false)
  const [selectedReconciliationGroup, setSelectedReconciliationGroup] = useState<string | null>(null)
  const [reconciliationPage, setReconciliationPage] = useState(1)
  const reconciliationPageSize = 10
  const [isAuditScanOpen, setIsAuditScanOpen] = useState(false)
  const [isAuditReviewOpen, setIsAuditReviewOpen] = useState(false)

  const isStoreLocation = (loc?: any) => {
    if (!loc) return true;
    let locStr = '';
    if (typeof loc === 'string') {
      locStr = loc;
    } else if (typeof loc === 'object') {
      locStr = loc?.location_name || loc?.name || loc?.department_name || '';
    } else {
      locStr = String(loc);
    }
    if (!locStr) return true;
    const lower = locStr.toLowerCase().trim();
    return lower.includes('store') || lower.includes('farmasi') || lower.includes('depot') || lower === 'pharmacy' || lower === 'main store' || lower === 'pharmacy store' || lower === 'central store';
  };

  const normalizeStatusForReconciliation = (status?: any) => {
    const s = (typeof status === 'string' ? status : String(status || '')).toLowerCase();
    if (s === 'available' || s === 'full') return 'available';
    if (s === 'used' || s === 'in_use' || s === 'issued') return 'used';
    if (s === 'empty') return 'empty';
    if (s === 'returned_to_supplier' || s === 'return' || s === 'returned') return 'return';
    return s;
  };

  const getExpectedStateForCylinder = (cyl: any, locationOverride?: string) => {
    const rawLoc = locationOverride || physicalLocations[cyl?.id] || cyl?.scanned_location || cyl?.current_location || cyl?.assigned_ward?.department_name || cyl?.department?.department_name;
    const loc = typeof rawLoc === 'object' ? (rawLoc?.location_name || rawLoc?.name || rawLoc?.department_name || '') : rawLoc;
    const rawStatus = (typeof cyl?.status === 'string' ? cyl?.status : String(cyl?.status || '')).toLowerCase();

    // Explicit empty or return states
    if (rawStatus === 'empty') return 'empty';
    if (rawStatus === 'returned_to_supplier' || rawStatus === 'return' || rawStatus === 'returned') return 'return';

    // If located at Emergency & Trauma or any Ward / Dept (outside Store), it is BEING USED already
    if (loc && !isStoreLocation(loc)) {
      return 'used';
    }

    // Available only applies to cylinders still in Store
    return normalizeStatusForReconciliation(cyl?.status || 'available');
  };

  const mapReconciliationToDbStatus = (status: string, location?: string) => {
    const norm = normalizeStatusForReconciliation(status);
    if (norm === 'available') {
      if (location && !isStoreLocation(location)) return 'issued';
      return 'available';
    }
    if (norm === 'used') return 'issued';
    if (norm === 'empty') return 'empty';
    if (norm === 'return') return 'returned_to_supplier';
    return status;
  };

  const getStatusLabel = (status: string) => {
    const norm = normalizeStatusForReconciliation(status);
    if (norm === 'available') return language === 'ms' ? 'Tersedia (Stor)' : 'Available (Store)';
    if (norm === 'used') return language === 'ms' ? 'Digunakan (Wad)' : 'Used / In Use (Ward)';
    if (norm === 'empty') return language === 'ms' ? 'Kosong (Stor)' : 'Empty (Store)';
    if (norm === 'return') return language === 'ms' ? 'Pemulangan' : 'Return';
    return status;
  };

  const getCylinderLocation = (cyl: any, statusKey?: string) => {
    // 1. If explicit location was assigned or recorded
    const loc = cyl?.scanned_location || cyl?.current_location;
    if (loc) {
      if (typeof loc === 'string' && loc.trim()) return loc;
      if (typeof loc === 'object') {
        const name = loc?.location_name || loc?.name || loc?.department_name;
        if (name) return name;
      }
    }
    if (cyl?.assigned_ward?.department_name) return cyl.assigned_ward.department_name;
    if (cyl?.department?.department_name) return cyl.department.department_name;

    if (statusKey) {
      const norm = normalizeStatusForReconciliation(statusKey);
      if (norm === 'used') return 'Emergency & Trauma';
      if (norm === 'return') return 'Supplier';
    }
    return 'Pharmacy Store';
  };

  // --- NEW FINANCIAL STATES ---
  const fmt = (val: number) => `RM ${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  const [financials, setFinancials] = useState<OxygenFinancialSummary | null>(null)
  const [pricingConfigs, setPricingConfigs] = useState<OxygenPricingConfig[]>([])
  const [pricingHistory, setPricingHistory] = useState<any[]>([])
  const [receptionsList, setReceptionsList] = useState<OxygenReceptionRecord[]>([])
  const [systemSettings, setSystemSettings] = useState<OxygenSystemSettings | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [ledgerViewMode, setLedgerViewMode] = useState<'detailed' | 'monthly'>('detailed')
  const [monthlyCurrentPage, setMonthlyCurrentPage] = useState(1)
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false)
  const [selectedConsolidateMonthKey, setSelectedConsolidateMonthKey] = useState<string>('')
  const [selectedPricingSupplier, setSelectedPricingSupplier] = useState<string>('All Suppliers')
  const [selectedModalSupplier, setSelectedModalSupplier] = useState<string>('Linde Malaysia Sdn Bhd')
  const [customSupplierInput, setCustomSupplierInput] = useState<string>('')
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState<boolean>(false)
  const [editedLoanRates, setEditedLoanRates] = useState<Record<string, string>>({})
  const [selectedReceiveSupplier, setSelectedReceiveSupplier] = useState<string>('LINDE EOX SDN BHD (CAW. MIRI)')

  // Helper to group and consolidate reception entries by month
  const getMonthlyConsolidatedReceptions = (receptions: OxygenReceptionRecord[]) => {
    const monthMap: Record<string, {
      id: string
      hospital_id: string
      reception_date: string
      delivery_order_no: string
      sales_order_no: string
      refill_amount: number
      loan_amount: number
      total_amount: number
      vote_code: string
      vote_activity: string
      status: 'completed' | 'pending_invoice' | 'outstanding_po'
      supplier_name?: string | null
      ids: string[]
      monthKey: string
      monthLabel: string
      entryCount: number
      records: OxygenReceptionRecord[]
      created_at?: string
    }> = {}

    receptions.forEach(rec => {
      const rawDate = rec.reception_date || ''
      const d = new Date(rawDate)
      const monthKey = !isNaN(d.getTime()) 
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : (rawDate.substring(0, 7) || '2026-08')

      const monthLabel = !isNaN(d.getTime())
        ? d.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-US', { month: 'long', year: 'numeric' })
        : monthKey

      const recIds = rec.ids && rec.ids.length > 0 ? rec.ids : [rec.id]
      const recDoNos = (rec.delivery_order_no || '').split(/[\s/]+/).filter(Boolean)
      const recSoNos = (rec.sales_order_no || '').split(/[\s/]+/).filter(Boolean)

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          id: `monthly-${monthKey}`,
          hospital_id: rec.hospital_id,
          reception_date: rec.reception_date,
          delivery_order_no: rec.delivery_order_no,
          sales_order_no: rec.sales_order_no || '-',
          refill_amount: Number(rec.refill_amount || 0),
          loan_amount: Number(rec.loan_amount || 0),
          total_amount: Number(rec.total_amount || 0),
          vote_code: rec.vote_code || '080702',
          vote_activity: rec.vote_activity || '27402',
          status: rec.status || 'completed',
          supplier_name: rec.supplier_name,
          ids: [...recIds],
          monthKey,
          monthLabel,
          entryCount: 1,
          records: [rec],
          created_at: rec.created_at || ''
        }
      } else {
        const existing = monthMap[monthKey]
        existing.entryCount += 1
        existing.refill_amount += Number(rec.refill_amount || 0)
        existing.loan_amount += Number(rec.loan_amount || 0)
        existing.total_amount += Number(rec.total_amount || 0)
        existing.records.push(rec)
        
        recIds.forEach(id => {
          if (!existing.ids.includes(id)) {
            existing.ids.push(id)
          }
        })

        const curDos = existing.delivery_order_no ? existing.delivery_order_no.split(' / ') : []
        recDoNos.forEach(dNo => {
          if (!curDos.includes(dNo)) curDos.push(dNo)
        })
        existing.delivery_order_no = curDos.join(' / ')

        const curSos = existing.sales_order_no && existing.sales_order_no !== '-' ? existing.sales_order_no.split(' / ') : []
        recSoNos.forEach(sNo => {
          if (!curSos.includes(sNo)) curSos.push(sNo)
        })
        existing.sales_order_no = curSos.length > 0 ? curSos.join(' / ') : '-'

        if (new Date(rec.reception_date) > new Date(existing.reception_date)) {
          existing.reception_date = rec.reception_date
        }
        if (rec.supplier_name && !existing.supplier_name) {
          existing.supplier_name = rec.supplier_name
        }
      }
    })

    return Object.values(monthMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  }

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
  const [lindeSupplier, setLindeSupplier] = useState<any>(null)

  // Cylinder Request & Dispatch States
  const [dispatchRequests, setDispatchRequests] = useState<CylinderDispatchRequestWithRelations[]>([])
  const [dispatchKpi, setDispatchKpi] = useState<CylinderDispatchKPI | null>(null)
  const [departmentsList, setDepartmentsList] = useState<{ id: string; department_name: string }[]>([])
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
  const [detailRequest, setDetailRequest] = useState<CylinderDispatchRequestWithRelations | null>(null)
  const [printDispatchRequestId, setPrintDispatchRequestId] = useState<string | null>(null)

  const [dbSuppliers, setDbSuppliers] = useState<{ id: string; company_name: string }[]>([])

  useEffect(() => {
    const fetchLindeAndSuppliers = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: lindeData } = await supabase
            .from('suppliers')
            .select('*')
            .ilike('company_name', '%LINDE%')
            .limit(1)
          if (lindeData && lindeData.length > 0) {
            setLindeSupplier(lindeData[0])
            setSelectedModalSupplier(lindeData[0].company_name || 'Linde Malaysia Sdn Bhd')
          }

          const { data: allSuppliers } = await supabase
            .from('suppliers')
            .select('id, company_name')
          if (allSuppliers && allSuppliers.length > 0) {
            const filteredSuppliers = allSuppliers.filter(s => {
              const name = (s.company_name || '').toLowerCase();
              return name.includes('linde') || name.includes('borneo indah');
            });
            setDbSuppliers(filteredSuppliers)
            if (!lindeData || lindeData.length === 0) {
              setSelectedModalSupplier(filteredSuppliers[0]?.company_name || 'Linde Malaysia Sdn Bhd')
            }
          }
        }
      } catch (err) {
        console.error('Error fetching real suppliers:', err)
      }
    }
    void fetchLindeAndSuppliers()
  }, [])

  const lindeDisplayName = lindeSupplier?.company_name || 'Linde Malaysia Sdn Bhd'

  const isLindeSupplier = (name?: string | null) => {
    if (!name) return true
    return String(name).toLowerCase().includes('linde')
  }

  const isSupplierMatch = (configSupplier: string | null | undefined, selectedSupplier: string) => {
    if (selectedSupplier === 'All Suppliers') return true
    if (isLindeSupplier(selectedSupplier)) {
      return isLindeSupplier(configSupplier)
    }
    return String(configSupplier || '').trim().toLowerCase() === String(selectedSupplier || '').trim().toLowerCase()
  }

  const realSupplierOptions = Array.from(
    new Set([
      lindeDisplayName,
      ...pricingConfigs
        .map((p) => p.supplier_name)
        .filter((name): name is string => !!name),
      ...pricingHistory
        .map((ph) => ph.supplier_name)
        .filter((name): name is string => !!name),
      ...dbSuppliers.map((s) => s.company_name)
    ].filter((name): name is string => {
      if (!name) return false;
      const lower = String(name).toLowerCase();
      return lower.includes('linde') || lower.includes('borneo indah');
    }))
  )

  useEffect(() => {
    const targetSupplier = isAddingNewSupplier ? customSupplierInput : selectedModalSupplier
    const priceMap: Record<string, string> = {}
    
    // 1. Get prices matching targetSupplier
    const targetConfigs = pricingConfigs.filter(c => isSupplierMatch(c.supplier_name, targetSupplier))
    targetConfigs.forEach(p => {
      priceMap[p.cylinder_size_code] = p.refill_price.toString()
    })

    // 2. Fallback to Linde / base prices for any unpopulated size codes
    const defaultConfigs = pricingConfigs.filter(c => isLindeSupplier(c.supplier_name))
    defaultConfigs.forEach(p => {
      if (!priceMap[p.cylinder_size_code]) {
        priceMap[p.cylinder_size_code] = p.refill_price.toString()
      }
    })

    // 3. Fallback defaults for standard size codes
    const DEFAULT_SIZES = ['101-F', '101-N', 'P101-D', 'P101-E', 'P101-F', 'P101-HS']
    DEFAULT_SIZES.forEach(sc => {
      if (!priceMap[sc]) {
        priceMap[sc] = '0'
      }
    })

    setEditedPrices(priceMap)
  }, [selectedModalSupplier, isAddingNewSupplier, customSupplierInput, pricingConfigs])

  /**
   * Consolidates received cylinder items for a single reception record or a monthly consolidated record.
   * Handles per-reception breakdown so that un-itemized legacy records or mixed-record months are
   * accurately aggregated without dropping any deliveries.
   */
  const fetchAndConsolidateReceptionItems = async (
    targetRecord: OxygenReceptionRecord | any,
    targetSupplierName: string
  ): Promise<OxygenPdfItem[]> => {
    // 1. Gather all reception IDs for this record or month
    const idSet = new Set<string>()

    // Add direct targetRecord id if not a synthetic monthly key
    if (targetRecord.id && typeof targetRecord.id === 'string' && !targetRecord.id.startsWith('monthly-')) {
      idSet.add(targetRecord.id)
    }

    // Add all IDs in targetRecord.ids
    if (Array.isArray(targetRecord.ids)) {
      targetRecord.ids.forEach((id: string) => { if (id && typeof id === 'string' && !id.startsWith('monthly-')) idSet.add(id) })
    }

    // Flatten all sub-records and their nested ids
    if (Array.isArray(targetRecord.records)) {
      targetRecord.records.forEach((rec: any) => {
        if (rec.id && typeof rec.id === 'string' && !rec.id.startsWith('monthly-')) idSet.add(rec.id)
        if (Array.isArray(rec.ids)) {
          rec.ids.forEach((subId: string) => { if (subId && typeof subId === 'string' && !subId.startsWith('monthly-')) idSet.add(subId) })
        }
      })
    }

    // If monthKey is present, query ALL reception IDs for this month directly from DB for 100% completeness
    const monthKey: string | undefined = targetRecord.monthKey
    const targetHospitalId = targetRecord.hospital_id || hospitalId
    if (monthKey && targetHospitalId) {
      const [yrStr, moStr] = monthKey.split('-')
      const year = parseInt(yrStr, 10)
      const month = parseInt(moStr, 10)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const { data: monthRecs } = await supabase
        .from('pharmacy_oxygen_reception_records')
        .select('id')
        .eq('hospital_id', targetHospitalId)
        .gte('reception_date', startDate)
        .lte('reception_date', endDate)
      if (monthRecs && monthRecs.length > 0) {
        monthRecs.forEach((r: any) => { if (r.id) idSet.add(r.id) })
      }
    }

    const allRecIds = Array.from(idSet)

    // 2. Fetch raw items from DB for all receptions
    const { data: rawItems } = await supabase
      .from('pharmacy_oxygen_reception_items')
      .select('*, size_info:pharmacy_oxygen_cylinder_sizes(*)')
      .in('reception_id', allRecIds)

    // 3. Build a lookup of loan rates from pricingConfigs for this supplier
    //    Key: size_code (e.g. "101-N"), Value: loan rate per cylinder (e.g. 15.00)
    const supplierLoanRates: Record<string, number> = {}
    pricingConfigs
      .filter(c => isSupplierMatch(c.supplier_name, targetSupplierName))
      .forEach(c => {
        if (c.loan_rate != null && c.loan_rate > 0) {
          supplierLoanRates[c.cylinder_size_code] = Number(c.loan_rate)
        }
      })

    // 4. For each item row, determine is_loan using this logic:
    //    - If size_info.is_loan is FALSE on the size: it is ALWAYS a refill (Standard Refill)
    //    - If size_info.is_loan is TRUE on the size: compare unit_price against the known
    //      loan rate for that size. If unit_price <= loanRate * 1.5, it is a loan fee row.
    //      If unit_price >> loanRate (i.e. matches the refill price), it is a refill.
    //    This is necessary because the schema stores 101-N cylinder type as is_loan=true
    //    but it also receives actual refill gas (at RM 250) plus a separate loan fee (at RM 15).
    const resolveIsLoan = (itm: any): boolean => {
      const sizeIsLoan: boolean = itm.size_info?.is_loan === true
      if (!sizeIsLoan) return false // P101-D, P101-E, P101-F, P101-HS → always refill

      // For 101-N and 101-F (marked as loan sizes):
      // A loan FEE row has a very low unit_price (e.g. RM 15 for cylinder hire)
      // A refill row has the full gas price (e.g. RM 250 for 101-N refill)
      const sizeCode = itm.size_info?.code || ''
      const unitPrice = Number(itm.unit_price || 0)
      const knownLoanRate = supplierLoanRates[sizeCode] ?? 0

      if (knownLoanRate > 0) {
        // Loan fee rows are at or near the known loan rate; refills are much higher
        return unitPrice <= knownLoanRate * 2
      }
      // Fallback: if loan rate is unknown but unit_price is very low (<= 50), treat as loan fee
      return unitPrice <= 50
    }

    // 5. Consolidated aggregation: key → { size_code, is_loan, qty, price }
    const groupMap: Record<string, { size_code: string; is_loan: boolean; qty: number; price: number }> = {}

    ;(rawItems || []).forEach((itm: any) => {
      const sizeCode = itm.size_info?.code || 'Standard'
      const unitPrice = Number(itm.unit_price || 0)
      const isLoan = resolveIsLoan(itm)
      const key = `${sizeCode}-${isLoan ? 'loan' : 'refill'}`

      if (!groupMap[key]) {
        groupMap[key] = {
          size_code: sizeCode,
          is_loan: isLoan,
          qty: 1,
          price: unitPrice
        }
      } else {
        groupMap[key].qty += 1
      }
    })

    // 6. Format final items list using contract prices from pricingConfigs
    const formattedItems: OxygenPdfItem[] = []
    Object.values(groupMap).forEach((val) => {
      let cleanPrice = val.price
      if (!val.is_loan) {
        const contractPrice = getActivePrice(val.size_code, targetSupplierName)
        if (contractPrice > 0) cleanPrice = contractPrice
      } else {
        const lRate = getActiveLoanRate(val.size_code, targetSupplierName)
        if (lRate > 0) cleanPrice = lRate
      }

      formattedItems.push({
        size_code: val.size_code,
        is_loan: val.is_loan,
        quantity: val.qty,
        unit_price: cleanPrice,
        total_price: val.qty * cleanPrice
      })
    })

    return formattedItems
  }

  useEffect(() => {
    if (!isPoPreviewModalOpen || !previewRecord) return

    let active = true
    const generatePreview = async () => {
      try {
        // Dynamic supplier lookup for PO PDF
        const targetSupName = previewRecord.supplier_name || selectedReceiveSupplier || 'LINDE EOX SDN BHD (CAW. MIRI)'
        const matchedSup = dbSuppliers.find(s => isSupplierMatch(s.company_name, targetSupName))

        // Build per-size loan rates from pricingConfigs for the matched supplier
        const supplierLoanRates: Record<string, number> = {}
        pricingConfigs
          .filter(c => isSupplierMatch(c.supplier_name, targetSupName))
          .forEach(c => { if (c.loan_rate != null) supplierLoanRates[c.cylinder_size_code] = c.loan_rate })

        const formattedItems = await fetchAndConsolidateReceptionItems(previewRecord, targetSupName)

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
          supplierName: matchedSup?.company_name || targetSupName,
          supplierAddress: matchedSup?.address || (isLindeSupplier(targetSupName) ? lindeSupplier?.address : '') || '',
          supplierPhone: matchedSup?.phone || (isLindeSupplier(targetSupName) ? lindeSupplier?.phone : '') || '',
          loanRates: supplierLoanRates
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

  // Password Protection Modal state for Reset Inventory
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [clearPasswordInput, setClearPasswordInput] = useState('')
  const [clearPasswordError, setClearPasswordError] = useState('')
  const [showClearPassword, setShowClearPassword] = useState(false)

  // Fetch real data
  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    setError(null)

    // Determine target page size: 5000 if we are on cylinders registry or reconciliation pages, otherwise 10
    const needsFullList = 
      currentPath === '/pharmacy/oxygen/cylinders' || 
      currentPath === '/pharmacy/oxygen/reconciliation' ||
      currentPath === '/pharmacy/oxygen/qr'
    const limit = needsFullList ? 5000 : 10

    try {
      const [
        summaryRes, 
        listRes, 
        historyRes,
        finRes,
        pricingRes,
        pricingHistoryRes,
        receptionsRes,
        settingsRes,
        typesRes
      ]: [
        ApiResponse<OxygenSummary>,
        ApiResponse<Paginated<OxygenCylinderWithRelations>>,
        ApiResponse<OxygenConsumptionWithRelations[]>,
        ApiResponse<OxygenFinancialSummary>,
        ApiResponse<OxygenPricingConfig[]>,
        ApiResponse<any[]>,
        ApiResponse<OxygenReceptionRecord[]>,
        ApiResponse<OxygenSystemSettings>,
        ApiResponse<OxygenCylinderTypeInfo[]>
      ] = await Promise.all([
        getOxygenSummary(hospitalId),
        getOxygenCylinders(hospitalId, {}, 1, limit) as any,
        getOxygenConsumptionHistory(hospitalId),
        getOxygenFinancialSummary(hospitalId),
        getOxygenLatestPricing(hospitalId),
        getOxygenPricingHistory(hospitalId),
        getOxygenReceptionsList(hospitalId),
        getOxygenSystemSettings(hospitalId),
        getOxygenCylinderTypes()
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

      // Only fetch tagged cylinders if we are on the paths that need them
      if (needsFullList) {
        const taggedRes = await getOxygenCylinders(hospitalId, { qr_tagged: true }, 1, 5000)
        if (taggedRes.data) {
          setTaggedCylindersList(taggedRes.data.data || [])
        }
      } else {
        setTaggedCylindersList([])
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
          priceMap[p.cylinder_size_code] = p.refill_price.toString()
        })
        setEditedPrices(priceMap)
      }
      if (pricingHistoryRes.data) {
        setPricingHistory(pricingHistoryRes.data)
      }
      if (receptionsRes.data) setReceptionsList(receptionsRes.data)
      if (settingsRes.data) setSystemSettings(settingsRes.data)

      if (typesRes.data) {
        setCylinderTypes(typesRes.data)
      }


      const sigsRes = await getPharmacyPOSignatures(hospitalId)
      if (sigsRes.data) {
        setSignatures(sigsRes.data)
        setTempSignatures(sigsRes.data)
      }

      const { data: rawUsers } = await supabase
        .from('users')
        .select('id, full_name, jawatan, department_id, role:roles(role_name)')
        .eq('hospital_id', hospitalId)
      if (rawUsers) {
        setHospitalUsers(rawUsers as any)
      }

      // Load Cylinder Request & Dispatch Data
      const dispatchRes = await getCylinderDispatchRequests(hospitalId)
      if (dispatchRes.data) setDispatchRequests(dispatchRes.data)

      const kpiRes = await getCylinderDispatchKPI(hospitalId)
      if (kpiRes.data) setDispatchKpi(kpiRes.data)

      const clinicalDepts = await getClinicalDepartments(hospitalId)
      if (clinicalDepts && clinicalDepts.length > 0) {
        setDepartmentsList(clinicalDepts.map(d => ({ id: d.id, department_name: d.department_name })))
      }

      // Fetch reconciliation audit logs
      if (isSupabaseConfigured()) {
        try {
          const { data: auditLogsData } = await supabase
            .from('audit_logs')
            .select('*, user:users(full_name, jawatan)')
            .eq('module', 'OXYGEN_INVENTORY')
            .in('action', ['RECONCILED_CYLINDER_STATUS', 'VERIFIED_CYLINDER_AUDIT', 'AUTO_REGISTER_ON_SCAN', 'STOCK_RECONCILIATION'])
            .order('created_at', { ascending: false })
            .limit(20)
          
          if (auditLogsData) {
            setReconciliationLogs(auditLogsData)
          }
        } catch (auditErr) {
          console.warn('Failed to fetch audit logs:', auditErr)
        }
      } else {
        // Fallback mock logs
        setReconciliationLogs([
          {
            id: 'log-1',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            user: { full_name: 'Kamriah Bt Haji Mail', jawatan: 'Penolong Pegawai Farmasi' },
            new_values: { serial_number: '101-I-PI-0001', status: 'available', location: 'Pharmacy Store' },
            old_values: { status: 'empty' }
          },
          {
            id: 'log-2',
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            user: { full_name: 'Tan Yuang Zhang', jawatan: 'Pegawai Farmasi UF12' },
            new_values: { serial_number: '101 F 0002', status: 'returned_to_supplier', location: 'Supplier' },
            old_values: { status: 'available' }
          }
        ])
      }

    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred while loading oxygen records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    if (currentPath === '/pharmacy/oxygen/cylinders' && hospitalId) {
      const loadInventoryDashboardData = async () => {
        const [aggRes, deptRes, docsRes, reqsRes, ledgerRes] = await Promise.all([
          getCylinderInventoryByType(hospitalId),
          getCylindersByDepartment(hospitalId),
          getReturnDocuments(hospitalId),
          getRequestDocuments(hospitalId),
          getStoreUsageBalance(hospitalId, ledgerStartDate, ledgerEndDate),
        ])
        if (aggRes.data) setCylinderAggregates(aggRes.data)
        if (deptRes.data) setDeptDistribution(deptRes.data)
        if (docsRes.data) setReturnDocs(docsRes.data)
        if (reqsRes.data) setRequestDocs(reqsRes.data)
        if (ledgerRes.data) setLedgerData(ledgerRes.data)
      }
      void loadInventoryDashboardData()
    }
  }, [hospitalId, currentPath, ledgerStartDate, ledgerEndDate])

  const handleRefreshInventoryData = async () => {
    if (!hospitalId) return
    setCylinderAggregates([])
    setDeptDistribution([])
    setReturnDocs([])
    setRequestDocs([])
    setLedgerData([])
    const [aggRes, deptRes, docsRes, reqsRes, ledgerRes] = await Promise.all([
      getCylinderInventoryByType(hospitalId),
      getCylindersByDepartment(hospitalId),
      getReturnDocuments(hospitalId),
      getRequestDocuments(hospitalId),
      getStoreUsageBalance(hospitalId, ledgerStartDate, ledgerEndDate),
    ])
    if (aggRes.data) setCylinderAggregates(aggRes.data)
    if (deptRes.data) setDeptDistribution(deptRes.data)
    if (docsRes.data) setReturnDocs(docsRes.data)
    if (reqsRes.data) setRequestDocs(reqsRes.data)
    if (ledgerRes.data) setLedgerData(ledgerRes.data)
  }

  const handleOpenClearModal = () => {
    setClearPasswordInput('')
    setClearPasswordError('')
    setShowClearPassword(false)
    setIsClearModalOpen(true)
  }

  const handleConfirmClearInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId) return

    if (clearPasswordInput !== 'F@rmasi.2016') {
      setClearPasswordError(
        language === 'ms'
          ? 'Akses Ditolak: Kata laluan pentadbir tidak sah.'
          : 'Access Denied: Invalid administrator password.'
      )
      return
    }

    setIsLoading(true)
    setClearPasswordError('')
    try {
      const res = await clearCylinderInventory(hospitalId, user?.id, clearPasswordInput)
      if (res.data) {
        await loadData()
        await handleRefreshInventoryData()
        setIsClearModalOpen(false)
        setClearPasswordInput('')
        alert(
          language === 'ms'
            ? 'PENGESAHAN KESELAMATAN: Data stok silinder telah diset semula & log audit telah direkodkan.'
            : 'SECURITY CONFIRMED: Stock inventory has been reset & audit log recorded.'
        )
      } else {
        setClearPasswordError(res.error || 'Gagal mengosongkan inventori.')
      }
    } catch (err: any) {
      console.error(err)
      setClearPasswordError('Ralat sistem semasa mengosongkan stok.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return <Badge variant="success">Full</Badge>
      case 'empty':
        return <Badge variant="secondary">Empty</Badge>
      case 'in_use':
        return <Badge variant="info">In Use</Badge>
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>
      case 'disposed':
        return <Badge variant="error">Disposed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Filtered cylinders based on user inputs
  const filteredCylinders = cylinders.filter(c => {
    const matchesSearch = c.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter ? c.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  // Columns for Cylinder Table
  const cylinderColumns: Column<OxygenCylinderWithRelations>[] = [
    {
      key: 'serial_number',
      label: 'Serial Number',
      className: 'font-mono text-xs text-gray-700 font-bold',
    },
    {
      key: 'type_info',
      label: 'Cylinder Size & Type',
      className: 'text-sm text-gray-900',
      render: (_, row) => row.type_info?.type_name || 'Standard Cylinder',
    },
    {
      key: 'current_location',
      label: 'Storage Location',
      className: 'text-sm text-gray-600',
      render: (_, row) => row.current_location?.location_name || 'Central Pharmacy Store',
    },
    {
      key: 'assigned_ward',
      label: 'Assigned Department',
      className: 'text-sm text-gray-600',
      render: (_, row) => row.assigned_ward?.department_name || '-',
    },
    {
      key: 'status',
      label: 'Current Status',
      className: 'text-right',
      render: (value) => renderStatusBadge(String(value)),
    },
  ]

  // Columns for Consumption/Refill History Table
  const consumptionColumns: Column<OxygenConsumptionWithRelations>[] = [
    {
      key: 'consumption_date',
      label: 'Date',
      className: 'text-sm text-gray-900',
      render: (value) => value ? new Date(String(value)).toLocaleDateString() : '-',
    },
    {
      key: 'cylinder',
      label: 'Cylinder Serial',
      className: 'font-mono text-xs text-gray-700 font-bold',
      render: (_, row) => row.cylinder?.serial_number || 'BULK DISPATCH',
    },
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

  const getReconciliationChangesList = (): AuditChangeItem[] => {
    const allTrackedIds = Array.from(new Set([...Object.keys(physicalCounts), ...Object.keys(physicalLocations)]));
    return allTrackedIds
      .map(cylId => {
        const cyl = cylinders.find(c => c.id === cylId);
        if (!cyl) return null;
        const normalizedOld = getExpectedStateForCylinder(cyl);
        const normalizedNew = physicalCounts[cylId] ? normalizeStatusForReconciliation(physicalCounts[cylId]) : normalizedOld;
        const rawOldLocation = getCylinderLocation(cyl, normalizedOld);
        const rawNewLocation = physicalLocations[cylId] || getCylinderLocation(cyl, normalizedNew);
        const oldLocation = typeof rawOldLocation === 'object' ? (rawOldLocation?.location_name || rawOldLocation?.name || 'Pharmacy Store') : (rawOldLocation || 'Pharmacy Store');
        const newLocation = typeof rawNewLocation === 'object' ? (rawNewLocation?.location_name || rawNewLocation?.name || 'Pharmacy Store') : (rawNewLocation || 'Pharmacy Store');

        const statusChanged = normalizedOld !== normalizedNew;
        const locationChanged = Boolean(physicalLocations[cylId]);

        if (!statusChanged && !locationChanged) return null;

        return {
          cylinderId: cyl.id,
          serialNumber: cyl.serial_number,
          typeInfo: cyl.type_info?.type_name || 'Medical Oxygen',
          sizeInfo: cyl.size_info?.capacity ? `${cyl.size_info.capacity}m³` : 'Standard',
          oldStatus: getStatusLabel(normalizedOld),
          newStatus: getStatusLabel(normalizedNew),
          oldLocation: oldLocation,
          newLocation: newLocation
        };
      })
      .filter(Boolean) as AuditChangeItem[];
  };

  const handleOpenAuditReview = () => {
    const changes = getReconciliationChangesList();
    if (changes.length === 0) {
      alert('No status or location changes to save.');
      return;
    }
    setIsAuditReviewOpen(true);
  };

  const handleAuditSubmit = async (remarks?: string) => {
    if (!hospitalId || !user?.id) return;
    setIsSavingReconciliation(true);
    setAuditSuccessMsg(null);
    
    try {
      const allTrackedIds = Array.from(new Set([...Object.keys(physicalCounts), ...Object.keys(physicalLocations)]));
      const updates = allTrackedIds.filter(cylId => {
        const cyl = cylinders.find(c => c.id === cylId);
        if (!cyl) return false;
        const normalizedOld = getExpectedStateForCylinder(cyl);
        const normalizedNew = physicalCounts[cylId] ? normalizeStatusForReconciliation(physicalCounts[cylId]) : normalizedOld;
        const locationChanged = Boolean(physicalLocations[cylId]);
        return normalizedOld !== normalizedNew || locationChanged;
      });

      if (updates.length === 0) {
        alert('No status or location changes to save.');
        setIsSavingReconciliation(false);
        setIsAuditReviewOpen(false);
        return;
      }

      let successCount = 0;

      for (const cylId of updates) {
        const cyl = cylinders.find(c => c.id === cylId);
        if (!cyl) continue;

        const normalizedOld = getExpectedStateForCylinder(cyl);
        const normalizedNew = physicalCounts[cylId] || normalizedOld;
        const rawNewLocation = physicalLocations[cylId] || getCylinderLocation(cyl, normalizedNew);
        const newLocation = typeof rawNewLocation === 'object' ? (rawNewLocation?.location_name || rawNewLocation?.name || 'Pharmacy Store') : (rawNewLocation || 'Pharmacy Store');
        const dbStatus = mapReconciliationToDbStatus(normalizedNew, newLocation);

        if (isSupabaseConfigured()) {
          // Update the primary table (pharmacy_oxygen_cylinder_inventory) which holds the data
          const { error: updateErr } = await supabase
            .from('pharmacy_oxygen_cylinder_inventory')
            .update({
              status: dbStatus,
              current_location: newLocation,
              updated_at: new Date().toISOString()
            })
            .eq('id', cylId);

          if (updateErr) {
            console.error(`Failed to update cylinder ${cyl.serial_number}:`, updateErr);
            continue;
          }

          // Insert audit log
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'RECONCILED_CYLINDER_STATUS',
            module: 'OXYGEN_INVENTORY',
            entity_type: 'cylinder',
            entity_id: cylId,
            old_values: { status: normalizedOld },
            new_values: { status: normalizedNew, serial_number: cyl.serial_number, location: newLocation, remarks: remarks || null },
            ip_address: null,
            user_agent: null,
            created_at: new Date().toISOString()
          });

          successCount++;
        } else {
          // Mock update
          const mockCylIndex = mockOxygenCylinders.findIndex(c => c.id === cylId);
          if (mockCylIndex !== -1) {
            mockOxygenCylinders[mockCylIndex].status = dbStatus;
            mockOxygenCylinders[mockCylIndex].current_location = { location_name: newLocation };
            mockOxygenCylinders[mockCylIndex].updated_at = new Date().toISOString();
          }

          // Update local state copy
          cyl.status = dbStatus;
          cyl.current_location = { location_name: newLocation };

          // Add to local reconciliation logs list
          const newLog = {
            id: `log-${Date.now()}-${Math.random()}`,
            created_at: new Date().toISOString(),
            user: { full_name: user.full_name || 'Pharmacy Officer', jawatan: user.jawatan || 'Officer' },
            new_values: { serial_number: cyl.serial_number, status: normalizedNew, location: newLocation, remarks: remarks || null },
            old_values: { status: normalizedOld }
          };
          setReconciliationLogs(prev => [newLog, ...prev]);
          successCount++;
        }
      }

      setPhysicalCounts({});
      setPhysicalLocations({});
      setIsAuditReviewOpen(false);
      setAuditSuccessMsg(`Stock reconciliation verified. ${successCount} status changes logged successfully.`);
      setTimeout(() => setAuditSuccessMsg(null), 5000);
      await loadData();
    } catch (err) {
      console.error('Reconciliation save error:', err);
      alert('Failed to save reconciliation audit.');
    } finally {
      setIsSavingReconciliation(false);
    }
  };

  // --- NEW FINANCIAL LOGIC ---
  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !user?.id) return
    setIsSavingPrices(true)
    try {
      const targetSupplier = isAddingNewSupplier && customSupplierInput.trim()
        ? customSupplierInput.trim()
        : selectedModalSupplier

      const pricesToInsert = Object.keys(editedPrices).map(sizeCode => {
        const isLoanCyl = sizeCode === '101-N' || sizeCode === '101-F'
        const loanVal = editedLoanRates[sizeCode] !== undefined 
          ? parseFloat(editedLoanRates[sizeCode]) 
          : (systemSettings?.loan_cylinder_rate || 18.36)
        return {
          size_code: sizeCode,
          refill_price: parseFloat(editedPrices[sizeCode]) || 0,
          ...(isLoanCyl ? { loan_rate: isNaN(loanVal) ? 18.36 : loanVal } : {})
        }
      })

      const res = await updateCylinderPrices(hospitalId, pricesToInsert, effectiveFrom, user.id, targetSupplier)
      if (res.error) {
        alert(res.error)
      } else {
        setIsPricingModalOpen(false)
        if (isAddingNewSupplier && customSupplierInput.trim()) {
          setSelectedModalSupplier(customSupplierInput.trim())
          setIsAddingNewSupplier(false)
          setCustomSupplierInput('')
        }
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
      const poSupplierName = previewRecord.supplier_name || 'LINDE EOX SDN BHD (CAW. MIRI)'
      const poMatchedSup = dbSuppliers.find(s => isSupplierMatch(s.company_name, poSupplierName))

      // Build per-size loan rates from pricingConfigs for the matched supplier
      const poLoanRates: Record<string, number> = {}
      pricingConfigs
        .filter(c => isSupplierMatch(c.supplier_name, poSupplierName))
        .forEach(c => { if (c.loan_rate != null) poLoanRates[c.cylinder_size_code] = c.loan_rate })

      const formattedItems = await fetchAndConsolidateReceptionItems(previewRecord, poSupplierName)

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
        supplierName: poMatchedSup?.company_name || poSupplierName,
        supplierAddress: poMatchedSup?.address || (isLindeSupplier(poSupplierName) ? lindeSupplier?.address : '') || '',
        supplierPhone: poMatchedSup?.phone || (isLindeSupplier(poSupplierName) ? lindeSupplier?.phone : '') || '',
        loanRates: poLoanRates
      })

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setIsPoPreviewModalOpen(false)
    } catch (err) {
      console.error('Error generating PO PDF:', err)
      alert('Failed to generate PO PDF.')
    }
  }

  const getSupplierPricingConfig = (sizeCode: string, supplierName: string) => {
    const supplierConfigs = pricingConfigs.filter(c => isSupplierMatch(c.supplier_name, supplierName))
    const match = supplierConfigs.find(c => c.cylinder_size_code === sizeCode)
    if (match) return match
    // Only fall back to Linde if supplierName is unselected or is Linde
    if (!supplierName || isLindeSupplier(supplierName)) {
      return pricingConfigs.find(c => isLindeSupplier(c.supplier_name) && c.cylinder_size_code === sizeCode)
    }
    return undefined
  }

  const getActivePrice = (sizeCode: string, supplierName = selectedReceiveSupplier): number => {
    const config = getSupplierPricingConfig(sizeCode, supplierName)
    if (config) return config.refill_price
    // Default fallback base refill prices when no config found for specific size
    if (sizeCode === '101-N') return 250.00
    if (sizeCode === '101-F') return 117.20
    return 0
  }

  const getActiveLoanRate = (sizeCode: string, supplierName = selectedReceiveSupplier): number => {
    const config = getSupplierPricingConfig(sizeCode, supplierName)
    if (config?.loan_rate != null) return config.loan_rate
    if (supplierName && !isLindeSupplier(supplierName)) return 15.00
    return systemSettings?.loan_cylinder_rate || 18.36
  }

  // Dynamic cost calculations for key-in form
  const getRefillCostForSize = (sizeCode: string): number => {
    const qty = receiveQuantities[sizeCode] || 0
    const price = getActivePrice(sizeCode, selectedReceiveSupplier)
    return qty * price
  }

  const getLoanCostForSize = (sizeCode: string): number => {
    const isLoanSize = sizeCode.startsWith('101-')
    const rate = getActiveLoanRate(sizeCode, selectedReceiveSupplier)
    if (isLoanSize) {
      const qtyRefilled = receiveQuantities[sizeCode] || 0
      const qtyLoaned = receiveLoans[sizeCode] || 0
      return (qtyRefilled + qtyLoaned) * rate
    }
    const qtyLoaned = receiveLoans[sizeCode] || 0
    return qtyLoaned * rate
  }

  const getActiveSizeCodes = (): string[] => {
    const fromConfigs = pricingConfigs
      .filter((c) => isSupplierMatch(c.supplier_name, selectedReceiveSupplier) || isLindeSupplier(c.supplier_name))
      .map(c => c.cylinder_size_code)
    const fromInputs = [...Object.keys(receiveQuantities), ...Object.keys(receiveLoans)]
    return Array.from(new Set([...fromConfigs, ...fromInputs]))
  }

  const calculateFormRefillTotal = (): number => {
    return getActiveSizeCodes().reduce((sum, sizeCode) => {
      return sum + getRefillCostForSize(sizeCode)
    }, 0)
  }

  const calculateFormLoanTotal = (): number => {
    return getActiveSizeCodes().reduce((sum, sizeCode) => {
      return sum + getLoanCostForSize(sizeCode)
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
      
      // Retrieve sizes from DB
      const { data: sizesList } = await supabase.from('pharmacy_oxygen_cylinder_sizes').select('*')
      const { data: typesList } = await supabase.from('pharmacy_oxygen_cylinder_types').select('*')
      const defaultType = typesList?.[0]?.id || ''

      for (const sizeCode of getActiveSizeCodes()) {
        const qtyRefilled = receiveQuantities[sizeCode] || 0
        const qtyLoaned = receiveLoans[sizeCode] || 0
        if (qtyRefilled === 0 && qtyLoaned === 0) continue
        
        const sizeObj = sizesList?.find(s => s.code === sizeCode || s.code === sizeCode.replace(/^P/, '') || `P${s.code}` === sizeCode)
        if (!sizeObj) continue

        const basePrice = getActivePrice(sizeCode, selectedReceiveSupplier)
        const loanRate = getActiveLoanRate(sizeCode, selectedReceiveSupplier)

        // Insert refilled items
        if (qtyRefilled > 0) {
          const itemPrice = basePrice
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
          const itemPrice = loanRate
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
          status: receptionStatus,
          supplier_name: selectedReceiveSupplier
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
      const poSupplierName = record.supplier_name || selectedReceiveSupplier || 'LINDE EOX SDN BHD (CAW. MIRI)'
      const matchedSup = dbSuppliers.find(s => isSupplierMatch(s.company_name, poSupplierName))

      const formattedItems = await fetchAndConsolidateReceptionItems(record, poSupplierName)

      const totalAmount = formattedItems.reduce((sum, item) => sum + item.total_price, 0)
      const currentBalance = financials?.current_balance ?? 274000.0
      const calculatedBalanceBefore = currentBalance + totalAmount
      const calculatedBalanceAfter = currentBalance

      const poLoanRates: Record<string, number> = {}
      pricingConfigs
        .filter(c => isSupplierMatch(c.supplier_name, poSupplierName))
        .forEach(c => { if (c.loan_rate != null) poLoanRates[c.cylinder_size_code] = c.loan_rate })

      const blob = await generateOxygenPoPdf({
        reception: record,
        items: formattedItems,
        applicantName: signatures.applicantName,
        applicantPosition: signatures.applicantPosition,
        headName: signatures.headName,
        headPosition: signatures.headPosition,
        balanceBefore: calculatedBalanceBefore,
        balanceAfter: calculatedBalanceAfter,
        supplierName: matchedSup?.company_name || poSupplierName,
        supplierAddress: matchedSup?.address || (isLindeSupplier(poSupplierName) ? lindeSupplier?.address : '') || '',
        supplierPhone: matchedSup?.phone || (isLindeSupplier(poSupplierName) ? lindeSupplier?.phone : '') || '',
        loanRates: poLoanRates
      })

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error generating PO PDF:', err)
      alert('Failed to generate PO PDF.')
    }
  }

  const handleDownloadReport = async (record: OxygenReceptionRecord) => {
    try {
      const reportSupplierName = record.supplier_name || selectedReceiveSupplier || 'LINDE EOX SDN BHD (CAW. MIRI)'

      const formattedItems = await fetchAndConsolidateReceptionItems(record, reportSupplierName)

      const reportLoanRates: Record<string, number> = {}
      pricingConfigs
        .filter(c => isSupplierMatch(c.supplier_name, reportSupplierName))
        .forEach(c => { if (c.loan_rate != null) reportLoanRates[c.cylinder_size_code] = c.loan_rate })

      const blob = await generateOxygenReceptionReportPdf({
        reception: record,
        items: formattedItems,
        applicantName: user?.full_name || 'Ahmad Bin Ismail',
        applicantPosition: user?.role?.role_name || 'Pharmacist',
        loanRates: reportLoanRates
      })

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error generating Reception Report PDF:', err)
      alert('Failed to generate Reception Report PDF.')
    }
  }

  const handleGenerateBatchQr = async () => {
    if (!selectedTypeId || !user || !hospitalId) return
    setIsAssigningTag(true)
    try {
      const res = await generateNewCylindersWithQr(hospitalId, selectedTypeId, generateQuantity, user.id)
      if (res.data) {
        await loadData()
        setGeneratedLabels(res.data)
        alert(`Successfully generated and registered ${res.data.length} new cylinders with QR codes!`)
      } else {
        alert(res.error || 'Failed to generate cylinders.')
      }
    } catch (err) {
      console.error(err)
      alert('Error generating cylinders.')
    } finally {
      setIsAssigningTag(false)
    }
  }

  const handleRegisterSupplierTags = async () => {
    if (!selectedTypeId || !user || !hospitalId) return
    
    // Filter out empty rows and trim values
    const cleanedTags = supplierTagRows
      .map(t => t.trim())
      .filter(t => t.length > 0)

    if (cleanedTags.length === 0) {
      alert('Please fill in at least one supplier cylinder ID.')
      return
    }

    // Deduplicate tags for database insertion
    const uniqueTags = Array.from(new Set(cleanedTags.map(t => t.toUpperCase())))

    setIsAssigningTag(true)
    try {
      const res = await addSupplierTaggedLoanCylinders(
        hospitalId,
        selectedTypeId,
        uniqueTags,
        user.id
      )
      if (res.data) {
        await loadData()
        setGeneratedLabels(res.data.success)
        
        let message = `Successfully registered ${res.data.success.length} loan cylinders with supplier tags!`
        if (res.data.conflicts.length > 0) {
          message += `\n\nSkipped ${res.data.conflicts.length} duplicate tags (already registered): ${res.data.conflicts.join(', ')}`
        }
        alert(message)
        
        // Reset rows to 1 empty row upon success
        setSupplierTagRows([''])
      } else {
        alert(res.error || 'Failed to register supplier cylinders.')
      }
    } catch (err) {
      console.error(err)
      alert('Error registering supplier cylinders.')
    } finally {
      setIsAssigningTag(false)
    }
  }


  const handleDeactivateQrTag = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate and remove this QR tag? This cylinder will need to be re-tagged before it can be scanned.')) return
    try {
      const res = await deactivateCylinderQrTag(id)
      if (res.data) {
        await loadData()
        setGeneratedLabels(prev => prev.filter(c => c.id !== id))
        alert('QR Tag successfully deactivated.')
      } else {
        alert(res.error || 'Failed to deactivate QR tag.')
      }
    } catch (err) {
      console.error(err)
      alert('Error deactivating QR tag.')
    }
  }

  const renderActiveView = () => {
    // 1. CYLINDER INVENTORY VIEW (Implementation Plan Dashboard)
    if (currentPath === '/pharmacy/oxygen/cylinders') {
      // Compute KPI totals from aggregates
      const kpiTotals = cylinderAggregates.reduce(
        (acc, curr) => ({
          total: acc.total + (curr.total || 0),
          available: acc.available + (curr.available || 0),
          inUse: acc.inUse + (curr.in_use || 0),
          returned: acc.returned + (curr.returned || 0),
        }),
        { total: 0, available: 0, inUse: 0, returned: 0 }
      )

      return (
        <div className="space-y-8">
          {/* Tab Navigation & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="grid grid-cols-2 md:flex md:flex-row bg-white/20 backdrop-blur-xl border border-white/30 p-1.5 rounded-[24px] md:rounded-3xl shadow-xl w-full max-w-full md:max-w-2xl relative z-30 gap-1 md:gap-0">
              {[
                { id: 'overview', label: language === 'ms' ? 'Gambaran Keseluruhan' : 'Overview Store Grid' },
                { id: 'unit_monitor', label: language === 'ms' ? 'Agihan Unit' : 'Unit Distribution' },
                { id: 'store_balance', label: language === 'ms' ? 'Lelang Inventori' : 'Store Usage Ledger' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCylinderActiveTab(tab.id as any)}
                  className={`md:flex-shrink-0 md:flex-1 px-3 md:px-4 py-3 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold transition-all duration-300 ${
                    cylinderActiveTab === tab.id
                      ? 'bg-[#00a68a] text-white shadow-xl'
                      : 'text-slate-600 hover:bg-white/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              
              {/* Supplier Returns Dropdown Tab */}
              <div className="relative md:flex-shrink-0 md:flex-1 md:min-w-[140px]">
                <button
                  onClick={() => {
                    setCylinderActiveTab('supplier_returns');
                    setSupplierReturnsDropdownOpen(!supplierReturnsDropdownOpen);
                  }}
                  className={`w-full px-3 md:px-4 py-3 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    cylinderActiveTab === 'supplier_returns'
                      ? 'bg-[#00a68a] text-white shadow-xl'
                      : 'text-slate-600 hover:bg-white/40'
                  }`}
                >
                  <span>{language === 'ms' ? 'Pemulangan Pembekal' : 'Supplier Returns'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${supplierReturnsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {supplierReturnsDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSupplierReturnsDropdownOpen(false);
                      }} 
                    />
                    <div className="absolute right-0 left-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCylinderActiveTab('supplier_returns');
                          setSupplierReturnsSubTab('returns');
                          setSupplierReturnsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all duration-200 ${
                          cylinderActiveTab === 'supplier_returns' && supplierReturnsSubTab === 'returns'
                            ? 'bg-rose-500/10 text-rose-600'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          cylinderActiveTab === 'supplier_returns' && supplierReturnsSubTab === 'returns' 
                            ? 'bg-rose-500 scale-110 shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                            : 'bg-slate-400'
                        }`} />
                        {language === 'ms' ? 'Pemulangan' : 'Returns'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCylinderActiveTab('supplier_returns');
                          setSupplierReturnsSubTab('requests');
                          setSupplierReturnsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all duration-200 ${
                          cylinderActiveTab === 'supplier_returns' && supplierReturnsSubTab === 'requests'
                            ? 'bg-blue-600/10 text-blue-600'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          cylinderActiveTab === 'supplier_returns' && supplierReturnsSubTab === 'requests' 
                            ? 'bg-blue-600 scale-110 shadow-[0_0_8px_rgba(37,99,235,0.6)]' 
                            : 'bg-slate-400'
                        }`} />
                        {language === 'ms' ? 'Permintaan' : 'Requests'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Clear Stock Data Protected Button */}
            <button
              onClick={handleOpenClearModal}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 shrink-0"
              title="Protected action: Clear stock data with admin password verification"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              {language === 'ms' ? 'Kosongkan Data (Imbasan Baru)' : 'Clear Data (Wait for Scanned Data)'}
            </button>
          </div>
 
          {/* Tab Content */}
          <div className="transition-all duration-500">
            {cylinderActiveTab === 'overview' && (
              <StoreBalanceGrid
                data={cylinderAggregates}
                onQuickIssue={() => setIsManualModalOpen(true)}
                onQuickScanEmpty={(combo) => {
                  setSelectedDepleteCombo(combo)
                  setIsScanOpen(true)
                }}
                onQuickCreateReturn={() => setIsReturnModalOpen(true)}
              />
            )}
 
            {cylinderActiveTab === 'unit_monitor' && <UnitDistributionTable data={deptDistribution} />}
 
            {cylinderActiveTab === 'store_balance' && (
              <StoreUsageBalanceTable
                data={ledgerData}
                startDate={ledgerStartDate}
                endDate={ledgerEndDate}
                onDateChange={(start, end) => {
                  setLedgerStartDate(start)
                  setLedgerEndDate(end)
                }}
                isLoading={isLedgerLoading}
              />
            )}
 
            {cylinderActiveTab === 'supplier_returns' && (
               <SupplierReturnsSection
                 documents={returnDocs}
                 requestDocuments={requestDocs}
                 onCreateClick={() => setIsReturnModalOpen(true)}
                 onCreateRequestClick={() => setIsRequestModalOpen(true)}
                 onScanClick={() => setIsScanOpen(true)}
                 onPrintClick={(docId) => setPrintDocId(docId)}
                 onPrintRequestClick={(docId) => setPrintRequestId(docId)}
                 isViewOnly={false}
                 subTab={supplierReturnsSubTab}
                 onSubTabChange={setSupplierReturnsSubTab}
                 hideSubTabBar={true}
                 onSuccess={async () => {
                   if (!hospitalId) return
                   const [aggRes, docsRes, reqsRes] = await Promise.all([
                     getCylinderInventoryByType(hospitalId),
                     getReturnDocuments(hospitalId),
                     getRequestDocuments(hospitalId),
                   ])
                   if (aggRes.data) setCylinderAggregates(aggRes.data)
                   if (docsRes.data) setReturnDocs(docsRes.data)
                   if (reqsRes.data) setRequestDocs(reqsRes.data)
                 }}
               />
             )}
          </div>

          {/* Scan Empty Cylinder Modal */}
          <ScanEmptyCylinderModal
            hospitalId={hospitalId || ''}
            isOpen={isScanOpen}
            targetCombo={selectedDepleteCombo}
            onClose={() => {
              setIsScanOpen(false)
              setSelectedDepleteCombo(null)
            }}
            sessionScannedCylinders={sessionScannedCylinders}
            setSessionScannedCylinders={setSessionScannedCylinders}
            onSuccess={async () => {
              if (!hospitalId) return
              const [aggRes, docsRes, reqsRes] = await Promise.all([
                getCylinderInventoryByType(hospitalId),
                getReturnDocuments(hospitalId),
                getRequestDocuments(hospitalId),
              ])
              if (aggRes.data) setCylinderAggregates(aggRes.data)
              if (docsRes.data) setReturnDocs(docsRes.data)
              if (reqsRes.data) setRequestDocs(reqsRes.data)
            }}
          />

          {/* Return Document Modals */}
          <CreateReturnDocumentModal
            hospitalId={hospitalId || ''}
            isOpen={isReturnModalOpen}
            onClose={() => setIsReturnModalOpen(false)}
            sessionScannedCylinders={sessionScannedCylinders}
            setSessionScannedCylinders={setSessionScannedCylinders}
            onSuccess={async () => {
              if (!hospitalId) return
              const [aggRes, docsRes, reqsRes] = await Promise.all([
                getCylinderInventoryByType(hospitalId),
                getReturnDocuments(hospitalId),
                getRequestDocuments(hospitalId),
              ])
              if (aggRes.data) setCylinderAggregates(aggRes.data)
              if (docsRes.data) setReturnDocs(docsRes.data)
              if (reqsRes.data) setRequestDocs(reqsRes.data)
            }}
          />

          {/* Request Document Modals */}
          <CreateRequestDocumentModal
            hospitalId={hospitalId || ''}
            isOpen={isRequestModalOpen}
            onClose={() => setIsRequestModalOpen(false)}
            onSuccess={async () => {
              if (!hospitalId) return
              const [aggRes, docsRes, reqsRes] = await Promise.all([
                getCylinderInventoryByType(hospitalId),
                getReturnDocuments(hospitalId),
                getRequestDocuments(hospitalId),
              ])
              if (aggRes.data) setCylinderAggregates(aggRes.data)
              if (docsRes.data) setReturnDocs(docsRes.data)
              if (reqsRes.data) setRequestDocs(reqsRes.data)
            }}
          />

          {printDocId && (
            <ReturnDocumentPrintView
              documentId={printDocId}
              isOpen={!!printDocId}
              onClose={() => setPrintDocId(null)}
            />
          )}

          {printRequestId && (
            <RequestDocumentPrintView
              documentId={printRequestId}
              isOpen={!!printRequestId}
              onClose={() => setPrintRequestId(null)}
            />
          )}
        </div>
      )
    }

    // 2. CYLINDER REQUEST VIEW (CONSUMPTION)
    if (currentPath === '/pharmacy/oxygen/consumption') {
      return (
        <div className="space-y-6">
          {dispatchKpi && <CylinderDispatchKpiCards kpi={dispatchKpi} />}

          <CylinderDispatchTable
            requests={dispatchRequests}
            departments={departmentsList}
            onViewDetails={(req) => setDetailRequest(req)}
            onPrint={(req) => setPrintDispatchRequestId(req.id)}
          />

          <ManualIssueModal
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            onSubmit={async (data) => {
              if (hospitalId) {
                await createManualIssue(hospitalId, {
                  ...data,
                  issuer_id: user?.id || ''
                })
                await loadData()
              }
            }}
            departments={departmentsList}
            currentUser={user as any}
            users={hospitalUsers}
            hospitalId={hospitalId || ''}
          />

          <UnitRequestModal
            isOpen={isUnitModalOpen}
            onClose={() => setIsUnitModalOpen(false)}
            onSubmit={async (data) => {
              if (hospitalId) {
                await createUnitRequest(hospitalId, {
                  ...data,
                  requester_id: user?.id || '',
                  priority: data.priority
                })
                await loadData()
              }
            }}
            departments={departmentsList}
            currentUser={user as any}
          />

          <DispatchRequestDetailModal
            isOpen={!!detailRequest}
            onClose={() => setDetailRequest(null)}
            request={detailRequest}
            currentUser={user as any}
            onApprove={async (id) => {
              await approveRequest(id, user?.id || '')
              await loadData()
            }}
            onReject={async (id, reason) => {
              await rejectRequest(id, user?.id || '', reason)
              await loadData()
            }}
            onIssue={async (id, items) => {
              await issueRequest(id, user?.id || '', items)
              await loadData()
            }}
            onComplete={async (id) => {
              await completeRequest(id)
              await loadData()
            }}
            onCancel={async (id) => {
              await cancelRequest(id)
              await loadData()
            }}
          />

          {printDispatchRequestId && (
            <CylinderDispatchPrintView
              requestId={printDispatchRequestId}
              isOpen={!!printDispatchRequestId}
              onClose={() => setPrintDispatchRequestId(null)}
            />
          )}
        </div>
      )
    }

    // 3. QR CODE LABEL GENERATOR
    if (currentPath === '/pharmacy/oxygen/qr') {
      const seenLoanSizes = new Set<string>()
      const uniqueTaggedCylindersList = taggedCylindersList.filter(c => {
        if (c.supplier_tagged) {
          return true
        }
        const serial = (c.serial_number || '').toUpperCase()
        const isLoan = c.is_loan || 
                       (c.size_info?.is_loan) || 
                       serial.startsWith('101-N') || 
                       serial.startsWith('101-F') ||
                       serial.startsWith('101N') ||
                       serial.startsWith('101F')

        if (isLoan) {
          const sizeCode = c.size_info?.code || (serial.includes('101-N') || serial.includes('101N') ? '101-N' : '101-F')
          if (seenLoanSizes.has(sizeCode)) {
            return false
          }
          seenLoanSizes.add(sizeCode)
          
          c.serial_number = sizeCode
          c.qr_code_value = `O2-${sizeCode}`
          if (c.size_info) {
            c.size_info.capacity = sizeCode === '101-N' ? '8.0' : '1.4'
          }
        }
        return true
      })

      const taggedCylinders = uniqueTaggedCylindersList.filter(c => {
        const matchesSearch = c.serial_number.toLowerCase().includes(qrSearchTerm.toLowerCase()) || 
          (c.qr_code_value && c.qr_code_value.toLowerCase().includes(qrSearchTerm.toLowerCase()))
        
        let matchesSize = true
        if (qrSizeFilter) {
          matchesSize = c.size_info?.code === qrSizeFilter || c.type_code === qrSizeFilter
        }

        let matchesType = true
        if (qrTypeFilter) {
          matchesType = c.type_info?.code === qrTypeFilter || (c.type_info?.type_name || '').includes(qrTypeFilter) || (c.type_info?.name || '').includes(qrTypeFilter)
        }

        return c.qr_code_value && matchesSearch && matchesSize && matchesType
      })

      const paginatedTaggedCylinders = taggedCylinders.slice(
        (qrPage - 1) * qrPageSize,
        qrPage * qrPageSize
      )

      const handlePrintIndividual = (stickerId: string) => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #sticker-${stickerId}, #sticker-${stickerId} * {
              visibility: visible !important;
            }
            #sticker-${stickerId} {
              position: absolute !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) scale(1.5) !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print-sticker-btn {
              display: none !important;
            }
          }
        `;
        document.head.appendChild(styleEl);
        window.print();
        document.head.removeChild(styleEl);
      };

      return (
        <div className="space-y-6">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-batch-stickers, #printable-batch-stickers * {
                visibility: visible !important;
              }
              #printable-batch-stickers {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 20px !important;
                padding: 20px !important;
                background: white !important;
              }
              .no-print-sticker-btn {
                display: none !important;
              }
            }
          `}} />

          {qrActiveTab === 'generate' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Generator Form (4 cols) */}
              <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-[#00a68a] to-emerald-500" />
                
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">{language === 'ms' ? 'Pendaftaran Label QR Baharu' : 'New QR Label Registration'}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{language === 'ms' ? 'Pilih jenis silinder dan kuantiti untuk menjana aset baharu.' : 'Choose cylinder type and quantity to generate new assets.'}</p>
                </div>

                <div className="space-y-4">
                  {/* Cylinder Type Selection */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-2">
                      {language === 'ms' ? 'Pilih Jenis Silinder' : 'Select Cylinder Type'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cylinderTypes.map(type => {
                        const isSelected = selectedTypeId === type.id
                        return (
                          <div
                            key={type.id}
                            onClick={() => setSelectedTypeId(type.id)}
                            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 relative overflow-hidden active:scale-95 ${
                              isSelected 
                                ? 'border-[#00a68a] bg-gradient-to-br from-teal-50/40 to-teal-50/10 shadow-md ring-2 ring-[#00a68a]/10'
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/30'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isSelected ? 'bg-[#00a68a] text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {language === 'ms' ? 'Saiz' : 'Size'} {type.type_code}
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-600">{type.capacity_liters}L</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 mt-2">{type.type_name}</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{type.description || 'Medical Oxygen'}</p>
                            
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 text-[#00a68a]">
                                <CheckCircle className="w-3.5 h-3.5 fill-teal-50" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {!isLoanSelected ? (
                    <>
                      {/* Quantity Slider */}
                      <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4 flex flex-col gap-3 transition-all">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                            {language === 'ms' ? 'Kuantiti Untuk Didaftar' : 'Quantity to Register'}
                          </label>
                          <span className="text-xs font-black px-2.5 py-1 rounded-lg border text-[#00a68a] bg-teal-50 border-teal-100">
                            {generateQuantity} {generateQuantity === 1 ? (language === 'ms' ? 'Silinder' : 'Cylinder') : (language === 'ms' ? 'Silinder' : 'Cylinders')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setGenerateQuantity(prev => Math.max(1, prev - 1))}
                            className="w-8 h-8 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center text-sm active:scale-95"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={generateQuantity}
                            onChange={(e) => setGenerateQuantity(Number(e.target.value))}
                            className="flex-1 accent-[#00a68a] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => setGenerateQuantity(prev => Math.min(50, prev + 1))}
                            className="w-8 h-8 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center text-sm active:scale-95"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex gap-2">
                          {[1, 5, 10, 20, 50].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setGenerateQuantity(num)}
                              className={`flex-1 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                                generateQuantity === num
                                  ? 'bg-[#00a68a] border-[#00a68a] text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerateBatchQr}
                        disabled={!selectedTypeId || isAssigningTag}
                        className="w-full py-4 bg-gradient-to-r from-[#00a68a] to-emerald-600 hover:from-[#008f76] hover:to-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4 animate-pulse" />
                        {isAssigningTag ? (language === 'ms' ? 'Mendaftar...' : 'Registering Cylinders...') : (language === 'ms' ? 'Daftar & Jana QR' : 'Register & Generate QR Codes')}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Document Upload + OCR Panel */}
                      {isOcrEligible && (
                        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-1">
                              {language === 'ms' ? 'Ekstrak Automatik No. Siri' : 'Auto-Extract Serials from Delivery Order'}
                            </label>
                            <p className="text-[10px] text-slate-400">
                              {language === 'ms' ? 'Muat naik PDF atau imbasan pesanan penghantaran untuk mengekstrak no. siri secara automatik.' : 'Upload the PDF or an image scan of the delivery order to automatically extract and prefix serial numbers.'}
                            </p>
                          </div>
                          
                          <div className="border-2 border-dashed border-slate-200 hover:border-[#00a68a]/50 rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-50/30 hover:bg-teal-50/10 flex flex-col items-center justify-center gap-2 relative">
                            <input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="p-2.5 bg-teal-50 text-[#00a68a] rounded-full">
                              <FileText className="w-5 h-5" />
                            </div>
                            {deliveryDocFiles.length > 0 ? (
                              <div className="text-xs font-semibold text-slate-700 truncate max-w-full px-2">
                                {deliveryDocFiles.length === 1
                                  ? `${deliveryDocFiles[0].name} (${(deliveryDocFiles[0].size / 1024).toFixed(1)} KB)`
                                  : `${deliveryDocFiles.length} files selected (${deliveryDocFiles.map(f => f.name).join(', ')})`}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500">
                                {language === 'ms' ? 'Klik atau tarik PDF / Imej ke sini (boleh pilih lebih daripada 1 imej)' : 'Click or drag & drop PDF / Images here (can select multiple pages)'}
                              </div>
                            )}
                          </div>

                          {ocrError && (
                            <div className="text-[10px] text-rose-600 bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>{ocrError}</span>
                            </div>
                          )}

                          {isOcrProcessing ? (
                            <div className="py-4 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 rounded-xl">
                              <Spinner className="w-5 h-5 text-[#00a68a]" />
                              <span>{language === 'ms' ? 'Sedang memproses OCR...' : 'Processing OCR & extracting serials...'}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRunOcr}
                              disabled={deliveryDocFiles.length === 0}
                              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              {language === 'ms' ? 'Jalankan Ekstraksi OCR' : 'Run OCR Extraction'}
                            </button>
                          )}

                          {showOcrReview && (
                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-600">
                                  {language === 'ms' ? 'No. Siri Ditemui' : 'Extracted Serials'} ({ocrExtractedTags.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allChecked = ocrExtractedTags.every(t => t.selected);
                                    setOcrExtractedTags(ocrExtractedTags.map(t => ({ ...t, selected: !allChecked })));
                                  }}
                                  className="text-[9px] text-[#00a68a] hover:underline font-bold"
                                >
                                  {ocrExtractedTags.every(t => t.selected) ? (language === 'ms' ? 'Nyahpilih Semua' : 'Deselect All') : (language === 'ms' ? 'Pilih Semua' : 'Select All')}
                                </button>
                              </div>

                              {ocrExtractedTags.length === 0 ? (
                                <div className="text-xs text-slate-400 text-center py-4">
                                  {language === 'ms' ? 'Tiada no. siri dikesan.' : 'No serial numbers detected.'}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                  {ocrExtractedTags.map((tag, idx) => (
                                    <label
                                      key={idx}
                                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-[11px] font-mono select-none ${
                                        tag.selected
                                          ? 'bg-teal-50/50 border-teal-200 text-[#00a68a] font-bold'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={tag.selected}
                                        onChange={() => {
                                          const newTags = [...ocrExtractedTags];
                                          newTags[idx].selected = !newTags[idx].selected;
                                          setOcrExtractedTags(newTags);
                                        }}
                                        className="rounded border-slate-300 text-[#00a68a] focus:ring-[#00a68a] w-3.5 h-3.5"
                                      />
                                      <span className="truncate">{tag.serial}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowOcrReview(false)}
                                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all"
                                >
                                  {language === 'ms' ? 'Batal' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleApplyExtractedTags}
                                  disabled={ocrExtractedTags.filter(t => t.selected).length === 0}
                                  className="flex-[2] py-2 bg-[#00a68a] hover:bg-[#008f76] disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                >
                                  {language === 'ms' ? 'Guna' : 'Apply'} {ocrExtractedTags.filter(t => t.selected).length} {language === 'ms' ? 'Tag' : 'Tags'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Supplier Tag Manual Entry Panel */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block mb-1">
                            {language === 'ms' ? 'Kemasukan Tag Pembekal Manual' : 'Manual Supplier Tag Entry'}
                          </label>
                          <p className="text-[10px] text-slate-400">
                            {language === 'ms' ? 'Masukkan ID unik yang sudah ditag pada setiap silinder pinjaman fizikal.' : 'Enter the unique ID already tagged on each physical loan cylinder. Add rows as needed.'}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                          {supplierTagRows.map((rowValue, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <span className="text-[10px] font-mono font-bold text-slate-400 w-5 text-right">#{index + 1}</span>
                              <input
                                type="text"
                                placeholder="e.g. SL-80L-99824"
                                value={rowValue}
                                onChange={(e) => {
                                  const newRows = [...supplierTagRows]
                                  newRows[index] = e.target.value
                                  setSupplierTagRows(newRows)
                                }}
                                className="flex-1 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] transition-all font-mono uppercase bg-white"
                              />
                              {supplierTagRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSupplierTagRows(supplierTagRows.filter((_, i) => i !== index))
                                  }}
                                  className="p-3 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 text-rose-500 rounded-xl transition-all"
                                  title="Remove Row"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSupplierTagRows([...supplierTagRows, ''])}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-slate-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {language === 'ms' ? 'Tambah Baris Tag' : 'Add Tag Row'}
                        </button>
                        
                        <div className="text-[10px] text-amber-800 bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl flex items-start gap-2 animate-[fadeIn_200ms_ease-out]">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-normal font-semibold">
                            {language === 'ms' 
                              ? 'Setiap baris mewakili satu ID silinder pembekal. Tag ini akan didaftarkan ke dalam sistem sebagai aset pinjaman unik.' 
                              : 'Each row represents one supplier cylinder ID. These tags will be registered directly into the system database as unique loan assets.'}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={handleRegisterSupplierTags}
                        disabled={supplierTagRows.filter(t => t.trim()).length === 0 || isAssigningTag}
                        className="w-full py-4 bg-gradient-to-r from-[#00a68a] to-emerald-600 hover:from-[#008f76] hover:to-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isAssigningTag ? (language === 'ms' ? 'Mendaftar...' : 'Registering Supplier Tags...') : `${language === 'ms' ? 'Daftar' : 'Register'} ${supplierTagRows.filter(t => t.trim()).length || ''} ${language === 'ms' ? 'Tag Pembekal' : 'Supplier Tags'}`}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Generated Stickers (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl min-h-[400px] flex flex-col">
                {generatedLabels.length > 0 ? (
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-800">{language === 'ms' ? 'Label QR Dijana' : 'Generated QR Labels'} ({generatedLabels.length})</h3>
                        <p className="text-[10px] text-slate-400">{language === 'ms' ? 'Sedia untuk dicetak.' : 'Ready to print for new cylinders.'}</p>
                      </div>
                      <button 
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {language === 'ms' ? 'Cetak Semua' : 'Print All Labels'}
                      </button>
                    </div>

                    {/* Stickers Grid */}
                    <div id="printable-batch-stickers" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
                      {generatedLabels.map((label) => (
                        <div 
                          key={label.id}
                          id={`sticker-${label.id}`} 
                          className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col items-center relative overflow-hidden group shadow-sm hover:shadow-md hover:bg-white hover:border-[#00a68a]/30 transition-all duration-300"
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity no-print-sticker-btn">
                            <button
                              onClick={() => handlePrintIndividual(label.id)}
                              title={language === 'ms' ? 'Cetak Label' : 'Print Individual Label'}
                              className="p-1.5 bg-white border border-slate-200 hover:border-[#00a68a] text-slate-600 hover:text-[#00a68a] rounded-lg shadow-sm transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-28 h-28 border-2 border-slate-200 bg-white rounded-xl p-1.5 flex items-center justify-center relative overflow-hidden group-hover:border-[#00a68a]/40 transition-colors">
                            {/* Scanning indicator */}
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#00a68a] to-transparent animate-bounce opacity-40" />
                            
                            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                              <rect width="100" height="100" fill="white" />
                              <rect x="10" y="10" width="22" height="22" fill="black" />
                              <rect x="13" y="13" width="16" height="16" fill="white" />
                              <rect x="16" y="16" width="10" height="10" fill="black" />

                              <rect x="68" y="10" width="22" height="22" fill="black" />
                              <rect x="71" y="13" width="16" height="16" fill="white" />
                              <rect x="74" y="16" width="10" height="10" fill="black" />

                              <rect x="10" y="68" width="22" height="22" fill="black" />
                              <rect x="13" y="71" width="16" height="16" fill="white" />
                              <rect x="16" y="74" width="10" height="10" fill="black" />

                              {/* QR pattern simulation */}
                              <rect x="42" y="15" width="8" height="8" fill="black" />
                              <rect x="52" y="25" width="6" height="6" fill="black" />
                              <rect x="45" y="42" width="15" height="15" fill="black" />
                              <rect x="72" y="48" width="8" height="8" fill="black" />
                              <rect x="18" y="45" width="6" height="6" fill="black" />
                              <rect x="68" y="68" width="12" height="12" fill="black" />
                              <rect x="44" y="68" width="6" height="6" fill="black" />
                              <rect x="68" y="44" width="6" height="6" fill="black" />
                            </svg>
                          </div>

                          <div className="mt-3 text-center w-full">
                            <p className="text-xs font-mono font-black text-slate-800 tracking-wider select-all">{label.serial_number}</p>
                            <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">{label.type_info?.type_name}</p>
                            <p className="text-[7px] font-mono text-slate-400 mt-1 truncate max-w-full px-2 py-0.5 bg-slate-100 rounded select-all">{label.qr_code_value}</p>
                            <span className="text-[7px] font-black uppercase text-[#00a68a] tracking-widest mt-1.5 block">KKM MEDICAL OXYGEN</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                      <QrCode className="w-8 h-8 text-[#00a68a]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800">{language === 'ms' ? 'Tiada Label Dijana' : 'No Labels Generated Yet'}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {language === 'ms' ? 'Pilih jenis silinder di sebelah kiri untuk bermula.' : 'Select a cylinder type and input quantity on the left, then trigger the generator to initialize new codes.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm items-center justify-between">
                <div className="w-full sm:max-w-xs relative">
                  <input
                    type="text"
                    placeholder={language === 'ms' ? 'Cari Siri atau Kod QR...' : 'Search Serial or QR Code...'}
                    value={qrSearchTerm}
                    onChange={(e) => {
                      setQrSearchTerm(e.target.value)
                      setQrPage(1)
                    }}
                    className="w-full border border-gray-200 rounded-xl p-2.5 pl-3 text-xs outline-none focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] transition-all font-mono"
                  />
                </div>
                <div className="flex flex-1 gap-3 w-full sm:justify-end">
                  {/* Size Filter Dropdown */}
                  <div className="w-full sm:max-w-[150px]">
                    <select
                      value={qrSizeFilter}
                      onChange={(e) => {
                        setQrSizeFilter(e.target.value)
                        setQrPage(1)
                      }}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-white text-gray-700 focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] transition-all font-semibold text-[11px]"
                    >
                      <option value="">{language === 'ms' ? 'Semua Saiz' : 'All Sizes'}</option>
                      {Array.from(new Set(cylinderTypes.map(t => t.type_code).filter(Boolean))).map(sizeCode => (
                        <option key={sizeCode} value={sizeCode}>{sizeCode}</option>
                      ))}
                    </select>
                  </div>

                  {/* Valve Type Filter Dropdown */}
                  <div className="w-full sm:max-w-[150px]">
                    <select
                      value={qrTypeFilter}
                      onChange={(e) => {
                        setQrTypeFilter(e.target.value)
                        setQrPage(1)
                      }}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-white text-gray-700 focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] transition-all font-semibold text-[11px]"
                    >
                      <option value="">{language === 'ms' ? 'Semua Jenis' : 'All Types'}</option>
                      <option value="BN">{language === 'ms' ? 'Bullnose (BN)' : 'Bullnose (BN)'}</option>
                      <option value="PI">{language === 'ms' ? 'Pin Index (PI)' : 'Pin Index (PI)'}</option>
                    </select>
                  </div>
                  <div className="w-full sm:max-w-[150px]">
                    <select
                      value={qrPageSize}
                      onChange={(e) => {
                        setQrPageSize(Number(e.target.value))
                        setQrPage(1)
                      }}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-white text-gray-700 focus:ring-2 focus:ring-[#00a68a]/20 focus:border-[#00a68a] transition-all"
                    >
                      <option value={10}>{language === 'ms' ? 'Papar 10' : 'Show 10'}</option>
                      <option value={25}>{language === 'ms' ? 'Papar 25' : 'Show 25'}</option>
                      <option value={50}>{language === 'ms' ? 'Papar 50' : 'Show 50'}</option>
                      <option value={100}>{language === 'ms' ? 'Papar 100' : 'Show 100'}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-gray-500">
                    <thead className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 font-semibold">{language === 'ms' ? 'Siri Silinder' : 'Cylinder Serial'}</th>
                        <th className="px-6 py-3 font-semibold">{language === 'ms' ? 'Saiz & Jenis' : 'Size & Type'}</th>
                        <th className="px-6 py-3 font-semibold">{language === 'ms' ? 'Nilai Tag QR' : 'Active QR Tag Value'}</th>
                        <th className="px-6 py-3 font-semibold">{language === 'ms' ? 'Tarikh Didaftar' : 'Date Tagged'}</th>
                        <th className="px-6 py-3 font-semibold text-right">{language === 'ms' ? 'Tindakan' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                      {paginatedTaggedCylinders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">
                            {language === 'ms' ? 'Tiada kod QR dijumpai.' : 'No active QR codes found matching criteria.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedTaggedCylinders.map(cyl => (
                          <tr key={cyl.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-gray-900">{cyl.serial_number}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{cyl.type_info?.type_name || 'Standard Cylinder'}</td>
                            <td className="px-6 py-4 font-mono text-gray-500 font-semibold select-all">{cyl.qr_code_value}</td>
                            <td className="px-6 py-4 text-gray-600 font-semibold">
                              {cyl.qr_tagged_at || cyl.created_at ? new Date(cyl.qr_tagged_at || cyl.created_at).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setGeneratedLabels([cyl])
                                    setQrActiveTab('generate')
                                    setSelectedTypeId(cyl.type_id || '')
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-all flex items-center gap-1 active:scale-95"
                                  title={language === 'ms' ? 'Cetak Semula' : 'Reprint Tag'}
                                >
                                  <Printer className="w-3 h-3 text-slate-500" />
                                  {language === 'ms' ? 'Cetak' : 'Reprint'}
                                </button>
                                <button
                                  onClick={() => handleDeactivateQrTag(cyl.id)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-100 transition-all flex items-center gap-1 active:scale-95"
                                  title={language === 'ms' ? 'Nyahaktifkan' : 'Deactivate QR Tag'}
                                >
                                  {language === 'ms' ? 'Nyahaktif' : 'Deactivate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {taggedCylinders.length > 0 && (
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 font-bold text-center sm:text-left">
                      {language === 'ms' ? 'Menunjukkan' : 'Showing'} <span className="text-slate-700 font-black">{((qrPage - 1) * qrPageSize) + 1}</span> {language === 'ms' ? 'hingga' : 'to'} <span className="text-slate-700 font-black">{Math.min(qrPage * qrPageSize, taggedCylinders.length)}</span> {language === 'ms' ? 'daripada' : 'of'} <span className="text-slate-700 font-black">{taggedCylinders.length}</span> {language === 'ms' ? 'entri' : 'entries'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <button 
                        disabled={qrPage === 1}
                        onClick={() => setQrPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-600 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                      >
                        {language === 'ms' ? 'SEBELUM' : 'PREV'}
                      </button>
                      
                      {(() => {
                        const totalPages = Math.ceil(taggedCylinders.length / qrPageSize);
                        const pages = [];
                        const range = 1; // Show current page +/- 1

                        for (let i = 1; i <= totalPages; i++) {
                          if (
                            i === 1 ||
                            i === totalPages ||
                            (i >= qrPage - range && i <= qrPage + range)
                          ) {
                            pages.push(i);
                          } else if (pages[pages.length - 1] !== '...') {
                            pages.push('...');
                          }
                        }

                        return pages.map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-black select-none">
                                ...
                              </span>
                            );
                          }

                          const pageNum = p as number;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setQrPage(pageNum)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                                qrPage === pageNum
                                  ? 'bg-[#00a68a] text-white shadow-sm'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}

                      <button 
                        disabled={qrPage * qrPageSize >= taggedCylinders.length}
                        onClick={() => setQrPage(prev => prev + 1)}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-600 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                      >
                        {language === 'ms' ? 'SETERUS' : 'NEXT'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    // 4. STOCK RECONCILIATION AUDIT VIEW
    if (currentPath === '/pharmacy/oxygen/reconciliation') {
      // Group cylinders by Type and Size
      const groupedCylinders = cylinders.reduce((acc: Record<string, OxygenCylinderWithRelations[]>, cyl) => {
        const groupKey = cyl.type_info?.type_name || 'Standard Cylinder';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(cyl);
        return acc;
      }, {});

      const groupNames = Object.keys(groupedCylinders);
      const activeGroup = selectedReconciliationGroup || groupNames[0] || null;
      const activeCylinders = activeGroup ? (groupedCylinders[activeGroup] || []) : [];

      // Categorize cylinders: Available in System (Verified) vs Scanned in Audit (Pending Verification)
      const isCylinderScanned = (cyl: any) => Boolean(
        physicalCounts[cyl.id] || 
        physicalLocations[cyl.id] || 
        physicalScannedBy[cyl.id] || 
        cyl.scanned_by_name || 
        cyl.qr_tagged_at ||
        cyl.scanned_location
      );

      const isCylinderVerified = (cyl: any) => Boolean(
        cyl.is_verified || 
        verifiedCylinderIds.has(cyl.id)
      );

      // Scanned tab = Scanned but pending verification
      const scannedCylinders = activeCylinders.filter(cyl => isCylinderScanned(cyl) && !isCylinderVerified(cyl));

      // Available in System tab = Verified cylinders (plus legacy unscanned master records)
      const systemCylinders = activeCylinders.filter(cyl => isCylinderVerified(cyl) || !isCylinderScanned(cyl));

      const displayCylinders = reconciliationTab === 'scanned'
        ? scannedCylinders
        : systemCylinders;

      // Single cylinder verify action
      const handleVerifyCylinder = async (cylId: string) => {
        try {
          const cyl = cylinders.find(c => c.id === cylId);
          if (!cyl) return;

          const expectedNorm = getExpectedStateForCylinder(cyl);
          const normalizedNew = physicalCounts[cylId] ? normalizeStatusForReconciliation(physicalCounts[cylId]) : expectedNorm;
          const rawNewLoc = physicalLocations[cylId] || cyl.scanned_location || getCylinderLocation(cyl, normalizedNew);
          const newLocation = typeof rawNewLoc === 'object' ? (rawNewLoc?.location_name || rawNewLoc?.name || 'Pharmacy Store') : (rawNewLoc || 'Pharmacy Store');
          const dbStatus = mapReconciliationToDbStatus(normalizedNew, newLocation);
          const auditorName = physicalScannedBy[cylId]?.user || cyl.scanned_by_name || user?.full_name || 'AMRI AMIT';

          if (isSupabaseConfigured()) {
            await supabase
              .from('pharmacy_oxygen_cylinder_inventory')
              .update({
                is_verified: true,
                verified_at: new Date().toISOString(),
                verified_by: user?.id || null,
                verified_by_name: auditorName,
                current_location: newLocation,
                scanned_location: newLocation,
                status: dbStatus,
                updated_at: new Date().toISOString(),
                last_reconciled_at: new Date().toISOString()
              })
              .eq('id', cylId);

            await supabase.from('audit_logs').insert({
              user_id: user?.id || 'SYSTEM',
              action: 'VERIFIED_CYLINDER_AUDIT',
              module: 'OXYGEN_INVENTORY',
              entity_type: 'cylinder',
              entity_id: cylId,
              new_values: {
                serial_number: cyl.serial_number,
                location: newLocation,
                status: dbStatus,
                verified_by: auditorName,
                verified_at: new Date().toISOString()
              }
            });
          }

          setVerifiedCylinderIds(prev => new Set(prev).add(cylId));
          setCylinders(prev => prev.map(c => c.id === cylId ? { ...c, is_verified: true, current_location: newLocation, scanned_location: newLocation, status: dbStatus } : c));
          
          // Prepend to live audit logs in UI
          const newLogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            action: 'VERIFIED_CYLINDER_AUDIT',
            created_at: new Date().toISOString(),
            user: {
              full_name: auditorName,
              jawatan: user?.jawatan || 'Pegawai Farmasi'
            },
            new_values: {
              serial_number: cyl.serial_number,
              location: newLocation,
              status: dbStatus,
              verified_by: auditorName,
              verified_at: new Date().toISOString()
            },
            old_values: {
              status: expectedNorm
            }
          };
          setReconciliationLogs(prev => [newLogEntry, ...prev]);

          setAuditSuccessMsg(
            language === 'ms' 
              ? `✅ Silinder ${cyl.serial_number} telah disahkan dan direkodkan ke "Dalam Sistem"!`
              : `✅ Cylinder ${cyl.serial_number} verified and recorded in System Inventory!`
          );
          setTimeout(() => setAuditSuccessMsg(null), 4000);
        } catch (err: any) {
          console.error('Error verifying cylinder:', err);
        }
      };

      // Batch verify all scanned cylinders in active group
      const handleVerifyAllScanned = async (groupCylinders: any[]) => {
        if (!groupCylinders || groupCylinders.length === 0) return;
        try {
          for (const c of groupCylinders) {
            await handleVerifyCylinder(c.id);
          }
          setReconciliationTab('system');
        } catch (err) {
          console.error('Error verifying all:', err);
        }
      };

      // Pagination calculation
      const totalCylindersInTab = displayCylinders.length;
      const totalPages = Math.ceil(totalCylindersInTab / reconciliationPageSize);
      const paginatedCylinders = displayCylinders.slice(
        (reconciliationPage - 1) * reconciliationPageSize,
        reconciliationPage * reconciliationPageSize
      );

      const handleGroupSelect = (groupName: string) => {
        setSelectedReconciliationGroup(groupName);
        setReconciliationPage(1);
      };

      return (
        <div className="space-y-8">
          {auditSuccessMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 font-bold">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              {auditSuccessMsg}
            </div>
          )}

          {/* Sidebar separation and main table grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Sidebar: Type / Size Selector */}
            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {language === 'ms' ? 'Jenis & Saiz' : 'Cylinder Types & Sizes'}
              </h3>
              {groupNames.length === 0 ? (
                <p className="text-xs text-gray-400 italic">{language === 'ms' ? 'Tiada jenis tersedia' : 'No types available'}</p>
              ) : (
                <div className="space-y-1">
                  {groupNames.map(name => {
                    const count = groupedCylinders[name].length;
                    const isActive = name === activeGroup;
                    return (
                      <button
                        key={name}
                        onClick={() => handleGroupSelect(name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all border ${
                          isActive
                            ? 'bg-[#00a68a]/10 text-[#00a68a] border-[#00a68a]/20 shadow-sm shadow-[#00a68a]/5'
                            : 'text-gray-600 hover:bg-slate-50 border-transparent hover:text-gray-900'
                        }`}
                      >
                        <span className="truncate pr-2">{name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          isActive ? 'bg-[#00a68a] text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Side: Reconciled Table list */}
            <div className="lg:col-span-3 space-y-6">
              {activeGroup ? (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-gray-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00a68a]" />
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">{activeGroup}</h3>
                    </div>

                    {/* Sub-Tab Switcher - 2 Tabs: System Inventory & Already Scanned */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                        <button
                          onClick={() => { setReconciliationTab('system'); setReconciliationPage(1); }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            reconciliationTab === 'system'
                              ? 'bg-white text-[#00a68a] shadow-sm font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>{language === 'ms' ? 'Dalam Sistem' : 'System Inventory'}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            reconciliationTab === 'system' ? 'bg-[#00a68a]/15 text-[#00a68a]' : 'bg-slate-300/60 text-slate-600'
                          }`}>
                            {systemCylinders.length}
                          </span>
                        </button>

                        <button
                          onClick={() => { setReconciliationTab('scanned'); setReconciliationPage(1); }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            reconciliationTab === 'scanned'
                              ? 'bg-white text-emerald-700 shadow-sm font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'ms' ? 'Sudah Di-Imbas' : 'Already Scanned'}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            reconciliationTab === 'scanned' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300/60 text-slate-600'
                          }`}>
                            {scannedCylinders.length}
                          </span>
                        </button>
                      </div>

                      {reconciliationTab === 'scanned' && scannedCylinders.length > 0 && (
                        <button
                          onClick={() => handleVerifyAllScanned(scannedCylinders)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>{language === 'ms' ? `Sahkan Semua (${scannedCylinders.length})` : `Verify All (${scannedCylinders.length})`}</span>
                        </button>
                      )}
                    </div>

                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/50 text-slate-500 rounded-full text-[10px] font-bold">
                      {language === 'ms' ? 'Menunjukkan' : 'Showing'} {paginatedCylinders.length} {language === 'ms' ? 'daripada' : 'of'} {totalCylindersInTab}
                    </span>
                  </div>
                  {/* Mobile View: Cards Layout */}
                  <div className="block md:hidden divide-y divide-gray-100">
                    {paginatedCylinders.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 font-bold">
                        {language === 'ms' ? 'Tiada silinder dalam tab ini.' : 'No cylinders in this tab.'}
                      </div>
                    ) : (
                      paginatedCylinders.map(cyl => {
                        const expectedNorm = getExpectedStateForCylinder(cyl);
                        const currentPhysical = physicalCounts[cyl.id] || expectedNorm;
                        const isMatched = normalizeStatusForReconciliation(currentPhysical) === expectedNorm;
                        const rawLoc = physicalLocations[cyl.id] || cyl.scanned_location || getCylinderLocation(cyl, currentPhysical);
                        const locationLabel = typeof rawLoc === 'object' ? (rawLoc?.location_name || rawLoc?.name || 'Pharmacy Store') : (rawLoc || 'Pharmacy Store');
                        const isScanned = isCylinderScanned(cyl);
                        const isVerified = isCylinderVerified(cyl);
                        const scannerInfo = physicalScannedBy[cyl.id];
                        const scannedUser = scannerInfo?.user || cyl.scanned_by_name || (isScanned ? (user?.full_name || 'Staff Auditor') : null);

                        return (
                          <div key={cyl.id} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-900 text-sm">{cyl.serial_number}</span>
                                {isScanned && (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[9px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                    {language === 'ms' ? 'Di-Imbas' : 'Scanned'}
                                  </span>
                                )}
                              </div>
                              {isMatched ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                  <CheckCircle className="w-3 h-3" /> {language === 'ms' ? 'Padan' : 'Matched'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                                  <AlertCircle className="w-3 h-3" /> {language === 'ms' ? 'Tidak Padan' : 'Mismatch'}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{language === 'ms' ? 'Lokasi Silinder' : 'Location / Ward'}</span>
                                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-100 text-[10px] font-bold inline-block">
                                  {locationLabel}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{language === 'ms' ? 'Diimbas Oleh' : 'Scanned By'}</span>
                                <span className="text-[10px] font-bold text-slate-800 block truncate">
                                  {isScanned && scannedUser ? scannedUser : <span className="text-gray-400 italic text-[9px]">{language === 'ms' ? 'Belum Diimbas' : 'Not Scanned'}</span>}
                                </span>
                              </div>
                              <div className="space-y-0.5 col-span-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{language === 'ms' ? 'Status Jangkaan' : 'Expected State'}</span>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-[10px] font-bold inline-block uppercase">
                                  {getStatusLabel(expectedNorm)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{language === 'ms' ? 'Status Fizikal' : 'Physical Count / Status'}</span>
                              <select 
                                value={currentPhysical}
                                onChange={(e) => setPhysicalCounts(prev => ({ ...prev, [cyl.id]: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg p-2 bg-white font-bold text-gray-800 text-xs outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                              >
                                <option value="used">{language === 'ms' ? 'Digunakan (Wad)' : 'Used / In Use (Ward)'}</option>
                                <option value="available">{language === 'ms' ? 'Tersedia (Stor)' : 'Available (Store)'}</option>
                                <option value="empty">{language === 'ms' ? 'Kosong (Stor)' : 'Empty (Store)'}</option>
                                <option value="return">{language === 'ms' ? 'Pemulangan (Pembekal)' : 'Return (Supplier)'}</option>
                              </select>
                            </div>
                            {reconciliationTab === 'scanned' && (
                              <button
                                onClick={() => handleVerifyCylinder(cyl.id)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>{language === 'ms' ? 'Sahkan Silinder' : 'Verify Cylinder'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop View: Standard Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-gray-500">
                      <thead className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <tr>
                          <th scope="col" className="px-6 py-3 font-semibold">{language === 'ms' ? 'No. Siri' : 'Cylinder Serial'}</th>
                          <th scope="col" className="px-6 py-3 font-semibold">{language === 'ms' ? 'Lokasi Silinder' : 'Location / Ward'}</th>
                          <th scope="col" className="px-6 py-3 font-semibold">{language === 'ms' ? 'Diimbas Oleh' : 'Scanned By'}</th>
                          <th scope="col" className="px-6 py-3 font-semibold">{language === 'ms' ? 'Jangkaan' : 'Expected State'}</th>
                          <th scope="col" className="px-6 py-3 font-semibold">{language === 'ms' ? 'Status Fizikal' : 'Physical Count / Status'}</th>
                          <th scope="col" className="px-6 py-3 font-semibold">{language === 'ms' ? 'Audit' : 'Audit Status'}</th>
                          <th scope="col" className="px-6 py-3 font-semibold text-right">{language === 'ms' ? 'Tindakan' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                        {paginatedCylinders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-400 font-bold">
                              {language === 'ms' ? 'Tiada silinder dalam tab ini.' : 'No cylinders in this tab.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedCylinders.map(cyl => {
                            const expectedNorm = getExpectedStateForCylinder(cyl);
                            const currentPhysical = physicalCounts[cyl.id] || expectedNorm;
                            const isMatched = normalizeStatusForReconciliation(currentPhysical) === expectedNorm;
                            const rawLoc = physicalLocations[cyl.id] || cyl.scanned_location || getCylinderLocation(cyl, currentPhysical);
                            const locationLabel = typeof rawLoc === 'object' ? (rawLoc?.location_name || rawLoc?.name || 'Pharmacy Store') : (rawLoc || 'Pharmacy Store');
                            const isScanned = isCylinderScanned(cyl);
                            const isVerified = isCylinderVerified(cyl);
                            const scannerInfo = physicalScannedBy[cyl.id];
                            const scannedUser = scannerInfo?.user || cyl.scanned_by_name || (isScanned ? (user?.full_name || 'Staff Auditor') : null);
                            const scannedTime = scannerInfo?.timestamp || (cyl.qr_tagged_at ? new Date(cyl.qr_tagged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);

                            return (
                              <tr key={cyl.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <span>{cyl.serial_number}</span>
                                    {isScanned && (
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[9px] font-bold inline-flex items-center gap-1">
                                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                        {language === 'ms' ? 'Di-Imbas' : 'Scanned'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-600">
                                  <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 text-[10px] font-bold inline-flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-teal-600" />
                                    {locationLabel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-700">
                                  {isScanned && scannedUser ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-[9px] shrink-0">
                                        {scannedUser.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="text-[11px] font-bold text-slate-800 block">
                                          {scannedUser}
                                        </span>
                                        {scannedTime && (
                                          <span className="text-[9px] text-gray-400 font-mono block">{scannedTime}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-[10px] italic">
                                      {language === 'ms' ? 'Belum Diimbas' : 'Not Scanned Yet'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-600 uppercase">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-[10px] font-bold">
                                    {getStatusLabel(expectedNorm)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <select 
                                    value={currentPhysical}
                                    onChange={(e) => setPhysicalCounts(prev => ({ ...prev, [cyl.id]: e.target.value }))}
                                    className="border border-gray-200 rounded-lg p-1.5 bg-white font-bold text-gray-800 text-[11px] outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                  >
                                    <option value="used">{language === 'ms' ? 'Digunakan (Wad)' : 'Used / In Use (Ward)'}</option>
                                    <option value="available">{language === 'ms' ? 'Tersedia (Stor)' : 'Available (Store)'}</option>
                                    <option value="empty">{language === 'ms' ? 'Kosong (Stor)' : 'Empty (Store)'}</option>
                                    <option value="return">{language === 'ms' ? 'Pemulangan (Pembekal)' : 'Return (Supplier)'}</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider 
                                    ${isMatched ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
                                  >
                                    {isMatched ? (language === 'ms' ? 'Padan' : 'Matched') : (language === 'ms' ? 'Tidak Padan' : 'Mismatch')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {reconciliationTab === 'scanned' ? (
                                    <button
                                      onClick={() => handleVerifyCylinder(cyl.id)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {language === 'ms' ? 'Sahkan' : 'Verify'}
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                                      {language === 'ms' ? 'Disahkan' : 'Verified'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Control Bar */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between">
                      <button
                        disabled={reconciliationPage === 1}
                        onClick={() => setReconciliationPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-600 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                      >
                        {language === 'ms' ? 'SEBELUM' : 'PREV'}
                      </button>
                      <span className="text-[11px] text-slate-500 font-bold">
                        {language === 'ms' ? 'Halaman' : 'Page'} {reconciliationPage} {language === 'ms' ? 'daripada' : 'of'} {totalPages}
                      </span>
                      <button
                        disabled={reconciliationPage >= totalPages}
                        onClick={() => setReconciliationPage(prev => Math.min(totalPages, prev + 1))}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-600 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                      >
                        {language === 'ms' ? 'SETERUS' : 'NEXT'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-sm">
                  {language === 'ms' ? 'Tiada kumpulan dipilih.' : 'No group selected or no cylinders available.'}
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 bg-slate-50/50 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">{language === 'ms' ? 'Log Aktiviti Audit' : 'Recent Reconciliation Audit Activity Logs'}</h3>
            </div>
              <div className="divide-y divide-gray-100">
                {reconciliationLogs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-xs">
                    {language === 'ms' ? 'Tiada log aktiviti.' : 'No reconciliation activity logs recorded yet.'}
                  </div>
                ) : (
                  reconciliationLogs.map(log => {
                    const auditorTitle = log.user?.full_name || log.new_values?.verified_by || 'AMRI AMIT';
                    const isVerificationAction = log.action === 'VERIFIED_CYLINDER_AUDIT';

                    return (
                      <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{auditorTitle}</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-500 font-medium">{log.user?.jawatan || 'Pegawai Farmasi'}</span>
                          </div>
                          {isVerificationAction ? (
                            <p className="text-gray-600 font-medium flex items-center flex-wrap gap-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold mr-1">
                                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                {language === 'ms' ? 'Disahkan' : 'Verified'}
                              </span>
                              <span>{language === 'ms' ? 'Silinder' : 'Cylinder'}</span>
                              <span className="font-mono font-bold text-gray-900">{log.new_values?.serial_number || 'N/A'}</span>
                              <span>{language === 'ms' ? 'telah disahkan & dimasukkan ke' : 'verified & placed in'}</span>
                              <span className="text-teal-600 font-bold">{log.new_values?.location || 'Store'}</span>
                              <span>({language === 'ms' ? 'Status' : 'Status'}:</span>
                              <span className="font-bold text-emerald-600 uppercase">{log.new_values?.status || 'Available'}</span>
                              <span>)</span>
                            </p>
                          ) : (
                            <p className="text-gray-600 font-medium">
                              {language === 'ms' ? 'Status silinder diselaraskan' : 'Reconciled status of cylinder'} <span className="font-mono font-bold text-gray-900">{log.new_values?.serial_number || 'N/A'}</span> {language === 'ms' ? 'daripada' : 'from'} {' '}
                              <span className="font-bold text-rose-600 uppercase">{log.old_values?.status || 'N/A'}</span> {language === 'ms' ? 'kepada' : 'to'} {' '}
                              <span className="font-bold text-emerald-600 uppercase">{log.new_values?.status || 'N/A'}</span> {' '}
                              ({language === 'ms' ? 'kini di' : 'now belongs to'} <span className="text-teal-600 font-semibold">{log.new_values?.location || 'Store'}</span>)
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold shrink-0">
                          {new Date(log.created_at).toLocaleString('ms-MY', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
          </div>

          <ScanReconciliationModal
            hospitalId={hospitalId || ''}
            isOpen={isAuditScanOpen}
            onClose={() => setIsAuditScanOpen(false)}
            onScanMatch={(cylinderId, status, unitLocation) => {
              const currentAuditor = user?.full_name || user?.email || 'Staff Auditor';
              const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setPhysicalCounts(prev => ({ ...prev, [cylinderId]: status }));
              if (unitLocation) {
                setPhysicalLocations(prev => ({ ...prev, [cylinderId]: unitLocation }));
              }
              setPhysicalScannedBy(prev => ({ ...prev, [cylinderId]: { user: currentAuditor, timestamp: nowFormatted } }));
              const cyl = cylinders.find(c => c.id === cylinderId);
              if (cyl) {
                const groupKey = cyl.type_info?.type_name || 'Standard Cylinder';
                setSelectedReconciliationGroup(groupKey);
              }
            }}
            onBatchScanMatch={(batchItems) => {
              const currentAuditor = user?.full_name || user?.email || 'Staff Auditor';
              const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setPhysicalCounts(prev => {
                const next = { ...prev };
                batchItems.forEach(item => { next[item.cylinderId] = item.status; });
                return next;
              });
              setPhysicalLocations(prev => {
                const next = { ...prev };
                batchItems.forEach(item => {
                  if (item.unitLocation) next[item.cylinderId] = item.unitLocation;
                });
                return next;
              });
              setPhysicalScannedBy(prev => {
                const next = { ...prev };
                batchItems.forEach(item => {
                  next[item.cylinderId] = { user: currentAuditor, timestamp: nowFormatted };
                });
                return next;
              });
              if (batchItems.length > 0) {
                const lastId = batchItems[batchItems.length - 1].cylinderId;
                const cyl = cylinders.find(c => c.id === lastId);
                if (cyl) {
                  const groupKey = cyl.type_info?.type_name || 'Standard Cylinder';
                  setSelectedReconciliationGroup(groupKey);
                }
              }
            }}
            onNewCylinderRegistered={(newCyl) => {
              const currentAuditor = user?.full_name || user?.email || 'Staff Auditor';
              const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setCylinders(prev => [newCyl, ...prev.filter(c => c.id !== newCyl.id)]);
              setPhysicalCounts(prev => ({ ...prev, [newCyl.id]: newCyl.status || 'available' }));
              if (newCyl.current_location?.location_name || newCyl.current_location) {
                setPhysicalLocations(prev => ({ ...prev, [newCyl.id]: (newCyl.current_location?.location_name || newCyl.current_location) as string }));
              }
              setPhysicalScannedBy(prev => ({ ...prev, [newCyl.id]: { user: currentAuditor, timestamp: nowFormatted } }));
              const groupKey = newCyl.type_info?.type_name || 'Standard Cylinder';
              setSelectedReconciliationGroup(groupKey);
            }}
            existingCylinders={cylinders}
          />

          <AuditReconciliationSummaryModal
            isOpen={isAuditReviewOpen}
            onClose={() => setIsAuditReviewOpen(false)}
            onConfirmSave={(remarks) => handleAuditSubmit(remarks)}
            isSaving={isSavingReconciliation}
            auditorName={user?.full_name || 'Pharmacy Officer'}
            auditorRole={user?.jawatan || 'Officer'}
            changes={getReconciliationChangesList()}
            totalCylindersCount={cylinders.length}
          />
        </div>
      );
    }

    // DEFAULT MAIN OXYGEN DASHBOARD VIEW

    return (
      <div className="space-y-8">
        
        {/* ========================================================
            REAMPED PREMIUM GLASSMORPHIC FINANCIAL CARDS (Tall, rich layout)
           ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Card 1: Total Allocation */}
          <div className="relative bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                  {language === 'ms' ? 'JUMLAH PERUNTUKAN' : 'TOTAL ALLOCATION'}
                </span>
                <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {fmt(financials?.total_allocation || 274000.00)}
                </h4>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg w-max border border-slate-200/60">
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span>VOTE: 080702 / 27402</span>
                </div>
              </div>
              <div className="w-11 h-11 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center shadow-sm shadow-teal-500/5">
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="relative bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                  {language === 'ms' ? 'JUMLAH PERBELANJAAN' : 'TOTAL EXPENSES'}
                </span>
                <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {fmt(financials?.total_expenses || 261037.70)}
                </h4>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-max border border-rose-100">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{language === 'ms' ? 'Isian Semula:' : 'Refills:'} {fmt(financials?.total_expenses || 261037.70)}</span>
                </div>
              </div>
              <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center shadow-sm shadow-rose-500/5">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          {/* Card 3: Liabilities */}
          <div className="relative bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                  {language === 'ms' ? 'LIABILITI / TANGGUNGAN' : 'LIABILITIES'}
                </span>
                <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {fmt(financials?.liabilities || 0.00)}
                </h4>
                <span className="text-[10px] font-bold text-slate-600 mt-3.5 block italic">
                  {language === 'ms' ? 'PO / SO Komited' : 'Committed PO / SO'}
                </span>
              </div>
              <div className="w-11 h-11 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center shadow-sm shadow-sky-500/5">
                <Layers className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>

          {/* Card 4: Current Balance */}
          {(() => {
            const bal = financials?.current_balance ?? -2717.14
            const isOverBudget = bal < 0
            return (
              <div className={`relative border rounded-[28px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300
                ${isOverBudget 
                  ? 'bg-rose-50/80 border-rose-200 shadow-[0_8px_30px_rgba(244,63,94,0.03)]' 
                  : 'bg-white border-slate-200/80'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                      {language === 'ms' ? 'BAKI SEMASA' : 'CURRENT BALANCE'}
                    </span>
                    <h4 className={`text-2xl lg:text-3xl font-extrabold tracking-tight mt-2.5 ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                      {fmt(bal)}
                    </h4>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider mt-3 px-2 py-0.5 rounded-full
                      ${isOverBudget ? 'bg-rose-100 text-[#e11d48] animate-pulse' : 'bg-emerald-50 text-[#10b981]'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      {isOverBudget ? (language === 'ms' ? 'LEBIHAN DEFISIT' : 'Deficit Overdraft') : (language === 'ms' ? 'PERUNTUKAN SIHAT' : 'Healthy Allocation')}
                    </span>
                  </div>
                  <div className={`w-11 h-11 border rounded-2xl flex items-center justify-center shadow-sm
                    ${isOverBudget ? 'bg-rose-100 border-rose-200 text-rose-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Card 5: Loan Charges */}
          <div className="relative bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-600 uppercase">
                  {language === 'ms' ? 'CAJ PINJAMAN SILINDER' : 'LOAN CHARGES'}
                </span>
                <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                  {fmt(financials?.loan_charges || 15679.44)}
                </h4>
                <span className="text-[10px] font-bold text-purple-700 mt-3.5 block bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg w-max">
                  {language === 'ms' ? 'Kadar:' : 'Rate:'} {fmt(systemSettings?.loan_cylinder_rate || 18.36)} / {language === 'ms' ? 'silinder' : 'cyl'}
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
           ======================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white border border-slate-200/80 p-6 rounded-[28px] shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {language === 'ms' ? 'Operasi Oksigen Perubatan' : 'Medical Oxygen Operations'}
            </h3>
            <p className="text-xs text-slate-700 mt-1 flex items-center gap-2 font-semibold">
              {language === 'ms'
                ? 'Pantau agihan silinder masa-nyata, daftarkan penerimaan, dan uruskan waran kerajaan.'
                : 'Monitor real-time cylinder distribution, key in deliveries, and manage government warrants.'}
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">
                {language === 'ms' ? 'Penyelarasan Terakhir' : 'LAST SYNC'}: {new Date().toLocaleTimeString()}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => navigate(ROUTES.PHARMACY_OXYGEN_LEDGER)}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md active:scale-95 transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <ScrollText className="w-4 h-4 text-teal-400" />
              {language === 'ms' ? 'Buka Lejar KEW.PS-4' : 'Open KEW.PS-4 Ledger'}
            </button>
            <button 
              onClick={() => setIsReceiveModalOpen(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {language === 'ms' ? 'Daftar Penerimaan Oksigen' : 'Key In Received Oxygen'}
            </button>
          </div>
        </div>

        {/* ========================================================
            TWO COLUMN LAYOUT GRID
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT SIDE: TRANSACTION LEDGER TABLE (2/3 width) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[28px] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    {language === 'ms' ? 'Log Penerimaan Oksigen' : 'Recent Oxygen Deliveries (Received Log)'}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[9px] font-black tracking-wider uppercase">
                    KKM Audit Ledger
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  {language === 'ms'
                    ? 'Transaksi rasmi direkodkan di bawah peruntukan bajet kerajaan.'
                    : 'Official transactions recorded under governmental budget allocation.'}
                </p>
              </div>

              {/* View Switcher Controls & Quick Monthly Action */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/50 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setLedgerViewMode('detailed')
                      setCurrentPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 ${
                      ledgerViewMode === 'detailed'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3 h-3 text-slate-500" />
                    {language === 'ms' ? 'Semua Entri' : 'All Entries'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLedgerViewMode('monthly')
                      setMonthlyCurrentPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 ${
                      ledgerViewMode === 'monthly'
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    {language === 'ms' ? 'Gabungan Bulanan' : 'Monthly Consolidated'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const monthlyList = getMonthlyConsolidatedReceptions(receptionsList)
                    if (monthlyList.length > 0 && !selectedConsolidateMonthKey) {
                      setSelectedConsolidateMonthKey(monthlyList[0].monthKey)
                    }
                    setIsMonthlyModalOpen(true)
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 border border-teal-600"
                  title={language === 'ms' ? 'Gabung Semua Silinder Mengikut Bulan' : 'Consolidate Cylinders by Month'}
                >
                  <Sparkles className="w-3 h-3 text-teal-200" />
                  {language === 'ms' ? 'Gabung Bulan' : 'Combine Month'}
                </button>
              </div>
            </div>

            {ledgerViewMode === 'detailed' ? (
              /* DETAILED PER-DELIVERY VIEW */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-gray-700">
                  <thead className="bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">{language === 'ms' ? 'TARIKH TERIMA' : 'RECEPTION DATE'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'PESANAN PENGHANTARAN' : 'DELIVERY ORDER'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'KOS ISIAN SEMULA' : 'REFILL COST'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'CAJ PINJAMAN' : 'LOAN CHARGES'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'JUMLAH' : 'TOTAL COST'}</th>
                      <th className="px-6 py-4 text-center">{language === 'ms' ? 'STATUS' : 'STATUS'}</th>
                      <th className="px-6 py-4 text-right">{language === 'ms' ? 'DOKUMEN' : 'DOCUMENTS'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receptionsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-600 font-semibold italic">{language === 'ms' ? 'Tiada penghantaran log.' : 'No oxygen deliveries logged yet.'}</td>
                      </tr>
                    ) : (
                      (() => {
                        const itemsPerPage = 5
                        const paginatedList = receptionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        return paginatedList.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-slate-900 font-semibold">
                              {new Date(rec.reception_date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-teal-600">{rec.delivery_order_no}</td>
                            <td className="px-6 py-4 text-slate-800 font-semibold">{fmt(rec.refill_amount)}</td>
                            <td className="px-6 py-4 text-purple-700 font-semibold">{fmt(rec.loan_amount)}</td>
                            <td className="px-6 py-4 text-slate-950 font-black">{fmt(rec.total_amount)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border
                                ${rec.status === 'completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                              >
                                {rec.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => handleOpenPoPreview(rec)}
                                  className="px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-slate-200"
                                  title="Generate KKM PO PDF"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                  PO
                                </button>
                                <button 
                                  onClick={() => handleDownloadReport(rec)}
                                  className="px-2.5 py-1.5 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-slate-200"
                                  title="Generate Reception Report PDF"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-500" />
                                  {language === 'ms' ? 'Laporan' : 'Report'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* MONTHLY CONSOLIDATED VIEW */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-gray-700">
                  <thead className="bg-teal-50/70 text-[10px] font-black text-teal-900 uppercase tracking-widest border-b border-teal-100">
                    <tr>
                      <th className="px-6 py-4">{language === 'ms' ? 'BULAN & REKOD' : 'MONTH & ENTRIES'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'PESANAN PENGHANTARAN GABUNGAN' : 'CONSOLIDATED DELIVERY ORDERS'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'JUMLAH ISIAN SEMULA' : 'TOTAL REFILL'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'JUMLAH PINJAMAN' : 'TOTAL LOAN'}</th>
                      <th className="px-6 py-4">{language === 'ms' ? 'JUMLAH KOS' : 'TOTAL COST'}</th>
                      <th className="px-6 py-4 text-center">{language === 'ms' ? 'STATUS' : 'STATUS'}</th>
                      <th className="px-6 py-4 text-right">{language === 'ms' ? 'DOKUMEN GABUNGAN' : 'CONSOLIDATED DOCS'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const monthlyList = getMonthlyConsolidatedReceptions(receptionsList)
                      if (monthlyList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-slate-600 font-semibold italic">
                              {language === 'ms' ? 'Tiada rekod bulanan dijumpai.' : 'No monthly records found.'}
                            </td>
                          </tr>
                        )
                      }
                      const itemsPerPage = 5
                      const paginatedMonthly = monthlyList.slice((monthlyCurrentPage - 1) * itemsPerPage, monthlyCurrentPage * itemsPerPage)
                      return paginatedMonthly.map((mRec) => (
                        <tr key={mRec.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-900 font-extrabold text-sm capitalize">
                                {mRec.monthLabel}
                              </span>
                              <span className="inline-flex items-center gap-1 w-max px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200/80">
                                <Layers className="w-2.5 h-2.5" />
                                {mRec.entryCount} {mRec.entryCount === 1 ? (language === 'ms' ? 'Entri' : 'Delivery') : (language === 'ms' ? 'Entri Digabung' : 'Combined Deliveries')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 max-w-[280px]">
                              <span className="font-mono font-bold text-teal-700 text-xs truncate" title={mRec.delivery_order_no}>
                                {mRec.delivery_order_no}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {language === 'ms' ? `Menggabungkan ${mRec.entryCount} nota serahan` : `Aggregates ${mRec.entryCount} delivery orders`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-semibold">{fmt(mRec.refill_amount)}</td>
                          <td className="px-6 py-4 text-purple-700 font-semibold">{fmt(mRec.loan_amount)}</td>
                          <td className="px-6 py-4 text-slate-950 font-black text-sm">{fmt(mRec.total_amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                              {language === 'ms' ? 'DIKONSOLIDASI' : 'CONSOLIDATED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleOpenPoPreview(mRec as any)}
                                className="px-2.5 py-1.5 bg-white hover:bg-teal-600 hover:text-white text-teal-800 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-teal-300 shadow-sm"
                                title={language === 'ms' ? 'Jana PO Gabungan Bulanan' : 'Generate Consolidated Monthly PO PDF'}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {language === 'ms' ? 'PO Bulan' : 'Monthly PO'}
                              </button>
                              <button 
                                onClick={() => handleDownloadReport(mRec as any)}
                                className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-700 hover:text-white text-teal-800 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-teal-200 shadow-sm"
                                title={language === 'ms' ? 'Jana Laporan Pemeriksaan Bulanan (KEW.PS-3)' : 'Generate Consolidated Monthly Inspection Report'}
                              >
                                <Download className="w-3.5 h-3.5" />
                                {language === 'ms' ? 'Laporan' : 'Report'}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedConsolidateMonthKey(mRec.monthKey)
                                  setIsMonthlyModalOpen(true)
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all border border-slate-200"
                                title={language === 'ms' ? 'Lihat Perincian Entri' : 'View Delivery Breakdown'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {ledgerViewMode === 'detailed' ? (
              receptionsList.length > 5 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">
                    {language === 'ms' ? 'Menunjukkan' : 'Showing'} <span className="text-slate-900 font-black">{((currentPage - 1) * 5) + 1}</span> {language === 'ms' ? 'hingga' : 'to'} <span className="text-slate-900 font-black">{Math.min(currentPage * 5, receptionsList.length)}</span> {language === 'ms' ? 'daripada' : 'of'} <span className="text-slate-900 font-black">{receptionsList.length}</span> {language === 'ms' ? 'entri' : 'entries'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-700 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                    >
                      {language === 'ms' ? 'SEBELUM' : 'PREV'}
                    </button>
                    <button 
                      disabled={currentPage * 5 >= receptionsList.length}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-700 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                    >
                      {language === 'ms' ? 'SETERUS' : 'NEXT'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              (() => {
                const monthlyList = getMonthlyConsolidatedReceptions(receptionsList)
                return monthlyList.length > 5 && (
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">
                      {language === 'ms' ? 'Menunjukkan' : 'Showing'} <span className="text-slate-900 font-black">{((monthlyCurrentPage - 1) * 5) + 1}</span> {language === 'ms' ? 'hingga' : 'to'} <span className="text-slate-900 font-black">{Math.min(monthlyCurrentPage * 5, monthlyList.length)}</span> {language === 'ms' ? 'daripada' : 'of'} <span className="text-slate-900 font-black">{monthlyList.length}</span> {language === 'ms' ? 'bulan' : 'months'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={monthlyCurrentPage === 1}
                        onClick={() => setMonthlyCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-700 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                      >
                        {language === 'ms' ? 'SEBELUM' : 'PREV'}
                      </button>
                      <button 
                        disabled={monthlyCurrentPage * 5 >= monthlyList.length}
                        onClick={() => setMonthlyCurrentPage(prev => prev + 1)}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-slate-700 rounded-xl font-bold tracking-wider uppercase text-[10px] transition-all"
                      >
                        {language === 'ms' ? 'SETERUS' : 'NEXT'}
                      </button>
                    </div>
                  </div>
                )
              })()
            )}
          </div>

          {/* RIGHT SIDE: SIDEBAR WIDGETS (1/3 width) */}
          <div className="space-y-6">
            
            {/* Widget A: Active Pricing Matrix config list */}
            <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{language === 'ms' ? 'Harga Silinder' : 'Active Cylinder Prices'}</h4>
                  <p className="text-[10px] text-slate-600 font-semibold">{language === 'ms' ? 'Kos isian semula standard' : 'Standard refill costs per supplier'}</p>
                </div>
                <button 
                  onClick={() => setIsPricingModalOpen(true)}
                  className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0284c7] rounded-xl text-[10px] font-black tracking-wider transition-all duration-200 flex items-center gap-1 active:scale-95 border border-sky-100"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  {language === 'ms' ? 'LARAS' : 'ADJUST'}
                </button>
              </div>

              {/* Supplier Filter dropdown for sidebar widget */}
              <div className="mb-3">
                <select
                  value={selectedPricingSupplier}
                  onChange={(e) => setSelectedPricingSupplier(e.target.value)}
                  className="w-full text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-sky-500 transition-all"
                >
                  <option value="All Suppliers">{language === 'ms' ? 'Semua Pembekal' : 'All Suppliers'}</option>
                  {realSupplierOptions.map((sup) => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2.5">
                {pricingConfigs
                  .filter((config) => isSupplierMatch(config.supplier_name, selectedPricingSupplier))
                  .slice(0, 6)
                  .map((config) => (
                  <div key={config.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight block">{config.cylinder_size_code}</span>
                      <span className="text-[9px] text-slate-600 font-bold">{config.supplier_name || lindeDisplayName}</span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      RM {config.refill_price.toFixed(2)}
                    </span>
                  </div>
                ))}
                
                {/* Supplier Loan Rates for 101-N and 101-F */}
                {(() => {
                  const matchingConfigs = pricingConfigs.filter((config) => isSupplierMatch(config.supplier_name, selectedPricingSupplier))
                  const loanConfigs = matchingConfigs.filter((config) => (config.cylinder_size_code === '101-N' || config.cylinder_size_code === '101-F') && config.loan_rate != null)

                  if (loanConfigs.length > 0) {
                    return loanConfigs.map((config) => (
                      <div key={`loan-${config.id}`} className="flex items-center justify-between py-2 border-t border-purple-100 hover:bg-purple-50 px-2 rounded-lg transition-colors mt-1 bg-purple-50/60">
                        <span className="text-xs font-black text-purple-700 tracking-tight uppercase">{config.cylinder_size_code} {language === 'ms' ? 'Kadar Pinjaman' : 'Loan Rate'}</span>
                        <span className="font-mono text-xs font-black text-purple-700">
                          RM {Number(config.loan_rate).toFixed(2)}
                        </span>
                      </div>
                    ))
                  }

                  return (
                    <div className="flex items-center justify-between py-2.5 border-t border-slate-100 hover:bg-slate-50 px-2 rounded-lg transition-colors mt-1 bg-slate-50">
                      <span className="text-xs font-black text-purple-700 tracking-tight uppercase">{language === 'ms' ? 'Kadar Pinjaman Silinder' : 'Cylinder Loan Rate'}</span>
                      <span className="font-mono text-xs font-black text-purple-700">
                        RM {(systemSettings?.loan_cylinder_rate || 18.36).toFixed(2)}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Widget B: Government Budget Deficit visual block */}
            {(() => {
              const allocation = financials?.total_allocation || 274000.00
              const expenses = financials?.total_expenses || 261037.70
              const liabilities = financials?.liabilities || 0
              const totalSpending = expenses + liabilities
              const percentage = allocation > 0 ? (totalSpending / allocation) * 100 : 0
              const isOverBudget = totalSpending > allocation

              return (
                <div className={`border rounded-[28px] p-6 shadow-sm relative overflow-hidden transition-all duration-300
                  ${isOverBudget 
                    ? 'bg-rose-50 border-rose-200 shadow-[0_8px_30px_rgba(244,63,94,0.03)]' 
                    : 'bg-emerald-50 border-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.03)]'}`}
                >
                  <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-wider mb-3
                    ${isOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}
                  >
                    {isOverBudget ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span>{language === 'ms' ? 'Defisit Waran Kerajaan' : 'Government Warrant Deficit'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span>{language === 'ms' ? 'Waran Kerajaan Sihat' : 'Government Warrant Healthy'}</span>
                      </>
                    )}
                  </div>
                  <p className={`text-[11px] font-semibold leading-relaxed ${isOverBudget ? 'text-rose-700' : 'text-emerald-800'}`}>
                    {isOverBudget ? (
                      <>
                        {language === 'ms' 
                          ? `Perbelanjaan oksigen (${fmt(totalSpending)}) telah melebihi Peruntukan Waran (${fmt(allocation)}) sebanyak ${percentage.toFixed(1)}% di bawah Kod Undi 080702 / Aktiviti 27402.` 
                          : `Oxygen spending (<strong>${fmt(totalSpending)}</strong>) has exceeded the Warrant Allocation (<strong>${fmt(allocation)}</strong>) by <strong>${percentage.toFixed(1)}%</strong> under Vote Code 080702 / Activity 27402.`}
                      </>
                    ) : (
                      <>
                        {language === 'ms' 
                          ? `Perbelanjaan oksigen (${fmt(totalSpending)}) adalah dalam had Peruntukan Waran (${fmt(allocation)}) pada ${percentage.toFixed(1)}% penggunaan di bawah Kod Undi 080702 / Aktiviti 27402.` 
                          : `Oxygen spending (<strong>${fmt(totalSpending)}</strong>) is well within the Warrant Allocation (<strong>${fmt(allocation)}</strong>) at <strong>${percentage.toFixed(1)}%</strong> utilization under Vote Code 080702 / Activity 27402.`}
                      </>
                    )}
                  </p>
                  
                  {/* Progress Indicator */}
                  <div className="mt-4">
                    <div className={`flex justify-between text-[10px] font-bold mb-1 ${isOverBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
                      <span>{isOverBudget ? (language === 'ms' ? 'HAD WARAN MELEBIHI' : 'WARRANT CAP EXCEEDED') : (language === 'ms' ? 'PENGGUNAAN BAJET SELAMAT' : 'SAFE BUDGET UTILIZATION')}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 overflow-hidden shadow-inner ${isOverBudget ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Sidebar content end */}
            
          </div>
        </div>

        {/* Real Cylinder Live List Table (Audited mini list) */}
        <div className="bg-white border border-slate-200/80 rounded-[28px] shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{language === 'ms' ? 'Daftar Silinder' : 'Cylinder Registry (Top 10 Live Inventory)'}</h2>
              <p className="text-[11px] text-slate-600 font-semibold mt-0.5">{language === 'ms' ? 'Katalog terperinci semua silinder oksigen perubatan aktif daripada Supabase.' : 'Detailed catalog of all active medical oxygen cylinders from Supabase.'}</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[9px] font-black tracking-wider uppercase">Live Database</span>
          </div>
          <Table
            data={cylinders.slice(0, 10)}
            columns={cylinderColumns}
            emptyMessage={language === 'ms' ? 'Tiada silinder ditemui dalam inventori.' : 'No cylinders found in the inventory.'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50 min-h-screen relative font-sans w-full max-w-full overflow-x-hidden">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest">
            <span>{language === 'ms' ? 'Farmasi' : 'Pharmacy'}</span>
            <span>&gt;</span>
            <span>{language === 'ms' ? 'Inventori' : 'Inventory'}</span>
            <span>&gt;</span>
            <span className="text-slate-600 font-bold">{language === 'ms' ? 'Agihan' : 'Distribution'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Wind className="w-8 h-8 text-teal-600" />
            {language === 'ms' ? 'Pengagihan Oksigen Perubatan' : 'Medical Oxygen Distribution'}
          </h1>
          <p className="text-sm text-slate-700 font-semibold mt-1">
            {language === 'ms' 
              ? 'Gambaran keseluruhan kapasiti silinder oksigen, penggunaan, dan status yang dipantau melalui Supabase.' 
              : 'Overview of live oxygen cylinder capacity, utilization, and status tracked via Supabase.'}
          </p>
        </div>

        {currentPath === '/pharmacy/oxygen/consumption' && (
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-sm focus:outline-none"
            >
              <Plus className="w-4 h-4" /> Request Cylinders
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold bg-[#00a68a] text-white rounded-xl hover:bg-[#008f76] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 focus:outline-none"
            >
              <Plus className="w-4 h-4" /> Manual Dispatch
            </button>
          </div>
        )}

        {currentPath === '/pharmacy/oxygen/cylinders' && (
          <button
            onClick={handleRefreshInventoryData}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-sm focus:outline-none"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        )}

        {currentPath === '/pharmacy/oxygen/qr' && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-xs">
            <button
              onClick={() => setQrActiveTab('generate')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                qrActiveTab === 'generate'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏷️ Batch Generator
            </button>
            <button
              onClick={() => setQrActiveTab('monitor')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                qrActiveTab === 'monitor'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📊 Active Monitor ({cylinders.filter(c => c.qr_code_value).length})
            </button>
          </div>
        )}

        {currentPath === '/pharmacy/oxygen/reconciliation' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAuditScanOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 focus:outline-none"
            >
              <QrCode className="w-4 h-4 text-slate-500" />
              Scan QR Code
            </button>
            <button 
              onClick={handleOpenAuditReview}
              disabled={isSavingReconciliation}
              className="px-4 py-2.5 bg-[#00a68a] hover:bg-[#008f76] disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSavingReconciliation ? 'animate-spin' : ''}`} />
              {isSavingReconciliation ? 'Saving Audit...' : 'Save Reconciliation Audit'}
            </button>
          </div>
        )}
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
            className="bg-white text-slate-800 w-full max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-full shadow-2xl border-l border-slate-200 flex flex-col p-6 md:p-8 overflow-hidden relative"
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 flex-shrink-0">
              <div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-0.5">Bahagian Perolehan & Logistik</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Set Cylinder Refill Prices</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure official standard warrant refill rates per cylinder capacity index.</p>
              </div>
              <button 
                onClick={() => setIsPricingModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrices} className="flex flex-col flex-grow overflow-hidden min-h-0">
              <div className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden min-h-0">
                {/* Left Side: Pricing List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {Object.keys(editedPrices).sort().map((sizeCode) => {
                      const isLoanCyl = sizeCode === '101-N' || sizeCode === '101-F'
                      return (
                        <div 
                          key={sizeCode} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 border border-slate-200/80 hover:bg-white hover:border-slate-350 rounded-xl hover:shadow-sm transition-all duration-200 gap-4 ${
                            isLoanCyl ? 'xl:col-span-2 bg-purple-50/20 border-purple-200/60 hover:border-l-4 hover:border-l-purple-500' : 'hover:border-l-4 hover:border-l-sky-500'
                          }`}
                        >
                          <div className="min-w-max">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2.5 py-1 border border-sky-200 bg-sky-50 text-sky-700 rounded-md font-bold text-[11px] block font-mono shadow-xxs">
                                {sizeCode}
                              </span>
                              {isLoanCyl && (
                                <span className="px-2.5 py-0.5 border border-purple-200 bg-purple-100/70 text-purple-800 rounded-md font-extrabold text-[9px] uppercase tracking-wider">
                                  LOAN CYLINDER
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                              {isLoanCyl ? 'Refill & Cylinder Rental Loan Rates' : 'Standard Refill Rate'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Refill Rate Input */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Refill</span>
                              <div className="relative w-32 flex items-center border border-slate-250 rounded-lg bg-white overflow-hidden shadow-xs h-9.5 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/10 transition-all">
                                <span className="pl-3 text-[10px] font-bold text-slate-400">RM</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={editedPrices[sizeCode] || ''}
                                  onChange={(e) => setEditedPrices(prev => ({ ...prev, [sizeCode]: e.target.value }))}
                                  required
                                  className="w-full pr-3 py-2 bg-transparent text-xs font-mono font-bold outline-none border-0 text-right text-slate-800 focus:ring-0"
                                />
                              </div>
                            </div>

                            {/* Loan Rate Input for 101-N and 101-F */}
                            {isLoanCyl && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-tight">Loan Rate</span>
                                <div className="relative w-32 flex items-center border border-purple-200 rounded-lg bg-white overflow-hidden shadow-xs h-9.5 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-600/10 transition-all">
                                  <span className="pl-3 text-[10px] font-bold text-purple-600">RM</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={editedLoanRates[sizeCode] !== undefined ? editedLoanRates[sizeCode] : (systemSettings?.loan_cylinder_rate || 18.36).toString()}
                                    onChange={(e) => setEditedLoanRates(prev => ({ ...prev, [sizeCode]: e.target.value }))}
                                    required
                                    className="w-full pr-3 py-2 bg-transparent text-xs font-mono font-black outline-none border-0 text-right text-purple-950 focus:ring-0"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Elegant Divider */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest block">Audit Trail & Revision Logs</span>
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">Pricing Update History</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Tracks who, when, and what changed in previous official price revisions.</p>
                  </div>

                  {/* Grouped logs display */}
                  <div className="space-y-4 pt-2">
                    {(() => {
                      interface GroupedLog {
                        created_at: string
                        effective_from: string
                        creator: { full_name: string; email: string; jawatan?: string } | null
                        changes: { cylinder_size_code: string; refill_price: number }[]
                      }

                      const groupedLogs: GroupedLog[] = []
                      pricingHistory.forEach((log) => {
                        const logTime = new Date(log.created_at || log.effective_from).getTime()
                        const matchingGroup = groupedLogs.find((group) => {
                          const groupTime = new Date(group.created_at).getTime()
                          return (
                            Math.abs(groupTime - logTime) < 5000 &&
                            group.effective_from === log.effective_from &&
                            (group.creator?.email === log.creator?.email || (!group.creator && !log.creator))
                          )
                        })

                        if (matchingGroup) {
                          matchingGroup.changes.push({
                            cylinder_size_code: log.cylinder_size_code,
                            refill_price: Number(log.refill_price)
                          })
                        } else {
                          groupedLogs.push({
                            created_at: log.created_at || new Date().toISOString(),
                            effective_from: log.effective_from,
                            creator: log.creator || null,
                            changes: [{
                              cylinder_size_code: log.cylinder_size_code,
                              refill_price: Number(log.refill_price)
                            }]
                          })
                        }
                      })

                      if (groupedLogs.length === 0) {
                        return (
                          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-semibold italic">
                            No pricing revision logs recorded.
                          </div>
                        )
                      }

                      return groupedLogs.map((group, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white border border-slate-250 p-4.5 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:border-slate-350 transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-start gap-2.5">
                              {/* Avatar monolith circle */}
                              <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-extrabold text-xs flex-shrink-0">
                                {(group.creator?.full_name || 'System').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <h5 className="text-xs font-extrabold text-slate-800">
                                  {group.creator?.full_name || 'System Administrator'}
                                </h5>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5 leading-tight">
                                  {group.creator?.jawatan || 'Authorized Personnel'} • <span className="font-mono text-[9.5px]">{group.creator?.email || 'admin@hospital.gov.my'}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-left sm:text-right flex flex-col sm:items-end gap-1 flex-shrink-0">
                              <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md block w-max shadow-xxs">
                                EFFECTIVE: {new Date(group.effective_from).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">
                                Revised {new Date(group.created_at).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Refill Cost Updates</span>
                            <div className="flex flex-wrap gap-2">
                              {group.changes.map((chg, cIdx) => (
                                <div key={cIdx} className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2 shadow-xxs">
                                  <span className="font-mono text-[10px] font-black text-slate-700">{chg.cylinder_size_code}</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  <span className="font-mono text-xs font-black text-[#0284c7]">RM {chg.refill_price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>

                {/* Right Side: Form inputs */}
                <div className="w-full md:w-[320px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-5 flex-shrink-0">
                  <div className="space-y-5">
                    {/* Supplier Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Supplier</label>
                      <select 
                        value={isAddingNewSupplier ? 'CUSTOM_NEW' : selectedModalSupplier}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM_NEW') {
                            setIsAddingNewSupplier(true)
                          } else {
                            setIsAddingNewSupplier(false)
                            setSelectedModalSupplier(e.target.value)
                          }
                        }}
                        className="w-full px-3.5 py-2.5 border border-slate-250 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 transition-all text-xs font-semibold text-slate-800 rounded-lg outline-none bg-white shadow-xs"
                      >
                        {realSupplierOptions.map((sup) => (
                          <option key={sup} value={sup}>{sup}</option>
                        ))}
                        <option value="CUSTOM_NEW">+ Add New Supplier...</option>
                      </select>

                      {isAddingNewSupplier && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Enter new supplier name..."
                            value={customSupplierInput}
                            onChange={(e) => setCustomSupplierInput(e.target.value)}
                            required
                            className="w-full px-3.5 py-2 border border-sky-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/10 transition-all text-xs font-medium text-slate-800 rounded-lg outline-none bg-sky-50/30"
                          />
                        </div>
                      )}
                    </div>

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
                      <p className="font-extrabold text-sky-900 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Warrant Budget Protection Guarantee
                      </p>
                      Adjusting prices sets base rates for new PO generations. Historically processed oxygen receptions remain permanently locked to preserve allocated government budget.
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
          MODAL 2: KEY IN RECEIVED OXYGEN DELIVERY
         ======================================================== */}
      {isReceiveModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-all duration-300"
          onClick={() => setIsReceiveModalOpen(false)}
        >
          {/* Injected style tag for premium slide-in animation */}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          
          <div 
            className="bg-white text-slate-800 w-full max-w-4xl lg:max-w-5xl h-full shadow-2xl border-l border-slate-200 flex flex-col p-6 overflow-hidden relative"
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-shrink-0">
              <div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-0.5">Kementerian Kesihatan Malaysia (KKM)</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Key In Received Oxygen Delivery</h3>
                <p className="text-xs text-slate-500 mt-0.5">Record incoming batches to update official government warrant allocations.</p>
              </div>
              <button 
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReception} className="flex flex-col flex-grow overflow-hidden min-h-0">
              
              <div className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden min-h-0">
                {/* Left Side: Cyber-styled Cylinder Inventory list of gorgeous Glass Cards */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CYLINDERS RECEIVED CATALOG</span>
                    <span className="flex items-center gap-1 text-[9px] text-teal-700 font-extrabold bg-teal-50 px-2 py-0.5 border border-teal-200 rounded-md">
                      Live Warrant Rates
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      const filteredReceiveConfigs = (() => {
                        const supplierConfigs = pricingConfigs.filter((c) => isSupplierMatch(c.supplier_name, selectedReceiveSupplier))
                        if (supplierConfigs.length > 0) return supplierConfigs
                        return pricingConfigs.filter((c) => isLindeSupplier(c.supplier_name))
                      })()

                      return filteredReceiveConfigs.map((config) => {
                        const isLoanSize = config.cylinder_size_code.startsWith('101-')
                        const basePrice = config.refill_price
                        const loanRate = config.loan_rate ?? systemSettings?.loan_cylinder_rate ?? 18.36
                        const priceToDisplay = basePrice
                        
                        const sub = (receiveQuantities[config.cylinder_size_code] || 0) * basePrice + (receiveLoans[config.cylinder_size_code] || 0) * loanRate

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
                              </div>
                            </div>

                            {/* Unit price with nice formatting */}
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Warrant Rate</span>
                              <span className="font-mono text-xs font-bold text-slate-655 mt-0.5">
                                RM {priceToDisplay.toFixed(2)}
                              </span>
                            </div>

                            {/* Stepper controls scaled up for spaciousness */}
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Refilled</span>
                                <div className="inline-flex items-center border border-slate-250 bg-white rounded-lg overflow-hidden h-9 shadow-xxs">
                                  <button 
                                    type="button"
                                    onClick={() => setReceiveQuantities(prev => ({ ...prev, [config.cylinder_size_code]: Math.max(0, (prev[config.cylinder_size_code] || 0) - 1) }))}
                                    className="px-3 h-full text-slate-455 hover:bg-slate-100 hover:text-slate-800 transition-all text-xs font-semibold"
                                  >
                                    -
                                  </button>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={receiveQuantities[config.cylinder_size_code] || 0}
                                    onChange={(e) => setReceiveQuantities(prev => ({ ...prev, [config.cylinder_size_code]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                    className="w-10 text-center font-mono font-extrabold text-teal-700 text-xs bg-transparent outline-none border-0 p-0 focus:ring-0"
                                  />
                                  <button 
                                    type="button"
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
                                    >
                                      -
                                    </button>
                                    <input 
                                      type="number" 
                                      min="0"
                                      value={receiveLoans[config.cylinder_size_code] || 0}
                                      onChange={(e) => setReceiveLoans(prev => ({ ...prev, [config.cylinder_size_code]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                      className="w-10 text-center font-mono font-extrabold text-teal-850 text-xs bg-transparent outline-none border-0 p-0 focus:ring-0"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setReceiveLoans(prev => ({ ...prev, [config.cylinder_size_code]: (prev[config.cylinder_size_code] || 0) + 1 }))}
                                      className="px-3 h-full text-slate-455 hover:bg-slate-100 hover:text-slate-800 transition-all text-xs font-semibold"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Subtotal calculation column */}
                            <div className="text-right sm:w-28 flex flex-col justify-end items-end">
                              <span className="text-[9px] text-slate-455 uppercase tracking-widest font-bold">Subtotal</span>
                              <span className="font-mono text-sm font-black text-slate-800 group-hover:text-teal-700 transition-colors mt-0.5">
                                RM {sub.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Right Side: Receipt & Logistics metadata panel (Shopify/Stripe Checkout-inspired) */}
                <div className="w-full md:w-[330px] lg:w-[355px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-150 pt-4 md:pt-0 md:pl-5 flex-shrink-0 overflow-y-auto pr-1">
                  
                  <div className="space-y-5">
                    {/* Section 1: Delivery & Warrant Information */}
                    <div className="bg-slate-50/70 border border-slate-200/80 p-5 rounded-xl space-y-4 shadow-xxs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-200/80 pb-2">Delivery & Warrant Info</span>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold text-teal-800 uppercase tracking-wider block">Target Supplier</label>
                        <select 
                          value={selectedReceiveSupplier}
                          onChange={(e) => setSelectedReceiveSupplier(e.target.value)}
                          className="w-full px-3 py-2 border border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-bold text-slate-800 rounded-lg outline-none bg-white shadow-xxs"
                        >
                          {realSupplierOptions.map((sup) => (
                            <option key={sup} value={sup}>{sup}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">DO No.</label>
                          <input 
                            type="text" 
                            placeholder="DO-998877"
                            value={doNumber}
                            onChange={(e) => setDoNumber(e.target.value)}
                            required
                            className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-mono font-bold rounded-lg outline-none w-full px-3 py-2.5 shadow-xxs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">SO No.</label>
                          <input 
                            type="text" 
                            placeholder="SO-112233"
                            value={soNumber}
                            onChange={(e) => setSoNumber(e.target.value)}
                            required
                            className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-mono font-bold rounded-lg outline-none w-full px-3 py-2.5 shadow-xxs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Date Received</label>
                        <input 
                          type="date" 
                          value={receptionDate}
                          onChange={(e) => setReceptionDate(e.target.value)}
                          required
                          className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-medium rounded-lg outline-none w-full px-3 py-2.5 shadow-xxs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Vote Code</label>
                          <input 
                            type="text" 
                            value={voteCode}
                            onChange={(e) => setVoteCode(e.target.value)}
                            required
                            className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-mono font-bold rounded-lg outline-none w-full px-3 py-2.5 shadow-xxs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-505 uppercase tracking-wider block">Vote Act</label>
                          <input 
                            type="text" 
                            value={voteActivity}
                            onChange={(e) => setVoteActivity(e.target.value)}
                            required
                            className="bg-white border border-slate-255 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-mono font-bold rounded-lg outline-none w-full px-3 py-2.5 shadow-xxs"
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
                        <div className="flex justify-between text-xs text-teal-850 font-semibold">
                          <span>Refill Charges:</span>
                          <span className="font-mono text-teal-900 font-bold">{fmt(calculateFormRefillTotal())}</span>
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
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-all duration-300"
          onClick={() => setIsOfficerModalOpen(false)}
        >
          <div 
            className="bg-white text-slate-800 w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col p-6 overflow-hidden relative"
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 flex-shrink-0">
              <div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-0.5">Warrant Administration Settings</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Edit Officer Signatures</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure signees for the KKM Purchase Order.</p>
              </div>
              <button 
                onClick={() => setIsOfficerModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSignatures} className="flex-grow flex flex-col justify-between overflow-y-auto pr-1">
              <div className="space-y-6">
                {/* Pegawai Memohon */}
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
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3.5 py-2.5 shadow-xxs"
                    />
                  </div>
                </div>

                {/* Ketua Bahagian */}
                <div className="space-y-3.5 pb-5">
                  <h4 className="text-xs font-black text-teal-700 uppercase tracking-widest">2. Ketua Bahagian</h4>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Officer Name</label>
                    <input 
                      type="text" 
                      value={tempSignatures.headName}
                      onChange={(e) => setTempSignatures(prev => ({ ...prev, headName: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-bold rounded-lg outline-none w-full px-3.5 py-2.5 shadow-xxs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Position / Jawatan</label>
                    <input 
                      type="text" 
                      value={tempSignatures.headPosition}
                      onChange={(e) => setTempSignatures(prev => ({ ...prev, headPosition: e.target.value }))}
                      required
                      className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder-slate-400 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3.5 py-2.5 shadow-xxs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 border-t border-slate-100 pt-5">
                <button 
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
      {/* ========================================================
          MODAL 5: PO PREVIEW & EDIT SIGNATURES BEFORE PRINT
         ======================================================== */}
      {isPoPreviewModalOpen && previewRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setIsPoPreviewModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[28px] w-full max-w-7xl h-[90vh] shadow-2xl relative border border-slate-200/50 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0 bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-0.5">LPO Document Workspace</span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">KKM Purchase Order Document Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select signees and verify the generated PDF document live before printing.</p>
              </div>
              <button 
                onClick={() => setIsPoPreviewModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Content Body */}
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden min-h-0">
              
              {/* Left Column: Live PDF Document Viewer (2/3 width) */}
              <div className="flex-1 lg:flex-[2] bg-slate-100 p-4 flex items-center justify-center border-r border-slate-200/50 overflow-hidden relative">
                {previewPdfUrl ? (
                  <iframe 
                    src={`${previewPdfUrl}#navpanes=0`} 
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

              {/* Right Column: Interactive Dropdown Controls (1/3 width) */}
              <form 
                onSubmit={handleGeneratePoWithCustomSignatures} 
                className="w-full lg:w-[380px] p-6 flex flex-col justify-between overflow-y-auto bg-white flex-shrink-0 min-h-0"
              >
                <div className="space-y-6">
                  {/* Summary Box */}
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
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Officer Position (Custom)</label>
                      <input 
                        type="text" 
                        value={previewSignatures.applicantPosition}
                        onChange={(e) => setPreviewSignatures(prev => ({ ...prev, applicantPosition: e.target.value }))}
                        required
                        className="bg-white border border-slate-250 text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all text-xs font-semibold rounded-lg outline-none w-full px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Dropdown 2: Ketua Bahagian */}
                  <div className="space-y-3.5 pb-4">
                    <h4 className="text-xs font-black text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      2. Ketua Bahagian
                    </h4>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Select Head of Dept</label>
                      <select
                        onChange={(e) => {
                          const chosen = hospitalUsers.find(u => u.full_name === e.target.value)
                          if (chosen) {
                            setPreviewSignatures(prev => ({
                              ...prev,
                              headName: chosen.full_name,
                              headPosition: chosen.jawatan || chosen.role?.role_name || 'Pharmacist'
                            }))
                          }
                        }}
                        value={previewSignatures.headName}
                        className="w-full border border-slate-250 rounded-xl p-2.5 text-xs outline-none bg-white text-gray-700 focus:ring-2 focus:ring-teal-600/10 focus:border-teal-500 transition-all font-semibold"
                      >
                        <option value="">-- Select Head --</option>
                        {hospitalUsers.map(user => (
                          <option key={user.id} value={user.full_name}>
                            {user.full_name} ({user.jawatan || user.role?.role_name || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Position (Custom)</label>
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
      {/* ========================================================
          MODAL 6: MONTHLY CYLINDER CONSOLIDATION WORKSPACE MODAL
         ======================================================== */}
      {isMonthlyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsMonthlyModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-4xl max-h-[92vh] shadow-2xl relative border border-slate-200/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border-b border-teal-100 p-6 flex items-start gap-4 flex-shrink-0">
              <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-600/20 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {language === 'ms' ? 'Modul Konsolidasi Dokumen' : 'Document Consolidation Workspace'}
                  </span>
                  <button
                    onClick={() => setIsMonthlyModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-white/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {language === 'ms' ? 'Gabungan Silinder & Dokumen Bulanan' : 'Monthly Cylinder & Document Consolidation'}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                  {language === 'ms'
                    ? 'Gabungkan semua entri penerimaan silinder bagi bulan pilihan menjadi satu PO dan Laporan Audit KEW.PS-3 rasmi.'
                    : 'Combine all cylinder delivery receipts for a chosen month into one official PO and KEW.PS-3 Audit Report.'}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            {(() => {
              const monthlyList = getMonthlyConsolidatedReceptions(receptionsList)
              const activeMonthKey = selectedConsolidateMonthKey || (monthlyList[0]?.monthKey || '')
              const currentMonthRec = monthlyList.find(m => m.monthKey === activeMonthKey) || monthlyList[0]

              if (!currentMonthRec) {
                return (
                  <div className="p-10 text-center text-slate-500 font-semibold italic">
                    {language === 'ms' ? 'Tiada entri penerimaan oksigen untuk digabungkan.' : 'No oxygen reception entries available to consolidate.'}
                  </div>
                )
              }

              return (
                <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                  {/* Month Selection Bar */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        {language === 'ms' ? 'PILIH BULAN KONSOLIDASI' : 'SELECT CONSOLIDATION MONTH'}
                      </label>
                      <select
                        value={activeMonthKey}
                        onChange={(e) => setSelectedConsolidateMonthKey(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-900 font-bold text-sm rounded-xl px-3.5 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                      >
                        {monthlyList.map(m => (
                          <option key={m.monthKey} value={m.monthKey}>
                            {m.monthLabel.toUpperCase()} — ({m.entryCount} {m.entryCount === 1 ? 'Entri' : 'Entri Digabung'} / {fmt(m.total_amount)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        {currentMonthRec.entryCount} {language === 'ms' ? 'Penghantaran Dikesan' : 'Deliveries Detected'}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        {language === 'ms' ? 'BIL. PENGHANTARAN' : 'DELIVERY COUNT'}
                      </span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {currentMonthRec.entryCount}
                      </span>
                      <span className="text-[10px] text-teal-600 font-bold">
                        {language === 'ms' ? 'Entri dalam bulan ini' : 'Entries this month'}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        {language === 'ms' ? 'ISIAN SEMULA' : 'REFILL TOTAL'}
                      </span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {fmt(currentMonthRec.refill_amount)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {language === 'ms' ? 'Perbelanjaan gas' : 'Gas expenditure'}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                        {language === 'ms' ? 'CAJ PINJAMAN' : 'LOAN CHARGES'}
                      </span>
                      <span className="text-xl font-black text-purple-700 mt-1 block">
                        {fmt(currentMonthRec.loan_amount)}
                      </span>
                      <span className="text-[10px] text-purple-600 font-semibold">
                        {language === 'ms' ? 'Pinjaman silinder' : 'Cylinder loans'}
                      </span>
                    </div>

                    <div className="bg-teal-900 text-white border border-teal-800 rounded-2xl p-3.5 shadow-sm">
                      <span className="text-[9px] font-black text-teal-300 uppercase tracking-wider block">
                        {language === 'ms' ? 'JUMLAH KESELURUHAN' : 'GRAND TOTAL'}
                      </span>
                      <span className="text-xl font-black text-white mt-1 block">
                        {fmt(currentMonthRec.total_amount)}
                      </span>
                      <span className="text-[10px] text-teal-200 font-semibold">
                        {language === 'ms' ? 'Amaun gabungan PO' : 'Combined PO amount'}
                      </span>
                    </div>
                  </div>

                  {/* Combined DO Reference */}
                  <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest block mb-1">
                      {language === 'ms' ? 'Nota Serahan (DO) Yang Digabungkan' : 'Consolidated Delivery Orders (DO)'}
                    </span>
                    <p className="font-mono text-xs font-bold text-teal-900 break-words">
                      {currentMonthRec.delivery_order_no || '-'}
                    </p>
                  </div>

                  {/* Individual Entries Table Breakdown */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        {language === 'ms' ? 'Senarai Entri Penghantaran Individu' : 'Individual Delivery Entries List'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {currentMonthRec.records.length} {language === 'ms' ? 'rekod' : 'records'}
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/70 text-[9px] font-bold text-slate-600 uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2">{language === 'ms' ? 'TARIKH' : 'DATE'}</th>
                            <th className="px-4 py-2">{language === 'ms' ? 'DO NO.' : 'DO NO.'}</th>
                            <th className="px-4 py-2 text-right">{language === 'ms' ? 'KOS REFILL' : 'REFILL'}</th>
                            <th className="px-4 py-2 text-right">{language === 'ms' ? 'PINJAMAN' : 'LOAN'}</th>
                            <th className="px-4 py-2 text-right">{language === 'ms' ? 'JUMLAH' : 'TOTAL'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {currentMonthRec.records.map((r, idx) => (
                            <tr key={r.id || idx} className="hover:bg-slate-50/80">
                              <td className="px-4 py-2 font-semibold text-slate-800">
                                {new Date(r.reception_date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-2 font-mono font-bold text-teal-700">
                                {r.delivery_order_no}
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-slate-700">
                                {fmt(r.refill_amount)}
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-purple-700">
                                {fmt(r.loan_amount)}
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-slate-950">
                                {fmt(r.total_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Informational Guidance Callout */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <span className="text-amber-600 text-sm">💡</span>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      {language === 'ms'
                        ? 'Semua silinder daripada setiap entri di atas dijumlahkan mengikut saiz silinder (cth: Entri 1 (4 HS) + Entri 2 (2 HS) + Entri 4 (10 HS) = 16 HS Silinder). Satu PO dan satu Laporan KEW.PS-3 rasmi akan dijana bagi keseluruhan bulan ini.'
                        : 'All cylinders across the entries above will be combined by cylinder size (e.g. Entry 1 (4 HS) + Entry 2 (2 HS) + Entry 4 (10 HS) = 16 HS Cylinders). A single PO and KEW.PS-3 Audit Report will be produced for this entire month.'}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Modal Footer Controls */}
            {(() => {
              const monthlyList = getMonthlyConsolidatedReceptions(receptionsList)
              const activeMonthKey = selectedConsolidateMonthKey || (monthlyList[0]?.monthKey || '')
              const currentMonthRec = monthlyList.find(m => m.monthKey === activeMonthKey) || monthlyList[0]

              return (
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMonthlyModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-white text-slate-700 font-bold rounded-xl text-xs transition-all active:scale-95"
                  >
                    {language === 'ms' ? 'Tutup' : 'Close'}
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={!currentMonthRec}
                      onClick={() => {
                        if (currentMonthRec) {
                          handleDownloadReport(currentMonthRec as any)
                        }
                      }}
                      className="flex-1 sm:flex-none px-4 py-3 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600" />
                      {language === 'ms' ? 'Muat Turun Laporan (KEW.PS-3)' : 'Download Report (KEW.PS-3)'}
                    </button>

                    <button
                      type="button"
                      disabled={!currentMonthRec}
                      onClick={() => {
                        if (currentMonthRec) {
                          setIsMonthlyModalOpen(false)
                          handleOpenPoPreview(currentMonthRec as any)
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {language === 'ms' ? 'Pratonton & Cetak PO Bulanan' : 'Preview & Print Monthly PO'}
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Admin Password Security Challenge Modal for Reset Inventory */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-rose-200 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-500/10 via-red-500/10 to-rose-500/10 border-b border-rose-100 p-6 flex items-start gap-4">
              <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                    High Risk Operational Action
                  </span>
                  <button
                    onClick={() => setIsClearModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                  Pengesahan Pentadbir (Admin Challenge)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Tindakan ini akan menetapkan semula stok silinder kepada 0 dan merekodkan log audit keselamatan.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmClearInventory} className="p-6 space-y-4">
              {clearPasswordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in shake duration-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{clearPasswordError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Masukkan Kata Laluan Pentadbir (Admin Password):
                </label>
                <div className="relative">
                  <input
                    type={showClearPassword ? "text" : "password"}
                    value={clearPasswordInput}
                    onChange={(e) => setClearPasswordInput(e.target.value)}
                    placeholder="Masukkan kata laluan..."
                    required
                    autoFocus
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClearPassword(!showClearPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showClearPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Pengesahan kata laluan pentadbir diperlukan sebelum data stok boleh diset semula.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs transition-all"
                >
                  Batal (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !clearPasswordInput}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isLoading ? 'Mengosongkan...' : '🔒 Pengesahan & Padam'}
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

