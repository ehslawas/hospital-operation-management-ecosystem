import React, { useEffect, useState } from 'react'
import { Modal, Button, Select, type SelectOption } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { reallocatePurchaseOrder } from '@/services/pharmacy/procurementService'
import { WARRANT_DEPARTMENTS } from '@/services/pharmacy/warrantService'
import { AlertCircle } from 'lucide-react'

// Constants
const VOTE_CODES = [
    { value: '080702', label: '080702 CC' },
    { value: '990102', label: '990102 APPL' },
]

const VOTE_ACTIVITIES = [
    { value: '27401', label: '27401' },
    { value: '27499', label: '27499' },
    { value: '27404', label: '27404' },
    { value: '27403', label: '27403' },
    { value: '27402', label: '27402' },
    { value: '27501', label: '27501' },
]

const CATEGORIES = [
    { value: 'drug', label: 'Drug' },
    { value: 'non_drug', label: 'Non-Drug' },
    { value: 'non_standard', label: 'Non-Standard' },
    { value: 'reagent', label: 'Reagent' },
    { value: 'vaccine', label: 'Vaccine' },
    { value: 'insulin', label: 'Insulin' },
    { value: 'hepc', label: 'HEPC' },
    { value: 'medical_oxygen', label: 'Medical Oxygen' },
]

interface ReallocateAllocationModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    poId: string
    currentData: {
        vote_code: string
        vote_activity: string
        department: string
        category: string
    }
}

export const ReallocateAllocationModal: React.FC<ReallocateAllocationModalProps> = ({
    isOpen, onClose, onSuccess, poId, currentData
}) => {
    const [allocation, setAllocation] = useState({
        vote_code: '',
        vote_activity: '',
        department: '',
        category: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { success, error } = useToastStore()
    const { user } = useAuthStore()

    useEffect(() => {
        if (isOpen) {
            setAllocation({
                vote_code: currentData.vote_code || '',
                vote_activity: currentData.vote_activity || '',
                department: currentData.department || '',
                category: currentData.category || ''
            })
        }
    }, [isOpen, currentData])

    const handleChange = (field: string, value: string) => {
        setAllocation(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!allocation.vote_code || !allocation.vote_activity || !allocation.department || !allocation.category) {
            error('Validation Error', 'All fields are required')
            return
        }

        if (!user?.id) {
            error('Error', 'User session invalid')
            return
        }

        setIsSubmitting(true)
        try {
            const result = await reallocatePurchaseOrder(poId, user.id, allocation)

            if (result.error) {
                error('Error', result.error)
            } else {
                success('Success', 'Allocation updated successfully.')
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error(err)
            error('Error', 'An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Warrant Allocation"
            description="Update the financial allocation for this Purchase Order."
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium">Warning: Financial Impact</p>
                        <p className="mt-1">
                            Changing the allocation will move the committed funds to the new warrant.
                            Please ensure this correction is valid as it affects budget utilization.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Select
                        label="Vote Code"
                        options={VOTE_CODES}
                        value={allocation.vote_code}
                        onChange={(e) => handleChange('vote_code', e.target.value)}
                        required
                    />

                    <Select
                        label="Vote Activity"
                        options={VOTE_ACTIVITIES}
                        value={allocation.vote_activity}
                        onChange={(e) => handleChange('vote_activity', e.target.value)}
                        required
                    />

                    <Select
                        label="Department"
                        options={WARRANT_DEPARTMENTS as unknown as SelectOption[]}
                        value={allocation.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        required
                    />

                    <Select
                        label="Category"
                        options={CATEGORIES}
                        value={allocation.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting} className="min-w-[100px]">
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
