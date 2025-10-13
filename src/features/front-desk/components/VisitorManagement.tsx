'use client';

import { useState } from 'react';
import type { Visitor } from '../types/FrontDesk';

interface VisitorManagementProps {
  visitors: Visitor[];
  onCheckOut: (visitorId: string) => void;
  onViewDetails: (visitor: Visitor) => void;
}

export function VisitorManagement({
  visitors,
  onCheckOut,
  onViewDetails,
}: VisitorManagementProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getVisitorTypeColor = (type: string) => {
    const colors = {
      patient: 'bg-blue-100 text-blue-800',
      family: 'bg-green-100 text-green-800',
      vendor: 'bg-purple-100 text-purple-800',
      official: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'checked-in': 'bg-blue-100 text-blue-800',
      visiting: 'bg-green-100 text-green-800',
      'checked-out': 'bg-gray-100 text-gray-600',
    };
    return colors[status as keyof typeof colors] || colors['checked-in'];
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const matchesStatus =
      filterStatus === 'all' || visitor.status === filterStatus;
    const matchesSearch =
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.icNumber.includes(searchTerm) ||
      visitor.badgeNumber?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const activeVisitors = visitors.filter((v) => v.status !== 'checked-out').length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Visitor Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeVisitors} active visitors currently in the hospital
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + New Check-In
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, IC, or badge number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="checked-in">Checked In</option>
            <option value="visiting">Visiting</option>
            <option value="checked-out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Badge
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Visitor
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Check-In
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Health
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVisitors.map((visitor) => (
              <tr
                key={visitor.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {visitor.badgeIssued ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {visitor.badgeNumber}
                        </span>
                        <span className="text-xs text-gray-500">Issued</span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">
                        No Badge
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {visitor.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {visitor.icNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      {visitor.contactNumber}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getVisitorTypeColor(visitor.type)}`}
                  >
                    {visitor.type.charAt(0).toUpperCase() + visitor.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col max-w-xs">
                    <span className="text-sm text-gray-900">
                      {visitor.purposeOfVisit}
                    </span>
                    {visitor.hostName && (
                      <span className="text-xs text-gray-500 mt-0.5">
                        Host: {visitor.hostName}
                      </span>
                    )}
                    {visitor.hostDepartment && (
                      <span className="text-xs text-gray-500">
                        {visitor.hostDepartment}
                        {visitor.hostBedNumber && ` • ${visitor.hostBedNumber}`}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900">
                      {formatTime(visitor.checkInTime)}
                    </span>
                    {visitor.checkOutTime && (
                      <span className="text-xs text-gray-500">
                        Out: {formatTime(visitor.checkOutTime)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}
                  >
                    {visitor.status === 'checked-in' && 'Checked In'}
                    {visitor.status === 'visiting' && 'Visiting'}
                    {visitor.status === 'checked-out' && 'Checked Out'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    {visitor.temperatureChecked && visitor.temperature && (
                      <span
                        className={`text-xs font-medium ${
                          visitor.temperature > 37.5
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {visitor.temperature}°C
                      </span>
                    )}
                    {visitor.healthDeclarationSigned && (
                      <span className="text-xs text-gray-500">✓ Signed</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(visitor)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    {visitor.status !== 'checked-out' && (
                      <button
                        onClick={() => onCheckOut(visitor.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVisitors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No visitors found</p>
          </div>
        )}
      </div>
    </div>
  );
}










