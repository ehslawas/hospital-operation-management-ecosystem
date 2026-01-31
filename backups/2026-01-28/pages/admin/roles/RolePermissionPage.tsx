import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Shield } from 'lucide-react'
import { Button, Badge, LoadingOverlay } from '@/components/ui'
import { getRoleById, updateRole } from '@/services/roleService'
import { useToast } from '@/stores/toastStore'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/types'

export const RoleDetailsPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [role, setRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
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
      const roleData = await getRoleById(roleId)
      if (roleData) {
        setRole(roleData)
        setRoleName(roleData.role_name)
        setDescription(roleData.description || '')
      }
    } catch (error) {
      toast.error('Error', 'Failed to load role details')
      navigate(ROUTES.ADMIN_ROLES)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!roleId || !role) return

    setIsSaving(true)
    try {
      await updateRole(roleId, {
        role_name: roleName,
        description: description,
      })
      toast.success('Success', 'Role details updated successfully')
      fetchData()
    } catch (error) {
      toast.error('Error', 'Failed to update role details')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading role details..." />
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Role not found</p>
      </div>
    )
  }

  const hasChanges = roleName !== role.role_name || description !== (role.description || '')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-slate-900">Role Settings</h1>
            <p className="text-sm text-slate-600 mt-1">{role.role_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`${ROUTES.ADMIN_ROLES}/${roleId}/permissions`)}
            leftIcon={<Shield className="w-5 h-5" />}
          >
            Manage Permissions
          </Button>
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
      </div>

      {/* Role Details Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            General Information
          </h3>
          <Badge variant={role.is_system_role ? 'info' : 'gray'}>
            {role.is_system_role ? 'System Role' : 'Hospital Role'}
          </Badge>
        </div>

        <div className="p-6 space-y-6 text-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                placeholder="e.g. Pharmacy Manager"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Role Code</label>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm select-none">
                {role.role_code}
              </div>
              <p className="text-[10px] text-slate-400 italic">Unique identifier used for authorization checks</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none min-h-[120px]"
              placeholder="Describe the responsibilities and scope of this role..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Created: {formatDate(role.created_at)}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`${ROUTES.ADMIN_ROLES}/${roleId}/permissions`)}
                className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1.5 transition-colors"
              >
                Configure advanced hierarchical permissions
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-slate-900">Active</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Type</div>
          <div className="font-bold text-slate-900">{role.is_system_role ? 'Core System' : 'Custom defined'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Configurable</div>
          <div className="font-bold text-slate-900">100% UI Configurable</div>
        </div>
      </div>
    </div>
  )
}

export default RoleDetailsPage

