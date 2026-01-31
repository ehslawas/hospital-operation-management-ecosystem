'use client';

import Link from 'next/link';
import { IconBox, IconChart, IconFile, IconCog } from '@/components/ui/Icons';

export default function SystemOverview() {
  const systemItems = [
    {
      title: 'Stock Verification',
      description: 'Conduct physical stock counts and verify inventory accuracy',
      href: '/stock-verification',
      icon: <IconBox />,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      features: ['Physical Counts', 'Variance Analysis', 'Reconciliation', 'Audit Trail']
    },
    {
      title: 'Reports',
      description: 'Generate comprehensive reports and analytics for inventory management',
      href: '/reports',
      icon: <IconChart />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      features: ['Inventory Reports', 'Usage Analytics', 'Performance Metrics', 'Export Options']
    },
    {
      title: 'Logs',
      description: 'View system activity logs and track user actions for audit purposes',
      href: '/logs',
      icon: <IconFile />,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      features: ['Activity Logs', 'User Actions', 'System Events', 'Audit Trail']
    },
    {
      title: 'Settings',
      description: 'Configure system parameters and manage application settings',
      href: '/settings',
      icon: <IconCog />,
      color: 'from-gray-500 to-slate-600',
      bgColor: 'from-gray-50 to-slate-50',
      features: ['System Config', 'User Management', 'Preferences', 'Security Settings']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/30 to-slate-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gray-400/10 to-slate-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vh)] bg-gradient-to-br from-purple-400/5 to-pink-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <IconCog />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 bg-clip-text text-transparent">
                  System Management
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Comprehensive system administration and configuration tools
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-700">2</div>
                <div className="text-sm text-blue-600 font-semibold">Pending Verifications</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200/50">
                <div className="text-3xl font-bold text-green-700">15</div>
                <div className="text-sm text-green-600 font-semibold">Reports Generated</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/50">
                <div className="text-3xl font-bold text-purple-700">1,247</div>
                <div className="text-sm text-purple-600 font-semibold">Log Entries</div>
              </div>
              <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-2xl p-6 border border-gray-200/50">
                <div className="text-3xl font-bold text-gray-700">8</div>
                <div className="text-sm text-gray-600 font-semibold">Active Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {systemItems.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Content */}
              <div className="relative p-8">
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`relative group/icon`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300`}></div>
                    <div className={`relative h-12 w-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {item.icon}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {item.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`}></div>
                        <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`w-8 h-8 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          ))}
        </div>

        {/* System Status */}
        <div className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">System Health</h3>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Uptime</h3>
                <p className="text-sm text-gray-600">99.9% availability</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
                <p className="text-sm text-gray-600">Optimal response times</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
