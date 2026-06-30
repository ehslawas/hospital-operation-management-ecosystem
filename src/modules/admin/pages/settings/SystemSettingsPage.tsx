// @ts-nocheck
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Shield, Lock, Mail, Database, Settings as SettingsIcon, AlertTriangle, FileText } from 'lucide-react'
import { Button, Input, Select, Textarea, Badge, LoadingOverlay, Modal } from '@/components/ui'
import { getSystemSettings, updateSystemSettings, resetSystemSettings } from '@/services/systemSettingsService'
import { useToast } from '@/stores/toastStore'
import { getAllRoles } from '@/services/roleService'
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
      console.error('Error fetching settings:', error)
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
      console.error('Error updating settings:', error)
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
      console.error('Error resetting settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (isLoading) {
    return <LoadingOverlay fullScreen message="Loading system settings..." />
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Failed to load system settings</p>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'backup', label: 'Backup & Logs', icon: Database },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowResetModal(true)}>
            Reset to Defaults
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-5 h-5" />}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Banner */}
      {settings.maintenance_mode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Maintenance Mode is Active</p>
            <p className="text-sm text-amber-800">
              {settings.maintenance_message || 'The system is currently under maintenance.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Application Name"
                  value={settings.app_name}
                  onChange={(e) => updateSetting('app_name', e.target.value)}
                />
                <Input
                  label="Application Version"
                  value={settings.app_version}
                  onChange={(e) => updateSetting('app_version', e.target.value)}
                  disabled
                />
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="maintenance_mode"
                      checked={settings.maintenance_mode}
                      onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="maintenance_mode" className="font-medium text-slate-900">
                      Enable Maintenance Mode
                    </label>
                  </div>
                  {settings.maintenance_mode && (
                    <Textarea
                      label="Maintenance Message"
                      value={settings.maintenance_message || ''}
                      onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                      placeholder="Enter maintenance message to display to users..."
                      rows={3}
                    />
                  )}
                </div>
                <Select
                  label="Default User Role"
                  value={settings.default_user_role || ''}
                  onChange={(e) => updateSetting('default_user_role', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'None' },
                    ...roles.map((r) => ({ value: r.id, label: r.role_name })),
                  ]}
                />
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allow_registration"
                    checked={settings.allow_registration}
                    onChange={(e) => updateSetting('allow_registration', e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="allow_registration" className="font-medium text-slate-900">
                    Allow User Registration
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Authentication Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Session Timeout (minutes)"
                    value={settings.session_timeout_minutes}
                    onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value) || 60)}
                    min={5}
                    max={480}
                  />
                  <Input
                    type="number"
                    label="Max Login Attempts"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value) || 5)}
                    min={3}
                    max={10}
                  />
                  <Input
                    type="number"
                    label="Lockout Duration (minutes)"
                    value={settings.lockout_duration_minutes}
                    onChange={(e) => updateSetting('lockout_duration_minutes', parseInt(e.target.value) || 30)}
                    min={5}
                    max={1440}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Password Policy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="number"
                    label="Minimum Password Length"
                    value={settings.password_min_length}
                    onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value) || 8)}
                    min={6}
                    max={32}
                  />
                  <Input
                    type="number"
                    label="Password Expiry (days)"
                    value={settings.password_expiry_days}
                    onChange={(e) => updateSetting('password_expiry_days', parseInt(e.target.value) || 90)}
                    min={0}
                    max={365}
                  />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="password_require_uppercase"
                        checked={settings.password_require_uppercase}
                        onChange={(e) => updateSetting('password_require_uppercase', e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="password_require_uppercase" className="text-slate-700">
                        Require Uppercase Letters
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="password_require_lowercase"
                        checked={settings.password_require_lowercase}
                        onChange={(e) => updateSetting('password_require_lowercase', e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="password_require_lowercase" className="text-slate-700">
                        Require Lowercase Letters
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="password_require_numbers"
                        checked={settings.password_require_numbers}
                        onChange={(e) => updateSetting('password_require_numbers', e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="password_require_numbers" className="text-slate-700">
                        Require Numbers
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="password_require_special"
                        checked={settings.password_require_special}
                        onChange={(e) => updateSetting('password_require_special', e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="password_require_special" className="text-slate-700">
                        Require Special Characters
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="require_email_verification"
                      checked={settings.require_email_verification}
                      onChange={(e) => updateSetting('require_email_verification', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="require_email_verification" className="text-slate-700">
                      Require Email Verification
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="email_enabled"
                  checked={settings.email_enabled}
                  onChange={(e) => updateSetting('email_enabled', e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="email_enabled" className="font-medium text-slate-900">
                  Enable Email Notifications
                </label>
              </div>

              {settings.email_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="email"
                    label="From Email Address"
                    value={settings.email_from_address}
                    onChange={(e) => updateSetting('email_from_address', e.target.value)}
                  />
                  <Input
                    label="SMTP Host"
                    value={settings.smtp_host || ''}
                    onChange={(e) => updateSetting('smtp_host', e.target.value || undefined)}
                    placeholder="smtp.example.com"
                  />
                  <Input
                    type="number"
                    label="SMTP Port"
                    value={settings.smtp_port || 587}
                    onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value) || 587)}
                    min={1}
                    max={65535}
                  />
                  <Select
                    label="SMTP Encryption"
                    value={settings.smtp_encryption || 'tls'}
                    onChange={(e) => updateSetting('smtp_encryption', e.target.value as 'tls' | 'ssl' | 'none')}
                    options={[
                      { value: 'tls', label: 'TLS' },
                      { value: 'ssl', label: 'SSL' },
                      { value: 'none', label: 'None' },
                    ]}
                  />
                  <Input
                    label="SMTP Username"
                    value={settings.smtp_username || ''}
                    onChange={(e) => updateSetting('smtp_username', e.target.value || undefined)}
                  />
                  <Input
                    type="password"
                    label="SMTP Password"
                    value={settings.smtp_password || ''}
                    onChange={(e) => updateSetting('smtp_password', e.target.value || undefined)}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Backup & Logs Settings */}
          {activeTab === 'backup' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backup Settings
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="backup_enabled"
                    checked={settings.backup_enabled}
                    onChange={(e) => updateSetting('backup_enabled', e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="backup_enabled" className="font-medium text-slate-900">
                    Enable Automatic Backups
                  </label>
                </div>
                {settings.backup_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="number"
                      label="Backup Frequency (hours)"
                      value={settings.backup_frequency_hours}
                      onChange={(e) => updateSetting('backup_frequency_hours', parseInt(e.target.value) || 24)}
                      min={1}
                      max={168}
                    />
                    <Input
                      type="number"
                      label="Backup Retention (days)"
                      value={settings.backup_retention_days}
                      onChange={(e) => updateSetting('backup_retention_days', parseInt(e.target.value) || 30)}
                      min={1}
                      max={365}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Log Retention
                </h3>
                <Input
                  type="number"
                  label="Log Retention Period (days)"
                  value={settings.log_retention_days}
                  onChange={(e) => updateSetting('log_retention_days', parseInt(e.target.value) || 90)}
                  min={7}
                  max={365}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset System Settings"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to reset all system settings to their default values? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset} isLoading={isSaving}>
              Reset to Defaults
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SystemSettingsPage

