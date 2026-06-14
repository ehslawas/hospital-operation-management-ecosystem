import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bell,
    Megaphone,
    AlertTriangle,
    Calendar,
    Wrench,
    Info,
    Clock
} from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { MemoWithRelations, MemoType } from '@/types'
import { memoService } from '@/services/memoService'
import { useAuthStore } from '@/stores/authStore'
import { MemoDocumentView } from './MemoDocumentView'


interface MemoFeedProps {
    className?: string
    limit?: number
}

const MemoIcon = ({ type }: { type: MemoType }) => {
    switch (type) {
        case 'announcement': return <Megaphone className="w-4 h-4 text-blue-500" />
        case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-500" />
        case 'event': return <Calendar className="w-4 h-4 text-purple-500" />
        case 'maintenance': return <Wrench className="w-4 h-4 text-orange-500" />
        case 'stock_alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />
        case 'policy': return <Info className="w-4 h-4 text-gray-500" />
        default: return <Bell className="w-4 h-4 text-gray-500" />
    }
}

const MemoTypeBadge = ({ type }: { type: MemoType }) => {
    const styles = {
        announcement: 'bg-blue-50 text-blue-700 border-blue-200',
        emergency: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
        event: 'bg-purple-50 text-purple-700 border-purple-200',
        maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
        stock_alert: 'bg-amber-50 text-amber-700 border-amber-200',
        policy: 'bg-gray-50 text-gray-700 border-gray-200',
    }

    return (
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize flex items-center gap-1', styles[type] || styles.policy)}>
            <MemoIcon type={type} />
            {type.replace('_', ' ')}
        </span>
    )
}

export const MemoFeed: React.FC<MemoFeedProps> = ({ className, limit = 5 }) => {
    const { user } = useAuthStore()
    const [memos, setMemos] = useState<MemoWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | MemoType | 'urgent'>('all')
    const [selectedMemo, setSelectedMemo] = useState<MemoWithRelations | null>(null)


    const loadMemos = async () => {
        if (!user?.hospital_id) return
        setLoading(true)
        try {
            const { data } = await memoService.getMemos(user.hospital_id, 'approved')
            if (data) setMemos(data)
        } catch (err) {
            console.error('Failed to load memos', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMemos()
    }, [user?.hospital_id])

    const filteredMemos = memos.filter(memo => {
        if (filter === 'all') return true
        if (filter === 'urgent') return memo.priority === 'urgent' || memo.priority === 'high'
        return memo.memo_type === filter
    }).slice(0, limit)

    return (
        <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", className)}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-600" />
                    <span>Announcements & Board</span>
                </h2>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("text-xs h-7 px-2", filter === 'all' && "bg-gray-100")}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("text-xs h-7 px-2", filter === 'urgent' && "bg-red-50 text-red-600")}
                        onClick={() => setFilter('urgent')}
                    >
                        Urgent
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("text-xs h-7 px-2", filter === 'stock_alert' && "bg-amber-50 text-amber-600")}
                        onClick={() => setFilter('stock_alert')}
                    >
                        Stock
                    </Button>
                </div>
            </div>

            <div className="p-0">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Spinner size="md" />
                    </div>
                ) : filteredMemos.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No active announcements</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        <AnimatePresence>
                            {filteredMemos.map((memo) => (
                                <motion.div
                                    key={memo.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedMemo(memo)}
                                >

                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                                            {memo.title}
                                        </h3>
                                        <MemoTypeBadge type={memo.memo_type} />
                                    </div>

                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                        {memo.content}
                                    </p>

                                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(memo.created_at)}
                                            </span>
                                            <span>•</span>
                                            <span>{memo.created_by_user?.full_name}</span>
                                        </div>
                                        {memo.priority === 'urgent' && (
                                            <span className="text-red-500 font-bold flex items-center gap-0.5">
                                                <AlertTriangle className="w-3 h-3" /> Urgent
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {memos.length > limit && (
                <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                    <Button variant="ghost" className="w-full text-xs text-gray-500 h-8">
                        View All Announcements
                    </Button>
                </div>
            )}

            {/* Memo Document Viewer Modal */}
            {selectedMemo && (
                <MemoDocumentView
                    memo={selectedMemo}
                    isOpen={!!selectedMemo}
                    onClose={() => setSelectedMemo(null)}
                />
            )}
        </div>
    )
}

