// src/modules/mykunci/pages/KunciRegistryPage.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { 
  Key, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Building2, 
  Lock, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  QrCode
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { 
  getKunciDaftar, 
  addKunci, 
  updateKunci, 
  deleteKunci 
} from '@/modules/mykunci/services/kunciService'
import type { KunciDaftar, KunciJenis, KunciKawalan, KunciStatus, SampulStatus } from '@/shared/types/mykunci'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge, 
  Modal 
} from '@/components/ui'
import QRCode from 'qrcode'

// Mock list of departments matching database seed values
const MOCK_DEPARTMENTS = [
  { id: '7a3bd6c4-c8e6-491b-8441-0ee9bd73f880', department_name: 'Farmasi Logistik', department_code: 'PH-LOG' },
  { id: '0c6c6f1b-d3b6-4779-91c3-536956858fca', department_name: 'Farmasi Klinik Pakar', department_code: 'PH-CLIN' },
  { id: 'dept-3', department_name: 'Klinik Pakar Pesakit Luar', department_code: 'OPD' },
  { id: 'dept-4', department_name: 'Jabatan Kecemasan & Trauma', department_code: 'ED' },
  { id: 'dept-5', department_name: 'Pejabat Pentadbiran Utama', department_code: 'ADMIN' }
];

export const KunciRegistryPage: React.FC = () => {
  const loggedUser = useAuthStore((state) => state.user)
  const hospitalId = loggedUser?.hospital_id || 'hosp-1'
  const toast = useToast()
  
  const [keys, setKeys] = useState<KunciDaftar[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingKeyId, setEditingKeyId] = useState('')

  // QR Code display states
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedQrKey, setSelectedQrKey] = useState<KunciDaftar | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Form states
  const [kodKunci, setKodKunci] = useState('')
  const [namaKunci, setNamaKunci] = useState('')
  const [deptId, setDeptId] = useState('')
  const [lokasiFizikal, setLokasiFizikal] = useState('')
  const [jenisKunci, setJenisKunci] = useState<KunciJenis>('room')
  const [tahapKawalan, setTahapKawalan] = useState<KunciKawalan>('normal')
  const [status, setStatus] = useState<KunciStatus>('available')
  const [nomborPeti, setNomborPeti] = useState('')
  const [statusSampul, setStatusSampul] = useState<SampulStatus>('not_applicable')
  const [penjagaId, setPenjagaId] = useState('')

  const loadKeys = async () => {
    setLoading(true)
    try {
      const res = await getKunciDaftar()
      setKeys(res.data || [])
    } catch (err) {
      console.error('Failed to fetch keys', err)
      toast.error('Gagal memuatkan rekod kunci')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const handleOpenAddModal = () => {
    setIsEditing(false)
    setEditingKeyId('')
    setKodKunci('')
    setNamaKunci('')
    setDeptId(MOCK_DEPARTMENTS[0].id)
    setLokasiFizikal('')
    setJenisKunci('room')
    setTahapKawalan('normal')
    setStatus('available')
    setNomborPeti('')
    setStatusSampul('not_applicable')
    setPenjagaId(loggedUser?.id || 'user-1')
    setModalOpen(true)
  }

  const handleOpenEditModal = (key: KunciDaftar) => {
    const pw = window.prompt('Sila masukkan kata laluan untuk mengemaskini rekod kunci:')
    if (pw !== ' F@rmasi.2016 ' && pw?.trim() !== 'F@rmasi.2016') {
      toast.error('Kata laluan salah! Tindakan dibatalkan.')
      return
    }
    setIsEditing(true)
    setEditingKeyId(key.id)
    setKodKunci(key.kod_kunci)
    setNamaKunci(key.nama_kunci)
    setDeptId(key.department_id)
    setLokasiFizikal(key.lokasi_fizikal)
    setJenisKunci(key.jenis_kunci)
    setTahapKawalan(key.tahap_kawalan)
    setStatus(key.status)
    setNomborPeti(key.nombor_peti || '')
    setStatusSampul(key.status_sampul)
    setPenjagaId(key.penjaga_id || '')
    setModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kodKunci || !namaKunci || !deptId || !lokasiFizikal) {
      toast.error('Sila lengkapkan semua medan wajib!')
      return
    }

    const payload = {
      kod_kunci: kodKunci.trim().toUpperCase(),
      nama_kunci: namaKunci.trim(),
      department_id: deptId,
      lokasi_fizikal: lokasiFizikal.trim(),
      jenis_kunci: jenisKunci,
      tahap_kawalan: tahapKawalan,
      status: status,
      nombor_peti: nomborPeti.trim() || undefined,
      status_sampul: statusSampul,
      penjaga_id: penjagaId || undefined,
      hospital_id: hospitalId
    }

    try {
      if (isEditing && editingKeyId) {
        const res = await updateKunci(editingKeyId, payload)
        if (res.error) throw new Error(res.error)
        toast.success('Rekod kunci berjaya dikemas kini')
      } else {
        const res = await addKunci(payload)
        if (res.error) throw new Error(res.error)
        toast.success('Pendaftaran kunci baru berjaya disimpan')
      }
      setModalOpen(false)
      loadKeys()
    } catch (err: any) {
      toast.error(`Ralat menyimpan rekod: ${err.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    const pw = window.prompt('Sila masukkan kata laluan untuk memadam rekod kunci:')
    if (pw !== ' F@rmasi.2016 ' && pw?.trim() !== 'F@rmasi.2016') {
      toast.error('Kata laluan salah! Tindakan dibatalkan.')
      return
    }
    if (!window.confirm('Adakah anda pasti mahu memadamkan kunci ini dari daftar induk?')) return

    try {
      const res = await deleteKunci(id)
      if (res.error) throw new Error(res.error)
      toast.success('Kunci telah dipadam dari daftar')
      loadKeys()
    } catch (err: any) {
      toast.error(`Gagal memadam: ${err.message}`)
    }
  }

  const handleOpenQrModal = async (key: KunciDaftar) => {
    setSelectedQrKey(key)
    try {
      // Generate a client-side offline-safe QR code containing the kod_kunci
      const url = await QRCode.toDataURL(key.kod_kunci, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff'
        }
      })
      setQrDataUrl(url)
      setQrModalOpen(true)
    } catch (err) {
      console.error('Failed to generate QR Code', err)
      toast.error('Gagal menghasilkan QR Code')
    }
  }

  const handlePrintQr = () => {
    if (!selectedQrKey || !qrDataUrl) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Popup blocker menghalang tindakan cetak!')
      return
    }

    const deptName = MOCK_DEPARTMENTS.find(d => d.id === selectedQrKey.department_id)?.department_name || 'Lain-lain'
    const securityLabel = selectedQrKey.tahap_kawalan === 'high' ? '⚠️ KAWALAN TINGGI (DDA)' : 'KAWALAN AM'
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Label Kunci - ${selectedQrKey.kod_kunci}</title>
        <style>
          @page {
            size: 80mm 50mm;
            margin: 0;
          }
          body {
            font-family: monospace;
            margin: 0;
            padding: 3mm;
            width: 80mm;
            height: 50mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: white;
            color: black;
          }
          .title {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px dashed black;
            width: 100%;
            padding-bottom: 2px;
          }
          .code {
            font-size: 11px;
            font-weight: bold;
            margin-top: 2px;
            margin-bottom: 2px;
            font-family: monospace;
          }
          .qr-img {
            width: 22mm;
            height: 22mm;
            margin-bottom: 2px;
          }
          .meta {
            font-size: 7px;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
          }
          .security {
            font-size: 6px;
            font-weight: bold;
            margin-top: 2px;
            text-transform: uppercase;
            border-top: 1px dashed black;
            width: 100%;
            padding-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="title">HOSPITAL LAWAS - MYKUNCI</div>
        <div class="code">${selectedQrKey.kod_kunci}</div>
        <img class="qr-img" src="${qrDataUrl}" />
        <div class="meta"><b>${selectedQrKey.nama_kunci}</b></div>
        <div class="meta">Jabatan: ${deptName} | Lokasi: ${selectedQrKey.lokasi_fizikal}</div>
        <div class="security">${securityLabel}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Filter keys list based on UI values
  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      const matchesSearch = k.nama_kunci.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            k.kod_kunci.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            k.lokasi_fizikal.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDept = !deptFilter || k.department_id === deptFilter
      const matchesLevel = !levelFilter || k.tahap_kawalan === levelFilter
      const matchesStatus = !statusFilter || k.status === statusFilter

      return matchesSearch && matchesDept && matchesLevel && matchesStatus
    })
  }, [keys, searchTerm, deptFilter, levelFilter, statusFilter])

  const getStatusBadge = (status: KunciStatus) => {
    switch (status) {
      case 'available':
        return <Badge className="border-emerald-200 text-emerald-700 bg-emerald-50 font-bold uppercase text-[10px]">Tersedia</Badge>
      case 'borrowed':
        return <Badge className="border-amber-200 text-amber-700 bg-amber-50 font-bold uppercase text-[10px]">Dipinjam</Badge>
      case 'damaged':
        return <Badge className="border-rose-200 text-rose-700 bg-rose-50 font-bold uppercase text-[10px]">Rosak</Badge>
      case 'lost':
        return <Badge className="border-slate-300 text-slate-700 bg-slate-100 font-bold uppercase text-[10px]">Hilang</Badge>
      default:
        return <Badge className="border-slate-200 text-slate-600 bg-slate-50">{status}</Badge>
    }
  }

  const getKawalanBadge = (level: KunciKawalan) => {
    if (level === 'high') {
      return (
        <Badge className="border-rose-300 text-rose-700 bg-rose-50/50 flex items-center gap-1 w-fit font-bold text-[10px]">
          <Lock className="w-3 h-3 text-rose-600" />
          DDA / High-Security
        </Badge>
      )
    }
    return <Badge variant="gray" className="text-[10px]">Normal</Badge>
  }

  const getSampulBadge = (status: SampulStatus) => {
    switch (status) {
      case 'sealed':
        return <Badge className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]">Utuh (Sealed)</Badge>
      case 'broken':
        return <Badge className="border-rose-200 text-rose-700 bg-rose-50 text-[10px] animate-pulse">Terbuka (Broken)</Badge>
      default:
        return <span className="text-slate-400 text-xs">-</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-500" />
            Daftar Kunci & Inventori Jabatan
          </h1>
          <p className="text-sm text-slate-500">
            Daftar induk anak kunci, ibu kunci, peti simpanan, dan pengkelasan tahap keselamatan
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-soft font-semibold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Daftar Kunci Baru
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="rounded-xl shadow-soft bg-white border border-slate-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Cari nama, kod, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            >
              <option value="">Semua Jabatan</option>
              {MOCK_DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            >
              <option value="">Semua Tahap Kawalan</option>
              <option value="normal">Kawalan Normal</option>
              <option value="high">Kawalan DDA (High Security)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            >
              <option value="">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="borrowed">Dipinjam</option>
              <option value="damaged">Rosak</option>
              <option value="lost">Hilang</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Registry Table Card */}
      <Card className="rounded-2xl shadow-soft bg-white border border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Memuatkan daftar...</div>
          ) : filteredKeys.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <span>Tiada rekod ditemui. Sila cuba kata kunci lain atau daftar kunci baru.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">Kod Kunci</th>
                    <th className="p-4">Nama Kunci / Lokasi</th>
                    <th className="p-4">Jabatan</th>
                    <th className="p-4">Tahap Kawalan</th>
                    <th className="p-4">No. Peti Simpanan</th>
                    <th className="p-4">Sampul Bermeterai</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKeys.map((key) => {
                    const deptName = MOCK_DEPARTMENTS.find(d => d.id === key.department_id)?.department_name || 'Lain-lain'
                    return (
                      <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-700">
                          {key.kod_kunci}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{key.nama_kunci}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{key.lokasi_fizikal}</div>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                          {deptName}
                        </td>
                        <td className="p-4">
                          {getKawalanBadge(key.tahap_kawalan)}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {key.nombor_peti || <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-4">
                          {getSampulBadge(key.status_sampul)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(key.status)}
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenQrModal(key)}
                            className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 p-1"
                            title="Papar/Cetak QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(key)}
                            className="text-slate-400 hover:text-amber-500 hover:bg-amber-50 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(key.id)}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Kemaskini Butiran Kunci' : 'Daftar Kunci Baru'}
        size="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Kod Kunci *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., KUNCI-PH-LOG-01"
                value={kodKunci}
                onChange={(e) => setKodKunci(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Nama Kunci *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Kunci Stor Logistik A"
                value={namaKunci}
                onChange={(e) => setNamaKunci(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Milik Jabatan *
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                {MOCK_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Lokasi Fizikal Pintu/Peti *
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Pintu Masuk Stor Vaksin"
                value={lokasiFizikal}
                onChange={(e) => setLokasiFizikal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Jenis Kunci
              </label>
              <select
                value={jenisKunci}
                onChange={(e) => setJenisKunci(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="room">Pintu Bilik / Premis</option>
                <option value="cabinet">Drawer / Kabinet</option>
                <option value="cabinet_dda">Peti Dadah Kawalan (DDA)</option>
                <option value="vehicle">Kenderaan / Ambulans</option>
                <option value="other">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Tahap Kawalan Keselamatan
              </label>
              <select
                value={tahapKawalan}
                onChange={(e) => {
                  setTahapKawalan(e.target.value as any)
                  if (e.target.value === 'high' && jenisKunci === 'room') {
                    setStatusSampul('sealed') // Auto-default for duplicates
                  } else {
                    setStatusSampul('not_applicable')
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="normal">Normal Control</option>
                <option value="high">High Security (Witness Required)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Status Kunci
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="available">Tersedia (Dalam Peti)</option>
                <option value="borrowed">Dipinjam (Digunakan)</option>
                <option value="damaged">Rosak (Patah/Bengkok)</option>
                <option value="lost">Hilang / Dilaporkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Nombor Peti Simpanan (Peti Kunci)
              </label>
              <input
                type="text"
                placeholder="E.g., Peti Kunci Utama A-12"
                value={nomborPeti}
                onChange={(e) => setNomborPeti(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Status Sampul (Kunci Pendua Sahaja)
              </label>
              <select
                value={statusSampul}
                onChange={(e) => setStatusSampul(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="not_applicable">Tidak Berkenaan (Bukan Pendua)</option>
                <option value="sealed">Meterai Utuh (Sealed)</option>
                <option value="broken">Meterai Terbuka (Broken)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setModalOpen(false)}
              className="border-slate-200 text-slate-500 hover:bg-slate-50 px-4 py-2 border rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl shadow-soft"
            >
              Simpan Rekod
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR CODE MODAL */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Label QR Code Anak Kunci"
        size="md"
      >
        {selectedQrKey && (
          <div className="space-y-6 pt-2 pb-1 text-slate-800">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Hospital Lawas - MyKunci</span>
              <span className="text-sm font-bold font-mono border border-slate-300 px-3 py-1 bg-white rounded-lg shadow-sm mb-4">
                {selectedQrKey.kod_kunci}
              </span>
              
              {qrDataUrl ? (
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md">
                  <img src={qrDataUrl} alt={`QR Code for ${selectedQrKey.kod_kunci}`} className="w-48 h-48 select-none" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-200/50 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              
              <span className="text-xs font-bold text-slate-800 mt-4 max-w-full truncate">
                {selectedQrKey.nama_kunci}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold mt-1">
                Lokasi: {selectedQrKey.lokasi_fizikal}
              </span>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-100/70 rounded-2xl text-[11px] text-amber-700 leading-relaxed font-semibold">
              💡 Label ini boleh ditampal pada tag anak kunci fizikal. Gunakan butang di bawah untuk mencetak label sticker bersaiz 80mm x 50mm untuk dilekatkan pada kunci/peti.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="border-slate-200 text-slate-500 hover:bg-slate-50 px-4 py-2 border rounded-xl"
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={handlePrintQr}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl shadow-soft flex items-center gap-1.5"
              >
                Cetak Label Kunci
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default KunciRegistryPage
