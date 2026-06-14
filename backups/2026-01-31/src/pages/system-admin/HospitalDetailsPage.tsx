import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Building, Users, ArrowLeft, Mail, Phone, Calendar,
    Shield, Briefcase, Database, Activity, MapPin
} from 'lucide-react'
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { getHospitalDetails } from '@/services/hospitalService'
import { ROUTES } from '@/lib/constants'

const HospitalDetailsPage = () => {
    const { hospitalId } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (hospitalId) {
            fetchDetails()
        }
    }, [hospitalId])

    const fetchDetails = async () => {
        try {
            setLoading(true)
            const details = await getHospitalDetails(hospitalId!)
            setData(details)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-slate-500">Loading details...</div>
    if (!data) return <div className="p-10 text-center text-slate-500">Hospital not found</div>

    const { hospital, users, departments } = data
    // Filter only Hospital System Administrators (the main admin role)
    // Exclude global System Admins and general Hospital Administrator staff
    const admins = users.filter((u: any) =>
        u.role?.role_code === 'hospital_admin'
    )

    return (
        <div className="p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate(ROUTES.SYSTEM_TENANTS)} className="pl-0 gap-2 text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4" /> Back to Tenants
            </Button>

            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-blue-600">
                        <Building className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{hospital.hospital_name}</h1>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {hospital.address || 'No address set'}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Onboarded {new Date(hospital.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={hospital.status === 'active' ? 'success' : 'secondary'} className="text-sm px-3 py-1">
                        {hospital.status?.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Total Users</p>
                        <p className="text-xl font-bold text-slate-900">{users.length}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Administrators</p>
                        <p className="text-xl font-bold text-slate-900">{admins.length}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Briefcase className="w-5 h-5" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Departments</p>
                        <p className="text-xl font-bold text-slate-900">{departments.length}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Activity className="w-5 h-5" /></div>
                    <div>
                        <p className="text-sm text-slate-500">System Status</p>
                        <p className="text-xl font-bold text-slate-900">Active</p>
                    </div>
                </Card>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 gap-0">
                    <TabsTrigger
                        value="overview"
                        className={`rounded-none border-b-2 border-transparent px-6 py-3 bg-transparent text-slate-500 hover:text-slate-700 hover:bg-transparent ${activeTab === 'overview' ? '!border-blue-600 !text-blue-600' : ''}`}
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="users"
                        className={`rounded-none border-b-2 border-transparent px-6 py-3 bg-transparent text-slate-500 hover:text-slate-700 hover:bg-transparent ${activeTab === 'users' ? '!border-blue-600 !text-blue-600' : ''}`}
                    >
                        Users ({users.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="departments"
                        className={`rounded-none border-b-2 border-transparent px-6 py-3 bg-transparent text-slate-500 hover:text-slate-700 hover:bg-transparent ${activeTab === 'departments' ? '!border-blue-600 !text-blue-600' : ''}`}
                    >
                        Departments ({departments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase">Hospital Code</label>
                                <p className="text-slate-900 font-medium">{hospital.hospital_code}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase">License Key</label>
                                <p className="text-slate-900 font-medium font-mono">{hospital.license_key || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase">Phone</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <p className="text-slate-900">{hospital.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase">Email</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <p className="text-slate-900">{hospital.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Hospital Administrators</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 pl-0">Name</th>
                                        <th className="px-4 py-2">Position</th>
                                        <th className="px-4 py-2">Department</th>
                                        <th className="px-4 py-2">Phone</th>
                                        <th className="px-4 py-2">Email</th>
                                        <th className="px-4 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {admins.length === 0 ? (
                                        <tr><td colSpan={6} className="py-4 text-slate-500 italic">No administrators assigned</td></tr>
                                    ) : (
                                        admins.map((admin: any) => {
                                            const deptName = departments.find((d: any) => d.id === admin.department_id)?.department_name || 'Unassigned'
                                            return (
                                                <tr key={admin.id}>
                                                    <td className="py-3 font-medium text-slate-900 pl-0">
                                                        <div>{admin.full_name}</div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{admin.employee_id || 'No ID'}</div>
                                                    </td>
                                                    <td className="py-3 text-slate-600">{admin.jawatan || '-'}</td>
                                                    <td className="py-3 text-slate-600">
                                                        <Badge variant="outline" className="bg-slate-50">{deptName}</Badge>
                                                    </td>
                                                    <td className="py-3 text-slate-600">{admin.phone_number || '-'}</td>
                                                    <td className="py-3 text-slate-600">{admin.email}</td>
                                                    <td className="py-3">
                                                        <Badge variant={admin.status === 'active' ? 'success' : 'secondary'}>{admin.status}</Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">User Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.length === 0 ? (
                                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No users found</td></tr>
                                    ) : (
                                        users.map((user: any) => (
                                            <tr key={user.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{user.full_name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">{user.role?.role_name || 'User'}</Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>{user.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="departments" className="mt-6">
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Department Name</th>
                                        <th className="px-4 py-3">Code</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {departments.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-slate-500">No departments found</td></tr>
                                    ) : (
                                        departments.map((dept: any) => (
                                            <tr key={dept.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{dept.department_name}</td>
                                                <td className="px-4 py-3 font-mono text-slate-600">{dept.department_code}</td>
                                                <td className="px-4 py-3 text-slate-600">{dept.type || 'General'}</td>
                                                <td className="px-4 py-3 text-slate-500">{new Date(dept.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default HospitalDetailsPage
