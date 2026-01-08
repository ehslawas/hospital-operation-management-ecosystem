"use client";
import { useState, useEffect, useMemo } from 'react';
import InventorySearchFilter from './InventorySearchFilter';

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

interface Batch {
  id: string;
  itemId: string;
  batchNo: string;
  quantity: number;
  expiry: string;
  brandName: string;
  sku: string;
}

interface InventoryTableProps {
  items: Item[];
  batches: Batch[];
  placeholder?: string;
  title: string;
  description: string;
}

export default function InventoryTable({ 
  items, 
  batches, 
  placeholder = "Search...", 
  title,
  description 
}: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    stockStatus: 'all',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Calculate on-hand per item
  const onHandByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const batch of batches) {
      map.set(batch.itemId, (map.get(batch.itemId) || 0) + batch.quantity);
    }
    return map;
  }, [batches]);

  // Get batches by item
  const batchesByItem = useMemo(() => {
    const map = new Map<string, Batch[]>();
    for (const batch of batches) {
      if (!map.has(batch.itemId)) map.set(batch.itemId, []);
      map.get(batch.itemId)!.push(batch);
    }
    return map;
  }, [batches]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.drugCode.toLowerCase().includes(query) ||
        item.brandName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category.toLowerCase() === filters.category);
    }

    // Stock status filter
    if (filters.stockStatus !== 'all') {
      filtered = filtered.filter(item => {
        const onHand = onHandByItem.get(item.id) || 0;
        const daysLeft = batchesByItem.get(item.id)?.map(b => {
          const expiry = new Date(b.expiry);
          const now = new Date();
          return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }) || [];

        switch (filters.stockStatus) {
          case 'in-stock':
            return onHand > 0;
          case 'out-of-stock':
            return onHand === 0;
          case 'low-stock':
            return onHand > 0 && onHand < item.minLevel;
          case 'near-expiry':
            return daysLeft.some(days => days <= 90 && days > 0);
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'code':
          aValue = a.drugCode;
          bValue = b.drugCode;
          break;
        case 'quantity':
          aValue = onHandByItem.get(a.id) || 0;
          bValue = onHandByItem.get(b.id) || 0;
          break;
        case 'expiry':
          const aBatches = batchesByItem.get(a.id) || [];
          const bBatches = batchesByItem.get(b.id) || [];
          aValue = aBatches.length > 0 ? new Date(aBatches[0].expiry).getTime() : 0;
          bValue = bBatches.length > 0 ? new Date(bBatches[0].expiry).getTime() : 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (filters.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [items, searchQuery, filters, onHandByItem, batchesByItem]);

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-600 mt-1">{description}</p>
        </div>
        <InventorySearchFilter 
          placeholder={placeholder}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilters}
        />
      </div>
    
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Brand Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Dosage Form</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">SKU/PKU</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Batch No</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">Min Level</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {paginatedItems.flatMap(item => {
              const itemBatches = batchesByItem.get(item.id) || [];
              
              if (itemBatches.length === 0) {
                // Show item without batches
                return (
                  <tr key={item.id} className="hover:bg-red-50 transition-colors duration-150 bg-red-25">
                    <td className="px-6 py-4 text-sm font-mono text-red-600 bg-red-50">{item.drugCode}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-800">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{item.brandName}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{item.dosageForm}</td>
                    <td className="px-6 py-4 text-sm text-red-500">{item.sku}</td>
                    <td className="px-6 py-4 text-sm text-red-400 font-medium">No Stock</td>
                    <td className="px-6 py-4 text-sm text-red-400 font-medium">N/A</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">0</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-red-500">{item.minLevel}</td>
                  </tr>
                );
              }
              
              // Show each batch as a separate row
              return itemBatches.map((batch, index) => {
                return (
                  <tr key={`${item.id}-${batch.id}`} className={`hover:bg-slate-50 transition-colors duration-150 ${index === 0 ? 'border-t-2 border-slate-200' : ''}`}>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700 bg-slate-50">{index === 0 ? item.drugCode : ''}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{index === 0 ? item.name : ''}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{batch.brandName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{index === 0 ? item.dosageForm : ''}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{batch.sku}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">{batch.batchNo}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{batch.expiry}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">{batch.quantity}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600">{index === 0 ? item.minLevel : ''}</td>
                  </tr>
                );
              });
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
    </div>
  );
}
