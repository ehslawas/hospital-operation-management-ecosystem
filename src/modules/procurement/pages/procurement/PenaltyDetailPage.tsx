// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPenaltyById } from '@/services/pharmacy/penaltyService'
import { Spinner } from '@/components/ui'
import { CCPenaltyDetailPage } from './CCPenaltyDetailPage'
import { APPLPenaltyDetailPage } from './APPLPenaltyDetailPage'

export default function PenaltyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [penalty, setPenalty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadPenalty()
  }, [id])

  const loadPenalty = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getPenaltyById(id)
      if (res.error) throw new Error(res.error)
      setPenalty(res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load penalty')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" className="text-indigo-600" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Penalty Record...</p>
        </div>
      </div>
    )
  }

  if (error || !penalty) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h3 className="font-black text-slate-900">Penalty Not Found</h3>
          <p className="text-sm text-slate-500">{error || 'The requested penalty record could not be found.'}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
            â† Go Back
          </button>
        </div>
      </div>
    )
  }

  // Delegate to the correct detail page based on penalty_type
  if (penalty.penalty_type === 'appl') {
    return <APPLPenaltyDetailPage penalty={penalty} onRefresh={loadPenalty} />
  }

  // Default to CC for all other types (cc, late_delivery, etc.)
  return <CCPenaltyDetailPage penalty={penalty} onRefresh={loadPenalty} />
}
