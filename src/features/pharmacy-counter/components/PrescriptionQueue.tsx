'use client';

import { useState } from 'react';
import type { Prescription } from '../types/PharmacyCounter';

interface PrescriptionQueueProps {
  prescriptions: Prescription[];
  onViewPrescription: (prescription: Prescription) => void;
  onStartDispensing: (prescriptionId: string) => void;
}

export function PrescriptionQueue({
  prescriptions,
  onViewPrescription,
  onStartDispensing,
}: PrescriptionQueueProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      dispensed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      routine: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-800',
      stat: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || colors.routine;
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesStatus = filterStatus === 'all' || rx.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || rx.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Prescription Queue
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredPrescriptions.length} prescriptions
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="stat">STAT</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="in-progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="dispensed">Dispensed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredPrescriptions.map((rx) => (
          <div
            key={rx.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {rx.queueNumber}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {rx.prescriptionNumber}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getPriorityColor(rx.priority)}`}
                  >
                    {rx.priority}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rx.status)}`}
                  >
                    {rx.status === 'in-progress' && 'In Progress'}
                    {rx.status === 'pending' && 'Pending'}
                    {rx.status === 'verified' && 'Verified'}
                    {rx.status === 'ready' && 'Ready'}
                    {rx.status === 'dispensed' && 'Dispensed'}
                    {rx.status === 'cancelled' && 'Cancelled'}
                  </span>
                </div>

                {/* Patient Info */}
                <div className="mb-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {rx.patientName} ({rx.age}y, {rx.gender})
                  </p>
                  <p className="text-xs text-gray-600">
                    MRN: {rx.patientMRN} • IC: {rx.patientIC}
                  </p>
                </div>

                {/* Medications */}
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Medications ({rx.medications.length}):
                  </p>
                  <div className="space-y-1">
                    {rx.medications.map((med) => (
                      <div
                        key={med.id}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <span className="font-medium">{med.drugName}</span>
                        <span>{med.strength}</span>
                        <span>-</span>
                        <span>{med.dosage} {med.frequency}</span>
                        <span className="text-gray-400">×{med.quantity}</span>
                        {med.isControlled && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                            CONTROLLED
                          </span>
                        )}
                        {med.isHighAlert && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                            HIGH ALERT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                {(rx.hasInteractions || rx.hasAllergies || rx.hasDuplicateTherapy) && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    {rx.hasInteractions && (
                      <p className="text-xs text-red-700 font-semibold">
                        ⚠️ Drug interactions detected
                      </p>
                    )}
                    {rx.hasAllergies && (
                      <p className="text-xs text-red-700 font-semibold">
                        ⚠️ Patient allergies: {rx.allergies.join(', ')}
                      </p>
                    )}
                    {rx.hasDuplicateTherapy && (
                      <p className="text-xs text-red-700 font-semibold">
                        ⚠️ Duplicate therapy detected
                      </p>
                    )}
                  </div>
                )}

                {/* Footer Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    <span className="font-medium">Prescribed by:</span> {rx.prescribedBy}
                  </span>
                  <span>
                    <span className="font-medium">Department:</span> {rx.department}
                  </span>
                  <span>
                    <span className="font-medium">Payment:</span> {rx.paymentMethod}
                  </span>
                  <span className="font-semibold text-gray-700">
                    RM {rx.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex flex-col gap-2">
                <button
                  onClick={() => onViewPrescription(rx)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  View Details
                </button>
                {(rx.status === 'pending' || rx.status === 'verified') && (
                  <button
                    onClick={() => onStartDispensing(rx.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Start Dispensing
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredPrescriptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}








