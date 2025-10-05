'use client';

import { useState } from 'react';
import { VarianceReport } from '../../types/RequestWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface VarianceReportProps {
  varianceReports: VarianceReport[];
}

export function VarianceReportComponent({ varianceReports }: VarianceReportProps) {
  const [selectedReport, setSelectedReport] = useState<VarianceReport | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative' | 'zero'>('all');

  const filteredReports = varianceReports.filter(report => {
    switch (filterType) {
      case 'positive':
        return report.variance > 0;
      case 'negative':
        return report.variance < 0;
      case 'zero':
        return report.variance === 0;
      default:
        return true;
    }
  });

  const getVarianceBadge = (variance: number, percentage: number) => {
    if (variance === 0) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          No Variance
        </span>
      );
    } else if (variance > 0) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          +{variance} ({percentage.toFixed(1)}%)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {variance} ({percentage.toFixed(1)}%)
        </span>
      );
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance === 0) return '✅';
    if (variance > 0) return '⚠️';
    return '📉';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalVariance = varianceReports.reduce((sum, report) => sum + report.variance, 0);
  const averageVariance = varianceReports.length > 0 ? totalVariance / varianceReports.length : 0;
  const positiveVariances = varianceReports.filter(r => r.variance > 0).length;
  const negativeVariances = varianceReports.filter(r => r.variance < 0).length;
  const zeroVariances = varianceReports.filter(r => r.variance === 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{varianceReports.length}</div>
              <div className="text-sm text-slate-600">Total Reports</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{zeroVariances}</div>
              <div className="text-sm text-slate-600">No Variance</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{positiveVariances}</div>
              <div className="text-sm text-slate-600">Over-Issued</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{negativeVariances}</div>
              <div className="text-sm text-slate-600">Under-Issued</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Variance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Filter:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">All Variances</option>
                <option value="positive">Over-Issued (+)</option>
                <option value="negative">Under-Issued (-)</option>
                <option value="zero">No Variance</option>
              </select>
            </div>
            <div className="text-sm text-slate-600">
              Showing {filteredReports.length} of {varianceReports.length} reports
            </div>
          </div>

          {/* Variance List */}
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No variance reports match your filter criteria.
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getVarianceIcon(report.variance)}</div>
                      <div>
                        <h4 className="font-medium text-slate-800">{report.itemName}</h4>
                        <p className="text-sm text-slate-600">
                          Request: {report.requestId} • {formatDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getVarianceBadge(report.variance, report.variancePercentage)}
                      <div className="text-sm text-slate-600 mt-1">
                        Approved: {report.approvedQuantity} → Issued: {report.issuedQuantity}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Variance Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Item Name</label>
                  <p className="text-slate-800">{selectedReport.itemName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Request ID</label>
                  <p className="text-slate-800">{selectedReport.requestId}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Requested Quantity</label>
                  <p className="text-slate-800">{selectedReport.requestedQuantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Approved Quantity</label>
                  <p className="text-slate-800">{selectedReport.approvedQuantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Issued Quantity</label>
                  <p className="text-slate-800">{selectedReport.issuedQuantity}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Variance</label>
                  <div className="mt-1">
                    {getVarianceBadge(selectedReport.variance, selectedReport.variancePercentage)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Created At</label>
                  <p className="text-slate-800">{formatDate(selectedReport.createdAt)}</p>
                </div>
              </div>

              {selectedReport.reason && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Reason</label>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-lg mt-1">
                    {selectedReport.reason}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

