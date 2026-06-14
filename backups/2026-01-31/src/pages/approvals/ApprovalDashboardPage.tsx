/**
 * Approval Dashboard Page
 * View and manage approval requests (Pending My Approval, My Requests, All Requests)
 */

import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
    getPendingApprovalsForStaff,
    getMyRequests,
    getApprovalRequests,
    approveRequest,
    rejectRequest,
    cancelRequest,
} from '@/services/approvalService';
import { useIsAdmin } from '@/hooks/usePermission';
import { format } from 'date-fns';

type Tab = 'pending' | 'my-requests' | 'all';

export default function ApprovalDashboardPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = useIsAdmin();
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    // Fetch pending approvals
    const { data: pendingApprovals = [], isLoading: loadingPending } = useQuery({
        queryKey: ['pending-approvals', user?.id],
        queryFn: () => getPendingApprovalsForStaff(user!.id),
        enabled: !!user && activeTab === 'pending',
    });

    // Fetch my requests
    const { data: myRequests = [], isLoading: loadingMine } = useQuery({
        queryKey: ['my-requests', user?.id],
        queryFn: () => getMyRequests(user!.id),
        enabled: !!user && activeTab === 'my-requests',
    });

    // Fetch all requests (admin only)
    const { data: allRequests = [], isLoading: loadingAll } = useQuery({
        queryKey: ['all-requests'],
        queryFn: () => getApprovalRequests({}),
        enabled: isAdmin && activeTab === 'all',
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: ({ requestId, comments }: { requestId: string; comments?: string }) =>
            approveRequest(requestId, user!.id, comments),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            setSelectedRequest(null);
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: ({ requestId, comments }: { requestId: string; comments?: string }) =>
            rejectRequest(requestId, user!.id, comments),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            setSelectedRequest(null);
        },
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const isLoading = loadingPending || loadingMine || loadingAll;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Approval Dashboard</h1>
                <p className="text-gray-600">Manage approval requests and track their status</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'pending'
                            ? 'border-blue-600 text-blue-600 font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Pending My Approval
                    {pendingApprovals.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                            {pendingApprovals.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('my-requests')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'my-requests'
                            ? 'border-blue-600 text-blue-600 font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                >
                    My Requests
                </button>

                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'all'
                                ? 'border-blue-600 text-blue-600 font-medium'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        All Requests
                    </button>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : (
                <>
                    {/* Pending Approvals Tab */}
                    {activeTab === 'pending' && (
                        <div className="space-y-4">
                            {pendingApprovals.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>No pending approvals</p>
                                    <p className="text-sm mt-2">You're all caught up!</p>
                                </div>
                            ) : (
                                pendingApprovals.map((request: any) => (
                                    <div key={request.request_id} className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold">{request.workflow_name}</h3>
                                                    <span className="text-sm text-gray-500">
                                                        Step {request.step_order}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Requested by: <span className="font-medium">{request.requester_name}</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(request.created_at), 'PPpp')}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => setSelectedRequest(request)}
                                                className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() =>
                                                    approveMutation.mutate({
                                                        requestId: request.request_id,
                                                    })
                                                }
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                <CheckCircle className="w-4 h-4 inline mr-2" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setSelectedRequest(request)}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                <XCircle className="w-4 h-4 inline mr-2" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* My Requests Tab */}
                    {activeTab === 'my-requests' && (
                        <div className="bg-white rounded-lg shadow divide-y">
                            {myRequests.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <p>No approval requests submitted</p>
                                </div>
                            ) : (
                                myRequests.map((request: any) => (
                                    <div key={request.id} className="p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium">{request.workflow?.workflow_name}</p>
                                            <p className="text-sm text-gray-500">
                                                Step {request.current_step} • {format(new Date(request.created_at), 'PP')}
                                            </p>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* All Requests Tab (Admin) */}
                    {activeTab === 'all' && isAdmin && (
                        <div className="bg-white rounded-lg shadow divide-y">
                            {allRequests.map((request: any) => (
                                <div key={request.id} className="p-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium">{request.workflow?.workflow_name}</p>
                                        <p className="text-sm text-gray-500">
                                            {request.requester?.full_name} • {format(new Date(request.created_at), 'PP')}
                                        </p>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
