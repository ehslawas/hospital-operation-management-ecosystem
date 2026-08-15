// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  Pill,
  Search,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle,
  XCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  ShieldCheck,
  PackageCheck,
  PlusCircle,
  Package,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  TrendingUp,
  BarChart3,
  FileDown,
  Loader2,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { Spinner, Modal, Button } from '@/components/ui'

import { getNonDrugs, getNonDrugCategories } from '@/services/pharmacy/inventoryService'
import { generateFormulariPdf } from '@/services/pharmacy/formulariPdfService'
import {
  loadFacilityNonDrugInventory,
  addToFacilityNonDrugInventory,
  batchAddToFacilityNonDrugInventory,
  updateFacilityNonDrugInventoryItem,
  removeFromFacilityNonDrugInventory,
} from '@/services/pharmacy/facilityNonDrugInventoryService'
import type { FacilityNonDrugItem } from '@/services/pharmacy/facilityNonDrugInventoryService'
import { loadStoreLocations, formatLocationString } from '@/services/pharmacy/storeLocationService'
import { loadStoreSubLocations } from '@/services/pharmacy/storeSubLocationService'
import type { SubLocationUnit } from '@/modules/inventory/pages/inventory/StoreLocationManagementPage'
import type { NonDrugWithRelations, NonDrugCategory } from '@/types/pharmacy'


