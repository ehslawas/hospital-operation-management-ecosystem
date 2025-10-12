'use client';

import { useState } from 'react';
import {
  getImagingOrders,
  getDICOMStudies,
  getRadiologyReports,
  getRadiologyEquipment,
  getRadiologists,
  getRadiologyStats,
} from '../services/mockRadiologyData';
import type { ImagingOrder, RadiologyReport } from '../types/Radiology';
import { ImagingOrdersQueue } from '../components/ImagingOrdersQueue';
import { EquipmentStatus } from '../components/EquipmentStatus';
import { ReportsList } from '../components/ReportsList';

export default function RadiologyDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'reports' | 'equipment'>(
    'orders'
  );

  const orders = getImagingOrders();
  const studies = getDICOMStudies();
  const reports = getRadiologyReports();
  const equipment = getRadiologyEquipment();
  const radiologists = getRadiologists();
  const stats = getRadiologyStats();

  const handleViewOrder = (order: ImagingOrder) => {
    console.log('Viewing order:', order);
  };

  const handleStartStudy = (orderId: string) => {
    console.log('Starting study for order:', orderId);
  };

  const handleViewReport = (report: RadiologyReport) => {
    console.log('Viewing report:', report);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Radiology Department</h1>
              <p className="text-purple-100 mt-1">
                Medical imaging, DICOM management, and radiology reporting
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-purple-100">Critical Findings Today</div>
                <div className="text-2xl font-bold">
                  {stats.criticalFindingsToday}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Orders Today */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Orders Today
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalOrdersToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingOrders} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600 font-semibold">
                  {stats.statOrders} STAT
                </span>
                <span className="text-orange-600 font-semibold">
                  {stats.urgentOrders} Urgent
                </span>
              </div>
            </div>
          </div>

          {/* Studies Completed */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Studies Completed
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.completedStudies}
                </p>
                <p className="text-xs text-gray-500 mt-1">Today</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Avg duration: {stats.averageStudyDuration} min</span>
              </div>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Pending Reports
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingReports}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Awaiting radiologist review
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-600">
                Avg reporting: {stats.averageReportingTime} min
              </div>
            </div>
          </div>

          {/* Equipment Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Equipment
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.equipmentOperational}/{stats.equipmentOperational + stats.equipmentOffline}
                </p>
                <p className="text-xs text-gray-500 mt-1">Operational</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                🏥
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-600">
                Capacity: {stats.capacityUtilization}% utilization
              </div>
            </div>
          </div>
        </div>

        {/* Radiologists on Duty */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            👨‍⚕️ Radiologists on Duty
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {radiologists
              .filter((r) => r.onDuty)
              .map((rad) => (
                <div
                  key={rad.id}
                  className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {rad.name}
                      </p>
                      <p className="text-xs text-gray-600">{rad.designation}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {rad.specialization.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          rad.availableForReporting
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rad.availableForReporting ? '✓ Available' : 'Busy'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {rad.studiesReportedToday} reported • {rad.pendingReports}{' '}
                        pending
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Modality Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Studies by Modality (Today)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-1">🔬</div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.xrayStudies}
              </div>
              <div className="text-xs text-gray-600 mt-1">X-Ray</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-1">🖥️</div>
              <div className="text-2xl font-bold text-purple-700">
                {stats.ctStudies}
              </div>
              <div className="text-xs text-gray-600 mt-1">CT Scan</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl mb-1">🧲</div>
              <div className="text-2xl font-bold text-indigo-700">
                {stats.mriStudies}
              </div>
              <div className="text-xs text-gray-600 mt-1">MRI</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-2xl mb-1">📡</div>
              <div className="text-2xl font-bold text-cyan-700">
                {stats.ultrasoundStudies}
              </div>
              <div className="text-xs text-gray-600 mt-1">Ultrasound</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'orders'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>📋 Imaging Orders</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {stats.pendingOrders}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'reports'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>📝 Reports</span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                    {stats.pendingReports}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'equipment'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>🏥 Equipment</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {stats.equipmentOperational}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'orders' && (
              <ImagingOrdersQueue
                orders={orders}
                onViewOrder={handleViewOrder}
                onStartStudy={handleStartStudy}
              />
            )}
            {activeTab === 'reports' && (
              <ReportsList reports={reports} onViewReport={handleViewReport} />
            )}
            {activeTab === 'equipment' && (
              <EquipmentStatus equipment={equipment} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}







