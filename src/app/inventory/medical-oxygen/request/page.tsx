'use client';

import { useState, useEffect } from 'react';

export default function OxygenRequestPage() {
  const [formData, setFormData] = useState({
    requestDate: '',
    deliveryDate: '',
    supplier: ''
  });

  const [oxygenItems, setOxygenItems] = useState([
    { oxygenType: '', quantity: '', comment: '' }
  ]);

  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [requests, setRequests] = useState([
    {
      id: 'REQ-001',
      requestDate: '2024-12-15',
      deliveryDate: '2024-12-18',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 2,
      status: 'Pending',
      requestedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia'
    },
    {
      id: 'REQ-001',
      requestDate: '2024-12-15',
      deliveryDate: '2024-12-18',
      fixTransactionNo: 'FIX-2024-001',
      oxygenType: 'PI 1.4 - Loan',
      quantity: 5,
      status: 'Pending',
      requestedBy: 'Dr. Ahmad Rahman',
      supplier: 'Linde Malaysia'
    },
    {
      id: 'REQ-002',
      requestDate: '2024-12-14',
      deliveryDate: '2024-12-17',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 3,
      status: 'Approved',
      requestedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products'
    },
    {
      id: 'REQ-002',
      requestDate: '2024-12-14',
      deliveryDate: '2024-12-17',
      fixTransactionNo: 'FIX-2024-002',
      oxygenType: 'PI 1.4 - Loan',
      quantity: 4,
      status: 'Approved',
      requestedBy: 'Nurse Sarah Lim',
      supplier: 'Air Products'
    },
    {
      id: 'REQ-003',
      requestDate: '2024-12-13',
      deliveryDate: '2024-12-16',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 1,
      status: 'Delivered',
      requestedBy: 'MA Syahirunnisa',
      supplier: 'BOC Malaysia'
    },
    {
      id: 'REQ-003',
      requestDate: '2024-12-13',
      deliveryDate: '2024-12-16',
      fixTransactionNo: 'FIX-2024-003',
      oxygenType: 'PI 1.4 - Loan',
      quantity: 6,
      status: 'Delivered',
      requestedBy: 'MA Syahirunnisa',
      supplier: 'BOC Malaysia'
    },
    {
      id: 'REQ-004',
      requestDate: '2024-12-12',
      deliveryDate: '2024-12-15',
      fixTransactionNo: 'FIX-2024-004',
      oxygenType: 'BN 8.00 - Loan',
      quantity: 2,
      comment: 'Requesting for shorter height for ambulance use',
      status: 'Pending',
      requestedBy: 'Dr. Fatimah Zahra',
      supplier: 'Linde Malaysia'
    },
    {
      id: 'REQ-004',
      requestDate: '2024-12-12',
      deliveryDate: '2024-12-15',
      fixTransactionNo: 'FIX-2024-004',
      oxygenType: 'PI 1.4 - Loan',
      quantity: 8,
      comment: 'Emergency delivery needed for ICU expansion',
      status: 'Pending',
      requestedBy: 'Dr. Fatimah Zahra',
      supplier: 'Linde Malaysia'
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
    setOxygenItems([...oxygenItems, { oxygenType: '', quantity: '', comment: '' }]);
  };

  const removeOxygenItem = (index: number) => {
    if (oxygenItems.length > 1) {
      setOxygenItems(oxygenItems.filter((_, i) => i !== index));
    }
  };

  const toggleRequestDetails = (requestKey: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestKey)) {
      newExpanded.delete(requestKey);
    } else {
      newExpanded.add(requestKey);
    }
    setExpandedRequests(newExpanded);
  };

  const emailRequestRecord = (group: any) => {
    if (!isClient) return;
    
    // Get the specific request group data
    const requestData = requests.filter(r => 
      r.requestDate === group.requestDate && r.fixTransactionNo === group.fixTransactionNo
    );

    // Create email content
    const subject = `Oxygen Request - ${group.fixTransactionNo}`;
    
    const emailBody = `
Oxygen Request Record
FIX Transaction: ${group.fixTransactionNo}

Request Information:
- Request Date: ${group.requestDate}
- Delivery Date: ${group.deliveryDate}
- Supplier: ${group.supplier}
- Requested By: ${group.requestedBy || 'Not specified'}

Oxygen Types Requested:
${group.oxygenTypes.map((item: any) => `- ${item.type} × ${item.quantity} cylinders`).join('\n')}

Detailed Breakdown:
${group.oxygenTypes.map((item: any) => {
  const requestItem = requestData.find(r => r.oxygenType === item.type);
  let detail = `- ${item.type}: ${item.quantity} cylinders (${requestItem?.status || 'Pending'})`;
  if (requestItem?.comment) {
    detail += `\n  Comment: "${requestItem.comment}"`;
  }
  return detail;
}).join('\n\n')}

Please process this request accordingly.

Best regards,
Hospital Management System
    `.trim();

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.open(mailtoLink);
  };

  const generateFixTransactionNo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FIX-${year}${month}${day}-${random}`;
  };

  const getOxygenTypeColor = (type: string) => {
    if (type.includes('BN')) return 'bg-blue-100 text-blue-800';
    if (type.includes('PI')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Delivered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Group requests by date and FIX transaction number
  const groupedRequests = requests.reduce((acc, request) => {
    const key = `${request.requestDate}-${request.fixTransactionNo}`;
    if (!acc[key]) {
      acc[key] = {
        requestDate: request.requestDate,
        deliveryDate: request.deliveryDate,
        fixTransactionNo: request.fixTransactionNo,
        supplier: request.supplier,
        requestedBy: request.requestedBy,
        oxygenTypes: []
      };
    }
    acc[key].oxygenTypes.push({
      type: request.oxygenType,
      quantity: request.quantity,
      status: request.status
    });
    return acc;
  }, {} as Record<string, any>);

  const requestGroups = Object.entries(groupedRequests).map(([key, group]) => ({
    key,
    ...group,
    totalCylinders: group.oxygenTypes.reduce((sum: number, item: any) => sum + item.quantity, 0)
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fixTransactionNo = generateFixTransactionNo();
    
    // Create separate request records for each oxygen type
    const newRequests = oxygenItems.map((item, index) => ({
      id: `REQ-${String(requests.length + index + 1).padStart(3, '0')}`,
      requestDate: formData.requestDate,
      deliveryDate: formData.deliveryDate,
      fixTransactionNo: fixTransactionNo,
      oxygenType: item.oxygenType,
      quantity: parseInt(item.quantity),
      comment: item.comment,
      status: 'Pending',
      requestedBy: 'Current User',
      supplier: formData.supplier
    }));
    
    setRequests(prev => [...newRequests, ...prev]);
    setFormData({
      requestDate: '',
      deliveryDate: '',
      supplier: ''
    });
    setOxygenItems([{ oxygenType: '', quantity: '', comment: '' }]);
  };

  // Always render the same content to avoid hydration mismatch
  // The isClient check is only used for client-side specific functionality

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Oxygen Request</h1>
              <p className="text-slate-600 mt-1">Request oxygen cylinders from suppliers</p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-2xl font-bold text-slate-900">New Request</h2>
              <p className="text-slate-600 mt-1">Request oxygen cylinders from suppliers</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Request Date</label>
                    <input
                      type="date"
                      name="requestDate"
                      value={formData.requestDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Delivery Date</label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Supplier</label>
                    <select 
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                        >
                          <option value="">Select oxygen type</option>
                          <option value="BN 8.00 - Loan">BN 8.00 - Loan</option>
                          <option value="PI 1.4 - Loan">PI 1.4 - Loan</option>
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">Comment/Request</label>
                        <input
                          type="text"
                          value={item.comment}
                          onChange={(e) => handleOxygenItemChange(index, 'comment', e.target.value)}
                          placeholder="e.g., requesting for shorter height for ambulance use"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                        />
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
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Requests Log */}
        <div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/20 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-900">Request Log</h2>
              <p className="text-slate-600 mt-1">Recent oxygen cylinder requests to suppliers</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {requestGroups.map((group) => (
                  <div key={group.key} className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-slate-600 text-sm font-medium">{group.requestDate}</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-slate-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <span className="text-slate-900 font-semibold">Request</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow-md">{group.fixTransactionNo}</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium flex items-center shadow-md">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Request
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Oxygen Requested: {group.totalCylinders} cylinders</h3>
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
                              <span className="text-slate-600 font-medium">Delivery Date:</span>
                              <span className="ml-2 text-slate-900">{group.deliveryDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 font-medium">Supplier:</span>
                              <span className="ml-2 text-slate-900">{group.supplier}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 font-medium">Requested By:</span>
                              <span className="ml-2 text-slate-900">{group.requestedBy || 'Not specified'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleRequestDetails(group.key)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 flex items-center ml-4"
                          >
                            {expandedRequests.has(group.key) ? 'Hide details' : 'View details'}
                            <svg
                              className={`w-4 h-4 ml-1 transition-transform duration-200 ${expandedRequests.has(group.key) ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {expandedRequests.has(group.key) && (
                          <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-slate-700">Oxygen Details</h4>
                              <button
                                onClick={() => emailRequestRecord(group)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Email</span>
                              </button>
                            </div>
                            <div className="space-y-3">
                              {group.oxygenTypes.map((item: any, index: number) => {
                                const requestItem = requests.find(r => 
                                  r.requestDate === group.requestDate && 
                                  r.fixTransactionNo === group.fixTransactionNo && 
                                  r.oxygenType === item.type
                                );
                                return (
                                  <div key={index} className="py-3 px-4 bg-white/80 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getOxygenTypeColor(item.type)}`}>
                                        {item.type}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-semibold text-slate-900">{item.quantity} cylinders</span>
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                          {item.status}
                                        </span>
                                      </div>
                                    </div>
                                    {requestItem?.comment && (
                                      <div className="mt-2 pt-2 border-t border-slate-200">
                                        <span className="text-xs font-medium text-slate-600">Comment:</span>
                                        <p className="text-sm text-slate-700 mt-1 italic">"{requestItem.comment}"</p>
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
