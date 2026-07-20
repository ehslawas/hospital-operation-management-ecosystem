// src/modules/hub/pages/modules/KunciSubMenu.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Key, 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  Shield, 
  ScrollText,
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { getKunciDaftar, getKunciLogs } from '@/modules/mykunci/services/kunciService'
import { Badge } from '@/components/ui'

export const KunciSubMenu: React.FC = () => {
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalKeys: 0,
    activeBorrows: 0,
    overdueBorrows: 0,
    normalKeys: 0,
    loading: true
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: keys } = await getKunciDaftar()
        const { data: logs } = await getKunciLogs()
        
        const totalKeys = keys?.length || 0
        const activeBorrowsList = logs?.filter(l => !l.tarikh_masa_pulang) || []
        const activeBorrows = activeBorrowsList.length
        
        // Calculate overdue borrows
        const now = new Date().getTime()
        const overdueBorrows = activeBorrowsList.filter(l => {
          return new Date(l.jangka_masa_pulang).getTime() < now
        }).length

        const normalKeys = totalKeys - activeBorrows
        
        setStats({
          totalKeys,
          activeBorrows,
          overdueBorrows,
          normalKeys,
          loading: false
        })
      } catch (e) {
        console.error('Failed to load MyKunci submenu stats', e)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }
    fetchStats()
  }, [])

  const menuItems = [
    {
      title: 'Papan Pemuka Operasi (Dashboard)',
      description: 'Paparan visual status kunci, amaran kelewatan pulangan, dan tindakan pantas peminjaman.',
      icon: LayoutDashboard,
      path: '/kunci/dashboard',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      badge: stats.overdueBorrows > 0 ? `${stats.overdueBorrows} Overdue` : null,
      badgeColor: 'bg-rose-500 text-white border-transparent'
    },
    {
      title: 'Daftar Kunci & Inventori',
      description: 'Inventori penuh anak kunci, ibu kunci, peti kunci, lokasi fizikal, dan penguatkuasaan double-custody.',
      icon: ClipboardList,
      path: '/kunci/daftar',
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      badge: null
    },
    {
      title: 'Log Pergerakan Kunci',
      description: 'Rekod transaksi lengkap peminjaman dan pemulangan kunci (siapa, bila, jangka masa, dan insiden).',
      icon: FileText,
      path: '/kunci/log',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      badge: stats.activeBorrows > 0 ? `${stats.activeBorrows} Aktif` : null,
      badgeColor: 'bg-emerald-500 text-slate-900 border-transparent'
    },
    {
      title: 'Verifikasi & Audit Bulanan',
      description: 'Audit berkala pematuhan keselamatan JKNS Sarawak, semakan fizikal kunci, dan status meterai sampul kunci pendua.',
      icon: Shield,
      path: '/kunci/audit',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      badge: null
    },
    {
      title: 'Rujukan Polisi Keselamatan KKM',
      description: 'Garis panduan rasmi pengurusan keselamatan kunci kerajaan, kaedah tindakan kehilangan kunci, dan arahan Sarawak.',
      icon: ScrollText,
      path: '/kunci/polisi',
      color: 'text-slate-400 bg-slate-800/50 border-slate-700/50',
      badge: 'Polisi'
    }
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* Back navigation */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(ROUTES.HUB)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Hub Utama</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shadow-inner">
              <Key className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">MyKunci</h1>
                <Badge className="border-amber-500/30 text-amber-400 bg-amber-500/5">
                  Sub-modul Keselamatan
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">Sistem Pengurusan Kunci & Pematuhan Polisi Keselamatan Kerajaan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Jumlah Kunci Induk</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-white">
            {stats.loading ? '...' : stats.totalKeys}
          </p>
          <p className="text-xs text-slate-500 mt-1">Berdaftar di jabatan</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Sedang Dipinjam</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-amber-400">
            {stats.loading ? '...' : stats.activeBorrows}
          </p>
          <p className="text-xs text-slate-500 mt-1">Di luar kabinet</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Amaran Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-rose-400">
            {stats.loading ? '...' : stats.overdueBorrows}
          </p>
          <p className="text-xs text-slate-500 mt-1">Melebihi had syif</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Tersedia Simpan</span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-emerald-400">
            {stats.loading ? '...' : stats.normalKeys}
          </p>
          <p className="text-xs text-slate-500 mt-1">Di dalam peti kunci</p>
        </div>
      </div>

      {/* Action choices list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-wide">PILIHAN OPERASI & REKOD</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="group text-left bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:bg-slate-800/40 hover:border-slate-700/80 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className={`p-3 rounded-xl border ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${item.badgeColor || 'border-slate-800 text-slate-400 bg-slate-950'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500/80 group-hover:text-amber-400 transition-colors mt-auto">
                  <span>Masuk Menu</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default KunciSubMenu
