'use client';

import { useState } from 'react';
import type { Appointment } from '../types/FrontDesk';

interface AppointmentSchedulerProps {
  appointments: Appointment[];
  onCheckIn: (appointmentId: string) => void;
  onViewDetails: (appointment: Appointment) => void;
}

export function AppointmentScheduler({
  appointments,
  onCheckIn,
  onViewDetails,
}: AppointmentSchedulerProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      arrived: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-600',
      'no-show': 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const getAppointmentTypeIcon = (type: string) => {
    const icons = {
      consultation: '🩺',
      'follow-up': '📋',
      procedure: '🏥',
      vaccination: '💉',
      screening: '🔬',
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesDepartment =
      filterDepartment === 'all' || apt.department === filterDepartment;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.appointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientIC.includes(searchTerm);
    return matchesStatus && matchesDepartment && matchesSearch;
  });

  const departments = Array.from(
    new Set(appointments.map((apt) => apt.department))
  );

  const upcomingCount = appointments.filter(
    (apt) => apt.status === 'scheduled' || apt.status === 'arrived'
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Appointment Scheduler
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {upcomingCount} appointments pending today
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + Book Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, IC, or appointment number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="arrived">Arrived</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="no-show">No Show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Apt. No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAppointments.map((apt) => (
              <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {apt.appointmentNumber}
                    </span>
                    {apt.queueNumber && (
                      <span className="text-xs text-gray-500 mt-0.5">
                        Q: {apt.queueNumber}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {apt.appointmentTime}
                    </span>
                    <span className="text-xs text-gray-500">
                      {apt.estimatedDuration} min
                    </span>
                    {apt.arrivedAt && (
                      <span className="text-xs text-green-600 font-medium mt-0.5">
                        ✓ Arrived{' '}
                        {new Date(apt.arrivedAt).toLocaleTimeString('en-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {apt.patientName}
                    </span>
                    <span className="text-xs text-gray-500">{apt.patientIC}</span>
                    <span className="text-xs text-gray-500">
                      {apt.patientContact}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{apt.department}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{apt.doctor}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">
                      {getAppointmentTypeIcon(apt.appointmentType)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 capitalize">
                        {apt.appointmentType}
                      </span>
                      {apt.isFollowUp && (
                        <span className="text-xs text-blue-600 font-medium">
                          Follow-up
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}
                  >
                    {apt.status === 'scheduled' && 'Scheduled'}
                    {apt.status === 'arrived' && 'Arrived'}
                    {apt.status === 'in-progress' && 'In Progress'}
                    {apt.status === 'completed' && 'Completed'}
                    {apt.status === 'no-show' && 'No Show'}
                    {apt.status === 'cancelled' && 'Cancelled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(apt)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => onCheckIn(apt.id)}
                        className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No appointments found</p>
          </div>
        )}
      </div>
    </div>
  );
}








