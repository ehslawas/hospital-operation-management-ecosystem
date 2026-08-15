// src/modules/mytransporter/pages/TransporterVehicleIssuesPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  AlertTriangle, 
  Check, 
  Eye, 
  Settings, 
  Trash2,
  AlertCircle,
  Wrench,
  Activity,
  User,
  Plus,
  Camera,
  X
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { 
  getVehicleIssues, 
  acknowledgeVehicleIssue, 
  resolveVehicleIssue,
  getVehicles,
  reportVehicleIssue
} from '../services/transporterService'
import type { VehicleIssueReport, StatusIsu, TransportVehicle } from '@/shared/types/mytransporter'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  Input
} from '@/components/ui'

const TransporterVehicleIssuesPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [issues, setIssues] = useState<VehicleIssueReport[]>([])
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Resolution modal states
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  // Report issue modal states
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportVehicleId, setReportVehicleId] = useState('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportPriority, setReportPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [reportDesc, setReportDesc] = useState('')
  const [reportPhotos, setReportPhotos] = useState<string[]>([])

  const handlePhotoCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.setAttribute('capture', 'environment')
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setReportPhotos(prev => [...prev, reader.result as string])
          toast.success('Gambar Diambil', 'Foto kerosakan berjaya ditambah.')
        }
        reader.readAsDataURL(file)
      }
    }
    
    input.click()
  }

  const handleReportSubmit = async () => {
    if (!reportVehicleId) {
      toast.error('Pilih Kenderaan', 'Sila pilih kenderaan yang bermasalah.')
      return
    }
    if (!reportTitle.trim()) {
      toast.error('Tajuk Diperlukan', 'Sila nyatakan tajuk kerosakan.')
      return
    }
    if (!reportDesc.trim()) {
      toast.error('Penerangan Diperlukan', 'Sila isi penerangan kerosakan secara terperinci.')
      return
    }

    try {
      const driverId = loggedUser?.id || ''
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await reportVehicleIssue({
        kenderaan_id: reportVehicleId,
        pemandu_id: driverId,
        tajuk: reportTitle,
        penerangan: reportDesc,
        keutamaan: reportPriority,
        status: 'open',
        foto_kerosakan: reportPhotos.length > 0 ? JSON.stringify(reportPhotos) : undefined,
        hospital_id: hospitalId
      })

      if (res.error) throw new Error(res.error)

      toast.success('Aduan Dihantar', 'Aduan kerosakan kenderaan berjaya didaftarkan.')
      setIsReportOpen(false)
      // Reset form
      setReportVehicleId('')
      setReportTitle('')
      setReportPriority('medium')
      setReportDesc('')
      setReportPhotos([])
      fetchIssues()
    } catch (err: any) {
      toast.error('Gagal Menghantar Laporan', err.message || 'Sila cuba lagi.')
    }
  }

  const getPhotos = (fotoStr?: string): string[] => {
    if (!fotoStr) return []
    if (fotoStr.startsWith('[')) {
      try {
        return JSON.parse(fotoStr)
      } catch (e) {
        return [fotoStr]
      }
    }
    return [fotoStr]
  }

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await getVehicleIssues()
      if (res.data) setIssues(res.data)
    } catch (err: any) {
      toast.error('Gagal Memuatkan Aduan', err.message || 'Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const res = await getVehicles()
      if (res.data) setVehicles(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchIssues()
    fetchVehicles()
  }, [])

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await acknowledgeVehicleIssue(id)
      if (res.error) throw new Error(res.error)
      
      toast.success('Aduan Disahkan', 'Aduan kerosakan kenderaan ditukar kepada status Diperakui (Acknowledged).')
      fetchIssues()
    } catch (err: any) {
      toast.error('Ralat Mengesahkan', err.message || 'Sila cuba lagi.')
    }
  }

  const handleOpenResolve = (id: string) => {
    setSelectedIssueId(id)
    setResolutionNotes('')
    setIsResolveOpen(true)
  }

  const handleResolveSubmit = async () => {
    if (!selectedIssueId || !resolutionNotes) {
      toast.error('Butiran Diperlukan', 'Sila isi nota penyelesaian.')
      return
    }

    try {
      const adminId = loggedUser?.id || ''
      const res = await resolveVehicleIssue(selectedIssueId, adminId, resolutionNotes)
      if (res.error) throw new Error(res.error)

      toast.success('Aduan Diselesaikan', 'Aduan kerosakan kenderaan ditutup dengan status Selesai.')
      setIsResolveOpen(false)
      fetchIssues()
    } catch (err: any) {
      toast.error('Gagal Menyelesaikan Aduan', err.message || 'Sila cuba lagi.')
    }
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'low':
        return <Badge variant="gray">Rendah (Low)</Badge>
      case 'medium':
        return <Badge variant="info">Sederhana (Medium)</Badge>
      case 'high':
        return <Badge variant="warning">Tinggi (High)</Badge>
      case 'critical':
        return <Badge variant="error">Kritis (Critical)</Badge>
      default:
        return <Badge variant="gray">{p}</Badge>
    }
  }

  const getStatusBadge = (s: StatusIsu) => {
    switch (s) {
      case 'open':
        return <Badge variant="error">Terbuka (Open)</Badge>
      case 'acknowledged':
        return <Badge variant="warning">Diperakui (Ack)</Badge>
      case 'resolved':
        return <Badge variant="success">Selesai (Resolved)</Badge>
      default:
        return <Badge variant="gray">{s}</Badge>
    }
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/transporter/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Papan Pemuka</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-8 h-8 text-rose-600 animate-pulse" />
            Aduan & Laporan Kerosakan Kenderaan
          </h1>
          <p className="text-slate-500 text-sm">
            Semak, sahkan, dan urus tindakan penyelenggaraan bagi kenderaan hospital yang dilaporkan rosak/masalah oleh pemandu.
          </p>
        </div>
        <Button 
          onClick={() => setIsReportOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Laporan Kerosakan
        </Button>
      </div>

      {/* Issues List Card */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Memuatkan laporan kerosakan...</div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Tiada sebarang laporan kerosakan kenderaan berdaftar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Kenderaan</th>
                    <th className="px-6 py-4">Aduan Kerosakan</th>
                    <th className="px-6 py-4">Kakitangan Melapor</th>
                    <th className="px-6 py-4">Keutamaan</th>
                    <th className="px-6 py-4">Tarikh</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-600">{issue.kenderaan?.no_kenderaan}</div>
                        <div className="text-xxs text-slate-400 font-semibold">{issue.kenderaan?.model}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex flex-col gap-1.5">
                          <div className="font-bold text-slate-800">{issue.tajuk}</div>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{issue.penerangan}</p>
                          
                          {/* Photo thumbnails list */}
                          {issue.foto_kerosakan && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {getPhotos(issue.foto_kerosakan).map((photoUrl, idx) => (
                                <div key={idx} className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 shadow-xxs">
                                  <img 
                                    src={photoUrl} 
                                    className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" 
                                    alt={`Foto Kerosakan ${idx + 1}`} 
                                    onClick={() => window.open(photoUrl, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {issue.status === 'resolved' && issue.catatan_penyelesaian && (
                            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xxs text-slate-500">
                              <strong>Res:</strong> "{issue.catatan_penyelesaian}"
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {issue.pemandu?.full_name || 'Driver'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(issue.keutamaan)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-600">
                          {new Date(issue.created_at).toLocaleDateString('ms-MY')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(issue.status)}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        {issue.status === 'open' && (
                          <Button 
                            variant="ghost" 
                            onClick={() => handleAcknowledge(issue.id)}
                            className="text-xs text-amber-600 hover:text-amber-800 border border-amber-100 rounded-lg px-2.5 py-1 bg-amber-50/50 font-bold"
                          >
                            Acknowledge
                          </Button>
                        )}
                        
                        {issue.status !== 'resolved' && (
                          <Button 
                            variant="ghost"
                            onClick={() => handleOpenResolve(issue.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-100 rounded-lg px-2.5 py-1 bg-emerald-50/50 font-bold"
                          >
                            Resolve / Baiki
                          </Button>
                        )}

                        {issue.status === 'resolved' && (
                          <span className="text-xs text-slate-400 italic font-semibold">Tindakan Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Issue Modal */}
      {isResolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              Selesaikan Penyelenggaraan Kenderaan
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila nyatakan nota tindakan baiki/penyelenggaraan yang diambil (contoh: Hantar ke bengkel tukar brek, servis selesai, dll).
            </p>

            <textarea 
              rows={3}
              placeholder="Contoh: Brek pad telah diganti di bengkel Toyota rasmi..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-colors font-medium shadow-xs"
              required
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsResolveOpen(false)}
                className="border-slate-200 text-slate-700"
              >
                Batal
              </Button>
              <Button 
                onClick={handleResolveSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Simpan & Tutup Laporan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full mx-4 space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
              Laporkan Kerosakan Kenderaan
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila isi butiran kerosakan kenderaan secara terperinci untuk rujukan tindakan penyelenggaraan.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pilih Kenderaan</label>
                <select
                  value={reportVehicleId}
                  onChange={(e) => setReportVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition-colors font-medium shadow-xs"
                >
                  <option value="">-- Sila Pilih Kenderaan --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.no_kenderaan} ({v.model} - {v.jenis_kenderaan === 'ambulance' ? 'Ambulans' : v.jenis_kenderaan === 'van_jenazah' ? 'Van Jenazah' : 'SG'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tajuk Kerosakan</label>
                <Input
                  placeholder="Contoh: Lampu amaran enjin menyala, brek tidak cengkam..."
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full border border-slate-250 p-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Keutamaan (Priority)</label>
                <select
                  value={reportPriority}
                  onChange={(e) => setReportPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition-colors font-medium shadow-xs"
                >
                  <option value="low">Rendah (Low)</option>
                  <option value="medium">Sederhana (Medium)</option>
                  <option value="high">Tinggi (High)</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Penerangan Kerosakan / Isu</label>
                <textarea 
                  rows={4}
                  placeholder="Terangkan masalah atau kerosakan secara terperinci..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white transition-colors font-medium shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Bukti Foto Kerosakan ({reportPhotos.length} keping)</label>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePhotoCapture}
                    className="border-dashed border-slate-350 hover:border-rose-500 text-slate-650 flex items-center gap-1.5 py-4 w-full rounded-xl"
                  >
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>Tangkap / Tambah Foto Bukti</span>
                  </Button>
                  
                  {reportPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {reportPhotos.map((photo, index) => (
                        <div key={index} className="relative w-full aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xxs group">
                          <img src={photo} className="w-full h-full object-cover" alt="Preview kerosakan" />
                          <button
                            type="button"
                            onClick={() => setReportPhotos(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-xs transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsReportOpen(false)
                  setReportVehicleId('')
                  setReportTitle('')
                  setReportPriority('medium')
                  setReportDesc('')
                  setReportPhotos([])
                }}
                className="border-slate-200 text-slate-700"
              >
                Batal
              </Button>
              <Button 
                onClick={handleReportSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Hantar Laporan
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TransporterVehicleIssuesPage
