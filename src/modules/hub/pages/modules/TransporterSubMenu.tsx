// src/modules/hub/pages/modules/TransporterSubMenu.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Car, 
  FileText, 
  Plus, 
  Settings, 
  Activity, 
  TrendingUp, 
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { Ambulance } from '../../../mytransporter/components/AmbulanceIcon'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/constants'
import { getTransporterRoles, getRequests, getVehicles } from '@/modules/mytransporter/services/transporterService'

interface TransporterMenuItem {
  title: string
  description: string
  icon: React.ComponentType<any>
  path: string
  color: string
  badge: string | null
  badgeColor?: string
}

export const TransporterSubMenu: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const [userRole, setUserRole] = useState<string>('staff')
  const [stats, setStats] = useState({
    activeTrips: 0,
    pendingRequests: 0,
    totalVehicles: 0,
    activeIssues: 0,
    loading: true
  })

  useEffect(() => {
    const checkRoleAndStats = async () => {
      try {
        const userId = loggedUser?.id
        if (userId) {
          const res = await getTransporterRoles()
          if (res.data && res.data[userId]) {
            setUserRole(res.data[userId])
          } else if (loggedUser?.role?.role_code === 'system_admin' || loggedUser?.role?.role_code === 'hospital_admin') {
            setUserRole('transport_admin')
          }
        }

        const requestsRes = await getRequests()
        const vehiclesRes = await getVehicles()

        if (requestsRes.data && vehiclesRes.data) {
          const activeTrips = requestsRes.data.filter(r => r.status_semasa === 'in_transit').length
          const pendingRequests = requestsRes.data.filter(r => r.status_semasa === 'submitted').length
          const totalVehicles = vehiclesRes.data.length
          const activeIssues = vehiclesRes.data.filter(v => v.status === 'maintenance').length

          setStats({
            activeTrips,
            pendingRequests,
            totalVehicles,
            activeIssues,
            loading: false
          })
        }
      } catch (err) {
        console.error(err)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }
    checkRoleAndStats()
  }, [loggedUser])

  // Build menu items based on roles
  const menuItems: TransporterMenuItem[] = [
    {
      title: 'Papan Pemuka Transporter',
      description: 'Lihat statistik masa nyata pergerakan kenderaan, tugasan aktif pemandu, dan analitik ringkas.',
      icon: Activity,
      path: '/transporter/dashboard',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      badge: stats.activeTrips > 0 ? `${stats.activeTrips} Aktif` : null,
      badgeColor: 'bg-blue-500 text-slate-950 border-transparent'
    },
    {
      title: 'Permohonan Baru',
      description: 'Borang permohonan Ambulans KKM (Rujukan/Kecemasan) atau Kereta Jabatan (SG) bagi urusan rasmi.',
      icon: Plus,
      path: '/transporter/requests/new',
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      badge: 'Borang'
    },
    {
      title: 'Senarai Permohonan Saya',
      description: 'Semak status kelulusan pentadbir, status perjalanan pemandu, dan muat turun borang kelulusan PDF.',
      icon: FileText,
      path: '/transporter/requests/my',
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      badge: stats.pendingRequests > 0 ? `${stats.pendingRequests} Diproses` : null,
      badgeColor: 'bg-amber-500 text-slate-950 border-transparent'
    }
  ]

  // Add driver panel if driver or admin
  if (userRole === 'transport_driver' || userRole === 'transport_admin') {
    menuItems.push({
      title: 'Panel Tugasan Pemandu',
      description: 'Log pemandu bertugas untuk menerima trip, melakukan checklist pre/post safety trip, dan memandu.',
      icon: Ambulance,
      path: '/transporter/driver/panel',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      badge: stats.activeTrips > 0 ? 'Syif Aktif' : null,
      badgeColor: 'bg-emerald-500 text-slate-950 border-transparent'
    })
  }

  // Add admin modules if admin
  if (userRole === 'transport_admin') {
    menuItems.push(
      {
        title: 'Kelulusan Pentadbir (Admin Queue)',
        description: 'Kelulusan permohonan kenderaan dan pelepasan trip selepas semakan keselamatan pre-trip pemandu.',
        icon: UserCheck,
        path: '/transporter/admin/approval',
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        badge: stats.pendingRequests > 0 ? `${stats.pendingRequests} Kelulusan` : null,
        badgeColor: 'bg-rose-500 text-white border-transparent'
      },
      {
        title: 'Pendaftaran Kenderaan (Fleet)',
        description: 'Daftar kenderaan ambulans/SG baru, kemaskini status cukai jalan, odometer, dan status aktif fleet.',
        icon: Settings,
        path: '/transporter/admin/vehicles',
        color: 'text-slate-400 bg-slate-800/50 border-slate-700/50',
        badge: null
      },
      {
        title: 'Aduan & Penyelenggaraan Kenderaan',
        description: 'Selesaikan laporan kerosakan fizikal/enjin kenderaan yang dilaporkan oleh pemandu.',
        icon: ShieldAlert,
        path: '/transporter/admin/vehicles/issues',
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        badge: stats.activeIssues > 0 ? `${stats.activeIssues} Rosak` : null,
        badgeColor: 'bg-rose-500 text-white border-transparent'
      },
      {
        title: 'Tuntutan & Laporan Pergerakan',
        description: 'Log pergerakan kenderaan (odometer start/end) untuk tuntutan perbatuan (mileage claims) bulanan.',
        icon: TrendingUp,
        path: '/transporter/admin/vehicles/movement',
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        badge: 'Claims'
      },
      {
        title: 'Laporan & Justifikasi Aset',
        description: 'Penjanaan laporan rasmi dan justifikasi KKM untuk pertambahan aset fleet hospital.',
        icon: FileText,
        path: '/transporter/admin/reports',
        color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        badge: 'KKM'
      },
      {
        title: 'Penugasan Peranan (Roles)',
        description: 'Urus peranan dan hak akses pemandu bertugas (driver) dan pentadbir pengangkutan (admin).',
        icon: UserCheck,
        path: '/transporter/admin/roles',
        color: 'text-slate-400 bg-slate-800/50 border-slate-700/50',
        badge: 'Akses'
      }
    )
  }

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
            <div className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl shadow-inner">
              <Car className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">MyTransporter</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-blue-500/30 text-blue-400 bg-blue-500/5">
                  Sub-modul Pengangkutan
                </span>
              </div>
              <p className="text-slate-400 mt-1">Sistem Pengurusan Pengangkutan & Ambulans Hospital</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Trip Dalam Perjalanan</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-white">
            {stats.loading ? '...' : stats.activeTrips}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sedang aktif</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Permohonan Baru</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-amber-400">
            {stats.loading ? '...' : stats.pendingRequests}
          </p>
          <p className="text-xs text-slate-500 mt-1">Menunggu tindakan</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Jumlah Fleet Terdaftar</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-cyan-400">
            {stats.loading ? '...' : stats.totalVehicles}
          </p>
          <p className="text-xs text-slate-500 mt-1">Ambulans & SG</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-sm font-medium">Status Penyelenggaraan</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold font-mono mt-2 text-rose-400">
            {stats.loading ? '...' : stats.activeIssues}
          </p>
          <p className="text-xs text-slate-500 mt-1">Kenderaan diservis</p>
        </div>
      </div>

      {/* Action choices list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white tracking-wide">PILIHAN OPERASI & PENTADBIRAN</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="group text-left bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 hover:bg-slate-800/40 hover:border-slate-700/80 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[190px]"
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
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500/80 group-hover:text-blue-400 transition-colors mt-auto">
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

export default TransporterSubMenu
