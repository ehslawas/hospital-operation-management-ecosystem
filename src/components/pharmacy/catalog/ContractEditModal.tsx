import React, { useEffect } from 'react'
import { Modal, Input, Button, Select } from '@/components/ui'
import { useForm } from 'react-hook-form'
import type { ContractWithRelations, ContractCatalogStatus } from '@/types/pharmacy'
import { updateContract } from '@/services/pharmacy/contractCatalogService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Save } from 'lucide-react'

interface ContractEditModalProps {
    isOpen: boolean
    onClose: () => void
    contract: ContractWithRelations | null
    onSave: () => void
}

interface ContractFormData {
    item_name: string
    contract_number: string
    supplier_name: string
    unit_price: number | string
    start_date: string
    end_date: string
    status: string
    unit: string
    delivery_period: string
    sst_rate: string
}

export const ContractEditModal: React.FC<ContractEditModalProps> = ({
    isOpen,
    onClose,
    contract,
    onSave,
}) => {
    const { user } = useAuthStore()
    const { success, error: showToastError } = useToastStore()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContractFormData>()

    useEffect(() => {
        if (contract && isOpen) {
            reset({
                item_name: contract.item_name || '',
                contract_number: contract.contract_number || '',
                supplier_name: contract.supplier_name || '',
                unit_price: contract.unit_price || 0,
                start_date: contract.start_date || '',
                end_date: contract.end_date || '',
                status: contract.status || 'active',
                unit: contract.unit || '',
                delivery_period: contract.delivery_period || '',
                sst_rate: contract.sst_rate || '',
            })
        }
    }, [contract, isOpen, reset])

    const onSubmit = async (data: ContractFormData) => {
        if (!contract || !user?.hospital_id) return

        try {
            // Clean up Price (parse to number)
            const cleanPrice = typeof data.unit_price === 'string'
                ? parseFloat(data.unit_price.replace(/,/g, ''))
                : data.unit_price

            const payload = {
                ...data,
                unit_price: isNaN(cleanPrice) ? 0 : cleanPrice,
                hospital_id: user.hospital_id,
                status: data.status as ContractCatalogStatus, // Cast string to union type
            }

            const { error } = await updateContract(contract.id, payload)

            if (error) {
                throw new Error(error)
            }

            success('Contract updated successfully')
            onSave()
            onClose()
        } catch (err) {
            console.error('Failed to update contract:', err)
            showToastError('Failed to update contract')
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Contract Details" size="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Drug Name - Full Width */}
                    <div className="md:col-span-2">
                        <Input
                            id="item_name"
                            label="Drug Name"
                            required
                            {...register('item_name', { required: 'Drug Name is required' })}
                            error={!!errors.item_name}
                            errorMessage={errors.item_name?.message}
                            placeholder="e.g. Paracetamol 500mg Tablet"
                        />
                    </div>

                    {/* Contract No */}
                    <div>
                        <Input
                            id="contract_number"
                            label="Contract No."
                            required
                            {...register('contract_number', { required: 'Contract Number is required' })}
                            error={!!errors.contract_number}
                            errorMessage={errors.contract_number?.message}
                            placeholder="e.g. KKM-123/2025"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <Select
                            id="status"
                            label="Status"
                            required
                            {...register('status')}
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Expired', value: 'expired' },
                                { label: 'Terminated', value: 'terminated' },
                                { label: 'Pending', value: 'pending' },
                            ]}
                        />
                    </div>

                    {/* Supplier Name */}
                    <div className="md:col-span-2">
                        <Input
                            id="supplier_name"
                            label="Supplier Name"
                            {...register('supplier_name')}
                            placeholder="e.g. Pharmaniaga Logistics Sdn Bhd"
                        />
                    </div>

                    {/* Dates */}
                    <div>
                        <Input
                            id="start_date"
                            label="Start Date"
                            type="date"
                            {...register('start_date')}
                        />
                    </div>

                    <div>
                        <Input
                            id="end_date"
                            label="End Date"
                            type="date"
                            {...register('end_date')}
                        />
                    </div>

                    {/* Price & Unit */}
                    <div>
                        <Input
                            id="unit_price"
                            label="Price (RM)"
                            required
                            type="number"
                            step="0.01"
                            {...register('unit_price', { required: 'Price is required', min: 0 })}
                            error={!!errors.unit_price}
                            errorMessage={errors.unit_price?.message}
                        />
                    </div>

                    <div>
                        <Input
                            id="unit"
                            label="Unit / Packaging"
                            {...register('unit')}
                            placeholder="e.g. Box of 100"
                        />
                    </div>

                    {/* Delivery & SST */}
                    <div>
                        <Input
                            id="delivery_period"
                            label="Delivery Period"
                            {...register('delivery_period')}
                            placeholder="e.g. 7 Days"
                        />
                    </div>

                    <div>
                        <Input
                            id="sst_rate"
                            label="SST / Tax Info"
                            {...register('sst_rate')}
                            placeholder="e.g. 0% or Exempted"
                        />
                    </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
