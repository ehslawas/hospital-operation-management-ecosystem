import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Mic, Send, AlertTriangle, Eye } from 'lucide-react'
import { Button, Input, Textarea, Spinner } from '@/components/ui'
import { MemoDocumentView } from './MemoDocumentView'

import { memoService, CreateMemoParams } from '@/services/memoService'
import { runningNumberService } from '@/services/runningNumberService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { MemoType, MemoPriority, Memo } from '@/types'

interface CreateMemoModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (memo: Memo) => void
}

export const CreateMemoModal: React.FC<CreateMemoModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<CreateMemoParams>>({
        title: '',
        content: '',
        memo_type: 'announcement',
        priority: 'normal',
        is_letter: false,
        ref_number: '',
        recipient_name: '',
        recipient_address: ''
    })
    const [showPreview, setShowPreview] = useState(false)

    // Fetch next ref number when type or open changes
    React.useEffect(() => {
        const fetchRef = async () => {
            if (isOpen && user?.department_id) {
                const type = formData.is_letter ? 'letter' : 'memo'
                const ref = await runningNumberService.generateNextRef(user.department_id, type)
                setFormData(prev => ({ ...prev, ref_number: ref }))
            }
        }
        fetchRef()
    }, [isOpen, formData.is_letter, user?.department_id])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.hospital_id || !formData.title || !formData.content) return

        setLoading(true)
        try {
            const { data, error } = await memoService.createMemo({
                hospital_id: user.hospital_id,
                title: formData.title,
                content: formData.content,
                memo_type: formData.memo_type as MemoType,
                priority: formData.priority as MemoPriority,
                target_departments: ['all'], // Default to all for now
                is_letter: formData.is_letter,
                ref_number: formData.ref_number,
                recipient_name: formData.recipient_name,
                recipient_address: formData.recipient_address
            })

            if (error) throw error

            toast.success('Submitted', 'Announcement submitted for approval')
            onSuccess?.(data!)
            onClose()
        } catch (err) {
            console.error(err)
            toast.error('Error', 'Failed to post announcement')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            >
                <div className="border-b px-6 py-4 flex items-center justify-between bg-teal-50">
                    <h2 className="text-lg font-bold text-teal-900">Post Announcement</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Document Type Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!formData.is_letter ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setFormData({ ...formData, is_letter: false })}
                        >
                            Memo Dalaman
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.is_letter ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setFormData({ ...formData, is_letter: true })}
                        >
                            Surat Rasmi
                        </button>
                    </div>

                    {/* Ref Number Display */}
                    <div className="text-xs text-gray-500 text-right">
                        Ref: <span className="font-mono font-medium text-gray-700">{formData.ref_number || 'Loading...'}</span>
                    </div>

                    {formData.is_letter && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Recipient Name</label>
                                <Input
                                    placeholder="e.g. Pengarah Hospital..."
                                    value={formData.recipient_name}
                                    onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                                <Textarea
                                    placeholder="Recipient's full address..."
                                    className="min-h-[60px] resize-none"
                                    value={formData.recipient_address}
                                    onChange={e => setFormData({ ...formData, recipient_address: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                            <select
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={formData.memo_type}
                                onChange={e => setFormData({ ...formData, memo_type: e.target.value as MemoType })}
                            >
                                <option value="announcement">Announcement</option>
                                <option value="event">Event</option>
                                <option value="emergency">Emergency</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="policy">Policy</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                            <select
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as MemoPriority })}
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
                        <Input
                            placeholder="Brief title of the announcement..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Content</label>
                        <div className="relative">
                            <Textarea
                                placeholder="Write your message here..."
                                className="min-h-[120px] resize-none pr-10"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-teal-600 rounded-full hover:bg-gray-100 transition-colors"
                                title="Voice Input (Coming Soon)"
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>All announcements require Hospital Admin approval before becoming visible to other departments.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                        <Button
                            variant="outline"
                            type="button"
                            disabled={!formData.title || !formData.content}
                            onClick={() => setShowPreview(true)}
                            className="border-primary-200 text-primary-700 hover:bg-primary-50"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                        </Button>
                        <Button disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                            {loading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Submit for Approval
                        </Button>
                    </div>
                </form>

                {/* Preview Modal */}
                {showPreview && (
                    <MemoDocumentView
                        isOpen={showPreview}
                        onClose={() => setShowPreview(false)}
                        memo={{
                            id: 'PREVIEW',
                            title: formData.title || 'Untitled Memo',
                            content: formData.content || 'No content provided.',
                            memo_type: formData.memo_type as any,
                            priority: formData.priority as any,
                            status: 'draft',
                            hospital_id: user?.hospital_id || '',
                            created_by: user?.id || '',
                            created_at: new Date().toISOString(),
                            publish_date: new Date().toISOString(),
                            // Preview Fields
                            is_letter: formData.is_letter,
                            ref_number: formData.ref_number,
                            recipient_name: formData.recipient_name,
                            recipient_address: formData.recipient_address,

                            created_by_user: {
                                full_name: user?.full_name || 'Your Name',
                                role: user?.role as any,
                                jawatan: (user as any)?.jawatan || 'Officer',
                                department: (user as any)?.department || { name: (user as any)?.department_name || 'Unit' }
                            } as any
                        } as any}
                    />
                )}
            </motion.div>
        </div>
    )
}

