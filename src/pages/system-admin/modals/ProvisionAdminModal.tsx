import React, { useState } from 'react'
import { X, UserPlus, ShieldCheck } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { createHospitalAdmin } from '@/services/hospitalAdminService'
import { useToast } from '@/stores/toastStore'

interface ProvisionAdminModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    hospitalId: string
    hospitalName: string
}

const ProvisionAdminModal = ({ isOpen, onClose, onSuccess, hospitalId, hospitalName }: ProvisionAdminModalProps) => {
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        employee_id: '',
        full_name: '',
        ic_number: '',
        phone_number: '',
        password: '',
        jawatan: 'Hospital Administrator'
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createHospitalAdmin({
                ...formData,
                hospital_id: hospitalId
            })

            if (!result.success) {
                throw new Error(result.error || 'Failed to provision admin')
            }

            toast.success('Admin Provisioned', `Administrator for ${hospitalName} created successfully.`)
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error(error)
            toast.error('Provisioning Failed', error.message || 'Failed to create admin account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Provision Admin</h2>
                            <p className="text-xs text-slate-500">Create access for {hospitalName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                            <Input
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Official Name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email (Login ID) <span className="text-red-500">*</span></label>
                                <Input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                                <Input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">IC Number <span className="text-red-500">*</span></label>
                                <Input
                                    required
                                    value={formData.ic_number}
                                    onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
                                    placeholder="MyKad No."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Employee ID</label>
                                <Input
                                    required
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                    placeholder="Staff ID"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone</label>
                            <Input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                placeholder="+60..."
                            />
                        </div>

                        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100 flex gap-2 items-start">
                            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                This user will have <strong>full administrative access</strong> to {hospitalName}.
                                Ensure identity verification before proceeding.
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                            {loading ? 'Provisioning...' : <><UserPlus className="w-4 h-4 mr-2" /> Create Admin Account</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ProvisionAdminModal
