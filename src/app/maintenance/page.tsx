'use client';

import React from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-gray-600 mt-1">System maintenance and configuration management</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">Catalog</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unit Catalog List</h3>
          <p className="text-gray-600 text-sm mb-4">Manage unit catalogs and item classifications</p>
          <Link href="/maintenance/unit-catalog-list" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Details →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">Location</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Location</h3>
          <p className="text-gray-600 text-sm mb-4">Configure stock locations and storage areas</p>
          <Link href="/maintenance/stock-location" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Details →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">Verification</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Stock Verification</h3>
          <p className="text-gray-600 text-sm mb-4">Perform stock counts and verification processes</p>
          <Link href="/stock-verification" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
