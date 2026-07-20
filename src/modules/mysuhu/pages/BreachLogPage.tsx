// src/modules/mysuhu/pages/BreachLogPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  AlertTriangle, 
  Download, 
  Search,
  Filter,
  CheckCircle,
  Edit2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Spinner } from '@/components/ui'
import { getBreachLogs, getLokasi, annotateReading } from '@/modules/mysuhu/services/suhuService'
import { exportBreachLogsToCsv } from '@/modules/mysuhu/services/suhuReportService'
import type { BacaanSuhuWithRelations, Lokasi } from '@/types/mysuhu'
import { ROUTES } from '@/lib/constants'
import { format } from 'date-fns'

export const BreachLogPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hospitalId = user?.hospital_id || 'hosp-1'

  const [breaches, setBreaches] = useState<BacaanSuhuWithRelations[]>([])
  const [locations, setLocations] = useState<Lokasi[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Filters
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Correction Modal State
  const [showCorrectModal, setShowCorrectModal] = useState(false)
  const [correctReadingId, setCorrectReadingId] = useState<string | null>(null)
  const [correctNote, setCorrectNote] = useState('')

  const userRole = user?.role?.role_code || ''
  const isAdmin = ['system_admin', 'hospital_admin', 'hospital_administrator'].includes(userRole)
  const userDeptId = user?.department_id || ''

  const loadData = async () => {
    setLoading(true)
    try {
      const deptIdFilter = !isAdmin && userDeptId ? userDeptId : undefined
      const [logsRes, locsRes] = await Promise.all([
        getBreachLogs(hospitalId, startDate || undefined, endDate || undefined, deptIdFilter),
        getLokasi(hospitalId, deptIdFilter)
      ])
      setBreaches(logsRes.data || [])
      setLocations(locsRes.data || [])
    } catch (e) {
      console.error('Failed to load breach logs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate])

  const filteredBreaches = breaches.filter(b => {
    const matchesLocation = selectedLocation === 'all' || b.unit?.lokasi_id === selectedLocation
    const matchesSearch = 
      b.unit?.nama_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.unit?.unit_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.unit?.lokasi?.nama_lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nota?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.correction_note?.toLowerCase().includes(searchQuery.toLowerCase())
      
    return matchesLocation && matchesSearch
  })

  const handleCorrectSubmit = async () => {
    if (!correctReadingId || !correctNote.trim()) return
    setSubmitting(true)
    try {
      const res = await annotateReading(correctReadingId, correctNote)
      if (res.error) throw new Error(res.error)
      
      setShowCorrectModal(false)
      setCorrectReadingId(null)
      setCorrectNote('')
      
      // Reload logs
      const deptIdFilter = !isAdmin && userDeptId ? userDeptId : undefined
      const logsRes = await getBreachLogs(hospitalId, startDate || undefined, endDate || undefined, deptIdFilter)
      setBreaches(logsRes.data || [])
    } catch (e) {
      console.error('Failed to annotate log', e)
      alert('Failed to update corrective action.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportCsv = () => {
    if (filteredBreaches.length === 0) return
    exportBreachLogsToCsv(filteredBreaches)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Spinner size="lg" className="text-teal-600 mb-4" />
        <p className="text-sm font-medium">Loading Temperature Breach Logs...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-[#00a68a] to-emerald-500" />
        <div>
          <button 
            onClick={() => navigate(ROUTES.HUB_SUHU_DASHBOARD)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors mb-2 text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Temperature Breach Logs (Auditing Log)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Audit report list for equipment temperature readings outside safe thresholds (KKM / MSQH)
          </p>
        </div>

        <button 
          onClick={handleExportCsv}
          disabled={filteredBreaches.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-slate-550" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search unit, location, comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
            />
          </div>

          {/* Location and Date filters */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end text-xs">
            <div className="flex items-center gap-1.5 px-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Filters:</span>
            </div>

            {/* Location selector */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.nama_lokasi} ({loc.kod_lokasi})</option>
              ))}
            </select>

            {/* Date picking inputs */}
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#00a68a] text-xs font-semibold"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#00a68a] text-xs font-semibold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden p-6 shadow-xl">
        {filteredBreaches.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-slate-700 mb-1">Full Compliance Met</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Excellent! No temperature breach incidents recorded within your selected date range and search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Equipment (Unit ID)</th>
                  <th className="px-4 py-3">Physical Location</th>
                  <th className="px-4 py-3">Recorded Temp</th>
                  <th className="px-4 py-3">Threshold Range</th>
                  <th className="px-4 py-3">Incident Date & Time</th>
                  <th className="px-4 py-3">Comments / Notes</th>
                  <th className="px-4 py-3">Logged By</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBreaches.map((b, i) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <span 
                        onClick={() => navigate(`/suhu/unit/${b.unit_id}`)}
                        className="hover:underline hover:text-[#00a68a] cursor-pointer font-extrabold block"
                      >
                        {b.unit?.nama_unit}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{b.unit?.unit_id}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="text-slate-700">{b.unit?.lokasi?.nama_lokasi}</div>
                      <div className="text-[9px] text-slate-450">{b.unit?.lokasi?.jabatan}</div>
                    </td>
                    <td className="px-4 py-3 font-black text-rose-600 text-sm font-mono whitespace-nowrap">
                      {b.suhu.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {b.ambang?.min_suhu}°C to {b.ambang?.max_suhu}°C
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-semibold">
                      {format(new Date(b.tarikh_masa), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate font-medium text-slate-500" title={b.nota || ''}>
                      {b.is_corrected && (
                        <div className="text-[9px] text-rose-600 font-bold mb-0.5">[CORRECTIVE ACTION]</div>
                      )}
                      {b.nota || '—'}
                      {b.is_corrected && b.correction_note && (
                        <div className="text-[9px] text-slate-400 italic mt-0.5">Correction Note: {b.correction_note}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-semibold whitespace-nowrap">
                      {b.dicatat_oleh_user?.full_name || 'Duty Staff'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          setCorrectReadingId(b.id)
                          setCorrectNote(b.correction_note || '')
                          setShowCorrectModal(true)
                        }}
                        className="p-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-450 hover:text-slate-800 rounded-lg transition-colors shadow-sm"
                        title="Edit breach record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction Modal */}
      {showCorrectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-800">
            <h3 className="text-lg font-black text-slate-900 mb-3">Edit Temperature Breach Log</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-semibold">
              Documented breach records can be appended with official corrective actions or notes. The original log will be preserved for medical audit integrity.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Reason for Amendment / Corrective Action</label>
                <textarea 
                  required
                  placeholder="Specify corrective action (e.g. ice buildup cleaning, specimen transfer to backup unit)."
                  value={correctNote}
                  onChange={(e) => setCorrectNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4.5 py-3 text-xs text-slate-700 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/10 transition-colors h-24 resize-none font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowCorrectModal(false)
                  setCorrectReadingId(null)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCorrectSubmit}
                disabled={submitting || !correctNote.trim()}
                className="px-4 py-2 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Comments'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default BreachLogPage
