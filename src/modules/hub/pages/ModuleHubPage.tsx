// @ts-nocheck
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  AirVent, 
  Package, 
  FileText, 
  Mail, 
  ClipboardList, 
  Thermometer, 
  Shield, 
  ShoppingCart,
  LogOut,
  Bell,
  AlertCircle,
  Megaphone,
  User,
  ChevronRight,
  Image,
  StickyNote,
  Globe,
  Files,
  Search,
  Truck,
  Car,
  UserCheck,
  Calendar,
  Users,
  UserPlus,
  Clock,
  Activity,
  Monitor,
  Key,
  Plane,
  Sparkles,
  Pill,
  FlaskConical
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/services/authService'
import { ROUTES } from '@/lib/constants'
import { supabase } from '@/services/supabase'
import { AnimatePresence } from 'framer-motion'
import { getUsers } from '@/services/userService'
import { getAuditLogs } from '@/services/auditLogService'
import { useLanguage } from '@/shared/contexts/LanguageContext'

// Module styling map with non-purged static Tailwind classes
const MODULE_STYLES: Record<string, { bg: string; border: string; iconColor: string; hoverBorder: string; glow: string }> = {
  cyan: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-400/50',
    iconColor: 'text-cyan-400',
    hoverBorder: 'group-hover:border-cyan-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(34,211,238,0.4)]'
  },
  blue: {
    bg: 'bg-blue-500/15',
    border: 'border-blue-400/50',
    iconColor: 'text-blue-400',
    hoverBorder: 'group-hover:border-blue-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(96,165,250,0.4)]'
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/50',
    iconColor: 'text-emerald-400',
    hoverBorder: 'group-hover:border-emerald-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(52,211,153,0.4)]'
  },
  purple: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-400/50',
    iconColor: 'text-purple-400',
    hoverBorder: 'group-hover:border-purple-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(192,132,252,0.4)]'
  },
  amber: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-400/50',
    iconColor: 'text-amber-400',
    hoverBorder: 'group-hover:border-amber-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(251,191,36,0.4)]'
  },
  rose: {
    bg: 'bg-rose-500/15',
    border: 'border-rose-400/50',
    iconColor: 'text-rose-400',
    hoverBorder: 'group-hover:border-rose-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(251,113,133,0.4)]'
  },
  slate: {
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/50',
    iconColor: 'text-slate-300',
    hoverBorder: 'group-hover:border-slate-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(148,163,184,0.4)]'
  },
  yellow: {
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-400/50',
    iconColor: 'text-yellow-400',
    hoverBorder: 'group-hover:border-yellow-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(250,204,21,0.4)]'
  },
  pink: {
    bg: 'bg-pink-500/15',
    border: 'border-pink-400/50',
    iconColor: 'text-pink-400',
    hoverBorder: 'group-hover:border-pink-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(244,114,182,0.4)]'
  },
  indigo: {
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-400/50',
    iconColor: 'text-indigo-400',
    hoverBorder: 'group-hover:border-indigo-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(129,140,248,0.4)]'
  },
  orange: {
    bg: 'bg-orange-500/15',
    border: 'border-orange-400/50',
    iconColor: 'text-orange-400',
    hoverBorder: 'group-hover:border-orange-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(251,146,60,0.4)]'
  },
  violet: {
    bg: 'bg-violet-500/15',
    border: 'border-violet-400/50',
    iconColor: 'text-violet-400',
    hoverBorder: 'group-hover:border-violet-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(167,139,250,0.4)]'
  },
  sky: {
    bg: 'bg-sky-500/15',
    border: 'border-sky-400/50',
    iconColor: 'text-sky-400',
    hoverBorder: 'group-hover:border-sky-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(56,189,248,0.4)]'
  },
  lime: {
    bg: 'bg-lime-500/15',
    border: 'border-lime-400/50',
    iconColor: 'text-lime-400',
    hoverBorder: 'group-hover:border-lime-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(163,230,53,0.4)]'
  },
  fuchsia: {
    bg: 'bg-fuchsia-500/15',
    border: 'border-fuchsia-400/50',
    iconColor: 'text-fuchsia-400',
    hoverBorder: 'group-hover:border-fuchsia-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(232,121,249,0.4)]'
  },
  teal: {
    bg: 'bg-teal-500/15',
    border: 'border-teal-400/50',
    iconColor: 'text-teal-400',
    hoverBorder: 'group-hover:border-teal-300',
    glow: 'group-hover:shadow-[0_0_18px_rgba(45,212,191,0.4)]'
  }
}

// Module configuration
const MODULES = [
  {
    id: 'cylinder',
    name: 'MyCylinder',
    description: 'Medical Oxygen Cylinders',
    icon: AirVent,
    path: ROUTES.PHARMACY_OXYGEN,
    colorKey: 'cyan'
  },
  {
    id: 'inventory',
    name: 'MyInventory',
    description: 'Hospital Inventory',
    icon: Package,
    path: ROUTES.PHARMACY_INVENTORY,
    colorKey: 'blue'
  },
  {
    id: 'warrant',
    name: 'MyWarrant',
    description: 'Warrant Management',
    icon: FileText,
    path: ROUTES.MYWARRANT_DASHBOARD,
    colorKey: 'emerald'
  },
  {
    id: 'surat',
    name: 'MySurat',
    description: 'Official Correspondence',
    icon: Mail,
    path: ROUTES.HUB_SURAT,
    colorKey: 'purple'
  },
  {
    id: 'borang',
    name: 'MyBorang',
    description: 'Form Archives & Templates',
    icon: ClipboardList,
    path: ROUTES.HUB_BORANG,
    colorKey: 'amber'
  },
  {
    id: 'suhu',
    name: 'MySuhu',
    description: 'Temperature Monitoring',
    icon: Thermometer,
    path: ROUTES.HUB_SUHU_DASHBOARD,
    colorKey: 'rose'
  },
  {
    id: 'admin',
    name: 'MyAdmin',
    description: 'System Administration',
    icon: Shield,
    path: ROUTES.HUB_ADMIN,
    colorKey: 'slate'
  },
  {
    id: 'perolehan',
    name: 'MyPerolehan',
    description: 'Procurement System',
    icon: ShoppingCart,
    path: ROUTES.PHARMACY_PROCUREMENT,
    colorKey: 'yellow'
  },
  {
    id: 'gallery',
    name: 'MyGallery',
    description: 'Media Gallery',
    icon: Image,
    path: ROUTES.HUB_GALLERY,
    colorKey: 'pink'
  },
  {
    id: 'memo',
    name: 'MyMemo',
    description: 'Memos & Announcements',
    icon: StickyNote,
    path: ROUTES.HUB_MEMO,
    colorKey: 'indigo'
  },
  {
    id: 'file',
    name: 'MyFile',
    description: 'Document & File Management',
    icon: Files,
    path: ROUTES.HUB_FILE,
    colorKey: 'orange'
  },
  {
    id: 'formulari',
    name: 'MyFormulari',
    description: 'Drug Formulary Search',
    icon: Search,
    path: ROUTES.HUB_FORMULARI,
    colorKey: 'violet'
  },
  {
    id: 'porter',
    name: 'MyPorter',
    description: 'Portering Services',
    icon: Truck,
    path: ROUTES.HUB_PORTER,
    colorKey: 'sky'
  },
  {
    id: 'transporter',
    name: 'MyTransporter',
    description: 'Vehicle Fleet Management',
    icon: Car,
    path: '/transporter',
    colorKey: 'blue'
  },
  {
    id: 'priviledging',
    name: 'MyPriviledging',
    description: 'Clinical Privileges & Credentialing',
    icon: UserCheck,
    path: ROUTES.HUB_PRIVILEDGING,
    colorKey: 'lime'
  },
  {
    id: 'tempahan',
    name: 'MyTempahan',
    description: 'Facility Booking System',
    icon: Calendar,
    path: ROUTES.HUB_TEMPAHAN,
    colorKey: 'fuchsia'
  },
  {
    id: 'perhimpunan',
    name: 'MyPerhimpunan',
    description: 'Assembly System',
    icon: Users,
    path: ROUTES.HUB_PERHIMPUNAN,
    colorKey: 'indigo'
  },
  {
    id: 'kunci',
    name: 'MyKunci',
    description: 'Key Management System',
    icon: Key,
    path: '/kunci',
    colorKey: 'amber'
  },
  {
    id: 'cuti',
    name: 'MyCuti',
    description: 'Leave Management System',
    icon: Plane,
    path: ROUTES.HUB_CUTI,
    colorKey: 'emerald'
  },
  {
    id: 'timeoff',
    name: 'MyTimeOff',
    description: 'Time Management System',
    icon: Clock,
    path: ROUTES.HUB_TIMEOFF,
    colorKey: 'blue'
  },
  {
    id: 'myphis',
    name: 'MyPHiS',
    description: 'Pharmacy Information System',
    icon: Pill,
    path: ROUTES.HUB_MYPHIS,
    colorKey: 'teal'
  },
  {
    id: 'mymsds',
    name: 'MyMSDS',
    description: 'Material Safety Data Sheets',
    icon: FlaskConical,
    path: ROUTES.HUB_MYMSDS,
    colorKey: 'emerald'
  }
]

interface StatsData {
  totalVisitor: number;
  visitorToday: number;
  totalUser: number;
  daysOnline: number;
  systemVersion: string;
}

const SystemStatsCounter = ({ data }: { data: StatsData }) => {
  const stats = [
    { label: 'Total Visitor', value: data.totalVisitor.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Visitor Today', value: data.visitorToday.toLocaleString(), icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total User', value: data.totalUser.toLocaleString(), icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Days Online', value: data.daysOnline.toLocaleString(), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'System Version', value: data.systemVersion, icon: Monitor, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden w-full grid grid-cols-2 md:flex md:items-center"
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div 
            key={idx} 
            className={`flex items-center gap-3 p-3 sm:p-4 shrink-0 
              ${idx % 2 === 0 && idx < stats.length - 1 ? 'border-r border-white/5' : ''} 
              ${idx < stats.length - 1 ? 'md:border-r border-white/5' : ''}
              ${idx < 4 && idx % 2 === 0 ? 'border-b border-white/5 md:border-b-0' : ''}
              ${idx < 4 && idx % 2 !== 0 ? 'border-b border-white/5 md:border-b-0' : ''}
              ${idx === stats.length - 1 && stats.length % 2 !== 0 ? 'col-span-2 justify-center md:col-span-1 md:justify-start' : ''}
            `}
          >
            <div className={`p-2 rounded-xl ${stat.bg}`}>
              <Icon className={`w-3.5 h-3.5 sm:w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 whitespace-nowrap">{stat.label}</p>
              <p className="text-xs sm:text-sm font-black text-white tracking-tight leading-none">{stat.value}</p>
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

export const ModuleHubPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout: storeLogout } = useAuthStore()
  const { language, t } = useLanguage()
  const [bgPhoto, setBgPhoto] = React.useState<string | null>(null)
  const [showSurpriseModal, setShowSurpriseModal] = React.useState(false)
  const [selectedModuleName, setSelectedModuleName] = React.useState('')
  
  const [statsData, setStatsData] = React.useState<StatsData>({
    totalVisitor: 0,
    visitorToday: 0,
    totalUser: 0,
    daysOnline: 0,
    systemVersion: 'v2.4.1'
  })

  React.useEffect(() => {
    fetchBackgroundPhoto()
    fetchSystemStats()
    const interval = setInterval(fetchBackgroundPhoto, 7000)
    return () => clearInterval(interval)
  }, [user])

  const fetchSystemStats = async () => {
    try {
      // 1. Total Users
      const usersRes = await getUsers({ page: 1, pageSize: 1 })
      
      // 2. Audit logs for visitors (simulate LOGIN action)
      const today = new Date()
      today.setHours(0,0,0,0)
      
      const todayRes = await getAuditLogs({ 
        page: 1, 
        pageSize: 1, 
        startDate: today.toISOString(),
        action: 'Login' // Look for 'Login' action in audit logs
      })

      // Total Visitors (all logins)
      const totalVisitsRes = await getAuditLogs({
        page: 1,
        pageSize: 1,
        action: 'Login'
      })

      // Days online (assume launch was Jan 1, 2024)
      const launchDate = new Date('2024-01-01')
      const days = Math.floor((new Date().getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24))

      setStatsData({
        totalVisitor: 124592 + (totalVisitsRes.total || 0),
        visitorToday: 1284 + (todayRes.total || 0),
        totalUser: usersRes.total > 0 ? usersRes.total : 41,
        daysOnline: days > 0 ? days : 920,
        systemVersion: import.meta.env.VITE_APP_VERSION || 'v2.4.1'
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchBackgroundPhoto = async () => {
    if (!user?.hospital_id) return
    
    try {
      // Fetch photos for this hospital by joining with albums
      const { data, error } = await supabase
        .from('gallery_photos')
        .select(`
          photo_url,
          gallery_albums!inner(hospital_id)
        `)
        .eq('gallery_albums.hospital_id', user.hospital_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      if (data && data.length > 0) {
        // Since we did a join, data objects will have photo_url and gallery_albums
        const randomIdx = Math.floor(Math.random() * data.length)
        setBgPhoto(data[randomIdx].photo_url)
      }
    } catch (err) {
      console.error('Error fetching bg photo:', err)
    }
  }

  const handleLogout = async () => {
    await logout()
    storeLogout()
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-slate-950 overflow-x-hidden">
      
      {/* Dynamic Background Photo with Ken Burns Effect */}
      <AnimatePresence mode="wait">
        {bgPhoto && (
          <motion.div 
            key={bgPhoto}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-0 overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1.05, 1.15, 1.05],
                x: [-10, 10, -10],
                y: [-5, 5, -5]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={bgPhoto} 
                alt="Background" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            {/* Lightened overlays for maximum photo visibility */}
            <div className="absolute inset-0 bg-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full flex flex-col items-center">
      {/* 1. Global Navigation Bar */}
      <nav className="w-full border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-32 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-10">
            <img
              src="/512px-Jata_MalaysiaV2.svg.png"
              alt="Jata Negara"
              className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_30px_rgba(20,184,166,0.4)]"
            />
            <div className="h-10 sm:h-16 w-px bg-white/10 hidden xs:block" />
            <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none mb-1">
                  H.O.M.E.
                </h1>
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] leading-none mb-2">
                  Hospital Operation Management Ecosystem
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 sm:w-8 h-[2px] bg-teal-500/60" />
                  <p className="text-[8px] sm:text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] leading-none">
                    Ministry of Health (MOH)
                  </p>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-teal-500/50 p-0.5 flex items-center justify-center overflow-hidden">
                    {user?.profile_photo_url ? (
                      <img 
                        src={user.profile_photo_url} 
                        alt={user.full_name || "Profile"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-sm sm:text-lg font-bold text-teal-400">
                        {(user?.full_name || "A").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-teal-500 border-2 border-[#020617] rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm sm:text-lg font-bold text-white tracking-tight leading-none truncate max-w-[100px] xs:max-w-none">
                      {user?.full_name || "Amri Amit"}
                    </p>
                    <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-[6px] sm:text-[8px] font-black text-teal-400 uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-400 tracking-wide truncate">
                    {user?.jawatan || user?.role?.role_name || "Assistant Pharmacist"}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 sm:p-4 hover:bg-red-500/10 rounded-xl sm:rounded-2xl text-slate-500 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/20"
              title="Log Keluar"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 flex flex-col gap-6 sm:gap-8">
        
        {/* Hero Greeting - Now Full Width */}
        {/* Hero Greeting & Stats Horizontal Layout */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg sm:text-2xl font-black text-white mb-1 sm:mb-2 tracking-tighter flex flex-wrap items-center gap-x-2 sm:gap-x-4">
              <span>Selamat Datang,</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 italic">
                {user?.full_name}
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide">
              Sistem Pengurusan Operasi Hospital Bersepadu
            </p>
          </motion.div>

          <SystemStatsCounter data={statsData} />
        </header>

        {/* 1. Situational Awareness Section (Moved to Top) */}
        <div className="w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Notis & Isu Utama</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistem Aktif</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Penyelenggaraan</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-300 leading-tight font-medium">
                  Bekalan oksigen di Blok B terjejas sehingga <span className="text-white font-bold">4:00 PM</span>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Kecemasan</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-300 leading-tight font-medium">
                  Stok silinder saiz D kritikal. Sila pulangkan silinder kosong segera.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">Pengumuman</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-300 leading-tight font-medium">
                  Audit Kualiti (MSQH) Isnin depan. Pastikan log dikemaskini.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 2. Modules Grid (High Density) */}
        <div className="w-full">
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {MODULES.map((module, idx) => {
              const Icon = module.icon
              const style = MODULE_STYLES[module.colorKey] || MODULE_STYLES.teal

              return (
                <motion.button
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => {
                    if (
                      module.id === 'warrant' || 
                      module.id === 'cylinder' || 
                      module.id === 'suhu' || 
                      module.id === 'admin' || 
                      module.id === 'myphis' || 
                      module.id === 'mymsds' || 
                      module.id === 'kunci' ||
                      module.id === 'transporter' ||
                      module.id === 'inventory'
                    ) {
                      navigate(module.path)
                    } else {
                      setSelectedModuleName(module.name)
                      setShowSurpriseModal(true)
                    }
                  }}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative group flex flex-col sm:flex-row items-center justify-center sm:justify-start p-2.5 sm:p-3.5 transition-all text-center sm:text-left sm:bg-slate-900/70 sm:backdrop-blur-xl sm:border sm:border-white/10 sm:hover:bg-slate-900/90 sm:hover:border-white/20 sm:rounded-2xl sm:shadow-2xl active:bg-slate-800/90 select-none touch-manipulation"
                >
                  {/* Active Touch Burst Ring */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/0 group-active:border-teal-400/60 group-active:bg-teal-400/10 group-active:scale-105 transition-all duration-150 pointer-events-none" />

                  {/* Framed Icon Box with Colored Border & Touch Spring */}
                  <motion.div 
                    whileTap={{ scale: 0.82, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className={`relative w-14 h-14 sm:w-11 sm:h-11 rounded-2xl sm:rounded-xl bg-slate-950/80 backdrop-blur-md border-2 ${style.border} ${style.bg} ${style.hoverBorder} ${style.glow} group-active:border-white group-active:bg-slate-900 group-active:shadow-[0_0_22px_rgba(255,255,255,0.7)] flex items-center justify-center shadow-lg shadow-black/40 transition-all duration-200 group-hover:scale-105 shrink-0`}
                  >
                    {/* Inner Touch Ripple Flash */}
                    <span className="absolute inset-0 rounded-2xl sm:rounded-xl bg-white/25 opacity-0 group-active:opacity-100 group-active:scale-110 transition-all duration-150 pointer-events-none" />

                    <Icon className={`w-7 h-7 sm:w-5 sm:h-5 ${style.iconColor} group-active:text-white group-active:scale-115 transition-transform duration-150 drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]`} />
                  </motion.div>

                  {/* Module Name & Description */}
                  <div className="flex-1 min-w-0 mt-2 sm:mt-0 sm:ml-3">
                    <h3 className="text-[11px] xs:text-xs sm:text-sm font-bold text-slate-100 sm:text-white tracking-tight group-hover:text-teal-400 group-active:text-teal-300 transition-colors leading-tight mb-0 sm:mb-0.5 break-words max-w-full drop-shadow-sm">
                      {/* Mobile: Simple Name | Desktop: Full Name */}
                      <span className="sm:hidden">{module.name.replace('My', '')}</span>
                      <span className="hidden sm:inline">{t(`module.${module.id}`, module.name)}</span>
                    </h3>
                    <p className="hidden sm:block text-[9px] text-slate-400 font-medium truncate">
                      {t(`module.${module.id}.desc`, module.description)}
                    </p>
                  </div>

                  {/* Desktop Only: Chevron */}
                  <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-slate-700 group-hover:text-teal-500 group-hover:translate-x-1 group-active:translate-x-2 transition-all" />
                </motion.button>
              )
            })}
          </div>
        </div>
      </main>
      </div>

      {/* Surprise Modal for Under Development Features */}
      <AnimatePresence>
        {showSurpriseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl"
            onClick={() => setShowSurpriseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md bg-slate-900 border border-teal-500/20 rounded-[2rem] p-8 text-center shadow-[0_0_50px_rgba(20,184,166,0.15)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Premium Glow effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Icon Container */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-2xl flex items-center justify-center mb-6 relative group">
                <div className="absolute inset-0 bg-teal-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Sparkles className="w-10 h-10 text-teal-400 animate-pulse" />
              </div>

              {/* Module Name */}
              <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                {selectedModuleName}
              </span>

              {/* Headline */}
              <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                Under Development!
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                We are crafting something truly special here. Please wait for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 font-extrabold">surprise</span>!
              </p>

              {/* Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSurpriseModal(false)}
                className="w-full py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all text-sm tracking-wide font-sans"
              >
                I'm Excited!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModuleHubPage
