import React, { useEffect, useState, useMemo } from 'react'
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
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  PlusCircle,
  Edit3,
  CheckCircle2,
  Trash2,
  Download,
  Settings,
  Sparkles,
  Sliders,
  Layers,
  HelpCircle,
} from 'lucide-react'
import {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
} from '@/services/roleService'
import {
  SYSTEM_MODULE_REGISTRY,
  ACTION_DEFINITIONS,
  ROLE_CAPABILITY_PRESETS,
  ActionType,
  ModuleDefinition,
} from '@/shared/constants/moduleRegistry'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import type { Role, Permission } from '@/types'

interface MatrixState {
  // roleId -> moduleCode -> action -> boolean
  [roleId: string]: {
    [moduleCode: string]: {
      view?: boolean
      create?: boolean
      edit?: boolean
      approve?: boolean
      delete?: boolean
      export?: boolean
      admin?: boolean
      features?: {
        [featureCode: string]: {
          [action in ActionType]?: boolean
        }
      }
    }
  }
}

export const AdminRbacTab: React.FC = () => {
  const { success: showSuccess, error: showError } = useToastStore()
  const { user: currentUser } = useAuthStore()

  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [dbPermissions, setDbPermissions] = useState<Permission[]>([])
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])

  // Fine-grained granular matrix state
  const [matrixState, setMatrixState] = useState<MatrixState>({})
  const [savedMatrixState, setSavedMatrixState] = useState<MatrixState>({})

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [rbacSearch, setRbacSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // Fetch initial roles & DB permissions
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [rolesList, permissionsList] = await Promise.all([
          getAllRoles(),
          getAllPermissions(),
        ])

        // Exclude system_admin from modification for security reasons
        const filteredRoles = rolesList.filter((r) => r.role_code !== 'system_admin')
        setRoles(filteredRoles)
        setDbPermissions(permissionsList)

        if (filteredRoles.length > 0) {
          setSelectedRoleId(filteredRoles[0].id)
        }

        // Initialize matrix state from localStorage cache if present or default seeds
        const initialMatrix: MatrixState = {}
        filteredRoles.forEach((role) => {
          const roleCode = role.role_code.toLowerCase()
          let stored: any = null
          try {
            const raw = localStorage.getItem(`home_rbac_overrides_${roleCode}`)
            if (raw) stored = JSON.parse(raw)
          } catch (e) {
            // ignore
          }

          initialMatrix[role.id] = {}

          SYSTEM_MODULE_REGISTRY.forEach((mod) => {
            const modCode = mod.code.toLowerCase()
            const isDefaultAssigned = mod.defaultRoles.some(
              (r) => r.toLowerCase() === roleCode
            )

            if (stored && stored[modCode]) {
              initialMatrix[role.id][modCode] = stored[modCode]
            } else {
              // Default baseline according to role tier
              const isManagerOrAdmin =
                roleCode.includes('director') ||
                roleCode.includes('manager') ||
                roleCode.includes('admin') ||
                roleCode === 'hospital_admin'

              initialMatrix[role.id][modCode] = {
                view: isDefaultAssigned,
                create: isDefaultAssigned,
                edit: isDefaultAssigned,
                approve: isDefaultAssigned && isManagerOrAdmin,
                delete: isDefaultAssigned && isManagerOrAdmin,
                export: isDefaultAssigned,
                admin: isDefaultAssigned && isManagerOrAdmin && modCode === 'admin',
                features: {},
              }

              mod.features.forEach((feat) => {
                if (!initialMatrix[role.id][modCode].features) {
                  initialMatrix[role.id][modCode].features = {}
                }
                initialMatrix[role.id][modCode].features![feat.code] = {
                  view: isDefaultAssigned,
                  create: isDefaultAssigned && feat.supportedActions.includes('create'),
                  edit: isDefaultAssigned && feat.supportedActions.includes('edit'),
                  approve: isDefaultAssigned && isManagerOrAdmin && feat.supportedActions.includes('approve'),
                  delete: isDefaultAssigned && isManagerOrAdmin && feat.supportedActions.includes('delete'),
                  export: isDefaultAssigned && feat.supportedActions.includes('export'),
                  admin: isDefaultAssigned && isManagerOrAdmin && feat.supportedActions.includes('admin'),
                }
              })
            }
          })
        })

        setMatrixState(initialMatrix)
        setSavedMatrixState(JSON.parse(JSON.stringify(initialMatrix)))
      } catch (err) {
        showError('Ralat', 'Gagal memuat tetapan RBAC')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [showError])

  // Fetch DB role_permissions when role changes
  useEffect(() => {
    if (!selectedRoleId) return

    const fetchRolePermissionsData = async () => {
      try {
        const perms = await getRolePermissions(selectedRoleId)
        const ids = perms.map((p) => p.id)
        setRolePermissionIds(ids)
        setSelectedPermissionIds(ids)
      } catch (err) {
        console.error('Failed to load DB permissions for this role:', err)
      }
    }

    fetchRolePermissionsData()
  }, [selectedRoleId])

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId)

  const toggleModuleExpand = (moduleCode: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleCode]: !prev[moduleCode],
    }))
  }

  // Toggle specific action for a module
  const handleToggleModuleAction = (moduleCode: string, action: ActionType) => {
    if (!selectedRoleId) return

    setMatrixState((prev) => {
      const currentRoleMatrix = prev[selectedRoleId] || {}
      const currentMod = currentRoleMatrix[moduleCode] || {
        view: false,
        create: false,
        edit: false,
        approve: false,
        delete: false,
        export: false,
        admin: false,
        features: {},
      }

      const newValue = !currentMod[action]

      // If turning on create/edit/approve/delete, automatically ensure view is on
      const updatedMod = {
        ...currentMod,
        [action]: newValue,
        view: action !== 'view' && newValue ? true : action === 'view' && !newValue ? false : currentMod.view,
      }

      // If disabling view, disable all other sub-actions
      if (action === 'view' && !newValue) {
        updatedMod.create = false
        updatedMod.edit = false
        updatedMod.approve = false
        updatedMod.delete = false
        updatedMod.export = false
        updatedMod.admin = false
      }

      // Also cascade to all sub-features of this module
      const moduleDef = SYSTEM_MODULE_REGISTRY.find((m) => m.code === moduleCode)
      if (moduleDef && updatedMod.features) {
        const updatedFeatures = { ...updatedMod.features }
        moduleDef.features.forEach((feat) => {
          if (!updatedFeatures[feat.code]) {
            updatedFeatures[feat.code] = {}
          }
          if (feat.supportedActions.includes(action)) {
            updatedFeatures[feat.code] = {
              ...updatedFeatures[feat.code],
              [action]: newValue,
              view: action !== 'view' && newValue ? true : action === 'view' && !newValue ? false : updatedFeatures[feat.code]?.view,
            }
          }
        })
        updatedMod.features = updatedFeatures
      }

      return {
        ...prev,
        [selectedRoleId]: {
          ...currentRoleMatrix,
          [moduleCode]: updatedMod,
        },
      }
    })
  }

  // Toggle specific action for a sub-feature
  const handleToggleFeatureAction = (moduleCode: string, featureCode: string, action: ActionType) => {
    if (!selectedRoleId) return

    setMatrixState((prev) => {
      const currentRoleMatrix = prev[selectedRoleId] || {}
      const currentMod = currentRoleMatrix[moduleCode] || {
        view: false,
        features: {},
      }
      const currentFeatures = currentMod.features || {}
      const currentFeat = currentFeatures[featureCode] || {}

      const newValue = !currentFeat[action]
      const updatedFeat = {
        ...currentFeat,
        [action]: newValue,
        view: action !== 'view' && newValue ? true : action === 'view' && !newValue ? false : currentFeat.view,
      }

      const updatedMod = {
        ...currentMod,
        view: currentMod.view || (action !== 'view' && newValue),
        features: {
          ...currentFeatures,
          [featureCode]: updatedFeat,
        },
      }

      return {
        ...prev,
        [selectedRoleId]: {
          ...currentRoleMatrix,
          [moduleCode]: updatedMod,
        },
      }
    })
  }

  // Apply quick preset to entire role or single module
  const handleApplyPreset = (presetKey: string, targetModuleCode?: string) => {
    if (!selectedRoleId) return
    const preset = ROLE_CAPABILITY_PRESETS[presetKey]
    if (!preset) return

    setMatrixState((prev) => {
      const currentRoleMatrix = { ...(prev[selectedRoleId] || {}) }
      const modulesToUpdate = targetModuleCode
        ? SYSTEM_MODULE_REGISTRY.filter((m) => m.code === targetModuleCode)
        : SYSTEM_MODULE_REGISTRY

      modulesToUpdate.forEach((mod) => {
        const modCode = mod.code
        const updatedFeatures: Record<string, any> = {}

        mod.features.forEach((feat) => {
          const featActions: Record<string, boolean> = {}
          feat.supportedActions.forEach((act) => {
            featActions[act] = preset.actions.includes(act)
          })
          updatedFeatures[feat.code] = featActions
        })

        currentRoleMatrix[modCode] = {
          view: preset.actions.includes('view'),
          create: preset.actions.includes('create'),
          edit: preset.actions.includes('edit'),
          approve: preset.actions.includes('approve'),
          delete: preset.actions.includes('delete'),
          export: preset.actions.includes('export'),
          admin: preset.actions.includes('admin'),
          features: updatedFeatures,
        }
      })

      return {
        ...prev,
        [selectedRoleId]: currentRoleMatrix,
      }
    })

    showSuccess(
      'Pratetap Digunakan',
      `Templat "${preset.label}" berjaya diaplikasikan kepada ${targetModuleCode || 'semua modul'}.`
    )
  }

  // Toggle all actions in a module
  const handleSelectAllInModule = (moduleCode: string, enable: boolean) => {
    if (!selectedRoleId) return

    setMatrixState((prev) => {
      const currentRoleMatrix = { ...(prev[selectedRoleId] || {}) }
      const mod = SYSTEM_MODULE_REGISTRY.find((m) => m.code === moduleCode)
      if (!mod) return prev

      const updatedFeatures: Record<string, any> = {}
      mod.features.forEach((feat) => {
        const featActions: Record<string, boolean> = {}
        feat.supportedActions.forEach((act) => {
          featActions[act] = enable
        })
        updatedFeatures[feat.code] = featActions
      })

      currentRoleMatrix[moduleCode] = {
        view: enable,
        create: enable,
        edit: enable,
        approve: enable,
        delete: enable,
        export: enable,
        admin: enable,
        features: updatedFeatures,
      }

      return {
        ...prev,
        [selectedRoleId]: currentRoleMatrix,
      }
    })
  }

  // Save changes to database and local store
  const handleSave = async () => {
    if (!selectedRoleId || !selectedRoleObj) return

    setIsSaving(true)
    try {
      // 1. Persist matrix state in localStorage cache for instant zero-lag authorization checks
      const roleCode = selectedRoleObj.role_code.toLowerCase()
      const currentRoleConfig = matrixState[selectedRoleId] || {}
      localStorage.setItem(`home_rbac_overrides_${roleCode}`, JSON.stringify(currentRoleConfig))

      // 2. Persist to Supabase role_permissions table
      const permissionsToSync: string[] = []
      Object.entries(currentRoleConfig).forEach(([modCode, modConfig]) => {
        if (modConfig.view) {
          const viewPerm = dbPermissions.find(
            (p) => p.module.toLowerCase() === modCode.toLowerCase()
          )
          if (viewPerm && !permissionsToSync.includes(viewPerm.id)) {
            permissionsToSync.push(viewPerm.id)
          }
        }
      })

      if (permissionsToSync.length > 0) {
        await updateRolePermissions(
          selectedRoleId,
          permissionsToSync,
          currentUser?.id || ''
        )
      }

      setSavedMatrixState(JSON.parse(JSON.stringify(matrixState)))
      showSuccess('Had Kuasa Disimpan', `Matriks kebenaran bagi peranan "${selectedRoleObj.role_name}" telah dikemaskini.`)
    } catch (err: any) {
      showError('Ralat', err.message || 'Gagal menyimpan perubahan had kuasa')
    } finally {
      setIsSaving(false)
    }
  }

  // Detect unsaved changes
  const hasChanges = useMemo(() => {
    if (!selectedRoleId) return false
    const current = matrixState[selectedRoleId]
    const saved = savedMatrixState[selectedRoleId]
    return JSON.stringify(current) !== JSON.stringify(saved)
  }, [matrixState, savedMatrixState, selectedRoleId])

  // Filter modules by search & category
  const filteredModules = useMemo(() => {
    return SYSTEM_MODULE_REGISTRY.filter((mod) => {
      const matchesSearch =
        mod.name.toLowerCase().includes(rbacSearch.toLowerCase()) ||
        mod.officialName.toLowerCase().includes(rbacSearch.toLowerCase()) ||
        mod.code.toLowerCase().includes(rbacSearch.toLowerCase()) ||
        mod.features.some(
          (f) =>
            f.name.toLowerCase().includes(rbacSearch.toLowerCase()) ||
            f.code.toLowerCase().includes(rbacSearch.toLowerCase())
        )

      const matchesCategory =
        selectedCategory === 'all' || mod.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [rbacSearch, selectedCategory])

  const categories = [
    { id: 'all', label: 'Semua Modul' },
    { id: 'pharmacy', label: 'Farmasi & Stok' },
    { id: 'clinical', label: 'Klinikal & Wad' },
    { id: 'logistics', label: 'Logistik & Pengangkutan' },
    { id: 'facility', label: 'Fasiliti & Suhu' },
    { id: 'administrative', label: 'Pentadbiran' },
    { id: 'support', label: 'Sokongan' },
  ]

  const actionIcons: Record<ActionType, React.ReactNode> = {
    view: <Eye className="w-3.5 h-3.5" />,
    create: <PlusCircle className="w-3.5 h-3.5" />,
    edit: <Edit3 className="w-3.5 h-3.5" />,
    approve: <CheckCircle2 className="w-3.5 h-3.5" />,
    delete: <Trash2 className="w-3.5 h-3.5" />,
    export: <Download className="w-3.5 h-3.5" />,
    admin: <Settings className="w-3.5 h-3.5" />,
  }

  const actionColors: Record<ActionType, { text: string; bg: string; border: string }> = {
    view: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
    create: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    edit: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    approve: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    delete: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    export: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
    admin: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Role Selector */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-teal-400" /> Senarai Peranan
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {roles.length}
          </span>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId
            const roleCode = r.role_code.toLowerCase()
            const modMatrix = matrixState[r.id] || {}
            const enabledCount = Object.values(modMatrix).filter((m) => m.view).length

            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all flex flex-col gap-1.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-500/15 to-cyan-500/5 text-teal-300 border-teal-500/40 shadow-lg shadow-teal-500/5'
                    : 'bg-slate-950/40 text-slate-300 border-white/5 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold truncate">{r.role_name}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="uppercase">{roleCode}</span>
                  <span className="text-slate-400">{enabledCount} modul aktif</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Panel: Fine-Grained Permission Matrix */}
      <div className="lg:col-span-3 space-y-6">
        {selectedRoleObj && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-white/10 flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white">{selectedRoleObj.role_name}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 uppercase">
                        {selectedRoleObj.role_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedRoleObj.description || 'Konfigurasi had kuasa dan kebenaran tindakan bagi peranan ini.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Save Button */}
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              )}
            </div>

            {/* Capability Presets Selector */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pratetap Had Kuasa:
              </span>
              {Object.entries(ROLE_CAPABILITY_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-teal-500/15 border border-white/5 hover:border-teal-500/30 text-slate-300 hover:text-teal-300 transition-all"
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-white/5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Carian modul, sub-ciri, kod..."
              value={rbacSearch}
              onChange={(e) => setRbacSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex overflow-x-auto gap-1.5 w-full sm:w-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                    : 'bg-transparent text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid */}
        {isLoading ? (
          <div className="p-12 space-y-4">
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-white/5">
            Tiada modul ditemui yang sepadan dengan carian.
          </div>
        ) : (
          <div className="space-y-4 pb-24">
            {filteredModules.map((moduleDef) => {
              const modCode = moduleDef.code
              const isExpanded = !!expandedModules[modCode]
              const currentRoleMatrix = matrixState[selectedRoleId] || {}
              const modState = currentRoleMatrix[modCode] || {
                view: false,
                create: false,
                edit: false,
                approve: false,
                delete: false,
                export: false,
                admin: false,
                features: {},
              }

              const isModuleActive = !!modState.view

              return (
                <div
                  key={modCode}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 backdrop-blur-md ${
                    isModuleActive
                      ? 'bg-slate-900/60 border-white/10 shadow-lg'
                      : 'bg-slate-950/40 border-white/5 opacity-85'
                  }`}
                >
                  {/* Module Header Row */}
                  <div className="p-5 bg-white/5 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        onClick={() => handleToggleModuleAction(modCode, 'view')}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                          isModuleActive
                            ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                            : 'border-2 border-slate-600 hover:border-teal-400 bg-slate-900'
                        }`}
                      >
                        {isModuleActive && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-white">{moduleDef.name}</h4>
                          <span className="text-xs text-slate-400 font-medium">({moduleDef.officialName})</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5 uppercase">
                            {moduleDef.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{moduleDef.description}</p>
                      </div>
                    </div>

                    {/* Actions Matrix Switches for Module Level */}
                    <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                      {(['view', 'create', 'edit', 'approve', 'delete', 'export', 'admin'] as ActionType[]).map((action) => {
                        const isActionActive = !!modState[action]
                        const colors = actionColors[action]

                        return (
                          <button
                            key={action}
                            onClick={() => handleToggleModuleAction(modCode, action)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                              isActionActive
                                ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                                : 'bg-slate-950/60 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-400'
                            }`}
                            title={ACTION_DEFINITIONS[action].description}
                          >
                            {actionIcons[action]}
                            <span className="capitalize">{action}</span>
                          </button>
                        )
                      })}

                      {/* Expand Sub-Features Button */}
                      {moduleDef.features.length > 0 && (
                        <button
                          onClick={() => toggleModuleExpand(modCode)}
                          className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                          title="Pecahan Sub-Ciri & Had Kuasa Terperinci"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-Features Accordion */}
                  <AnimatePresence>
                    {isExpanded && moduleDef.features.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-950/60 divide-y divide-white/5"
                      >
                        <div className="px-6 py-2 bg-slate-900/60 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                          <span>Sub-Ciri & Keupayaan Tindakan Terperinci ({moduleDef.features.length} ciri)</span>
                          <span className="text-teal-400">Kawalan Granular Aktif</span>
                        </div>

                        {moduleDef.features.map((feature) => {
                          const featState = modState.features?.[feature.code] || {}

                          return (
                            <div
                              key={feature.code}
                              className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="pl-4 border-l-2 border-teal-500/40">
                                <div className="text-xs font-bold text-slate-200">{feature.name}</div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{feature.description}</p>
                                <span className="text-[10px] font-mono text-slate-600 mt-1 block">
                                  {feature.code}
                                </span>
                              </div>

                              {/* Feature-Level Supported Actions */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {feature.supportedActions.map((action) => {
                                  const isFeatActionActive = !!featState[action]
                                  const colors = actionColors[action]

                                  return (
                                    <button
                                      key={action}
                                      onClick={() => handleToggleFeatureAction(modCode, feature.code, action)}
                                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                                        isFeatActionActive
                                          ? `${colors.bg} ${colors.text} ${colors.border}`
                                          : 'bg-slate-900 text-slate-600 border-white/5 hover:text-slate-400'
                                      }`}
                                    >
                                      {actionIcons[action]}
                                      <span className="capitalize">{action}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
            className="fixed bottom-6 right-6 left-6 lg:left-80 z-40 bg-slate-900/95 backdrop-blur-2xl border border-teal-500/40 shadow-2xl p-4 rounded-2xl max-w-4xl mx-auto flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Perubahan Had Kuasa Dikesan</p>
                <p className="text-xs text-slate-400">
                  Perubahan matriks keselamatan bagi "{selectedRoleObj?.role_name}". Sila simpan untuk menguatkuasakan polisi.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMatrixState(JSON.parse(JSON.stringify(savedMatrixState)))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Set Semula
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminRbacTab
