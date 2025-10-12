'use client';

import { useState, useEffect } from 'react';
import {
  IconTruck,
  IconCheck,
  IconClock,
  IconAlert,
  IconEye,
  IconUpload,
  IconDownload,
  IconFile,
  IconReceipt,
  IconCreditCard,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconPlus,
  IconX
} from '@/components/ui/Icons';

interface PaymentDocument {
  id: string;
  type: 'eGRN' | 'INVOICE' | 'PURCHASE_AGREEMENT' | 'CREDIT_NOTE';
  fileName: string;
  uploadedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount?: number;
  notes?: string;
}

interface PaymentItem {
  id: string;
  poNumber: string;
  lpoNumber: string;
  supplier: string;
  supplierEmail: string;
  deliveryDate: string;
  totalValue: number;
  department: string;
  voteCode: string;
  voteActivity: string;
  paymentStatus: 'PENDING_PAYMENT' | 'PAYMENT_PROCESSING' | 'PAYMENT_COMPLETED' | 'PAYMENT_REJECTED';
  documents: PaymentDocument[];
  lastUpdated: string;
  notes?: string;
}

export default function PaymentOversightPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<PaymentDocument['type']>('eGRN');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');

  // Generate mock payment data
  const generateMockPayments = (): PaymentItem[] => {
    const suppliers = [
      'MediSupply Malaysia', 'PharmaCorp Sdn Bhd', 'HealthTech Solutions', 
      'Medical Equipment Co', 'DrugStore Central', 'PharmaLink Malaysia',
      'MediCare Supplies', 'HealthFirst Corp', 'PharmaDirect', 'MediTech Global'
    ];
    
    const departments = ['Emergency', 'Pharmacy', 'Surgery', 'Cardiology', 'Oncology', 'Pediatrics'];
    const voteCodes = ['080702', '990102'];
    const voteActivities = ['27401', '27499', '27404'];
    
    const paymentStatuses: PaymentItem['paymentStatus'][] = [
      'PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'PAYMENT_REJECTED'
    ];

    const payments: PaymentItem[] = [];
    
    for (let i = 1; i <= 50; i++) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const voteCode = voteCodes[Math.floor(Math.random() * voteCodes.length)];
      const voteActivity = voteActivities[Math.floor(Math.random() * voteActivities.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() - Math.floor(Math.random() * 30));
      
      const lastUpdated = new Date();
      lastUpdated.setDate(lastUpdated.getDate() - Math.floor(Math.random() * 7));
      
      // Generate documents based on payment status
      const documents: PaymentDocument[] = [];
      if (paymentStatus !== 'PENDING_PAYMENT') {
        // Always have eGRN for non-pending payments
        documents.push({
          id: `egrn-${i}`,
          type: 'eGRN',
          fileName: `eGRN-${1000 + i}.pdf`,
          uploadedDate: deliveryDate.toISOString().split('T')[0],
          status: 'APPROVED',
          amount: Math.floor(Math.random() * 50000) + 5000
        });
        
        // Add invoice for processing/completed payments
        if (paymentStatus === 'PAYMENT_PROCESSING' || paymentStatus === 'PAYMENT_COMPLETED') {
          documents.push({
            id: `invoice-${i}`,
            type: 'INVOICE',
            fileName: `INV-${1000 + i}.pdf`,
            uploadedDate: new Date(deliveryDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: paymentStatus === 'PAYMENT_COMPLETED' ? 'APPROVED' : 'PENDING',
            amount: Math.floor(Math.random() * 50000) + 5000
          });
        }
        
        // Add purchase agreement for some payments
        if (Math.random() > 0.5) {
          documents.push({
            id: `pa-${i}`,
            type: 'PURCHASE_AGREEMENT',
            fileName: `PA-${1000 + i}.pdf`,
            uploadedDate: new Date(deliveryDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'APPROVED'
          });
        }
        
        // Add credit notes for some rejected payments
        if (paymentStatus === 'PAYMENT_REJECTED' && Math.random() > 0.3) {
          documents.push({
            id: `cn-${i}`,
            type: 'CREDIT_NOTE',
            fileName: `CN-${1000 + i}.pdf`,
            uploadedDate: lastUpdated.toISOString().split('T')[0],
            status: 'APPROVED',
            amount: Math.floor(Math.random() * 5000) + 500
          });
        }
      }

      payments.push({
        id: `payment-${i}`,
        poNumber: `PO-${1000 + i}`,
        lpoNumber: `LPO-${1000 + i}`,
        supplier,
        supplierEmail: `${supplier.toLowerCase().replace(/\s+/g, '')}@email.com`,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        totalValue: Math.floor(Math.random() * 50000) + 5000,
        department,
        voteCode,
        voteActivity,
        paymentStatus,
        documents,
        lastUpdated: lastUpdated.toISOString().split('T')[0],
        notes: paymentStatus === 'PAYMENT_REJECTED' ? 'Payment rejected due to document discrepancies' : undefined
      });
    }
    
    return payments;
  };

  const [payments, setPayments] = useState<PaymentItem[]>([]);

  useEffect(() => {
    setPayments(generateMockPayments());
    if (typeof document !== 'undefined') {
      const dept = localStorage.getItem('department') ||
        document.cookie.split('; ').find(r => r.startsWith('department='))?.split('=')[1] || '';
      try { setDepartment(decodeURIComponent(dept)); } catch { setDepartment(dept); }
    }
  }, []);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.lpoNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.paymentStatus === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || payment.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate statistics
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.paymentStatus === 'PENDING_PAYMENT').length,
    processing: payments.filter(p => p.paymentStatus === 'PAYMENT_PROCESSING').length,
    completed: payments.filter(p => p.paymentStatus === 'PAYMENT_COMPLETED').length,
    rejected: payments.filter(p => p.paymentStatus === 'PAYMENT_REJECTED').length
  };

  // Get status color and icon
  const getStatusColor = (status: PaymentItem['paymentStatus']) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAYMENT_PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAYMENT_COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAYMENT_REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: PaymentItem['paymentStatus']) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <IconClock className="h-4 w-4" />;
      case 'PAYMENT_PROCESSING':
        return <IconRefresh className="h-4 w-4" />;
      case 'PAYMENT_COMPLETED':
        return <IconCheck className="h-4 w-4" />;
      case 'PAYMENT_REJECTED':
        return <IconAlert className="h-4 w-4" />;
      default:
        return <IconClock className="h-4 w-4" />;
    }
  };

  const getDocumentIcon = (type: PaymentDocument['type']) => {
    switch (type) {
      case 'eGRN':
        return <IconTruck className="h-4 w-4" />;
      case 'INVOICE':
        return <IconReceipt className="h-4 w-4" />;
      case 'PURCHASE_AGREEMENT':
        return <IconFile className="h-4 w-4" />;
      case 'CREDIT_NOTE':
        return <IconCreditCard className="h-4 w-4" />;
      default:
        return <IconFile className="h-4 w-4" />;
    }
  };

  const getDocumentColor = (type: PaymentDocument['type']) => {
    switch (type) {
      case 'eGRN':
        return 'bg-green-100 text-green-800';
      case 'INVOICE':
        return 'bg-blue-100 text-blue-800';
      case 'PURCHASE_AGREEMENT':
        return 'bg-purple-100 text-purple-800';
      case 'CREDIT_NOTE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleViewDetails = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleUploadDocument = (payment: PaymentItem, type: PaymentDocument['type']) => {
    setSelectedPayment(payment);
    setUploadType(type);
    setShowUploadModal(true);
  };

  const handleFileUpload = () => {
    if (!uploadFile || !selectedPayment) return;

    const newDocument: PaymentDocument = {
      id: `${uploadType.toLowerCase()}-${Date.now()}`,
      type: uploadType,
      fileName: uploadFile.name,
      uploadedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      amount: uploadType === 'INVOICE' || uploadType === 'CREDIT_NOTE' ? Math.floor(Math.random() * 50000) + 5000 : undefined,
      notes: uploadNotes
    };

    setPayments(prev => prev.map(p => 
      p.id === selectedPayment.id 
        ? { ...p, documents: [...p.documents, newDocument] }
        : p
    ));

    setShowUploadModal(false);
    setUploadFile(null);
    setUploadNotes('');
    setSelectedPayment(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Payment Oversight</h1>
              <p className="text-slate-600 mt-1">Track payment processing for delivered items</p>
            </div>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                department === 'Office Admin' ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              aria-disabled={department === 'Office Admin'}
              title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Refresh'}
            >
              <IconRefresh className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <IconTruck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Total Payments</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <IconClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.pending}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Pending</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <IconRefresh className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.processing}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Processing</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <IconCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.completed}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Completed</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <IconAlert className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{stats.rejected}</div>
                <div className="text-xs text-slate-600 uppercase tracking-wide">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-white/50 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
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
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PAYMENT_PROCESSING">Processing</option>
              <option value="PAYMENT_COMPLETED">Completed</option>
              <option value="PAYMENT_REJECTED">Rejected</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Emergency">Emergency</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Surgery">Surgery</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Oncology">Oncology</option>
              <option value="Pediatrics">Pediatrics</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Payment Tracking</h2>
            <p className="text-sm text-slate-600">Monitor payment processing for delivered items</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">PO/LPO</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Amount (RM)</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{payment.poNumber}</div>
                        <div className="text-sm text-slate-500">{payment.lpoNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{payment.supplier}</div>
                        <div className="text-sm text-slate-500">{payment.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{payment.deliveryDate}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {payment.totalValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.paymentStatus)}`}>
                        {getStatusIcon(payment.paymentStatus)}
                        {payment.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {payment.documents.map((doc) => (
                          <span
                            key={doc.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getDocumentColor(doc.type)}`}
                            title={doc.fileName}
                          >
                            {getDocumentIcon(doc.type)}
                            {doc.type}
                          </span>
                        ))}
                        {payment.documents.length === 0 && (
                          <span className="text-xs text-slate-400">No documents</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                          title="View Details"
                        >
                          <IconEye className="h-4 w-4 text-slate-500" />
                        </button>
                        <button
                          onClick={department === 'Office Admin' ? undefined : () => handleUploadDocument(payment, 'eGRN')}
                          className={`p-1 rounded transition-colors ${department === 'Office Admin' ? 'cursor-not-allowed' : 'hover:bg-green-100'}`}
                          title={department === 'Office Admin' ? 'View-only for Office Admin' : 'Upload eGRN'}
                          aria-disabled={department === 'Office Admin'}
                        >
                          <IconUpload className={`h-4 w-4 ${department === 'Office Admin' ? 'text-slate-400' : 'text-green-600'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Details Modal */}
        {showDetailsModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
                  <p className="text-slate-600">{selectedPayment.poNumber} - {selectedPayment.supplier}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <IconX className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Payment Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900">Payment Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">PO Number:</span>
                        <span className="font-medium">{selectedPayment.poNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">LPO Number:</span>
                        <span className="font-medium">{selectedPayment.lpoNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Supplier:</span>
                        <span className="font-medium">{selectedPayment.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Delivery Date:</span>
                        <span className="font-medium">{selectedPayment.deliveryDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Amount:</span>
                        <span className="font-bold text-green-600">RM {selectedPayment.totalValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-900">Financial Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Department:</span>
                        <span className="font-medium">{selectedPayment.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vote Code:</span>
                        <span className="font-medium">{selectedPayment.voteCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vote Activity:</span>
                        <span className="font-medium">{selectedPayment.voteActivity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Last Updated:</span>
                        <span className="font-medium">{selectedPayment.lastUpdated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPayment.paymentStatus)}`}>
                          {getStatusIcon(selectedPayment.paymentStatus)}
                          {selectedPayment.paymentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Payment Documents</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUploadDocument(selectedPayment, 'eGRN')}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        + eGRN
                      </button>
                      <button
                        onClick={() => handleUploadDocument(selectedPayment, 'INVOICE')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        + Invoice
                      </button>
                      <button
                        onClick={() => handleUploadDocument(selectedPayment, 'PURCHASE_AGREEMENT')}
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        + PA
                      </button>
                      <button
                        onClick={() => handleUploadDocument(selectedPayment, 'CREDIT_NOTE')}
                        className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        + CN
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedPayment.documents.map((doc) => (
                      <div key={doc.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getDocumentColor(doc.type)}`}>
                              {getDocumentIcon(doc.type)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{doc.fileName}</div>
                              <div className="text-sm text-slate-500">
                                {doc.type} • Uploaded {doc.uploadedDate}
                                {doc.amount && ` • RM ${doc.amount.toLocaleString()}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              doc.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status}
                            </span>
                            <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                              <IconDownload className="h-4 w-4 text-slate-500" />
                            </button>
                          </div>
                        </div>
                        {doc.notes && (
                          <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                            {doc.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedPayment.documents.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <IconFile className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p>No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">Notes</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Document Modal */}
        {showUploadModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Upload {uploadType}</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <IconX className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select File
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                    placeholder="Add any notes about this document..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Upload Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
