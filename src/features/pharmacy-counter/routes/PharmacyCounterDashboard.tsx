'use client';

import { useState } from 'react';
import {
  getPrescriptions,
  getPharmacists,
  getPharmacyCounterStats,
} from '../services/mockPharmacyCounterData';
import type { Prescription } from '../types/PharmacyCounter';
import { PrescriptionQueue } from '../components/PrescriptionQueue';

export default function PharmacyCounterDashboard() {
  const prescriptions = getPrescriptions();
  const pharmacists = getPharmacists();
  const stats = getPharmacyCounterStats();

  const handleViewPrescription = (prescription: Prescription) => {
    console.log('Viewing prescription:', prescription);
  };

  const handleStartDispensing = (prescriptionId: string) => {
    console.log('Starting dispensing for:', prescriptionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pharmacy Counter</h1>
              <p className="text-green-100 mt-1">
                Prescription dispensing, patient counseling, and medication verification
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-green-100">Queue Size</div>
                <div className="text-2xl font-bold">{stats.currentQueueSize}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-green-100">Avg Wait</div>
                <div className="text-2xl font-bold">{stats.averageWaitTime} min</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Prescriptions Today */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Prescriptions Today
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalPrescriptionsToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingPrescriptions} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                💊
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600 font-semibold">
                  {stats.statPrescriptions} STAT
                </span>
                <span className="text-orange-600 font-semibold">
                  {stats.urgentPrescriptions} Urgent
                </span>
              </div>
            </div>
          </div>

          {/* Dispensed */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Dispensed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.dispensedPrescriptions}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.prescriptionsPerHour} per hour
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-600">
                Avg time: {stats.averageDispensingTime} min
              </div>
            </div>
          </div>

          {/* Clinical Interventions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Clinical Interventions
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.interactionsCaught + stats.allergiesPrevented + stats.duplicateTherapyDetected}
                </p>
                <p className="text-xs text-gray-500 mt-1">Safety checks</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
                ⚠️
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-1 text-xs text-center">
                <div>
                  <div className="font-semibold text-orange-600">{stats.interactionsCaught}</div>
                  <div className="text-gray-500">Interactions</div>
                </div>
                <div>
                  <div className="font-semibold text-red-600">{stats.allergiesPrevented}</div>
                  <div className="text-gray-500">Allergies</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-600">{stats.duplicateTherapyDetected}</div>
                  <div className="text-gray-500">Duplicates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Counseling */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Counseling</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.counselingSessionsToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">Sessions today</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                👨‍⚕️
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-600">
                Avg duration: {stats.averageCounselingTime} min
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacists on Duty */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            👨‍⚕️ Pharmacists on Duty
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pharmacists
              .filter((p) => p.onDuty)
              .map((pharm) => (
                <div
                  key={pharm.id}
                  className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {pharm.name}
                        </p>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            pharm.availableForDispensing
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {pharm.availableForDispensing ? '✓' : 'Busy'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{pharm.counterNumber}</p>
                      {pharm.specialization && pharm.specialization.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {pharm.specialization.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {pharm.prescriptionsDispensedToday}
                      </p>
                      <p className="text-xs text-gray-500">dispensed</p>
                      <p className="text-xs text-orange-600 font-semibold mt-1">
                        {pharm.pendingPrescriptions} pending
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Financial Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                RM {stats.totalRevenueToday.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {stats.insuranceClaimsToday}
              </div>
              <div className="text-xs text-gray-600 mt-1">Insurance Claims</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {stats.outOfStockItems}
              </div>
              <div className="text-xs text-gray-600 mt-1">Out of Stock</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {stats.nearExpiryAlerts}
              </div>
              <div className="text-xs text-gray-600 mt-1">Near Expiry Alerts</div>
            </div>
          </div>
        </div>

        {/* Prescription Queue */}
        <PrescriptionQueue
          prescriptions={prescriptions}
          onViewPrescription={handleViewPrescription}
          onStartDispensing={handleStartDispensing}
        />
      </div>
    </div>
  );
}







