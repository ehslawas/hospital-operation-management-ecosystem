'use client';

import { useState, useMemo } from 'react';
import { getSuppliers, getSupplierStats } from '../services/supplierData';
import type { Supplier, SupplierFilters } from '../types/Supplier';
import SupplierCard from '../components/SupplierCard';
import SupplierEditModal from '../components/SupplierEditModal';

export default function SupplierCatalog() {
  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    category: '',
    status: '',
    rating: ''
  });

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliers());
  const stats = getSupplierStats();

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = !filters.search || 
        supplier.companyName.toLowerCase().includes(filters.search.toLowerCase()) ||
        supplier.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        supplier.phone.includes(filters.search) ||
        supplier.specialties.some(s => s.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesCategory = !filters.category || supplier.category === filters.category;
      const matchesStatus = !filters.status || supplier.status === filters.status;
      const matchesRating = !filters.rating || supplier.rating >= parseFloat(filters.rating);

      return matchesSearch && matchesCategory && matchesStatus && matchesRating;
    });
  }, [suppliers, filters]);

  const handleFilterChange = (key: keyof SupplierFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      rating: ''
    });
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleSaveSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(supplier =>
      supplier.id === updatedSupplier.id ? updatedSupplier : supplier
    ));
    setIsEditModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingSupplier(null);
  };

  const categories = [...new Set(suppliers.map(s => s.category))];
  const statuses = [...new Set(suppliers.map(s => s.status))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vh)] bg-gradient-to-br from-pink-400/5 to-purple-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                  Supplier Catalog
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Comprehensive supplier management and business directory
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/50">
                <div className="text-3xl font-bold text-purple-700">{stats.totalSuppliers}</div>
                <div className="text-sm text-purple-600 font-semibold">Total Suppliers</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200/50">
                <div className="text-3xl font-bold text-green-700">{stats.activeSuppliers}</div>
                <div className="text-sm text-green-600 font-semibold">Active</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-200/50">
                <div className="text-3xl font-bold text-yellow-700">{stats.pendingSuppliers}</div>
                <div className="text-sm text-yellow-600 font-semibold">Pending</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-700">{stats.averageRating}</div>
                <div className="text-sm text-blue-600 font-semibold">Avg Rating</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filter Suppliers</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Company name, email, phone..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="3.0">3.0+ Stars</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Suppliers ({filteredSuppliers.length})
            </h2>
          </div>

          {/* Supplier Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={handleEditSupplier}
                onDelete={handleDeleteSupplier}
              />
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <SupplierEditModal
        supplier={editingSupplier}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSupplier}
      />
    </div>
  );
}