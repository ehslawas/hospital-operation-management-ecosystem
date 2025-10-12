'use client';

import { useState, useEffect } from 'react';

export default function OxygenReceivePage() {
  const [department, setDepartment] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDepartment(localStorage.getItem('department'));
    }
  }, []);
  const [formData, setFormData] = useState({
    date: '',
    doNo: '',
    documentNo: '',
    supplier: ''
  });

  const [oxygenItems, setOxygenItems] = useState([
    { oxygenType: '', quantity: '', cylinderCodes: '' }
  ]);

  const [expandedDeliveries, setExpandedDeliveries] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [deliveries, setDeliveries] = useState([
    {
      id: 'DEL-001',
      date: '2024-12-15',
      doNo: 'DO-2024-001',
      documentNo: 'DOC-001',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 3,
      status: 'Received',
      receivedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia',
      cylinderCodes: ''
    },
    {
      id: 'DEL-001',
      date: '2024-12-15',
      doNo: 'DO-2024-001',
      documentNo: 'DOC-001',
      oxygenType: 'PI 1.4',
      quantity: 8,
      status: 'Received',
      receivedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia',
      cylinderCodes: 'PI 01(f), PI 02(f), PI 03(f), PI 04(f), PI 05(f), PI 06(f), PI 07(f), PI 08(f)'
    },
    {
      id: 'DEL-001',
      date: '2024-12-15',
      doNo: 'DO-2024-001',
      documentNo: 'DOC-001',
      oxygenType: 'BN 1.4',
      quantity: 5,
      status: 'Received',
      receivedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia',
      cylinderCodes: 'BN 001, BN 002, BN 003, BN 004, BN 005'
    },
    {
      id: 'DEL-002',
      date: '2024-12-14',
      doNo: 'DO-2024-002',
      documentNo: 'DOC-002',
      oxygenType: 'BN 6.4',
      quantity: 4,
      status: 'Received',
      receivedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products',
      cylinderCodes: 'HS 1, HS 2, HS 3, HS 4'
    },
    {
      id: 'DEL-002',
      date: '2024-12-14',
      doNo: 'DO-2024-002',
      documentNo: 'DOC-002',
      oxygenType: 'PI 0.7',
      quantity: 6,
      status: 'Received',
      receivedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products',
      cylinderCodes: 'PI 1(e), PI 2(e), PI 3(e), PI 4(e), PI 5(e), PI 6(e)'
    },
    {
      id: 'DEL-002',
      date: '2024-12-14',
      doNo: 'DO-2024-002',
      documentNo: 'DOC-002',
      oxygenType: 'PI 0.5',
      quantity: 10,
      status: 'Received',
      receivedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products',
      cylinderCodes: 'PI 1(d), PI 2(d), PI 3(d), PI 4(d), PI 5(d), PI 6(d), PI 7(d), PI 8(d), PI 9(d), PI 10(d)'
    },
    {
      id: 'DEL-003',
      date: '2024-12-13',
      doNo: 'DO-2024-003',
      documentNo: 'DOC-003',
      oxygenType: 'PI 1.4 - Loan',
      quantity: 2,
      status: 'Pending',
      receivedBy: '',
      supplier: 'BOC Malaysia',
      cylinderCodes: ''
    },
    {
      id: 'DEL-003',
      date: '2024-12-13',
      doNo: 'DO-2024-003',
      documentNo: 'DOC-003',
      oxygenType: 'BN 1.4',
      quantity: 7,
      status: 'Pending',
      receivedBy: '',
      supplier: 'BOC Malaysia',
      cylinderCodes: 'BN 006, BN 007, BN 008, BN 009, BN 010, BN 011, BN 012'
    },
    {
      id: 'DEL-004',
      date: '2024-12-12',
      doNo: 'DO-2024-004',
      documentNo: 'DOC-004',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 2,
      status: 'Received',
      receivedBy: 'MA Syahirunnisa',
      supplier: 'Linde Malaysia',
      cylinderCodes: ''
    },
    {
      id: 'DEL-004',
      date: '2024-12-12',
      doNo: 'DO-2024-004',
      documentNo: 'DOC-004',
      oxygenType: 'PI 1.4',
      quantity: 5,
      status: 'Received',
      receivedBy: 'MA Syahirunnisa',
      supplier: 'Linde Malaysia',
      cylinderCodes: 'PI 09(f), PI 10(f), PI 11(f), PI 12(f), PI 13(f)'
    },
    {
      id: 'DEL-004',
      date: '2024-12-12',
      doNo: 'DO-2024-004',
      documentNo: 'DOC-004',
      oxygenType: 'PI 0.5',
      quantity: 8,
      status: 'Received',
      receivedBy: 'MA Syahirunnisa',
      supplier: 'Linde Malaysia',
      cylinderCodes: 'PI 1(d), PI 2(d), PI 3(d), PI 4(d), PI 5(d), PI 6(d), PI 7(d), PI 8(d)'
    },
    {
      id: 'DEL-005',
      date: '2024-12-11',
      doNo: 'DO-2024-005',
      documentNo: 'DOC-005',
      oxygenType: 'BN 6.4',
      quantity: 3,
      status: 'Received',
      receivedBy: 'Dr. Fatimah Zahra',
      supplier: 'Air Products',
      cylinderCodes: 'HS 5, HS 6, HS 7'
    },
    {
      id: 'DEL-005',
      date: '2024-12-11',
      doNo: 'DO-2024-005',
      documentNo: 'DOC-005',
      oxygenType: 'PI 1.4',
      quantity: 6,
      status: 'Received',
      receivedBy: 'Dr. Fatimah Zahra',
      supplier: 'Air Products',
      cylinderCodes: 'PI 14(f), PI 15(f), PI 16(f), PI 17(f), PI 18(f), PI 19(f)'
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

  const toggleDeliveryDetails = (deliveryKey: string) => {
    const newExpanded = new Set(expandedDeliveries);
    if (newExpanded.has(deliveryKey)) {
      newExpanded.delete(deliveryKey);
    } else {
      newExpanded.add(deliveryKey);
    }
    setExpandedDeliveries(newExpanded);
  };

  // Group deliveries by date and DO number
  const groupedDeliveries = deliveries.reduce((acc, delivery) => {
    const key = `${delivery.date}-${delivery.doNo}`;
    if (!acc[key]) {
      acc[key] = {
        date: delivery.date,
        doNo: delivery.doNo,
        documentNo: delivery.documentNo,
        supplier: delivery.supplier,
        receivedBy: delivery.receivedBy,
        oxygenTypes: []
      };
    }
    acc[key].oxygenTypes.push({
      type: delivery.oxygenType,
      quantity: delivery.quantity
    });
    return acc;
  }, {} as Record<string, any>);

  const deliveryGroups = Object.entries(groupedDeliveries).map(([key, group]) => ({
    key,
    ...group,
    totalCylinders: group.oxygenTypes.reduce((sum: number, item: any) => sum + item.quantity, 0)
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create separate delivery records for each oxygen type
    const newDeliveries = oxygenItems.map((item, index) => ({
      id: `DEL-${String(deliveries.length + index + 1).padStart(3, '0')}`,
      date: formData.date,
      doNo: formData.doNo,
      documentNo: formData.documentNo,
      oxygenType: item.oxygenType,
      quantity: parseInt(item.quantity),
      status: 'Received',
      receivedBy: 'Current User',
      supplier: formData.supplier,
      cylinderCodes: item.cylinderCodes
    }));
    
    setDeliveries(prev => [...newDeliveries, ...prev]);
    setFormData({
      date: '',
      doNo: '',
      documentNo: '',
      supplier: ''
    });
    setOxygenItems([{ oxygenType: '', quantity: '', cylinderCodes: '' }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOxygenTypeColor = (type: string) => {
    if (type.includes('BN')) return 'bg-blue-100 text-blue-800';
    if (type.includes('PI')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
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

  // Always render the same content to avoid hydration mismatch
  // The isClient check is only used for client-side specific functionality

  return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
            <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Oxygen Receive</h1>
              <p className="text-slate-600 mt-1">Record new oxygen deliveries and track received inventory</p>
            </div>
          </div>
          <div className="flex space-x-4">
            {department !== 'Office Admin' && (
              <button 
                onClick={() => isClient && window.print()}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center border border-white/20"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            )}
          </div>
        </div>

        {/* Receive Form (hidden for Office Admin) */}
        {department !== 'Office Admin' && (
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-900">New Delivery</h2>
              <p className="text-slate-600 mt-1">Record incoming oxygen cylinder deliveries</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Delivery Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Delivery Order No</label>
                    <input
                      type="text"
                      name="doNo"
                      value={formData.doNo}
                      onChange={handleInputChange}
                      placeholder="DO-2024-XXX"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Document No</label>
                    <input
                      type="text"
                      name="documentNo"
                      value={formData.documentNo}
                      onChange={handleInputChange}
                      placeholder="DOC-XXX"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Oxygen Types & Quantities</h3>
                    <button
                      type="button"
                      onClick={addOxygenItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Supplier</label>
                        <select 
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
                        >
                          <option value="">Select supplier</option>
                          <option value="Linde Malaysia">Linde Malaysia</option>
                          <option value="Air Products">Air Products</option>
                          <option value="BOC Malaysia">BOC Malaysia</option>
                          <option value="Other">Other</option>
                        </select>
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
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white"
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
                                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                  >
                                    {code}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentCodes = item.cylinderCodes.split(', ');
                                        const newCodes = currentCodes.filter((_, i) => i !== codeIndex).join(', ');
                                        handleOxygenItemChange(index, 'cylinderCodes', newCodes);
                                      }}
                                      className="ml-1 text-green-600 hover:text-green-800"
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
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Record Delivery</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}

        {/* Deliveries Log */}
        <div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/20 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-900">Delivery Log</h2>
              <p className="text-slate-600 mt-1">Recent oxygen deliveries and receipts</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {deliveryGroups.map((group) => (
                  <div key={group.key} className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-slate-600 text-sm font-medium">{group.date}</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-slate-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <span className="text-slate-900 font-semibold">Delivery</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow-md">{group.doNo}</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-medium flex items-center shadow-md">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Received
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Oxygen Delivered: {group.totalCylinders} cylinders</h3>
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
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm flex-1">
                            <div>
                              <span className="text-slate-600 font-medium">Document No:</span>
                              <span className="ml-2 text-slate-900">{group.documentNo}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 font-medium">Supplier:</span>
                              <span className="ml-2 text-slate-900">{group.supplier}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 font-medium">Received By:</span>
                              <span className="ml-2 text-slate-900">{group.receivedBy || 'Not specified'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleDeliveryDetails(group.key)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 flex items-center ml-4"
                          >
                            {expandedDeliveries.has(group.key) ? 'Hide details' : 'View details'}
                            <svg
                              className={`w-4 h-4 ml-1 transition-transform duration-200 ${expandedDeliveries.has(group.key) ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {expandedDeliveries.has(group.key) && (
                          <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Oxygen Details</h4>
                            <div className="space-y-3">
                              {group.oxygenTypes.map((item: any, index: number) => {
                                const deliveryItem = deliveries.find(d => 
                                  d.date === group.date && 
                                  d.doNo === group.doNo && 
                                  d.oxygenType === item.type
                                );
                                return (
                                  <div key={index} className="py-3 px-4 bg-white/80 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getOxygenTypeColor(item.type)}`}>
                                        {item.type}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-900">{item.quantity} cylinders</span>
                                    </div>
                                    {deliveryItem?.cylinderCodes && (
                                      <div className="mt-2">
                                        <span className="text-xs font-medium text-slate-600">Cylinder Codes:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {deliveryItem.cylinderCodes.split(', ').map((code: string, codeIndex: number) => (
                                            <span key={codeIndex} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-mono">
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
