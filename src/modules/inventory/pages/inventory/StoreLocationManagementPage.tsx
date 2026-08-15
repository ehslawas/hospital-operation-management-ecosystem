import React, { useEffect, useState, useMemo } from 'react'
import {
  MapPin,
  Building2,
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  ClipboardList,
  Thermometer,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Box,
  Eye,
  RefreshCw,
  FolderTree,
  LayoutGrid,
  Settings,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Archive,
  Grid,
  Tag,
  Folder,
  Pill,
  Printer,
  FileText,
  Download,
  PlusCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { Spinner, Modal, Button, SlideOver, Badge } from '@/components/ui'
import {
  loadStoreLocations,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
  getStoreLocationsWithOccupancy,
  formatLocationString,
  generateLocationCode,
  generateUniqueLocationCode,
} from '@/services/pharmacy/storeLocationService'
import { generateStoreLocationPdf } from '@/services/pharmacy/storeLocationPdfService'
import { loadFacilityDrugInventory, bulkAssignLocationToFacilityDrugItems } from '@/services/pharmacy/facilityDrugInventoryService'
import { loadStoreSubLocations, syncStoreSubLocations } from '@/services/pharmacy/storeSubLocationService'
import type { StoreLocationWithOccupancy, StoreLocationFormData, StoreLocationType, StorageCondition } from '@/types/pharmacy'

export type SubLocationType = 'cabinet' | 'rack' | 'pallet' | 'level' | 'column'

export interface SubLocationUnit {
  id: string
  store_id?: string
  type: SubLocationType
  name: string
  code: string
  parent_name?: string
  notes?: string
}

const SUB_LOCATION_TYPES: { type: SubLocationType; label: string; sublabel: string; color: string }[] = [
  { type: 'cabinet', label: 'Kabinet / Cabinet', sublabel: 'Unit Fizikal Utama', color: 'purple' },
  { type: 'rack', label: 'Rak / Rack', sublabel: 'Rak Simpanan', color: 'amber' },
  { type: 'pallet', label: 'Palet / Pallet', sublabel: 'Lantai / Pukal', color: 'orange' },
  { type: 'level', label: 'Tingkat / Level', sublabel: 'Pelantar / Shelf', color: 'teal' },
  { type: 'column', label: 'Ruangan / Column', sublabel: 'Kotak / Bin ID', color: 'blue' },
]

const DEPARTMENT_OPTIONS = [
  { code: 'LOG', label: 'Logistik Farmasi (LOG)', prefix: 'LOG' },
  { code: 'SAT', label: 'Farmasi Satelit (SAT)', prefix: 'SAT' },
  { code: 'ETU', label: 'Kecemasan & Trauma (ETU)', prefix: 'ETU' },
  { code: 'IPD', label: 'Farmasi Pesakit Dalam (IPD)', prefix: 'IPD' },
  { code: 'OPD', label: 'Farmasi Pesakit Luar (OPD)', prefix: 'OPD' },
  { code: 'WRD', label: 'Wad Pesakit / General Ward (WRD)', prefix: 'WRD' },
  { code: 'LAB', label: 'Makmal Perubatan (LAB)', prefix: 'LAB' },
  { code: 'OT', label: 'Dewan Bedah / OT (OT)', prefix: 'OT' },
  { code: 'ICU', label: 'Unit Rawatan Rapi / ICU (ICU)', prefix: 'ICU' },
  { code: 'RAD', label: 'Jabatan Radiologi (RAD)', prefix: 'RAD' },
  { code: 'CSSD', label: 'Bekalan Steril Central (CSSD)', prefix: 'CSSD' },
  { code: 'GEN', label: 'Pengurusan Stor Am (GEN)', prefix: 'GEN' },
]

export const StoreLocationManagementPage: React.FC = () => {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-lawas-01'

  const { success: showSuccess, error: showError } = useToastStore()

  // Main state
  const [locations, setLocations] = useState<StoreLocationWithOccupancy[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingLocation, setEditingLocation] = useState<StoreLocationWithOccupancy | null>(null)

  // Selected Store Location Detail View State
  const [selectedStoreLocation, setSelectedStoreLocation] = useState<StoreLocationWithOccupancy | null>(null)

  // Form states
  const [departmentInput, setDepartmentInput] = useState<string>('LOG')
  const [storeNameInput, setStoreNameInput] = useState<string>('')
  const [cabinetRackInput, setCabinetRackInput] = useState<string>('')
  const [shelfLevelInput, setShelfLevelInput] = useState<string>('')
  const [locationCodeInput, setLocationCodeInput] = useState<string>('')
  const [locationTypeInput, setLocationTypeInput] = useState<StoreLocationType>('both')
  const [storageConditionInput, setStorageConditionInput] = useState<StorageCondition>('ambient')
  const [descriptionInput, setDescriptionInput] = useState<string>('')
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Sub-Location (Pallet, Rack, Cabinet, Level, Column) State
  const [subLocations, setSubLocations] = useState<SubLocationUnit[]>([])
  const [placedDrugItems, setPlacedDrugItems] = useState<any[]>([])

  // Modal state for Rack / Level item list inspection
  const [subLocationItemsModalData, setSubLocationItemsModalData] = useState<{
    isOpen: boolean
    title: string
    subtitle: string
    items: any[]
  } | null>(null)

  const isSubLocationItemMatch = (item: any, mainUnit: SubLocationUnit, childUnit?: SubLocationUnit): boolean => {
    if (!item) return false
    const rawLoc = (item.location || item.storage_conditions || '').trim()
    if (!rawLoc) return false

    // Normalize string for fuzzy matching (lowercase, replace '0' with 'o', strip non-alphanumeric)
    const norm = (s: string) => (s || '').toLowerCase().replace(/0/g, 'o').replace(/[^a-z0-9]/gi, '')

    const cleanLoc = norm(rawLoc)
    const mainName = norm(mainUnit.name)
    const mainCode = norm(mainUnit.code || '')

    const matchesMain = (mainName && cleanLoc.includes(mainName)) || (mainCode && cleanLoc.includes(mainCode))
    if (!matchesMain) return false

    if (!childUnit) return true

    const childName = norm(childUnit.name)
    const childCode = norm(childUnit.code || '')
    const matchesChild = Boolean((childName && cleanLoc.includes(childName)) || (childCode && cleanLoc.includes(childCode)))

    return matchesChild
  }

  const handleOpenRackItemsModal = (mainUnit: SubLocationUnit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const rackItems = placedDrugItems.filter(item => isSubLocationItemMatch(item, mainUnit))
    setSubLocationItemsModalData({
      isOpen: true,
      title: `Senarai Item di ${mainUnit.name}`,
      subtitle: `Semua ubat & bekalan berdaftar di ${mainUnit.name} (${selectedStoreLocation?.store_name || ''})`,
      items: rackItems,
    })
  }

  const handleOpenLevelItemsModal = (mainUnit: SubLocationUnit, childUnit: SubLocationUnit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const levelItems = placedDrugItems.filter(item => isSubLocationItemMatch(item, mainUnit, childUnit))
    setSubLocationItemsModalData({
      isOpen: true,
      title: `Senarai Item di ${mainUnit.name} › ${childUnit.name}`,
      subtitle: `Ubat & bekalan berdaftar di ${childUnit.name} (${mainUnit.name} - ${selectedStoreLocation?.store_name || ''})`,
      items: levelItems,
    })
  }

  // Bulk Location Assignment Modal State
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState<boolean>(false)
  const [bulkAssignTargetUnit, setBulkAssignTargetUnit] = useState<{ mainUnit: SubLocationUnit; childUnit?: SubLocationUnit } | null>(null)
  const [bulkAssignSearchTerm, setBulkAssignSearchTerm] = useState<string>('')
  const [bulkAssignFilterMode, setBulkAssignFilterMode] = useState<'all' | 'unassigned' | 'here'>('all')
  const [bulkAssignProcurementFilter, setBulkAssignProcurementFilter] = useState<'all' | 'APPL' | 'CC' | 'LP' | 'DP'>('all')
  const [selectedDrugIdsForAssign, setSelectedDrugIdsForAssign] = useState<Set<string>>(new Set())
  const [isSavingBulkAssign, setIsSavingBulkAssign] = useState<boolean>(false)

  const getProcurementCategory = (item: any): 'APPL' | 'CC' | 'LP' | 'DP' => {
    if (!item) return 'DP'

    const rawVal =
      (typeof item.budget_source === 'string' ? item.budget_source : '') ||
      (typeof item.procurement_category === 'string' ? item.procurement_category : '') ||
      (typeof item.contract_type === 'string' ? item.contract_type : '') ||
      (typeof item.budgetSource === 'string' ? item.budgetSource : '') ||
      (typeof item.category === 'string' ? item.category : item.category?.name || '') ||
      (typeof item.supplier === 'string' ? item.supplier : item.supplier?.name || '') ||
      (typeof item.item_code === 'string' ? item.item_code : '') ||
      (typeof item.drug_code === 'string' ? item.drug_code : '') ||
      ''

    const source = String(rawVal).toUpperCase()

    if (source.includes('APPL')) return 'APPL'
    if (source.includes('CC') || source.includes('CENTRAL') || source.includes('PUSAT')) return 'CC'
    if (source.includes('LP') || source.includes('LOCAL') || source.includes('LOKAL')) return 'LP'
    if (source.includes('DP') || source.includes('DIRECT') || source.includes('TERUS')) return 'DP'

    const code = String(item.item_code || item.drug_code || item.id || '').toUpperCase()
    if (code.startsWith('A') || code.startsWith('G')) return 'APPL'
    if (code.startsWith('C') || code.startsWith('N')) return 'CC'
    if (code.startsWith('L') || code.startsWith('B')) return 'LP'
    return 'DP'
  }

  const handleOpenBulkAssignModal = (mainUnit: SubLocationUnit, childUnit?: SubLocationUnit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setBulkAssignTargetUnit({ mainUnit, childUnit })
    setBulkAssignSearchTerm('')
    setBulkAssignFilterMode('all')
    setBulkAssignProcurementFilter('all')

    const preSelected = new Set<string>()
    placedDrugItems.forEach(item => {
      const itemId = item.id || item.drug_id
      if (isSubLocationItemMatch(item, mainUnit, childUnit)) {
        if (itemId) preSelected.add(itemId)
      }
    })

    setSelectedDrugIdsForAssign(preSelected)
    setIsBulkAssignModalOpen(true)
  }

  const handleToggleSelectDrug = (id: string) => {
    setSelectedDrugIdsForAssign(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleDrugItemsForAssign = useMemo(() => {
    if (!placedDrugItems) return []
    return placedDrugItems.filter(item => {
      const name = (item.drug_name || item.brand_name || item.item_name || '').toLowerCase()
      const code = (item.item_code || item.drug_code || '').toLowerCase()
      const loc = (item.location || item.storage_conditions || '').toLowerCase()
      const search = bulkAssignSearchTerm.toLowerCase()

      const matchesSearch = !search || name.includes(search) || code.includes(search) || loc.includes(search)

      if (!matchesSearch) return false

      if (bulkAssignFilterMode === 'unassigned') {
        if (loc && loc !== 'belum diset' && loc !== '-') return false
      }
      if (bulkAssignFilterMode === 'here' && bulkAssignTargetUnit) {
        const { mainUnit, childUnit } = bulkAssignTargetUnit
        if (!isSubLocationItemMatch(item, mainUnit, childUnit)) return false
      }

      if (bulkAssignProcurementFilter !== 'all') {
        const cat = getProcurementCategory(item)
        if (cat !== bulkAssignProcurementFilter) return false
      }

      return true
    })
  }, [placedDrugItems, bulkAssignSearchTerm, bulkAssignFilterMode, bulkAssignProcurementFilter, bulkAssignTargetUnit])

  const selectedItemsList = useMemo(() => {
    if (!placedDrugItems) return []
    return placedDrugItems.filter(item => {
      const itemId = item.id || item.drug_id
      return selectedDrugIdsForAssign.has(itemId)
    })
  }, [placedDrugItems, selectedDrugIdsForAssign])

  const handleToggleSelectAllVisible = (visibleIds: string[]) => {
    setSelectedDrugIdsForAssign(prev => {
      const next = new Set(prev)
      const allSelected = visibleIds.every(id => next.has(id))
      if (allSelected) {
        visibleIds.forEach(id => next.delete(id))
      } else {
        visibleIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const handleSaveBulkAssign = async () => {
    if (!selectedStoreLocation || !bulkAssignTargetUnit) return

    const { mainUnit, childUnit } = bulkAssignTargetUnit
    const targetLocStr = childUnit
      ? `${selectedStoreLocation.store_name} > ${mainUnit.name} > ${childUnit.name}`
      : `${selectedStoreLocation.store_name} > ${mainUnit.name}`

    const selectedIds = Array.from(selectedDrugIdsForAssign)
    if (selectedIds.length === 0) {
      showError('Sila pilih sekurang-kurangnya 1 item untuk menetapkan lokasi.')
      return
    }

    setIsSavingBulkAssign(true)
    try {
      const res = await bulkAssignLocationToFacilityDrugItems(hospitalId, selectedIds, targetLocStr)
      if (res.success) {
        showSuccess(`Berjaya menetapkan lokasi "${targetLocStr}" untuk ${selectedIds.length} item!`)
        setIsBulkAssignModalOpen(false)

        // Reload inventory
        const drugItems = await loadFacilityDrugInventory(hospitalId)
        setPlacedDrugItems(drugItems || [])
        fetchLocations()
      } else {
        showError(res.error || 'Gagal menetapkan lokasi pukal.')
      }
    } catch (err: any) {
      showError(err?.message || 'Gagal menetapkan lokasi pukal.')
    } finally {
      setIsSavingBulkAssign(false)
    }
  }

  // Load sub-locations & inventory items whenever selectedStoreLocation changes
  useEffect(() => {
    if (selectedStoreLocation) {
      setIsLoadingItems(true)
      const isLocationMatch = (str: string) => {
        if (!str) return false
        const cleanLoc = str.trim().toLowerCase()
        const cleanStoreName = selectedStoreLocation.store_name.trim().toLowerCase()
        const cleanCode = selectedStoreLocation.location_code.trim().toLowerCase()
        const cleanFormatted = (selectedStoreLocation.formatted_location || selectedStoreLocation.store_name).trim().toLowerCase()

        if (cleanLoc === cleanFormatted || cleanLoc === cleanCode) return true

        if (selectedStoreLocation.cabinet_rack && selectedStoreLocation.cabinet_rack !== '-') {
          const cleanCab = selectedStoreLocation.cabinet_rack.trim().toLowerCase()
          return cleanLoc.includes(cleanStoreName) && cleanLoc.includes(cleanCab)
        }

        return cleanLoc.includes(cleanStoreName) || cleanLoc.includes(cleanCode)
      }

      loadStoreSubLocations(hospitalId, selectedStoreLocation.location_code, selectedStoreLocation.id).then(data => {
        setSubLocations(data)
      })

      loadFacilityDrugInventory(hospitalId).then(drugItems => {
        const items = drugItems || []
        setPlacedDrugItems(items)
        const matchedDrugs = (selectedStoreLocation.location_type === 'non_drug')
          ? []
          : items.filter(item => isLocationMatch(item.location || item.storage_conditions || ''))

        let matchedNonDrugs: any[] = []
        try {
          const raw = localStorage.getItem(`facility_nondrug_items_${hospitalId}`)
          if (raw && selectedStoreLocation.location_type !== 'drug') {
            const list = JSON.parse(raw)
            matchedNonDrugs = list.filter((item: any) => isLocationMatch(item.location || ''))
          }
        } catch {}

        setAssignedDrugs(matchedDrugs)
        setAssignedNonDrugs(matchedNonDrugs)
      }).finally(() => {
        setIsLoadingItems(false)
      })
    }
  }, [selectedStoreLocation, hospitalId])

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const toggleNodeExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const [isSubLocationModalOpen, setIsSubLocationModalOpen] = useState<boolean>(false)
  const [editingSubLocation, setEditingSubLocation] = useState<SubLocationUnit | null>(null)

  // Sub-location form input state
  const [subTypeInput, setSubTypeInput] = useState<SubLocationType>('cabinet')
  const [subNameInput, setSubNameInput] = useState<string>('')
  const [subCodeInput, setSubCodeInput] = useState<string>('')
  const [subParentInput, setSubParentInput] = useState<string>('')
  const [subNotesInput, setSubNotesInput] = useState<string>('')

  // Bulk / Batch Generation Mode state
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false)
  const [bulkCountUnits, setBulkCountUnits] = useState<number>(10)
  const [bulkPrefixName, setBulkPrefixName] = useState<string>('Rak')
  const [bulkLevelsPerUnit, setBulkLevelsPerUnit] = useState<number>(5)

  // Sub-Location CRUD Handlers
  const handleOpenAddSubLocation = (presetType: SubLocationType = 'cabinet', defaultParent: string = '') => {
    setEditingSubLocation(null)
    setSubTypeInput(presetType)
    setSubNameInput('')
    setSubCodeInput('')
    setSubParentInput(defaultParent)
    setSubNotesInput('')
    setIsBulkMode(false)
    setBulkPrefixName(presetType === 'rack' ? 'Rak' : presetType === 'cabinet' ? 'Kabinet' : presetType === 'pallet' ? 'Palet' : 'Unit')
    setBulkCountUnits(10)
    setBulkLevelsPerUnit(5)
    setIsSubLocationModalOpen(true)
  }

  const handleOpenEditSubLocation = (unit: SubLocationUnit) => {
    setEditingSubLocation(unit)
    setSubTypeInput(unit.type)
    setSubNameInput(unit.name)
    setSubCodeInput(unit.code)
    setSubParentInput(unit.parent_name || '')
    setSubNotesInput(unit.notes || '')
    setIsBulkMode(false)
    setIsSubLocationModalOpen(true)
  }

  const handleSaveSubLocation = async (e: React.FormEvent) => {
    e.preventDefault()

    let nextSubLocations: SubLocationUnit[] = []

    if (isBulkMode) {
      if (subTypeInput === 'level') {
        const parentName = subParentInput.trim() || 'Unit'
        const count = Math.max(1, Number(bulkLevelsPerUnit) || 1)
        const newItems: SubLocationUnit[] = []
        const timestamp = Date.now()

        for (let i = 1; i <= count; i++) {
          newItems.push({
            id: `sub-${timestamp}-${i}`,
            store_id: selectedStoreLocation?.id,
            type: 'level',
            name: `Level ${i}`,
            code: `L${i}`,
            parent_name: parentName,
          })
        }
        nextSubLocations = [...subLocations, ...newItems]
        setSubLocations(nextSubLocations)
        showSuccess(`Berjaya menjana ${count} Level untuk ${parentName}!`)
      } else {
        const unitCount = Math.max(1, Number(bulkCountUnits) || 1)
        const levelCount = Math.max(0, Number(bulkLevelsPerUnit) || 0)
        const prefix = bulkPrefixName.trim() || (subTypeInput === 'rack' ? 'Rak' : subTypeInput === 'cabinet' ? 'Kabinet' : 'Palet')
        const newItems: SubLocationUnit[] = []
        const timestamp = Date.now()

        for (let u = 1; u <= unitCount; u++) {
          const mainName = `${prefix} ${u}`
          const mainCode = `${prefix.slice(0, 3).toUpperCase()}-${u}`
          newItems.push({
            id: `sub-${timestamp}-u${u}`,
            store_id: selectedStoreLocation?.id,
            type: subTypeInput,
            name: mainName,
            code: mainCode,
          })

          for (let l = 1; l <= levelCount; l++) {
            newItems.push({
              id: `sub-${timestamp}-u${u}-l${l}`,
              store_id: selectedStoreLocation?.id,
              type: 'level',
              name: `Level ${l}`,
              code: `L${l}`,
              parent_name: mainName,
            })
          }
        }

        nextSubLocations = [...subLocations, ...newItems]
        setSubLocations(nextSubLocations)
        showSuccess(`Berjaya menjana ${unitCount} ${prefix} dan ${unitCount * levelCount} Level serentak!`)
      }

      if (selectedStoreLocation) {
        await syncStoreSubLocations(hospitalId, selectedStoreLocation.location_code, nextSubLocations, selectedStoreLocation.id)
      }
      setIsSubLocationModalOpen(false)
      return
    }

    if (!subNameInput.trim()) {
      showError('Sila isi nama sub-lokasi (Palet, Rak, Kabinet, Level, atau Column)')
      return
    }

    const generatedCode = subCodeInput.trim() || `${subTypeInput.toUpperCase().slice(0, 3)}-${subNameInput.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)}`

    if (editingSubLocation) {
      nextSubLocations = subLocations.map(item =>
        item.id === editingSubLocation.id
          ? {
              ...item,
              type: subTypeInput,
              name: subNameInput.trim(),
              code: generatedCode,
              parent_name: subParentInput.trim() || undefined,
              notes: subNotesInput.trim() || undefined,
            }
          : item
      )
      setSubLocations(nextSubLocations)
      showSuccess('Sub-lokasi berjaya dikemas kini!')
    } else {
      const newUnit: SubLocationUnit = {
        id: `sub-${Date.now()}`,
        store_id: selectedStoreLocation?.id,
        type: subTypeInput,
        name: subNameInput.trim(),
        code: generatedCode,
        parent_name: subParentInput.trim() || undefined,
        notes: subNotesInput.trim() || undefined,
      }
      nextSubLocations = [...subLocations, newUnit]
      setSubLocations(nextSubLocations)
      showSuccess('Sub-lokasi baharu berjaya ditambah!')
    }

    if (selectedStoreLocation) {
      await syncStoreSubLocations(hospitalId, selectedStoreLocation.location_code, nextSubLocations, selectedStoreLocation.id)
    }

    setIsSubLocationModalOpen(false)
  }

  const handleDeleteSubLocation = async (id: string) => {
    const updated = subLocations.filter(item => item.id !== id)
    setSubLocations(updated)

    if (selectedStoreLocation) {
      await syncStoreSubLocations(hospitalId, selectedStoreLocation.location_code, updated, selectedStoreLocation.id)
    }
    showSuccess('Sub-lokasi berjaya dipadam!')
  }

  // View Assigned Items Modal state
  const [viewItemsModalLocation, setViewItemsModalLocation] = useState<StoreLocationWithOccupancy | null>(null)
  const [assignedDrugs, setAssignedDrugs] = useState<any[]>([])
  const [assignedNonDrugs, setAssignedNonDrugs] = useState<any[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false)

  // Load locations on mount
  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const data = await getStoreLocationsWithOccupancy(hospitalId)
      setLocations(data)
    } catch (err) {
      console.error('Failed to load store locations:', err)
      showError('Gagal memuatkan senarai lokasi stor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [hospitalId])

  // Select location to view detail window
  const handleSelectStoreLocation = (loc: StoreLocationWithOccupancy) => {
    setSelectedStoreLocation(loc)
  }

  // Export PDF for a selected store location
  const handleExportPdfForLocation = async (loc: StoreLocationWithOccupancy) => {
    try {
      showSuccess(`Menjana PDF Laporan Lokasi: ${loc.store_name}...`)
      const drugItems = await loadFacilityDrugInventory(hospitalId)
      const matchedDrugs = drugItems.filter(item => {
        const str = item.location || ''
        return str === loc.formatted_location || (str.includes(loc.store_name) && str.includes(loc.cabinet_rack))
      })

      let matchedNonDrugs: any[] = []
      try {
        const raw = localStorage.getItem(`facility_nondrug_items_${hospitalId}`)
        if (raw) {
          const list = JSON.parse(raw)
          matchedNonDrugs = list.filter((item: any) => {
            const str = item.location || ''
            return str === loc.formatted_location || (str.includes(loc.store_name) && str.includes(loc.cabinet_rack))
          })
        }
      } catch {}

      const allMatchedItems = [...matchedDrugs, ...matchedNonDrugs]
      generateStoreLocationPdf(loc, allMatchedItems, {
        hospitalName: 'HOSPITAL LAWAS',
        department: `Jabatan Farmasi / Unit Logistik Stor (${loc.department || 'LOG'})`,
        preparedBy: user?.full_name ? `${user.full_name} (${user.jawatan || 'Penyelia Stor'})` : 'Pegawai Farmasi / Storekeeper',
        approvedBy: 'Ketua Unit Stor / Pegawai Farmasi Y/M',
      })
    } catch (err) {
      console.error('Error exporting store location PDF:', err)
      showError('Gagal menjana PDF laporan lokasi stor')
    }
  }

  // Open Create Modal (Empty fields for user manual input)
  const handleOpenCreateModal = () => {
    setEditingLocation(null)
    setDepartmentInput('LOG')
    setStoreNameInput('')
    setCabinetRackInput('')
    setShelfLevelInput('')
    setLocationCodeInput('')
    setLocationTypeInput('both')
    setStorageConditionInput('ambient')
    setDescriptionInput('')
    setIsActiveInput(true)
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (loc: StoreLocationWithOccupancy) => {
    setEditingLocation(loc)
    const detectedDept = loc.department || (loc.location_code?.split('-')[0]) || 'LOG'
    setDepartmentInput(detectedDept)
    setStoreNameInput(loc.store_name)
    setCabinetRackInput(loc.cabinet_rack)
    setShelfLevelInput(loc.shelf_level)
    setLocationCodeInput(loc.location_code)
    setLocationTypeInput(loc.location_type)
    setStorageConditionInput(loc.storage_condition)
    setDescriptionInput(loc.description || '')
    setIsActiveInput(loc.is_active)
    setIsModalOpen(true)
  }

  // Auto update code on department change
  const handleDepartmentChange = (deptCode: string) => {
    setDepartmentInput(deptCode)
    if (storeNameInput.trim()) {
      setLocationCodeInput(generateUniqueLocationCode(locations, storeNameInput, deptCode, cabinetRackInput, shelfLevelInput, editingLocation?.id))
    }
  }

  // Auto update code on store name change
  const handleStoreNameChange = (store: string) => {
    setStoreNameInput(store)
    if (store.trim()) {
      setLocationCodeInput(generateUniqueLocationCode(locations, store, departmentInput, cabinetRackInput, shelfLevelInput, editingLocation?.id))
    } else {
      setLocationCodeInput('')
    }
  }

  // Save Form (Create/Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeNameInput.trim()) {
      showError('Sila isi Nama Stor Utama')
      return
    }

    setIsSubmitting(true)
    const formData: StoreLocationFormData = {
      store_name: storeNameInput.trim(),
      department: departmentInput,
      cabinet_rack: cabinetRackInput.trim() || '-',
      shelf_level: shelfLevelInput.trim() || '-',
      location_code: locationCodeInput.trim() || generateUniqueLocationCode(locations, storeNameInput, departmentInput, cabinetRackInput, shelfLevelInput, editingLocation?.id),
      location_type: locationTypeInput,
      storage_condition: storageConditionInput,
      description: descriptionInput,
      is_active: isActiveInput,
    }

    try {
      if (editingLocation) {
        await updateStoreLocation(hospitalId, editingLocation.id, formData)
        showSuccess('Lokasi stor berjaya dikemas kini!')
        if (selectedStoreLocation && selectedStoreLocation.id === editingLocation.id) {
          setSelectedStoreLocation((prev: StoreLocationWithOccupancy | null) => prev ? { ...prev, ...formData, location_code: formData.location_code || prev.location_code } : null)
        }
      } else {
        await createStoreLocation(hospitalId, formData)
        showSuccess('Lokasi stor baharu berjaya dicipta!')
      }
      setIsModalOpen(false)
      fetchLocations()
    } catch (err) {
      console.error('Error saving location:', err)
      showError('Gagal menyimpan lokasi stor')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Location
  const handleDelete = async (loc: StoreLocationWithOccupancy) => {
    if (loc.total_items_count > 0) {
      showError(`Tidak boleh memadam lokasi yang mengandungi ${loc.total_items_count} item inventori aktif. Sila pindahkan item dahulu.`)
      return
    }

    if (window.confirm(`Adakah anda pasti untuk memadam lokasi stor "${loc.formatted_location}"?`)) {
      try {
        await deleteStoreLocation(hospitalId, loc.id)
        showSuccess('Lokasi stor berjaya dipadam')
        fetchLocations()
      } catch (err) {
        showError('Gagal memadam lokasi stor')
      }
    }
  }

  // View Items at Location
  const handleViewItems = async (loc: StoreLocationWithOccupancy) => {
    setViewItemsModalLocation(loc)
    setIsLoadingItems(true)
    try {
      const isLocationMatch = (str: string) => {
        if (!str) return false
        const cleanLoc = str.trim().toLowerCase()
        const cleanStoreName = loc.store_name.trim().toLowerCase()
        const cleanCode = loc.location_code.trim().toLowerCase()
        const cleanFormatted = loc.formatted_location.trim().toLowerCase()

        if (cleanLoc === cleanFormatted || cleanLoc === cleanCode) return true

        if (loc.cabinet_rack && loc.cabinet_rack !== '-') {
          const cleanCab = loc.cabinet_rack.trim().toLowerCase()
          return cleanLoc.includes(cleanStoreName) && cleanLoc.includes(cleanCab)
        }

        return cleanLoc.includes(cleanStoreName) || cleanLoc.includes(cleanCode)
      }

      const drugItems = await loadFacilityDrugInventory(hospitalId)
      const matchedDrugs = (loc.location_type === 'non_drug')
        ? []
        : drugItems.filter(item => isLocationMatch(item.location || ''))

      let matchedNonDrugs: any[] = []
      try {
        const raw = localStorage.getItem(`facility_nondrug_items_${hospitalId}`)
        if (raw && loc.location_type !== 'drug') {
          const list = JSON.parse(raw)
          matchedNonDrugs = list.filter((item: any) => isLocationMatch(item.location || ''))
        }
      } catch {}

      setAssignedDrugs(matchedDrugs)
      setAssignedNonDrugs(matchedNonDrugs)
    } catch (err) {
      console.error('Error loading assigned items:', err)
    } finally {
      setIsLoadingItems(false)
    }
  }

  // Filtered List
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesSearch =
        loc.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.cabinet_rack.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.shelf_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.location_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.description && loc.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesType = typeFilter === 'all' || loc.location_type === typeFilter
      const matchesCondition = conditionFilter === 'all' || loc.storage_condition === conditionFilter

      return matchesSearch && matchesType && matchesCondition
    })
  }, [locations, searchTerm, typeFilter, conditionFilter])

  // Grouped by Store Name for Grid View
  const groupedStores = useMemo(() => {
    const map: Record<string, StoreLocationWithOccupancy[]> = {}
    filteredLocations.forEach(loc => {
      if (!map[loc.store_name]) map[loc.store_name] = []
      map[loc.store_name].push(loc)
    })
    return map
  }, [filteredLocations])

  // Group assigned drugs by sub-location / level
  const groupedDrugs = useMemo(() => {
    const groups: Record<string, typeof assignedDrugs> = {}

    assignedDrugs.forEach(item => {
      const locStr = item.storage_conditions || item.location || ''
      let matchedGroup = 'Item Tanpa Sub-Unit'

      if (subLocations && subLocations.length > 0) {
        const parentUnits = subLocations.filter(u => u.type === 'cabinet' || u.type === 'rack' || u.type === 'pallet')
        for (const parent of parentUnits) {
          const children = subLocations.filter(c => c.parent_name === parent.name)
          for (const child of children) {
            const locLower = locStr.toLowerCase()
            const parentLower = parent.name.toLowerCase()
            const childLower = child.name.toLowerCase()
            if (locLower.includes(parentLower) && locLower.includes(childLower)) {
              matchedGroup = `${parent.name} › ${child.name}`
              break
            }
          }
          if (matchedGroup !== 'Item Tanpa Sub-Unit') break
          if (locStr.toLowerCase().includes(parent.name.toLowerCase())) {
            matchedGroup = parent.name
            break
          }
        }
      }

      if (!groups[matchedGroup]) {
        groups[matchedGroup] = []
      }
      groups[matchedGroup].push(item)
    })

    return groups
  }, [assignedDrugs, subLocations])

  // Group assigned non-drugs by sub-location / level
  const groupedNonDrugs = useMemo(() => {
    const groups: Record<string, typeof assignedNonDrugs> = {}

    assignedNonDrugs.forEach(item => {
      const locStr = item.storage_conditions || item.location || ''
      let matchedGroup = 'Item Tanpa Sub-Unit'

      if (subLocations && subLocations.length > 0) {
        const parentUnits = subLocations.filter(u => u.type === 'cabinet' || u.type === 'rack' || u.type === 'pallet')
        for (const parent of parentUnits) {
          const children = subLocations.filter(c => c.parent_name === parent.name)
          for (const child of children) {
            const locLower = locStr.toLowerCase()
            const parentLower = parent.name.toLowerCase()
            const childLower = child.name.toLowerCase()
            if (locLower.includes(parentLower) && locLower.includes(childLower)) {
              matchedGroup = `${parent.name} › ${child.name}`
              break
            }
          }
          if (matchedGroup !== 'Item Tanpa Sub-Unit') break
          if (locStr.toLowerCase().includes(parent.name.toLowerCase())) {
            matchedGroup = parent.name
            break
          }
        }
      }

      if (!groups[matchedGroup]) {
        groups[matchedGroup] = []
      }
      groups[matchedGroup].push(item)
    })

    return groups
  }, [assignedNonDrugs, subLocations])

  // Summary Metrics
  const uniqueStoresCount = useMemo(() => new Set(locations.map(l => l.store_name)).size, [locations])
  const uniqueCabinetsCount = useMemo(() => new Set(locations.map(l => `${l.store_name}-${l.cabinet_rack}`)).size, [locations])
  const totalOccupiedCount = useMemo(() => locations.filter(l => l.total_items_count > 0).length, [locations])
  const totalItemsStored = useMemo(() => locations.reduce((sum, l) => sum + l.total_items_count, 0), [locations])

  return (
    <div className="p-6 md:p-8 space-y-6 text-slate-800 min-h-screen bg-slate-50/50">
      {/* LUXURY EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] uppercase tracking-wider font-bold">
                  MyInventory Location Hierarchy
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Fasiliti Kesihatan KKM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <MapPin className="w-7 h-7 text-teal-400" />
                <span>Pengurusan Lokasi Stor</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                Pengurusan hirarki lokasi fizikal stor simpanan bekalan ubat & bukan ubat di fasiliti hospital mengikut standard Tatacara Pengurusan Stor KKM.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={fetchLocations}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition border border-slate-700"
                title="Muat Semula Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <Button
                onClick={handleOpenCreateModal}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl font-bold text-xs gap-1.5 px-4 py-2.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                + Tambah Lokasi Stor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Location View Conditional Rendering */}
      {selectedStoreLocation ? (
        /* STORE LOCATION DETAIL VIEW WINDOW */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedStoreLocation(null)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center shrink-0 border border-slate-200"
                title="Kembali ke Senarai Stor"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    {selectedStoreLocation.location_code}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedStoreLocation.department || 'LOG'}
                  </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-teal-600" />
                  <span>{selectedStoreLocation.store_name}</span>
                </h1>
              </div>
            </div>

            {/* Actions: Export PDF & Manage Settings */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleExportPdfForLocation(selectedStoreLocation)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs gap-2 px-4 py-2.5 shadow-md flex items-center transition"
              >
                <Printer className="w-4 h-4 text-emerald-100" />
                <span>Cetak / Eksport PDF</span>
              </Button>

              <Button
                onClick={() => handleOpenEditModal(selectedStoreLocation)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs gap-2 px-4 py-2.5 shadow-md flex items-center"
              >
                <Settings className="w-4 h-4 text-teal-400" />
                <span>Pengurusan Lokasi / Tetapan Stor</span>
              </Button>
            </div>
          </div>

          {/* Overview Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 border-l-4 border-l-teal-500">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori Bekalan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {selectedStoreLocation.location_type === 'drug' && 'Bekalan Ubat Sahaja'}
                  {selectedStoreLocation.location_type === 'non_drug' && 'Bukan Ubat Sahaja'}
                  {selectedStoreLocation.location_type === 'both' && 'Ubat & Bukan Ubat'}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 border-l-4 border-l-cyan-500">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Syarat Simpanan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {selectedStoreLocation.storage_condition === 'cold_2_8c' && 'Peti Sejuk (2-8°C)'}
                  {selectedStoreLocation.storage_condition === 'controlled' && 'Bilik Kawalan DDA'}
                  {selectedStoreLocation.storage_condition === 'ambient' && 'Suhu Bilik (Ambient)'}
                  {selectedStoreLocation.storage_condition === 'frozen' && 'Peti Beku (-20°C)'}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 border-l-4 border-l-indigo-500">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Item Tersimpan</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedStoreLocation.total_items_count} Item</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 border-l-4 border-l-emerald-500">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Operasi</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                  {selectedStoreLocation.is_active ? 'Lokasi Aktif & Berfungsi' : 'Tidak Aktif'}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Locations Management (Pallet, Rack, Cabinet, Level, Column) Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-teal-600" />
                  <h2 className="text-base font-bold text-slate-900">Hierarki Lokasi Fizikal (WMS Sub-Locations)</h2>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {subLocations.length} Unit Fizikal
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Struktur susunan fizikal Palet, Rak, Kabinet, Level (Tingkat) & Column (Bin) dalam {selectedStoreLocation.store_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleOpenAddSubLocation('cabinet')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>+ Tambah Unit Baharu</span>
                </Button>
              </div>
            </div>

            {/* WMS Tree List View */}
            <div className="space-y-3">
              {subLocations
                .filter(unit => unit.type === 'cabinet' || unit.type === 'rack' || unit.type === 'pallet')
                .map(mainUnit => {
                  const children = subLocations.filter(child => child.parent_name === mainUnit.name)
                  const isExpanded = expandedNodes[mainUnit.id] ?? true

                  return (
                    <div
                      key={mainUnit.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition hover:border-slate-300"
                    >
                      {/* Parent Node Header */}
                      <div className="p-3.5 bg-slate-50/90 flex items-center justify-between gap-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleNodeExpand(mainUnit.id)}
                            className="p-1 hover:bg-slate-200/70 text-slate-500 rounded-md transition"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                          </button>

                          <div className="p-2 rounded-lg shrink-0 bg-white border border-slate-200 text-slate-700 shadow-2xs">
                            {mainUnit.type === 'cabinet' && <Archive className="w-4 h-4 text-purple-600" />}
                            {mainUnit.type === 'rack' && <Layers className="w-4 h-4 text-amber-600" />}
                            {mainUnit.type === 'pallet' && <Box className="w-4 h-4 text-orange-600" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-slate-800 tracking-tight">{mainUnit.name}</span>
                              <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                                {mainUnit.code}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Path: {selectedStoreLocation.location_code} › {mainUnit.code}
                              </span>
                            </div>
                            {mainUnit.notes && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{mainUnit.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            {children.length} Sub-unit
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleOpenRackItemsModal(mainUnit, e)}
                            className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                            title="Papar Semua Item di Rack"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Papar Item ({placedDrugItems.filter(i => isSubLocationItemMatch(i, mainUnit)).length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenBulkAssignModal(mainUnit, undefined, e)}
                            className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title={`Tetapkan Item Pukal ke ${mainUnit.name}`}
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span>+ Assign Item</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenAddSubLocation('level', mainUnit.name)}
                            className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                            title="Tambah Level"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Level</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditSubLocation(mainUnit)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                            title="Sunting Unit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubLocation(mainUnit.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Padam Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Children Level & Column Nodes */}
                      {isExpanded && (
                        <div className="p-3 bg-white space-y-2 border-t border-slate-100">
                          {children.length === 0 ? (
                            <div className="py-3 px-4 text-center text-slate-400 text-xs bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                              Tiada sub-unit (Level/Column) ditambah di bawah {mainUnit.name}. Click <b>+ Level</b> di atas.
                            </div>
                          ) : (
                            children.map(child => {
                              const itemsAtLevel = placedDrugItems.filter(item => isSubLocationItemMatch(item, mainUnit, child))

                              return (
                                <div
                                  key={child.id}
                                  onClick={(e) => handleOpenLevelItemsModal(mainUnit, child, e)}
                                  className="ml-6 pl-4 border-l-2 border-slate-200 py-2.5 px-3.5 bg-slate-50/60 hover:bg-teal-50/60 rounded-r-xl border border-slate-200/80 flex items-center justify-between text-xs transition cursor-pointer group shadow-2xs hover:border-teal-300"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-white border border-slate-200 group-hover:border-teal-300 rounded-md text-slate-600 group-hover:text-teal-600 shadow-2xs transition">
                                      {child.type === 'level' ? (
                                        <Tag className="w-3.5 h-3.5 text-teal-600" />
                                      ) : (
                                        <Grid className="w-3.5 h-3.5 text-blue-600" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 group-hover:text-teal-900 transition">{child.name}</span>
                                        <span className="text-[10px] text-teal-600 font-semibold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                                          <Eye className="w-3 h-3" /> Papar Senarai Item
                                        </span>
                                      </div>
                                      <span className="font-mono text-[10px] text-slate-400">
                                        {selectedStoreLocation.location_code} › {mainUnit.code} › {child.code}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    {itemsAtLevel.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenLevelItemsModal(mainUnit, child, e)}
                                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full transition flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>{itemsAtLevel.length} Item</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
                                        Kosong
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenBulkAssignModal(mainUnit, child, e)}
                                      className="text-[10px] font-extrabold text-teal-800 bg-teal-100/90 hover:bg-teal-200 border border-teal-300 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                      title={`Tetapkan Item Pukal ke ${mainUnit.name} › ${child.name}`}
                                    >
                                      <PlusCircle className="w-3 h-3 text-teal-700" />
                                      <span>+ Assign Item</span>
                                    </button>

                                    <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditSubLocation(child)}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition"
                                        title="Sunting Level"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubLocation(child.id)}
                                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                        title="Padam Level"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Assigned Inventory Items Table inside Location */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  <span>Item Inventori Tersimpan di {selectedStoreLocation.store_name}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Senarai ubat dan bekalan bukan ubat yang dipetakan ke stor ini</p>
              </div>
            </div>

            {isLoadingItems ? (
              <div className="flex justify-center p-8">
                <Spinner size="md" />
              </div>
            ) : assignedDrugs.length === 0 && assignedNonDrugs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500">Tiada item inventori ditempatkan di stor ini buat masa ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {assignedDrugs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-blue-600" /> Bekalan Ubat Mengikut Level & Rak ({assignedDrugs.length})
                    </h3>
                    {Object.entries(groupedDrugs).map(([subGroupName, items]) => (
                      <div key={subGroupName} className="bg-slate-50/70 rounded-xl border border-slate-200/90 p-4 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-teal-600" />
                            <span>{subGroupName}</span>
                          </span>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                            {items.length} Item
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-blue-50/40 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">Kod Item</th>
                                <th className="py-2.5 px-3">Nama Ubat</th>
                                <th className="py-2.5 px-3">Bentuk Dos</th>
                                <th className="py-2.5 px-3 text-right">Stok Semasa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map(item => (
                                <tr key={item.id}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.item_code}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900">{item.drug_name}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{item.dosage_form || '-'}</td>
                                  <td className="py-2.5 px-3 text-right font-bold text-teal-700">{item.current_stock} {item.unit_of_measure}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {assignedNonDrugs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-purple-600" /> Bekalan Bukan Ubat Mengikut Level & Rak ({assignedNonDrugs.length})
                    </h3>
                    {Object.entries(groupedNonDrugs).map(([subGroupName, items]) => (
                      <div key={subGroupName} className="bg-purple-50/40 rounded-xl border border-purple-200/80 p-4 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-purple-600" />
                            <span>{subGroupName}</span>
                          </span>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                            {items.length} Item
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-purple-50/40 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">Kod Item</th>
                                <th className="py-2.5 px-3">Nama Item</th>
                                <th className="py-2.5 px-3">Kategori</th>
                                <th className="py-2.5 px-3 text-right">Stok Semasa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map(item => (
                                <tr key={item.id}>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.item_code}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900">{item.item_name}</td>
                                  <td className="py-2.5 px-3 text-slate-600">{item.category || '-'}</td>
                                  <td className="py-2.5 px-3 text-right font-bold text-teal-700">{item.current_stock} {item.unit_of_measure}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Main Store Locations List & Table View */
        <>
          {/* Metrics Row (Light Clean Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 border-l-4 border-l-teal-500">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Stor</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{uniqueStoresCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 border-l-4 border-l-indigo-500">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Kabinet/Rak</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{uniqueCabinetsCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 border-l-4 border-l-amber-500">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi Berisi Item</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalOccupiedCount} / {locations.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Item Berlokasi</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{totalItemsStored} Item</p>
              </div>
            </div>
          </div>

          {/* Filter and View Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari stor, kabinet, level, atau kod..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs font-medium pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="all">Semua Jenis (Ubat & Bukan Ubat)</option>
                  <option value="drug">Bekalan Ubat Sahaja</option>
                  <option value="non_drug">Bukan Ubat Sahaja</option>
                  <option value="both">Kedua-duanya (Ubat & Bukan Ubat)</option>
                </select>

                <select
                  value={conditionFilter}
                  onChange={e => setConditionFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="all">Semua Syarat Simpanan</option>
                  <option value="ambient">Suhu Bilik (Ambient)</option>
                  <option value="cold_2_8c">Peti Sejuk (2-8°C)</option>
                  <option value="controlled">Bilik Kawalan (DDA)</option>
                  <option value="frozen">Bilik Beku (-20°C)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-end md:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'table' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Jadual Senarai</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'grid' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Paparan Hirarki</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <Spinner size="lg" />
              <p className="text-slate-500 text-sm font-medium">Sedang memuatkan senarai lokasi stor...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-full">
                <MapPin className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Tiada Lokasi Stor Ditemui</h3>
              <p className="text-sm text-slate-500 max-w-md">
                Sila cipta lokasi stor fizikal baharu (Stor → Kabinet → Level) untuk menempatkan bekalan ubat & bukan ubat di fasiliti anda.
              </p>
              <Button
                onClick={handleOpenCreateModal}
                className="mt-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                + Tambah Lokasi Baharu
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Kod Lokasi</th>
                      <th className="py-3.5 px-4">Nama Stor</th>
                      <th className="py-3.5 px-4">Kategori Bekalan</th>
                      <th className="py-3.5 px-4">Syarat Simpanan</th>
                      <th className="py-3.5 px-4 text-center">Jumlah Item</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLocations.map(loc => (
                      <tr
                        key={loc.id}
                        onClick={() => handleSelectStoreLocation(loc)}
                        className="hover:bg-teal-50/40 cursor-pointer transition group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-700 group-hover:underline">
                          {loc.location_code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 group-hover:text-teal-900">
                          {loc.store_name}
                        </td>
                        <td className="py-3.5 px-4">
                          {loc.location_type === 'drug' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                              <Package className="w-3 h-3" /> Ubat
                            </span>
                          )}
                          {loc.location_type === 'non_drug' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
                              <ClipboardList className="w-3 h-3" /> Bukan Ubat
                            </span>
                          )}
                          {loc.location_type === 'both' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-lg">
                              <Layers className="w-3 h-3" /> Ubat & Bukan Ubat
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {loc.storage_condition === 'cold_2_8c' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg">
                              <Thermometer className="w-3 h-3" /> Peti Sejuk (2-8°C)
                            </span>
                          )}
                          {loc.storage_condition === 'controlled' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                              <ShieldAlert className="w-3 h-3" /> Kawalan DDA
                            </span>
                          )}
                          {loc.storage_condition === 'ambient' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg">
                              Suhu Bilik
                            </span>
                          )}
                          {loc.storage_condition === 'frozen' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                              Peti Beku (-20°C)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewItems(loc)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full text-xs font-bold text-slate-700 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>{loc.total_items_count} Item</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {loc.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5" /> Tidak Aktif
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* HIERARCHY GRID VIEW */
            <div className="space-y-6">
              {Object.entries(groupedStores).map(([storeName, storeLocs]) => (
                <div key={storeName} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{storeName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{storeLocs.length} Ruangan Lokasi Berdaftar</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-50 text-teal-700 border border-slate-200 rounded-full">
                      {storeLocs.reduce((acc, curr) => acc + curr.total_items_count, 0)} Item Tersimpan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeLocs.map(loc => (
                      <div
                        key={loc.id}
                        onClick={() => handleSelectStoreLocation(loc)}
                        className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3 hover:border-teal-400 transition cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-teal-700">{loc.location_code}</span>
                            <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                              {loc.cabinet_rack && loc.cabinet_rack !== '-' ? `${loc.cabinet_rack} → ${loc.shelf_level}` : loc.store_name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditModal(loc)
                              }}
                              className="p-1 text-slate-500 hover:text-slate-800"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(loc)
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                    {loc.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{loc.description}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        {loc.location_type === 'drug' && <span className="text-blue-700">Ubat</span>}
                        {loc.location_type === 'non_drug' && <span className="text-purple-700">Bukan Ubat</span>}
                        {loc.location_type === 'both' && <span className="text-teal-700">Ubat & Bukan Ubat</span>}
                      </div>

                      <button
                        onClick={() => handleViewItems(loc)}
                        className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{loc.total_items_count} Item</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* CREATE / EDIT LOCATION SLIDEOVER */}
      <SlideOver
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? 'Sunting Lokasi Stor' : 'Cipta Lokasi Stor Baharu'}
        description="Tetapan Lokasi Stor & Syarat Simpanan"
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="flex flex-col h-full bg-slate-50/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Department Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Jabatan / Unit <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                  Prefix: {departmentInput}
                </span>
              </label>
              <select
                value={departmentInput}
                onChange={e => handleDepartmentChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition cursor-pointer"
              >
                {DEPARTMENT_OPTIONS.map(dept => (
                  <option key={dept.code} value={dept.code}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Nama Stor Utama <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="cth: Liquid Store, Stor Utama, Bilik Sejuk"
                value={storeNameInput}
                onChange={e => handleStoreNameChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            {/* Store Code (Auto) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Kod Lokasi (Auto)
                </label>
                <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">Format: {departmentInput}-xxx-xxx</span>
              </div>
              <input
                type="text"
                placeholder={`cth: ${departmentInput}-STR-001`}
                value={locationCodeInput}
                onChange={e => setLocationCodeInput(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200 font-mono text-teal-700 font-bold rounded-xl px-4 py-3 text-xs shadow-inner focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            {/* Kategori & Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kategori Bekalan
                </label>
                <select
                  value={locationTypeInput}
                  onChange={e => setLocationTypeInput(e.target.value as StoreLocationType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="both">Ubat & Bukan Ubat</option>
                  <option value="drug">Bekalan Ubat Sahaja</option>
                  <option value="non_drug">Bukan Ubat Sahaja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Syarat Simpanan / Suhu
                </label>
                <select
                  value={storageConditionInput}
                  onChange={e => setStorageConditionInput(e.target.value as StorageCondition)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="ambient">Suhu Bilik (Ambient)</option>
                  <option value="cold_2_8c">Peti Sejuk (2-8°C)</option>
                  <option value="controlled">Bilik Kawalan DDA</option>
                  <option value="frozen">Peti Beku (-20°C)</option>
                </select>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Catatan / Penerangan Lokasi
              </label>
              <textarea
                rows={3}
                placeholder="Catatan tambahan mengenai ruang fizikal ini..."
                value={descriptionInput}
                onChange={e => setDescriptionInput(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition resize-none"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3 pt-2 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
              <input
                type="checkbox"
                id="isActive"
                checked={isActiveInput}
                onChange={e => setIsActiveInput(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                Lokasi Aktif & Boleh Dipilih Dalam Inventori
              </label>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
              <span className="font-bold shrink-0 mt-0.5">Nota:</span>
              <span>Kabinet dan Tingkat (Rack & Level) boleh ditambah mengikut keperluan selepas stor dicipta.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs px-6 py-2.5 shadow-md flex items-center gap-2"
            >
              {isSubmitting && <Spinner size="sm" />}
              <span>{editingLocation ? 'Simpan Kemaskini' : 'Cipta Lokasi'}</span>
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* VIEW ASSIGNED ITEMS MODAL */}
      <Modal
        isOpen={!!viewItemsModalLocation}
        onClose={() => setViewItemsModalLocation(null)}
        title={`Senarai Item di Lokasi: ${viewItemsModalLocation?.formatted_location || ''}`}
      >
        <div className="space-y-4 text-slate-800 max-h-[70vh] overflow-y-auto pr-1">
          {isLoadingItems ? (
            <div className="flex justify-center p-8">
              <Spinner size="md" />
            </div>
          ) : (assignedDrugs.length === 0 && assignedNonDrugs.length === 0) ? (
            <div className="text-center p-8 space-y-2">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-500">Tiada item ubat atau bukan ubat ditempatkan di lokasi ini buat masa ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drugs Section */}
              {assignedDrugs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Bekalan Ubat ({assignedDrugs.length})
                  </h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200/80">
                    {assignedDrugs.map(item => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.drug_name || item.generic_name}</p>
                          <p className="text-slate-500 font-mono text-[11px] mt-0.5">{item.drug_code} • Batch: {item.batch_number || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-teal-700">{item.facility_stock ?? 0} {item.unit_of_measure}</p>
                          <p className="text-slate-500 text-[11px]">Min Buffer: {item.min_buffer_level ?? 20}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-Drugs Section */}
              {assignedNonDrugs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" /> Bukan Ubat ({assignedNonDrugs.length})
                  </h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200/80">
                    {assignedNonDrugs.map(item => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.item_name}</p>
                          <p className="text-slate-500 font-mono text-[11px] mt-0.5">{item.item_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-700">{item.facility_stock ?? 0} {item.unit_of_measure}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {viewItemsModalLocation ? (
              <Button
                onClick={() => handleExportPdfForLocation(viewItemsModalLocation)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs gap-1.5 px-4 py-2 flex items-center shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Eksport PDF Lokasi Ini</span>
              </Button>
            ) : <div />}
            <Button
              variant="outline"
              onClick={() => setViewItemsModalLocation(null)}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* SUB-LOCATION (RACK/LEVEL) ITEM INSPECTION MODAL */}
      <Modal
        isOpen={!!subLocationItemsModalData?.isOpen}
        onClose={() => setSubLocationItemsModalData(null)}
        title={subLocationItemsModalData?.title || 'Senarai Item Lokasi'}
      >
        <div className="space-y-4 text-slate-800 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500">{subLocationItemsModalData?.subtitle}</p>

          {(!subLocationItemsModalData?.items || subLocationItemsModalData.items.length === 0) ? (
            <div className="text-center p-8 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Tiada item ubat ditempatkan di lokasi ini buat masa ini.</p>
              <p className="text-xs text-slate-400">Anda boleh mendaftarkan lokasi ini pada item ubat melalui skrin Inventori Ubat Fasiliti.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-indigo-600" />
                  Item Berdaftar ({subLocationItemsModalData.items.length})
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                {subLocationItemsModalData.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold font-mono text-[11px] flex items-center justify-center border border-indigo-200/60">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{item.drug_name || item.generic_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-500">
                          <span>[{item.drug_code || 'CODE'}]</span>
                          <span>•</span>
                          <span className="text-slate-600">Batch: {item.batch_number || item.batch_no || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-sm text-teal-700 font-mono">
                        {item.facility_stock ?? 0}
                      </span>
                      <span className="text-[11px] text-slate-500 block">Unit Stok</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {selectedStoreLocation ? (
              <Button
                onClick={() => handleExportPdfForLocation(selectedStoreLocation)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs gap-1.5 px-4 py-2 flex items-center shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Eksport Laporan PDF</span>
              </Button>
            ) : <div />}
            <Button
              variant="outline"
              onClick={() => setSubLocationItemsModalData(null)}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
      {/* MANAGE SUB-LOCATION SLIDEOVER (Pallet, Rack, Cabinet, Level, Column) */}
      <SlideOver
        isOpen={isSubLocationModalOpen}
        onClose={() => setIsSubLocationModalOpen(false)}
        title={editingSubLocation ? 'Sunting Unit Fizikal' : 'Tambah Unit Fizikal Baharu'}
        description={`Daftar Palet, Rak, Kabinet, Level atau Column dalam ${selectedStoreLocation?.store_name || 'Stor'}`}
        size="lg"
      >
        <form onSubmit={handleSaveSubLocation} className="flex flex-col h-full bg-slate-50/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Mode Selector: Single vs Bulk Generator */}
            {!editingSubLocation && (
              <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                    !isBulkMode ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tambah 1 Unit (Tunggal)
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isBulkMode ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>⚡ Penjanaan Pukal (Bulk)</span>
                </button>
              </div>
            )}

            {/* Sub-Location Type Select Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Jenis Unit Fizikal <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SUB_LOCATION_TYPES.map(st => (
                  <button
                    key={st.type}
                    type="button"
                    onClick={() => {
                      setSubTypeInput(st.type)
                      if (st.type === 'rack') setBulkPrefixName('Rak')
                      if (st.type === 'cabinet') setBulkPrefixName('Kabinet')
                      if (st.type === 'pallet') setBulkPrefixName('Palet')
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      subTypeInput === st.type
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 mb-0.5">
                      {st.type === 'cabinet' && <Archive className="w-5 h-5 text-purple-600" />}
                      {st.type === 'rack' && <Layers className="w-5 h-5 text-amber-600" />}
                      {st.type === 'pallet' && <Box className="w-5 h-5 text-orange-600" />}
                      {st.type === 'level' && <Tag className="w-5 h-5 text-teal-600" />}
                      {st.type === 'column' && <Grid className="w-5 h-5 text-blue-600" />}
                    </div>
                    <span className="text-xs text-center font-bold">{st.label}</span>
                    <span className="text-[10px] text-slate-400 text-center">{st.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* BULK GENERATOR FORM FIELDS */}
            {isBulkMode ? (
              <div className="bg-teal-50/60 border border-teal-200/80 p-4 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-teal-200/60 pb-2.5">
                  <RefreshCw className="w-4 h-4 text-teal-700 animate-spin-slow" />
                  <h4 className="text-xs font-black uppercase text-teal-900 tracking-wider">
                    Tetapan Penjanaan Pukal (Bulk Generator)
                  </h4>
                </div>

                {subTypeInput === 'level' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-teal-900 mb-1.5">
                        Unit Induk / Parent Rack/Cabinet <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={subParentInput}
                        onChange={e => setSubParentInput(e.target.value)}
                        className="w-full bg-white border border-teal-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition cursor-pointer"
                      >
                        <option value="">Pilih Parent Unit...</option>
                        {subLocations
                          .filter(u => u.type === 'cabinet' || u.type === 'rack' || u.type === 'pallet')
                          .map(u => (
                            <option key={u.id} value={u.name}>
                              {u.name} ({u.code})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900 mb-1.5">
                        Berapa Banyak Level (Tingkat) Untuk Ditambah? <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={bulkLevelsPerUnit}
                        onChange={e => setBulkLevelsPerUnit(Number(e.target.value))}
                        className="w-full bg-white border border-teal-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-teal-200 text-xs text-teal-800 space-y-1">
                      <span className="font-bold block text-teal-900">Ringkasan Penjanaan:</span>
                      <p>
                        Akan menjana <b>{bulkLevelsPerUnit || 0} Level</b> (Level 1 hingga Level {bulkLevelsPerUnit || 1}) di bawah <b>{subParentInput || 'Unit Terpilih'}</b> secara automatik.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-teal-900 mb-1.5">
                          Format / Prefix Nama Unit <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="cth: Rak, Kabinet, Palet"
                          value={bulkPrefixName}
                          onChange={e => setBulkPrefixName(e.target.value)}
                          className="w-full bg-white border border-teal-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-teal-900 mb-1.5">
                          Berapa Banyak Unit Utama? <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          required
                          value={bulkCountUnits}
                          onChange={e => setBulkCountUnits(Number(e.target.value))}
                          className="w-full bg-white border border-teal-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-teal-900 mb-1.5">
                        Berapa Banyak Level (Tingkat) Dalam Setiap Unit?
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={bulkLevelsPerUnit}
                        onChange={e => setBulkLevelsPerUnit(Number(e.target.value))}
                        className="w-full bg-white border border-teal-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-teal-200 text-xs text-teal-800 space-y-1">
                      <span className="font-bold block text-teal-900">Ringkasan Penjanaan Pukal:</span>
                      <p>
                        Akan menjana <b>{bulkCountUnits || 0} {bulkPrefixName || 'Unit'}</b> ({bulkPrefixName} 1 hingga {bulkPrefixName} {bulkCountUnits || 1}) dan <b>{(bulkCountUnits || 0) * (bulkLevelsPerUnit || 0)} Level</b> ({bulkLevelsPerUnit} Level per unit) secara automatik dalam 1 klik!
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* SINGLE UNIT FORM FIELDS */
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nama / Label Sub-Lokasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Kabinet A, Palet 01, Rak DDA, Level 2, Column B3"
                    value={subNameInput}
                    onChange={e => setSubNameInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Unit Induk / Parent Unit (Opsional)
                  </label>
                  <select
                    value={subParentInput}
                    onChange={e => setSubParentInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition cursor-pointer"
                  >
                    <option value="">Tiada (Unit Utama / Direct to Store)</option>
                    {subLocations
                      .filter(u => u.id !== editingSubLocation?.id)
                      .map(u => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.code})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pilih unit utama untuk menetapkan hirarki (contoh: Level 1 diletakkan di bawah Kabinet A)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Kod Tag / Short Identifier (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="cth: CAB-A, PAL-01, COL-B3 (Auto-generated jika kosong)"
                    value={subCodeInput}
                    onChange={e => setSubCodeInput(e.target.value)}
                    className="w-full bg-slate-100/80 border border-slate-200 font-mono text-teal-700 font-bold rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Catatan / Deskripsi Lokasi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan mengenai ruang fizikal ini..."
                    value={subNotesInput}
                    onChange={e => setSubNotesInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubLocationModalOpen(false)}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs px-6 py-2.5 shadow-md flex items-center gap-2"
            >
              <span>
                {editingSubLocation
                  ? 'Simpan Kemaskini'
                  : isBulkMode
                  ? subTypeInput === 'level'
                    ? `⚡ Jana ${bulkLevelsPerUnit || 1} Level Pukal`
                    : `⚡ Jana ${bulkCountUnits || 1} ${bulkPrefixName} & ${ (bulkCountUnits || 1) * (bulkLevelsPerUnit || 0) } Level`
                  : 'Tambah Unit Fizikal'}
              </span>
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* BULK LOCATION ASSIGNMENT SLIDEOVER */}
      <SlideOver
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        title="Tetapkan Lokasi Item Secara Pukal (Bulk Location Assignment)"
        description="Pilih ubat / bekalan bukan ubat dan tetapkan lokasi fizikal stor secara pukal dalam 1 klik"
        size="7xl"
      >
        {bulkAssignTargetUnit && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Target Path, Search, Filters & Consolidated Item Table (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Target Path Banner */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/90 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 block">Lokasi Sasaran (Target Location):</span>
                  <span className="text-base font-black text-teal-950 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
                    {selectedStoreLocation?.store_name} › {bulkAssignTargetUnit.mainUnit.name} {bulkAssignTargetUnit.childUnit ? `› ${bulkAssignTargetUnit.childUnit.name}` : ''}
                  </span>
                </div>
                <Badge variant="success" className="px-3.5 py-1 text-xs font-bold shadow-2xs shrink-0">
                  {selectedDrugIdsForAssign.size} Item Dipilih
                </Badge>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari ubat, kod, lokasi..."
                      value={bulkAssignSearchTerm}
                      onChange={e => setBulkAssignSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setBulkAssignFilterMode('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${bulkAssignFilterMode === 'all' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Semua ({placedDrugItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAssignFilterMode('unassigned')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${bulkAssignFilterMode === 'unassigned' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Belum Diset
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAssignFilterMode('here')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${bulkAssignFilterMode === 'here' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Di Lokasi Ini
                    </button>
                  </div>
                </div>

                {/* Procurement Category Filter Bar (APPL, CC, LP, DP) */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                    Kontrak / Kategori:
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkAssignProcurementFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      bulkAssignProcurementFilter === 'all' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Kontrak
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAssignProcurementFilter('APPL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      bulkAssignProcurementFilter === 'APPL' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                    }`}
                  >
                    APPL
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAssignProcurementFilter('CC')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      bulkAssignProcurementFilter === 'CC' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80'
                    }`}
                  >
                    CC (Central Contract)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAssignProcurementFilter('LP')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      bulkAssignProcurementFilter === 'LP' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
                    }`}
                  >
                    LP (Local Purchase)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAssignProcurementFilter('DP')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      bulkAssignProcurementFilter === 'DP' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
                    }`}
                  >
                    DP (Direct Purchase)
                  </button>
                </div>
              </div>

              {/* Consolidated Item Selection Table (3 Clean Columns) */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[520px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 sticky top-0 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-3 px-3.5 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={visibleDrugItemsForAssign.length > 0 && visibleDrugItemsForAssign.every(i => selectedDrugIdsForAssign.has(i.id || i.drug_id))}
                            onChange={() => handleToggleSelectAllVisible(visibleDrugItemsForAssign.map(i => i.id || i.drug_id))}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
                          />
                        </th>
                        <th className="py-3 px-4">Maklumat Ubat / Bekalan</th>
                        <th className="py-3 px-4 text-right">Lokasi Semasa & Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {visibleDrugItemsForAssign.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-slate-400 font-semibold">
                            Tiada ubat / bekalan ditemui mengikut carian ini.
                          </td>
                        </tr>
                      ) : (
                        visibleDrugItemsForAssign.map(item => {
                          const itemId = item.id || item.drug_id
                          const isSelected = selectedDrugIdsForAssign.has(itemId)
                          const currentLoc = item.location || item.storage_conditions || 'Belum Diset'
                          const pCat = getProcurementCategory(item)

                          return (
                            <tr
                              key={itemId}
                              onClick={() => handleToggleSelectDrug(itemId)}
                              className={`cursor-pointer transition ${isSelected ? 'bg-teal-50/80 border-l-4 border-l-teal-600' : 'hover:bg-slate-50'}`}
                            >
                              <td className="py-3.5 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectDrug(itemId)}
                                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
                                />
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col gap-1">
                                  <span className="font-extrabold text-xs text-slate-900 leading-snug">
                                    {item.drug_name || item.brand_name || item.item_name || '-'}
                                  </span>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-1.5 py-0.5 rounded">
                                      {item.item_code || item.drug_code || '-'}
                                    </span>
                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                                      pCat === 'APPL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      pCat === 'CC' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      pCat === 'LP' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}>
                                      {pCat}
                                    </span>
                                    {(item.dosage_form || item.category) && (
                                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {item.dosage_form || item.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${!currentLoc || currentLoc === 'Belum Diset' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {currentLoc}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-500">
                                    Stok: <b className="text-slate-800">{item.current_stock ?? item.facility_stock ?? 0}</b> {item.unit_of_measure || ''}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Dedicated Selected Items Summary Panel & Action Box (4 Cols) */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className="bg-white border border-teal-200/90 rounded-2xl p-4.5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-teal-950 tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Ringkasan Item Dipilih</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{selectedItemsList.length} item bersedia dipindahkan</p>
                  </div>
                  {selectedItemsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDrugIdsForAssign(new Set())}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline transition cursor-pointer shrink-0"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {selectedItemsList.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">Tiada Item Dipilih</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tanda jadual di sebelah kiri untuk memilih item secara pukal.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {selectedItemsList.map(item => {
                      const itemId = item.id || item.drug_id
                      const name = item.drug_name || item.brand_name || item.item_name || 'Item'
                      const code = item.item_code || item.drug_code

                      return (
                        <div
                          key={itemId}
                          className="p-2.5 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-2 transition group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 leading-snug">{name}</p>
                            {code && <p className="font-mono text-[10px] font-semibold text-teal-700 mt-0.5">{code}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectDrug(itemId)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition cursor-pointer shrink-0 mt-0.5"
                            title="Keluarkan item ini"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Target Path Box & Action Buttons */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="bg-teal-50/80 border border-teal-200/80 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-teal-900 block text-[10px] uppercase tracking-wider">Lokasi Sasaran Akhir:</span>
                    <p className="font-black text-teal-950 text-xs">
                      {selectedStoreLocation?.store_name} › {bulkAssignTargetUnit.mainUnit.name} {bulkAssignTargetUnit.childUnit ? `› ${bulkAssignTargetUnit.childUnit.name}` : ''}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveBulkAssign}
                    disabled={isSavingBulkAssign || selectedDrugIdsForAssign.size === 0}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-extrabold text-xs py-3 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSavingBulkAssign ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
                    <span>Tetapkan Lokasi ({selectedDrugIdsForAssign.size} Item)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBulkAssignModalOpen(false)}
                    className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs py-2.5"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}

export default StoreLocationManagementPage
