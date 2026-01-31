import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Settings,
  Building2,
  Search,
  Save,
  RefreshCw,
  AlertCircle,
  Power,
  PowerOff,
  Briefcase
} from 'lucide-react'
import { Button, Input, Badge, Switch, LoadingOverlay, Modal, ConfirmationDialog } from '@/components/ui'
import { AdminPageLayout } from '@/components/admin'
import { getHospitalsWithAdmin } from '@/services/systemAdminService'
import { getHospitalModules, updateHospitalModules, syncAllModulesToDepartments } from '@/services/moduleService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { MODULE_DEFINITIONS } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import type { HospitalWithAdmin, HospitalModuleWithRelations, ModuleCode } from '@/types'

export const ModuleAccessControlPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { error: showError, success: showSuccess } = useToastStore()
  const isSystemAdmin = user?.role?.role_code === 'system_admin'

  const [hospitals, setHospitals] = useState<HospitalWithAdmin[]>([])
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithAdmin | null>(null)
  const [modules, setModules] = useState<HospitalModuleWithRelations[]>([])
  const [moduleStates, setModuleStates] = useState<Record<ModuleCode, boolean>>({} as Record<ModuleCode, boolean>)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [hospitalSearch, setHospitalSearch] = useState('')

  // Get hospital ID from URL params
  const hospitalIdFromUrl = searchParams.get('hospital')

  useEffect(() => {
    if (!isSystemAdmin) {
      showError('Access Denied', 'Only System Admin can access this page.')
      return
    }
    fetchHospitals()
  }, [])

  useEffect(() => {
    if (hospitalIdFromUrl && hospitals.length > 0) {
      const hospital = hospitals.find((h) => h.id === hospitalIdFromUrl)
      if (hospital) {
        setSelectedHospital(hospital)
        fetchModules(hospital.id)
      }
    }
  }, [hospitalIdFromUrl, hospitals])

  const fetchHospitals = async () => {
    setIsLoading(true)
    try {
      const result = await getHospitalsWithAdmin(1, 100) // Get all hospitals
      setHospitals(result.data)

      // Auto-select if hospital ID in URL
      if (hospitalIdFromUrl) {
        const hospital = result.data.find((h) => h.id === hospitalIdFromUrl)
        if (hospital) {
          setSelectedHospital(hospital)
          await fetchModules(hospital.id)
        }
      }
    } catch (error) {
      showError('Error', 'Failed to load hospitals')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchModules = async (hospitalId: string) => {
    setIsLoading(true)
    try {
      const result = await getHospitalModules(hospitalId)
      if (result.data) {
        setModules(result.data)
        const states: Record<ModuleCode, boolean> = {} as Record<ModuleCode, boolean>
        MODULE_DEFINITIONS.forEach((mod) => {
          const module = result.data?.find((m) => m.module_code === mod.code)
          states[mod.code as ModuleCode] = module?.is_enabled || false
        })
        setModuleStates(states)
        setHasChanges(false)
      }
    } catch (error) {
      showError('Error', 'Failed to load modules')
    } finally {
      setIsLoading(false)
    }
  }

  const handleHospitalSelect = (hospitalId: string) => {
    const hospital = hospitals.find((h) => h.id === hospitalId)
    if (hospital) {
      setSelectedHospital(hospital)
      setSearchParams({ hospital: hospitalId })
      fetchModules(hospitalId)
    }
  }

  const handleModuleToggle = (moduleCode: ModuleCode, enabled: boolean) => {
    setModuleStates((prev) => ({ ...prev, [moduleCode]: enabled }))
    setHasChanges(true)
  }

  const handleBulkToggle = (enabled: boolean) => {
    const newStates: Record<ModuleCode, boolean> = {} as Record<ModuleCode, boolean>
    MODULE_DEFINITIONS.forEach((mod) => {
      newStates[mod.code as ModuleCode] = enabled
    })
    setModuleStates(newStates)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!selectedHospital || !user) return
    setIsSaving(true)
    try {
      const modulesToUpdate = MODULE_DEFINITIONS.map((mod) => ({
        code: mod.code as ModuleCode,
        enabled: moduleStates[mod.code as ModuleCode],
      }))

      const result = await updateHospitalModules(selectedHospital.id, modulesToUpdate, user.id)

      if (result.data) {
        await syncAllModulesToDepartments(selectedHospital.id)
        showSuccess('Success', 'Module access updated successfully')
        setHasChanges(false)
        setShowSaveModal(false)
        await fetchModules(selectedHospital.id)
      } else {
        showError('Error', result.error || 'Failed to update modules')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (selectedHospital) fetchModules(selectedHospital.id)
  }

  const filteredHospitals = hospitals.filter((h) =>
    h.hospital_name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.hospital_code.toLowerCase().includes(hospitalSearch.toLowerCase())
  )

  const enabledCount = Object.values(moduleStates).filter(Boolean).length
  const totalCount = MODULE_DEFINITIONS.length

  if (!isSystemAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Access Denied: System Admin only.</p>
      </div>
    )
  }

  const actions = selectedHospital ? (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Reset
      </Button>
      <Button onClick={() => setShowSaveModal(true)} disabled={!hasChanges || isSaving} leftIcon={<Save className="w-4 h-4" />}>
        Save Changes
      </Button>
    </div>
  ) : null

  return (
    <AdminPageLayout
      title="Module Access Control"
      description="Manage hospital access to system modules"
      icon={Settings}
      breadcrumbs={[{ label: 'System' }, { label: 'Module Access' }]}
      actions={actions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Hospital List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-[calc(100vh-200px)] flex flex-col">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" /> Select Hospital
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredHospitals.map(h => (
                <button
                  key={h.id}
                  onClick={() => handleHospitalSelect(h.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                    selectedHospital?.id === h.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="truncate">{h.hospital_name}</div>
                  <div className="text-xs opacity-70 font-mono mt-0.5">{h.hospital_code}</div>
                </button>
              ))}
              {filteredHospitals.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">No hospitals found</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedHospital ? (
            <div className="space-y-6">
              {/* Hospital Header */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedHospital.hospital_name}</h2>
                  <p className="text-sm text-slate-500 font-mono">{selectedHospital.hospital_code}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <span>Enabled:</span>
                    <span className="font-bold text-slate-900">{enabledCount}/{totalCount}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <Button variant="ghost" size="sm" onClick={() => handleBulkToggle(true)} className="text-emerald-600 hover:bg-emerald-50">
                    Enable All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleBulkToggle(false)} className="text-rose-600 hover:bg-rose-50">
                    Disable All
                  </Button>
                </div>
              </div>

              {/* Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {MODULE_DEFINITIONS.map((def) => {
                  const isEnabled = moduleStates[def.code as ModuleCode] || false
                  const module = modules.find(m => m.module_code === def.code)

                  return (
                    <motion.div
                      key={def.code}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "rounded-xl border p-4 transition-all",
                        isEnabled
                          ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50"
                          : "bg-slate-50 border-slate-200 opacity-70 grayscale"
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <Switch
                          checked={isEnabled}
                          onChange={(checked) => handleModuleToggle(def.code as ModuleCode, checked)}
                          size="sm"
                        />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{def.name}</h3>
                      <p className="text-xs text-slate-500 min-h-[2.5em]">{def.description}</p>

                      {module && (
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[10px] text-slate-400 flex justify-between">
                          <span>{module.is_enabled ? 'Active' : 'Inactive'}</span>
                          <span>{module.enabled_at ? formatDate(module.enabled_at) : '-'}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 decoration-slice">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No Hospital Selected</h3>
              <p className="max-w-sm mt-2">Please select a hospital from the sidebar to configure its module access permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSave}
        title="Save Module Changes"
        message={`Are you sure you want to save the module access changes for ${selectedHospital?.hospital_name}?`}
        variant={totalCount - enabledCount > 0 ? 'warning' : 'info'}
        confirmText="Save Changes"
        isLoading={isSaving}
      >
        <div className="bg-slate-50 rounded-lg p-4 mt-4 text-sm">
          <p className="font-medium text-slate-900 mb-2">Summary:</p>
          <ul className="text-slate-600 space-y-1 list-disc pl-4">
            <li>{enabledCount} active modules</li>
            <li>{totalCount - enabledCount} disabled modules</li>
          </ul>
        </div>
      </ConfirmationDialog>

      {isLoading && <LoadingOverlay message="Loading..." />}
    </AdminPageLayout>
  )
}

export default ModuleAccessControlPage
