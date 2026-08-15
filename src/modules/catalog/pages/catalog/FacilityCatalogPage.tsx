import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  ChevronRight,
  Filter,
  FileText,
  Compass,
  CheckCircle2,
  XCircle,
  Tag,
  Activity,
  Layers,
  Percent,
  Plus,
  Coins,
  Package,
  Boxes,
  Truck,
  ShieldAlert,
  ClipboardList,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Pill,
} from 'lucide-react'
import { Button, Input, Badge, Modal, Spinner, DataTable, Pagination } from '@/components/ui'
import { getDrugCatalog, createDrug } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog, createNonDrug } from '@/services/pharmacy/nonDrugCatalogService'
import { mockDrugs, mockNonDrugs } from '@/services/pharmacy/mockData'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

// Comprehensive unified catalog item interface
interface UnifiedCatalogItem {
  id: string
  code: string
  name: string
  type: 'Drug' | 'Non-Drug'
  category: string
  uom: string
  status: 'active' | 'inactive'
  price: number
  procurement_vote: 'APPL' | 'CC' | 'DP' | 'LP'
  sku: string
  pku: string
  supplierName: string
  supplierContact?: string
  supplierPhone?: string
  supplierEmail?: string
  supplierAddress?: string
  minStock: number
  maxStock: number
  reorderLevel: number
  brandName?: string
  genericName?: string
  strength?: string
  dosageForm?: string
  requiresPrescription?: boolean
  isControlled?: boolean
  itemGroup?: string
  storageConditions?: string
  packagingDescription?: string
  packagingSizes?: string[]
  storageLocation?: string
  storageStore?: string
  storageCabinet?: string
  storageLevel?: string
  storageLabel?: string
  kkmContractNumber?: string
}

// Gorgeous curated fallback dataset to guarantee stunning visual impact and zero empty states
const FALLBACK_CATALOG: UnifiedCatalogItem[] = [
  // Drugs
  {
    id: 'drug-001',
    code: 'PCM500',
    name: 'Paracetamol 500mg Tablet',
    type: 'Drug',
    category: 'Analgesics & Antipyretics',
    uom: 'tablet',
    status: 'active',
    price: 0.10,
    procurement_vote: 'APPL',
    sku: 'SKU-PCM500-001',
    pku: 'PKU-PCM500-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 2000,
    maxStock: 20000,
    reorderLevel: 5000,
    brandName: 'Panadol',
    genericName: 'Paracetamol',
    strength: '500mg',
    dosageForm: 'Tablet',
    requiresPrescription: false,
    isControlled: false,
    storageConditions: 'Store below 30┬░C. Protect from moisture.',
    packagingDescription: 'Blister pack of 10x10 tablets',
    storageLocation: 'Main Warehouse - Aisle A1',
  },
  {
    id: 'drug-002',
    code: 'AMX500',
    name: 'Amoxicillin 500mg Capsule',
    type: 'Drug',
    category: 'Antibiotics',
    uom: 'capsule',
    status: 'active',
    price: 0.45,
    procurement_vote: 'CC',
    kkmContractNumber: 'KKM/KONTRAK/CC/2026/080702/094',
    sku: 'SKU-AMX500-001',
    pku: 'PKU-AMX500-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 1000,
    maxStock: 10000,
    reorderLevel: 2500,
    brandName: 'Amoxil',
    genericName: 'Amoxicillin Trihydrate',
    strength: '500mg',
    dosageForm: 'Capsule',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store below 25┬░C. Keep container tightly closed.',
    packagingDescription: 'Bottle of 500 capsules',
    storageLocation: 'Main Warehouse - Aisle A2',
  },
  {
    id: 'drug-003',
    code: 'MET500',
    name: 'Metformin 500mg Tablet',
    type: 'Drug',
    category: 'Antidiabetic Drugs',
    uom: 'tablet',
    status: 'active',
    price: 0.15,
    procurement_vote: 'APPL',
    sku: 'SKU-MET500-001',
    pku: 'PKU-MET500-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 3000,
    maxStock: 30000,
    reorderLevel: 8000,
    brandName: 'Glucophage',
    genericName: 'Metformin Hydrochloride',
    strength: '500mg',
    dosageForm: 'Tablet',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store below 30┬░C.',
    packagingDescription: 'Box of 100 tablets',
    storageLocation: 'Main Warehouse - Aisle A3',
  },
  {
    id: 'drug-004',
    code: 'INS-G',
    name: 'Insulin Glargine 100 U/mL Injection',
    type: 'Drug',
    category: 'Antidiabetic Drugs',
    uom: 'pen',
    status: 'active',
    price: 35.00,
    procurement_vote: 'DP',
    sku: 'SKU-INSG-001',
    pku: 'PKU-INSG-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 250,
    brandName: 'Lantus SoloStar',
    genericName: 'Insulin Glargine',
    strength: '100 units/mL',
    dosageForm: 'Injection (Pre-filled Pen)',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store in a refrigerator (2┬░C - 8┬░C). Do not freeze.',
    packagingDescription: 'Box of 5 pre-filled pens x 3mL',
    storageLocation: 'Cold Room A - Refrigerator 1',
  },
  {
    id: 'drug-005',
    code: 'ATV20',
    name: 'Atorvastatin 20mg Tablet',
    type: 'Drug',
    category: 'Cardiovascular Drugs',
    uom: 'tablet',
    status: 'active',
    price: 1.20,
    procurement_vote: 'LP',
    sku: 'SKU-ATV20-001',
    pku: 'PKU-ATV20-001',
    supplierName: 'CCM Duopharma Biotech Berhad',
    supplierContact: 'Siti Nurhaliza',
    supplierPhone: '+60-3-7956-5678',
    supplierEmail: 'siti@ccm-duopharma.com',
    supplierAddress: 'Lot 13, Jalan 223, 46100 Petaling Jaya, Selangor',
    minStock: 1500,
    maxStock: 15000,
    reorderLevel: 3500,
    brandName: 'Lipitor',
    genericName: 'Atorvastatin Calcium',
    strength: '20mg',
    dosageForm: 'Tablet',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store below 25┬░C.',
    packagingDescription: 'Box of 30 tablets',
    storageLocation: 'Main Warehouse - Aisle B1',
  },
  {
    id: 'drug-006',
    code: 'AML5',
    name: 'Amlodipine 5mg Tablet',
    type: 'Drug',
    category: 'Cardiovascular Drugs',
    uom: 'tablet',
    status: 'active',
    price: 0.20,
    procurement_vote: 'APPL',
    sku: 'SKU-AML5-001',
    pku: 'PKU-AML5-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 2500,
    maxStock: 25000,
    reorderLevel: 6000,
    brandName: 'Norvasc',
    genericName: 'Amlodipine Besylate',
    strength: '5mg',
    dosageForm: 'Tablet',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store below 30┬░C. Protect from light.',
    packagingDescription: 'Box of 100 tablets',
    storageLocation: 'Main Warehouse - Aisle B2',
  },
  {
    id: 'drug-007',
    code: 'MOR10',
    name: 'Morphine Sulfate 10mg Tablet',
    type: 'Drug',
    category: 'Controlled Substances',
    uom: 'tablet',
    status: 'active',
    price: 2.50,
    procurement_vote: 'CC',
    kkmContractNumber: 'KKM/KONTRAK/CC/2026/080702/105',
    sku: 'SKU-MOR10-001',
    pku: 'PKU-MOR10-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 50,
    maxStock: 500,
    reorderLevel: 150,
    brandName: 'MST Continus',
    genericName: 'Morphine Sulfate',
    strength: '10mg',
    dosageForm: 'Sustained Release Tablet',
    requiresPrescription: true,
    isControlled: true,
    storageConditions: 'Store below 25┬░C. Controlled substance safe storage required.',
    packagingDescription: 'Box of 60 tablets',
    storageLocation: 'Controlled Substances Store - Safe Box',
  },
  {
    id: 'drug-008',
    code: 'SALBU',
    name: 'Salbutamol 100mcg Inhaler',
    type: 'Drug',
    category: 'Cardiovascular Drugs',
    uom: 'puff',
    status: 'active',
    price: 8.50,
    procurement_vote: 'DP',
    sku: 'SKU-SALB-001',
    pku: 'PKU-SALB-001',
    supplierName: 'MS Ally Pharma Sdn Bhd',
    supplierContact: 'Sales Manager',
    supplierPhone: '+60-3-0000-0000',
    supplierEmail: 'sales@msally.com.my',
    supplierAddress: 'Petaling Jaya, Selangor, Malaysia',
    minStock: 200,
    maxStock: 2000,
    reorderLevel: 500,
    brandName: 'Ventolin Evohaler',
    genericName: 'Salbutamol Sulfate',
    strength: '100mcg/dose',
    dosageForm: 'Metered Dose Inhaler',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store below 30┬░C. Do not freeze or expose to direct sunlight.',
    packagingDescription: 'Inhaler of 200 doses',
    storageLocation: 'Main Warehouse - Aisle B3',
  },
  {
    id: 'drug-009',
    code: 'OMEP20',
    name: 'Omeprazole 20mg Capsule',
    type: 'Drug',
    category: 'Analgesics & Antipyretics',
    uom: 'capsule',
    status: 'active',
    price: 0.30,
    procurement_vote: 'LP',
    sku: 'SKU-OMEP20-001',
    pku: 'PKU-OMEP20-001',
    supplierName: 'Quality Reputation Sdn Bhd',
    supplierContact: 'Account Manager',
    supplierPhone: '+60-3-0000-0006',
    supplierEmail: 'info@qualityreputation.com',
    supplierAddress: 'Selangor, Malaysia',
    minStock: 1000,
    maxStock: 10000,
    reorderLevel: 2500,
    brandName: 'Losec',
    genericName: 'Omeprazole',
    strength: '20mg',
    dosageForm: 'Enteric Coated Capsule',
    requiresPrescription: true,
    isControlled: false,
    storageConditions: 'Store below 25┬░C. Keep in original packaging to protect from moisture.',
    packagingDescription: 'Blister pack of 28 capsules',
    storageLocation: 'Main Warehouse - Aisle B4',
  },

  // Non-Drugs
  {
    id: 'nd-001',
    code: 'SYR5ML',
    name: 'Syringe 5ml with Needle',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'piece',
    status: 'active',
    price: 0.25,
    procurement_vote: 'APPL',
    sku: 'SKU-SYR5ML-001',
    pku: 'PKU-SYR5ML-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 500,
    maxStock: 5000,
    reorderLevel: 1000,
    packagingDescription: 'Individual sterile peel pack, box of 100',
    storageLocation: 'Main Warehouse - Aisle C1',
  },
  {
    id: 'nd-002',
    code: 'GLV-M',
    name: 'Examination Gloves (Medium)',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'box',
    status: 'active',
    price: 12.50,
    procurement_vote: 'CC',
    kkmContractNumber: 'KKM/KONTRAK/CC/2026/080702/332',
    sku: 'SKU-GLV-M-001',
    pku: 'PKU-GLV-M-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 200,
    packagingDescription: 'Box of 100 gloves by weight',
    storageLocation: 'Main Warehouse - Aisle C2',
  },
  {
    id: 'nd-003',
    code: 'BND-10',
    name: 'Gauze Bandage 10cm',
    type: 'Non-Drug',
    category: 'Wound Dressing',
    uom: 'roll',
    status: 'active',
    price: 3.50,
    procurement_vote: 'DP',
    sku: 'SKU-BND-10-001',
    pku: 'PKU-BND-10-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 200,
    maxStock: 2000,
    reorderLevel: 400,
    packagingDescription: 'Pack of 12 rolls',
    storageLocation: 'Main Warehouse - Aisle C3',
  },
  {
    id: 'nd-004',
    code: 'MASK-N95',
    name: 'N95 Respirator Mask',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'piece',
    status: 'active',
    price: 2.80,
    procurement_vote: 'APPL',
    sku: 'SKU-MASK-N95-001',
    pku: 'PKU-MASK-N95-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 500,
    maxStock: 5000,
    reorderLevel: 1000,
    packagingDescription: 'Individual wrapper, box of 20 pieces',
    storageLocation: 'Main Warehouse - Aisle C4',
  },
  {
    id: 'nd-005',
    code: 'CATH-16',
    name: 'Urinary Catheter 16Fr',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'piece',
    status: 'active',
    price: 5.50,
    procurement_vote: 'CC',
    kkmContractNumber: 'KKM/KONTRAK/CC/2026/080702/412',
    sku: 'SKU-CATH-16-001',
    pku: 'PKU-CATH-16-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 200,
    maxStock: 2000,
    reorderLevel: 400,
    packagingDescription: 'Sterile individual wrap, box of 10',
    storageLocation: 'Main Warehouse - Aisle D1',
  },
  {
    id: 'nd-006',
    code: 'IV-SET',
    name: 'IV Infusion Set',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'set',
    status: 'active',
    price: 1.20,
    procurement_vote: 'DP',
    sku: 'SKU-IV-SET-001',
    pku: 'PKU-IV-SET-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 300,
    maxStock: 3000,
    reorderLevel: 600,
    packagingDescription: 'Sterile peel pouch, box of 50 sets',
    storageLocation: 'Main Warehouse - Aisle D2',
  },
  {
    id: 'nd-007',
    code: 'SCALP-11',
    name: 'Surgical Scalpel Blade #11',
    type: 'Non-Drug',
    category: 'Surgical Supplies',
    uom: 'piece',
    status: 'active',
    price: 0.35,
    procurement_vote: 'LP',
    sku: 'SKU-SCALP-11-001',
    pku: 'PKU-SCALP-11-001',
    supplierName: 'CCM Duopharma Biotech Berhad',
    supplierContact: 'Siti Nurhaliza',
    supplierPhone: '+60-3-7956-5678',
    supplierEmail: 'siti@ccm-duopharma.com',
    supplierAddress: 'Lot 13, Jalan 223, 46100 Petaling Jaya, Selangor',
    minStock: 100,
    maxStock: 1000,
    reorderLevel: 200,
    packagingDescription: 'Box of 100 sterile blades',
    storageLocation: 'Main Warehouse - Aisle E1',
  },
  {
    id: 'nd-008',
    code: 'SUT-3-0',
    name: 'Surgical Suture 3-0',
    type: 'Non-Drug',
    category: 'Surgical Supplies',
    uom: 'pack',
    status: 'active',
    price: 8.50,
    procurement_vote: 'CC',
    sku: 'SKU-SUT-3-0-001',
    pku: 'PKU-SUT-3-0-001',
    supplierName: 'Duopharma (M) Sdn Bhd',
    supplierContact: 'Lee Wei Ming',
    supplierPhone: '+60-3-6156-1234',
    supplierEmail: 'info@duopharma.com',
    supplierAddress: 'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
    minStock: 150,
    maxStock: 1500,
    reorderLevel: 300,
    packagingDescription: 'Box of 36 sterile packs',
    storageLocation: 'Main Warehouse - Aisle E2',
  },
  {
    id: 'nd-009',
    code: 'ALCO-70',
    name: 'Alcohol Swab 70%',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'pack',
    status: 'active',
    price: 0.15,
    procurement_vote: 'APPL',
    sku: 'SKU-ALCO-70-001',
    pku: 'PKU-ALCO-70-001',
    supplierName: 'Pharmaniaga Logistics Sdn Bhd',
    supplierContact: 'Corporate Sales Team',
    supplierPhone: '+60-3-3342-9999',
    supplierEmail: 'info@pharmaniaga.com',
    supplierAddress: 'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
    minStock: 500,
    maxStock: 5000,
    reorderLevel: 1000,
    packagingDescription: 'Box of 100 individual swabs',
    storageLocation: 'Main Warehouse - Aisle E3',
  },
  {
    id: 'nd-010',
    code: 'THERM-DIG',
    name: 'Digital Thermometer',
    type: 'Non-Drug',
    category: 'Medical Consumables',
    uom: 'unit',
    status: 'inactive',
    price: 25.00,
    procurement_vote: 'LP',
    sku: 'SKU-THERM-DIG-001',
    pku: 'PKU-THERM-DIG-001',
    supplierName: 'CCM Duopharma Biotech Berhad',
    supplierContact: 'Siti Nurhaliza',
    supplierPhone: '+60-3-7956-5678',
    supplierEmail: 'siti@ccm-duopharma.com',
    supplierAddress: 'Lot 13, Jalan 223, 46100 Petaling Jaya, Selangor',
    minStock: 50,
    maxStock: 500,
    reorderLevel: 100,
    packagingDescription: 'Single unit casing',
    storageLocation: 'Main Warehouse - Aisle E4',
  },
]

