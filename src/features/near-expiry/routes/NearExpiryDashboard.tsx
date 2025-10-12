"use client";
import { NearExpiryTable } from '../components/NearExpiryTable';
import { fetchNearExpiryKpis, fetchNearExpiryItems, fetchExpiryTimeline } from '../services/nearExpiryData';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Pagination from '@/components/ui/Pagination';

// Dynamic import for charts to avoid SSR issues
const SimpleHistogramChart = dynamic(() => import('@/components/charts/SimpleHistogramChart'), {
  ssr: false,
  loading: () => <div className="h-[220px] flex items-center justify-center text-gray-500">Loading chart...</div>
});

export default function NearExpiryDashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      try {
        const [kpisData, itemsData, timelineData] = await Promise.all([
          fetchNearExpiryKpis(),
          fetchNearExpiryItems(),
          fetchExpiryTimeline(),
        ]);
        setKpis(kpisData);
        // Sort items by daysLeft in ascending order (smallest to biggest)
        const sortedItems = itemsData.sort((a, b) => a.daysLeft - b.daysLeft);
        setItems(sortedItems);
        setTimeline(timelineData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Filter and paginate
  const filteredItems = categoryFilter === 'All' ? items : items.filter(i => i.category === categoryFilter);
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * itemsPerPage;
  const pageItems = filteredItems.slice(start, start + itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-red-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-red-400/5 to-orange-500/5 rounded-full filter blur-3xl animate-pulse"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(251,146,60,0.05)_1px,transparent_0)] bg-[size:32px_32px]"></div>
        {/* Modern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">Near-Expiry Items Dashboard</h1>
          <p className="text-slate-600">Monitor and manage items approaching expiry dates</p>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{kpis.itemsExpiring30Days}</div>
              <div className="text-sm text-slate-600">Items Expiring in 30 Days</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">{kpis.itemsExpiring60Days}</div>
              <div className="text-sm text-slate-600">Items Expiring in 60 Days</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">{kpis.itemsExpiring90Days}</div>
              <div className="text-sm text-slate-600">Items Expiring in 90 Days</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(kpis.totalValueAtRisk)}</div>
              <div className="text-sm text-slate-600">Total Value at Risk</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{kpis.criticalItemsCount}</div>
              <div className="text-sm text-slate-600">Critical Items</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-700 mb-1">{kpis.avgDaysToExpiry}</div>
              <div className="text-sm text-slate-600">Avg Days to Expiry</div>
            </div>
          </div>
        </section>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expiry Timeline Chart */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Expiry Timeline</h3>
            <SimpleHistogramChart 
              series={timeline} 
              color="#f59e0b" 
              height={280}
            />
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Critical Items</h3>
            <div className="space-y-3">
              {items.filter(item => item.priority === 'Critical').slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-600">{item.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-600 font-medium">{item.daysLeft} days</div>
                    <div className="text-sm text-slate-600">{formatCurrency(item.totalValue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full Items Table */}
        <NearExpiryTable 
          items={pageItems}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={(cat) => { setCategoryFilter(cat); setCurrentPage(1); }}
        />

        <div className="mt-6">
          <Pagination 
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={(p)=> setCurrentPage(Math.min(Math.max(1, p), totalPages))}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </div>
      </div>
    </div>
  );
}
