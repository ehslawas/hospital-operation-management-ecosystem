import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Building2, Save } from 'lucide-react'
import { Modal, Button, Input, Select, Textarea, Spinner } from '@/components/ui'
import { createStockLocation } from '@/services/pharmacy/inventoryService'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type { LocationType, TemperatureRequirement } from '@/types/pharmacy'

const locationSchema = z.object({
    location_code: z.string().min(1, 'Location code is required'),
    location_name: z.string().min(1, 'Location name is required'),
    location_type: z.enum(['warehouse', 'pharmacy', 'ward', 'cold_room', 'controlled'] as const),
    temperature_required: z.enum(['ambient', '2-8C', '-20C', '-80C'] as const).optional(),
    capacity: z.coerce.number().min(0, 'Capacity must be positive').optional(),
    description: z.string().optional(),
})

type LocationFormData = z.infer<typeof locationSchema>

interface AddLocationModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { user } = useAuthStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            location_type: 'warehouse',
            temperature_required: 'ambient',
        },
    })

    const onSubmit = async (data: LocationFormData) => {
        if (!user?.hospital_id) return

        setIsSubmitting(true)
        setError(null)

        try {
            const { error: apiError } = await createStockLocation({
                hospital_id: user.hospital_id,
                location_code: data.location_code,
                location_name: data.location_name,
                location_type: data.location_type,
                temperature_required: data.temperature_required as TemperatureRequirement,
                capacity: data.capacity,
                // description: data.description, // Not in StockLocation type yet, omit for now
                is_active: true,
            })

            if (apiError) throw new Error(apiError)

            toast.success('Location created successfully')
            reset()
            onSuccess()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create location')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Stock Location"
            description="Create a new storage location for inventory items."
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">Creation Failed</p>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Location Code"
                        placeholder="e.g. WH-01"
                        {...register('location_code')}
                        error={!!errors.location_code}
                        errorMessage={errors.location_code?.message}
                        required
                    />

                    <Input
                        label="Location Name"
                        placeholder="e.g. Main Warehouse"
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
                    label="Capacity (Optional)"
                    type="number"
                    placeholder="Max number of items/pallets"
                    {...register('capacity')}
                    error={!!errors.capacity}
                    errorMessage={errors.capacity?.message}
                />

                <Textarea
                    label="Description"
                    placeholder="Addtional details about this location..."
                    {...register('description')}
                    error={!!errors.description}
                    errorMessage={errors.description?.message}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner className="w-4 h-4 mr-2" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Location
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
