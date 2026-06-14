'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDepartmentRequests, getVarianceReports, updateRequestStatus } from '@/features/pharmacy-logistics/services/dataStore';
import { DepartmentRequest, RequestPriority, RequestStatus } from '@/features/pharmacy-logistics/types/RequestWorkflow';
import ReviewModal from '@/components/ReviewModal';
import PhysicalIssuanceModal from '@/components/PhysicalIssuanceModal';
import ManualIssuanceModal from '@/components/ManualIssuanceModal';

export default function IssuingPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [requests, setRequests] = useState<DepartmentRequest[]>([]);
  const [allVariance, setAllVariance] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'log' | 'variance'>('log');
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    status: RequestStatus | null;
  }>({ isOpen: false, status: null });
  
  const [issuanceModal, setIssuanceModal] = useState<{
    isOpen: boolean;
    request: DepartmentRequest | null;
  }>({ isOpen: false, request: null });

  const [manualIssuanceModal, setManualIssuanceModal] = useState<{
    isOpen: boolean;
    prefillItem?: {
      itemName: string;
      drugCode: string;
      category: string;
      quantity: number;
      batchNumber: string;
      expiryDate: string;
      unitCost: number;
      priority: string;
    };
    bulkItems?: any[];
  }>({ isOpen: false });

  // Compact toolbar state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | 'ALL'>('ALL');
  
  // Variance report filters
  const [varianceStatusFilter, setVarianceStatusFilter] = useState<'ALL' | 'Solved' | 'Pending' | 'Rejected'>('ALL');
  const [varianceDeptFilter, setVarianceDeptFilter] = useState<string | 'ALL'>('ALL');
  
  // Filtered variance reports
  const filteredVariance = useMemo(() => {
    return allVariance.filter((variance, originalIndex) => {
      // Get the request to access department
      const request = requests.find(req => req.id === variance.requestId);
      const department = request?.department || 'Unknown';
      
      // Determine status based on original index in allVariance array
      const statusOptions = ['Solved', 'Pending', 'Rejected'];
      const status = statusOptions[originalIndex % statusOptions.length];
      
      // Apply filters
      if (varianceStatusFilter !== 'ALL' && status !== varianceStatusFilter) return false;
      if (varianceDeptFilter !== 'ALL' && department !== varianceDeptFilter) return false;
      
      return true;
    });
  }, [allVariance, varianceStatusFilter, varianceDeptFilter, requests]);

  useEffect(() => {
    setIsClient(true);
    const all = getDepartmentRequests();
    const variance = getVarianceReports();
    setRequests(all);
    setAllVariance(variance);

    // Check for prefill parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle bulk items
    if (urlParams.get('bulkItems')) {
      try {
        const bulkItemsJson = decodeURIComponent(urlParams.get('bulkItems') || '');
        const bulkItems = JSON.parse(bulkItemsJson);
        if (bulkItems && bulkItems.length > 0) {
          setManualIssuanceModal({ isOpen: true, bulkItems });
        }
      } catch (error) {
        console.error('Error parsing bulk items:', error);
      }
    }
    // Handle single item prefill (legacy support)
    else if (urlParams.get('prefillItem') === 'true') {
      const prefillItem = {
        itemName: urlParams.get('itemName') || '',
        drugCode: urlParams.get('drugCode') || '',
        category: urlParams.get('category') || '',
        quantity: parseInt(urlParams.get('quantity') || '1'),
        batchNumber: urlParams.get('batchNumber') || '',
        expiryDate: urlParams.get('expiryDate') || '',
        unitCost: parseFloat(urlParams.get('unitCost') || '0'),
        priority: urlParams.get('priority') || 'MEDIUM'
      };
      
      // Only open modal if we have valid item data
      if (prefillItem.itemName && prefillItem.drugCode) {
        setManualIssuanceModal({ isOpen: true, prefillItem });
      }
    }
  }, []);

  const handleRequestSelect = (request: DepartmentRequest) => {
    // Navigate to the detail page instead of opening slide-over
    router.push(`/issuing/${request.id}`);
  };

  const handleKpiCardClick = (status: RequestStatus) => {
    if (status === 'APPROVED') {
      // For approved requests, open physical issuance modal with all requests
      setIssuanceModal({ isOpen: true, request: null });
    } else {
      setReviewModal({ isOpen: true, status });
    }
  };

  const handleUpdateRequest = (requestId: string, updates: Partial<DepartmentRequest>) => {
    const success = updateRequestStatus(requestId, updates.status!);
    if (success) {
      const all = getDepartmentRequests();
      const variance = getVarianceReports();
      setRequests(all);
      setAllVariance(variance);
    }
  };

  const handleCloseReviewModal = () => {
    setReviewModal({ isOpen: false, status: null });
  };

  const handleCloseIssuanceModal = () => {
    setIssuanceModal({ isOpen: false, request: null });
  };

  const handleIssueComplete = (requestId: string, issuedItems: any[]) => {
    // Update request status to ISSUED
    const success = updateRequestStatus(requestId, 'ISSUED');
    if (success) {
      const all = getDepartmentRequests();
      const variance = getVarianceReports();
      setRequests(all);
      setAllVariance(variance);
    }
    setIssuanceModal({ isOpen: false, request: null });
  };

  const handleManualIssuance = () => {
    setManualIssuanceModal({ isOpen: true });
  };

  const handleCloseManualIssuance = () => {
    setManualIssuanceModal({ isOpen: false, prefillItem: undefined, bulkItems: undefined });
  };


  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(r => {
      // Only show completed/rejected requests in the main list
      if (r.status !== 'ISSUED' && r.status !== 'REJECTED') return false;
      
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (deptFilter !== 'ALL' && r.department !== deptFilter) return false;
      if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
      if (q) {
        const m = r.requestNumber.toLowerCase().includes(q)
          || r.department.toLowerCase().includes(q)
          || r.requestedBy.toLowerCase().includes(q)
          || r.items.some(it => it.itemName.toLowerCase().includes(q) || it.drugCode.toLowerCase().includes(q));
        if (!m) return false;
      }
      return true;
    });
  }, [requests, statusFilter, deptFilter, priorityFilter, search]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 backdrop-blur-md shadow-lg">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
          </div>
          <div className="relative px-6 py-6 md:px-8 md:py-7 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 border border-cyan-200">MyWarrant</div>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-cyan-900 to-indigo-900 bg-clip-text text-transparent truncate">Issuing</h1>
              <p className="mt-1 text-sm text-slate-600 truncate">Manage department requests, approvals, and item issuance</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleManualIssuance}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-cyan-600 text-white shadow-sm hover:shadow-md hover:bg-cyan-700 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                New Request
              </button>
              <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white shadow-sm hover:shadow-md hover:bg-slate-800 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 12h8"/></svg>
                Export
              </button>
            </div>
          </div>
      </div>

        {/* KPI Summary */}
        {(() => {
          const pendingReview = requests.filter(r => r.status === 'PENDING_REVIEW').length;
          const pendingApproval = requests.filter(r => r.status === 'PENDING_APPROVAL').length;
            const approvedForIssue = requests.filter(r => r.status === 'APPROVED').length;
            const issued = requests.filter(r => r.status === 'ISSUED').length;
          const card = (label: string, value: number, gradient: string, icon: React.ReactNode, status: RequestStatus) => (
            <button
              onClick={() => handleKpiCardClick(status)}
              className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] w-full text-left overflow-hidden"
            >
              {/* Live Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              
              <div className="p-6">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {icon}
                </div>
                
                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {label}
                  </h3>
                  <div className="text-3xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                    {value}
                  </div>
                  <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                    Click to review
                  </p>
                </div>
            </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50/0 to-slate-50/0 group-hover:from-slate-50/50 group-hover:to-slate-50/30 transition-all duration-200 pointer-events-none"></div>
            </button>
          );
          return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {card('Pending Review', pendingReview, 'bg-gradient-to-br from-blue-500 to-purple-600', (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v8m-4-4h8"/></svg>
                ), 'PENDING_REVIEW')}
                {card('Pending Approval', pendingApproval, 'bg-gradient-to-br from-blue-500 to-purple-600', (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/></svg>
                ), 'PENDING_APPROVAL')}
                {card('Issued', issued, 'bg-gradient-to-br from-blue-500 to-purple-600', (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ), 'ISSUED')}
                {card('Ready to Issue', approvedForIssue, 'bg-gradient-to-br from-blue-500 to-purple-600', (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ), 'APPROVED')}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="sticky top-0 z-10">
          <div className="inline-flex rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-colors ${activeTab === 'log' ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Request Log
            </button>
            <button
              onClick={() => setActiveTab('variance')}
              className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-colors ${activeTab === 'variance' ? 'bg-cyan-600 text-white' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Variance Report
            </button>
          </div>
      </div>

        {/* Toolbar (only for Request Log) */}
        {activeTab === 'log' && (
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm p-3 flex flex-wrap gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests, items, departments…"
            className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-200/70 bg-white focus:ring-4 focus:ring-cyan-100 focus:border-cyan-300"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-xl border border-slate-200/70 bg-white">
            <option value="ALL">All Status</option>
            <option value="ISSUED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value as any)} className="px-3 py-2 rounded-xl border border-slate-200/70 bg-white">
            <option value="ALL">All Departments</option>
            <option value="ETU">ETU</option>
            <option value="GW">GW</option>
            <option value="OT">OT</option>
            <option value="HDU">HDU</option>
            <option value="ICU">ICU</option>
            <option value="WARD_A">Ward A</option>
            <option value="WARD_B">Ward B</option>
            <option value="WARD_C">Ward C</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} className="px-3 py-2 rounded-xl border border-slate-200/70 bg-white">
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
              </select>
            </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 gap-4">
          {/* Request list (single column) or Variance list */}
          <div>
            {activeTab === 'log' ? (
              <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/60 bg-gradient-to-r from-slate-50/50 to-cyan-50/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Completed Requests</h3>
                    <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium">
                      {filteredRequests.length} of {requests.filter(r => r.status === 'ISSUED' || r.status === 'REJECTED').length} completed
                    </span>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-auto">
                  <div className="p-2">
                    {filteredRequests.map((req, index) => {
                const statusColor: Record<string, string> = {
                  PENDING_REVIEW: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200',
                  UNDER_REVIEW: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
                  PENDING_APPROVAL: 'bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-700 border-orange-200',
                  APPROVED: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200',
                  ISSUED: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200',
                  REJECTED: 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200',
                  CANCELLED: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200'
                };
                const nextAction: Record<string, string> = {
                  PENDING_REVIEW: 'Start Review',
                  UNDER_REVIEW: 'Send for Approval',
                  PENDING_APPROVAL: 'Approve/Reject',
                  APPROVED: 'Issue Items',
                  ISSUED: 'Completed',
                  REJECTED: 'Closed',
                  CANCELLED: 'Closed'
                };
                const priColor: Record<string, string> = {
                  LOW: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200',
                  MEDIUM: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
                  HIGH: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
                  URGENT: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
                };
                const date = new Date(req.requestedAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                   return (
                     <div
                       key={req.id}
                       className={`group relative mb-3 last:mb-0`}
                     >
                       <button
                         onClick={() => handleRequestSelect(req)}
                         className="w-full text-left p-6 rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:border-cyan-200/60 transition-all duration-300 group-hover:scale-[1.01]"
                       >
                         <div className="flex items-start justify-between gap-6">
                           <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-3 mb-3">
                               <div className="text-lg font-bold text-slate-900 truncate">{req.requestNumber}</div>
                               <span className={`text-xs px-3 py-1 rounded-full border font-medium ${priColor[req.priority]}`}>
                                 {req.priority}
                               </span>
                             </div>
                             <div className="space-y-2">
                               <div className="flex items-center gap-2 text-sm text-slate-600">
                                 <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                                 </svg>
                                 <span className="font-medium">{req.department}</span>
                                 <span className="text-slate-400">•</span>
                                 <span>{req.requestedBy}</span>
                               </div>
                               <div className="flex items-center gap-2 text-sm text-slate-500">
                                 <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                                 <span>{date}</span>
                               </div>
                               <div className="flex items-center gap-2 text-sm text-slate-500">
                                 <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                 </svg>
                                 <span>{req.items.length} items requested</span>
                               </div>
                             </div>
                           </div>
                           <div className="flex flex-col items-end gap-3 shrink-0">
                             <span className={`text-xs px-3 py-2 rounded-xl border font-medium ${statusColor[req.status]}`}>
                               {req.status.replace('_',' ')}
                             </span>
                             <div className="text-right">
                               <div className="text-sm font-medium text-slate-700 mb-1">{nextAction[req.status]}</div>
                               <div className="flex items-center gap-1 text-xs text-slate-500">
                                 <span>View Details</span>
                                 <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                 </svg>
                               </div>
                             </div>
                         </div>
                         </div>
                       </button>
                       </div>
                   );
                  })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">Variance Report</h3>
                      <p className="text-slate-600 mt-1">Issuing discrepancies and stock problems</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
                        {filteredVariance.length} variances
                      </div>
                      <div className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                        Last updated: {new Date().toLocaleDateString()}
                        </div>
                </div>
              </div>
          </div>

                {/* Variance Filters - Always Visible */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-200">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-700">Filters:</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">Status:</label>
                      <select 
                        value={varianceStatusFilter} 
                        onChange={(e) => setVarianceStatusFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="ALL">All Status</option>
                        <option value="Solved">Solved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600">Department:</label>
                      <select 
                        value={varianceDeptFilter} 
                        onChange={(e) => setVarianceDeptFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="ALL">All Departments</option>
                        {Array.from(new Set(requests.map(r => r.department))).map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Showing {filteredVariance.length} of {allVariance.length} variances</span>
                    </div>
                  </div>
                </div>

                {filteredVariance.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">No variance data available</h4>
                    <p className="text-slate-500 max-w-md mx-auto">Variances will appear here when items are issued with discrepancies between approved and actual quantities.</p>
                  </div>
                ) : (
                  <div className="p-8">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-emerald-600">Solved</p>
                            <p className="text-2xl font-bold text-emerald-700">
                              {allVariance.filter((r, originalIndex) => {
                                const statusOptions = ['Solved', 'Pending', 'Rejected'];
                                const status = statusOptions[originalIndex % statusOptions.length];
                                
                                // Get the request to access department
                                const request = requests.find(req => req.id === r.requestId);
                                const department = request?.department || 'Unknown';
                                
                                // Apply the same filters as the main filteredVariance
                                if (varianceStatusFilter !== 'ALL' && status !== varianceStatusFilter) return false;
                                if (varianceDeptFilter !== 'ALL' && department !== varianceDeptFilter) return false;
                                
                                return status === 'Solved';
                              }).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-600">Pending</p>
                            <p className="text-2xl font-bold text-amber-700">
                              {allVariance.filter((r, originalIndex) => {
                                const statusOptions = ['Solved', 'Pending', 'Rejected'];
                                const status = statusOptions[originalIndex % statusOptions.length];
                                
                                // Get the request to access department
                                const request = requests.find(req => req.id === r.requestId);
                                const department = request?.department || 'Unknown';
                                
                                // Apply the same filters as the main filteredVariance
                                if (varianceStatusFilter !== 'ALL' && status !== varianceStatusFilter) return false;
                                if (varianceDeptFilter !== 'ALL' && department !== varianceDeptFilter) return false;
                                
                                return status === 'Pending';
                              }).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-rose-600">Rejected</p>
                            <p className="text-2xl font-bold text-rose-700">
                              {allVariance.filter((r, originalIndex) => {
                                const statusOptions = ['Solved', 'Pending', 'Rejected'];
                                const status = statusOptions[originalIndex % statusOptions.length];
                                
                                // Get the request to access department
                                const request = requests.find(req => req.id === r.requestId);
                                const department = request?.department || 'Unknown';
                                
                                // Apply the same filters as the main filteredVariance
                                if (varianceStatusFilter !== 'ALL' && status !== varianceStatusFilter) return false;
                                if (varianceDeptFilter !== 'ALL' && department !== varianceDeptFilter) return false;
                                
                                return status === 'Rejected';
                              }).length}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Total Variances</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {filteredVariance.length}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Variance Cards */}
                    <div className="space-y-4">
                      {filteredVariance.map((r, filteredIndex) => {
                        // Find the original index in allVariance array
                        const originalIndex = allVariance.findIndex(v => v.id === r.id);
                        const request = requests.find(req => req.id === r.requestId);
                        const department = request?.department || 'Unknown';
                        const requesterName = request?.requestedBy || 'Unknown';
                        const action = r.variance > 0 ? 'Shortage' : r.variance < 0 ? 'Surplus' : 'Exact';
                        
                        // Status options: solve/pending/rejected only
                        // Use original index-based assignment to ensure consistent distribution
                        const statusOptions = ['Solved', 'Pending', 'Rejected'];
                        const status = statusOptions[originalIndex % statusOptions.length];
                        
                        // Mock staff who issued the items
                        const issuedByOptions = ['Dr. Sarah Ahmad', 'Nurse John Lim', 'Pharm. Maria Tan', 'Tech. Ahmad Rahman', 'Dr. Lisa Wong'];
                        const issuedBy = issuedByOptions[Math.floor(Math.random() * issuedByOptions.length)];
                        
                        // Format the date and time
                        const varianceDate = new Date(r.createdAt);
                        const formattedDate = varianceDate.toLocaleDateString('en-MY', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        });
                        const formattedTime = varianceDate.toLocaleTimeString('en-MY', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        
                        return (
                          <div key={r.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                  </div>
                                <div>
                                  <h4 className="font-semibold text-slate-800 text-lg">{r.itemName}</h4>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-sm text-slate-600">{department}</span>
                                    <span className="text-sm text-slate-500">•</span>
                                    <span className="text-sm font-medium text-slate-700">{r.requestId}</span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="text-xs text-slate-500">Requested by: <span className="font-medium text-slate-700">{requesterName}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-xs text-slate-500">{formattedDate} at {formattedTime}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-xs text-slate-500">Issued by: <span className="font-medium text-slate-700">{issuedBy}</span></span>
                                  </div>
                                </div>
                      </div>
                              
                              <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  action === 'Shortage' ? 'bg-red-100 text-red-700' : 
                                  action === 'Surplus' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {action}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  status === 'Solved' ? 'bg-emerald-100 text-emerald-700' :
                                  status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {status}
                                </div>
                  </div>
                </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-600">Approved Quantity</p>
                                <p className="text-2xl font-bold text-slate-800">{r.approvedQuantity}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-600">Issued Quantity</p>
                                <p className="text-2xl font-bold text-slate-800">{r.issuedQuantity}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-600">Variance</p>
                                <div className="flex items-baseline gap-2">
                                  <p className={`text-2xl font-bold ${
                                    r.variance === 0 ? 'text-emerald-700' : 
                                    r.variance > 0 ? 'text-red-700' : 
                                    'text-blue-700'
                                  }`}>
                                    {r.variance > 0 ? '+' : ''}{r.variance}
                                  </p>
                                  <p className={`text-sm font-medium ${
                                    r.variance === 0 ? 'text-emerald-600' : 
                                    r.variance > 0 ? 'text-red-600' : 
                                    'text-blue-600'
                                  }`}>
                                    ({r.variancePercentage > 0 ? '+' : ''}{r.variancePercentage.toFixed(1)}%)
                                  </p>
                                </div>
                  </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-600">Reason</p>
                                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                                  {r.reason || 'No reason provided'}
                                </p>
                              </div>
                        </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
          )}
          </div>

        </div>

        {/* Review Modal */}
        {reviewModal.isOpen && reviewModal.status && (
          <ReviewModal
            isOpen={reviewModal.isOpen}
            onClose={handleCloseReviewModal}
            requests={requests}
            status={reviewModal.status}
            onUpdateRequest={handleUpdateRequest}
          />
        )}

        {/* Physical Issuance Modal */}
        {issuanceModal.isOpen && (
          <PhysicalIssuanceModal
            isOpen={issuanceModal.isOpen}
            onClose={handleCloseIssuanceModal}
            requests={requests}
            onIssueComplete={handleIssueComplete}
          />
        )}

        {/* Manual Issuance Modal */}
        {manualIssuanceModal.isOpen && (
          <ManualIssuanceModal
            isOpen={manualIssuanceModal.isOpen}
            onClose={handleCloseManualIssuance}
            prefillItem={manualIssuanceModal.prefillItem}
            bulkItems={manualIssuanceModal.bulkItems}
          />
        )}
      </div>
    </div>
  );
}