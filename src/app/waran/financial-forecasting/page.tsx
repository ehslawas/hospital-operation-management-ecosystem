'use client';

import { useState, useEffect } from 'react';

export default function FinancialForecastingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('12');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [department, setDepartment] = useState<string>('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  // Mock data for financial forecasting
  const forecastData = [
    {
      id: 'FC-001',
      department: 'Pharmacy',
      category: 'Drug Procurement',
      currentBudget: 2500000,
      projectedSpend: 2800000,
      variance: 300000,
      variancePercent: 12,
      trend: 'increasing',
      confidence: 85,
      lastUpdated: '2024-01-15',
      forecastPeriod: 'Q1 2024'
    },
    {
      id: 'FC-002',
      department: 'Pharmacy',
      category: 'Equipment Maintenance',
      currentBudget: 500000,
      projectedSpend: 450000,
      variance: -50000,
      variancePercent: -10,
      trend: 'decreasing',
      confidence: 92,
      lastUpdated: '2024-01-14',
      forecastPeriod: 'Q1 2024'
    },
    {
      id: 'FC-003',
      department: 'Laboratory',
      category: 'Test Kits & Reagents',
      currentBudget: 1800000,
      projectedSpend: 1950000,
      variance: 150000,
      variancePercent: 8.3,
      trend: 'increasing',
      confidence: 78,
      lastUpdated: '2024-01-13',
      forecastPeriod: 'Q1 2024'
    },
    {
      id: 'FC-004',
      department: 'Radiology',
      category: 'Imaging Equipment',
      currentBudget: 3200000,
      projectedSpend: 3100000,
      variance: -100000,
      variancePercent: -3.1,
      trend: 'stable',
      confidence: 88,
      lastUpdated: '2024-01-12',
      forecastPeriod: 'Q1 2024'
    },
    {
      id: 'FC-005',
      department: 'Emergency',
      category: 'Emergency Supplies',
      currentBudget: 800000,
      projectedSpend: 950000,
      variance: 150000,
      variancePercent: 18.8,
      trend: 'increasing',
      confidence: 72,
      lastUpdated: '2024-01-11',
      forecastPeriod: 'Q1 2024'
    }
  ];

  const departments = ['all', ...Array.from(new Set(forecastData.map(item => item.department)))];

  const filteredData = forecastData.filter(item => 
    selectedDepartment === 'all' || item.department === selectedDepartment
  );

  const totalCurrentBudget = filteredData.reduce((sum, item) => sum + item.currentBudget, 0);
  const totalProjectedSpend = filteredData.reduce((sum, item) => sum + item.projectedSpend, 0);
  const totalVariance = totalProjectedSpend - totalCurrentBudget;
  const totalVariancePercent = (totalVariance / totalCurrentBudget) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Financial Forecasting</h1>
          <p className="text-slate-600">Predict and analyze future financial performance across departments</p>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Forecast Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department Filter</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                  department === 'Office Admin' ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                }`}
                aria-disabled={department === 'Office Admin'}
                title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Generate New Forecast'}
              >
                Generate New Forecast
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Budget</p>
                <p className="text-2xl font-bold text-slate-900">RM {(totalCurrentBudget / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Projected Spend</p>
                <p className="text-2xl font-bold text-slate-900">RM {(totalProjectedSpend / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Variance</p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  RM {(Math.abs(totalVariance) / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-slate-500">
                  {totalVariance >= 0 ? 'Over Budget' : 'Under Budget'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                totalVariance >= 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <span className="text-2xl">{totalVariance >= 0 ? '📈' : '📉'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Variance %</p>
                <p className={`text-2xl font-bold ${totalVariancePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalVariancePercent >= 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                totalVariancePercent >= 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Department Forecasts</h3>
            <p className="text-sm text-slate-600">Financial projections by department and category</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Department & Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Current Budget</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Projected Spend</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Variance</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Trend</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Confidence</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((forecast) => (
                  <tr key={forecast.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{forecast.department}</div>
                        <div className="text-sm text-slate-500">{forecast.category}</div>
                        <div className="text-xs text-slate-400">{forecast.forecastPeriod}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      RM {(forecast.currentBudget / 1000000).toFixed(1)}M
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      RM {(forecast.projectedSpend / 1000000).toFixed(1)}M
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className={`text-sm font-semibold ${forecast.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          RM {(Math.abs(forecast.variance) / 1000000).toFixed(1)}M
                        </div>
                        <div className={`text-xs ${forecast.variance >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {forecast.variance >= 0 ? '+' : ''}{forecast.variancePercent.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${
                          forecast.trend === 'increasing' ? 'text-red-500' :
                          forecast.trend === 'decreasing' ? 'text-green-500' : 'text-blue-500'
                        }`}>
                          {forecast.trend === 'increasing' ? '📈' : 
                           forecast.trend === 'decreasing' ? '📉' : '➡️'}
                        </span>
                        <span className="text-sm font-medium text-slate-700 capitalize">{forecast.trend}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              forecast.confidence >= 80 ? 'bg-green-500' :
                              forecast.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${forecast.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{forecast.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
                        <button className={`text-sm font-medium ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'}`} aria-disabled={department==='Office Admin'} title={department==='Office Admin'?'View-only for Office Admin':'Update'}>Update</button>
                        <button className={`text-sm font-medium ${department === 'Office Admin' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`} aria-disabled={department==='Office Admin'} title={department==='Office Admin'?'View-only for Office Admin':'Delete'}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Analysis</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">High Risk Items</span>
                <span className="text-sm font-bold text-red-600">
                  {filteredData.filter(f => f.variancePercent > 10).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">Medium Risk Items</span>
                <span className="text-sm font-bold text-yellow-600">
                  {filteredData.filter(f => f.variancePercent > 5 && f.variancePercent <= 10).length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Low Risk Items</span>
                <span className="text-sm font-bold text-green-600">
                  {filteredData.filter(f => f.variancePercent <= 5).length}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Forecast Accuracy</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Average Confidence</span>
                <span className="text-sm font-bold text-slate-900">
                  {Math.round(filteredData.reduce((sum, f) => sum + f.confidence, 0) / filteredData.length)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Last Updated</span>
                <span className="text-sm font-bold text-slate-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Total Forecasts</span>
                <span className="text-sm font-bold text-slate-900">{filteredData.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
