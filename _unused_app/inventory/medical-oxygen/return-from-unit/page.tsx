'use client';

import { useState, useEffect } from 'react';

export default function OxygenReturnFromUnitPage() {
  const [formData, setFormData] = useState({
    date: '',
    unit: '',
    returnedBy: ''
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
    // ETU Return - 4 types of oxygen
    {
      id: 'RET-001',
      date: '2024-12-15',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Ahmad Rahman',
      unit: 'ETU',
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
      unit: 'ETU',
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
      unit: 'ETU',
      cylinderCodes: 'BN 001, BN 002, BN 003'
    },
    {
      id: 'RET-001',
      date: '2024-12-15',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'PI 0.7',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Ahmad Rahman',
      unit: 'ETU',
      cylinderCodes: 'PI 01(e), PI 02(e)'
    },
    // GW Return - 3 types of oxygen
    {
      id: 'RET-002',
      date: '2024-12-14',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'PI 0.7',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Nurse Sarah Lee',
      unit: 'GW',
      cylinderCodes: 'PI 01(e), PI 02(e)'
    },
    {
      id: 'RET-002',
      date: '2024-12-14',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'PI 0.5',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Nurse Sarah Lee',
      unit: 'GW',
      cylinderCodes: 'PI 01(d)'
    },
    {
      id: 'RET-002',
      date: '2024-12-14',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'BN 6.4',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Nurse Sarah Lee',
      unit: 'GW',
      cylinderCodes: 'HS 22'
    },
    // MAT Return - 4 types of oxygen
    {
      id: 'RET-003',
      date: '2024-12-13',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'BN 6.4',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Dr. Lim Wei Ming',
      unit: 'MAT',
      cylinderCodes: 'HS 15'
    },
    {
      id: 'RET-003',
      date: '2024-12-13',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'PI 1.4',
      quantity: 3,
      status: 'Returned',
      returnedBy: 'Dr. Lim Wei Ming',
      unit: 'MAT',
      cylinderCodes: 'PI 01(f), PI 02(f), PI 03(f)'
    },
    {
      id: 'RET-003',
      date: '2024-12-13',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'BN 1.4',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Lim Wei Ming',
      unit: 'MAT',
      cylinderCodes: 'BN 015, BN 016'
    },
    {
      id: 'RET-003',
      date: '2024-12-13',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'PI 0.5',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Dr. Lim Wei Ming',
      unit: 'MAT',
      cylinderCodes: 'PI 01(d)'
    },
    // X-RAY Return - 3 types of oxygen
    {
      id: 'RET-004',
      date: '2024-12-12',
      fixTransactionNo: 'FIX-2024-004',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Dr. Priya Sharma',
      unit: 'X-RAY',
      cylinderCodes: ''
    },
    {
      id: 'RET-004',
      date: '2024-12-12',
      fixTransactionNo: 'FIX-2024-004',
      oxygenType: 'PI 1.4',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Priya Sharma',
      unit: 'X-RAY',
      cylinderCodes: 'PI 01(f), PI 02(f)'
    },
    {
      id: 'RET-004',
      date: '2024-12-12',
      fixTransactionNo: 'FIX-2024-004',
      oxygenType: 'BN 6.4',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Dr. Priya Sharma',
      unit: 'X-RAY',
      cylinderCodes: 'HS 05'
    },
    // HDU Return - 5 types of oxygen
    {
      id: 'RET-005',
      date: '2024-12-11',
      fixTransactionNo: 'FIX-2024-005',
      oxygenType: 'BN 6.4',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Nurse Ahmad Yusuf',
      unit: 'HDU',
      cylinderCodes: 'HS 08, HS 12'
    },
    {
      id: 'RET-005',
      date: '2024-12-11',
      fixTransactionNo: 'FIX-2024-005',
      oxygenType: 'PI 0.7',
      quantity: 4,
      status: 'Returned',
      returnedBy: 'Nurse Ahmad Yusuf',
      unit: 'HDU',
      cylinderCodes: 'PI 01(e), PI 02(e), PI 03(e), PI 04(e)'
    },
    {
      id: 'RET-005',
      date: '2024-12-11',
      fixTransactionNo: 'FIX-2024-005',
      oxygenType: 'PI 1.4',
      quantity: 3,
      status: 'Returned',
      returnedBy: 'Nurse Ahmad Yusuf',
      unit: 'HDU',
      cylinderCodes: 'PI 01(f), PI 02(f), PI 03(f)'
    },
    {
      id: 'RET-005',
      date: '2024-12-11',
      fixTransactionNo: 'FIX-2024-005',
      oxygenType: 'BN 1.4',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Nurse Ahmad Yusuf',
      unit: 'HDU',
      cylinderCodes: 'BN 008, BN 009'
    },
    {
      id: 'RET-005',
      date: '2024-12-11',
      fixTransactionNo: 'FIX-2024-005',
      oxygenType: 'PI 0.5',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Nurse Ahmad Yusuf',
      unit: 'HDU',
      cylinderCodes: 'PI 01(d)'
    },
    // PW Return - 3 types of oxygen
    {
      id: 'RET-006',
      date: '2024-12-10',
      fixTransactionNo: 'FIX-2024-006',
      oxygenType: 'BN 1.4',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Dr. Chen Mei Ling',
      unit: 'PW',
      cylinderCodes: 'BN 045'
    },
    {
      id: 'RET-006',
      date: '2024-12-10',
      fixTransactionNo: 'FIX-2024-006',
      oxygenType: 'PI 0.5',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Chen Mei Ling',
      unit: 'PW',
      cylinderCodes: 'PI 01(d), PI 02(d)'
    },
    {
      id: 'RET-006',
      date: '2024-12-10',
      fixTransactionNo: 'FIX-2024-006',
      oxygenType: 'PI 0.7',
      quantity: 1,
      status: 'Returned',
      returnedBy: 'Dr. Chen Mei Ling',
      unit: 'PW',
      cylinderCodes: 'PI 01(e)'
    },
    // OT Return - 6 types of oxygen
    {
      id: 'RET-007',
      date: '2024-12-09',
      fixTransactionNo: 'FIX-2024-007',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 3,
      status: 'Returned',
      returnedBy: 'Dr. Raj Kumar',
      unit: 'OT',
      cylinderCodes: ''
    },
    {
      id: 'RET-007',
      date: '2024-12-09',
      fixTransactionNo: 'FIX-2024-007',
      oxygenType: 'PI 1.4',
      quantity: 6,
      status: 'Returned',
      returnedBy: 'Dr. Raj Kumar',
      unit: 'OT',
      cylinderCodes: 'PI 01(f), PI 02(f), PI 03(f), PI 04(f), PI 05(f), PI 06(f)'
    },
    {
      id: 'RET-007',
      date: '2024-12-09',
      fixTransactionNo: 'FIX-2024-007',
      oxygenType: 'BN 6.4',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Raj Kumar',
      unit: 'OT',
      cylinderCodes: 'HS 01, HS 02'
    },
    {
      id: 'RET-007',
      date: '2024-12-09',
      fixTransactionNo: 'FIX-2024-007',
      oxygenType: 'BN 1.4',
      quantity: 4,
      status: 'Returned',
      returnedBy: 'Dr. Raj Kumar',
      unit: 'OT',
      cylinderCodes: 'BN 001, BN 002, BN 003, BN 004'
    },
    {
      id: 'RET-007',
      date: '2024-12-09',
      fixTransactionNo: 'FIX-2024-007',
      oxygenType: 'PI 0.7',
      quantity: 3,
      status: 'Returned',
      returnedBy: 'Dr. Raj Kumar',
      unit: 'OT',
      cylinderCodes: 'PI 01(e), PI 02(e), PI 03(e)'
    },
    {
      id: 'RET-007',
      date: '2024-12-09',
      fixTransactionNo: 'FIX-2024-007',
      oxygenType: 'PI 0.5',
      quantity: 2,
      status: 'Returned',
      returnedBy: 'Dr. Raj Kumar',
      unit: 'OT',
      cylinderCodes: 'PI 01(d), PI 02(d)'
    }
  ]);

  const oxygenTypes = [
    'BN 8.00 - Loan',
    'BN 6.4',
    'PI 1.4 - Loan',
    'PI 1.4',
    'BN 1.4',
    'PI 0.7',
    'PI 0.5'
  ];

  const units = ['GW', 'ETU', 'MAT', 'X-RAY', 'HDU', 'PW', 'OT'];

  const generateFixTransactionNo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FIX-${year}-${month}${day}-${random}`;
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fixTransactionNo = generateFixTransactionNo();
    
    const newReturns = oxygenItems.map(item => ({
      id: `RET-${Date.now()}`,
      date: formData.date,
      fixTransactionNo: fixTransactionNo,
      oxygenType: item.oxygenType,
      quantity: parseInt(item.quantity) || 0,
      status: 'Returned',
      returnedBy: formData.returnedBy,
      unit: formData.unit,
      cylinderCodes: item.cylinderCodes
    }));

    setReturns(prev => [...newReturns, ...prev]);
    
    // Reset form
    setFormData({
      date: '',
      unit: '',
      returnedBy: ''
    });
    setOxygenItems([{ oxygenType: '', quantity: '', cylinderCodes: '' }]);
  };

  const toggleExpanded = (returnKey: string) => {
    const newExpanded = new Set(expandedReturns);
    if (newExpanded.has(returnKey)) {
      newExpanded.delete(returnKey);
    } else {
      newExpanded.add(returnKey);
    }
    setExpandedReturns(newExpanded);
  };


  // Group returns by date and fix transaction number
  const groupedReturns = returns.reduce((acc, returnItem) => {
    const key = `${returnItem.date}-${returnItem.fixTransactionNo}`;
    if (!acc[key]) {
      acc[key] = {
        date: returnItem.date,
        fixTransactionNo: returnItem.fixTransactionNo,
        unit: returnItem.unit,
        returnedBy: returnItem.returnedBy,
        items: []
      };
    }
    acc[key].items.push(returnItem);
    return acc;
  }, {} as Record<string, any>);

  const groupedReturnsArray = Object.values(groupedReturns);

  // Always render the same content to avoid hydration mismatch
  // The isClient check is only used for client-side specific functionality

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50">
      <div className=" p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900">Oxygen Return from Unit</h1>
              <p className="text-slate-600 mt-1">Process oxygen cylinder returns from hospital units</p>
            </div>
          </div>
        </div>

        {/* New Return Form */}
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">New Return from Unit</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Return Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Return By</label>
                <input
                  type="text"
                  name="returnedBy"
                  value={formData.returnedBy}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Oxygen Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Oxygen Items</h3>
                <button
                  type="button"
                  onClick={addOxygenItem}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Add Item
                </button>
              </div>
              
              <div className="space-y-4">
                {oxygenItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/20 rounded-xl border border-white/30">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Oxygen Type</label>
                      <select
                        value={item.oxygenType}
                        onChange={(e) => handleOxygenItemChange(index, 'oxygenType', e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">Select Type</option>
                        {oxygenTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleOxygenItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Cylinder Codes</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={item.cylinderCodes}
                          onChange={(e) => handleOxygenItemChange(index, 'cylinderCodes', e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder={item.oxygenType.includes('Loan') ? 'No Tag (Loan)' : 'Enter codes...'}
                          disabled={item.oxygenType.includes('Loan')}
                        />
                        {oxygenItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOxygenItem(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({ date: '', unit: '', returnedBy: '' });
                  setOxygenItems([{ oxygenType: '', quantity: '', cylinderCodes: '' }]);
                }}
                className="px-6 py-3 bg-white/50 backdrop-blur-sm text-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-white/30"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Process Return
              </button>
            </div>
          </form>
        </div>

        {/* Return Log */}
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
          <div className="px-8 py-6 border-b border-white/30 bg-white/20">
            <h3 className="text-2xl font-bold text-slate-800">Return from Unit Log</h3>
            <p className="text-slate-600 mt-2">Track all oxygen cylinder returns from hospital units</p>
          </div>
          
          <div className="p-8">
            {groupedReturnsArray.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-slate-600 mb-2">No Returns Yet</h4>
                <p className="text-slate-500">Process your first oxygen return from a unit to see it here.</p>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
                {/* Table Header */}
                <div className="px-6 py-4 bg-white/30 border-b border-white/40">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Transaction No</div>
                    </div>
                    <div className="col-span-1">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Unit</div>
                    </div>
                    <div className="col-span-3">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Returned By</div>
                    </div>
                    <div className="col-span-1">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Items</div>
                    </div>
                    <div className="col-span-3">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</div>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/20">
                  {groupedReturnsArray.map((group, index) => {
                    const returnKey = `${group.date}-${group.fixTransactionNo}`;
                    const isExpanded = expandedReturns.has(returnKey);
                    
                    return (
                      <div key={returnKey} className="hover:bg-white/10 transition-colors">
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-2">
                              <div className="text-sm font-medium text-slate-800">{group.date}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-sm font-medium text-slate-800 font-mono">{group.fixTransactionNo}</div>
                            </div>
                            <div className="col-span-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {group.unit}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <div className="text-sm font-medium text-slate-800">{group.returnedBy}</div>
                            </div>
                            <div className="col-span-1">
                              <div className="text-sm font-bold text-slate-800 text-center">{group.items.length}</div>
                            </div>
                            <div className="col-span-3">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => toggleExpanded(returnKey)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white/50 hover:bg-white/70 rounded-lg transition-colors"
                                >
                                  <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                  <svg 
                                    className={`ml-1.5 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-white/30">
                              <div className="bg-white/30 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Return Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {group.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="bg-white/50 rounded-lg p-3 border border-white/40">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          {item.oxygenType}
                                        </span>
                                        <span className="text-sm font-bold text-slate-800">{item.quantity} cyl</span>
                                      </div>
                                      <div className="text-xs text-slate-600">
                                        {item.cylinderCodes || 'No Tag (Loan)'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
