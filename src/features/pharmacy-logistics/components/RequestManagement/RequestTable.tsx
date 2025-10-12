'use client';

import { useState } from 'react';
import { DepartmentRequest, RequestStatus, Department, RequestPriority } from '../../types/RequestWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RequestTableProps {
  requests: DepartmentRequest[];
  onRequestSelect: (request: DepartmentRequest) => void;
  onStatusUpdate: (requestId: string, status: RequestStatus) => void;
}

export function RequestTable({ requests, onRequestSelect, onStatusUpdate }: RequestTableProps) {
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const getStatusBadge = (status: RequestStatus) => {
    const statusConfig = {
      PENDING_REVIEW: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800' },
      UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-100 text-blue-800' },
      PENDING_APPROVAL: { label: 'Pending Approval', className: 'bg-orange-100 text-orange-800' },
      APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      ISSUED: { label: 'Issued', className: 'bg-emerald-100 text-emerald-800' },
      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: RequestPriority) => {
    const priorityConfig = {
      LOW: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
      MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
      HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getDepartmentLabel = (department: Department) => {
    const departmentLabels = {
      ETU: 'Emergency Treatment Unit',
      GW: 'General Ward',
      OT: 'Operating Theatre',
      HDU: 'High Dependency Unit',
      ICU: 'Intensive Care Unit',
      WARD_A: 'Ward A',
      WARD_B: 'Ward B',
      WARD_C: 'Ward C',
      EMERGENCY: 'Emergency',
      PHARMACY: 'Pharmacy'
    };
    return departmentLabels[department] || department;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionButtons = (request: DepartmentRequest) => {
    const buttons = [];

    switch (request.status) {
      case 'PENDING_REVIEW':
        buttons.push(
          <button
            key="review"
            onClick={() => onStatusUpdate(request.id, 'UNDER_REVIEW')}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Review
          </button>
        );
        break;
      case 'UNDER_REVIEW':
        buttons.push(
          <button
            key="approve"
            onClick={() => onStatusUpdate(request.id, 'PENDING_APPROVAL')}
            className="px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Send for Approval
          </button>
        );
        break;
      case 'PENDING_APPROVAL':
        buttons.push(
          <button
            key="approve"
            onClick={() => onStatusUpdate(request.id, 'APPROVED')}
            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
        );
        buttons.push(
          <button
            key="reject"
            onClick={() => onStatusUpdate(request.id, 'REJECTED')}
            className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        );
        break;
      case 'APPROVED':
        buttons.push(
          <button
            key="issue"
            onClick={() => onRequestSelect(request)}
            className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Issue Items
          </button>
        );
        break;
    }

    return buttons;
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 text-lg mb-2">📋</div>
          <h3 className="text-lg font-medium text-slate-600 mb-1">No requests found</h3>
          <p className="text-slate-500">No requests match your current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    {request.requestNumber}
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    {getDepartmentLabel(request.department)} • {request.requestedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {formatDate(request.requestedAt)}
                </span>
                <button
                  onClick={() => toggleExpanded(request.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {expandedRequests.has(request.id) ? '▼' : '▶'}
                </button>
              </div>
            </div>
          </CardHeader>

          {expandedRequests.has(request.id) && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Request Items */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Requested Items</h4>
                  <div className="space-y-2">
                    {request.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-800">{item.itemName}</p>
                          <p className="text-sm text-slate-600">
                            {item.drugCode} • {item.dosageForm}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-800">
                            {item.requestedQuantity} {item.unit}
                          </p>
                          {item.approvedQuantity && item.approvedQuantity !== item.requestedQuantity && (
                            <p className="text-sm text-orange-600">
                              Approved: {item.approvedQuantity} {item.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request Notes */}
                {request.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {request.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                  {getActionButtons(request)}
                  <button
                    onClick={() => onRequestSelect(request)}
                    className="px-3 py-1 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}


