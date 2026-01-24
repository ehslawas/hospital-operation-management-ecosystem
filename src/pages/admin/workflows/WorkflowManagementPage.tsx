import React, { useState } from 'react';
import { Plus, Trash2, Play, Pause, Layers, GitMerge, Building, Pill } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getWorkflowsWithDetails,
    updateWorkflow,
    deleteWorkflow,
} from '@/services/approvalService';
import { WorkflowFormModal } from '@/components/admin/WorkflowFormModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toastStore';
import type { ApprovalWorkflowWithDetails } from '@/types/rbac.types';

export default function WorkflowManagementPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflowWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterModule, setFilterModule] = useState<string>('all');

    // Fetch workflows
    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: getWorkflowsWithDetails,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            success('Workflow deleted successfully');
        },
        onError: () => toastError('Failed to delete workflow'),
    });

    // Toggle active status
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            updateWorkflow(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            success('Workflow status updated');
        },
        onError: () => toastError('Failed to update status'),
    });

    const handleCreate = () => {
        setEditingWorkflow(null);
        setIsModalOpen(true);
    };

    const handleEdit = (workflow: ApprovalWorkflowWithDetails) => {
        setEditingWorkflow(workflow);
        setIsModalOpen(true);
    };

    const handleDelete = (workflow: ApprovalWorkflowWithDetails) => {
        if (confirm(`Are you sure you want to delete workflow "${workflow.workflow_name}"? This cannot be undone.`)) {
            deleteMutation.mutate(workflow.id);
        }
    };

    const filteredWorkflows = workflows.filter(w => {
        if (filterModule === 'all') return true;
        return w.action_type.module === filterModule;
    });

    const stats = {
        total: workflows.length,
        active: workflows.filter(w => w.is_active).length,
        avgSteps: workflows.length ? Math.round(workflows.reduce((acc, w) => acc + w.steps.length, 0) / workflows.length) : 0
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                        Approval Workflows
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage and configure multi-step approval chains
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="hidden md:flex gap-4 mr-4">
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Active</span>
                        </div>
                        <div className="w-px bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgSteps}</span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Avg Stages</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Workflow
                    </Button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                <button
                    onClick={() => setFilterModule('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filterModule === 'all'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    All Modules
                </button>
                <button
                    onClick={() => setFilterModule('pharmacy')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filterModule === 'pharmacy'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <Pill className="w-4 h-4 mr-2" />
                    Pharmacy
                </button>
                <button
                    onClick={() => setFilterModule('admin')}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filterModule === 'admin'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    <Building className="w-4 h-4 mr-2" />
                    Admin
                </button>
            </div>

            {/* Workflows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWorkflows.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                            <Layers className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No workflows found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            {filterModule !== 'all' ? `No workflows configured for ${filterModule} module yet.` : 'Get started by creating your first approval workflow.'}
                        </p>
                        <Button variant="outline" onClick={handleCreate}>
                            Create New Workflow
                        </Button>
                    </div>
                ) : (
                    filteredWorkflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Decorative gradient border top */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${workflow.is_active ? 'from-blue-500 to-indigo-500' : 'from-slate-300 to-slate-400'
                                }`} />

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${workflow.action_type.module === 'pharmacy'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                }`}>
                                                {workflow.action_type.module}
                                            </span>
                                            {workflow.conditions.length > 0 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <GitMerge className="w-3 h-3 mr-1" />
                                                    Conditional
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                                            {workflow.workflow_name}
                                        </h3>
                                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                            Trigger: <span className="font-medium text-slate-700 dark:text-slate-300">{workflow.action_type.type_name}</span>
                                        </div>
                                    </div>

                                    <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 ${!workflow.is_active && 'opacity-50 grayscale'}`}>
                                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                            {workflow.steps.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Flow Visualization (Mini) */}
                                <div className="flex items-center gap-1 mb-6 overflow-hidden">
                                    {workflow.steps.slice(0, 4).map((step, idx) => (
                                        <React.Fragment key={step.id}>
                                            <div
                                                className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
                                                title={`Step ${step.step_order}`}
                                            >
                                                {step.step_order}
                                            </div>
                                            {idx < Math.min(workflow.steps.length, 4) - 1 && (
                                                <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {workflow.steps.length > 4 && (
                                        <div className="ml-1 text-xs text-slate-400">+{workflow.steps.length - 4}</div>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActiveMutation.mutate({ id: workflow.id, is_active: !workflow.is_active })}
                                            className={`p-1.5 rounded-md transition-colors ${workflow.is_active
                                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            title={workflow.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(workflow)}
                                            className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            Edit
                                        </Button>
                                        <button
                                            onClick={() => handleDelete(workflow)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <WorkflowFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['workflows'] });
                }}
                workflow={editingWorkflow}
            />
        </div>
    );
}
