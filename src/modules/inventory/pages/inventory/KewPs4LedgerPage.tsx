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
} from 'lucide-react'
import jsQR from 'jsqr'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Table, Spinner, Input, Badge, Select, Button, Modal } from '@/components/ui'
import { 
  getStockLevelSummary, 
  getStockTransactions,
  getItemMovementSummary,
  getDepartmentIssuanceBreakdown,
  getStockLocations,
  createStockReceipt,
  issueStock,
  performStockCheckAndFound,
  bringForwardStock,
  getStockBatches,
  updateStockTransaction,
  matchStockItem,
  normalizeItemCode,
  stripItemCode,
  clearStockTransactions
} from '../../services/inventoryService'
import { getSuppliers } from '@/modules/procurement/services/procurementService'
import { loadStoreLocations } from '@/services/pharmacy/storeLocationService'
import { loadStoreSubLocations } from '@/services/pharmacy/storeSubLocationService'
import { updateFacilityDrugInventoryItem } from '@/services/pharmacy/facilityDrugInventoryService'
import { updateFacilityNonDrugInventoryItem } from '@/services/pharmacy/facilityNonDrugInventoryService'
import type { 
  StockLevelSummary, 
  StockTransactionWithRelations,
  MovementSummary,
  DeptBreakdownRow,
  StockLocation,
  StockBatchWithRelations
} from '@/types/pharmacy'
import { JATA_NEGARA_BASE64 } from '@/modules/mytransporter/pages/jataNegaraBase64'

const DEFAULT_SUPPLIERS = [
  { id: 'sup-001', company_name: 'Pharmaniaga Logistics Sdn Bhd', supplier_code: 'SUP-PHAR-001' },
  { id: 'sup-002', company_name: 'Apex Pharmacy Marketing Sdn Bhd', supplier_code: 'SUP-APEX-002' },
  { id: 'sup-003', company_name: 'B. Braun Medical Supplies Sdn Bhd', supplier_code: 'SUP-BBRAUN-003' },
  { id: 'sup-004', company_name: 'Duopharma Marketing Sdn Bhd', supplier_code: 'SUP-DUO-004' },
  { id: 'sup-005', company_name: 'Sanofi-Aventis Malaysia Sdn Bhd', supplier_code: 'SUP-SANOFI-005' },
  { id: 'sup-006', company_name: 'Pfizer Malaysia Sdn Bhd', supplier_code: 'SUP-PFIZER-006' },
  { id: 'sup-007', company_name: 'Zuellig Pharma Sdn Bhd', supplier_code: 'SUP-ZUELLIG-007' }
]

export interface KkmFacility {
  name: string
  district: string
  state: string
  type: 'Hospital' | 'Klinik Kesihatan' | 'Klinik Desa' | 'PKD' | 'Stor Pusat'
}

