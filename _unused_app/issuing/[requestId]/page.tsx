'use client';

import { useEffect, useState, use } from 'react';
import { getDepartmentRequests } from '@/features/pharmacy-logistics/services/dataStore';
import { DepartmentRequest } from '@/features/pharmacy-logistics/types/RequestWorkflow';
import Link from 'next/link';
// Using inline SVG icons instead of Heroicons

type RequestDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const [request, setRequest] = useState<DepartmentRequest | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    setIsClient(true);
    const requests = getDepartmentRequests();
    const foundRequest = requests.find(r => r.id === resolvedParams.requestId);
    setRequest(foundRequest || null);
  }, [resolvedParams.requestId]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Request Not Found</h1>
          <p className="text-slate-600 mb-6">The request you're looking for doesn't exist.</p>
          <Link href="/issuing" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Issuing
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Medium
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            Urgent
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Pending Review
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg> Under Review
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Pending Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Approved
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Issued
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const date = new Date(request.requestedAt).toLocaleString('en-MY', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 backdrop-blur-md shadow-lg">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
          </div>
          <div className="relative px-6 py-6 md:px-8 md:py-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Link 
                    href="/issuing" 
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                  >
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 border border-cyan-200">
                    Request Details
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-cyan-900 to-indigo-900 bg-clip-text text-transparent truncate">
                  {request.requestNumber}
                </h1>
                <p className="mt-1 text-sm text-slate-600 truncate">
                  {request.department} • {request.requestedBy} • {date}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {getStatusBadge(request.status)}
                {getPriorityBadge(request.priority)}
              </div>
            </div>
          </div>
        </div>

        {/* Request Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
                  </svg>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200">Live</span>
              </div>
              <div className="text-xs text-slate-600">Department</div>
              <div className="mt-1 text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{request.department}</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-green-500 to-emerald-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200">Live</span>
              </div>
              <div className="text-xs text-slate-600">Requester</div>
              <div className="mt-1 text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{request.requestedBy}</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-purple-500 to-pink-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200">Live</span>
              </div>
              <div className="text-xs text-slate-600">Requested Items</div>
              <div className="mt-1 text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{request.items.length}</div>
            </div>
          </div>
        </div>

        {/* Request Items Table */}
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="px-6 py-4 border-b border-white/60">
            <h2 className="text-xl font-bold text-slate-800">Requested Items ({request.items.length})</h2>
            <p className="text-sm text-slate-600 mt-1">Complete list of items requested by {request.department}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/70">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Drug Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Dosage Form
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Requested Qty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Approved Qty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/70">
                {request.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{item.itemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{item.drugCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{item.dosageForm}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{item.requestedQuantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">
                        {item.approvedQuantity ? item.approvedQuantity : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{item.unit}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rejection Reason Section */}
        {request.status === 'REJECTED' && request.rejectionReason && (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 backdrop-blur-md shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800">Rejection Reason</h3>
            </div>
            <div className="p-4 bg-white/70 rounded-xl border border-red-200/70">
              <p className="text-sm text-red-700">{request.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Notes Section */}
        {request.notes && (
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Notes</h3>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/70">
              <p className="text-sm text-slate-700">{request.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
