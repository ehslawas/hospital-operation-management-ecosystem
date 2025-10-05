'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  IconArrowLeft, 
  IconSearch, 
  IconFilter, 
  IconCheck, 
  IconX, 
  IconClock,
  IconTruck,
  IconAlert,
  IconMail,
  IconEye,
  IconRefresh
} from '@/components/ui/Icons';

interface ReminderHistory {
  id: string;
  reminderNumber: number;
  sentDate: string;
  sentTime: string;
  subject: string;
  status: 'SENT' | 'DELIVERED' | 'OPENED' | 'REPLIED';
}

interface OrderTracking {
  id: string;
  poNumber: string;
  lpoNumber: string;
  supplier: string;
  supplierEmail: string;
  supplierContact: string;
  orderDate: string;
  eta: string;
  status: 'ON_TIME' | 'DELIVERED' | 'OVERDUE';
  items: {
    id: string;
    name: string;
    quantity: number;
    category: 'DRUG' | 'NON_DRUG' | 'VACCINE';
  }[];
  totalValue: number;
  department: string;
  voteCode: string;
  voteActivity: string;
  lastEmailSent?: string;
  reminderCount: number;
  lastReminderDate?: string;
  reminderHistory: ReminderHistory[];
  notes?: string;
}

export default function OrderTrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderTracking | null>(null);
  const [emailSent, setEmailSent] = useState<string[]>([]);

  // Generate mock data for order tracking
  const generateMockOrders = (): OrderTracking[] => {
    const orders: OrderTracking[] = [];
    const suppliers = [
      { name: 'PharmaCorp Sdn Bhd', email: 'orders@pharmacorp.com', contact: '+60 3-2234 5678' },
      { name: 'MediSupply Malaysia', email: 'delivery@medisupply.com', contact: '+60 3-9876 5432' },
      { name: 'HealthTech Solutions', email: 'logistics@healthtech.com', contact: '+60 3-4567 8901' },
      { name: 'BioMed Industries', email: 'shipping@biomed.com', contact: '+60 3-2345 6789' },
      { name: 'CarePlus Medical', email: 'orders@careplus.com', contact: '+60 3-3456 7890' }
    ];
    const departments = ['Pharmacy', 'Emergency', 'Laboratory', 'Surgery', 'ICU'];
    const voteCodes = ['990102', '080702'];
    const voteActivities = ['27401', '27499', '27404'];
    const itemNames = [
      'Paracetamol 500mg', 'Ibuprofen 400mg', 'Amoxicillin 250mg', 'Aspirin 100mg',
      'Surgical Gloves', 'Syringe 5ml', 'Bandage 10cm', 'Gauze Pad 10x10cm',
      'COVID-19 Vaccine', 'Hepatitis B Vaccine', 'Flu Vaccine', 'Thermometer Digital'
    ];

    for (let i = 1; i <= 50; i++) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const voteCode = voteCodes[Math.floor(Math.random() * voteCodes.length)];
      const voteActivity = voteActivities[Math.floor(Math.random() * voteActivities.length)];
      
      // Generate dates
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
      
      const eta = new Date(orderDate);
      eta.setDate(eta.getDate() + Math.floor(Math.random() * 14) + 7); // 7-21 days from order
      
      const today = new Date();
      const isOverdue = eta < today;
      const isDelivered = !isOverdue && Math.random() < 0.4; // 40% chance of delivered
      
      let status: 'ON_TIME' | 'DELIVERED' | 'OVERDUE';
      if (isDelivered) status = 'DELIVERED';
      else if (isOverdue) status = 'OVERDUE';
      else status = 'ON_TIME';

      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      for (let j = 0; j < itemCount; j++) {
        const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
        items.push({
          id: `item-${i}-${j}`,
          name: itemName,
          quantity: Math.floor(Math.random() * 100) + 10,
          category: voteActivity === '27401' ? 'DRUG' : voteActivity === '27404' ? 'VACCINE' : 'NON_DRUG'
        });
      }

      orders.push({
        id: String(i),
        poNumber: `PO-${1000 + i}`,
        lpoNumber: `LPO-2025-${String(i).padStart(3, '0')}`,
        supplier: supplier.name,
        supplierEmail: supplier.email,
        supplierContact: supplier.contact,
        orderDate: orderDate.toISOString().split('T')[0],
        eta: eta.toISOString().split('T')[0],
        status,
        items,
        totalValue: Math.floor(Math.random() * 50000) + 5000,
        department,
        voteCode,
        voteActivity,
        lastEmailSent: status === 'OVERDUE' ? 
          new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined,
        reminderCount: status === 'OVERDUE' ? Math.floor(Math.random() * 5) + 1 : 0,
        lastReminderDate: status === 'OVERDUE' ? 
          new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined,
        reminderHistory: (() => {
          const history: ReminderHistory[] = [];
          const reminderCount = status === 'OVERDUE' ? Math.floor(Math.random() * 5) + 1 : 0;
          
          for (let j = 1; j <= reminderCount; j++) {
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() - (reminderCount - j) * Math.floor(Math.random() * 2) + 1);
            
            const urgencyLevel = j <= 2 ? 'URGENT' : 
                               j <= 4 ? 'CRITICAL' : 'ESCALATION REQUIRED';
            const reminderText = j === 1 ? '1st Reminder' : 
                               j === 2 ? '2nd Reminder' : 
                               j === 3 ? '3rd Reminder' : 
                               `${j}th Reminder`;
            
            history.push({
              id: `reminder-${i}-${j}`,
              reminderNumber: j,
              sentDate: reminderDate.toISOString().split('T')[0],
              sentTime: reminderDate.toTimeString().split(' ')[0].substring(0, 5),
              subject: `${urgencyLevel}: ${reminderText} - Late Delivery Notification - PO-${1000 + i}`,
              status: j === reminderCount ? 'SENT' : 
                     Math.random() > 0.7 ? 'REPLIED' : 
                     Math.random() > 0.5 ? 'OPENED' : 'DELIVERED'
            });
          }
          return history;
        })(),
        notes: status === 'OVERDUE' ? 'Multiple follow-ups sent - escalation required' : undefined
      });
    }
    return orders;
  };

  const [orders, setOrders] = useState<OrderTracking[]>(generateMockOrders());

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || order.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    onTime: orders.filter(o => o.status === 'ON_TIME').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    overdue: orders.filter(o => o.status === 'OVERDUE').length
  };

  // Get status color and icon
  const getStatusColor = (status: OrderTracking['status']) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ON_TIME':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: OrderTracking['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <IconCheck className="h-4 w-4" />;
      case 'ON_TIME':
        return <IconTruck className="h-4 w-4" />;
      case 'OVERDUE':
        return <IconAlert className="h-4 w-4" />;
      default:
        return <IconClock className="h-4 w-4" />;
    }
  };

  // Send email notification
  const sendEmailNotification = (order: OrderTracking) => {
    const nextReminderCount = order.reminderCount + 1;
    const reminderText = nextReminderCount === 1 ? '1st Reminder' : 
                        nextReminderCount === 2 ? '2nd Reminder' : 
                        nextReminderCount === 3 ? '3rd Reminder' : 
                        `${nextReminderCount}th Reminder`;
    
    const urgencyLevel = nextReminderCount <= 2 ? 'URGENT' : 
                        nextReminderCount <= 4 ? 'CRITICAL' : 'ESCALATION REQUIRED';
    
    const emailContent = `
Subject: ${urgencyLevel}: ${reminderText} - Late Delivery Notification - ${order.poNumber}

Dear ${order.supplier},

This is our ${reminderText.toLowerCase()} regarding the following overdue order:

Order Details:
- Purchase Order: ${order.poNumber}
- LPO Number: ${order.lpoNumber}
- Expected Delivery: ${order.eta}
- Current Status: ${order.status}
- Total Value: RM ${order.totalValue.toLocaleString()}
- Previous Reminders: ${order.reminderCount}

Items:
${order.items.map(item => `- ${item.name} (${item.quantity} units)`).join('\n')}

${nextReminderCount <= 2 ? 
  'Please provide an immediate update on the delivery status and expected delivery date.' :
  nextReminderCount <= 4 ?
  'This is a critical reminder. Please contact us immediately to resolve this delivery issue.' :
  'This order is severely overdue. We are considering contract penalties and alternative suppliers.'}

${nextReminderCount > 3 ? 
  'We may need to escalate this matter to your management team.' : ''}

Best regards,
Pharmacy Logistics Team
    `;

    // Simulate email sending
    console.log(`Sending ${reminderText} to:`, order.supplierEmail);
    console.log('Email content:', emailContent);
    
    // Create new reminder history entry
    const now = new Date();
    const newReminder: ReminderHistory = {
      id: `reminder-${order.id}-${nextReminderCount}`,
      reminderNumber: nextReminderCount,
      sentDate: now.toISOString().split('T')[0],
      sentTime: now.toTimeString().split(' ')[0].substring(0, 5),
      subject: `${urgencyLevel}: ${reminderText} - Late Delivery Notification - ${order.poNumber}`,
      status: 'SENT'
    };

    // Update order with email sent timestamp and reminder count
    setOrders(prev => prev.map(o => 
      o.id === order.id 
        ? { 
            ...o, 
            lastEmailSent: new Date().toISOString().split('T')[0],
            reminderCount: nextReminderCount,
            lastReminderDate: new Date().toISOString().split('T')[0],
            reminderHistory: [...o.reminderHistory, newReminder],
            notes: nextReminderCount > 3 ? 'Multiple reminders sent - escalation required' : 
                   nextReminderCount > 1 ? 'Follow-up reminders sent' : 'Initial reminder sent'
          }
        : o
    ));
    
    setEmailSent(prev => [...prev, order.id]);
    setShowEmailModal(false);
    setSelectedOrder(null);
    
    alert(`${reminderText} sent to ${order.supplier} (${order.supplierEmail})`);
  };

  // Auto-send emails for overdue orders (simulate)
  useEffect(() => {
    const overdueOrders = orders.filter(o => o.status === 'OVERDUE' && !o.lastEmailSent);
    if (overdueOrders.length > 0) {
      console.log(`Found ${overdueOrders.length} overdue orders without email notifications`);
    }
  }, [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/procurement" 
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
              >
                <IconArrowLeft className="h-4 w-4" />
                Back to Procurement
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">Order Tracking</h1>
              <p className="text-slate-600 mt-2">Track purchase orders with LPOs and monitor delivery status</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconRefresh className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <IconTruck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Total Orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <IconCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.delivered}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Delivered</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <IconTruck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.onTime}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">On Time</div>
              </div>
            </div>
          </div>


          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <IconAlert className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.overdue}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by PO, LPO, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="ON_TIME">On Time</option>
              <option value="DELIVERED">Delivered</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Emergency">Emergency</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Surgery">Surgery</option>
              <option value="ICU">ICU</option>
            </select>

            <div className="flex items-center gap-2">
              <IconFilter className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">Filters</span>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Order Tracking</h2>
            <p className="text-sm text-slate-600">{filteredOrders.length} orders found</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">PO/LPO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Order Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">ETA</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Value (RM)</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Reminders</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors duration-200">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{order.poNumber}</div>
                      <div className="text-sm text-slate-600">{order.lpoNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{order.supplier}</div>
                      <div className="text-sm text-slate-600">{order.supplierContact}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{order.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{order.orderDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{order.eta}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {order.totalValue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.reminderCount > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            order.reminderCount <= 2 ? 'bg-yellow-100 text-yellow-800' :
                            order.reminderCount <= 4 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.reminderCount === 1 ? '1st' :
                             order.reminderCount === 2 ? '2nd' :
                             order.reminderCount === 3 ? '3rd' :
                             `${order.reminderCount}th`} Reminder
                          </span>
                          {order.lastReminderDate && (
                            <span className="text-xs text-slate-500 mt-1">
                              {order.lastReminderDate}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No reminders</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowEmailModal(true);
                          }}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                          title="View Details"
                        >
                          <IconEye className="h-4 w-4 text-slate-500" />
                        </button>
                        {order.status === 'OVERDUE' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              sendEmailNotification(order);
                            }}
                            className={`p-1 rounded transition-colors ${
                              order.reminderCount === 0 ? 'hover:bg-yellow-100' :
                              order.reminderCount <= 2 ? 'hover:bg-orange-100' :
                              'hover:bg-red-100'
                            }`}
                            title={`Send ${order.reminderCount === 0 ? '1st' : 
                                    order.reminderCount === 1 ? '2nd' :
                                    order.reminderCount === 2 ? '3rd' :
                                    `${order.reminderCount + 1}th`} Reminder`}
                          >
                            <IconMail className={`h-4 w-4 ${
                              order.reminderCount === 0 ? 'text-yellow-500' :
                              order.reminderCount <= 2 ? 'text-orange-500' :
                              'text-red-500'
                            }`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                    <p className="text-slate-600 mt-1">{selectedOrder.poNumber} - {selectedOrder.supplier}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEmailModal(false);
                      setSelectedOrder(null);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <IconX className="h-6 w-6 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Purchase Order</label>
                    <div className="text-sm text-slate-900">{selectedOrder.poNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">LPO Number</label>
                    <div className="text-sm text-slate-900">{selectedOrder.lpoNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Supplier</label>
                    <div className="text-sm text-slate-900">{selectedOrder.supplier}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <div className="text-sm text-slate-900">{selectedOrder.supplierEmail}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Expected Delivery</label>
                    <div className="text-sm text-slate-900">{selectedOrder.eta}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <div className="text-sm text-slate-900">{selectedOrder.status.replace('_', ' ')}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Items</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-900">{item.name}</span>
                        <span className="text-sm text-slate-600">{item.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <div className="text-sm text-slate-900 p-2 bg-yellow-50 rounded border border-yellow-200">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700">Reminder Count</label>
                  <div className="text-sm text-slate-900">
                    {selectedOrder.reminderCount === 0 ? 'No reminders sent' : 
                     selectedOrder.reminderCount === 1 ? '1st Reminder sent' :
                     selectedOrder.reminderCount === 2 ? '2nd Reminder sent' :
                     selectedOrder.reminderCount === 3 ? '3rd Reminder sent' :
                     `${selectedOrder.reminderCount}th Reminder sent`}
                  </div>
                </div>

                {selectedOrder.lastReminderDate && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Last Reminder Date</label>
                    <div className="text-sm text-slate-900">{selectedOrder.lastReminderDate}</div>
                  </div>
                )}

                {selectedOrder.lastEmailSent && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Last Email Sent</label>
                    <div className="text-sm text-slate-900">{selectedOrder.lastEmailSent}</div>
                  </div>
                )}

                {selectedOrder.reminderHistory.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-3 block">Reminder History</label>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedOrder.reminderHistory
                        .sort((a, b) => b.reminderNumber - a.reminderNumber)
                        .map((reminder) => (
                        <div key={reminder.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                reminder.reminderNumber <= 2 ? 'bg-yellow-100 text-yellow-800' :
                                reminder.reminderNumber <= 4 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {reminder.reminderNumber === 1 ? '1st' :
                                 reminder.reminderNumber === 2 ? '2nd' :
                                 reminder.reminderNumber === 3 ? '3rd' :
                                 `${reminder.reminderNumber}th`} Reminder
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                reminder.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                reminder.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                reminder.status === 'OPENED' ? 'bg-purple-100 text-purple-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {reminder.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {reminder.sentDate} at {reminder.sentTime}
                            </div>
                          </div>
                          <div className="text-sm text-slate-700 font-medium">
                            {reminder.subject}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowEmailModal(false);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedOrder.status === 'OVERDUE' && (
                    <button
                      onClick={() => sendEmailNotification(selectedOrder)}
                      className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                        selectedOrder.reminderCount === 0 ? 'bg-yellow-600 hover:bg-yellow-700' :
                        selectedOrder.reminderCount <= 2 ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Send {selectedOrder.reminderCount === 0 ? '1st' : 
                            selectedOrder.reminderCount === 1 ? '2nd' :
                            selectedOrder.reminderCount === 2 ? '3rd' :
                            `${selectedOrder.reminderCount + 1}th`} Reminder
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
