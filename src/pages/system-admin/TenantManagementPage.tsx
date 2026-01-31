import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Badge } from '@/components/ui'
import { systemAnalyticsService } from '@/services/systemAnalyticsService'
import type { SystemTenantStats } from '@/types/systemAdmin.types'
import CreateHospitalModal from './modals/CreateHospitalModal'
import ProvisionAdminModal from './modals/ProvisionAdminModal'
import { Plus, Search, Filter, Building, UserPlus, MoreHorizontal } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const TenantManagementPage = () => {
    const navigate = useNavigate()
    const [tenants, setTenants] = useState<SystemTenantStats[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [provisionModalState, setProvisionModalState] = useState<{ isOpen: boolean, hospitalId: string, hospitalName: string } | null>(null)

    useEffect(() => {
        fetchTenants()
    }, [])

    const fetchTenants = async () => {
        try {
            setLoading(true)
            const { data } = await systemAnalyticsService.getTenantStats(1, 100, searchTerm)
            setTenants(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
                    <p className="text-slate-500">Manage hospitals, subscriptions, and administrative access</p>
                </div>
                <Button className="bg-royal-blue hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Onboard New Hospital
                </Button>
            </div>

            <Card className="p-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search hospitals..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Hospital Name</th>
                                <th className="px-4 py-3">Subscription</th>
                                <th className="px-4 py-3">Users</th>
                                <th className="px-4 py-3">Storage</th>
                                <th className="px-4 py-3">Last Active</th>
                                <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">Loading tenants...</td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No tenants found</td></tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr
                                        key={tenant.hospital_id}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`${ROUTES.SYSTEM_TENANTS}/${tenant.hospital_id}`)}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Building className="w-4 h-4" />
                                                </div>
                                                {tenant.hospital_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={tenant.subscription_status === 'active' ? 'success' : 'warning'}>
                                                {tenant.subscription_status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {tenant.user_count} users
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {tenant.storage_usage_mb} MB
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {new Date(tenant.last_active_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Provision Admin"
                                                    onClick={() => setProvisionModalState({
                                                        isOpen: true,
                                                        hospitalId: tenant.hospital_id,
                                                        hospitalName: tenant.hospital_name
                                                    })}
                                                >
                                                    <UserPlus className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modals */}
                <CreateHospitalModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchTenants}
                />

                {provisionModalState && (
                    <ProvisionAdminModal
                        isOpen={provisionModalState.isOpen}
                        onClose={() => setProvisionModalState(null)}
                        onSuccess={fetchTenants}
                        hospitalId={provisionModalState.hospitalId}
                        hospitalName={provisionModalState.hospitalName}
                    />
                )}
            </Card>
        </div>
    )
}

export default TenantManagementPage
