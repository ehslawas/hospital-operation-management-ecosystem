import React, { useEffect, useState, useMemo } from 'react'
import { Plus, Edit2, Save, X, Hash, FileText, Mail } from 'lucide-react'
import { Button, Input, Table, Badge, Modal, Spinner, LoadingOverlay } from '@/components/ui'
import { AdminPageLayout, AdminStatsGrid, StatItem } from '@/components/admin'
import { runningNumberService } from '@/services/runningNumberService'
import * as departmentService from '@/services/departmentService'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Department, DepartmentRunningNumber } from '@/types'

export const RunningNumberPage = () => {
    const { user } = useAuthStore()
    const toast = useToast()

    const [configs, setConfigs] = useState<DepartmentRunningNumber[]>([])
    const [, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState<string | null>(null)

    // Edit State
    const [editForm, setEditForm] = useState<Partial<DepartmentRunningNumber>>({})

    const loadData = async () => {
        if (!user?.hospital_id) return
        setLoading(true)
        try {
            // 1. Get Departments for this hospital
            const depts = await departmentService.getDepartmentsByHospital(user.hospital_id)
            setDepartments(depts)

            // 2. Get Running Numbers for user's department
            if (user.department_id) {
                const numbers = await runningNumberService.getByDepartment(user.department_id)
                setConfigs(numbers)
            }
        } catch (error) {
            console.error(error)
            toast.error('Error', 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [user?.hospital_id, user?.department_id])

    const handleSave = async () => {
        if (!user?.department_id || !editForm.type || !editForm.prefix) return

        try {
            await runningNumberService.upsert({
                ...editForm,
                department_id: user.department_id,
                year: new Date().getFullYear()
            })
            toast.success('Success', 'Configuration saved')
            setIsEditing(null)
            loadData()
        } catch (error) {
            toast.error('Error', 'Failed to save')
        }
    }

    const startEdit = (config?: DepartmentRunningNumber) => {
        if (config) {
            setEditForm(config)
            setIsEditing(config.id)
        } else {
            setEditForm({
                current_sequence: 0,
                type: 'memo',
                prefix: 'HLWS/'
            })
            setIsEditing('new')
        }
    }

    // Stats
    const stats: StatItem[] = useMemo(() => {
        return [
            {
                label: 'Total Sequences',
                value: configs.length,
                icon: Hash,
                color: 'blue'
            },
            {
                label: 'Memo Types',
                value: configs.filter(c => c.type === 'memo').length,
                icon: FileText,
                color: 'indigo'
            },
            {
                label: 'Letter Types',
                value: configs.filter(c => c.type === 'letter').length,
                icon: Mail,
                color: 'purple'
            }
        ]
    }, [configs])

    const columns = [
        {
            key: 'type',
            label: 'Type',
            render: (_: unknown, row: DepartmentRunningNumber) => (
                <Badge variant={row.type === 'memo' ? 'primary' : 'secondary'} className="uppercase">
                    {row.type === 'memo' ? 'Memo Dalaman' : 'Surat Rasmi'}
                </Badge>
            )
        },
        {
            key: 'prefix',
            label: 'Format Prefix',
            render: (_: unknown, row: DepartmentRunningNumber) => (
                <span className="font-mono text-slate-700 font-semibold">{row.prefix}</span>
            )
        },
        {
            key: 'sequence',
            label: 'Current Sequence',
            render: (_: unknown, row: DepartmentRunningNumber) => (
                <div className="flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-1 rounded font-mono text-sm">{row.current_sequence}</span>
                    <span className="text-xs text-slate-400">Next: {row.current_sequence + 1}</span>
                </div>
            )
        },
        {
            key: 'year',
            label: 'Year',
            render: (_: unknown, row: DepartmentRunningNumber) => (
                <span className="text-sm text-slate-600">{row.year}</span>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: unknown, row: DepartmentRunningNumber) => (
                <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                    <Edit2 className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                </Button>
            ),
            className: 'w-16'
        }
    ]

    return (
        <AdminPageLayout
            title="Reference Numbers"
            description="Manage running numbers for Memos and Official Letters"
            icon={Hash}
            breadcrumbs={[{ label: 'System' }, { label: 'Running Numbers' }]}
            actions={
                <Button onClick={() => startEdit()} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Configuration
                </Button>
            }
        >
            <div className="space-y-6">
                <AdminStatsGrid stats={stats} isLoading={loading} />

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-semibold text-slate-700">Configurations</h3>
                    </div>
                    <div className="relative">
                        {loading && <LoadingOverlay message="Loading configurations..." />}
                        <Table
                            data={configs}
                            columns={columns}
                            isLoading={loading}
                            emptyMessage="No running number configurations found."
                        />
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!isEditing}
                onClose={() => setIsEditing(null)}
                title={isEditing === 'new' ? 'New Configuration' : 'Edit Configuration'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Type</label>
                        <select
                            className="w-full border-slate-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'memo' | 'letter' })}
                            disabled={isEditing !== 'new'}
                        >
                            <option value="memo">Memo Dalaman</option>
                            <option value="letter">Surat Rasmi</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Prefix Format</label>
                        <Input
                            value={editForm.prefix}
                            onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                            placeholder="e.g. HLWS 600-15/1/2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Example Output: <span className="font-mono">{editForm.prefix || '...'}({(editForm.current_sequence || 0) + 1})</span>
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Current Sequence</label>
                        <Input
                            type="number"
                            value={editForm.current_sequence}
                            onChange={(e) => setEditForm({ ...editForm, current_sequence: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-rose-500 mt-1">
                            Warning: Changing this manually may cause duplicate numbers.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsEditing(null)}>Cancel</Button>
                        <Button onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminPageLayout>
    )
}

export default RunningNumberPage