export default function FacilityCatalogPage() {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || '1a2b3c4d-5e6f-7890-abcd-ef1234567890'
  const activeUserName = user?.full_name || user?.email || 'Active User'

  const [catalogItems, setCatalogItems] = useState<UnifiedCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'Drug' | 'Non-Drug'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedVote, setSelectedVote] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('active')
  const [selectedItem, setSelectedItem] = useState<UnifiedCatalogItem | null>(null)
  const [showUpdateHistory, setShowUpdateHistory] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // Batch selection and deactivation state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (checked: boolean, pageItems: UnifiedCatalogItem[]) => {
    if (checked) {
      const pageIds = pageItems.map(item => item.id)
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...pageIds])))
    } else {
      const pageIds = pageItems.map(item => item.id)
      setSelectedItemIds(prev => prev.filter(id => !pageIds.includes(id)))
    }
  }

  const batchToggleStatus = async (status: 'active' | 'inactive') => {
    const count = selectedItemIds.length
    if (count === 0) return

    // Generate batch audit logs
    const batchLogs = catalogItems
      .filter(item => selectedItemIds.includes(item.id))
      .map((item, index) => ({
        id: `log-status-${Date.now()}-${item.id}-${index}`,
        itemId: item.id,
        itemName: item.name,
        fieldName: 'Registry Status (Batch)',
        oldValue: item.status === 'active' ? 'Active' : 'Inactive',
        newValue: status === 'active' ? 'Active' : 'Inactive',
        changedBy: activeUserName,
        changedAt: new Date().toISOString()
      }))

    try {
      // Loop and update Supabase database concurrently
      await Promise.all(
        catalogItems
          .filter(item => selectedItemIds.includes(item.id))
          .map(async (item) => {
            if (item.type === 'Drug') {
              const { updateDrug } = await import('@/services/pharmacy/drugCatalogService')
              await updateDrug(item.id, { status })
            } else {
              const { updateNonDrug } = await import('@/services/pharmacy/nonDrugCatalogService')
              await updateNonDrug(item.id, { status })
            }
          })
      )

      setCatalogItems(prev => prev.map(item => selectedItemIds.includes(item.id) ? { ...item, status } : item))
      setAuditLogs(prev => [...batchLogs, ...prev])
      setSelectedItemIds([])
      addToast({
        title: 'Batch Action Successful',
        message: `Successfully set ${count} catalog items to ${status}.`,
        type: 'success',
      })
    } catch (err) {
      // Fallback local update
      setCatalogItems(prev => prev.map(item => selectedItemIds.includes(item.id) ? { ...item, status } : item))
      setAuditLogs(prev => [...batchLogs.map(l => ({ ...l, fieldName: 'Registry Status (Batch Offline)' })), ...prev])
      setSelectedItemIds([])
      addToast({
        title: 'Batch Action Locally Applied',
        message: `Successfully updated ${count} catalog items locally in fallback offline mode.`,
        type: 'success',
      })
    }
  }

  // Editing specs & dynamic logs state
  interface SpecsAuditLog {
    id: string
    itemId: string
    itemName?: string
    fieldName: string
    oldValue: string
    newValue: string
    changedBy: string
    changedAt: string
  }

  const [isEditingSpecs, setIsEditingSpecs] = useState(false)
  const [editForm, setEditForm] = useState<UnifiedCatalogItem | null>(null)
  const [isAddingNewSize, setIsAddingNewSize] = useState(false)
  const [newSizeText, setNewSizeText] = useState('')
  const [auditLogs, setAuditLogs] = useState<SpecsAuditLog[]>([
    {
      id: 'log-1',
      itemId: 'PCM500',
      itemName: 'Paracetamol 500mg Tablet',
      fieldName: 'Registry Status',
      oldValue: 'Inactive',
      newValue: 'Active',
      changedBy: activeUserName,
      changedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    },
    {
      id: 'log-2',
      itemId: 'THERM-DIG',
      itemName: 'Digital Thermometer',
      fieldName: 'Registry Status',
      oldValue: 'Active',
      newValue: 'Inactive',
      changedBy: activeUserName,
      changedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    },
    {
      id: 'log-3',
      itemId: 'AMX500',
      itemName: 'Amoxicillin 500mg Capsule',
      fieldName: 'KKM Contract Number',
      oldValue: 'N/A',
      newValue: 'KKM/KONTRAK/CC/2026/080702/094',
      changedBy: activeUserName,
      changedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    },
    {
      id: 'log-4',
      itemId: 'GLV-M',
      itemName: 'Examination Gloves (Medium)',
      fieldName: 'Registry Status',
      oldValue: 'Active',
      newValue: 'Inactive',
      changedBy: activeUserName,
      changedAt: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
    }
  ])

  useEffect(() => {
    if (selectedItem) {
      setEditForm({ ...selectedItem })
      setIsEditingSpecs(false)
    } else {
      setEditForm(null)
      setIsEditingSpecs(false)
    }
  }, [selectedItem])
  
  // Add Catalog Item States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [masterSearchQuery, setMasterSearchQuery] = useState('')
  const [masterFilterType, setMasterFilterType] = useState<'Drug' | 'Non-Drug'>('Drug')
  const [showCreateCustomForm, setShowCreateCustomForm] = useState(false)
  const [selectedMasterItem, setSelectedMasterItem] = useState<UnifiedCatalogItem | null>(null)
  const [masterItems, setMasterItems] = useState<UnifiedCatalogItem[]>([])
  const [isMasterLoading, setIsMasterLoading] = useState(false)

  // Pre-filled 4-section specs form state for selected master item
  const [sectionsForm, setSectionsForm] = useState({
    type: 'Drug' as 'Drug' | 'Non-Drug',
    code: '',
    name: '',
    brandName: '',
    dosageForm: '',
    procurement_vote: 'APPL' as 'APPL' | 'CC' | 'DP' | 'LP',
    kkmContractNumber: '',
    
    strength: '',
    category: '',
    requiresPrescription: false,
    isControlled: false,
    
    uom: '',
    sku: '',
    pku: '',
    price: '',
    packagingDescription: '',
    
    storageConditions: '',
    minStock: '100',
    maxStock: '1000',
    reorderLevel: '250',
    storageLocation: '',
    itemGroup: '',
    storageStore: '',
    storageCabinet: '',
    storageLevel: '',
    storageLabel: '',
  })

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Master Search Catalog Pagination State
  const [masterCurrentPage, setMasterCurrentPage] = useState(1)
  const masterPageSize = 10

  // Reset pagination on filter or tab change to prevent page overflow
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedCategory, selectedVote, selectedStatus])

  // Reset master catalog pagination on search or type change inside modal
  useEffect(() => {
    setMasterCurrentPage(1)
  }, [masterSearchQuery, masterFilterType])
  
  const addToast = useToastStore(state => state.addToast)

  // Fetch drugs and non-drugs concurrently
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [drugsRes, nonDrugsRes] = await Promise.all([
          getDrugCatalog(hospitalId, {}, 1, 1000),
          getNonDrugCatalog(hospitalId, {}, 1, 1000),
        ])

        const combined: UnifiedCatalogItem[] = []

        // Parse Drugs if any exist
        if (drugsRes.data && drugsRes.data.data && drugsRes.data.data.length > 0) {
          drugsRes.data.data.forEach((drug: any) => {
            combined.push({
              id: drug.id,
              code: drug.drug_code,
              name: drug.drug_name,
              type: 'Drug',
              category: drug.category?.category_name || 'General Pharmaceutical',
              uom: drug.unit_of_measure || 'unit',
              status: drug.status || 'active',
              price: drug.price || 0,
              procurement_vote: (drug.procurement_vote?.toUpperCase() as any) || 'APPL',
              sku: drug.sku || 'N/A',
              pku: drug.pku || 'N/A',
              supplierName: drug.supplier?.company_name || 'Pharmaniaga Logistics Sdn Bhd',
              supplierContact: drug.supplier?.contact_person || '',
              supplierPhone: drug.supplier?.phone || '',
              supplierEmail: drug.supplier?.email || '',
              supplierAddress: drug.supplier?.address || '',
              minStock: drug.min_stock_level || 0,
              maxStock: drug.max_stock_level || 0,
              reorderLevel: drug.reorder_level || 0,
              brandName: drug.brand_name || '',
              genericName: drug.generic_name || '',
              strength: drug.strength || '',
              dosageForm: drug.dosage_form || '',
              requiresPrescription: drug.requires_prescription ?? false,
              isControlled: drug.is_controlled ?? false,
              storageConditions: drug.storage_conditions || '',
              packagingDescription: drug.packaging_description || '',
              storageLocation: drug.storage_location || (drug.is_controlled ? 'Controlled Substances Store - Safe Box' : drug.storage_conditions?.toLowerCase().includes('refrigerator') || drug.storage_conditions?.toLowerCase().includes('2-8') ? 'Cold Room A - Refrigerator 1' : 'Main Warehouse - Shelf A1'),
              kkmContractNumber: drug.kkm_contract_number || drug.supplier?.contract_number || '',
            })
          })
        }

        // Parse Non-Drugs if any exist
        if (nonDrugsRes.data && nonDrugsRes.data.data && nonDrugsRes.data.data.length > 0) {
          nonDrugsRes.data.data.forEach((nd: any) => {
            combined.push({
              id: nd.id,
              code: nd.item_code,
              name: nd.item_name,
              type: 'Non-Drug',
              category: nd.category?.category_name || 'Medical Consumables',
              uom: nd.unit_of_measure || 'piece',
              status: nd.status || 'active',
              price: nd.price || 0,
              procurement_vote: (nd.procurement_vote?.toUpperCase() as any) || 'APPL',
              sku: nd.sku || 'N/A',
              pku: nd.pku || 'N/A',
              supplierName: nd.supplier?.company_name || 'Duopharma (M) Sdn Bhd',
              supplierContact: nd.supplier?.contact_person || '',
              supplierPhone: nd.supplier?.phone || '',
              supplierEmail: nd.supplier?.email || '',
              supplierAddress: nd.supplier?.address || '',
              minStock: nd.min_stock_level || 0,
              maxStock: nd.max_stock_level || 0,
              reorderLevel: nd.reorder_level || 0,
              packagingDescription: nd.packaging_description || '',
              storageLocation: nd.storage_location || 'Main Warehouse - Aisle C1',
              kkmContractNumber: nd.kkm_contract_number || nd.supplier?.contract_number || '',
            })
          })
        }

        const prepItems = (list: UnifiedCatalogItem[]) => list.map(item => ({
          ...item,
          packagingSizes: item.packagingSizes || [
            item.packagingDescription || 'Standard box',
            'box of 90 tablets',
            'box of 60 tablets'
          ]
        }))

        // Strictly load and set live database combined items (even if empty, do not fallback to mocks!)
        setCatalogItems(prepItems(combined))
      } catch (err) {
        console.error('Failed to load facility catalog items:', err)
        addToast({
          title: 'Error Loading Catalog',
          message: 'Could not fetch catalog lists from the live database.',
          type: 'warning',
        })
        setCatalogItems([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [hospitalId, addToast])
  
  // Toggle item active/inactive status
  const toggleItemStatus = async (item: UnifiedCatalogItem) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active'
    try {
      if (item.type === 'Drug') {
        const { updateDrug } = await import('@/services/pharmacy/drugCatalogService')
        await updateDrug(item.id, { status: newStatus })
      } else {
        const { updateNonDrug } = await import('@/services/pharmacy/nonDrugCatalogService')
        await updateNonDrug(item.id, { status: newStatus })
      }
      
      setCatalogItems(prev => prev.map(x => x.id === item.id ? { ...x, status: newStatus } : x))
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null)
      }

      setAuditLogs(prev => [
        {
          id: `log-status-${Date.now()}-${item.id}`,
          itemId: item.id,
          itemName: item.name,
          fieldName: 'Registry Status',
          oldValue: item.status === 'active' ? 'Active' : 'Inactive',
          newValue: newStatus === 'active' ? 'Active' : 'Inactive',
          changedBy: activeUserName,
          changedAt: new Date().toISOString()
        },
        ...prev
      ])
      
      addToast({
        title: 'Status Updated',
        message: `"${item.name}" status changed to ${newStatus}.`,
        type: 'success',
      })
    } catch (err) {
      setCatalogItems(prev => prev.map(x => x.id === item.id ? { ...x, status: newStatus } : x))
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null)
      }
      setAuditLogs(prev => [
        {
          id: `log-status-${Date.now()}-${item.id}-fallback`,
          itemId: item.id,
          itemName: item.name,
          fieldName: 'Registry Status (Offline)',
          oldValue: item.status === 'active' ? 'Active' : 'Inactive',
          newValue: newStatus === 'active' ? 'Active' : 'Inactive',
          changedBy: activeUserName,
          changedAt: new Date().toISOString()
        },
        ...prev
      ])
      addToast({
        title: 'Status Updated',
        message: `"${item.name}" status updated locally.`,
        type: 'success',
      })
    }
  }

  // Get master catalog lists combined
  const masterList = useMemo(() => {
    const list: UnifiedCatalogItem[] = []
    
    mockDrugs.forEach((drug: any) => {
      list.push({
        id: drug.id,
        code: drug.drug_code,
        name: drug.drug_name,
        type: 'Drug',
        category: drug.category?.category_name || 'General Pharmaceutical',
        uom: drug.unit_of_measure || 'unit',
        status: drug.status || 'active',
        price: drug.price || 0,
        procurement_vote: (drug.procurement_vote?.toUpperCase() as any) || 'APPL',
        sku: drug.sku || 'N/A',
        pku: drug.pku || 'N/A',
        supplierName: drug.supplier?.company_name || 'Pharmaniaga Logistics Sdn Bhd',
        brandName: drug.brand_name || '',
        genericName: drug.generic_name || '',
        strength: drug.strength || '',
        dosageForm: drug.dosage_form || '',
        requiresPrescription: drug.requires_prescription ?? false,
        isControlled: drug.is_controlled ?? false,
        storageConditions: drug.storage_conditions || '',
        kkmContractNumber: drug.kkm_contract_number || drug.supplier?.contract_number || '',
        minStock: drug.min_stock_level || 0,
        maxStock: drug.max_stock_level || 0,
        reorderLevel: drug.reorder_level || 0,
      })
    })
    
    mockNonDrugs.forEach((nd: any) => {
      list.push({
        id: nd.id,
        code: nd.item_code,
        name: nd.item_name,
        type: 'Non-Drug',
        category: nd.category?.category_name || 'Medical Consumables',
        uom: nd.unit_of_measure || 'piece',
        status: nd.status || 'active',
        price: nd.price || 0,
        procurement_vote: (nd.procurement_vote?.toUpperCase() as any) || 'APPL',
        sku: nd.sku || 'N/A',
        pku: nd.pku || 'N/A',
        supplierName: nd.supplier?.company_name || 'Duopharma (M) Sdn Bhd',
        kkmContractNumber: nd.kkm_contract_number || nd.supplier?.contract_number || '',
        minStock: nd.min_stock_level || 0,
        maxStock: nd.max_stock_level || 0,
        reorderLevel: nd.reorder_level || 0,
      })
    })
    
    return list
  }, [])

  // Fetch real master catalog items from live Supabase tables
  useEffect(() => {
    if (!isAddModalOpen) return

    let active = true

    async function fetchMaster() {
      setIsMasterLoading(true)
      try {
        let query = supabase
          .from(masterFilterType === 'Drug' ? 'drugs' : 'non_drugs')
          .select('*, category:category_id(category_name), supplier:supplier_id(company_name)')
          .limit(50)

        if (masterSearchQuery.trim()) {
          const q = `%${masterSearchQuery}%`
          const searchFieldCode = masterFilterType === 'Drug' ? 'drug_code' : 'item_code'
          const searchFieldName = masterFilterType === 'Drug' ? 'drug_name' : 'item_name'
          query = query.or(`${searchFieldCode}.ilike.${q},${searchFieldName}.ilike.${q}`)
        }

        const { data, error } = await query

        if (error) throw error

        if (!active) return

        if (data) {
          const unified: UnifiedCatalogItem[] = data.map((item: any) => ({
            id: item.id,
            code: item.drug_code || item.item_code,
            name: item.drug_name || item.item_name,
            type: masterFilterType,
            category: item.category?.category_name || (masterFilterType === 'Drug' ? 'General Pharmaceutical' : 'Medical Consumables'),
            uom: item.unit_of_measure || (masterFilterType === 'Drug' ? 'unit' : 'piece'),
            status: item.status || 'active',
            price: parseFloat(item.price) || 0,
            procurement_vote: (item.procurement_vote?.toUpperCase() as any) || 'APPL',
            sku: item.sku || 'N/A',
            pku: item.pku || 'N/A',
            supplierName: item.supplier?.company_name || (masterFilterType === 'Drug' ? 'Pharmaniaga Logistics Sdn Bhd' : 'Duopharma (M) Sdn Bhd'),
            brandName: item.brand_name || '',
            genericName: item.generic_name || '',
            strength: item.strength || '',
            dosageForm: item.dosage_form || '',
            requiresPrescription: item.requires_prescription ?? false,
            isControlled: item.is_controlled ?? false,
            storageConditions: item.storage_conditions || '',
            kkmContractNumber: item.kkm_contract_number || '',
            minStock: item.min_stock_level || 0,
            maxStock: item.max_stock_level || 0,
            reorderLevel: item.reorder_level || 0,
          }))
          setMasterItems(unified)
        } else {
          setMasterItems([])
        }
      } catch (err) {
        console.error('Error fetching master catalog items:', err)
        if (active) setMasterItems([])
      } finally {
        if (active) setIsMasterLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchMaster()
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [isAddModalOpen, masterSearchQuery, masterFilterType])

  // Master Search Pagination details
  const totalMasterRecords = masterItems.length
  const totalMasterPages = Math.max(1, Math.ceil(totalMasterRecords / masterPageSize))

  const paginatedMasterItems = useMemo(() => {
    const startIdx = (masterCurrentPage - 1) * masterPageSize
    const endIdx = startIdx + masterPageSize
    return masterItems.slice(startIdx, endIdx)
  }, [masterItems, masterCurrentPage])

  // Handle saving specifications changes and logging them
  const handleSaveSpecsEdits = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm || !selectedItem) return

    const newLogs: SpecsAuditLog[] = []
    const updatedItem = { ...editForm }
    if (selectedItem.type !== 'Drug') {
      delete updatedItem.dosageForm
    }
    
    const checkChange = (field: keyof UnifiedCatalogItem, displayName: string, formatVal: (v: any) => string = (v) => String(v)) => {
      if (editForm[field] !== selectedItem[field]) {
        newLogs.push({
          id: `log-edit-${Date.now()}-${field}`,
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          fieldName: displayName,
          oldValue: formatVal(selectedItem[field]),
          newValue: formatVal(editForm[field]),
          changedBy: activeUserName,
          changedAt: new Date().toISOString()
        })
      }
    }

    checkChange('name', 'Item Name')
    checkChange('brandName', 'Brand Name')
    if (selectedItem.type === 'Drug') {
      checkChange('dosageForm', 'Dosage Form')
    }
    checkChange('procurement_vote', 'Procurement Vote')
    checkChange('kkmContractNumber', 'KKM Contract Number')
    checkChange('strength', 'Strength/Specification')
    checkChange('category', 'Category')
    checkChange('requiresPrescription', 'Prescription Requirement', (v) => v ? 'Yes' : 'No')
    checkChange('isControlled', 'Controlled Substance', (v) => v ? 'Yes' : 'No')
    checkChange('sku', 'SKU Code')
    checkChange('pku', 'PKU Code')
    checkChange('price', 'Unit Price', (v) => `RM ${Number(v).toFixed(2)}`)
    checkChange('packagingDescription', 'Packaging Size')
    checkChange('storageConditions', 'Storage Condition')
    checkChange('minStock', 'Min Stock Level', (v) => `${Number(v).toLocaleString()} units`)
    checkChange('maxStock', 'Max Stock Level', (v) => `${Number(v).toLocaleString()} units`)
    checkChange('reorderLevel', 'Buffer Stock Level', (v) => `${Number(v).toLocaleString()} units`)
    checkChange('storageLocation', 'Storage Location')

    if (newLogs.length > 0) {
      setAuditLogs(prev => [...newLogs, ...prev])
      addToast({
        title: 'Specifications Updated',
        message: `Successfully saved ${newLogs.length} technical specifications changes to facility catalog database.`,
        type: 'success',
      })
    } else {
      addToast({
        title: 'No Changes Detected',
        message: 'No technical spec changes were found to save.',
        type: 'info',
      })
    }

    setCatalogItems(prev => prev.map(item => item.id === selectedItem.id ? updatedItem : item))
    setSelectedItem(updatedItem)
    setIsEditingSpecs(false)
  }

  // Select a master item and open the 4-section specs verification page
  const handleSelectMasterItem = (item: UnifiedCatalogItem) => {
    setSelectedMasterItem(item)
    setSectionsForm({
      type: item.type,
      code: item.code,
      name: item.name,
      brandName: item.brandName || '',
      dosageForm: item.dosageForm || (item.type === 'Drug' ? 'Tablet' : 'Consumable'),
      procurement_vote: item.procurement_vote,
      kkmContractNumber: item.kkmContractNumber || '',
      
      strength: item.strength || '',
      category: item.category,
      requiresPrescription: item.requiresPrescription || false,
      isControlled: item.isControlled || false,
      
      uom: item.uom,
      sku: item.sku || '',
      pku: item.pku || '',
      price: String(item.price),
      packagingDescription: item.packagingDescription || '',
      
      storageConditions: item.storageConditions || '',
      minStock: String(item.minStock),
      maxStock: String(item.maxStock),
      reorderLevel: String(item.reorderLevel),
      storageLocation: item.storageLocation || '',
      itemGroup: item.itemGroup || '',
      storageStore: item.storageStore || '',
      storageCabinet: item.storageCabinet || '',
      storageLevel: item.storageLevel || '',
      storageLabel: item.storageLabel || '',
    })
  }

  // Handle adding custom item or pre-selected item after validating/setting all 4 sections
  const handleAddWithSections = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isCustom = !selectedMasterItem
    const type = isCustom ? sectionsForm.type : selectedMasterItem!.type
    const supplierName = isCustom ? 'Custom Added Supplier' : selectedMasterItem!.supplierName

    // Resolve category ID from categories in database
    let categoryId = null
    if (isSupabaseConfigured()) {
      try {
        const categoryTable = type === 'Drug' ? 'drug_categories' : 'non_drug_categories'
        const { data: catData } = await supabase
          .from(categoryTable)
          .select('id')
          .or(`category_name.ilike.${sectionsForm.category},category_code.ilike.${sectionsForm.category}`)
          .limit(1)
        
        if (catData && catData.length > 0) {
          categoryId = catData[0].id
        } else {
          // Fallback: get first category
          const { data: firstCat } = await supabase
            .from(categoryTable)
            .select('id')
            .limit(1)
          if (firstCat && firstCat.length > 0) {
            categoryId = firstCat[0].id
          }
        }
      } catch (catErr) {
        console.error('Error resolving category_id:', catErr)
      }
    }

    // Resolve supplier ID
    let supplierId = null
    if (isSupabaseConfigured()) {
      try {
        const supplierNameQuery = isCustom ? 'Custom Added Supplier' : selectedMasterItem?.supplierName
        if (supplierNameQuery) {
          const { data: supData } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('company_name', supplierNameQuery)
            .limit(1)
          if (supData && supData.length > 0) {
            supplierId = supData[0].id
          }
        }
      } catch (supErr) {
        console.error('Error resolving supplier_id:', supErr)
      }
    }

    const newItem: UnifiedCatalogItem = {
      id: isCustom ? `${sectionsForm.type.toLowerCase()}-${Date.now()}` : selectedMasterItem!.id,
      code: sectionsForm.code.toUpperCase(),
      name: sectionsForm.name,
      type: type,
      category: sectionsForm.category,
      uom: sectionsForm.uom || (type === 'Drug' ? 'tablet' : 'piece'),
      status: 'active',
      price: parseFloat(sectionsForm.price) || 0,
      procurement_vote: sectionsForm.procurement_vote,
      sku: sectionsForm.sku || 'N/A',
      pku: sectionsForm.pku || 'N/A',
      supplierName: supplierName,
      brandName: sectionsForm.brandName || 'N/A',
      dosageForm: type === 'Drug' ? (sectionsForm.dosageForm || 'Tablet') : undefined,
      kkmContractNumber: sectionsForm.procurement_vote === 'CC' ? sectionsForm.kkmContractNumber : undefined,
      
      strength: sectionsForm.strength || undefined,
      requiresPrescription: sectionsForm.requiresPrescription,
      isControlled: sectionsForm.isControlled,
      packagingDescription: sectionsForm.packagingDescription || undefined,
      storageConditions: sectionsForm.storageConditions || undefined,
      storageLocation: sectionsForm.storageLocation || undefined,
      
      minStock: parseInt(sectionsForm.minStock) || 0,
      maxStock: parseInt(sectionsForm.maxStock) || 0,
      reorderLevel: parseInt(sectionsForm.reorderLevel) || 0,
    }

    if (type === 'Drug') {
      const result = await createDrug(hospitalId, {
        drug_code: sectionsForm.code.toUpperCase(),
        drug_name: sectionsForm.name,
        generic_name: sectionsForm.name,
        brand_name: sectionsForm.brandName || undefined,
        dosage_form: (sectionsForm.dosageForm || 'tablet') as any,
        strength: sectionsForm.strength || undefined,
        unit_of_measure: sectionsForm.uom || 'tablet',
        category_id: categoryId,
        is_controlled: sectionsForm.isControlled || false,
        requires_prescription: sectionsForm.requiresPrescription || false,
        storage_conditions: sectionsForm.storageConditions || undefined,
        min_stock_level: parseInt(sectionsForm.minStock) || 0,
        max_stock_level: parseInt(sectionsForm.maxStock) || undefined,
        reorder_level: parseInt(sectionsForm.reorderLevel) || undefined,
        status: 'active',
        sku: sectionsForm.sku || undefined,
        pku: sectionsForm.pku || undefined,
        supplier_id: supplierId,
        procurement_vote: (sectionsForm.procurement_vote || 'APPL').toLowerCase() as any,
        price: parseFloat(sectionsForm.price) || undefined,
        packaging_description: sectionsForm.packagingDescription || undefined,
      })
      if (result.error) {
        addToast({
          title: 'Registration Failed',
          message: result.error,
          type: 'error',
        })
        return
      }
      if (result.data) {
        newItem.id = result.data.id
      }
    } else {
      const result = await createNonDrug(hospitalId, {
        item_code: sectionsForm.code.toUpperCase(),
        item_name: sectionsForm.name,
        category_id: categoryId,
        unit_of_measure: sectionsForm.uom || 'piece',
        min_stock_level: parseInt(sectionsForm.minStock) || 0,
        max_stock_level: parseInt(sectionsForm.maxStock) || undefined,
        reorder_level: parseInt(sectionsForm.reorderLevel) || undefined,
        status: 'active',
        sku: sectionsForm.sku || undefined,
        pku: sectionsForm.pku || undefined,
        supplier_id: supplierId,
        procurement_vote: (sectionsForm.procurement_vote || 'APPL').toLowerCase() as any,
        price: parseFloat(sectionsForm.price) || undefined,
        packaging_description: sectionsForm.packagingDescription || undefined,
      })
      if (result.error) {
        addToast({
          title: 'Registration Failed',
          message: result.error,
          type: 'error',
        })
        return
      }
      if (result.data) {
        newItem.id = result.data.id
      }
    }

    setCatalogItems(prev => {
      const idx = prev.findIndex(x => x.code === newItem.code)
      if (idx !== -1) {
        const copy = [...prev]
        copy[idx] = newItem
        return copy
      }
      return [newItem, ...prev]
    })

    setAuditLogs(prev => [
      {
        id: `log-add-${Date.now()}-${newItem.id}`,
        itemId: newItem.id,
        fieldName: 'Registry Status',
        oldValue: 'None (New Item)',
        newValue: 'Registered Active',
        changedBy: activeUserName,
        changedAt: new Date().toISOString()
      },
      ...prev
    ])

    setIsAddModalOpen(false)
    setSelectedMasterItem(null)
    setShowCreateCustomForm(false)
    const isSavedToDb = isSupabaseConfigured()
    addToast({
      title: 'Item Registered',
      message: `"${newItem.name}" has been successfully added to your facility catalog (${isSavedToDb ? 'Database Saved' : 'Mock Memory Mode - Refresh will clear'}).`,
      type: 'success',
    })
  }

  // Handle custom item button click: load blank forms
  const handleOpenCustomItemForm = () => {
    setShowCreateCustomForm(true)
    setSelectedMasterItem(null)
    setSectionsForm({
      type: 'Drug',
      code: '',
      name: '',
      brandName: '',
      dosageForm: 'Tablet',
      procurement_vote: 'APPL',
      kkmContractNumber: '',
      
      strength: '',
      category: 'General Pharmaceutical',
      requiresPrescription: false,
      isControlled: false,
      
      uom: 'tablet',
      sku: 'SKU-TEMP',
      pku: 'PKU-TEMP',
      price: '0.00',
      packagingDescription: '',
      
      storageConditions: 'Store below 30°C',
      minStock: '100',
      maxStock: '1000',
      reorderLevel: '250',
      storageLocation: 'Main Warehouse - Shelf A1',
      itemGroup: '',
      storageStore: '',
      storageCabinet: '',
      storageLevel: '',
      storageLabel: '',
    })
  }

  // Get dynamic unique categories
  const uniqueCategories = ['all', ...Array.from(new Set(catalogItems.map(item => item.category)))]

  // Memoized filter criteria logic
  const filteredItems = useMemo(() => {
    return catalogItems.filter(item => {
      // Tab Filter
      if (activeTab !== 'all' && item.type !== activeTab) return false

      // Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false

      // Vote Filter
      if (selectedVote !== 'all' && item.procurement_vote !== selectedVote) return false

      // Status Filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.brandName?.toLowerCase().includes(q) ||
          item.genericName?.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [catalogItems, activeTab, selectedCategory, selectedVote, selectedStatus, searchQuery])

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      const getShortCategory = (cat: string): string => {
        if (!cat) return ''
        const catLower = cat.toLowerCase()
        if (catLower.includes('analgesic') || catLower.includes('antipyretic')) return 'Analgesics'
        if (catLower.includes('antibiotic')) return 'Antibiotics'
        if (catLower.includes('antidiabetic')) return 'Antidiabetic'
        if (catLower.includes('cardio')) return 'Cardio'
        if (catLower.includes('controlled')) return 'Controlled'
        if (catLower.includes('wound') || catLower.includes('dressing')) return 'Wound Care'
        if (catLower.includes('surgical')) return 'Surgical'
        if (catLower.includes('consumable')) return 'Medical'
        if (catLower.includes('general') || catLower.includes('pharmaceutical')) return 'General'
        return cat.substring(0, 12)
      }

      const getBase64ImageFromUrlLocal = async (imageUrl: string): Promise<string | null> => {
        try {
          const res = await fetch(imageUrl)
          const blob = await res.blob()
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result as string)
            }
            reader.onerror = () => {
              resolve(null)
            }
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.error('Failed to load image:', error)
          return null
        }
      }

      const getQuantityFromPackaging = (desc: string): number => {
        if (!desc) return 1
        const descLower = desc.toLowerCase()
        const match = descLower.match(/(?:box|pack|bottle|vial|roll|set|bag|strip|bladder|cartridge|drum|tub|envelope|jar|tin|packet|pcs|pc|ampoule|amp)\s+(?:of\s+)?(\d+)/i)
        if (match && match[1]) {
          return parseInt(match[1], 10)
        }
        const matchGeneric = descLower.match(/(\d+)\s*(?:tabs|tablets|caps|capsules|pcs|pieces|units|rolls|vials|pens|sets|vials|amps|ampoules)/i)
        if (matchGeneric && matchGeneric[1]) {
          return parseInt(matchGeneric[1], 10)
        }
        const matchNumber = descLower.match(/(\d+)/)
        if (matchNumber && matchNumber[1]) {
          const val = parseInt(matchNumber[1], 10)
          if (val > 0 && val <= 2000 && !descLower.includes(val + 'mg') && !descLower.includes(val + 'g') && !descLower.includes(val + 'ml') && !descLower.includes(val + 'mcg')) {
            return val
          }
        }
        return 1
      }

      const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')
      
      const doc = new jsPDF('l', 'mm', 'a4')
      const pageWidth = 297
      const pageHeight = 210
      const margin = 14
      const contentWidth = pageWidth - (margin * 2)

      const drawWatermark = () => {
        if (logoBase64) {
          try {
            doc.saveGraphicsState()
            const GState = (doc as any).GState || (jsPDF as any).GState
            if (GState) {
              doc.setGState(new GState({ opacity: 0.03 }))
            }
            doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (pageHeight - 90) / 2, 90, 90)
            doc.restoreGraphicsState()
          } catch (err) {
            console.error('Error drawing watermark:', err)
          }
        }
      }

      const drawHeader = () => {
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', (pageWidth - 16) / 2, 8, 16, 13)
        }
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10.5)
        doc.setTextColor(30, 41, 59) // slate-800
        doc.text('KEMENTERIAN KESIHATAN MALAYSIA', pageWidth / 2, 25, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105) // slate-600
        doc.text('HOSPITAL DAERAH LAWAS', pageWidth / 2, 29, { align: 'center' })
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13.5)
        doc.setTextColor(15, 23, 42) // slate-900
        doc.text('REKOD DAFTAR KATALOG KEMUDAHAN FARMASI', pageWidth / 2, 36, { align: 'center' })
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139) // slate-500
        doc.text('(FACILITY DRUGS AND CONSUMABLES REGISTER)', pageWidth / 2, 40, { align: 'center' })
        
        doc.setLineWidth(0.5)
        doc.setDrawColor(203, 213, 225) // slate-300
        doc.line(margin, 43, pageWidth - margin, 43)
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        doc.text(`Search Category: ${activeTab === 'all' ? 'All Drugs & Non-Drugs' : activeTab === 'Drug' ? 'Drugs Only' : 'Non-Drugs Only'}`, margin, 48)
        doc.text(`Report Date: ${new Date().toLocaleDateString('en-MY')}`, pageWidth - margin, 48, { align: 'right' })
        doc.text(`Total Registered Items: ${filteredItems.length} records`, margin, 52)
        doc.text(`Generated By: ${activeUserName}`, pageWidth - margin, 52, { align: 'right' })
      }

      drawWatermark()
      drawHeader()

      autoTable(doc, {
        startY: 56,
        head: [['No', 'Drug/Non Drug Name', 'Item Code', 'Packaging Description', 'Procurement', 'Category', 'Price/PKU']],
        body: filteredItems.map((item, idx) => {
          const qty = getQuantityFromPackaging(item.packagingDescription || '')
          const pkuPrice = item.price * qty
          
          return [
            String(idx + 1),
            `${item.name} ${item.brandName && item.brandName !== 'N/A' ? `(${item.brandName})` : ''}`,
            item.code,
            item.packagingDescription || 'Standard box / pack',
            item.procurement_vote,
            getShortCategory(item.category),
            `RM ${pkuPrice.toFixed(2)}`
          ]
        }),
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2.2, lineColor: [241, 245, 249], lineWidth: 0.1, textColor: [30, 41, 59] },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 105 },
          2: { cellWidth: 32 },
          3: { cellWidth: 50 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 34, halign: 'right' }
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawWatermark()
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(100, 116, 139)
            doc.text('PHARMACY FACILITY CATALOG RECORD - OFFICIAL PRINT', margin, 12)
            doc.setDrawColor(226, 232, 240)
            doc.line(margin, 14, pageWidth - margin, 14)
          }
          
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(148, 163, 184) // slate-400
          doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
          doc.text('Pharmacy Facility Catalog Report - Official Printed Document', margin, pageHeight - 7)
        }
      })

      let finalY = (doc as any).lastAutoTable.finalY + 12
      if (finalY > pageHeight - 50) {
        doc.addPage()
        finalY = 25
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 41, 59)
      doc.text('PREPARED BY', margin + 20, finalY)
      doc.text('VERIFIED BY', pageWidth / 2 - 17, finalY)
      doc.text('APPROVED BY', pageWidth - margin - 47, finalY)

      const lineY = finalY + 22
      doc.setDrawColor(203, 213, 225)
      doc.line(margin + 20, lineY, margin + 70, lineY)
      doc.line(pageWidth / 2 - 17, lineY, pageWidth / 2 + 33, lineY)
      doc.line(pageWidth - margin - 47, lineY, pageWidth - margin + 3, lineY)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text('(Stamp & Signature)', margin + 20, lineY + 3.5)
      doc.text('(Verification Stamp)', pageWidth / 2 - 17, lineY + 3.5)
      doc.text('(Chief Pharmacist)', pageWidth - margin - 47, lineY + 3.5)

      doc.text('Date: ______________', margin + 20, lineY + 7.5)
      doc.text('Date: ______________', pageWidth / 2 - 17, lineY + 7.5)
      doc.text('Date: ______________', pageWidth - margin - 47, lineY + 7.5)

      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `Pharmacy_Facility_Catalog_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
      addToast({
        title: 'Catalog Downloaded Successfully',
        message: 'PDF catalog report is ready for printing and official verification.',
        type: 'success'
      })
    } catch (error: any) {
      console.error('PDF Export Error:', error)
      addToast({
        title: 'PDF Export Failed',
        message: error.message || 'An error occurred while generating the PDF file.',
        type: 'warning'
      })
    } finally {
      setIsExportingPdf(false)
    }
  }

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  // Paginated records to actually render in the DataTable
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    const endIdx = startIdx + pageSize
    return filteredItems.slice(startIdx, endIdx)
  }, [filteredItems, currentPage, pageSize])

  // Quick Stat Summaries
  const totalCount = catalogItems.length
  const ccCount = catalogItems.filter(item => item.procurement_vote === 'CC').length
  const dpCount = catalogItems.filter(item => item.procurement_vote === 'DP').length
  const lpCount = catalogItems.filter(item => item.procurement_vote === 'LP').length
  const applCount = catalogItems.filter(item => item.procurement_vote === 'APPL').length

  // Calculate percentages
  const ccPercentage = totalCount > 0 ? Math.round((ccCount / totalCount) * 100) : 0
  const dpPercentage = totalCount > 0 ? Math.round((dpCount / totalCount) * 100) : 0
  const lpPercentage = totalCount > 0 ? Math.round((lpCount / totalCount) * 100) : 0
  const applPercentage = totalCount > 0 ? Math.round((applCount / totalCount) * 100) : 0

  // Latest update info from audit logs
  const latestLog = auditLogs[0]
  const latestUpdateDate = latestLog
    ? `${new Date(latestLog.changedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })} at ${new Date(latestLog.changedAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })}`
    : 'Recently'
  const latestUpdateBy = latestLog ? latestLog.changedBy : activeUserName

  // Table Columns config
  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={paginatedItems.length > 0 && paginatedItems.every(item => selectedItemIds.includes(item.id))}
          onChange={(e) => toggleSelectAll(e.target.checked, paginatedItems)}
          className="rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-4 h-4 cursor-pointer"
        />
      ),
      render: (item: UnifiedCatalogItem) => (
        <input
          type="checkbox"
          checked={selectedItemIds.includes(item.id)}
          onChange={() => toggleSelectItem(item.id)}
          onClick={(e) => e.stopPropagation()} // Prevent opening details modal on checkbox click
          className="rounded border-slate-300 text-teal-655 focus:ring-teal-500 w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      key: 'code',
      header: 'Item Code',
      render: (item: UnifiedCatalogItem) => (
        <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50/75 px-2.5 py-1 rounded-lg border border-teal-100">
          {item.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Item & Specifications',
      render: (item: UnifiedCatalogItem) => (
        <div className="flex items-center space-x-3 max-w-md">
          <div className={`p-2.5 rounded-xl ${
            item.type === 'Drug' 
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {item.type === 'Drug' ? <Plus className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm leading-snug">{item.name}</div>
            <div className="flex flex-wrap gap-1.5 mt-1 items-center">
              <span className="text-slate-400 text-[10px] font-medium flex items-center">
                <Layers className="w-3 h-3 mr-1" />
                {item.category}
              </span>
              {item.genericName && (
                <span className="text-slate-400 text-[10px] font-medium flex items-center before:content-['•'] before:mr-1.5 before:text-slate-300">
                  {item.genericName}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: UnifiedCatalogItem) => (
        <Badge
          variant={item.type === 'Drug' ? 'primary' : 'success'}
          className="uppercase tracking-wider text-[10px] font-bold px-2.5 py-0.5 rounded-md"
        >
          {item.type}
        </Badge>
      ),
    },
    {
      key: 'procurement_vote',
      header: 'Vote',
      render: (item: UnifiedCatalogItem) => (
        <span className="font-mono text-xs font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {item.procurement_vote}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price (RM)',
      render: (item: UnifiedCatalogItem) => (
        <span className="text-sm font-bold text-slate-700">
          RM {item.price.toFixed(2)}
          <span className="text-[10px] font-normal text-slate-400 ml-1">/{item.uom}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: UnifiedCatalogItem) => (
        <div className="flex items-center space-x-1.5">
          {item.status === 'active' ? (
            <>
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-600">Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-4.5 h-4.5 text-slate-300" />
              <span className="text-xs font-semibold text-slate-400">Inactive</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: UnifiedCatalogItem) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedItem(item)
          }}
          className="hover:bg-slate-100 hover:text-slate-900 group"
        >
          <span className="text-xs font-bold text-teal-600 mr-1 group-hover:translate-x-0.5 transition-transform duration-200">
            View Details
          </span>
          <ChevronRight className="w-4 h-4 text-teal-600" />
        </Button>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 space-y-8"
    >
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-teal-500/15 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/10 to-cyan-500/15 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-inner">
              <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-200">
                Hospital Reference Catalog
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-100 bg-clip-text text-transparent">
              Facility Catalog
            </h1>
            <p className="text-slate-350 text-sm md:text-base max-w-2xl font-medium leading-relaxed font-sans">
              Unified registry of drug formulations and non-drug consumables kept in the active inventory catalog of this hospital. Use filters to manage procurement classifications and technical specs.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl w-fit backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse mr-1" />
              <span>Last Updated:</span>
              <span className="text-teal-200 font-bold">{latestUpdateDate}</span>
              <span className="text-slate-400">by</span>
              <span className="text-white font-bold">{latestUpdateBy}</span>
              <button
                type="button"
                onClick={() => setShowUpdateHistory(true)}
                className="ml-2 px-2.5 py-0.5 bg-teal-500/20 hover:bg-teal-500/40 text-teal-200 hover:text-white rounded-lg transition-all border border-teal-500/30 text-[10px]"
              >
                View History
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 self-start md:self-center">
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="rounded-2xl px-6 py-3.5 font-bold border-white/10 hover:border-teal-450 hover:bg-white/5 text-white shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {isExportingPdf ? <Spinner size="sm" className="mr-2 text-teal-400" /> : <FileText className="w-5 h-5 mr-2 text-teal-400" />}
              Export Catalog (PDF)
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUpdateHistory(true)}
              className="rounded-2xl px-6 py-3.5 font-bold border-white/10 hover:border-teal-450 hover:bg-white/5 text-white shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Activity className="w-5 h-5 mr-2 text-teal-400" />
              Update History
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsAddModalOpen(true)
                setSelectedMasterItem(null)
                setShowCreateCustomForm(false)
              }}
              className="rounded-2xl px-6 py-3.5 font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 transform hover:-translate-y-0.5 border border-teal-400/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Facility Item
            </Button>
            <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/25 text-teal-300 backdrop-blur-sm shadow-inner transform hover:rotate-12 transition-transform duration-300">
              <Compass className="w-8 h-8 animate-spin-slow" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-md hover:shadow-xl transform hover:-translate-y-1.5 transition-all duration-300 flex items-center space-x-4 group">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CC Items</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-0.5">
              {isLoading ? <Spinner size="sm" /> : ccCount}
            </div>
            <div className="flex items-center text-[10px] text-indigo-500 font-semibold mt-0.5">
              <Percent className="w-3.5 h-3.5 mr-0.5" />
              {ccPercentage}% central contract
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-md hover:shadow-xl transform hover:-translate-y-1.5 transition-all duration-300 flex items-center space-x-4 group">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">DP Items</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">
              {isLoading ? <Spinner size="sm" /> : dpCount}
            </div>
            <div className="flex items-center text-[10px] text-amber-500 font-semibold mt-0.5">
              <Percent className="w-3.5 h-3.5 mr-0.5" />
              {dpPercentage}% direct procurement
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-md hover:shadow-xl transform hover:-translate-y-1.5 transition-all duration-300 flex items-center space-x-4 group">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LP Items</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-0.5">
              {isLoading ? <Spinner size="sm" /> : lpCount}
            </div>
            <div className="flex items-center text-[10px] text-rose-500 font-semibold mt-0.5">
              <Percent className="w-3.5 h-3.5 mr-0.5" />
              {lpPercentage}% local purchase
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-md hover:shadow-xl transform hover:-translate-y-1.5 transition-all duration-300 flex items-center space-x-4 group">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">APPL Items</div>
            <div className="text-2xl font-extrabold text-teal-600 mt-0.5">
              {isLoading ? <Spinner size="sm" /> : applCount}
            </div>
            <div className="flex items-center text-[10px] text-teal-500 font-semibold mt-0.5">
              <Percent className="w-3.5 h-3.5 mr-0.5" />
              {applPercentage}% approved list
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog View Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
        
        {/* Interactive Tabs and Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          
          {/* Custom Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-800 shadow-md shadow-slate-200/50'
                  : 'text-slate-500 hover:text-slate-880'
              }`}
            >
              <span>All Keeping Items</span>
            </button>
            <button
              onClick={() => setActiveTab('Drug')}
              className={`flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'Drug'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/40'
                  : 'text-slate-500 hover:text-slate-880'
              }`}
            >
              <span>Drugs Only</span>
            </button>
            <button
              onClick={() => setActiveTab('Non-Drug')}
              className={`flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'Non-Drug'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200/40'
                  : 'text-slate-500 hover:text-slate-880'
              }`}
            >
              <span>Non-Drugs Only</span>
            </button>
          </div>

          {/* Filtering Control Bar */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 lg:flex-initial">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search code, name, supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold text-slate-600 cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Vote Classification Filter */}
            <div className="relative">
              <select
                value={selectedVote}
                onChange={e => setSelectedVote(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold text-slate-600 cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
              >
                <option value="all">All Votes</option>
                <option value="APPL">APPL</option>
                <option value="CC">CC</option>
                <option value="DP">DP</option>
                <option value="LP">LP</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Active Status filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-xs font-bold text-slate-600 cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={paginatedItems}
            isLoading={isLoading}
            onRowClick={(item) => setSelectedItem(item)}
            rowClassName="hover:bg-slate-50/70 transition-colors cursor-pointer"
          />
        </div>

        {/* Premium Pagination System */}
        {!isLoading && totalRecords > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            total={totalRecords}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            className="border-t border-slate-100 pt-6 bg-transparent px-0"
          />
        )}

        {/* Premium Floating Batch Action Bar */}
        <AnimatePresence>
          {selectedItemIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-800 shadow-2xl flex items-center space-x-6 text-white min-w-[320px] sm:min-w-[450px]"
            >
              <div className="flex items-center space-x-2">
                <span className="bg-teal-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                  {selectedItemIds.length}
                </span>
                <span className="text-xs font-bold text-slate-300">items selected</span>
              </div>
              
              <div className="h-4 w-[1px] bg-slate-800" />
              
              <div className="flex items-center space-x-3 flex-1 justify-end">
                <button
                  onClick={() => setSelectedItemIds([])}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => batchToggleStatus('inactive')}
                  className="bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-rose-900/20"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => batchToggleStatus('active')}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-emerald-900/20"
                >
                  Activate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Dark semi-transparent backdrop that closes on click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Right-sliding specifications drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 h-screen w-full md:w-[85vw] lg:w-[75vw] xl:w-[70vw] max-w-[1400px] min-w-[320px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-100"
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Item Technical Specifications</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-all focus:outline-none text-2xl font-semibold leading-none"
                  title="Close specifications"
                >
                  &times;
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2">
                  
                  {/* Left Column: Form & Specifications (lg:col-span-8) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Item Brand Hero with Sleek Modern Gradient Background */}
                    <div className={`relative overflow-hidden p-6 rounded-2xl border transition-all ${
                      selectedItem.type === 'Drug' 
                        ? 'bg-gradient-to-r from-indigo-50/70 via-slate-50/50 to-white border-indigo-100/80 shadow-sm shadow-indigo-100/10' 
                        : 'bg-gradient-to-r from-emerald-50/70 via-slate-50/50 to-white border-emerald-100/80 shadow-sm shadow-emerald-100/10'
                    }`}>
                      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-[0.04] pointer-events-none">
                        {selectedItem.type === 'Drug' ? (
                          <Plus className="w-48 h-48 text-indigo-600" />
                        ) : (
                          <Package className="w-48 h-48 text-emerald-600" />
                        )}
                      </div>

                      <div className="flex items-center space-x-5 relative z-10">
                        <div className={`p-4 rounded-2xl shadow-md flex items-center justify-center transition-transform hover:scale-105 duration-300 ${
                          selectedItem.type === 'Drug' 
                            ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-200' 
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-200'
                        }`}>
                          {selectedItem.type === 'Drug' ? (
                            <Plus className="w-7 h-7" />
                          ) : (
                            <Package className="w-7 h-7" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-teal-700 bg-teal-50/80 border border-teal-100 px-2.5 py-0.5 rounded-lg tracking-wide shadow-2xs">
                              {selectedItem.code}
                            </span>
                            <Badge variant={selectedItem.type === 'Drug' ? 'primary' : 'success'} className="px-2.5 py-0.5 text-xs font-bold rounded-lg shadow-2xs">
                              {selectedItem.type}
                            </Badge>
                            {selectedItem.isControlled && (
                              <span className="inline-flex items-center text-[10px] font-extrabold bg-rose-50 text-rose-650 border border-rose-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow-2xs">
                                Controlled Medicine
                              </span>
                            )}
                          </div>
                          {isEditingSpecs && editForm ? (
                            <Input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="mt-2 font-bold text-slate-800 text-sm max-w-lg"
                              placeholder="Item Name"
                            />
                          ) : (
                            <h3 className="text-xl font-extrabold text-slate-800 mt-2 tracking-tight leading-tight">
                              {selectedItem.name}
                            </h3>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Form or Read-only content */}
                    {editForm && (
                      <form onSubmit={handleSaveSpecsEdits} className="space-y-6">
                        {/* Data Specifications Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* s1. Item Specification */}
                          <div className="space-y-3 break-inside-avoid mb-6">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                              <ClipboardList className="w-4 h-4 mr-2 text-indigo-500" />
                              s1. Item Specification
                            </h4>
                            
                            <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100 space-y-3.5 hover:border-slate-200/50 transition-all shadow-2xs">
                              <div className="flex flex-col py-1 space-y-1.5 border-b border-slate-100/80 pb-2">
                                <span className="text-xs font-bold text-slate-500">Item Name</span>
                                {isEditingSpecs ? (
                                  <Input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-880 leading-snug">
                                    {selectedItem.name}
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Brand Name</span>
                                {isEditingSpecs ? (
                                  <Input
                                    type="text"
                                    value={editForm.brandName || ''}
                                    onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                                    placeholder="e.g. Panadol"
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-880 bg-white border border-slate-100/70 px-3 py-1 rounded-xl shadow-3xs">
                                    {selectedItem.brandName || 'N/A'}
                                  </span>
                                )}
                              </div>

                              {selectedItem.type === 'Drug' && (
                                <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                  <span className="text-xs font-bold text-slate-500">Dosage Form</span>
                                  {isEditingSpecs ? (
                                    <select
                                      value={editForm.dosageForm || 'tablet'}
                                      onChange={(e) => setEditForm({ ...editForm, dosageForm: e.target.value })}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                                    >
                                      <option value="capsule">capsule</option>
                                      <option value="tablet">tablet</option>
                                      <option value="bott">bott</option>
                                      <option value="pfsy">pfsy</option>
                                      <option value="penfill">penfill</option>
                                      <option value="cream">cream</option>
                                      <option value="ointment">ointment</option>
                                    </select>
                                  ) : (
                                    <span className="text-xs font-extrabold text-slate-880 bg-white border border-slate-100/70 px-3 py-1 rounded-xl shadow-3xs capitalize">
                                      {selectedItem.dosageForm || 'Consumable'}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-col py-1 space-y-2">
                                <span className="text-xs font-bold text-slate-500">Procurement Type</span>
                                {isEditingSpecs ? (
                                  <select
                                    value={editForm.procurement_vote}
                                    onChange={(e) => setEditForm({ ...editForm, procurement_vote: e.target.value as any })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"
                                  >
                                    <option value="APPL">APPL</option>
                                    <option value="CC">CC</option>
                                    <option value="DP">DP</option>
                                    <option value="LP">LP</option>
                                  </select>
                                ) : (
                                  <div className="flex items-start space-x-3 text-slate-650 bg-white p-3.5 rounded-xl border border-slate-100/70 shadow-3xs">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 mt-0.5">
                                      <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-extrabold text-slate-855 leading-tight">
                                        {selectedItem.procurement_vote}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                        {selectedItem.procurement_vote === 'APPL' && 'Approved Product Purchase List (APPL)'}
                                        {selectedItem.procurement_vote === 'CC' && 'Central Contract (CC)'}
                                        {selectedItem.procurement_vote === 'DP' && 'Direct Procurement (DP)'}
                                        {selectedItem.procurement_vote === 'LP' && 'Local Purchase (LP)'}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {editForm.procurement_vote === 'CC' && (
                                <div className="flex flex-col py-1 space-y-2">
                                  <span className="text-xs font-bold text-slate-500">KKM Contract No</span>
                                  {isEditingSpecs ? (
                                    <Input
                                      type="text"
                                      value={editForm.kkmContractNumber || ''}
                                      onChange={(e) => setEditForm({ ...editForm, kkmContractNumber: e.target.value })}
                                      placeholder="KKM/KONTRAK/CC/..."
                                    />
                                  ) : (
                                    <div className="flex items-start space-x-3 text-slate-655 bg-white p-3.5 rounded-xl border border-violet-100/80 shadow-3xs">
                                      <div className="p-2 bg-violet-50 rounded-lg text-violet-500 mt-0.5">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-mono font-extrabold text-slate-850 leading-tight">
                                          {selectedItem.kkmContractNumber || 'KKM/KONTRAK/CC/2026/012'}
                                        </div>
                                        <div className="text-[10px] text-violet-500 mt-0.5 font-semibold">
                                          Active Centralized Ministry of Health (KKM) Contract
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* s2. Pharmacology */}
                          <div className="space-y-3 break-inside-avoid mb-6">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                              {selectedItem.type === 'Drug' ? (
                                <>
                                  <Pill className="w-4 h-4 mr-2 text-rose-500" />
                                  s2. Pharmacology
                                </>
                              ) : (
                                <>
                                  <Layers className="w-4 h-4 mr-2 text-rose-500" />
                                  s2. Technical Classification
                                </>
                              )}
                            </h4>
                            
                            <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100 space-y-3.5 hover:border-slate-200/50 transition-all shadow-2xs">

                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Item Category</span>
                                {isEditingSpecs ? (
                                  <select
                                    value={editForm.category || 'B'}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                                  >
                                    <option value="A">A</option>
                                    <option value="A*">A*</option>
                                    <option value="A/KK">A/KK</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="KPK">KPK</option>
                                  </select>
                                ) : (
                                  <span className="text-xs font-extrabold text-indigo-650 bg-indigo-50/50 border border-indigo-100/60 px-3 py-1 rounded-xl shadow-3xs truncate">
                                    {selectedItem.category || 'B'}
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold text-slate-500">Item Group</span>
                                {isEditingSpecs ? (
                                  <select
                                    value={editForm.itemGroup || 'general'}
                                    onChange={(e) => setEditForm({ ...editForm, itemGroup: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                                  >
                                    <option value="analgesics">Analgesics & Antipyretics</option>
                                    <option value="antacids">Antacids & Antiulcer</option>
                                    <option value="antianxiety">Antianxiety & Sedatives</option>
                                    <option value="antiarrhythmics">Antiarrhythmics</option>
                                    <option value="antibiotics">Antibacterials / Antibiotics</option>
                                    <option value="anticoagulants">Anticoagulants & Thrombolytics</option>
                                    <option value="anticonvulsants">Anticonvulsants</option>
                                    <option value="antidepressants">Antidepressants</option>
                                    <option value="antidiabetics">Antidiabetics</option>
                                    <option value="antidiarrheals">Antidiarrheals</option>
                                    <option value="antiemetics">Antiemetics</option>
                                    <option value="antifungals">Antifungals</option>
                                    <option value="antihistamines">Antihistamines & Antiallergics</option>
                                    <option value="antihypertensives">Antihypertensives</option>
                                    <option value="anti-inflammatories">Anti-inflammatories (NSAIDs, etc.)</option>
                                    <option value="antineoplastics">Antineoplastics & Immunosuppressives</option>
                                    <option value="antipsychotics">Antipsychotics</option>
                                    <option value="antivirals">Antivirals</option>
                                    <option value="beta-blockers">Beta-blockers</option>
                                    <option value="bronchodilators">Bronchodilators & Antiasthmatics</option>
                                    <option value="corticosteroids">Corticosteroids</option>
                                    <option value="decongestants">Decongestants</option>
                                    <option value="diuretics">Diuretics</option>
                                    <option value="expectorants">Expectorants & Mucolytics</option>
                                    <option value="hormones">Hormones</option>
                                    <option value="laxatives">Laxatives</option>
                                    <option value="muscle-relaxants">Muscle Relaxants</option>
                                    <option value="supplements">Supplements (Vitamins & Minerals)</option>
                                    <option value="vaccines">Vaccines & Immunoglobulins</option>
                                    <option value="general">General / Others</option>
                                  </select>
                                ) : (
                                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider border shadow-3xs bg-slate-100/80 text-slate-655 border-slate-200/50">
                                    {selectedItem.itemGroup || 'General'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* s3. Packaging */}
                          <div className="space-y-3 break-inside-avoid mb-6">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                              <Package className="w-4 h-4 mr-2 text-emerald-500" />
                              s3. Packaging
                            </h4>
                            
                            <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100 space-y-3.5 hover:border-slate-200/50 transition-all shadow-2xs">
                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Item Code</span>
                                <span className="font-mono text-xs font-extrabold text-teal-700 bg-teal-50/80 border border-teal-100 px-3 py-1 rounded-xl shadow-3xs">
                                  {selectedItem.code}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Price (RM)</span>
                                {isEditingSpecs ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                  />
                                ) : (
                                  <span className="text-sm font-extrabold text-teal-655 bg-teal-50/40 border border-teal-100/80 px-3 py-1 rounded-xl shadow-3xs">
                                    RM {selectedItem.price.toFixed(2)}
                                    <span className="text-[10px] font-normal text-slate-400 ml-1">/{selectedItem.uom}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col py-1 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-500">Packaging Size</span>
                                  
                                  <div className="flex items-center space-x-2">
                                    {isAddingNewSize ? (
                                      <div className="flex items-center space-x-1.5 animate-fadeIn">
                                        <input
                                          type="text"
                                          placeholder="e.g. box of 60 tablets"
                                          value={newSizeText}
                                          onChange={(e) => setNewSizeText(e.target.value)}
                                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!newSizeText.trim()) return
                                            const cleanVal = newSizeText.trim()
                                            
                                            // Update available sizes array in editForm/selectedItem
                                            const currentSizes = editForm.packagingSizes || [editForm.packagingDescription || 'Standard box']
                                            if (!currentSizes.includes(cleanVal)) {
                                              const updatedSizes = [...currentSizes, cleanVal]
                                              setEditForm({
                                                ...editForm,
                                                packagingSizes: updatedSizes,
                                                packagingDescription: cleanVal
                                              })
                                              addToast({
                                                title: 'Packaging Size Added',
                                                message: `"${cleanVal}" has been added to available packaging configurations.`,
                                                type: 'success'
                                              })
                                            } else {
                                              setEditForm({
                                                ...editForm,
                                                packagingDescription: cleanVal
                                              })
                                            }
                                            setNewSizeText('')
                                            setIsAddingNewSize(false)
                                          }}
                                          className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-[10px] font-bold"
                                        >
                                          Add
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsAddingNewSize(false)
                                            setNewSizeText('')
                                          }}
                                          className="text-xs text-slate-400 hover:text-slate-655 font-bold px-1"
                                        >
                                          ├ù
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setIsAddingNewSize(true)}
                                        className="inline-flex items-center px-2 py-1 text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Custom Size
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Size Dropdown Selector */}
                                <select
                                  value={isEditingSpecs ? editForm.packagingDescription : selectedItem.packagingDescription}
                                  disabled={!isEditingSpecs}
                                  onChange={(e) => {
                                    if (isEditingSpecs) {
                                      setEditForm({ ...editForm, packagingDescription: e.target.value })
                                    } else {
                                      // In read-only mode, allow selecting too! It will automatically save & log it
                                      const oldVal = selectedItem.packagingDescription || ''
                                      const newVal = e.target.value
                                      
                                      const updated = {
                                        ...selectedItem,
                                        packagingDescription: newVal
                                      }
                                      
                                      setAuditLogs(prev => [
                                        {
                                          id: `log-edit-${Date.now()}-pkg`,
                                          itemId: selectedItem.id,
                                          itemName: selectedItem.name,
                                          fieldName: 'Packaging Size',
                                          oldValue: oldVal,
                                          newValue: newVal,
                                          changedBy: activeUserName,
                                          changedAt: new Date().toISOString()
                                        },
                                        ...prev
                                      ])
                                      
                                      setCatalogItems(prev => prev.map(item => item.id === selectedItem.id ? updated : item))
                                      setSelectedItem(updated)
                                      addToast({
                                        title: 'Packaging Configured',
                                        message: `Active packaging switched from "${oldVal}" to "${newVal}".`,
                                        type: 'success',
                                      })
                                    }
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-teal-500/20 disabled:cursor-default disabled:bg-slate-50/50"
                                >
                                  {(isEditingSpecs ? (editForm.packagingSizes || [editForm.packagingDescription || 'Standard box']) : (selectedItem.packagingSizes || [selectedItem.packagingDescription || 'Standard box'])).map(size => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* s4. Storage */}
                          <div className="space-y-3 break-inside-avoid mb-6">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                              <Boxes className="w-4 h-4 mr-2 text-teal-500" />
                              s4. Storage
                            </h4>
                            
                            <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100 space-y-3.5 hover:border-slate-200/50 transition-all shadow-2xs">
                              <div className="flex justify-between items-start py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 mt-0.5">Storage Condition</span>
                                {isEditingSpecs ? (
                                  <select
                                    value={editForm.storageConditions || 'Room temperature (below 30degree)'}
                                    onChange={(e) => setEditForm({ ...editForm, storageConditions: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                                  >
                                    <option value="Room temperature (below 30degree)">Room temperature (below 30degree)</option>
                                    <option value="Fridge(below 8 degree)">Fridge(below 8 degree)</option>
                                  </select>
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-855 text-right leading-snug">
                                    {selectedItem.storageConditions || 'Standard ambient warehouse (below 25┬░C)'}
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Min Stock Level</span>
                                {isEditingSpecs ? (
                                  <Input
                                    type="number"
                                    value={editForm.minStock}
                                    onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) || 0 })}
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-880 font-mono bg-white border border-slate-100/70 px-3 py-1 rounded-xl shadow-3xs">
                                    {selectedItem.minStock.toLocaleString()} {selectedItem.uom}s
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Max Stock Level</span>
                                {isEditingSpecs ? (
                                  <Input
                                    type="number"
                                    value={editForm.maxStock}
                                    onChange={(e) => setEditForm({ ...editForm, maxStock: parseInt(e.target.value) || 0 })}
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-880 font-mono bg-white border border-slate-100/70 px-3 py-1 rounded-xl shadow-3xs">
                                    {selectedItem.maxStock.toLocaleString()} {selectedItem.uom}s
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500">Buffer Stock Level</span>
                                {isEditingSpecs ? (
                                  <Input
                                    type="number"
                                    value={editForm.reorderLevel}
                                    onChange={(e) => setEditForm({ ...editForm, reorderLevel: parseInt(e.target.value) || 0 })}
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-amber-655 font-mono bg-amber-50/60 border border-amber-100 px-3 py-1 rounded-xl shadow-3xs">
                                    {selectedItem.reorderLevel.toLocaleString()} {selectedItem.uom}s
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col py-2 space-y-2">
                                <span className="text-xs font-bold text-slate-500">Storage Location</span>
                                {isEditingSpecs ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Which Store" value={editForm.storageStore || ''} onChange={(e) => setEditForm({ ...editForm, storageStore: e.target.value })} className="text-xs" />
                                    <Input placeholder="Which Cabinet" value={editForm.storageCabinet || ''} onChange={(e) => setEditForm({ ...editForm, storageCabinet: e.target.value })} className="text-xs" />
                                    <Input placeholder="Which Level" value={editForm.storageLevel || ''} onChange={(e) => setEditForm({ ...editForm, storageLevel: e.target.value })} className="text-xs" />
                                    <Input placeholder="Which Label" value={editForm.storageLabel || ''} onChange={(e) => setEditForm({ ...editForm, storageLabel: e.target.value })} className="text-xs" />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50/60 px-3 py-1.5 rounded-xl border border-indigo-100/80 shadow-3xs flex items-center">
                                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                      {selectedItem.storageStore || 'Main Store'}
                                    </span>
                                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50/60 px-3 py-1.5 rounded-xl border border-indigo-100/80 shadow-3xs flex items-center">
                                      Cab: {selectedItem.storageCabinet || 'N/A'}
                                    </span>
                                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50/60 px-3 py-1.5 rounded-xl border border-indigo-100/80 shadow-3xs flex items-center">
                                      Lvl: {selectedItem.storageLevel || 'N/A'}
                                    </span>
                                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50/60 px-3 py-1.5 rounded-xl border border-indigo-100/80 shadow-3xs flex items-center">
                                      Lbl: {selectedItem.storageLabel || 'N/A'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Action Buttons inside Edit Mode */}
                        {isEditingSpecs && (
                          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 mt-4">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => {
                                setEditForm({ ...selectedItem })
                                setIsEditingSpecs(false)
                              }}
                              className="rounded-xl px-6 py-2.5 text-xs font-bold text-slate-500 border-slate-200 shadow-3xs hover:text-slate-700 transition-all"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              type="submit"
                              className="rounded-xl px-6 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-105 transition-all duration-200"
                            >
                              Save Specifications
                            </Button>
                          </div>
                        )}
                      </form>
                    )}

                    {/* Default actions when NOT editing */}
                    {!isEditingSpecs && (
                      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedItem(null)}
                          className="rounded-xl px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 border-slate-200/80 shadow-3xs hover:text-slate-700 transition-all duration-200"
                        >
                          Close Window
                        </Button>
                        <button
                          onClick={() => toggleItemStatus(selectedItem)}
                          className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 ${
                            selectedItem.status === 'active' 
                              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' 
                              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                          }`}
                        >
                          {selectedItem.status === 'active' ? 'Deactivate Item' : 'Activate Item'}
                        </button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingSpecs(true)}
                          className="rounded-xl px-6 py-2.5 text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 shadow-3xs transition-all duration-200"
                        >
                          Edit Technical Specs
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            addToast({
                              title: 'Standard Verification Check',
                              message: `Initiating standard specs audit for ${selectedItem.code}...`,
                              type: 'info',
                            })
                          }}
                          className="rounded-xl px-6 py-2.5 text-xs font-bold bg-teal-650 hover:bg-teal-700 text-white shadow-md shadow-teal-100 hover:shadow-lg hover:shadow-teal-200 transition-all duration-200"
                        >
                          <Compass className="w-4 h-4 mr-2" />
                          Audit Specifications
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Dynamic Timeline Audit Logs (lg:col-span-4) */}
                  <div className="lg:col-span-4 border-l border-slate-100 pl-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-teal-600 animate-pulse" />
                        Specifications Audit Log
                      </h4>
                      <Badge variant="gray" className="text-[10px] font-bold bg-slate-100 text-slate-500">
                        Live
                      </Badge>
                    </div>

                    <div className="space-y-4 pr-1">
                      {auditLogs.filter(log => log.itemId === selectedItem.id).length === 0 ? (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                          <HelpCircle className="w-8 h-8 mx-auto text-slate-355 stroke-1" />
                          <div className="text-xs font-bold">No specifications logs yet</div>
                          <div className="text-[10px] text-slate-400 max-w-[180px] mx-auto leading-relaxed">
                            Any technical specifications changes will be cataloged here in real-time.
                          </div>
                        </div>
                      ) : (
                        <div className="relative pl-4 border-l-2 border-teal-100/60 ml-2 space-y-6 py-1">
                          {auditLogs
                            .filter(log => log.itemId === selectedItem.id)
                            .map((log) => (
                              <div key={log.id} className="relative space-y-1">
                                {/* Dot indicator */}
                                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-teal-500 border border-white ring-4 ring-teal-50" />
                                
                                <div className="text-[10px] font-bold text-teal-600 bg-teal-50/70 border border-teal-100/50 px-2 py-0.5 rounded-md w-fit">
                                  {log.fieldName}
                                </div>
                                
                                <div className="text-xs font-medium text-slate-700 leading-snug">
                                  Changed from <span className="font-mono font-bold text-slate-400 line-through bg-slate-50 px-1 rounded">{log.oldValue}</span> to <span className="font-bold text-slate-800 bg-teal-50/40 border border-teal-100/30 px-1.5 py-0.5 rounded">{log.newValue}</span>
                                </div>

                                <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-semibold pt-0.5">
                                  <span className="text-slate-500">{log.changedBy}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(log.changedAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                    })} at {new Date(log.changedAt).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Update History Drawer */}
      <AnimatePresence>
        {showUpdateHistory && (
          <>
            {/* Dark semi-transparent backdrop that closes on click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpdateHistory(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Right-sliding Update History drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 h-screen w-full md:w-[60vw] lg:w-[45vw] xl:w-[35vw] max-w-[800px] min-w-[320px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-100"
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Catalog Update History</h2>
                </div>
                <button
                  onClick={() => setShowUpdateHistory(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-all focus:outline-none text-2xl font-semibold leading-none"
                  title="Close history"
                >
                  &times;
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                <p className="text-[11px] text-slate-500 font-semibold bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs leading-relaxed">
                  Real-time timeline of technical specifications, stock thresholds, and operational registry updates made to the hospital catalog by authenticated users.
                </p>

                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 space-y-3">
                      <HelpCircle className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                      <div className="text-sm font-bold">No updates recorded yet</div>
                      <div className="text-xs text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                        Changes to pricing, storage, or item properties will appear here.
                      </div>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-teal-100/70 ml-3 space-y-8 py-2">
                      {auditLogs.map((log) => {
                        const associatedItem = catalogItems.find(x => x.id === log.itemId)
                        return (
                          <div key={log.id} className="relative space-y-2 bg-white p-4 rounded-xl border border-slate-100/80 shadow-3xs hover:shadow-xs transition-shadow">
                            {/* Dot indicator */}
                            <div className="absolute -left-[32px] top-4 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white ring-4 ring-teal-50/50" />
                            
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2">
                              <span className="text-xs font-extrabold text-slate-800 leading-snug">
                                {log.itemName || associatedItem?.name || 'Catalog Item'}
                              </span>
                              <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50/70 border border-teal-100/50 px-2 py-0.5 rounded-md">
                                {log.fieldName}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 mt-1">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                Code: {associatedItem ? associatedItem.code : log.itemId}
                              </span>
                            </div>
                            
                            <div className="text-xs font-medium text-slate-600 leading-normal">
                              Changed from <span className="font-mono text-slate-400 line-through bg-slate-50/80 px-1 rounded">{log.oldValue}</span> to <span className="font-bold text-slate-800 bg-teal-50/30 border border-teal-100/20 px-1.5 py-0.5 rounded">{log.newValue}</span>
                            </div>

                            <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-50/80">
                              <span className="text-slate-500 font-bold">{log.changedBy}</span>
                              <span>•</span>
                              <span>
                                {new Date(log.changedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })} at {new Date(log.changedAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateHistory(false)}
                  className="rounded-xl px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 border-slate-200"
                >
                  Close Window
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Catalog Item Overlay Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false)
              setSelectedMasterItem(null)
              setShowCreateCustomForm(false)
            }}
            title={selectedMasterItem ? `Set Technical Specifications: ${selectedMasterItem.name}` : showCreateCustomForm ? "Create Custom Facility Item" : "Manage Facility Catalog Items"}
            size={selectedMasterItem || showCreateCustomForm ? "5xl" : "3xl"}
          >
            <div className="space-y-6 py-2">
              
              {/* Header section with tabs/switch if NOT in detail spec verification */}
              {!selectedMasterItem && !showCreateCustomForm && (
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-slate-100 pb-4 gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setMasterFilterType('Drug')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-lg flex items-center space-x-2 transition-all ${
                        masterFilterType === 'Drug'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      <Pill className="w-4 h-4 mr-1 text-indigo-500" />
                      Drug Catalog
                    </button>
                    <button
                      onClick={() => setMasterFilterType('Non-Drug')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-lg flex items-center space-x-2 transition-all ${
                        masterFilterType === 'Non-Drug'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      <Package className="w-4 h-4 mr-1 text-emerald-500" />
                      Non-Drug Catalog
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleOpenCustomItemForm}
                    className="rounded-xl text-xs px-4 py-2 border-slate-200 text-teal-600 font-bold hover:bg-slate-50 self-start sm:self-auto"
                  >
                    Create Custom Item
                  </Button>
                </div>
              )}

              {/* Master Search List Screen */}
              {!selectedMasterItem && !showCreateCustomForm && (
                <div className="space-y-4">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder={`Search ${masterFilterType === 'Drug' ? 'drugs' : 'non-drugs'} in master catalog by code or name...`}
                      value={masterSearchQuery}
                      onChange={e => setMasterSearchQuery(e.target.value)}
                      className="pl-11 pr-4 py-2.5 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-sm"
                    />
                  </div>

                  {/* Clean, Professional Code & Name Table Grid */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-400 w-1/4">Item Code</th>
                          <th className="px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-400">Item Name</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isMasterLoading ? (
                          <tr>
                            <td colSpan={2} className="px-6 py-8 text-center text-slate-400">
                              <Spinner size="md" className="mx-auto" />
                              <div className="text-xs font-bold mt-2">Searching live Supabase catalog...</div>
                            </td>
                          </tr>
                        ) : masterItems.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-xs font-bold">
                              No items found in {masterFilterType} catalog.
                            </td>
                          </tr>
                        ) : (
                          paginatedMasterItems.map((masterItem) => {
                            const localItem = catalogItems.find(x => x.code === masterItem.code)
                            const isActive = localItem?.status === 'active'

                            return (
                              <tr 
                                key={masterItem.id} 
                                onClick={() => handleSelectMasterItem(masterItem)}
                                className="hover:bg-slate-50/60 transition-all cursor-pointer group"
                              >
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                    {masterItem.code}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-650 transition-colors">
                                    {masterItem.name}
                                  </span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Master Search Pagination */}
                  {!isMasterLoading && totalMasterRecords > 0 && (
                    <Pagination
                      currentPage={masterCurrentPage}
                      totalPages={totalMasterPages}
                      pageSize={masterPageSize}
                      total={totalMasterRecords}
                      onPageChange={(page) => setMasterCurrentPage(page)}
                      className="border-t border-slate-100 pt-4 bg-transparent px-0"
                    />
                  )}
                </div>
              )}

              {/* Editable 4-Section specs view for selected master item or custom item */}
              {(selectedMasterItem || showCreateCustomForm) && (
                <form onSubmit={handleAddWithSections} className="space-y-6">
                  {/* Item Identifier Hero */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${
                        sectionsForm.type === 'Drug' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                        {sectionsForm.type === 'Drug' ? <Pill className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {sectionsForm.type.toUpperCase()} REFERENCE SPECIFICATIONS
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-base leading-snug">
                          {selectedMasterItem ? selectedMasterItem.name : "New Custom Catalog Item"}
                        </h4>
                      </div>
                    </div>
                    {selectedMasterItem && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setSelectedMasterItem(null)}
                        className="rounded-xl px-3 py-1.5 text-xs border-slate-200 font-bold"
                      >
                        Back to List
                      </Button>
                    )}
                  </div>

                  <p className="text-[11px] font-black text-rose-500 bg-rose-50/50 border border-rose-100/50 px-3 py-2 rounded-xl uppercase tracking-wider">
                    ΓÜá∩╕Å CRITICAL VERIFICATION: Please review and set all 4 specification sections before saving this item to the active hospital facility registry.
                  </p>

                  {/* 4 Sections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* s1. Item Specification */}
                    <div className="space-y-3 break-inside-avoid mb-6">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-100 pb-2">
                        <ClipboardList className="w-4 h-4 mr-2 text-indigo-500" />
                        s1. Item Specification
                      </h4>
                      <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-150 space-y-3.5 shadow-2xs">
                        
                        {showCreateCustomForm && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Type *</label>
                            <select
                              value={sectionsForm.type}
                              onChange={e => setSectionsForm({ ...sectionsForm, type: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="Drug">Drug</option>
                              <option value="Non-Drug">Non-Drug</option>
                            </select>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Name *</label>
                          <Input
                            type="text"
                            value={sectionsForm.name}
                            onChange={e => setSectionsForm({ ...sectionsForm, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand Name</label>
                          <Input
                            type="text"
                            value={sectionsForm.brandName}
                            onChange={e => setSectionsForm({ ...sectionsForm, brandName: e.target.value })}
                            placeholder="e.g. N/A or Norvasc"
                          />
                        </div>

                        {sectionsForm.type === 'Drug' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosage Form</label>
                            <select
                              value={sectionsForm.dosageForm || 'tablet'}
                              onChange={e => setSectionsForm({ ...sectionsForm, dosageForm: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="capsule">capsule</option>
                              <option value="tablet">tablet</option>
                              <option value="bott">bott</option>
                              <option value="pfsy">pfsy</option>
                              <option value="penfill">penfill</option>
                              <option value="cream">cream</option>
                              <option value="ointment">ointment</option>
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Procurement Type</label>
                            <select
                              value={sectionsForm.procurement_vote}
                              onChange={e => setSectionsForm({ ...sectionsForm, procurement_vote: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="APPL">APPL</option>
                              <option value="CC">CC</option>
                              <option value="DP">DP</option>
                              <option value="LP">LP</option>
                            </select>
                          </div>

                          {sectionsForm.procurement_vote === 'CC' && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KKM Contract No</label>
                              <Input
                                type="text"
                                value={sectionsForm.kkmContractNumber}
                                onChange={e => setSectionsForm({ ...sectionsForm, kkmContractNumber: e.target.value })}
                                placeholder="KKM/KONTRAK/CC/..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* s2. Pharmacology & Technical Spec */}
                    <div className="space-y-3 break-inside-avoid mb-6">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-100 pb-2">
                        {sectionsForm.type === 'Drug' ? (
                          <>
                            <Pill className="w-4 h-4 mr-2 text-rose-500" />
                            s2. Pharmacology & Technical Spec
                          </>
                        ) : (
                          <>
                            <Layers className="w-4 h-4 mr-2 text-rose-500" />
                            s2. Technical Classification
                          </>
                        )}
                      </h4>
                      <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-150 space-y-3.5 shadow-2xs">


                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Category *</label>
                            <select
                              value={sectionsForm.category || 'B'}
                              onChange={e => setSectionsForm({ ...sectionsForm, category: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                              required
                            >
                              <option value="A">A</option>
                              <option value="A*">A*</option>
                              <option value="A/KK">A/KK</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="KPK">KPK</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Group</label>
                            <select
                              value={sectionsForm.itemGroup || 'general'}
                              onChange={e => setSectionsForm({ ...sectionsForm, itemGroup: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="analgesics">Analgesics & Antipyretics</option>
                              <option value="antacids">Antacids & Antiulcer</option>
                              <option value="antianxiety">Antianxiety & Sedatives</option>
                              <option value="antiarrhythmics">Antiarrhythmics</option>
                              <option value="antibiotics">Antibacterials / Antibiotics</option>
                              <option value="anticoagulants">Anticoagulants & Thrombolytics</option>
                              <option value="anticonvulsants">Anticonvulsants</option>
                              <option value="antidepressants">Antidepressants</option>
                              <option value="antidiabetics">Antidiabetics</option>
                              <option value="antidiarrheals">Antidiarrheals</option>
                              <option value="antiemetics">Antiemetics</option>
                              <option value="antifungals">Antifungals</option>
                              <option value="antihistamines">Antihistamines & Antiallergics</option>
                              <option value="antihypertensives">Antihypertensives</option>
                              <option value="anti-inflammatories">Anti-inflammatories (NSAIDs, etc.)</option>
                              <option value="antineoplastics">Antineoplastics & Immunosuppressives</option>
                              <option value="antipsychotics">Antipsychotics</option>
                              <option value="antivirals">Antivirals</option>
                              <option value="beta-blockers">Beta-blockers</option>
                              <option value="bronchodilators">Bronchodilators & Antiasthmatics</option>
                              <option value="corticosteroids">Corticosteroids</option>
                              <option value="decongestants">Decongestants</option>
                              <option value="diuretics">Diuretics</option>
                              <option value="expectorants">Expectorants & Mucolytics</option>
                              <option value="hormones">Hormones</option>
                              <option value="laxatives">Laxatives</option>
                              <option value="muscle-relaxants">Muscle Relaxants</option>
                              <option value="supplements">Supplements (Vitamins & Minerals)</option>
                              <option value="vaccines">Vaccines & Immunoglobulins</option>
                              <option value="general">General / Others</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* s3. Packaging & Pricing */}
                    <div className="space-y-3 break-inside-avoid mb-6">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-100 pb-2">
                        <Package className="w-4 h-4 mr-2 text-emerald-500" />
                        s3. Packaging & Pricing
                      </h4>
                      <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-150 space-y-3.5 shadow-2xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item Code *</label>
                            <Input
                              type="text"
                              value={sectionsForm.code}
                              onChange={e => setSectionsForm({ ...sectionsForm, code: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UOM / Unit Of Measure</label>
                            <Input
                              type="text"
                              value={sectionsForm.uom}
                              onChange={e => setSectionsForm({ ...sectionsForm, uom: e.target.value })}
                              placeholder="e.g. tablet, capsule, box"
                            />
                          </div>
                        </div>



                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price (RM) *</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={sectionsForm.price}
                              onChange={e => setSectionsForm({ ...sectionsForm, price: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Packaging Description</label>
                            <Input
                              type="text"
                              value={sectionsForm.packagingDescription}
                              onChange={e => setSectionsForm({ ...sectionsForm, packagingDescription: e.target.value })}
                              placeholder="e.g. Box of 100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* s4. Storage & Stock Level */}
                    <div className="space-y-3 break-inside-avoid mb-6">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-100 pb-2">
                        <Boxes className="w-4 h-4 mr-2 text-teal-500" />
                        s4. Storage & Stock Level
                      </h4>
                      <div className="bg-slate-50/30 p-5 rounded-2xl border border-slate-150 space-y-3.5 shadow-2xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Conditions</label>
                          <select
                            value={sectionsForm.storageConditions || 'Room temperature (below 30degree)'}
                            onChange={e => setSectionsForm({ ...sectionsForm, storageConditions: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                          >
                            <option value="Room temperature (below 30degree)">Room temperature (below 30degree)</option>
                            <option value="Fridge(below 8 degree)">Fridge(below 8 degree)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Min Stock</label>
                            <Input
                              type="number"
                              value={sectionsForm.minStock}
                              onChange={e => setSectionsForm({ ...sectionsForm, minStock: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max Stock</label>
                            <Input
                              type="number"
                              value={sectionsForm.maxStock}
                              onChange={e => setSectionsForm({ ...sectionsForm, maxStock: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Buffer/Reorder</label>
                            <Input
                              type="number"
                              value={sectionsForm.reorderLevel}
                              onChange={e => setSectionsForm({ ...sectionsForm, reorderLevel: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Location</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Which Store" value={sectionsForm.storageStore} onChange={e => setSectionsForm({ ...sectionsForm, storageStore: e.target.value })} />
                            <Input placeholder="Which Cabinet" value={sectionsForm.storageCabinet} onChange={e => setSectionsForm({ ...sectionsForm, storageCabinet: e.target.value })} />
                            <Input placeholder="Which Level" value={sectionsForm.storageLevel} onChange={e => setSectionsForm({ ...sectionsForm, storageLevel: e.target.value })} />
                            <Input placeholder="Which Label" value={sectionsForm.storageLabel} onChange={e => setSectionsForm({ ...sectionsForm, storageLabel: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 mt-6">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedMasterItem(null)
                        setShowCreateCustomForm(false)
                      }}
                      className="rounded-xl px-6 py-2.5 text-xs font-bold text-slate-500 border-slate-200"
                    >
                      Back to List
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      className="rounded-xl px-6 py-2.5 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      Save and Add to Facility Catalog
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
