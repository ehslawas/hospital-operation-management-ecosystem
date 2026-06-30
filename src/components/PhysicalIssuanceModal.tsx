// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { DepartmentRequest, RequestItem, RequestStatus } from '@/features/pharmacy-logistics/types/RequestWorkflow';

interface PhysicalIssuanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: DepartmentRequest[];
  onIssueComplete: (requestId: string, issuedItems: IssuedItem[]) => void;
}

interface IssuedItem {
  itemId: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  scanned: boolean;
}

export default function PhysicalIssuanceModal({
  isOpen,
  onClose,
  requests,
  onIssueComplete
}: PhysicalIssuanceModalProps) {
  const [selectedRequest, setSelectedRequest] = useState<DepartmentRequest | null>(null);
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRequestSelector, setShowRequestSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const itemsPerPage = 8;

  // Filter only approved requests
  const approvedRequests = useMemo(() => 
    requests.filter(req => req.status === 'APPROVED'), 
    [requests]
  );
  

  useEffect(() => {
    if (isOpen) {
      if (approvedRequests.length === 1) {
        // If only one request, auto-select it
        setSelectedRequest(approvedRequests[0]);
        setShowRequestSelector(false);
      } else if (approvedRequests.length > 1) {
        // If multiple requests, show selector
        setShowRequestSelector(true);
        setSelectedRequest(null);
      } else {
        // No approved requests
        setShowRequestSelector(false);
        setSelectedRequest(null);
      }
    }
  }, [isOpen, approvedRequests.length]);

  useEffect(() => {
    if (selectedRequest) {
      // Initialize issued items based on approved quantities
      const initialIssuedItems: IssuedItem[] = selectedRequest.items
        .filter(item => item.status === 'APPROVED' && (item.approvedQuantity || 0) > 0)
        .map(item => ({
          itemId: item.itemId,
          batchId: `batch-${item.itemId}-001`,
          batchNumber: `B${Math.floor(Math.random() * 9000) + 1000}`,
          quantity: item.approvedQuantity || 0,
          expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scanned: false
        }));
      setIssuedItems(initialIssuedItems);
      setCurrentPage(1);
      setShowRequestSelector(false);
    }
  }, [selectedRequest]);

  const handleBarcodeScan = (barcode: string) => {
    if (!barcode.trim()) return;
    
    setIsScanning(true);
    setScanMessage('Processing scan...');
    
    // Simulate barcode processing
    setTimeout(() => {
      const item = issuedItems.find(item => 
        item.batchNumber === barcode || 
        item.itemId === barcode ||
        barcode.includes(item.batchNumber)
      );
      
      if (item) {
        setIssuedItems(prev => 
          prev.map(i => 
            i.itemId === item.itemId && i.batchId === item.batchId 
              ? { ...i, scanned: true }
              : i
          )
        );
        setScanMessage(`âœ… Scanned: ${item.batchNumber}`);
      } else {
        setScanMessage('âŒ Item not found in approved list');
      }
      
      setIsScanning(false);
      setScannedBarcode('');
    }, 1000);
  };

  const handleManualScan = () => {
    if (scannedBarcode.trim()) {
      handleBarcodeScan(scannedBarcode.trim());
    }
  };

  const handleIssueComplete = () => {
    if (selectedRequest) {
      onIssueComplete(selectedRequest.id, issuedItems);
      onClose();
    }
  };

  const handleRequestSelect = (request: DepartmentRequest) => {
    setSelectedRequest(request);
    setShowRequestSelector(false);
  };

  const handleBackToSelector = () => {
    setSelectedRequest(null);
    setShowRequestSelector(true);
    setIssuedItems([]);
  };

  const handleQuantityAdjust = (itemId: string, change: number) => {
    setIssuedItems(prevItems =>
      prevItems.map(item => {
        if (item.itemId === itemId) {
          const newQuantity = Math.max(0, (item.scanned ? 1 : 0) + change);
          return { ...item, scanned: newQuantity > 0, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleMarkAsIssued = (itemId: string) => {
    setIssuedItems(prevItems =>
      prevItems.map(item => {
        if (item.itemId === itemId) {
          return { ...item, scanned: true, quantity: item.quantity };
        }
        return item;
      })
    );
  };

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return issuedItems.filter(item => {
      const requestItem = selectedRequest?.items.find(i => i.itemId === item.itemId);
      if (!requestItem) return false;

      // Search filter
      const matchesSearch = searchTerm === '' || 
        requestItem.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requestItem.drugCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Pending' && !item.scanned) ||
        (statusFilter === 'Issued' && item.scanned) ||
        (statusFilter === 'Mismatch' && item.scanned && item.quantity !== (requestItem.approvedQuantity || 0));

      return matchesSearch && matchesStatus;
    });
  }, [issuedItems, searchTerm, statusFilter, selectedRequest]);

  const allItemsScanned = issuedItems.length > 0 && issuedItems.every(item => item.scanned);
  const scannedCount = issuedItems.filter(item => item.scanned).length;

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/90 text-slate-600 hover:bg-slate-100 transition-all duration-200 shadow-lg"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 h-full overflow-y-auto">
            {showRequestSelector ? (
            /* Request Selection Screen */
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Select Request to Issue</h2>
                    <p className="text-slate-600">{approvedRequests.length} approved requests ready for issuance</p>
                  </div>
                </div>
              </div>

              {/* Request List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedRequests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => handleRequestSelect(req)}
                    className="p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-slate-800 text-lg">{req.requestNumber}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        req.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        req.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium">{req.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{req.requestedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(req.requestedAt).toLocaleDateString('en-MY')}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Items to issue:</span>
                        <span className="font-bold text-blue-600">{req.items.filter(i => i.status === 'APPROVED').length}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-center">
                      <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium group-hover:bg-blue-700 transition-colors">
                        Start Issuance
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : selectedRequest ? (
            /* Issuance Interface */
            <div className="space-y-8">
              {/* Issuance Summary - Compact */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Issuance Summary</h2>
                    <p className="text-sm text-slate-600">
                      {selectedRequest.requestNumber} â€¢ {selectedRequest.department} â€¢ {selectedRequest.requestedBy}
                    </p>
                  </div>
                  <button
                    onClick={handleBackToSelector}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Back to request selection"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((scannedCount / issuedItems.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${issuedItems.length > 0 ? (scannedCount / issuedItems.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Summary Stats - Compact */}
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800">{issuedItems.length}</div>
                    <div className="text-xs text-slate-600">Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800">{scannedCount}</div>
                    <div className="text-xs text-slate-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800">
                      {issuedItems.reduce((sum, item) => {
                        const requestItem = selectedRequest.items.find(i => i.itemId === item.itemId);
                        return sum + (requestItem?.approvedQuantity || requestItem?.requestedQuantity || 0);
                      }, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600">Qty expected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-800">
                      {issuedItems.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600">Qty scanned</div>
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium">
                    Save draft
                  </button>
                  <button
                    onClick={handleIssueComplete}
                    disabled={!allItemsScanned}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                  >
                    Issue all matched
                  </button>
                </div>
              </div>

              {/* Barcode Scanner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Barcode Scanner</h3>
                
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    placeholder="Scan barcode or enter SKU manually (e.g. LOR-1)"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={isScanning}
                  />
                  <button
                    onClick={handleManualScan}
                    disabled={isScanning || !scannedBarcode.trim()}
                    className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Scan
                  </button>
                </div>
                
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                  <strong>Tip:</strong> Each scan adds 1 unit. Use +/- on each row to adjust, or click 'Mark as issued' to match expected quantity.
                </div>
                
                {scanMessage && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    scanMessage.includes('âœ…') ? 'bg-green-50 text-green-800 border border-green-200' : 
                    scanMessage.includes('âŒ') ? 'bg-red-50 text-red-800 border border-red-200' : 
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {scanMessage}
                  </div>
                )}
              </div>

              {/* Search and Filters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Filter:</span>
                    <div className="flex gap-1">
                      {['All', 'Pending', 'Issued', 'Mismatch'].map(status => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                            statusFilter === status
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items to Issue */}
              <div>

                <div className="space-y-3">
                  {currentItems.map((item, index) => {
                    const requestItem = selectedRequest.items.find(i => i.itemId === item.itemId);
                    if (!requestItem) return null;

                    const isDrug = requestItem.drugCode && requestItem.drugCode !== 'N/A' && 
                      (requestItem.itemName.toLowerCase().includes('mg') || 
                       requestItem.itemName.toLowerCase().includes('tablet') ||
                       requestItem.itemName.toLowerCase().includes('capsule') ||
                       requestItem.itemName.toLowerCase().includes('syrup') ||
                       requestItem.itemName.toLowerCase().includes('injection'));

                    const getItemType = () => {
                      if (requestItem.itemName.toLowerCase().includes('tablet')) return 'Tablet';
                      if (requestItem.itemName.toLowerCase().includes('inhaler')) return 'Inhaler';
                      if (requestItem.itemName.toLowerCase().includes('tube')) return 'Tube';
                      if (requestItem.itemName.toLowerCase().includes('mask')) return 'Mask';
                      if (requestItem.itemName.toLowerCase().includes('cannula') || requestItem.itemName.toLowerCase().includes('device')) return 'Device';
                      return isDrug ? 'Tablet' : 'Unit';
                    };

                    const getStatusColor = () => {
                      if (!item.scanned) return 'bg-yellow-100 text-yellow-800';
                      if (item.quantity === (requestItem.approvedQuantity || requestItem.requestedQuantity)) return 'bg-green-100 text-green-800';
                      return 'bg-red-100 text-red-800';
                    };

                    const getStatusText = () => {
                      if (!item.scanned) return 'Pending';
                      if (item.quantity === (requestItem.approvedQuantity || requestItem.requestedQuantity)) return 'Issued';
                      return 'Mismatch';
                    };

                    return (
                      <div key={item.itemId} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                              {startIndex + index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-800">{requestItem.itemName}</h4>
                                <span className="text-xs text-slate-500">({getItemType()})</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>SKU: {requestItem.drugCode}</span>
                                <span>Batch: {item.batchNumber}</span>
                                <span>Expected: {requestItem.approvedQuantity || requestItem.requestedQuantity} {requestItem.unit}</span>
                                <span>Scanned: {item.quantity} {requestItem.unit}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 font-medium">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{(() => {
                                  const cabinets = ['A', 'B', 'C', 'D', 'E'];
                                  const levels = [1, 2, 3, 4, 5];
                                  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
                                  const cabinet = cabinets[Math.floor(Math.random() * cabinets.length)];
                                  const level = levels[Math.floor(Math.random() * levels.length)];
                                  const column = columns[Math.floor(Math.random() * columns.length)];
                                  return `Cabinet ${cabinet}, Level ${level}, Column ${column}`;
                                })()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityAdjust(item.itemId, -1)}
                                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="px-3 py-1 bg-slate-50 rounded-lg text-sm font-medium min-w-[80px] text-center">
                                {item.quantity} {requestItem.unit}
                              </span>
                              <button
                                onClick={() => handleQuantityAdjust(item.itemId, 1)}
                                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={() => handleMarkAsIssued(item.itemId)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Mark as issued
                            </button>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor()}`}>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getStatusText()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
                  </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
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
                        className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* No requests available */
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <svg className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">No approved requests available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
