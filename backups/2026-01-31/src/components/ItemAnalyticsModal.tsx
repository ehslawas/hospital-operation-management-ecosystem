"use client";
import { useState, useEffect } from 'react';

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

interface ItemAnalyticsModalProps {
  item: Item | null;
  batches: Batch[];
  onClose: () => void;
}

interface UsageData {
  month: string;
  received: number;
  issued: number;
  adjusted: number;
  onHand: number;
}

interface OrderData {
  date: string;
  quantity: number;
  status: 'Pending' | 'Received' | 'Partial';
  supplier: string;
}

export default function ItemAnalyticsModal({ item, batches, onClose }: ItemAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'usage' | 'orders' | 'forecast' | 'settings'>('usage');
  const [isEditingLevels, setIsEditingLevels] = useState(false);
  const [editedLevels, setEditedLevels] = useState({
    minLevel: item?.minLevel || 0,
    maxLevel: 0,
    bufferLevel: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    leadTime: 0,
    safetyStock: 0
  });
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [orderData, setOrderData] = useState<OrderData[]>([]);

  useEffect(() => {
    if (!item) return;

    // Initialize edited levels with calculated values
    const leadTime = item.category === 'Drug' ? 14 : 7;
    const dailyUsage = 10; // Placeholder for average daily usage
    const safetyStock = dailyUsage * 5; // 5 days of safety stock
    const reorderPoint = item.minLevel + safetyStock;
    const reorderQuantity = item.minLevel * 2;
    const maxLevel = item.minLevel * 3;
    const bufferLevel = item.minLevel * 0.5;

    setEditedLevels({
      minLevel: item.minLevel,
      maxLevel,
      bufferLevel,
      reorderPoint,
      reorderQuantity,
      leadTime,
      safetyStock
    });

    // Generate mock usage data for the last 12 months
    const months = [
      'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
      'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
    ];

    const mockUsageData: UsageData[] = months.map((month, index) => {
      const baseUsage = item.category === 'Drug' ? 50 : 30;
      const seasonalFactor = 1 + Math.sin((index / 12) * 2 * Math.PI) * 0.3;
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      const issued = Math.round(baseUsage * seasonalFactor * randomFactor);
      const received = Math.round(issued * (1.2 + Math.random() * 0.6));
      const adjusted = Math.round(issued * 0.1 * (Math.random() - 0.5));
      
      return {
        month,
        received,
        issued,
        adjusted,
        onHand: Math.max(0, received - issued + adjusted)
      };
    });

    setUsageData(mockUsageData);

    // Generate mock order data
    const mockOrderData: OrderData[] = [
      { date: '2024-01-15', quantity: 200, status: 'Received', supplier: 'ABC Medical' },
      { date: '2024-03-20', quantity: 150, status: 'Received', supplier: 'XYZ Pharma' },
      { date: '2024-06-10', quantity: 300, status: 'Received', supplier: 'ABC Medical' },
      { date: '2024-09-05', quantity: 250, status: 'Partial', supplier: 'XYZ Pharma' },
      { date: '2024-12-01', quantity: 180, status: 'Pending', supplier: 'ABC Medical' },
    ];

    setOrderData(mockOrderData);
  }, [item]);

  if (!item) return null;

  const itemBatches = batches.filter(batch => batch.itemId === item.id);
  const totalOnHand = itemBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const avgMonthlyUsage = usageData.length > 0 
    ? usageData.reduce((sum, data) => sum + data.issued, 0) / usageData.length 
    : 0;
  const monthsOfStock = avgMonthlyUsage > 0 ? totalOnHand / avgMonthlyUsage : 0;

  const maxValue = usageData.length > 0 
    ? Math.max(...usageData.map(d => Math.max(d.received, d.issued, d.onHand)))
    : 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-slate-200/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{item.name}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">{item.drugCode}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-300">{item.brandName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-300">{item.dosageForm}</span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                  <span>SKU: {item.sku}</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="capitalize">{item.category}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-50/50 border-b border-slate-200">
          <nav className="flex space-x-1 px-8 py-2">
            {[
              { id: 'usage', label: 'Usage Analytics', icon: '📊' },
              { id: 'orders', label: 'Order History', icon: '📦' },
              { id: 'forecast', label: 'Forecast', icon: '🔮' },
              { id: 'settings', label: 'Buffer Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-6 py-4 font-medium text-sm rounded-xl transition-all duration-200 group ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50 border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'usage' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Current Stock</div>
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-1">{totalOnHand}</div>
                    <div className="text-xs text-blue-600">units available</div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200/50">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Avg Monthly Usage</div>
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-emerald-900 mb-1">
                      {isNaN(avgMonthlyUsage) ? 0 : Math.round(avgMonthlyUsage)}
                    </div>
                    <div className="text-xs text-emerald-600">units per month</div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200/50">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Months of Stock</div>
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-amber-900 mb-1">
                      {isNaN(monthsOfStock) ? '0.0' : monthsOfStock.toFixed(1)}
                    </div>
                    <div className="text-xs text-amber-600">months remaining</div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-violet-200/50">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-200 to-violet-300 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-violet-700 uppercase tracking-wide">Min Level</div>
                      <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-violet-900 mb-1">{item.minLevel}</div>
                    <div className="text-xs text-violet-600">reorder threshold</div>
                  </div>
                </div>
              </div>

              {/* Usage Chart */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">12-Month Usage Trend</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-slate-600">Received</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-slate-600">Issued</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-600">On Hand</span>
                    </div>
                  </div>
                </div>
                
                {/* Line Chart */}
                <div className="relative h-80 bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-100">
                  <svg className="w-full h-full" viewBox="0 0 800 300">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Y-axis labels */}
                    {[0, 20, 40, 60, 80, 100].map((value, index) => (
                      <g key={value}>
                        <line x1="60" y1={250 - (value / 100) * 200} x2="750" y2={250 - (value / 100) * 200} stroke="#e2e8f0" strokeWidth="1" opacity="0.5"/>
                        <text x="50" y={250 - (value / 100) * 200 + 5} textAnchor="end" className="text-xs fill-slate-500 font-medium">{value}</text>
                      </g>
                    ))}
                    
                    {/* X-axis labels */}
                    {usageData.map((data, index) => (
                      <text key={data.month} x={100 + (index * 60)} y="290" textAnchor="middle" className="text-xs fill-slate-500 font-medium">
                        {data.month.split(' ')[0]}
                      </text>
                    ))}
                    
                    {/* Received line */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={usageData.map((data, index) => 
                        `${100 + (index * 60)},${250 - (data.received / maxValue) * 200}`
                      ).join(' ')}
                    />
                    
                    {/* Issued line */}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={usageData.map((data, index) => 
                        `${100 + (index * 60)},${250 - (data.issued / maxValue) * 200}`
                      ).join(' ')}
                    />
                    
                    {/* On Hand line */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={usageData.map((data, index) => 
                        `${100 + (index * 60)},${250 - (data.onHand / maxValue) * 200}`
                      ).join(' ')}
                    />
                    
                    {/* Data points */}
                    {usageData.map((data, index) => (
                      <g key={data.month}>
                        {/* Received point */}
                        <circle
                          cx={100 + (index * 60)}
                          cy={250 - (data.received / maxValue) * 200}
                          r="4"
                          fill="#10b981"
                          className="hover:r-6 transition-all duration-200"
                        />
                        
                        {/* Issued point */}
                        <circle
                          cx={100 + (index * 60)}
                          cy={250 - (data.issued / maxValue) * 200}
                          r="4"
                          fill="#ef4444"
                          className="hover:r-6 transition-all duration-200"
                        />
                        
                        {/* On Hand point */}
                        <circle
                          cx={100 + (index * 60)}
                          cy={250 - (data.onHand / maxValue) * 200}
                          r="4"
                          fill="#3b82f6"
                          className="hover:r-6 transition-all duration-200"
                        />
                      </g>
                    ))}
                  </svg>
                </div>
                
                {/* Data table below chart */}
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Month</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Received</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Issued</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">On Hand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usageData.map((data, index) => (
                        <tr key={data.month} className="hover:bg-slate-50 transition-colors duration-150">
                          <td className="py-2 px-3 text-sm font-medium text-slate-700">{data.month}</td>
                          <td className="py-2 px-3 text-sm text-slate-600 text-right">{data.received}</td>
                          <td className="py-2 px-3 text-sm text-slate-600 text-right">{data.issued}</td>
                          <td className="py-2 px-3 text-sm font-semibold text-slate-900 text-right">{data.onHand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Batch Details */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Current Batches</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">Batch No</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">Quantity</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">Expiry Date</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemBatches.map(batch => {
                        const expiryDate = new Date(batch.expiry);
                        const today = new Date();
                        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <tr key={batch.id} className="hover:bg-slate-50 transition-colors duration-200">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </div>
                                <span className="font-mono text-sm font-semibold text-slate-900">{batch.batchNo}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-lg font-bold text-slate-900">{batch.quantity}</div>
                              <div className="text-xs text-slate-500">units</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-slate-900">{batch.expiry}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                daysToExpiry < 0 ? 'bg-red-100 text-red-800' :
                                daysToExpiry < 30 ? 'bg-orange-100 text-orange-800' :
                                daysToExpiry < 90 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {daysToExpiry < 0 ? 'Expired' : 
                                 daysToExpiry === 0 ? 'Expires Today' :
                                 daysToExpiry < 30 ? `${daysToExpiry} days left` :
                                 daysToExpiry < 90 ? `${daysToExpiry} days left` :
                                 `${daysToExpiry} days left`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Order History</h3>
                <div className="space-y-4">
                  {orderData.map((order, index) => (
                    <div key={index} className="group bg-gradient-to-r from-slate-50 to-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-slate-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors duration-200">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-lg">{order.supplier}</div>
                            <div className="text-sm text-slate-500 flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{order.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900 mb-2">{order.quantity} units</div>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                            order.status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status === 'Received' && '✓ '}
                            {order.status === 'Partial' && '⚠ '}
                            {order.status === 'Pending' && '⏳ '}
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Demand Forecast & Recommendations</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-6 text-lg">Next 3 Months Forecast</h4>
                    <div className="space-y-4">
                      {['Jan 2025', 'Feb 2025', 'Mar 2025'].map((month, index) => {
                        const forecast = Math.round((isNaN(avgMonthlyUsage) ? 0 : avgMonthlyUsage) * (1 + (Math.random() - 0.5) * 0.2));
                        return (
                          <div key={month} className="group bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <span className="font-semibold text-slate-700">{month}</span>
                              </div>
                              <span className="text-2xl font-bold text-slate-900">{forecast} units</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-6 text-lg">Smart Recommendations</h4>
                    <div className="space-y-4">
                      <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="font-bold text-blue-900 text-lg">Reorder Point</div>
                        </div>
                        <div className="text-blue-800">Order when stock reaches <span className="font-bold">{item.minLevel} units</span></div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="font-bold text-emerald-900 text-lg">Suggested Order</div>
                        </div>
                        <div className="text-emerald-800">Order <span className="font-bold">{Math.round((isNaN(avgMonthlyUsage) ? 0 : avgMonthlyUsage) * 2)} units</span> for optimal stock levels</div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="font-bold text-amber-900 text-lg">Lead Time</div>
                        </div>
                        <div className="text-amber-800">Place orders <span className="font-bold">{item.category === 'Drug' ? '14' : '7'} days</span> in advance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Buffer Level Configuration</h3>
                  <button
                    onClick={() => setIsEditingLevels(!isEditingLevels)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isEditingLevels
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isEditingLevels ? '✓ Save Changes' : '✏️ Edit Levels'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Stock Status */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-4 text-lg">Current Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Current Stock</span>
                        <span className="font-bold text-slate-900">{totalOnHand} units</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          totalOnHand === 0 ? 'bg-red-100 text-red-800' :
                          totalOnHand < editedLevels.minLevel ? 'bg-orange-100 text-orange-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {totalOnHand === 0 ? 'Out of Stock' :
                           totalOnHand < editedLevels.minLevel ? 'Low Stock' :
                           'In Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buffer Level Settings */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Min Level</label>
                        <input
                          type="number"
                          value={editedLevels.minLevel}
                          onChange={(e) => setEditedLevels(prev => ({ ...prev, minLevel: Number(e.target.value) }))}
                          disabled={!isEditingLevels}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                            isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Level</label>
                        <input
                          type="number"
                          value={editedLevels.maxLevel}
                          onChange={(e) => setEditedLevels(prev => ({ ...prev, maxLevel: Number(e.target.value) }))}
                          disabled={!isEditingLevels}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                            isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Buffer Level</label>
                        <input
                          type="number"
                          value={editedLevels.bufferLevel}
                          onChange={(e) => setEditedLevels(prev => ({ ...prev, bufferLevel: Number(e.target.value) }))}
                          disabled={!isEditingLevels}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                            isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Reorder Point</label>
                        <input
                          type="number"
                          value={editedLevels.reorderPoint}
                          onChange={(e) => setEditedLevels(prev => ({ ...prev, reorderPoint: Number(e.target.value) }))}
                          disabled={!isEditingLevels}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                            isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Reorder Qty</label>
                        <input
                          type="number"
                          value={editedLevels.reorderQuantity}
                          onChange={(e) => setEditedLevels(prev => ({ ...prev, reorderQuantity: Number(e.target.value) }))}
                          disabled={!isEditingLevels}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                            isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Lead Time (Days)</label>
                        <input
                          type="number"
                          value={editedLevels.leadTime}
                          onChange={(e) => setEditedLevels(prev => ({ ...prev, leadTime: Number(e.target.value) }))}
                          disabled={!isEditingLevels}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                            isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Safety Stock</label>
                      <input
                        type="number"
                        value={editedLevels.safetyStock}
                        onChange={(e) => setEditedLevels(prev => ({ ...prev, safetyStock: Number(e.target.value) }))}
                        disabled={!isEditingLevels}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                          isEditingLevels ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {isEditingLevels && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">Changes will be saved automatically when you click "Save Changes"</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
