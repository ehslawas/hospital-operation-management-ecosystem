// @ts-nocheck
"use client";
import { useState } from 'react';

interface MedicalOxygenSearchFilterProps {
  placeholder?: string;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: any) => void;
}

export default function MedicalOxygenSearchFilter({
  placeholder = "Search...",
  onSearchChange,
  onFilterChange
}: MedicalOxygenSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    size: 'all',
    connectionType: 'all',
    status: 'all',
    sortBy: 'cylinderCode',
    sortOrder: 'asc'
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearchChange) {
      onSearchChange(query);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-80 pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
        </svg>
        Filters
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {Object.values(filters).filter(v => v !== 'all').length}
        </span>
      </button>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filter Options</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange({ category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="private">Private</option>
                  <option value="loan">Loan</option>
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                <select
                  value={filters.size}
                  onChange={(e) => handleFilterChange({ size: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sizes</option>
                  <option value="D">D Size (0.5m³)</option>
                  <option value="E">E Size (0.7m³)</option>
                  <option value="F">F Size (1.4m³)</option>
                  <option value="HS">HS Size (6.4m³)</option>
                  <option value="N">N Size (8.0m³)</option>
                </select>
              </div>

              {/* Connection Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Connection Type</label>
                <select
                  value={filters.connectionType}
                  onChange={(e) => handleFilterChange({ connectionType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="Bull Nose (BN)">Bull Nose (BN)</option>
                  <option value="Pin Index (PI)">Pin Index (PI)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                  <option value="empty">Empty</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cylinderCode">Cylinder Code</option>
                    <option value="category">Category</option>
                    <option value="size">Size</option>
                    <option value="status">Status</option>
                    <option value="location">Location</option>
                    <option value="lastFilled">Last Filled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    const resetFilters = {
                      category: 'all',
                      size: 'all',
                      connectionType: 'all',
                      status: 'all',
                      sortBy: 'cylinderCode',
                      sortOrder: 'asc'
                    };
                    setFilters(resetFilters);
                    if (onFilterChange) {
                      onFilterChange(resetFilters);
                    }
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
