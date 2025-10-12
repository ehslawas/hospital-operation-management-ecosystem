'use client';

import { useState, useEffect } from 'react';

export default function OxygenReturnPage() {
  const [formData, setFormData] = useState({
    date: '',
    supplier: ''
  });

  const [oxygenItems, setOxygenItems] = useState([
    { oxygenType: '', quantity: '', cylinderCodes: '' }
  ]);

  const [expandedReturns, setExpandedReturns] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [returns, setReturns] = useState([
    {
      id: 'RET-001',
      date: '2024-12-15',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia',
      cylinderCodes: ''
    },
    {
      id: 'RET-001',
      date: '2024-12-15',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'PI 1.4',
      quantity: 5,
      status: 'Returned',
      returnedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia',
      cylinderCodes: 'PI 01(f), PI 02(f), PI 03(f), PI 04(f), PI 05(f)'
    },
    {
      id: 'RET-001',
      date: '2024-12-15',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'BN 1.4',
      quantity: 3,
      status: 'Returned',
      returnedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia',
      cylinderCodes: 'BN 001, BN 002, BN 003'
    },
    {
      id: 'RET-002',
      date: '2024-12-14',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'BN 6.4',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products',
      cylinderCodes: 'HS 1, HS 2'
    },
    {
      id: 'RET-002',
      date: '2024-12-14',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'PI 0.7',
      quantity: 4,
      status: 'Returned',
      returnedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products',
      cylinderCodes: 'PI 1(e), PI 2(e), PI 3(e), PI 4(e)'
    },
    {
      id: 'RET-003',
      date: '2024-12-13',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'PI 1.4 - Loan',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'MA Syahirunnisa',
      supplier: 'BOC Malaysia',
      cylinderCodes: ''
    },
    {
      id: 'RET-003',
      date: '2024-12-13',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'BN 1.4',
      quantity: 4,
      status: 'Returned',
      returnedBy: 'MA Syahirunnisa',
      supplier: 'BOC Malaysia',
      cylinderCodes: 'BN 004, BN 005, BN 006, BN 007'
    }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOxygenItemChange = (index: number, field: string, value: string) => {
    const updatedItems = oxygenItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setOxygenItems(updatedItems);
  };

  const addOxygenItem = () => {
    setOxygenItems([...oxygenItems, { oxygenType: '', quantity: '', cylinderCodes: '' }]);
  };

  const removeOxygenItem = (index: number) => {
    if (oxygenItems.length > 1) {
      setOxygenItems(oxygenItems.filter((_, i) => i !== index));
    }
  };

  const toggleReturnDetails = (returnKey: string) => {
    const newExpanded = new Set(expandedReturns);
    if (newExpanded.has(returnKey)) {
      newExpanded.delete(returnKey);
    } else {
      newExpanded.add(returnKey);
    }
    setExpandedReturns(newExpanded);
  };

  const printReturnRecord = (group: any) => {
    if (!isClient) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the specific return group data
    const returnData = returns.filter(r => 
      r.date === group.date && r.fixTransactionNo === group.fixTransactionNo
    );

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Oxygen Return Record - ${group.fixTransactionNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #dc2626; }
            .subtitle { color: #666; margin-top: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #111827; }
            .oxygen-summary { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .oxygen-types { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
            .oxygen-badge { background: #e5e7eb; padding: 5px 10px; border-radius: 20px; font-size: 14px; }
            .details-section { margin-top: 20px; }
            .detail-item { background: white; border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
            .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .cylinder-codes { margin-top: 10px; }
            .cylinder-badge { background: #fef2f2; color: #dc2626; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin: 2px; display: inline-block; }
            .no-tag { background: #f3f4f6; color: #6b7280; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Oxygen Return Record</div>
            <div class="subtitle">FIX Transaction: ${group.fixTransactionNo}</div>
          </div>
          
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="label">Return Date:</span>
                <span class="value">${group.date}</span>
              </div>
              <div class="info-item">
                <span class="label">Supplier:</span>
                <span class="value">${group.supplier}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="label">Returned By:</span>
                <span class="value">${group.returnedBy || 'Not specified'}</span>
              </div>
              <div class="info-item">
                <span class="label">Total Cylinders:</span>
                <span class="value">${group.totalCylinders}</span>
              </div>
            </div>
          </div>

          <div class="oxygen-summary">
            <div class="label">Oxygen Types Returned:</div>
            <div class="oxygen-types">
              ${group.oxygenTypes.map((item: any) => 
                `<span class="oxygen-badge">${item.type} × ${item.quantity}</span>`
              ).join('')}
            </div>
          </div>

          <div class="details-section">
            <div class="label">Detailed Breakdown:</div>
            ${group.oxygenTypes.map((item: any) => {
              const returnItem = returnData.find(r => r.oxygenType === item.type);
              return `
                <div class="detail-item">
                  <div class="detail-header">
                    <span class="oxygen-badge">${item.type}</span>
                    <span class="value">${item.quantity} cylinders</span>
                  </div>
                  <div class="cylinder-codes">
                    <div class="label">Cylinder Codes:</div>
                    ${returnItem?.cylinderCodes ? 
                      returnItem.cylinderCodes.split(', ').map((code: string) => 
                        `<span class="cylinder-badge">${code}</span>`
                      ).join('') :
                      '<span class="no-tag">No Tag (Loan)</span>'
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateFixTransactionNo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FIX-${year}${month}${day}-${random}`;
  };

  const isLoanOxygen = (type: string) => {
    return type.includes('Loan');
  };

  const generateCylinderCodes = (type: string) => {
    switch (type) {
      case 'BN 6.4':
        return Array.from({ length: 30 }, (_, i) => `HS ${i + 1}`);
      case 'BN 1.4':
        return Array.from({ length: 120 }, (_, i) => `BN ${String(i + 1).padStart(3, '0')}`);
      case 'PI 1.4':
        return Array.from({ length: 50 }, (_, i) => `PI ${String(i + 1).padStart(2, '0')}(f)`);
      case 'PI 0.5':
        return Array.from({ length: 10 }, (_, i) => `PI ${i + 1}(d)`);
      case 'PI 0.7':
        return Array.from({ length: 10 }, (_, i) => `PI ${i + 1}(e)`);
      default:
        return [];
    }
  };

  const getOxygenTypeColor = (type: string) => {
    if (type.includes('BN')) return 'bg-blue-100 text-blue-800';
    if (type.includes('PI')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Group returns by date and FIX transaction number
  const groupedReturns = returns.reduce((acc, returnItem) => {
    const key = `${returnItem.date}-${returnItem.fixTransactionNo}`;
    if (!acc[key]) {
      acc[key] = {
        date: returnItem.date,
        fixTransactionNo: returnItem.fixTransactionNo,
        supplier: returnItem.supplier,
        returnedBy: returnItem.returnedBy,
        oxygenTypes: []
      };
    }
    acc[key].oxygenTypes.push({
      type: returnItem.oxygenType,
      quantity: returnItem.quantity
    });
    return acc;
  }, {} as Record<string, any>);

  const returnGroups = Object.entries(groupedReturns).map(([key, group]) => ({
    key,
    ...group,
    totalCylinders: group.oxygenTypes.reduce((sum: number, item: any) => sum + item.quantity, 0)
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fixTransactionNo = generateFixTransactionNo();
    
    // Create separate return records for each oxygen type
    const newReturns = oxygenItems.map((item, index) => ({
      id: `RET-${String(returns.length + index + 1).padStart(3, '0')}`,
      date: formData.date,
      fixTransactionNo: fixTransactionNo,
      oxygenType: item.oxygenType,
      quantity: parseInt(item.quantity),
      status: 'Returned',
      returnedBy: 'Current User',
      supplier: formData.supplier,
      cylinderCodes: item.cylinderCodes
    }));
    
    setReturns(prev => [...newReturns, ...prev]);
    setFormData({
      date: '',
      supplier: ''
    });
    setOxygenItems([{ oxygenType: '', quantity: '', cylinderCodes: '' }]);
  };

  // Always render the same content to avoid hydration mismatch
  // The isClient check is only used for client-side specific functionality

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-rose-50/50">
      <div className=" p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Oxygen Return</h1>
              <p className="text-slate-600 mt-1">Record returned oxygen cylinders to suppliers</p>
            </div>
          </div>
        </div>

        {/* Return Form */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-900">New Return</h2>
              <p className="text-slate-600 mt-1">Record outgoing oxygen cylinder returns</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Return Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Supplier</label>
                    <select 
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white"
                    >
                      <option value="">Select supplier</option>
                      <option value="Linde Malaysia">Linde Malaysia</option>
                      <option value="Air Products">Air Products</option>
                      <option value="BOC Malaysia">BOC Malaysia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Oxygen Types & Quantities</h3>
                    <button
                      type="button"
                      onClick={addOxygenItem}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Oxygen Type</span>
                    </button>
                  </div>

                  {oxygenItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Oxygen Type & Size</label>
                        <select
                          value={item.oxygenType}
                          onChange={(e) => handleOxygenItemChange(index, 'oxygenType', e.target.value)}
                          required
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white"
                        >
                          <option value="">Select oxygen type</option>
                          <option value="BN 8.00 - Loan">BN 8.00 - Loan</option>
                          <option value="BN 6.4">BN 6.4</option>
                          <option value="PI 1.4 - Loan">PI 1.4 - Loan</option>
                          <option value="PI 1.4">PI 1.4</option>
                          <option value="BN 1.4">BN 1.4</option>
                          <option value="PI 0.7">PI 0.7</option>
                          <option value="PI 0.5">PI 0.5</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleOxygenItemChange(index, 'quantity', e.target.value)}
                          placeholder="Number of cylinders"
                          required
                          min="1"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Cylinder Codes
                          {!isLoanOxygen(item.oxygenType) && item.oxygenType && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {isLoanOxygen(item.oxygenType) ? (
                          <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 text-sm">
                            No tagging required (Loan)
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const currentCodes = item.cylinderCodes ? item.cylinderCodes.split(', ') : [];
                                  const newCodes = [...currentCodes, e.target.value].join(', ');
                                  handleOxygenItemChange(index, 'cylinderCodes', newCodes);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 bg-white"
                            >
                              <option value="">Select cylinder code...</option>
                              {generateCylinderCodes(item.oxygenType).map((code) => (
                                <option key={code} value={code}>
                                  {code}
                                </option>
                              ))}
                            </select>
                            {item.cylinderCodes && (
                              <div className="flex flex-wrap gap-1">
                                {item.cylinderCodes.split(', ').map((code, codeIndex) => (
                                  <span
                                    key={codeIndex}
                                    className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                                  >
                                    {code}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentCodes = item.cylinderCodes.split(', ');
                                        const newCodes = currentCodes.filter((_, i) => i !== codeIndex).join(', ');
                                        handleOxygenItemChange(index, 'cylinderCodes', newCodes);
                                      }}
                                      className="ml-1 text-red-600 hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {oxygenItems.length > 1 && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeOxygenItem(index)}
                            className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold shadow-md hover:bg-red-700 hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Record Return</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Returns Log */}
        <div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/20 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-900">Return Log</h2>
              <p className="text-slate-600 mt-1">Recent oxygen cylinder returns to suppliers</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {returnGroups.map((group) => (
                  <div key={group.key} className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-slate-600 text-sm font-medium">{group.date}</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-slate-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <span className="text-slate-900 font-semibold">Return</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-medium shadow-md">{group.fixTransactionNo}</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-medium flex items-center shadow-md">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Returned
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Oxygen Returned: {group.totalCylinders} cylinders</h3>
                        <div className="flex flex-wrap gap-2">
                          {group.oxygenTypes.map((item: any, index: number) => (
                            <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-md ${getOxygenTypeColor(item.type)}`}>
                              {item.type} × {item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200/50 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm flex-1">
                            <div>
                              <span className="text-slate-600 font-medium">Supplier:</span>
                              <span className="ml-2 text-slate-900">{group.supplier}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 font-medium">Returned By:</span>
                              <span className="ml-2 text-slate-900">{group.returnedBy || 'Not specified'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleReturnDetails(group.key)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200 flex items-center ml-4"
                          >
                            {expandedReturns.has(group.key) ? 'Hide details' : 'View details'}
                            <svg
                              className={`w-4 h-4 ml-1 transition-transform duration-200 ${expandedReturns.has(group.key) ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {expandedReturns.has(group.key) && (
                          <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-700">Oxygen Details</h4>
                              <button
                                onClick={() => printReturnRecord(group)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>Print</span>
                              </button>
                            </div>
                            <div className="space-y-3">
                              {group.oxygenTypes.map((item: any, index: number) => {
                                const returnItem = returns.find(r => 
                                  r.date === group.date && 
                                  r.fixTransactionNo === group.fixTransactionNo && 
                                  r.oxygenType === item.type
                                );
                                return (
                                  <div key={index} className="py-3 px-4 bg-white/80 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getOxygenTypeColor(item.type)}`}>
                                        {item.type}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">{item.quantity} cylinders</span>
                                    </div>
                                    {returnItem?.cylinderCodes && (
                                      <div className="mt-2">
                                        <span className="text-xs font-medium text-slate-600">Cylinder Codes:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {returnItem.cylinderCodes.split(', ').map((code: string, codeIndex: number) => (
                                            <span key={codeIndex} className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-mono">
                                              {code}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {isLoanOxygen(item.type) && (
                                      <div className="mt-2">
                                        <span className="text-xs font-medium text-slate-600">Cylinder Codes:</span>
                                        <div className="mt-1">
                                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            No Tag (Loan)
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
