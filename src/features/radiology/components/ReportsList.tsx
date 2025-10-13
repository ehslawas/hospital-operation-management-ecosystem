'use client';

import { useState } from 'react';
import type { RadiologyReport } from '../types/Radiology';

interface ReportsListProps {
  reports: RadiologyReport[];
  onViewReport: (report: RadiologyReport) => void;
}

export function ReportsList({ reports, onViewReport }: ReportsListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      preliminary: 'bg-yellow-100 text-yellow-800',
      final: 'bg-green-100 text-green-800',
      amended: 'bg-blue-100 text-blue-800',
      signed: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus === 'all') return true;
    return report.status === filterStatus;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Radiology Reports
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredReports.length} reports
            </p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="preliminary">Preliminary</option>
            <option value="final">Final</option>
            <option value="amended">Amended</option>
            <option value="signed">Signed</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Report Header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {report.reportNumber}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                  >
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                  {report.criticalFinding && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                      🚨 CRITICAL
                    </span>
                  )}
                </div>

                {/* Patient & Study Info */}
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {report.patientName} ({report.patientMRN})
                  </p>
                  <p className="text-sm text-gray-700">
                    {report.modality}: {report.studyDescription}
                  </p>
                </div>

                {/* Impression Preview */}
                <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    IMPRESSION:
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {report.impression}
                  </p>
                </div>

                {/* Critical Finding Details */}
                {report.criticalFinding && report.criticalNotifiedTo && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <span className="font-semibold">Critical notification:</span>{' '}
                      {report.criticalNotifiedTo}
                      {report.criticalNotifiedAt && (
                        <> at{' '}
                          {new Date(report.criticalNotifiedAt).toLocaleTimeString(
                            'en-MY',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Reporter & Date */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    <span className="font-medium">Reported by:</span>{' '}
                    {report.reportedBy}
                  </span>
                  <span>
                    {new Date(report.reportDate).toLocaleString('en-MY', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {report.notifiedToReferrer && (
                    <span className="text-green-600 font-medium">
                      ✓ Notified to referrer
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onViewReport(report)}
                className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Full Report →
              </button>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
}








