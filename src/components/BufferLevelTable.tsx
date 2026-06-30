// @ts-nocheck
"use client";
import { useState, useEffect, useMemo } from 'react';
import ItemAnalyticsModal from './ItemAnalyticsModal';

interface Item {
  id: string;
  name: string;
  drugCode: string;
  brandName: string;
  dosageForm: string;
  sku: string;
  category: 'Drug' | 'Non-drug';
  minLevel: number;
  budgetSource: string;
}

interface BufferLevelTableProps {
  items: Item[];
  onHandByItem: Map<string, number>;
  batches?: any[];
}

interface BufferConfig {
  id: string;
  minLevel: number;
  maxLevel: number;
  bufferLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  safetyStock: number;
  economicOrderQuantity: number;
  lastUpdated: string;
}

export default function BufferLevelTable({ items, onHandByItem, batches = [] }: BufferLevelTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [bufferConfigs, setBufferConfigs] = useState<Map<string, BufferConfig>>(new Map());
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Initialize buffer configurations
  useEffect(() => {
    const configs = new Map<string, BufferConfig>();
    items.forEach(item => {
      const currentStock = onHandByItem.get(item.id) || 0;
      configs.set(item.id, {
        id: item.id,
        minLevel: item.minLevel,
        maxLevel: Math.max(item.minLevel * 3, currentStock * 2),
        bufferLevel: Math.ceil(item.minLevel * 1.5),
        reorderPoint: item.minLevel,
        reorderQuantity: Math.max(item.minLevel * 2, 100),
        leadTimeDays: item.category === 'Drug' ? 14 : 7,
        safetyStock: Math.ceil(item.minLevel * 0.5),
        economicOrderQuantity: Math.max(item.minLevel * 3, 200),
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    });
    setBufferConfigs(configs);
  }, [items, onHandByItem]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.drugCode.toLowerCase().includes(query) ||
        item.brandName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category.toLowerCase() === selectedCategory);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [items, searchQuery, selectedCategory]);

  // Pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handleConfigUpdate = (itemId: string, field: keyof BufferConfig, value: number) => {
    setBufferConfigs(prev => {
      const newConfigs = new Map(prev);
      const config = newConfigs.get(itemId);
      if (config) {
        newConfigs.set(itemId, {
          ...config,
          [field]: value,
          lastUpdated: new Date().toISOString().split('T')[0]
        });
      }
      return newConfigs;
    });
  };

  const getStockStatus = (item: Item) => {
    const currentStock = onHandByItem.get(item.id) || 0;
    const config = bufferConfigs.get(item.id);
    if (!config) return 'unknown';

    if (currentStock <= config.safetyStock) return 'critical';
    if (currentStock <= config.minLevel) return 'low';
    if (currentStock >= config.maxLevel) return 'overstock';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      case 'overstock': return 'text-blue-600 bg-blue-50';
      case 'normal': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Buffer Level Configuration</h2>
          <p className="text-slate-600 mt-1">Configure inventory parameters for optimal stock management</p>
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              className="w-80 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pl-10 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="drug">Drugs</option>
            <option value="non-drug">Non-Drug Items</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Item Info</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Current Stock</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Min Level</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Max Level</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Buffer Level</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Reorder Point</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Reorder Qty</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Lead Time</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {paginatedItems.map(item => {
              const currentStock = onHandByItem.get(item.id) || 0;
              const config = bufferConfigs.get(item.id);
              const status = getStockStatus(item);
              
              if (!config) return null;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors duration-200"
                      >
                        {item.name}
                      </button>
                      <div className="text-xs text-slate-500">{item.drugCode} â€¢ {item.brandName}</div>
                      <div className="text-xs text-slate-400">{item.category}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="text-lg font-bold text-slate-900">{currentStock}</div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={config.minLevel}
                        onChange={(e) => handleConfigUpdate(item.id, 'minLevel', parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-700">{config.minLevel}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={config.maxLevel}
                        onChange={(e) => handleConfigUpdate(item.id, 'maxLevel', parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-700">{config.maxLevel}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={config.bufferLevel}
                        onChange={(e) => handleConfigUpdate(item.id, 'bufferLevel', parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-700">{config.bufferLevel}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={config.reorderPoint}
                        onChange={(e) => handleConfigUpdate(item.id, 'reorderPoint', parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-700">{config.reorderPoint}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={config.reorderQuantity}
                        onChange={(e) => handleConfigUpdate(item.id, 'reorderQuantity', parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-700">{config.reorderQuantity}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={config.leadTimeDays}
                        onChange={(e) => handleConfigUpdate(item.id, 'leadTimeDays', parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-700">{config.leadTimeDays} days</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {editingItem === item.id ? (
                        <>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} items
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>

      {/* Item Analytics Modal */}
      <ItemAnalyticsModal
        item={selectedItem}
        batches={batches}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
