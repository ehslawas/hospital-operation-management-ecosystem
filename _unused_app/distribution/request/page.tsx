'use client';

import { useState } from 'react';

interface RequestItem {
  id: string;
  name: string;
  category: 'Drug' | 'Non-Drug';
  quantity: number;
  unit: string;
}

export default function DistributionRequestPage() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'Drug' | 'Non-Drug'>('Drug');
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState('');

  // Mock drug list
  const drugList = [
    { id: 'D001', name: 'Paracetamol 500mg Tab', unit: 'Tablet' },
    { id: 'D002', name: 'Amoxicillin 250mg Cap', unit: 'Capsule' },
    { id: 'D003', name: 'Metformin 500mg Tab', unit: 'Tablet' },
    { id: 'D004', name: 'Amlodipine 5mg Tab', unit: 'Tablet' },
    { id: 'D005', name: 'Omeprazole 20mg Cap', unit: 'Capsule' },
    { id: 'D006', name: 'Salbutamol 100mcg Inhaler', unit: 'Inhaler' },
    { id: 'D007', name: 'Insulin Glargine 100U/ml Inj', unit: 'Vial' },
    { id: 'D008', name: 'Ceftriaxone 1g Inj', unit: 'Vial' },
    { id: 'D009', name: 'Morphine 10mg Inj', unit: 'Ampule' },
    { id: 'D010', name: 'Diazepam 5mg Tab', unit: 'Tablet' },
  ];

  // Mock non-drug list
  const nonDrugList = [
    { id: 'ND001', name: 'Surgical Gloves (M)', unit: 'Pair' },
    { id: 'ND002', name: 'IV Cannula 20G', unit: 'Piece' },
    { id: 'ND003', name: 'Syringe 10ml', unit: 'Piece' },
    { id: 'ND004', name: 'Gauze Pad 4x4', unit: 'Piece' },
    { id: 'ND005', name: 'Foley Catheter 16Fr', unit: 'Piece' },
    { id: 'ND006', name: 'Surgical Mask', unit: 'Piece' },
    { id: 'ND007', name: 'Bandage Roll 4inch', unit: 'Roll' },
    { id: 'ND008', name: 'Alcohol Swabs', unit: 'Box' },
    { id: 'ND009', name: 'Dressing Set', unit: 'Set' },
    { id: 'ND010', name: 'Suture Kit', unit: 'Set' },
  ];

  // Filter items based on search term
  const filteredItems = (() => {
    const itemList = selectedCategory === 'Drug' ? drugList : nonDrugList;
    if (!searchTerm.trim()) return [];
    return itemList.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  const handleSelectItem = (itemId: string, itemName: string) => {
    setSelectedDrug(itemId);
    setSearchTerm(itemName);
  };

  const handleAddItem = () => {
    const itemList = selectedCategory === 'Drug' ? drugList : nonDrugList;
    const selectedItem = itemList.find(item => item.id === selectedDrug);
    
    if (selectedItem && quantity && parseInt(quantity) > 0) {
      const newItem: RequestItem = {
        id: selectedItem.id,
        name: selectedItem.name,
        category: selectedCategory,
        quantity: parseInt(quantity),
        unit: selectedItem.unit,
      };
      
      setRequestItems([...requestItems, newItem]);
      setSelectedDrug('');
      setSearchTerm('');
      setQuantity('');
      setShowAddItemModal(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setRequestItems(requestItems.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white grid place-items-center shadow-lg shadow-blue-600/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Request Distribution</h1>
                <p className="text-slate-600 mt-1">Request drugs and non-drugs from other departments</p>
              </div>
            </div>
            {/* New Request Button */}
            <button 
              onClick={() => setShowRequestForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Request
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Pending</p>
                <h3 className="text-3xl font-bold text-orange-600 mt-2">8</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 grid place-items-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full"></div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Approved</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2">15</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 grid place-items-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full"></div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">In Transit</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-2">6</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 grid place-items-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full"></div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Completed</p>
                <h3 className="text-3xl font-bold text-slate-600 mt-2">42</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 grid place-items-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* Request List */}
        <div className="bg-white rounded-xl border-0 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Recent Requests</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 text-lg font-medium">No requests available</p>
              <p className="text-slate-400 text-sm mt-2">Create a new request to request drugs and non-drugs from other departments</p>
            </div>
          </div>
        </div>

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">New Distribution Request</h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Request Information */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Request Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Request From Department</label>
                      <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>Select Department</option>
                        <option>Pharmacy Logistic</option>
                        <option>Pharmacy Sub Store</option>
                        <option>Main Store</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as 'Drug' | 'Non-Drug')}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option>Drug</option>
                        <option>Non-Drug</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Request Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Request Items</h4>
                    <button 
                      onClick={() => setShowAddItemModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  {requestItems.length === 0 ? (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <p className="text-slate-500 text-sm text-center py-8">No items added. Click "Add Item" to add drugs or non-drugs to this request.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Quantity</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Unit</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {requestItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-slate-900">{item.name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  item.category === 'Drug' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-semibold">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-center text-slate-600">{item.unit}</td>
                              <td className="px-4 py-3 text-sm text-center">
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes / Remarks</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes or remarks..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800 transition-all">
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">
                  Add {selectedCategory} Item
                </h3>
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setSelectedDrug('');
                    setSearchTerm('');
                    setQuantity('');
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search {selectedCategory}
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedDrug('');
                      }}
                      placeholder={`Type to search ${selectedCategory.toLowerCase()}...`}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searchTerm && filteredItems.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item.id, item.name)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500 mt-1">Unit: {item.unit}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchTerm && filteredItems.length === 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-center text-slate-500">
                      No {selectedCategory.toLowerCase()} found matching "{searchTerm}"
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {selectedDrug && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-900">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Selected:</span>
                      <span className="font-bold">
                        {(selectedCategory === 'Drug' ? drugList : nonDrugList).find(item => item.id === selectedDrug)?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200 rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setSelectedDrug('');
                    setSearchTerm('');
                    setQuantity('');
                  }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddItem}
                  disabled={!selectedDrug || !quantity || parseInt(quantity) <= 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

