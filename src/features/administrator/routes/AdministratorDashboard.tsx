'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getSystemOverview,
  getDepartmentStatuses,
  getUserAccounts,
  getAuditLogs,
  getSystemAlerts,
  getDatabaseStats,
  getPerformanceMetrics,
  getBackupHistory,
  getSystemConfiguration,
  getLicenseInfo,
  getIntegrationStatus,
} from '../services/mockAdminData';
import {
  getAccessTokens,
  getTokenUsageLogs,
  getUnauthorizedAccessAttempts,
  getAccessControlRules,
  getTokenStatistics,
} from '../services/mockAccessTokenData';

export default function AdministratorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'users' | 'audit' | 'alerts' | 'database' | 'performance' | 'backup' | 'config' | 'integrations' | 'superadmin' | 'tokens'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  
  // Super Admin Management states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Access Token Management states
  const [tokenFilter, setTokenFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);

  // Load data
  const systemOverview = useMemo(() => getSystemOverview(), []);
  const departments = useMemo(() => getDepartmentStatuses(), []);
  const users = useMemo(() => getUserAccounts(), []);
  const auditLogs = useMemo(() => getAuditLogs(), []);
  const alerts = useMemo(() => getSystemAlerts(), []);
  const dbStats = useMemo(() => getDatabaseStats(), []);
  const perfMetrics = useMemo(() => getPerformanceMetrics(), []);
  const backups = useMemo(() => getBackupHistory(), []);
  const config = useMemo(() => getSystemConfiguration(), []);
  const licenses = useMemo(() => getLicenseInfo(), []);
  const integrations = useMemo(() => getIntegrationStatus(), []);
  const accessTokens = useMemo(() => getAccessTokens(), []);
  const tokenUsageLogs = useMemo(() => getTokenUsageLogs(), []);
  const unauthorizedAttempts = useMemo(() => getUnauthorizedAccessAttempts(), []);
  const accessRules = useMemo(() => getAccessControlRules(), []);
  const tokenStats = useMemo(() => getTokenStatistics(), []);

  // Filter data based on search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log =>
    (selectedDept === 'all' || log.department === selectedDept) &&
    (searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredTokens = accessTokens.filter(token =>
    (tokenFilter === 'all' || token.status === tokenFilter) &&
    (searchTerm === '' ||
      token.tokenCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper components
  const Badge = ({ text, variant }: { text: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }) => {
    const colors = {
      success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20',
      warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20',
      error: 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20',
      info: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20',
      neutral: 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/20',
    };
    return <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${colors[variant]}`}>{text}</span>;
  };

  const StatCard = ({ title, value, subtitle, icon, gradient }: { title: string; value: string | number; subtitle?: string; icon: string; gradient: string }) => (
    <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md shadow-lg ring-1 ring-slate-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className={`absolute inset-0 ${gradient} opacity-5`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">{title}</span>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon }: { id: typeof activeTab; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        activeTab === id
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
          : 'bg-white/80 text-slate-600 hover:bg-white hover:shadow-md'
      }`}
    >
      <span>{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header with Shield Icon */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl ring-2 ring-white/20 flex items-center justify-center text-4xl">
                🛡️
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight">System Administrator</h1>
                <p className="text-blue-200 mt-1">Complete hospital management system control center</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <Badge text="Super Admin" variant="info" />
              <Badge text="Full Access" variant="success" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-4">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon="📊" />
            <TabButton id="departments" label="Departments" icon="🏥" />
            <TabButton id="users" label="Users" icon="👥" />
            <TabButton id="audit" label="Audit Logs" icon="📋" />
            <TabButton id="alerts" label="Alerts" icon="🚨" />
            <TabButton id="database" label="Database" icon="💾" />
            <TabButton id="performance" label="Performance" icon="⚡" />
            <TabButton id="backup" label="Backups" icon="💿" />
            <TabButton id="config" label="Configuration" icon="⚙️" />
            <TabButton id="integrations" label="Integrations" icon="🔗" />
            <TabButton id="tokens" label="Access Tokens" icon="🎫" />
            <TabButton id="superadmin" label="Super Admin" icon="🔐" />
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Departments"
                value={systemOverview.totalDepartments}
                icon="🏥"
                gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
              />
              <StatCard
                title="Active Users"
                value={systemOverview.activeUsers.toLocaleString()}
                icon="👥"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
              />
              <StatCard
                title="Total Patients"
                value={systemOverview.totalPatients.toLocaleString()}
                icon="🏥"
                gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              />
              <StatCard
                title="Prescriptions"
                value={systemOverview.totalPrescriptions.toLocaleString()}
                icon="💊"
                gradient="bg-gradient-to-br from-orange-500 to-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="System Uptime"
                value={systemOverview.systemUptime}
                subtitle="Last 30 days"
                icon="⚡"
                gradient="bg-gradient-to-br from-green-500 to-emerald-500"
              />
              <StatCard
                title="Storage Used"
                value={`${systemOverview.storageUsed}GB`}
                subtitle={`of ${systemOverview.storageTotal}GB`}
                icon="💾"
                gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
              />
              <StatCard
                title="Last Backup"
                value="45 mins ago"
                subtitle="Incremental"
                icon="💿"
                gradient="bg-gradient-to-br from-violet-500 to-purple-500"
              />
              <StatCard
                title="Active Alerts"
                value={alerts.filter(a => a.status === 'new').length}
                subtitle={`${alerts.filter(a => a.severity === 'critical').length} critical`}
                icon="🚨"
                gradient="bg-gradient-to-br from-rose-500 to-red-500"
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">🚨 Recent Alerts</h2>
                  <button onClick={() => setActiveTab('alerts')} className="text-sm text-blue-600 hover:underline font-semibold">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                      <span className="text-2xl">
                        {alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : alert.severity === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm">{alert.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{alert.message}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge text={alert.type} variant="info" />
                          <Badge text={alert.status} variant={alert.status === 'new' ? 'warning' : alert.status === 'resolved' ? 'success' : 'neutral'} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Health */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">🏥 Department Health</h2>
                  <button onClick={() => setActiveTab('departments')} className="text-sm text-blue-600 hover:underline font-semibold">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {departments.slice(0, 6).map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl">
                          {dept.status === 'active' ? '🟢' : dept.status === 'idle' ? '🟡' : dept.status === 'maintenance' ? '🔵' : '🔴'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{dept.name}</div>
                          <div className="text-xs text-slate-500">{dept.activeUsers} users • {dept.todayTransactions} txns</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-600">{dept.performance}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* License Status */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">📜 License Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {licenses.map((license, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <Badge text={license.type} variant="info" />
                      <Badge 
                        text={license.status} 
                        variant={license.status === 'active' ? 'success' : license.status === 'trial' ? 'warning' : 'error'} 
                      />
                    </div>
                    <div className="font-semibold text-slate-900 text-sm mb-1">{license.feature}</div>
                    <div className="text-xs text-slate-500">Expires: {license.expiryDate}</div>
                    <div className="text-xs text-slate-600 mt-2">
                      {license.usersActive} / {license.usersAllowed} users active
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Department Status & Control</h2>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                  + Add Department
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <div key={dept.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {dept.status === 'active' ? '🟢' : dept.status === 'idle' ? '🟡' : dept.status === 'maintenance' ? '🔵' : '🔴'}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-900">{dept.name}</h3>
                          <div className="text-xs text-slate-500 capitalize">{dept.status}</div>
                        </div>
                      </div>
                      {dept.alerts > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">{dept.alerts}</span>
                      )}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Active Users:</span>
                        <span className="font-semibold text-slate-900">{dept.activeUsers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Today's Transactions:</span>
                        <span className="font-semibold text-slate-900">{dept.todayTransactions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Performance:</span>
                        <span className="font-semibold text-emerald-600">{dept.performance}%</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Last activity: {new Date(dept.lastActivity).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors">
                        Settings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                  + Add User
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Last Login</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 20).map(user => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.username}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{user.department}</td>
                        <td className="py-3 px-4">
                          <Badge text={user.role} variant="info" />
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            text={user.status} 
                            variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'error' : 'neutral'} 
                          />
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100">
                              Edit
                            </button>
                            <button className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100">
                              Suspend
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Showing {Math.min(20, filteredUsers.length)} of {filteredUsers.length} users
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Audit Logs</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredAuditLogs.slice(0, 50).map(log => (
                  <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            text={log.action} 
                            variant={log.severity === 'critical' ? 'error' : log.severity === 'warning' ? 'warning' : 'info'} 
                          />
                          <Badge text={log.entity} variant="neutral" />
                          <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-slate-900 mb-1">{log.description}</div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>👤 {log.userName}</span>
                          <span>🏥 {log.department}</span>
                          <span>🌐 {log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Showing {Math.min(50, filteredAuditLogs.length)} of {filteredAuditLogs.length} log entries
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">System Alerts</h2>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">
                        {alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : alert.severity === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-slate-900">{alert.title}</h3>
                          <Badge 
                            text={alert.status} 
                            variant={alert.status === 'new' ? 'warning' : alert.status === 'resolved' ? 'success' : 'neutral'} 
                          />
                        </div>
                        <p className="text-slate-600 mb-3">{alert.message}</p>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge text={alert.type} variant="info" />
                          <Badge text={alert.severity} variant={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'neutral'} />
                          {alert.department && <Badge text={alert.department} variant="neutral" />}
                          <span className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        {alert.status === 'resolved' && alert.resolvedBy && (
                          <div className="text-sm text-emerald-600">
                            ✅ Resolved by {alert.resolvedBy} at {new Date(alert.resolvedAt!).toLocaleString()}
                          </div>
                        )}
                        {alert.status === 'new' && (
                          <div className="flex gap-2 mt-3">
                            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                              Acknowledge
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                              Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DATABASE TAB */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Database Statistics</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                    Optimize
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                    Backup Now
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dbStats.map((table, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{table.tableName}</h3>
                      <span className="text-2xl">💾</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Records:</span>
                        <span className="font-semibold text-slate-900">{table.recordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Size:</span>
                        <span className="font-semibold text-slate-900">{table.sizeGB} GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Indexes:</span>
                        <span className="font-semibold text-slate-900">{table.indexCount}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Modified: {new Date(table.lastModified).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">System Performance (Last 24 Hours)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Avg CPU Usage"
                  value={`${Math.round(perfMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / perfMetrics.length)}%`}
                  icon="⚡"
                  gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
                />
                <StatCard
                  title="Avg Memory"
                  value={`${Math.round(perfMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / perfMetrics.length)}%`}
                  icon="🧠"
                  gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                />
                <StatCard
                  title="Disk Usage"
                  value={`${Math.round(perfMetrics[perfMetrics.length - 1].diskUsage)}%`}
                  icon="💾"
                  gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
                />
                <StatCard
                  title="Active Connections"
                  value={perfMetrics[perfMetrics.length - 1].activeConnections}
                  icon="🔗"
                  gradient="bg-gradient-to-br from-orange-500 to-red-500"
                />
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Requests Per Second</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {perfMetrics[perfMetrics.length - 1].requestsPerSecond} req/s
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Network Traffic</div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-slate-600">Inbound</div>
                      <div className="text-xl font-bold text-blue-600">
                        {Math.round(perfMetrics[perfMetrics.length - 1].networkIn)} MB/s
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Outbound</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {Math.round(perfMetrics[perfMetrics.length - 1].networkOut)} MB/s
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BACKUP TAB */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Backup Management</h2>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                  Run Backup Now
                </button>
              </div>
              <div className="space-y-4">
                {backups.map(backup => (
                  <div key={backup.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">
                          {backup.status === 'completed' ? '✅' : backup.status === 'failed' ? '❌' : '⏳'}
                        </span>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-slate-900">{backup.type.toUpperCase()} Backup</h3>
                            <Badge 
                              text={backup.status} 
                              variant={backup.status === 'completed' ? 'success' : backup.status === 'failed' ? 'error' : 'warning'} 
                            />
                          </div>
                          <div className="text-sm text-slate-600">
                            {new Date(backup.timestamp).toLocaleString()}
                          </div>
                          {backup.status === 'completed' && (
                            <div className="text-xs text-slate-500 mt-1">
                              Size: {backup.sizeGB} GB • Duration: {backup.duration} • Location: {backup.location}
                            </div>
                          )}
                        </div>
                      </div>
                      {backup.status === 'completed' && (
                        <button className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100">
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATION TAB */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {config.map((section, idx) => (
              <div key={idx} className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{section.category} Settings</h2>
                <div className="space-y-4">
                  {section.settings.map((setting, sidx) => (
                    <div key={sidx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 mb-1">{setting.key.replace(/_/g, ' ').toUpperCase()}</div>
                        <div className="text-sm text-slate-500">{setting.description}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {setting.type === 'boolean' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700">{setting.value === 'true' ? 'Enabled' : 'Disabled'}</span>
                            <button className={`w-12 h-6 rounded-full transition-colors ${setting.value === 'true' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${setting.value === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        ) : setting.type === 'select' ? (
                          <select className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm" defaultValue={setting.value}>
                            {setting.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type={setting.type === 'number' ? 'number' : 'text'}
                            defaultValue={setting.value}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm w-32"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">System Integrations</h2>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                  + Add Integration
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map(integration => (
                  <div key={integration.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔗</span>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{integration.name}</h3>
                          <Badge text={integration.type} variant="info" />
                        </div>
                      </div>
                      <Badge 
                        text={integration.status} 
                        variant={integration.status === 'connected' ? 'success' : integration.status === 'error' ? 'error' : 'warning'} 
                      />
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-slate-600">
                        <strong>Endpoint:</strong> {integration.endpoint}
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Last Sync:</strong> {new Date(integration.lastSync).toLocaleString()}
                      </div>
                      {integration.responseTime > 0 && (
                        <div className="text-sm text-slate-600">
                          <strong>Response Time:</strong> {integration.responseTime}ms
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100">
                        Test Connection
                      </button>
                      <button className="flex-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100">
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCESS TOKENS TAB */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl ring-2 ring-white/20 flex items-center justify-center text-4xl">
                    🎫
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold">Access Token Management</h2>
                    <p className="text-blue-200 mt-1">Control access to sensitive patient data</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateTokenModal(true)}
                  className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold hover:bg-blue-50 transition-all shadow-lg hover:scale-105"
                >
                  + Create New Token
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Active Tokens"
                value={tokenStats.totalActive}
                subtitle={`${tokenStats.totalExpired} expired`}
                icon="✅"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
              />
              <StatCard
                title="24h Usage"
                value={tokenStats.totalUsage24h}
                subtitle="Token accesses"
                icon="📊"
                gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
              />
              <StatCard
                title="Unauthorized Attempts"
                value={tokenStats.totalUnauthorizedAttempts24h}
                subtitle={`${tokenStats.highRiskAttempts} high risk`}
                icon="🚨"
                gradient="bg-gradient-to-br from-red-500 to-rose-500"
              />
              <StatCard
                title="Most Accessed"
                value={tokenStats.mostAccessedResource}
                subtitle="Resource type"
                icon="🔥"
                gradient="bg-gradient-to-br from-orange-500 to-amber-500"
              />
            </div>

            {/* Active Tokens Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Active Access Tokens</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTokenFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tokenFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    All ({accessTokens.length})
                  </button>
                  <button
                    onClick={() => setTokenFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tokenFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Active ({tokenStats.totalActive})
                  </button>
                  <button
                    onClick={() => setTokenFilter('expired')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tokenFilter === 'expired' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Expired ({tokenStats.totalExpired})
                  </button>
                  <button
                    onClick={() => setTokenFilter('revoked')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tokenFilter === 'revoked' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Revoked ({tokenStats.totalRevoked})
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search tokens by code, user, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Token Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Resource</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Access</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Usage</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Expires</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTokens.slice(0, 15).map(token => (
                      <tr key={token.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs font-semibold text-indigo-700">{token.tokenCode}</div>
                          <div className="text-xs text-slate-500">{token.purpose}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-sm">{token.userName}</div>
                          <div className="text-xs text-slate-500">{token.department}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge text={token.resourceType.replace('_', ' ')} variant="info" />
                        </td>
                        <td className="py-3 px-4">
                          <Badge text={token.accessLevel} variant={token.accessLevel === 'delete' ? 'error' : 'neutral'} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <span className="font-semibold text-slate-900">{token.currentUsageCount}</span>
                            <span className="text-slate-500">/{token.maxUsageCount}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${token.currentUsageCount >= token.maxUsageCount ? 'bg-red-600' : token.currentUsageCount > token.maxUsageCount * 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min((token.currentUsageCount / token.maxUsageCount) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            text={token.status}
                            variant={token.status === 'active' ? 'success' : token.status === 'expired' ? 'warning' : 'error'}
                          />
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {new Date(token.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100">
                              View
                            </button>
                            <button className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100">
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-slate-500">
                Showing {Math.min(15, filteredTokens.length)} of {filteredTokens.length} tokens
              </div>
            </div>

            {/* Unauthorized Access Attempts */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🚨</span>
                <h2 className="text-2xl font-bold text-slate-900">Unauthorized Access Attempts</h2>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {unauthorizedAttempts.slice(0, 10).map(attempt => (
                  <div key={attempt.id} className={`p-4 rounded-xl border-2 ${
                    attempt.severity === 'critical' ? 'border-red-300 bg-red-50' :
                    attempt.severity === 'high' ? 'border-orange-300 bg-orange-50' :
                    attempt.severity === 'medium' ? 'border-amber-300 bg-amber-50' :
                    'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {attempt.severity === 'critical' ? '🔴' : attempt.severity === 'high' ? '🟠' : attempt.severity === 'medium' ? '🟡' : '🟢'}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{attempt.userName}</div>
                            <div className="text-sm text-slate-600">{attempt.department} • {attempt.attemptedResource}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 ml-10">
                          <span>Action: <strong>{attempt.attemptedAction}</strong></span>
                          <span>•</span>
                          <span>IP: {attempt.ipAddress}</span>
                          <span>•</span>
                          <span>{new Date(attempt.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="mt-2 ml-10">
                          <Badge text={attempt.reason.replace('_', ' ')} variant="error" />
                          <Badge text={attempt.severity} variant={attempt.severity === 'critical' ? 'error' : 'warning'} />
                          {attempt.blocked && <Badge text="Blocked" variant="error" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Token Usage */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📊</span>
                <h2 className="text-2xl font-bold text-slate-900">Recent Token Usage</h2>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tokenUsageLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{log.success ? '✅' : '❌'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 text-sm">{log.userName}</span>
                          <Badge text={log.action} variant="info" />
                          <span className="text-xs text-slate-500">{log.resourceType}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Token: {log.tokenCode} • IP: {log.ipAddress} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                        {!log.success && log.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">Error: {log.errorMessage}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Access Control Rules */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  <h2 className="text-2xl font-bold text-slate-900">Access Control Rules</h2>
                </div>
                <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  + Add Rule
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accessRules.map(rule => (
                  <div key={rule.id} className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{rule.name}</h3>
                        <Badge text={rule.resourceType} variant="info" />
                      </div>
                      <Badge text={rule.isActive ? 'Active' : 'Inactive'} variant={rule.isActive ? 'success' : 'neutral'} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Required Roles:</span>
                        <span className="font-semibold text-slate-900">{rule.requiredRole.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Daily Limit:</span>
                        <span className="font-semibold text-slate-900">{rule.maxDailyAccess} accesses</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Token Required:</span>
                        <span className="font-semibold text-slate-900">{rule.requiresToken ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Allowed: {rule.allowedDepartments.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100">
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100">
                        {rule.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUPER ADMIN MANAGEMENT TAB */}
        {activeTab === 'superadmin' && (
          <div className="space-y-6">
            {/* Current Super Admin Info */}
            <div className="bg-gradient-to-r from-red-900 via-rose-900 to-pink-900 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-xl ring-2 ring-white/20 flex items-center justify-center text-4xl">
                  🔐
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold">Super Admin Access Control</h2>
                  <p className="text-red-200 mt-1">High Security Area - Credential Management</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-300 text-xl">⚠️</span>
                  <span className="font-bold text-yellow-300">Security Notice</span>
                </div>
                <p className="text-sm text-white/90">
                  This section allows you to manage super administrator credentials. Changing these credentials will affect system access. 
                  Only authorized personnel should have access to this section. All changes are logged for security audit purposes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Credentials Info */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">👤</span>
                  <h3 className="text-2xl font-bold text-slate-900">Current Super Admin</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-sm text-blue-600 font-semibold mb-1">Admin ID</div>
                    <div className="text-xl font-bold text-blue-900">hosplawas</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-sm text-slate-600 font-semibold mb-1">Department</div>
                    <div className="text-lg font-bold text-slate-900">Administrator</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-sm text-emerald-600 font-semibold mb-1">Access Level</div>
                    <div className="text-lg font-bold text-emerald-900">Super Admin (Full Control)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="text-sm text-purple-600 font-semibold mb-1">Last Password Change</div>
                    <div className="text-sm font-semibold text-purple-900">January 13, 2025 09:30 AM</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <div className="text-sm text-orange-600 font-semibold mb-1">Login Status</div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-sm font-bold text-orange-900">Currently Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Credentials Form */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🔑</span>
                  <h3 className="text-2xl font-bold text-slate-900">Change Credentials</h3>
                </div>
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                  }
                  if (currentPassword !== 'lawas2025') {
                    alert('Current password is incorrect!');
                    return;
                  }
                  alert('✅ Credentials updated successfully! Please login again with new credentials.');
                }}>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Current Password *
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-xs text-blue-700 font-semibold">💡 New Credentials</div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        New Admin ID *
                      </label>
                      <input
                        type="text"
                        value={newAdminId}
                        onChange={(e) => setNewAdminId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new admin ID"
                        required
                      />
                      <div className="text-xs text-slate-500 mt-1">Min. 8 characters, no spaces</div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        New Password *
                      </label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password"
                        required
                      />
                      <div className="text-xs text-slate-500 mt-1">Min. 12 characters, include uppercase, lowercase, number & special character</div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="showPasswords"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="showPasswords" className="text-sm text-slate-600 cursor-pointer">
                        Show passwords
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    🔐 Update Super Admin Credentials
                  </button>
                </form>
              </div>
            </div>

            {/* Security Guidelines */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📋</span>
                <h3 className="text-2xl font-bold text-slate-900">Security Guidelines</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-bold text-blue-900 mb-1">Strong Password</div>
                  <div className="text-sm text-blue-700">Use minimum 12 characters with mix of uppercase, lowercase, numbers and special characters</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-bold text-emerald-900 mb-1">Regular Updates</div>
                  <div className="text-sm text-emerald-700">Change credentials every 90 days or when personnel changes occur</div>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-bold text-purple-900 mb-1">Limited Access</div>
                  <div className="text-sm text-purple-700">Only authorized IT administrators should have access to these credentials</div>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-bold text-orange-900 mb-1">Document Changes</div>
                  <div className="text-sm text-orange-700">Maintain secure documentation of credential changes with dates and authorized personnel</div>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-2xl mb-2">🚫</div>
                  <div className="font-bold text-rose-900 mb-1">No Sharing</div>
                  <div className="text-sm text-rose-700">Never share super admin credentials via email, chat, or unsecured channels</div>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-bold text-indigo-900 mb-1">Audit Trail</div>
                  <div className="text-sm text-indigo-700">All credential changes are logged and monitored for security compliance</div>
                </div>
              </div>
            </div>

            {/* Recent Security Events */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-slate-200/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📊</span>
                <h3 className="text-2xl font-bold text-slate-900">Recent Security Events</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-semibold text-slate-900">Successful Login</div>
                      <div className="text-sm text-slate-500">IP: 192.168.0.102 • Today at 09:45 AM</div>
                    </div>
                  </div>
                  <Badge text="Success" variant="success" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔑</span>
                    <div>
                      <div className="font-semibold text-slate-900">Password Changed</div>
                      <div className="text-sm text-slate-500">Changed by: admin_malaysia_2025 • January 13, 2025</div>
                    </div>
                  </div>
                  <Badge text="Security" variant="info" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <div className="font-semibold text-slate-900">Session Started</div>
                      <div className="text-sm text-slate-500">Device: Windows 10 • Today at 09:30 AM</div>
                    </div>
                  </div>
                  <Badge text="Info" variant="neutral" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

