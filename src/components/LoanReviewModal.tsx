'use client';

import { useState, useEffect } from 'react';

// Define the loan request type
interface LoanRequest {
  id: string;
  transferNumber: string;
  transferCategory: 'STOCK' | 'LOAN';
  type: 'OUTGOING' | 'INCOMING';
  fromFacility: string;
  toFacility: string;
  requestedBy: string;
  status: 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED' | 'RETURNED' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED';
  requestedAt: string;
  items: Array<{
    id: string;
    itemName: string;
    itemCode: string;
    requestedQuantity: number;
    approvedQuantity?: number;
    unit: string;
    category: string;
  }>;
  notes?: string;
  priority?: string;
  rejectionReason?: string;
  loanStatus?: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  dueDate?: string;
  borrowedBy?: string;
  borrowedFrom?: string;
}

interface LoanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: LoanRequest[];
  loanType: 'INBOUND' | 'OUTBOUND';
  onUpdateRequest: (requestId: string, updates: Partial<LoanRequest>) => void;
}

export default function LoanReviewModal({ 
  isOpen, 
  onClose, 
  requests, 
  loanType, 
  onUpdateRequest 
}: LoanReviewModalProps) {
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
    notes: ''
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContent, setEmailContent] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const itemsPerPage = 10;

  // Filter requests by loan type and status
  const filteredRequests = requests.filter(req => 
    req.transferCategory === 'LOAN' && 
    req.type === (loanType === 'INBOUND' ? 'INCOMING' : 'OUTGOING')
  );

  useEffect(() => {
    if (isOpen && filteredRequests.length > 0 && !selectedRequest) {
      setSelectedRequest(filteredRequests[0]);
      setEditedItems([...filteredRequests[0].items]);
    }
  }, [isOpen, filteredRequests, selectedRequest]);

  useEffect(() => {
    if (selectedRequest) {
      setEditedItems([...selectedRequest.items]);
      setComments(selectedRequest.notes || '');
      setCurrentPage(1);
    }
  }, [selectedRequest]);

  const getLoanTypeInfo = () => {
    if (loanType === 'INBOUND') {
      return {
        title: 'Inbound Loan',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        ),
        color: 'from-orange-500 to-amber-600',
        description: 'Items borrowed from other facilities that need to be paid back'
      };
    } else {
      return {
        title: 'Outbound Loan',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        ),
        color: 'from-pink-500 to-rose-600',
        description: 'Items loaned to other facilities awaiting payment'
      };
    }
  };

  const handlePayment = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      const updatedRequest = {
        ...selectedRequest,
        status: 'PAYMENT_COMPLETED' as const,
        loanStatus: 'COMPLETED' as const,
        notes: `${comments}\n\nPayment Details:\nAmount: ${paymentDetails.amount}\nMethod: ${paymentDetails.method}\nReference: ${paymentDetails.reference}\nNotes: ${paymentDetails.notes}`
      };
      
      onUpdateRequest(selectedRequest.id, updatedRequest);
      setShowPaymentModal(false);
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      // Here you would typically send the email
      console.log('Sending email:', emailContent);
      
      // Update request status to show email was sent
      const updatedRequest = {
        ...selectedRequest,
        notes: `${comments}\n\nPayment reminder email sent to: ${emailContent.to}\nSubject: ${emailContent.subject}`
      };
      
      onUpdateRequest(selectedRequest.id, updatedRequest);
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus: 'PENDING' | 'COMPLETED') => {
    if (!selectedRequest) return;
    
    const updatedRequest = {
      ...selectedRequest,
      loanStatus: newStatus,
      status: newStatus === 'COMPLETED' ? 'RECEIVED' : 'ISSUED'
    };
    
    onUpdateRequest(selectedRequest.id, updatedRequest);
  };

  const loanInfo = getLoanTypeInfo();

  // Pagination logic
  const totalPages = Math.ceil(editedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = editedItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${loanInfo.color} flex items-center justify-center text-white shadow-lg`}>
                  {loanInfo.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{loanInfo.title}</h2>
                  <p className="text-slate-600 mt-1">{filteredRequests.length} loan requests</p>
                  <p className="text-sm text-slate-500">{loanInfo.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <svg className="h-6 w-6 text-slate-500 group-hover:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-140px)]">
            {/* Request List Sidebar */}
            <div className="w-96 border-r border-slate-200 bg-slate-50/30 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Loan Queue</h3>
                <div className="space-y-3">
                  {filteredRequests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedRequest?.id === req.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-slate-900">{req.transferNumber}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          req.loanStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          req.loanStatus === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.loanStatus || 'PENDING'}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mb-1">
                        {loanType === 'INBOUND' ? `${req.fromFacility} → Our Facility` : `Our Facility → ${req.toFacility}`}
                      </div>
                      <div className="text-sm text-slate-600 mb-1">
                        {loanType === 'INBOUND' ? `Borrowed by: ${req.borrowedBy || req.requestedBy}` : `Loaned to: ${req.borrowedFrom || req.requestedBy}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {req.items.length} items • {new Date(req.requestedAt).toLocaleDateString()}
                        {req.dueDate && ` • Due: ${new Date(req.dueDate).toLocaleDateString()}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="flex-1 overflow-y-auto bg-white">
              {selectedRequest ? (
                <div className="p-8">
                  {/* Request Header */}
                  <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-2">{selectedRequest.transferNumber}</h3>
                        <div className="flex items-center gap-6 text-slate-600">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <span className="font-medium">
                              {loanType === 'INBOUND' 
                                ? `${selectedRequest.fromFacility} → Our Facility` 
                                : `Our Facility → ${selectedRequest.toFacility}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="font-medium">
                              {loanType === 'INBOUND' 
                                ? `Borrowed by: ${selectedRequest.borrowedBy || selectedRequest.requestedBy}`
                                : `Loaned to: ${selectedRequest.borrowedFrom || selectedRequest.requestedBy}`
                              }
                            </span>
                          </div>
                          {selectedRequest.dueDate && (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="font-medium">Due: {new Date(selectedRequest.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                          selectedRequest.loanStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          selectedRequest.loanStatus === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedRequest.loanStatus || 'PENDING'} LOAN
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-slate-900">
                        {loanType === 'INBOUND' ? 'Borrowed Items' : 'Loaned Items'}
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium">
                          {editedItems.length} items
                        </div>
                        {totalPages > 1 && (
                          <div className="text-sm text-slate-500">
                            Page {currentPage} of {totalPages}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {currentItems.map((item, index) => {
                        // Generate consistent mock data based on item ID to avoid hydration issues
                        const seed = item.id.charCodeAt(0) + item.id.length + index;
                        const mockBalance = Math.floor((seed * 7) % 5000) + 1000;
                        const mockBatch = `B${Math.floor((seed * 13) % 9000) + 1000}`;
                        const mockExpiry = new Date();
                        mockExpiry.setFullYear(mockExpiry.getFullYear() + Math.floor((seed * 5) % 3) + 1);
                        mockExpiry.setMonth(mockExpiry.getMonth() + Math.floor((seed * 11) % 12));
                        const mockAvgUsage = Math.floor((seed * 3) % 500) + 100;
                        const packSizes = [10, 20, 30, 50, 100, 250, 500, 1000];
                        const packSize = packSizes[Math.floor((seed * 17) % packSizes.length)];
                        
                        // Format unit for packaging display
                        const getPackUnit = (unit: string) => {
                          if (unit === 'tablets') return 'tab';
                          if (unit === 'vials') return 'vial';
                          if (unit === 'ampoules' || unit === 'amps') return 'amp';
                          if (unit === 'capsules') return 'cap';
                          if (unit === 'injections') return 'inj';
                          if (unit === 'units') return 'unit';
                          if (unit === 'pairs') return 'pair';
                          if (unit === 'pads') return 'pad';
                          return unit;
                        };

                        const isCompleted = selectedRequest.loanStatus === 'COMPLETED';
                        
                        return (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  item.category === 'Drug' ? 'bg-blue-500' : 'bg-green-500'
                                }`}></div>
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-900 text-sm">{item.itemName}</div>
                                  <div className="text-xs text-slate-500">{item.itemCode} • {item.category}</div>
                                </div>
                              </div>
                              {!isCompleted && loanType === 'INBOUND' && (
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Remove item"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-6 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400 mb-1">Packaging</p>
                                <p className="font-medium text-slate-700" suppressHydrationWarning>pack of {packSize} {getPackUnit(item.unit)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Batch/Exp</p>
                                <p className="font-medium text-slate-700" suppressHydrationWarning>{mockBatch}</p>
                                <p className="text-slate-500" suppressHydrationWarning>{mockExpiry.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' })}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Balance</p>
                                <p className="font-bold text-green-600" suppressHydrationWarning>{mockBalance.toLocaleString()}</p>
                                <p className="text-slate-500">{item.unit}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Requested</p>
                                <p className="font-bold text-blue-600">{item.requestedQuantity}</p>
                                <p className="text-slate-500">{item.unit}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Avg Usage</p>
                                <p className="font-medium text-slate-700" suppressHydrationWarning>{mockAvgUsage.toLocaleString()}</p>
                                <p className="text-slate-500">/month</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">{isCompleted ? 'Returned' : loanType === 'INBOUND' ? 'Approve' : 'Issued'}</p>
                                {isCompleted ? (
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-green-600">{item.approvedQuantity || item.requestedQuantity}</p>
                                    <p className="text-slate-500">{item.unit}</p>
                                  </div>
                                ) : loanType === 'INBOUND' ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={item.approvedQuantity || 0}
                                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-medium text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      min="0"
                                      max={mockBalance}
                                      placeholder="0"
                                    />
                                    <span className="text-slate-400 text-xs">Max: {mockBalance.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-orange-600">{item.approvedQuantity || item.requestedQuantity}</p>
                                    <p className="text-slate-500">{item.unit}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          Showing {startIndex + 1} to {Math.min(endIndex, editedItems.length)} of {editedItems.length} items
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-xs font-medium text-slate-500 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Prev
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-xs font-medium text-slate-500 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Notes</label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add notes about this loan..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-700 text-sm"
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                    >
                      Close
                    </button>
                    
                    {loanType === 'INBOUND' ? (
                      // Inbound Loan Actions
                      <>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                          disabled={selectedRequest.loanStatus === 'COMPLETED'}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Pay Back Items
                        </button>
                      </>
                    ) : (
                      // Outbound Loan Actions
                      <>
                        <button
                          onClick={() => setShowEmailModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Request Payment
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange('PENDING')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedRequest.loanStatus === 'PENDING' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Pending
                          </button>
                          <button
                            onClick={() => handleStatusChange('COMPLETED')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedRequest.loanStatus === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Complete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <svg className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg">Select a loan request to review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Pay Back Items</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentDetails.amount}
                  onChange={(e) => setPaymentDetails({...paymentDetails, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentDetails.method}
                  onChange={(e) => setPaymentDetails({...paymentDetails, method: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                <input
                  type="text"
                  value={paymentDetails.reference}
                  onChange={(e) => setPaymentDetails({...paymentDetails, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Payment reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({...paymentDetails, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Request Payment</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                <input
                  type="email"
                  value={emailContent.to}
                  onChange={(e) => setEmailContent({...emailContent, to: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="recipient@facility.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Payment reminder for loan items"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={emailContent.body}
                  onChange={(e) => setEmailContent({...emailContent, body: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Dear [Facility], please arrange payment for the loaned items..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
