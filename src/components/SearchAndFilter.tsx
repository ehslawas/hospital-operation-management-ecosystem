"use client";
import { useState, useEffect } from 'react';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  placeholder?: string;
}

interface FilterOptions {
  stockStatus: 'all' | 'in-stock' | 'out-of-stock' | 'low-stock' | 'near-expiry';
  category: 'all' | 'drug' | 'non-drug';
  sortBy: 'name' | 'code' | 'quantity' | 'expiry';
  sortOrder: 'asc' | 'desc';
}

export default function SearchAndFilter({ onSearch, onFilter, placeholder = "Search..." }: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    stockStatus: 'all',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  useEffect(() => {
    onFilter(filters);
  }, [filters, onFilter]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex gap-3">
      <div className="relative">
        <input 
          className="w-80 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pl-10 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className={`inline-flex items-center rounded-xl border px-6 py-3 transition-all duration-200 font-medium ${
          showFilters 
            ? 'border-blue-500 bg-blue-50 text-blue-700' 
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
        }`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
        </svg>
        Filter
        {showFilters && (
          <span className="ml-2 inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
            Active
          </span>
        )}
      </button>

      {showFilters && (
        <div className="absolute top-full left-0 mt-2 w-96 rounded-xl border border-slate-200 bg-white p-6 shadow-xl z-50">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Filter Options</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stock Status</label>
              <select 
                value={filters.stockStatus}
                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Items</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="near-expiry">Near Expiry</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select 
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Categories</option>
                <option value="drug">Drugs</option>
                <option value="non-drug">Non-Drug Items</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <select 
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="name">Name</option>
                <option value="code">Drug Code</option>
                <option value="quantity">Quantity</option>
                <option value="expiry">Expiry Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort Order</label>
              <select 
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="asc">Ascending (A-Z)</option>
                <option value="desc">Descending (Z-A)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => {
                  setFilters({
                    stockStatus: 'all',
                    category: 'all',
                    sortBy: 'name',
                    sortOrder: 'asc'
                  });
                  setSearchQuery('');
                }}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear All
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
