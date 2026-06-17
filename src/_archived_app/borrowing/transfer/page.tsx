'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconPlus, IconTrash, IconSave, IconSend, IconPackage, IconPill, IconSearch, IconX } from '@/components/ui/Icons';

interface TransferItem {
  id: string;
  itemName: string;
  drugCode: string;
  category: 'DRUG' | 'NON_DRUG';
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
  packaging: string;
  balance: number;
  location: string;
  notes?: string;
}

interface TransferFormData {
  facilityName: string;
  recipientName: string;
  email?: string;
  phone?: string;
  transferCategory: 'STOCK' | 'LOAN';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expectedReturnDate?: string;
  notes: string;
  items: TransferItem[];
}

export default function TransferRequestPage() {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<TransferFormData>({
    facilityName: '',
    recipientName: '',
    email: '',
    phone: '',
    transferCategory: 'STOCK',
    priority: 'MEDIUM',
    expectedReturnDate: '',
    notes: '',
    items: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'DRUG' | 'NON_DRUG'>('ALL');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  const facilities = [
    'Main Hospital', 'Clinic A', 'Clinic B', 'Emergency Center', 
    'Surgery Center', 'Pediatric Ward', 'ICU', 'Laboratory'
  ];

  const inventoryItems = [
    { 
      id: '1', name: 'Paracetamol 500mg', code: 'PAR-500', category: 'DRUG', unit: 'tablets',
      batchNumber: 'B2024001', expiry: '2025-12-31', balance: 2500, condition: 'GOOD',
      packaging: 'pack of 100 tab', location: 'Cabinet A, Level 2, Column 15'
    },
    { 
      id: '2', name: 'Ibuprofen 400mg', code: 'IBU-400', category: 'DRUG', unit: 'tablets',
      batchNumber: 'B2024002', expiry: '2025-10-15', balance: 1800, condition: 'GOOD',
      packaging: 'pack of 50 tab', location: 'Cabinet A, Level 3, Column 8'
    },
    { 
      id: '3', name: 'Amoxicillin 250mg', code: 'AMX-250', category: 'DRUG', unit: 'capsules',
      batchNumber: 'B2024003', expiry: '2025-08-20', balance: 320, condition: 'GOOD',
      packaging: 'pack of 20 cap', location: 'Cabinet B, Level 1, Column 12'
    },
    { 
      id: '4', name: 'Insulin Syringe 1ml', code: 'INS-1ML', category: 'NON_DRUG', unit: 'units',
      batchNumber: 'B2024004', expiry: '2025-06-30', balance: 150, condition: 'GOOD',
      packaging: 'pack of 10 unit', location: 'Cabinet C, Level 2, Column 5'
    },
    { 
      id: '5', name: 'Gauze Pad 4x4', code: 'GAU-4X4', category: 'NON_DRUG', unit: 'pads',
      batchNumber: 'B2024005', expiry: '2026-03-15', balance: 1200, condition: 'GOOD',
      packaging: 'pack of 50 pad', location: 'Cabinet D, Level 1, Column 3'
    },
    { 
      id: '6', name: 'Oxygen Mask', code: 'OXY-MASK', category: 'NON_DRUG', unit: 'units',
      batchNumber: 'B2024006', expiry: '2026-01-10', balance: 45, condition: 'GOOD',
      packaging: 'pack of 5 unit', location: 'Cabinet E, Level 2, Column 7'
    },
  ];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const alreadyAdded = formData.items.some(addedItem => addedItem.drugCode === item.code);
    return matchesSearch && matchesCategory && !alreadyAdded;
  });

  useEffect(() => {
    setIsClient(true);
    
    // Check for prefill parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle bulk items
    if (urlParams.get('bulkItems')) {
      try {
        const bulkItemsJson = decodeURIComponent(urlParams.get('bulkItems') || '');
        const bulkItems = JSON.parse(bulkItemsJson);
        if (bulkItems && bulkItems.length > 0) {
          const newItems: TransferItem[] = bulkItems.map((item: any, index: number) => ({
            id: `bulk-${Date.now()}-${index}`,
            itemName: item.name,
            drugCode: item.sku,
            category: item.category === 'Drug' ? 'DRUG' : 'NON_DRUG',
            quantity: item.quantity || item.currentStock || 1,
            unit: item.category === 'Drug' ? 'tablets' : 'units',
            batchNumber: item.batch,
            expiryDate: item.expiry,
            condition: 'GOOD',
            packaging: `pack of ${item.quantity || item.currentStock || 1}`,
            balance: (item.quantity || item.currentStock || 1) * 2, // Assume double the quantity is available
            location: 'Cabinet A, Level 1, Column 1',
            notes: `Auto-added from bulk selection`
          }));
          
          // Set priority based on first item
          const firstItem = bulkItems[0];
          const priority = firstItem.priority || firstItem.status;
          const priorityMap = {
            'CRITICAL': 'URGENT',
            'URGENT': 'URGENT',
            'HIGH': 'HIGH',
            'MEDIUM': 'MEDIUM',
            'LOW': 'LOW'
          };
          
          setFormData(prev => ({
            ...prev,
            items: [...prev.items, ...newItems],
            priority: priorityMap[priority as keyof typeof priorityMap] || 'MEDIUM'
          }));
        }
      } catch (error) {
        console.error('Error parsing bulk items:', error);
      }
    }
    // Handle single item prefill (legacy support)
    else if (urlParams.get('prefillItem') === 'true') {
      const prefillItem = {
        itemName: urlParams.get('itemName') || '',
        drugCode: urlParams.get('drugCode') || '',
        category: urlParams.get('category') || '',
        quantity: parseInt(urlParams.get('quantity') || '1'),
        batchNumber: urlParams.get('batchNumber') || '',
        expiryDate: urlParams.get('expiryDate') || '',
        unitCost: parseFloat(urlParams.get('unitCost') || '0'),
        priority: urlParams.get('priority') || 'MEDIUM'
      };
      
      // Only add item if we have valid item data
      if (prefillItem.itemName && prefillItem.drugCode) {
        const newItem: TransferItem = {
          id: `prefill-${Date.now()}`,
          itemName: prefillItem.itemName,
          drugCode: prefillItem.drugCode,
          category: prefillItem.category === 'Drug' ? 'DRUG' : 'NON_DRUG',
          quantity: prefillItem.quantity,
          unit: prefillItem.category === 'Drug' ? 'tablets' : 'units',
          batchNumber: prefillItem.batchNumber,
          expiryDate: prefillItem.expiryDate,
          condition: 'GOOD',
          packaging: `pack of ${prefillItem.quantity}`,
          balance: prefillItem.quantity * 2, // Assume double the quantity is available
          location: 'Cabinet A, Level 1, Column 1',
          notes: `Auto-added from ${prefillItem.priority} priority item`
        };
        
        // Add the item to the transfer list
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, newItem],
          priority: prefillItem.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
        }));
      }
    }
  }, []);

  const handleAddItem = () => {
    if (selectedItem && quantity > 0 && quantity <= selectedItem.balance) {
      const newItem: TransferItem = {
        id: `${selectedItem.id}-${Date.now()}`,
        itemName: selectedItem.name,
        drugCode: selectedItem.code,
        category: selectedItem.category,
        quantity,
        unit: selectedItem.unit,
        batchNumber: selectedItem.batchNumber,
        expiryDate: selectedItem.expiry,
        condition: selectedItem.condition,
        packaging: selectedItem.packaging,
        balance: selectedItem.balance,
        location: selectedItem.location,
      };
      
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
      
      setSelectedItem(null);
      setQuantity(1);
      setSearchTerm('');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleSubmit = (action: 'draft' | 'submit') => {
    if (formData.items.length === 0) {
      alert('Please add at least one item to transfer');
      return;
    }
    
    if (!formData.facilityName) {
      alert('Please enter facility name');
      return;
    }
    
    if (!formData.recipientName) {
      alert('Please enter recipient name');
      return;
    }
    
    if (formData.transferCategory === 'LOAN' && !formData.expectedReturnDate) {
      alert('Please specify expected return date for loan transfers');
      return;
    }
    
    console.log('Transfer Data:', { ...formData, action });
    const nextStatus = action === 'draft' ? 'DRAFT' : 'PENDING_REVIEW';
    alert(`${action === 'draft' ? 'Draft saved' : 'Transfer submitted for review'} successfully!`);
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-indigo-50/40">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/borrowing"
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">New Transfer Request</h1>
            <p className="text-slate-600 mt-1">Create a new inter-facility transfer request</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Add Items */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-white/60 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Add Items</h3>
              
              {/* Item Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Item Category</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => setCategoryFilter('DRUG')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === 'DRUG'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Drugs
                  </button>
                  <button
                    onClick={() => setCategoryFilter('NON_DRUG')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === 'NON_DRUG'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Non-Drugs
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search items by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-cyan-500 bg-cyan-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-1">{item.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">{item.code} • {item.category === 'DRUG' ? 'Tablet' : 'Syringe'}</p>
                        <p className="text-sm text-slate-500 mb-2">Packaging: {item.packaging}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Batch: {item.batchNumber}</span>
                          <span className="text-slate-500">Expiry: {new Date(item.expiry).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-slate-500 text-sm">Balance: <span className={`font-bold ${item.balance > 500 ? 'text-green-600' : 'text-orange-600'}`}>{item.balance} {item.unit}</span></span>
                          <div className="flex items-center text-slate-500 text-sm">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {item.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quantity Input and Add Button */}
              {selectedItem && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quantity to Transfer</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedItem.balance}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Available: {selectedItem.balance} {selectedItem.unit}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddItem}
                        disabled={quantity > selectedItem.balance || quantity < 1}
                        className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Add to Transfer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Transfer Details and Items */}
          <div className="space-y-6">
            {/* Transfer Details Form */}
            <div className="bg-white rounded-2xl p-6 border border-white/60 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Transfer Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Facility Name *</label>
                  <input
                    type="text"
                    value={formData.facilityName}
                    onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter facility name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Name *</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter recipient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transfer Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transferCategory"
                        value="STOCK"
                        checked={formData.transferCategory === 'STOCK'}
                        onChange={(e) => setFormData(prev => ({ ...prev, transferCategory: e.target.value as 'STOCK' | 'LOAN' }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-700">Stock Transfer (Permanent)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transferCategory"
                        value="LOAN"
                        checked={formData.transferCategory === 'LOAN'}
                        onChange={(e) => setFormData(prev => ({ ...prev, transferCategory: e.target.value as 'STOCK' | 'LOAN' }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-700">Loan Transfer (Temporary)</span>
                    </label>
                  </div>
                </div>

                {formData.transferCategory === 'LOAN' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expected Return Date</label>
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Additional notes or instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Items to Transfer */}
            <div className="bg-white rounded-2xl p-6 border border-white/60 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Items to Transfer ({formData.items.length})</h3>

              {formData.items.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <IconPackage className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No items added yet</p>
                  <p className="text-slate-400 text-sm">Select items from the left panel to add to transfer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 mb-1">{item.itemName}</h4>
                          <p className="text-sm text-slate-600 mb-2">{item.drugCode} • {item.category === 'DRUG' ? 'Tablet' : 'Syringe'}</p>
                          <p className="text-sm text-slate-500 mb-2">Packaging: {item.packaging}</p>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-500">Batch: {item.batchNumber}</span>
                            <span className="text-slate-500">Expiry: {new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div>
                          
                          {/* Quantity Information with Color Coding */}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Available Balance:</span>
                              <span className="font-bold text-blue-600">{item.balance} {item.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Transfer Quantity:</span>
                              <span className="font-bold text-purple-600">{item.quantity} {item.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">After Transfer:</span>
                              <span className="font-bold text-green-600">{item.balance - item.quantity} {item.unit}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-slate-500 text-sm mt-2">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {item.location}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl p-6 border border-white/60 shadow-sm">
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit('draft')}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <IconSave className="h-4 w-4" />
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit('submit')}
                  className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <IconSend className="h-4 w-4" />
                  Submit Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
