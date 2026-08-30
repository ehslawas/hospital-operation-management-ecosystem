import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  User,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Briefcase,
  AlertCircle
} from 'lucide-react'
import { getDepartments } from '@/services/departmentService'
import { getUsers } from '@/services/userService'
import type { DepartmentWithRelations, UserWithRelations } from '@/types'

const SOFTWARE_MODULE_CODES = new Set([
  'system_porter',
  'system_transporter',
  'system_priviledging',
  'system_tempahan',
  'system_perhimpunan',
  'system_kunci',
  'system_cuti',
  'system_staff',
  'pharmacy_logistics',
  'pharmacy_formulari',
  'billing',
  'hr',
  'asset',
  'reports'
])

const isSoftwareModule = (code: string, name: string) => {
  const normalizedCode = (code || '').toLowerCase().trim()
  const normalizedName = (name || '').toLowerCase().trim()

  if (SOFTWARE_MODULE_CODES.has(normalizedCode)) return true
  if (normalizedCode.startsWith('system_')) return true
  if (
    [
      'myporter',
      'mypriviledging',
      'mytempahan',
      'mytransporter',
      'mywarrant',
      'myformulari',
      'myperhimpunan',
      'mykunci',
      'mycuti',
      'mystaff',
      'mysuhu',
      'mymsds',
      'myphis',
      'mycrossborder',
    ].some((m) => normalizedName.includes(m) || normalizedCode.includes(m))
  )
    return true

  return false
}

export const AdminDepartmentsTab: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentWithRelations[]>([])
  const [allUsers, setAllUsers] = useState<UserWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Selected department details view
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [deptsRes, usersRes] = await Promise.all([
        getDepartments({ page: 1, pageSize: 200 }),
        getUsers({ page: 1, pageSize: 200 }) // Load all users to client-side grouping
      ])

      setDepartments(deptsRes.data || [])
      setAllUsers(usersRes.data || [])
    } catch (err) {
      console.error('Error fetching departments tab details:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter out software modules and group duplicate hospital departments by normalized name
  const deduplicatedDepts = React.useMemo(() => {
    const deptMap = new Map<string, {
      dept: DepartmentWithRelations
      ids: Set<string>
    }>()

    // Exclude software system modules (MyPorter, MyPriviledging, MyTempahan, MyTransporter, MyWarrant, MyStaff, MyCuti, MyFormulari, MyKunci, MyPerhimpunan, etc.)
    const realHospitalDepts = departments.filter((d) => !isSoftwareModule(d.department_code, d.department_name))

    realHospitalDepts.forEach((d) => {
      const key = (d.department_name || d.department_code).toLowerCase().trim()
      if (!deptMap.has(key)) {
        deptMap.set(key, {
          dept: { ...d },
          ids: new Set([d.id])
        })
      } else {
        const existing = deptMap.get(key)!
        existing.ids.add(d.id)

        // Prefer detailed description and non-null HOD if present
        if (!existing.dept.description || (d.description && d.description.length > (existing.dept.description?.length || 0))) {
          existing.dept.description = d.description
        }
        if (!existing.dept.head_of_department && d.head_of_department) {
          existing.dept.head_of_department = d.head_of_department
        }
      }
    })

    return Array.from(deptMap.values()).map(item => ({
      dept: item.dept,
      ids: Array.from(item.ids)
    }))
  }, [departments])

  const getDeptMembers = (ids: string[]) => {
    const idSet = new Set(ids)
    return allUsers.filter((u) => u.department_id && idSet.has(u.department_id))
  }

  const toggleExpand = (deptId: string) => {
    setExpandedDeptId((prev) => (prev === deptId ? null : deptId))
  }

  const filteredDepts = deduplicatedDepts.filter(
    ({ dept }) =>
      dept.department_name.toLowerCase().includes(search.toLowerCase()) ||
      dept.department_code.toLowerCase().includes(search.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header filtering */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Carian jabatan atau kod..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Jumlah Jabatan: <span className="text-white font-bold">{filteredDepts.length}</span>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="p-12 space-y-4">
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-600" />
          <div>
            <p className="text-white font-bold">No departments found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting search term.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDepts.map(({ dept, ids }) => {
            const isExpanded = expandedDeptId === dept.id
            const members = getDeptMembers(ids)
            const count = members.length

            return (
              <motion.div
                key={dept.id}
                layout="position"
                className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-200 hover:border-white/10"
              >
                {/* Header view */}
                <div
                  onClick={() => toggleExpand(dept.id)}
                  className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mt-1 md:mt-0 flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{dept.department_name}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5 uppercase">
                          {dept.department_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        {dept.description || 'Tiada keterangan disediakan (No description available)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t border-white/5 pt-4 md:pt-0 md:border-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-500">Ketua Jabatan (HOD)</div>
                      <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {dept.head_of_department?.full_name || 'Tiada (Not Assigned)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-slate-500">Ahli Aktif</div>
                        <div className="text-sm font-extrabold text-white flex items-center gap-1 mt-0.5 tabular-nums">
                          <Users className="w-4 h-4 text-teal-400" /> {count}
                        </div>
                      </div>

                      <div className="p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Member List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-6 bg-slate-950/40 space-y-4">
                        <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> Senarai Ahli Jabatan (Department Members List)
                        </h4>

                        {members.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs">
                            Tiada kakitangan ditugaskan di jabatan ini.
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-white/5">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                  <th className="p-4">Staff Details</th>
                                  <th className="p-4">No. Pekerja</th>
                                  <th className="p-4">Peranan Keahlian</th>
                                  <th className="p-4">Jawatan KKM</th>
                                  <th className="p-4">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-slate-300 text-sm font-medium">
                                {members.map((m) => (
                                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                                          {m.profile_photo_url ? (
                                            <img src={m.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            m.full_name.charAt(0)
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-white text-sm font-bold">{m.full_name}</div>
                                          <div className="text-xs text-slate-500 font-mono">{m.ic_number}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{m.employee_id || 'NOT_ASSIGNED'}</td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-1 text-slate-300 text-xs font-semibold">
                                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{m.role?.role_name}</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{m.jawatan}</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(m.status)}`}>
                                        {m.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
