import React, { useState, useEffect } from 'react'
import { Search, Package, Plus, Check, Loader2, Trash2 } from 'lucide-react'
import { Modal, Button, Input, Badge, Spinner } from '@/components/ui'
import { searchCatalogItems } from '@/services/pharmacy/unitCatalogItemService'
import { useAuthStore } from '@/stores/authStore'
import type { UnitCatalogItemWithRelations, CatalogItemType } from '@/types/pharmacy'
import { toast } from 'sonner'

interface LocationItemSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (itemIds: string[]) => Promise<void>
    excludeItemIds?: string[]
}

export const LocationItemSearchModal: React.FC<LocationItemSearchModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    excludeItemIds = [],
}) => {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [items, setItems] = useState<UnitCatalogItemWithRelations[]>([])
    // Map of selected items for summary view
    const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, UnitCatalogItemWithRelations>>(new Map())
    const [itemType, setItemType] = useState<CatalogItemType | 'all'>('all')

    useEffect(() => {
        if (isOpen) {
            void loadItems()
            setSelectedItemsMap(new Map())
            setSearchQuery('')
        }
    }, [isOpen, itemType])

    const loadItems = async () => {
        if (!user?.hospital_id) return
        setLoading(true)
        try {
            const { data, error } = await searchCatalogItems(
                user.hospital_id,
                searchQuery,
                itemType === 'all' ? undefined : itemType
            )
            if (error) throw new Error(error)

            // Filter out already added items
            const filteredItems = (data || []).filter(
                (item) => !excludeItemIds.includes(item.id)
            )
            setItems(filteredItems)
        } catch (err) {
            toast.error('Failed to load catalog items')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        void loadItems()
    }

    const toggleSelection = (item: UnitCatalogItemWithRelations) => {
        const newMap = new Map(selectedItemsMap)
        if (newMap.has(item.id)) {
            newMap.delete(item.id)
        } else {
            newMap.set(item.id, item)
        }
        setSelectedItemsMap(newMap)
    }

    const clearSelection = () => {
        setSelectedItemsMap(new Map())
    }

    const removeSelectedItem = (id: string) => {
        const newMap = new Map(selectedItemsMap)
        newMap.delete(id)
        setSelectedItemsMap(newMap)
    }

    const handleConfirm = async () => {
        if (selectedItemsMap.size === 0) return
        setSubmitting(true)
        try {
            await onSelect(Array.from(selectedItemsMap.keys()))
            onClose()
        } catch (err) {
            toast.error('Failed to add items')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Items from Unit Catalog"
            description="Select drugs or non-drugs from the authorized catalog to associate with this location."
            size="4xl"
        >
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <form onSubmit={handleSearch} className="flex-1 w-full">
                        <Input
                            placeholder="Search by name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </form>
                    <div className="flex gap-2">
                        {(['all', 'drug', 'non_drug'] as const).map((type) => (
                            <Button
                                key={type}
                                variant={itemType === type ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setItemType(type)}
                                className="capitalize"
                            >
                                {type.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                            <Spinner className="w-8 h-8 mb-2" />
                            <span>Loading catalog items...</span>
                        </div>
                    ) : items.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b sticky top-0">
                                <tr>
                                    <th className="w-10 px-4 py-3 text-left">
                                        <Check className="w-4 h-4 text-gray-400" />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Item Details</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map((item) => {
                                    const isSelected = selectedItemsMap.has(item.id)
                                    const name =
                                        item.drug?.drug_name ||
                                        item.non_drug?.item_name ||
                                        item.contract?.item_name ||
                                        item.appl_drug?.item_name ||
                                        item.appl_non_drug?.item_name ||
                                        item.lp_drug?.item_name ||
                                        item.lp_non_drug?.item_name ||
                                        'Unknown Item'

                                    const code =
                                        item.drug?.drug_code ||
                                        item.non_drug?.item_code ||
                                        item.contract?.item_code ||
                                        item.appl_drug?.item_code ||
                                        item.appl_non_drug?.item_code ||
                                        item.lp_drug?.item_code ||
                                        item.lp_non_drug?.item_code ||
                                        'N/A'

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-teal-50 cursor-pointer transition-colors ${isSelected ? 'bg-teal-50/50' : ''
                                                }`}
                                            onClick={() => toggleSelection(item)}
                                        >
                                            <td className="px-4 py-4">
                                                <div
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                                                        ? 'bg-teal-600 border-teal-600'
                                                        : 'bg-white border-gray-300'
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 font-mono text-xs">{code}</td>
                                            <td className="px-4 py-4">
                                                <Badge className={item.item_type === 'drug' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-amber-50 text-amber-700 border-amber-100'} size="sm">
                                                    {item.item_type === 'drug' ? 'Drug' : 'Non-Drug'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                            <Package className="w-12 h-12 mb-2 opacity-20" />
                            <span>No items found matching your search.</span>
                        </div>
                    )}
                </div>

                {/* Selected Items Summary */}
                {selectedItemsMap.size > 0 && (
                    <div className="bg-teal-50/50 rounded-lg border border-teal-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-teal-900 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Selected Items ({selectedItemsMap.size})
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                className="h-6 text-xs text-teal-600 hover:text-teal-800 hover:bg-teal-100"
                            >
                                Clear All
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                            {Array.from(selectedItemsMap.values()).map(item => {
                                const name =
                                    item.drug?.drug_name ||
                                    item.non_drug?.item_name ||
                                    item.contract?.item_name ||
                                    item.appl_drug?.item_name ||
                                    item.appl_non_drug?.item_name ||
                                    item.lp_drug?.item_name ||
                                    item.lp_non_drug?.item_name ||
                                    'Unknown Item'

                                const code =
                                    item.drug?.drug_code ||
                                    item.non_drug?.item_code ||
                                    item.contract?.item_code ||
                                    item.appl_drug?.item_code ||
                                    item.appl_non_drug?.item_code ||
                                    item.lp_drug?.item_code ||
                                    item.lp_non_drug?.item_code ||
                                    'N/A'
                                return (
                                    <div key={item.id} className="flex items-center gap-2 bg-white border border-teal-200 rounded-md pl-3 pr-1 py-1.5 shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-700 max-w-[200px] truncate" title={name}>{name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{code}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSelectedItem(item.id)}
                                            className="h-6 w-6 p-0 rounded-full hover:bg-red-50 hover:text-red-600 ml-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-500">
                        {items.length} result(s) found
                    </span>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedItemsMap.size === 0 || submitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Selected
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
