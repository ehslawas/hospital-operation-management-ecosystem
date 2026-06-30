// src/modules/mysuhu/pages/SuhuDashboardPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Thermometer, 
  AlertTriangle, 
  Activity, 
  CheckCircle,
  Clock, 
  Search,
  Filter,
  RefreshCw,
  Settings,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Spinner, SlideOver } from '@/components/ui'
import { getUnitPemantauan, getLokasi, createUnitPemantauan } from '@/modules/mysuhu/services/suhuService'
import type { UnitPemantauanWithRelations, Lokasi } from '@/types/mysuhu'
import { ROUTES } from '@/lib/constants'

export const SuhuDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hospitalId = user?.hospital_id || 'hosp-1'
  
  const [units, setUnits] = useState<UnitPemantauanWithRelations[]>([])
  const [locations, setLocations] = useState<Lokasi[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Drawer / Form state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [unitLocId, setUnitLocId] = useState('')
  const [unitName, setUnitName] = useState('')
  const [unitType, setUnitType] = useState<'refrigerator' | 'freezer' | 'ambient' | 'incubator' | 'other'>('refrigerator')
  const [minSuhu, setMinSuhu] = useState('2')
  const [maxSuhu, setMaxSuhu] = useState('8')
  const [unitNota, setUnitNota] = useState('')

  // Set default location when locations are fetched
  useEffect(() => {
    if (locations.length > 0 && !unitLocId) {
      setUnitLocId(locations[0].id)
    }
  }, [locations])

  // Threshold suggestions logic
  useEffect(() => {
    switch (unitType) {
      case 'freezer':
        setMinSuhu('-25')
        setMaxSuhu('-15')
        break
      case 'refrigerator':
        setMinSuhu('2')
        setMaxSuhu('8')
        break
      case 'ambient':
        setMinSuhu('18')
        setMaxSuhu('25')
        break
      case 'incubator':
        setMinSuhu('35')
        setMaxSuhu('39')
        break
      default:
        setMinSuhu('0')
        setMaxSuhu('40')
    }
  }, [unitType])

  const handleRegisterUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitName.trim() || !unitLocId) return

    const minVal = Number(minSuhu)
    const maxVal = Number(maxSuhu)

    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      alert('Minimum temperature must be less than maximum temperature!')
      return
    }

    setSubmitting(true)
    try {
      const newUnitId = 'SUHU-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      const res = await createUnitPemantauan(
        {
          lokasi_id: unitLocId,
          unit_id: newUnitId,
          nama_unit: unitName.trim(),
          jenis_unit: unitType,
          nota: unitNota.trim() || null,
          status: 'active',
          created_by: user?.id || null
        },
        minVal,
        maxVal
      )

      if (res.error) throw new Error(res.error)

      // Show success toast
      setSuccessMsg(`Unit ${unitName} successfully registered!`)
      setTimeout(() => {
        setSuccessMsg('')
      }, 4000)

      // Reset form states
      setUnitName('')
      setUnitNota('')
      setIsRegisterOpen(false)
      
      // Refresh dashboard list
      await fetchData(true)
    } catch (err) {
      console.error('Failed to register unit from dashboard drawer', err)
      alert(err instanceof Error ? err.message : 'Failed to register unit')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    
    try {
      const [unitsRes, locsRes] = await Promise.all([
        getUnitPemantauan(),
        getLokasi(hospitalId)
      ])
      
      setUnits(unitsRes.data || [])
      setLocations(locsRes.data || [])
    } catch (e) {
      console.error('Failed to load MySuhu dashboard data', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter logic
  const filteredUnits = units.filter(unit => {
    const matchesLocation = selectedLocation === 'all' || unit.lokasi_id === selectedLocation
    const matchesStatus = selectedStatus === 'all' || unit.status_pemantauan === selectedStatus
    const matchesSearch = 
      unit.nama_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.unit_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.lokasi?.nama_lokasi.toLowerCase().includes(searchQuery.toLowerCase())
      
    return matchesLocation && matchesStatus && matchesSearch
  })

  // Grouping by Location
  const unitsByLocation = filteredUnits.reduce((acc, unit) => {
    const locId = unit.lokasi_id
    const locName = unit.lokasi?.nama_lokasi || 'No Location'
    const locCode = unit.lokasi?.kod_lokasi || ''
    
    if (!acc[locId]) {
      acc[locId] = {
        name: locName,
        code: locCode,
        units: []
      }
    }
    acc[locId].units.push(unit)
    return acc;
  }, {} as Record<string, { name: string, code: string, units: UnitPemantauanWithRelations[] }>)

  // Global breach banner check
  const breachUnits = units.filter(u => u.status_pemantauan === 'breach' && u.status === 'active')
  const hasBreaches = breachUnits.length > 0

  // Count metrics
  const totalCount = units.length
  const normalCount = units.filter(u => u.status_pemantauan === 'normal').length
  const warningCount = units.filter(u => u.status_pemantauan === 'warning').length
  const breachCount = units.filter(u => u.status_pemantauan === 'breach').length
  const noReadingCount = units.filter(u => u.status_pemantauan === 'no_reading').length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Spinner size="lg" className="text-[#00a68a] mb-4" />
        <p className="text-sm font-medium">Loading Temperature Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Success Notification Alert */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 z-50 animate-slide-in border border-emerald-500 font-semibold text-sm">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Banner Alert if any breaches exist */}
      {hasBreaches && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-3xl flex items-start gap-3 shadow-lg transition-all animate-pulse">
          <AlertCircle className="w-5 h-5 mt-0.5 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-rose-900">ACTIVE TEMPERATURE BREACH ALERT</h4>
            <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
              There are {breachUnits.length} monitored equipment reporting readings outside safe threshold limits:
              <span className="font-bold text-rose-900 ml-1">
                {breachUnits.map(u => `${u.nama_unit} (${u.latest_reading?.suhu}°C)`).join(', ')}
              </span>.
              Please take corrective action (defrost cycle check, seal inspect) immediately.
            </p>
          </div>
          <button 
            onClick={() => navigate(ROUTES.HUB_SUHU_BREACHES)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
          >
            Investigate Logs
          </button>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-[#00a68a] to-emerald-500" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <span>Temperature Monitoring Dashboard</span>
            {refreshing && <RefreshCw className="w-4 h-4 text-[#00a68a] animate-spin" />}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Real-time status and temperature readings across all hospital units</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-3 bg-white border border-slate-200 text-slate-600 hover:text-[#00a68a] hover:border-[#00a68a]/30 rounded-xl transition-all shadow-sm hover:shadow-md"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Unit</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Units</span>
          <p className="text-3xl font-black font-mono text-slate-800 mt-2">{totalCount}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Normal</span>
          <p className="text-3xl font-black font-mono text-emerald-600 mt-2">{normalCount}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Warning</span>
          <p className="text-3xl font-black font-mono text-amber-600 mt-2">{warningCount}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-rose-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Breach</span>
          <p className="text-3xl font-black font-mono text-rose-600 mt-2">{breachCount}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-slate-400">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">No Readings</span>
          <p className="text-3xl font-black font-mono text-slate-500 mt-2">{noReadingCount}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search unit ID, name, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 px-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Filter:</span>
          </div>

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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="breach">Breach</option>
            <option value="no_reading">No Readings (&gt;4 Hours)</option>
          </select>
        </div>
      </div>

      {/* Main Content List */}
      {Object.keys(unitsByLocation).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <Thermometer className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-600 mb-1">No Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            There are no monitoring units matching your filter criteria. Adjust the filters or register a new unit.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(unitsByLocation).map(([locId, group]) => (
            <div key={locId} className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                <Badge variant="gray" className="bg-slate-100 border-transparent text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded-md">
                  {group.code}
                </Badge>
                <h3 className="text-base font-extrabold text-slate-800">{group.name}</h3>
                <span className="text-xs text-slate-400 font-bold">({group.units.length} Units)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.units.map(unit => {
                  const status = unit.status_pemantauan || 'no_reading'
                  const isNoReading = status === 'no_reading'
                  const latestTemp = unit.latest_reading?.suhu
                  const timestamp = unit.latest_reading?.tarikh_masa
                  
                  let statusBadgeText = 'NORMAL'
                  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                  let cardBorderClass = 'border-l-4 border-l-emerald-500'
                  
                  if (status === 'warning') {
                    statusBadgeText = 'WARNING'
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/50'
                    cardBorderClass = 'border-l-4 border-l-amber-500'
                  } else if (status === 'breach') {
                    statusBadgeText = 'BREACH'
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/50 animate-pulse'
                    cardBorderClass = 'border-l-4 border-l-rose-500'
                  } else if (status === 'no_reading') {
                    statusBadgeText = 'NO LOG'
                    badgeClass = 'bg-slate-50 text-slate-400 border-slate-200'
                    cardBorderClass = 'border-l-4 border-l-slate-300 border-dashed'
                  }

                  return (
                    <div 
                      key={unit.id}
                      onClick={() => navigate(`/suhu/unit/${unit.id}`)}
                      className={`bg-white hover:bg-slate-50/40 border border-slate-100 hover:border-[#00a68a]/30 rounded-3xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-44 shadow-sm hover:shadow-xl group relative overflow-hidden ${cardBorderClass}`}
                    >
                      {/* Top Row */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide block truncate">
                            {unit.unit_id}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-[#00a68a] transition-colors line-clamp-1">
                            {unit.nama_unit}
                          </h4>
                        </div>
                        <Badge className={`${badgeClass} text-[8px] font-black px-2 py-0.5 border rounded-lg flex-shrink-0`}>
                          {statusBadgeText}
                        </Badge>
                      </div>

                      {/* Temperature Value */}
                      <div className="my-2">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-3xl font-black font-mono tracking-tight text-slate-800 tabular-nums">
                            {isNoReading || latestTemp === undefined ? '—' : `${latestTemp.toFixed(1)}`}
                          </span>
                          {!isNoReading && latestTemp !== undefined && (
                            <span className="text-slate-400 text-xs font-bold">°C</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">
                          Threshold: {unit.active_threshold?.min_suhu}°C to {unit.active_threshold?.max_suhu}°C
                        </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          <span>
                            {timestamp 
                              ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                              : 'No Log'}
                          </span>
                        </div>
                        <span className="font-bold text-[#00a68a] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          Inspect &rarr;
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Unit Drawer */}
      <SlideOver
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Monitoring Unit"
        description="Configure a new equipment sensor for real-time temperature tracking"
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleRegisterUnit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Placement Location / Department
              </label>
              <select
                value={unitLocId}
                onChange={(e) => setUnitLocId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all"
              >
                <option value="" disabled>Select Location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nama_lokasi} ({loc.kod_lokasi})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Where this monitoring unit is physically situated.
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                What to Monitor (Equipment Name)
              </label>
              <input
                type="text"
                required
                placeholder="E.g. Vaccine Fridge A, Lab Freezer 2"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The specific refrigerator, freezer, or room to monitor.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Unit Type
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all"
                >
                  <option value="refrigerator">Refrigerator</option>
                  <option value="freezer">Freezer</option>
                  <option value="ambient">Room Temp (Ambient)</option>
                  <option value="incubator">Incubator</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Default limits
                </label>
                <div className="text-[10px] text-slate-500 bg-slate-100/60 border border-slate-200/50 rounded-2xl py-2.5 px-3 flex items-center justify-center font-bold h-[38px] text-center select-none">
                  Auto-applied
                </div>
              </div>
            </div>

            {/* Min / Max threshold inputs */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 border border-slate-200/65 rounded-2xl">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Min Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={minSuhu}
                  onChange={(e) => setMinSuhu(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Max Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={maxSuhu}
                  onChange={(e) => setMaxSuhu(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Equipment Note / Model (Optional)
              </label>
              <textarea
                placeholder="E.g. Sanyo Biomedical Freezer model MDF-U5312, SN: 849204"
                value={unitNota}
                onChange={(e) => setUnitNota(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 h-20 resize-none focus:outline-none focus:border-[#00a68a] focus:ring-2 focus:ring-[#00a68a]/10 transition-all font-semibold"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-2xl text-xs font-black transition-colors shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Register Unit'}
              </button>
            </div>
          </form>
        </div>
      </SlideOver>
    </div>
  )
}

export default SuhuDashboardPage
