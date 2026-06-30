// src/modules/mysuhu/pages/AdminSetupPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Settings, 
  MapPin, 
  Thermometer, 
  Plus, 
  Edit2, 
  Save, 
  Power,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Spinner } from '@/components/ui'
import { 
  getLokasi, 
  createLokasi, 
  updateLokasi,
  getUnitPemantauan, 
  createUnitPemantauan, 
  updateUnitPemantauan,
  updateThresholdConfig 
} from '@/modules/mysuhu/services/suhuService'
import type { Lokasi, UnitPemantauanWithRelations } from '@/types/mysuhu'
import { ROUTES } from '@/lib/constants'

export const AdminSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hospitalId = user?.hospital_id || 'hosp-1'
  
  const [activeTab, setActiveTab] = useState<'units' | 'locations'>('units')
  const [locations, setLocations] = useState<Lokasi[]>([])
  const [units, setUnits] = useState<UnitPemantauanWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Form States - Location
  const [locName, setLocName] = useState('')
  const [locDept, setLocDept] = useState('Pharmacy')
  const [locDesc, setLocDesc] = useState('')

  // Form States - Unit
  const [unitName, setUnitName] = useState('')
  const [unitLocId, setUnitLocId] = useState('')
  const [unitType, setUnitType] = useState<'freezer' | 'refrigerator' | 'ambient' | 'incubator' | 'other'>('refrigerator')
  const [unitNota, setUnitNota] = useState('')
  
  // Custom Threshold fields (suggested defaults based on Type)
  const [minSuhu, setMinSuhu] = useState<string>('2')
  const [maxSuhu, setMaxSuhu] = useState<string>('8')

  // Edit Threshold Modal
  const [showThresholdModal, setShowThresholdModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitPemantauanWithRelations | null>(null)
  const [editMinTemp, setEditMinTemp] = useState('')
  const [editMaxTemp, setEditMaxTemp] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [locsRes, unitsRes] = await Promise.all([
        getLokasi(hospitalId),
        getUnitPemantauan()
      ])
      setLocations(locsRes.data || [])
      setUnits(unitsRes.data || [])
      
      if (locsRes.data && locsRes.data.length > 0) {
        setUnitLocId(locsRes.data[0].id)
      }
    } catch (e) {
      console.error('Failed to load setup configurations', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto threshold suggestions
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

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => {
      setSuccessMsg('')
    }, 4000)
  }

  // Submit new Location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locName.trim()) return
    setSubmitting(true)
    
    try {
      const newLocCode = 'LOC-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      const res = await createLokasi({
        kod_lokasi: newLocCode,
        nama_lokasi: locName.trim(),
        jabatan: locDept,
        deskripsi: locDesc.trim() || null,
        status: 'active',
        hospital_id: hospitalId,
        created_by: user?.id || null
      })

      if (res.error) throw new Error(res.error)
      
      triggerNotification(`Location ${locName} successfully registered!`)
      setLocName('')
      setLocDesc('')
      await loadData()
    } catch (e) {
      console.error('Failed to add location', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Location status
  const handleToggleLocationStatus = async (loc: Lokasi) => {
    const nextStatus = loc.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await updateLokasi(loc.id, { status: nextStatus })
      if (res.error) throw new Error(res.error)
      
      triggerNotification(`Location ${loc.nama_lokasi} is now ${nextStatus === 'active' ? 'ACTIVE' : 'INACTIVE'}.`)
      await loadData()
    } catch (e) {
      console.error('Failed to toggle location status', e)
    }
  }

  // Submit new Monitoring Unit
  const handleAddUnit = async (e: React.FormEvent) => {
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
      
      triggerNotification(`Unit ${unitName} successfully registered!`)
      setUnitName('')
      setUnitNota('')
      await loadData()
    } catch (e) {
      console.error('Failed to register unit', e)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Unit status
  const handleToggleUnitStatus = async (unit: UnitPemantauanWithRelations) => {
    const nextStatus = unit.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await updateUnitPemantauan(unit.id, { status: nextStatus })
      if (res.error) throw new Error(res.error)
      
      triggerNotification(`Unit ${unit.nama_unit} is now ${nextStatus === 'active' ? 'ACTIVE' : 'INACTIVE'}.`)
      await loadData()
    } catch (e) {
      console.error('Failed to toggle unit status', e)
    }
  }

  // Save updated Threshold values
  const handleSaveThreshold = async () => {
    if (!selectedUnit || !user) return
    const minVal = Number(editMinTemp)
    const maxVal = Number(editMaxTemp)

    if (isNaN(minVal) || isNaN(maxVal) || minVal >= maxVal) {
      alert('Minimum temperature must be less than maximum temperature!')
      return
    }

    setSubmitting(true)
    try {
      const res = await updateThresholdConfig(selectedUnit.id, minVal, maxVal, user.id)
      if (res.error) throw new Error(res.error)
      
      triggerNotification(`Threshold limits for ${selectedUnit.unit_id} successfully updated!`)
      setShowThresholdModal(false)
      setSelectedUnit(null)
      
      const unitsRes = await getUnitPemantauan()
      setUnits(unitsRes.data || [])
    } catch (e) {
      console.error('Failed to update threshold values', e)
      alert('Failed to update threshold limits.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Spinner size="lg" className="text-teal-600 mb-4" />
        <p className="text-sm font-medium">Loading System Configurations...</p>
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
            <Settings className="w-5 h-5 text-slate-500" />
            <span>Configuration & Unit Registration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Register new clinical locations, monitor refrigerator/freezer units, and customize clinical safety temperature thresholds.
          </p>
        </div>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('units')}
          className={`pb-3 text-sm font-extrabold transition-all relative ${activeTab === 'units' ? 'text-[#00a68a] border-b-2 border-[#00a68a]' : 'text-slate-400 hover:text-slate-700'}`}
        >
          Unit Registration & Settings ({units.length})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-3 text-sm font-extrabold transition-all relative ${activeTab === 'locations' ? 'text-[#00a68a] border-b-2 border-[#00a68a]' : 'text-slate-400 hover:text-slate-700'}`}
        >
          Physical Location Registration ({locations.length})
        </button>
      </div>

      {/* Tab Content: Units */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Add form */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-[#00a68a]" />
              <span>Register Monitoring Unit</span>
            </h3>

            {locations.length === 0 ? (
              <div className="bg-amber-50 border border-amber-250 text-amber-800 p-4 rounded-2xl text-xs space-y-2 font-semibold">
                <Info className="w-4 h-4 text-amber-600" />
                <p>You must register at least one **Location** first before registering a monitoring unit.</p>
                <button onClick={() => setActiveTab('locations')} className="mt-2 text-[#00a68a] underline font-bold">
                  Register Location Now &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddUnit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Monitoring Unit Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Freezer 1"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00a68a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Placement Location</label>
                  <select
                    value={unitLocId}
                    onChange={(e) => setUnitLocId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-600 font-semibold focus:outline-none"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.nama_lokasi} ({loc.kod_lokasi})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Unit Type</label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-600 font-semibold focus:outline-none"
                    >
                      <option value="refrigerator">Refrigerator</option>
                      <option value="freezer">Freezer</option>
                      <option value="ambient">Room Temp (Ambient)</option>
                      <option value="incubator">Incubator</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Default Threshold</label>
                    <Badge variant="gray" className="text-[8px] bg-slate-100 text-slate-500 font-black border-transparent py-2.5 w-full justify-center rounded-xl">
                      Autofill Threshold Limits
                    </Badge>
                  </div>
                </div>

                {/* Min / Max threshold inputs */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Min Temp (°C)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      required
                      value={minSuhu}
                      onChange={(e) => setMinSuhu(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Max Temp (°C)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      required
                      value={maxSuhu}
                      onChange={(e) => setMaxSuhu(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00a68a] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Equipment Note / Model (Optional)</label>
                  <textarea 
                    placeholder="Brand model, serial number, etc."
                    value={unitNota}
                    onChange={(e) => setUnitNota(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 h-20 resize-none focus:outline-none focus:border-[#00a68a] font-semibold"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-2xl text-xs font-black transition-colors shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Register Unit'}
                </button>
              </form>
            )}
          </div>

          {/* Right panel: Unit List */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 lg:col-span-2 overflow-hidden shadow-xl">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Thermometer className="w-5 h-5 text-[#00a68a]" />
              <span>Active Monitoring Units</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Equipment ID</th>
                    <th className="px-4 py-3">Unit Name</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Threshold Range</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">{u.unit_id}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-850">{u.nama_unit}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-700">{u.lokasi?.nama_lokasi}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{u.jenis_unit}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">
                        {u.active_threshold 
                          ? `${u.active_threshold.min_suhu}°C to ${u.active_threshold.max_suhu}°C`
                          : 'Not Set'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[8px] font-black border rounded-md px-2 py-0.5 ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                          {u.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUnit(u)
                              setEditMinTemp(String(u.active_threshold?.min_suhu ?? '0'))
                              setEditMaxTemp(String(u.active_threshold?.max_suhu ?? '0'))
                              setShowThresholdModal(true)
                            }}
                            className="p-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-450 hover:text-slate-700 rounded-lg transition-colors shadow-sm"
                            title="Edit Temperature Threshold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUnitStatus(u)}
                            className={`p-1.5 border rounded-lg transition-colors shadow-sm ${u.status === 'active' ? 'bg-white border-slate-200 text-slate-450 hover:text-rose-600 hover:border-rose-200' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}`}
                            title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Locations */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Add form */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl h-fit">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-[#00a68a]" />
              <span>Register New Location</span>
            </h3>

            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Physical Location Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. Vaccine Room 1"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#00a68a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Owner Department</label>
                <select
                  value={locDept}
                  onChange={(e) => setLocDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-600 font-semibold focus:outline-none"
                >
                  <option value="Pharmacy">Pharmacy Logistics</option>
                  <option value="Pathology">Pathology Laboratory</option>
                  <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology (O&G)</option>
                  <option value="Emergency">Emergency Department</option>
                  <option value="Other">Other Departments</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Brief Description (Optional)</label>
                <textarea 
                  placeholder="Details of physical placement location."
                  value={locDesc}
                  onChange={(e) => setLocDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 h-24 resize-none focus:outline-none focus:border-[#00a68a] font-semibold"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-2xl text-xs font-black transition-all shadow-lg"
              >
                {submitting ? 'Saving...' : 'Register Location'}
              </button>
            </form>
          </div>

          {/* Right panel: Locations list */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 lg:col-span-2 overflow-hidden shadow-xl">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-[#00a68a]" />
              <span>Physical Locations List</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Location Code</th>
                    <th className="px-4 py-3">Location Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">{loc.kod_lokasi}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-800">{loc.nama_lokasi}</td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{loc.jabatan}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-500 font-medium" title={loc.deskripsi || ''}>
                        {loc.deskripsi || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[8px] font-black border rounded-md px-2 py-0.5 ${loc.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                          {loc.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleLocationStatus(loc)}
                          className={`p-1.5 border rounded-lg transition-colors shadow-sm ${loc.status === 'active' ? 'bg-white border-slate-200 text-slate-450 hover:text-rose-600 hover:border-rose-200' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}`}
                          title={loc.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Threshold configuration edit Modal */}
      {showThresholdModal && selectedUnit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-800">
            <h3 className="text-lg font-black text-slate-900 mb-2">Edit Temperature Threshold</h3>
            <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
              You are updating the clinical safe temperature range settings for <span className="font-bold text-[#00a68a]">{selectedUnit.nama_unit} ({selectedUnit.unit_id})</span>.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Minimum Temp Limit (°C)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={editMinTemp}
                  onChange={(e) => setEditMinTemp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#00a68a] font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Maximum Temp Limit (°C)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={editMaxTemp}
                  onChange={(e) => setEditMaxTemp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#00a68a] font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowThresholdModal(false)
                  setSelectedUnit(null)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveThreshold}
                disabled={submitting}
                className="px-4 py-2 bg-[#00a68a] hover:bg-[#008f76] text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {submitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminSetupPage
