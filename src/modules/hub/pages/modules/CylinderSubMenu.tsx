// @ts-nocheck
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  AirVent, 
  Activity, 
  Database, 
  ShoppingCart, 
  QrCode, 
  ScrollText, 
  FileText, 
  BarChart3, 
  Wrench,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { useLanguage } from '@/shared/contexts/LanguageContext'

export const CylinderSubMenu: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const subModules = [
    {
      title: language === 'ms' ? 'Dashboard Oksigen' : 'Oxygen Dashboard',
      description: language === 'ms' 
        ? 'Ringkasan kapasiti silinder, penggunaan langsung, rekod penerimaan dan peruntukan kewangan.'
        : 'Overview of live oxygen cylinder capacity, utilization, and supplier delivery logs.',
      href: ROUTES.PHARMACY_OXYGEN,
      icon: Activity,
      color: 'teal',
      badge: language === 'ms' ? 'Utama' : 'Main'
    },
    {
      title: language === 'ms' ? 'Inventori Silinder' : 'Cylinder Inventory',
      description: language === 'ms'
        ? 'Pangkalan data penuh silinder, pemilikan pinjaman (loan), dan kedudukan fizikal.'
        : 'Full cylinder fleet registry, loan status tracking, and physical store balance.',
      href: ROUTES.PHARMACY_OXYGEN_CYLINDERS,
      icon: Database,
      color: 'indigo'
    },
    {
      title: language === 'ms' ? 'Permohonan Silinder' : 'Cylinder Request',
      description: language === 'ms'
        ? 'Aliran kerja permohonan bekalan silinder dari wad dan unit klinikal hospital.'
        : 'Department oxygen request workflow, clinical approvals, and cylinder dispatch.',
      href: ROUTES.PHARMACY_OXYGEN_CONSUMPTION,
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: language === 'ms' ? 'Jana Kod QR' : 'QR Generator',
      description: language === 'ms'
        ? 'Jana dan cetak label kod QR fizikal untuk penjejakan pantas setiap tabung silinder.'
        : 'Generate and print physical QR code tags for instant cylinder scanning and audits.',
      href: '/pharmacy/oxygen/qr',
      icon: QrCode,
      color: 'purple'
    },
    {
      title: language === 'ms' ? 'Lejar KEW.PS-4 Silinder' : 'KEW.PS-4 Cylinder Ledger',
      description: language === 'ms'
        ? 'Buku rekod daftar transaksi rasmi mengikut Tatacara Pengurusan Stor (Penerimaan, Pengeluaran & Verifikasi).'
        : 'Official government treasury stock ledger, supplier DO records, ward dispatches, and store verifications.',
      href: ROUTES.PHARMACY_OXYGEN_LEDGER,
      icon: ScrollText,
      color: 'emerald',
      badge: language === 'ms' ? 'Pekeliling TPS' : 'Treasury Standard'
    },
    {
      title: language === 'ms' ? 'Penyelarasan Stok' : 'Stock Reconciliation',
      description: language === 'ms'
        ? 'Semakan fizikal audit silinder dan penyelarasan perbezaan kiraan di lapangan.'
        : 'Physical cylinder audit reconciliations and variance adjustments.',
      href: '/pharmacy/oxygen/reconciliation',
      icon: FileText,
      color: 'amber'
    },
    {
      title: language === 'ms' ? 'Laporan Silinder' : 'Cylinder Report',
      description: language === 'ms'
        ? 'Laporan eksekutif, perbelanjaan waran, analitik penggunaan wad dan unjuran belanjawan.'
        : 'Executive analytics, warrant expenditure, ward consumption breakdown, and forecasting.',
      href: ROUTES.PHARMACY_OXYGEN_REPORTS,
      icon: BarChart3,
      color: 'cyan'
    },
    {
      title: language === 'ms' ? 'Penyelenggaraan Silinder' : 'Cylinder Maintenance',
      description: language === 'ms'
        ? 'Penjejakan ujian tekanan hidrostatik, semakan injap keselamatan, dan kepatuhan piawaian.'
        : 'Hydrostatic pressure test logs, safety valve inspections, and maintenance tracking.',
      href: '/pharmacy/oxygen/maintenance',
      icon: Wrench,
      color: 'rose'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'teal':
        return 'bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white'
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'
      case 'indigo':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white'
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white'
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white'
      case 'amber':
        return 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white'
      case 'cyan':
        return 'bg-cyan-50 text-cyan-600 border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white'
      case 'rose':
        return 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-slate-800 group-hover:text-white'
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <button 
          onClick={() => navigate(ROUTES.HUB)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ms' ? 'Kembali ke Hub Utama' : 'Back to Main Hub'}</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl shadow-lg">
            <AirVent className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                Medical Oxygen Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-0.5">MyCylinder</h1>
            <p className="text-slate-500 text-xs md:text-sm">
              {language === 'ms' ? 'Pusat Pengurusan Oksigen & Silinder Gas Perubatan' : 'Medical Oxygen & Cylinder Management Ecosystem'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {subModules.map((mod, idx) => {
          const Icon = mod.icon
          return (
            <button
              key={idx}
              onClick={() => navigate(mod.href)}
              className="group text-left p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-teal-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border transition-all duration-300 ${getColorClasses(mod.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {mod.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {mod.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600 group-hover:text-teal-700">
                <span>{language === 'ms' ? 'Buka Modul' : 'Open Module'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CylinderSubMenu
