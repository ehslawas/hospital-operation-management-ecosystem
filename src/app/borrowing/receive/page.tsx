'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconCheck, IconX, IconPackage, IconPill, IconSearch, IconClipboardList } from '@/components/ui/Icons';

interface ReceivedItem {
  id: string;
  itemName: string;
  drugCode: string;
  category: 'DRUG' | 'NON_DRUG';
  expectedQuantity: number;
  receivedQuantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED';
  notes?: string;
  status: 'PENDING' | 'RECEIVED' | 'REJECTED';
}

interface ReceiveFormData {
  transferNumber: string;
  fromFacility: string;
  transferCategory: 'STOCK' | 'LOAN';
  receivedBy: string;
  receivedAt: string;
  notes: string;
  items: ReceivedItem[];
}

export default function ReceiveItemsPage() {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<ReceiveFormData>({
    transferNumber: '',
    fromFacility: '',
    transferCategory: 'STOCK',
    receivedBy: '',
    receivedAt: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'DRUG' | 'NON_DRUG'>('DRUG');

  const facilities = [
    'Main Hospital', 'Clinic A', 'Clinic B', 'Emergency Center', 
    'Surgery Center', 'Pediatric Ward', 'ICU', 'Laboratory'
  ];

  const staff = [
    'Dr. Sarah Ahmad', 'Nurse John Lim', 'Pharm. Maria Tan', 
    'Tech. Ahmad Rahman', 'Dr. Lisa Wong'
  ];

  // Mock drug and non-drug items for search
  const drugItems = [
    { id: '1', name: 'Paracetamol 500mg', code: 'PAR-500', category: 'DRUG' },
    { id: '2', name: 'Ibuprofen 400mg', code: 'IBU-400', category: 'DRUG' },
    { id: '3', name: 'Amoxicillin 250mg', code: 'AMX-250', category: 'DRUG' },
    { id: '4', name: 'Metformin 500mg', code: 'MET-500', category: 'DRUG' },
    { id: '5', name: 'Aspirin 100mg', code: 'ASP-100', category: 'DRUG' },
    { id: '6', name: 'Omeprazole 20mg', code: 'OME-20', category: 'DRUG' },
    { id: '7', name: 'Lisinopril 10mg', code: 'LIS-10', category: 'DRUG' },
    { id: '8', name: 'Atorvastatin 20mg', code: 'ATO-20', category: 'DRUG' }
  ];

  const nonDrugItems = [
    { id: '1', name: 'Gauze Pad 4x4', code: 'GAU-4X4', category: 'NON_DRUG' },
    { id: '2', name: 'Surgical Gloves', code: 'GLO-SURG', category: 'NON_DRUG' },
    { id: '3', name: 'Syringe 5ml', code: 'SYR-5ML', category: 'NON_DRUG' },
    { id: '4', name: 'Bandage Roll', code: 'BAN-ROLL', category: 'NON_DRUG' },
    { id: '5', name: 'Cotton Swabs', code: 'COT-SWAB', category: 'NON_DRUG' },
    { id: '6', name: 'Alcohol Wipes', code: 'ALC-WIPE', category: 'NON_DRUG' },
    { id: '7', name: 'Thermometer', code: 'THM-DIG', category: 'NON_DRUG' },
    { id: '8', name: 'Blood Pressure Cuff', code: 'BPC-ADULT', category: 'NON_DRUG' }
  ];

  // Mock pending transfers
  const pendingTransfers = [
    {
      id: '1',
      transferNumber: 'IFT-2024-001',
      fromFacility: 'Main Hospital',
      transferCategory: 'STOCK',
      requestedBy: 'Dr. Sarah Ahmad',
      requestedAt: '2024-01-15T10:30:00Z',
      items: [
        {
          id: '1',
          itemName: 'Paracetamol 500mg',
          drugCode: 'PAR-500',
          category: 'DRUG',
          expectedQuantity: 100,
          unit: 'tablets',
          batchNumber: 'B2024001',
          expiryDate: '2025-12-31',
          condition: 'GOOD'
        },
        {
          id: '2',
          itemName: 'Gauze Pad 4x4',
          drugCode: 'GAU-4X4',
          category: 'NON_DRUG',
          expectedQuantity: 50,
          unit: 'pads',
          batchNumber: 'B2024005',
          expiryDate: '2026-03-15',
          condition: 'GOOD'
        }
      ]
    },
    {
      id: '2',
      transferNumber: 'IFT-2024-002',
      fromFacility: 'Clinic A',
      transferCategory: 'LOAN',
      requestedBy: 'Nurse John Lim',
      requestedAt: '2024-01-16T14:20:00Z',
      items: [
        {
          id: '3',
          itemName: 'Ibuprofen 400mg',
          drugCode: 'IBU-400',
          category: 'DRUG',
          expectedQuantity: 75,
          unit: 'tablets',
          batchNumber: 'B2024002',
          expiryDate: '2025-10-15',
          condition: 'GOOD'
        }
      ]
    }
  ];

  const filteredTransfers = pendingTransfers.filter(transfer => 
    transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.fromFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSelectTransfer = (transfer: any) => {
    setSelectedTransfer(transfer);
    setFormData(prev => ({
      ...prev,
      transferNumber: transfer.transferNumber,
      fromFacility: transfer.fromFacility,
      transferCategory: transfer.transferCategory,
      items: transfer.items.map((item: any) => ({
        ...item,
        receivedQuantity: item.expectedQuantity,
        status: 'PENDING' as const
      }))
    }));
    setShowTransferModal(false);
  };

  const handleItemStatusChange = (itemId: string, status: 'RECEIVED' | 'REJECTED') => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, status } : item
      )
    }));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, receivedQuantity: quantity } : item
      )
    }));
  };

  const handleAddItem = (item: any, batchNumber: string, quantity: number, expiryDate: string, packaging: string) => {
    const newItem: ReceivedItem = {
      id: `${Date.now()}-${Math.random()}`,
      itemName: item.name,
      drugCode: item.code,
      category: item.category,
      expectedQuantity: quantity,
      receivedQuantity: quantity,
      unit: packaging,
      batchNumber,
      expiryDate,
      condition: 'GOOD',
      status: 'PENDING'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setShowAddItemModal(false);
    setItemSearchTerm('');
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleSubmit = () => {
    const receivedItems = formData.items.filter(item => item.status === 'RECEIVED');
    const rejectedItems = formData.items.filter(item => item.status === 'REJECTED');
    
    if (receivedItems.length === 0 && rejectedItems.length === 0) {
      alert('Please process at least one item (receive or reject)');
      return;
    }
    
    console.log('Receive Data:', {
      ...formData,
      receivedItems,
      rejectedItems,
      summary: {
        totalExpected: formData.items.length,
        totalReceived: receivedItems.length,
        totalRejected: rejectedItems.length
      }
    });
    
    alert('Items received successfully!');
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/40">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/borrowing"
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Receive Items</h1>
            <p className="text-slate-600 text-sm">Process incoming inter-facility transfer requests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Receive Details Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-white/60 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Receive Details</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transfer Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.transferNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, transferNumber: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="IFT-2024-001"
                    />
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <IconSearch className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">From Facility</label>
                  <input
                    type="text"
                    value={formData.fromFacility}
                    onChange={(e) => setFormData(prev => ({ ...prev, fromFacility: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Source facility"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transfer Type</label>
                  <select
                    value={formData.transferCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, transferCategory: e.target.value as 'STOCK' | 'LOAN' }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="STOCK">STOCK</option>
                    <option value="LOAN">LOAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Received By</label>
                  <select
                    value={formData.receivedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select staff...</option>
                    {staff.map(person => (
                      <option key={person} value={person}>{person}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Received Date</label>
                  <input
                    type="date"
                    value={formData.receivedAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivedAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Any observations or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl p-4 border border-white/60 shadow-sm">
              <button
                onClick={handleSubmit}
                disabled={formData.items.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                <IconCheck className="h-4 w-4" />
                Process Receipt
              </button>
            </div>
          </div>

          {/* Items Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-white/60 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800">Items to Receive</h3>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600">
                    {formData.items.filter(item => item.status === 'RECEIVED').length} of {formData.items.length} processed
                  </div>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <IconPackage className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <IconClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No items to receive</p>
                  <p className="text-slate-400 text-sm">Add items manually or select a transfer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className={`p-4 rounded-xl border-2 ${
                      item.status === 'RECEIVED' ? 'border-green-200 bg-green-50' :
                      item.status === 'REJECTED' ? 'border-red-200 bg-red-50' :
                      'border-slate-200 bg-slate-50'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {item.category === 'DRUG' ? (
                            <IconPill className="h-5 w-5 text-blue-600" />
                          ) : (
                            <IconPackage className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <h4 className="font-semibold text-slate-800">{item.itemName}</h4>
                            <p className="text-sm text-slate-600">{item.drugCode} • {item.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleItemStatusChange(item.id, 'RECEIVED')}
                            className={`p-2 rounded-lg transition-colors ${
                              item.status === 'RECEIVED' 
                                ? 'bg-green-100 text-green-700' 
                                : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <IconCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleItemStatusChange(item.id, 'REJECTED')}
                            className={`p-2 rounded-lg transition-colors ${
                              item.status === 'REJECTED' 
                                ? 'bg-red-100 text-red-700' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <IconX className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <IconX className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-600">Expected:</span> {item.expectedQuantity} {item.unit}
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Received:</span>
                          <input
                            type="number"
                            min="0"
                            max={item.expectedQuantity * 2}
                            value={item.receivedQuantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="ml-2 w-20 px-2 py-1 border border-slate-300 rounded text-center"
                            disabled={item.status === 'REJECTED'}
                          />
                          <span className="ml-1 text-slate-500">{item.unit}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Batch:</span> {item.batchNumber}
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Expiry:</span> {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Condition:</span>
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                            item.condition === 'GOOD' ? 'bg-green-100 text-green-700' :
                            item.condition === 'DAMAGED' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.condition}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Status:</span>
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                            item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Select Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-2xl p-4 w-full max-w-4xl max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800">Select Transfer to Receive</h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2 max-h-50 overflow-y-auto">
                  {filteredTransfers.map(transfer => (
                    <div
                      key={transfer.id}
                      onClick={() => handleSelectTransfer(transfer)}
                      className="p-3 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800">{transfer.transferNumber}</h4>
                          <p className="text-sm text-slate-600">
                            From: {transfer.fromFacility} • {transfer.transferCategory} • {transfer.items.length} items
                          </p>
                          <p className="text-xs text-slate-500">
                            Requested by: {transfer.requestedBy} • {new Date(transfer.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.transferCategory === 'STOCK' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {transfer.transferCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItemModal && (
          <AddItemModal
            onClose={() => setShowAddItemModal(false)}
            onAddItem={handleAddItem}
            drugItems={drugItems}
            nonDrugItems={nonDrugItems}
            itemSearchTerm={itemSearchTerm}
            setItemSearchTerm={setItemSearchTerm}
            selectedItemType={selectedItemType}
            setSelectedItemType={setSelectedItemType}
          />
        )}
      </div>
    </div>
  );
}

// Add Item Modal Component
function AddItemModal({ 
  onClose, 
  onAddItem, 
  drugItems, 
  nonDrugItems, 
  itemSearchTerm, 
  setItemSearchTerm, 
  selectedItemType, 
  setSelectedItemType 
}: {
  onClose: () => void;
  onAddItem: (item: any, batchNumber: string, quantity: number, expiryDate: string, packaging: string) => void;
  drugItems: any[];
  nonDrugItems: any[];
  itemSearchTerm: string;
  setItemSearchTerm: (term: string) => void;
  selectedItemType: 'DRUG' | 'NON_DRUG';
  setSelectedItemType: (type: 'DRUG' | 'NON_DRUG') => void;
}) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [packaging, setPackaging] = useState('');

  const currentItems = selectedItemType === 'DRUG' ? drugItems : nonDrugItems;
  const filteredItems = currentItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && batchNumber && quantity > 0 && expiryDate && packaging) {
      onAddItem(selectedItem, batchNumber, quantity, expiryDate, packaging);
      setSelectedItem(null);
      setBatchNumber('');
      setQuantity(1);
      setExpiryDate('');
      setPackaging('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Add Item to Receive</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Type Selection */}
          <div>
            <label className="block text-base font-medium text-slate-700 mb-2">Item Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedItemType('DRUG')}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  selectedItemType === 'DRUG' 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                    : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                }`}
              >
                <IconPill className="h-5 w-5 inline mr-2" />
                Drug
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemType('NON_DRUG')}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  selectedItemType === 'NON_DRUG' 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                }`}
              >
                <IconPackage className="h-5 w-5 inline mr-2" />
                Non-Drug
              </button>
            </div>
          </div>

          {/* Item Search */}
          <div>
            <label className="block text-base font-medium text-slate-700 mb-2">Search Item</label>
            <input
              type="text"
              placeholder={`Search ${selectedItemType === 'DRUG' ? 'drug' : 'non-drug'} items...`}
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Item Selection */}
          {itemSearchTerm && (
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-2 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0 ${
                    selectedItem?.id === item.id ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.category === 'DRUG' ? (
                      <IconPill className="h-5 w-5 text-blue-600" />
                    ) : (
                      <IconPackage className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <p className="text-base font-medium text-slate-800">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Item Display */}
          {selectedItem && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                {selectedItem.category === 'DRUG' ? (
                  <IconPill className="h-5 w-5 text-blue-600" />
                ) : (
                  <IconPackage className="h-5 w-5 text-green-600" />
                )}
                <div>
                  <p className="text-base font-medium text-slate-800">{selectedItem.name}</p>
                  <p className="text-sm text-slate-600">{selectedItem.code}</p>
                </div>
              </div>
            </div>
          )}

          {/* Item Details */}
          {selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Batch Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter batch number"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Packaging</label>
                <input
                  type="text"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., tablets, capsules, units"
                  required
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-base text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedItem || !batchNumber || !quantity || !expiryDate || !packaging}
              className="px-6 py-3 text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <IconCheck className="h-5 w-5" />
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
