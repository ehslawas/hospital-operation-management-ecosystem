// src/modules/mysuhu/pages/UnitDetailPage.tsx
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Thermometer, 
  Plus, 
  Calendar, 
  Download, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  FileText,
  AlertCircle,
  Edit2,
  Activity
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea 
} from 'recharts'
import { format, subDays, subHours } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import html2canvas from 'html2canvas'
import { Badge, Spinner } from '@/components/ui'
import { 
  getUnitPemantauan, 
  getReadings, 
  logTemperature, 
  annotateReading,
  calculateReadingStatus 
} from '@/modules/mysuhu/services/suhuService'
import { downloadPdfReport } from '@/modules/mysuhu/services/suhuReportService'
import type { UnitPemantauanWithRelations, BacaanSuhuWithRelations } from '@/types/mysuhu'
import { ROUTES } from '@/lib/constants'

export const UnitDetailPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const chartRef = useRef<HTMLDivElement>(null)

  const [unit, setUnit] = useState<UnitPemantauanWithRelations | null>(null)
  const [readings, setReadings] = useState<BacaanSuhuWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Date Range Filters
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'custom'>('7d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Logging Form State
  const [logTemp, setLogTemp] = useState<string>('')
  const [logDateTime, setLogDateTime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [logNota, setLogNota] = useState<string>('')
  const [showLogDrawer, setShowLogDrawer] = useState(false)
  const [showBreachModal, setShowBreachModal] = useState(false)
  const [breachInfo, setBreachInfo] = useState<{ temp: number; status: 'warning' | 'breach' } | null>(null)

  // Correction Modal State
  const [showCorrectModal, setShowCorrectModal] = useState(false)
  const [correctReadingId, setCorrectReadingId] = useState<string | null>(null)
  const [correctNote, setCorrectNote] = useState('')

  const loadData = async () => {
    if (!unitId) return
    setLoading(true)
    try {
      const [unitsRes, readingsRes] = await Promise.all([
        getUnitPemantauan(),
        getReadings(unitId)
      ])
      
      const foundUnit = unitsRes.data?.find(u => u.id === unitId) || null
      setUnit(foundUnit)
      setReadings(readingsRes.data || [])
    } catch (e) {
      console.error('Failed to load unit details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [unitId])

  // Get active date boundaries
  const getDateBoundaries = () => {
    const end = new Date()
    let start = subDays(end, 7)
    if (dateRange === '24h') {
      start = subHours(end, 24)
    } else if (dateRange === '30d') {
      start = subDays(end, 30)
    } else if (dateRange === 'custom' && customStartDate) {
      start = new Date(customStartDate)
    }
    
    const endBound = dateRange === 'custom' && customEndDate ? new Date(customEndDate) : end
    return { start, end: endBound }
  }

  const { start: dateStart, end: dateEnd } = getDateBoundaries()

  // Filter readings for chart and table
  const filteredReadings = readings.filter(r => {
    const rDate = new Date(r.tarikh_masa)
    return rDate >= dateStart && rDate <= dateEnd
  })

  // Format readings for charting
  const chartData = filteredReadings.map(r => ({
    timeStr: format(new Date(r.tarikh_masa), 'dd/MM HH:mm'),
    temp: r.suhu,
    minLimit: r.ambang?.min_suhu ?? unit?.active_threshold?.min_suhu ?? 0,
    maxLimit: r.ambang?.max_suhu ?? unit?.active_threshold?.max_suhu ?? 0,
    rawReading: r
  }))

  // Handle manual log submission pre-checks
  const handleLogPreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!logTemp || isNaN(Number(logTemp))) return
    
    const tempNum = Number(logTemp)
    const minSuhu = unit?.active_threshold?.min_suhu ?? 0
    const maxSuhu = unit?.active_threshold?.max_suhu ?? 0
    
    const status = calculateReadingStatus(tempNum, minSuhu, maxSuhu)
    
    if (status === 'breach' || status === 'warning') {
      setBreachInfo({ temp: tempNum, status })
      setShowBreachModal(true)
    } else {
      executeLogSubmit(tempNum)
    }
  }

  const executeLogSubmit = async (tempNum: number) => {
    if (!unitId || !user) return
    setSubmitting(true)
    
    try {
      const res = await logTemperature(
        unitId,
        tempNum,
        new Date(logDateTime).toISOString(),
        user.id,
        logNota.trim() || null
      )
      
      if (res.error) throw new Error(res.error)
      
      // Reset form states
      setLogTemp('')
      setLogNota('')
      setLogDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
      setShowLogDrawer(false)
      setShowBreachModal(false)
      
      // Reload logs
      await loadData()
    } catch (e) {
      console.error('Failed to log temperature', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle corrective action submission
  const handleCorrectionSubmit = async () => {
    if (!correctReadingId || !correctNote.trim()) return
    setSubmitting(true)
    try {
      const res = await annotateReading(correctReadingId, correctNote)
      if (res.error) throw new Error(res.error)
      
      setShowCorrectModal(false)
      setCorrectReadingId(null)
      setCorrectNote('')
      
      await loadData()
    } catch (e) {
      console.error('Failed to update temperature record', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle KKM MSQH PDF export
  const handleExportPdf = async () => {
    if (!unit || !chartRef.current) return
    setExporting(true)
    try {
      // 1. Compile charts/views using html2canvas
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      const chartImgBase64 = canvas.toDataURL('image/png')
      
      // 2. Build PDF Document
      await downloadPdfReport({
        unit,
        readings,
        chartImageBase64: chartImgBase64
      })
    } catch (e) {
      console.error('Failed to export PDF report', e)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Spinner size="lg" className="text-[#00a68a] mb-4" />
        <p className="text-sm font-medium">Loading unit analytical data...</p>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="text-center py-16 text-slate-550 bg-white border border-slate-100 rounded-3xl shadow-xl p-8">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-750">Unit Not Found</h3>
        <button onClick={() => navigate(ROUTES.HUB_SUHU_DASHBOARD)} className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow transition-all">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const minLimit = unit.active_threshold?.min_suhu ?? 0
  const maxLimit = unit.active_threshold?.max_suhu ?? 0

  return (
    <div className="w-full space-y-6">
      
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-[#00a68a] to-emerald-500" />
        <div>
          <button 
            onClick={() => navigate(ROUTES.HUB_SUHU_DASHBOARD)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-650 transition-colors mb-2 text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="gray" className="bg-slate-100 text-slate-600 border-transparent font-mono text-[9px] px-2 py-0.5 rounded-md">
              {unit.unit_id}
            </Badge>
            <h1 className="text-xl font-black text-slate-800">{unit.nama_unit}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Location: <span className="text-slate-605 font-bold">{unit.lokasi?.nama_lokasi}</span> &bull; 
            Equipment Type: <span className="text-slate-605 font-bold">{unit.jenis_unit.toUpperCase()}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-905 rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-450" />
            <span>{exporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          <button 
            onClick={() => setShowLogDrawer(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-xl text-xs font-black shadow-md shadow-teal-500/10 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Temperature</span>
          </button>
        </div>
      </div>

      {/* KPI Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Temp</span>
          <p className="text-3xl font-black font-mono text-slate-800 mt-2 tabular-nums">
            {unit.latest_reading ? `${unit.latest_reading.suhu.toFixed(1)}°C` : '—'}
          </p>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">
            {unit.latest_reading ? `Recorded: ${format(new Date(unit.latest_reading.tarikh_masa), 'dd/MM HH:mm')}` : 'No records'}
          </span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Threshold Limits</span>
          <p className="text-2xl font-black font-mono text-slate-800 mt-2">
            {minLimit}°C to {maxLimit}°C
          </p>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">Target Safe Bounds</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monitoring Status</span>
          <div className="mt-2.5">
            {unit.status_pemantauan === 'normal' && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/50 px-3 py-1 text-xs rounded-lg border font-black">
                ✅ NORMAL
              </Badge>
            )}
            {unit.status_pemantauan === 'warning' && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200/50 px-3 py-1 text-xs rounded-lg border font-black animate-pulse">
                ⚠️ WARNING
              </Badge>
            )}
            {unit.status_pemantauan === 'breach' && (
              <Badge className="bg-rose-50 text-rose-700 border-rose-200/50 px-3 py-1 text-xs rounded-lg border font-black animate-pulse">
                🔴 BREACH
              </Badge>
            )}
            {unit.status_pemantauan === 'no_reading' && (
              <Badge className="bg-slate-50 text-slate-400 border-slate-200 px-3 py-1 text-xs rounded-lg border font-black">
                ⌛ NO READING
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Log Integrity (&gt;4h)</span>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {unit.status_pemantauan === 'no_reading' ? '🔴 Deficit' : '✅ Maintained'}
          </p>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">Automatic 4-hour check</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <span>Temperature Timeline Analytics (°C)</span>
          </h3>

          {/* Date Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-100 p-1 border border-slate-200/60 rounded-xl flex gap-1 text-xs">
              {(['24h', '7d', '30d', 'custom'] as const).map(range => (
                <button 
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg transition-all font-bold ${dateRange === range ? 'bg-[#00a68a] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'Custom'}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#00a68a]"
                />
                <span className="text-slate-400 font-bold">to</span>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#00a68a]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Recharts Container */}
        {chartData.length === 0 ? (
          <div className="h-72 flex flex-col justify-center items-center text-slate-400 bg-slate-55 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">No temperature records logged for this range.</p>
          </div>
        ) : (
          <div ref={chartRef} className="h-72 w-full p-2 bg-slate-50/20 rounded-2xl border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="timeStr" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  domain={[(dataMin: number) => Math.floor(dataMin - 3), (dataMax: number) => Math.ceil(dataMax + 3)]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                  labelStyle={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '12px' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload.rawReading;
                      const status = data.status_bacaan;
                      
                      let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                      if (status === 'warning') badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
                      if (status === 'breach') badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';

                      return (
                        <div className="bg-white border border-slate-155 p-3.5 rounded-xl shadow-xl space-y-1">
                          <p className="text-[10px] text-slate-400 font-bold">{format(new Date(data.tarikh_masa), 'dd MMM yyyy, HH:mm')}</p>
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span className="text-sm font-black text-slate-800 font-mono">{data.suhu.toFixed(1)}°C</span>
                            <Badge className={`${badgeColor} text-[8px] font-bold px-1.5 py-0.2 border rounded-md`}>
                              {status.toUpperCase()}
                            </Badge>
                          </div>
                          {data.nota && <p className="text-[10px] text-slate-500 italic max-w-[200px]">Notes: {data.nota}</p>}
                          {data.is_corrected && (
                            <p className="text-[9px] text-rose-650 font-bold max-w-[200px]">
                              Correction: {data.correction_note}
                            </p>
                          )}
                          <p className="text-[9px] text-slate-400 mt-1">Logged By: {data.dicatat_oleh ? 'Authorized Staff' : '-'}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <ReferenceArea 
                  y1={minLimit} 
                  y2={maxLimit} 
                  fill="#10b981" 
                  fillOpacity={0.03} 
                />

                <Line 
                  type="monotone" 
                  dataKey="minLimit" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  strokeDasharray="5 5" 
                  dot={false}
                  activeDot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxLimit" 
                  stroke="#ef4444" 
                  strokeWidth={1.5} 
                  strokeDasharray="5 5" 
                  dot={false}
                  activeDot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#be184d" 
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#be184d', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, strokeWidth: 1 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Historical Logs List */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl overflow-hidden">
        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-slate-400" />
          <span>Temperature Log Records</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Date & Time Logged</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3">Target Range</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Comments / Notes</th>
                <th className="px-4 py-3">Logged By</th>
                <th className="px-4 py-3 text-right">Correct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReadings.map((reading, index) => {
                const status = reading.status_bacaan;
                let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
                if (status === 'warning') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/50';
                if (status === 'breach') badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/50';

                return (
                  <tr key={reading.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap text-slate-600">
                      {format(new Date(reading.tarikh_masa), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 font-black font-mono text-sm text-slate-800">
                      {reading.suhu.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">
                      {reading.ambang?.min_suhu}°C to {reading.ambang?.max_suhu}°C
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${badgeClass} text-[8px] font-bold px-1.5 py-0.2 border rounded-md`}>
                        {status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate font-medium text-slate-500" title={reading.nota || ''}>
                      {reading.is_corrected && (
                        <span className="text-rose-600 font-bold mr-1">[CORRECTED]</span>
                      )}
                      {reading.nota || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {reading.dicatat_oleh_user?.full_name || 'Authorized Staff'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          setCorrectReadingId(reading.id)
                          setCorrectNote(reading.correction_note || '')
                          setShowCorrectModal(true)
                        }}
                        className="p-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-450 hover:text-slate-700 rounded-lg transition-colors shadow-sm"
                        title="Annotate incorrect entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================
          MODALS & DRAWERS
      ============================================ */}

      {/* 1. Logging Drawer */}
      {showLogDrawer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white border-l border-slate-200 w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between text-slate-800">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-rose-650" />
                  <span>Log Temperature Reading</span>
                </h3>
                <button onClick={() => setShowLogDrawer(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">
                  Close
                </button>
              </div>

              <form onSubmit={handleLogPreSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Recorded Temp (°C)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    placeholder="e.g. 4.2"
                    value={logTemp}
                    onChange={(e) => setLogTemp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-colors font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Target range: {minLimit}°C to {maxLimit}°C</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Date & Time Logged</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={logDateTime}
                    onChange={(e) => setLogDateTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Logged By</label>
                  <input 
                    type="text" 
                    disabled
                    value={user?.full_name || 'Authorized Staff'}
                    className="w-full bg-slate-100 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Additional Notes / Comments (Optional)</label>
                  <textarea 
                    placeholder="Enter details like defrost cycle, door left open, etc."
                    value={logNota}
                    onChange={(e) => setLogNota(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-colors h-24 resize-none font-semibold"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-2xl font-bold transition-all shadow-md mt-4 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Log'}
                </button>
              </form>
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold text-center border-t border-slate-100 pt-4">
              Complies with hospital quality and MSQH standards.
            </p>
          </div>
        </div>
      )}

      {/* 2. Breach Modal */}
      {showBreachModal && breachInfo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 text-rose-650 mb-4 animate-bounce">
              <AlertTriangle className="w-10 h-10" />
              <h3 className="text-lg font-black text-slate-900 leading-tight">TEMPERATURE BREACH ALERT</h3>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-4 font-medium">
              The temperature you entered ({breachInfo.temp.toFixed(1)}°C) falls outside the designated safe target 
              range configured for this equipment ({minLimit}°C to {maxLimit}°C).
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5 text-xs text-slate-500 space-y-1.5">
              <p>&bull; Status: <span className="font-bold text-rose-600">{breachInfo.status.toUpperCase()}</span></p>
              <p>&bull; This event will be logged in the <span className="font-bold text-slate-700">Breach Auditing History Log</span>.</p>
              <p>&bull; Please ensure you log the reason or corrective actions taken in the comments.</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowBreachModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel & Edit
              </button>
              <button 
                onClick={() => executeLogSubmit(breachInfo.temp)}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {submitting ? 'Saving...' : 'Yes, Save Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Correction Modal */}
      {showCorrectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-800">
            <h3 className="text-lg font-black text-slate-900 mb-3">Annotate Incorrect Entry</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-semibold">
              Logs cannot be deleted in order to preserve the integrity of medical audit history. You may attach a formal correction annotation explaining the typo or physical adjustment.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Correction Reason / Corrective Action Comments</label>
                <textarea 
                  required
                  placeholder="Enter details like key-in typo (e.g. 44.0 corrected to 4.4) or manual calibration."
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
                onClick={handleCorrectionSubmit}
                disabled={submitting || !correctNote.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Annotation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default UnitDetailPage
