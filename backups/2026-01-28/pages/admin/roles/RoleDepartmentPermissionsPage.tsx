import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Shield,
    Save,
    ArrowLeft,
    CheckSquare,
    Square,
    Building
} from 'lucide-react'
import {
    AdminPageLayout,
    AdminStatsGrid,
    StatItem
} from '@/components/admin'
import { Button, LoadingOverlay, Card } from '@/components/ui'
import { useToastStore } from '@/stores/toastStore'
import {
    getRoleDepartmentPermissions,
    getAllResourcePermissions,
    updateRoleDepartmentPermissions
} from '@/services/resourcePermissionService'
import { getRoleById } from '@/services/roleService'
import { getAllDepartments } from '@/services/departmentService'
import {
    Role,
    ResourcePermission,
    RoleDepartmentPermissionWithRelations,
    DepartmentWithRelations
} from '@/types'

export const RoleDepartmentPermissionsPage: React.FC = () => {
    const { id: roleId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { error: showError, success: showSuccess } = useToastStore()

    // State
    const [role, setRole] = useState<Role | null>(null)
    const [allResources, setAllResources] = useState<ResourcePermission[]>([])
    const [departments, setDepartments] = useState<DepartmentWithRelations[]>([])
    const [activeDepartmentId, setActiveDepartmentId] = useState<string>('global')
    const [permissions, setPermissions] = useState<Record<string, RoleDepartmentPermissionWithRelations>>({})

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            if (!roleId) return
            setIsLoading(true)
            try {
                // 1. Fetch Role Details
                const roleData = await getRoleById(roleId)
                setRole(roleData)

                // 2. Fetch All Resources
                const resourcesData = await getAllResourcePermissions()
                setAllResources(resourcesData)

                // 3. Fetch Departments
                const deptsData = await getAllDepartments()
                setDepartments(deptsData)

                // 4. Fetch Existing Permissions for this Role
                // (For now fetching global; in real app we'd fetch for lazy loaded dept)
                const currentZone = activeDepartmentId === 'global' ? null : activeDepartmentId
                const permsData = await getRoleDepartmentPermissions(roleId, currentZone)

                // Map to quick lookup: resource_id -> Permission Object
                const permMap: Record<string, RoleDepartmentPermissionWithRelations> = {}
                permsData.forEach(p => {
                    permMap[p.resource_id] = p
                })
                setPermissions(permMap)

            } catch (err) {
                console.error('Error loading permission data:', err)
                showError('Error', 'Failed to load permission data')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [roleId, activeDepartmentId, showError])

    // Handlers
    const handleToggle = (resourceId: string, field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_approve') => {
        setPermissions(prev => {
            const existing = prev[resourceId] || {
                role_id: roleId!,
                resource_id: resourceId,
                department_id: activeDepartmentId === 'global' ? undefined : activeDepartmentId,
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false,
                can_approve: false,
                granted_at: new Date().toISOString()
            } as RoleDepartmentPermissionWithRelations

            return {
                ...prev,
                [resourceId]: {
                    ...existing,
                    [field]: !existing[field]
                }
            }
        })
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Convert map back to array
            const updates = Object.values(permissions).map(p => ({
                role_id: p.role_id,
                resource_id: p.resource_id,
                department_id: activeDepartmentId === 'global' ? undefined : activeDepartmentId,
                can_view: p.can_view,
                can_create: p.can_create,
                can_edit: p.can_edit,
                can_delete: p.can_delete,
                can_approve: p.can_approve
            }))

            await updateRoleDepartmentPermissions(updates as any)
            showSuccess('Success', 'Permissions updated successfully')
        } catch (err) {
            console.error('Error saving permissions:', err)
            showError('Error', 'Failed to save permissions')
        } finally {
            setIsSaving(false)
        }
    }

    // Group resources by module
    const resourcesByModule = allResources.reduce((acc, res) => {
        if (!acc[res.module]) acc[res.module] = []
        acc[res.module].push(res)
        return acc
    }, {} as Record<string, ResourcePermission[]>)

    if (isLoading && !role) return <LoadingOverlay message="Loading permissions..." />

    return (
        <AdminPageLayout
            title={`Manage Permissions: ${role?.role_name}`}
            description="Configure resource access and departmental permissions"
            icon={Shield}
            breadcrumbs={[
                { label: 'Roles', href: '/admin/roles' },
                { label: 'Permissions' }
            ]}
            actions={
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            }
        >
            <div className="space-y-6">

                {/* Department Selector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Permission Scope (Department)</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveDepartmentId('global')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeDepartmentId === 'global'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Global (Default)
                        </button>
                        {departments.map(dept => (
                            <button
                                key={dept.id}
                                onClick={() => setActiveDepartmentId(dept.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeDepartmentId === dept.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Building className="w-3 h-3" />
                                {dept.department_name}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        * "Global" permissions apply to all departments unless overridden by a specific department rule.
                    </p>
                </div>

                {/* Permission Matrix */}
                <div className="grid gap-6">
                    {Object.entries(resourcesByModule).map(([module, resources]) => (
                        <Card key={module} className="overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700 capitalize">
                                    {module.replace('_', ' ')} Module
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {resources.map(res => {
                                    const perm = permissions[res.id] || {
                                        can_view: false, can_create: false, can_edit: false, can_delete: false, can_approve: false
                                    }

                                    return (
                                        <div key={res.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1 pr-4">
                                                <div className="font-medium text-slate-900">{res.resource_name}</div>
                                                <div className="text-xs text-slate-500 font-mono mb-1">{res.resource_code}</div>
                                                {res.permission_tag && res.permission_tag.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {res.permission_tag.map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-100 uppercase tracking-wide">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                {[
                                                    { key: 'can_view', label: 'View', color: 'blue' },
                                                    { key: 'can_create', label: 'Create', color: 'emerald' },
                                                    { key: 'can_edit', label: 'Edit', color: 'amber' },
                                                    { key: 'can_delete', label: 'Delete', color: 'rose' },
                                                    { key: 'can_approve', label: 'Approve', color: 'purple' },
                                                ].map(action => (
                                                    <button
                                                        key={action.key}
                                                        onClick={() => handleToggle(res.id, action.key as any)}
                                                        className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg border transition-all ${perm[action.key as keyof typeof perm]
                                                            ? `bg-${action.color}-50 border-${action.color}-200 text-${action.color}-700`
                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                            }`}
                                                        title={action.label}
                                                    >
                                                        {perm[action.key as keyof typeof perm] ? (
                                                            <CheckSquare className="w-5 h-5 mb-0.5" />
                                                        ) : (
                                                            <Square className="w-5 h-5 mb-0.5" />
                                                        )}
                                                        <span className="text-[10px] font-medium">{action.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    ))}
                </div>

            </div>
        </AdminPageLayout>
    )
}

export default RoleDepartmentPermissionsPage
