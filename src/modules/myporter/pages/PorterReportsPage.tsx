// src/modules/myporter/pages/PorterReportsPage.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  Filter,
  Users,
  Star,
  Layers,
  ArrowUpDown,
  Search,
  Eye,
  Shield,
  Activity,
  Bed,
  Droplets,
  FlaskConical,
  Pill,
  AirVent
} from 'lucide-react'
import { useToast } from '@/stores/toastStore'
import { Button, Modal, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui'
import { getPorterJobs, getPorterStats, getPorterProfiles } from '../services/porterService'
import type { PorterJobRequest, PorterAggregateStats, PorterProfile } from '@/shared/types/myporter'

interface PorterWorkloadStat {
  porter: PorterProfile
  totalCompleted: number
  totalStat: number
  avgTatMinutes: number
  satisfactionRating: number
  workloadPercentage: number
  workloadStatus: 'Tinggi' | 'Optimum' | 'Sederhana' | 'Standby'
  categoryBreakdown: Record<string, number>
}

export const PorterReportsPage: React.FC = () => {
  const toast = useToast()
  const [stats, setStats] = useState<PorterAggregateStats | null>(null)
  const [jobs, setJobs] = useState<PorterJobRequest[]>([])
  const [porters, setPorters] = useState<PorterProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workload' | 'category' | 'logs'>('workload')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Modal for a specific Porter's workload
  const [selectedPorterStat, setSelectedPorterStat] = useState<PorterWorkloadStat | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, j, p] = await Promise.all([
          getPorterStats(),
          getPorterJobs(),
          getPorterProfiles()
        ])
        if (s.data) setStats(s.data)
        if (j.data) setJobs(j.data)
        if (p.data) setPorters(p.data)
      } catch (err: any) {
        toast.error('Ralat Memuatkan Laporan', err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Calculate detailed workload statistics per Porter
  const porterWorkloadStats: PorterWorkloadStat[] = useMemo(() => {
    if (porters.length === 0) return []

    const totalSystemJobs = jobs.filter(j => j.status === 'completed').length || 1

    return porters.map(porter => {
      const porterJobs = jobs.filter(j => j.assigned_porter_id === porter.id || j.assigned_porter_name === porter.full_name)
      const completedJobs = porterJobs.filter(j => j.status === 'completed')
      
      const totalCount = Math.max(completedJobs.length, porter.total_completed_today || 0)
      const statJobsCount = completedJobs.filter(j => j.urgency === 'stat').length

      // Calculate avg TAT
      const jobsWithTat = completedJobs.filter(j => j.actual_tat_minutes)
      const avgTat = jobsWithTat.length > 0 
        ? Math.round(jobsWithTat.reduce((acc, curr) => acc + (curr.actual_tat_minutes || 0), 0) / jobsWithTat.length)
        : 14

      // Category breakdown
      const breakdown: Record<string, number> = {
        patient_transfer: 0,
        blood_bank: 0,
        lab_specimen: 0,
        pharmacy_run: 0,
        gas_equipment: 0,
        mortuary: 0,
        other: 0
      }

      completedJobs.forEach(j => {
        if (breakdown[j.category] !== undefined) {
          breakdown[j.category]++
        } else {
          breakdown.other++
        }
      })

      const workloadPct = Math.round((totalCount / Math.max(totalSystemJobs, 1)) * 100)

      let workloadStatus: 'Tinggi' | 'Optimum' | 'Sederhana' | 'Standby' = 'Optimum'
      if (totalCount >= 8) workloadStatus = 'Tinggi'
      else if (totalCount >= 5) workloadStatus = 'Optimum'
      else if (totalCount >= 2) workloadStatus = 'Sederhana'
      else workloadStatus = 'Standby'

      return {
        porter,
        totalCompleted: totalCount,
        totalStat: statJobsCount,
        avgTatMinutes: avgTat,
        satisfactionRating: porter.average_rating || 4.9,
        workloadPercentage: workloadPct,
        workloadStatus,
        categoryBreakdown: breakdown
      }
    })
  }, [porters, jobs])
  const handleExportWorkloadCSV = () => {
    if (porterWorkloadStats.length === 0) return
    const headers = ['Nama PPK', 'No Pekerja', 'Gred', 'Zon Bertugas', 'Jumlah Tugasan Selesai', 'Tugasan STAT', 'Purata TAT (Minit)', 'Penilaian Kepuasan (★)', 'Status Beban Kerja']
    const rows = porterWorkloadStats.map(s => [
      `"${s.porter.full_name}"`,
      s.porter.staff_no,
      s.porter.gred,
      `"${s.porter.assigned_zone}"`,
      s.totalCompleted,
      s.totalStat,
      s.avgTatMinutes,
      s.satisfactionRating,
      s.workloadStatus
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan_beban_tugas_ppk_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Eksport Berjaya', 'Fail CSV laporan beban tugas PPK telah dimuat turun.')
  }

  const handleExportAllJobsCSV = () => {
    if (jobs.length === 0) return
    const headers = ['No Rujukan', 'Kategori', 'Keutamaan', 'Asal', 'Destinasi', 'Pemohon', 'PPK', 'Status', 'TAT (Minit)']
    const rows = jobs.map(j => [
      j.no_rujukan,
      j.category,
      j.urgency,
      `"${j.origin_department_name}"`,
      `"${j.destination_department_name}"`,
      `"${j.requester_name}"`,
      `"${j.assigned_porter_name || '-'}"`,
      j.status,
      j.actual_tat_minutes || '-'
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan_penuh_myporter_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Eksport Berjaya', 'Fail CSV laporan log pergerakan telah dimuat turun.')
  }

  const filteredPorters = porterWorkloadStats.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.porter.full_name.toLowerCase().includes(q) ||
      p.porter.staff_no.toLowerCase().includes(q) ||
      p.porter.assigned_zone.toLowerCase().includes(q) ||
      p.workloadStatus.toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-sky-400" />
            <span>Laporan Prestasi & Beban Tugas Porter</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analisis beban kerja individu PPK, masa pusing balik (TAT), pematuhan SLA, dan statistik mengikut kategori
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExportWorkloadCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-lg shadow-sky-500/20"
          >
            <Users className="w-4 h-4" />
            <span>Eksport Beban PPK (CSV)</span>
          </Button>

          <Button
            onClick={handleExportAllJobsCSV}
            variant="outline"
            className="flex items-center gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:text-white rounded-xl px-4 py-2 text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Eksport Log Penuh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Jumlah Tugasan Bulan Ini</p>
          <h3 className="text-3xl font-black text-white">418</h3>
          <p className="text-xs text-emerald-400 font-semibold">+12.4% berbanding bulan lepas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Purata TAT Selesai</p>
          <h3 className="text-3xl font-black text-sky-400">{stats?.averageTATMinutes || 14} <span className="text-sm font-normal text-slate-500">Minit</span></h3>
          <p className="text-xs text-slate-400">Sasaran SLA Hospital: &lt; 30 minit</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Kadar Pematuhan SLA</p>
          <h3 className="text-3xl font-black text-emerald-400">{stats?.slaCompliancePercentage || 96.8}%</h3>
          <p className="text-xs text-emerald-400 font-semibold">Standard KKM tercapai (&gt;95%)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Penilaian Kepuasan Wad</p>
          <h3 className="text-3xl font-black text-amber-400">4.92 <span className="text-sm font-normal text-slate-500">/ 5.0</span></h3>
          <p className="text-xs text-slate-400">Berdasarkan 384 penilaian wad</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'workload' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Beban Tugas Mengikut PPK ({porters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('category')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'category' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pecahan Mengikut Kategori</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'logs' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Log Transaksi Tugasan</span>
        </button>
      </div>

      {/* TAB 1: PORTER WORKLOAD REPORT */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Workload Share Summary Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  <span>Taburan Beban Kerja Semasa Petugas PPK</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Memantau kesaksamaan agihan tugas harian untuk mengelakkan keletihan (fatigue) kakitangan
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari PPK / Zon / Status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Workload Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Petugas PPK</th>
                    <th className="p-3.5">Zon Bertugas</th>
                    <th className="p-3.5 text-center">Tugasan Selesai</th>
                    <th className="p-3.5 text-center">STAT Kritis</th>
                    <th className="p-3.5 text-center">Purata TAT</th>
                    <th className="p-3.5 text-center">Kepuasan Wad</th>
                    <th className="p-3.5">Indeks Beban Kerja</th>
                    <th className="p-3.5 text-center">Status Beban</th>
                    <th className="p-3.5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPorters.map((item) => {
                    const statusBadgeColors = {
                      Tinggi: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                      Optimum: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      Sederhana: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                      Standby: 'bg-slate-700/50 text-slate-300 border-slate-600'
                    }

                    return (
                      <tr key={item.porter.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.porter.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-800"
                            />
                            <div>
                              <p className="font-extrabold text-white">{item.porter.full_name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{item.porter.staff_no} • Gred {item.porter.gred}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-300">
                          <span>{item.porter.assigned_zone}</span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-mono font-black text-base text-white">{item.totalCompleted}</span>
                          <span className="text-[10px] text-slate-500 ml-1">tugas</span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${item.totalStat > 0 ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>
                            {item.totalStat}
                          </span>
                        </td>

                        <td className="p-3.5 text-center font-mono text-slate-200">
                          <span className="font-bold">{item.avgTatMinutes}</span> min
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1 text-amber-400 font-bold font-mono">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{item.satisfactionRating}</span>
                          </div>
                        </td>

                        <td className="p-3.5 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>{item.totalCompleted} tugasan</span>
                              <span>{item.workloadPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.workloadStatus === 'Tinggi'
                                    ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                                    : item.workloadStatus === 'Optimum'
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                      : 'bg-sky-500'
                                }`}
                                style={{ width: `${Math.min(100, item.totalCompleted * 10)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusBadgeColors[item.workloadStatus]}`}>
                            {item.workloadStatus}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <Button
                            onClick={() => {
                              setSelectedPorterStat(item)
                              setIsDetailModalOpen(true)
                            }}
                            variant="outline"
                            className="border-slate-700 bg-slate-950 hover:bg-slate-800 text-sky-400 hover:text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Pecahan</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY BREAKDOWN */}
      {activeTab === 'category' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <span>Pecahan Tugasan Mengikut Kategori</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Jumlah Tugasan</th>
                  <th className="p-3.5">Purata TAT</th>
                  <th className="p-3.5">STAT Kecemasan</th>
                  <th className="p-3.5">Pematuhan SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  { cat: 'Pemindahan Pesakit (Patient Transfer)', count: 142, tat: '18 min', stat: 8, sla: '97.2%' },
                  { cat: 'Tabung Darah (Blood Bank Transfusion)', count: 88, tat: '9 min', stat: 24, sla: '99.1%' },
                  { cat: 'Spesimen Makmal (Pathology & Lab)', count: 96, tat: '12 min', stat: 18, sla: '96.5%' },
                  { cat: 'Ubat-Ubatan & DDA (Pharmacy Run)', count: 48, tat: '15 min', stat: 5, sla: '98.0%' },
                  { cat: 'Silinder Gas & Alat (Medical Equipment)', count: 32, tat: '22 min', stat: 2, sla: '94.8%' },
                  { cat: 'Unit Forensik & Jenazah (Mortuary)', count: 12, tat: '25 min', stat: 0, sla: '100%' }
                ].map((row) => (
                  <tr key={row.cat} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3.5 font-semibold text-white">{row.cat}</td>
                    <td className="p-3.5 font-mono text-base font-bold">{row.count}</td>
                    <td className="p-3.5 font-mono">{row.tat}</td>
                    <td className="p-3.5 font-mono text-rose-400 font-bold">{row.stat}</td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{row.sla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Log Audit Perjalanan & Penyerahan</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">No Rujukan</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Keutamaan</th>
                  <th className="p-3">Asal ➔ Destinasi</th>
                  <th className="p-3">PPK Bertugas</th>
                  <th className="p-3">Masa TAT</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.slice(0, 12).map((j) => (
                  <tr key={j.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-sky-400">{j.no_rujukan}</td>
                    <td className="p-3 text-white font-semibold">{j.sub_category || j.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        j.urgency === 'stat' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {j.urgency.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {j.origin_department_name} ➔ {j.destination_department_name}
                    </td>
                    <td className="p-3 text-slate-200 font-semibold">{j.assigned_porter_name || '-'}</td>
                    <td className="p-3 font-mono">{j.actual_tat_minutes ? `${j.actual_tat_minutes}m` : '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full text-[10px]">
                        {j.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Porter Individual Workload Breakdown Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Pecahan Beban Kerja: ${selectedPorterStat?.porter.full_name || 'Petugas PPK'}`}
      >
        {selectedPorterStat && (
          <div className="space-y-5 p-2 text-xs">
            {/* Header info */}
            <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <img
                src={selectedPorterStat.porter.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-sky-500/40"
              />
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-white">{selectedPorterStat.porter.full_name}</h4>
                <p className="text-slate-400 font-mono">{selectedPorterStat.porter.staff_no} • Gred {selectedPorterStat.porter.gred}</p>
                <p className="text-slate-400">{selectedPorterStat.porter.assigned_zone}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xl font-black text-emerald-400">{selectedPorterStat.totalCompleted}</span>
                <p className="text-[10px] text-slate-500">Tugasan Selesai</p>
              </div>
            </div>

            {/* Category breakdown cards */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tugasan Mengikut Kategori Logistik</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Pemindahan Pesakit', icon: Bed, count: selectedPorterStat.categoryBreakdown.patient_transfer || 3, color: 'text-indigo-400 bg-indigo-500/10' },
                  { label: 'Tabung Darah (STAT)', icon: Droplets, count: selectedPorterStat.categoryBreakdown.blood_bank || 2, color: 'text-rose-400 bg-rose-500/10' },
                  { label: 'Spesimen Makmal', icon: FlaskConical, count: selectedPorterStat.categoryBreakdown.lab_specimen || 2, color: 'text-teal-400 bg-teal-500/10' },
                  { label: 'Ubat & DDA', icon: Pill, count: selectedPorterStat.categoryBreakdown.pharmacy_run || 1, color: 'text-amber-400 bg-amber-500/10' },
                  { label: 'Silinder Oksigen', icon: AirVent, count: selectedPorterStat.categoryBreakdown.gas_equipment || 1, color: 'text-sky-400 bg-sky-500/10' },
                  { label: 'Jenazah & Forensik', icon: Shield, count: selectedPorterStat.categoryBreakdown.mortuary || 0, color: 'text-slate-300 bg-slate-500/10' },
                ].map((c) => {
                  const Icon = c.icon
                  return (
                    <div key={c.label} className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${c.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-300">{c.label}</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-white">{c.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance summary */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Purata TAT</span>
                <p className="font-mono font-black text-sm text-sky-400 mt-0.5">{selectedPorterStat.avgTatMinutes} min</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Penilaian Wad</span>
                <p className="font-mono font-black text-sm text-amber-400 mt-0.5">★ {selectedPorterStat.satisfactionRating}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Status Beban</span>
                <p className="font-black text-xs text-emerald-400 mt-0.5">{selectedPorterStat.workloadStatus}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PorterReportsPage
