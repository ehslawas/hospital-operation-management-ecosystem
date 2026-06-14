import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '@/components/ui'

import { format } from 'date-fns'
import { Check, Calendar, Clock, AlertCircle } from 'lucide-react'

interface SupplierAssessmentModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (assessmentData: any) => void
    supplierName: string
    lpoNumber: string
    details: {
        orderDate: string
        receivedDate: string
        isLate: boolean
        daysLate: number
        totalAmount: number
    }
}

const CRITERIA = [
    {
        id: 'support',
        title: '1) Khidmat Sokongan',
        description: 'Support Service',
        aspects: [
            'Maklum balas pelawaan tawaran harga',
            'Penjanaan DO dalam tempoh yang telah ditetapkan',
            'Pemberian LOU bagi produk bertarikh luput pendek'
        ]
    },
    {
        id: 'quality',
        title: '2) Kualiti',
        description: 'Quality',
        aspects: [
            'Spesifikasi produk',
            'Kualiti (produk/pembungkusan/pelabelan)',
            'Kuantiti pesanan',
            'Baki jangka hayat produk'
        ]
    },
    {
        id: 'delivery',
        title: '3) Tempoh Penghantaran/Perkhidmatan',
        description: 'Delivery Time / Service',
        aspects: [
            'Mengikut tempoh pesanan/ perjanjian kontrak',
            'Waktu penghantaran',
            'Perkhidmatan penghantaran'
        ]
    }
]

export function SupplierAssessmentModal({ isOpen, onClose, onConfirm, supplierName, lpoNumber, details }: SupplierAssessmentModalProps) {
    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [totalScore, setTotalScore] = useState(0)
    const [percentage, setPercentage] = useState(0)

    useEffect(() => {
        if (isOpen) {
            setRatings({})
            setTotalScore(0)
            setPercentage(0)
        }
    }, [isOpen])

    useEffect(() => {
        const score = Object.values(ratings).reduce((a, b) => a + b, 0)
        setTotalScore(score)
        // Max score = 5 * 3 = 15
        const pct = (score / 15) * 100
        setPercentage(Math.round(pct))
    }, [ratings])

    const handleRate = (criteriaId: string, value: number) => {
        setRatings(prev => ({ ...prev, [criteriaId]: value }))
    }

    const getLevel = (pct: number) => {
        if (pct === 0 && Object.keys(ratings).length === 0) return { label: '-', color: 'text-slate-400', bg: 'bg-slate-100' }
        if (pct >= 90) return { label: 'Sangat Memuaskan', color: 'text-emerald-600', bg: 'bg-emerald-50' }
        if (pct >= 70) return { label: 'Memuaskan', color: 'text-blue-600', bg: 'bg-blue-50' }
        return { label: 'Tidak Memuaskan', color: 'text-red-600', bg: 'bg-red-50' }
    }

    const level = getLevel(percentage)
    const isComplete = Object.keys(ratings).length === 3

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} size="xl">
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[20px] w-full">
                <DialogHeader className="p-8 pb-6 bg-white border-b border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-slate-900 mb-1">
                                Penilaian Prestasi Pembekal
                            </DialogTitle>
                            <p className="text-sm text-slate-500">Supplier Performance Assessment</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">{supplierName}</p>
                            <div className="flex items-center justify-end gap-2 text-slate-500">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{lpoNumber}</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Date</span>
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {details.orderDate ? format(new Date(details.orderDate), 'dd/MM/yyyy') : '-'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Received Date</span>
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {details.receivedDate ? format(new Date(details.receivedDate), 'dd/MM/yyyy') : '-'}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivery Status</span>
                            <div>
                                {details.isLate ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                        <AlertCircle className="w-3 h-3" />
                                        Late ({details.daysLate} days)
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <Check className="w-3 h-3" />
                                        On Time
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Amount</span>
                            <div className="font-mono font-bold text-slate-900 text-lg">
                                RM {details.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-slate-50/50">
                    {/* Performance Summary Banner */}
                    <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm ${level.bg} border-transparent transition-all duration-300`}>
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Performance Level</p>
                            <h3 className={`text-3xl font-bold tracking-tight ${level.color}`}>{level.label}</h3>
                            <p className="text-xs opacity-70 mt-1">Based on the criteria evaluation</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Total Score</p>
                            <div className="flex items-baseline justify-end gap-2">
                                <span className={`text-5xl font-black ${level.color} drop-shadow-sm`}>{percentage}%</span>
                                <div className="flex flex-col items-start translate-y-1">
                                    <span className="text-sm font-bold opacity-80">{totalScore}/15</span>
                                    <span className="text-[10px] uppercase font-bold opacity-50">Points</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Criteria List */}
                    <div className="grid gap-4">
                        {CRITERIA.map((criteria) => (
                            <div key={criteria.id} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-[3]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                                                {criteria.title.charAt(0)}
                                            </div>
                                            <h4 className="font-bold text-lg text-slate-900">{criteria.title.substring(3)}</h4>
                                        </div>

                                        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                Evaluation Aspects
                                            </p>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                                {criteria.aspects.map((aspect, idx) => (
                                                    <li key={idx} className="text-xs font-medium text-slate-600 flex items-start gap-2">
                                                        <Check className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                                                        {aspect}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex-[2] flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm font-bold text-slate-700">Rate Performance</p>
                                            {ratings[criteria.id] && (
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    Rated: {ratings[criteria.id]}/5
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-5 gap-3">
                                            {[1, 2, 3, 4, 5].map((score) => (
                                                <button
                                                    key={score}
                                                    onClick={() => handleRate(criteria.id, score)}
                                                    className={`
                                                        aspect-square rounded-xl font-bold text-lg transition-all duration-200
                                                        flex flex-col items-center justify-center gap-1 relative
                                                        group
                                                        ${ratings[criteria.id] === score
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10 ring-4 ring-blue-50'
                                                            : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'}
                                                    `}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3 px-1 uppercase tracking-wider">
                                            <span>Poor</span>
                                            <span>Excellent</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-20 relative">
                    <Button variant="ghost" onClick={onClose} className="h-12 hover:bg-slate-50 text-slate-500">
                        Cancel Not Now
                    </Button>
                    <Button
                        onClick={() => onConfirm({ ratings, totalScore, percentage, level: level.label })}
                        disabled={!isComplete}
                        className={`h-12 px-8 font-bold rounded-xl transition-all ${isComplete ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-300'}`}
                    >
                        Proceed to Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
