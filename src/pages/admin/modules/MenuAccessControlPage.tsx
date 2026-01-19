import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'
import { Card, Button, LoadingOverlay } from '@/components/ui'
import { Check, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface Role {
    id: string
    role_name: string
    role_code: string
}

interface Menu {
    id: string
    label: string
    path: string
    is_core: boolean
    allowed_department_id: string | null
}

// No longer used


export const MenuAccessControlPage: React.FC = () => {
    const { user } = useAuthStore()
    const [roles, setRoles] = useState<Role[]>([])
    const [menus, setMenus] = useState<Menu[]>([])
    const [accessMatrix, setAccessMatrix] = useState<Map<string, Set<string>>>(new Map())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user?.hospital_id) return

        setLoading(true)
        try {
            // Load roles for this hospital
            const { data: rolesData, error: rolesError } = await supabase
                .from('roles')
                .select('id, role_name, role_code')
                .eq('hospital_id', user.hospital_id)
                .order('role_name')

            if (rolesError) throw rolesError

            // Load all menus
            const { data: menusData, error: menusError } = await supabase
                .from('menus')
                .select('id, label, path, is_core, allowed_department_id')
                .order('order_index')

            if (menusError) throw menusError

            // Load existing access permissions
            const { data: accessData, error: accessError } = await supabase
                .from('role_menu_access')
                .select('role_id, menu_id, can_view')
                .in('role_id', rolesData?.map(r => r.id) || [])

            if (accessError) throw accessError

            // Build access matrix
            const matrix = new Map<string, Set<string>>()
            accessData?.forEach(access => {
                if (access.can_view) {
                    if (!matrix.has(access.role_id)) {
                        matrix.set(access.role_id, new Set())
                    }
                    matrix.get(access.role_id)!.add(access.menu_id)
                }
            })

            setRoles(rolesData || [])
            setMenus(menusData || [])
            setAccessMatrix(matrix)

            if (rolesData && rolesData.length > 0) {
                setSelectedRole(rolesData[0].id)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleAccess = (roleId: string, menuId: string) => {
        setAccessMatrix(prev => {
            const newMatrix = new Map(prev)
            if (!newMatrix.has(roleId)) {
                newMatrix.set(roleId, new Set())
            }

            const roleMenus = newMatrix.get(roleId)!
            if (roleMenus.has(menuId)) {
                roleMenus.delete(menuId)
            } else {
                roleMenus.add(menuId)
            }

            return newMatrix
        })
    }

    const saveChanges = async () => {
        if (!selectedRole) return

        setSaving(true)
        try {
            // Get current access for this role
            const { data: currentAccess } = await supabase
                .from('role_menu_access')
                .select('id, menu_id')
                .eq('role_id', selectedRole)

            const currentMenuIds = new Set(currentAccess?.map(a => a.menu_id) || [])
            const newMenuIds = accessMatrix.get(selectedRole) || new Set()

            // Determine what to add and what to remove
            const toAdd = Array.from(newMenuIds).filter(id => !currentMenuIds.has(id))
            const toRemove = Array.from(currentMenuIds).filter(id => !newMenuIds.has(id))

            // Add new permissions
            if (toAdd.length > 0) {
                const { error: insertError } = await supabase
                    .from('role_menu_access')
                    .insert(
                        toAdd.map(menuId => ({
                            role_id: selectedRole,
                            menu_id: menuId,
                            can_view: true,
                            created_by: user?.id
                        }))
                    )

                if (insertError) throw insertError
            }

            // Remove permissions
            if (toRemove.length > 0) {
                const { error: deleteError } = await supabase
                    .from('role_menu_access')
                    .delete()
                    .eq('role_id', selectedRole)
                    .in('menu_id', toRemove)

                if (deleteError) throw deleteError
            }

            alert('Access permissions updated successfully!')
        } catch (error) {
            console.error('Error saving changes:', error)
            alert('Failed to save changes. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <LoadingOverlay fullScreen message="Loading access control..." />
    }

    const selectedRoleMenus = selectedRole ? accessMatrix.get(selectedRole) || new Set() : new Set()

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Menu Access Control</h1>
                <p className="text-gray-600 mt-1">
                    Manage which menus are visible to each role in your hospital
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Role Selection */}
                <Card className="lg:col-span-1">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-4">Roles</h2>
                        <div className="space-y-2">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedRole === role.id
                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                        : 'hover:bg-gray-100'
                                        }`}
                                >
                                    {role.role_name}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Menu Access Matrix */}
                <Card className="lg:col-span-3">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                Menu Permissions
                                {selectedRole && (
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        for {roles.find(r => r.id === selectedRole)?.role_name}
                                    </span>
                                )}
                            </h2>
                            <Button
                                onClick={saveChanges}
                                disabled={!selectedRole || saving}
                                variant="primary"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>

                        {selectedRole ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {menus.map(menu => {
                                        const hasAccess = selectedRoleMenus.has(menu.id)
                                        return (
                                            <button
                                                key={menu.id}
                                                onClick={() => toggleAccess(selectedRole, menu.id)}
                                                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${hasAccess
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex-1 text-left">
                                                    <div className="font-medium text-gray-900">{menu.label}</div>
                                                    <div className="text-sm text-gray-500">{menu.path}</div>
                                                    {menu.is_core && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                                            Core Menu
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`ml-4 ${hasAccess ? 'text-primary-600' : 'text-gray-400'}`}>
                                                    {hasAccess ? (
                                                        <Check className="w-6 h-6" />
                                                    ) : (
                                                        <X className="w-6 h-6" />
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                Select a role to manage menu permissions
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default MenuAccessControlPage
