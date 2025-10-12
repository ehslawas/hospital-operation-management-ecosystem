'use client';

import { useState, useMemo, useEffect } from 'react';
import { getDrugItems, getDrugStats } from '../services/drugData';
import type { DrugItem, DrugCatalogFilters } from '../types/DrugItem';
import DrugEditModal from '../components/DrugEditModal';
import Pagination from '@/components/ui/Pagination';

export default function DrugCatalog() {
  const [department, setDepartment] = useState<string>('');
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);
  const [filters, setFilters] = useState<DrugCatalogFilters>({
    search: '',
    category: '',
    supplier: '',
    budgetSource: '',
    status: '',
    dosageForm: ''
  });

  const [editingDrug, setEditingDrug] = useState<DrugItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [drugs, setDrugs] = useState<DrugItem[]>(getDrugItems());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = getDrugStats();
  const allDrugs = drugs;
  const filteredDrugs = useMemo(() => {
    let filtered = [...drugs];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.drugName.toLowerCase().includes(searchLower) ||
        item.drugCode.toLowerCase().includes(searchLower) ||
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
    
    if (filters.dosageForm) {
      filtered = filtered.filter(item => item.dosageForm === filters.dosageForm);
    }
    
    return filtered;
  }, [drugs, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage);
  const paginatedDrugs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDrugs.slice(startIndex, endIndex);
  }, [filteredDrugs, currentPage, itemsPerPage]);

  const handleFilterChange = (key: keyof DrugCatalogFilters, value: string) => {
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
      dosageForm: ''
    });
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handleEditDrug = (drug: DrugItem) => {
    setEditingDrug(drug);
    setIsEditModalOpen(true);
  };

  const handleSaveDrug = (updatedDrug: DrugItem) => {
    setDrugs(prev => prev.map(drug => 
      drug.id === updatedDrug.id ? updatedDrug : drug
    ));
    setIsEditModalOpen(false);
    setEditingDrug(null);
  };

  const handleDeleteDrug = (drugId: string) => {
    if (confirm('Are you sure you want to delete this drug? This action cannot be undone.')) {
      setDrugs(prev => prev.filter(drug => drug.id !== drugId));
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingDrug(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Drug Catalog
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Comprehensive pharmaceutical inventory management
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-700">{stats.totalItems}</div>
                <div className="text-sm text-blue-600 font-semibold">Total Drugs</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200/50">
                <div className="text-3xl font-bold text-green-700">{stats.activeItems}</div>
                <div className="text-sm text-green-600 font-semibold">Active</div>
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
                  placeholder="Drug name, code, or SKU..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dosage Form</label>
                <select
                  value={filters.dosageForm}
                  onChange={(e) => handleFilterChange('dosageForm', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Forms</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Eye Drops">Eye Drops</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Shampoo">Shampoo</option>
                  <option value="Gel">Gel</option>
                </select>
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
        <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Drug Inventory ({filteredDrugs.length} items)
              </h2>
              <div className="flex items-center gap-4">
                <button
                  className={`px-6 py-3 rounded-xl transition-all duration-200 shadow-lg ${
                    department === 'Office Admin' ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl'
                  }`}
                  aria-disabled={department === 'Office Admin'}
                  title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Add New Drug'}
                >
                  Add New Drug
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Export Data
                </button>
              </div>
            </div>

            {/* Drug Table */}
            <div className="overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-white/90 via-blue-50/20 to-indigo-50/30 backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/40">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/60 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Drug Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Drug Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dosage Form</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SKU/PKU</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Budget Source</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
        <tbody className="divide-y divide-white/40 bg-gradient-to-br from-white/70 via-blue-50/10 to-indigo-50/20 backdrop-blur-sm">
          {paginatedDrugs.map((drug) => (
                      <tr 
                        key={drug.id} 
                        className="group hover:bg-white/90 transition-all duration-300 hover:shadow-lg cursor-pointer"
                        onClick={() => handleEditDrug(drug)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-gray-700">
                            {drug.drugCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                            {drug.drugName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {drug.dosageForm}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-gray-600">{drug.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {drug.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{drug.supplier}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{drug.budgetSource}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            drug.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : drug.status === 'Inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {drug.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (department !== 'Office Admin') handleEditDrug(drug);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'}`}
                              title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Edit drug'}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (department !== 'Office Admin') handleDeleteDrug(drug.id);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800 hover:bg-red-100'}`}
                              title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Delete drug'}
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
        totalItems={filteredDrugs.length}
      />

      {/* Edit Modal */}
      <DrugEditModal
        drug={editingDrug}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDrug}
      />
    </div>
  );
}
