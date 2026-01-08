import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Shield, CheckSquare, Square } from 'lucide-react'
import { Button, Badge, LoadingOverlay } from '@/components/ui'
import { getRoleById, getAllPermissions, getRolePermissions, updateRolePermissions } from '@/services/roleService'
import { useToast } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Role, Permission } from '@/types'

export const RolePermissionPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()
  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (roleId) {
      fetchData()
    }
  }, [roleId])

  const fetchData = async () => {
    if (!roleId) return

    setIsLoading(true)
    try {
      const [roleData, allPermissions, currentRolePermissions] = await Promise.all([
        getRoleById(roleId),
        getAllPermissions(),
        getRolePermissions(roleId),
      ])

      setRole(roleData)
      setPermissions(allPermissions)
      setRolePermissions(currentRolePermissions.map((p) => p.id))
      setSelectedPermissions(currentRolePermissions.map((p) => p.id))
    } catch (error) {
      toast.error('Error', 'Failed to load role and permissions')
      navigate(ROUTES.ADMIN_ROLES)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  const handleSelectAllInModule = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module).map((p) => p.id)
    const allSelected = modulePermissions.every((id) => selectedPermissions.includes(id))

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modulePermissions.includes(id)))
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePermissions])])
    }
  }

  const handleSelectAllInFeature = (module: string, feature: string) => {
    const featurePermissions = permissions
      .filter((p) => p.module === module && (p.feature || 'general') === feature)
      .map((p) => p.id)
    const allSelected = featurePermissions.every((id) => selectedPermissions.includes(id))

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !featurePermissions.includes(id)))
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...featurePermissions])])
    }
  }

  const handleSave = async () => {
    if (!roleId) return

    setIsSaving(true)
    try {
      await updateRolePermissions(roleId, selectedPermissions, user?.id)
      setRolePermissions(selectedPermissions)
      toast.success('Success', 'Role permissions updated successfully')
    } catch (error) {
      toast.error('Error', 'Failed to update role permissions')
      console.error('Error updating permissions:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading role and permissions..." />
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Role not found</p>
      </div>
    )
  }

  // Group permissions by module and feature
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = {}
    }
    const feature = permission.feature || 'general'
    if (!acc[permission.module][feature]) {
      acc[permission.module][feature] = []
    }
    acc[permission.module][feature].push(permission)
    return acc
  }, {} as Record<string, Record<string, Permission[]>>)

  const hasChanges = JSON.stringify(selectedPermissions.sort()) !== JSON.stringify(rolePermissions.sort())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN_ROLES)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Back to Roles
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Permission Management</h1>
            <p className="text-sm text-slate-600 mt-1">{role.role_name}</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!hasChanges}
          leftIcon={<Save className="w-5 h-5" />}
        >
          Save Changes
        </Button>
      </div>

      {/* Role Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-teal-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{role.role_name}</h2>
              <Badge variant={role.is_system_role ? 'info' : 'gray'}>
                {role.is_system_role ? 'System Role' : 'Hospital Role'}
              </Badge>
            </div>
            <p className="text-slate-600 font-mono font-semibold">{role.role_code}</p>
            {role.description && <p className="text-slate-600 mt-2">{role.description}</p>}
            <p className="text-sm text-slate-500 mt-2">Created: {formatDate(role.created_at)}</p>
          </div>
        </div>
      </motion.div>

      {/* Permission Matrix */}
      <div className="space-y-6">
        {Object.entries(permissionsByModule).map(([module, features]) => {
          const modulePermissions = Object.values(features).flat()
          const allSelected = modulePermissions.every((p) => selectedPermissions.includes(p.id))
          const someSelected = modulePermissions.some((p) => selectedPermissions.includes(p.id))

          return (
            <motion.div
              key={module}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Module Header */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">{module.replace('_', ' ')}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {modulePermissions.length} permissions across {Object.keys(features).length} features
                  </p>
                </div>
                <button
                  onClick={() => handleSelectAllInModule(module)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-semibold bg-white rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors"
                >
                  {allSelected ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      Select All
                    </>
                  )}
                </button>
              </div>

              {/* Features within Module */}
              <div className="divide-y divide-slate-100">
                {Object.entries(features).map(([feature, featurePermissions]) => {
                  const allFeatureSelected = featurePermissions.every((p) => selectedPermissions.includes(p.id))
                  const someFeatureSelected = featurePermissions.some((p) => selectedPermissions.includes(p.id))

                  return (
                    <div key={feature} className="p-6">
                      {/* Feature Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-base font-semibold text-slate-800 capitalize">
                            {feature.replace('_', ' ')}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {featurePermissions.length} permission{featurePermissions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSelectAllInFeature(module, feature)}
                          className="flex items-center gap-2 text-xs text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 rounded-md hover:bg-teal-50 transition-colors"
                        >
                          {allFeatureSelected ? (
                            <>
                              <CheckSquare className="w-3.5 h-3.5" />
                              Deselect
                            </>
                          ) : (
                            <>
                              <Square className="w-3.5 h-3.5" />
                              Select All
                            </>
                          )}
                        </button>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {featurePermissions.map((permission) => {
                          const isSelected = selectedPermissions.includes(permission.id)
                          return (
                            <button
                              key={permission.id}
                              onClick={() => handleTogglePermission(permission.id)}
                              className={cn(
                                'p-4 rounded-lg border-2 text-left transition-all',
                                isSelected
                                  ? 'border-teal-500 bg-teal-50 hover:bg-teal-100'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm">{permission.permission_name}</p>
                                  {permission.description && (
                                    <p className="text-xs text-slate-500 mt-1">{permission.description}</p>
                                  )}
                                  <p className="text-xs text-slate-400 mt-1 font-mono truncate">
                                    {permission.permission_code}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-teal-50 border border-teal-200 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-teal-900">
              {selectedPermissions.length} of {permissions.length} permissions selected
            </p>
            {hasChanges && (
              <p className="text-sm text-teal-700 mt-1">You have unsaved changes</p>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!hasChanges}
            leftIcon={<Save className="w-5 h-5" />}
          >
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default RolePermissionPage

