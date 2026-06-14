import React, { useState, useMemo } from 'react';
import { Search, Filter, Printer, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CylinderDispatchRequestWithRelations } from '@/types/pharmacy';

interface CylinderDispatchTableProps {
  requests: CylinderDispatchRequestWithRelations[];
  departments: { id: string; department_name: string }[];
  onViewDetails: (request: CylinderDispatchRequestWithRelations) => void;
  onPrint: (request: CylinderDispatchRequestWithRelations) => void;
}

export const CylinderDispatchTable: React.FC<CylinderDispatchTableProps> = ({
  requests,
  departments,
  onViewDetails,
  onPrint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Search term (Request No, Department name, Requester name, Issuer name, Remarks)
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        req.request_number.toLowerCase().includes(searchLower) ||
        req.department?.department_name?.toLowerCase().includes(searchLower) ||
        req.requester?.full_name?.toLowerCase().includes(searchLower) ||
        req.issuer?.full_name?.toLowerCase().includes(searchLower) ||
        (req.remarks && req.remarks.toLowerCase().includes(searchLower));

      // 2. Department
      const matchDept = selectedDept === 'all' || req.department_id === selectedDept;

      // 3. Status
      const matchStatus = selectedStatus === 'all' || req.status === selectedStatus;

      // 4. Date range
      let matchDate = true;
      if (startDate) {
        matchDate = matchDate && new Date(req.request_date) >= new Date(startDate);
      }
      if (endDate) {
        // Add one day to end date to make it inclusive of that day
        const endLimit = new Date(endDate);
        endLimit.setDate(endLimit.getDate() + 1);
        matchDate = matchDate && new Date(req.request_date) < endLimit;
      }

      return matchSearch && matchDept && matchStatus && matchDate;
    });
  }, [requests, searchTerm, selectedDept, selectedStatus, startDate, endDate]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedStatus, startDate, endDate]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case 'issued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Issued
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">URGENT</span>;
      case 'emergency':
        return <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 animate-pulse">EMERGENCY</span>;
      default:
        return <span className="text-xs font-medium text-slate-500">Normal</span>;
    }
  };

  const formatItemsSummary = (items: any[] | undefined) => {
    if (!items || items.length === 0) return 'No items';
    return items.map((itm) => `${itm.quantity_requested}x ${itm.size_code}`).join(', ');
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden mt-6">
      {/* Header Filters */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Box */}
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, department, requester, issuer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved (Ready)</option>
              <option value="issued">Issued</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="flex gap-2 items-center col-span-1 md:col-span-2 lg:col-span-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-600 focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-600 focus:outline-none"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="block lg:hidden divide-y divide-slate-100">
        {paginatedRequests.length > 0 ? (
          paginatedRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => onPrint(req)}
              className="p-5 hover:bg-slate-50/40 transition-colors cursor-pointer space-y-4"
            >
              {/* Header: ID & Status */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-mono font-bold text-blue-600">
                    {req.request_number}
                  </span>
                  {req.priority && req.priority !== 'normal' && (
                    <div className="mt-0.5">{getPriorityBadge(req.priority)}</div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {new Date(req.request_date).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </span>
                  <div className="mt-1">{getStatusBadge(req.status)}</div>
                </div>
              </div>

              {/* Department */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Department</span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {req.department?.department_name || 'Pharmacy Store'}
                  </span>
                </div>
                {req.request_type === 'manual_issue' && (
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-bold uppercase tracking-wide">
                    Manual
                  </span>
                )}
              </div>

              {/* Items Summary */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Cylinders</span>
                <div className="flex flex-wrap gap-1.5">
                  {req.items && req.items.length > 0 ? (
                    req.items.map((itm, idx) => (
                      <span key={idx} className="bg-slate-50 border border-slate-200/60 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl">
                        {itm.quantity_requested}x {itm.size_code}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs">No items</span>
                  )}
                </div>
              </div>

              {/* Footer: Requester & Issuer */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Requester</span>
                  {req.requester ? (
                    <div className="mt-0.5">
                      <div className="font-semibold text-slate-700">{req.requester.full_name}</div>
                      <div className="text-[10px] text-slate-400">{req.requester.jawatan}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">Manual Issue</span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Issuer</span>
                  {req.issuer ? (
                    <div className="mt-0.5">
                      <div className="font-semibold text-slate-700">{req.issuer.full_name}</div>
                      <div className="text-[10px] text-slate-400">{req.issuer.jawatan}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic mt-0.5 block">Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            No requests found matching filters.
          </div>
        )}
      </div>

      {/* Table grid (Desktop only) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Requester</th>
              <th className="px-6 py-4">Issuer</th>
              <th className="px-6 py-4">Items Summary</th>
              <th className="px-6 py-4">Date/Time</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((req) => (
                <tr 
                  key={req.id} 
                  onClick={() => onPrint(req)}
                  className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                >
                  {/* Request ID */}
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600 hover:text-blue-800">
                      {req.request_number}
                    </span>
                    {req.priority && req.priority !== 'normal' && (
                      <div className="mt-0.5">{getPriorityBadge(req.priority)}</div>
                    )}
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">
                      {req.department?.department_name || 'Pharmacy Store'}
                    </span>
                    {req.request_type === 'manual_issue' && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                        Manual
                      </span>
                    )}
                  </td>

                  {/* Requester */}
                  <td className="px-6 py-4">
                    {req.requester ? (
                      <div>
                        <div className="font-medium text-slate-700">{req.requester.full_name}</div>
                        <div className="text-xs text-slate-400">{req.requester.jawatan}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-italic">Manual Issue</span>
                    )}
                  </td>

                  {/* Issuer */}
                  <td className="px-6 py-4">
                    {req.issuer ? (
                      <div>
                        <div className="font-medium text-slate-700">{req.issuer.full_name}</div>
                        <div className="text-xs text-slate-400">{req.issuer.jawatan}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending issue</span>
                    )}
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      {req.items && req.items.length > 0 ? (
                        req.items.map((itm, idx) => (
                          <div key={idx} className="font-semibold text-slate-700 text-xs">
                            {itm.quantity_requested}x {itm.size_code}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-xs">No items</span>
                      )}
                    </div>
                  </td>

                  {/* Date/Time */}
                  <td className="px-6 py-4 text-xs font-medium">
                    {new Date(req.request_date).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No requests found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{' '}
          {filteredRequests.length} requests
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg font-bold">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
