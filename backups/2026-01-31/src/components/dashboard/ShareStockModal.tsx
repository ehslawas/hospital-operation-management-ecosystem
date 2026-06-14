import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send, AlertOctagon } from 'lucide-react'
import { Button, Textarea, Spinner } from '@/components/ui'
import { memoService } from '@/services/memoService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Memo } from '@/types'

interface ShareStockModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (memo: Memo) => void
}

export const ShareStockModal: React.FC<ShareStockModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(true)
    const [content, setContent] = useState('')

    useEffect(() => {
        if (isOpen && user?.hospital_id) {
            generateStockReport()
        }
    }, [isOpen, user?.hospital_id])

    const generateStockReport = async () => {
        setFetchingData(true)
        try {
            const template = `URGENT STOCK ALERT:\n\nThe following items are CRITICALLY LOW or OUT OF STOCK:\n\n1. [Drug Name] - [Qty] left\n2. [Drug Name] - [Qty] left\n\nPlease place urgent orders if necessary or advise doctors on alternatives.`
            setContent(template)
        } finally {
            setFetchingData(false)
        }
    }

    const handleSubmit = async () => {
        if (!user?.hospital_id || !content) return

        setLoading(true)
        try {
            const { data, error } = await memoService.createMemo({
                hospital_id: user.hospital_id,
                title: 'Pharmacy Stock Alert',
                content: content,
                memo_type: 'stock_alert',
                priority: 'urgent',
                target_departments: ['all']
            })

            if (error) throw error

            toast.success('Alert Created', 'Stock alert created successfully')
            onSuccess?.(data!)
            onClose()
        } catch (err) {
            console.error(err)
            toast.error('Error', 'Failed to post alert')
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
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border-t-4 border-amber-500"
            >
                <div className="border-b px-6 py-4 flex items-center justify-between bg-amber-50">
                    <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-amber-600" />
                        Share Stock Criticality
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0 hover:bg-amber-100/50">
                        <X className="w-4 h-4 text-amber-900" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Use this form to quickly broadcast low stock or out-of-stock items to the entire hospital.
                    </p>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Alert Message</label>
                        {fetchingData ? (
                            <div className="h-32 bg-gray-50 animate-pulse rounded-lg" />
                        ) : (
                            <Textarea
                                placeholder="List critical items..."
                                className="min-h-[150px] font-mono text-sm bg-amber-50/30 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            disabled={loading || fetchingData}
                            onClick={handleSubmit}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {loading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Broadcast Alert
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
