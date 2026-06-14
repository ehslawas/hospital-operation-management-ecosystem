import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, MapPin } from 'lucide-react'
import {
    Modal,
    Button,
    Input,
} from '@/components/ui'
import { updateLocationItem } from '@/services/pharmacy/inventoryService'
import { toast } from 'sonner'
import type { StockLocationItemWithRelations } from '@/types/pharmacy'

const editSchema = z.object({
    shelf: z.string().optional(),
    row_name: z.string().optional(),
    level: z.string().optional(),
    column_name: z.string().optional(),
})

type EditFormData = z.infer<typeof editSchema>

interface StockLocationItemEditModalProps {
    isOpen: boolean
    onClose: () => void
    item: StockLocationItemWithRelations | null
    onSuccess: () => void
}

export const StockLocationItemEditModal: React.FC<StockLocationItemEditModalProps> = ({
    isOpen,
    onClose,
    item,
    onSuccess,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<EditFormData>({
        resolver: zodResolver(editSchema),
    })

    useEffect(() => {
        if (item && isOpen) {
            reset({
                shelf: item.shelf || '',
                row_name: item.row_name || '',
                level: item.level || '',
                column_name: item.column_name || '',
            })
        }
    }, [item, isOpen, reset])

    const onSubmit = async (data: EditFormData) => {
        if (!item) return
        setIsSubmitting(true)
        try {
            const { error } = await updateLocationItem(item.id, data)
            if (error) throw new Error(error)

            toast.success('Item location updated successfully')
            onSuccess()
            onClose()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update item')
        } finally {
            setIsSubmitting(false)
        }
    }

    const itemName = item?.unit_catalog_item?.drug?.drug_name ||
        item?.unit_catalog_item?.non_drug?.item_name ||
        'Unknown Item'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Item Storage Location"
            description={`Updating details for ${itemName}`}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-violet-500" />
                        Storage Location Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Shelf"
                            placeholder="e.g. Shelf A"
                            {...register('shelf')}
                            error={!!errors.shelf}
                            errorMessage={errors.shelf?.message}
                        />
                        <Input
                            label="Row"
                            placeholder="e.g. Row 1"
                            {...register('row_name')}
                            error={!!errors.row_name}
                            errorMessage={errors.row_name?.message}
                        />
                        <Input
                            label="Level"
                            placeholder="e.g. Level 2"
                            {...register('level')}
                            error={!!errors.level}
                            errorMessage={errors.level?.message}
                        />
                        <Input
                            label="Column"
                            placeholder="e.g. Col 3"
                            {...register('column_name')}
                            error={!!errors.column_name}
                            errorMessage={errors.column_name?.message}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
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
        </Modal>
    )
}
