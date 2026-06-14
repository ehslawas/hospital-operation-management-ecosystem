import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Shield, Lock, Mail, Database, Settings as SettingsIcon, AlertTriangle, FileText } from 'lucide-react'
import { Button, Input, Select, Textarea, Badge, LoadingOverlay, ConfirmationDialog } from '@/components/ui'
import { AdminPageLayout } from '@/components/admin'
import { getSystemSettings, updateSystemSettings, resetSystemSettings } from '@/services/systemSettingsService'
import { useToast } from '@/stores/toastStore'
import { getAllRoles } from '@/services/roleService'
import { cn } from '@/lib/utils'
import type { SystemSettings, Role } from '@/types'

export const SystemSettingsPage: React.FC = () => {
  const toast = useToast()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'backup'>('general')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [settingsData, rolesData] = await Promise.all([getSystemSettings(), getAllRoles()])
      setSettings(settingsData)
      setRoles(rolesData)
    } catch (error) {
      toast.error('Error', 'Failed to load system settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const updatedSettings = await updateSystemSettings(settings)
      setSettings(updatedSettings)
      toast.success('Success', 'System settings updated successfully')
    } catch (error) {
      toast.error('Error', 'Failed to update system settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsSaving(true)
    try {
      const resetSettings = await resetSystemSettings()
      setSettings(resetSettings)
      setShowResetModal(false)
      toast.success('Success', 'System settings reset to defaults')
    } catch (error) {
      toast.error('Error', 'Failed to reset system settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (isLoading) return <LoadingOverlay fullScreen message="Loading system settings..." />
  if (!settings) return <div className="flex items-center justify-center h-64"><p className="text-slate-600">Failed to load settings</p></div>

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'backup', label: 'Backup & Logs', icon: Database },
  ]

  const actions = (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={() => setShowResetModal(true)} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Reset Defaults
      </Button>
      <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
        Save Changes
      </Button>
    </div>
  )

  return (
    <AdminPageLayout
      title="System Settings"
      description="Configure system-wide settings and preferences"
      icon={SettingsIcon}
      breadcrumbs={[{ label: 'System' }, { label: 'Settings' }]}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Maintenance Mode Banner */}
        {settings.maintenance_mode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Maintenance Mode is Active</p>
              <p className="text-sm text-amber-800">
                {settings.maintenance_message || 'The system is currently under maintenance.'}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-slate-200 bg-slate-50/50">
            <div className="flex overflow-x-auto custom-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                      isActive
                        ? "text-indigo-600 border-indigo-600 bg-indigo-50/50"
                        : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {/* General Settings */}
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Application Name" value={settings.app_name} onChange={(e) => updateSetting('app_name', e.target.value)} />
                  <Input label="Application Version" value={settings.app_version} onChange={(e) => updateSetting('app_version', e.target.value)} disabled />

                  <div className="md:col-span-2 space-y-4 pt-2">
                    <h3 className="font-medium text-slate-900 border-b pb-2">Maintenance</h3>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="maintenance_mode" checked={settings.maintenance_mode} onChange={(e) => updateSetting('maintenance_mode', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <label htmlFor="maintenance_mode" className="text-sm font-medium text-slate-700">Enable Maintenance Mode</label>
                    </div>
                    {settings.maintenance_mode && (
                      <Textarea label="Maintenance Message" value={settings.maintenance_message || ''} onChange={(e) => updateSetting('maintenance_message', e.target.value)} rows={3} />
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-2">
                    <h3 className="font-medium text-slate-900 border-b pb-2">User Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Select label="Default User Role" value={settings.default_user_role || ''} onChange={(e) => updateSetting('default_user_role', e.target.value || undefined)} options={[{ value: '', label: 'None' }, ...roles.map((r) => ({ value: r.id, label: r.role_name }))]} />
                      <div className="flex items-center gap-3 pt-6">
                        <input type="checkbox" id="allow_registration" checked={settings.allow_registration} onChange={(e) => updateSetting('allow_registration', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="allow_registration" className="text-sm font-medium text-slate-700">Allow User Registration</label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg pb-2 border-b">
                    <Lock className="w-5 h-5 text-indigo-500" /> Authentication
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input type="number" label="Session Timeout (min)" value={settings.session_timeout_minutes} onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value) || 60)} min={5} />
                    <Input type="number" label="Max Login Attempts" value={settings.max_login_attempts} onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value) || 5)} min={3} />
                    <Input type="number" label="Lockout Duration (min)" value={settings.lockout_duration_minutes} onChange={(e) => updateSetting('lockout_duration_minutes', parseInt(e.target.value) || 30)} min={5} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg pb-2 border-b">
                    <Shield className="w-5 h-5 text-indigo-500" /> Password Policy
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input type="number" label="Min Password Length" value={settings.password_min_length} onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value) || 8)} min={6} />
                    <Input type="number" label="Password Expiry (days)" value={settings.password_expiry_days} onChange={(e) => updateSetting('password_expiry_days', parseInt(e.target.value) || 90)} min={0} />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    {[
                      { id: 'password_require_uppercase', label: 'Require Uppercase Letters' },
                      { id: 'password_require_lowercase', label: 'Require Lowercase Letters' },
                      { id: 'password_require_numbers', label: 'Require Numbers' },
                      { id: 'password_require_special', label: 'Require Special Characters' },
                      { id: 'require_email_verification', label: 'Require Email Verification' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <input type="checkbox" id={item.id} checked={(settings as any)[item.id]} onChange={(e) => updateSetting(item.id as any, e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor={item.id} className="text-sm font-medium text-slate-700">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <input type="checkbox" id="email_enabled" checked={settings.email_enabled} onChange={(e) => updateSetting('email_enabled', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="email_enabled" className="font-semibold text-slate-900">Enable Email Notifications</label>
                </div>
                {settings.email_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input type="email" label="From Email Address" value={settings.email_from_address} onChange={(e) => updateSetting('email_from_address', e.target.value)} />
                    <Input label="SMTP Host" value={settings.smtp_host || ''} onChange={(e) => updateSetting('smtp_host', e.target.value)} placeholder="smtp.example.com" />
                    <Input type="number" label="SMTP Port" value={settings.smtp_port || 587} onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value) || 587)} />
                    <Select label="Encryption" value={settings.smtp_encryption || 'tls'} onChange={(e) => updateSetting('smtp_encryption', e.target.value as any)} options={[{ value: 'tls', label: 'TLS' }, { value: 'ssl', label: 'SSL' }, { value: 'none', label: 'None' }]} />
                    <Input label="Username" value={settings.smtp_username || ''} onChange={(e) => updateSetting('smtp_username', e.target.value)} />
                    <Input type="password" label="Password" value={settings.smtp_password || ''} onChange={(e) => updateSetting('smtp_password', e.target.value)} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg pb-2 border-b">
                    <Database className="w-5 h-5 text-indigo-500" /> Automated Backups
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <input type="checkbox" id="backup_enabled" checked={settings.backup_enabled} onChange={(e) => updateSetting('backup_enabled', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="backup_enabled" className="text-sm font-medium text-slate-700">Enable Automatic Backups</label>
                  </div>
                  {settings.backup_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input type="number" label="Frequency (hours)" value={settings.backup_frequency_hours} onChange={(e) => updateSetting('backup_frequency_hours', parseInt(e.target.value))} min={1} />
                      <Input type="number" label="Retention (days)" value={settings.backup_retention_days} onChange={(e) => updateSetting('backup_retention_days', parseInt(e.target.value))} min={1} />
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg pb-2 border-b">
                    <FileText className="w-5 h-5 text-indigo-500" /> Data Retention
                  </div>
                  <div className="max-w-md">
                    <Input type="number" label="Log Retention Period (days)" value={settings.log_retention_days} onChange={(e) => updateSetting('log_retention_days', parseInt(e.target.value))} min={7} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Reset System Settings"
        message="Are you sure you want to reset all system settings to their default values? This action cannot be undone."
        variant="destructive"
        confirmText="Reset to Defaults"
        isLoading={isSaving}
      />
    </AdminPageLayout>
  )
}

export default SystemSettingsPage
