'use client';

import { useState, useEffect } from 'react';

// Define the transfer request type based on the borrowing system
interface TransferRequest {
  id: string;
  transferNumber: string;
  transferCategory: string;
  type: string;
  fromFacility: string;
  toFacility: string;
  requestedBy: string;
  status: 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'REJECTED';
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
}

interface BorrowingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: TransferRequest[];
  status: 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED';
  onUpdateRequest: (requestId: string, updates: Partial<TransferRequest>) => void;
}

export default function BorrowingReviewModal({ 
  isOpen, 
  onClose, 
  requests, 
  status, 
  onUpdateRequest 
}: BorrowingReviewModalProps) {
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter requests by status
  const filteredRequests = requests.filter(req => req.status === status);

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
      setCurrentPage(1); // Reset to first page when selecting new request
    }
  }, [selectedRequest]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setEditedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, approvedQuantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      const updatedRequest = {
        ...selectedRequest,
        items: editedItems,
        notes: comments,
        status: 'APPROVED' as const
      };
      
      onUpdateRequest(selectedRequest.id, updatedRequest);
      onClose();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      const updatedRequest = {
        ...selectedRequest,
        notes: comments,
        status: 'REJECTED' as const
      };
      
      onUpdateRequest(selectedRequest.id, updatedRequest);
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'PENDING_REVIEW':
        return {
          title: 'Pending Review',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'from-amber-500 to-orange-600'
        };
      case 'PENDING_APPROVAL':
        return {
          title: 'Pending Approval',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'from-orange-500 to-yellow-600'
        };
      case 'APPROVED':
        return {
          title: 'Ready to Issue',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'from-green-500 to-emerald-600'
        };
      case 'ISSUED':
        return {
          title: 'Issued',
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'from-emerald-500 to-teal-600'
        };
      default:
        return {
          title: 'Review',
          icon: null,
          color: 'from-slate-500 to-gray-600'
        };
    }
  };

  const statusInfo = getStatusInfo();

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${statusInfo.color} flex items-center justify-center text-white shadow-lg`}>
                {statusInfo.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{statusInfo.title}</h2>
                <p className="text-slate-600 mt-1">{filteredRequests.length} requests requiring attention</p>
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

        <div className="flex h-[calc(95vh-120px)]">
          {/* Request List Sidebar */}
          <div className="w-96 border-r border-slate-200 bg-slate-50/30 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Transfer Queue</h3>
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
                        req.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        req.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        req.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {req.priority || 'NORMAL'}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 mb-1">{req.fromFacility} → {req.toFacility}</div>
                    <div className="text-sm text-slate-600 mb-1">{req.transferCategory} • {req.type}</div>
                    <div className="text-sm text-slate-600">Requested by: <span className="font-medium text-slate-800">{req.requestedBy}</span></div>
                    <div className="text-xs text-slate-500">{req.items.length} items • <span suppressHydrationWarning>{new Date(req.requestedAt).toLocaleDateString()}</span></div>
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
                          <span className="font-medium">{selectedRequest.fromFacility} → {selectedRequest.toFacility}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-medium">{selectedRequest.requestedBy}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="font-medium" suppressHydrationWarning>{new Date(selectedRequest.requestedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        selectedRequest.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        selectedRequest.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        selectedRequest.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {selectedRequest.priority || 'NORMAL'} PRIORITY
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-900">Requested Items</h4>
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
                      
                      const isApproved = status === 'APPROVED';
                      const isIssued = status === 'ISSUED';
                      
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
                            {!isApproved && !isIssued && (
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
                              <p className="text-slate-400 mb-1">{isApproved ? 'Approved' : isIssued ? 'Issued' : 'Approve'}</p>
                              {isApproved || isIssued ? (
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-green-600">{item.approvedQuantity || item.requestedQuantity}</p>
                                  <p className="text-slate-500">{item.unit}</p>
                                </div>
                              ) : (
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
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Review Comments</label>
                  {status === 'APPROVED' || status === 'ISSUED' ? (
                    <div className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm min-h-[80px]">
                      {comments || 'No comments added'}
                    </div>
                  ) : (
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add your review comments and notes here..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-700 text-sm"
                      rows={3}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  {status === 'APPROVED' || status === 'ISSUED' ? (
                    <>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Processing...' : 
                         status === 'PENDING_REVIEW' ? 'Send for Approval' : 
                         status === 'PENDING_APPROVAL' ? 'Approve' : 
                         'Approve'}
                      </button>
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
                  <p className="text-lg">Select a transfer request to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
