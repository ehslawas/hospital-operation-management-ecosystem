'use client';

import { useState, useEffect } from 'react';

interface StockItem {
  id: string;
  itemName: string;
  itemCode: string;
  category: 'Drug' | 'Non-drug';
  systemStock: number;
  physicalStock: number;
  variance: number;
  variancePercent: number;
  unit: string;
  location: string;
  lastVerified: string;
  status: 'Verified' | 'Pending' | 'Discrepancy' | 'Critical';
  batchNumber?: string;
  expiryDate?: string;
  verifiedBy?: string;
  notes?: string;
}

interface VerificationSession {
  id: string;
  sessionName: string;
  startDate: string;
  endDate?: string;
  status: 'In Progress' | 'Completed' | 'Scheduled';
  totalItems: number;
  verifiedItems: number;
  discrepancyItems: number;
  verifiedBy: string;
  location: string;
}

export default function StockVerificationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Drug' | 'Non-drug'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Verified' | 'Pending' | 'Discrepancy' | 'Critical'>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isVerificationMode, setIsVerificationMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<VerificationSession | null>(null);

  // Mock data for stock items
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: 'SV-001',
      itemName: 'Paracetamol 500mg',
      itemCode: 'DRG-001',
      category: 'Drug',
      systemStock: 1250,
      physicalStock: 1248,
      variance: -2,
      variancePercent: -0.16,
      unit: 'tablets',
      location: 'Main Store - A1',
      lastVerified: '2024-01-15',
      status: 'Verified',
      batchNumber: 'BATCH-001',
      expiryDate: '2025-12-31',
      verifiedBy: 'Dr. Ahmad Rahman'
    },
    {
      id: 'SV-002',
      itemName: 'Ibuprofen 400mg',
      itemCode: 'DRG-002',
      category: 'Drug',
      systemStock: 890,
      physicalStock: 875,
      variance: -15,
      variancePercent: -1.69,
      unit: 'tablets',
      location: 'Main Store - A2',
      lastVerified: '2024-01-14',
      status: 'Discrepancy',
      batchNumber: 'BATCH-002',
      expiryDate: '2025-11-30',
      verifiedBy: 'Nurse Lisa Chen'
    },
    {
      id: 'SV-003',
      itemName: 'Surgical Gloves',
      itemCode: 'NDG-001',
      category: 'Non-drug',
      systemStock: 500,
      physicalStock: 0,
      variance: -500,
      variancePercent: -100,
      unit: 'boxes',
      location: 'Operating Theater - B1',
      lastVerified: '2024-01-13',
      status: 'Critical',
      batchNumber: 'BATCH-003',
      expiryDate: '2026-03-15',
      verifiedBy: 'Dr. Lim Wei Ming'
    },
    {
      id: 'SV-004',
      itemName: 'Amoxicillin 250mg',
      itemCode: 'DRG-003',
      category: 'Drug',
      systemStock: 675,
      physicalStock: 680,
      variance: 5,
      variancePercent: 0.74,
      unit: 'capsules',
      location: 'Emergency Department - C1',
      lastVerified: '2024-01-12',
      status: 'Verified',
      batchNumber: 'BATCH-004',
      expiryDate: '2025-10-20',
      verifiedBy: 'Dr. Sarah Lee'
    },
    {
      id: 'SV-005',
      itemName: 'Syringe 5ml',
      itemCode: 'NDG-002',
      category: 'Non-drug',
      systemStock: 200,
      physicalStock: 195,
      variance: -5,
      variancePercent: -2.5,
      unit: 'pieces',
      location: 'ICU - D1',
      lastVerified: '2024-01-11',
      status: 'Pending',
      batchNumber: 'BATCH-005',
      expiryDate: '2026-01-10',
      verifiedBy: 'Nurse Ahmad Hassan'
    }
  ]);

  const [verificationSessions] = useState<VerificationSession[]>([
    {
      id: 'VS-001',
      sessionName: 'Monthly Stock Verification - January 2024',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      status: 'Completed',
      totalItems: 150,
      verifiedItems: 145,
      discrepancyItems: 5,
      verifiedBy: 'Dr. Ahmad Rahman',
      location: 'All Locations'
    },
    {
      id: 'VS-002',
      sessionName: 'Emergency Department Verification',
      startDate: '2024-01-16',
      status: 'In Progress',
      totalItems: 25,
      verifiedItems: 15,
      discrepancyItems: 2,
      verifiedBy: 'Dr. Lim Wei Ming',
      location: 'Emergency Department'
    }
  ]);

  const locations = ['all', ...Array.from(new Set(stockItems.map(item => item.location)))];

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
  });

  const startVerificationSession = () => {
    const newSession: VerificationSession = {
      id: `VS-${Date.now()}`,
      sessionName: `Stock Verification - ${new Date().toLocaleDateString()}`,
      startDate: new Date().toISOString().split('T')[0],
      status: 'In Progress',
      totalItems: filteredItems.length,
      verifiedItems: 0,
      discrepancyItems: 0,
      verifiedBy: 'Dr. Ahmad Rahman',
      location: locationFilter === 'all' ? 'All Locations' : locationFilter
    };
    setCurrentSession(newSession);
    setIsVerificationMode(true);
  };

  const updatePhysicalStock = (itemId: string, newPhysicalStock: number) => {
    setStockItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const variance = newPhysicalStock - item.systemStock;
          const variancePercent = item.systemStock > 0 ? (variance / item.systemStock) * 100 : 0;
          let status: StockItem['status'] = 'Verified';
          
          if (Math.abs(variancePercent) > 10) {
            status = 'Critical';
          } else if (Math.abs(variancePercent) > 2) {
            status = 'Discrepancy';
          }

          return {
            ...item,
            physicalStock: newPhysicalStock,
            variance,
            variancePercent,
            status,
            lastVerified: new Date().toISOString().split('T')[0],
            verifiedBy: 'Dr. Ahmad Rahman'
          };
        }
        return item;
      })
    );
  };

  const getStatusColor = (status: StockItem['status']) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Discrepancy': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Stock Verification Dashboard</h1>
          <p className="text-slate-600">Ensure physical stock matches system stock for accurate inventory management</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{stockItems.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Verified Items</p>
                <p className="text-2xl font-bold text-green-600">
                  {stockItems.filter(item => item.status === 'Verified').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Discrepancies</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stockItems.filter(item => item.status === 'Discrepancy').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {stockItems.filter(item => item.status === 'Critical').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Items</label>
              <input
                type="text"
                placeholder="Search by name, code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                <option value="all">All Categories</option>
                <option value="Drug">Drug</option>
                <option value="Non-drug">Non-drug</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                <option value="all">All Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Discrepancy">Discrepancy</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location === 'all' ? 'All Locations' : location}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={startVerificationSession}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Verification
              </button>
            </div>
          </div>
        </div>

        {/* Stock Verification Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Stock Verification Items</h3>
            <p className="text-sm text-slate-600">Physical vs System stock comparison</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Item Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">System Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Physical Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Variance</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Last Verified</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.itemName}</div>
                        <div className="text-sm text-slate-500">{item.itemCode}</div>
                        <div className="text-xs text-slate-400">{item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {item.systemStock.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {isVerificationMode ? (
                        <input
                          type="number"
                          value={item.physicalStock}
                          onChange={(e) => updatePhysicalStock(item.id, parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-900">
                          {item.physicalStock.toLocaleString()} {item.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className={`text-sm font-semibold ${getVarianceColor(item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                        </div>
                        <div className={`text-xs ${getVarianceColor(item.variance)}`}>
                          {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.location}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.lastVerified}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Verify</button>
                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">Adjust</button>
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">Report</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Sessions */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Verification Sessions</h3>
            <p className="text-sm text-slate-600">Track verification activities and progress</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationSessions.map((session) => (
                <div key={session.id} className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">{session.sessionName}</h4>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div>Location: {session.location}</div>
                    <div>Verified by: {session.verifiedBy}</div>
                    <div>Start Date: {session.startDate}</div>
                    {session.endDate && <div>End Date: {session.endDate}</div>}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span>Progress: {session.verifiedItems}/{session.totalItems}</span>
                        <span className="font-semibold">
                          {Math.round((session.verifiedItems / session.totalItems) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(session.verifiedItems / session.totalItems) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {session.discrepancyItems > 0 && (
                      <div className="text-orange-600 font-medium">
                        {session.discrepancyItems} discrepancies found
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
