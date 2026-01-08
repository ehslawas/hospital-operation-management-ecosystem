import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Settings,
  Building2,
  Search,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Power,
  PowerOff,
} from 'lucide-react'
import { Button, Input, Select, Badge, Switch, LoadingOverlay, Modal, ConfirmationDialog } from '@/components/ui'
import { getHospitalsWithAdmin } from '@/services/systemAdminService'
import { getHospitalModules, updateHospitalModules, enableHospitalModule, disableHospitalModule, syncAllModulesToDepartments } from '@/services/moduleService'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { MODULE_DEFINITIONS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
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
      console.error('Error fetching hospitals:', error)
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
        
        // Initialize module states
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
      console.error('Error fetching modules:', error)
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
    setModuleStates((prev) => ({
      ...prev,
      [moduleCode]: enabled,
    }))
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

      const result = await updateHospitalModules(
        selectedHospital.id,
        modulesToUpdate,
        user.id
      )

      if (result.data) {
        // Sync enabled modules to departments
        const syncResult = await syncAllModulesToDepartments(selectedHospital.id)
        if (syncResult.error) {
          console.warn('Failed to sync modules to departments:', syncResult.error)
          // Don't fail the whole operation, just warn
        }

        showSuccess('Success', 'Module access updated successfully')
        setHasChanges(false)
        setShowSaveModal(false)
        await fetchModules(selectedHospital.id)
      } else {
        showError('Error', result.error || 'Failed to update modules')
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred')
      console.error('Error saving modules:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (selectedHospital) {
      fetchModules(selectedHospital.id)
    }
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
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900">Access Denied</p>
          <p className="text-slate-600">Only System Admin can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Module Access Control</h1>
            <p className="text-sm text-slate-600 mt-1">
              Enable or disable modules for each hospital
            </p>
          </div>
        </div>
        {selectedHospital && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowSaveModal(true)}
              disabled={!hasChanges || isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Hospital Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Select Hospital
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search hospitals..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Hospital List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital) => (
                  <button
                    key={hospital.id}
                    onClick={() => handleHospitalSelect(hospital.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selectedHospital?.id === hospital.id
                        ? 'bg-primary-50 border-primary-300 text-primary-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <div className="font-semibold text-sm">{hospital.hospital_name}</div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      {hospital.hospital_code}
                    </div>
                    {hospital.enabled_modules_count !== undefined && (
                      <div className="text-xs text-slate-500 mt-1">
                        {hospital.enabled_modules_count} modules enabled
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No hospitals found</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Module Configuration */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          {selectedHospital ? (
            <div className="space-y-6">
              {/* Hospital Info Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedHospital.hospital_name}</h2>
                    <p className="text-sm text-slate-600 font-mono">{selectedHospital.hospital_code}</p>
                  </div>
                  <Badge variant="success" size="lg">
                    {enabledCount} / {totalCount} Enabled
                  </Badge>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Bulk Actions:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(true)}
                    leftIcon={<Power className="w-4 h-4" />}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(false)}
                    leftIcon={<PowerOff className="w-4 h-4" />}
                  >
                    Disable All
                  </Button>
                </div>

                {/* Module Grid */}
                {isLoading ? (
                  <LoadingOverlay message="Loading modules..." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MODULE_DEFINITIONS.map((moduleDef) => {
                      const module = modules.find((m) => m.module_code === moduleDef.code)
                      const isEnabled = moduleStates[moduleDef.code as ModuleCode] || false
                      const Icon = Settings // Default icon, can be enhanced later

                      return (
                        <motion.div
                          key={moduleDef.code}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all',
                            isEnabled
                              ? 'border-primary-200 bg-primary-50'
                              : 'border-slate-200 bg-slate-50'
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-5 h-5 text-primary-600" />
                                <h3 className="font-semibold text-slate-900 capitalize">
                                  {moduleDef.name}
                                </h3>
                              </div>
                              <p className="text-xs text-slate-600">{moduleDef.description}</p>
                            </div>
                            <Badge
                              variant={isEnabled ? 'success' : 'gray'}
                              size="sm"
                            >
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>

                          <Switch
                            checked={isEnabled}
                            onChange={(checked) => handleModuleToggle(moduleDef.code as ModuleCode, checked)}
                            size="md"
                          />

                          {module && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>
                                  {module.is_enabled
                                    ? `Enabled ${module.enabled_at ? formatDate(module.enabled_at) : ''}`
                                    : `Disabled ${module.disabled_at ? formatDate(module.disabled_at) : ''}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Change Indicator */}
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-800">You have unsaved changes</p>
                    <p className="text-xs text-warning-600">Click "Save Changes" to apply your modifications</p>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Hospital</h3>
              <p className="text-slate-600">
                Choose a hospital from the list to configure module access
              </p>
            </div>
          )}
        </motion.div>
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
        cancelText="Cancel"
        isLoading={isSaving}
      >
        <div className="bg-slate-50 rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-slate-900 mb-2">Summary:</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• {enabledCount} modules will be enabled</li>
            <li>• {totalCount - enabledCount} modules will be disabled</li>
          </ul>
          {totalCount - enabledCount > 0 && (
            <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded text-xs text-warning-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Disabling modules will restrict access for hospital users. This action can impact hospital operations.
            </div>
          )}
        </div>
      </ConfirmationDialog>
    </div>
  )
}

export default ModuleAccessControlPage
