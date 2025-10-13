'use client';

import { useState } from 'react';
import type { ImagingOrder } from '../types/Radiology';

interface ImagingOrdersQueueProps {
  orders: ImagingOrder[];
  onViewOrder: (order: ImagingOrder) => void;
  onStartStudy: (orderId: string) => void;
}

export function ImagingOrdersQueue({
  orders,
  onViewOrder,
  onStartStudy,
}: ImagingOrdersQueueProps) {
  const [filterModality, setFilterModality] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getPriorityColor = (priority: string) => {
    const colors = {
      routine: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-800',
      stat: 'bg-red-100 text-red-800',
      emergency: 'bg-red-200 text-red-900',
    };
    return colors[priority as keyof typeof colors] || colors.routine;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-800',
      reported: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getModalityColor = (modality: string) => {
    const colors = {
      'X-Ray': 'bg-blue-50 text-blue-700',
      CT: 'bg-purple-50 text-purple-700',
      MRI: 'bg-indigo-50 text-indigo-700',
      Ultrasound: 'bg-cyan-50 text-cyan-700',
      Mammography: 'bg-pink-50 text-pink-700',
      Fluoroscopy: 'bg-teal-50 text-teal-700',
    };
    return colors[modality as keyof typeof colors] || 'bg-gray-50 text-gray-700';
  };

  const filteredOrders = orders.filter((order) => {
    const matchesModality =
      filterModality === 'all' || order.modality === filterModality;
    const matchesPriority =
      filterPriority === 'all' || order.priority === filterPriority;
    const matchesSearch =
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientMRN.includes(searchTerm);
    return matchesModality && matchesPriority && matchesSearch;
  });

  const modalities = Array.from(new Set(orders.map((o) => o.modality)));

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Imaging Orders Queue
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredOrders.length} orders in queue
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + New Order
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by patient name, MRN, or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={filterModality}
            onChange={(e) => setFilterModality(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Modalities</option>
            {modalities.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="emergency">Emergency</option>
            <option value="stat">STAT</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Modality
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Study Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ordering Dept
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Scheduled
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
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.patientMRN}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(order.priority)}`}
                  >
                    {order.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {order.patientName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.gender}, {order.age} years
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.patientIC}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${getModalityColor(order.modality)}`}
                  >
                    {order.modality}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col max-w-xs">
                    <span className="text-sm text-gray-900 font-medium">
                      {order.studyType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.bodyPart}
                      {order.laterality && ` (${order.laterality})`}
                    </span>
                    {order.contrast && (
                      <span className="text-xs text-orange-600 font-medium mt-0.5">
                        ⚠️ Contrast required
                      </span>
                    )}
                    {order.portable && (
                      <span className="text-xs text-purple-600 font-medium">
                        📱 Portable
                      </span>
                    )}
                    {order.isolation && (
                      <span className="text-xs text-red-600 font-medium">
                        🛡️ Isolation
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900">
                      {order.orderingDepartment}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.orderingPhysician}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.scheduledDate && order.scheduledTime ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900">
                        {order.scheduledTime}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.scheduledDate).toLocaleDateString('en-MY')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Not scheduled</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status === 'in-progress' && 'In Progress'}
                    {order.status === 'pending' && 'Pending'}
                    {order.status === 'scheduled' && 'Scheduled'}
                    {order.status === 'completed' && 'Completed'}
                    {order.status === 'cancelled' && 'Cancelled'}
                    {order.status === 'reported' && 'Reported'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    {(order.status === 'pending' || order.status === 'scheduled') && (
                      <button
                        onClick={() => onStartStudy(order.id)}
                        className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No imaging orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}








