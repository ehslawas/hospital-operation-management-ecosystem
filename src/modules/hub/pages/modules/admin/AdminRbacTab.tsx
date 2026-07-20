import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  CheckSquare,
  Square,
  Save,
  RefreshCw,
  Search,
  Lock,
  Info,
  Check,
  X
} from 'lucide-react'
import {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions
} from '@/services/roleService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import type { Role, Permission } from '@/types'

export const AdminRbacTab: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastStore()
  const { user: currentUser } = useAuthStore()

  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [rbacSearch, setRbacSearch] = useState('')

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [rolesList, permissionsList] = await Promise.all([
          getAllRoles(),
          getAllPermissions()
        ])

        // Exclude system_admin from modification for security reasons
        const filteredRoles = rolesList.filter((r) => r.role_code !== 'system_admin')
        setRoles(filteredRoles)
        setAllPermissions(permissionsList)

        if (filteredRoles.length > 0) {
          setSelectedRoleId(filteredRoles[0].id)
        }
      } catch (err) {
        showError('Error', 'Failed to retrieve RBAC settings')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [showError])

  useEffect(() => {
    if (!selectedRoleId) return

    const fetchRolePermissionsData = async () => {
      setIsLoading(true)
      try {
        const perms = await getRolePermissions(selectedRoleId)
        const ids = perms.map((p) => p.id)
        setRolePermissionIds(ids)
        setSelectedPermissionIds(ids)
      } catch (err) {
        showError('Error', 'Failed to load permissions for this role')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRolePermissionsData()
  }, [selectedRoleId, showError])

  const handleTogglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAllInModule = (moduleCode: string, items: Permission[]) => {
    const moduleItemIds = items.map((i) => i.id)
    const allSelected = moduleItemIds.every((id) => selectedPermissionIds.includes(id))

    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !moduleItemIds.includes(id)))
    } else {
      setSelectedPermissionIds((prev) => [...new Set([...prev, ...moduleItemIds])])
    }
  }

  const handleSave = async () => {
    if (!selectedRoleId) return

    setIsSaving(true)
    try {
      await updateRolePermissions(
        selectedRoleId,
        selectedPermissionIds,
        currentUser?.id || ''
      )
      setRolePermissionIds(selectedPermissionIds)
      showSuccess('Success', 'Role permissions updated successfully.')
    } catch (err: any) {
      showError('Error', err.message || 'Failed to save permission modifications')
    } finally {
      setIsSaving(false)
    }
  }

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    const mod = perm.module || 'general'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId)
  const hasChanges =
    JSON.stringify([...selectedPermissionIds].sort()) !==
    JSON.stringify([...rolePermissionIds].sort())

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Role Selector */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-teal-400" /> Pilih Peranan (Roles)
        </h3>
        <div className="space-y-2">
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`w-full p-4 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                    : 'bg-transparent text-slate-300 border-white/5 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <span className="text-sm font-bold">{r.role_name}</span>
                <span className="text-xs text-slate-500 font-mono font-semibold uppercase">
                  {r.role_code}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Panel: Permission Matrix */}
      <div className="lg:col-span-3 space-y-6">
        {selectedRoleObj && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">{selectedRoleObj.role_name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5 uppercase">
                  {selectedRoleObj.role_code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedRoleObj.description || 'Manage access control options for this role.'}
              </p>
            </div>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 text-white hover:bg-teal-600 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            )}
          </div>
        )}

        {/* Matrix list */}
        {isLoading ? (
          <div className="p-12 space-y-4">
            <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6 pb-24">
            {Object.entries(permissionsByModule).map(([moduleName, perms]) => {
              const moduleItemIds = perms.map((p) => p.id)
              const allSelected = moduleItemIds.every((id) => selectedPermissionIds.includes(id))

              // Client-side filtration
              const filteredPerms = perms.filter(
                (p) =>
                  p.permission_name.toLowerCase().includes(rbacSearch.toLowerCase()) ||
                  p.permission_code.toLowerCase().includes(rbacSearch.toLowerCase())
              )

              if (filteredPerms.length === 0) return null

              return (
                <div
                  key={moduleName}
                  className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md"
                >
                  {/* Category Header */}
                  <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider capitalize">
                        {moduleName.replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure {perms.length} operations within this submodule
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectAllInModule(moduleName, perms)}
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors"
                    >
                      {allSelected ? (
                        <>
                          <CheckSquare className="w-4 h-4" /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" /> Select All
                        </>
                      )}
                    </button>
                  </div>

                  {/* Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPerms.map((p) => {
                      const isActive = selectedPermissionIds.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleTogglePermission(p.id)}
                          className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                            isActive
                              ? 'bg-teal-500/5 text-teal-400 border-teal-500/20'
                              : 'bg-transparent text-slate-300 border-white/5 hover:bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="mt-1 flex-shrink-0">
                            {isActive ? (
                              <div className="w-4.5 h-4.5 rounded bg-teal-500 text-slate-950 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4.5 h-4.5 rounded border-2 border-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white leading-tight">
                              {p.permission_name}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-normal">
                              {p.description || 'Kebenaran keupayaan modul (No description provided)'}
                            </p>
                            <span className="text-[10px] text-slate-600 font-mono mt-2 block">
                              {p.permission_code}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Save Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 right-6 left-6 lg:left-80 z-40 bg-slate-900/90 backdrop-blur-xl border border-teal-500/30 shadow-2xl p-4 rounded-2xl max-w-4xl mx-auto flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Unsaved Modifications Detected</p>
                <p className="text-xs text-slate-400">
                  {selectedPermissionIds.length} permissions configured for selected role. Click save to persist.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPermissionIds(rolePermissionIds)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
