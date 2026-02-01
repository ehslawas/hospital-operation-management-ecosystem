import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Package, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import {
    getLocationItems,
    getStockLocation,
    addItemsToLocation,
    removeLocationItem,
} from '@/services/pharmacy/inventoryService'
import {
    getStockLocations,
    getLocationPath,
} from '@/services/pharmacy/maintenanceService'
import { StockLocation, StockLocationItemWithRelations } from '@/types/pharmacy'

// Components
import { StandardPageLayout } from '@/components/layouts/StandardPageLayout'
import { StandardDataTable, type Column } from '@/components/ui/StandardDataTable'
import { FilterToolbar } from '@/components/ui/FilterToolbar'

// Modals
import { LocationItemSearchModal } from './modals/LocationItemSearchModal'
import { StockLocationItemEditModal } from './modals/StockLocationItemEditModal'

const StockLocationItemsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { error: showError } = useToastStore()
    const { user } = useAuthStore()

    // Data State
    const [location, setLocation] = useState<StockLocation | null>(null)
    const [items, setItems] = useState<StockLocationItemWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [locationPath, setLocationPath] = useState<StockLocation[]>([])

    // UI/Filter State
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('all') // 'all' | 'drug' | 'non_drug'

    // Pagination State
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Modal States
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<StockLocationItemWithRelations | null>(null)

    useEffect(() => {
        if (id) {
            loadData()
        }
    }, [id])

    const loadData = async () => {
        if (!id || !user?.hospital_id) return
        setIsLoading(true)
        try {
            const [locationResult, itemsResult, allLocationsResult] = await Promise.all([
                getStockLocation(id),
                getLocationItems(id),
                getStockLocations(user.hospital_id)
            ])

            if (locationResult.error || !locationResult.data) {
                showError('Error', locationResult.error || 'Failed to fetch stock location')
                navigate(ROUTES.PHARMACY_STOCK_LOCATION)
                return
            }

            setLocation(locationResult.data)
            setItems(itemsResult.data || [])

            if (allLocationsResult.data) {
                const path = getLocationPath(id, allLocationsResult.data)
                setLocationPath(path)
            }
        } catch (error) {
            showError('Error', 'An unexpected error occurred')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddItems = async (itemIds: string[]) => {
        if (!id) return
        try {
            const { error } = await addItemsToLocation(id, itemIds)
            if (error) throw new Error(error)
            toast.success(`${itemIds.length} item(s) added successfully`)
            void loadData()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add items')
            throw err
        }
    }

    const handleRemoveItem = async (itemId: string) => {
        if (!window.confirm('Are you sure you want to remove this item from this location?')) return
        try {
            const { error } = await removeLocationItem(itemId)
            if (error) throw new Error(error)
            toast.success('Item removed from location')
            setItems(prev => prev.filter(i => i.id !== itemId))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove item')
        }
    }

    // Filtering & Pagination
    const filteredItems = useMemo(() => {
        let result = [...items]

        // Only search locally for now as the API fetches all items for this location
        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            result = result.filter((item) => {
                const unitItem = item.unit_catalog_item
                const name = (unitItem?.drug?.drug_name || unitItem?.non_drug?.item_name || '').toLowerCase()
                const code = (unitItem?.drug?.drug_code || unitItem?.non_drug?.item_code || '').toLowerCase()
                return name.includes(lower) || code.includes(lower)
            })
        }

        if (activeTab !== 'all') {
            result = result.filter(item => {
                if (activeTab === 'drug') return !!item.unit_catalog_item?.drug
                if (activeTab === 'non_drug') return !!item.unit_catalog_item?.non_drug
                return true
            })
        }

        return result
    }, [items, searchQuery, activeTab])

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredItems.slice(start, start + pageSize)
    }, [filteredItems, page, pageSize])

    const columns: Column<StockLocationItemWithRelations>[] = [
        {
            header: 'Item Code',
            className: 'w-[150px]',
            cell: (item) => {
                const unitItem = item.unit_catalog_item
                const code = unitItem?.drug?.drug_code || unitItem?.non_drug?.item_code || '—'
                return <span className="font-mono text-xs font-bold text-gray-700">{code}</span>
            },
        },
        {
            header: 'Item Name',
            className: 'min-w-[200px]',
            cell: (item) => {
                const unitItem = item.unit_catalog_item
                const name = unitItem?.drug?.drug_name || unitItem?.non_drug?.item_name || 'Unknown Item'
                const generic = unitItem?.drug?.generic_name
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{name}</span>
                        {generic && <span className="text-xs text-gray-500 italic mt-0.5">{generic}</span>}
                    </div>
                )
            },
        },
        {
            header: 'Source',
            className: 'w-[120px]',
            cell: (item) => {
                const vote = item.unit_catalog_item?.procurement_vote
                if (!vote) return <span className="text-gray-300">-</span>

                const variants: Record<string, string> = {
                    appl: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    cc: 'bg-amber-50 text-amber-700 border-amber-100',
                    lp: 'bg-blue-50 text-blue-700 border-blue-100',
                    dp: 'bg-rose-50 text-rose-700 border-rose-100',
                }
                return (
                    <Badge className={`${variants[vote.toLowerCase()] || 'bg-gray-50 text-gray-600'} border px-2 py-0.5 rounded uppercase text-[10px] font-bold tracking-wider`}>
                        {vote}
                    </Badge>
                )
            },
        },
        {
            header: 'Packaging',
            className: 'w-[150px]',
            cell: (item) => {
                const unitItem = item.unit_catalog_item
                const packaging = unitItem?.drug?.packaging_description || unitItem?.non_drug?.packaging_description || '—'
                return <span className="text-sm text-gray-600">{packaging}</span>
            },
        },
        {
            header: 'Detailed Location',
            className: 'w-[200px]',
            cell: (item) => {
                const details = []
                if (item.shelf) details.push(`Shelf: ${item.shelf}`)
                if (item.row_name) details.push(`Row: ${item.row_name}`)
                if (item.level) details.push(`Lvl: ${item.level}`)
                if (item.column_name) details.push(`Col: ${item.column_name}`)

                if (details.length === 0) return <span className="text-gray-400 text-xs italic">Unspecified</span>

                return (
                    <div className="flex flex-wrap gap-1">
                        {details.map((d, i) => (
                            <Badge key={i} variant="gray" className="text-[10px] px-1.5 py-0 bg-gray-50 border border-gray-200 text-gray-600">
                                {d}
                            </Badge>
                        ))}
                    </div>
                )
            },
        },
        {
            header: '',
            className: 'w-[100px] text-right',
            cell: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ]

    // Breadcrumbs construction
    const breadcrumbs = [
        { label: 'Pharmacy', href: '/pharmacy' },
        { label: 'Maintenance', href: '/pharmacy/maintenance' },
        { label: 'Stock Locations', href: '/pharmacy/maintenance/stock-locations' },
    ]

    // Add dynamic path from parent locations
    locationPath.slice(0, -1).forEach(loc => {
        breadcrumbs.push({
            label: loc.location_name,
            href: ROUTES.PHARMACY_STOCK_LOCATION_ITEMS.replace(':id', loc.id)
        })
    })

    // Current location (no href)
    if (location) {
        breadcrumbs.push({ label: location.location_name })
    }

    return (
        <StandardPageLayout
            title={location ? location.location_name : 'Loading...'}
            description={location ? `Manage items stored in ${location.location_name} (${location.location_code})` : undefined}
            breadcrumbs={breadcrumbs}
            actions={
                <Button onClick={() => setIsSearchOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
                    + Add Item
                </Button>
            }
        >
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex items-center gap-4">
                <div className="p-3 bg-teal-50 rounded-lg">
                    <Package className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Location Details</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <LayoutGrid className="w-4 h-4" />
                            {location?.location_type || 'Unknown Type'}
                        </span>
                        <span className="mx-1">•</span>
                        <span className="font-mono">{location?.location_code}</span>
                    </div>
                </div>
            </div>

            <FilterToolbar
                searchTerm={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search items in this location..."
                className="mb-6"
                filters={[
                    {
                        label: 'Type',
                        value: activeTab,
                        onChange: setActiveTab,
                        options: [
                            { label: 'All Types', value: 'all' },
                            { label: 'Drugs', value: 'drug' },
                            { label: 'Non-Drugs', value: 'non_drug' }
                        ]
                    }
                ]}
                pageSize={{
                    value: pageSize,
                    onChange: setPageSize
                }}
            />

            <StandardDataTable
                columns={columns}
                data={paginatedItems}
                isLoading={isLoading}
                pagination={{
                    page,
                    pageSize,
                    totalItems: filteredItems.length,
                    onPageChange: setPage
                }}
                keyExtractor={(item) => item.id}
                emptyMessage="No items assigned to this location yet."
                actionButton={
                    <Button variant="outline" onClick={() => setIsSearchOpen(true)} className="mt-4">
                        Add Items to Location
                    </Button>
                }
            />

            <LocationItemSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleAddItems}
                excludeItemIds={items.map(i => i.unit_catalog_item_id)}
            />

            <StockLocationItemEditModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                item={editingItem}
                onSuccess={loadData}
            />
        </StandardPageLayout>
    )
}

export default StockLocationItemsPage
