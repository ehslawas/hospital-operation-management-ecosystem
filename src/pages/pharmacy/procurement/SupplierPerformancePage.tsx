import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { 
  IconSearch, 
  IconRefreshCw,
  IconCheckCircle,
  IconClock,
  IconAlertCircle,
  IconShield
} from '@/components/ui/Icons'
import { getSupplierAssessments } from '@/services/pharmacy/lpoService'
import { useAuthStore } from '@/stores/authStore'
import { Spinner, Input, Badge, Card } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { ChevronRight, Sparkles, Star, Award, TrendingUp, CheckCircle2, AlertTriangle, Package2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface SupplierAggregate {
  supplierName: string
  totalAssessments: number
  avgQuality: number
  avgSupport: number
  avgDelivery: number
  avgScore: number
  avgPercentage: number
  performanceLevel: string
  itemsSupplied: Set<string>
  assessments: any[]
}

export default function SupplierPerformancePage() {
  const { user } = useAuthStore()
  const hospitalId = user?.hospital_id

  const [assessments, setAssessments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)

  useEffect(() => {
    if (hospitalId) {
      loadData()
    }
  }, [hospitalId])

  const loadData = async () => {
    if (!hospitalId) return
    setIsLoading(true)
    try {
      const res = await getSupplierAssessments(hospitalId)
      if (res.data) {
        setAssessments(res.data)
      }
    } catch (error) {
      console.error('Failed to load supplier performance assessments', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Parse and aggregate data by supplier
  const supplierAggregates = assessments.reduce<Record<string, SupplierAggregate>>((acc, item) => {
    const po = item.lpo?.po || {}
    const supplierData = po.supplier || {}
    const supplierName = po.manual_supplier_name || supplierData.company_name || 'Unknown Supplier'
    
    if (!acc[supplierName]) {
      acc[supplierName] = {
        supplierName,
        totalAssessments: 0,
        avgQuality: 0,
        avgSupport: 0,
        avgDelivery: 0,
        avgScore: 0,
        avgPercentage: 0,
        performanceLevel: '',
        itemsSupplied: new Set<string>(),
        assessments: []
      }
    }

    const ratings = item.ratings || { quality: 0, support: 0, delivery: 0 }
    const agg = acc[supplierName]
    agg.totalAssessments += 1
    agg.avgQuality += ratings.quality || 0
    agg.avgSupport += ratings.support || 0
    agg.avgDelivery += ratings.delivery || 0
    agg.avgScore += item.total_score || 0
    agg.avgPercentage += item.percentage || 0
    agg.assessments.push(item)

    // Add supplied items
    if (Array.isArray(po.items)) {
      po.items.forEach((i: any) => {
        if (i.item_name) agg.itemsSupplied.add(i.item_name)
      })
    }

    return acc
  }, {})

  // Compute final averages
  Object.values(supplierAggregates).forEach((agg) => {
    agg.avgQuality = Number((agg.avgQuality / agg.totalAssessments).toFixed(1))
    agg.avgSupport = Number((agg.avgSupport / agg.totalAssessments).toFixed(1))
    agg.avgDelivery = Number((agg.avgDelivery / agg.totalAssessments).toFixed(1))
    agg.avgScore = Number((agg.avgScore / agg.totalAssessments).toFixed(1))
    agg.avgPercentage = Math.round(agg.avgPercentage / agg.totalAssessments)

    // Performance Threshold based on government guidelines (used in modal)
    if (agg.avgPercentage >= 80) {
      agg.performanceLevel = 'SANGAT MEMUASKAN'
    } else if (agg.avgPercentage >= 50) {
      agg.performanceLevel = 'MEMUASKAN'
    } else {
      agg.performanceLevel = 'TIDAK MEMUASKAN'
    }
  })

  // List of aggregated suppliers
  const supplierList = Object.values(supplierAggregates)

  // Filtered suppliers based on search query
  const filteredSuppliers = supplierList.filter(s => 
    s.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Array.from(s.itemsSupplied).some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate global statistics
  const globalTotalEvaluations = assessments.length
  const globalAvgPercentage = assessments.length > 0 
    ? Math.round(assessments.reduce((sum, item) => sum + (item.percentage || 0), 0) / assessments.length)
    : 0
  const globalAvgQuality = assessments.length > 0
    ? Number((assessments.reduce((sum, item) => sum + (item.ratings?.quality || 0), 0) / assessments.length).toFixed(1))
    : 0
  const globalAvgSupport = assessments.length > 0
    ? Number((assessments.reduce((sum, item) => sum + (item.ratings?.support || 0), 0) / assessments.length).toFixed(1))
    : 0
  const globalAvgDelivery = assessments.length > 0
    ? Number((assessments.reduce((sum, item) => sum + (item.ratings?.delivery || 0), 0) / assessments.length).toFixed(1))
    : 0

  const getPerformanceBadgeColor = (level: string) => {
    switch (level) {
      case 'SANGAT MEMUASKAN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'MEMUASKAN':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'TIDAK MEMUASKAN':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  // Render Star ratings beautifully
  const renderRatingStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />)
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative w-4 h-4 text-amber-500 shrink-0">
            <Star className="absolute top-0 left-0 w-4 h-4 text-slate-200" />
            <div className="absolute top-0 left-0 w-2 h-4 overflow-hidden">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
          </div>
        )
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-slate-200 shrink-0" />)
      }
    }

    return (
      <div className="flex items-center gap-0.5" title={`${rating} / 5.0`}>
        {stars}
        <span className="text-xs font-extrabold text-slate-500 ml-1.5 tabular-nums">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans selection:bg-slate-900 selection:text-white">
      {/* Premium Ambient Lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/[0.04] to-teal-500/[0.02] rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/[0.02] to-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full p-6 lg:p-8 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="text-slate-400">Financial</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">Procurement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-extrabold tracking-wide">Prestasi Pembekal</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#00a68a] to-emerald-950 border border-emerald-800/80 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/10 hover:rotate-2 transition-transform duration-300">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900">
                Supplier Performance
              </h1>
              <p className="text-slate-500 font-semibold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00a68a]" />
                Penilaian Prestasi Pembekal & Item Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={loadData}
              className="p-2 h-10 w-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <IconRefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* KPI Panel */}
        {!isLoading && assessments.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Total Evaluations */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-50/50 border-2 border-slate-100 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-[#00a68a]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Evaluations</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                      {globalTotalEvaluations}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Assessed LPOs</p>
                  </div>
                </div>
              </motion.div>

              {/* Global Average Rating */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="bg-emerald-50/40 border-2 border-emerald-100/70 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.05] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-700 shadow-sm">
                    <TrendingUp className="w-6 h-6 text-[#00a68a]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Avg Performance</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight tabular-nums">
                      {globalAvgPercentage}%
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Hospital-wide average</p>
                  </div>
                </div>
              </motion.div>

              {/* Quality Index */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-amber-50/40 border-2 border-amber-100/70 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-amber-200 hover:shadow-xl hover:shadow-amber-100/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.05] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-amber-100 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Quality Index</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight tabular-nums">
                      {globalAvgQuality} <span className="text-sm font-normal text-slate-400">/ 5</span>
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Item supply quality score</p>
                  </div>
                </div>
              </motion.div>

              {/* Support & Delivery */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="bg-sky-50/40 border-2 border-sky-100/70 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.05] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-300" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-sky-100 border border-sky-200 rounded-2xl flex items-center justify-center text-sky-700 shadow-sm">
                    <IconClock className="w-6 h-6 text-sky-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-sky-600 uppercase tracking-widest">Delivery & Support</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight tabular-nums">
                      {globalAvgDelivery} <span className="text-xs font-normal text-slate-400">Delivery</span>
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Avg delivery punctuality</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
          
          {/* LEFT PANEL: Supplier List Cards & Aggregates */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl space-y-6">
              
              {/* Filter bar */}
              <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="text"
                    placeholder="Search by supplier or drug item..."
                    className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-slate-900 font-extrabold">{filteredSuppliers.length}</span> active suppliers
                </div>
              </div>

              {/* Suppliers List Container */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching assessments...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-slate-100">
                  <IconAlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No rated suppliers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSuppliers.map((sup) => {
                    const isSelected = selectedSupplier === sup.supplierName
                    return (
                      <motion.div
                        key={sup.supplierName}
                        whileHover={{ y: -4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={() => setSelectedSupplier(isSelected ? null : sup.supplierName)}
                        className={cn(
                          "cursor-pointer p-6 rounded-[2.5rem] border-2 transition-all space-y-5 text-left relative overflow-hidden group",
                          isSelected
                            ? "bg-[#e6f7f4] border-[#00a68a] shadow-lg shadow-emerald-100/50"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"
                        )}
                      >
                        {/* Rating Banner */}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier Name</span>
                            <h4 className="text-base font-black text-slate-800 leading-tight group-hover:text-[#00a68a] transition-colors line-clamp-1">
                              {sup.supplierName}
                            </h4>
                          </div>
                          <Badge className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider shrink-0",
                            getPerformanceBadgeColor(sup.performanceLevel)
                          )}>
                            {sup.performanceLevel}
                          </Badge>
                        </div>

                        {/* Summary of Averages */}
                        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                          <div className="text-center space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Kualiti</span>
                            <span className="text-xs font-black text-slate-700 block">{sup.avgQuality.toFixed(1)} ⭐</span>
                          </div>
                          <div className="text-center space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Sokongan</span>
                            <span className="text-xs font-black text-slate-700 block">{sup.avgSupport.toFixed(1)} ⭐</span>
                          </div>
                          <div className="text-center space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Delivery</span>
                            <span className="text-xs font-black text-slate-700 block">{sup.avgDelivery.toFixed(1)} ⭐</span>
                          </div>
                        </div>

                        {/* List of supplied items count & tag previews */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Supplied Items</span>
                            <span className="text-slate-800 font-extrabold">{sup.itemsSupplied.size} items</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(sup.itemsSupplied).slice(0, 3).map((item, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 bg-slate-100 border border-slate-200/50 rounded-md text-[9px] font-bold text-slate-500 line-clamp-1 max-w-[150px] truncate"
                              >
                                {item}
                              </span>
                            ))}
                            {sup.itemsSupplied.size > 3 && (
                              <span className="px-2 py-0.5 bg-[#00a68a]/10 rounded-md text-[9px] font-black text-[#00a68a]">
                                +{sup.itemsSupplied.size - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer aggregate info */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100/60 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <div>
                            Assessed: <span className="text-slate-700 font-black">{sup.totalAssessments} LPOs</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#00a68a] font-black">
                            <span>Score: {sup.avgPercentage}%</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: SUPPLIER DETAIL & ITEMS LIST OR HISTORY LOG */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
              {/* Dynamic ambient lights inside dark panel */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.05] rounded-full blur-[30px] pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Package2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">Supplied Items Breakdown</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items & assessment timeline</p>
                  </div>
                </div>

                {!selectedSupplier ? (
                  <div className="py-12 text-center text-slate-400 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto shadow-inner">
                      <Sparkles className="w-6 h-6 text-slate-500 animate-pulse" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">
                      Select a supplier card on the left to see detailed supplied items and score log.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                    <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl space-y-2">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block leading-none">ACTIVE FILTER</span>
                      <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                        {selectedSupplier}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                        <span>Overall Grade:</span>
                        <span className="text-emerald-400 font-extrabold">{supplierAggregates[selectedSupplier].avgPercentage}%</span>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {supplierAggregates[selectedSupplier].assessments.map((ass, idx) => {
                        const po = ass.lpo?.po || {}
                        const items = po.items || []
                        return (
                          <div 
                            key={ass.id || idx} 
                            className="p-4 bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800/60 rounded-xl space-y-3 transition-colors text-left"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-slate-700/80 rounded text-[8px] font-black text-slate-300 tracking-wider">
                                    {ass.lpo?.lpo_number || 'LPO'}
                                  </span>
                                  {ass.goods_receipt && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black tracking-wider border border-emerald-500/30">
                                      DO: {ass.goods_receipt.delivery_note_number || ass.goods_receipt.gr_number}
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[9px] text-slate-400 font-bold mt-1">
                                  {new Date(ass.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <span className="text-xs font-extrabold text-emerald-400">
                                {ass.percentage}%
                              </span>
                            </div>

                            {/* Supplied drugs preview */}
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Supplied Item(s)</span>
                              <div className="space-y-1">
                                {items.map((it: any, iIdx: number) => (
                                  <div key={iIdx} className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                                    <span className="truncate max-w-[150px]" title={it.item_name}>{it.item_name}</span>
                                    <span className="text-slate-400 font-normal shrink-0">x{it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Star details breakdown */}
                            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/60 text-[9px] font-bold text-slate-400 text-center">
                              <div>
                                <span className="block text-[7px] text-slate-500 uppercase">Kualiti</span>
                                <span className="text-slate-300">{ass.ratings?.quality} ⭐</span>
                              </div>
                              <div>
                                <span className="block text-[7px] text-slate-500 uppercase">Sokongan</span>
                                <span className="text-slate-300">{ass.ratings?.support} ⭐</span>
                              </div>
                              <div>
                                <span className="block text-[7px] text-slate-500 uppercase">Tempo</span>
                                <span className="text-slate-300">{ass.ratings?.delivery} ⭐</span>
                              </div>
                            </div>
                            
                            {/* Comments if any */}
                            {ass.comments && (
                              <div className="pt-2 border-t border-slate-800/60 text-left">
                                <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Ulasan / Komen</span>
                                <p className="text-[10px] text-slate-300 italic bg-slate-800/30 p-2 rounded border border-slate-700/50">
                                  "{ass.comments}"
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: DETAILED HISTORY GRIDS */}
        {!isLoading && assessments.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-800">Historical Evaluation Log</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chronological timeline of all assessments submitted</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-inner">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assessed Date</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supplier</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LPO Reference</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kualiti Bekalan</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sokongan Pelanggan</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tempoh Penghantaran</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Comments</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Score</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Grade (%)</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {assessments.map((ass) => {
                      const po = ass.lpo?.po || {}
                      const sName = po.manual_supplier_name || po.supplier?.company_name || '—'
                      return (
                        <tr key={ass.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="text-sm font-bold text-slate-900">
                              {new Date(ass.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-slate-800">{sName}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-extrabold text-slate-700">{ass.lpo?.lpo_number || '—'}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{po.po_number || '—'}</span>
                              {ass.goods_receipt && (
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-1.5 self-start uppercase tracking-tighter">
                                  DO: {ass.goods_receipt.delivery_note_number || ass.goods_receipt.gr_number}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {renderRatingStars(ass.ratings?.quality || 0)}
                          </td>
                          <td className="px-6 py-5">
                            {renderRatingStars(ass.ratings?.support || 0)}
                          </td>
                          <td className="px-6 py-5">
                            {renderRatingStars(ass.ratings?.delivery || 0)}
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[11px] text-slate-500 line-clamp-2 max-w-[200px]" title={ass.comments}>
                              {ass.comments || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-sm font-black text-slate-800">{ass.total_score} / 15</span>
                          </td>
                          <td className="px-6 py-5 text-left">
                            <span className="text-sm font-extrabold text-[#00a68a]">{ass.percentage}%</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <Badge className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider",
                              getPerformanceBadgeColor(ass.performance_level)
                            )}>
                              {ass.performance_level}
                            </Badge>
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

      </div>
    </div>
  )
}
