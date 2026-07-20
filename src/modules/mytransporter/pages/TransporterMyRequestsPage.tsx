// src/modules/mytransporter/pages/TransporterMyRequestsPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Car, 
  Search, 
  Calendar, 
  Printer, 
  Trash2, 
  Info,
  Clock,
  User,
  Shield,
  FileText,
  Plus,
  ClipboardList,
  Truck
} from 'lucide-react'
import { Ambulance } from '../components/AmbulanceIcon'
import { CrossborderDetailsPanel } from '../components/CrossborderDetailsPanel'
import { 
  generateCrossborderTransferFormPDF,
  generateCrossborderPermissionLetterPDF
} from '../services/transporterCrossborderPdf'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { 
  getRequests, 
  cancelRequest,
  getRequestLogs
} from '../services/transporterService'
import type { TransportRequest, TransportRequestLog } from '@/shared/types/mytransporter'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge, 
  Input, 
  Select,
  SlideOver
} from '@/components/ui'

const TransporterMyRequestsPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // SlideOver details
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [logs, setLogs] = useState<TransportRequestLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Cancel Modal states
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Edit Modal states
  const [isEditReasonOpen, setIsEditReasonOpen] = useState(false)
  const [editReason, setEditReason] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Print options state for crossborder
  const [printRequest, setPrintRequest] = useState<TransportRequest | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await getRequests()
      if (res.data) {
        // Regular staff only sees their own requests, admins see all
        const isStaffOnly = loggedUser?.role?.role_code !== 'system_admin' && 
                            loggedUser?.role?.role_code !== 'hospital_admin' &&
                            loggedUser?.role?.role_code !== 'transport_admin'
        
        if (isStaffOnly) {
          setRequests(res.data.filter(r => r.pemohon_id === loggedUser?.id))
        } else {
          setRequests(res.data)
        }
      }
    } catch (err: any) {
      toast.error('Gagal Memuatkan Permohonan', err.message || 'Sila cuba sebentar lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [loggedUser])

  const handleOpenDetails = async (req: TransportRequest) => {
    setSelectedRequest(req)
    setIsDetailOpen(true)
    setLoadingLogs(true)
    try {
      const res = await getRequestLogs(req.id)
      if (res.data) setLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleOpenCancel = (reqId: string) => {
    setCancellingId(reqId)
    setCancelReason('')
    setIsCancelOpen(true)
  }

  const handleCancelSubmit = async () => {
    if (!cancellingId || !cancelReason) {
      toast.error('Sebab Diperlukan', 'Sila isi sebab pembatalan.')
      return
    }

    try {
      const hospitalId = loggedUser?.hospital_id || 'hosp-1'
      const res = await cancelRequest(cancellingId, loggedUser?.id || '', cancelReason, hospitalId)
      if (res.error) throw new Error(res.error)
      
      toast.success('Permohonan Dibatalkan', 'Permohonan pengangkutan berjaya dibatalkan.')
      setIsCancelOpen(false)
      fetchRequests()
      
      // Update selected request in SlideOver if currently viewed
      if (selectedRequest && selectedRequest.id === cancellingId) {
        setSelectedRequest(res.data)
        const updatedLogs = await getRequestLogs(cancellingId)
        if (updatedLogs.data) setLogs(updatedLogs.data)
      }
    } catch (err: any) {
      toast.error('Gagal Membatalkan', err.message || 'Sila cuba lagi.')
    }
  }

  const handleOpenEdit = (reqId: string) => {
    setEditingId(reqId)
    setEditReason('')
    setIsEditReasonOpen(true)
  }

  const handleEditSubmit = () => {
    if (!editingId || !editReason.trim()) {
      toast.error('Sebab Diperlukan', 'Sila isi sebab pindaan.')
      return
    }
    setIsEditReasonOpen(false)
    navigate(`/transporter/requests/edit/${editingId}`, { state: { reason: editReason } })
  }

  // PDF printout generation using jsPDF
  const getBase64ImageFromUrlLocal = async (imageUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.onerror = () => {
          resolve(null)
        }
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Failed to load image:', error)
      return null
    }
  }

  const handlePrintCrossborderForm = async (req: TransportRequest) => {
    try {
      const blob = await generateCrossborderTransferFormPDF(req)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Borang_Sempadan_${req.no_rujukan}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Muat Turun PDF', 'Borang Merentas Sempadan berjaya dimuat turun.')
    } catch (err: any) {
      toast.error('Ralat Cetakan', err.message || 'Gagal menjana PDF.')
    }
  }

  const handlePrintPermissionLetter = async (req: TransportRequest) => {
    try {
      const blob = await generateCrossborderPermissionLetterPDF(req)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Surat_Kebenaran_${req.no_rujukan}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Muat Turun PDF', 'Surat Kebenaran Rentasi Sempadan berjaya dimuat turun.')
    } catch (err: any) {
      toast.error('Ralat Cetakan', err.message || 'Gagal menjana PDF.')
    }
  }

  const handlePrintPDF = async (req: TransportRequest) => {
    const doc = new jsPDF()
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15

    // Load Logo
    const logoBase64 = await getBase64ImageFromUrlLocal('/512px-Jata_MalaysiaV2.svg.png')

    // --- Helper: Draw Watermark ---
    const drawWatermark = () => {
      if (logoBase64) {
        try {
          doc.saveGraphicsState()
          const GState = (doc as any).GState || (jsPDF as any).GState
          if (GState) {
            doc.setGState(new GState({ opacity: 0.05 }))
          }
          // Center of page (90x90mm)
          doc.addImage(logoBase64, 'PNG', (pageWidth - 90) / 2, (pageHeight - 90) / 2, 90, 90)
          doc.restoreGraphicsState()
        } catch (err) {
          console.error('Error drawing watermark:', err)
        }
      }
    }

    // Draw Watermark first so it is underneath everything
    drawWatermark()

    // 1. Logo & Top Info (Official Malaysian Coat of Arms)
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 12, 22.5, 18)
    }

    // Header Typography (Official Serif/Times style)
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text('KEMENTERIAN KESIHATAN MALAYSIA', margin + 26, 17)
    doc.setFontSize(13)
    doc.text('HOSPITAL LAWAS', margin + 26, 22.5)
    
    doc.setFont('times', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text('Jalan Hospital, 98850 Lawas, Sarawak, Malaysia', margin + 26, 27)
    doc.text('Telefon: 085-283781  |  Faks: 085-283782  |  E-mel: hospital.lawas@moh.gov.my', margin + 26, 31.5)

    // Dual Divider Line (Thick & Thin)
    doc.setDrawColor(15, 23, 42)
    doc.setLineWidth(0.8)
    doc.line(margin, 35, pageWidth - margin, 35)
    doc.setLineWidth(0.2)
    doc.line(margin, 36.2, pageWidth - margin, 36.2)

    // Document Title
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text('BORANG KEBENARAN PENGGUNAAN KENDERAAN HOSPITAL', 105, 45, { align: 'center' })

    // Body content grid
    doc.setFontSize(10)
    doc.setFont('Helvetica', 'bold')
    doc.text('BUTIRAN PERMOHONAN', 15, 54)
    doc.setFont('Helvetica', 'normal')

    const escortStr = req.pengiring_list && req.pengiring_list.length > 0
      ? req.pengiring_list.map(e => `${e.job.replace(/_/g, ' ').toUpperCase()} (${e.name})`).join(', ')
      : (req.pengiring ? req.pengiring.toUpperCase() : 'TIADA')

    const jenisPeminjamanStr = req.jenis_permohonan === 'sg'
      ? (req.pemandu_diperlukan ? 'Kenderaan & Pemandu' : 'Kenderaan Sahaja (Tanpa Pemandu)')
      : 'Kenderaan & Pemandu'

    const passengerStr = req.senarai_penumpang && req.senarai_penumpang.length > 0
      ? req.senarai_penumpang.map(p => p.name).join(', ')
      : (req.nama_pemohon || req.pemohon?.full_name || '-')

    const requestDetails = [
      ['No. Rujukan', req.no_rujukan],
      ['Jenis Pengangkutan', req.jenis_permohonan === 'ambulance' ? 'Ambulans' : req.jenis_permohonan === 'van_jenazah' ? 'Van Jenazah' : 'Kereta Jabatan (SG)'],
      ['Tujuan Perjalanan', req.tujuan_permohonan],
      ['Destinasi', req.destinasi],
      ['Tarikh & Masa Mula', new Date(req.tarikh_masa_diperlukan).toLocaleString('ms-MY')],
      ['Tarikh & Masa Tamat', req.tarikh_masa_sehingga ? new Date(req.tarikh_masa_sehingga).toLocaleString('ms-MY') : '-'],
      ['Jenis Peminjaman', jenisPeminjamanStr],
      ['Pengguna / Penumpang', passengerStr],
      ['Unit / Wad Pemohon', req.unit_pemohon],
      ['Pegawai Pengiring', escortStr],
      ['Status Kelulusan Semasa', req.status_semasa.toUpperCase()]
    ]

    autoTable(doc, {
      startY: 58,
      head: [['Perkara', 'Maklumat']],
      body: requestDetails,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9 }
    })

    let currentY = (doc as any).lastAutoTable.finalY + 10

    // Add Patient details if applicable
    if (req.jenis_permohonan === 'ambulance' || req.bawa_pesakit) {
      doc.setFont('Helvetica', 'bold')
      doc.text('BUTIRAN PESAKIT', 15, currentY)
      doc.setFont('Helvetica', 'normal')

      const patientDetails = [
        ['Nama Pesakit', req.nama_pesakit || '-'],
        ['Nombor RN', req.rn_pesakit || '-'],
        ['Jantina', req.jantina_pesakit || '-'],
        ['Diagnosis Pesakit', req.diagnosis_pesakit || '-'],
        ['Telefon Waris', req.telefon_pesakit || '-']
      ]

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Perkara', 'Maklumat Pesakit']],
        body: patientDetails,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }, // Match Slate-900 theme for professional consistency
        styles: { fontSize: 9 }
      })

      currentY = (doc as any).lastAutoTable.finalY + 10
    }

    // Vehicle & Driver Details
    if (req.kenderaan) {
      doc.setFont('Helvetica', 'bold')
      doc.text('BUTIRAN KENDERAAN & PEMANDU', 15, currentY)
      doc.setFont('Helvetica', 'normal')

      const vehicleDetails = [
        ['Nombor Pendaftaran', req.kenderaan.no_kenderaan],
        ['Model Kenderaan', req.kenderaan.model],
        ['Pemandu Bertugas', req.pemandu?.full_name || 'Driver Assigned'],
        ['Tarikh Lulus Pentadbiran', req.approved_at ? new Date(req.approved_at).toLocaleString('ms-MY') : '-']
      ]

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Perkara', 'Maklumat Fleet']],
        body: vehicleDetails,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }, // Match Slate-900 theme
        styles: { fontSize: 9 }
      })

      currentY = (doc as any).lastAutoTable.finalY + 12
    }

    // Ensure Perakuan sections fit on the page, else start on a new page
    if (currentY + 130 > pageHeight - margin) {
      doc.addPage()
      drawWatermark()
      currentY = 20
    }

    doc.setFontSize(9)

    // --- BAHAGIAN I: PERAKUAN PEMOHON ---
    doc.setFont('Helvetica', 'bold')
    doc.text('BAHAGIAN I: PERAKUAN PEMOHON', 15, currentY + 5)
    doc.setFont('Helvetica', 'normal')
    doc.text('Saya memperakui bahawa permohonan penggunaan kenderaan ini adalah untuk urusan rasmi.', 15, currentY + 11)

    // Applicant signature on the right
    doc.text('______________________________', 130, currentY + 23)
    doc.text('(Tandatangan Pemohon)', 130, currentY + 27)
    doc.text(`Nama: ${req.nama_pemohon || req.pemohon?.full_name || '-'}`, 130, currentY + 31)
    doc.text(`Tarikh: ${new Date(req.created_at).toLocaleDateString('ms-MY')}`, 130, currentY + 35)

    currentY += 42

    // Divider line
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.line(15, currentY, 195, currentY)
    currentY += 8

    // --- BAHAGIAN II: PENGESAHAN & KELULUSAN KETUA UNIT / JABATAN ---
    doc.setFont('Helvetica', 'bold')
    doc.text('BAHAGIAN II: PENGESAHAN & KELULUSAN KETUA UNIT / JABATAN', 15, currentY + 5)
    doc.setFont('Helvetica', 'normal')

    doc.text('Ulasan: ______________________________________________________________________', 15, currentY + 12)

    // Checkboxes for Lulus/Tidak Lulus
    doc.rect(15, currentY + 18, 4, 4) // Lulus box
    if (req.status_semasa === 'approved') {
      doc.text('/', 16.5, currentY + 21)
    }
    doc.text('LULUS', 22, currentY + 21.5)

    doc.rect(45, currentY + 18, 4, 4) // Tidak Lulus box
    if (req.status_semasa === 'rejected') {
      doc.text('/', 46.5, currentY + 21)
    }
    doc.text('TIDAK LULUS', 52, currentY + 21.5)

    // Signature on the right
    doc.text('______________________________', 130, currentY + 32)
    doc.text('(Tandatangan Ketua Unit / Jabatan)', 130, currentY + 36)
    doc.text('Nama: ________________________', 130, currentY + 40)
    doc.text(`Tarikh: ${req.approved_at ? new Date(req.approved_at).toLocaleDateString('ms-MY') : '________________'}`, 130, currentY + 44)

    currentY += 50

    // Divider line
    doc.line(15, currentY, 195, currentY)
    currentY += 8

    // --- BAHAGIAN III: UNTUK KEGUNAAN UNIT PENGANGKUTAN ---
    doc.setFont('Helvetica', 'bold')
    doc.text('BAHAGIAN III: UNTUK KEGUNAAN UNIT PENGANGKUTAN', 15, currentY + 5)
    doc.setFont('Helvetica', 'normal')

    doc.text(`Nama Pemandu: ${req.pemandu?.full_name || '________________________'}`, 15, currentY + 12)
    doc.text(`No. Pendaftaran Kenderaan: ${req.kenderaan?.no_kenderaan || '________________________'}`, 15, currentY + 18)
    doc.text('Ulasan: ______________________________________________________________________', 15, currentY + 24)

    // Signature on the right
    doc.text('______________________________', 130, currentY + 34)
    doc.text('(Tandatangan Ketua Unit Pengangkutan)', 130, currentY + 38)
    doc.text(`Tarikh: ${req.approved_at ? new Date(req.approved_at).toLocaleDateString('ms-MY') : '________________'}`, 130, currentY + 42)

    // Save PDF
    doc.save(`Permohonan_${req.no_rujukan}.pdf`)
    toast.success('PDF Dijana', `Permohonan ${req.no_rujukan} berjaya dimuat turun dalam format PDF.`)
  }

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.no_rujukan.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.destinasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.nama_pesakit && r.nama_pesakit.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || r.status_semasa === statusFilter
    const matchesType = typeFilter === 'all' || r.jenis_permohonan === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

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
    <div className="p-6 md:p-8 w-full space-y-6">
      
      {/* Back to dashboard */}
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Senarai Permohonan Pengangkutan</h1>
          <p className="text-slate-500 text-sm">
            Pantau dan semak permohonan Ambulans serta Kereta Jabatan hospital anda.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/transporter/requests/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Permohonan Baru</span>
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <Input 
              placeholder="Cari Rujukan / Destinasi / Pesakit"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type Filter */}
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
          >
            <option value="all">Semua Jenis Kenderaan</option>
            <option value="ambulance">Ambulans</option>
            <option value="sg">Kereta Jabatan (SG)</option>
            <option value="van_jenazah">Van Jenazah</option>
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
          >
            <option value="all">Semua Status</option>
            <option value="submitted">Dihantar (Baru)</option>
            <option value="driver_accepted">Diterima Pemandu</option>
            <option value="approved">Diluluskan Pentadbir</option>
            <option value="in_transit">Dalam Perjalanan</option>
            <option value="completed">Selesai</option>
            <option value="rejected">Ditolak Pentadbir</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setTypeFilter('all')
            }}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Kosongkan Penapis
          </Button>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Memuatkan permohonan...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-sm">Tiada Rekod Permohonan</p>
              <p className="text-xs">Sila buat permohonan baru untuk melihat rekod trip di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="px-6 py-4">No. Rujukan</th>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4">Tujuan & Destinasi</th>
                    <th className="px-6 py-4">Tarikh Trip</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600 select-all whitespace-nowrap">{req.no_rujukan}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {req.jenis_permohonan === 'ambulance' ? (
                            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Ambulance className="w-4.5 h-4.5" /></span>
                          ) : req.jenis_permohonan === 'van_jenazah' ? (
                            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg"><Truck className="w-4.5 h-4.5" /></span>
                          ) : (
                            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Car className="w-4.5 h-4.5" /></span>
                          )}
                          <span className="font-semibold capitalize">
                            {req.jenis_permohonan === 'sg' 
                              ? 'SG' 
                              : req.jenis_permohonan === 'van_jenazah' 
                              ? 'Van Jenazah' 
                              : 'Ambulans'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="font-bold text-slate-800 truncate max-w-xs">{req.destinasi}</div>
                          {req.is_crossborder && (
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5">
                              🌐 Sempadan
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">{req.tujuan_permohonan}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(req.tarikh_masa_diperlukan).toLocaleString('ms-MY', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(req.status_semasa)}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleOpenDetails(req)}
                          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1"
                        >
                          <Info className="w-3.5 h-3.5 mr-1 inline" />
                          Butiran
                        </Button>
                        
                        {(req.status_semasa === 'approved' || req.status_semasa === 'completed') && (
                          <Button 
                            variant="ghost"
                             onClick={() => req.is_crossborder ? setPrintRequest(req) : handlePrintPDF(req)}
                            className="text-xs text-blue-600 hover:text-blue-800 border border-blue-100 rounded-lg px-2.5 py-1 bg-blue-50/50"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1 inline" />
                            Cetak
                          </Button>
                        )}

                         {(req.status_semasa === 'submitted' || req.status_semasa === 'driver_accepted' || req.status_semasa === 'approved') && (
                          <Button 
                            variant="ghost"
                            onClick={() => handleOpenEdit(req.id)}
                            className="text-xs text-amber-600 hover:text-amber-800 border border-amber-100 rounded-lg px-2.5 py-1 bg-amber-50/50"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1 inline" />
                            Pinda
                          </Button>
                        )}

                        {(req.status_semasa === 'submitted' || req.status_semasa === 'driver_accepted') && (
                          <Button 
                            variant="ghost"
                            onClick={() => handleOpenCancel(req.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 border border-rose-100 rounded-lg px-2.5 py-1 bg-rose-50/50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1 inline" />
                            Batal
                          </Button>
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

      {/* 1. Request Detail Drawer */}
      <SlideOver
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Maklumat Perjalanan: ${selectedRequest?.no_rujukan}`}
        description="Semak status kelulusan, pre-trip inspection, dan log pergerakan"
      >
        {selectedRequest && (
          <div className="p-6 space-y-6">
            
            {/* Overview Section */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Semasa</span>
                {getStatusBadge(selectedRequest.status_semasa)}
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-800">{selectedRequest.destinasi}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedRequest.tujuan_permohonan}</div>
              </div>

              {selectedRequest.is_crossborder && (selectedRequest.status_semasa === 'approved' || selectedRequest.status_semasa === 'completed') && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60">
                  <Button
                    onClick={() => handlePrintCrossborderForm(selectedRequest)}
                    className="bg-blue-600 hover:bg-blue-750 text-white font-bold text-xxs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Borang Sempadan
                  </Button>
                  <Button
                    onClick={() => handlePrintPermissionLetter(selectedRequest)}
                    className="bg-teal-600 hover:bg-teal-750 text-white font-bold text-xxs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Surat Kebenaran
                  </Button>
                </div>
              )}
            </div>

            {/* Basic Info Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Maklumat Perjalanan</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <span className="block text-xs font-bold text-slate-400">Jenis Perkhidmatan</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedRequest.jenis_permohonan === 'sg' 
                      ? 'Kereta Jabatan (SG)' 
                      : selectedRequest.jenis_permohonan === 'van_jenazah' 
                      ? 'Van Jenazah' 
                      : 'Ambulans'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400">Unit Pemohon</span>
                  <span className="font-semibold text-slate-800">{selectedRequest.unit_pemohon}</span>
                </div>
                {selectedRequest.nama_pemohon && (
                  <div>
                    <span className="block text-xs font-bold text-slate-400">Nama Pemohon</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.nama_pemohon}</span>
                  </div>
                )}
                 <div>
                  <span className="block text-xs font-bold text-slate-400">Tarikh & Masa</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedRequest.tarikh_masa_diperlukan).toLocaleString('ms-MY')}
                    {selectedRequest.tarikh_masa_sehingga && (
                      <>
                        <span className="text-slate-400 font-normal"> hingga </span>
                        {new Date(selectedRequest.tarikh_masa_sehingga).toLocaleString('ms-MY')}
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400">Kakitangan Pengiring</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedRequest.pengiring_list && selectedRequest.pengiring_list.length > 0 ? (
                      <span className="block space-y-0.5 mt-1">
                        {selectedRequest.pengiring_list.map((escort, idx) => (
                          <span key={idx} className="block text-xs font-medium normal-case">
                            • <span className="capitalize text-slate-500">{escort.job.replace(/_/g, ' ')}</span>: {escort.name}
                          </span>
                        ))}
                      </span>
                    ) : (
                      selectedRequest.pengiring ? selectedRequest.pengiring.replace(/_/g, ' ') : 'Tiada'
                    )}
                  </span>
                </div>
                {selectedRequest.jenis_permohonan === 'sg' && (
                  <>
                    <div>
                      <span className="block text-xs font-bold text-slate-400">Keperluan Perkhidmatan</span>
                      <span className="font-semibold text-slate-800">
                        {selectedRequest.pemandu_diperlukan ? 'Pemandu & Kereta' : 'Kereta Sahaja (Tanpa Pemandu)'}
                      </span>
                    </div>
                    {selectedRequest.senarai_penumpang && selectedRequest.senarai_penumpang.length > 0 && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-100/60">
                        <span className="block text-xs font-bold text-slate-400">Senarai Penumpang (Staf/Pengikut)</span>
                        <div className="text-xs font-medium text-slate-800 space-y-0.5 mt-1">
                          {selectedRequest.senarai_penumpang.map((passenger, idx) => (
                            <div key={idx}>• {passenger.name}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedRequest.medical_officer_referring && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-100/60">
                    <span className="block text-xs font-bold text-slate-400">Pegawai Perubatan Merujuk (Referring MO)</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      Dr. {selectedRequest.medical_officer_referring.name} | Jabatan: {selectedRequest.medical_officer_referring.department}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Patient details (Conditional) */}
            {(selectedRequest.jenis_permohonan === 'ambulance' || selectedRequest.bawa_pesakit) && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                {selectedRequest.is_crossborder ? (
                  <>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1 text-blue-700">Butiran Rentasi Sempadan</h4>
                    <CrossborderDetailsPanel data={selectedRequest.crossborder_data} />
                  </>
                ) : (
                  <>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1 text-rose-700">Maklumat Pesakit</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm bg-rose-50/20 p-4 rounded-xl border border-rose-100">
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-rose-800/60">Nama Penuh</span>
                        <span className="font-bold text-slate-800">{selectedRequest.nama_pesakit || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-rose-800/60">No RN Pesakit</span>
                        <span className="font-semibold font-mono text-slate-800">{selectedRequest.rn_pesakit || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-rose-800/60">Jantina</span>
                        <span className="font-semibold text-slate-800">{selectedRequest.jantina_pesakit || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-bold text-rose-800/60">Diagnosis Pesakit</span>
                        <span className="font-semibold text-slate-800">{selectedRequest.diagnosis_pesakit || '-'}</span>
                      </div>
                      {selectedRequest.patient_mobility && (
                        <div className={`col-span-2 p-2.5 rounded-lg text-xs font-bold flex flex-col gap-1 border ${
                          selectedRequest.patient_mobility === 'stretcher'
                            ? 'bg-amber-50 border-amber-250 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Info className={`w-3.5 h-3.5 ${selectedRequest.patient_mobility === 'stretcher' ? 'text-amber-600' : 'text-slate-500'}`} />
                            <span>Mobiliti Pesakit: <span className="capitalize">{selectedRequest.patient_mobility === 'stretcher' ? 'Stretcher / Usungan' : selectedRequest.patient_mobility}</span></span>
                          </div>
                          {selectedRequest.patient_mobility === 'stretcher' && (
                            <p className="text-[10px] text-amber-800 font-medium leading-normal mt-0.5 pl-5.5">
                              ⚠️ Pemandu WAJIB naik ke wad untuk mengambil pesakit.
                            </p>
                          )}
                        </div>
                      )}
                  {selectedRequest.oksigen_diperlukan && (
                    <div className="col-span-2 p-2.5 bg-rose-50 border border-rose-150 rounded-lg text-xs font-bold text-rose-950 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sokongan Oksigen Berterusan Diperlukan</span>
                      </div>
                      {selectedRequest.jenis_oksigen && (
                        <div className="text-xxs text-rose-800 font-medium pl-5.5">
                          Alat Oksigen: <span className="text-rose-900 font-semibold">{selectedRequest.jenis_oksigen}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedRequest.mesin_diperlukan && selectedRequest.mesin_diperlukan.length > 0 && (
                    <div className="col-span-2 pt-2">
                      <span className="block text-xs font-bold text-rose-800/60">Peralatan / Mesin Diperlukan</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {selectedRequest.mesin_diperlukan.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

            {/* Vehicle & Driver Details */}
            {selectedRequest.kenderaan && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Kenderaan & Pemandu Bertugas</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-400">Pemandu</span>
                    <span className="font-bold text-slate-800">{selectedRequest.pemandu?.full_name || 'Ali bin Ahmad'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400">No. Pendaftaran Kenderaan</span>
                    <span className="font-bold text-blue-600 font-mono">{selectedRequest.kenderaan.no_kenderaan}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs font-bold text-slate-400">Model Kenderaan</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.kenderaan.model}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection / Cancellation note */}
            {selectedRequest.sebab_tolak && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Catatan Sebab Penolakan / Pembatalan</h4>
                <p className="text-sm font-semibold italic">"{selectedRequest.sebab_tolak}"</p>
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

      {/* 2. Cancellation Reason Confirmation Modal */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4 space-y-4 animate-scaleIn">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Sahkan Pembatalan Trip
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila nyatakan sebab pembatalan trip pengangkutan ini. Sebab yang diberikan akan didaftarkan dalam log audit sistem.
            </p>

            <textarea 
              rows={3}
              placeholder="Contoh: Pesakit dibenarkan pulang wad / Temujanji ditunda..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-rose-500 transition-colors"
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
                onClick={handleCancelSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Hantar & Batal Trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Amend/Edit Reason Confirmation Modal */}
      {isEditReasonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4 space-y-4 animate-scaleIn">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Nyatakan Sebab Pindaan
            </h3>
            
            <p className="text-xs text-slate-500">
              Sila nyatakan sebab permohonan pengangkutan ini perlu dipinda/dikemaskini. Sebab yang diberikan akan didaftarkan dalam log audit sistem.
            </p>

            <textarea 
              rows={3}
              placeholder="Contoh: Pertukaran tarikh temujanji / Pertukaran jantina pesakit..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-amber-500 transition-colors"
              required
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditReasonOpen(false)}
                className="border-slate-200 text-slate-700"
              >
                Batal
              </Button>
              <Button 
                onClick={handleEditSubmit}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Sahkan & Pinda
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Print Options Modal for Crossborder Requests */}
      {printRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full mx-4 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Pilihan Cetakan Dokumen Sempadan
              </h3>
              <button 
                type="button" 
                onClick={() => setPrintRequest(null)}
                className="text-slate-400 hover:text-slate-650 text-xl font-medium"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Permohonan ini adalah trip merentas sempadan. Sila pilih dokumen yang ingin dimuat turun / dicetak:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handlePrintPDF(printRequest)
                  setPrintRequest(null)
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">1. Borang Kebenaran Kenderaan Hospital</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Borang rasmi permohonan ambulans/kenderaan Lawas.</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handlePrintCrossborderForm(printRequest)
                  setPrintRequest(null)
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">2. Borang Deklarasi Merentas Sempadan</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Borang deklarasi pesakit dan pengiring bagi imigresen.</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => {
                  handlePrintPermissionLetter(printRequest)
                  setPrintRequest(null)
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">3. Surat Pelepasan Kebenaran Pengarah</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Surat kelulusan rasmi daripada Pengarah Hospital Lawas.</span>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={() => setPrintRequest(null)}
                className="border-slate-200 text-slate-700 text-xs px-3.5 py-1.5"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// XCircle helper
const XCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
)

export default TransporterMyRequestsPage
