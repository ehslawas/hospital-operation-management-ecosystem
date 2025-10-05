'use client';

import { useState } from 'react';
import { RequestFilters, RequestStatus, Department, RequestPriority } from '../../types/RequestWorkflow';

interface RequestFiltersProps {
  filters: RequestFilters;
  onFiltersChange: (filters: RequestFilters) => void;
}

export function RequestFilters({ filters, onFiltersChange }: RequestFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: { value: RequestStatus; label: string; color: string }[] = [
    { value: 'PENDING_REVIEW', label: 'Pending Review', color: 'bg-amber-100 text-amber-800' },
    { value: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'bg-orange-100 text-orange-800' },
    { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'ISSUED', label: 'Issued', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  ];

  const departmentOptions: { value: Department; label: string }[] = [
    { value: 'ETU', label: 'Emergency Treatment Unit' },
    { value: 'GW', label: 'General Ward' },
    { value: 'OT', label: 'Operating Theatre' },
    { value: 'HDU', label: 'High Dependency Unit' },
    { value: 'ICU', label: 'Intensive Care Unit' },
    { value: 'WARD_A', label: 'Ward A' },
    { value: 'WARD_B', label: 'Ward B' },
    { value: 'WARD_C', label: 'Ward C' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'PHARMACY', label: 'Pharmacy' }
  ];

  const priorityOptions: { value: RequestPriority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const handleStatusToggle = (status: RequestStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleDepartmentToggle = (department: Department) => {
    const currentDepartments = filters.department || [];
    const newDepartments = currentDepartments.includes(department)
      ? currentDepartments.filter(d => d !== department)
      : [...currentDepartments, department];
    onFiltersChange({ ...filters, department: newDepartments.length > 0 ? newDepartments : undefined });
  };

  const handlePriorityToggle = (priority: RequestPriority) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    onFiltersChange({ ...filters, priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = [
    filters.status?.length || 0,
    filters.department?.length || 0,
    filters.priority?.length || 0,
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
    filters.searchTerm ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {activeFiltersCount} active
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search requests, items, or request numbers..."
            value={filters.searchTerm || ''}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-6">
            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusToggle(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filters.status?.includes(option.value)
                        ? option.color
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Filters */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Department</h4>
              <div className="grid grid-cols-2 gap-2">
                {departmentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDepartmentToggle(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                      filters.department?.includes(option.value)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filters */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Priority</h4>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePriorityToggle(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filters.priority?.includes(option.value)
                        ? option.color
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

