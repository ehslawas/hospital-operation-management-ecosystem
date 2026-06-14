import React, { useState } from 'react'
import { Modal, Input, Button, Select } from '@/components/ui'
import { Mail, Info } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface LoanCylinderModalProps {
    isOpen: boolean
    onClose: () => void
}

export const LoanCylinderModal: React.FC<LoanCylinderModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuthStore()
    const [quantity, setQuantity] = useState<number>(1)
    const [size, setSize] = useState('Size G') // Default or could be dropdown

    // Fixed email for demo, could be from config
    const TARGET_EMAIL = 'my@gmail.com'

    const handleSend = () => {
        const subject = encodeURIComponent(`Loan Cylinder Request - ${user?.full_name || 'Pharmacy'}`)
        const body = encodeURIComponent(
            `Dear Linde Team,

We would like to request loan cylinders as follows:

Hospital: ${user?.hospital_id || 'Hospital Name'}
Requester: ${user?.full_name || 'Pharmacy Staff'}

Item: Medical Oxygen Cylinder (${size})
Quantity: ${quantity} units

Please confirm availability and delivery schedule.

Regards,
Pharmacy Department`
        )

        window.open(`mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`, '_blank')
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Loan Cylinder"
            size="sm"
        >
            <div className="space-y-6 pt-2">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3">
                    <Info className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                        This action will open your default email client with a pre-formatted request template.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Cylinder Size</label>
                        <Select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            options={[
                                { label: 'Size G (Large)', value: 'Size G' },
                                { label: 'Size E (Medium)', value: 'Size E' },
                                { label: 'Size D (Small)', value: 'Size D' },
                                { label: 'Size F (Large)', value: 'Size F' },
                            ]}
                            className="h-11 font-medium bg-slate-50 border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Quantity Required</label>
                        <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="h-11 text-center font-bold text-lg bg-slate-50 border-slate-200"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSend}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full md:w-auto"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Request
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
