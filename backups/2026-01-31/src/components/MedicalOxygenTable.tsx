"use client";
import { useState, useEffect, useMemo } from 'react';
import MedicalOxygenSearchFilter from './MedicalOxygenSearchFilter';

interface Item {
  id: string;
  name: string;
  drugCode: string;
  brandName: string;
  dosageForm: string;
  sku: string;
  category: 'Drug' | 'Non-drug' | 'Medical Oxygen';
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

interface MedicalOxygenTableProps {
  items: Item[];
  batches: Batch[];
  placeholder?: string;
  title: string;
  description: string;
}

interface OxygenCylinder {
  id: string;
  cylinderCode: string;
  category: 'Private' | 'Loan';
  size: string;
  capacity: number; // in m3
  connectionType: 'Bull Nose (BN)' | 'Pin Index (PI)';
  currentPressure: number; // in PSI
  maxPressure: number; // in PSI
  status: 'Full' | 'Partial' | 'Empty' | 'Maintenance';
  location: string;
  lastFilled: string;
  nextService: string;
  supplier: string;
  serialNumber: string;
}

export default function MedicalOxygenTable({
  items,
  batches,
  placeholder = "Search...",
  title,
  description
}: MedicalOxygenTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    size: 'all',
    connectionType: 'all',
    status: 'all',
    sortBy: 'cylinderCode',
    sortOrder: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Generate mock oxygen cylinder data
  const oxygenCylinders = useMemo(() => {
    const cylinders: OxygenCylinder[] = [];
    
    // Private cylinders
    const privateSizes = [
      { size: 'D', capacity: 0.5 },
      { size: 'E', capacity: 0.7 },
      { size: 'F', capacity: 1.4 },
      { size: 'HS', capacity: 6.4 }
    ];
    
    const loanSizes = [
      { size: 'F', capacity: 1.4 },
      { size: 'N', capacity: 8.0 }
    ];
    
    const connectionTypes: ('Bull Nose (BN)' | 'Pin Index (PI)')[] = ['Bull Nose (BN)', 'Pin Index (PI)'];
    const statuses: ('Full' | 'Partial' | 'Empty' | 'Maintenance')[] = ['Full', 'Partial', 'Empty', 'Maintenance'];
    const locations = ['ICU', 'Emergency', 'Ward A', 'Ward B', 'Operating Theater', 'Storage Room'];
    const suppliers = ['Air Liquide', 'Linde Gas', 'BOC', 'Medical Gas Supply', 'Oxygen Direct'];
    
    // Generate Private cylinders
    privateSizes.forEach((sizeInfo, sizeIndex) => {
      connectionTypes.forEach((connType, connIndex) => {
        for (let i = 1; i <= 3; i++) {
          const cylinderId = `PRIV-${sizeInfo.size}-${connType.split(' ')[0]}-${String(i).padStart(3, '0')}`;
          const pressure = Math.floor(Math.random() * 2000) + 500; // 500-2500 PSI
          const maxPressure = 2200;
          
          cylinders.push({
            id: cylinderId,
            cylinderCode: cylinderId,
            category: 'Private',
            size: sizeInfo.size,
            capacity: sizeInfo.capacity,
            connectionType: connType,
            currentPressure: pressure,
            maxPressure: maxPressure,
            status: pressure > 1800 ? 'Full' : pressure > 500 ? 'Partial' : 'Empty',
            location: locations[Math.floor(Math.random() * locations.length)],
            lastFilled: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            nextService: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
            serialNumber: `SN${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
          });
        }
      });
    });
    
    // Generate Loan cylinders
    loanSizes.forEach((sizeInfo, sizeIndex) => {
      connectionTypes.forEach((connType, connIndex) => {
        for (let i = 1; i <= 2; i++) {
          const cylinderId = `LOAN-${sizeInfo.size}-${connType.split(' ')[0]}-${String(i).padStart(3, '0')}`;
          const pressure = Math.floor(Math.random() * 2000) + 500; // 500-2500 PSI
          const maxPressure = 2200;
          
          cylinders.push({
            id: cylinderId,
            cylinderCode: cylinderId,
            category: 'Loan',
            size: sizeInfo.size,
            capacity: sizeInfo.capacity,
            connectionType: connType,
            currentPressure: pressure,
            maxPressure: maxPressure,
            status: pressure > 1800 ? 'Full' : pressure > 500 ? 'Partial' : 'Empty',
            location: locations[Math.floor(Math.random() * locations.length)],
            lastFilled: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            nextService: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
            serialNumber: `SN${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
          });
        }
      });
    });
    
    return cylinders.sort((a, b) => a.cylinderCode.localeCompare(b.cylinderCode));
  }, []);

  const filteredCylinders = useMemo(() => {
    let filtered = oxygenCylinders;

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(cylinder => cylinder.category.toLowerCase() === filters.category);
    }

    // Apply size filter
    if (filters.size !== 'all') {
      filtered = filtered.filter(cylinder => cylinder.size === filters.size);
    }

    // Apply connection type filter
    if (filters.connectionType !== 'all') {
      filtered = filtered.filter(cylinder => cylinder.connectionType === filters.connectionType);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(cylinder => cylinder.status.toLowerCase() === filters.status);
    }

    // Apply search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(cylinder =>
        cylinder.cylinderCode.toLowerCase().includes(lowerCaseQuery) ||
        cylinder.size.toLowerCase().includes(lowerCaseQuery) ||
        cylinder.connectionType.toLowerCase().includes(lowerCaseQuery) ||
        cylinder.location.toLowerCase().includes(lowerCaseQuery) ||
        cylinder.supplier.toLowerCase().includes(lowerCaseQuery) ||
        cylinder.serialNumber.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[filters.sortBy];
      const bValue = (b as any)[filters.sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return filters.sortOrder === 'asc'
          ? (aValue || 0) - (bValue || 0)
          : (bValue || 0) - (aValue || 0);
      }
    });

    return filtered;
  }, [oxygenCylinders, searchQuery, filters]);

  // Pagination logic
  const totalItems = filteredCylinders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCylinders = filteredCylinders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Full':
        return 'bg-emerald-100 text-emerald-800';
      case 'Partial':
        return 'bg-amber-100 text-amber-800';
      case 'Empty':
        return 'bg-red-100 text-red-800';
      case 'Maintenance':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPressureColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 80) return 'text-emerald-600';
    if (percentage > 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl border border-slate-200/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-600 mt-1">{description}</p>
        </div>
        <MedicalOxygenSearchFilter
          onSearchChange={setSearchQuery}
          onFilterChange={setFilters}
          placeholder={placeholder}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Cylinder Code</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Size</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Capacity</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Connection</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Pressure</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Last Filled</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">Supplier</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {paginatedCylinders.map((cylinder) => {
              const pressurePercentage = ((cylinder.currentPressure / cylinder.maxPressure) * 100).toFixed(1);
              
              return (
                <tr key={cylinder.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{cylinder.cylinderCode}</div>
                        <div className="text-xs text-slate-500">{cylinder.serialNumber}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      cylinder.category === 'Private' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {cylinder.category}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900">{cylinder.size}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{cylinder.capacity} m³</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {cylinder.connectionType}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            parseFloat(pressurePercentage) > 80 ? 'bg-emerald-500' :
                            parseFloat(pressurePercentage) > 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(parseFloat(pressurePercentage), 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-semibold ${getPressureColor(cylinder.currentPressure, cylinder.maxPressure)}`}>
                        {cylinder.currentPressure} PSI
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{pressurePercentage}% full</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(cylinder.status)}`}>
                      {cylinder.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{cylinder.location}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{cylinder.lastFilled}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{cylinder.supplier}</div>
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
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} cylinders
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
