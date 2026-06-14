import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
    Building2,
    User,
    Calendar,
    Clock,
    LayoutDashboard,
    Bell,
    FileText,
    Settings
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

/**
 * Generic Department Dashboard
 * 
 * A professional fallback dashboard for departments that don't have 
 * specialized module dashboards. Provides a welcoming interface with
 * user info, department context, and quick links.
 */
export const GenericDepartmentDashboard: React.FC = () => {
    const { user } = useAuthStore()

    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString('en-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    const formattedTime = currentDate.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit'
    })

    const departmentName = user?.department?.department_name || 'Your Department'
    const userName = user?.full_name || 'User'
    const roleName = user?.role?.role_name || user?.jawatan || 'Staff'

    // Quick links for common actions
    const quickLinks = [
        {
            label: 'My Profile',
            icon: User,
            href: ROUTES.PROFILE,
            color: 'bg-blue-500'
        },
        {
            label: 'Notifications',
            icon: Bell,
            href: '#',
            color: 'bg-amber-500'
        },
        {
            label: 'Reports',
            icon: FileText,
            href: '#',
            color: 'bg-emerald-500'
        },
        {
            label: 'Settings',
            icon: Settings,
            href: '#',
            color: 'bg-purple-500'
        },
    ]

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                        <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome back, {userName.split(' ')[0]}!
                        </h1>
                        <p className="text-slate-600">
                            {departmentName} Dashboard
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-blue-600" />
                            Your Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Full Name</p>
                                    <p className="font-medium text-slate-900">{userName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Role</p>
                                    <p className="font-medium text-slate-900">{roleName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Employee ID</p>
                                    <p className="font-medium text-slate-900">{user?.employee_id || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Department</p>
                                    <p className="font-medium text-slate-900">{departmentName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Hospital</p>
                                    <p className="font-medium text-slate-900">
                                        {user?.hospital?.hospital_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Email</p>
                                    <p className="font-medium text-slate-900">{user?.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Date & Time Card */}
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-lg text-white">
                    <CardContent className="p-6 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Calendar className="h-5 w-5" />
                            <span className="text-sm font-medium">Today</span>
                        </div>
                        <p className="text-lg font-medium mb-2">{formattedDate}</p>
                        <div className="flex items-center gap-2 mt-4">
                            <Clock className="h-5 w-5 opacity-90" />
                            <span className="text-2xl font-bold">{formattedTime}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Department Info Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            Department Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                                <p className="text-sm text-slate-500 mb-1">Department</p>
                                <p className="font-semibold text-indigo-900">{departmentName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Department Code</p>
                                <p className="font-medium text-slate-700">
                                    {user?.department?.department_code || 'N/A'}
                                </p>
                            </div>
                            {user?.department?.description && (
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Description</p>
                                    <p className="text-sm text-slate-700">
                                        {user.department.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Links Card */}
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    to={link.href}
                                    className="group p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 flex flex-col items-center gap-2"
                                >
                                    <div className={`p-3 ${link.color} rounded-lg text-white group-hover:scale-110 transition-transform`}>
                                        <link.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {link.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Banner */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> This is a general dashboard for your department.
                    If you need specialized features, please contact your system administrator.
                </p>
            </div>
        </div>
    )
}

export default GenericDepartmentDashboard
