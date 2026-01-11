'use client';

import Link from 'next/link';
import { IconBeaker, IconBox, IconFile } from '@/components/ui/Icons';

export default function CatalogOverview() {
  const catalogItems = [
    {
      title: 'Drug Catalog',
      description: 'Comprehensive pharmaceutical inventory management with 200+ drug items',
      href: '/drug-catalog',
      icon: <IconBeaker />,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      stats: '200+ Items',
      features: ['Drug Management', 'Status Control', 'Inventory Tracking', 'Supplier Management']
    },
    {
      title: 'Non Drug Catalog',
      description: 'Medical supplies and equipment inventory with 200+ non-drug items',
      href: '/non-drug-catalog',
      icon: <IconBox />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      stats: '200+ Items',
      features: ['Medical Supplies', 'Equipment Management', 'Specification Tracking', 'Category Organization']
    },
    {
      title: 'Supplier Catalog',
      description: 'Supplier information and performance management system',
      href: '/supplier-catalog',
      icon: <IconFile />,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      stats: 'Coming Soon',
      features: ['Supplier Profiles', 'Performance Metrics', 'Contact Management', 'Contract Tracking']
    },
    {
      title: 'KKM Hospital Catalog',
      description: 'All KKM registered hospitals in Malaysia with comprehensive facility information',
      href: '/kkm-hospital-catalog',
      icon: <IconBeaker />,
      color: 'from-red-500 to-rose-600',
      bgColor: 'from-red-50 to-rose-50',
      stats: '38 Hospitals',
      features: ['Hospital Directory', 'Location Tracking', 'Contact Management', 'Status Monitoring']
    },
    {
      title: 'KKM Clinic Catalog',
      description: 'All KKM registered clinics in Malaysia with service and operating information',
      href: '/kkm-clinic-catalog',
      icon: <IconBeaker />,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'from-orange-50 to-amber-50',
      stats: '100+ Clinics',
      features: ['Clinic Directory', 'Service Information', 'Operating Hours', 'Geographic Coverage']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(600px,90vh)] bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="group relative bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-60 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                  <IconBeaker />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Catalog Management
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Comprehensive inventory management system for drugs, medical supplies, and suppliers
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-6 border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-700">400+</div>
                <div className="text-sm text-blue-600 font-semibold">Total Items</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-200/50">
                <div className="text-3xl font-bold text-green-700">6+</div>
                <div className="text-sm text-green-600 font-semibold">Suppliers</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/50">
                <div className="text-3xl font-bold text-purple-700">3</div>
                <div className="text-sm text-purple-600 font-semibold">Catalog Types</div>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {catalogItems.map((item, index) => (
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
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                      {item.title}
                    </h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${item.color} text-white mt-2`}>
                      {item.stats}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-200">
                  {item.description}
                </p>

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

        {/* Additional Information */}
        <div className="group relative bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl">
          <div className="relative p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Catalog Management Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Edit & Update</h3>
                <p className="text-sm text-gray-600">Modify item details and status in real-time</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Search & Filter</h3>
                <p className="text-sm text-gray-600">Find items quickly with advanced filtering</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-sm text-gray-600">Track inventory status and performance</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Export Data</h3>
                <p className="text-sm text-gray-600">Generate reports and export inventory data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
