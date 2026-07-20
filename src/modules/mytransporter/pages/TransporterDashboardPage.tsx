// src/modules/mytransporter/pages/TransporterDashboardPage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Car, 
  FileText, 
  Plus, 
  ArrowRight, 
  ClipboardList, 
  TrendingUp, 
  AlertOctagon, 
  Settings, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Users, 
  Calendar,
  XCircle,
  Truck
} from 'lucide-react'
import { Ambulance } from '../components/AmbulanceIcon'
import { useAuthStore } from '@/stores/authStore'

import { useToast } from '@/stores/toastStore'
import { 
  getTransporterAggregateStats,
  getRequests,
  getTransporterRoles
} from '../services/transporterService'
import type { TransportRequest } from '@/shared/types/mytransporter'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge 
} from '@/components/ui'

const TransporterDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()
  
  const [stats, setStats] = useState<any>(null)
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('staff') // Default to regular staff

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const hospitalId = loggedUser?.hospital_id || 'hosp-1'
        const userId = loggedUser?.id || ''
        
        // 1. Fetch Transporter Roles
        const roleRes = await getTransporterRoles()
        if (roleRes.data && userId) {
          const assignedRole = roleRes.data[userId]
          if (assignedRole) {
            setUserRole(assignedRole)
          } else if (loggedUser?.role?.role_code === 'system_admin' || loggedUser?.role?.role_code === 'hospital_admin') {
            setUserRole('transport_admin') // System/Hospital Admins double as transport admins
          }
        }
        
        // 2. Fetch Stats
        const statsRes = await getTransporterAggregateStats()
        if (statsRes.data) {
          setStats(statsRes.data)
        }

        // 3. Fetch Recent Requests
        const reqsRes = await getRequests()
        if (reqsRes.data) {
          setRequests(reqsRes.data.slice(0, 5)) // get recent 5
        }
      } catch (err: any) {
        toast.error('Gagal Memuatkan Data', err.message || 'Ralat semasa mengambil data dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [loggedUser?.id])

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memuatkan Papan Pemuka MyTransporter...</p>
      </div>
    )
  }

  return (
    <div className="w-full p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Car className="w-10 h-10 text-blue-600 animate-pulse" />
            MyTransporter
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sistem Bersepadu Pengurusan Ambulans & Kereta Jabatan Hospital
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => navigate('/transporter/requests/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Permohonan Baru</span>
          </Button>

          {userRole === 'transport_admin' && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/transporter/admin/roles')}
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Kebenaran Pemandu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Permohonan</p>
              <h3 className="text-3xl font-extrabold text-slate-800 tabular-nums">{stats?.totalRequests || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menunggu Kelulusan</p>
              <h3 className="text-3xl font-extrabold text-amber-600 tabular-nums">{stats?.pendingApprovals || 0}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dalam Perjalanan</p>
              <h3 className="text-3xl font-extrabold text-indigo-600 tabular-nums">{stats?.activeTrips || 0}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity className="w-6 h-6 animate-bounce" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Isu Kenderaan Terbuka</p>
              <h3 className="text-3xl font-extrabold text-rose-600 tabular-nums">{stats?.totalIssuesOpen || 0}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Navigation Dashboard Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Requester Portal */}
        <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-blue-400/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">Portal Kakitangan</CardTitle>
            <p className="text-xs text-slate-500">Buat permohonan Ambulans/SG dan semak status kelulusan semasa.</p>
          </CardHeader>
          <CardContent className="pt-4 border-t border-slate-100 flex justify-between items-center bg-white/50">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/transporter/requests/my')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 p-0 flex items-center gap-1 group-hover:translate-x-1 transition-transform bg-transparent hover:bg-transparent"
            >
              <span>Urus Permohonan Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Driver Portal */}
        <Card className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-emerald-400/50 transition-colors ${
          userRole !== 'transport_driver' && userRole !== 'transport_admin' ? 'opacity-60' : ''
        }`}>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <Ambulance className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">Panel Pemandu</CardTitle>
            <p className="text-xs text-slate-500">Terima tugasan perjalanan, lakukan pemeriksaan kenderaan (pre/post-trip), dan pantau sejarah tugasan.</p>
          </CardHeader>
          <CardContent className="pt-4 border-t border-slate-100 flex justify-between items-center bg-white/50">
            {userRole === 'transport_driver' || userRole === 'transport_admin' ? (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/transporter/driver/panel')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 p-0 flex items-center gap-1 group-hover:translate-x-1 transition-transform bg-transparent hover:bg-transparent"
              >
                <span>Buka Panel Tugasan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic">Terhad untuk Pemandu Bertugas sahaja</span>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Admin Portal */}
        <Card className={`bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-indigo-400/50 transition-colors ${
          userRole !== 'transport_admin' ? 'opacity-60' : ''
        }`}>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">Menu Pentadbir</CardTitle>
            <p className="text-xs text-slate-500">Kelulusan permohonan, pendaftaran kenderaan, laporan kerosakan, dan pemantauan pergerakan bulanan fleet.</p>
          </CardHeader>
          <CardContent className="pt-4 border-t border-slate-100 flex justify-between items-center bg-white/50">
            {userRole === 'transport_admin' ? (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/transporter/admin/approval')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 p-0 flex items-center gap-1 group-hover:translate-x-1 transition-transform bg-transparent hover:bg-transparent"
              >
                <span>Urus Urusan Pentadbiran</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <span className="text-xs font-semibold text-slate-400 italic">Akses Terhad Pentadbir Sahaja</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Operations Hub (Conditional) */}
      {userRole === 'transport_admin' && (
        <Card className="border border-indigo-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Hab Pentadbiran Penuh (Transport Administrator)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              onClick={() => navigate('/transporter/admin/vehicles')}
              className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200/50 hover:border-indigo-200 rounded-xl transition-all duration-200 text-center flex flex-col items-center gap-2 group"
            >
              <Truck className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">Daftar & Urus Fleet</span>
            </button>
            <button 
              onClick={() => navigate('/transporter/admin/vehicles/issues')}
              className="p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200/50 hover:border-rose-200 rounded-xl transition-all duration-200 text-center flex flex-col items-center gap-2 group"
            >
              <AlertOctagon className="w-6 h-6 text-slate-600 group-hover:text-rose-600" />
              <span className="text-xs font-bold text-slate-700">Aduan Kerosakan</span>
            </button>
            <button 
              onClick={() => navigate('/transporter/admin/vehicles/movement')}
              className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200/50 hover:border-emerald-200 rounded-xl transition-all duration-200 text-center flex flex-col items-center gap-2 group"
            >
              <Activity className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Pergerakan Bulanan</span>
            </button>
            <button 
              onClick={() => navigate('/transporter/driver/monitor')}
              className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200/50 hover:border-blue-200 rounded-xl transition-all duration-200 text-center flex flex-col items-center gap-2 group"
            >
              <Users className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Pantau Pemandu</span>
            </button>
            <button 
              onClick={() => navigate('/transporter/admin/reports')}
              className="p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200/50 hover:border-amber-200 rounded-xl transition-all duration-200 text-center flex flex-col items-center gap-2 group"
            >
              <TrendingUp className="w-6 h-6 text-slate-600 group-hover:text-amber-600" />
              <span className="text-xs font-bold text-slate-700">Laporan & Tuntutan</span>
            </button>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests Queue */}
      <Card className="border border-slate-150 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row justify-between items-center">
          <CardTitle className="text-lg font-bold text-slate-800">Senarai Permohonan Terkini</CardTitle>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/transporter/requests/my')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 p-0 flex items-center gap-1"
          >
            <span>Semua Rekod</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Tiada permohonan dijumpai dalam rekod.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">No. Rujukan</th>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4">Destinasi / Tujuan</th>
                    <th className="px-6 py-4">Tarikh & Masa</th>
                    <th className="px-6 py-4">Kenderaan / Driver</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600 select-all">{req.no_rujukan}</td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          {req.jenis_permohonan === 'ambulance' ? (
                            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Ambulance className="w-4 h-4" /></span>
                          ) : req.jenis_permohonan === 'van_jenazah' ? (
                            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg"><Truck className="w-4 h-4" /></span>
                          ) : (
                            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Car className="w-4 h-4" /></span>
                          )}
                          <span>
                            {req.jenis_permohonan === 'sg' 
                              ? 'Kereta Jabatan (SG)' 
                              : req.jenis_permohonan === 'van_jenazah' 
                              ? 'Van Jenazah' 
                              : 'Ambulans'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 truncate max-w-xs">{req.destinasi}</div>
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
                      <td className="px-6 py-4">
                        {req.kenderaan ? (
                          <div>
                            <div className="font-bold text-slate-800">{req.kenderaan.no_kenderaan}</div>
                            <div className="text-xs text-slate-400">{req.kenderaan.model}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Belum diagihkan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(req.status_semasa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ChevronRight helper fallback
const ChevronRight = ({ className }: { className?: string }) => (
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
    <path d="m9 18 6-6-6-6"/>
  </svg>
)

export default TransporterDashboardPage
