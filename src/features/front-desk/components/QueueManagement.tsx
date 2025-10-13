'use client';

import { useState } from 'react';
import type { QueueEntry, Counter } from '../types/FrontDesk';

interface QueueManagementProps {
  queueEntries: QueueEntry[];
  counters: Counter[];
}

export function QueueManagement({
  queueEntries,
  counters,
}: QueueManagementProps) {
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const getStatusColor = (status: string) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      called: 'bg-blue-100 text-blue-800',
      serving: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-600',
    };
    return colors[status as keyof typeof colors] || colors.waiting;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      normal: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getCounterStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-600',
    };
    return colors[status as keyof typeof colors] || colors.closed;
  };

  const filteredQueue = queueEntries.filter((entry) => {
    if (filterDepartment === 'all') return true;
    return entry.department === filterDepartment;
  });

  const departments = Array.from(
    new Set(queueEntries.map((entry) => entry.department))
  );

  const waitingCount = queueEntries.filter((e) => e.status === 'waiting').length;
  const servingCount = queueEntries.filter((e) => e.status === 'serving').length;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor(
      (endTime.getTime() - start.getTime()) / 1000 / 60
    );
    return `${duration} min`;
  };

  return (
    <div className="space-y-6">
      {/* Counter Status */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Counter Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {counters.map((counter) => (
            <div
              key={counter.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  {counter.counterNumber}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getCounterStatusColor(counter.status)}`}
                >
                  {counter.status}
                </span>
              </div>
              {counter.staffName && (
                <p className="text-xs text-gray-600 mb-1">
                  {counter.staffName}
                </p>
              )}
              {counter.currentPatient && (
                <p className="text-xs text-blue-600 font-medium">
                  Serving: {counter.currentPatient}
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {counter.servicesOffered.slice(0, 2).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Display */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Queue Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {waitingCount} waiting • {servingCount} being served
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Call Next
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                + Add to Queue
              </button>
            </div>
          </div>

          {/* Department Filter */}
          <div className="flex gap-3">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Queue No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQueue.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {entry.queueNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {entry.patientName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {entry.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {entry.serviceType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}
                    >
                      {entry.priority.charAt(0).toUpperCase() +
                        entry.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">
                        {formatTime(entry.joinedAt)}
                      </span>
                      {entry.status === 'waiting' && (
                        <span className="text-xs text-orange-600 font-medium">
                          Wait: {formatDuration(entry.joinedAt)}
                        </span>
                      )}
                      {entry.servingAt && (
                        <span className="text-xs text-gray-500">
                          Serving: {formatDuration(entry.servingAt)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}
                    >
                      {entry.status.charAt(0).toUpperCase() +
                        entry.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.currentlyServing && (
                      <span className="text-sm font-medium text-blue-600">
                        {entry.currentlyServing}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredQueue.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No queue entries found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








