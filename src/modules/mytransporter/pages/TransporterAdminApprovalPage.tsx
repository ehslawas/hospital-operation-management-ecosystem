// src/modules/mytransporter/pages/TransporterAdminApprovalPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Car, 
  Check, 
  X, 
  Calendar, 
  FileText,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Info,
  CheckCircle2
} from 'lucide-react'
import { Ambulance } from '../components/AmbulanceIcon'
import { CrossborderDetailsPanel } from '../components/CrossborderDetailsPanel'
import { useAuthStore } from '@/stores/authStore'

import { useToast } from '@/stores/toastStore'
import { 
  getRequests, 
  adminApproveRequest, 
  adminRejectRequest,
  getInspections
} from '../services/transporterService'
import type { TransportRequest, VehicleInspection } from '@/shared/types/mytransporter'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  SlideOver
} from '@/components/ui'

const TransporterAdminApprovalPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [inspections, setInspections] = useState<VehicleInspection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')

  // Details panel states
  const [selectedReq, setSelectedReq] = useState<TransportRequest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<VehicleInspection | null>(null)

  // Rejection modal
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const reqRes = await getRequests()
      if (reqRes.data) setRequests(reqRes.data)
      
      const inspRes = await getInspections()
      if (inspRes.data) setInspections(inspRes.data)
    } catch (err: any) {
      toast.error('Gagal Memuatkan Data', err.message || 'Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const adminId = loggedUser?.id || ''
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await adminApproveRequest(id, adminId, hospitalId)
      if (res.error) throw new Error(res.error)
      
      toast.success('Permohonan Diluluskan', 'Permohonan pengangkutan berjaya diluluskan.')
      fetchData()
      setIsDetailOpen(false)
    } catch (err: any) {
      toast.error('Gagal Meluluskan', err.message || 'Sila cuba lagi.')
    }
  }

  const handleOpenReject = (id: string) => {
    setRejectingReqId(id)
    setRejectReason('')
    setIsRejectOpen(true)
  }

  const handleRejectSubmit = async () => {
    if (!rejectingReqId || !rejectReason) {
      toast.error('Sebab Diperlukan', 'Sila nyatakan sebab penolakan permohonan.')
      return
    }

    try {
      const adminId = loggedUser?.id || ''
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await adminRejectRequest(rejectingReqId, adminId, rejectReason, hospitalId)
      if (res.error) throw new Error(res.error)

      toast.success('Permohonan Ditolak', 'Permohonan pengangkutan ditolak dan dimaklumkan kepada pemohon.')
      setIsRejectOpen(false)
      fetchData()
      setIsDetailOpen(false)
    } catch (err: any) {
      toast.error('Gagal Menolak', err.message || 'Sila cuba lagi.')
    }
  }

  const handleOpenDetails = (req: TransportRequest) => {
    setSelectedReq(req)
    // Find matching pre-trip inspection
    const preInsp = inspections.find(i => i.request_id === req.id && i.jenis_pemeriksaan === 'pre_trip')
    setSelectedInspection(preInsp || null)
    setIsDetailOpen(true)
  }

  // Filter requests waiting for admin approval (status is driver_accepted)
  const pendingApprovals = requests.filter(r => r.status_semasa === 'driver_accepted')
  
  // Historical processed requests (approved, rejected, cancelled, completed)
  const processedRequests = requests.filter(r => 
    r.status_semasa !== 'driver_accepted' && r.status_semasa !== 'draft' && r.status_semasa !== 'submitted'
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Diluluskan</Badge>
      case 'rejected':
        return <Badge variant="error">Ditolak Pentadbir</Badge>
      case 'in_transit':
        return <Badge variant="warning">Dalam Perjalanan</Badge>
      case 'completed':
        return <Badge variant="success">Selesai</Badge>
      case 'cancelled':
        return <Badge variant="gray">Dibatalkan</Badge>
      default:
        return <Badge variant="gray">{status}</Badge>
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Senarai Kelulusan Pentadbir</h1>
        <p className="text-slate-500 text-sm">
          Semak butiran perjalanan, diagnosis pesakit, dan laporan pemeriksaan pre-trip pemandu sebelum meluluskan pelepasan kenderaan.
        </p>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'pending' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Queue Permohonan Menunggu Kelulusan ({pendingApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'history' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tindakan Kelulusan Lampau ({processedRequests.length})
        </button>
      </div>

      {/* Main Content Area (Full Width) */}
      <div className="w-full">
        {activeTab === 'pending' ? (
          <Card className="border border-slate-200 shadow-sm overflow-hidden w-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="text-md font-bold text-slate-800 flex items-center justify-between">
                <span>Senarai Menunggu Tindakan</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingApprovals.length} Tertunda
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-slate-500 animate-pulse">Memuatkan permohonan...</div>
              ) : pendingApprovals.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Tiada permohonan menunggu kelulusan ketika ini.</div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xxs font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/75">
                        <th className="p-4 pl-6">No. Rujukan & Jenis</th>
                        <th className="p-4">Destinasi & Tujuan</th>
                        <th className="p-4">Pemandu & Pesakit</th>
                        <th className="p-4">Tarikh & Masa</th>
                        <th className="p-4 pr-6 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {pendingApprovals.map((req) => (
                        <tr 
                          key={req.id} 
                          onClick={() => handleOpenDetails(req)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 pl-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-xs text-blue-600 group-hover:text-blue-700 transition-colors">
                                {req.no_rujukan}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {req.jenis_permohonan === 'ambulance' ? (
                                  <Badge variant="error" className="text-[10px] py-0 px-1.5">Ambulans</Badge>
                                ) : req.jenis_permohonan === 'van_jenazah' ? (
                                  <Badge variant="gray" className="text-[10px] py-0 px-1.5">Van Jenazah</Badge>
                                ) : (
                                  <Badge variant="info" className="text-[10px] py-0 px-1.5">SG (Kereta Jabatan)</Badge>
                                )}
                                {req.kenderaan?.no_kenderaan && (
                                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.2 rounded border border-blue-200/50">
                                    {req.kenderaan.no_kenderaan}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col max-w-xs md:max-w-sm">
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{req.destinasi}</span>
                                {req.is_crossborder && (
                                  <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5 ml-1">
                                    🌐 Sempadan
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 truncate mt-0.5">
                                {req.tujuan_permohonan}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-semibold text-slate-650">
                                Pemandu: {req.pemandu?.full_name || 'Driver'}
                              </span>
                              {req.jenis_permohonan === 'van_jenazah' ? (
                                <span className="text-slate-600 font-medium">Jenazah: {req.nama_pesakit}</span>
                              ) : (req.jenis_permohonan === 'ambulance' || req.bawa_pesakit) ? (
                                <span className="text-rose-700 font-semibold">Pesakit: {req.nama_pesakit}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-slate-700 text-xs font-mono">
                              {new Date(req.tarikh_masa_diperlukan).toLocaleString('ms-MY')}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                onClick={() => handleApprove(req.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3"
                              >
                                <Check className="w-3.5 h-3.5 mr-1 inline" />
                                Lulus
                              </Button>
                              
                              <Button 
                                onClick={() => handleOpenReject(req.id)}
                                className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs border border-rose-100 font-bold h-8 px-3"
                                variant="ghost"
                              >
                                <X className="w-3.5 h-3.5 mr-1 inline" />
                                Tolak
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 shadow-sm overflow-hidden w-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="text-md font-bold text-slate-800">Rekod Tindakan Kelulusan Lampau</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-slate-500 animate-pulse">Memuatkan rekod tindakan lampau...</div>
              ) : processedRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Tiada rekod tindakan lampau.</div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xxs font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/75">
                        <th className="p-4 pl-6">No. Rujukan & Jenis</th>
                        <th className="p-4">Destinasi & Tujuan</th>
                        <th className="p-4">Pemandu & Pesakit</th>
                        <th className="p-4">Tarikh & Masa</th>
                        <th className="p-4 pr-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {processedRequests.map((req) => (
                        <tr 
                          key={req.id} 
                          onClick={() => handleOpenDetails(req)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 pl-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                                {req.no_rujukan}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {req.jenis_permohonan === 'ambulance' ? (
                                  <Badge variant="error" className="text-[10px] py-0 px-1.5">Ambulans</Badge>
                                ) : req.jenis_permohonan === 'van_jenazah' ? (
                                  <Badge variant="gray" className="text-[10px] py-0 px-1.5">Van Jenazah</Badge>
                                ) : (
                                  <Badge variant="info" className="text-[10px] py-0 px-1.5">SG (Kereta Jabatan)</Badge>
                                )}
                                {req.kenderaan?.no_kenderaan && (
                                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    {req.kenderaan.no_kenderaan}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col max-w-xs md:max-w-sm">
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">{req.destinasi}</span>
                                {req.is_crossborder && (
                                  <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5 ml-1">
                                    🌐 Sempadan
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 truncate mt-0.5">
                                {req.tujuan_permohonan}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-semibold text-slate-650">
                                Pemandu: {req.pemandu?.full_name || '-'}
                              </span>
                              {req.jenis_permohonan === 'van_jenazah' ? (
                                <span className="text-slate-600 font-medium">Jenazah: {req.nama_pesakit}</span>
                              ) : (req.jenis_permohonan === 'ambulance' || req.bawa_pesakit) ? (
                                <span className="text-rose-700 font-semibold">Pesakit: {req.nama_pesakit}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-slate-700 text-xs font-mono">
                              {new Date(req.tarikh_masa_diperlukan).toLocaleString('ms-MY')}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {getStatusBadge(req.status_semasa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 1. Request Detail & Driver Inspection Review Drawer */}
      <SlideOver
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Semakan Kelulusan: ${selectedReq?.no_rujukan}`}
        description="Semak permohonan trip berserta laporan pre-trip pemandu bertugas."
        size="3xl"
      >
        {selectedReq && (
          <div className="p-6 space-y-6">
            
             {/* Trip Summary Card */}
             <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/60 p-5 rounded-2xl shadow-sm">
               <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block">Destinasi Perjalanan</span>
               <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 mt-1">
                 <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                 {selectedReq.destinasi}
               </h3>
               <p className="text-xs text-slate-500 leading-relaxed mt-2 pl-5.5 border-l border-slate-200 italic">{selectedReq.tujuan_permohonan}</p>
             </div>

             {/* Trip details grid */}
             <div className="space-y-4">
               <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                 <FileText className="w-4 h-4 text-slate-500" />
                 <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Maklumat Trip Pengangkutan</h4>
               </div>
               <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                 <div>
                   <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Jenis Perkhidmatan</span>
                   <span className="font-bold text-slate-800 capitalize flex items-center gap-1.5">
                     {selectedReq.jenis_permohonan === 'ambulance' ? (
                       <Badge variant="error" className="py-0.5 px-2">Ambulans</Badge>
                     ) : selectedReq.jenis_permohonan === 'van_jenazah' ? (
                       <Badge variant="gray" className="py-0.5 px-2">Van Jenazah</Badge>
                     ) : (
                       <Badge variant="info" className="py-0.5 px-2">Kereta Jabatan (SG)</Badge>
                     )}
                   </span>
                 </div>
                 <div>
                   <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Unit Pemohon</span>
                   <span className="font-semibold text-slate-800">{selectedReq.unit_pemohon}</span>
                 </div>
                 {selectedReq.nama_pemohon && (
                   <div>
                     <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Nama Pemohon</span>
                     <span className="font-semibold text-slate-800">{selectedReq.nama_pemohon}</span>
                   </div>
                 )}
                 <div>
                   <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Tarikh & Masa Bertolak</span>
                   <span className="font-bold text-slate-850 font-mono">
                     {new Date(selectedReq.tarikh_masa_diperlukan).toLocaleString('ms-MY')}
                     {selectedReq.tarikh_masa_sehingga && (
                       <>
                         <span className="text-slate-400 font-normal font-sans text-xs"> hingga </span>
                         {new Date(selectedReq.tarikh_masa_sehingga).toLocaleString('ms-MY')}
                       </>
                     )}
                   </span>
                 </div>
                 {selectedReq.jenis_permohonan === 'sg' && (
                   <>
                     <div>
                       <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Keperluan Perkhidmatan</span>
                       <span className="font-semibold text-slate-800 text-sm">
                         {selectedReq.pemandu_diperlukan ? 'Pemandu & Kereta' : 'Kereta Sahaja (Tanpa Pemandu)'}
                       </span>
                     </div>
                     {selectedReq.senarai_penumpang && selectedReq.senarai_penumpang.length > 0 && (
                       <div className="col-span-2 border-t border-slate-100 pt-3">
                         <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Senarai Penumpang (Staf/Pengikut)</span>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                           {selectedReq.senarai_penumpang.map((passenger, idx) => (
                             <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                               <User className="w-3.5 h-3.5 text-slate-400" />
                               <span className="font-medium text-slate-700">{passenger.name}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </>
                 )}
                 <div className="col-span-2 border-t border-slate-100 pt-3">
                   <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Kakitangan Pengiring</span>
                   <div className="font-semibold text-slate-850">
                     {selectedReq.pengiring_list && selectedReq.pengiring_list.length > 0 ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                         {selectedReq.pengiring_list.map((escort, idx) => (
                           <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                             <User className="w-3.5 h-3.5 text-slate-400" />
                             <span>
                               <span className="capitalize font-bold text-slate-600">{escort.job.replace(/_/g, ' ')}</span>: {escort.name}
                             </span>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <span className="text-slate-500 text-xs italic">
                         {selectedReq.pengiring ? selectedReq.pengiring.replace(/_/g, ' ') : 'Tiada Pengiring'}
                       </span>
                     )}
                   </div>
                 </div>
                 {selectedReq.medical_officer_referring && (
                   <div className="col-span-2 pt-3 border-t border-slate-100">
                     <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pegawai Perubatan Merujuk (Referring MO)</span>
                     <span className="font-semibold text-slate-850 text-xs flex items-center gap-1.5 p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                       <span className="font-bold text-slate-800">Dr. {selectedReq.medical_officer_referring.name}</span>
                       <span className="text-slate-300">|</span>
                       <span className="text-slate-500">Jabatan: {selectedReq.medical_officer_referring.department}</span>
                     </span>
                   </div>
                 )}
               </div>
             </div>

             {/* Patient details (Ambulance or SG bringing patient) */}
             {(selectedReq.jenis_permohonan === 'ambulance' || selectedReq.jenis_permohonan === 'van_jenazah' || selectedReq.bawa_pesakit) && (
               <div className="space-y-4 pt-4 border-t border-slate-100">
                 {selectedReq.is_crossborder ? (
                   <>
                     <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                       <User className="w-4 h-4 text-blue-650" />
                       <h4 className="text-xs font-black uppercase tracking-wider text-blue-700">Butiran Rentasi Sempadan</h4>
                     </div>
                     <CrossborderDetailsPanel data={selectedReq.crossborder_data} />
                   </>
                 ) : (
                   <>
                     <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                       <User className={`w-4 h-4 ${selectedReq.jenis_permohonan === 'van_jenazah' ? 'text-slate-650' : 'text-rose-650'}`} />
                       <h4 className={`text-xs font-black uppercase tracking-wider ${
                         selectedReq.jenis_permohonan === 'van_jenazah' ? 'text-slate-700' : 'text-rose-700'
                       }`}>
                         {selectedReq.jenis_permohonan === 'van_jenazah' ? 'Butiran Jenazah' : 'Butiran Pesakit'}
                       </h4>
                     </div>
                     <div className={`grid grid-cols-2 gap-x-6 gap-y-4 text-sm p-5 rounded-2xl border shadow-xs bg-white ${
                       selectedReq.jenis_permohonan === 'van_jenazah' 
                         ? 'border-slate-200' 
                         : 'border-rose-100/80'
                     }`}>
                       <div className="col-span-2">
                         <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                           {selectedReq.jenis_permohonan === 'van_jenazah' ? 'Nama Penuh Jenazah' : 'Nama Penuh Pesakit'}
                         </span>
                         <span className="font-extrabold text-slate-850 text-base">{selectedReq.nama_pesakit || '-'}</span>
                       </div>
                       <div>
                         <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                           {selectedReq.jenis_permohonan === 'van_jenazah' ? 'No RN Jenazah' : 'No RN Pesakit'}
                         </span>
                         <span className="font-bold font-mono text-slate-800 text-sm bg-slate-50 px-2 py-0.5 rounded border border-slate-150/60 inline-block">{selectedReq.rn_pesakit || '-'}</span>
                       </div>
                       <div>
                         <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                           Jantina
                         </span>
                         <span className="font-semibold text-slate-800">{selectedReq.jantina_pesakit || '-'}</span>
                       </div>
                       <div className="col-span-2 border-t border-slate-100 pt-3">
                         <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                           {selectedReq.jenis_permohonan === 'van_jenazah' ? 'Sebab Kematian / Butiran' : 'Diagnosis Pesakit'}
                         </span>
                         <span className="font-semibold text-slate-700 leading-relaxed block">{selectedReq.diagnosis_pesakit || '-'}</span>
                       </div>
                       
                       {/* Mobility and oxygen badges */}
                       {selectedReq.patient_mobility && (
                         <div className={`col-span-2 p-3 rounded-xl text-xs font-semibold flex flex-col gap-1 border ${
                           selectedReq.patient_mobility === 'stretcher'
                             ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-xxs'
                             : 'bg-slate-50 border-slate-200 text-slate-900 shadow-xxs'
                         }`}>
                           <div className="flex items-center gap-2">
                             <Info className={`w-4 h-4 ${selectedReq.patient_mobility === 'stretcher' ? 'text-amber-600' : 'text-slate-500'}`} />
                             <span>Mobiliti Pesakit: <span className="capitalize font-bold">{selectedReq.patient_mobility === 'stretcher' ? 'Stretcher / Usungan' : selectedReq.patient_mobility}</span></span>
                           </div>
                           {selectedReq.patient_mobility === 'stretcher' && (
                             <p className="text-[10px] text-amber-700 font-medium leading-normal pl-6 mt-0.5">
                               ⚠️ Pemandu WAJIB naik ke wad untuk mengambil pesakit secara berpasangan.
                             </p>
                           )}
                         </div>
                       )}
                       {selectedReq.oksigen_diperlukan && (
                         <div className="col-span-2 p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs font-semibold text-rose-950 flex flex-col gap-1 shadow-xxs">
                           <div className="flex items-center gap-2">
                             <Shield className="w-4 h-4 text-rose-600" />
                             <span className="font-bold">Sokongan Oksigen Berterusan Diperlukan</span>
                           </div>
                           {selectedReq.jenis_oksigen && (
                             <div className="text-[10px] text-rose-800 font-medium pl-6">
                               Alat Oksigen: <span className="text-rose-900 font-bold">{selectedReq.jenis_oksigen}</span>
                             </div>
                           )}
                         </div>
                       )}
                       {selectedReq.mesin_diperlukan && selectedReq.mesin_diperlukan.length > 0 && (
                         <div className="col-span-2 pt-3 border-t border-slate-100">
                           <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Peralatan / Mesin Diperlukan</span>
                           <div className="flex flex-wrap gap-1.5">
                             {selectedReq.mesin_diperlukan.map((machine, mIdx) => (
                               <span key={mIdx} className="text-xxs font-bold bg-rose-50/50 text-rose-800 border border-rose-100 rounded-md px-2 py-1">{machine}</span>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   </>
                 )}
               </div>
             )}

             {/* Driver Pre-Trip safety check review */}
             {selectedInspection && (
               <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                   <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                   <h4 className="text-xs font-black text-slate-650 uppercase tracking-wider">Laporan Pemeriksaan Pre-Trip Pemandu</h4>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                   <div>
                     <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Pemandu Bertugas</span>
                     <span className="font-bold text-slate-800">{selectedReq.pemandu?.full_name || 'Driver'}</span>
                   </div>
                   <div>
                     <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Kenderaan Diperiksa</span>
                     <span className="font-bold text-blue-600 font-mono text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-150/40 inline-block">{selectedReq.kenderaan?.no_kenderaan}</span>
                   </div>
                   <div>
                     <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Odometer Terkini</span>
                     <span className="font-extrabold text-slate-850 font-mono tabular-nums">{selectedInspection.bacaan_odometer.toLocaleString('ms-MY')} km</span>
                   </div>
                   <div>
                     <span className="block text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Keputusan Semakan</span>
                     <Badge variant="success" className="py-0.5 px-2 font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">Cleared / Good</Badge>
                   </div>
                 </div>

                 {/* Checklist items status */}
                 <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                   <div className="flex justify-between items-center p-3.5 px-4 text-xs hover:bg-slate-50/30 transition-colors">
                     <span className="font-bold text-slate-650 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       Tayar & Rim
                     </span>
                     <Badge variant="success" className="py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-150/60 font-semibold">Baik (Cleared)</Badge>
                   </div>
                   <div className="flex justify-between items-center p-3.5 px-4 text-xs hover:bg-slate-50/30 transition-colors">
                     <span className="font-bold text-slate-655 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       Paras Gas / Petrol
                     </span>
                     <Badge variant="success" className="py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-150/60 font-semibold">Baik (Cleared)</Badge>
                   </div>
                   <div className="flex justify-between items-center p-3.5 px-4 text-xs hover:bg-slate-50/30 transition-colors">
                     <span className="font-bold text-slate-655 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       Minyak Enjin
                     </span>
                     <Badge variant="success" className="py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-150/60 font-semibold">Baik (Cleared)</Badge>
                   </div>
                 </div>      

                  {/* Inspections Photo Gallery */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="block text-xs font-bold text-slate-500 mb-2">Lampiran Bukti Foto Pemeriksaan</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Tyre Photo */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
                          {selectedInspection.foto_tayar && (selectedInspection.foto_tayar.startsWith('data:') || selectedInspection.foto_tayar.startsWith('http') || selectedInspection.foto_tayar.startsWith('/')) ? (
                            <img src={selectedInspection.foto_tayar} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" alt="Foto Tayar" onClick={() => window.open(selectedInspection.foto_tayar, '_blank')} />
                          ) : (
                            <span className="text-slate-400 text-xxs p-2 text-center">Tiada Foto Tayar</span>
                          )}
                        </div>
                        <div className="p-1.5 bg-slate-50 border-t border-slate-150 text-center font-bold text-[10px] text-slate-600">Tayar & Rim</div>
                      </div>

                      {/* Gas Photo */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
                          {selectedInspection.foto_minyak_gas && (selectedInspection.foto_minyak_gas.startsWith('data:') || selectedInspection.foto_minyak_gas.startsWith('http') || selectedInspection.foto_minyak_gas.startsWith('/')) ? (
                            <img src={selectedInspection.foto_minyak_gas} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" alt="Foto Petrol" onClick={() => window.open(selectedInspection.foto_minyak_gas, '_blank')} />
                          ) : (
                            <span className="text-slate-400 text-xxs p-2 text-center">Tiada Foto Petrol</span>
                          )}
                        </div>
                        <div className="p-1.5 bg-slate-50 border-t border-slate-150 text-center font-bold text-[10px] text-slate-600">Gas / Petrol</div>
                      </div>

                      {/* Engine Oil Photo */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
                          {selectedInspection.foto_minyak_hitam && (selectedInspection.foto_minyak_hitam.startsWith('data:') || selectedInspection.foto_minyak_hitam.startsWith('http') || selectedInspection.foto_minyak_hitam.startsWith('/')) ? (
                            <img src={selectedInspection.foto_minyak_hitam} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" alt="Foto Enjin" onClick={() => window.open(selectedInspection.foto_minyak_hitam, '_blank')} />
                          ) : (
                            <span className="text-slate-400 text-xxs p-2 text-center">Tiada Foto Enjin</span>
                          )}
                        </div>
                        <div className="p-1.5 bg-slate-50 border-t border-slate-150 text-center font-bold text-[10px] text-slate-600">Minyak Enjin</div>
                      </div>

                      {/* Odometer Photo */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
                          {selectedInspection.foto_odometer && (selectedInspection.foto_odometer.startsWith('data:') || selectedInspection.foto_odometer.startsWith('http') || selectedInspection.foto_odometer.startsWith('/')) ? (
                            <img src={selectedInspection.foto_odometer} className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform" alt="Foto Odometer" onClick={() => window.open(selectedInspection.foto_odometer, '_blank')} />
                          ) : (
                            <span className="text-slate-400 text-xxs p-2 text-center">Tiada Foto Odometer</span>
                          )}
                        </div>
                        <div className="p-1.5 bg-slate-50 border-t border-slate-150 text-center font-bold text-[10px] text-slate-650">Odometer</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xxs text-slate-500 italic mt-3">
                    * Sila klik pada foto untuk melihat/membuka imej bersaiz penuh di tab baharu.
                  </div>
                </div>
            )}

            {/* Direct Approve/Reject action or Rejection/Status details inside SlideOver */}
            {selectedReq.status_semasa === 'driver_accepted' ? (
              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <Button 
                  onClick={() => handleApprove(selectedReq.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Check className="w-4 h-4 mr-2 inline" />
                  Luluskan Trip
                </Button>
                <Button 
                  onClick={() => handleOpenReject(selectedReq.id)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  <X className="w-4 h-4 mr-2 inline" />
                  Tolak Trip
                </Button>
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-100 space-y-3">
                {selectedReq.sebab_tolak && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm">
                    <span className="block text-xs font-extrabold text-rose-800 uppercase tracking-wider mb-1">Sebab Penolakan</span>
                    <span className="font-semibold text-rose-950">{selectedReq.sebab_tolak}</span>
                  </div>
                )}
                <div className="text-center text-xs font-semibold text-slate-500">
                  Permohonan ini telah diproses dengan status: <span className="capitalize font-bold text-slate-800">{selectedReq.status_semasa}</span>
                </div>
              </div>
            )}

          </div>
        )}
      </SlideOver>

      {/* 2. Rejection Reason Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Tolak Kelulusan Perjalanan
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila nyatakan sebab permohonan trip pengangkutan ditolak. Pemohon akan dapat melihat sebab penolakan dalam sejarah portal mereka.
            </p>

            <textarea 
              rows={3}
              placeholder="Contoh: Tiada kelulusan ketua unit / Butiran pesakit tidak sah..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white transition-colors font-medium shadow-xs"
              required
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsRejectOpen(false)}
                className="border-slate-200 text-slate-700"
              >
                Batal
              </Button>
              <Button 
                onClick={handleRejectSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Hantar & Tolak Kelulusan
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TransporterAdminApprovalPage
