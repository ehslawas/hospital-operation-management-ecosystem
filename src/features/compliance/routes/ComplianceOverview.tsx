'use client';

import Link from 'next/link';
import { IconFile, IconAlert, IconArrows } from '@/components/ui/Icons';

export default function ComplianceOverview() {
  const complianceItems = [
    {
      title: 'LOU Oversight',
      description: 'Monitor Letter of Understanding compliance and track regulatory adherence',
      href: '/lou',
      icon: <IconFile />,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      features: ['Compliance Tracking', 'Document Management', 'Regulatory Updates', 'Audit Support']
    },
    {
      title: 'Penalty Oversight',
      description: 'Track and manage penalties, violations, and corrective actions',
      href: '/penalties',
      icon: <IconAlert />,
      color: 'from-red-500 to-rose-600',
      bgColor: 'from-red-50 to-rose-50',
      features: ['Penalty Tracking', 'Violation Management', 'Corrective Actions', 'Reporting']
    },
    {
      title: 'Defective Stock',
      description: 'Identify and manage defective or damaged inventory items',
      href: '/bad-stock',
      icon: <IconAlert />,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'from-orange-50 to-amber-50',
      features: ['Defect Tracking', 'Quality Control', 'Disposal Management', 'Vendor Notifications']
    },
    {
      title: 'Near-Expiry Items',
      description: 'Monitor items approaching expiration and manage disposal protocols',
      href: '/near-expiry',
      icon: <IconAlert />,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50',
      features: ['Expiry Monitoring', 'Alert System', 'Disposal Planning', 'Inventory Rotation']
    },
    {
      title: 'Slow-Moving Stock',
      description: 'Track slow-moving inventory and optimize stock rotation strategies',
      href: '/slow-moving',
      icon: <IconArrows />,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      features: ['Movement Analysis', 'Rotation Strategies', 'Demand Forecasting', 'Optimization']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-red-400/10 to-orange-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/5 to-pink-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-red-50/20 to-orange-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <IconAlert />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-red-900 to-orange-900 bg-clip-text text-transparent">
                  Compliance & Risk Management
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Comprehensive compliance monitoring and risk management system
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-700">3</div>
                <div className="text-sm text-blue-600 font-semibold">Active LOUs</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-2xl p-6 border border-red-200/50">
                <div className="text-3xl font-bold text-red-700">2</div>
                <div className="text-sm text-red-600 font-semibold">Open Penalties</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-6 border border-orange-200/50">
                <div className="text-3xl font-bold text-orange-700">7</div>
                <div className="text-sm text-orange-600 font-semibold">Defective Items</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-200/50">
                <div className="text-3xl font-bold text-yellow-700">15</div>
                <div className="text-sm text-yellow-600 font-semibold">Near-Expiry</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/50">
                <div className="text-3xl font-bold text-purple-700">23</div>
                <div className="text-sm text-purple-600 font-semibold">Slow-Moving</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {complianceItems.map((item, index) => (
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
      </div>
    </div>
  );
}
