import React, { useState, useEffect } from 'react'
import { Search, Package, Plus, Check, Loader2, X } from 'lucide-react'
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [itemType, setItemType] = useState<CatalogItemType | 'all'>('all')

    useEffect(() => {
        if (isOpen) {
            void loadItems()
            setSelectedIds(new Set())
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

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleConfirm = async () => {
        if (selectedIds.size === 0) return
        setSubmitting(true)
        try {
            await onSelect(Array.from(selectedIds))
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
            size="xl"
        >
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <form onSubmit={handleSearch} className="flex-1 w-full">
                        <Input
                            placeholder="Search by name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={<Search className="w-4 h-4" />}
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
                                    const isSelected = selectedIds.has(item.id)
                                    const name = item.item_type === 'drug' ? item.drug?.drug_name : item.non_drug?.item_name
                                    const code = item.item_type === 'drug' ? item.drug?.drug_code : item.non_drug?.item_code

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-blue-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : ''
                                                }`}
                                            onClick={() => toggleSelection(item.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <div
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white border-gray-300'
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{code}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={item.item_type === 'drug' ? 'info' : 'warning'} size="sm">
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

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-500">
                        {selectedIds.size} item(s) selected
                    </span>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0 || submitting}
                            className="min-w-[120px]"
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
