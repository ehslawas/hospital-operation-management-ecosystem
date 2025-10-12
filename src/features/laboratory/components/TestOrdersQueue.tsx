'use client';

import React, { useState } from 'react';
import type { TestOrder } from '../types/Lab';

interface TestOrdersQueueProps {
  orders: TestOrder[];
  onOrderClick: (order: TestOrder) => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  collected: 'bg-blue-100 text-blue-800 border-blue-300',
  processing: 'bg-purple-100 text-purple-800 border-purple-300',
  analyzing: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  validating: 'bg-orange-100 text-orange-800 border-orange-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

const priorityColors = {
  stat: 'bg-red-500',
  urgent: 'bg-orange-500',
  routine: 'bg-blue-500',
};

const categoryColors = {
  'Haematology': 'text-red-700',
  'Clinical Chemistry': 'text-blue-700',
  'Microbiology': 'text-green-700',
  'Immunology': 'text-purple-700',
  'Blood Bank': 'text-pink-700',
  'Histopathology': 'text-orange-700',
};

export function TestOrdersQueue({ orders, onOrderClick }: TestOrdersQueueProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'stat'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'pending' || order.status === 'collected';
    if (filter === 'processing') return order.status === 'processing' || order.status === 'analyzing' || order.status === 'validating';
    if (filter === 'stat') return order.priority === 'stat';
    return order.status !== 'completed' && order.status !== 'rejected';
  }).filter(order => {
    if (categoryFilter === 'all') return true;
    return order.category === categoryFilter;
  }).sort((a, b) => {
    // Sort by priority first
    const priorityOrder = { stat: 0, urgent: 1, routine: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Then by order time
    return a.orderedAt.getTime() - b.orderedAt.getTime();
  });
  
  const getWaitTime = (order: TestOrder) => {
    const now = new Date();
    const diff = now.getTime() - order.orderedAt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const categories = ['all', ...Array.from(new Set(orders.map(o => o.category)))];
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Test Orders Queue</h2>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Active ({orders.filter(o => o.status !== 'completed' && o.status !== 'rejected').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending ({orders.filter(o => o.status === 'pending' || o.status === 'collected').length})
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'processing'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              In Progress ({orders.filter(o => ['processing', 'analyzing', 'validating'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setFilter('stat')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'stat'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              STAT ({orders.filter(o => o.priority === 'stat').length})
            </button>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-all"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-semibold">No orders in queue</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-r from-slate-50 to-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-1 h-10 rounded-full ${priorityColors[order.priority]}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[order.status]}`}>
                            {order.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            order.priority === 'stat' ? 'bg-red-600 text-white' :
                            order.priority === 'urgent' ? 'bg-orange-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {order.priority}
                          </span>
                          {order.isCritical && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-300">
                              🚨 CRITICAL
                            </span>
                          )}
                        </div>
                        <div className={`text-xs font-semibold mt-1 ${categoryColors[order.category]}`}>
                          {order.category}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-slate-900">{order.testName}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {order.patientName} • {order.patientAge}y • {order.patientGender}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Order #{order.orderNumber} • {order.testCode}
                      </p>
                      <p className="text-sm text-slate-700 font-semibold mt-2">
                        From: {order.orderingDepartment} ({order.orderingDoctor})
                      </p>
                      {order.clinicalNotes && (
                        <p className="text-sm text-slate-600 mt-1 italic">"{order.clinicalNotes}"</p>
                      )}
                      {order.sampleId && (
                        <p className="text-xs text-green-700 font-semibold mt-2">
                          Sample: {order.sampleId} ({order.sampleType})
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-slate-900">{getWaitTime(order)}</div>
                    <div className="text-xs text-slate-500">waiting</div>
                    {order.analyzedAt && (
                      <div className="text-xs text-green-600 font-semibold mt-2">
                        Analyzed ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}







