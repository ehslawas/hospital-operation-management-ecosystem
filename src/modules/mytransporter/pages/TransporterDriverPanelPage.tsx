// src/modules/mytransporter/pages/TransporterDriverPanelPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Car, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Check,
  Camera,
  FileText,
  MapPin,
  Clock,
  User,
  Shield,
  AlertCircle,
  Info
} from 'lucide-react'
import { Ambulance } from '../components/AmbulanceIcon'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'

import { 
  getRequests, 
  getVehicles, 
  driverAcceptRequest,
  driverRejectRequestDirect,
  startTrip,
  completeTrip,
  cancelRequest,
  getRequestLogs,
  getInspections
} from '../services/transporterService'
import type { TransportRequest, TransportVehicle, VehicleInspection, TransportRequestLog } from '@/shared/types/mytransporter'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input, 
  Badge,
  Modal,
  SlideOver
} from '@/components/ui'

const TransporterDriverPanelPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Active workflows
  const [activeTab, setActiveTab] = useState<'incoming' | 'active' | 'history'>('incoming')
  const [selectedReq, setSelectedReq] = useState<TransportRequest | null>(null)
  
  // Details slideover states
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [logs, setLogs] = useState<TransportRequestLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Inspection Modal States
  const [isInspModalOpen, setIsInspModalOpen] = useState(false)
  const [inspType, setInspType] = useState<'pre_trip' | 'post_trip'>('pre_trip')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [odoReading, setOdoReading] = useState('')
  const [preTripOdo, setPreTripOdo] = useState<number | null>(null)
  
  // Condition states
  const [tyreStatus, setTyreStatus] = useState<'good' | 'issue'>('good')
  const [gasStatus, setGasStatus] = useState<'good' | 'issue'>('good')
  const [oilStatus, setOilStatus] = useState<'good' | 'issue'>('good')
  
  // Photo Simulation uploads (store filenames)
  const [tyrePhoto, setTyrePhoto] = useState<string | null>(null)
  const [gasPhoto, setGasPhoto] = useState<string | null>(null)
  const [oilPhoto, setOilPhoto] = useState<string | null>(null)
  const [odoPhoto, setOdoPhoto] = useState<string | null>(null)
  
  // Decision
  const [decision, setDecision] = useState<'cleared' | 'rejected'>('cleared')
  const [remarks, setRemarks] = useState('')

  // Reject Request Direct Modal States
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null)

  // Driver Cancellation Modal States
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellingReqId, setCancellingReqId] = useState<string | null>(null)

  const isTripToday = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA')
    const tripStr = new Date(dateStr).toLocaleDateString('en-CA')
    return todayStr === tripStr
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const reqRes = await getRequests()
      if (reqRes.data) setRequests(reqRes.data)
      
      const vehRes = await getVehicles()
      if (vehRes.data) setVehicles(vehRes.data.filter(v => v.status === 'active'))
    } catch (err: any) {
      toast.error('Gagal Memuatkan Data', err.message || 'Sila cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter requests by driver role tabs
  const incomingRequests = requests.filter(r => {
    if (r.status_semasa !== 'submitted' && r.status_semasa !== 'driver_rejected') {
      return false
    }
    // If it was rejected by this driver due to inspection (pemandu_id matches), hide it
    if (r.status_semasa === 'driver_rejected' && r.pemandu_id === loggedUser?.id) {
      return false
    }
    // If this driver has rejected it directly (saved in localStorage), hide it
    if (loggedUser?.id) {
      const locallyRejected = localStorage.getItem(`rejected_requests_${loggedUser.id}`)
      if (locallyRejected) {
        const rejectedIds = JSON.parse(locallyRejected) as string[]
        if (rejectedIds.includes(r.id)) {
          return false
        }
      }
    }
    return true
  })
  
  const myActiveTrips = requests.filter(r => 
    r.pemandu_id === loggedUser?.id && 
    (r.status_semasa === 'driver_accepted' || r.status_semasa === 'approved' || r.status_semasa === 'in_transit')
  )

  const myHistoryTrips = requests.filter(r => {
    // Basic history status where this driver was assigned
    const isBasicHistory = r.pemandu_id === loggedUser?.id && 
      (r.status_semasa === 'completed' || r.status_semasa === 'rejected' || r.status_semasa === 'cancelled');

    // Rejected by this driver due to inspection (driver_rejected status and pemandu_id matches)
    const isInspectionRejectedByMe = r.status_semasa === 'driver_rejected' && r.pemandu_id === loggedUser?.id;

    // Locally rejected by this driver (direct rejection)
    const isLocallyRejectedByMe = loggedUser?.id ? 
      JSON.parse(localStorage.getItem(`rejected_requests_${loggedUser.id}`) || '[]').includes(r.id) : false;

    return isBasicHistory || isInspectionRejectedByMe || isLocallyRejectedByMe;
  })

  const handleOpenInspection = async (req: TransportRequest, type: 'pre_trip' | 'post_trip') => {
    setSelectedReq(req)
    setInspType(type)
    setPreTripOdo(null)
    
    // Pre-populate if post-trip
    if (type === 'post_trip') {
      setSelectedVehicleId(req.kenderaan_id || '')
      setOdoReading('')
      try {
        const inspsRes = await getInspections()
        if (inspsRes.data) {
          const preInsp = inspsRes.data.find(i => i.request_id === req.id && i.jenis_pemeriksaan === 'pre_trip')
          if (preInsp) {
            setPreTripOdo(preInsp.bacaan_odometer)
          }
        }
      } catch (err) {
        console.error('Error fetching pre-trip odometer:', err)
      }
    } else {
      setSelectedVehicleId('')
      setOdoReading('')
    }

    setTyreStatus('good')
    setGasStatus('good')
    setOilStatus('good')
    setTyrePhoto(null)
    setGasPhoto(null)
    setOilPhoto(null)
    setOdoPhoto(null)
    setDecision('cleared')
    setRemarks('')
    setIsInspModalOpen(true)
  }

  // Real photo capture trigger using HTML5 file input with camera capture
  const handlePhotoCapture = (field: 'tyre' | 'gas' | 'oil' | 'odo') => {
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
          const base64data = reader.result as string
          if (field === 'tyre') setTyrePhoto(base64data)
          if (field === 'gas') setGasPhoto(base64data)
          if (field === 'oil') setOilPhoto(base64data)
          if (field === 'odo') setOdoPhoto(base64data)
          toast.success('Gambar Diambil', `Foto ${field.toUpperCase()} berjaya direkodkan.`)
        }
        reader.readAsDataURL(file)
      }
    }
    
    input.click()
  }

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedVehicleId || !odoReading) {
      toast.error('Pemeriksaan Gagal', 'Sila pilih kenderaan dan masukkan bacaan odometer.')
      return
    }

    // Photo check constraints are now optional. Only odometer reading is compulsory.

    const odoValue = parseInt(odoReading, 10)
    if (isNaN(odoValue) || odoValue <= 0) {
      toast.error('Ralat Odometer', 'Bacaan odometer tidak sah.')
      return
    }

    if (inspType === 'post_trip' && preTripOdo !== null) {
      if (odoValue < preTripOdo) {
        toast.error(
          'Ralat Odometer', 
          `Bacaan odometer tamat (${odoValue.toLocaleString('ms-MY')} km) tidak boleh kurang daripada bacaan mula (${preTripOdo.toLocaleString('ms-MY')} km).`
        )
        return
      }
    }

    const hospitalId = loggedUser?.hospital_id || 'hosp-1'
    const driverId = loggedUser?.id || ''

    try {
      const inspectionPayload = {
        jenis_pemeriksaan: inspType,
        status_tayar: tyreStatus,
        foto_tayar: tyrePhoto || undefined,
        status_minyak_gas: gasStatus,
        foto_minyak_gas: gasPhoto || undefined,
        status_minyak_hitam: oilStatus,
        foto_minyak_hitam: oilPhoto || undefined,
        bacaan_odometer: odoValue,
        foto_odometer: odoPhoto || undefined,
        keputusan: decision,
        catatan: remarks || undefined,
        hospital_id: hospitalId
      }

      if (inspType === 'pre_trip') {
        const res = await driverAcceptRequest(selectedReq!.id, driverId, selectedVehicleId, inspectionPayload)
        if (res.error) throw new Error(res.error)
        
        if (decision === 'rejected') {
          toast.warning('Tugasan Ditolak', 'Trip ditolak disebabkan keadaan kenderaan dan dihantar ke log aduan kerosakan.')
          // Save rejection to localStorage
          if (loggedUser?.id && selectedReq) {
            const locallyRejected = localStorage.getItem(`rejected_requests_${loggedUser.id}`)
            const rejectedIds = locallyRejected ? JSON.parse(locallyRejected) : []
            if (!rejectedIds.includes(selectedReq.id)) {
              rejectedIds.push(selectedReq.id)
              localStorage.setItem(`rejected_requests_${loggedUser.id}`, JSON.stringify(rejectedIds))
            }
          }
        } else {
          toast.success('Tugasan Diterima', 'Pemeriksaan berjaya disahkan. Sila tunggu kelulusan Pentadbir.')
        }
      } else {
        // Post trip complete trip
        const res = await completeTrip(selectedReq!.id, driverId, selectedVehicleId, inspectionPayload)
        if (res.error) throw new Error(res.error)
        toast.success('Trip Selesai', 'Perjalanan selamat ditutup dengan pemeriksaan post-trip berjaya didaftarkan.')
      }

      setIsInspModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error('Ralat Mengurus Tugasan', err.message || 'Sila cuba lagi.')
    }
  }

  const handleStartTrip = async (reqId: string) => {
    try {
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await startTrip(reqId, loggedUser?.id || '', hospitalId)
      if (res.error) throw new Error(res.error)
      toast.success('Perjalanan Bermula', 'Status trip bertukar kepada Dalam Perjalanan (In Transit).')
      fetchData()
    } catch (err: any) {
      toast.error('Ralat Memulakan Perjalanan', err.message || 'Sila cuba lagi.')
    }
  }

  const handleOpenDirectReject = (reqId: string) => {
    setRejectingReqId(reqId)
    setRejectReason('')
    setIsRejectOpen(true)
  }

  const handleOpenCancelModal = (reqId: string) => {
    setCancellingReqId(reqId)
    setCancelReason('')
    setIsCancelOpen(true)
  }

  const handleCancelTripSubmit = async () => {
    if (!cancellingReqId || !cancelReason) {
      toast.error('Sebab Diperlukan', 'Sila isi sebab pembatalan trip.')
      return
    }

    try {
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await cancelRequest(cancellingReqId, loggedUser?.id || '', cancelReason, hospitalId)
      if (res.error) throw new Error(res.error)
      toast.success('Trip Dibatalkan', 'Trip berjaya dibatalkan.')
      setIsCancelOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error('Ralat Membatalkan Trip', err.message || 'Sila cuba lagi.')
    }
  }

  const handleDirectRejectSubmit = async () => {
    if (!rejectingReqId || !rejectReason) {
      toast.error('Sebab Diperlukan', 'Sila isi sebab penolakan tugasan.')
      return
    }

    try {
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await driverRejectRequestDirect(rejectingReqId, loggedUser?.id || '', rejectReason, hospitalId)
      if (res.error) throw new Error(res.error)
      toast.success('Tugasan Ditolak', 'Tugasan dikembalikan ke dalam senarai sistem.')
      
      // Save rejection to localStorage
      if (loggedUser?.id) {
        const locallyRejected = localStorage.getItem(`rejected_requests_${loggedUser.id}`)
        const rejectedIds = locallyRejected ? JSON.parse(locallyRejected) : []
        if (!rejectedIds.includes(rejectingReqId)) {
          rejectedIds.push(rejectingReqId)
          localStorage.setItem(`rejected_requests_${loggedUser.id}`, JSON.stringify(rejectedIds))
        }
      }

      setIsRejectOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error('Gagal Menolak Tugasan', err.message || 'Sila cuba lagi.')
    }
  }

  const handleOpenDetails = async (req: TransportRequest) => {
    setSelectedReq(req)
    setIsDetailOpen(true)
    setLoadingLogs(true)
    try {
      const res = await getRequestLogs(req.id)
      if (res.data) {
        setLogs(res.data)
      } else {
        setLogs([])
      }
    } catch (err) {
      console.error('Failed to load request logs', err)
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="gray">Draf</Badge>
      case 'submitted':
        return <Badge variant="info">Dihantar (Baru)</Badge>
      case 'driver_accepted':
        return <Badge variant="warning">Diterima Pemandu</Badge>
      case 'driver_rejected':
        return <Badge variant="error">Pemandu Tolak</Badge>
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Ambulance className="w-8 h-8 text-emerald-600 animate-pulse" />
          Panel Tugasan Pemandu
        </h1>
        <p className="text-slate-500 text-sm">
          Semak, terima tugasan perjalanan pesakit/staf, dan lengkapkan semakan keselamatan kenderaan hospital.
        </p>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'incoming' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tugasan Menunggu Pemandu ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'active' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trip Aktif Saya ({myActiveTrips.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'history' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sejarah Tugasan ({myHistoryTrips.length})
        </button>
      </div>

      {/* Content based on tab */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Memproses maklumat tugasan...</div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: INCOMING REQUESTS QUEUE */}
          {activeTab === 'incoming' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {incomingRequests.length === 0 ? (
                <div className="md:col-span-2 p-12 text-center text-slate-500 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  Tiada tugasan pengangkutan baru buat masa ini.
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <Card key={req.id} className="border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col justify-between overflow-hidden">
                    <div 
                      onClick={() => handleOpenDetails(req)} 
                      className="cursor-pointer flex-1 flex flex-col hover:bg-slate-50/20 transition-colors"
                    >
                      <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-xs text-blue-600">{req.no_rujukan}</span>
                          {req.jenis_permohonan === 'ambulance' ? (
                            <Badge variant="error">Ambulans</Badge>
                          ) : req.jenis_permohonan === 'van_jenazah' ? (
                            <Badge variant="gray">Van Jenazah</Badge>
                          ) : (
                            <Badge variant="info">Kereta Jabatan (SG)</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4 flex-1">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800">{req.destinasi}</span>
                              <p className="text-xs text-slate-500">{req.tujuan_permohonan}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-700">
                              {new Date(req.tarikh_masa_diperlukan).toLocaleString('ms-MY')}
                            </span>
                          </div>

                          {(req.jenis_permohonan === 'ambulance' || req.bawa_pesakit) && req.nama_pesakit && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center gap-2 p-2 bg-rose-50 text-rose-800 rounded-lg text-xs font-bold">
                                <User className="w-3.5 h-3.5" />
                                <span>Pesakit: {req.nama_pesakit} ({req.rn_pesakit})</span>
                              </div>
                              {req.patient_mobility && (
                                <div className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold border ${
                                  req.patient_mobility === 'stretcher' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  <Info className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Mobiliti: <span className="capitalize">{req.patient_mobility === 'stretcher' ? 'Stretcher / Usungan (WAJIB AMBIL DARI WAD)' : req.patient_mobility}</span></span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                      <Button 
                        onClick={() => handleOpenInspection(req, 'pre_trip')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Semak & Terima
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleOpenDirectReject(req.id)}
                        className="text-xs border-slate-200 text-rose-600 hover:bg-rose-50/50"
                      >
                        Tolak
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 2: MY ACTIVE TRIPS */}
          {activeTab === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myActiveTrips.length === 0 ? (
                <div className="md:col-span-2 p-12 text-center text-slate-500 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  Tiada trip pengangkutan aktif yang didaftarkan di bawah anda.
                </div>
              ) : (
                myActiveTrips.map((req) => (
                  <Card key={req.id} className="border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
                    <div 
                      onClick={() => handleOpenDetails(req)}
                      className="cursor-pointer flex-1 flex flex-col hover:bg-slate-50/20 transition-colors"
                    >
                      <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row justify-between items-center">
                        <span className="font-mono font-bold text-xs text-blue-600">{req.no_rujukan}</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {req.status_semasa === 'driver_accepted' && 'Menunggu Kelulusan Admin'}
                          {req.status_semasa === 'approved' && 'Diluluskan (Sedia Jalan)'}
                          {req.status_semasa === 'in_transit' && 'Dalam Transit'}
                        </span>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4 flex-1">
                        <div className="space-y-2 text-sm">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            {req.destinasi}
                          </div>
                          <p className="text-xs text-slate-500">{req.tujuan_permohonan}</p>

                          <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400 block">Tarikh Trip:</span>
                              <span className="font-bold">{new Date(req.tarikh_masa_diperlukan).toLocaleDateString('ms-MY')}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Kenderaan Diagih:</span>
                              <span className="font-bold text-blue-600 font-mono">{req.kenderaan?.no_kenderaan}</span>
                            </div>
                          </div>

                          {(req.jenis_permohonan === 'ambulance' || req.bawa_pesakit) && req.nama_pesakit && (
                            <div className="space-y-1.5 pt-2">
                              <div className="flex items-center gap-2 p-2 bg-rose-50 text-rose-800 rounded-lg text-xs font-bold">
                                <User className="w-3.5 h-3.5" />
                                <span>Pesakit: {req.nama_pesakit} ({req.rn_pesakit})</span>
                              </div>
                              {req.patient_mobility && (
                                <div className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold border ${
                                  req.patient_mobility === 'stretcher' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  <Info className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Mobiliti: <span className="capitalize">{req.patient_mobility === 'stretcher' ? 'Stretcher / Usungan (WAJIB AMBIL DARI WAD)' : req.patient_mobility}</span></span>
                                </div>
                              )}
                            </div>
                          )}

                          {req.status_semasa === 'driver_accepted' && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-start gap-2 mt-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p>
                                Pre-trip selesai. Sila tunggu kelulusan dari admin sebelum menekan butang <strong>Mula Trip</strong>.
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                    
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                      {req.status_semasa === 'approved' && (
                        <>
                          <Button 
                            onClick={() => handleStartTrip(req.id)}
                            disabled={!isTripToday(req.tarikh_masa_diperlukan)}
                            className={`w-full font-bold flex items-center justify-center gap-2 transition-all ${
                              !isTripToday(req.tarikh_masa_diperlukan)
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none hover:bg-slate-100'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            {isTripToday(req.tarikh_masa_diperlukan) ? 'Mula Trip (Start Journey)' : 'Mula Trip (Tersedia pada tarikh trip)'}
                          </Button>
                          <Button
                            onClick={() => handleOpenCancelModal(req.id)}
                            variant="outline"
                            className="w-full border-red-200 hover:bg-red-50 text-red-650 hover:text-red-750 font-bold flex items-center justify-center gap-2"
                          >
                            Batal Trip (Cancel Journey)
                          </Button>
                        </>
                      )}
                      
                      {req.status_semasa === 'in_transit' && (
                        <Button 
                          onClick={() => handleOpenInspection(req, 'post_trip')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Selesai Trip & Post-Trip Inspection
                        </Button>
                      )}

                      {req.status_semasa === 'driver_accepted' && (
                        <Button 
                          disabled
                          className="w-full bg-slate-200 text-slate-500 cursor-not-allowed font-bold"
                        >
                          Menunggu Kelulusan Admin
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TRIP HISTORY */}
          {activeTab === 'history' && (
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {myHistoryTrips.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">Tiada sejarah tugasan lampau ditemui.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-4">No. Rujukan</th>
                          <th className="px-6 py-4">Jenis</th>
                          <th className="px-6 py-4">Destinasi</th>
                          <th className="px-6 py-4">Selesai Perjalanan</th>
                          <th className="px-6 py-4">Kenderaan</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {myHistoryTrips.map((req) => (
                          <tr 
                            key={req.id}
                            onClick={() => handleOpenDetails(req)}
                            className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono font-bold text-slate-600">{req.no_rujukan}</td>
                            <td className="px-6 py-4 capitalize font-semibold">
                              {req.jenis_permohonan === 'sg' 
                                ? 'Kereta Jabatan (SG)' 
                                : req.jenis_permohonan === 'van_jenazah' 
                                ? 'Van Jenazah' 
                                : 'Ambulans'}
                            </td>
                            <td className="px-6 py-4">{req.destinasi}</td>
                            <td className="px-6 py-4">
                              {req.trip_completed_at ? new Date(req.trip_completed_at).toLocaleString('ms-MY') : '-'}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-blue-600">{req.kenderaan?.no_kenderaan || '-'}</td>
                            <td className="px-6 py-4">
                              {req.status_semasa === 'completed' && <Badge variant="success">Selesai</Badge>}
                              {req.status_semasa === 'rejected' && <Badge variant="error">Ditolak Pentadbir</Badge>}
                              {req.status_semasa === 'cancelled' && <Badge variant="gray">Dibatalkan</Badge>}
                              {(req.status_semasa === 'driver_rejected' || 
                                (loggedUser?.id && 
                                 JSON.parse(localStorage.getItem(`rejected_requests_${loggedUser.id}`) || '[]').includes(req.id))
                              ) && <Badge variant="error">Ditolak Pemandu</Badge>}
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
      )}

      {/* 1. INSPECTION MODAL (Pre-Trip / Post-Trip) */}
      {isInspModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full mx-4 my-8 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {inspType === 'pre_trip' ? 'Pemeriksaan Keselamatan Kenderaan (Pre-Trip)' : 'Laporan Pemeriksaan Kenderaan (Post-Trip)'}
                </h3>
                <p className="text-xs text-slate-400">Pemeriksaan sebelum/selepas perjalanan. Bukti foto adalah pilihan.</p>
              </div>
              <Badge variant="info" className="uppercase font-mono">{selectedReq.no_rujukan}</Badge>
            </div>

            <form onSubmit={handleInspectionSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Vehicle Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kenderaan Hospital</label>
                {inspType === 'pre_trip' ? (
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 transition-colors"
                    required
                  >
                    <option value="">Sila Pilih Kenderaan</option>
                    {vehicles
                      .filter(v => v.jenis_kenderaan === selectedReq.jenis_permohonan)
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.no_kenderaan} - {v.model}
                        </option>
                      ))}
                  </select>
                ) : (
                  <Input 
                    value={selectedReq.kenderaan?.no_kenderaan || ''} 
                    disabled 
                    className="bg-slate-100 font-bold"
                  />
                )}
              </div>
              {/* 4 MANDATORY INSPECTION CHECKLIST ITEMS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Senarai Semak & Bukti Foto</h4>
                
                {/* Tyre */}
                <div className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-700">1. Keadaan Tayar & Rim</span>
                    <p className="text-xs text-slate-400">Tekanan angin mencukupi, rim kukuh, tayar tidak botak.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={tyreStatus} 
                      onChange={(e) => setTyreStatus(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                    >
                      <option value="good">Baik (Good)</option>
                      <option value="issue">Rosak / Masalah (Issue)</option>
                    </select>
                    
                    {tyrePhoto && (tyrePhoto.startsWith('data:') || tyrePhoto.startsWith('http') || tyrePhoto.startsWith('/')) && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                        <img src={tyrePhoto} className="w-full h-full object-cover" alt="tayar" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePhotoCapture('tyre')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        tyrePhoto 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{tyrePhoto ? 'Selesai' : 'Ambil Foto'}</span>
                    </button>
                  </div>
                </div>

                {/* Gas */}
                <div className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-700">2. Paras Gas / Minyak Petrol</span>
                    <p className="text-xs text-slate-400">Minyak petrol mencukupi untuk pergi dan balik perjalanan.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={gasStatus} 
                      onChange={(e) => setGasStatus(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                    >
                      <option value="good">Mencukupi (Good)</option>
                      <option value="issue">Kritis / Isi Semula (Issue)</option>
                    </select>
                    
                    {gasPhoto && (gasPhoto.startsWith('data:') || gasPhoto.startsWith('http') || gasPhoto.startsWith('/')) && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                        <img src={gasPhoto} className="w-full h-full object-cover" alt="gas" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePhotoCapture('gas')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        gasPhoto 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{gasPhoto ? 'Selesai' : 'Ambil Foto'}</span>
                    </button>
                  </div>
                </div>

                {/* Oil */}
                <div className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-slate-700">3. Minyak Hitam / Enjin</span>
                    <p className="text-xs text-slate-400">Paras minyak hitam mencukupi, tiada kebocoran enjin.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={oilStatus} 
                      onChange={(e) => setOilStatus(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                    >
                      <option value="good">Mencukupi (Good)</option>
                      <option value="issue">Perlu Tambah / Servis (Issue)</option>
                    </select>
                    
                    {oilPhoto && (oilPhoto.startsWith('data:') || oilPhoto.startsWith('http') || oilPhoto.startsWith('/')) && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                        <img src={oilPhoto} className="w-full h-full object-cover" alt="minyak" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePhotoCapture('oil')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        oilPhoto 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{oilPhoto ? 'Selesai' : 'Ambil Foto'}</span>
                    </button>
                  </div>
                </div>

                {/* Odometer Photo */}
                <div className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="space-y-1 flex-1">
                    <span className="font-bold text-sm text-slate-700">4. Bacaan & Foto Odometer Kenderaan</span>
                    <p className="text-xs text-slate-400">Masukkan bacaan odometer (km) terkini (wajib) dan ambil foto sebagai bukti (pilihan).</p>
                    {inspType === 'post_trip' && preTripOdo !== null && (
                      <div className="mt-2 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                        Odometer Mula: <span className="font-bold font-mono text-slate-800">{preTripOdo.toLocaleString('ms-MY')} km</span>
                      </div>
                    )}
                    <div className="mt-3 max-w-xs">
                      <Input
                        type="number"
                        placeholder="Masukkan bacaan odometer (km)"
                        value={odoReading}
                        onChange={(e) => setOdoReading(e.target.value)}
                        required
                        className="bg-slate-50 border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {odoPhoto && (odoPhoto.startsWith('data:') || odoPhoto.startsWith('http') || odoPhoto.startsWith('/')) && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                        <img src={odoPhoto} className="w-full h-full object-cover" alt="odometer" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePhotoCapture('odo')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        odoPhoto 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{odoPhoto ? 'Selesai' : 'Ambil Foto'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* pre-trip decision toggle */}
              {inspType === 'pre_trip' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keputusan Pemeriksaan Pemandu</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDecision('cleared')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        decision === 'cleared'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <span className="font-bold text-sm">Selamat Jalan (Good to Go)</span>
                      <span className="text-xxs text-slate-400">Saya sedia menerima tugasan ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision('rejected')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        decision === 'rejected'
                          ? 'border-rose-600 bg-rose-50/50 text-rose-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <AlertTriangle className="w-6 h-6 text-rose-600" />
                      <span className="font-bold text-sm">Tolak Tugasan (Kerosakan)</span>
                      <span className="text-xxs text-slate-400">Kenderaan tidak selamat digunakan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Remarks explanation (Mandatory if rejected) */}
              {(decision === 'rejected' || tyreStatus === 'issue' || gasStatus === 'issue' || oilStatus === 'issue') && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-rose-800 uppercase tracking-wider">Catatan Kerosakan & Isu (Mandatori)</label>
                  <textarea
                    rows={3}
                    placeholder="Sila jelaskan kerosakan/isu kenderaan secara terperinci untuk rujukan penyelenggaraan..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-rose-200 hover:border-rose-300 rounded-xl p-3 text-sm outline-none focus:border-rose-500 transition-colors"
                    required
                  />
                </div>
              )}

            </form>

            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsInspModalOpen(false)}
                className="border-slate-200 text-slate-700"
              >
                Tutup
              </Button>
              <Button 
                onClick={handleInspectionSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Hantar Laporan Semakan
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* 3. TRIP CANCELLATION MODAL */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4 space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-650" />
              Batalkan Trip Pengangkutan
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila nyatakan sebab pembatalan trip perjalanan ini. Tindakan ini akan membatalkan tempahan kenderaan ini.
            </p>

            <textarea 
              rows={3}
              placeholder="Sila nyatakan sebab pembatalan (contoh: Mesyuarat ditangguhkan, kereta rosak, dll)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-sm outline-none focus:border-red-500 transition-colors"
              required
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCancelOpen(false)}
                className="border-slate-200 text-slate-700"
              >
                Batal
              </Button>
              <Button 
                onClick={handleCancelTripSubmit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Sahkan Batal Trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DIRECT REJECT REASON MODAL (No inspection) */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Tolak Tugasan Pengangkutan
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila nyatakan sebab penolakan tugasan ini. Tugasan akan dikembalikan ke senarai utama untuk pemandu lain bertugas.
            </p>

            <textarea 
              rows={3}
              placeholder="Contoh: Terlibat dengan permohonan lain / luar kawasan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-rose-500 transition-colors"
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
                onClick={handleDirectRejectSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Tolak & Pulang Tugasan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TRIP DETAILS SLIDEOVER */}
      <SlideOver
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Maklumat Perjalanan: ${selectedReq?.no_rujukan}`}
        description="Semak status kelulusan, pre-trip inspection, dan log pergerakan"
      >
        {selectedReq && (
          <div className="p-6 space-y-6">
            
            {/* Overview Section */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Semasa</span>
                {getStatusBadge(selectedReq.status_semasa)}
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-800">{selectedReq.destinasi}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedReq.tujuan_permohonan}</div>
              </div>
            </div>

            {/* Basic Info Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Maklumat Perjalanan</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <span className="block text-xs font-bold text-slate-400">Jenis Perkhidmatan</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedReq.jenis_permohonan === 'sg' 
                      ? 'Kereta Jabatan (SG)' 
                      : selectedReq.jenis_permohonan === 'van_jenazah' 
                      ? 'Van Jenazah' 
                      : 'Ambulans'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400">Unit Pemohon</span>
                  <span className="font-semibold text-slate-800">{selectedReq.unit_pemohon}</span>
                </div>
                {selectedReq.nama_pemohon && (
                  <div>
                    <span className="block text-xs font-bold text-slate-400">Nama Pemohon</span>
                    <span className="font-semibold text-slate-800">{selectedReq.nama_pemohon}</span>
                  </div>
                )}
                 <div>
                  <span className="block text-xs font-bold text-slate-400">Tarikh & Masa</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedReq.tarikh_masa_diperlukan).toLocaleString('ms-MY')}
                    {selectedReq.tarikh_masa_sehingga && (
                      <>
                        <span className="text-slate-400 font-normal"> hingga </span>
                        {new Date(selectedReq.tarikh_masa_sehingga).toLocaleString('ms-MY')}
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400">Kakitangan Pengiring</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedReq.pengiring_list && selectedReq.pengiring_list.length > 0 ? (
                      <span className="block space-y-0.5 mt-1">
                        {selectedReq.pengiring_list.map((escort, idx) => (
                          <span key={idx} className="block text-xs font-medium normal-case">
                            • <span className="capitalize text-slate-500">{escort.job.replace(/_/g, ' ')}</span>: {escort.name}
                          </span>
                        ))}
                      </span>
                    ) : (
                      selectedReq.pengiring ? selectedReq.pengiring.replace(/_/g, ' ') : 'Tiada'
                    )}
                  </span>
                </div>
                {selectedReq.jenis_permohonan === 'sg' && (
                  <>
                    <div>
                      <span className="block text-xs font-bold text-slate-400">Keperluan Perkhidmatan</span>
                      <span className="font-semibold text-slate-800">
                        {selectedReq.pemandu_diperlukan ? 'Pemandu & Kereta' : 'Kereta Sahaja (Tanpa Pemandu)'}
                      </span>
                    </div>
                    {selectedReq.senarai_penumpang && selectedReq.senarai_penumpang.length > 0 && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-100/60">
                        <span className="block text-xs font-bold text-slate-400">Senarai Penumpang (Staf/Pengikut)</span>
                        <div className="text-xs font-medium text-slate-800 space-y-0.5 mt-1">
                          {selectedReq.senarai_penumpang.map((passenger, idx) => (
                            <div key={idx}>• {passenger.name}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedReq.medical_officer_referring && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-100/60">
                    <span className="block text-xs font-bold text-slate-400">Pegawai Perubatan Merujuk (Referring MO)</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      Dr. {selectedReq.medical_officer_referring.name} | Jabatan: {selectedReq.medical_officer_referring.department}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Patient details (Conditional) */}
            {(selectedReq.jenis_permohonan === 'ambulance' || selectedReq.bawa_pesakit) && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1 text-rose-700">Maklumat Pesakit</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm bg-rose-50/20 p-4 rounded-xl border border-rose-100">
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-rose-800/60">Nama Penuh</span>
                    <span className="font-bold text-slate-800">{selectedReq.nama_pesakit || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-rose-800/60">No RN Pesakit</span>
                    <span className="font-semibold font-mono text-slate-800">{selectedReq.rn_pesakit || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-rose-800/60">Jantina</span>
                    <span className="font-semibold text-slate-800">{selectedReq.jantina_pesakit || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-rose-800/60">Diagnosis Pesakit</span>
                    <span className="font-semibold text-slate-800">{selectedReq.diagnosis_pesakit || '-'}</span>
                  </div>
                  {selectedReq.patient_mobility && (
                    <div className={`col-span-2 p-2.5 rounded-lg text-xs font-bold flex flex-col gap-1 border ${
                      selectedReq.patient_mobility === 'stretcher'
                        ? 'bg-amber-50 border-amber-250 text-amber-955'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Info className={`w-3.5 h-3.5 ${selectedReq.patient_mobility === 'stretcher' ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>Mobiliti Pesakit: <span className="capitalize">{selectedReq.patient_mobility === 'stretcher' ? 'Stretcher / Usungan' : selectedReq.patient_mobility}</span></span>
                      </div>
                      {selectedReq.patient_mobility === 'stretcher' && (
                        <p className="text-[10px] text-amber-800 font-medium leading-normal mt-0.5 pl-5.5">
                          ⚠️ Pemandu WAJIB naik ke wad untuk mengambil pesakit.
                        </p>
                      )}
                    </div>
                  )}
                  {selectedReq.oksigen_diperlukan && (
                    <div className="col-span-2 p-2.5 bg-rose-50 border border-rose-150 rounded-lg text-xs font-bold text-rose-955 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sokongan Oksigen Berterusan Diperlukan</span>
                      </div>
                      {selectedReq.jenis_oksigen && (
                        <div className="text-xxs text-rose-800 font-medium pl-5.5">
                          Alat Oksigen: <span className="text-rose-900 font-semibold">{selectedReq.jenis_oksigen}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedReq.mesin_diperlukan && selectedReq.mesin_diperlukan.length > 0 && (
                    <div className="col-span-2 pt-2">
                      <span className="block text-xs font-bold text-rose-800/60">Peralatan / Mesin Diperlukan</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {selectedReq.mesin_diperlukan.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle & Driver Details */}
            {selectedReq.kenderaan && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Kenderaan & Pemandu Bertugas</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-400">Pemandu</span>
                    <span className="font-bold text-slate-800">{selectedReq.pemandu?.full_name || 'Ali bin Ahmad'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400">No. Pendaftaran Kenderaan</span>
                    <span className="font-bold text-blue-600 font-mono">{selectedReq.kenderaan.no_kenderaan}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-slate-400">Model Kenderaan</span>
                    <span className="font-semibold text-slate-800">{selectedReq.kenderaan.model}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection / Cancellation note */}
            {selectedReq.sebab_tolak && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-955 rounded-xl space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Catatan Sebab Penolakan / Pembatalan</h4>
                <p className="text-sm font-semibold italic">"{selectedReq.sebab_tolak}"</p>
              </div>
            )}

            {/* Audit Logs Trail */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Jejak Audit Kelulusan</h4>
              {loadingLogs ? (
                <div className="text-xs text-slate-500">Memuatkan log audit...</div>
              ) : logs.length === 0 ? (
                <div className="text-xs text-slate-400">Tiada log direkodkan.</div>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      {/* Circle indicator */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-300 rounded-full border border-white" />
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>{log.tindakan}</span>
                        <span className="text-slate-400 font-medium">
                          {new Date(log.created_at).toLocaleString('ms-MY', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">{log.catatan}</div>
                      <div className="text-slate-400 mt-0.5">Oleh: {log.performer?.full_name || 'Kakitangan'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

    </div>
  )
}

export default TransporterDriverPanelPage