export async function clearFacilityNonDrugInventoryByScheme(hospitalId, scheme) {
  return { success: true };
}
export const FacilityNonDrugInventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentVoteParam = searchParams.get('vote') || 'all'

  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id || 'hosp-lawas-01'

  const { success: showSuccess, error: showError } = useToastStore()

  // Main catalog drugs (for picker modal)
  const [catalogItems, setCatalogDrugs] = useState<NonDrugWithRelations[]>([])
  const [categories, setCategories] = useState<NonDrugCategory[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  // Facility-specific inventory items
  const [facilityItems, setFacilityItems] = useState<FacilityNonDrugItem[]>([])

  // Modal & Search states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [modalVoteFilter, setModalVoteFilter] = useState<string>('all')
  const [selectedCatalogItem, setSelectedCatalogDrug] = useState<NonDrugWithRelations | null>(null)
  const [selectedCatalogItemIds, setSelectedCatalogDrugIds] = useState<string[]>([])
  const [initialStockInput, setInitialStockInput] = useState<number>(0)
  const [minBufferInput, setMinBufferInput] = useState<number>(20)

  // Edit Drawer state
  const [editingItem, setEditingItem] = useState<FacilityNonDrugItem | null>(null)
  const [activeEditTab, setActiveEditTab] = useState<'settings' | 'purchasing' | 'receiving' | 'issuing' | 'qrcode'>('settings')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [editStockInput, setEditStockInput] = useState<number | string>(0)
  const [editMinLevelInput, setEditMinLevelInput] = useState<number | string>(10)
  const [editMaxLevelInput, setEditMaxLevelInput] = useState<number | string>(100)
  const [editBufferInput, setEditBufferInput] = useState<number | string>(20)
  const [editPriceInput, setEditPriceInput] = useState<number | string>(0)
  const [editTherapeuticCat, setEditTherapeuticCat] = useState<string>('General')
  const [editPrescriberCat, setEditPrescriberCat] = useState<string>('B')
  const [editLocationInput, setEditLocationInput] = useState<string>('Stor Utama / Rak A-01')

  // Sub-locations state (Store -> Rack -> Level)
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>('')
  const [selectedRackName, setSelectedRackName] = useState<string>('')
  const [selectedLevelName, setSelectedLevelName] = useState<string>('')
  const [storeSubLocations, setStoreSubLocations] = useState<SubLocationUnit[]>([])
  const [isLoadingSubLocations, setIsLoadingSubLocations] = useState<boolean>(false)

  // Real Database Transactions & POs state
  const [realTransactions, setRealTransactions] = useState<any[]>([])
  const [realPOs, setRealPOs] = useState<any[]>([])
  const [isTxLoading, setIsTxLoading] = useState<boolean>(false)
  const [editBatchInput, setEditBatchInput] = useState<string>('')
  const [editExpiryInput, setEditExpiryInput] = useState<string>('')
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Table Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [prescriberFilter, setPrescriberFilter] = useState<string>('all')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)
  const pageSize = 15

  const [availableStoreLocations, setAvailableStoreLocations] = useState<any[]>([])

  // Load sub-locations when selectedStoreCode changes
  useEffect(() => {
    if (!selectedStoreCode) {
      setStoreSubLocations([])
      return
    }
    let isMounted = true
    setIsLoadingSubLocations(true)
    loadStoreSubLocations(hospitalId, selectedStoreCode).then(subLocs => {
      if (isMounted) {
        setStoreSubLocations(subLocs)
        setIsLoadingSubLocations(false)
      }
    })
    return () => { isMounted = false }
  }, [hospitalId, selectedStoreCode])

  // Filter available Racks (strictly main physical units: rack, cabinet, pallet)
  const availableRacks = useMemo(() => {
    if (!storeSubLocations || storeSubLocations.length === 0) return []
    return storeSubLocations.filter(unit =>
      unit.type === 'rack' || unit.type === 'cabinet' || unit.type === 'pallet'
    )
  }, [storeSubLocations])

  // Filter available Levels (strictly child units under selected rack)
  const availableLevels = useMemo(() => {
    if (!selectedRackName || !storeSubLocations || storeSubLocations.length === 0) return []
    return storeSubLocations.filter(unit =>
      (unit.type === 'level' || unit.type === 'column') && unit.parent_name === selectedRackName
    )
  }, [storeSubLocations, selectedRackName])

  // Helper to re-format overall location string when user picks Store, Rack, or Level
  const handleLocationChange = (newStoreCode: string, newRack: string, newLevel: string) => {
    setSelectedStoreCode(newStoreCode)
    setSelectedRackName(newRack)
    setSelectedLevelName(newLevel)

    if (!newStoreCode) {
      setEditLocationInput('')
      return
    }

    const storeObj = availableStoreLocations.find(l => l.location_code === newStoreCode)
    const storeName = storeObj ? storeObj.store_name : newStoreCode
    const formattedCode = storeObj?.location_code ? `[${storeObj.location_code}] ` : ''

    let result = `${formattedCode}${storeName}`
    if (newRack) result += ` > ${newRack}`
    if (newLevel) result += ` > ${newLevel}`

    setEditLocationInput(result)
  }

  // ─── Load facility inventory & store locations ──────────────────────────────
  useEffect(() => {
    let isMounted = true
    setIsLoadingInventory(true)
    loadFacilityNonDrugInventory(hospitalId).then(items => {
      if (isMounted) {
        setFacilityItems(items)
        setIsLoadingInventory(false)
      }
    })
    loadStoreLocations(hospitalId).then(locs => {
      if (isMounted) {
        setAvailableStoreLocations(locs.filter(l => l.is_active && (l.location_type === 'drug' || l.location_type === 'both')))
      }
    })
    return () => { isMounted = false }
  }, [hospitalId])

  // ─── Add Single Item ──────────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!selectedCatalogItem) return
    const res = await addToFacilityNonDrugInventory(
      hospitalId, selectedCatalogItem,
      Number(initialStockInput) || 0,
      Number(minBufferInput) || 20
    )
    if (!res.success) { showError(res.error || 'Gagal menambah item.'); return }
    // Reload from Supabase so all browsers get the latest
    const fresh = await loadFacilityNonDrugInventory(hospitalId)
    setFacilityItems(fresh)
    showSuccess(`'${selectedCatalogItem.item_name}' berjaya ditambah ke Inventori Fasiliti.`)
    setSelectedCatalogDrug(null)
    setSelectedCatalogDrugIds([])
    setInitialStockInput(0)
    setMinBufferInput(20)
    setIsAddModalOpen(false)
  }

  // ─── Batch Add ────────────────────────────────────────────────────────────
  const handleBatchAddItems = async () => {
    if (selectedCatalogItemIds.length === 0) return
    const drugsToAdd = catalogItems.filter(d => selectedCatalogItemIds.includes(d.id))
    if (drugsToAdd.length === 0) return
    const res = await batchAddToFacilityNonDrugInventory(
      hospitalId, drugsToAdd,
      Number(initialStockInput) || 0,
      Number(minBufferInput) || 20
    )
    if (res.error && res.added === 0) { showError(res.error); return }
    const fresh = await loadFacilityNonDrugInventory(hospitalId)
    setFacilityItems(fresh)
    showSuccess(`${res.added} item bukan ubat berjaya ditambah ke Inventori Fasiliti.${ res.skipped > 0 ? ` (${res.skipped} sudah wujud, dilangkau.)` : '' }`)
    setSelectedCatalogDrugIds([])
    setSelectedCatalogDrug(null)
    setIsAddModalOpen(false)
  }

  // ─── Delete Single Item ───────────────────────────────────────────────────
  const handleDeleteItem = async (drugId: string, drugName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await removeFromFacilityNonDrugInventory(hospitalId, drugId)
    const fresh = await loadFacilityNonDrugInventory(hospitalId)
    setFacilityItems(fresh)
    showSuccess(`'${drugName}' dikeluarkan daripada Inventori Fasiliti.`)
  }

  // ─── Remove from edit drawer ─────────────────────────────────────────────
  const handleRemoveItem = async (id: string, name: string) => {
    if (!confirm(`Adakah anda pasti untuk memadam '${name}' daripada Inventori Fasiliti?`)) return
    await removeFromFacilityNonDrugInventory(hospitalId, id)
    const fresh = await loadFacilityNonDrugInventory(hospitalId)
    setFacilityItems(fresh)
    showSuccess(`'${name}' telah dipadam daripada Inventori Fasiliti.`)
    setEditingItem(null)
  }

  // ─── Clear scheme ─────────────────────────────────────────────────────────
  const handleClearCurrentScheme = async () => {
    const schemeName = currentVoteParam === 'all' ? 'Semua Skim' : `Skim ${currentVoteParam.toUpperCase()}`
    if (!window.confirm(`Adakah anda pasti untuk mengosongkan item dalam ${schemeName}?`)) return
    await clearFacilityNonDrugInventoryByScheme(hospitalId, currentVoteParam)
    const fresh = await loadFacilityNonDrugInventory(hospitalId)
    setFacilityItems(fresh)
    showSuccess(`Item dalam ${schemeName} berjaya dikosongkan.`)
  }

  // Load Categories once
  useEffect(() => {
    getNonDrugCategories().then(catRes => {
      if (catRes.data) setCategories(catRes.data)
    })
  }, [])

  // Load Catalog Drugs for Modal with scheme filter & high limit (5000)
  useEffect(() => {
    if (!isAddModalOpen) return
    const loadCatalogData = async () => {
      setIsCatalogLoading(true)
      const filterObj = modalVoteFilter !== 'all' ? { procurement_vote: modalVoteFilter } : {}
      const drugRes = await getNonDrugs(hospitalId, filterObj, 1, 5000)
      if (drugRes.data) setCatalogDrugs(drugRes.data.data)
      setIsCatalogLoading(false)
    }
    void loadCatalogData()
  }, [hospitalId, isAddModalOpen, modalVoteFilter])

  // Toggle item selection
  const handleToggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedCatalogDrugIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Open Edit Drawer
  const handleOpenEditModal = (drug: FacilityNonDrugItem) => {
    setEditingItem(drug)
    setActiveEditTab('settings')
    setEditStockInput(drug.facility_stock ?? 0)
    setEditMinLevelInput(drug.min_stock_level ?? 10)
    setEditMaxLevelInput(drug.max_stock_level ?? 100)
    setEditBufferInput(drug.min_buffer_level ?? 20)
    setEditPriceInput(drug.price ?? drug.unit_price ?? 0)
    setEditTherapeuticCat(drug.category?.category_name || 'General')
    setEditPrescriberCat('-')

    const locStr = (drug as any).location || drug.storage_conditions || ''
    setEditLocationInput(locStr)
    setEditBatchInput(drug.batch_number || drug.batch_no || '')
    setEditExpiryInput(drug.expiry_date || drug.exp_date || '')

    // Parse location code / store name and sub-locations
    const matchedStore = availableStoreLocations.find(l =>
      locStr.includes(l.location_code) || locStr.includes(l.store_name)
    )

    if (matchedStore) {
      const storeCode = matchedStore.location_code
      setSelectedStoreCode(storeCode)

      const parts = locStr.split('>').map((s: string) => s.trim())
      const rackPart = parts[1] || ''
      const levelPart = parts[2] || ''

      setSelectedRackName(rackPart)
      setSelectedLevelName(levelPart)

      // Fetch sub-locations for this store immediately
      loadStoreSubLocations(hospitalId, storeCode).then(subLocs => {
        setStoreSubLocations(subLocs)
      })
    } else if (availableStoreLocations.length > 0) {
      const defaultStoreCode = availableStoreLocations[0].location_code
      setSelectedStoreCode(defaultStoreCode)
      setSelectedRackName('')
      setSelectedLevelName('')

      loadStoreSubLocations(hospitalId, defaultStoreCode).then(subLocs => {
        setStoreSubLocations(subLocs)
      })
    } else {
      setSelectedStoreCode('')
      setSelectedRackName('')
      setSelectedLevelName('')
      setStoreSubLocations([])
    }
  }

  // Fetch real database transactions and POs when editingItem is selected
  useEffect(() => {
    if (!editingItem) {
      setRealTransactions([])
      setRealPOs([])
      return
    }

    let isMounted = true
    setIsTxLoading(true)

    async function loadRealData() {
      try {
        let fetchedTx: any[] = []
        let fetchedPOs: any[] = []

        const isUuid = (val?: string) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

        if (isSupabaseConfigured()) {
          if (isUuid(editingItem.id)) {
            const { data: txData, error: txError } = await supabase
              .from('pharmacy_stock_transactions')
              .select('*')
              .eq('item_id', editingItem.id)
              .order('created_at', { ascending: false })
              .limit(50)

            if (!txError && txData) fetchedTx = txData
          }

          const poConditions: string[] = []
          if (isUuid(editingItem.id)) {
            poConditions.push(`item_id.eq.${editingItem.id}`)
          }
          if (editingItem.item_code && editingItem.item_code !== 'N/A') {
            poConditions.push(`item_code.eq.${editingItem.item_code}`)
          }

          if (poConditions.length > 0) {
            const { data: poData, error: poError } = await supabase
              .from('pharmacy_purchase_order_items')
              .select('*, pharmacy_purchase_orders(*)')
              .or(poConditions.join(','))
              .order('created_at', { ascending: false })
              .limit(50)

            if (!poError && poData) {
              fetchedPOs = poData.map((item: any) => ({
                ...item,
                purchase_order: item.pharmacy_purchase_orders
              }))
            }
          }
        }

        // Check local storage for local offline transactions / POs if available
        try {
          const localTxStr = localStorage.getItem('pharmacy_stock_transactions')
          if (localTxStr) {
            const localTxArr = JSON.parse(localTxStr)
            const matchedLocalTx = localTxArr.filter((t: any) =>
              t.item_id === editingItem.id ||
              t.item_code === editingItem.item_code ||
              (t.item_name && editingItem.item_name && t.item_name.toLowerCase() === editingItem.item_name.toLowerCase())
            )
            fetchedTx = [...fetchedTx, ...matchedLocalTx]
          }

          const localPoStr = localStorage.getItem('pharmacy_purchase_orders')
          if (localPoStr) {
            const localPoArr = JSON.parse(localPoStr)
            const matchedLocalPOs = localPoArr.filter((po: any) =>
              po.items?.some((i: any) => i.drug_id === editingItem.id || i.item_code === editingItem.item_code)
            )
            fetchedPOs = [...fetchedPOs, ...matchedLocalPOs]
          }
        } catch (e) {
          // ignore local parsing error
        }

        if (isMounted) {
          setRealTransactions(fetchedTx)
          setRealPOs(fetchedPOs)
        }
      } catch (err) {
        console.error('Error loading item database transactions:', err)
      } finally {
        if (isMounted) setIsTxLoading(false)
      }
    }

    loadRealData()
    return () => {
      isMounted = false
    }
  }, [editingItem])

  // Generate QR Code data URL when editingItem changes
  useEffect(() => {
    if (!editingItem) {
      setQrCodeUrl('')
      return
    }

    const code = editingItem.item_code || editingItem.item_code || editingItem.sku || editingItem.id
    const payload = JSON.stringify({
      code,
      name: editingItem.item_name || editingItem.item_name,
      type: 'NONDRUG',
      vote: editingItem.procurement_vote || 'APPL',
      location: editLocationInput || editingItem.location || 'N/A',
      hospital_id: hospitalId,
      facility_inventory_id: editingItem.facility_inventory_id || editingItem.id
    })

    QRCode.toDataURL(payload, { width: 320, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(url => setQrCodeUrl(url))
      .catch(err => {
        console.error('Error generating QR Code:', err)
        setQrCodeUrl('')
      })
  }, [editingItem, editLocationInput, hospitalId])

  const handlePrintQrLabel = () => {
    if (!editingItem || !qrCodeUrl) return
    const code = editingItem.item_code || editingItem.item_code || editingItem.sku || '-'
    const name = editingItem.item_name || editingItem.item_name
    const vote = (editingItem.procurement_vote || 'APPL').toUpperCase()
    const location = editLocationInput || editingItem.location || 'Belum Diset'
    const uom = editingItem.unit_of_measure || editingItem.uom || editingItem.unit_of_measure || 'PACK'

    const printWindow = window.open('', '_blank', 'width=650,height=650')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Label QR - ${code}</title>
          <style>
            @page { 
              size: 60mm 40mm; 
              margin: 0; 
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body { 
              width: 60mm;
              height: 40mm;
              background: #fff;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              overflow: hidden;
            }
            .page-container {
              width: 60mm;
              height: 40mm;
              padding: 1.5mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .label-card { 
              width: 100%;
              height: 100%;
              border: 1.5px solid #0f172a; 
              border-radius: 6px; 
              padding: 2.5mm; 
              display: flex; 
              flex-direction: column; 
              justify-content: space-between;
              background: #fff;
            }
            .header { 
              border-bottom: 1px solid #cbd5e1; 
              padding-bottom: 2mm; 
              display: flex; 
              align-items: center; 
              gap: 5px; 
            }
            .logo { 
              width: 20px; 
              height: 20px; 
              object-fit: contain; 
              flex-shrink: 0;
            }
            .header-text { 
              flex: 1; 
              min-width: 0;
            }
            .gov-title { 
              font-size: 5.5px; 
              font-weight: 700; 
              color: #475569; 
              text-transform: uppercase; 
              line-height: 1; 
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .hosp-title { 
              font-size: 8.5px; 
              font-weight: 800; 
              color: #0f172a; 
              text-transform: uppercase; 
              line-height: 1.1; 
              margin-top: 1px; 
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .badge { 
              font-size: 7.5px; 
              font-weight: 800; 
              background: #e0f2fe; 
              color: #0284c7; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-family: monospace; 
              flex-shrink: 0;
            }
            .body { 
              display: flex; 
              align-items: center; 
              gap: 6px; 
              flex: 1; 
              min-height: 0;
              padding: 1mm 0;
            }
            .qr-img { 
              width: 17mm; 
              height: 17mm; 
              object-fit: contain; 
              flex-shrink: 0;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 1px;
            }
            .details { 
              flex: 1; 
              min-width: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 1.5px;
            }
            .item-code { 
              font-family: monospace; 
              font-size: 8.5px; 
              font-weight: 800; 
              color: #2563eb; 
              word-break: break-all;
            }
            .item-name { 
              font-size: 8.5px; 
              font-weight: 800; 
              color: #0f172a; 
              line-height: 1.15; 
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .meta { 
              font-size: 7px; 
              color: #334155; 
              line-height: 1.15;
            }
            .meta-location {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .meta-label {
              color: #64748b;
              font-weight: 600;
            }
            .meta b {
              color: #0f172a;
              font-weight: 700;
            }
            .footer { 
              border-top: 1px dashed #cbd5e1; 
              padding-top: 1.5mm; 
              font-size: 6px; 
              color: #64748b; 
              text-align: center; 
              font-weight: 700; 
              letter-spacing: 0.3px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="label-card">
              <div class="header">
                <img src="${window.location.origin}/512px-Jata_MalaysiaV2.svg.png" class="logo" />
                <div class="header-text">
                  <div class="gov-title">Kementerian Kesihatan Malaysia</div>
                  <div class="hosp-title">Hospital Lawas</div>
                </div>
                <span class="badge">${vote}</span>
              </div>
              <div class="body">
                <img src="${qrCodeUrl}" class="qr-img" />
                <div class="details">
                  <div class="item-code">[ ${code} ]</div>
                  <div class="item-name">${name}</div>
                  <div class="meta"><span class="meta-label">Packaging:</span> <b>${uom}</b></div>
                  <div class="meta meta-location"><span class="meta-label">Lokasi:</span> <b>${location}</b></div>
                </div>
              </div>
              <div class="footer">STOK INVENTORI FASILITI • H.O.M.E. ECOSYSTEM</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleCopyPayload = () => {
    if (!editingItem) return
    const code = editingItem.item_code || editingItem.item_code || editingItem.sku || editingItem.id
    const payload = JSON.stringify({
      code,
      name: editingItem.item_name || editingItem.item_name,
      type: 'NONDRUG',
      vote: editingItem.procurement_vote || 'APPL',
      location: editLocationInput || editingItem.location || 'N/A',
      hospital_id: hospitalId,
      facility_inventory_id: editingItem.facility_inventory_id || editingItem.id
    })

    navigator.clipboard.writeText(payload)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Dynamic Month Labels: 6 Past Months + 3 Future Forecast Months
  const chartMonths = useMemo(() => {
    const months: string[] = []
    const monthNamesMalay = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis']
    const today = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      months.push(monthNamesMalay[d.getMonth()])
    }

    for (let i = 1; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      months.push(`${monthNamesMalay[d.getMonth()]} (Ramalan)`)
    }

    return months
  }, [])

  // Calculate Real Average Monthly Consumption (AMC) from actual issue transactions
  const amcValue = useMemo(() => {
    if (!editingItem) return 0

    const issueTx = realTransactions.filter(
      t => t.transaction_type === 'issue' || (t.quantity && Number(t.quantity) < 0)
    )

    if (issueTx.length > 0) {
      const totalIssued = issueTx.reduce((sum, t) => sum + Math.abs(Number(t.quantity) || 0), 0)
      return Math.round(totalIssued / 6)
    }

    if (editingItem.amc != null && !isNaN(Number(editingItem.amc))) {
      return Number(editingItem.amc)
    }

    return 0
  }, [editingItem, realTransactions])

  // Calculate Real Monthly Usage History (6 Past Months) & Real Forecast (3 Future Months)
  const usageHistoryData = useMemo(() => {
    const today = new Date()
    const result: number[] = []

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      const monthIssueTx = realTransactions.filter(t => {
        const isIssue = t.transaction_type === 'issue' || (t.quantity && Number(t.quantity) < 0)
        if (!isIssue) return false

        const d = new Date(t.transaction_date || t.created_at)
        return !isNaN(d.getTime()) && d.getMonth() === targetMonth && d.getFullYear() === targetYear
      })

      const monthTotal = monthIssueTx.reduce((sum, t) => sum + Math.abs(Number(t.quantity) || 0), 0)
      result.push(monthTotal)
    }

    const nonZeroMonths = result.filter(v => v > 0)
    const baseline = nonZeroMonths.length > 0
      ? Math.round(nonZeroMonths.reduce((a, b) => a + b, 0) / nonZeroMonths.length)
      : amcValue

    for (let i = 1; i <= 3; i++) {
      result.push(baseline)
    }

    return result
  }, [realTransactions, amcValue])

  const maxChartVal = useMemo(() => Math.max(...usageHistoryData, 10), [usageHistoryData])

  const estimatedPurchasingQty = useMemo(() => {
    if (!editingItem) return 0
    const currentStock = Number(editStockInput === '' ? editingItem.facility_stock : editStockInput) || 0
    const minBuffer = Number(editBufferInput === '' ? editingItem.min_buffer_level : editBufferInput) || 0
    const target = (amcValue * 2) + minBuffer
    return Math.max(0, target - currentStock)
  }, [editingItem, editStockInput, editBufferInput, amcValue])

  const estimatedPurchasingCost = useMemo(() => {
    if (!editingItem) return 0
    const unitPrice = Number(editPriceInput === '' ? (editingItem.price ?? editingItem.unit_price) : editPriceInput) || 0
    return estimatedPurchasingQty * unitPrice
  }, [editingItem, editPriceInput, estimatedPurchasingQty])
  // ─── Save Edit (stock, buffer, batch, expiry, etc.) ─────────────────────
  const handleSaveEdit = async () => {
    if (!editingItem) return
    const minVal    = editMinLevelInput === '' ? 0 : Number(editMinLevelInput)
    const maxVal    = editMaxLevelInput === '' ? 0 : Number(editMaxLevelInput)
    const bufferVal = editBufferInput === '' ? 0 : Number(editBufferInput)

    // editingItem.id is the drug catalog UUID (from ...row.drug spread),
    // which equals the drug_id FK on facility_drug_inventory.
    const result = await updateFacilityNonDrugInventoryItem(hospitalId, editingItem.id, {
      min_buffer_level: bufferVal,
      batch_number: editBatchInput.trim() || undefined,
      expiry_date: editExpiryInput.trim() || undefined,
      location: editLocationInput.trim() || undefined,
    })

    if (!result.success) {
      showError(`Gagal menyimpan: ${result.error ?? 'Ralat tidak diketahui'}`)
      return
    }

    // min_stock_level & max_stock_level live on the drugs table — update them separately.
    import('@/services/supabase').then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured()) {
        supabase
          .from('drugs')
          .update({ min_stock_level: minVal, max_stock_level: maxVal, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id)
          .then(({ error }) => {
            if (error) console.error('[FacilityInventory] Failed to update drugs min/max:', error)
          })
      }
    })

    const fresh = await loadFacilityNonDrugInventory(hospitalId)
    setFacilityItems(fresh)
    showSuccess(`Konfigurasi stok untuk '${editingItem.item_name}' berjaya dikemaskini.`)
    setEditingItem(null)
  }

  // Generate distinct category options combining therapeutic categories & DB categories
  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    const defaults = [
      'Analgesic',
      'Anesthetic',
      'Antibiotic',
      'Anticoagulant',
      'Anticonvulsant',
      'Antidiabetic',
      'Antiemetic',
      'Antidote',
      'Antihistamine',
      'Antihyperlipidemic',
      'Antihypertensive',
      'Antipsychotic',
      'Corticosteroid',
      'Ophthalmic',
      'Supplement'
    ]
    defaults.forEach(d => set.add(d))

    const prescriberCodes = new Set(['A*', 'A', 'A/KK', 'B', 'C', 'C+'])

    categories.forEach(c => {
      const name = c.category_name || (c as any).name
      if (name && !prescriberCodes.has(name.trim())) set.add(name)
    })

    facilityItems.forEach(item => {
      const cat = item.category?.category_name || 'General'
      if (cat && !prescriberCodes.has(cat.trim())) set.add(cat)
    })

    return Array.from(set).sort()
  }, [facilityItems, categories])

  // Filtered facility items based on sidebar sub-menu (APPL/CC/LP/DP) & search filters
  const filteredItems = useMemo(() => {
    return facilityItems.filter(item => {
      // Sidebar Vote filter
      if (currentVoteParam !== 'all') {
        const itemVote = (item.procurement_vote || 'appl').toLowerCase()
        if (itemVote !== currentVoteParam.toLowerCase()) return false
      }

      // Search term (matches code, name, generic, contract no, category or prescriber)
      if (search) {
        const q = search.toLowerCase()
        const code = item.item_code || item.sku || ''
        const contractNo = item.cc_contract_number || item.kkm_contract_number || item.contract_number || ''
        const therapeuticCategory = (item.category?.category_name || 'General').toLowerCase()
        const prescriberCat = '-'
        const matchCode = code.toLowerCase().includes(q)
        const matchName = item.item_name?.toLowerCase().includes(q)
        const matchGeneric = item.generic_name?.toLowerCase().includes(q)
        const matchContract = contractNo.toLowerCase().includes(q)
        const matchCat = therapeuticCategory.includes(q) || prescriberCat.includes(q)
        if (!matchCode && !matchName && !matchGeneric && !matchContract && !matchCat) return false
      }

      // Category filter (Therapeutic Category)
      if (categoryId) {
        const itemCat = (item.category?.category_name || 'General').toLowerCase()
        const selectedCat = categoryId.toLowerCase()
        if (item.category_id !== categoryId && !itemCat.includes(selectedCat)) return false
      }

      // Prescriber filter (KKM Prescriber Category: A*, A, A/KK, B, C)
      if (prescriberFilter && prescriberFilter !== 'all') {
        const itemPrescriber = '-'
        if (itemPrescriber !== prescriberFilter) return false
      }

      // Status
      if (status === 'active' && item.is_active === false) return false
      if (status === 'inactive' && item.is_active !== false) return false

      return true
    }).sort((a, b) => {
      const nameA = a.item_name || a.item_name || ''
      const nameB = b.item_name || b.item_name || ''
      return nameA.localeCompare(nameB)
    })
  }, [facilityItems, currentVoteParam, search, categoryId, prescriberFilter, status])

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  // Catalog drugs filtered for picker modal
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter(drug => {
      // Filter out already added items
      if (facilityItems.some(f => f.id === drug.id)) return false

      if (modalVoteFilter !== 'all') {
        const dVote = (drug.procurement_vote || 'appl').toLowerCase()
        if (dVote !== modalVoteFilter.toLowerCase()) return false
      }

      if (modalSearch) {
        const q = modalSearch.toLowerCase()
        const code = drug.item_code || drug.item_code || drug.sku || ''
        const contractNo = drug.cc_contract_number || drug.kkm_contract_number || drug.contract_number || ''
        return (
          code.toLowerCase().includes(q) ||
          drug.item_name?.toLowerCase().includes(q) ||
          drug.generic_name?.toLowerCase().includes(q) ||
          contractNo.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [catalogItems, facilityItems, modalVoteFilter, modalSearch])

  // Select all toggle helper
  const allFilteredIds = useMemo(() => filteredCatalogItems.map(d => d.id), [filteredCatalogItems])
  const isAllSelected = useMemo(() => {
    return allFilteredIds.length > 0 && allFilteredIds.every(id => selectedCatalogItemIds.includes(id))
  }, [allFilteredIds, selectedCatalogItemIds])

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCatalogDrugIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
    } else {
      setSelectedCatalogDrugIds(prev => Array.from(new Set([...prev, ...allFilteredIds])))
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const renderContractPeriodBadge = (
    startDateStr?: string,
    endDateStr?: string,
    contractStatus?: string,
    procurementVote?: string,
    contractNo?: string
  ) => {
    const startFormatted = formatDate(startDateStr)
    const endFormatted = formatDate(endDateStr)

    let isExpired = contractStatus?.toLowerCase() === 'expired' || contractStatus?.toLowerCase() === 'tamat'

    if (!isExpired && endDateStr) {
      const end = new Date(endDateStr)
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999)
        if (end < new Date()) {
          isExpired = true
        }
      }
    }

    if (isExpired) {
      return (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Tempoh: {startFormatted || '?'} - {endFormatted || '?'} (Tamat)
        </span>
      )
    }

    if (startDateStr || endDateStr) {
      return (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Tempoh: {startFormatted || '?'} - {endFormatted || '?'}
        </span>
      )
    }

    const isCcOrContract = procurementVote?.toLowerCase() === 'cc' || !!contractNo
    if (isCcOrContract) {
      return (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Tiada Tempoh Kontrak
        </span>
      )
    }

    return null
  }

  // Summary Metrics
  const activeCount = filteredItems.filter(d => d.is_active !== false).length
  const totalValuation = filteredItems.reduce((acc, d) => {
    const itemPrice = d.price ?? d.unit_price ?? 0
    return acc + itemPrice * (d.facility_stock || 0)
  }, 0)

  return (
    <div className="p-6 space-y-6 w-full animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Building2 className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Warehouse className="w-4 h-4 text-emerald-400" />
            <span>Facility Inventory Module</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium">Main Store</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            Facility Non-Drug Inventory
            <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-normal uppercase">
              {currentVoteParam === 'all' ? 'Semua Skim' : `Skim ${currentVoteParam.toUpperCase()}`}
            </span>
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Pilih dan tambah item bukan ubat daripada Katalog Utama ke inventori fasiliti anda secara manual.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {/* Export Formulari PDF */}
          <button
            onClick={async () => {
              if (isExporting) return
              setIsExporting(true)
              try {
                const skimLabel = currentVoteParam === 'all' ? 'SEMUA SKIM' : currentVoteParam.toUpperCase()
                await new Promise<void>(resolve => {
                  setTimeout(() => {
                    generateFormulariPdf(filteredItems, {
                      skim: skimLabel,
                      preparedBy: user?.full_name || user?.name || 'Penyelia Stor',
                      approvedBy: 'Pengarah Hospital',
                      hospitalName: 'HOSPITAL LAWAS',
                      department: 'Stor Integrasi Bukan Ubat',
                      isNonDrug: true,
                    })
                    resolve()
                  }, 50)
                })
              } catch (err) {
                console.error('Export PDF error:', err)
              } finally {
                setIsExporting(false)
              }
            }}
            disabled={isExporting || filteredItems.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg
              bg-white/10 hover:bg-white/20 border border-white/30 text-white
              disabled:opacity-50 disabled:cursor-allowed"
            title="Eksport Katalog Bukan Ubat sebagai PDF Rasmi"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>Eksport Katalog PDF</span>
          </button>

          <Button
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all border border-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Item Dari Katalog
          </Button>
        </div>
      </div>

      {/* Tabs Filter (Skim) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Semua Skim' },
          { id: 'appl', label: 'APPL' },
          { id: 'cc', label: 'CC' },
          { id: 'lp', label: 'LP' },
          { id: 'dp', label: 'DP' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setSearchParams({ vote: tab.id })
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentVoteParam === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Jumlah Item Fasiliti</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{filteredItems.length}</div>
          <p className="text-xs text-slate-500 mt-1">Item dipilih di fasiliti ini</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Status Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
          <p className="text-xs text-slate-500 mt-1">Sedia digunakan / diagihkan</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Skim Dipilih</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 uppercase">{currentVoteParam}</div>
          <p className="text-xs text-slate-500 mt-1">Mod paparan skim perolehan</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Nilai Stok Pegangan</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">RM {totalValuation.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-slate-500 mt-1">Nilai inventori semasa fasiliti</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari item dalam inventori fasiliti..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="" className="text-slate-800 bg-white font-medium">Semua Kategori Bukan Ubat</option>
              {categoryOptions.map(catName => (
                <option key={catName} value={catName} className="text-slate-800 bg-white font-medium">
                  {catName}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>

            {facilityItems.length > 0 && (
              <button
                onClick={handleClearCurrentScheme}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                title="Kosongkan senarai item untuk skim ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kosongkan Senarai
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama & Kod Bukan Ubat</th>
                <th className="py-3.5 px-4">Packaging</th>
                <th className="py-3.5 px-4">Stok Fasiliti</th>
                <th className="py-3.5 px-4">No. Batch</th>
                <th className="py-3.5 px-4">Tarikh Luput</th>
                <th className="py-3.5 px-4">Harga (RM)</th>
                <th className="py-3.5 px-4">Skim</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">Tiada Item dalam Inventori Fasiliti</h3>
                      <p className="text-xs text-slate-500">
                        Inventori bukan ubat fasiliti anda masih kosong {currentVoteParam !== 'all' ? `untuk skim ${currentVoteParam.toUpperCase()}` : ''}. Sila klik butang di bawah untuk memilih item bukan ubat daripada Katolog Utama.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Tambah Item dari Katolog
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map(drug => {
                  const code = drug.item_code || drug.item_code || drug.sku || '-'
                  const priceVal = drug.price ?? drug.unit_price ?? 0
                  const therapeuticCat = drug.category?.category_name || 'General'
                  const prescriberCat = '-'
                  const batchNo = drug.batch_number || drug.batch_no || '-'
                  const expDate = drug.expiry_date || drug.exp_date || '-'
                  return (
                    <tr
                      key={drug.id}
                      onClick={() => handleOpenEditModal(drug)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      title="Klik untuk kemaskini stok & butiran"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-blue-600 mb-0.5">{code}</div>
                        <div className="font-semibold text-slate-900">{drug.item_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 uppercase">
                          {drug.unit_of_measure || drug.uom || 'PACK'}
                        </div>
                        {drug.packaging_description && (
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">{drug.packaging_description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {drug.facility_stock ?? 0}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {batchNo !== '-' ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80 font-bold">
                            {batchNo}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {expDate !== '-' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
                            {expDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        RM {priceVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          drug.procurement_vote === 'appl'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : drug.procurement_vote === 'lp'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {(drug.procurement_vote || 'APPL').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => handleDeleteItem(drug.id, drug.item_name, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Padam item ini dari inventori fasiliti"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Menunjukkan halaman <span className="font-semibold text-slate-800">{page}</span> daripada <span className="font-semibold text-slate-800">{totalPages}</span> ({filteredItems.length} item)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Sebelum
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Item From Catalog Right Slide-Over Panel */}
      {isAddModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] transition-opacity"
            onClick={() => {
              setIsAddModalOpen(false)
              setSelectedCatalogDrug(null)
              setSelectedCatalogDrugIds([])
            }}
          />

          {/* Slide-Over Drawer */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[680px] lg:w-[760px] bg-white shadow-2xl z-[100] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-md">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Katolog Utama Hospital</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Pilih Item Bukan Ubat Daripada Katolog</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pilih satu atau beberapa item bukan ubat untuk dimasukkan ke dalam pegangan inventori fasiliti anda.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setSelectedCatalogDrug(null)
                  setSelectedCatalogDrugIds([])
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedCatalogItem ? (
                <>
                  {/* Search & Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari kod barang, nama bukan ubat atau bahan aktif..."
                        value={modalSearch}
                        onChange={e => setModalSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <select
                      value={modalVoteFilter}
                      onChange={e => setModalVoteFilter(e.target.value)}
                      className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">Semua Skim</option>
                      <option value="appl">APPL</option>
                      <option value="cc">CC</option>
                      <option value="lp">LP</option>
                      <option value="dp">DP</option>
                    </select>
                  </div>

                  {/* Multi-Select Header Toolbar */}
                  <div className="flex items-center justify-between px-1 py-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Senarai Item Katolog ({filteredCatalogItems.length} dijumpai)
                    </div>

                    {filteredCatalogItems.length > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        Pilih Semua ({allFilteredIds.length})
                      </label>
                    )}
                  </div>

                  {/* Item List */}
                  <div className="space-y-2">
                    {isCatalogLoading ? (
                      <div className="py-16 text-center text-slate-400">
                        <Spinner className="w-8 h-8 mx-auto text-blue-600 mb-3" />
                        <p className="text-sm font-medium text-slate-600">Memuatkan Katolog Bukan Ubat Utama...</p>
                      </div>
                    ) : filteredCatalogItems.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                        <p className="text-sm font-medium text-slate-600">Tiada item Katolog dijumpai.</p>
                        <p className="text-xs text-slate-400 mt-1">Cuba tukar kata kunci carian atau penapis skim.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
                        {filteredCatalogItems.map(drug => {
                          const code = drug.item_code || drug.item_code || drug.sku || '-'
                          const contractNo = drug.cc_contract_number || drug.kkm_contract_number || drug.contract_number
                          const startDate = drug.cc_contract_start_date || (drug as any).contract_start_date || (drug as any).start_date
                          const endDate = drug.cc_contract_end_date || (drug as any).contract_end_date || (drug as any).end_date
                          const priceVal = drug.price ?? drug.unit_price ?? 0
                          const isSelected = selectedCatalogItemIds.includes(drug.id)

                          return (
                            <div
                              key={drug.id}
                              className={`p-4 transition-all flex items-center justify-between group ${
                                isSelected ? 'bg-blue-50/80' : 'hover:bg-blue-50/40'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 pr-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => handleToggleSelectItem(drug.id, e)}
                                  className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />

                                <div
                                  onClick={() => setSelectedCatalogDrug(drug)}
                                  className="space-y-1 flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                      {code}
                                    </span>
                                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                      {(drug.procurement_vote || 'APPL').toUpperCase()}
                                    </span>
                                    {contractNo && (
                                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                        No. Kontrak: {contractNo}
                                      </span>
                                    )}
                                    {renderContractPeriodBadge(startDate, endDate, drug.cc_contract_status, drug.procurement_vote, contractNo)}
                                  </div>
                                  <div className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                                    {drug.item_name}
                                  </div>
                                  {drug.generic_name && (
                                    <div className="text-xs text-slate-500 italic">{drug.generic_name}</div>
                                  )}
                                  <div className="text-xs text-slate-400">
                                    Bentuk: <span className="font-medium text-slate-600 uppercase">{drug.unit_of_measure || drug.uom || 'PACK'}</span> • Harga: <span className="font-mono font-semibold text-slate-700">RM {priceVal.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => setSelectedCatalogDrug(drug)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-sm flex-shrink-0"
                              >
                                <Plus className="w-4 h-4 mr-1" /> Pilih & Setup
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Item Selected - Configure Stock */
                <div className="space-y-6">
                  <button
                    onClick={() => setSelectedCatalogDrug(null)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali ke Carian Katolog
                  </button>

                  <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100 space-y-2">
                    <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">Item Katolog Dipilih</span>
                    <h3 className="font-bold text-slate-900 text-xl">{selectedCatalogItem.item_name}</h3>
                    {selectedCatalogItem.generic_name && (
                      <p className="text-xs text-slate-500 italic">{selectedCatalogItem.generic_name}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap pt-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white text-blue-700 border border-blue-200">
                        {selectedCatalogItem.item_code || selectedCatalogItem.item_code || selectedCatalogItem.sku || '-'}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 uppercase">
                        {(selectedCatalogItem.procurement_vote || 'APPL').toUpperCase()}
                      </span>
                      {(selectedCatalogItem.cc_contract_number || selectedCatalogItem.kkm_contract_number || selectedCatalogItem.contract_number) && (
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                          No. Kontrak: {selectedCatalogItem.cc_contract_number || selectedCatalogItem.kkm_contract_number || selectedCatalogItem.contract_number}
                        </span>
                      )}
                      {renderContractPeriodBadge(
                        selectedCatalogItem.cc_contract_start_date || (selectedCatalogItem as any).contract_start_date,
                        selectedCatalogItem.cc_contract_end_date || (selectedCatalogItem as any).contract_end_date,
                        selectedCatalogItem.cc_contract_status,
                        selectedCatalogItem.procurement_vote,
                        selectedCatalogItem.cc_contract_number || selectedCatalogItem.kkm_contract_number || selectedCatalogItem.contract_number
                      )}
                      <span className="text-xs text-slate-600 font-mono">
                        Harga: RM {((selectedCatalogItem.price ?? selectedCatalogItem.unit_price ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <h4 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">Konfigurasi Stok Fasiliti</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Stok Awal Fasiliti</label>
                        <input
                          type="number"
                          value={initialStockInput}
                          onChange={e => setInitialStockInput(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-base focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Kuantiti fizikal di stor fasiliti</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Paras Penimbal (Min Buffer)</label>
                        <input
                          type="number"
                          value={minBufferInput}
                          onChange={e => setMinBufferInput(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-base focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Amaran pesanan semula automatik</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setSelectedCatalogDrug(null)
                  setSelectedCatalogDrugIds([])
                }}
              >
                Batal
              </Button>

              {selectedCatalogItem ? (
                <Button
                  size="md"
                  onClick={handleAddItem}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 rounded-xl shadow-md"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah ke Inventori Fasiliti
                </Button>
              ) : selectedCatalogItemIds.length > 0 ? (
                <Button
                  size="md"
                  onClick={handleBatchAddItems}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-xl shadow-md animate-pulse"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah {selectedCatalogItemIds.length} Item ke Inventori
                </Button>
              ) : null}
            </div>
          </div>
        </>
      )}
      {/* Slide-Over Drawer for Item Details & Facility Editing */}
      {editingItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] transition-opacity animate-in fade-in duration-200"
            onClick={() => setEditingItem(null)}
          />

          {/* Slide-Over Container */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-[680px] md:w-[860px] lg:w-[960px] xl:w-[1040px] bg-white shadow-2xl z-[100] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shadow-md">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
                  <span className="font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                    {editingItem.item_code || editingItem.item_code || editingItem.sku || '-'}
                  </span>
                  <span className="text-emerald-400 font-bold">• STOK FASILITI</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">{editingItem.item_name}</h2>
                {editingItem.generic_name && (
                  <p className="text-xs text-slate-300 italic mt-0.5">{editingItem.generic_name}</p>
                )}
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveEditTab('settings')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
                  activeEditTab === 'settings'
                    ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                Tetapan Stok & Fasiliti
              </button>
              <button
                onClick={() => setActiveEditTab('purchasing')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
                  activeEditTab === 'purchasing'
                    ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                Transaksi Pembelian
              </button>
              <button
                onClick={() => setActiveEditTab('receiving')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
                  activeEditTab === 'receiving'
                    ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                Transaksi Penerimaan
              </button>
              <button
                onClick={() => setActiveEditTab('issuing')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
                  activeEditTab === 'issuing'
                    ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                Transaksi Pengeluaran
              </button>
              <button
                onClick={() => setActiveEditTab('qrcode')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x whitespace-nowrap flex items-center gap-1.5 ${
                  activeEditTab === 'qrcode'
                    ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Kod QR & Label
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeEditTab === 'settings' && (
                <>
                  {/* Master Catalog Read-Only Information Card */}
                  <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Maklumat Katolog Utama (Read-Only)
                      </div>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Edit di Katolog Inventori Utama
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Skim Perolehan</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {editingItem.procurement_vote || 'APPL'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Packaging</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {editingItem.unit_of_measure || editingItem.uom || 'PACK'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Harga Unit Kontrak</span>
                        <span className="font-mono font-bold text-slate-800">
                          RM {((editingItem.price ?? editingItem.unit_price ?? 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Section: Editable Stock & Facility Configurations */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-blue-600" />
                      Konfigurasi Stok & Penimbal Fasiliti
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            Stok Fasiliti (Kuantiti Fizikal)
                          </label>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Kemas Kini Automatiks
                          </span>
                        </div>
                        <input
                          type="number"
                          disabled
                          readOnly
                          value={editingItem.facility_stock ?? 0}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-base font-bold text-slate-500 cursor-not-allowed select-none"
                        />
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          Baki fizikal tidak boleh diubah secara manual di sini. Ia hanya dikemaskini melalui pergerakan Penerimaan (GRN) & Pengeluaran Stok.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Paras Penimbal (Min Buffer)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editBufferInput}
                          onChange={e => setEditBufferInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-base text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Paras Stok Minima (Min Level)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editMinLevelInput}
                          onChange={e => setEditMinLevelInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-base text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Paras Stok Maksima (Max Level)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editMaxLevelInput}
                          onChange={e => setEditMaxLevelInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-base text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Section: Classifications & Location */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Klasifikasi & Lokasi Penimpanan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Kategori Bukan Ubat (Therapeutic Class)
                        </label>
                        <select
                          value={editTherapeuticCat}
                          onChange={e => setEditTherapeuticCat(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                          {categoryOptions.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Kategori Preskriber (FUKKM)
                        </label>
                        <select
                          value={editPrescriberCat}
                          onChange={e => setEditPrescriberCat(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                          <option value="A*">A* (Pakar Khusus)</option>
                          <option value="A">A (Pakar)</option>
                          <option value="A/KK">A/KK (Pakar / FMS KK)</option>
                          <option value="B">B (Pegawai Perbukan ubatan)</option>
                          <option value="C">C (Paramedik / MA / Nurse)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Warehouse className="w-3.5 h-3.5 text-indigo-600" />
                            Lokasi Stor, Rak & Level (Physical Location Hierarchy)
                          </span>
                          {isLoadingSubLocations && (
                            <span className="text-[10px] font-normal text-indigo-600 flex items-center gap-1 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> Memuatkan rak/level...
                            </span>
                          )}
                        </label>

                        {/* 3 Cascading Select Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Dropdown 1: Store */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                              1. Pilih Stor / Premis
                            </label>
                            <select
                              value={selectedStoreCode}
                              onChange={e => handleLocationChange(e.target.value, '', '')}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                              <option value="">-- Pilih Stor --</option>
                              {availableStoreLocations.map(loc => (
                                <option key={loc.id} value={loc.location_code}>
                                  [{loc.location_code}] {loc.store_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Dropdown 2: Rack / Cabinet / Pallet */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                              2. Pilih Rak / Kabinet
                            </label>
                            <select
                              value={selectedRackName}
                              onChange={e => handleLocationChange(selectedStoreCode, e.target.value, '')}
                              disabled={!selectedStoreCode || availableRacks.length === 0}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {!selectedStoreCode 
                                  ? '-- Pilih Stor --' 
                                  : availableRacks.length === 0 
                                  ? 'Tiada Rak Didaftarkan' 
                                  : '-- Pilih Rak / Kabinet --'}
                              </option>
                              {availableRacks.map(rack => (
                                <option key={rack.id} value={rack.name}>
                                  {rack.name} ({rack.type.toUpperCase()})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Dropdown 3: Level / Tingkat */}
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                              3. Pilih Level / Tingkat
                            </label>
                            <select
                              value={selectedLevelName}
                              onChange={e => handleLocationChange(selectedStoreCode, selectedRackName, e.target.value)}
                              disabled={!selectedRackName || availableLevels.length === 0}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {!selectedRackName 
                                  ? '-- Pilih Rak --' 
                                  : availableLevels.length === 0 
                                  ? 'Tiada Level Didaftarkan' 
                                  : '-- Pilih Level --'}
                              </option>
                              {availableLevels.map(lvl => (
                                <option key={lvl.id} value={lvl.name}>
                                  {lvl.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Combined Location Result - Read Only */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                            Teks Format Lokasi Penuh:
                          </label>
                          <input
                            type="text"
                            readOnly
                            placeholder="Belum dipilih"
                            value={editLocationInput}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-xs text-slate-700 select-none cursor-not-allowed focus:outline-none transition-all placeholder-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeEditTab === 'purchasing' && (
                <div className="space-y-6">
                  {/* AI Usage Forecasting & Purchasing Estimation Chart */}
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-xl space-y-4 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span>Ramalan Penggunaan & Cadangan Perolehan</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Analisis 6 bulan terdahulu & unjuran keperluan perolehan 3 bulan akan datang.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                          AMC: {amcValue} Unit / Bulan
                        </span>
                      </div>
                    </div>

                    {/* Visual Bar Chart */}
                    <div className="space-y-2 pt-2">
                      <div className="h-44 flex items-end justify-between gap-1.5 px-2 pb-2 border-b border-white/10 relative">
                        {/* Reorder Threshold Line */}
                        <div
                          className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400/80 z-10 flex items-center justify-end pr-2"
                          style={{ bottom: `${(amcValue / maxChartVal) * 100}%` }}
                        >
                          <span className="text-[9px] font-bold bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-400/30">
                            Paras Reorder: {amcValue} unit
                          </span>
                        </div>

                        {usageHistoryData.map((val, idx) => {
                          const isForecast = idx >= 6
                          const pct = Math.min(100, Math.max(12, (val / maxChartVal) * 100))
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative z-20">
                              <span className="text-[10px] font-mono font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                {val}
                              </span>
                              <div
                                style={{ height: `${pct}%` }}
                                className={`w-full rounded-t-lg transition-all duration-300 ${
                                  isForecast
                                    ? 'bg-gradient-to-t from-indigo-600 to-purple-400 border border-purple-300/40 opacity-85'
                                    : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                                }`}
                              />
                            </div>
                          )
                        })}
                      </div>

                      {/* Month Labels & Legend */}
                      <div className="flex items-center justify-between px-1 text-[10px] font-medium text-slate-300">
                        {chartMonths.map((m, i) => (
                          <div key={i} className={`flex-1 text-center truncate ${i >= 6 ? 'text-purple-300 font-bold' : ''}`}>
                            {m.split(' ')[0]}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-6 pt-3 text-[11px] text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-cyan-400" />
                          <span>Penggunaan Sebenar (6 Bulan Lalu)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-purple-400" />
                          <span>Ramalan Keperluan (3 Bulan Datang)</span>
                        </div>
                      </div>
                    </div>

                    {/* Purchasing Estimate Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <span className="text-[11px] text-slate-400 block font-medium">Cadangan Perolehan (Anggaran Unit)</span>
                        <div className="text-xl font-bold font-mono text-emerald-400">
                          {estimatedPurchasingQty} <span className="text-xs text-slate-300 font-normal">Unit</span>
                        </div>
                        <p className="text-[10px] text-slate-400">AMC {amcValue} unit + Paras Penimbal {editingItem.min_buffer_level ?? 20} unit.</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <span className="text-[11px] text-slate-400 block font-medium">Anggaran Kos Perolehan</span>
                        <div className="text-xl font-bold font-mono text-cyan-300">
                          RM {estimatedPurchasingCost.toFixed(2)}
                        </div>
                        <p className="text-[10px] text-slate-400">Harga Unit Kontrak: RM {((editingItem.price ?? editingItem.unit_price ?? 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Real Purchasing / Perolehan Section */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Rekod Pembelian & Perolehan (Purchasing)
                      </h4>
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {realPOs.length} Pesanan Ditemui
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {isTxLoading ? (
                        <div className="py-6 text-center text-slate-400 text-xs">Memuatkan rekod pembelian dari pangkalan data...</div>
                      ) : realPOs.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-400 text-xs font-medium">
                          Tiada rekod pesanan pembelian (PO) ditemui dalam pangkalan data untuk bukan ubat ini.
                        </div>
                      ) : (
                        realPOs.map(po => (
                          <div key={po.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="font-mono font-bold text-blue-700">{po.purchase_order?.po_number || po.po_number || po.id}</div>
                              <div className="text-slate-500 text-[11px]">
                                Tarikh Pesan: {po.created_at ? new Date(po.created_at).toLocaleDateString('ms-MY') : '-'}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-slate-900">{po.quantity} unit</div>
                              <div className="text-[10px] text-emerald-600 font-bold">LULUS</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'receiving' && (
                <div className="space-y-6">
                  {/* 2. Real Receiving / Penerimaan Section */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Rekod Penerimaan Stok (Receiving / GRN)
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Pengesahan Stor
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {isTxLoading ? (
                        <div className="py-6 text-center text-slate-400 text-xs">Memuatkan rekod penerimaan dari pangkalan data...</div>
                      ) : realTransactions.filter(t => t.transaction_type === 'receive' || t.quantity > 0).length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-400 text-xs font-medium">
                          Tiada rekod penerimaan stok (GRN) ditemui dalam pangkalan data untuk bukan ubat ini.
                        </div>
                      ) : (
                        realTransactions
                          .filter(t => t.transaction_type === 'receive' || t.quantity > 0)
                          .map(t => (
                            <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                              <div>
                                <div className="font-mono font-bold text-emerald-700">{t.reference_number || t.transaction_number || `GRN-${t.id.slice(-4)}`}</div>
                                <div className="text-slate-500 text-[11px]">
                                  Tarikh Terima: {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('ms-MY') : '-'}
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <div className="font-bold text-slate-900">+{t.quantity} unit</div>
                                <div className="text-[10px] text-emerald-600 font-semibold">Diterima</div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'qrcode' && (
                <div className="space-y-6">
                  {/* Card Container */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-blue-600" />
                          Label & Kod QR Item Stok (Digital Inventory Tag)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Imbas kod QR ini menggunakan Pengimbas Pergerakan Stok untuk mendaftar transaksi penerimaan atau pengeluaran secara automatik.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">
                        {editingItem.item_code || editingItem.item_code || editingItem.sku || '-'}
                      </span>
                    </div>

                    {/* Professional QR Sticker Label Mockup Preview */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 bg-slate-900 rounded-2xl text-white shadow-xl border border-slate-800">
                      {/* Printable Label Badge */}
                      <div className="w-72 bg-white text-slate-900 rounded-xl p-4 shadow-2xl border-2 border-slate-900 flex flex-col justify-between space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                          <img
                            src="/512px-Jata_MalaysiaV2.svg.png"
                            alt="Jata Negara"
                            className="w-8 h-8 object-contain"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[7px] font-bold text-slate-500 uppercase tracking-tight leading-none">
                              Kementerian Kesihatan Malaysia
                            </div>
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-wide leading-tight">
                              Hospital Lawas
                            </div>
                          </div>
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono uppercase flex-shrink-0">
                            {(editingItem.procurement_vote || 'APPL').toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {qrCodeUrl ? (
                            <img src={qrCodeUrl} alt="QR Code Label" className="w-24 h-24 object-contain border border-slate-100 rounded-lg p-1 bg-white flex-shrink-0" />
                          ) : (
                            <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                          )}

                          <div className="space-y-1 overflow-hidden">
                            <div className="font-mono text-xs font-bold text-blue-600 truncate">
                              [ {editingItem.item_code || editingItem.item_code || editingItem.sku || '-'} ]
                            </div>
                            <div className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                              {editingItem.item_name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Packaging: <span className="font-semibold text-slate-700 uppercase">{editingItem.unit_of_measure || editingItem.uom || 'PACK'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              Lokasi: <span className="font-semibold text-slate-700">{editLocationInput || editingItem.location || 'Belum Diset'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-1.5 text-center text-[8px] font-semibold text-slate-400 tracking-wider">
                          STOK INVENTORI FASILITI • H.O.M.E. ECOSYSTEM
                        </div>
                      </div>

                      {/* Quick Action Control Panel */}
                      <div className="space-y-4 max-w-xs text-center md:text-left">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Status Kod QR</span>
                          <p className="text-xs text-slate-300">
                            Kod QR dijana daripada pangkalan data secara rasmi dengan maklumat kod item, skim perolehan, dan lokasi stor.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <Button
                            onClick={handlePrintQrLabel}
                            disabled={!qrCodeUrl}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            Cetak Label QR (Sticker)
                          </Button>

                          {qrCodeUrl && (
                            <a
                              href={qrCodeUrl}
                              download={`QR-${editingItem.item_code || editingItem.id}.png`}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all border border-white/10"
                            >
                              <Download className="w-4 h-4 text-emerald-400" />
                              Muat Turun Gambar PNG
                            </a>
                          )}

                          <button
                            onClick={handleCopyPayload}
                            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 pt-1 transition-colors"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Teks Payload Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Teks Payload QR</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-xl shadow-md"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FacilityNonDrugInventoryPage
