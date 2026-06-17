'use client';

import { useState, useMemo, useEffect } from 'react';
import { getNonDrugItems, getNonDrugStats } from '../services/nonDrugData';
import type { NonDrugItem, NonDrugCatalogFilters } from '../types/NonDrugItem';
import NonDrugEditModal from '../components/NonDrugEditModal';
import Pagination from '@/components/ui/Pagination';

export default function NonDrugCatalog() {
  const [department, setDepartment] = useState<string>('');
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);
  const [filters, setFilters] = useState<NonDrugCatalogFilters>({
    search: '',
    category: '',
    supplier: '',
    budgetSource: '',
    status: '',
    specification: ''
  });

  const [editingItem, setEditingItem] = useState<NonDrugItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [items, setItems] = useState<NonDrugItem[]>(getNonDrugItems());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = getNonDrugStats();
  const allItems = items;
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    
    if (filters.supplier) {
      filtered = filtered.filter(item => item.supplier === filters.supplier);
    }
    
    if (filters.budgetSource) {
      filtered = filtered.filter(item => item.budgetSource === filters.budgetSource);
    }
    
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    if (filters.specification) {
      filtered = filtered.filter(item => item.specification.toLowerCase().includes(filters.specification.toLowerCase()));
    }
    
    return filtered;
  }, [items, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handleFilterChange = (key: keyof NonDrugCatalogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      supplier: '',
      budgetSource: '',
      status: '',
      specification: ''
    });
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handleEditItem = (item: NonDrugItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (updatedItem: NonDrugItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/5 to-green-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
                  Non-Drug Catalog
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Medical supplies and equipment inventory management
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200/50">
                <div className="text-3xl font-bold text-green-700">{stats.totalItems}</div>
                <div className="text-sm text-green-600 font-semibold">Total Items</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-700">{stats.activeItems}</div>
                <div className="text-sm text-blue-600 font-semibold">Active</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-200/50">
                <div className="text-3xl font-bold text-amber-700">{stats.inactiveItems}</div>
                <div className="text-sm text-amber-600 font-semibold">Inactive</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl p-6 border border-red-200/50">
                <div className="text-3xl font-bold text-red-700">{stats.discontinuedItems}</div>
                <div className="text-sm text-red-600 font-semibold">Discontinued</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search & Filter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Item name, code, or SKU..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Categories</option>
                  {stats.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Suppliers</option>
                  {stats.suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Source</label>
                <select
                  value={filters.budgetSource}
                  onChange={(e) => handleFilterChange('budgetSource', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Sources</option>
                  {stats.budgetSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specification</label>
                <input
                  type="text"
                  placeholder="Search specifications..."
                  value={filters.specification}
                  onChange={(e) => handleFilterChange('specification', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="group relative bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Medical Supplies Inventory ({filteredItems.length} items)
              </h2>
              <div className="flex items-center gap-4">
                <button
                  className={`px-6 py-3 rounded-xl transition-all duration-200 shadow-lg ${
                    department === 'Office Admin' ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl'
                  }`}
                  aria-disabled={department === 'Office Admin'}
                  title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Add New Item'}
                >
                  Add New Item
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Export Data
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-white/90 via-green-50/20 to-emerald-50/30 backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/40">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-green-50/60 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Item Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Specification</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SKU/PKU</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Budget Source</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
        <tbody className="divide-y divide-white/40 bg-gradient-to-br from-white/70 via-green-50/10 to-emerald-50/20 backdrop-blur-sm">
          {paginatedItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className="group hover:bg-white/90 transition-all duration-300 hover:shadow-lg cursor-pointer"
                        onClick={() => handleEditItem(item)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-gray-700">
                            {item.itemCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                            {item.itemName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={item.specification}>
                            {item.specification}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-gray-600">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.supplier}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.budgetSource}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : item.status === 'Inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (department !== 'Office Admin') handleEditItem(item);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800 hover:bg-green-100'}`}
                              title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Edit item'}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (department !== 'Office Admin') handleDeleteItem(item.id);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800 hover:bg-red-100'}`}
                              title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Delete item'}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredItems.length}
      />

      {/* Edit Modal */}
      <NonDrugEditModal
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
      />
    </div>
  );
}
