// src/modules/myporter/components/HandoverVerificationModal.tsx
import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  X, 
  PenTool, 
  RotateCcw, 
  Star, 
  ShieldCheck, 
  User, 
  FileText 
} from 'lucide-react'
import type { PorterJobRequest, HandoverProof, PorterRating } from '@/shared/types/myporter'
import { Button, Input } from '@/components/ui'

interface Props {
  job: PorterJobRequest | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (jobId: string, proof: HandoverProof, rating?: PorterRating) => void
}

export const HandoverVerificationModal: React.FC<Props> = ({
  job,
  isOpen,
  onClose,
  onSubmit
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  // Recipient form state
  const [recipientName, setRecipientName] = useState('')
  const [recipientStaffId, setRecipientStaffId] = useState('')
  const [recipientJawatan, setRecipientJawatan] = useState('Jururawat U29')
  const [handoverNotes, setHandoverNotes] = useState('')

  // Rating state
  const [stars, setStars] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>(['Pantas', 'Cermat', 'Sopan'])

  const availableTags = ['Pantas', 'Cermat', 'Sopan', 'Patuh SOP', 'Tiba Tepat Masa', 'Bantuan Tambahan']

  useEffect(() => {
    if (isOpen && job) {
      setRecipientName(job.recipient_name || '')
      setHasSignature(false)
      setHandoverNotes('')
      setStars(5)
      clearSignature()
    }
  }, [isOpen, job?.id])

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      setHasSignature(false)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'
    setIsDrawing(true)
    setHasSignature(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return

    let sigDataUrl = ''
    if (canvasRef.current && hasSignature) {
      sigDataUrl = canvasRef.current.toDataURL('image/png')
    }

    const proof: HandoverProof = {
      proof_type: 'signature',
      recipient_name: recipientName || 'Kakitangan Penerima',
      recipient_staff_id: recipientStaffId || 'STF-UNKNOWN',
      recipient_jawatan: recipientJawatan,
      signature_url: sigDataUrl,
      timestamp: new Date().toISOString(),
      notes: handoverNotes
    }

    const rating: PorterRating = {
      rating_stars: stars,
      timeliness_score: stars,
      feedback_tags: selectedTags,
      rated_by_user_id: recipientStaffId || 'user-recipient',
      rated_at: new Date().toISOString()
    }

    onSubmit(job.id, proof, rating)
    onClose()
  }

  if (!isOpen || !job) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Pengesahan Penerimaan Kargo/Pesakit</h3>
                <p className="text-xs text-white/80">No Rujukan: {job.no_rujukan}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Task Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">{job.sub_category || job.category}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                  PPK: {job.assigned_porter_name || 'Porter'}
                </span>
              </div>
              <p className="text-slate-500">
                Dari: <span className="font-semibold text-slate-700">{job.origin_department_name}</span> ➔ Ke: <span className="font-semibold text-slate-700">{job.destination_department_name}</span>
              </p>
            </div>

            {/* Recipient Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maklumat Pegawai / Kakitangan Penerima</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penerima *</label>
                  <Input
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="cth: SN Halimah binti Kassim"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Pekerja / No. Kad Pengenalan *</label>
                  <Input
                    required
                    value={recipientStaffId}
                    onChange={(e) => setRecipientStaffId(e.target.value)}
                    placeholder="cth: STF-40192 / 8801..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jawatan & Gred</label>
                <Input
                  value={recipientJawatan}
                  onChange={(e) => setRecipientJawatan(e.target.value)}
                  placeholder="cth: Jururawat U29 / JTMP U29 / Pegawai Perubatan UD43"
                />
              </div>
            </div>

            {/* Digital Signature Pad */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  Tandatangan Digital Penerima
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Padam Semula
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-1 bg-slate-50 relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] bg-white rounded-xl touch-none cursor-crosshair"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                    Sila turunkan tandatangan di sini
                  </div>
                )}
              </div>
            </div>

            {/* Rating PPK */}
            <div className="space-y-3 p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Penilaian Khidmat PPK</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= stars ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Selector */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        active
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold shadow-lg rounded-2xl flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Sahkan Penerimaan & Selesaikan Tugasan</span>
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
