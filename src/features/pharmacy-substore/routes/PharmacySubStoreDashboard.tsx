'use client';

import { useState } from 'react';
import {
  getStockItems,
  getPurchaseOrders,
  getWardRequisitions,
  getPharmacySubStoreStats,
} from '../services/mockSubStoreData';
import type { StockItem, PurchaseOrder, WardRequisition } from '../types/PharmacySubStore';

export default function PharmacySubStoreDashboard() {
  const [activeTab, setActiveTab] = useState<'stock' | 'po' | 'requisitions'>('stock');
  
  const stockItems = getStockItems();
  const purchaseOrders = getPurchaseOrders();
  const requisitions = getWardRequisitions();
  const stats = getPharmacySubStoreStats();

  // KPI counters
  const pendingRequestsCount = requisitions.filter(r => r.status === 'pending').length;
  const pendingApprovalCount = purchaseOrders.filter(po => po.status === 'pending-approval').length;
  const pendingReceiveCount = purchaseOrders.filter(po => po.status === 'ordered' || po.status === 'partially-received').length;

  // Tab badge counts (renamed requirements)
  const LOW_STOCK_STATUSES = ['low', 'critical', 'out-of-stock'];
  const DAYS_NEAR_EXPIRY = 90;
  const SLOW_MOVING_THRESHOLD = 60; // rarely used

  const lowStockItems = stockItems.filter(
    i => (LOW_STOCK_STATUSES as string[]).includes(i.status) && i.category === 'drug'
  );
  const lowStockCount = Math.min(lowStockItems.length, 10);

  const now = new Date();
  const nearExpiryItems = stockItems.filter(i =>
    i.batches?.some(b => {
      const days = (new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= DAYS_NEAR_EXPIRY;
    })
  );
  const nearExpiryCount = Math.min(nearExpiryItems.length, 10);

  const slowMovingItems = stockItems.filter(i => i.averageMonthlyConsumption <= SLOW_MOVING_THRESHOLD);
  const slowMovingCount = Math.min(slowMovingItems.length, 10);

  const getStockStatusColor = (status: string) => {
    const colors = {
      adequate: 'bg-green-100 text-green-800',
      low: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-orange-100 text-orange-800',
      'out-of-stock': 'bg-red-100 text-red-800',
      overstocked: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || colors.adequate;
  };

  const getPOStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      'pending-approval': 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-purple-100 text-purple-800',
      'partially-received': 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getReqStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg mt-3 md:mt-4">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pharmacy Sub Store</h1>
              <p className="text-indigo-100 mt-1">
                Stock management, purchase orders, and ward requisitions
              </p>
            </div>
          <div className="flex items-center gap-4"></div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* KPI (show only 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pending Request */}
          <div className="group rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all p-5 ring-1 ring-transparent hover:ring-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Request</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-1 group-hover:scale-[1.02] transition-transform">{pendingRequestsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 flex items-center justify-center shadow-inner">
                <span className="text-xl">🏥</span>
              </div>
            </div>
          </div>

          {/* Pending Approval */}
          <div className="group rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all p-5 ring-1 ring-transparent hover:ring-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Approval</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-1 group-hover:scale-[1.02] transition-transform">{pendingApprovalCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/20 text-purple-600 flex items-center justify-center shadow-inner">
                <span className="text-xl">📝</span>
              </div>
            </div>
          </div>

          {/* Pending Receive */}
          <div className="group rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all p-5 ring-1 ring-transparent hover:ring-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending Receive</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-1 group-hover:scale-[1.02] transition-transform">{pendingReceiveCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 flex items-center justify-center shadow-inner">
                <span className="text-xl">📦</span>
              </div>
            </div>
          </div>
        </div>

        

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('stock')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'stock'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📦 Low Stock Item ({lowStockCount})
              </button>
              <button
                onClick={() => setActiveTab('po')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'po'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📝 Near Expiry Item ({nearExpiryCount})
              </button>
              <button
                onClick={() => setActiveTab('requisitions')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'requisitions'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🏥 Slow Moving Item ({slowMovingCount})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'stock' && (
              <div className="space-y-4">
                {lowStockItems.slice(0, 10).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{item.itemCode}</span>
                          <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                          {item.strength && <span className="text-sm text-gray-600">{item.strength}</span>}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="ml-1 font-semibold text-gray-900">{item.currentStock} {item.unitOfMeasure}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Reorder Level:</span>
                            <span className="ml-1 font-semibold text-orange-600">{item.reorderLevel}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Monthly Usage:</span>
                            <span className="ml-1 font-semibold text-blue-600">{item.averageMonthlyConsumption}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Days to Stockout:</span>
                            <span className={`ml-1 font-semibold ${item.daysToStockout < 15 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.daysToStockout} days
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-red-600 font-medium">⚠️ Low stock medication alert</p>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">Drug</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'po' && (
              <div className="space-y-4">
                {nearExpiryItems.slice(0, 10).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{item.itemCode}</span>
                          <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                          {item.strength && <span className="text-sm text-gray-600">{item.strength}</span>}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Near Expiry</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="ml-1 font-semibold text-gray-900">{item.currentStock} {item.unitOfMeasure}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Reorder Level:</span>
                            <span className="ml-1 font-semibold text-orange-600">{item.reorderLevel}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Monthly Usage:</span>
                            <span className="ml-1 font-semibold text-blue-600">{item.averageMonthlyConsumption}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Days to Stockout:</span>
                            <span className={`ml-1 font-semibold ${item.daysToStockout < 15 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.daysToStockout} days
                            </span>
                          </div>
                        </div>
                        {/* Earliest expiring batch info */}
                        {item.batches && (
                          <p className="mt-2 text-xs text-red-600 font-medium">
                            ⚠️ Earliest expiry: {new Date(item.batches.map(b => b.expiryDate).sort((a:any,b:any)=> new Date(a).getTime()-new Date(b).getTime())[0] as any).toLocaleDateString('en-MY')}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-xs text-gray-500">Drug</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'requisitions' && (
              <div className="space-y-4">
                {slowMovingItems.slice(0, 10).map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{item.itemCode}</span>
                          <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                          {item.strength && <span className="text-sm text-gray-600">{item.strength}</span>}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Slow Moving</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="ml-1 font-semibold text-gray-900">{item.currentStock} {item.unitOfMeasure}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Reorder Level:</span>
                            <span className="ml-1 font-semibold text-orange-600">{item.reorderLevel}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Monthly Usage:</span>
                            <span className="ml-1 font-semibold text-blue-600">{item.averageMonthlyConsumption}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Days to Stockout:</span>
                            <span className={`ml-1 font-semibold ${item.daysToStockout < 15 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.daysToStockout} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-xs text-gray-500">{item.category === 'drug' ? 'Drug' : 'Item'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

