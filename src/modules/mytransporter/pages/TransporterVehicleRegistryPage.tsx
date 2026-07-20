// src/modules/mytransporter/pages/TransporterVehicleRegistryPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Car, 
  Plus, 
  Edit, 
  Check, 
  AlertTriangle,
  FileText,
  Calendar,
  Settings,
  Truck,
  Trash2
} from 'lucide-react'
import { Ambulance } from '../components/AmbulanceIcon'

import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { 
  getVehicles, 
  registerVehicle, 
  updateVehicle 
} from '../services/transporterService'
import type { TransportVehicle, StatusKenderaan, JenisKenderaan } from '@/shared/types/mytransporter'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input,
  Badge,
  Modal
} from '@/components/ui'

const TransporterVehicleRegistryPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [vehicles, setVehicles] = useState<TransportVehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Modal registration states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fields
  const [noKenderaan, setNoKenderaan] = useState('')
  const [noChasis, setNoChasis] = useState('')
  const [jenisKenderaan, setJenisKenderaan] = useState<JenisKenderaan>('ambulance')
  const [model, setModel] = useState('')
  const [cukaiJalan, setCukaiJalan] = useState('')
  const [status, setStatus] = useState<StatusKenderaan>('active')
  const [fotoKenderaan, setFotoKenderaan] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoKenderaan(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const res = await getVehicles()
      if (res.data) setVehicles(res.data)
    } catch (err: any) {
      toast.error('Gagal Memuatkan Kenderaan', err.message || 'Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleOpenCreate = () => {
    setModalMode('create')
    setEditingId(null)
    setNoKenderaan('')
    setNoChasis('')
    setJenisKenderaan('ambulance')
    setModel('')
    setCukaiJalan('')
    setStatus('active')
    setFotoKenderaan('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (v: TransportVehicle) => {
    setModalMode('edit')
    setEditingId(v.id)
    setNoKenderaan(v.no_kenderaan)
    setNoChasis(v.no_chasis)
    setJenisKenderaan(v.jenis_kenderaan)
    setModel(v.model)
    setCukaiJalan(v.tarikh_tamat_cukai_jalan)
    setStatus(v.status)
    setFotoKenderaan(v.foto_kenderaan || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!noKenderaan || !noChasis || !model || !cukaiJalan) {
      toast.error('Borang Tidak Lengkap', 'Sila isi semua butiran kenderaan.')
      return
    }

    const hospitalId = loggedUser?.hospital_id || 'hosp-1'

    try {
      const payload = {
        no_kenderaan: noKenderaan.toUpperCase(),
        no_chasis: noChasis.toUpperCase(),
        jenis_kenderaan: jenisKenderaan,
        model: model,
        tarikh_tamat_cukai_jalan: cukaiJalan,
        status: status,
        hospital_id: hospitalId,
        foto_kenderaan: fotoKenderaan || undefined
      }

      if (modalMode === 'create') {
        const res = await registerVehicle(payload)
        if (res.error) throw new Error(res.error)
        toast.success('Pendaftaran Berjaya', `Kenderaan ${noKenderaan} berjaya didaftarkan.`)
      } else {
        const res = await updateVehicle(editingId!, payload)
        if (res.error) throw new Error(res.error)
        toast.success('Kemaskini Berjaya', `Butiran kenderaan ${noKenderaan} berjaya dikemaskini.`)
      }

      setIsModalOpen(false)
      fetchVehicles()
    } catch (err: any) {
      toast.error('Gagal Menyimpan Kenderaan', err.message || 'Sila cuba lagi.')
    }
  }

  return (
    <div className="w-full p-6 md:p-8 space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/transporter/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Papan Pemuka</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-8 h-8 text-indigo-600" />
            Daftar & Pengurusan Kenderaan (Fleet Registry)
          </h1>
          <p className="text-slate-500 text-sm">
            Daftar ambulans ICU, ambulans am, dan kereta jabatan hospital. Pantau status penyelenggaraan serta cukai jalan.
          </p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Daftar Kenderaan</span>
        </Button>
      </div>

      {/* Fleet Table Card */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Memuatkan senarai kenderaan...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Tiada kenderaan berdaftar dalam hospital anda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Kenderaan / No. Plat</th>
                    <th className="px-6 py-4">Model Kenderaan</th>
                    <th className="px-6 py-4">No. Chasis</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Tamat Cukai Jalan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {v.foto_kenderaan ? (
                            <img 
                              src={v.foto_kenderaan} 
                              alt={v.no_kenderaan} 
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                              {v.jenis_kenderaan === 'ambulance' ? (
                                <Ambulance className="w-5 h-5 opacity-40" />
                              ) : v.jenis_kenderaan === 'van_jenazah' ? (
                                <Truck className="w-5 h-5 opacity-40" />
                              ) : (
                                <Car className="w-5 h-5 opacity-40" />
                              )}
                            </div>
                          )}
                          <div>
                            <span className="block font-mono font-bold text-slate-800">{v.no_kenderaan}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{v.model}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">{v.no_chasis}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {v.jenis_kenderaan === 'ambulance' ? (
                             <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Ambulance className="w-4 h-4" /></span>
                           ) : v.jenis_kenderaan === 'van_jenazah' ? (
                             <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg"><Truck className="w-4 h-4" /></span>
                           ) : (
                             <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Car className="w-4 h-4" /></span>
                           )}
                           <span className="capitalize">
                             {v.jenis_kenderaan === 'sg' 
                               ? 'SG (Kereta Jabatan)' 
                               : v.jenis_kenderaan === 'van_jenazah' 
                               ? 'Van Jenazah' 
                               : 'Ambulans'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(v.tarikh_tamat_cukai_jalan).toLocaleDateString('ms-MY')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {v.status === 'active' && <Badge variant="success">Aktif (Sedia)</Badge>}
                        {v.status === 'maintenance' && <Badge variant="warning">Penyelenggaraan</Badge>}
                        {v.status === 'retired' && <Badge variant="gray">Bersara (Retired)</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleOpenEdit(v)}
                          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1 inline" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Register / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
            
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === 'create' ? 'Daftar Kenderaan Baru' : 'Kemaskini Butiran Kenderaan'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Plate No */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. Pendaftaran (Plate No)</label>
                <Input 
                  placeholder="Contoh: WXD 4291"
                  value={noKenderaan}
                  onChange={(e) => setNoKenderaan(e.target.value)}
                  required
                />
              </div>

              {/* Chassis No */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. Chasis</label>
                <Input 
                  placeholder="Contoh: CHS-AMB-01-KKM"
                  value={noChasis}
                  onChange={(e) => setNoChasis(e.target.value)}
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori Perkhidmatan</label>
                <select
                  value={jenisKenderaan}
                  onChange={(e) => setJenisKenderaan(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                  required
                >
                  <option value="ambulance">Ambulans</option>
                  <option value="sg">Kereta Jabatan (SG)</option>
                  <option value="van_jenazah">Van Jenazah</option>
                </select>
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Kenderaan</label>
                <Input 
                  placeholder="Contoh: Toyota Hiace Ambulance Spec-B"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              {/* Roadtax Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh Tamat Cukai Jalan</label>
                <Input 
                  type="date"
                  value={cukaiJalan}
                  onChange={(e) => setCukaiJalan(e.target.value)}
                  required
                />
              </div>

              {/* Vehicle Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Semasa</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                  required
                >
                  <option value="active">Aktif (Good to Go)</option>
                  <option value="maintenance">Penyelenggaraan (Maintenance)</option>
                  <option value="retired">Bersara (Retired)</option>
                </select>
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Foto Kenderaan (Pilihan)</label>
                <div className="flex items-center gap-4">
                  {fotoKenderaan ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={fotoKenderaan} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoKenderaan('')}
                        className="absolute inset-0 bg-black/45 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 bg-slate-50/50">
                      <Car className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="vehiclePhotoUpload"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="vehiclePhotoUpload"
                      className="inline-flex px-3.5 py-2 border border-slate-200 hover:border-slate-355 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                    >
                      Muat Naik Foto
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Syor format landskap, maks 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-200 text-slate-700"
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Kenderaan
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default TransporterVehicleRegistryPage
