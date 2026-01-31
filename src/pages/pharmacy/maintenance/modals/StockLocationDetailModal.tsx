import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Package,
    Save,
    Plus,
    Trash2,
    Settings,
    List,
    Loader2
} from 'lucide-react'
import {
    Modal,
    Button,
    Input,
    Select,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Badge
} from '@/components/ui'
import {
    updateStockLocation,
    getLocationItems,
    addItemsToLocation,
    removeLocationItem,
    updateLocationItem
} from '@/services/pharmacy/inventoryService'
import { LocationItemSearchModal } from './LocationItemSearchModal'
import { toast } from 'sonner'
import type {
    StockLocation,
    StockLocationItemWithRelations,
    TemperatureRequirement
} from '@/types/pharmacy'

const locationSchema = z.object({
    location_code: z.string().min(1, 'Location code is required'),
    location_name: z.string().min(1, 'Location name is required'),
    location_type: z.enum(['warehouse', 'pharmacy', 'ward', 'cold_room', 'controlled'] as const),
    temperature_required: z.enum(['ambient', '2-8C', '-20C', '-80C'] as const).optional(),
    capacity: z.coerce.number().min(0, 'Capacity must be positive').optional(),
})

type LocationFormData = z.infer<typeof locationSchema>

interface StockLocationDetailModalProps {
    isOpen: boolean
    onClose: () => void
    location: StockLocation | null
    onSuccess: () => void
}

export const StockLocationDetailModal: React.FC<StockLocationDetailModalProps> = ({
    isOpen,
    onClose,
    location,
    onSuccess,
}) => {
    const [activeTab, setActiveTab] = useState('details')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const [items, setItems] = useState<StockLocationItemWithRelations[]>([])
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
    })

    // Initialize form when location changes
    useEffect(() => {
        if (location && isOpen) {
            reset({
                location_code: location.location_code,
                location_name: location.location_name,
                location_type: location.location_type,
                temperature_required: location.temperature_required || 'ambient',
                capacity: location.capacity || 0,
            })
            setActiveTab('details')
            void loadAssignedItems()
        }
    }, [location, isOpen, reset])

    const loadAssignedItems = async () => {
        if (!location) return
        setIsLoadingItems(true)
        try {
            const { data, error } = await getLocationItems(location.id)
            if (error) throw new Error(error)
            setItems(data || [])
        } catch (err) {
            toast.error('Failed to load assigned items')
        } finally {
            setIsLoadingItems(false)
        }
    }

    const onUpdateDetails = async (data: LocationFormData) => {
        if (!location) return
        setIsSubmitting(true)
        try {
            const { error } = await updateStockLocation(location.id, {
                ...data,
                temperature_required: data.temperature_required as TemperatureRequirement,
            })
            if (error) throw new Error(error)
            toast.success('Location updated successfully')
            onSuccess()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update location')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddItems = async (catalogItemIds: string[]) => {
        if (!location) return
        try {
            const { error } = await addItemsToLocation(location.id, catalogItemIds)
            if (error) throw new Error(error)
            toast.success(`${catalogItemIds.length} item(s) added to location`)
            void loadAssignedItems()
        } catch (err) {
            toast.error('Failed to add items to location')
            throw err
        }
    }

    const handleRemoveItem = async (itemId: string) => {
        try {
            const { error } = await removeLocationItem(itemId)
            if (error) throw new Error(error)
            toast.success('Item removed from location')
            setItems(prev => prev.filter(item => item.id !== itemId))
        } catch (err) {
            toast.error('Failed to remove item')
        }
    }

    const handleUpdateParLevel = async (itemId: string, field: 'min_stock' | 'max_stock', value: string) => {
        const numValue = parseInt(value) || 0
        try {
            const { error } = await updateLocationItem(itemId, { [field]: numValue })
            if (error) throw new Error(error)
            setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: numValue } : item))
        } catch (err) {
            toast.error('Failed to update stock levels')
        }
    }

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={location ? `Manage Location: ${location.location_name}` : 'Location Details'}
                description="View configuration and manage authorized inventory items."
                size="xl"
            >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="details" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configuration
                        </TabsTrigger>
                        <TabsTrigger value="items" className="flex items-center gap-2">
                            <List className="w-4 h-4" />
                            Authorized Items
                            {items.length > 0 && (
                                <Badge variant="info" size="sm" className="ml-1">
                                    {items.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <form onSubmit={handleSubmit(onUpdateDetails)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Location Code"
                                    {...register('location_code')}
                                    error={!!errors.location_code}
                                    errorMessage={errors.location_code?.message}
                                    required
                                />
                                <Input
                                    label="Location Name"
                                    {...register('location_name')}
                                    error={!!errors.location_name}
                                    errorMessage={errors.location_name?.message}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Location Type"
                                    {...register('location_type')}
                                    error={errors.location_type?.message}
                                    options={[
                                        { value: 'warehouse', label: 'Warehouse' },
                                        { value: 'pharmacy', label: 'Pharmacy' },
                                        { value: 'ward', label: 'Ward' },
                                        { value: 'cold_room', label: 'Cold Room' },
                                        { value: 'controlled', label: 'Controlled Storage' },
                                    ]}
                                    required
                                />
                                <Select
                                    label="Temperature Requirement"
                                    {...register('temperature_required')}
                                    error={errors.temperature_required?.message}
                                    options={[
                                        { value: 'ambient', label: 'Ambient (Room Temp)' },
                                        { value: '2-8C', label: '2-8°C (Refrigerated)' },
                                        { value: '-20C', label: '-20°C (Freezer)' },
                                        { value: '-80C', label: '-80°C (Ultra Low)' },
                                    ]}
                                />
                            </div>

                            <Input
                                label="Capacity"
                                type="number"
                                {...register('capacity')}
                                error={!!errors.capacity}
                                errorMessage={errors.capacity?.message}
                            />

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                    Close
                                </Button>
                                <Button type="submit" disabled={isSubmitting || !isDirty}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="items">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-700">Authorized Stock List</h3>
                                <Button size="sm" onClick={() => setIsSearchModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Items
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                {isLoadingItems ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                        <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                                        <span>Loading items...</span>
                                    </div>
                                ) : items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Item Name</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Min/Max Stock</th>
                                                    <th className="px-4 py-3 text-right font-medium text-gray-500 text-transparent">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {items.map((item) => {
                                                    const catalogItem = item.unit_catalog_item
                                                    const name = catalogItem?.item_type === 'drug'
                                                        ? catalogItem.drug?.drug_name
                                                        : catalogItem?.non_drug?.item_name

                                                    return (
                                                        <tr key={item.id} className="hover:bg-gray-50 group">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Package className="w-4 h-4 text-gray-400" />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-gray-900">{name}</span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {catalogItem?.item_type === 'drug' ? catalogItem.drug?.drug_code : catalogItem?.non_drug?.item_code}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        className="w-16 px-2 py-1 border rounded text-center"
                                                                        defaultValue={item.min_stock}
                                                                        onBlur={(e) => handleUpdateParLevel(item.id, 'min_stock', e.target.value)}
                                                                    />
                                                                    <span className="text-gray-400">/</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-16 px-2 py-1 border rounded text-center"
                                                                        defaultValue={item.max_stock}
                                                                        onBlur={(e) => handleUpdateParLevel(item.id, 'max_stock', e.target.value)}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                        <Package className="w-12 h-12 mb-2 opacity-20" />
                                        <p>No items assigned to this location yet.</p>
                                        <p className="text-xs">Authorized items define what can be stored here.</p>
                                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsSearchModalOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Item
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </Modal>

            <LocationItemSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleAddItems}
                excludeItemIds={items.map(i => i.unit_catalog_item_id)}
            />
        </>
    )
}
