import React, { useState } from 'react'
import { X, Building2, Save } from 'lucide-react'
import { Button, Input, Badge } from '@/components/ui'
import { createHospital } from '@/services/hospitalService'
import { useToast } from '@/stores/toastStore'
import type { Hospital } from '@/types'

interface CreateHospitalModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const CreateHospitalModal = ({ isOpen, onClose, onSuccess }: CreateHospitalModalProps) => {
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        hospital_name: '',
        hospital_code: '',
        address: '',
        state: '',
        phone: '',
        email: '',
        status: 'active' as const
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await createHospital({
                ...formData,
                subscription_status: 'trial' // Default for new onboarding
            } as any) // Casting as any to support extended fields not yet in strict types if needed

            toast.success('Hospital Created', `${formData.hospital_name} has been successfully onboarded.`)
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error(error)
            toast.error('Creation Failed', error.message || 'Failed to create hospital')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Onboard Hospital</h2>
                            <p className="text-xs text-slate-500">Add a new tenant to the system</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Hospital Name <span className="text-red-500">*</span></label>
                                <Input
                                    required
                                    value={formData.hospital_name}
                                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                                    placeholder="e.g. City General Hospital"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Code <span className="text-red-500">*</span></label>
                                <Input
                                    required
                                    value={formData.hospital_code}
                                    onChange={(e) => setFormData({ ...formData, hospital_code: e.target.value.toUpperCase() })}
                                    placeholder="e.g. CGH001"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Address</label>
                            <textarea
                                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Full address line"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Contact Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone</label>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+60..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <span className="text-sm font-medium text-slate-700 block">Subscription Plan</span>
                                <span className="text-xs text-slate-500">Defaulting to 30-day Trial</span>
                            </div>
                            <Badge variant="warning">TRIAL</Badge>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" className="bg-royal-blue hover:bg-blue-700" disabled={loading}>
                            {loading ? 'Creating...' : <><Save className="w-4 h-4 mr-2" /> Create Hospital</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateHospitalModal
