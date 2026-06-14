'use client';

import Link from 'next/link';
import { IconReceipt, IconTruck, IconFile, IconMoney } from '@/components/ui/Icons';

export default function ProcurementOverview() {
  const procurementItems = [
    {
      title: 'Purchase Orders',
      description: 'Manage and track purchase orders for pharmaceutical and medical supplies',
      href: '/purchase-orders',
      icon: <IconReceipt />,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      features: ['Order Management', 'Vendor Tracking', 'Approval Workflow', 'Status Monitoring']
    },
    {
      title: 'LPO Oversight',
      description: 'Oversee Local Purchase Orders and ensure compliance with procurement policies',
      href: '/lpo-management',
      icon: <IconReceipt />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      features: ['LPO Tracking', 'Compliance Monitoring', 'Budget Control', 'Approval Process']
    },
    {
      title: 'Goods Receiving',
      description: 'Process incoming deliveries and verify received goods against purchase orders',
      href: '/delivery-orders',
      icon: <IconTruck />,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      features: ['Delivery Processing', 'Quality Inspection', 'Inventory Updates', 'Documentation']
    },
    {
      title: 'Deliveries Oversight',
      description: 'Monitor and manage delivery operations, track delivery performance and ensure timely completion',
      href: '/deliveries-management',
      icon: <IconTruck />,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-50',
      features: ['Delivery Tracking', 'Performance Monitoring', 'Timeline Management', 'Quality Assurance']
    },
    {
      title: 'Payment Oversight',
      description: 'Manage payment processes and ensure timely settlement of vendor invoices',
      href: '/payment-management',
      icon: <IconMoney />,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      features: ['Payment Processing', 'Invoice Management', 'Vendor Payments', 'Financial Tracking']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vh)] bg-gradient-to-br from-purple-400/5 to-pink-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-6 p-4">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <IconReceipt />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Procurement Management
                </h1>
                <p className="text-base text-gray-600 mt-1">
                  Comprehensive procurement oversight and management system
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-4 border border-blue-200/50">
                <div className="text-2xl font-bold text-blue-700">24</div>
                <div className="text-sm text-blue-600 font-semibold">Active Orders</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-green-200/50">
                <div className="text-2xl font-bold text-green-700">8</div>
                <div className="text-sm text-green-600 font-semibold">Pending LPOs</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-200/50">
                <div className="text-2xl font-bold text-purple-700">12</div>
                <div className="text-sm text-purple-600 font-semibold">Deliveries Today</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-200/50">
                <div className="text-2xl font-bold text-amber-700">RM 45K</div>
                <div className="text-sm text-amber-600 font-semibold">Pending Payments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Procurement Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {procurementItems.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Content */}
              <div className="relative p-6">
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`relative group/icon`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300`}></div>
                    <div className={`relative h-10 w-10 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-xl group-hover/icon:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {item.icon}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Features:</h4>
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