const KKM_FACILITIES_DATABASE: KkmFacility[] = [
  // Sipitang, Sabah
  { name: 'Hospital Sipitang', district: 'Sipitang', state: 'Sabah', type: 'Hospital' },
  { name: 'Pejabat Kesihatan Daerah Sipitang (PKD Sipitang)', district: 'Sipitang', state: 'Sabah', type: 'PKD' },
  { name: 'Klinik Kesihatan Sipitang', district: 'Sipitang', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Ibu dan Anak Sipitang (KKIA Sipitang)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Pergigian Sipitang', district: 'Sipitang', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Desa Mesapol (KD Mesapol)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Banting (KD Banting)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Malaman (KD Malaman)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Pantai (KD Pantai)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Long Pasia (KD Long Pasia)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Sindumin (KD Sindumin)', district: 'Sipitang', state: 'Sabah', type: 'Klinik Desa' },

  // Limbang & Lawas, Sarawak
  { name: 'Hospital Limbang', district: 'Limbang', state: 'Sarawak', type: 'Hospital' },
  { name: 'Hospital Lawas', district: 'Lawas', state: 'Sarawak', type: 'Hospital' },
  { name: 'Pejabat Kesihatan Bahagian Limbang (PKB Limbang)', district: 'Limbang', state: 'Sarawak', type: 'PKD' },
  { name: 'Pejabat Kesihatan Daerah Lawas (PKD Lawas)', district: 'Lawas', state: 'Sarawak', type: 'PKD' },
  { name: 'Klinik Kesihatan Limbang', district: 'Limbang', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Batu Danau', district: 'Limbang', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Medamit (Nanga Medamit)', district: 'Limbang', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Mendalam', district: 'Limbang', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Penganan', district: 'Limbang', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Lawas', district: 'Lawas', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Kuala Lawas', district: 'Lawas', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Merapok', district: 'Lawas', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Sundar', district: 'Lawas', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Desa Tedungan', district: 'Limbang', state: 'Sarawak', type: 'Klinik Desa' },
  { name: 'Klinik Desa Ukong', district: 'Limbang', state: 'Sarawak', type: 'Klinik Desa' },
  { name: 'Klinik Desa Nanga Medamit', district: 'Limbang', state: 'Sarawak', type: 'Klinik Desa' },

  // Beaufort, Sabah
  { name: 'Hospital Beaufort', district: 'Beaufort', state: 'Sabah', type: 'Hospital' },
  { name: 'Pejabat Kesihatan Daerah Beaufort (PKD Beaufort)', district: 'Beaufort', state: 'Sabah', type: 'PKD' },
  { name: 'Klinik Kesihatan Beaufort', district: 'Beaufort', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Membakut', district: 'Beaufort', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Padas Damit', district: 'Beaufort', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Desa Weston', district: 'Beaufort', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Gadong', district: 'Beaufort', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Kota Klias', district: 'Beaufort', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Bukau', district: 'Beaufort', state: 'Sabah', type: 'Klinik Desa' },

  // Papar, Sabah
  { name: 'Hospital Papar', district: 'Papar', state: 'Sabah', type: 'Hospital' },
  { name: 'Pejabat Kesihatan Daerah Papar (PKD Papar)', district: 'Papar', state: 'Sabah', type: 'PKD' },
  { name: 'Klinik Kesihatan Papar', district: 'Papar', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Kinarut', district: 'Papar', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Bongawan', district: 'Papar', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Kimanis', district: 'Papar', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Desa Benoni', district: 'Papar', state: 'Sabah', type: 'Klinik Desa' },
  { name: 'Klinik Desa Buang Sayang', district: 'Papar', state: 'Sabah', type: 'Klinik Desa' },

  // Kota Kinabalu & Penampang, Sabah
  { name: 'Hospital Queen Elizabeth (HQE I)', district: 'Kota Kinabalu', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Queen Elizabeth II (HQE II)', district: 'Kota Kinabalu', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Wanita dan Kanak-Kanak Sabah (Hospital Likas)', district: 'Kota Kinabalu', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Mesra Bukit Padang', district: 'Kota Kinabalu', state: 'Sabah', type: 'Hospital' },
  { name: 'Klinik Kesihatan Luyang', district: 'Kota Kinabalu', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Inanam', district: 'Kota Kinabalu', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Likas', district: 'Kota Kinabalu', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Menggatal', district: 'Kota Kinabalu', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Telipok', district: 'Kota Kinabalu', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Penampang', district: 'Penampang', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Stor Integrasi KKM Sabah', district: 'Kota Kinabalu', state: 'Sabah', type: 'Stor Pusat' },

  // Other Major Sabah Districts
  { name: 'Hospital Tawau', district: 'Tawau', state: 'Sabah', type: 'Hospital' },
  { name: 'Klinik Kesihatan Tawau', district: 'Tawau', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Kubota', district: 'Tawau', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Hospital Duchess of Kent', district: 'Sandakan', state: 'Sabah', type: 'Hospital' },
  { name: 'Klinik Kesihatan Sandakan', district: 'Sandakan', state: 'Sabah', type: 'Klinik Kesihatan' },
  { name: 'Hospital Lahad Datu', district: 'Lahad Datu', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Keningau', district: 'Keningau', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Ranau', district: 'Ranau', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Kudat', district: 'Kudat', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Kota Belud', district: 'Kota Belud', state: 'Sabah', type: 'Hospital' },
  { name: 'Hospital Labuan', district: 'Labuan', state: 'W.P. Labuan', type: 'Hospital' },
  { name: 'Klinik Kesihatan Labuan', district: 'Labuan', state: 'W.P. Labuan', type: 'Klinik Kesihatan' },

  // Other Major Sarawak Districts
  { name: 'Hospital Umum Sarawak (HUS)', district: 'Kuching', state: 'Sarawak', type: 'Hospital' },
  { name: 'Hospital Sentosa', district: 'Kuching', state: 'Sarawak', type: 'Hospital' },
  { name: 'Klinik Kesihatan Jalan Petra Jaya', district: 'Kuching', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Klinik Kesihatan Tanah Puteh', district: 'Kuching', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Hospital Miri', district: 'Miri', state: 'Sarawak', type: 'Hospital' },
  { name: 'Klinik Kesihatan Miri', district: 'Miri', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Hospital Sibu', district: 'Sibu', state: 'Sarawak', type: 'Hospital' },
  { name: 'Klinik Kesihatan Sibu Jaya', district: 'Sibu', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Hospital Bintulu', district: 'Bintulu', state: 'Sarawak', type: 'Hospital' },
  { name: 'Klinik Kesihatan Bintulu', district: 'Bintulu', state: 'Sarawak', type: 'Klinik Kesihatan' },
  { name: 'Hospital Sarikei', district: 'Sarikei', state: 'Sarawak', type: 'Hospital' },
  { name: 'Hospital Kapit', district: 'Kapit', state: 'Sarawak', type: 'Hospital' },
  { name: 'Hospital Sri Aman', district: 'Sri Aman', state: 'Sarawak', type: 'Hospital' },
  { name: 'Hospital Mukah', district: 'Mukah', state: 'Sarawak', type: 'Hospital' },
  { name: 'Hospital Betong', district: 'Betong', state: 'Sarawak', type: 'Hospital' },

  // Peninsular Malaysia Major Hospitals & Facilities
  { name: 'Hospital Kuala Lumpur (HKL)', district: 'Kuala Lumpur', state: 'W.P. Kuala Lumpur', type: 'Hospital' },
  { name: 'Hospital Tuanku Ja\'afar', district: 'Seremban', state: 'Negeri Sembilan', type: 'Hospital' },
  { name: 'Hospital Sungai Buloh', district: 'Petaling', state: 'Selangor', type: 'Hospital' },
  { name: 'Hospital Selayang', district: 'Gombak', state: 'Selangor', type: 'Hospital' },
  { name: 'Hospital Tengku Ampuan Rahimah (HTAR)', district: 'Klang', state: 'Selangor', type: 'Hospital' },
  { name: 'Hospital Serdang', district: 'Sepang', state: 'Selangor', type: 'Hospital' },
  { name: 'Hospital Kajang', district: 'Hulu Langat', state: 'Selangor', type: 'Hospital' },
  { name: 'Hospital Sultanah Aminah (HSA)', district: 'Johor Bahru', state: 'Johor', type: 'Hospital' },
  { name: 'Hospital Sultan Ismail (HSI)', district: 'Johor Bahru', state: 'Johor', type: 'Hospital' },
  { name: 'Hospital Pulau Pinang', district: 'Timur Laut', state: 'Pulau Pinang', type: 'Hospital' },
  { name: 'Hospital Raja Permaisuri Bainun (HRPB)', district: 'Kinta', state: 'Perak', type: 'Hospital' },
  { name: 'Hospital Tengku Ampuan Afzan (HTAA)', district: 'Kuantan', state: 'Pahang', type: 'Hospital' },
  { name: 'Hospital Sultanah Bahiyah', district: 'Kota Setar', state: 'Kedah', type: 'Hospital' },
  { name: 'Hospital Raja Perempuan Zainab II (HRPZ II)', district: 'Kota Bharu', state: 'Kelantan', type: 'Hospital' },
  { name: 'Hospital Sultanah Nur Zahirah (HSNZ)', district: 'Kuala Terengganu', state: 'Terengganu', type: 'Hospital' },
  { name: 'Hospital Melaka', district: 'Melaka Tengah', state: 'Melaka', type: 'Hospital' },
  { name: 'Hospital Tuanku Fauziah', district: 'Kangar', state: 'Perlis', type: 'Hospital' },
  { name: 'Stor Pusat Perubatan KKM', district: 'Sepang', state: 'Selangor', type: 'Stor Pusat' }
]

const HOSPITAL_DEPARTMENTS = [
  'Pharmacy Sub Store',
  'Sub-Stor Farmasi',
  'Emergency & Trauma',
  'General Ward',
  'Paediatric Ward',
  'Maternity Ward',
  'Nephrology',
  'Laboratory',
  'Radiology',
  'Pharmacy Counter',
  'Front Desk',
  'Office Admin'
]

const formatLocationDisplay = (locStr: string) => {
  if (!locStr) return ''
  return locStr
    .replace(/^\[[^\]]+\]\s*/, '') // Remove code like [LOG-SL-001]
    .replace(/\((Drug|drug)\)/gi, '(Ubat)') // Translate (Drug) to (Ubat)
    .replace(/\((Non-Drug|non-drug|nondrug)\)/gi, '(Bukan Ubat)') // Translate (Non-Drug) to (Bukan Ubat)
}

export const KewPs4LedgerPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  // Data states
  const [catalogItems, setCatalogItems] = useState<StockLevelSummary[]>([])
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [officialStoreLocations, setOfficialStoreLocations] = useState<any[]>([])
  const [registeredSubLocations, setRegisteredSubLocations] = useState<any[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<StockLevelSummary | null>(null)
  
  // Advanced Movement Data
  const [movementSummary, setMovementSummary] = useState<MovementSummary | null>(null)
  const [deptBreakdown, setDeptBreakdown] = useState<DeptBreakdownRow[]>([])
  const [ledgerRows, setLedgerRows] = useState<any[]>([])

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [activeDatePreset, setActiveDatePreset] = useState<'today' | 'week' | 'month' | '3months' | 'all'>('all')
  const [selectedTxType, setSelectedTxType] = useState<string>('all')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all')
  const [refSearch, setRefSearch] = useState<string>('')

  // Mobile responsive UI states
  const [mobileTab, setMobileTab] = useState<'ledger' | 'summary' | 'departments'>('ledger')
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState<boolean>(false)
  const [isMobileMoreActionsOpen, setIsMobileMoreActionsOpen] = useState<boolean>(false)

  // UI Loading States
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Receiving Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [receiveQty, setReceiveQty] = useState('')
  const [receiveBatchNum, setReceiveBatchNum] = useState('')
  const [receivePackaging, setReceivePackaging] = useState('')
  const [receivePackagingCustom, setReceivePackagingCustom] = useState('')
  const [receiveDate, setReceiveDate] = useState(() => new Date().toISOString().split('T')[0])
  const [receiveExpiryDate, setReceiveExpiryDate] = useState('')
  const [receiveLocationId, setReceiveLocationId] = useState('')
  const [receiveSourceType, setReceiveSourceType] = useState<'supplier' | 'facility'>('supplier')
  const [receiveSupplierId, setReceiveSupplierId] = useState('')
  const [receiveCustomSupplier, setReceiveCustomSupplier] = useState('')
  const [receiveFacilityName, setReceiveFacilityName] = useState('')
  const [facilitySearchFocused, setFacilitySearchFocused] = useState(false)
  const [suppliersList, setSuppliersList] = useState<any[]>(DEFAULT_SUPPLIERS)
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false)
  const [receiveStatus, setReceiveStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filter facilities dynamically based on typed text
  const filteredFacilities = useMemo(() => {
    const q = receiveFacilityName.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return KKM_FACILITIES_DATABASE.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.district.toLowerCase().includes(q) ||
      f.state.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [receiveFacilityName])

  // Check if current selected item is under APPL scheme
  const isApplItem = useMemo(() => {
    if (!selectedItem) return false
    const item = selectedItem as any
    if (item.is_appl === false) return false
    const vote = item.procurement_vote?.toString().toLowerCase() || ''
    const source = item.sheet_source?.toString().toLowerCase() || ''
    const cat = item.category?.toString().toLowerCase() || ''
    const name = item.item_name?.toLowerCase() || ''
    const code = item.item_code?.toLowerCase() || ''

    return (
      item.item_type === 'drug' ||
      vote === 'appl' ||
      source === 'lampiran b' ||
      cat.includes('appl') ||
      item.is_appl === true ||
      item.procurement_scheme === 'appl' ||
      name.includes('appl') ||
      code.includes('appl')
    )
  }, [selectedItem])

  // Active ledger stock helper
  const activeLedgerStock = useMemo(() => {
    if (ledgerRows && ledgerRows.length > 0) {
      return ledgerRows[0].runningBalance
    }
    return selectedItem?.current_stock || 0
  }, [ledgerRows, selectedItem])

  // Computed values for Live Summary Panel (Right Column)
  const parsedReceiveQty = useMemo(() => {
    const val = parseInt(receiveQty, 10)
    return isNaN(val) || val <= 0 ? 0 : val
  }, [receiveQty])

  const projectedNewStock = useMemo(() => {
    if (!selectedItem) return 0
    return activeLedgerStock + parsedReceiveQty
  }, [selectedItem, activeLedgerStock, parsedReceiveQty])

  const resolvedSupplierName = useMemo(() => {
    if (receiveSourceType === 'supplier') {
      if (isApplItem) return 'PHARMANIAGA LOGISTICS SDN BHD (APPL)'
      if (receiveSupplierId === 'CUSTOM') return receiveCustomSupplier.trim() || 'Pembekal Lain (Manual)'
      const matched = suppliersList.find(s => s.id === receiveSupplierId || s.company_name === receiveSupplierId)
      return matched?.company_name || (receiveSupplierId ? receiveSupplierId : 'Belum dipilih')
    }
    return receiveFacilityName.trim() || 'Belum dimasukkan'
  }, [receiveSourceType, isApplItem, receiveSupplierId, receiveCustomSupplier, suppliersList, receiveFacilityName])

  const resolvedPackagingLabel = useMemo(() => {
    if (receivePackaging === 'OTHERS') {
      return receivePackagingCustom.trim() || 'Pembungkusan Berbeza (Manual)'
    }
    return receivePackaging || selectedItem?.packaging_description || selectedItem?.unit_of_measure || 'PACK'
  }, [receivePackaging, receivePackagingCustom, selectedItem])

  // Issuing Modal State & Auto-Populate Batch Selection
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [itemBatches, setItemBatches] = useState<StockBatchWithRelations[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)
  const [issueSelectedBatchId, setIssueSelectedBatchId] = useState('')
  const [issueBatchExpiry, setIssueBatchExpiry] = useState('')
  const [issueBatchPackaging, setIssueBatchPackaging] = useState('')
  const [issueBatchAvailableQty, setIssueBatchAvailableQty] = useState<number>(0)
  const [issueQty, setIssueQty] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0])
  const [issueDeptId, setIssueDeptId] = useState('')
  const [issueReason, setIssueReason] = useState('')
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)
  const [issueStatus, setIssueStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Multi-Batch Allocation State
  const [issueMode, setIssueMode] = useState<'single' | 'multi'>('single')
  const [multiBatchQtys, setMultiBatchQtys] = useState<Record<string, string>>({})
  const [autoFefoTargetQty, setAutoFefoTargetQty] = useState('')

  // Check & Found Modal State
  const [isCheckFoundModalOpen, setIsCheckFoundModalOpen] = useState(false)
  const [checkFoundPhysicalQty, setCheckFoundPhysicalQty] = useState('')
  const [checkFoundBatchId, setCheckFoundBatchId] = useState('')
  const [checkFoundDate, setCheckFoundDate] = useState(() => new Date().toISOString().split('T')[0])
  const [checkFoundOfficer, setCheckFoundOfficer] = useState('')
  const [checkFoundReason, setCheckFoundReason] = useState('')
  const [isSubmittingCheckFound, setIsSubmittingCheckFound] = useState(false)
  const [checkFoundStatus, setCheckFoundStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Bring Forward Modal State
  const [isBringForwardModalOpen, setIsBringForwardModalOpen] = useState(false)
  const [bfQty, setBfQty] = useState('')
  const [bfBatchNum, setBfBatchNum] = useState('')
  const [bfExpiryDate, setBfExpiryDate] = useState('')
  const [bfDate, setBfDate] = useState('')
  const [bfPeriodType, setBfPeriodType] = useState<'previous_year' | 'previous_month' | 'initial_balance'>('previous_year')
  const [bfRefNum, setBfRefNum] = useState('')
  const [bfReason, setBfReason] = useState('')
  const [bfLocationId, setBfLocationId] = useState('')
  const [isSubmittingBf, setIsSubmittingBf] = useState(false)
  const [bfStatus, setBfStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Clear Ledger Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [clearScope, setClearScope] = useState<'selected' | 'all'>('selected')
  const [isSubmittingClear, setIsSubmittingClear] = useState(false)
  const [clearStatus, setClearStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [clearPasswordInput, setClearPasswordInput] = useState('')
  const [isResetAuditModalOpen, setIsResetAuditModalOpen] = useState(false)
  const [resetAuditLogs, setResetAuditLogs] = useState<Array<{
    id: string
    timestamp: string
    performed_by: string
    scope: string
    previous_balance: string
    action: string
    password_verified: boolean
  }>>(() => {
    try {
      const saved = localStorage.getItem('kewps4_reset_audit_logs')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const saveResetAuditLog = (entry: any) => {
    setResetAuditLogs(prev => {
      const updated = [entry, ...prev]
      try {
        localStorage.setItem('kewps4_reset_audit_logs', JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save reset audit log:', e)
      }
      return updated
    })
  }

  // Edit Transaction & Audit Log Modal States
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false)
  const [editingTxRow, setEditingTxRow] = useState<any>(null)
  const [editTxDate, setEditTxDate] = useState('')
  const [editTxQty, setEditTxQty] = useState('')
  const [editTxRefNum, setEditTxRefNum] = useState('')
  const [editTxReason, setEditTxReason] = useState('')
  const [editTxSourceType, setEditTxSourceType] = useState<'supplier' | 'facility'>('supplier')
  const [editTxSupplierId, setEditTxSupplierId] = useState('')
  const [editTxCustomSupplier, setEditTxCustomSupplier] = useState('')
  const [editTxFacilityName, setEditTxFacilityName] = useState('')
  const [isSubmittingEditTx, setIsSubmittingEditTx] = useState(false)
  const [editTxStatus, setEditTxStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Edit Stock Levels & Location Modal State
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false)
  const [editStore, setEditStore] = useState<string>('Stor Logistik (Ubat)')
  const [editStoreCustom, setEditStoreCustom] = useState<string>('')
  const [editRack, setEditRack] = useState<string>('Rack P')
  const [editRackCustom, setEditRackCustom] = useState<string>('')
  const [editLevel, setEditLevel] = useState<string>('Level 1')
  const [editLevelCustom, setEditLevelCustom] = useState<string>('')

  const [editMinStock, setEditMinStock] = useState<string>('')
  const [editBufferStock, setEditBufferStock] = useState<string>('')
  const [editMaxStock, setEditMaxStock] = useState<string>('')
  const [isSubmittingEditStock, setIsSubmittingEditStock] = useState(false)
  const [editStockStatus, setEditStockStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password Protection Modal States for Pinda
  const [isPassModalOpen, setIsPassModalOpen] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState<string | null>(null)
  const [pendingEditRow, setPendingEditRow] = useState<any>(null)

  // Audit History Log Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [auditTxRow, setAuditTxRow] = useState<any>(null)

  // Store audit history per transaction ID or key
  const [auditLogStore, setAuditLogStore] = useState<Record<string, Array<{
    timestamp: string
    edited_by: string
    field_changes: string[]
    reason: string
  }>>>({})

  const [issueRecipientType, setIssueRecipientType] = useState<'internal' | 'facility'>('internal')
  const [issueInternalDept, setIssueInternalDept] = useState('Emergency & Trauma')
  const [issueFacilityName, setIssueFacilityName] = useState('')
  const [issueFacilitySearchFocused, setIssueFacilitySearchFocused] = useState(false)
  const [itemLocations, setItemLocations] = useState<string[]>([])

  // FEFO Auto-Distribution helper for multi-batch mode
  const handleAutoFefo = (targetStr: string) => {
    const totalTarget = parseInt(targetStr, 10)
    if (isNaN(totalTarget) || totalTarget <= 0) {
      setMultiBatchQtys({})
      return
    }

    let remaining = totalTarget
    const newQtys: Record<string, string> = {}

    const sortedBatches = [...itemBatches].sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0
      if (!a.expiry_date) return -1
      if (!b.expiry_date) return 1
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    })

    for (const b of sortedBatches) {
      const avail = Math.min((b.quantity_on_hand || 0) - (b.quantity_reserved || 0), activeLedgerStock)
      if (avail > 0 && remaining > 0) {
        const take = Math.min(avail, remaining)
        newQtys[b.id] = take.toString()
        remaining -= take
      } else {
        newQtys[b.id] = ''
      }
    }
    setMultiBatchQtys(newQtys)
  }

  // Live Summary state for issuing
  const parsedIssueQty = useMemo(() => {
    if (issueMode === 'multi') {
      return Object.values(multiBatchQtys).reduce((sum, valStr) => {
        const q = parseInt(valStr, 10)
        return sum + (isNaN(q) || q <= 0 ? 0 : q)
      }, 0)
    }
    const val = parseInt(issueQty, 10)
    return isNaN(val) || val <= 0 ? 0 : val
  }, [issueMode, multiBatchQtys, issueQty])

  const projectedNewStockAfterIssue = useMemo(() => {
    if (!selectedItem) return 0
    return Math.max(0, activeLedgerStock - parsedIssueQty)
  }, [selectedItem, activeLedgerStock, parsedIssueQty])

  const resolvedIssueRecipientName = useMemo(() => {
    if (issueRecipientType === 'internal') {
      return issueInternalDept
    }
    return issueFacilityName.trim() || 'Belum dimasukkan'
  }, [issueRecipientType, issueInternalDept, issueFacilityName])

  // Filter facilities dynamically based on typed text for issuing
  const filteredIssueFacilities = useMemo(() => {
    const q = issueFacilityName.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return KKM_FACILITIES_DATABASE.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.district.toLowerCase().includes(q) ||
      f.state.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [issueFacilityName])

  // User name display helper
  const recorderName = useMemo(() => {
    return user?.full_name || (user as any)?.name || user?.email?.split('@')[0] || 'Staf Farmasi'
  }, [user])

  const userDepartmentName = useMemo(() => {
    return user?.department?.department_name || (user as any)?.department_name || (user as any)?.jawatan || 'Logistik Farmasi'
  }, [user])

  // Ground-truth stock summary calculations
  const currentStockBalance = useMemo(() => {
    if (ledgerRows && ledgerRows.length > 0) {
      return ledgerRows[0].runningBalance
    }
    return movementSummary?.currentBalance ?? selectedItem?.current_stock ?? 0
  }, [ledgerRows, movementSummary, selectedItem])

  const totalReceived = useMemo(() => {
    if (ledgerRows && ledgerRows.length > 0) {
      return ledgerRows.reduce((sum, r) => sum + (r.receiptQty || 0), 0)
    }
    return movementSummary?.totalReceived ?? 0
  }, [ledgerRows, movementSummary])

  const totalIssued = useMemo(() => {
    if (ledgerRows && ledgerRows.length > 0) {
      return ledgerRows.reduce((sum, r) => sum + (r.issueQty || 0), 0)
    }
    return movementSummary?.totalIssued ?? 0
  }, [ledgerRows, movementSummary])

  // % Pengeluaran calculation
  const issuePercentage = useMemo(() => {
    if (totalReceived > 0) {
      return Math.min(100, Math.round((totalIssued / totalReceived) * 100))
    }
    return totalIssued > 0 ? 100 : 0
  }, [totalReceived, totalIssued])

  // Helper to sanitize supplier names (converts Pharmaniaga Lifescience -> Pharmaniaga Logistics Sdn Bhd)
  const sanitizeSupplierName = (str: string) => {
    if (!str) return ''
    return str.replace(/pharmaniaga\s+lifescience\s*(sdn\s*bhd)?/gi, 'PHARMANIAGA LOGISTICS SDN BHD')
  }

  // Resolve recipient name helper for ledger representation (prevents raw 'Decanting' or 'Default' from showing)
  const resolveRecipientName = (row: any) => {
    let resolved = ''
    if (row.transaction_type === 'check_found') {
      return 'Semakan Stok Fizikal (Audit)'
    }
    if (row.transaction_type === 'bring_forward') {
      return 'Baki Bawa Ke Hadapan (Pembukaan Ledger)'
    }
    const isReceipt = row.transaction_type === 'receipt'


    // 1. First check if reason contains explicit department/recipient/supplier declaration
    if (row.reason) {
      const agihanMatch = row.reason.match(/Agihan ke:\s*([^-\n\t]+)/i)
      if (agihanMatch && agihanMatch[1].trim()) {
        resolved = agihanMatch[1].trim()
      }
      const pindahanMatch = row.reason.match(/Pindahan ke:\s*([^-\n\t]+)/i)
      if (!resolved && pindahanMatch && pindahanMatch[1].trim()) {
        resolved = pindahanMatch[1].trim()
      }
      const pembekalMatch = row.reason.match(/Pembekal:\s*([^-\n\t]+)/i)
      if (!resolved && pembekalMatch && pembekalMatch[1].trim()) {
        resolved = pembekalMatch[1].trim()
      }
      const fasilitiMatch = row.reason.match(/Fasiliti:\s*([^-\n\t]+)/i)
      if (!resolved && fasilitiMatch && fasilitiMatch[1].trim()) {
        resolved = fasilitiMatch[1].trim()
      }
    }

    if (!resolved) {
      if (isReceipt) {
        const locName = row.to_location?.location_name || row.from_location?.location_name
        if (locName && locName.toLowerCase() !== 'decanting' && locName.toLowerCase() !== 'default') {
          resolved = locName
        } else if (row.supplier?.company_name) {
          resolved = row.supplier.company_name
        } else {
          resolved = 'PHARMANIAGA LOGISTICS SDN BHD'
        }
      } else {
        const locName = row.to_location?.location_name || row.from_location?.location_name
        if (locName && locName.toLowerCase() !== 'decanting' && locName.toLowerCase() !== 'default') {
          resolved = locName
        } else {
          resolved = 'Pharmacy Sub Store'
        }
      }
    }

    return sanitizeSupplierName(resolved)
  }

  // Summary log of receipts and issuances grouped by entity (Supplier / Department / Ward)
  const movementLogSummary = useMemo(() => {
    const map: Record<string, { name: string; totalReceived: number; totalIssued: number }> = {}

    ledgerRows.forEach(row => {
      const name = resolveRecipientName(row)
      if (!map[name]) {
        map[name] = { name, totalReceived: 0, totalIssued: 0 }
      }
      if (row.receiptQty !== null && row.receiptQty !== undefined) {
        map[name].totalReceived += Number(row.receiptQty) || 0
      }
      if (row.issueQty !== null && row.issueQty !== undefined) {
        map[name].totalIssued += Number(row.issueQty) || 0
      }
    })

    if (Object.keys(map).length === 0 && deptBreakdown.length > 0) {
      deptBreakdown.forEach(d => {
        const name = d.location_name || d.department_name
        map[name] = { name, totalReceived: 0, totalIssued: d.total_issued || 0 }
      })
    }

    return Object.values(map)
  }, [ledgerRows, deptBreakdown])

  // Unit price helper for item valuation (defaults to RM 5.00 if unspecified)
  const unitPrice = useMemo(() => {
    if (!selectedItem) return 5.00
    const p = Number((selectedItem as any).price || (selectedItem as any).unit_price)
    return isNaN(p) || p <= 0 ? 5.00 : p
  }, [selectedItem])

  // Annual stock parameters (separated per year, e.g. 2026, 2025)
  const annualStockLevels = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const prevYear = currentYear - 1

    const minQty = selectedItem?.min_stock || 20
    const bufferQty = (selectedItem as any)?.buffer_stock ?? selectedItem?.reorder_level ?? Math.round(minQty * 0.5)
    const maxQty = selectedItem?.max_stock || 100

    return [
      { year: currentYear, min: minQty, buffer: bufferQty, max: maxQty },
      { year: prevYear, min: minQty, buffer: bufferQty, max: maxQty }
    ]
  }, [selectedItem])

  // Compute quarterly stock movement summary (Q1, Q2, Q3, Q4) for current year and previous year
  const quarterlySummary = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const prevYear = currentYear - 1

    const initYearStructure = (year: number) => ({
      year,
      q1: { receiptQty: 0, receiptVal: 0, issueQty: 0, issueVal: 0 },
      q2: { receiptQty: 0, receiptVal: 0, issueQty: 0, issueVal: 0 },
      q3: { receiptQty: 0, receiptVal: 0, issueQty: 0, issueVal: 0 },
      q4: { receiptQty: 0, receiptVal: 0, issueQty: 0, issueVal: 0 },
      total: { receiptQty: 0, receiptVal: 0, issueQty: 0, issueVal: 0 }
    })

    const yearsData: Record<number, ReturnType<typeof initYearStructure>> = {
      [prevYear]: initYearStructure(prevYear),
      [currentYear]: initYearStructure(currentYear)
    }

    ledgerRows.forEach(row => {
      const dt = new Date(row.transaction_date || row.created_at)
      if (isNaN(dt.getTime())) return

      const y = dt.getFullYear()
      if (!yearsData[y]) {
        yearsData[y] = initYearStructure(y)
      }

      const month = dt.getMonth() // 0-11
      let qKey: 'q1' | 'q2' | 'q3' | 'q4' = 'q1'
      if (month >= 0 && month <= 2) qKey = 'q1'
      else if (month >= 3 && month <= 5) qKey = 'q2'
      else if (month >= 6 && month <= 8) qKey = 'q3'
      else qKey = 'q4'

      const rQty = Number(row.receiptQty) || 0
      const iQty = Number(row.issueQty) || 0
      const rVal = rQty * unitPrice
      const iVal = iQty * unitPrice

      yearsData[y][qKey].receiptQty += rQty
      yearsData[y][qKey].receiptVal += rVal
      yearsData[y][qKey].issueQty += iQty
      yearsData[y][qKey].issueVal += iVal

      yearsData[y].total.receiptQty += rQty
      yearsData[y].total.receiptVal += rVal
      yearsData[y].total.issueQty += iQty
      yearsData[y].total.issueVal += iVal
    })

    return Object.values(yearsData).sort((a, b) => b.year - a.year)
  }, [ledgerRows, unitPrice])

  // Format reference number helper to format legacy TXN- to clean GRN-SUP-2026-XXXX / TRF-FAC-2026-XXXX / ISS-DEPT-2026-XXXX
  const formatReferenceNumber = (row: any) => {
    const rawNum = row.transaction_number || ''
    if (!rawNum || rawNum === '—') {
      return row.transaction_type === 'receipt' ? 'GRN-SUP-2026-0001' : row.transaction_type === 'bring_forward' ? 'BKH-2026-0001' : 'ISS-DEPT-2026-0001'
    }
    if (rawNum.startsWith('TXN-')) {
      const parts = rawNum.split('-')
      const lastDigits = parts[parts.length - 1] || '0001'
      const isReceipt = row.transaction_type === 'receipt'
      if (isReceipt) {
        const isFacility = row.reason?.toLowerCase().includes('fasiliti')
        return isFacility ? `TRF-FAC-2026-${lastDigits}` : `GRN-SUP-2026-${lastDigits}`
      } else {
        return `ISS-DEPT-2026-${lastDigits}`
      }
    }
    return rawNum
  }

  // Resolve recorder name helper (converts raw UUIDs to human-readable names)
  const resolveRecorderName = (performedBy?: string, userObj?: any) => {
    if (userObj?.name) return userObj.name
    if (userObj?.full_name) return userObj.full_name
    if (!performedBy) return recorderName
    if (/^[0-9a-fA-F-]{36}$/.test(performedBy)) {
      return recorderName
    }
    return performedBy
  }

  // QR Modal & Camera Scan States
  const [searchParams] = useSearchParams()
  const [isQrModalOpen, setIsQrModalOpen] = useState(() => searchParams.get('openScan') === 'true')
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanTab, setScanTab] = useState<'camera' | 'manual'>('camera')
  const [manualCodeInput, setManualCodeInput] = useState('')
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [quickTxType, setQuickTxType] = useState<'receipt' | 'issue'>('receipt')
  const [quickQty, setQuickQty] = useState('')
  const [quickBatchNum, setQuickBatchNum] = useState('')
  const [quickDeptId, setQuickDeptId] = useState('')
  const [isSubmittingQuickTx, setIsSubmittingQuickTx] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastScannedRef = useRef<{ code: string; ts: number } | null>(null)

  // Load catalog, locations & suppliers on mount
  useEffect(() => {
    if (!hospitalId) return
    const loadMetadata = async () => {
      setIsLoadingCatalog(true)
      try {
        const [catRes, locRes, supRes] = await Promise.all([
          getStockLevelSummary(hospitalId),
          getStockLocations(hospitalId),
          getSuppliers(hospitalId, 1, 100).catch(() => ({ data: null }))
        ])
        void loadStoreLocations(hospitalId).then(locs => {
          if (locs) setOfficialStoreLocations(locs)
        }).catch(() => {})
        if (catRes.data) {
          const itemOverrides = JSON.parse(localStorage.getItem('kewps4_item_overrides') || '{}')
          const merged = catRes.data.map((item: any) => {
            if (itemOverrides[item.item_id]) {
              return {
                ...item,
                ...itemOverrides[item.item_id]
              }
            }
            return item
          })
          setCatalogItems(merged)
        }
        if (locRes.data) {
          setLocations(locRes.data)
          if (locRes.data.length > 0) {
            setQuickDeptId(locRes.data[0].id)
          }
        }
        if (supRes && supRes.data?.data && supRes.data.data.length > 0) {
          setSuppliersList(supRes.data.data)
        }
      } catch (err) {
        console.error('Error loading catalog metadata:', err)
      } finally {
        setIsLoadingCatalog(false)
      }
    }
    void loadMetadata()
  }, [hospitalId])

  // Track active item selection
  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItem(null)
      setItemLocations([])
      return
    }
    const matched = catalogItems.find(i => i.item_id === selectedItemId)
    setSelectedItem(matched || null)

    if (matched) {
      getStockBatches(matched.item_id, matched.item_type)
        .then(res => {
          if (res.data && res.data.length > 0) {
            const locNames = res.data
              .map(b => b.location?.location_name)
              .filter(Boolean) as string[]
            setItemLocations(Array.from(new Set(locNames)))
          } else {
            setItemLocations([])
          }
        })
        .catch(() => setItemLocations([]))
    }
  }, [selectedItemId, catalogItems])

  // Auto-populate packaging and supplier when receive modal opens
  useEffect(() => {
    if (isReceiveModalOpen && selectedItem) {
      const itemPackaging = selectedItem.packaging_description || selectedItem.unit_of_measure || 'PACK'
      setReceivePackaging(itemPackaging)
      setReceivePackagingCustom('')

      // If item is APPL, lock supplier to Pharmaniaga
      if (isApplItem) {
        setReceiveSourceType('supplier')
        const pharmaniaga = suppliersList.find(s => s.company_name.toLowerCase().includes('pharmaniaga'))
        setReceiveSupplierId(pharmaniaga?.id || 'sup-001')
      }
    }
  }, [isReceiveModalOpen, selectedItem, isApplItem, suppliersList])

  // Refresh movement details function
  const reloadMovementData = async () => {
    if (!hospitalId || !selectedItemId) return
    setIsLoadingDetails(true)
    try {
      const [sumRes, deptRes, txRes] = await Promise.all([
        getItemMovementSummary(hospitalId, selectedItemId, dateFrom, dateTo),
        getDepartmentIssuanceBreakdown(hospitalId, selectedItemId, dateFrom, dateTo),
        getStockTransactions(hospitalId, {
          item_id: selectedItemId,
          transaction_type: selectedTxType,
          to_location_id: selectedDeptId,
          date_from: dateFrom,
          date_to: dateTo,
          search_query: refSearch
        })
      ])

      if (sumRes.data) setMovementSummary(sumRes.data)
      if (deptRes.data) setDeptBreakdown(deptRes.data)

      if (txRes.data) {
        // Include all transactions (including Check & Found audits) in the ledger
        const cleanTx = txRes.data

        // Compute forward running balance
        const chrono = [...cleanTx].reverse()
        let balance = 0
        const computedRows = chrono.map((t, idx) => {
          const isReceipt = t.transaction_type === 'receipt'
          const isBringForward = t.transaction_type === 'bring_forward'
          const isReturn = t.transaction_type === 'return'
          const isCheckFound = t.transaction_type === 'check_found'
          const qty = Number(t.quantity) || 0

          let receiptQty: number | null = null
          let issueQty: number | null = null

          if (isCheckFound) {
            const reasonStr = t.reason || ''

            // Primary approach: extract physical quantity from reason text "Fizikal: X"
            // This sets the balance directly to the confirmed physical count
            const fizikalMatch = reasonStr.match(/[Ff]izikal[:\s]+(\d+)/)
            const physicalQty = fizikalMatch ? parseInt(fizikalMatch[1], 10) : null

            if (physicalQty !== null && !isNaN(physicalQty)) {
              // Set balance directly to the confirmed physical count
              const prevBalance = balance
              balance = physicalQty
              const diff = physicalQty - prevBalance
              if (diff > 0) {
                receiptQty = diff
              } else if (diff < 0) {
                issueQty = Math.abs(diff)
              } else {
                receiptQty = 0
              }
            } else {
              // Fallback: parse from reason string or treat qty as surplus/deficit
              const isSurplus = reasonStr.includes('Penemuan') || (reasonStr.includes('+') && !reasonStr.includes('Pelarasan'))
              const isDeficit = reasonStr.includes('Pelarasan') || (reasonStr.includes('-') && !reasonStr.includes('Penemuan'))

              if (isSurplus || (!isSurplus && !isDeficit && qty > 0)) {
                // Treat as surplus if reason says so, or if no direction info but qty > 0
                balance += qty
                receiptQty = qty
              } else if (isDeficit) {
                balance -= qty
                issueQty = qty
              } else {
                // Equal (Sama) -> quantity change is 0, balance unchanged
                receiptQty = 0
              }
            }
          } else if (isReceipt || isReturn || isBringForward) {
            balance += qty
            receiptQty = qty
          } else {
            balance -= qty
            issueQty = qty
          }

          return {
            ...t,
            index: idx + 1,
            receiptQty,
            issueQty,
            runningBalance: balance
          }
        })

        setLedgerRows(computedRows.reverse())
      } else {
        setLedgerRows([])
      }
    } catch (err) {
      console.error('Error loading movement details:', err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Reload data on filter change
  useEffect(() => {
    void reloadMovementData()
  }, [hospitalId, selectedItemId, dateFrom, dateTo, selectedTxType, selectedDeptId, refSearch])

  // Open Receiving Modal
  const openReceiveModal = () => {
    setReceiveQty('')
    setReceiveBatchNum(`BT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    setReceivePackaging(selectedItem?.unit_of_measure || 'PACK')
    const twoYearsLater = new Date()
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2)
    setReceiveExpiryDate(twoYearsLater.toISOString().split('T')[0])
    setReceiveDate(new Date().toISOString().split('T')[0])
    setReceiveLocationId(locations[0]?.id || '')
    setReceiveStatus(null)
    setIsReceiveModalOpen(true)
  }

  // Open Issuing Modal
  const openIssueModal = () => {
    setIssueQty('')
    setIssueReason('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setIssueDeptId(locations[0]?.id || '')
    setIssueRecipientType('internal')
    const defaultDept = (selectedItem?.item_type === 'drug' || !selectedItem)
      ? 'Pharmacy Sub Store'
      : 'Emergency & Trauma'
    setIssueInternalDept(defaultDept)
    setIssueFacilityName('')
    setIssueStatus(null)
    setIssueMode('single')
    setMultiBatchQtys({})
    setAutoFefoTargetQty('')
    setIsIssueModalOpen(true)
  }

  // Open Check & Found Modal
  const openCheckFoundModal = () => {
    setCheckFoundPhysicalQty(activeLedgerStock.toString())
    setCheckFoundBatchId(itemBatches.length > 0 ? itemBatches[0].id : '')
    setCheckFoundDate(new Date().toISOString().split('T')[0])
    setCheckFoundOfficer(recorderName)
    setCheckFoundReason('Semakan Stok Fizikal / Audit KEW.PS-4')
    setCheckFoundStatus(null)
    setIsCheckFoundModalOpen(true)
  }

  // Computed values for Bring Forward Live Summary
  const parsedBfQty = useMemo(() => {
    const val = parseInt(bfQty, 10)
    return isNaN(val) || val <= 0 ? 0 : val
  }, [bfQty])

  const projectedNewStockAfterBf = useMemo(() => {
    if (!selectedItem) return 0
    return activeLedgerStock + parsedBfQty
  }, [selectedItem, activeLedgerStock, parsedBfQty])

  // Fetch sub-locations whenever editStore changes
  useEffect(() => {
    if (!isEditStockModalOpen || !hospitalId) return
    const matchedStore = officialStoreLocations.find(l => l.store_name === editStore)
    let storeCode = matchedStore?.location_code
    if (!storeCode) {
      if (editStore.includes('LOG-SL-001') || editStore.includes('Bukan Ubat')) {
        storeCode = 'LOG-SL-001'
      } else if (editStore.includes('Main Freezer') || editStore.includes('LOG-MF')) {
        storeCode = 'LOG-MF-001'
      } else if (editStore.includes('Top Loading') || editStore.includes('LOG-TL')) {
        storeCode = 'LOG-TL-001'
      } else {
        storeCode = 'LOG-SL-002'
      }
    }
    loadStoreSubLocations(hospitalId, storeCode).then(subLocs => {
      setRegisteredSubLocations(subLocs || [])
    }).catch(() => setRegisteredSubLocations([]))
  }, [isEditStockModalOpen, hospitalId, editStore, officialStoreLocations])

  // Registered Racks available for selected store
  const availableRacks = useMemo(() => {
    if (registeredSubLocations && registeredSubLocations.length > 0) {
      const units = registeredSubLocations.filter(u => u.type === 'rack' || u.type === 'cabinet' || u.type === 'pallet')
      if (units.length > 0) return Array.from(new Set(units.map(u => u.name)))
    }
    return ['Rack M', 'Rack N', 'Rack O', 'Rack P', 'Rack Q', 'Rack R']
  }, [registeredSubLocations])

  // Registered Levels available for selected store/rack
  const availableLevels = useMemo(() => {
    if (registeredSubLocations && registeredSubLocations.length > 0) {
      const units = registeredSubLocations.filter(u => 
        (u.type === 'level' || u.type === 'column') && 
        (!u.parent_name || u.parent_name === editRack)
      )
      if (units.length > 0) return Array.from(new Set(units.map(u => u.name)))
    }
    return ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5']
  }, [registeredSubLocations, editRack])

  // Auto sync editRack to valid available rack
  useEffect(() => {
    if (availableRacks.length > 0 && !availableRacks.includes(editRack)) {
      setEditRack(availableRacks[0])
    }
  }, [availableRacks, editRack])

  // Auto sync editLevel to valid available level
  useEffect(() => {
    if (availableLevels.length > 0 && !availableLevels.includes(editLevel)) {
      setEditLevel(availableLevels[0])
    }
  }, [availableLevels, editLevel])

  // Computed full location string helper for preview and save
  const computedFullLocation = useMemo(() => {
    return `${editStore} > ${editRack} > ${editLevel}`
  }, [editStore, editRack, editLevel])

  // Open Edit Stock Parameters & Location Modal
  const openEditStockModal = () => {
    if (!selectedItem) return
    const minQty = selectedItem.min_stock ?? 20
    const bufferQty = (selectedItem as any)?.buffer_stock ?? selectedItem?.reorder_level ?? Math.round(minQty * 0.5)
    const maxQty = selectedItem.max_stock ?? 100

    setEditMinStock(minQty.toString())
    setEditBufferStock(bufferQty.toString())
    setEditMaxStock(maxQty.toString())

    const locString = selectedItem.location || (itemLocations.length > 0 ? itemLocations[0] : '')
    const cleaned = formatLocationDisplay(locString).trim()
    const parts = cleaned ? cleaned.split('>').map(p => p.trim()) : []

    const store = parts[0] || 'Stor Logistik (Ubat)'
    const rack = parts[1] || 'Rack P'
    const level = parts[2] || 'Level 1'

    setEditStore(store)
    setEditRack(rack)
    setEditLevel(level)

    setEditStockStatus(null)
    setIsEditStockModalOpen(true)
  }

  // Handle Edit Stock Parameters & Location Form Submission
  const handleEditStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    const newMin = parseInt(editMinStock, 10) || 0
    const newBuffer = parseInt(editBufferStock, 10) || 0
    const newMax = parseInt(editMaxStock, 10) || 0

    if (newMax < newMin && newMax > 0) {
      setEditStockStatus({ type: 'error', text: 'Paras Maksima tidak boleh kurang daripada Paras Minima.' })
      return
    }

    setIsSubmittingEditStock(true)
    setEditStockStatus(null)

    try {
      const updatedLocation = computedFullLocation
      setCatalogItems(prev => prev.map(item => 
        item.item_id === selectedItem.item_id 
          ? { 
              ...item, 
              min_stock: newMin, 
              reorder_level: newBuffer, 
              buffer_stock: newBuffer, 
              max_stock: newMax, 
              location: updatedLocation 
            }
          : item
      ))

      setSelectedItem((prev: any) => prev ? {
        ...prev,
        min_stock: newMin,
        reorder_level: newBuffer,
        buffer_stock: newBuffer,
        max_stock: newMax,
        location: updatedLocation
      } : null)

      try {
        const itemOverrides = JSON.parse(localStorage.getItem('kewps4_item_overrides') || '{}')
        itemOverrides[selectedItem.item_id] = {
          min_stock: newMin,
          reorder_level: newBuffer,
          buffer_stock: newBuffer,
          max_stock: newMax,
          location: updatedLocation
        }
        localStorage.setItem('kewps4_item_overrides', JSON.stringify(itemOverrides))
      } catch (err) {
        console.error('Failed to save stock level overrides:', err)
      }

      // Persist location & buffer to facility_drug_inventory / facility_nondrug_inventory tables in DB
      if (selectedItem.item_type === 'drug') {
        updateFacilityDrugInventoryItem(hospitalId, selectedItem.item_id, {
          location: updatedLocation,
          min_buffer_level: newBuffer
        })
      } else {
        updateFacilityNonDrugInventoryItem(hospitalId, selectedItem.item_id, {
          location: updatedLocation,
          min_buffer_level: newBuffer,
          min_stock_level: newMin,
          max_stock_level: newMax
        })
      }

      // Also persist min_stock_level & max_stock_level to drugs / non_drugs catalog tables
      import('@/services/supabase').then(({ supabase, isSupabaseConfigured }) => {
        if (isSupabaseConfigured()) {
          if (selectedItem.item_type === 'drug') {
            supabase
              .from('drugs')
              .update({ min_stock_level: newMin, max_stock_level: newMax, updated_at: new Date().toISOString() })
              .eq('id', selectedItem.item_id)
              .then(({ error }) => { if (error) console.error('Failed to update drugs min/max:', error) })
          } else {
            supabase
              .from('non_drugs')
              .update({ min_stock_level: newMin, max_stock_level: newMax, updated_at: new Date().toISOString() })
              .eq('id', selectedItem.item_id)
              .then(({ error }) => { if (error) console.error('Failed to update non_drugs min/max:', error) })
          }
        }
      })

      playBeep('success')
      setEditStockStatus({ type: 'success', text: 'Berjaya mengemaskini Lokasi, Buffer, Min & Max stok!' })

      setTimeout(() => {
        setIsEditStockModalOpen(false)
        setEditStockStatus(null)
      }, 1000)
    } catch (err: any) {
      playBeep('error')
      setEditStockStatus({ type: 'error', text: err.message || 'Gagal mengemaskini parameter stok.' })
    } finally {
      setIsSubmittingEditStock(false)
    }
  }

  // Open Bring Forward Modal
  const openBringForwardModal = (customQty?: string) => {
    const currentYear = new Date().getFullYear()
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    setBfQty(customQty !== undefined ? customQty : '')
    setBfBatchNum(`BKH-${currentYear}-${randSuffix}`)
    const twoYearsLater = new Date()
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2)
    setBfExpiryDate(twoYearsLater.toISOString().split('T')[0])
    setBfDate(`${currentYear}-01-01`)
    setBfPeriodType('previous_year')
    setBfRefNum(`BKH-${currentYear}-${randSuffix}`)
    setBfReason(`Baki Bawa Ke Hadapan dari Tahun ${currentYear - 1}`)
    setBfLocationId(locations[0]?.id || '')
    setBfStatus(null)
    setIsBringForwardModalOpen(true)
  }

  // Handle Period Type change
  const handleBfPeriodTypeChange = (type: 'previous_year' | 'previous_month' | 'initial_balance') => {
    setBfPeriodType(type)
    const now = new Date()
    const currentYear = now.getFullYear()
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    if (type === 'previous_year') {
      setBfDate(`${currentYear}-01-01`)
      setBfReason(`Baki Bawa Ke Hadapan dari Tahun ${currentYear - 1}`)
      setBfRefNum(`BKH-${currentYear}-${randSuffix}`)
    } else if (type === 'previous_month') {
      const monthStr = String(now.getMonth() + 1).padStart(2, '0')
      setBfDate(`${currentYear}-${monthStr}-01`)
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthName = prevMonthDate.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })
      setBfReason(`Baki Bawa Ke Hadapan dari ${prevMonthName}`)
      setBfRefNum(`BKH-${currentYear}${monthStr}-${randSuffix}`)
    } else {
      setBfDate(now.toISOString().split('T')[0])
      setBfReason('Baki Pembukaan Asal Ledger')
      setBfRefNum(`BKH-INIT-${currentYear}-${randSuffix}`)
    }
  }

  // Submit Bring Forward Transaction
  const handleBringForwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    const qty = parseInt(bfQty, 10)
    if (isNaN(qty) || qty <= 0) {
      setBfStatus({ type: 'error', text: 'Sila masukkan kuantiti baki bawa ke hadapan yang sah (> 0).' })
      return
    }

    setIsSubmittingBf(true)
    setBfStatus(null)
    try {
      const currentYr = new Date().getFullYear()
      const uniqueSuffix = `${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`
      
      const finalBatchNum = (bfBatchNum.trim() && !bfBatchNum.endsWith('-0001')) 
        ? bfBatchNum.trim() 
        : `BKH-${currentYr}-${uniqueSuffix}`

      const finalTxnNum = (bfRefNum.trim() && !bfRefNum.endsWith('-0001')) 
        ? bfRefNum.trim() 
        : `BKH-${currentYr}-${uniqueSuffix}`

      const res = await bringForwardStock(hospitalId, {
        item_type: selectedItem.item_type,
        item_id: selectedItem.item_id,
        bring_forward_qty: qty,
        batch_number: finalBatchNum,
        transaction_number: finalTxnNum,
        expiry_date: bfExpiryDate || undefined,
        transaction_date: bfDate || new Date().toISOString().split('T')[0],
        period_type: bfPeriodType,
        location_id: bfLocationId || locations[0]?.id || '',
        performed_by: user?.id || recorderName,
        reason: bfReason.trim() || 'Baki Bawa Ke Hadapan'
      })

      if (res.error) throw new Error(res.error)

      playBeep('success')
      setBfStatus({
        type: 'success',
        text: `Berjaya merekodkan Baki Bawa Ke Hadapan sebanyak ${qty} ${selectedItem.unit_of_measure}! Baki stok ledger kini diperkemaskan.`
      })

      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

      setTimeout(() => {
        setIsBringForwardModalOpen(false)
        setBfStatus(null)
        setBfQty('')
      }, 1400)
    } catch (err: any) {
      playBeep('error')
      setBfStatus({ type: 'error', text: err.message || 'Gagal menyimpan baki bawa ke hadapan.' })
    } finally {
      setIsSubmittingBf(false)
    }
  }

  // Open Clear Ledger Modal
  const openClearModal = () => {
    setClearScope('selected')
    setClearPasswordInput('')
    setClearStatus(null)
    setIsClearModalOpen(true)
  }

  // Submit Clear Transactions
  const handleClearSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId) return

    if (clearPasswordInput !== 'F@rmasi.2016') {
      playBeep('error')
      setClearStatus({ type: 'error', text: 'Kata laluan kebenaran tidak sah! Akses set semula ledger ditolak.' })
      return
    }

    setIsSubmittingClear(true)
    setClearStatus(null)
    try {
      const targetItemId = clearScope === 'selected' ? selectedItemId : undefined
      const prevBal = activeLedgerStock
      const itemName = selectedItem ? `${selectedItem.item_code} - ${selectedItem.item_name}` : 'Item Terpilih'

      const res = await clearStockTransactions(hospitalId, targetItemId)
      if (res.error) throw new Error(res.error)

      // Save audit log entry for reset action
      const newLogEntry = {
        id: `reset-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        performed_by: recorderName,
        scope: clearScope === 'selected' ? `Item: ${itemName}` : 'Keseluruhan Inventori Stor Hospital',
        previous_balance: clearScope === 'selected' ? `${prevBal} ${selectedItem?.unit_of_measure || 'Unit'}` : 'Semua Item',
        action: 'SET SEMULA LEDGER (RESET TO 0)',
        password_verified: true,
      }

      saveResetAuditLog(newLogEntry)

      playBeep('success')
      setClearStatus({
        type: 'success',
        text: clearScope === 'selected'
          ? `Berjaya memadam semua rekod transaksi dan menetapkan semula baki stok bagi "${selectedItem?.item_name || 'item'}" kepada 0! Log audit keselamatan telah disimpan.`
          : `Berjaya memadam semua rekod transaksi dan menetapkan semula baki stok bagi keseluruhan inventori kepada 0! Log audit keselamatan telah disimpan.`
      })

      // Refresh catalog and movement details
      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

      setTimeout(() => {
        setIsClearModalOpen(false)
        setClearStatus(null)
        setClearPasswordInput('')
      }, 1500)
    } catch (err: any) {
      playBeep('error')
      setClearStatus({ type: 'error', text: err.message || 'Gagal memadam rekod transaksi.' })
    } finally {
      setIsSubmittingClear(false)
    }
  }

  // Effect: Fetch active batches whenever Issuing Drawer is open and selectedItem changes
  useEffect(() => {
    if (!isIssueModalOpen || !selectedItem) {
      setItemBatches([])
      setIssueSelectedBatchId('')
      setIssueBatchExpiry('')
      setIssueBatchPackaging('')
      setIssueBatchAvailableQty(0)
      return
    }

    const loadBatches = async () => {
      setIsLoadingBatches(true)
      try {
        const res = await getStockBatches(selectedItem.item_id, selectedItem.item_type)
        let batchesList = res.data || []
        const effectiveStock = Math.max(activeLedgerStock || 0, selectedItem.current_stock || 0)

        // If no active batch found in DB/mock, but item has stock balance, provide a virtual fallback batch without inserting database transactions
        if (batchesList.length === 0 && effectiveStock > 0) {
          const fallbackBatch: any = {
            id: `batch-virtual-opening-${selectedItem.item_id}`,
            hospital_id: hospitalId,
            item_id: selectedItem.item_id,
            item_type: selectedItem.item_type,
            batch_number: 'STOK-SEDIA-ADA',
            quantity_on_hand: effectiveStock,
            quantity_reserved: 0,
            packaging: selectedItem.packaging_description || selectedItem.unit_of_measure || 'PACK',
            expiry_date: null,
            status: 'available'
          }
          batchesList = [fallbackBatch]
        }

        if (batchesList.length > 0) {
          const sorted = [...batchesList].sort((a, b) => {
            if (!a.expiry_date && !b.expiry_date) return 0
            if (!a.expiry_date) return -1
            if (!b.expiry_date) return 1
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          })
          setItemBatches(sorted)
          setIssueSelectedBatchId(sorted[0].id)
        } else {
          setItemBatches([])
          setIssueSelectedBatchId('')
          setIssueBatchExpiry('')
          setIssueBatchPackaging('')
          setIssueBatchAvailableQty(0)
        }
      } catch (err) {
        console.error('Error fetching batches for issuing:', err)
      } finally {
        setIsLoadingBatches(false)
      }
    }

    void loadBatches()
  }, [isIssueModalOpen, selectedItem, activeLedgerStock, hospitalId])

  // Auto-follow effect: When issueSelectedBatchId changes, auto-populate Expiry Date, Packaging & Available Qty
  useEffect(() => {
    if (!issueSelectedBatchId || itemBatches.length === 0) return
    const matched = itemBatches.find(b => b.id === issueSelectedBatchId)
    if (matched) {
      const expStr = matched.expiry_date ? new Date(matched.expiry_date).toISOString().split('T')[0] : '—'
      setIssueBatchExpiry(expStr)
      setIssueBatchPackaging(matched.packaging || selectedItem?.unit_of_measure || 'PACK')
      const batchQty = matched.quantity_on_hand || 0
      const effectiveBatchQty = Math.max(batchQty, activeLedgerStock || 0)
      const available = Math.max(0, effectiveBatchQty - (matched.quantity_reserved || 0))
      setIssueBatchAvailableQty(available)
    }
  }, [issueSelectedBatchId, itemBatches, selectedItem, activeLedgerStock])

  // Submit Receiving Transaction
  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    let receivedFromText = ''
    let selectedSupplierId: string | undefined = undefined

    if (isApplItem) {
      const pharmaniaga = suppliersList.find(s => s.company_name.toLowerCase().includes('pharmaniaga'))
      receivedFromText = `Pembekal: ${pharmaniaga?.company_name || 'Pharmaniaga Logistics Sdn Bhd'}`
      selectedSupplierId = pharmaniaga?.id || 'sup-001'
    } else if (receiveSourceType === 'supplier') {
      if (receiveSupplierId === 'CUSTOM') {
        if (!receiveCustomSupplier.trim()) {
          setReceiveStatus({ type: 'error', text: 'Sila nyatakan nama pembekal (Supplier Name).' })
          return
        }
        receivedFromText = `Pembekal: ${receiveCustomSupplier.trim()}`
      } else if (receiveSupplierId) {
        const matched = suppliersList.find(s => s.id === receiveSupplierId || s.company_name === receiveSupplierId)
        const supplierName = matched ? matched.company_name : receiveSupplierId
        receivedFromText = `Pembekal: ${supplierName}`
        selectedSupplierId = matched?.id
      } else {
        setReceiveStatus({ type: 'error', text: 'Sila pilih pembekal daripada senarai.' })
        return
      }
    } else {
      if (!receiveFacilityName.trim()) {
        setReceiveStatus({ type: 'error', text: 'Sila masukkan nama fasiliti pembekal / sumber stok.' })
        return
      }
      receivedFromText = `Fasiliti: ${receiveFacilityName.trim()}`
    }

    const qty = parseInt(receiveQty, 10)
    if (isNaN(qty) || qty <= 0) {
      setReceiveStatus({ type: 'error', text: 'Sila masukkan kuantiti penerimaan yang sah (> 0).' })
      return
    }
    if (!receiveBatchNum.trim()) {
      setReceiveStatus({ type: 'error', text: 'Sila masukkan nombor batch.' })
      return
    }

    setIsSubmittingReceive(true)
    setReceiveStatus(null)
    try {
      const generatedRefNum = receiveSourceType === 'supplier'
        ? `GRN-SUP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
        : `TRF-FAC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

      const res = await createStockReceipt(hospitalId, {
        item_type: selectedItem.item_type,
        item_id: selectedItem.item_id,
        batch_number: receiveBatchNum.trim(),
        transaction_number: generatedRefNum,
        expiry_date: receiveExpiryDate || undefined,
        quantity_received: qty,
        location_id: receiveLocationId || locations[0]?.id || '',
        supplier_id: selectedSupplierId,
        received_from: receivedFromText,
        received_date: receiveDate || new Date().toISOString().split('T')[0],
        transaction_date: receiveDate ? `${receiveDate}T12:00:00.000Z` : undefined,
        performed_by: user?.id || recorderName
      })

      if (res.error) throw new Error(res.error)

      const finalPackagingLabel = receivePackaging === 'OTHERS'
        ? (receivePackagingCustom || selectedItem.unit_of_measure)
        : (receivePackaging || selectedItem.unit_of_measure)

      playBeep('success')
      setReceiveStatus({ type: 'success', text: `Berjaya merekodkan penerimaan ${qty} ${finalPackagingLabel} stok daripada ${receivedFromText}!` })

      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

      setTimeout(() => {
        setIsReceiveModalOpen(false)
        setReceiveQty('')
        setReceiveBatchNum('')
        setReceiveSupplierId('')
        setReceiveCustomSupplier('')
        setReceiveFacilityName('')
        setReceivePackagingCustom('')
        setReceiveStatus(null)
      }, 1400)
    } catch (err: any) {
      playBeep('error')
      setReceiveStatus({ type: 'error', text: err.message || 'Gagal menyimpan penerimaan stok.' })
    } finally {
      setIsSubmittingReceive(false)
    }
  }

  // Submit Issuing Transaction
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    const activeAllocations = Object.entries(multiBatchQtys)
      .map(([batchId, qtyStr]) => ({ batchId, qty: parseInt(qtyStr, 10) || 0 }))
      .filter(item => item.qty > 0)

    if (issueMode === 'multi') {
      if (activeAllocations.length === 0) {
        setIssueStatus({ type: 'error', text: 'Sila masukkan kuantiti pengeluaran sekurang-kurangnya untuk 1 batch.' })
        return
      }
      for (const alloc of activeAllocations) {
        const b = itemBatches.find(x => x.id === alloc.batchId)
        if (b) {
          const avail = Math.min((b.quantity_on_hand || 0) - (b.quantity_reserved || 0), activeLedgerStock)
          if (alloc.qty > avail) {
            setIssueStatus({ type: 'error', text: `Kuantiti untuk Batch ${b.batch_number} (${alloc.qty}) melepasi baki tersedia (${avail}).` })
            return
          }
        }
      }
    } else {
      if (!issueSelectedBatchId) {
        setIssueStatus({ type: 'error', text: 'Sila pilih No. Batch yang hendak dikeluarkan.' })
        return
      }
      const qty = parseInt(issueQty, 10)
      if (isNaN(qty) || qty <= 0) {
        setIssueStatus({ type: 'error', text: 'Sila masukkan kuantiti pengeluaran yang sah (> 0).' })
        return
      }
      if (qty > issueBatchAvailableQty) {
        setIssueStatus({ type: 'error', text: `Kuantiti melepasi baki batch yang tersedia (${issueBatchAvailableQty}).` })
        return
      }
    }

    let resolvedRecipientText = ''
    let selectedToLocationId: string | undefined = undefined

    if (issueRecipientType === 'internal') {
      resolvedRecipientText = `Agihan ke: ${issueInternalDept}`
      const matchedLoc = locations.find(l => l.location_name === issueInternalDept)
      if (matchedLoc) {
        selectedToLocationId = matchedLoc.id
      }
    } else {
      if (!issueFacilityName.trim()) {
        setIssueStatus({ type: 'error', text: 'Sila masukkan nama fasiliti penerima.' })
        return
      }
      resolvedRecipientText = `Pindahan ke: ${issueFacilityName.trim()}`
    }

    const finalReason = issueReason.trim()
      ? `${resolvedRecipientText} - ${issueReason.trim()}`
      : resolvedRecipientText

    setIsSubmittingIssue(true)
    setIssueStatus(null)
    try {
      if (issueMode === 'multi') {
        let totalIssued = 0
        const baseRef = `ISS-DEPT-${Date.now().toString().slice(-6)}`
        for (let i = 0; i < activeAllocations.length; i++) {
          const alloc = activeAllocations[i]
          const refNum = activeAllocations.length === 1 
            ? `${baseRef}-${Math.floor(100 + Math.random() * 900)}` 
            : `${baseRef}-${i + 1}`
          const res = await issueStock(hospitalId, {
            batch_id: alloc.batchId,
            quantity: alloc.qty,
            transaction_number: refNum,
            to_location_id: selectedToLocationId,
            reason: finalReason,
            issued_date: issueDate || new Date().toISOString().split('T')[0],
            transaction_date: issueDate ? `${issueDate}T12:00:00.000Z` : undefined,
            performed_by: user?.id || recorderName
          })
          if (res.error) throw new Error(res.error)
          totalIssued += alloc.qty
        }

        playBeep('success')
        setIssueStatus({ type: 'success', text: `Berjaya merekodkan pengeluaran ${totalIssued} ${selectedItem.unit_of_measure} stok daripada ${activeAllocations.length} batch!` })
      } else {
        const qty = parseInt(issueQty, 10)
        const generatedIssueRef = `ISS-DEPT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
        const res = await issueStock(hospitalId, {
          batch_id: issueSelectedBatchId,
          quantity: qty,
          transaction_number: generatedIssueRef,
          to_location_id: selectedToLocationId,
          reason: finalReason,
          issued_date: issueDate || new Date().toISOString().split('T')[0],
          transaction_date: issueDate ? `${issueDate}T12:00:00.000Z` : undefined,
          performed_by: user?.id || recorderName
        })

        if (res.error) throw new Error(res.error)

        playBeep('success')
        setIssueStatus({ type: 'success', text: `Berjaya merekodkan pengeluaran ${qty} ${issueBatchPackaging} stok!` })
      }

      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

      setTimeout(() => {
        setIsIssueModalOpen(false)
        setIssueQty('')
        setIssueReason('')
        setMultiBatchQtys({})
        setIssueStatus(null)
      }, 1300)
    } catch (err: any) {
      playBeep('error')
      setIssueStatus({ type: 'error', text: err.message || 'Gagal menyimpan pengeluaran stok.' })
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  // Submit Check & Found Transaction
  const handleCheckFoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    const physQty = parseInt(checkFoundPhysicalQty, 10)
    if (isNaN(physQty) || physQty < 0) {
      setCheckFoundStatus({ type: 'error', text: 'Sila masukkan kuantiti fizikal yang sah (≥ 0).' })
      return
    }

    setIsSubmittingCheckFound(true)
    setCheckFoundStatus(null)
    try {
      const res = await performStockCheckAndFound(hospitalId, {
        item_type: selectedItem.item_type,
        item_id: selectedItem.item_id,
        batch_id: checkFoundBatchId || undefined,
        physical_quantity: physQty,
        system_quantity: activeLedgerStock,
        location_id: locations[0]?.id || undefined,
        checked_by: user?.id || checkFoundOfficer || recorderName,
        reason: checkFoundReason,
        transaction_date: checkFoundDate || new Date().toISOString().split('T')[0]
      })

      if (res.error) throw new Error(res.error)

      const diff = physQty - activeLedgerStock
      const diffLabel = diff === 0 
        ? 'SAMA (Tiada Perubahan)' 
        : diff > 0 
        ? `PENEMUAN (+${diff} ${selectedItem.unit_of_measure})` 
        : `PELARASAN (${diff} ${selectedItem.unit_of_measure})`

      playBeep('success')
      setCheckFoundStatus({ 
        type: 'success', 
        text: `Berjaya merekodkan Semakan & Penemuan Stok! Kedudukan stok fizikal disahkan: ${physQty} ${selectedItem.unit_of_measure} [${diffLabel}].` 
      })

      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

      setTimeout(() => {
        setIsCheckFoundModalOpen(false)
        setCheckFoundStatus(null)
      }, 1400)
    } catch (err: any) {
      playBeep('error')
      setCheckFoundStatus({ type: 'error', text: err.message || 'Gagal merekodkan semakan stok.' })
    } finally {
      setIsSubmittingCheckFound(false)
    }
  }

  // Step 1: Trigger Password Prompt when Pinda is clicked
  const triggerEditAuth = (row: any) => {
    setPendingEditRow(row)
    setPassInput('')
    setPassError(null)
    setIsPassModalOpen(true)
  }

  // Step 2: Verify Password against "F@rmasi.2016"
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (passInput === 'F@rmasi.2016') {
      setIsPassModalOpen(false)
      const rowToEdit = pendingEditRow
      setPendingEditRow(null)
      if (rowToEdit) {
        openEditModal(rowToEdit)
      }
    } else {
      playBeep('error')
      setPassError('Kata laluan kebenaran tidak sah! Akses pinda rekod ditolak.')
    }
  }

  // Open Edit Transaction Modal
  const openEditModal = (row: any) => {
    setEditingTxRow(row)
    const rawDate = row.transaction_date || row.created_at
    const formattedDate = new Date(rawDate).toISOString().split('T')[0]
    setEditTxDate(formattedDate)
    setEditTxQty((row.receiptQty !== null ? row.receiptQty : (row.issueQty !== null ? row.issueQty : row.quantity || 0)).toString())
    setEditTxRefNum(formatReferenceNumber(row))
    setEditTxReason('')
    setEditTxStatus(null)

    // Initialize supplier / source details
    const rawSource = row.received_from || row.reason || ''
    if (rawSource.startsWith('Fasiliti:') || rawSource.toLowerCase().includes('fasiliti')) {
      setEditTxSourceType('facility')
      const facName = rawSource.replace(/^Fasiliti:\s*/i, '').replace(/^Penerimaan stok daripada:\s*/i, '').trim()
      setEditTxFacilityName(facName)
      setEditTxSupplierId('')
      setEditTxCustomSupplier('')
    } else {
      setEditTxSourceType('supplier')
      setEditTxFacilityName('')
      const cleanSuppName = rawSource.replace(/^Pembekal:\s*/i, '').replace(/^Penerimaan stok daripada:\s*/i, '').trim()
      if (row.supplier_id) {
        const match = suppliersList.find(s => s.id === row.supplier_id || s.company_name.toLowerCase() === cleanSuppName.toLowerCase())
        if (match) {
          setEditTxSupplierId(match.id)
          setEditTxCustomSupplier('')
        } else {
          setEditTxSupplierId('CUSTOM')
          setEditTxCustomSupplier(cleanSuppName || row.supplier_id)
        }
      } else if (cleanSuppName) {
        const match = suppliersList.find(s => s.company_name.toLowerCase() === cleanSuppName.toLowerCase())
        if (match) {
          setEditTxSupplierId(match.id)
          setEditTxCustomSupplier('')
        } else {
          setEditTxSupplierId('CUSTOM')
          setEditTxCustomSupplier(cleanSuppName)
        }
      } else {
        setEditTxSupplierId(suppliersList[0]?.id || 'sup-001')
        setEditTxCustomSupplier('')
      }
    }

    setIsEditTxModalOpen(true)
  }

  // Submit Transaction Edit & Append Audit Trail
  const handleSaveTransactionEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTxRow) return

    const newQty = parseInt(editTxQty, 10)
    if (isNaN(newQty) || newQty <= 0) {
      setEditTxStatus({ type: 'error', text: 'Sila masukkan kuantiti yang sah (> 0).' })
      return
    }

    if (!editTxReason.trim()) {
      setEditTxStatus({ type: 'error', text: 'Sila masukkan Sebab Pindaan / Bukti Audit (Wajib untuk tujuan audit stok).' })
      return
    }

    const oldQty = editingTxRow.receiptQty !== null ? editingTxRow.receiptQty : (editingTxRow.issueQty !== null ? editingTxRow.issueQty : editingTxRow.quantity || 0)
    const oldDateStr = new Date(editingTxRow.transaction_date || editingTxRow.created_at).toISOString().split('T')[0]
    const oldRefNum = formatReferenceNumber(editingTxRow)
    const oldSupplierStr = editingTxRow.received_from || ''
    
    let newSupplierStr = ''
    let newSupplierId: string | undefined = undefined

    const isReceiving = editingTxRow.receiptQty !== null || editingTxRow.transaction_type === 'receipt' || editingTxRow.transaction_type === 'bring_forward' || Boolean(oldSupplierStr)

    if (isReceiving) {
      if (editTxSourceType === 'supplier') {
        if (editTxSupplierId === 'CUSTOM') {
          if (!editTxCustomSupplier.trim()) {
            setEditTxStatus({ type: 'error', text: 'Sila masukkan nama pembekal baru.' })
            return
          }
          newSupplierStr = `Pembekal: ${editTxCustomSupplier.trim()}`
        } else {
          const matched = suppliersList.find(s => s.id === editTxSupplierId || s.company_name === editTxSupplierId)
          const suppName = matched ? matched.company_name : editTxSupplierId
          newSupplierStr = `Pembekal: ${suppName}`
          newSupplierId = matched?.id
        }
      } else {
        if (!editTxFacilityName.trim()) {
          setEditTxStatus({ type: 'error', text: 'Sila masukkan nama fasiliti pembekal / sumber stok.' })
          return
        }
        newSupplierStr = `Fasiliti: ${editTxFacilityName.trim()}`
      }
    }

    const changes: string[] = []

    if (newQty !== oldQty) {
      changes.push(`Kuantiti: ${oldQty} ➔ ${newQty}`)
    }
    if (editTxDate !== oldDateStr) {
      changes.push(`Tarikh: ${oldDateStr} ➔ ${editTxDate}`)
    }
    if (editTxRefNum.trim() !== oldRefNum) {
      changes.push(`No Rujukan: ${oldRefNum} ➔ ${editTxRefNum.trim()}`)
    }
    if (newSupplierStr && newSupplierStr !== oldSupplierStr) {
      const cleanOld = oldSupplierStr ? oldSupplierStr.replace(/^(Pembekal|Fasiliti):\s*/i, '') : 'Belum Ditetapkan'
      const cleanNew = newSupplierStr.replace(/^(Pembekal|Fasiliti):\s*/i, '')
      changes.push(`Pembekal/Sumber Stok: ${cleanOld} ➔ ${cleanNew}`)
    }

    if (changes.length === 0) {
      setEditTxStatus({ type: 'error', text: 'Tiada perubahan maklumat dikesan.' })
      return
    }

    setIsSubmittingEditTx(true)
    setEditTxStatus(null)

    try {
      if (editingTxRow.id) {
        await updateStockTransaction(editingTxRow.id, {
          quantity: newQty,
          transaction_date: `${editTxDate}T12:00:00.000Z`,
          transaction_number: editTxRefNum.trim(),
          reason: `[PINDAAN AUDIT]: ${editTxReason.trim()}`,
          received_from: newSupplierStr || undefined,
          supplier_id: newSupplierId,
          batch_id: editingTxRow.batch_id || editingTxRow.batch?.id
        } as any)
      }

      const newAuditEntry = {
        timestamp: new Date().toISOString(),
        edited_by: user?.full_name || (user as any)?.name || recorderName || 'AMRI AMIT',
        field_changes: changes,
        reason: editTxReason.trim()
      }

      const txIdKey = editingTxRow.id || `row-${editingTxRow.index}`
      setAuditLogStore(prev => ({
        ...prev,
        [txIdKey]: [...(prev[txIdKey] || []), newAuditEntry]
      }))

      playBeep('success')
      setEditTxStatus({ type: 'success', text: 'Berjaya menyimpan pindaan rekod & pembekal!' })

      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

      setTimeout(() => {
        setIsEditTxModalOpen(false)
        setEditingTxRow(null)
        setEditTxStatus(null)
      }, 1300)
    } catch (err: any) {
      playBeep('error')
      setEditTxStatus({ type: 'error', text: err.message || 'Gagal menyimpan pindaan rekod.' })
    } finally {
      setIsSubmittingEditTx(false)
    }
  }

  // Play audio beep feedback
  const playBeep = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (type === 'success') {
        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, startTime)
          gain.gain.setValueAtTime(0, startTime)
          gain.gain.linearRampToValueAtTime(0.55, startTime + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
          osc.start(startTime)
          osc.stop(startTime + duration)
        }
        playTone(880, audioCtx.currentTime, 0.12)
        playTone(1320, audioCtx.currentTime + 0.13, 0.18)
        setTimeout(() => audioCtx.close(), 400)
      } else {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(300, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25)
        osc.start(audioCtx.currentTime)
        osc.stop(audioCtx.currentTime + 0.25)
        setTimeout(() => audioCtx.close(), 350)
      }
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  // Camera start/stop logic
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraActive(false)
      setScanStatus({ type: 'error', text: 'Peranti/Pelayar ini tidak menyokong akses kamera. Sila guna carian manual kod QR.' })
      return
    }

    const constraintsToTry: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: 'environment' } } },
      { video: { facingMode: 'environment' } },
      { video: { facingMode: 'user' } },
      { video: true }
    ]

    let s: MediaStream | null = null
    let lastError: any = null

    for (const constraints of constraintsToTry) {
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints)
        if (s) break
      } catch (err) {
        lastError = err
      }
    }

    if (s) {
      setStream(s)
      setCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } else {
      console.warn('Camera failed to start with all constraints:', lastError)
      setCameraActive(false)
      const errorMsg = lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError'
        ? 'Akses kamera ditolak. Sila benarkan kebenaran (Permission) kamera pada peranti / pelayar anda.'
        : 'Kamera tidak dapat dibuka. Sila pastikan kamera peranti tersedia atau gunakan carian manual.'
      setScanStatus({ type: 'error', text: errorMsg })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  useEffect(() => {
    if (isQrModalOpen && scanTab === 'camera') {
      void startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isQrModalOpen, scanTab])

  // Camera decoder loop with jsQR
  useEffect(() => {
    let animId: number
    let running = false

    if (isQrModalOpen && cameraActive && stream && videoRef.current) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      const scanFrame = () => {
        if (!running) return
        animId = requestAnimationFrame(() => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && ctx) {
            const video = videoRef.current
            const scale = Math.min(1, 640 / video.videoWidth)
            canvas.width = Math.floor(video.videoWidth * scale)
            canvas.height = Math.floor(video.videoHeight * scale)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const detected = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' })

            if (detected && detected.data) {
              const now = Date.now()
              const last = lastScannedRef.current
              if (!last || last.code !== detected.data || now - last.ts > 2500) {
                lastScannedRef.current = { code: detected.data, ts: now }
                handleQrPayload(detected.data)
              }
            }
          }
          setTimeout(scanFrame, 150)
        })
      }

      running = true
      scanFrame()
    }

    return () => {
      running = false
      if (animId) cancelAnimationFrame(animId)
    }
  }, [isQrModalOpen, cameraActive, stream])

  // QR Payload decoder
  const handleQrPayload = async (payload: string) => {
    let targetCode = payload
    let targetId: string | null = null
    let targetType: 'drug' | 'non_drug' | null = null

    const trimmed = payload.trim()

    // 1. Try parsing JSON format payload (e.g. { "code": "D02.0011.01", "name": "...", ... })
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed.code || parsed.item_code || parsed.drug_code) {
          targetCode = parsed.code || parsed.item_code || parsed.drug_code
        }
        if (parsed.facility_inventory_id || parsed.id || parsed.item_id || parsed.drug_id) {
          targetId = parsed.facility_inventory_id || parsed.id || parsed.item_id || parsed.drug_id
        }
        if (parsed.type || parsed.item_type) {
          const t = String(parsed.type || parsed.item_type).toLowerCase()
          targetType = (t === 'drug' || t === 'ubat') ? 'drug' : 'non_drug'
        }
      } catch (err) {
        console.warn('Could not parse JSON QR payload:', err)
      }
    }
    // 2. Try parsing MYINV prefix format (e.g. MYINV:DRUG:id:code or MYINV:NON_DRUG:code)
    else if (trimmed.startsWith('MYINV:')) {
      const parts = trimmed.split(':')
      if (parts.length >= 4) {
        targetType = parts[1].toLowerCase() === 'drug' ? 'drug' : 'non_drug'
        targetId = parts[2]
        targetCode = parts[3]
      } else if (parts.length === 3) {
        targetType = parts[1].toLowerCase() === 'drug' ? 'drug' : 'non_drug'
        targetCode = parts[2]
      } else if (parts.length === 2) {
        targetCode = parts[1]
      }
    }
    // 3. Try pipe-separated format (e.g. "C10AA05-000-T10-01-XXX|Item Name|Batch")
    else if (trimmed.includes('|')) {
      const parts = trimmed.split('|')
      targetCode = parts[0].trim()
    }

    const normCode = normalizeItemCode(targetCode)

    // Stage 1: Match in existing catalog list with unicode dash normalization & stripped matching
    let matched = matchStockItem(catalogItems, targetCode, targetId, targetType)

    // Stage 2: If not found in current state, attempt dynamic catalog re-fetch
    if (!matched && hospitalId) {
      try {
        const catRes = await getStockLevelSummary(hospitalId)
        if (catRes.data && catRes.data.length > 0) {
          setCatalogItems(catRes.data)
          matched = matchStockItem(catRes.data, targetCode, targetId, targetType)
        }
      } catch (e) {
        console.warn('Catalog refresh on scan failed:', e)
      }
    }

    if (matched) {
      playBeep('success')
      setSelectedItemId(matched.item_id)
      setSelectedItem(matched)
      setScanStatus({ type: 'success', text: `Item Berjaya Dikesan: ${matched.item_code} - ${matched.item_name}` })
      
      // Auto-close modal after brief delay so user sees the main KEW.PS-4 stock ledger details directly
      setTimeout(() => {
        setIsQrModalOpen(false)
      }, 500)
    } else {
      playBeep('error')
      const displayCode = normCode || targetCode
      setScanStatus({
        type: 'error',
        text: `Item tidak dijumpai untuk kod: ${displayCode}`,
        unregisteredCode: displayCode
      } as any)
    }
  }

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCodeInput.trim()) return
    handleQrPayload(manualCodeInput.trim())
  }

  // Quick transaction submission from Modal
  const handleQuickTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !selectedItem) return

    const qty = parseInt(quickQty, 10)
    if (isNaN(qty) || qty <= 0) {
      setScanStatus({ type: 'error', text: 'Sila masukkan kuantiti yang sah!' })
      return
    }

    setIsSubmittingQuickTx(true)
    setScanStatus(null)

    try {
      if (quickTxType === 'receipt') {
        const res = await createStockReceipt(hospitalId, {
          item_type: selectedItem.item_type,
          item_id: selectedItem.item_id,
          batch_number: quickBatchNum.trim() || `BT-${Date.now().toString().slice(-6)}`,
          quantity_received: qty,
          location_id: quickDeptId || undefined,
          performed_by: user?.id || 'Staf'
        })
        if (res.error) throw new Error(res.error)
      } else {
        const res = await issueStock(hospitalId, {
          item_type: selectedItem.item_type,
          item_id: selectedItem.item_id,
          quantity: qty,
          target_location_id: quickDeptId || undefined,
          reason: 'Pengeluaran Imbasan QR KEW.PS-4',
          performed_by: user?.id || 'Staf'
        })
        if (res.error) throw new Error(res.error)
      }

      playBeep('success')
      setScanStatus({ 
        type: 'success', 
        text: `Berjaya merekodkan ${quickTxType === 'receipt' ? 'Penerimaan' : 'Pengeluaran'} ${qty} ${selectedItem.unit_of_measure}!` 
      })
      setQuickQty('')
      setQuickBatchNum('')

      // Refresh metadata & movement rows
      const catRes = await getStockLevelSummary(hospitalId)
      if (catRes.data) setCatalogItems(catRes.data)
      await reloadMovementData()

    } catch (err: any) {
      playBeep('error')
      setScanStatus({ type: 'error', text: err.message || 'Gagal menyimpan transaksi.' })
    } finally {
      setIsSubmittingQuickTx(false)
    }
  }

  // Presets Quick Date Filter
  const applyDatePreset = (preset: 'today' | 'week' | 'month' | '3months' | 'all') => {
    setActiveDatePreset(preset)
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
      return
    }

    if (preset === 'today') {
      setDateFrom(formatDate(today))
      setDateTo(formatDate(today))
      return
    }

    if (preset === 'week') {
      const past = new Date(today)
      past.setDate(past.getDate() - 7)
      setDateFrom(formatDate(past))
      setDateTo(formatDate(today))
      return
    }

    if (preset === 'month') {
      const past = new Date(today)
      past.setMonth(past.getMonth() - 1)
      setDateFrom(formatDate(past))
      setDateTo(formatDate(today))
      return
    }

    if (preset === '3months') {
      const past = new Date(today)
      past.setMonth(past.getMonth() - 3)
      setDateFrom(formatDate(past))
      setDateTo(formatDate(today))
      return
    }
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!selectedItem || ledgerRows.length === 0) return

    const headers = [
      'Bil',
      'Tarikh & Masa',
      'No Rujukan Dokumen',
      'Jenis Transaksi',
      'No Batch',
      'Masuk (+)',
      'Keluar (-)',
      'Baki Semasa',
      'Penerima / Jabatan',
      'Perekod',
      'Catatan'
    ]

    const rows = ledgerRows.map(r => [
      r.index,
      `"${new Date(r.transaction_date || r.created_at).toLocaleString('ms-MY')}"`,
      `"${formatReferenceNumber(r)}"`,
      `"${r.transaction_type || ''}"`,
      `"${r.batch?.batch_number || '—'}"`,
      r.receiptQty !== null ? r.receiptQty : '',
      r.issueQty !== null ? r.issueQty : '',
      r.runningBalance,
      `"${resolveRecipientName(r)}"`,
      `"${resolveRecorderName(r.performed_by_user?.name || r.performed_by, r.performed_by_user)}"`,
      `"${r.reason || ''}"`
    ])

    const csvContent = [
      `KEW.PS-4 LAPORAN PERGERAKAN STOK - ${selectedItem.item_code} ${selectedItem.item_name}`,
      `Tempoh: ${dateFrom || 'Awal'} hingga ${dateTo || 'Kini'}`,
      `Baki Semasa: ${currentStockBalance} ${selectedItem.unit_of_measure}`,
      `Jumlah Diterima: ${totalReceived}`,
      `Jumlah Dikeluarkan: ${totalIssued}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `PergerakanStok_${selectedItem.item_code}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Enhanced Printable KEW.PS-4 Document Generator
  const handlePrintLedger = () => {
    if (!selectedItem || ledgerRows.length === 0) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const itemCode = selectedItem.item_code
    const itemName = selectedItem.item_name
    const uom = selectedItem.unit_of_measure

    const itemLocationDisplay = selectedItem.location 
      ? formatLocationDisplay(selectedItem.location) 
      : (itemLocations.length > 0 ? itemLocations.map(l => formatLocationDisplay(l)).join(', ') : 'Stor Utama Farmasi')

    const bufferStockVal = (selectedItem as any).buffer_stock ?? selectedItem.reorder_level ?? Math.round((selectedItem.min_stock || 0) * 0.5)

    const annualStockHtml = annualStockLevels.map(l => `
      <tr>
        <td style="padding: 5px 8px; border: 1px solid #334155; text-align: center; font-weight: bold; background-color: #f8fafc;">${l.year}</td>
        <td style="padding: 5px 8px; border: 1px solid #334155; text-align: center; font-family: monospace; font-weight: bold;">${l.min} ${uom}</td>
        <td style="padding: 5px 8px; border: 1px solid #334155; text-align: center; font-family: monospace; font-weight: bold;">${l.buffer} ${uom}</td>
        <td style="padding: 5px 8px; border: 1px solid #334155; text-align: center; font-family: monospace; font-weight: bold;">${l.max} ${uom}</td>
      </tr>
    `).join('')

    const quarterlySummaryHtml = quarterlySummary.map(yData => `
      <tr>
        <td rowspan="5" style="padding: 5px 8px; border: 1px solid #334155; text-align: center; font-weight: 800; vertical-align: middle; background-color: #f8fafc;">${yData.year}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; font-size: 10.5px;">Suku Pertama (Q1: Jan - Mac)</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #15803d;">${yData.q1.receiptQty > 0 ? `+${yData.q1.receiptQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q1.receiptVal > 0 ? `RM ${yData.q1.receiptVal.toFixed(2)}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">${yData.q1.issueQty > 0 ? `-${yData.q1.issueQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q1.issueVal > 0 ? `RM ${yData.q1.issueVal.toFixed(2)}` : '—'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; border: 1px solid #334155; font-size: 10.5px;">Suku Kedua (Q2: Apr - Jun)</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #15803d;">${yData.q2.receiptQty > 0 ? `+${yData.q2.receiptQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q2.receiptVal > 0 ? `RM ${yData.q2.receiptVal.toFixed(2)}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">${yData.q2.issueQty > 0 ? `-${yData.q2.issueQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q2.issueVal > 0 ? `RM ${yData.q2.issueVal.toFixed(2)}` : '—'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; border: 1px solid #334155; font-size: 10.5px;">Suku Ketiga (Q3: Jul - Sep)</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #15803d;">${yData.q3.receiptQty > 0 ? `+${yData.q3.receiptQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q3.receiptVal > 0 ? `RM ${yData.q3.receiptVal.toFixed(2)}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">${yData.q3.issueQty > 0 ? `-${yData.q3.issueQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q3.issueVal > 0 ? `RM ${yData.q3.issueVal.toFixed(2)}` : '—'}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; border: 1px solid #334155; font-size: 10.5px;">Suku Keempat (Q4: Okt - Dis)</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #15803d;">${yData.q4.receiptQty > 0 ? `+${yData.q4.receiptQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q4.receiptVal > 0 ? `RM ${yData.q4.receiptVal.toFixed(2)}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">${yData.q4.issueQty > 0 ? `-${yData.q4.issueQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">${yData.q4.issueVal > 0 ? `RM ${yData.q4.issueVal.toFixed(2)}` : '—'}</td>
      </tr>
      <tr style="background-color: #f1f5f9; font-weight: bold;">
        <td style="padding: 4px 8px; border: 1px solid #334155; font-size: 10.5px;">Jumlah Keseluruhan Tahun ${yData.year}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; color: #15803d;">${yData.total.receiptQty > 0 ? `+${yData.total.receiptQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">RM ${yData.total.receiptVal.toFixed(2)}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace; color: #b91c1c;">${yData.total.issueQty > 0 ? `-${yData.total.issueQty} ${uom}` : '—'}</td>
        <td style="padding: 4px 8px; border: 1px solid #334155; text-align: right; font-family: monospace;">RM ${yData.total.issueVal.toFixed(2)}</td>
      </tr>
    `).join('')

    const logSummaryHtml = movementLogSummary.map(m => `
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #334155; font-size: 11px; font-weight: 600;">${m.name}</td>
        <td style="padding: 6px 10px; border: 1px solid #334155; text-align: right; font-weight: bold; font-size: 11px; color: #15803d;">
          ${m.totalReceived > 0 ? `+${m.totalReceived} ${uom}` : '—'}
        </td>
        <td style="padding: 6px 10px; border: 1px solid #334155; text-align: right; font-weight: bold; font-size: 11px; color: #b91c1c;">
          ${m.totalIssued > 0 ? `-${m.totalIssued} ${uom}` : '—'}
        </td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KEW.PS-4 Kad Petak - ${itemCode} - Hospital Lawas</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 12mm 12mm 12mm;
            }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              font-size: 11px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .gov-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .gov-brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .jata-logo {
              height: 65px;
              width: auto;
              object-fit: contain;
            }
            .gov-titles {
              display: flex;
              flex-direction: column;
            }
            .kkm-title {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .hosp-title {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              text-transform: uppercase;
              margin-top: 1px;
            }
            .sub-title {
              font-size: 8.5px;
              color: #475569;
              margin-top: 2px;
              font-style: italic;
            }
            .doc-badge {
              text-align: right;
            }
            .kewps-box {
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              background-color: #f1f5f9;
              padding: 6px 14px;
              border: 1.5px solid #0f172a;
              border-radius: 4px;
              display: inline-block;
              letter-spacing: 0.5px;
            }
            .kewps-sub {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 3px;
              text-transform: uppercase;
            }
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
            }
            .meta-table td {
              border: 1px solid #334155;
              padding: 5px 8px;
              font-size: 10.5px;
            }
            .meta-label {
              font-weight: 700;
              background-color: #f8fafc;
              color: #334155;
            }
            .meta-val {
              font-weight: 600;
              color: #0f172a;
            }
            .kpi-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
            }
            .kpi-table td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: center;
              background-color: #f8fafc;
            }
            .kpi-title {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-num {
              font-size: 14px;
              font-weight: 800;
              margin-top: 3px;
              font-family: monospace;
            }
            .section-header {
              font-weight: 800;
              font-size: 11px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
              margin-top: 0 !important;
              padding-top: 8px;
            }

            .ledger-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .ledger-table th {
              background-color: #e2e8f0;
              border: 1px solid #334155;
              padding: 6px 6px;
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              text-align: center;
              color: #0f172a;
            }
            .ledger-table td {
              border: 1px solid #334155;
              padding: 5px 6px;
              font-size: 9.5px;
              text-align: left;
            }
            .dept-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
            }
            .dept-table th {
              background-color: #f1f5f9;
              border: 1px solid #334155;
              padding: 5px 8px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .mono { font-family: monospace; font-weight: 700; }
            .sig-container {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .sig-box {
              width: 46%;
              border: 1px solid #334155;
              padding: 10px;
              border-radius: 4px;
              background-color: #fafafa;
              font-size: 10px;
            }
            .sig-line {
              margin-top: 35px;
              border-top: 1px dashed #334155;
              padding-top: 4px;
            }
            .footer-note {
              margin-top: 20px;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              font-size: 8px;
              color: #64748b;
              text-align: center;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <!-- Government Letterhead Header with Jata Negara -->
          <div class="gov-header">
            <div class="gov-brand">
              <img src="${JATA_NEGARA_BASE64}" class="jata-logo" alt="Jata Negara Malaysia" />
              <div class="gov-titles">
                <span class="kkm-title">KEMENTERIAN KESIHATAN MALAYSIA</span>
                <span class="hosp-title">HOSPITAL LAWAS, SARAWAK</span>
                <span class="sub-title">Tatacara Pengurusan Stor Perbendaharaan (Pekeliling Perbendaharaan PK 2.1)</span>
              </div>
            </div>
            <div class="doc-badge">
              <div class="kewps-box">KEW.PS-4</div>
              <div class="kewps-sub">KAD PETAK</div>
            </div>
          </div>

          <!-- Item Metadata Table (Cleaned without Paras Stok) -->
          <table class="meta-table">
            <tr>
              <td width="15%" class="meta-label">Perihal Stok:</td>
              <td width="45%" class="meta-val" style="font-size: 11px; font-weight: 800;">${itemName}</td>
              <td width="15%" class="meta-label">No. Kod Stok:</td>
              <td width="25%" class="meta-val mono" style="font-size: 11px; color: #1e3a8a;">${itemCode}</td>
            </tr>
            <tr>
              <td class="meta-label">Unit Pengukuran:</td>
              <td class="meta-val">${uom}</td>
              <td class="meta-label">Lokasi Item:</td>
              <td class="meta-val" style="font-weight: 700; color: #0369a1;">${itemLocationDisplay}</td>
            </tr>
            <tr>
              <td class="meta-label">Tempoh Laporan:</td>
              <td class="meta-val">${dateFrom || 'Awal'} hingga ${dateTo || 'Kini'}</td>
              <td class="meta-label">Harga Seunit (RM):</td>
              <td class="meta-val mono">RM ${unitPrice.toFixed(2)} / ${uom}</td>
            </tr>
          </table>

          <!-- Paras Stok Tahunan (Separated in Same Row per Year) -->
          <div class="section-header">PARAS STOK TAHUNAN:</div>
          <table class="dept-table" style="margin-bottom: 14px;">
            <thead>
              <tr>
                <th width="25%" style="text-align: center;">TAHUN</th>
                <th width="25%" style="text-align: center;">STOK MIN</th>
                <th width="25%" style="text-align: center;">STOK BUFFER (TAMBAHAN)</th>
                <th width="25%" style="text-align: center;">STOK MAX</th>
              </tr>
            </thead>
            <tbody>
              ${annualStockHtml}
            </tbody>
          </table>

          <!-- Rekod Terimaan Dan Pengeluaran Suku Tahun -->
          <div class="section-header">REKOD TERIMAAN DAN PENGELUARAN SUKU TAHUN:</div>
          <table class="dept-table" style="margin-bottom: 14px;">
            <thead>
              <tr>
                <th rowspan="2" width="12%" style="text-align: center; vertical-align: middle;">TAHUN</th>
                <th rowspan="2" width="28%" style="vertical-align: middle;">SUKU TAHUN</th>
                <th colspan="2" width="30%" style="text-align: center; background-color: #dcfce7; border-bottom: 1px solid #16a34a;">DITERIMA</th>
                <th colspan="2" width="30%" style="text-align: center; background-color: #ffe4e6; border-bottom: 1px solid #e11d48;">DIKELUARKAN</th>
              </tr>
              <tr>
                <th style="text-align: right; background-color: #f0fdf4;">Kuantiti</th>
                <th style="text-align: right; background-color: #f0fdf4;">Nilai (RM)</th>
                <th style="text-align: right; background-color: #fff1f2;">Kuantiti</th>
                <th style="text-align: right; background-color: #fff1f2;">Nilai (RM)</th>
              </tr>
            </thead>
            <tbody>
              ${quarterlySummaryHtml}
            </tbody>
          </table>

          <!-- Movement Summary Strip -->
          <table class="kpi-table">
            <tr>
              <td width="25%">
                <div class="kpi-title" style="color: #475569;">BAKI SEMASA</div>
                <div class="kpi-num" style="color: #0f172a;">${currentStockBalance} ${uom}</div>
              </td>
              <td width="25%">
                <div class="kpi-title" style="color: #166534;">JUMLAH DITERIMA</div>
                <div class="kpi-num" style="color: #15803d;">+${totalReceived} ${uom}</div>
              </td>
              <td width="25%">
                <div class="kpi-title" style="color: #991b1b;">JUMLAH DIKELUARKAN</div>
                <div class="kpi-num" style="color: #b91c1c;">-${totalIssued} ${uom}</div>
              </td>
              <td width="25%">
                <div class="kpi-title" style="color: #3730a3;">% PENGELUARAN</div>
                <div class="kpi-num" style="color: #4338ca;">${issuePercentage}%</div>
              </td>
            </tr>
          </table>

          <!-- Log Penerimaan Dan Pengeluaran (Rekod Mengikut Jabatan / Pembekal) -->
          ${movementLogSummary.length > 0 ? `
            <div class="section-header">LOG PENERIMAAN DAN PENGELUARAN (REKOD MENGIKUT JABATAN / PEMBEKAL):</div>
            <table class="dept-table">
              <thead>
                <tr>
                  <th>Nama Jabatan / Pembekal / Wad</th>
                  <th style="text-align: right;">Jumlah Diterima (+)</th>
                  <th style="text-align: right;">Jumlah Dikeluarkan (-)</th>
                </tr>
              </thead>
              <tbody>
                ${logSummaryHtml}
              </tbody>
            </table>
          ` : ''}

          <!-- Full Ledger Transactions Table -->
          <div class="section-header page-break">
            <span>Rekod Transaksi Pergerakan (Buku Daftar KEW.PS-4):</span>
            <span style="font-size: 9px; font-weight: normal; color: #475569;">Jumlah Rekod: ${ledgerRows.length}</span>
          </div>

          <table class="ledger-table">
            <thead>
              <tr>
                <th width="4%">Bil</th>
                <th width="14%">Tarikh & Masa</th>
                <th width="17%">No Rujukan Dokumen</th>
                <th width="9%">Terima (+)</th>
                <th width="9%">Keluar (-)</th>
                <th width="9%">Baki</th>
                <th width="18%">Penerima / Jabatan</th>
                <th width="12%">Perekod</th>
                <th width="8%">Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerRows.map(row => {
                const isCheckFound = row.transaction_type === 'check_found'
                const rowBg = isCheckFound ? 'background-color: #eef2ff;' : ''
                return `
                <tr style="${rowBg}">
                  <td class="center mono">${row.index}</td>
                  <td class="center font-mono">${new Date(row.transaction_date || row.created_at).toLocaleString('ms-MY', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}</td>
                  <td class="mono" style="color: #0369a1;">${formatReferenceNumber(row)}</td>
                  <td class="right mono" style="color: #15803d;">
                    ${row.receiptQty !== null ? `+${row.receiptQty}` : '—'}
                    ${row.receiptQty !== null && row.batch?.batch_number ? `<br/><span style="font-size: 8px; color: #0d9488; font-weight: bold;">B: ${row.batch.batch_number}</span>` : ''}
                    ${row.receiptQty !== null && row.batch?.expiry_date ? `<br/><span style="font-size: 8px; color: #b45309; font-weight: bold;">L: ${new Date(row.batch.expiry_date).toLocaleDateString('ms-MY')}</span>` : ''}
                  </td>
                  <td class="right mono" style="color: #b91c1c;">
                    ${row.issueQty !== null ? `-${row.issueQty}` : '—'}
                    ${row.issueQty !== null && row.batch?.batch_number ? `<br/><span style="font-size: 8px; color: #0d9488; font-weight: bold;">B: ${row.batch.batch_number}</span>` : ''}
                    ${row.issueQty !== null && row.batch?.expiry_date ? `<br/><span style="font-size: 8px; color: #b45309; font-weight: bold;">L: ${new Date(row.batch.expiry_date).toLocaleDateString('ms-MY')}</span>` : ''}
                  </td>
                  <td class="right mono" style="background-color: ${isCheckFound ? '#e0e7ff' : '#f8fafc'}; font-weight: 800;">${row.runningBalance}</td>
                  <td style="font-weight: 600;">${resolveRecipientName(row)}</td>
                  <td>${resolveRecorderName(row.performed_by_user?.name || row.performed_by, row.performed_by_user)}</td>
                  <td style="font-size: 8.5px; color: #475569;">${sanitizeSupplierName(row.reason || '—')}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>

          <!-- Official Sign-off Section -->
          <div class="sig-container">
            <div class="sig-box">
              <strong style="color: #0f172a; text-transform: uppercase;">Disediakan Oleh (Pegawai Stor / Farmasi):</strong>
              <div class="sig-line">
                Nama: <strong>${recorderName}</strong><br/>
                Jawatan: <strong>${userDepartmentName}</strong><br/>
                Tarikh: <strong>${new Date().toLocaleDateString('ms-MY')}</strong>
              </div>
            </div>
            <div class="sig-box">
              <strong style="color: #0f172a; text-transform: uppercase;">Disahkan Oleh (Ketua Jabatan / Pegawai Farmasi):</strong>
              <div class="sig-line">
                Nama: _______________________________<br/>
                Jawatan: ____________________________<br/>
                Tarikh: _____________________________
              </div>
            </div>
          </div>

          <div class="footer-note">
            Dokumen Rasmi KEW.PS-4 • Hospital Lawas, Sarawak • Dijana Secara Automatik Menerusi H.O.M.E. System pada ${new Date().toLocaleString('ms-MY')}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Filter catalog by search query & filter down to selected item when clicked
  const allMatchingCount = useMemo(() => {
    if (!searchQuery.trim()) return 0
    const q = searchQuery.toLowerCase().trim()
    return catalogItems.filter(i => 
      i.item_code.toLowerCase().includes(q) ||
      i.item_name.toLowerCase().includes(q)
    ).length
  }, [catalogItems, searchQuery])

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    const matches = catalogItems.filter(i => 
      i.item_code.toLowerCase().includes(q) ||
      i.item_name.toLowerCase().includes(q)
    )
    if (selectedItemId) {
      const selectedMatch = matches.filter(i => i.item_id === selectedItemId)
      if (selectedMatch.length > 0) return selectedMatch
    }
    return matches
  }, [catalogItems, searchQuery, selectedItemId])

  // Calculate percentage of current stock against max level for safety band indicator
  const stockPercentage = useMemo(() => {
    if (!selectedItem) return 0
    const max = selectedItem.max_stock || (selectedItem.min_stock ? selectedItem.min_stock * 3 : 100)
    const pct = Math.min(Math.round((selectedItem.current_stock / max) * 100), 100)
    return pct
  }, [selectedItem])

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 text-slate-800 pb-28 lg:pb-8">
      
      {/* LUXURY EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] uppercase tracking-wider font-bold">
                  KEW.PS-4 DIGITAL PORTAL
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Fasiliti Kesihatan KKM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Pusat Pengurusan Pergerakan Stok & Transaksi KEW.PS-4</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                Pusat Kawalan Pergerakan Ubat & Stok — Imbasan QR, Penerimaan, Pengeluaran Mengikut Jabatan & Eksport Laporan KEW.PS-4 mengikut Pekeliling Tatacara Pengurusan Stor Kerajaan.
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
                Cetak
              </Button>
            </div>
          </div>

          {/* QUICK METRICS GLASS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Jumlah Item Fasiliti</span>
              <span className="text-xl font-black font-mono text-teal-300">{catalogItems.length}</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Stok Minima Alert</span>
              <span className="text-xl font-black font-mono text-amber-300">
                {catalogItems.filter(i => i.current_stock <= (i.min_stock || 0)).length}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Kategori Ubat</span>
              <span className="text-xl font-black font-mono text-emerald-300">
                {catalogItems.filter(i => i.item_type === 'drug').length}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Bukan Ubat</span>
              <span className="text-xl font-black font-mono text-purple-300">
                {catalogItems.filter(i => i.item_type === 'non_drug').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ITEM SELECTOR SIDEBAR (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* MOBILE COMPACT SEARCH PILL HEADER (Only on mobile when item selected and search not expanded) */}
          {selectedItem && !isMobileSearchExpanded && (
            <div className="lg:hidden bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Dipilih</span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded">{selectedItem.item_code}</span>
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

          {/* SEARCH BOX & CATALOG LIST (Always on Desktop, Collapsible on Mobile) */}
          {(!selectedItem || isMobileSearchExpanded) && (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Pilih Item Inventori</span>
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {catalogItems.length} Item
                  </Badge>
                  {selectedItem && (
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchExpanded(false)}
                      className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
                      title="Tutup carian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Cari kod atau nama item..."
                  className={`pl-9 ${searchQuery ? 'pr-8' : ''} rounded-xl text-xs py-1.5`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Kosongkan carian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Catalog Item Buttons / Search Results */}
              {isLoadingCatalog ? (
                <div className="flex items-center justify-center p-8">
                  <Spinner size="sm" />
                </div>
              ) : !searchQuery.trim() ? (
                <div className="text-center p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Search className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Carian Item Inventori</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Sila taip kod atau nama item pada ruangan carian di atas untuk memaparkan senarai item.
                  </p>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="text-center p-6 text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Tiada item ditemui untuk &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-bold">
                    <span>{selectedItemId ? 'Item Dipilih' : 'Hasil Carian'} ({filteredCatalog.length})</span>
                    {selectedItemId && allMatchingCount > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedItemId('')}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline"
                      >
                        Tunjuk Semua Hasil ({allMatchingCount})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {filteredCatalog.map(item => {
                      const isSelected = selectedItemId === item.item_id
                      const displayedStock = (isSelected && ledgerRows.length > 0)
                        ? ledgerRows[0].runningBalance
                        : item.current_stock

                      return (
                        <button
                          key={`${item.item_type}-${item.item_id}`}
                          onClick={() => {
                            setSelectedItemId(item.item_id)
                            setIsMobileSearchExpanded(false)
                          }}
                          className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-teal-50/70 border-teal-400 text-teal-950 shadow-md ring-1 ring-teal-400'
                              : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-400 text-[10px]">{item.item_code}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                item.item_type === 'drug' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {item.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat'}
                              </span>
                            </div>
                            <span className="font-black truncate block mt-1">{item.item_name}</span>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={displayedStock <= (item.min_stock || 0) ? 'danger' : 'success'} 
                              className="font-mono font-black"
                            >
                              {displayedStock}
                            </Badge>
                            <span className="text-[9px] text-slate-400 block mt-0.5 uppercase">{item.unit_of_measure}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DESKTOP-ONLY ACTIVE ITEM METADATA & SAFETY STOCK BAND */}
          {selectedItem && (
            <div className="hidden lg:block bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-teal-400 uppercase tracking-wider">Kedudukan Paras Stok</span>
                  <button
                    type="button"
                    onClick={openEditStockModal}
                    className="text-slate-300 hover:text-teal-300 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    title="Kemaskini Lokasi, Min, Buffer & Max"
                  >
                    <Pencil className="w-3 h-3 text-teal-400" />
                    <span>Edit</span>
                  </button>
                </div>
                <Badge variant="outline" className="text-slate-300 border-slate-700 font-mono text-[10px]">
                  {selectedItem.unit_of_measure}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Baki Semasa:</span>
                  <span className="font-mono text-teal-300 font-black text-sm">
                    {ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock} {selectedItem.unit_of_measure}
                  </span>
                </div>
                
                {/* Visual Progress Bar Band */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 flex">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      (ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= (selectedItem.min_stock || 0) 
                        ? 'bg-rose-500' 
                        : (ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= ((selectedItem as any)?.buffer_stock ?? selectedItem.reorder_level ?? (selectedItem.min_stock ? selectedItem.min_stock * 1.5 : 0))
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Min: {selectedItem.min_stock || 0}</span>
                  <span>Buffer: {(selectedItem as any)?.buffer_stock ?? selectedItem.reorder_level ?? (selectedItem.min_stock ? Math.round(selectedItem.min_stock * 0.5) : '—')}</span>
                  <span>Max: {selectedItem.max_stock || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ITEM MOVEMENT INTELLIGENCE CENTER (9 cols) */}
        <div className="lg:col-span-9 space-y-6">

          {!selectedItem ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-soft space-y-3">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Search className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-800 tracking-tight">Sila Pilih Item Inventori</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Sila taip kod atau nama ubat pada ruangan carian di sebelah kiri untuk memaparkan Buku Daftar Transaksi (Digital KEW.PS-4).
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* UNIFIED MOBILE HERO CARD (De-duplicated & Compact for Phone screens) */}
              <div className="lg:hidden bg-white border border-slate-200/90 rounded-3xl p-5 shadow-md space-y-4">
                {/* Badges row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {selectedItem.item_code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
                      UOM: {selectedItem.unit_of_measure}
                    </span>
                    {selectedItem.item_type && (
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                        selectedItem.item_type === 'drug' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {selectedItem.item_type === 'drug' ? 'UBAT' : 'BUKAN UBAT'}
                      </span>
                    )}
                  </div>
                  <Badge 
                    variant={(ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= (selectedItem.min_stock || 0) ? 'danger' : 'success'}
                    className="text-[10px] px-2.5 py-0.5 font-extrabold"
                  >
                    {(ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= (selectedItem.min_stock || 0) ? '⚠ MINIMA' : '● MENCUKUPI'}
                  </Badge>
                </div>

                {/* Title & Location */}
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                    {selectedItem.item_name}
                  </h2>
                  
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-[11px] font-semibold max-w-full truncate">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-mono font-bold truncate">
                        {selectedItem.location ? formatLocationDisplay(selectedItem.location) : (itemLocations.length > 0 ? itemLocations.map(loc => formatLocationDisplay(loc)).join(', ') : 'Belum ditetapkan')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openEditStockModal}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Lokasi</span>
                    </button>
                  </div>
                </div>

                {/* Integrated Stock Progress Band (Mobile) */}
                <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Kedudukan Paras Stok</span>
                    <span className="font-mono text-teal-300 font-black text-sm">
                      {ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock} <span className="text-[10px] text-slate-400 uppercase font-medium">{selectedItem.unit_of_measure}</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        (ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= (selectedItem.min_stock || 0) 
                          ? 'bg-rose-500' 
                          : (ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= ((selectedItem as any)?.buffer_stock ?? selectedItem.reorder_level ?? (selectedItem.min_stock ? selectedItem.min_stock * 1.5 : 0))
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.max(stockPercentage, 5)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>Min: {selectedItem.min_stock || 0}</span>
                    <span>Buffer: {(selectedItem as any)?.buffer_stock ?? selectedItem.reorder_level ?? (selectedItem.min_stock ? Math.round(selectedItem.min_stock * 0.5) : '—')}</span>
                    <span>Max: {selectedItem.max_stock || '—'}</span>
                  </div>
                </div>
              </div>

              {/* DESKTOP ZONE A: ACTIVE ITEM HEADER CARD */}
              <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                {/* Header Top Meta Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                      {selectedItem.item_code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                      UOM: <span className="font-bold text-slate-800">{selectedItem.unit_of_measure}</span>
                    </span>
                    {selectedItem.item_type && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                        selectedItem.item_type === 'drug' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {selectedItem.item_type === 'drug' ? 'UBAT' : 'BUKAN UBAT'}
                      </span>
                    )}
                  </div>

                  <Badge 
                    variant={(ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= (selectedItem.min_stock || 0) ? 'danger' : 'success'}
                    className="text-xs px-3 py-1 font-bold shadow-2xs"
                  >
                    {(ledgerRows.length > 0 ? ledgerRows[0].runningBalance : selectedItem.current_stock) <= (selectedItem.min_stock || 0) ? '⚠ STOK MINIMA' : '● STOK MENCUKUPI'}
                  </Badge>
                </div>

                {/* Main Item Title & Storage Location */}
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {selectedItem.item_name}
                  </h2>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">LOKASI:</span>
                      <span className="font-mono font-bold">
                        {selectedItem.location ? formatLocationDisplay(selectedItem.location) : (itemLocations.length > 0 ? itemLocations.map(loc => formatLocationDisplay(loc)).join(', ') : 'Belum ditetapkan')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openEditStockModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-200 text-xs font-bold transition-all cursor-pointer"
                      title="Kemaskini Lokasi, Buffer, Min & Max"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Kemaskini Lokasi & Paras</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons Toolbar with Clear Hierarchy & Flex Wrap */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {/* Primary Stock Actions (Terima & Keluar) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={openReceiveModal}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs gap-1.5 px-4 py-2.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      <span>+ Terima</span>
                    </button>

                    <button
                      type="button"
                      onClick={openIssueModal}
                      className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs gap-1.5 px-4 py-2.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                    >
                      <MinusCircle className="w-4 h-4 text-white" />
                      <span>- Keluar</span>
                    </button>
                  </div>

                  {/* Secondary Utility Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={openCheckFoundModal}
                      className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 border border-slate-300 rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 shadow-2xs transition-all active:scale-[0.98] whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                      title="Check & Found Audit"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-slate-700" />
                      <span className="text-slate-900 font-bold">Check & Found</span>
                    </button>

                    <button
                      type="button"
                      onClick={openBringForwardModal}
                      className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 border border-slate-300 rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 shadow-2xs transition-all active:scale-[0.98] whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                      title="Bawa Ke Hadapan baki dari tahun/bulan lepas"
                    >
                      <FastForward className="w-3.5 h-3.5 text-slate-700" />
                      <span className="text-slate-900 font-bold">Bring Forward</span>
                    </button>

                    <button
                      type="button"
                      onClick={openClearModal}
                      className="bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 rounded-xl font-black text-xs gap-1.5 px-3.5 py-2.5 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap inline-flex items-center justify-center cursor-pointer border border-amber-500"
                      title="Padam rekod transaksi untuk bermula semula (Dilindungi kata laluan kebenaran)"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-950" />
                      <span className="text-slate-950 font-black">Set Semula Ledger</span>
                    </button>

                    {resetAuditLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsResetAuditModalOpen(true)}
                        className="bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-950 border border-purple-300 rounded-xl font-bold text-xs gap-1.5 px-3.5 py-2.5 transition-all whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                        title="Lihat Sejarah Log Audit Set Semula Ledger"
                      >
                        <History className="w-3.5 h-3.5 text-purple-800" />
                        <span className="text-purple-950 font-bold">Log Reset ({resetAuditLogs.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* MOBILE SEGMENTED VIEW SWITCHER TABS */}
              <div className="lg:hidden flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setMobileTab('ledger')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === 'ledger'
                      ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Buku Rekod ({ledgerRows.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('summary')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === 'summary'
                      ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Ringkasan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('departments')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === 'departments'
                      ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Jabatan</span>
                </button>
              </div>

              {/* ZONE B: MOVEMENT SUMMARY STRIP (4 KPI CARDS) */}
              <div className={`${mobileTab === 'summary' ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
                
                {/* 1. Baki Semasa */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-soft border-l-4 border-l-teal-500 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Baki Kedudukan</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {currentStockBalance}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-bold">{selectedItem.unit_of_measure}</span>
                  </div>
                  <span className="text-[10px] text-teal-600 font-semibold block pt-0.5">Pegangan Stok Aktif</span>
                </div>

                {/* 2. Jumlah Diterima */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-soft border-l-4 border-l-emerald-500 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Diterima (+)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      +{totalReceived}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-bold">{selectedItem.unit_of_measure}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block pt-0.5">Penerimaan Tempoh Ini</span>
                </div>

                {/* 3. Jumlah Dikeluarkan */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-soft border-l-4 border-l-rose-500 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Dikeluarkan (-)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-rose-600 font-mono">
                      -{totalIssued}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-bold">{selectedItem.unit_of_measure}</span>
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold block pt-0.5">Pengeluaran Tempoh Ini</span>
                </div>

                {/* 4. % Pengeluaran */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-soft border-l-4 border-l-indigo-500 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">% Pengeluaran</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-indigo-600 font-mono">
                      {issuePercentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold block pt-0.5">Nisbah Pengeluaran Stok</span>
                </div>

              </div>

              {/* SUMMARY TAB EXTRA SECTIONS (D1 & D2) */}
              <div className={`${mobileTab === 'summary' ? 'block' : 'hidden'} lg:block space-y-6`}>
                {/* ZONE D1: PARAS STOK TAHUNAN */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-xs text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <span>Paras Stok Tahunan (Min, Buffer & Max)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openEditStockModal}
                        className="text-teal-600 hover:text-teal-800 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Kemaskini</span>
                      </button>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {annualStockLevels.length} Tahun Rekod
                      </Badge>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                          <th className="py-2 px-3">Tahun</th>
                          <th className="py-2 px-3 text-center">Paras Stok Min</th>
                          <th className="py-2 px-3 text-center">Stok Buffer (Tambahan)</th>
                          <th className="py-2 px-3 text-center">Paras Stok Max</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {annualStockLevels.map((l, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold font-sans text-slate-900">{l.year}</td>
                            <td className="py-2 px-3 text-center font-black text-rose-600">{l.min} {selectedItem.unit_of_measure}</td>
                            <td className="py-2 px-3 text-center font-black text-amber-600">{l.buffer} {selectedItem.unit_of_measure}</td>
                            <td className="py-2 px-3 text-center font-black text-emerald-600">{l.max} {selectedItem.unit_of_measure}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ZONE D2: REKOD TERIMAAN DAN PENGELUARAN SUKU TAHUN */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-xs text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Rekod Terimaan & Pengeluaran Suku Tahun (Kuantiti & Nilai RM)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Harga Seunit: RM {unitPrice.toFixed(2)}</span>
                  </div>

                  {/* Mobile View for Quarterly Summary */}
                  <div className="md:hidden space-y-4">
                    {quarterlySummary.map((yData, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-black text-sm text-slate-900 font-mono">Tahun {yData.year}</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Jumlah Terima: +{yData.total.receiptQty} {selectedItem.unit_of_measure}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          {[
                            { label: 'Q1 (Jan-Mac)', data: yData.q1 },
                            { label: 'Q2 (Apr-Jun)', data: yData.q2 },
                            { label: 'Q3 (Jul-Sep)', data: yData.q3 },
                            { label: 'Q4 (Okt-Dis)', data: yData.q4 }
                          ].map((q, qIdx) => (
                            <div key={qIdx} className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1.5 shadow-2xs">
                              <div className="font-bold text-slate-700 text-[11px]">{q.label}</div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100/80">
                                  <div className="text-[9px] text-emerald-800 font-sans font-bold uppercase">Terimaan</div>
                                  <div className="text-emerald-700 font-black">{q.data.receiptQty > 0 ? `+${q.data.receiptQty} ${selectedItem.unit_of_measure}` : '—'}</div>
                                  {q.data.receiptVal > 0 && <div className="text-[10px] text-slate-500 font-sans">RM {q.data.receiptVal.toFixed(2)}</div>}
                                </div>
                                <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-100/80">
                                  <div className="text-[9px] text-rose-800 font-sans font-bold uppercase">Pengeluaran</div>
                                  <div className="text-rose-700 font-black">{q.data.issueQty > 0 ? `-${q.data.issueQty} ${selectedItem.unit_of_measure}` : '—'}</div>
                                  {q.data.issueVal > 0 && <div className="text-[10px] text-slate-500 font-sans">RM {q.data.issueVal.toFixed(2)}</div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-slate-200/60 p-2.5 rounded-xl font-mono text-xs flex justify-between items-center">
                          <span className="font-bold font-sans text-slate-800 text-[11px]">Jumlah Keseluruhan:</span>
                          <div className="text-right">
                            <span className="text-emerald-800 font-bold block">+{yData.total.receiptQty} {selectedItem.unit_of_measure} ({yData.total.receiptVal > 0 ? `RM ${yData.total.receiptVal.toFixed(2)}` : '—'})</span>
                            <span className="text-rose-800 font-bold block">-{yData.total.issueQty} {selectedItem.unit_of_measure} ({yData.total.issueVal > 0 ? `RM ${yData.total.issueVal.toFixed(2)}` : '—'})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                          <th rowSpan={2} className="py-2 px-3 text-center border-r border-slate-200">Tahun</th>
                          <th rowSpan={2} className="py-2 px-3 text-left border-r border-slate-200">Suku Tahun</th>
                          <th colSpan={2} className="py-1 px-3 text-center bg-emerald-50 text-emerald-900 border-r border-emerald-200">Terimaan</th>
                          <th colSpan={2} className="py-1 px-3 text-center bg-rose-50 text-rose-900">Pengeluaran</th>
                        </tr>
                        <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
                          <th className="py-1 px-2 text-right bg-emerald-50/50">Kuantiti</th>
                          <th className="py-1 px-2 text-right bg-emerald-50/50 border-r border-emerald-200">Nilai (RM)</th>
                          <th className="py-1 px-2 text-right bg-rose-50/50">Kuantiti</th>
                          <th className="py-1 px-2 text-right bg-rose-50/50">Nilai (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {quarterlySummary.map((yData, idx) => (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-slate-50/50">
                              <td rowSpan={5} className="py-2 px-3 font-bold font-sans text-center text-slate-900 bg-slate-50/70 border-r border-slate-200 align-middle">
                                {yData.year}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-700 border-r border-slate-100">Suku Pertama (Q1: Jan-Mac)</td>
                              <td className="py-2 px-2 text-right text-emerald-700 font-bold">{yData.q1.receiptQty > 0 ? `+${yData.q1.receiptQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600 border-r border-slate-100">{yData.q1.receiptVal > 0 ? `RM ${yData.q1.receiptVal.toFixed(2)}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-rose-700 font-bold">{yData.q1.issueQty > 0 ? `-${yData.q1.issueQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600">{yData.q1.issueVal > 0 ? `RM ${yData.q1.issueVal.toFixed(2)}` : '—'}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-sans text-slate-700 border-r border-slate-100">Suku Kedua (Q2: Apr-Jun)</td>
                              <td className="py-2 px-2 text-right text-emerald-700 font-bold">{yData.q2.receiptQty > 0 ? `+${yData.q2.receiptQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600 border-r border-slate-100">{yData.q2.receiptVal > 0 ? `RM ${yData.q2.receiptVal.toFixed(2)}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-rose-700 font-bold">{yData.q2.issueQty > 0 ? `-${yData.q2.issueQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600">{yData.q2.issueVal > 0 ? `RM ${yData.q2.issueVal.toFixed(2)}` : '—'}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-sans text-slate-700 border-r border-slate-100">Suku Ketiga (Q3: Jul-Sep)</td>
                              <td className="py-2 px-2 text-right text-emerald-700 font-bold">{yData.q3.receiptQty > 0 ? `+${yData.q3.receiptQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600 border-r border-slate-100">{yData.q3.receiptVal > 0 ? `RM ${yData.q3.receiptVal.toFixed(2)}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-rose-700 font-bold">{yData.q3.issueQty > 0 ? `-${yData.q3.issueQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600">{yData.q3.issueVal > 0 ? `RM ${yData.q3.issueVal.toFixed(2)}` : '—'}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-sans text-slate-700 border-r border-slate-100">Suku Keempat (Q4: Okt-Dis)</td>
                              <td className="py-2 px-2 text-right text-emerald-700 font-bold">{yData.q4.receiptQty > 0 ? `+${yData.q4.receiptQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600 border-r border-slate-100">{yData.q4.receiptVal > 0 ? `RM ${yData.q4.receiptVal.toFixed(2)}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-rose-700 font-bold">{yData.q4.issueQty > 0 ? `-${yData.q4.issueQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-600">{yData.q4.issueVal > 0 ? `RM ${yData.q4.issueVal.toFixed(2)}` : '—'}</td>
                            </tr>
                            <tr className="bg-slate-100/80 font-bold border-b border-slate-200">
                              <td className="py-2 px-3 font-sans text-slate-900 border-r border-slate-200">Jumlah Keseluruhan Tahun {yData.year}</td>
                              <td className="py-2 px-2 text-right text-emerald-800">{yData.total.receiptQty > 0 ? `+${yData.total.receiptQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">RM {yData.total.receiptVal.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right text-rose-800">{yData.total.issueQty > 0 ? `-${yData.total.issueQty} ${selectedItem.unit_of_measure}` : '—'}</td>
                              <td className="py-2 px-2 text-right text-slate-900">RM {yData.total.issueVal.toFixed(2)}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DEPARTMENTS TAB CONTENT (Zone D Log Penerimaan dan Pengeluaran) */}
              {movementLogSummary.length > 0 && (
                <div className={`${mobileTab === 'departments' ? 'block' : 'hidden'} lg:block bg-white border border-slate-100 rounded-3xl p-5 shadow-soft space-y-3`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-xs text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Log Penerimaan dan Pengeluaran (Rekod Mengikut Jabatan / Pembekal)</span>
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {movementLogSummary.length} Entiti
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {movementLogSummary.map((item, idx) => (
                      <div key={idx} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 space-y-1.5">
                        <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                        <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-200/60">
                          <span className="text-emerald-700 font-black">
                            Terima: {item.totalReceived > 0 ? `+${item.totalReceived} ${selectedItem.unit_of_measure}` : '—'}
                          </span>
                          <span className="text-rose-700 font-black">
                            Keluar: {item.totalIssued > 0 ? `-${item.totalIssued} ${selectedItem.unit_of_measure}` : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LEDGER TAB CONTENT (Zone C Filters & Digital KEW.PS-4 Records) */}
              <div className={`${mobileTab === 'ledger' ? 'block' : 'hidden'} lg:block space-y-6`}>
                {/* ZONE C: ADVANCED FILTERS BAR */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                      <span>Penapis & Julat Tarikh Pergerakan</span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-medium text-[11px] mr-1">Pintas:</span>
                      <button
                        type="button"
                        onClick={() => applyDatePreset('today')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          activeDatePreset === 'today' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset('week')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          activeDatePreset === 'week' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        7 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset('month')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          activeDatePreset === 'month' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Bulan Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset('3months')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          activeDatePreset === '3months' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        3 Bulan
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDatePreset('all')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          activeDatePreset === 'all' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tarikh Akhir</label>
                      <Input
                        type="date"
                        className="text-xs py-1.5 rounded-xl font-mono"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
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
                        <option value="bring_forward">Bawa Ke Hadapan (Bring Forward)</option>
                        <option value="check_found">Semak & Penemuan (Check & Found)</option>
                        <option value="receipt">Penerimaan (+)</option>
                        <option value="issue">Pengeluaran (-)</option>
                        <option value="adjustment">Pelarasan (±)</option>
                        <option value="return">Pulangan (+)</option>

                      </Select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan / Wad Destinasi</label>
                      <Select
                        className="text-xs py-1.5 rounded-xl font-medium"
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                      >
                        <option value="all">Semua Jabatan / Wad</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ZONE E: DIGITAL KEW.PS-4 LEDGER TABLE */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-soft p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <span>Buku Daftar Transaksi (Digital KEW.PS-4)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {ledgerRows.length} Rekod
                      </Badge>
                    </div>
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
                      {dateFrom || dateTo ? (
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Tiada transaksi dikesan bagi julat tarikh ini ({dateFrom || 'Awal'} hingga {dateTo || 'Kini'}). Sila tukar tarikh atau tekan <button type="button" onClick={() => applyDatePreset('all')} className="text-teal-600 font-extrabold underline hover:text-teal-800 cursor-pointer">"Semua"</button> untuk memaparkan keseluruhan sejarah transaksi.
                        </p>
                      ) : selectedItem && currentStockBalance > 0 ? (
                        <div className="space-y-3 max-w-lg mx-auto pt-2">
                          <p className="text-xs text-amber-800 font-semibold bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 leading-relaxed text-left">
                            ⚠ Item ini mempunyai baki stok aktif sebanyak <strong>{currentStockBalance} {selectedItem.unit_of_measure}</strong>, tetapi belum mempunyai rekod transaksi pembukaan / penerimaan KEW.PS-4 dalam pangkalan data.
                          </p>
                          <button
                            type="button"
                            onClick={() => openBringForwardModal(currentStockBalance.toString())}
                            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            <FastForward className="w-4 h-4 text-white" />
                            <span>Rekod Baki Pembukaan KEW.PS-4 ({currentStockBalance} {selectedItem.unit_of_measure})</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Sila tukar julat tarikh atau penapis transaksi di atas untuk melihat data.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Mobile Card View for Digital KEW.PS-4 Ledger */}
                    <div className="md:hidden space-y-3 p-1">
                      {ledgerRows.map(row => {
                        const isReceipt = row.receiptQty !== null
                        const isCheckFound = row.transaction_type === 'check_found'
                        const txKey = row.id || `row-${row.index}`
                        const rowAuditLogs = auditLogStore[txKey] || []
                        const hasBeenEdited = rowAuditLogs.length > 0

                        return (
                          <div 
                            key={txKey}
                            className={`rounded-2xl p-4 shadow-sm border space-y-3 ${
                              isCheckFound
                                ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600 border-indigo-200'
                                : isReceipt 
                                ? 'bg-white border-l-4 border-l-emerald-500 border-slate-200/80' 
                                : 'bg-white border-l-4 border-l-rose-400 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-slate-400">#{row.index}</span>
                                <span 
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    row.transaction_type === 'check_found'
                                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300/80'
                                      : isReceipt 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80' 
                                      : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                                  }`}
                                >
                                  {row.transaction_type === 'check_found' ? 'Semak & Penemuan' : row.transaction_type === 'receipt' ? 'Penerimaan' : row.transaction_type === 'issue' ? 'Pengeluaran' : row.transaction_type === 'return' ? 'Pulangan' : 'Pelarasan'}
                                </span>
                              </div>

                              <span className="text-[11px] font-semibold text-slate-600 font-mono">
                                {new Date(row.transaction_date || row.created_at).toLocaleString('ms-MY', {
                                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono font-bold text-teal-700">
                              <span className="bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">{formatReferenceNumber(row)}</span>
                              {hasBeenEdited && (
                                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] font-bold">
                                  DIPINDA
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Kuantiti</span>
                                {row.receiptQty !== null ? (
                                  <div>
                                    <span className="font-mono text-sm text-emerald-600 font-black block">+{row.receiptQty}</span>
                                    <span className="text-[10px] text-slate-500 font-medium block">{row.batch?.packaging || selectedItem.packaging_description || 'Pack'}</span>
                                    {row.batch?.batch_number && <span className="text-[9px] text-teal-700 font-bold block">Batch: {row.batch.batch_number}</span>}
                                    {row.batch?.expiry_date && <span className="text-[9px] text-amber-700 font-bold block">Luput: {new Date(row.batch.expiry_date).toLocaleDateString('ms-MY')}</span>}
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-mono text-sm text-rose-600 font-black block">-{row.issueQty}</span>
                                    <span className="text-[10px] text-slate-500 font-medium block">{row.batch?.packaging || selectedItem.packaging_description || 'Pack'}</span>
                                    {row.batch?.batch_number && <span className="text-[9px] text-teal-700 font-bold block">Batch: {row.batch.batch_number}</span>}
                                    {row.batch?.expiry_date && <span className="text-[9px] text-amber-700 font-bold block">Luput: {new Date(row.batch.expiry_date).toLocaleDateString('ms-MY')}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="text-right border-l border-slate-200/80 pl-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Baki Semasa</span>
                                <span className="font-mono text-base text-slate-900 font-black block">{row.runningBalance}</span>
                                <span className="text-[9px] text-slate-400 font-sans block uppercase font-bold">{selectedItem.unit_of_measure}</span>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs pt-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Penerima:</span>
                                <span className="font-bold text-slate-800">{resolveRecipientName(row)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-[10px] font-bold uppercase">Perekod:</span>
                                <span className="text-slate-600 font-medium">{resolveRecorderName(row.performed_by_user?.name || row.performed_by)}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => triggerEditAuth(row)}
                                className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition-all text-xs font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <Lock className="w-3 h-3 text-amber-700" />
                                <Pencil className="w-3 h-3 text-amber-700" />
                                <span>Pinda</span>
                              </button>

                              {hasBeenEdited && (
                                <button
                                  type="button"
                                  onClick={() => { setAuditTxRow(row); setIsAuditModalOpen(true); }}
                                  className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/80 transition-all text-xs font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <History className="w-3 h-3 text-purple-700" />
                                  <span>Log ({rowAuditLogs.length})</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop View Table */}
                    <div className="hidden md:block border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                      <Table>
                        <Table.Header>
                          <Table.Row className="bg-slate-50/70">
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-center">Bil</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">Tarikh & Masa</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">No Rujukan</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">Jenis</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-right font-mono">Masuk (+)</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-right font-mono">Keluar (-)</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-right font-mono bg-teal-50/30">Baki Semasa</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">Penerima / Jabatan</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5">Perekod</Table.Cell>
                            <Table.Cell as="th" className="text-slate-500 font-bold text-xs py-3.5 text-center">Tindakan</Table.Cell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body className="divide-y divide-slate-100">
                          {ledgerRows.map(row => {
                            const isReceipt = row.receiptQty !== null
                            const isCheckFound = row.transaction_type === 'check_found'
                            const txKey = row.id || `row-${row.index}`
                            const rowAuditLogs = auditLogStore[txKey] || []
                            const hasBeenEdited = rowAuditLogs.length > 0

                            return (
                              <Table.Row 
                                key={txKey} 
                                className={`transition-colors ${
                                  isCheckFound
                                    ? 'bg-indigo-50/70 hover:bg-indigo-100/70 border-l-4 border-l-indigo-600'
                                    : isReceipt 
                                    ? 'hover:bg-slate-50/50 border-l-4 border-l-emerald-500' 
                                    : 'hover:bg-slate-50/50 border-l-4 border-l-rose-400'
                                }`}
                              >
                                <Table.Cell className="text-center font-mono font-bold text-xs text-slate-400">
                                  {row.index}
                                </Table.Cell>
                                <Table.Cell className="text-xs font-semibold text-slate-800 font-mono">
                                  {new Date(row.transaction_date || row.created_at).toLocaleString('ms-MY', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Table.Cell>
                                <Table.Cell className="text-xs font-mono font-bold text-teal-700">
                                  <div className="flex items-center gap-1.5">
                                    <span>{formatReferenceNumber(row)}</span>
                                    {hasBeenEdited && (
                                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] font-bold">
                                        DIPINDA
                                      </Badge>
                                    )}
                                  </div>
                                </Table.Cell>
                                <Table.Cell>
                                  <span 
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      row.transaction_type === 'check_found'
                                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-300/80'
                                        : row.transaction_type === 'bring_forward'
                                        ? 'bg-sky-100 text-sky-900 border border-sky-300/80'
                                        : isReceipt 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80' 
                                        : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                                    }`}
                                  >
                                    {row.transaction_type === 'check_found'
                                      ? 'Semak & Penemuan'
                                      : row.transaction_type === 'bring_forward'
                                      ? 'Bawa Ke Hadapan'
                                      : row.transaction_type === 'receipt' 
                                      ? 'Penerimaan' 
                                      : row.transaction_type === 'issue' 
                                      ? 'Pengeluaran' 
                                      : row.transaction_type === 'return' 
                                      ? 'Pulangan' 
                                      : 'Pelarasan'
                                    }
                                  </span>
                                </Table.Cell>

                                <Table.Cell className="text-right">
                                  {row.receiptQty !== null ? (
                                    <div>
                                      <span className="font-mono text-sm text-emerald-600 font-black block">
                                        +{row.receiptQty}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium block">
                                        {row.batch?.packaging || selectedItem.packaging_description || 'Pack of 10 x 10tablet'}
                                      </span>
                                      {row.batch?.batch_number && (
                                        <span className="text-[10px] text-teal-700 font-bold block">
                                          Batch: {row.batch.batch_number}
                                        </span>
                                      )}
                                      {row.batch?.expiry_date && (
                                        <span className="text-[10px] text-amber-700 font-bold block">
                                          Luput: {new Date(row.batch.expiry_date).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-mono">—</span>
                                  )}
                                </Table.Cell>
                                <Table.Cell className="text-right">
                                  {row.issueQty !== null ? (
                                    <div>
                                      <span className="font-mono text-sm text-rose-600 font-black block">
                                        -{row.issueQty}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium block">
                                        {row.batch?.packaging || selectedItem.packaging_description || 'Pack of 10 x 10tablet'}
                                      </span>
                                      {row.batch?.batch_number && (
                                        <span className="text-[10px] text-teal-700 font-bold block">
                                          Batch: {row.batch.batch_number}
                                        </span>
                                      )}
                                      {row.batch?.expiry_date && (
                                        <span className="text-[10px] text-amber-700 font-bold block">
                                          Luput: {new Date(row.batch.expiry_date).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-mono">—</span>
                                  )}
                                </Table.Cell>
                                <Table.Cell className="text-right font-mono font-black text-sm text-slate-900 bg-teal-50/20">
                                  {row.runningBalance}
                                </Table.Cell>
                                <Table.Cell className="text-xs font-bold text-slate-700">
                                  {resolveRecipientName(row)}
                                </Table.Cell>
                                <Table.Cell className="text-xs text-slate-500 font-medium">
                                  {resolveRecorderName(row.performed_by_user?.name || row.performed_by)}
                                </Table.Cell>
                                <Table.Cell className="text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => triggerEditAuth(row)}
                                      className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 transition-all text-xs font-bold flex items-center gap-1 shadow-2xs"
                                      title="Pinda / Betulkan Rekod ini (Dilindungi Kata Laluan Kebenaran)"
                                    >
                                      <Lock className="w-3 h-3 text-amber-700" />
                                      <Pencil className="w-3 h-3 text-amber-700" />
                                      <span>Pinda</span>
                                    </button>

                                    {hasBeenEdited && (
                                      <button
                                        type="button"
                                        onClick={() => { setAuditTxRow(row); setIsAuditModalOpen(true); }}
                                        className="px-2 py-1 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/80 transition-all text-xs font-bold flex items-center gap-1 shadow-2xs"
                                        title="Papar Log Sejarah Pindaan & Bukti Audit"
                                      >
                                        <History className="w-3 h-3 text-purple-700" />
                                        <span>Log ({rowAuditLogs.length})</span>
                                      </button>
                                    )}
                                  </div>
                                </Table.Cell>
                              </Table.Row>
                            )
                          })}
                        </Table.Body>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>

      {/* STICKY MOBILE BOTTOM ACTION BAR (Thumb Reach Zone) */}
      {selectedItem && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 pb-safe z-40 shadow-2xl flex items-center gap-2">
          <button
            type="button"
            onClick={openReceiveModal}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-black text-xs py-3 px-3 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>+ Terima</span>
          </button>

          <button
            type="button"
            onClick={openIssueModal}
            className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-black text-xs py-3 px-3 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MinusCircle className="w-4 h-4 text-white" />
            <span>- Keluar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMoreActionsOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs py-3 px-3 transition-all active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer shrink-0"
            title="Tindakan Tambahan"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            <span>Lagi</span>
          </button>
        </div>
      )}

      {/* MOBILE MORE ACTIONS BOTTOM SHEET MODAL */}
      <Modal
        isOpen={isMobileMoreActionsOpen}
        onClose={() => setIsMobileMoreActionsOpen(false)}
        title="Tindakan & Tetapan Item"
        maxWidth="sm"
      >
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsMobileMoreActionsOpen(false)
              openEditStockModal()
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-xs font-bold text-slate-800 flex items-center gap-3 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">Kemaskini Lokasi & Paras</div>
              <div className="text-[10px] text-slate-500">Tetapkan rak, level, min, buffer & max stock</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMoreActionsOpen(false)
              openCheckFoundModal()
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-bold text-slate-800 flex items-center gap-3 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">Check & Found Audit</div>
              <div className="text-[10px] text-slate-500">Audit stok fizikal dan rekod jumpaan</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMoreActionsOpen(false)
              openBringForwardModal()
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-bold text-slate-800 flex items-center gap-3 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FastForward className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">Bawa Ke Hadapan (Bring Forward)</div>
              <div className="text-[10px] text-slate-500">Bawa baki akhir dari bulan/tahun lepas</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMoreActionsOpen(false)
              openClearModal()
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-950 flex items-center gap-3 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-amber-950">Set Semula Ledger</div>
              <div className="text-[10px] text-amber-800">Padam rekod transaksi untuk bermula semula (Kata laluan)</div>
            </div>
          </button>

          {resetAuditLogs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMoreActionsOpen(false)
                setIsResetAuditModalOpen(true)
              }}
              className="w-full text-left p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-950 flex items-center gap-3 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-purple-950">Sejarah Log Reset ({resetAuditLogs.length})</div>
                <div className="text-[10px] text-purple-800">Lihat rekod pemadaman ledger terdahulu</div>
              </div>
            </button>
          )}
        </div>
      </Modal>

    </div>

      {/* QR SCANNER & QUICK TRANSACTION MODAL */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => {
          stopCamera()
          setIsQrModalOpen(false)
          setScanStatus(null)
        }}
        title="Imbas QR Code Stok & Transaksi Pantas"
        maxWidth="2xl"
      >
        <div className="space-y-6 text-slate-800">
          
          {/* SCAN TABS */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setScanTab('camera')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                scanTab === 'camera' 
                  ? 'border-teal-600 text-teal-700 bg-teal-50/30' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Imbasan Kamera</span>
            </button>
            <button
              onClick={() => setScanTab('manual')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                scanTab === 'manual' 
                  ? 'border-teal-600 text-teal-700 bg-teal-50/30' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Carian Kod Manual</span>
            </button>
          </div>

          {/* TAB 1: CAMERA VIEWPORT */}
          {scanTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-teal-500 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Viewfinder Overlay Frame */}
                <div className="absolute inset-0 border-2 border-dashed border-teal-400/70 rounded-2xl m-8 pointer-events-none flex items-center justify-center">
                  <div className="text-center bg-slate-900/80 px-4 py-2 rounded-xl border border-teal-500/40 text-teal-300 text-xs font-medium backdrop-blur-sm">
                    Arahkan Kamera ke Kod QR Item Stok
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL KEY-IN */}
          {scanTab === 'manual' && (
            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Masukkan Kod Item / QR Payload</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: DR-001 atau MYINV:DRUG:id:code"
                  className="text-xs py-2 rounded-xl"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                />
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl px-5">
                  Cari
                </Button>
              </div>
            </form>
          )}

          {/* STATUS NOTIFICATION MESSAGE */}
          {scanStatus && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
              scanStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {scanStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>{scanStatus.text}</span>
            </div>
          )}

          {/* QUICK TRANSACTION FORM FOR SCANNED ITEM */}
          {selectedItem && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400 block">{selectedItem.item_code}</span>
                  <span className="font-black text-xs text-slate-800">{selectedItem.item_name}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Baki: {selectedItem.current_stock} {selectedItem.unit_of_measure}
                </Badge>
              </div>

              <form onSubmit={handleQuickTransactionSubmit} className="space-y-4">
                
                {/* Transaction Type Radio Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQuickTxType('receipt')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      quickTxType === 'receipt'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Penerimaan (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickTxType('issue')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      quickTxType === 'issue'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Pengeluaran (-)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kuantiti ({selectedItem.unit_of_measure})</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="0"
                      className="text-xs py-1.5 rounded-xl font-mono font-bold"
                      value={quickQty}
                      onChange={(e) => setQuickQty(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">No. Batch</label>
                    <Input
                      placeholder="BT-2026-X"
                      className="text-xs py-1.5 rounded-xl font-mono"
                      value={quickBatchNum}
                      onChange={(e) => setQuickBatchNum(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan / Wad</label>
                    <Select
                      className="text-xs py-1.5 rounded-xl"
                      value={quickDeptId}
                      onChange={(e) => setQuickDeptId(e.target.value)}
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingQuickTx}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl text-white shadow-md ${
                    quickTxType === 'receipt' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmittingQuickTx ? <Spinner size="sm" /> : `Simpan ${quickTxType === 'receipt' ? 'Penerimaan' : 'Pengeluaran'} Stok`}
                </Button>
              </form>
            </div>
          )}

        </div>
      </Modal>

      {/* BRING FORWARD SLIDE-OVER DRAWER (SLIDES FROM THE RIGHT) */}
      {isBringForwardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              setIsBringForwardModalOpen(false)
              setBfStatus(null)
            }}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-4xl bg-white shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
              
              {/* Drawer Top Header Strip */}
              <div className="h-1.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shrink-0" />

              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-sky-50/60 to-slate-50/40 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-md shadow-sky-500/20">
                    <FastForward className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Bawa Ke Hadapan Baki Ledger (Bring Forward)</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Bawa ke hadapan baki dari tahun/bulan lepas sebagai baki pembukaan tanpa perlu kunci masuk semula rekod lama.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsBringForwardModalOpen(false)
                    setBfStatus(null)
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-800">
                
                {/* HEADER INFO BANNER */}
                {selectedItem && (
                  <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-md space-y-3 border border-sky-800/80">
                    <div className="flex items-center justify-between border-b border-sky-800/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-sky-500/30 text-sky-200 border-sky-400/40 text-[10px] uppercase font-bold">
                          BAKI BAWA KE HADAPAN (OPENING BALANCE)
                        </Badge>
                        <span className="font-mono text-xs text-sky-200 font-bold">{selectedItem.item_code}</span>
                      </div>
                      <span className="text-xs text-sky-300 font-mono">UOM: {selectedItem.unit_of_measure}</span>
                    </div>
                    <h4 className="text-lg font-black text-white">{selectedItem.item_name}</h4>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-sky-200 font-medium">Baki Stok Dalam Sistem (Current Recorded):</span>
                      <span className="font-mono text-xl font-black text-sky-300">
                        {activeLedgerStock} {selectedItem.unit_of_measure}
                      </span>
                    </div>
                  </div>
                )}

                {/* STATUS NOTIFICATION MESSAGE */}
                {bfStatus && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
                    bfStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' : 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
                  }`}>
                    {bfStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                    <span>{bfStatus.text}</span>
                  </div>
                )}

                <form id="bring-forward-form" onSubmit={handleBringForwardSubmit} className="space-y-6">
                  
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5">
                    
                    {/* PERIOD SELECTION TABS */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Jenis Baki Bawa Ke Hadapan (Period / Type) <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleBfPeriodTypeChange('previous_year')}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            bfPeriodType === 'previous_year'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          📅 Tahun Lepas (Previous Year)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBfPeriodTypeChange('previous_month')}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            bfPeriodType === 'previous_month'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🗓 Bulan Lepas (Previous Month)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBfPeriodTypeChange('initial_balance')}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            bfPeriodType === 'initial_balance'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⚡ Baki Pembukaan Asal
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kuantiti Baki Bawa Ke Hadapan <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Masukkan baki pembukaan dari tempoh lepas"
                          className="text-base py-2.5 rounded-xl font-mono font-black text-sky-900 border-sky-200 focus:ring-2 focus:ring-sky-500"
                          value={bfQty}
                          onChange={(e) => setBfQty(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Kuantiti baki penutup yang dibawa ke hadapan dari tempoh terdahulu.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tarikh Bawa Ke Hadapan <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          className="text-xs py-2.5 rounded-xl font-mono"
                          value={bfDate}
                          onChange={(e) => setBfDate(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Tarikh pembukaan rekod ledger tempoh baharu.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. Batch / Lot (BKH)
                        </label>
                        <Input
                          placeholder="Contoh: BKH-2026-0001"
                          className="text-xs py-2.5 rounded-xl font-mono"
                          value={bfBatchNum}
                          onChange={(e) => setBfBatchNum(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          No. batch rujukan baki bawa ke hadapan.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tarikh Luput (Pilihan)
                        </label>
                        <Input
                          type="date"
                          className="text-xs py-2.5 rounded-xl font-mono"
                          value={bfExpiryDate}
                          onChange={(e) => setBfExpiryDate(e.target.value)}
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Tarikh luput bagi batch baki pembukaan (jika ada).
                        </span>
                      </div>

                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Catatan / Sebab Bawa Ke Hadapan
                      </label>
                      <Input
                        placeholder="Contoh: Baki Bawa Ke Hadapan dari Tahun 2025"
                        className="text-xs py-2 rounded-xl"
                        value={bfReason}
                        onChange={(e) => setBfReason(e.target.value)}
                      />
                    </div>

                  </div>

                  {/* LIVE SUMMARY PREVIEW CARD */}
                  <div className="bg-gradient-to-r from-slate-900 to-sky-950 rounded-2xl p-5 text-white space-y-3 shadow-md border border-sky-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                      Ringkasan Impak Baki Ledger
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                        <span className="text-[10px] text-slate-300 font-sans block">Baki Asal System</span>
                        <span className="text-lg font-black text-amber-300">{activeLedgerStock} {selectedItem?.unit_of_measure}</span>
                      </div>
                      <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                        <span className="text-[10px] text-sky-300 font-sans block">Baki Bawa Ke Hadapan (+)</span>
                        <span className="text-lg font-black text-sky-300">+{parsedBfQty} {selectedItem?.unit_of_measure}</span>
                      </div>
                      <div className="bg-sky-500/20 p-3 rounded-xl border border-sky-400/30">
                        <span className="text-[10px] text-emerald-300 font-sans block font-bold">Jangkaan Baki Baharu</span>
                        <span className="text-xl font-black text-emerald-300">{projectedNewStockAfterBf} {selectedItem?.unit_of_measure}</span>
                      </div>
                    </div>
                  </div>

                </form>

              </div>

              {/* Drawer Footer Bar */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBringForwardModalOpen(false)
                    setBfStatus(null)
                  }}
                  className="rounded-xl text-xs font-bold px-5 py-2.5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  form="bring-forward-form"
                  disabled={isSubmittingBf}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold px-7 py-2.5 shadow-md gap-2"
                >
                  {isSubmittingBf ? <Spinner size="sm" /> : <FastForward className="w-4 h-4" />}
                  {isSubmittingBf ? 'Menyimpan Baki...' : 'Simpan Baki Bawa Ke Hadapan'}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CHECK & FOUND SLIDE-OVER DRAWER (SLIDES FROM THE RIGHT) */}
      {isCheckFoundModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              setIsCheckFoundModalOpen(false)
              setCheckFoundStatus(null)
            }}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-4xl bg-white shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
              
              {/* Drawer Top Header Strip */}
              <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 shrink-0" />

              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-indigo-50/60 to-slate-50/40 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-500/20">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Semakan & Penemuan Stok (Check & Found)</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Borang Verifikasi Stok Fizikal & Pelarasan Penemuan KEW.PS-4</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCheckFoundModalOpen(false)
                    setCheckFoundStatus(null)
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-800">
                
                {/* HEADER INFO BANNER */}
                {selectedItem && (
                  <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-md space-y-3 border border-indigo-800/80">
                    <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40 text-[10px] uppercase font-bold">
                          VERIFIKASI FIZIKAL STOK
                        </Badge>
                        <span className="font-mono text-xs text-indigo-200 font-bold">{selectedItem.item_code}</span>
                      </div>
                      <span className="text-xs text-indigo-300 font-mono">UOM: {selectedItem.unit_of_measure}</span>
                    </div>
                    <h4 className="text-lg font-black text-white">{selectedItem.item_name}</h4>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-indigo-200 font-medium">Baki Stok Dalam Sistem (Current Recorded):</span>
                      <span className="font-mono text-xl font-black text-amber-300">
                        {activeLedgerStock} {selectedItem.unit_of_measure}
                      </span>
                    </div>
                  </div>
                )}

                {/* STATUS NOTIFICATION MESSAGE */}
                {checkFoundStatus && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
                    checkFoundStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' : 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
                  }`}>
                    {checkFoundStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                    <span>{checkFoundStatus.text}</span>
                  </div>
                )}

                <form id="check-found-form" onSubmit={handleCheckFoundSubmit} className="space-y-6">
                  
                  {/* INPUT FIELD & DYNAMIC DISCREPANCY PREVIEW */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kuantiti Fizikal Dikira (Physical Count) <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Masukkan jumlah stok fizikal di rak"
                          className="text-base py-2.5 rounded-xl font-mono font-black text-indigo-900 border-indigo-200 focus:ring-2 focus:ring-indigo-500"
                          value={checkFoundPhysicalQty}
                          onChange={(e) => setCheckFoundPhysicalQty(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Jumlah fizikal yang dikira secara manual di stor/rak.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. Batch Semakan (Pilihan)
                        </label>
                        <Select
                          className="text-xs py-2.5 rounded-xl"
                          value={checkFoundBatchId}
                          onChange={(e) => setCheckFoundBatchId(e.target.value)}
                        >
                          <option value="">Semua Batch (Auto-Allocated / Umum)</option>
                          {itemBatches.map(b => (
                            <option key={b.id} value={b.id}>
                              Batch {b.batch_number} (Baki: {b.quantity_on_hand}) - Exp: {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString('ms-MY') : '—'}
                            </option>
                          ))}
                        </Select>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Pilih batch spesifik jika semakan dilakukan per-batch.
                        </span>
                      </div>

                    </div>

                    {/* LIVE DISCREPANCY CALCULATOR STRIP */}
                    {(() => {
                      const pQty = parseInt(checkFoundPhysicalQty, 10)
                      const validPhys = isNaN(pQty) || pQty < 0 ? activeLedgerStock : pQty
                      const diff = validPhys - activeLedgerStock
                      const isMatched = diff === 0
                      const isSurplus = diff > 0

                      return (
                        <div className={`p-4.5 rounded-2xl border space-y-2.5 ${
                          isMatched 
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                            : isSurplus 
                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' 
                            : 'bg-rose-50/80 border-rose-200 text-rose-950'
                        }`}>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="uppercase tracking-wider text-[11px]">Keputusan Semakan Fizikal:</span>
                            <Badge className={`font-mono text-xs px-3 py-1 font-black ${
                              isMatched 
                                ? 'bg-emerald-600 text-white' 
                                : isSurplus 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-rose-600 text-white'
                            }`}>
                              {isMatched ? '● SAMA (MATCHED)' : isSurplus ? '▲ TERLEBIH (PENEMUAN / SURPLUS)' : '▼ TERKURANG (PELARASAN / DEFICIT)'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Perbezaan (Discrepancy):</span>
                              <span className={`text-lg font-black ${
                                isMatched ? 'text-emerald-700' : isSurplus ? 'text-indigo-700' : 'text-rose-700'
                              }`}>
                                {diff > 0 ? `+${diff}` : `${diff}`} {selectedItem?.unit_of_measure}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Baki Baharu Sistem:</span>
                              <span className="text-lg font-black text-slate-900">
                                {validPhys} {selectedItem?.unit_of_measure}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                  </div>


                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan / Sebab Semakan KEW.PS-4</label>
                    <Input
                      placeholder="Contoh: Semakan Stok Fizikal Bulanan / Verifikasi Pemeriksa Stok"
                      className="text-xs py-2 rounded-xl"
                      value={checkFoundReason}
                      onChange={(e) => setCheckFoundReason(e.target.value)}
                    />
                  </div>

                </form>

              </div>

              {/* Drawer Footer Bar */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCheckFoundModalOpen(false)
                    setCheckFoundStatus(null)
                  }}
                  className="rounded-xl text-xs font-bold px-5 py-2.5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  form="check-found-form"
                  disabled={isSubmittingCheckFound}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-7 py-2.5 shadow-md gap-2"
                >
                  {isSubmittingCheckFound ? <Spinner size="sm" /> : <ClipboardCheck className="w-4 h-4" />}
                  {isSubmittingCheckFound ? 'Menyimpan Semakan...' : 'Sahkan & Rekodkan KEW.PS-4'}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* 1. RECEIVING SLIDE-OVER DRAWER (SLICE FROM THE RIGHT) */}

      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsReceiveModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-5xl bg-white shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
              
              {/* Drawer Top Header Strip */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 shrink-0" />

              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-emerald-50/50 to-slate-50/50 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Penerimaan Stok Baru</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Borang Rekod Penerimaan Stok Pembekal & Pindahan Inter-Fasiliti</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Scrollable 2-Column Grid Layout) */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN (COL 7): Input Form */}
                  <div className="lg:col-span-7 space-y-5">
                    {selectedItem && (
                      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-2 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-emerald-900 pointer-events-none">
                          <Package className="w-24 h-24" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-emerald-600" /> Item Target</span>
                          <Badge variant="outline" className="font-mono text-[10px] bg-white/80 border-emerald-300 font-bold">
                            {selectedItem.item_code}
                          </Badge>
                        </div>
                        <p className="text-sm font-black text-slate-900 leading-snug">{selectedItem.item_name}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium pt-1 border-t border-emerald-200/50">
                          <span>Baki Semasa: <strong className="text-emerald-700 font-mono font-bold">{activeLedgerStock} {selectedItem.unit_of_measure}</strong></span>
                          <span>•</span>
                          <span>Kategori: <strong className="uppercase font-bold text-slate-700">{selectedItem.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat'}</strong></span>
                        </div>
                      </div>
                    )}

                    {receiveStatus && (
                      <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm transition-all ${
                        receiveStatus.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                        {receiveStatus.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />}
                        <span>{receiveStatus.text}</span>
                      </div>
                    )}

                    <form id="receive-form" onSubmit={handleReceiveSubmit} className="space-y-5 text-xs">
                      
                      {/* Field 1: Diterima Daripada / Received From */}
                      <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-emerald-600" />
                            1. Diterima Daripada (Received From) <span className="text-rose-500">*</span>
                          </span>
                          {isApplItem && receiveSourceType === 'supplier' ? (
                            <Badge className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> APPL KONTRAK
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal normal-case">Pilih sumber penerimaan</span>
                          )}
                        </label>

                        {/* Segmented Source Type Selector */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setReceiveSourceType('supplier')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              receiveSourceType === 'supplier'
                                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Pembekal (Supplier)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceiveSourceType('facility')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              receiveSourceType === 'facility'
                                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span>Fasiliti Lain (Other Facility)</span>
                          </button>
                        </div>

                        {/* Dynamic Source Inputs */}
                        {receiveSourceType === 'supplier' ? (
                          isApplItem ? (
                            <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-300 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-amber-700" /> Pembekal Kontrak APPL (Tetap):
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-black text-slate-900 pt-0.5">
                                <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                                <span>PHARMANIAGA LOGISTICS SDN BHD</span>
                                <span className="text-[10px] font-mono text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded font-bold">SUP-PHAR-001</span>
                              </div>
                              <p className="text-[10px] text-amber-800 font-medium pt-0.5">
                                Item di bawah skim APPL sentiasa diterima daripada pembekal utama Pharmaniaga.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1">
                              <Select
                                className="text-xs py-2.5 rounded-xl border-slate-200 bg-white font-medium focus:border-emerald-500 focus:ring-emerald-500/20"
                                value={receiveSupplierId}
                                onChange={(e) => setReceiveSupplierId(e.target.value)}
                              >
                                <option value="">-- Pilih Pembekal Berdaftar --</option>
                                {suppliersList.map((sup) => (
                                  <option key={sup.id} value={sup.id}>
                                    {sup.company_name} {sup.supplier_code ? `(${sup.supplier_code})` : ''}
                                  </option>
                                ))}
                                <option value="CUSTOM">+ Tambah / Nyatakan Pembekal Lain</option>
                              </Select>

                              {receiveSupplierId === 'CUSTOM' && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                  <Input
                                    placeholder="Masukkan Nama Pembekal..."
                                    className="text-xs py-2 rounded-xl border-slate-200 bg-white font-medium"
                                    value={receiveCustomSupplier}
                                    onChange={(e) => setReceiveCustomSupplier(e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="space-y-2 pt-1 relative">
                            <div className="relative">
                              <Input
                                placeholder="Taip cth: Sipitang / Limbang / Beaufort / Papar..."
                                className="text-xs py-2.5 rounded-xl border-slate-200 bg-white font-medium focus:border-emerald-500 focus:ring-emerald-500/20 pr-8"
                                value={receiveFacilityName}
                                onChange={(e) => {
                                  setReceiveFacilityName(e.target.value)
                                  setFacilitySearchFocused(true)
                                }}
                                onFocus={() => setFacilitySearchFocused(true)}
                              />
                              {receiveFacilityName && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiveFacilityName('')
                                    setFacilitySearchFocused(false)
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Dynamic Autocomplete Search Dropdown: Shows ONLY when typing */}
                            {facilitySearchFocused && receiveFacilityName.trim().length >= 1 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in duration-150">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                                  <span>Fasiliti Kesihatan KKM ({filteredFacilities.length})</span>
                                  <span>Carian: "{receiveFacilityName}"</span>
                                </div>

                                {filteredFacilities.length > 0 ? (
                                  filteredFacilities.map((fac, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setReceiveFacilityName(fac.name)
                                        setFacilitySearchFocused(false)
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                                          {fac.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                          <span className="font-bold text-emerald-700">{fac.type}</span>
                                          <span>•</span>
                                          <span>Daerah {fac.district}, {fac.state}</span>
                                        </p>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-3 text-center space-y-1">
                                    <p className="text-xs text-slate-600 font-medium">Tiada fasiliti ditemui untuk "{receiveFacilityName}"</p>
                                    <button
                                      type="button"
                                      onClick={() => setFacilitySearchFocused(false)}
                                      className="text-[11px] text-emerald-700 font-bold hover:underline"
                                    >
                                      Gunakan "{receiveFacilityName}" sebagai nama fasiliti
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Field 2: Tarikh Terima */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          2. Tarikh Terima (Date Received) <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          className="text-xs py-2.5 rounded-xl font-mono border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                          value={receiveDate}
                          onChange={(e) => setReceiveDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Field 3: Kuantiti Terima */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-emerald-600" />
                            3. Kuantiti Terima <span className="text-rose-500">*</span>
                          </span>
                          {selectedItem && (
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">
                              Unit: {selectedItem.unit_of_measure}
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 500"
                            className="text-xs py-2.5 rounded-xl font-mono font-bold pr-16 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                            value={receiveQty}
                            onChange={(e) => setReceiveQty(e.target.value)}
                            required
                          />
                          <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400 uppercase pointer-events-none">
                            {selectedItem?.unit_of_measure || 'UNIT'}
                          </span>
                        </div>
                      </div>

                      {/* Field 4: Pembungkusan */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          4. Pembungkusan (Packaging)
                        </label>

                        {/* Item's registered packaging - shown as a selectable card */}
                        {selectedItem?.packaging_description && (
                          <button
                            type="button"
                            onClick={() => { setReceivePackaging(selectedItem.packaging_description!); setReceivePackagingCustom('') }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                              receivePackaging === selectedItem.packaging_description && receivePackagingCustom === ''
                                ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                  {selectedItem.unit_of_measure?.toUpperCase()}
                                </p>
                                <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                                  {selectedItem.packaging_description}
                                </p>
                              </div>
                              {receivePackaging === selectedItem.packaging_description && receivePackagingCustom === '' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          </button>
                        )}

                        {/* Others option */}
                        <button
                          type="button"
                          onClick={() => setReceivePackaging('OTHERS')}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                            receivePackaging === 'OTHERS'
                              ? 'bg-amber-50 border-amber-400 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-700">Others (Lain-lain / Manual Input)</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Nyatakan pembungkusan berbeza secara manual</p>
                            </div>
                            {receivePackaging === 'OTHERS' && (
                              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Free-text Manual Input when Others is selected */}
                        {receivePackaging === 'OTHERS' && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 pt-0.5">
                            <Input
                              placeholder="Taip pembungkusan (cth: Pack of 10 x 50tabs / Pack of 1 x 30tabs)..."
                              className="text-xs py-2.5 rounded-xl border-amber-300 bg-white font-medium focus:border-amber-500 focus:ring-amber-500/20"
                              value={receivePackagingCustom}
                              onChange={(e) => setReceivePackagingCustom(e.target.value)}
                              autoFocus
                            />
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-medium px-1">
                              <span>💡 Contoh:</span>
                              <button
                                type="button"
                                onClick={() => setReceivePackagingCustom('Pack of 10 x 50tabs')}
                                className="text-amber-800 font-bold underline hover:text-amber-900"
                              >
                                Pack of 10 x 50tabs
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setReceivePackagingCustom('Pack of 1 x 30tabs')}
                                className="text-amber-800 font-bold underline hover:text-amber-900"
                              >
                                Pack of 1 x 30tabs
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Field 5: No. Batch */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-emerald-600" />
                          5. No. Batch <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. BT-2026-1275"
                          className="text-xs py-2.5 rounded-xl font-mono font-bold uppercase tracking-wider border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                          value={receiveBatchNum}
                          onChange={(e) => setReceiveBatchNum(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      {/* Field 6: Tarikh Luput */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          6. Tarikh Luput (Expiry Date)
                        </label>
                        <Input
                          type="date"
                          className="text-xs py-2.5 rounded-xl font-mono border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                          value={receiveExpiryDate}
                          onChange={(e) => setReceiveExpiryDate(e.target.value)}
                        />
                      </div>
                    </form>
                  </div>

                  {/* RIGHT COLUMN (COL 5): Live Summary & Receipt Verification Panel */}
                  <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800 relative overflow-hidden">
                      
                      {/* Background Glow Overlay */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                      {/* Panel Title */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Ringkasan Penerimaan</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Pratonton Masa-Nyata (Live Summary)</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5">
                          LIVE PREVIEW
                        </Badge>
                      </div>

                      {/* Target Item Name & Code */}
                      {selectedItem ? (
                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                            <span>{selectedItem.item_code}</span>
                            <span className="text-emerald-400 font-bold uppercase">{selectedItem.item_type === 'drug' ? 'UBAT' : 'BUKAN UBAT'}</span>
                          </div>
                          <p className="text-xs font-bold text-white leading-snug">{selectedItem.item_name}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic p-2">Pilih item untuk melihat ringkasan</div>
                      )}

                      {/* Stock Projection Live Calculation */}
                      <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50 space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projeksi Baki Stok</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-medium block">Baki Semasa</span>
                            <span className="text-sm font-black font-mono text-slate-200">
                              {activeLedgerStock}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">{selectedItem?.unit_of_measure}</span>
                          </div>

                          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/60">
                            <span className="text-[10px] text-emerald-400 font-medium block">+ Kuantiti Masuk</span>
                            <span className="text-sm font-black font-mono text-emerald-400">
                              + {parsedReceiveQty}
                            </span>
                            <span className="text-[10px] text-emerald-500/80 ml-1">{selectedItem?.unit_of_measure}</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 p-3 rounded-xl border border-emerald-800/80 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300">Jangkaan Baki Baru:</span>
                          <span className="text-base font-black font-mono text-emerald-300">
                            {projectedNewStock} <span className="text-xs font-normal text-emerald-400/80">{selectedItem?.unit_of_measure}</span>
                          </span>
                        </div>
                      </div>

                      {/* Delivery & Source Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">Sumber / Diterima:</span>
                          <span className="text-[11px] font-bold text-emerald-400 text-right truncate pl-2">
                            {resolvedSupplierName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">Pembungkusan:</span>
                          <span className="text-[11px] font-bold text-slate-200 font-mono">
                            {resolvedPackagingLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">No. Batch:</span>
                          <span className="text-[11px] font-bold text-amber-300 font-mono tracking-wider">
                            {receiveBatchNum || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">Tarikh Terima:</span>
                          <span className="text-[11px] font-bold text-emerald-300 font-mono">
                            {receiveDate || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">Tarikh Luput:</span>
                          <span className="text-[11px] font-bold text-slate-200 font-mono">
                            {receiveExpiryDate || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Ready Status Checklist */}
                      <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          {parsedReceiveQty > 0 && receiveBatchNum.trim() ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-bold text-emerald-300">Maklumat Lengkap</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="font-medium text-slate-400 text-[11px]">Lengkapkan Kuantiti & Batch</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">KEW.PS-4</span>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-500 font-medium hidden sm:block">
                  Item: <strong className="text-slate-800">{selectedItem?.item_name || '—'}</strong>
                </div>
                <div className="flex items-center gap-2.5 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReceiveModalOpen(false)}
                    className="rounded-xl text-xs font-bold px-4 py-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    form="receive-form"
                    disabled={isSubmittingReceive}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold px-6 py-2 shadow-md shadow-emerald-600/20 gap-1.5 transition-all"
                  >
                    {isSubmittingReceive ? <Spinner size="sm" /> : <><PlusCircle className="w-4 h-4" /> Simpan Penerimaan</>}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. ISSUING SLIDE-OVER DRAWER (SLICE FROM THE RIGHT) */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsIssueModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-5xl bg-white shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
              
              {/* Drawer Top Header Strip */}
              <div className="h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 shrink-0" />

              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-rose-50/50 to-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-md shadow-rose-500/20">
                    <MinusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Pengeluaran Stok (FEFO)</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Borang Agihan & Pengeluaran KEW.PS-4</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Scrollable 2-Column Grid Layout) */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN (COL 7): Input Form */}
                  <div className="lg:col-span-7 space-y-5">
                    {selectedItem && (
                      <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 space-y-2 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-rose-900 pointer-events-none">
                          <PackageMinus className="w-24 h-24" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-rose-800 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-rose-600" /> Item Target</span>
                          <Badge variant="outline" className="font-mono text-[10px] bg-white/80 border-rose-300 font-bold">
                            {selectedItem.item_code}
                          </Badge>
                        </div>
                        <p className="text-sm font-black text-slate-900 leading-snug">{selectedItem.item_name}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium pt-1 border-t border-rose-200/50">
                          <span>Baki Semasa: <strong className="text-rose-700 font-mono font-bold">{activeLedgerStock} {selectedItem.unit_of_measure}</strong></span>
                          <span>•</span>
                          <span>Kategori: <strong className="uppercase font-bold text-slate-700">{selectedItem.item_type === 'drug' ? 'Ubat' : 'Bukan Ubat'}</strong></span>
                        </div>
                      </div>
                    )}

                    {issueStatus && (
                      <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm transition-all ${
                        issueStatus.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                        {issueStatus.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />}
                        <span>{issueStatus.text}</span>
                      </div>
                    )}

                    <form id="issue-form" onSubmit={handleIssueSubmit} className="space-y-5 text-xs">
                      
                      {/* Field 1: Mod & Pilih Batch */}
                      <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/90">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-rose-600" />
                            1. Mod Pengeluaran Batch <span className="text-rose-500">*</span>
                          </label>
                          {itemBatches.length > 1 && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-mono text-[9px] font-bold">
                              {itemBatches.length} BATCH AKTIF
                            </Badge>
                          )}
                        </div>

                        {/* Mode Segmented Selector */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setIssueMode('single')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              issueMode === 'single'
                                ? 'bg-white text-rose-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Satu Batch (Single Batch)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIssueMode('multi')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              issueMode === 'multi'
                                ? 'bg-white text-rose-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Pelbagai Batch (Multi-Batch FEFO)</span>
                          </button>
                        </div>

                        {issueMode === 'single' ? (
                          <div className="space-y-3 pt-1">
                            {isLoadingBatches ? (
                              <div className="p-3 text-center"><Spinner size="sm" /></div>
                            ) : itemBatches.length === 0 ? (
                              <div className="p-3.5 text-xs text-rose-600 font-bold bg-rose-50 rounded-2xl border border-rose-200">
                                Tiada batch aktif dengan baki stok ditemui untuk item ini.
                              </div>
                            ) : (
                              <Select
                                className="text-xs py-2.5 rounded-xl font-mono font-bold"
                                value={issueSelectedBatchId}
                                onChange={(e) => setIssueSelectedBatchId(e.target.value)}
                              >
                                {itemBatches.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.batch_number} — [Baki: {Math.min(b.quantity_on_hand || 0, activeLedgerStock)} {b.packaging || selectedItem?.unit_of_measure || 'PACK'}] (Exp: {b.expiry_date ? new Date(b.expiry_date).toISOString().split('T')[0] : 'Tiada Exp'})
                                  </option>
                                ))}
                              </Select>
                            )}

                            {issueSelectedBatchId && (
                              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-lg border border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="text-[10px] font-black tracking-wider text-teal-400 uppercase">Detail Batch (Auto-Follow)</span>
                                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono text-[9px] font-bold">ACTIVE BATCH</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block">Tarikh Luput:</span>
                                    <span className="font-mono font-black text-amber-300">{issueBatchExpiry}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block">Pembungkusan:</span>
                                    <span className="font-mono font-black text-teal-300 uppercase">{issueBatchPackaging}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold block">Baki Tersedia:</span>
                                    <span className="font-mono font-black text-emerald-400">{issueBatchAvailableQty}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* MULTI-BATCH ALLOCATION MODE */
                          <div className="space-y-3 pt-1">
                            {/* FEFO Quick Auto-Fill Bar */}
                            <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/90 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-purple-900 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Agihan FEFO Otomatik (Auto-Split):
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Taip jumlah kuantiti hendak dikeluarkan..."
                                  className="text-xs py-2 rounded-xl border-purple-200 bg-white font-mono font-bold"
                                  value={autoFefoTargetQty}
                                  onChange={(e) => {
                                    setAutoFefoTargetQty(e.target.value)
                                    handleAutoFefo(e.target.value)
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={() => handleAutoFefo(autoFefoTargetQty)}
                                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2 px-3 rounded-xl shrink-0 shadow-sm"
                                >
                                  Agih FEFO
                                </Button>
                              </div>
                              <p className="text-[10px] text-purple-700 font-medium">
                                Melakukan agihan stok secara automatik mengikut susunan luput terawal (FEFO).
                              </p>
                            </div>

                            {/* Batch Allocation Rows */}
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {itemBatches.map((b, idx) => {
                                const avail = Math.min((b.quantity_on_hand || 0) - (b.quantity_reserved || 0), activeLedgerStock)
                                const currentQtyVal = multiBatchQtys[b.id] || ''
                                return (
                                  <div 
                                    key={b.id} 
                                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                                      parseInt(currentQtyVal, 10) > 0 
                                        ? 'bg-rose-50/60 border-rose-300 shadow-sm' 
                                        : 'bg-white border-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                          #{idx + 1} {b.batch_number}
                                        </span>
                                        {idx === 0 && (
                                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] font-bold">
                                            EXP TERAWAL
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                                        Baki: <strong className="text-emerald-700">{avail}</strong> {b.packaging || selectedItem?.unit_of_measure || 'PACK'}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-12 gap-2 items-center">
                                      <div className="col-span-7 text-[10px] text-slate-500 font-medium flex items-center gap-2">
                                        <span>Exp: <strong className="font-mono text-slate-700">{b.expiry_date ? new Date(b.expiry_date).toISOString().split('T')[0] : '—'}</strong></span>
                                      </div>
                                      <div className="col-span-5">
                                        <Input
                                          type="number"
                                          min="0"
                                          max={avail}
                                          placeholder={`Max: ${avail}`}
                                          className="text-xs py-1.5 rounded-lg font-mono font-bold text-right border-slate-200 focus:border-rose-500"
                                          value={multiBatchQtys[b.id] || ''}
                                          onChange={(e) => {
                                            setMultiBatchQtys(prev => ({
                                              ...prev,
                                              [b.id]: e.target.value
                                            }))
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Field 2: Tarikh Keluar / Pengeluaran */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-600" />
                          2. Tarikh Keluar / Pengeluaran (Date Issued) <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          className="text-xs py-2.5 rounded-xl font-mono border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Field 3: Kuantiti Keluar */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <PackageMinus className="w-3.5 h-3.5 text-rose-600" />
                            3. Kuantiti Keluar <span className="text-rose-500">*</span>
                          </span>
                          {issueMode === 'single' && issueSelectedBatchId && (
                            <span className="text-[10px] text-rose-700 font-mono font-bold">
                              Max: {issueBatchAvailableQty}
                            </span>
                          )}
                        </label>
                        {issueMode === 'multi' ? (
                          <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                            <span className="text-[11px] text-slate-400 font-bold">Jumlah Kuantiti Agihan Multi-Batch:</span>
                            <span className="text-base font-black text-rose-400">{parsedIssueQty} <span className="text-xs font-normal text-slate-400">{selectedItem?.unit_of_measure}</span></span>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              max={issueBatchAvailableQty || undefined}
                              placeholder={issueSelectedBatchId ? `Masukkan kuantiti (Max: ${issueBatchAvailableQty})` : "Sila pilih batch terlebih dahulu"}
                              className="text-xs py-2.5 rounded-xl font-mono font-bold pr-16 border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                              value={issueQty}
                              onChange={(e) => setIssueQty(e.target.value)}
                              required={issueMode === 'single'}
                              disabled={!issueSelectedBatchId}
                            />
                            <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400 uppercase pointer-events-none">
                              {issueBatchPackaging || selectedItem?.unit_of_measure || 'UNIT'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Field 4: Jabatan / Wad Penerima / Fasiliti */}
                      <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-rose-600" />
                            4. Jabatan / Wad Penerima <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal normal-case">Pilih destinasi agihan</span>
                        </label>

                        {/* Segmented Recipient Type Selector */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setIssueRecipientType('internal')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              issueRecipientType === 'internal'
                                ? 'bg-white text-rose-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Dalam Hospital (Internal)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIssueRecipientType('facility')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                              issueRecipientType === 'facility'
                                ? 'bg-white text-rose-700 shadow-sm border border-slate-200/50'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span>Fasiliti Lain (Other Facility)</span>
                          </button>
                        </div>

                        {/* Dynamic Recipient Inputs */}
                        {issueRecipientType === 'internal' ? (
                          <div className="space-y-2 pt-1">
                            <Select
                              className="text-xs py-2.5 rounded-xl border-slate-200 bg-white font-medium focus:border-rose-500 focus:ring-rose-500/20"
                              value={issueInternalDept}
                              onChange={(e) => setIssueInternalDept(e.target.value)}
                            >
                              {HOSPITAL_DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                              {/* Include database stock locations if not already present in HOSPITAL_DEPARTMENTS */}
                              {locations
                                .filter(loc => !HOSPITAL_DEPARTMENTS.includes(loc.location_name))
                                .map(loc => (
                                  <option key={loc.id} value={loc.location_name}>{loc.location_name}</option>
                                ))
                              }
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1 relative">
                            <div className="relative">
                              <Input
                                placeholder="Taip cth: Sipitang / Limbang / Beaufort / Papar..."
                                className="text-xs py-2.5 rounded-xl border-slate-200 bg-white font-medium focus:border-rose-500 focus:ring-rose-500/20 pr-8"
                                value={issueFacilityName}
                                onChange={(e) => {
                                  setIssueFacilityName(e.target.value)
                                  setIssueFacilitySearchFocused(true)
                                }}
                                onFocus={() => setIssueFacilitySearchFocused(true)}
                              />
                              {issueFacilityName && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIssueFacilityName('')
                                    setIssueFacilitySearchFocused(false)
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Dynamic Autocomplete Search Dropdown */}
                            {issueFacilitySearchFocused && issueFacilityName.trim().length >= 1 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in duration-150">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                                  <span>Fasiliti Kesihatan KKM ({filteredIssueFacilities.length})</span>
                                  <span>Carian: "{issueFacilityName}"</span>
                                </div>

                                {filteredIssueFacilities.length > 0 ? (
                                  filteredIssueFacilities.map((fac, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setIssueFacilityName(fac.name)
                                        setIssueFacilitySearchFocused(false)
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50/80 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <p className="text-xs font-bold text-slate-800 group-hover:text-rose-800 truncate">
                                          {fac.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                          <span className="font-bold text-rose-700">{fac.type}</span>
                                          <span>•</span>
                                          <span>Daerah {fac.district}, {fac.state}</span>
                                        </p>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600 shrink-0" />
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-3 text-center space-y-1">
                                    <p className="text-xs text-slate-600 font-medium">Tiada fasiliti ditemui untuk "{issueFacilityName}"</p>
                                    <button
                                      type="button"
                                      onClick={() => setIssueFacilitySearchFocused(false)}
                                      className="text-[11px] text-rose-700 font-bold hover:underline"
                                    >
                                      Gunakan "{issueFacilityName}" sebagai nama fasiliti
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Field 5: Tujuan / Catatan */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          5. Tujuan / Catatan (Tujuan Khas)
                        </label>
                        <Input
                          placeholder="e.g. Agihan stok mingguan wad"
                          className="text-xs py-2.5 rounded-xl border-slate-200 focus:border-rose-500 focus:ring-rose-500/20"
                          value={issueReason}
                          onChange={(e) => setIssueReason(e.target.value)}
                        />
                      </div>
                    </form>
                  </div>

                  {/* RIGHT COLUMN (COL 5): Live Summary & Issue Verification Panel */}
                  <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800 relative overflow-hidden">
                      
                      {/* Background Glow Overlay */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                      {/* Panel Title */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Ringkasan Pengeluaran</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Pratonton Masa-Nyata (Live Summary)</p>
                          </div>
                        </div>
                        <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold px-2 py-0.5">
                          LIVE PREVIEW
                        </Badge>
                      </div>

                      {/* Target Item Name & Code */}
                      {selectedItem ? (
                        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                            <span>{selectedItem.item_code}</span>
                            <span className="text-rose-400 font-bold uppercase">{selectedItem.item_type === 'drug' ? 'UBAT' : 'BUKAN UBAT'}</span>
                          </div>
                          <p className="text-xs font-bold text-white leading-snug">{selectedItem.item_name}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic p-2">Pilih item untuk melihat ringkasan</div>
                      )}

                      {/* Stock Projection Live Calculation */}
                      <div className="bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50 space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projeksi Baki Stok</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-medium block">Baki Semasa</span>
                            <span className="text-sm font-black font-mono text-slate-200">
                              {activeLedgerStock}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">{selectedItem?.unit_of_measure}</span>
                          </div>

                          <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60">
                            <span className="text-[10px] text-rose-400 font-medium block">- Kuantiti Keluar</span>
                            <span className="text-sm font-black font-mono text-rose-400">
                              - {parsedIssueQty}
                            </span>
                            <span className="text-[10px] text-rose-500/80 ml-1">{issueBatchPackaging || selectedItem?.unit_of_measure}</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-rose-950/80 to-slate-900/80 p-3 rounded-xl border border-rose-800/80 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300">Jangkaan Baki Baru:</span>
                          <span className="text-base font-black font-mono text-rose-300">
                            {projectedNewStockAfterIssue} <span className="text-xs font-normal text-rose-400/80">{selectedItem?.unit_of_measure}</span>
                          </span>
                        </div>
                      </div>

                      {/* Delivery & Source Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">Penerima / Destinasi:</span>
                          <span className="text-[11px] font-bold text-rose-400 text-right truncate pl-2">
                            {resolvedIssueRecipientName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">Tarikh Keluar / Agihan:</span>
                          <span className="text-[11px] font-bold text-rose-300 font-mono">
                            {issueDate || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">No. Batch Keluar:</span>
                          <span className="text-[11px] font-bold text-amber-300 font-mono tracking-wider">
                            {itemBatches.find(b => b.id === issueSelectedBatchId)?.batch_number || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] font-medium text-slate-400">Tarikh Luput Batch:</span>
                          <span className="text-[11px] font-bold text-slate-200 font-mono">
                            {issueBatchExpiry || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Ready Status Checklist */}
                      <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          {parsedIssueQty > 0 && issueSelectedBatchId && resolvedIssueRecipientName !== 'Belum dimasukkan' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-bold text-emerald-300">Maklumat Lengkap</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="font-medium text-slate-400 text-[11px]">Lengkapkan Kuantiti, Batch & Destinasi</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">KEW.PS-4</span>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-500 font-medium hidden sm:block">
                  Item: <strong className="text-slate-800">{selectedItem?.item_name || '—'}</strong>
                </div>
                <div className="flex items-center gap-2.5 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="rounded-xl text-xs font-bold px-4 py-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    form="issue-form"
                    disabled={isSubmittingIssue || !issueSelectedBatchId || itemBatches.length === 0}
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold px-6 py-2 shadow-md shadow-rose-600/20 gap-1.5 transition-all"
                  >
                    {isSubmittingIssue ? <Spinner size="sm" /> : <><MinusCircle className="w-4 h-4" /> Simpan Pengeluaran</>}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PASSWORD PROTECTION MODAL FOR PINDA BUTTON */}
      <Modal
        isOpen={isPassModalOpen}
        onClose={() => {
          setIsPassModalOpen(false)
          setPendingEditRow(null)
          setPassInput('')
          setPassError(null)
        }}
        title="Pengesahan Kata Laluan Kebenaran Pindaan"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-amber-300">Zon Akses Terkawal</h4>
                <p className="text-[10px] text-slate-400 font-medium">Memerlukan kebenaran Pegawai / Penyelia Stor Farmasi</p>
              </div>
            </div>
            {pendingEditRow && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Rekod #{pendingEditRow.index}:</span>
                <span className="font-bold text-teal-400">{formatReferenceNumber(pendingEditRow)}</span>
              </div>
            )}
          </div>

          {passError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Masukkan Kata Laluan Kebenaran <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                className="text-xs py-2.5 rounded-xl font-mono font-bold tracking-widest border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                value={passInput}
                onChange={(e) => {
                  setPassInput(e.target.value)
                  setPassError(null)
                }}
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPassModalOpen(false)}
                className="rounded-xl text-xs py-2 px-3 font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Disahkan & Teruskan
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* EDIT TRANSACTION MODAL (PINDAAN REKOD WITH MANDATORY AUDIT PROOF) */}
      <Modal
        isOpen={isEditTxModalOpen}
        onClose={() => {
          setIsEditTxModalOpen(false)
          setEditingTxRow(null)
          setEditTxStatus(null)
        }}
        title="Pindaan & Pembetulan Rekod KEW.PS-4"
      >
        {editingTxRow && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase">Rekod Sasaran #{editingTxRow.index}</span>
                <Badge className="bg-amber-200 text-amber-900 border-amber-300 font-bold text-[9px]">
                  {editingTxRow.receiptQty !== null ? 'PENERIMAAN' : 'PENGELUARAN'}
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-900">{selectedItem?.item_name || 'Item Store'}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
                <span>No Rujukan: <strong className="text-teal-700">{formatReferenceNumber(editingTxRow)}</strong></span>
                <span>•</span>
                <span>Baki Asal: <strong>{editingTxRow.receiptQty !== null ? `+${editingTxRow.receiptQty}` : `-${editingTxRow.issueQty}`}</strong></span>
              </div>
              {editingTxRow.received_from && (
                <div className="pt-1.5 border-t border-amber-200/60 text-[10px] text-amber-900 font-medium flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Pembekal/Sumber Semasa: <strong className="font-bold">{editingTxRow.received_from.replace(/^(Pembekal|Fasiliti):\s*/i, '')}</strong></span>
                </div>
              )}
            </div>

            {editTxStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                editTxStatus.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {editTxStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{editTxStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveTransactionEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  1. Tarikh Rekod (Date) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  className="text-xs py-2 rounded-xl font-mono"
                  value={editTxDate}
                  onChange={(e) => setEditTxDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  2. Kuantiti Transaksi <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  className="text-xs py-2 rounded-xl font-mono font-bold"
                  value={editTxQty}
                  onChange={(e) => setEditTxQty(e.target.value)}
                  required
                />
              </div>

              {/* FIELD 3: PEMBEKAL / SUMBER STOK (ALLOW CHANGE SUPPLIER) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-600" />
                    3. Pembekal / Sumber Stok (Supplier) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold">Tukar Pembekal</span>
                </label>

                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditTxSourceType('supplier')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        editTxSourceType === 'supplier'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Syarikat Pembekal (Vendor)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTxSourceType('facility')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        editTxSourceType === 'facility'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fasiliti KKM / Pindahan
                    </button>
                  </div>

                  {editTxSourceType === 'supplier' ? (
                    <div className="space-y-1.5">
                      <Select
                        className="text-xs py-2 rounded-xl border-slate-200 bg-white"
                        value={editTxSupplierId}
                        onChange={(e) => setEditTxSupplierId(e.target.value)}
                      >
                        {suppliersList.map((supp) => (
                          <option key={supp.id} value={supp.id}>
                            {supp.company_name} ({supp.supplier_code || supp.id})
                          </option>
                        ))}
                        <option value="CUSTOM">+ Pembekal Lain (Manual)</option>
                      </Select>

                      {editTxSupplierId === 'CUSTOM' && (
                        <Input
                          placeholder="Taip nama pembekal (cth: Pharmaniaga / Apex Pharmacy / Pembekal Tempatan)..."
                          className="text-xs py-2 rounded-xl border-teal-300 bg-white font-medium focus:border-teal-500"
                          value={editTxCustomSupplier}
                          onChange={(e) => setEditTxCustomSupplier(e.target.value)}
                          required
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      placeholder="Taip nama fasiliti KKM (cth: KK Sipitang / Hospital Tuanku Ja'afar)..."
                      className="text-xs py-2 rounded-xl border-slate-200 bg-white"
                      value={editTxFacilityName}
                      onChange={(e) => setEditTxFacilityName(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  4. No. Rujukan Dokumen
                </label>
                <Input
                  className="text-xs py-2 rounded-xl font-mono font-bold uppercase"
                  value={editTxRefNum}
                  onChange={(e) => setEditTxRefNum(e.target.value)}
                />
              </div>

              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
                <label className="block text-[11px] font-bold text-rose-900 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  5. Sebab Pindaan / Bukti Audit (Mandatory Justification) <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Taip sebab pindaan (cth: Pertukaran pembekal mengikut DO / Kesilapan taip kuantiti)..."
                  className="text-xs py-2.5 rounded-xl border-rose-300 bg-white font-medium focus:border-rose-500"
                  value={editTxReason}
                  onChange={(e) => setEditTxReason(e.target.value)}
                  required
                />
                <p className="text-[10px] text-rose-700 font-medium">
                  Sebab pindaan ini akan disimpan secara kekal dalam Log Audit KEW.PS-4 sebagai bukti periksa untuk pegawai juruaudit.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTxModalOpen(false)}
                  className="rounded-xl text-xs py-2 px-3"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEditTx}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md gap-1"
                >
                  {isSubmittingEditTx ? <Spinner size="sm" /> : <><Pencil className="w-3.5 h-3.5" /> Simpan Pindaan</>}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* AUDIT LOG PROOF HISTORY MODAL */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false)
          setAuditTxRow(null)
        }}
        title="Sejarah Pindaan & Bukti Audit (Audit Log Trail)"
      >
        {auditTxRow && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1 font-mono">
              <div className="flex items-center justify-between text-[10px] text-teal-400 font-bold">
                <span>REKOD #{auditTxRow.index}</span>
                <span>{formatReferenceNumber(auditTxRow)}</span>
              </div>
              <p className="text-xs font-bold">{selectedItem?.item_name}</p>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {((auditLogStore[auditTxRow.id || `row-${auditTxRow.index}`]) || []).map((entry, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      {entry.edited_by}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleString('ms-MY')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Perubahan Dibuat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.field_changes.map((ch, cIdx) => (
                        <Badge key={cIdx} className="bg-amber-100 text-amber-900 border-amber-300 font-mono text-[10px] font-bold">
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Sebab Pindaan / Bukti Audit:</span>
                    <p className="text-xs font-bold text-slate-900 bg-white p-2 rounded-xl border border-slate-200 mt-1 italic">
                      "{entry.reason}"
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAuditModalOpen(false)}
                className="rounded-xl text-xs py-2 px-4 font-bold"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CLEAR LEDGER DATA CONFIRMATION MODAL */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => {
          if (!isSubmittingClear) {
            setIsClearModalOpen(false)
            setClearStatus(null)
            setClearPasswordInput('')
          }
        }}
        title="Set Semula / Padam Transaksi Ledger (KEW.PS-4)"
      >
        <form onSubmit={handleClearSubmit} className="space-y-4 text-xs">
          {clearStatus && (
            <div className={`p-3 rounded-xl border text-xs font-bold ${
              clearStatus.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              {clearStatus.text}
            </div>
          )}

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Lock className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span>Pengesahan Pemadaman Rekod & Set Semula Baki</span>
            </div>
            <p className="text-amber-800 text-xs leading-relaxed">
              Tindakan ini dilindungi. Memerlukan kata laluan kebenaran khas untuk menetapkan semula pergerakan stok. Semua tindakan set semula akan direkodkan dalam <strong>Log Audit Khas</strong> secara kekal.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Pilih Skop Set Semula:
            </label>
            
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                clearScope === 'selected' ? 'bg-amber-50/60 border-amber-400 text-amber-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="clearScope"
                  value="selected"
                  checked={clearScope === 'selected'}
                  onChange={() => setClearScope('selected')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-black text-xs block">
                    1. Item Ini Sahaja ({selectedItem?.item_name || 'Item Terpilih'})
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Memadam transaksi dan menetapkan semula baki stok bagi <strong>{selectedItem?.item_code}</strong> sahaja kepada 0. Item lain tidak terjejas.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                clearScope === 'all' ? 'bg-rose-50/60 border-rose-400 text-rose-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="clearScope"
                  value="all"
                  checked={clearScope === 'all'}
                  onChange={() => setClearScope('all')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-black text-xs block text-rose-900">
                    2. Keseluruhan Inventori Stor (Semua Item)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Memadam semua transaksi ledger untuk keseluruhan stor hospital dan menetapkan semula baki stok semua item kepada 0.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* MANDATORY PASSWORD FIELD */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
            <label className="block text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Kata Laluan Kebenaran (Authorization Password) <span className="text-rose-400">*</span>
            </label>
            <Input
              type="password"
              placeholder="Masukkan kata laluan kebenaran (F@rmasi.2016)..."
              className="text-sm py-2.5 rounded-xl bg-slate-800 text-white border-slate-700 font-mono font-bold focus:border-amber-400"
              value={clearPasswordInput}
              onChange={(e) => setClearPasswordInput(e.target.value)}
              required
            />
            <span className="text-[10px] text-slate-400 block">
              Sila masukkan kata laluan kebenaran khas untuk mengesahkan pemadaman rekod ledger.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsClearModalOpen(false)
                setClearPasswordInput('')
              }}
              disabled={isSubmittingClear}
              className="rounded-xl text-xs py-2 px-3"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingClear}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2 px-4 rounded-xl shadow-md gap-1.5"
            >
              {isSubmittingClear ? <Spinner size="sm" /> : <><Lock className="w-3.5 h-3.5" /> Disahkan & Set Semula Ledger</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESET LEDGER AUDIT TRAIL MODAL */}
      <Modal
        isOpen={isResetAuditModalOpen}
        onClose={() => setIsResetAuditModalOpen(false)}
        title="Sejarah Log Audit Set Semula Ledger (KEW.PS-4 Reset Trail)"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
              <span>REKOD KESELAMATAN & AUDIT</span>
              <span>{resetAuditLogs.length} Log Direkodkan</span>
            </div>
            <p className="text-xs text-slate-300">
              Setiap kali butang Set Semula Ledger digunakan dengan kata laluan kebenaran, rekod pemadaman disimpan secara kekal di bawah.
            </p>
          </div>

          {resetAuditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">Tiada Rekod Set Semula Ledger</p>
              <p className="text-[11px]">Tiada sebarang pemadaman transaksi dilakukan lagi.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {resetAuditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 relative">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      {log.performed_by}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString('ms-MY', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Skop Pemadaman:</span>
                      <span className="font-bold text-slate-800">{log.scope}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Baki Sebelum Reset:</span>
                      <span className="font-bold text-amber-700">{log.previous_balance}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[9px] font-bold">
                      ✓ Password "F@rmasi.2016" Verified
                    </Badge>
                    <span className="text-[9px] font-bold text-rose-600 uppercase font-mono">
                      STATUS: BAKI DI-RESET KE 0
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetAuditModalOpen(false)}
              className="rounded-xl text-xs py-2 px-4 font-bold"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT STOCK PARAMETERS & LOCATION SLIDE-OVER DRAWER (SLIDES FROM RIGHT) */}
      <AnimatePresence>
        {isEditStockModalOpen && (
          <div className="fixed inset-0 z-[300] overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setIsEditStockModalOpen(false)}
            />

            {/* Slide-over Panel (Wider max-w-2xl) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200 z-[310]"
            >
              {/* Drawer Header */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white p-6 flex items-center justify-between border-b border-slate-800 shrink-0 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/40 text-[10px] uppercase font-bold tracking-wider">
                      KEW.PS-4 MANAGEMENT
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">Panel Kemaskini</span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-teal-400" />
                    <span>Kemaskini Tetapan Lokasi & Paras Stok</span>
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditStockModalOpen(false)}
                  className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors relative z-10 cursor-pointer"
                  title="Tutup Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* Active Item Spotlight Card */}
                {selectedItem && (
                  <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-teal-400 font-black text-sm bg-teal-950 px-2.5 py-1 rounded-lg border border-teal-800">
                          {selectedItem.item_code}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                          selectedItem.item_type === 'drug'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {selectedItem.item_type === 'drug' ? 'UBAT' : 'BUKAN UBAT'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-slate-300 border-slate-700 font-mono text-xs font-bold">
                        UOM: {selectedItem.unit_of_measure}
                      </Badge>
                    </div>

                    <h3 className="font-black text-base md:text-lg text-slate-100 leading-snug">
                      {selectedItem.item_name}
                    </h3>
                  </div>
                )}

                {editStockStatus && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                    editStockStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm'
                      : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-sm'
                  }`}>
                    {editStockStatus.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{editStockStatus.text}</span>
                  </div>
                )}

                <form id="edit-stock-drawer-form" onSubmit={handleEditStockSubmit} className="space-y-6">
                  
                  {/* SECTION 1: PHYSICAL LOCATION CONTROLS */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <MapPin className="w-4.5 h-4.5 text-indigo-600" />
                        <span>1. Lokasi Fizikal Stok (Stor, Rak & Aras)</span>
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Susunan Stor</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Store Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-700 uppercase">
                          Stor / Jabatan
                        </label>
                        <Select
                          className="text-xs py-2.5 rounded-xl font-bold bg-white border-slate-300 shadow-2xs"
                          value={editStore}
                          onChange={(e) => setEditStore(e.target.value)}
                        >
                          <option value="Main Freezer">Main Freezer (LOG-MF-001 - Ubat)</option>
                          <option value="Stor Logistik (Bukan Ubat)">Stor Logistik (LOG-SL-001 - Bukan Ubat)</option>
                          <option value="Stor Logistik (Ubat)">Stor Logistik (LOG-SL-002 - Ubat)</option>
                          <option value="Top Loading">Top Loading (LOG-TL-001 - Ubat)</option>
                          {officialStoreLocations
                            .filter(l => !['LOG-MF-001', 'LOG-SL-001', 'LOG-SL-002', 'LOG-TL-001'].includes(l.location_code) && !['Main Freezer', 'Top Loading'].includes(l.store_name))
                            .map(l => (
                              <option key={l.id} value={l.store_name}>
                                {l.store_name} ({l.location_code || l.id})
                              </option>
                            ))}
                        </Select>
                      </div>

                      {/* Rack Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-700 uppercase">
                          No. Rak / Kabinet
                        </label>
                        <Select
                          className="text-xs py-2.5 rounded-xl font-bold bg-white border-slate-300 shadow-2xs"
                          value={editRack}
                          onChange={(e) => setEditRack(e.target.value)}
                        >
                          {availableRacks.map(rackName => (
                            <option key={rackName} value={rackName}>{rackName}</option>
                          ))}
                        </Select>
                      </div>

                      {/* Level Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-slate-700 uppercase">
                          Aras / Tingkat (Shelf)
                        </label>
                        <Select
                          className="text-xs py-2.5 rounded-xl font-bold bg-white border-slate-300 shadow-2xs"
                          value={editLevel}
                          onChange={(e) => setEditLevel(e.target.value)}
                        >
                          {availableLevels.map(levelName => (
                            <option key={levelName} value={levelName}>{levelName}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    {/* Live Location Preview Card */}
                    <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Paparan Format Lokasi Rasmi:</span>
                      <span className="font-mono text-xs font-black text-indigo-950 bg-white px-3 py-1.5 rounded-xl border border-indigo-200/80 shadow-2xs">
                        📍 {computedFullLocation}
                      </span>
                    </div>
                  </div>

                  {/* SECTION 2: STOCK LEVEL THRESHOLDS */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                        <SlidersHorizontal className="w-4.5 h-4.5 text-teal-600" />
                        <span>2. Ambang & Paras Stok (Min, Buffer & Max)</span>
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Unit: {selectedItem?.unit_of_measure || 'Unit'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Min Stock Card */}
                      <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Paras Min (Min Stock)</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs"></span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          className="text-base py-2 rounded-xl bg-white border-rose-300 font-mono font-black text-rose-950 focus:border-rose-500 focus:ring-rose-400"
                          value={editMinStock}
                          onChange={(e) => setEditMinStock(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-rose-700 font-semibold block leading-snug">
                          Kuantiti amaran minima untuk pencetus perolehan.
                        </span>
                      </div>

                      {/* Buffer Stock Card */}
                      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Stok Buffer (Reorder)</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs"></span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          className="text-base py-2 rounded-xl bg-white border-amber-300 font-mono font-black text-amber-950 focus:border-amber-500 focus:ring-amber-400"
                          value={editBufferStock}
                          onChange={(e) => setEditBufferStock(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-amber-800 font-semibold block leading-snug">
                          Simpanan buffer keselamatan tambahan stor.
                        </span>
                      </div>

                      {/* Max Stock Card */}
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Paras Max (Max Stock)</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          className="text-base py-2 rounded-xl bg-white border-emerald-300 font-mono font-black text-emerald-950 focus:border-emerald-500 focus:ring-emerald-400"
                          value={editMaxStock}
                          onChange={(e) => setEditMaxStock(e.target.value)}
                          required
                        />
                        <span className="text-[10px] text-emerald-800 font-semibold block leading-snug">
                          Had maksimum simpanan keatas ubat/stok.
                        </span>
                      </div>
                    </div>
                  </div>
                </form>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditStockModalOpen(false)}
                  disabled={isSubmittingEditStock}
                  className="rounded-2xl text-xs py-2.5 px-5 font-bold border-slate-300 hover:bg-slate-100"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  form="edit-stock-drawer-form"
                  disabled={isSubmittingEditStock}
                  className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-xs py-2.5 px-6 rounded-2xl shadow-lg gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {isSubmittingEditStock ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default KewPs4LedgerPage
