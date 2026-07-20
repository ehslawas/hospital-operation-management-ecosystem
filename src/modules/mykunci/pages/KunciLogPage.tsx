// src/modules/mykunci/pages/KunciLogPage.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { 
  FileText, 
  Search, 
  Download, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react'
import { getKunciLogs, returnKunci } from '@/modules/mykunci/services/kunciService'
import type { KunciLog } from '@/shared/types/mykunci'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, FileUpload } from '@/components/ui'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'

const MOCK_BORROWERS = [
  { id: 'user-1', full_name: 'Muhammad Farhan bin Razali', jawatan: 'Pegawai Farmasi U41' },
  { id: 'user-2', full_name: 'Khairul Amin bin Zulkifli', jawatan: 'Penolong Pegawai Farmasi U32' },
  { id: 'user-3', full_name: 'Sarah binti Ahmad', jawatan: 'Penjaga Stor Farmasi U29' },
  { id: 'user-4', full_name: 'Dr. Jason Ling', jawatan: 'Pegawai Perubatan UD44' },
  { id: 'user-5', full_name: 'Noraini binti Hassan', jawatan: 'Pembantu Tadbir N19' }
];

export const KunciLogPage: React.FC = () => {
  const toast = useToast()
  const loggedUser = useAuthStore((state) => state.user)
  const [logs, setLogs] = useState<KunciLog[]>([])
  const [loading, setLoading] = useState(true)

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [activeLogToReturn, setActiveLogToReturn] = useState<KunciLog | null>(null)
  const [keyCondition, setKeyCondition] = useState<'good' | 'damaged'>('good')
  const [lockCondition, setLockCondition] = useState<'good' | 'damaged' | 'loose'>('good')
  const [remarks, setRemarks] = useState('')
  const [returnPhoto, setReturnPhoto] = useState<File | null>(null)
  const [returnDateTime, setReturnDateTime] = useState('')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await getKunciLogs()
      setLogs(res.data || [])
    } catch (err) {
      console.error('Failed to load logs', err)
      toast.error('Gagal memuatkan log pergerakan kunci')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLogToReturn) return
    if (!returnPhoto) {
      toast.error('Semakan Foto', 'Sila snap atau muat naik foto kunci sebelum memulangkan!')
      return
    }

    try {
      const returnPayload = {
        tarikh_masa_pulang: new Date(returnDateTime).toISOString(),
        pegawai_penerima_id: loggedUser?.id || 'user-1',
        keadaan_kunci: keyCondition,
        keadaan_mangga: lockCondition,
        catatan_penggunaan: remarks
      }

      const res = await returnKunci(activeLogToReturn.id, returnPayload)
      if (res.error) throw new Error(res.error)

      toast.success('Berjaya', 'Pemulangan kunci berjaya direkodkan')
      setReturnModalOpen(false)
      setActiveLogToReturn(null)
      setRemarks('')
      setReturnPhoto(null)
      setReturnDateTime('')
      
      loadLogs()
    } catch (err: any) {
      toast.error('Ralat Pemulangan', err.message || 'Gagal menyimpan rekod pemulangan')
    }
  }

  // Calculate filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const borrowerName = log.peminjam?.full_name || MOCK_BORROWERS.find(b => b.id === log.peminjam_id)?.full_name || ''
      const matchesSearch = 
        log.kunci?.nama_kunci.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.kunci?.kod_kunci.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.catatan_penggunaan && log.catatan_penggunaan.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = 
        statusFilter === '' ||
        (statusFilter === 'active' && !log.tarikh_masa_pulang) ||
        (statusFilter === 'returned' && log.tarikh_masa_pulang) ||
        (statusFilter === 'overdue' && !log.tarikh_masa_pulang && new Date(log.jangka_masa_pulang).getTime() < new Date().getTime())

      let matchesDate = true
      if (startDate) {
        matchesDate = matchesDate && new Date(log.tarikh_masa_ambil) >= new Date(startDate)
      }
      if (endDate) {
        // Set end date to end of the day
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        matchesDate = matchesDate && new Date(log.tarikh_masa_ambil) <= endDateTime
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [logs, searchTerm, statusFilter, startDate, endDate])

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours} j ${minutes} m`
    }
    return `${minutes} m`
  }

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const csvHeader = [
        'Tarikh Ambil',
        'Kod Kunci',
        'Nama Kunci',
        'Peminjam',
        'Pegawai Penyerah',
        'Saksi / Pegawai Kedua',
        'Jangkaan Pulang',
        'Tarikh Pulang',
        'Pegawai Penerima',
        'Keadaan Kunci',
        'Keadaan Mangga',
        'Catatan',
        'Tempoh Guna (Saat)'
      ].join(',')

      const csvRows = filteredLogs.map(log => {
        const borrower = log.peminjam?.full_name || MOCK_BORROWERS.find(b => b.id === log.peminjam_id)?.full_name || 'Kakitangan'
        const penyerah = log.pegawai_penyerah?.full_name || MOCK_BORROWERS.find(b => b.id === log.pegawai_penyerah_id)?.full_name || 'Kakitangan'
        const saksi = log.pegawai_saksi_id ? (log.pegawai_saksi?.full_name || MOCK_BORROWERS.find(b => b.id === log.pegawai_saksi_id)?.full_name || '') : ''
        const penerima = log.pegawai_penerima_id ? (log.pegawai_penerima?.full_name || MOCK_BORROWERS.find(b => b.id === log.pegawai_penerima_id)?.full_name || '') : ''

        return [
          `"${formatDateTime(log.tarikh_masa_ambil)}"`,
          `"${log.kunci?.kod_kunci || ''}"`,
          `"${log.kunci?.nama_kunci || ''}"`,
          `"${borrower}"`,
          `"${penyerah}"`,
          `"${saksi}"`,
          `"${formatDateTime(log.jangka_masa_pulang)}"`,
          `"${log.tarikh_masa_pulang ? formatDateTime(log.tarikh_masa_pulang) : 'Aktif'}"`,
          `"${penerima}"`,
          `"${log.keadaan_kunci || ''}"`,
          `"${log.keadaan_mangga || ''}"`,
          `"${log.catatan_penggunaan || ''}"`,
          log.duration_seconds || ''
        ].join(',')
      })

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [csvHeader, ...csvRows].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `Log_Pergerakan_Kunci_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Log berjaya dieksport ke fail CSV')
    } catch (err: any) {
      toast.error('Gagal mengeksport fail CSV')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-amber-500" />
            Log Pergerakan Kunci (Buku Daftar Keluar/Masuk)
          </h1>
          <p className="text-sm text-slate-500">
            Jejak jejak audit lengkap bagi semua anak kunci fizikal kerajaan mengikut syif tugasan
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl border font-semibold flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Eksport CSV
        </Button>
      </div>

      {/* Filter panel */}
      <Card className="rounded-xl shadow-soft bg-white border border-slate-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Cari kunci, peminjam, catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            >
              <option value="">Semua Transaksi</option>
              <option value="active">Sedang Dipinjam</option>
              <option value="returned">Sudah Dipulangkan</option>
              <option value="overdue">Overdue (Lewat)</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              placeholder="Tarikh Dari"
            />
          </div>

          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              placeholder="Tarikh Hingga"
            />
          </div>
        </div>
      </Card>

      {/* Logs Table Card */}
      <Card className="rounded-2xl shadow-soft bg-white border border-slate-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Memuatkan log...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <Calendar className="w-8 h-8 text-slate-300" />
              <span>Tiada log pergerakan ditemui bagi penapis semasa.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-4">Tarikh & Masa Ambil</th>
                    <th className="p-4">Butiran Kunci</th>
                    <th className="p-4">Peminjam</th>
                    <th className="p-4">Pegawai Penyerah / Saksi</th>
                    <th className="p-4">Tarikh Masa Pulang</th>
                    <th className="p-4">Penerima</th>
                    <th className="p-4">Tempoh Guna</th>
                    <th className="p-4">Catatan Laporan</th>
                    <th className="p-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const active = !log.tarikh_masa_pulang
                    const overdue = active && new Date(log.jangka_masa_pulang).getTime() < new Date().getTime()
                    
                    const borrower = log.peminjam?.full_name || MOCK_BORROWERS.find(b => b.id === log.peminjam_id)?.full_name || 'Kakitangan'
                    const penyerah = log.pegawai_penyerah?.full_name || MOCK_BORROWERS.find(b => b.id === log.pegawai_penyerah_id)?.full_name || 'Kakitangan'
                    const saksi = log.pegawai_saksi_id ? (log.pegawai_saksi?.full_name || MOCK_BORROWERS.find(b => b.id === log.pegawai_saksi_id)?.full_name) : null
                    const penerima = log.pegawai_penerima_id ? (log.pegawai_penerima?.full_name || MOCK_BORROWERS.find(b => b.id === log.pegawai_penerima_id)?.full_name) : '-'

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">
                          {formatDateTime(log.tarikh_masa_ambil)}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{log.kunci?.nama_kunci}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{log.kunci?.kod_kunci}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          {borrower}
                        </td>
                        <td className="p-4 text-xs">
                          <div className="text-slate-700">Penyerah: {penyerah}</div>
                          {saksi && (
                            <div className="text-slate-400 italic mt-0.5">Saksi: {saksi}</div>
                          )}
                        </td>
                        <td className="p-4">
                          {active ? (
                            <div className="space-y-1">
                              <Badge className="border-amber-200 text-amber-700 bg-amber-50 text-[9px] font-bold">
                                DALAM PENGGUNAAN
                              </Badge>
                              {overdue && (
                                <div>
                                  <Badge className="border-transparent text-white bg-rose-500 text-[9px] font-bold">
                                    OVERDUE (LEWAT)
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-slate-500">
                              {formatDateTime(log.tarikh_masa_pulang)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700 text-xs">
                          {penerima}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {formatDuration(log.duration_seconds)}
                        </td>
                        <td className="p-4 max-w-xs text-xs text-slate-500 truncate" title={log.catatan_penggunaan || ''}>
                          {log.catatan_penggunaan || <span className="text-slate-300">Tiada laporan insiden</span>}
                          {log.keadaan_kunci === 'damaged' && (
                            <div className="text-rose-600 font-bold text-[10px] mt-0.5">[!] Kunci Rosak</div>
                          )}
                          {log.keadaan_mangga === 'damaged' && (
                            <div className="text-rose-600 font-bold text-[10px] mt-0.5">[!] Mangga Rosak</div>
                          )}
                          {log.keadaan_mangga === 'loose' && (
                            <div className="text-amber-600 font-bold text-[10px] mt-0.5">[!] Mangga Longgar</div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {active ? (
                            <Button 
                              onClick={() => {
                                const now = new Date()
                                const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                                setReturnDateTime(localIso)
                                setActiveLogToReturn(log)
                                setReturnModalOpen(true)
                              }}
                              className="text-xs border-amber-500 text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg border font-bold"
                            >
                              Pulang Kunci
                            </Button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
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

      {/* RETURN MODAL */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Rekod Pemulangan Kunci Fizikal"
        size="2xl"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4 pt-2">
          {activeLogToReturn && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1 text-slate-600">
              <div>Kunci: <strong className="text-slate-800">{activeLogToReturn.kunci?.nama_kunci} ({activeLogToReturn.kunci?.kod_kunci})</strong></div>
              <div>Peminjam: <strong className="text-slate-800">{activeLogToReturn.peminjam?.full_name || MOCK_BORROWERS.find(b => b.id === activeLogToReturn.peminjam_id)?.full_name}</strong></div>
              <div>Masa Pinjam: <strong className="text-slate-800">{formatDateTime(activeLogToReturn.tarikh_masa_ambil)}</strong></div>
              <div>Masa Pulang (Rekod): <strong className="text-slate-800">{formatDateTime(new Date(returnDateTime).toISOString())}</strong></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Keadaan Fizikal Anak Kunci *
              </label>
              <select
                value={keyCondition}
                onChange={(e) => setKeyCondition(e.target.value as any)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="good">Baik / Tiada Keretakan (Good)</option>
                <option value="damaged">Rosak / Bengkok (Damaged)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                Keadaan Mangga / Padlock Pintu *
              </label>
              <select
                value={lockCondition}
                onChange={(e) => setLockCondition(e.target.value as any)}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="good">Kukuh / Berfungsi Baik</option>
                <option value="loose">Longgar / Longgatan Skru</option>
                <option value="damaged">Rosak / Engsel Rosak</option>
              </select>
            </div>
          </div>

          <div className="mt-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
              Tarikh & Masa Pulang *
            </label>
            <input
              type="datetime-local"
              required
              value={returnDateTime}
              onChange={(e) => setReturnDateTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
              Catatan Pemulangan & Laporan Kejadian (Jika Ada)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Cth: Kunci dipulangkan tepat pada masa. Mangga pintu berfungsi dengan baik..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="mt-4">
            <FileUpload
              label="Snap / Muat Naik Foto Kunci (Wajib) *"
              accept="image/*"
              required
              value={returnPhoto}
              onChange={(file) => setReturnPhoto(file)}
              helperText="Ambil gambar anak kunci fizikal yang dipulangkan untuk bukti simpanan"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={() => {
                setReturnModalOpen(false)
                setActiveLogToReturn(null)
                setReturnPhoto(null)
              }}
              className="border-slate-200 text-slate-500 hover:bg-slate-50 px-4 py-2 border rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!returnPhoto}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selesaikan Pulangan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default KunciLogPage
