import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Package,
    Plus,
    Search,
    Trash2,
    AlertCircle,
    Pill,
    Box,
    TrendingUp,
    LayoutGrid,
    Edit2,
    Check,
    X,
} from 'lucide-react'
import {
    Button,
    Input,
    Badge,
    Table,
    Modal,
    Spinner,
    LoadingOverlay,
} from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import {
    getUnitCatalog,
    getUnitCatalogs, // Used indirectly to refresh counts if needed
} from '@/services/pharmacy/unitCatalogService'
import {
    getCatalogItems,
    addCatalogItems,
    deleteCatalogItem,
    toggleCatalogItem,
    updateCatalogItem,
    getCatalogItemCounts,
} from '@/services/pharmacy/unitCatalogItemService'
import { getDrugCatalog } from '@/services/pharmacy/drugCatalogService'
import { getNonDrugCatalog } from '@/services/pharmacy/nonDrugCatalogService'
import type {
    UnitCatalogItemWithRelations,
    UnitCatalogItemFormData,
    CatalogItemType,
    DrugWithRelations,
    NonDrugWithRelations,
    UnitCatalogWithItemCounts,
    UnitCatalogWithRelations,
} from '@/types/pharmacy'
import { ROUTES } from '@/lib/constants'

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
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Add Items Modal State
    const [showAddModal, setShowAddModal] = useState(false)
    const [availableItems, setAvailableItems] = useState<DrugWithRelations[] | NonDrugWithRelations[]>([])
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [defaultMinLimit, setDefaultMinLimit] = useState(1)
    const [defaultMaxLimit, setDefaultMaxLimit] = useState<number | null>(null)
    const [defaultBufferLevel, setDefaultBufferLevel] = useState(1)
    const [defaultActive, setDefaultActive] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Inline Editing State
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<UnitCatalogItemFormData> | null>(null)

    useEffect(() => {
        if (id) {
            loadCatalogAndItems()
        }
    }, [id, activeTab])

    // Load available items when Add Modal opens
    useEffect(() => {
        if (showAddModal && catalog?.hospital_id) {
            const timeoutId = setTimeout(() => {
                loadAvailableItems()
            }, searchQuery ? 500 : 0) // Debounce search by 500ms

            return () => clearTimeout(timeoutId)
        }
    }, [showAddModal, catalog?.hospital_id, activeTab, searchQuery, currentPage])

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
            const itemsResult = await getCatalogItems(id, activeTab, 1, 1000)
            if (itemsResult.data?.data) {
                setItems(itemsResult.data.data)
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
            const itemsResult = await getCatalogItems(id, activeTab, 1, 1000)
            if (itemsResult.data?.data) {
                setItems(itemsResult.data.data)
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
            const existingDrugIds = new Set(
                items
                    .filter((i) => i.item_type === 'drug' && i.drug_id)
                    .map((i) => i.drug_id!)
                    .filter((id): id is string => !!id)
            )
            const existingNonDrugIds = new Set(
                items
                    .filter((i) => i.item_type === 'non_drug' && i.non_drug_id)
                    .map((i) => i.non_drug_id!)
                    .filter((id): id is string => !!id)
            )

            if (activeTab === 'drug') {
                const result = await getDrugCatalog(
                    catalog.hospital_id,
                    { search: searchQuery.trim() || undefined }, // Removed status: 'active'
                    currentPage,
                    20
                )
                if (result.data?.data) {
                    setAvailableItems(result.data.data) // Stop filtering out existing items here
                    setTotalPages(result.data.totalPages)
                }
            } else {
                const result = await getNonDrugCatalog(
                    catalog.hospital_id,
                    { search: searchQuery.trim() || undefined }, // Removed status: 'active'
                    currentPage,
                    20
                )
                if (result.data?.data) {
                    setAvailableItems(result.data.data) // Stop filtering out existing items here
                    setTotalPages(result.data.totalPages)
                }
            }
        } catch (error) {
            showError('Error', 'Failed to load available items')
            console.error(error)
        } finally {
            setIsLoadingAvailable(false)
        }
    }

    const handleToggleSelection = (itemId: string) => {
        setSelectedItemIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(itemId)) newSet.delete(itemId)
            else newSet.add(itemId)
            return newSet
        })
    }

    const handleSelectAll = () => {
        const selectableItems = availableItems.filter((item: any) => {
            if (activeTab === 'drug') {
                return !items.some(i => i.drug_id === item.id)
            } else {
                return !items.some(i => i.non_drug_id === item.id)
            }
        })

        if (selectedItemIds.size === selectableItems.length && selectableItems.length > 0) {
            setSelectedItemIds(new Set())
        } else {
            setSelectedItemIds(new Set(selectableItems.map((item: any) => item.id)))
        }
    }

    const handleAddItems = async () => {
        if (!user?.id || !id || !catalog || selectedItemIds.size === 0) return

        setIsSaving(true)
        try {
            const itemsToAdd: UnitCatalogItemFormData[] = Array.from(selectedItemIds).map((itemId) => {
                const item = availableItems.find((i: any) => i.id === itemId)
                if (!item) return null

                return {
                    item_type: activeTab,
                    drug_id: activeTab === 'drug' ? itemId : null,
                    non_drug_id: activeTab === 'non_drug' ? itemId : null,
                    is_active: defaultActive,
                    min_limit: defaultMinLimit,
                    max_limit: defaultMaxLimit,
                    reorder_level: defaultBufferLevel,
                }
            }).filter(Boolean) as UnitCatalogItemFormData[]

            const result = await addCatalogItems(id, catalog.hospital_id, user.id, itemsToAdd)
            if (result.error) {
                showError('Error', result.error)
            } else {
                showSuccess('Success', `Added ${itemsToAdd.length} item(s) to catalog`)
                setShowAddModal(false)
                setSelectedItemIds(new Set())
                setSearchQuery('')
                await loadItemsOnly()
            }
        } catch (error) {
            showError('Error', 'Failed to add items')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleStartEdit = (item: UnitCatalogItemWithRelations) => {
        setEditingItemId(item.id)
        setEditForm({
            min_limit: item.min_limit,
            max_limit: item.max_limit,
            reorder_level: item.reorder_level,
            is_active: item.is_active,
            item_type: item.item_type,
        })
    }

    const handleCancelEdit = () => {
        setEditingItemId(null)
        setEditForm(null)
    }

    const handleSaveEdit = async () => {
        if (!editingItemId || !editForm || !catalog) return

        setIsSaving(true)
        try {
            const updateResult = await updateCatalogItem(
                editingItemId,
                catalog.id,
                catalog.hospital_id,
                user!.id,
                editForm
            )

            if (updateResult.error) {
                showError('Error', updateResult.error)
            } else {
                showSuccess('Success', 'Item limits updated')
                setEditingItemId(null)
                setEditForm(null)
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
            render: (_: any, item: UnitCatalogItemWithRelations) => (
                <span className="font-mono text-sm font-semibold text-slate-700">
                    {activeTab === 'drug' ? item.drug?.drug_code : item.non_drug?.item_code}
                </span>
            ),
        },
        {
            key: 'name',
            label: 'Name',
            render: (_: any, item: UnitCatalogItemWithRelations) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                        {activeTab === 'drug' ? item.drug?.drug_name : item.non_drug?.item_name}
                    </span>
                    {activeTab === 'drug' && item.drug?.generic_name && (
                        <span className="text-xs text-slate-500 italic">{item.drug.generic_name}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'uom',
            label: 'UOM',
            render: (_: any, item: UnitCatalogItemWithRelations) => (
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {activeTab === 'drug' ? item.drug?.unit_of_measure : item.non_drug?.unit_of_measure || '—'}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                const isEditing = editingItemId === item.id
                const isActive = isEditing ? editForm?.is_active : item.is_active

                return (
                    <button
                        onClick={() => {
                            if (isEditing) {
                                setEditForm(prev => prev ? { ...prev, is_active: !prev.is_active } : null)
                            } else {
                                handleToggleActive(item)
                            }
                        }}
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
        {
            key: 'limits',
            label: 'Stock Limits (Min / Buffer / Max)',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                const isEditing = editingItemId === item.id
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-[50px]">
                            <span className="text-[10px] uppercase text-slate-400 font-bold leading-none mb-1">Min</span>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={editForm?.min_limit?.toString() || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, min_limit: parseInt(e.target.value) || 0 }))}
                                    className="h-8 w-16 px-1 text-center font-bold text-xs"
                                    min="0"
                                />
                            ) : (
                                <span className="text-sm font-black text-slate-800">{item.min_limit}</span>
                            )}
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex flex-col min-w-[50px]">
                            <span className="text-[10px] uppercase text-slate-400 font-bold leading-none mb-1">Buffer</span>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={editForm?.reorder_level?.toString() || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, reorder_level: parseInt(e.target.value) || 0 }))}
                                    className="h-8 w-16 px-1 text-center font-bold text-xs text-blue-600 border-blue-100"
                                    min="0"
                                />
                            ) : (
                                <span className="text-sm font-black text-blue-600">{item.reorder_level}</span>
                            )}
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex flex-col min-w-[50px]">
                            <span className="text-[10px] uppercase text-slate-400 font-bold leading-none mb-1">Max</span>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={editForm?.max_limit?.toString() || ''}
                                    placeholder="∞"
                                    onChange={(e) => setEditForm(prev => ({ ...prev, max_limit: e.target.value ? parseInt(e.target.value) : null }))}
                                    className="h-8 w-16 px-1 text-center font-bold text-xs"
                                    min="0"
                                />
                            ) : (
                                <span className="text-sm font-black text-slate-800">{item.max_limit ? item.max_limit : '∞'}</span>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, item: UnitCatalogItemWithRelations) => {
                const isEditing = editingItemId === item.id
                if (isEditing) {
                    return (
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 h-8 w-8 p-0"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="text-slate-400 hover:bg-slate-50 hover:text-slate-600 h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )
                }
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(item)}
                            disabled={isSaving}
                            className="text-blue-500 hover:bg-blue-50 hover:text-blue-700 h-8 w-8 p-0"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item)}
                            disabled={isSaving}
                            className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8 p-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
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
                        onClick={() => {
                            setShowAddModal(true)
                            setSelectedItemIds(new Set())
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

                <div className="p-0 flex-1 relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-3">
                            <Spinner size="lg" />
                            <p className="text-sm text-slate-500 font-medium">Loading catalog items...</p>
                        </div>
                    ) : (
                        <Table
                            columns={itemColumns}
                            data={items}
                            emptyMessage={`No ${activeTab === 'drug' ? 'drug' : 'non-drug'} items found in this unit catalog.`}
                        />
                    )}
                </div>
            </div>

            {/* Add Items Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false)
                    setSelectedItemIds(new Set())
                    setSearchQuery('')
                    setCurrentPage(1)
                }}
                title={`Add ${activeTab === 'drug' ? 'Drug' : 'Non-Drug'} Items`}
                size="2xl"
            >
                <div className="space-y-4">
                    <Input
                        label="Search Catalog"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        placeholder={`Search by code or name...`}
                        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Min Limit</label>
                            <Input
                                type="number"
                                value={defaultMinLimit.toString()}
                                onChange={(e) => setDefaultMinLimit(parseInt(e.target.value) || 1)}
                                min="0"
                                className="bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Max Limit</label>
                            <Input
                                type="number"
                                value={defaultMaxLimit?.toString() || ''}
                                onChange={(e) => setDefaultMaxLimit(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Unlimited"
                                min="0"
                                className="bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Buffer Level</label>
                            <Input
                                type="number"
                                value={defaultBufferLevel.toString()}
                                onChange={(e) => setDefaultBufferLevel(parseInt(e.target.value) || 1)}
                                min="0"
                                className="bg-white text-blue-600 font-bold border-blue-100 placeholder:font-normal"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Initial Status</label>
                            <button
                                onClick={() => setDefaultActive(!defaultActive)}
                                className={`w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-bold transition-all border ${defaultActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${defaultActive ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-400'}`} />
                                {defaultActive ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[300px] max-h-[400px] flex flex-col">
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
                                                Make sure the item exists in the main {activeTab === 'drug' ? 'Drug' : 'Non-Drug'} Catalog first.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto flex-1">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItemIds.size === availableItems.length && availableItems.length > 0}
                                                            onChange={handleSelectAll}
                                                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Code</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Item Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {availableItems.map((item: any) => {
                                                    const isAlreadyAdded = activeTab === 'drug'
                                                        ? items.some(i => i.drug_id === item.id)
                                                        : items.some(i => i.non_drug_id === item.id)
                                                    const isInactive = item.status === 'inactive'

                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className={`hover:bg-slate-50 transition-colors ${selectedItemIds.has(item.id) ? 'bg-violet-50/50' : ''
                                                                } ${isAlreadyAdded ? 'opacity-60 grayscale-[0.5]' : 'cursor-pointer'}`}
                                                            onClick={() => !isAlreadyAdded && handleToggleSelection(item.id)}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItemIds.has(item.id) || isAlreadyAdded}
                                                                    onChange={() => !isAlreadyAdded && handleToggleSelection(item.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    disabled={isAlreadyAdded}
                                                                    className={`w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 ${isAlreadyAdded ? 'cursor-not-allowed opacity-50' : ''}`}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <span className="font-mono text-xs font-bold text-slate-700">
                                                                    {activeTab === 'drug' ? item.drug_code : item.item_code}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold text-slate-900 leading-tight">
                                                                            {activeTab === 'drug' ? item.drug_name : item.item_name}
                                                                        </span>
                                                                        {isAlreadyAdded && (
                                                                            <Badge variant="gray" className="text-[9px] h-3.5 px-1 rounded-sm bg-slate-200 text-slate-600 border-none">
                                                                                Already in Catalog
                                                                            </Badge>
                                                                        )}
                                                                        {isInactive && (
                                                                            <Badge variant="danger" className="text-[9px] h-3.5 px-1 rounded-sm">
                                                                                Inactive
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {activeTab === 'drug' && item.generic_name && (
                                                                        <span className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">{item.generic_name}</span>
                                                                    )}
                                                                    <div className="mt-1">
                                                                        <Badge variant="gray" className="text-[10px] h-4 px-1 rounded">
                                                                            {item.unit_of_measure}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
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
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-1 py-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 text-xs font-bold"
                                >
                                    Prev
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 text-xs font-bold"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Selection</span>
                            <span className="text-lg font-black text-slate-900 leading-none">{selectedItemIds.size} Items</span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowAddModal(false)
                                    setSelectedItemIds(new Set())
                                    setSearchQuery('')
                                    setCurrentPage(1)
                                }}
                                disabled={isSaving}
                                className="text-slate-500 font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddItems}
                                disabled={isSaving || selectedItemIds.size === 0}
                                className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 shadow-lg shadow-violet-100"
                            >
                                {isSaving ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Confirm Add Selection
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ManageUnitCatalogItemsPage
