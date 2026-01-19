/**
 * Approval Workflow Management Page
 * Configure approval workflows with conditions and multi-step approvers
 */

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllWorkflows,
    getAllActionTypes,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    saveCompleteWorkflow,
} from '@/services/approvalService';
import type { ApprovalWorkflow, ApprovalCondition, ApprovalWorkflowStep } from '@/types/rbac.types';
import { CONDITION_OPERATORS, CONDITION_OPERATOR_LABELS } from '@/constants/permissions';

export default function WorkflowManagementPage() {
    const queryClient = useQueryClient();
    const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Fetch workflows and action types
    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: getAllWorkflows,
    });

    const { data: actionTypes = [] } = useQuery({
        queryKey: ['action-types'],
        queryFn: getAllActionTypes,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteWorkflow,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });

    // Toggle active status
    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            updateWorkflow(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Approval Workflow Management</h1>
                    <p className="text-gray-600">Configure dynamic approval workflows with conditions</p>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" />
                    New Workflow
                </button>
            </div>

            {/* Workflows List */}
            <div className="grid gap-4">
                {workflows.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                        <p>No approval workflows configured.</p>
                        <p className="text-sm mt-2">Click "New Workflow" to create your first workflow.</p>
                    </div>
                ) : (
                    workflows.map((workflow: ApprovalWorkflow) => (
                        <div key={workflow.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{workflow.workflow_name}</h3>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${workflow.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {workflow.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    {workflow.description && (
                                        <p className="text-gray-600 text-sm">{workflow.description}</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            toggleActiveMutation.mutate({
                                                id: workflow.id,
                                                is_active: !workflow.is_active,
                                            })
                                        }
                                        className="p-2 hover:bg-gray-100 rounded"
                                        title={workflow.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {workflow.is_active ? (
                                            <Pause className="w-5 h-5 text-orange-600" />
                                        ) : (
                                            <Play className="w-5 h-5 text-green-600" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setEditingWorkflow(workflow)}
                                        className="p-2 hover:bg-gray-100 rounded"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete workflow "${workflow.workflow_name}"?`)) {
                                                deleteMutation.mutate(workflow.id);
                                            }
                                        }}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Conditions Summary */}
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Triggers When:</p>
                                <div className="text-sm text-gray-600">
                                    {/* This would show conditions - simplified for brevity */}
                                    <p>Conditions are configured in the workflow</p>
                                </div>
                            </div>

                            {/* Steps Summary */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Approval Steps:</p>
                                <div className="flex gap-2">
                                    {/* This would show approval steps - simplified for brevity */}
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                                        Multi-step approval configured
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Form Dialog - Simplified placeholder */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Create Approval Workflow</h2>
                        <p className="text-gray-600">
                            Full workflow editor with condition builder and step configuration would be implemented
                            here.
                        </p>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Save Workflow
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
