// src/modules/mysuhu/pages/SuhuDashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Thermometer, 
  AlertTriangle, 
  CheckCircle,
  Building,
  ArrowRight,
  ShieldAlert,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge, Spinner } from '@/components/ui'
import { getUnitPemantauan } from '@/modules/mysuhu/services/suhuService'
import { getDepartmentsByHospital } from '@/services/departmentService'
import type { UnitPemantauanWithRelations } from '@/types/mysuhu'
import type { Department } from '@/types'

export const SuhuDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hospitalId = user?.hospital_id || 'hosp-1'
  const userRole = user?.role?.role_code || ''
  const isAdmin = ['system_admin', 'hospital_admin', 'hospital_administrator'].includes(userRole)
  const userDeptId = user?.department_id || ''

  const [departments, setDepartments] = useState<Department[]>([])
  const [units, setUnits] = useState<UnitPemantauanWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [deptsRes, unitsRes] = await Promise.all([
          getDepartmentsByHospital(hospitalId),
          getUnitPemantauan()
        ])
        setDepartments(deptsRes || [])
        setUnits(unitsRes.data || [])
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [hospitalId])

  // Map units to departments and calculate stats per department
  const deptStats = useMemo(() => {
    const stats: Record<string, {
      total: number
      normal: number
      warning: number
      breach: number
      noReading: number
    }> = {}

    units.forEach(unit => {
      const deptId = unit.lokasi?.department_id
      if (!deptId) return

      if (!stats[deptId]) {
        stats[deptId] = { total: 0, normal: 0, warning: 0, breach: 0, noReading: 0 }
      }

      stats[deptId].total++
      if (unit.status_pemantauan === 'normal') stats[deptId].normal++
      else if (unit.status_pemantauan === 'warning') stats[deptId].warning++
      else if (unit.status_pemantauan === 'breach') stats[deptId].breach++
      else stats[deptId].noReading++
    })

    return stats;
  }, [units])

  // Filter visible departments based on user credentials (non-admins only see their department)
  const visibleDepartments = useMemo(() => {
    return departments.filter(dept => {
      if (!isAdmin && userDeptId) {
        return dept.id === userDeptId
      }
      return true
    })
  }, [departments, isAdmin, userDeptId])

  // Global counts across visible departments
  const summary = useMemo(() => {
    let total = 0
    let normal = 0
    let warning = 0
    let breach = 0
    let noReading = 0

    visibleDepartments.forEach(dept => {
      const stat = deptStats[dept.id]
      if (stat) {
        total += stat.total
        normal += stat.normal
        warning += stat.warning
        breach += stat.breach
        noReading += stat.noReading
      }
    })

    return { total, normal, warning, breach, noReading }
  }, [visibleDepartments, deptStats])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Spinner size="lg" className="text-[#00a68a] mb-4" />
        <p className="text-sm font-medium">Loading Temperature Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 w-full space-y-8 text-slate-800">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-[#00a68a] to-emerald-500" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <span>Temperature Monitoring Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Select a department to view and record temperature logs</p>
        </div>
      </div>

      {/* Global Breach Notification */}
      {summary.breach > 0 && (
        <div 
          onClick={() => navigate('/suhu/breaches')}
          className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl cursor-pointer hover:bg-rose-100/50 transition-all shadow-md group animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">Active Temperature Breach Incident Detected</p>
              <p className="text-xs text-rose-600 font-medium">Click to inspect and annotate correct action logs immediately.</p>
            </div>
          </div>
          <span className="text-xs font-black text-rose-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Breach Log &rarr;
          </span>
        </div>
      )}

      {/* Hospital KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Units</span>
          <p className="text-3xl font-black font-mono text-slate-800 mt-2">{summary.total}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Normal</span>
          <p className="text-3xl font-black font-mono text-emerald-600 mt-2">{summary.normal}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Warning</span>
          <p className="text-3xl font-black font-mono text-amber-600 mt-2">{summary.warning}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-rose-500">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Breach</span>
          <p className="text-3xl font-black font-mono text-rose-600 mt-2">{summary.breach}</p>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-lg border-l-4 border-l-slate-400">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">No Readings</span>
          <p className="text-3xl font-black font-mono text-slate-500 mt-2">{summary.noReading}</p>
        </div>
      </div>

      {/* Department Selector Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hospital Departments</h2>
        
        {visibleDepartments.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-lg">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No departments configured with temperature monitoring</p>
            <p className="text-xs text-slate-400 mt-1">Please contact system administrator to enroll your department.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleDepartments.map(dept => {
              const stat = deptStats[dept.id] || { total: 0, normal: 0, warning: 0, breach: 0, noReading: 0 }
              const hasBreach = stat.breach > 0
              const hasWarning = stat.warning > 0
              
              let borderClass = 'border-slate-100 hover:border-[#00a68a]/30'
              if (hasBreach) borderClass = 'border-rose-100 hover:border-rose-300/60 ring-2 ring-rose-500/5'
              else if (hasWarning) borderClass = 'border-amber-100 hover:border-amber-300/60 ring-2 ring-amber-500/5'

              return (
                <div 
                  key={dept.id}
                  onClick={() => navigate(`/suhu/department/${dept.id}`)}
                  className={`bg-white border rounded-3xl p-6 shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${borderClass}`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 group-hover:bg-gradient-to-r group-hover:from-teal-400 group-hover:to-emerald-500 transition-all duration-300" />
                  
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-[#00a68a]/10 group-hover:text-[#00a68a] transition-all">
                        <Building className="w-5 h-5" />
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {hasBreach && (
                          <Badge variant="error" className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg">
                            Breach
                          </Badge>
                        )}
                        {hasWarning && !hasBreach && (
                          <Badge variant="warning" className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg">
                            Warning
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400 font-bold font-mono">
                          {dept.department_code}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-800 group-hover:text-[#00a68a] transition-colors line-clamp-1 mb-1">
                      {dept.department_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {stat.total === 0 ? 'No monitoring points registered' : `${stat.total} Active Monitoring Points`}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex gap-2">
                      {stat.total > 0 && (
                        <>
                          {stat.normal > 0 && (
                            <span className="text-[10px] font-black font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {stat.normal} OK
                            </span>
                          )}
                          {stat.warning > 0 && (
                            <span className="text-[10px] font-black font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {stat.warning} WRN
                            </span>
                          )}
                          {stat.breach > 0 && (
                            <span className="text-[10px] font-black font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {stat.breach} BRCH
                            </span>
                          )}
                          {stat.noReading > 0 && (
                            <span className="text-[10px] font-black font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {stat.noReading} N/A
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    <span className="text-xs font-black text-[#00a68a] flex items-center gap-1 transform group-hover:translate-x-1 transition-all">
                      Open &rarr;
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SuhuDashboardPage
