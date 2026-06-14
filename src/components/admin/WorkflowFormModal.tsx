import React, { useState, useEffect } from 'react';
import { Save, Layers, GitMerge, ListOrdered, Eye, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { ConditionBuilder } from './ConditionBuilder';
import { ApprovalStepsBuilder } from './ApprovalStepsBuilder';
import { getAllActionTypes, upsertWorkflowWithStepsAndConditions } from '../../services/approvalService';
import { getAllRoles } from '../../services/roleService';
import { getAllDepartments } from '../../services/departmentService';
import { getUsers } from '../../services/userService';
import type {
    ApprovalWorkflowWithDetails,
    ActionType,
    WorkflowFormData
} from '../../types/rbac.types';
import { useToast } from '../../stores/toastStore';

interface WorkflowFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    workflow?: ApprovalWorkflowWithDetails | null;
}

type TabType = 'general' | 'conditions' | 'steps' | 'preview';

export function WorkflowFormModal({ isOpen, onClose, onSuccess, workflow }: WorkflowFormModalProps) {
    const { success, error: toastError } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [isLoading, setIsLoading] = useState(false);
    const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [formData, setFormData] = useState<WorkflowFormData>({
        workflow_name: '',
        action_type_id: '',
        description: '',
        is_active: true,
        conditions: [],
        steps: [],
    });

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
            if (workflow) {
                setFormData({
                    workflow_name: workflow.workflow_name,
                    action_type_id: workflow.action_type_id,
                    description: workflow.description || '',
                    is_active: workflow.is_active,
                    conditions: workflow.conditions.map(c => ({
                        field_name: c.field_name,
                        operator: c.operator,
                        field_value: c.field_value
                    })),
                    steps: workflow.steps.map(s => ({
                        step_order: s.step_order,
                        approver_role_id: s.approver_role_id || undefined,
                        approver_department_id: s.approver_department_id || undefined,
                        approver_user_id: s.approver_user_id || undefined,
                        is_requester_department: s.is_requester_department || false,
                        is_required: s.is_required,
                        can_reject: s.can_reject
                    })),
                });
            } else {
                setFormData({
                    workflow_name: '',
                    action_type_id: '',
                    description: '',
                    is_active: true,
                    conditions: [],
                    steps: [],
                });
            }
            setActiveTab('general');
        }
    }, [isOpen, workflow]);

    const fetchDependencies = async () => {
        try {
            const [types, fetchedRoles, fetchedDepts, fetchedUsers] = await Promise.all([
                getAllActionTypes(),
                getAllRoles(),
                getAllDepartments(),
                getUsers()
            ]);
            setActionTypes(types);
            setRoles(fetchedRoles);
            setDepartments(fetchedDepts || []);
            setUsers(fetchedUsers.data || []);
        } catch (error) {
            console.error('Error fetching dependencies:', error);
            toastError('Failed to load form dependencies');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.workflow_name || !formData.action_type_id) {
            toastError('Please fill in all required fields');
            return;
        }

        if (formData.steps.length === 0) {
            toastError('At least one approval step is required');
            return;
        }

        setIsLoading(true);
        try {
            await upsertWorkflowWithStepsAndConditions(
                {
                    id: workflow?.id, // If ID exists, it updates
                    workflow_name: formData.workflow_name,
                    action_type_id: formData.action_type_id,
                    description: formData.description,
                    is_active: formData.is_active,
                },
                formData.conditions,
                formData.steps
            );

            success(workflow ? 'Workflow updated successfully' : 'Workflow created successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving workflow:', error);
            toastError('Failed to save workflow');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General Info', icon: Layers },
        { id: 'conditions', label: 'Conditions', icon: GitMerge },
        { id: 'steps', label: 'Approval Steps', icon: ListOrdered },
        { id: 'preview', label: 'Preview', icon: Eye },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={workflow ? 'Edit Workflow' : 'Create New Workflow'}
            size="xl"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Tabs Header */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                                    ${isActive
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <form id="workflow-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Workflow Name <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={formData.workflow_name}
                                                onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                                                placeholder="e.g. Standard Purchase Order Approval"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Action Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.action_type_id}
                                                onChange={(e) => setFormData({ ...formData, action_type_id: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Select an action trigger...</option>
                                                {/* Group and display all available action types by module */}
                                                {Array.from(new Set(actionTypes.map(t => t.module || 'Other'))).sort().map(module => (
                                                    <optgroup key={module} label={`${module.charAt(0).toUpperCase() + module.slice(1)} Module`}>
                                                        {actionTypes
                                                            .filter(t => (t.module || 'Other') === module)
                                                            .map(type => (
                                                                <option key={type.id} value={type.id}>{type.type_name}</option>
                                                            ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {actionTypes.find(t => t.id === formData.action_type_id)?.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Description
                                            </label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Briefly describe when this workflow applies..."
                                                rows={4}
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <Switch
                                                checked={formData.is_active}
                                                onChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">Active Status</span>
                                                <p className="text-xs text-slate-500">Enable or disable this workflow instantly</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONDITIONS TAB */}
                        {activeTab === 'conditions' && (
                            <div className="animate-fadeIn">
                                <ConditionBuilder
                                    conditions={formData.conditions}
                                    onChange={(conditions) => setFormData({ ...formData, conditions })}
                                    departments={departments}
                                />
                            </div>
                        )}

                        {/* STEPS TAB */}
                        {activeTab === 'steps' && (
                            <div className="animate-fadeIn">
                                <ApprovalStepsBuilder
                                    steps={formData.steps}
                                    onChange={(steps) => setFormData({ ...formData, steps })}
                                    roles={roles}
                                    departments={departments}
                                    users={users}
                                />
                            </div>
                        )}

                        {/* PREVIEW TAB */}
                        {activeTab === 'preview' && (
                            <div className="animate-fadeIn space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {formData.workflow_name || 'Untitled Workflow'}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {actionTypes.find(t => t.id === formData.action_type_id)?.type_name || 'No Action Selected'}
                                            </p>
                                        </div>
                                        <div className={`ml-auto px-3 py-1 text-xs font-bold rounded-full ${formData.is_active
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            {formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </div>
                                    </div>

                                    {/* Flow Visualization */}
                                    <div className="relative">
                                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                                        <div className="space-y-6 relative z-10">
                                            {/* Start Node */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg ring-4 ring-green-50 dark:ring-green-900/20">
                                                    <CheckCircle className="w-6 h-6" />
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-medium">
                                                    Request Submitted
                                                    {formData.conditions.length > 0 && (
                                                        <div className="mt-1 text-xs text-slate-500 font-normal">
                                                            Matching {formData.conditions.length} condition(s)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Steps */}
                                            {formData.steps.map((step: { step_order: number; approver_role_id?: string; approver_department_id?: string; approver_user_id?: string; is_required: boolean; can_reject: boolean }, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 border-2 border-blue-500 text-blue-500 rounded-full shadow-sm z-10 font-bold">
                                                        {step.step_order}
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {step.approver_role_id ? roles.find(r => r.id === step.approver_role_id)?.role_name :
                                                                step.approver_department_id ? departments.find(d => d.id === step.approver_department_id)?.department_name :
                                                                    step.approver_user_id ? users.find(u => u.id === step.approver_user_id)?.full_name : 'Unknown Approver'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                                            {step.is_required && <span className="text-red-500 flex items-center">Required</span>}
                                                            {step.can_reject && <span className="text-slate-400">Can Reject</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* End Node */}
                                            {formData.steps.length > 0 && (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white dark:bg-slate-700 rounded-full">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-sm text-slate-500 font-medium">
                                                        Workflow Complete
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="workflow-form"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Save Workflow
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
