import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Plus,
    Search,
    Trash2,
    Pill,
    Box,
    TrendingUp,
    LayoutGrid,
    Edit2,
    Check,
    X,
    Filter,
    Printer,
} from 'lucide-react'
import {
    Button,
    Input,
    Badge,
    Table,
    Modal,
    Spinner,
    LoadingOverlay,
    Pagination,
} from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import {
    getUnitCatalog,
} from '@/services/pharmacy/unitCatalogService'
import { getDrugCategories } from '@/services/pharmacy/inventoryService'
import {
    getCatalogItems,
    addCatalogItems,
    deleteCatalogItem,
    toggleCatalogItem,
    updateCatalogItem,
    getCatalogItemCounts,
} from '@/services/pharmacy/unitCatalogItemService'
import { getDrugCatalog, updateDrug } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog, updateNonDrug } from '@/services/pharmacy/nonDrugCatalogService'
import { getContracts } from '@/services/pharmacy/contractCatalogService'
import { getContractNonDrugs } from '@/services/pharmacy/contractNonDrugCatalogService'
import { getApplDrugCatalog } from '@/services/pharmacy/applDrugCatalogService'
import { getApplNonDrugCatalog } from '@/services/pharmacy/applNonDrugCatalogService'
import { getLpDrugCatalog } from '@/services/pharmacy/lpDrugCatalogService'
import { getLpNonDrugCatalog } from '@/services/pharmacy/lpNonDrugCatalogService'
import type {
    UnitCatalogItemWithRelations,
    UnitCatalogItemFormData,
    CatalogItemType,
    DrugWithRelations,
    NonDrugWithRelations,
    UnitCatalogWithItemCounts,
    ContractWithRelations,
    DrugCategory,
} from '@/types/pharmacy'
import { UnitCatalogPrintTemplate } from '@/components/pharmacy/maintenance/UnitCatalogPrintTemplate'
import { ROUTES } from '@/lib/constants'

// LOCAL INTERFACE FOR FLAT LIST ARCHITECTURE
interface AvailableItem {
    unique_id: string
    id: string
    source: 'master' | 'contract' | 'appl' | 'lp'
    item_type: 'drug' | 'non_drug'
    item_code: string
    item_name: string
    unit_of_measure: string
    price?: number
    packaging: string
    sku?: string
    pku?: string
    contract_number?: string
    supplier_name?: string
    already_in_catalog: boolean
    original_item: any
}

interface UnitCatalogItemEditForm extends Partial<UnitCatalogItemFormData> {
    id?: string
    unit_id?: string
    procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp' | null
    category_id?: string
    therapeutic_class_id?: string
}

// =====================================================
// MANAGE UNIT CATALOG ITEMS PAGE
// =====================================================

const ManageUnitCatalogItemsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { success: showSuccess, error: showError } = useToastStore()

    const [catalog, setCatalog] = useState<UnitCatalogWithItemCounts | null>(null)
    const [activeTab, setActiveTab] = useState<CatalogItemType>('drug')
    const [items, setItems] = useState<UnitCatalogItemWithRelations[]>([])

    // Print State
    const [isPrinting, setIsPrinting] = useState(false)
    const [printItems, setPrintItems] = useState<UnitCatalogItemWithRelations[]>([])
    const printRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Category State
    const [categories, setCategories] = useState<DrugCategory[]>([])
    const [categoryFilter, setCategoryFilter] = useState<string>('')
    const [therapeuticClassFilter, setTherapeuticClassFilter] = useState<string>('')

    // Add Items Modal State
    // Add Items Modal State
    const [showAddModal, setShowAddModal] = useState(false)
    const [availableItems, setAvailableItems] = useState<AvailableItem[]>([])
    const [selectedItems, setSelectedItems] = useState<Map<string, AvailableItem>>(new Map())
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [defaultMinLimit, setDefaultMinLimit] = useState(1)
    const [defaultMaxLimit, setDefaultMaxLimit] = useState<number | null>(null)
    const [defaultBufferLevel, setDefaultBufferLevel] = useState(1)
    const [defaultActive, setDefaultActive] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [totalPages, setTotalPages] = useState(1)
    const [totalAvailableItems, setTotalAvailableItems] = useState(0)
    const [sourceFilter, setSourceFilter] = useState<'all' | 'master' | 'contract' | 'appl' | 'lp'>('all')

    // Inline Editing State
    const [editForm, setEditForm] = useState<UnitCatalogItemEditForm | null>(null)
    const [selectedItemForEdit, setSelectedItemForEdit] = useState<UnitCatalogItemWithRelations | null>(null) // New state for modal

    // Main List Pagination State
    const [mainCurrentPage, setMainCurrentPage] = useState(1)
    const [mainPageSize, setMainPageSize] = useState(20)
    const [mainTotalPages, setMainTotalPages] = useState(1)
    const [mainTotalItems, setMainTotalItems] = useState(0)

    useEffect(() => {
        const fetchCategories = async () => {
            if (!catalog?.hospital_id) return
            const { data } = await getDrugCategories(catalog.hospital_id)
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [catalog?.hospital_id])

    useEffect(() => {
        if (id) {
            setMainCurrentPage(1) // Reset page when tab changes
            loadCatalogAndItems()
        }
    }, [id, activeTab, categoryFilter, therapeuticClassFilter])

    useEffect(() => {
        if (id) {
            loadItemsOnly()
        }
    }, [mainCurrentPage, mainPageSize])

    // Load available items when Add Modal opens or modalTab/pagination changes
    useEffect(() => {
        if (showAddModal && catalog?.hospital_id) {
            const timeoutId = setTimeout(() => {
                loadAvailableItems()
            }, searchQuery ? 500 : 0) // Debounce search by 500ms

            return () => clearTimeout(timeoutId)
        }
    }, [showAddModal, catalog?.hospital_id, activeTab, searchQuery, currentPage, pageSize, sourceFilter])
    // Reset page when search query changes
    useEffect(() => {
        if (showAddModal) {
            setCurrentPage(1)
        }
    }, [searchQuery, sourceFilter])

    const loadCatalogAndItems = async () => {
        if (!id) return
        setIsLoading(true)
        try {
            // 1. Fetch catalog details
            const catalogResult = await getUnitCatalog(id)
            if (catalogResult.error || !catalogResult.data) {
                showError('Error', catalogResult.error || 'Failed to fetch unit catalog')
                navigate(ROUTES.PHARMACY_UNIT_CATALOG)
                return
            }

            // 2. Fetch item counts for badge
            const countsResult = await getCatalogItemCounts(id)
            const counts = countsResult.data || {
                drug_items_count: 0,
                non_drug_items_count: 0,
                active_drug_items_count: 0,
                active_non_drug_items_count: 0,
            }

            setCatalog({
                ...catalogResult.data,
                ...counts,
            })

            // 3. Fetch items for current tab
            const itemsResult = await getCatalogItems(id, activeTab, mainCurrentPage, mainPageSize, categoryFilter || undefined, therapeuticClassFilter || undefined)
            if (itemsResult.data?.data) {
                const sortedItems = [...itemsResult.data.data].sort((a, b) => {
                    const nameA = activeTab === 'drug' ? (a.drug?.drug_name || '') : (a.non_drug?.item_name || '')
                    const nameB = activeTab === 'drug' ? (b.drug?.drug_name || '') : (b.non_drug?.item_name || '')
                    return nameA.localeCompare(nameB)
                })
                setItems(sortedItems)
                setMainTotalPages(itemsResult.data.totalPages || 1)
                setMainTotalItems(itemsResult.data.total || 0)
            }
        } catch (error) {
            showError('Error', 'An unexpected error occurred')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadItemsOnly = async () => {
        if (!id) return
        setIsLoading(true)
        try {
            const itemsResult = await getCatalogItems(id, activeTab, mainCurrentPage, mainPageSize, categoryFilter || undefined, therapeuticClassFilter || undefined)
            if (itemsResult.data?.data) {
                const sortedItems = [...itemsResult.data.data].sort((a, b) => {
                    const nameA = activeTab === 'drug' ? (a.drug?.drug_name || '') : (a.non_drug?.item_name || '')
                    const nameB = activeTab === 'drug' ? (b.drug?.drug_name || '') : (b.non_drug?.item_name || '')
                    return nameA.localeCompare(nameB)
                })
                setItems(sortedItems)
                setMainTotalPages(itemsResult.data.totalPages || 1)
                setMainTotalItems(itemsResult.data.total || 0)
            }

            // Update counts too
            const countsResult = await getCatalogItemCounts(id)
            if (countsResult.data && catalog) {
                setCatalog({
                    ...catalog,
                    ...countsResult.data
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleActive = async (item: UnitCatalogItemWithRelations) => {
        if (!user?.id || !id || !catalog) return
        setIsSaving(true)
        try {
            const result = await toggleCatalogItem(
                item.id,
                id,
                catalog.hospital_id,
                user.id,
                !item.is_active
            )
            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', 'Item status updated')
                await loadItemsOnly()
            }
        } catch (error) {
            showError('Error', 'Failed to update item')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (item: UnitCatalogItemWithRelations) => {
        if (!user?.id || !id || !catalog) return
        const itemName = activeTab === 'drug'
            ? item.drug?.drug_name || 'this item'
            : item.non_drug?.item_name || 'this item'

        if (!confirm(`Are you sure you want to remove ${itemName} from this catalog?`)) {
            return
        }

        setIsSaving(true)
        try {
            const result = await deleteCatalogItem(item.id, id, catalog.hospital_id, user.id)
            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', 'Item removed from catalog')
                await loadItemsOnly()
            }
        } catch (error) {
            showError('Error', 'Failed to remove item')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const loadAvailableItems = async () => {
        if (!catalog?.hospital_id) return
        setIsLoadingAvailable(true)
        try {
            let masterItems: (DrugWithRelations | NonDrugWithRelations)[] = []
            let contracts: ContractWithRelations[] = []
            let applItems: any[] = []
            let lpItems: any[] = []

            const hospitalId = catalog.hospital_id
            const searchParams = { search: searchQuery.trim() || undefined }

            // 1. Fetch from all sources in parallel
            const [masterResult, contractResult, applResult, lpResult] = await Promise.all([
                activeTab === 'drug'
                    ? getDrugCatalog(hospitalId, searchParams, 1, 500)
                    : getNonDrugCatalog(hospitalId, searchParams, 1, 500),
                activeTab === 'drug'
                    ? getContracts(hospitalId, searchParams)
                    : getContractNonDrugs(hospitalId, searchParams),
                activeTab === 'drug'
                    ? getApplDrugCatalog(hospitalId, searchParams, 1, 500)
                    : getApplNonDrugCatalog(hospitalId, searchParams, 1, 500),
                activeTab === 'drug'
                    ? getLpDrugCatalog(hospitalId, searchParams, 1, 500)
                    : getLpNonDrugCatalog(hospitalId, searchParams, 1, 500)
            ])

            if (masterResult.data?.data) masterItems = masterResult.data.data
            if (contractResult.data) contracts = contractResult.data
            if (applResult.data?.data) applItems = applResult.data.data
            if (lpResult.data?.data) lpItems = lpResult.data.data

            // 2. Flatten and Map
            const allItems: AvailableItem[] = []

            // A. Master Items
            masterItems.forEach(item => {
                const isAlreadyAdded = activeTab === 'drug'
                    ? items.some(i => i.drug_id === item.id && !i.contract_id && !i.appl_drug_id && !i.lp_drug_id)
                    : items.some(i => i.non_drug_id === item.id && !i.contract_id && !i.appl_non_drug_id && !i.lp_non_drug_id)

                const name = 'drug_name' in item ? item.drug_name : item.item_name
                const code = 'drug_code' in item ? item.drug_code : item.item_code

                allItems.push({
                    unique_id: `master_${item.id}`,
                    id: item.id,
                    source: 'master',
                    item_type: activeTab,
                    item_code: code,
                    item_name: name,
                    unit_of_measure: item.unit_of_measure,
                    price: item.price,
                    packaging: item.packaging_description || '—',
                    sku: item.sku,
                    pku: item.pku,
                    already_in_catalog: isAlreadyAdded,
                    original_item: item
                })
            })

            // B. Contracts
            contracts.forEach(c => {
                const isAlreadyAdded = items.some(i => i.contract_id === c.id)
                allItems.push({
                    unique_id: `contract_${c.id}`,
                    id: c.id,
                    source: 'contract',
                    item_type: activeTab,
                    item_code: c.item_code || c.contract_number || '',
                    item_name: c.item_name,
                    unit_of_measure: c.unit || '',
                    price: typeof c.unit_price === 'string' ? parseFloat(c.unit_price) : c.unit_price,
                    packaging: c.packaging_description || '—',
                    contract_number: c.contract_number,
                    supplier_name: c.supplier_name,
                    already_in_catalog: isAlreadyAdded,
                    original_item: c
                })
            })

            // C. APPL
            applItems.forEach(a => {
                const isAlreadyAdded = items.some(i => i.appl_drug_id === a.id || i.appl_non_drug_id === a.id)
                allItems.push({
                    unique_id: `appl_${a.id}`,
                    id: a.id,
                    source: 'appl',
                    item_type: activeTab,
                    item_code: a.item_code,
                    item_name: a.item_name,
                    unit_of_measure: a.unit_of_measure,
                    price: a.price,
                    packaging: a.packaging_description || '—',
                    already_in_catalog: isAlreadyAdded,
                    original_item: a
                })
            })

            // D. LP
            lpItems.forEach(l => {
                const isAlreadyAdded = items.some(i => i.lp_drug_id === l.id || i.lp_non_drug_id === l.id)
                allItems.push({
                    unique_id: `lp_${l.id}`,
                    id: l.id,
                    source: 'lp',
                    item_type: activeTab,
                    item_code: l.item_code,
                    item_name: l.item_name,
                    unit_of_measure: l.unit_of_measure,
                    price: l.price,
                    packaging: l.packaging_description || '—',
                    already_in_catalog: isAlreadyAdded,
                    original_item: l
                })
            })

            // 3. Filter by Source
            const filteredBySource = sourceFilter === 'all'
                ? allItems
                : allItems.filter(item => item.source === sourceFilter)

            // 4. Global Sort
            const sortedAll = filteredBySource.sort((a, b) => a.item_name.localeCompare(b.item_name));

            // 5. Client-side Pagination
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedItems = sortedAll.slice(startIndex, startIndex + pageSize);

            setAvailableItems(paginatedItems)
            setTotalPages(Math.ceil(sortedAll.length / pageSize))
            setTotalAvailableItems(sortedAll.length)

        } catch (error) {
            showError('Error', 'Failed to load available items')
            console.error(error)
        } finally {
            setIsLoadingAvailable(false)
        }
    }

    const handleSelectAll = () => {
        // Filter out already added items
        const selectableItems = availableItems.filter(item => !item.already_in_catalog)

        const areAllSelected = selectableItems.length > 0 && selectableItems.every(item => selectedItems.has(item.unique_id))

        if (areAllSelected) {
            // Deselect all on current page
            setSelectedItems(prev => {
                const next = new Map(prev)
                selectableItems.forEach(item => next.delete(item.unique_id))
                return next
            })
        } else {
            // Select all on current page
            setSelectedItems(prev => {
                const next = new Map(prev)
                selectableItems.forEach(item => next.set(item.unique_id, item))
                return next
            })
        }
    }

    const handleToggleSelect = (item: AvailableItem) => {
        if (item.already_in_catalog) return

        setSelectedItems(prev => {
            const next = new Map(prev)
            if (next.has(item.unique_id)) {
                next.delete(item.unique_id)
            } else {
                next.set(item.unique_id, item)
            }
            return next
        })
    }

    const handleAddItems = async () => {
        if (!catalog || !user) return

        setIsSaving(true)
        try {
            const itemsToAdd: UnitCatalogItemFormData[] = []

            // Use items from the Map directly
            for (const item of selectedItems.values()) {
                const newItem: UnitCatalogItemFormData = {
                    item_type: activeTab,
                    is_active: defaultActive,
                    min_limit: defaultMinLimit,
                    max_limit: defaultMaxLimit,
                    reorder_level: defaultBufferLevel,
                    procurement_vote: null,
                    item_name: item.item_name
                }

                if (item.source === 'master') {
                    if (activeTab === 'drug') newItem.drug_id = item.id
                    else newItem.non_drug_id = item.id
                } else if (item.source === 'contract') {
                    newItem.contract_id = item.id
                    newItem.contract_number = item.contract_number
                    newItem.procurement_vote = 'cc'
                } else if (item.source === 'appl') {
                    if (activeTab === 'drug') newItem.appl_drug_id = item.id
                    else newItem.appl_non_drug_id = item.id
                    newItem.procurement_vote = 'appl'
                } else if (item.source === 'lp') {
                    if (activeTab === 'drug') newItem.lp_drug_id = item.id
                    else newItem.lp_non_drug_id = item.id
                    newItem.procurement_vote = 'lp'
                }

                itemsToAdd.push(newItem)
            }

            if (itemsToAdd.length === 0) {
                showError('Error', 'No items selected to add')
                return
            }

            const result = await addCatalogItems(catalog.id, catalog.hospital_id, user.id, itemsToAdd)
            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', `Added ${itemsToAdd.length} items to catalog`)
                setShowAddModal(false)
                setSelectedItems(new Map())
                await loadItemsOnly()
            }
        } catch (e) {
            console.error(e)
            showError('Error', 'Failed to add items')
        } finally {
            setIsSaving(false)
        }
    }

    const handleStartEdit = (item: UnitCatalogItemWithRelations) => {
        const itemAny = item as any
        const drugData = item.drug as any

        // Use unit catalog's category if exists, otherwise use drug's category  
        const categoryId = itemAny.category_id || drugData?.category?.id || ''
        const therapeuticId = itemAny.therapeutic_class_id || drugData?.therapeutic_class?.id || ''
        const procurementVote = itemAny.procurement_vote || drugData?.procurement_vote || null

        setSelectedItemForEdit(item)
        setEditForm({
            id: item.id,
            unit_id: itemAny.unit_id,
            category_id: categoryId,
            therapeutic_class_id: therapeuticId,
            min_limit: item.min_limit,
            max_limit: item.max_limit,
            reorder_level: item.reorder_level,
            is_active: item.is_active,
            procurement_vote: procurementVote as any
        })
    }

    const handleCancelEdit = () => {
        setSelectedItemForEdit(null)
        setEditForm(null)
    }

    const handleSaveEdit = async () => {
        if (!selectedItemForEdit || !editForm || !catalog) return

        setIsSaving(true)
        try {
            const updatePayload = {
                min_limit: editForm.min_limit,
                max_limit: editForm.max_limit,
                reorder_level: editForm.reorder_level,
                is_active: editForm.is_active,
                category_id: editForm.category_id,
                therapeutic_class_id: editForm.therapeutic_class_id,
                procurement_vote: editForm.procurement_vote,
            }

            const result = await updateCatalogItem(
                selectedItemForEdit.id,
                catalog.id,
                catalog.hospital_id,
                user!.id,
                updatePayload
            )



            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', 'Item details updated')
                handleCancelEdit()
                await loadItemsOnly()
            }
        } catch (error) {
            showError('Error', 'Failed to update item')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const itemColumns = [
        {
            key: 'code',
            label: 'Code',
            className: '!px-2 w-[100px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                const itemCode = activeTab === 'drug'
                    ? (item.drug?.drug_code || item.appl_drug?.item_code || item.lp_drug?.item_code)
                    : (item.non_drug?.item_code || item.appl_non_drug?.item_code || item.lp_non_drug?.item_code);
                const contractNumber = item.contract_number;

                return (
                    <div className="flex flex-col">
                        <span className="font-mono text-sm font-semibold text-slate-700">
                            {itemCode}
                        </span>
                        {contractNumber && (
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 w-fit mt-1">
                                {contractNumber}
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'name',
            label: 'Name',
            className: '!px-2 max-w-[250px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => (
                <div
                    className="flex flex-col cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded-md transition-colors group"
                    onClick={() => handleStartEdit(item)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-violet-700 transition-colors"
                            title={activeTab === 'drug'
                                ? (item.drug?.drug_name || item.appl_drug?.item_name || item.lp_drug?.item_name)
                                : (item.non_drug?.item_name || item.appl_non_drug?.item_name || item.lp_non_drug?.item_name)}>
                            {activeTab === 'drug'
                                ? (item.drug?.drug_name || item.appl_drug?.item_name || item.lp_drug?.item_name)
                                : (item.non_drug?.item_name || item.appl_non_drug?.item_name || item.lp_non_drug?.item_name)}
                        </span>
                        <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {activeTab === 'drug' && item.drug?.generic_name && (
                        <span className="text-xs text-slate-500 italic line-clamp-1" title={item.drug.generic_name}>{item.drug.generic_name}</span>
                    )}
                </div>
            ),
        },
        // Category Column
        {
            key: 'category',
            label: 'Category',
            className: '!px-2 w-[110px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                // Only applicable for drugs
                if (activeTab !== 'drug') {
                    return <span className="text-xs text-slate-300">—</span>
                }

                const categoryName = (item.drug as any)?.category?.category_name

                if (!categoryName) {
                    return <span className="text-xs text-slate-300 italic">—</span>
                }

                return (
                    <Badge
                        variant="gray"
                        className="bg-indigo-50 text-indigo-700 border-indigo-100 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
                    >
                        {categoryName}
                    </Badge>
                )
            }
        },
        // Therapeutic Class Column
        {
            key: 'therapeutic_class',
            label: 'Therapeutic',
            className: '!px-2 w-[110px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                // Only applicable for drugs
                if (activeTab !== 'drug') {
                    return <span className="text-xs text-slate-300">—</span>
                }

                const therapeuticClassName = (item.drug as any)?.therapeutic_class?.category_name

                if (!therapeuticClassName) {
                    return <span className="text-xs text-slate-300 italic">—</span>
                }

                return (
                    <Badge
                        variant="gray"
                        className="bg-teal-50 text-teal-700 border-teal-100 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
                    >
                        {therapeuticClassName}
                    </Badge>
                )
            }
        },
        {
            key: 'source',
            label: 'Src',
            className: '!px-2 w-[60px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                const vote = item.procurement_vote || (activeTab === 'drug' ? item.drug?.procurement_vote : item.non_drug?.procurement_vote)

                if (vote === 'appl') {
                    return (
                        <Badge
                            variant="primary"
                            className="bg-violet-50 text-violet-700 border-violet-100 px-2 py-0.5 rounded-md text-xs font-bold"
                        >
                            APPL
                        </Badge>
                    )
                }
                if (vote === 'cc') {
                    return (
                        <Badge
                            variant="primary"
                            className="bg-amber-50 text-amber-700 border-amber-100 px-2 py-0.5 rounded-md text-xs font-bold"
                        >
                            Contract
                        </Badge>
                    )
                }
                if (vote === 'lp') {
                    return (
                        <Badge
                            variant="primary"
                            className="bg-blue-50 text-blue-700 border-blue-100 px-2 py-0.5 rounded-md text-xs font-bold"
                        >
                            LP
                        </Badge>
                    )
                }
                if (vote === 'dp') {
                    return (
                        <Badge
                            variant="primary"
                            className="bg-emerald-50 text-emerald-700 border-emerald-100 px-2 py-0.5 rounded-md text-xs font-bold"
                        >
                            DP
                        </Badge>
                    )
                }
                return (
                    <span className="text-xs text-slate-400 font-medium opacity-50 px-2">
                        {vote || '-'}
                    </span>
                )
            },
        },
        {
            key: 'packaging',
            label: 'Pack',
            className: '!px-2 w-[100px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => (
                <span className="text-xs text-slate-600">
                    {(activeTab === 'drug'
                        ? (item.drug?.packaging_description || item.appl_drug?.packaging_description || item.lp_drug?.packaging_description)
                        : (item.non_drug?.packaging_description || item.appl_non_drug?.packaging_description || item.lp_non_drug?.packaging_description)
                    ) || '—'}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            className: '!px-2 w-[90px]',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                const isActive = item.is_active

                return (
                    <button
                        onClick={() => handleToggleActive(item)}
                        disabled={isSaving}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                    </button>
                )
            },
        },
    ]

    if (isLoading && !catalog) {
        return <LoadingOverlay message="Loading unit catalog..." />
    }

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(ROUTES.PHARMACY_UNIT_CATALOG)}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {catalog?.department?.department_name || 'Unit Catalog'}
                        </h1>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                            <Badge variant="gray" className="rounded-md">
                                {catalog?.department?.department_code || '—'}
                            </Badge>
                            • Manage items available for this unit to indent
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (!id) return
                            setIsPrinting(true)
                            try {
                                // Fetch all items for printing (using large page size)
                                const result = await getCatalogItems(
                                    id,
                                    activeTab,
                                    1,
                                    10000,
                                    categoryFilter || undefined,
                                    therapeuticClassFilter || undefined
                                )

                                if (result.data?.data) {
                                    // Sort same as view
                                    const sortedItems = [...result.data.data].sort((a, b) => {
                                        const nameA = activeTab === 'drug' ? (a.drug?.drug_name || '') : (a.non_drug?.item_name || '')
                                        const nameB = activeTab === 'drug' ? (b.drug?.drug_name || '') : (b.non_drug?.item_name || '')
                                        return nameA.localeCompare(nameB)
                                    })
                                    setPrintItems(sortedItems)

                                    // Allow time for render
                                    setTimeout(() => {
                                        window.print()
                                        setIsPrinting(false)
                                    }, 500)
                                }
                            } catch (error) {
                                console.error(error)
                                showError('Error', 'Failed to prepare print document')
                                setIsPrinting(false)
                            }
                        }}
                        disabled={isPrinting || isLoading}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        {isPrinting ? (
                            <Spinner size="sm" className="mr-2" />
                        ) : (
                            <Printer className="w-4 h-4 mr-2" />
                        )}
                        Print Catalog
                    </Button>
                    {/* Category Filter */}
                    {activeTab === 'drug' && categories.length > 0 && (
                        <>
                            <div className="relative">
                                <Filter className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value)
                                        setMainCurrentPage(1)
                                    }}
                                    className="h-9 pl-9 pr-8 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-lg shadow-sm focus:ring-violet-500 focus:border-violet-500 appearance-none min-w-[140px] cursor-pointer hover:bg-slate-50"
                                >
                                    <option value="">All FUKKM</option>
                                    <option disabled>─────</option>
                                    {categories
                                        .filter(c => {
                                            const code = c.category_code || '';
                                            return code.length > 0 &&
                                                code.length <= 6 &&
                                                !code.startsWith('TC_') &&
                                                !['ART', 'CNS'].includes(code);
                                        })
                                        .filter((c, index, self) =>
                                            index === self.findIndex(t => t.category_name === c.category_name)
                                        )
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                        ))}
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none">
                                    <div className="border-t-[4px] border-t-slate-500 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent" />
                                </div>
                            </div>

                            <div className="relative">
                                <Filter className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                                <select
                                    value={therapeuticClassFilter}
                                    onChange={(e) => {
                                        setTherapeuticClassFilter(e.target.value)
                                        setMainCurrentPage(1)
                                    }}
                                    className="h-9 pl-9 pr-8 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-lg shadow-sm focus:ring-violet-500 focus:border-violet-500 appearance-none min-w-[180px] cursor-pointer hover:bg-slate-50"
                                >
                                    <option value="">All Therapeutic</option>
                                    <option disabled>─────</option>
                                    {categories
                                        .filter(c => {
                                            const code = c.category_code || '';
                                            const isSpecial = ['ART', 'CNS'].includes(code);
                                            const isLong = code.length > 6;
                                            const isTC = code.startsWith('TC_');
                                            return (isSpecial || isLong || isTC);
                                        })
                                        .filter((c, index, self) =>
                                            index === self.findIndex(t => t.category_name === c.category_name)
                                        )
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                        ))}
                                </select>
                                <div className="absolute right-3 top-3 pointer-events-none">
                                    <div className="border-t-[4px] border-t-slate-500 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent" />
                                </div>
                            </div>
                        </>
                    )}
                    <Button
                        onClick={() => {
                            setShowAddModal(true)
                            setSelectedItems(new Map())
                            setSearchQuery('')
                            setCurrentPage(1)
                        }}
                        disabled={isLoading}
                        className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-100"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Items to Unit
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Pill className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drug Items</p>
                            <p className="text-xl font-black text-slate-900">{catalog?.drug_items_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Box className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Non-Drug Items</p>
                            <p className="text-xl font-black text-slate-900">{catalog?.non_drug_items_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Items</p>
                            <p className="text-xl font-black text-slate-900">{(catalog?.active_drug_items_count || 0) + (catalog?.active_non_drug_items_count || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
                            <p className="text-xl font-black text-slate-900">{(catalog?.drug_items_count || 0) + (catalog?.non_drug_items_count || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('drug')}
                        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'drug'
                            ? 'border-violet-600 text-violet-600 bg-white'
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                            }`}
                    >
                        <Pill className="w-4 h-4" />
                        Drug Items
                        <Badge variant={activeTab === 'drug' ? 'primary' : 'gray'} className="ml-1 px-1.5 font-black">
                            {catalog?.drug_items_count || 0}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('non_drug')}
                        className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'non_drug'
                            ? 'border-violet-600 text-violet-600 bg-white'
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                            }`}
                    >
                        <Box className="w-4 h-4" />
                        Non-Drug Items
                        <Badge variant={activeTab === 'non_drug' ? 'primary' : 'gray'} className="ml-1 px-1.5 font-black">
                            {catalog?.non_drug_items_count || 0}
                        </Badge>
                    </button>
                </div>

                <div className="p-0 flex-1 relative flex flex-col min-h-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1">
                            <Spinner size="lg" />
                            <p className="text-sm text-slate-500 font-medium">Loading catalog items...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-auto">
                                <Table
                                    columns={itemColumns.filter(col => {
                                        if (activeTab === 'non_drug' && (col.key === 'category' || col.key === 'therapeutic_class')) {
                                            return false
                                        }
                                        return true
                                    })}
                                    data={items}
                                    emptyMessage={`No ${activeTab === 'drug' ? 'drug' : 'non-drug'} items found in this unit catalog.`}
                                />
                            </div>
                            {items.length > 0 && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                                    <Pagination
                                        currentPage={mainCurrentPage}
                                        totalPages={mainTotalPages}
                                        total={mainTotalItems}
                                        pageSize={mainPageSize}
                                        onPageChange={setMainCurrentPage}
                                        onPageSizeChange={setMainPageSize}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add Items Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false)
                    setSelectedItems(new Map())
                    setSearchQuery('')
                    setCurrentPage(1)
                }}
                title={`Add ${activeTab === 'drug' ? 'Drug' : 'Non-Drug'} Items`}
                size="6xl"
            >
                <div className="flex gap-4 h-[75vh] min-h-[500px]">
                    {/* Left Column: Search & Table */}
                    <div className="flex-1 flex flex-col min-w-0 space-y-4">
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <div className="grid grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Min</label>
                                    <Input
                                        type="number"
                                        value={defaultMinLimit.toString()}
                                        onChange={(e) => setDefaultMinLimit(parseInt(e.target.value) || 1)}
                                        min="0"
                                        className="h-9 bg-white text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Max</label>
                                    <Input
                                        type="number"
                                        value={defaultMaxLimit?.toString() || ''}
                                        onChange={(e) => setDefaultMaxLimit(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Unlimited"
                                        min="0"
                                        className="h-9 bg-white text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Buffer</label>
                                    <Input
                                        type="number"
                                        value={defaultBufferLevel.toString()}
                                        onChange={(e) => setDefaultBufferLevel(parseInt(e.target.value) || 1)}
                                        min="0"
                                        className="h-9 bg-white text-blue-600 font-bold border-blue-100 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Source</label>
                                    <select
                                        value={sourceFilter}
                                        onChange={(e) => setSourceFilter(e.target.value as any)}
                                        className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-violet-500 focus:border-violet-500"
                                    >
                                        <option value="all">ANY SOURCE</option>
                                        <option value="master">MASTER ONLY</option>
                                        <option value="contract">CONTRACT ONLY</option>
                                        <option value="appl">APPL ONLY</option>
                                        <option value="lp">LP ONLY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Status</label>
                                    <button
                                        onClick={() => setDefaultActive(!defaultActive)}
                                        className={`w-full flex items-center justify-center gap-2 h-9 px-2 rounded-lg text-xs font-bold transition-all border ${defaultActive
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${defaultActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {defaultActive ? 'Act' : 'Inact'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col bg-white">
                            <div className="flex px-4 py-3 border-b border-slate-200">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder={`Search by code, name, or contract number...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>

                            {isLoadingAvailable ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                                    <Spinner size="md" />
                                    <p className="text-xs text-slate-500 font-medium">Scanning catalog...</p>
                                </div>
                            ) : (
                                <>
                                    {availableItems.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-3 text-center px-6">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <Search className="w-8 h-8 opacity-20" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-600">No items found matching "{searchQuery}"</p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Ensure the item exists in the master catalog or contracts.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-auto flex-1">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 w-10">
                                                            <input
                                                                type="checkbox"
                                                                checked={availableItems.length > 0 && availableItems.filter(i => !i.already_in_catalog).every(i => selectedItems.has(i.unique_id))}
                                                                onChange={handleSelectAll}
                                                                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                            />
                                                        </th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase w-[120px]">Code</th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Item Details</th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase w-[100px]">Source</th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase w-[150px]">Packaging</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {availableItems.map((item: AvailableItem) => {
                                                        const isSelected = selectedItems.has(item.unique_id)

                                                        // Source Badge Color
                                                        const getSourceBadge = (source: string) => {
                                                            switch (source) {
                                                                case 'master': return <Badge variant="gray">MASTER</Badge>
                                                                case 'contract': return <Badge variant="info">CONTRACT</Badge>
                                                                case 'appl': return <Badge variant="success">APPL</Badge>
                                                                case 'lp': return <Badge variant="primary">LP</Badge>
                                                                default: return <Badge variant="gray">{source}</Badge>
                                                            }
                                                        }

                                                        return (
                                                            <tr
                                                                key={item.unique_id}
                                                                className={`
                                                                            hover:bg-slate-50 transition-colors
                                                                            ${item.already_in_catalog ? 'opacity-50 bg-slate-50' : ''}
                                                                            ${isSelected ? 'bg-violet-50 hover:bg-violet-50' : ''}
                                                                        `}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => handleToggleSelect(item)}
                                                                        disabled={item.already_in_catalog}
                                                                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 disabled:opacity-50"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-xs font-black text-slate-700">{item.item_code}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2" title={item.item_name}>
                                                                            {item.item_name}
                                                                        </span>
                                                                        {item.contract_number && (
                                                                            <span className="text-[10px] text-slate-500 font-medium truncate" title={item.supplier_name}>
                                                                                {item.contract_number} • {item.supplier_name}
                                                                            </span>
                                                                        )}
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded border border-slate-100">
                                                                                SKU: {item.sku || '-'}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded border border-slate-100">
                                                                                PKU: {item.pku || '-'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    {getSourceBadge(item.source)}
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <span className="text-xs text-slate-600 line-clamp-2" title={item.packaging}>
                                                                        {item.packaging || '-'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalAvailableItems > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                total={totalAvailableItems}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(newSize) => {
                                    setPageSize(newSize)
                                    setCurrentPage(1)
                                }}
                                className="mt-0 py-2 px-0 bg-transparent border-none shadow-none"
                            />
                        )}
                    </div>

                    {/* Right Column: Selection Sidebar */}
                    <div className="w-[260px] flex flex-col border-l border-slate-100 pl-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-violet-100 text-violet-700 rounded-md">
                                    <Check className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ready to Add</h3>
                            </div>
                            <Badge variant="primary" className="rounded-full px-2 py-0.5 font-black text-xs">
                                {selectedItems.size}
                            </Badge>
                        </div>

                        {selectedItems.size > 0 ? (
                            <div className="flex-1 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 p-2 overflow-hidden">
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-2 custom-scrollbar">
                                    {Array.from(selectedItems.values()).map((item) => (
                                        <div
                                            key={item.unique_id}
                                            className="group relative bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-violet-300 transition-all animate-in slide-in-from-right-2 duration-200"
                                        >
                                            <div className="pr-6">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 border border-slate-100 px-1 rounded">
                                                        {item.item_code}
                                                    </span>
                                                    {item.source === 'contract' ? (
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">CONTRACT</span>
                                                    ) : item.source === 'appl' ? (
                                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">APPL</span>
                                                    ) : item.source === 'lp' ? (
                                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">LP</span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1 rounded">MASTER</span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">{item.item_name}</p>
                                                {item.contract_number && (
                                                    <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                                                        #{item.contract_number}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleToggleSelect(item)}
                                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedItems(new Map())}
                                    className="w-full text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-tighter"
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 text-center p-6">
                                <div className="p-3 bg-white rounded-xl shadow-sm mb-3">
                                    <Plus className="w-6 h-6 text-slate-200" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 px-4">Select items from the catalog on the left</p>
                            </div>
                        )}

                        <div className="pt-4 space-y-3 border-t border-slate-100">
                            <Button
                                onClick={handleAddItems}
                                disabled={isSaving || selectedItems.size === 0}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 shadow-lg shadow-violet-100"
                            >
                                {isSaving ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add {selectedItems.size} Items
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowAddModal(false)
                                    setSelectedItems(new Map())
                                    setSearchQuery('')
                                    setCurrentPage(1)
                                }}
                                disabled={isSaving}
                                className="w-full text-slate-400 font-bold"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal >
            {/* Edit Item Modal */}
            <Modal
                isOpen={!!selectedItemForEdit}
                onClose={handleCancelEdit}
                title="Edit Item Details"
                size="lg"
            >
                {selectedItemForEdit && editForm && (
                    <div className="p-1 space-y-6">
                        {/* Header Info */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="gray" className="bg-white border border-slate-200">
                                    {activeTab === 'drug' ? selectedItemForEdit.drug?.drug_code : selectedItemForEdit.non_drug?.item_code}
                                </Badge>
                                {editForm.is_active ? (
                                    <Badge variant="success">Active</Badge>
                                ) : (
                                    <Badge variant="gray">Inactive</Badge>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg leading-snug">
                                {activeTab === 'drug' ? selectedItemForEdit.drug?.drug_name : selectedItemForEdit.non_drug?.item_name}
                            </h3>
                        </div>

                        {/* Stock Limits Form */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Min Limit</label>
                                <Input
                                    type="number"
                                    value={editForm.min_limit?.toString() || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev!, min_limit: parseInt(e.target.value) || 0 }))}
                                    className="font-bold text-center"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-blue-500 uppercase">Buffer Level</label>
                                <Input
                                    type="number"
                                    value={editForm.reorder_level?.toString() || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev!, reorder_level: parseInt(e.target.value) || 0 }))}
                                    className="font-bold text-center text-blue-600 border-blue-200 bg-blue-50/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Max Limit</label>
                                <Input
                                    type="number"
                                    value={editForm.max_limit?.toString() || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev!, max_limit: e.target.value ? parseInt(e.target.value) : null }))}
                                    placeholder="Unlimited"
                                    className="font-bold text-center"
                                />
                            </div>
                        </div>



                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">FUKKM Category</label>
                                <select
                                    value={editForm.category_id || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev!, category_id: e.target.value }))}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500"
                                >
                                    <option value="">- Uncategorized -</option>
                                    {categories
                                        .filter(c => {
                                            const code = c.category_code || '';
                                            return code.length > 0 &&
                                                code.length <= 6 &&
                                                !code.startsWith('TC_') &&
                                                !['ART', 'CNS'].includes(code);
                                        })
                                        // Deduplicate references to the same category name
                                        .filter((c, index, self) =>
                                            index === self.findIndex(t => t.category_name === c.category_name)
                                        )
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                        ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Therapeutic Class</label>
                                <select
                                    value={editForm.therapeutic_class_id || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev!, therapeutic_class_id: e.target.value }))}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500"
                                    disabled={activeTab !== 'drug'}
                                >
                                    <option value="">- Uncategorized -</option>
                                    {categories
                                        .filter(c => {
                                            const code = c.category_code || '';
                                            // Valid if explicitly ART/CNS, OR code is long, OR starts with TC_
                                            // But MUST exclude the FUKKM codes (length<=6 and not special)
                                            const isSpecial = ['ART', 'CNS'].includes(code);
                                            const isLong = code.length > 6;
                                            const isTC = code.startsWith('TC_');
                                            return (isSpecial || isLong || isTC);
                                        })
                                        // Deduplicate references to the same category name to clean up UI
                                        .filter((c, index, self) =>
                                            index === self.findIndex(t => t.category_name === c.category_name)
                                        )
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Source Vote</label>
                                <select
                                    value={editForm.procurement_vote || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev!, procurement_vote: e.target.value as any }))}
                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500"
                                >
                                    <option value="">- Default -</option>
                                    <option value="appl">APPL</option>
                                    <option value="cc">Contract</option>
                                    <option value="lp">LP</option>
                                    <option value="dp">DP</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                <div className="flex items-center h-10">
                                    <button
                                        onClick={() => setEditForm(prev => prev ? { ...prev, is_active: !prev.is_active } : null)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${editForm.is_active
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${editForm.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {editForm.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this item?')) {
                                        handleDelete(selectedItemForEdit)
                                        handleCancelEdit()
                                    }
                                }}
                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Item
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={handleCancelEdit}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit} disabled={isSaving}>
                                    {isSaving ? <Spinner size="sm" className="mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )
                }
            </Modal>

            <UnitCatalogPrintTemplate
                ref={printRef}
                items={printItems}
                categories={categories}
                hospitalName={user?.hospital?.name}
                unitName={catalog?.department?.department_name}
                activeTab={activeTab}
            />
        </div>
    )
}

export default ManageUnitCatalogItemsPage
