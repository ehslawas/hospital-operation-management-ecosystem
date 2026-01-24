'use client';

import { useState } from 'react';

interface IssueItem {
  id: string;
  name: string;
  category: 'Drug' | 'Non-Drug';
  quantity: number;
  unit: string;
}

export default function DistributionIssuePage() {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'Drug' | 'Non-Drug'>('Drug');
  const [issueItems, setIssueItems] = useState<IssueItem[]>([]);

  // Mock drug list with stock details
  const drugList = [
    { id: 'D001', name: 'Paracetamol 500mg Tab', unit: 'Tablet', batch: 'B2024-001', expiry: '2025-12-31', stock: 5000 },
    { id: 'D002', name: 'Amoxicillin 250mg Cap', unit: 'Capsule', batch: 'B2024-002', expiry: '2025-11-30', stock: 3200 },
    { id: 'D003', name: 'Metformin 500mg Tab', unit: 'Tablet', batch: 'B2024-003', expiry: '2026-01-15', stock: 4500 },
    { id: 'D004', name: 'Amlodipine 5mg Tab', unit: 'Tablet', batch: 'B2024-004', expiry: '2025-10-20', stock: 2800 },
    { id: 'D005', name: 'Omeprazole 20mg Cap', unit: 'Capsule', batch: 'B2024-005', expiry: '2026-02-28', stock: 3600 },
    { id: 'D006', name: 'Salbutamol 100mcg Inhaler', unit: 'Inhaler', batch: 'B2024-006', expiry: '2025-09-30', stock: 150 },
    { id: 'D007', name: 'Insulin Glargine 100U/ml Inj', unit: 'Vial', batch: 'B2024-007', expiry: '2025-08-15', stock: 200 },
    { id: 'D008', name: 'Ceftriaxone 1g Inj', unit: 'Vial', batch: 'B2024-008', expiry: '2026-03-31', stock: 450 },
    { id: 'D009', name: 'Morphine 10mg Inj', unit: 'Ampule', batch: 'B2024-009', expiry: '2025-07-30', stock: 120 },
    { id: 'D010', name: 'Diazepam 5mg Tab', unit: 'Tablet', batch: 'B2024-010', expiry: '2026-04-15', stock: 1800 },
  ];

  // Mock non-drug list with stock details
  const nonDrugList = [
    { id: 'ND001', name: 'Surgical Gloves (M)', unit: 'Pair', batch: 'ND2024-001', expiry: '2026-12-31', stock: 10000 },
    { id: 'ND002', name: 'IV Cannula 20G', unit: 'Piece', batch: 'ND2024-002', expiry: '2027-06-30', stock: 2500 },
    { id: 'ND003', name: 'Syringe 10ml', unit: 'Piece', batch: 'ND2024-003', expiry: '2027-03-31', stock: 5000 },
    { id: 'ND004', name: 'Gauze Pad 4x4', unit: 'Piece', batch: 'ND2024-004', expiry: '2026-09-30', stock: 8000 },
    { id: 'ND005', name: 'Foley Catheter 16Fr', unit: 'Piece', batch: 'ND2024-005', expiry: '2027-01-31', stock: 800 },
    { id: 'ND006', name: 'Surgical Mask', unit: 'Piece', batch: 'ND2024-006', expiry: '2026-08-31', stock: 15000 },
    { id: 'ND007', name: 'Bandage Roll 4inch', unit: 'Roll', batch: 'ND2024-007', expiry: '2026-10-31', stock: 3000 },
    { id: 'ND008', name: 'Alcohol Swabs', unit: 'Box', batch: 'ND2024-008', expiry: '2026-11-30', stock: 1200 },
    { id: 'ND009', name: 'Dressing Set', unit: 'Set', batch: 'ND2024-009', expiry: '2027-02-28', stock: 600 },
    { id: 'ND010', name: 'Suture Kit', unit: 'Set', batch: 'ND2024-010', expiry: '2027-04-30', stock: 400 },
  ];

  const handleRemoveItem = (id: string) => {
    setIssueItems(issueItems.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white grid place-items-center shadow-lg shadow-emerald-600/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Issue Distribution</h1>
                <p className="text-slate-600 mt-1">Issue drugs and non-drugs already used by the department</p>
              </div>
            </div>
            {/* New Issue Button */}
            <button 
              onClick={() => setShowIssueForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-emerald-800 transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Issue
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">To Issue</p>
                <h3 className="text-3xl font-bold text-purple-600 mt-2">12</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 grid place-items-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full"></div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Issued Today</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2">28</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 grid place-items-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full"></div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Pending Return</p>
                <h3 className="text-3xl font-bold text-orange-600 mt-2">5</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 grid place-items-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full"></div>
          </div>

          <div className="bg-white rounded-xl border-0 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Total Issued</p>
                <h3 className="text-3xl font-bold text-slate-600 mt-2">186</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 grid place-items-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* Issue List */}
        <div className="bg-white rounded-xl border-0 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Recent Issues</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 text-lg font-medium">No issues recorded</p>
              <p className="text-slate-400 text-sm mt-2">Record drugs and non-drugs already used by the department</p>
            </div>
          </div>
        </div>

        {/* Issue Form Modal */}
        {showIssueForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">New Distribution Issue</h3>
                <button
                  onClick={() => setShowIssueForm(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Issue Information */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Issue Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as 'Drug' | 'Non-Drug')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option>Drug</option>
                      <option>Non-Drug</option>
                    </select>
                  </div>
                </div>

                {/* Issue Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Issue Items</h4>
                    <button 
                      onClick={() => setShowAddItemModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  {issueItems.length === 0 ? (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <p className="text-slate-500 text-sm text-center py-8">No items added. Click "Add Item" to add drugs or non-drugs already used.</p>
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
                          {issueItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-slate-900">{item.name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  item.category === 'Drug' 
                                    ? 'bg-emerald-100 text-emerald-800' 
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Add any additional notes or remarks..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  onClick={() => setShowIssueForm(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-600/30 hover:from-emerald-700 hover:to-emerald-800 transition-all">
                  Submit Issue
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
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">
                  Add {selectedCategory} Item
                </h3>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Available {selectedCategory} Stock</h4>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Batch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Expiry Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Stock Qty</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Issue Qty</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {(selectedCategory === 'Drug' ? drugList : nonDrugList).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">{item.batch}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.expiry}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="font-semibold text-emerald-600">{item.stock} {item.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.stock}
                              placeholder="0"
                              className="w-24 px-2 py-1 border border-slate-300 rounded text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              id={`qty-${item.id}`}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <button
                              onClick={() => {
                                const qtyInput = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                                const qty = parseInt(qtyInput?.value || '0');
                                if (qty > 0 && qty <= item.stock) {
                                  const newItem: IssueItem = {
                                    id: item.id,
                                    name: item.name,
                                    category: selectedCategory,
                                    quantity: qty,
                                    unit: item.unit,
                                  };
                                  setIssueItems([...issueItems, newItem]);
                                  qtyInput.value = '';
                                  setShowAddItemModal(false);
                                }
                              }}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200 rounded-b-2xl">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

