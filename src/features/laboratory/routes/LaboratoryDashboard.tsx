'use client';

import React, { useState, useEffect } from 'react';
import { MetricsCard } from '@/features/emergency/components/MetricsCard';
import { TestOrdersQueue } from '../components/TestOrdersQueue';
import { ResultsEntryModal } from '../components/ResultsEntryModal';
import type { TestOrder, TestResult } from '../types/Lab';
import { mockTestOrders, mockLabEquipment, calculateLabStats } from '../services/mockLabData';

export default function LaboratoryDashboard() {
  const [orders, setOrders] = useState<TestOrder[]>(mockTestOrders);
  const [selectedOrder, setSelectedOrder] = useState<TestOrder | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<'active' | 'completed'>('active');
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  const stats = calculateLabStats(orders);
  const equipment = mockLabEquipment;
  
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'rejected');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const operationalEquipment = equipment.filter(e => e.status === 'operational').length;
  
  const handleOrderClick = (order: TestOrder) => {
    setSelectedOrder(order);
  };
  
  const handleSaveResult = (orderId: string, result: TestResult) => {
    setOrders(prev =>
      prev.map(o => 
        o.id === orderId 
          ? { ...o, result, status: 'validating', analyzedAt: new Date(), analyzedBy: result.enteredBy }
          : o
      )
    );
    setSelectedOrder(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h1 className="text-4xl font-extrabold">Laboratory Services</h1>
            </div>
            <p className="text-blue-100 text-lg">Diagnostic testing & pathology services</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-blue-100">{currentTime.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle={`Today: ${stats.todayPending + stats.todayCompleted}`}
          color="blue"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        
        <MetricsCard
          title="Pending Tests"
          value={stats.pending}
          subtitle="Awaiting collection/analysis"
          color="orange"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <MetricsCard
          title="Completed Today"
          value={stats.todayCompleted}
          subtitle={`${stats.completed} total completed`}
          color="green"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <MetricsCard
          title="Critical Results"
          value={stats.critical}
          subtitle="Requires urgent review"
          color="red"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>
      
      {/* Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Turnaround Time</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-blue-600">{stats.avgTurnaroundTime}m</div>
              <div className="text-sm text-slate-600 mt-1">Average TAT</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{stats.longestWaitingOrder}m</div>
              <div className="text-sm text-slate-600 mt-1">Longest waiting</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              style={{ width: `${Math.min((stats.avgTurnaroundTime / 120) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0m</span>
            <span>Target: 60m</span>
            <span>120m</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Equipment Status</h3>
          <div className="space-y-3">
            {equipment.slice(0, 3).map(eq => (
              <div key={eq.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    eq.status === 'operational' ? 'bg-green-500' :
                    eq.status === 'maintenance' ? 'bg-yellow-500' :
                    eq.status === 'calibration' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`} />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{eq.name}</div>
                    <div className="text-xs text-slate-500">{eq.model}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{eq.currentLoad}/{eq.maxCapacity}</div>
                  <div className="text-xs text-slate-500">samples</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-green-600">{operationalEquipment}/{equipment.length}</span> equipment operational
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Tests by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Haematology', count: orders.filter(o => o.category === 'Haematology').length, color: 'bg-red-500' },
            { name: 'Chemistry', count: orders.filter(o => o.category === 'Clinical Chemistry').length, color: 'bg-blue-500' },
            { name: 'Microbiology', count: orders.filter(o => o.category === 'Microbiology').length, color: 'bg-green-500' },
            { name: 'Immunology', count: orders.filter(o => o.category === 'Immunology').length, color: 'bg-purple-500' },
            { name: 'Blood Bank', count: orders.filter(o => o.category === 'Blood Bank').length, color: 'bg-pink-500' },
            { name: 'Histopath', count: orders.filter(o => o.category === 'Histopathology').length, color: 'bg-orange-500' },
          ].map(cat => (
            <div key={cat.name} className="text-center">
              <div className={`${cat.color} text-white rounded-xl p-4 mb-2`}>
                <div className="text-3xl font-bold">{cat.count}</div>
              </div>
              <div className="text-sm font-semibold text-slate-900">{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setView('active')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            view === 'active'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Active Orders ({activeOrders.length})
          </span>
        </button>
        <button
          onClick={() => setView('completed')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            view === 'completed'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed ({completedOrders.length})
          </span>
        </button>
      </div>
      
      {/* Test Orders Queue */}
      <TestOrdersQueue 
        orders={view === 'active' ? activeOrders : completedOrders}
        onOrderClick={handleOrderClick}
      />
      
      {/* Results Entry Modal */}
      {selectedOrder && (
        <ResultsEntryModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSave={handleSaveResult}
        />
      )}
    </div>
  );
}







