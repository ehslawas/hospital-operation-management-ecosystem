'use client';

import { useState, useEffect } from 'react';
import { DepartmentRequest, IssuedItem } from '../../types/RequestWorkflow';
import { getBatches } from '../../services/dataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IssuingModalProps {
  request: DepartmentRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onIssue: (issuedItems: IssuedItem[], location: string, notes?: string) => void;
}

export function IssuingModal({ request, isOpen, onClose, onIssue }: IssuingModalProps) {
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  useEffect(() => {
    if (request && isOpen) {
      // Initialize issued items with approved quantities
      const initialItems: IssuedItem[] = request.items.map(item => ({
        itemId: item.itemId,
        batchId: '',
        batchNumber: '',
        quantity: item.approvedQuantity || item.requestedQuantity,
        expiryDate: '',
        scanned: false
      }));
      setIssuedItems(initialItems);

      // Load available batches
      const batches = getBatches();
      setAvailableBatches(batches);
    }
  }, [request, isOpen]);

  const handleBatchSelect = (itemId: string, batchId: string) => {
    const batch = availableBatches.find(b => b.id === batchId);
    if (!batch) return;

    setIssuedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, batchId, batchNumber: batch.batchNo, expiryDate: batch.expiry, scanned: true }
        : item
    ));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setIssuedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: Math.max(0, quantity) }
        : item
    ));
  };

  const handleIssue = () => {
    if (!location.trim()) {
      alert('Please select a location');
      return;
    }

    const allScanned = issuedItems.every(item => item.scanned);
    if (!allScanned) {
      alert('Please scan all items before issuing');
      return;
    }

    onIssue(issuedItems, location, notes);
    onClose();
  };

  const getAvailableBatchesForItem = (itemId: string) => {
    return availableBatches.filter(batch => batch.itemId === itemId && batch.quantity > 0);
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Issue Items</h2>
              <p className="text-slate-600">Request: {request.requestNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Request Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Department</label>
                    <p className="text-slate-800">{request.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Requested By</label>
                    <p className="text-slate-800">{request.requestedBy}</p>
                  </div>
                </div>
                {request.notes && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg mt-1">{request.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items to Issue */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Items to Issue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.items.map((item, index) => {
                    const issuedItem = issuedItems.find(i => i.itemId === item.itemId);
                    const availableBatches = getAvailableBatchesForItem(item.itemId);
                    
                    return (
                      <div key={item.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-800">{item.itemName}</h4>
                            <p className="text-sm text-slate-600">
                              {item.drugCode} • {item.dosageForm}
                            </p>
                            <p className="text-sm text-slate-500">
                              Requested: {item.requestedQuantity} • Approved: {item.approvedQuantity || item.requestedQuantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {issuedItem?.scanned ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                ✓ Scanned
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Batch Selection */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Select Batch
                            </label>
                            <select
                              value={issuedItem?.batchId || ''}
                              onChange={(e) => handleBatchSelect(item.itemId, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select batch...</option>
                              {availableBatches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.batchNo} (Qty: {batch.quantity}, Exp: {batch.expiry})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Issue Quantity
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.approvedQuantity || item.requestedQuantity}
                              value={issuedItem?.quantity || 0}
                              onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Batch Info */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Batch Info
                            </label>
                            <div className="text-sm text-slate-600">
                              {issuedItem?.batchNumber ? (
                                <div>
                                  <p>Batch: {issuedItem.batchNumber}</p>
                                  <p>Expiry: {issuedItem.expiryDate}</p>
                                </div>
                              ) : (
                                <p className="text-slate-400">Select batch first</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Issue Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Issue Location
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select location...</option>
                      <option value="main-store">Main Store</option>
                      <option value="sub-store-1">Sub-store 1</option>
                      <option value="ward-a">Ward A</option>
                      <option value="ward-b">Ward B</option>
                      <option value="ward-c">Ward C</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Issue Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this issue..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleIssue}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Issue Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


