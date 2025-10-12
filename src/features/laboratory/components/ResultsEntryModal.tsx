'use client';

import React, { useState } from 'react';
import type { TestOrder, TestResult, ResultParameter } from '../types/Lab';

interface ResultsEntryModalProps {
  order: TestOrder;
  onClose: () => void;
  onSave: (orderId: string, result: TestResult) => void;
}

export function ResultsEntryModal({ order, onClose, onSave }: ResultsEntryModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'results' | 'history'>('details');
  const [parameters, setParameters] = useState<ResultParameter[]>(
    order.result?.parameters || []
  );
  const [interpretation, setInterpretation] = useState(order.result?.interpretation || '');
  const [comments, setComments] = useState(order.result?.comments || '');
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleAddParameter = () => {
    setParameters([...parameters, {
      name: '',
      value: '',
      unit: '',
      referenceRange: '',
      flag: 'normal'
    }]);
  };
  
  const handleParameterChange = (index: number, field: keyof ResultParameter, value: any) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setParameters(newParams);
  };
  
  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    const result: TestResult = {
      testId: order.id,
      parameters,
      interpretation: interpretation || undefined,
      comments: comments || undefined,
      status: 'preliminary',
      enteredBy: 'Current User',
      enteredAt: new Date(),
    };
    onSave(order.id, result);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{order.testName}</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{order.patientName} • {order.patientAge}y • {order.patientGender}</span>
                <span>IC: {order.patientIC}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {order.orderNumber}
                </span>
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {order.category}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  order.priority === 'stat' ? 'bg-red-500' :
                  order.priority === 'urgent' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}>
                  {order.priority.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex gap-1 px-6">
            {[
              { id: 'details', label: 'Order Details' },
              { id: 'results', label: 'Results Entry' },
              { id: 'history', label: 'History' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Patient Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span className="font-semibold text-slate-900">{order.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Age/Gender:</span>
                      <span className="font-semibold text-slate-900">{order.patientAge}y / {order.patientGender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">IC Number:</span>
                      <span className="font-semibold text-slate-900">{order.patientIC}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Patient ID:</span>
                      <span className="font-semibold text-slate-900">{order.patientId}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Order Number:</span>
                      <span className="font-semibold text-slate-900">{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Department:</span>
                      <span className="font-semibold text-slate-900">{order.orderingDepartment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ordering Doctor:</span>
                      <span className="font-semibold text-slate-900">{order.orderingDoctor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ordered At:</span>
                      <span className="font-semibold text-slate-900">{formatDateTime(order.orderedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {order.clinicalNotes && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Clinical Notes</h3>
                  <p className="text-sm text-slate-700 bg-blue-50 p-4 rounded-lg border border-blue-200 italic">
                    "{order.clinicalNotes}"
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Sample Information</h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sample Type:</span>
                      <span className="font-semibold text-slate-900">{order.sampleType}</span>
                    </div>
                    {order.sampleId && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sample ID:</span>
                        <span className="font-semibold text-slate-900">{order.sampleId}</span>
                      </div>
                    )}
                    {order.collectedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Collected At:</span>
                        <span className="font-semibold text-slate-900">{formatDateTime(order.collectedAt)}</span>
                      </div>
                    )}
                    {order.collectedBy && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Collected By:</span>
                        <span className="font-semibold text-slate-900">{order.collectedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Test Parameters</h3>
                  <button
                    onClick={handleAddParameter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                  >
                    + Add Parameter
                  </button>
                </div>
                
                {parameters.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No parameters added yet. Click "Add Parameter" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parameters.map((param, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input
                          type="text"
                          placeholder="Parameter name"
                          value={param.name}
                          onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                          className="col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Unit"
                          value={param.unit}
                          onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Reference range"
                          value={param.referenceRange}
                          onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
                          className="col-span-3 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <select
                          value={param.flag}
                          onChange={(e) => handleParameterChange(index, 'flag', e.target.value)}
                          className="col-span-1 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="low">Low</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        <button
                          onClick={() => handleRemoveParameter(index)}
                          className="col-span-1 text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Interpretation</label>
                <textarea
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter clinical interpretation..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Additional comments..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Results
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Processing Timeline</h3>
              <div className="space-y-3">
                {order.orderedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">Order Placed</div>
                      <div className="text-xs text-slate-500">{formatDateTime(order.orderedAt)}</div>
                      <div className="text-xs text-slate-600 mt-1">by {order.orderingDoctor}, {order.orderingDepartment}</div>
                    </div>
                  </div>
                )}
                {order.collectedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">Sample Collected</div>
                      <div className="text-xs text-slate-500">{formatDateTime(order.collectedAt)}</div>
                      <div className="text-xs text-slate-600 mt-1">by {order.collectedBy}</div>
                    </div>
                  </div>
                )}
                {order.receivedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">Sample Received</div>
                      <div className="text-xs text-slate-500">{formatDateTime(order.receivedAt)}</div>
                      <div className="text-xs text-slate-600 mt-1">by {order.receivedBy}</div>
                    </div>
                  </div>
                )}
                {order.analyzedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-600 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">Analysis Completed</div>
                      <div className="text-xs text-slate-500">{formatDateTime(order.analyzedAt)}</div>
                      <div className="text-xs text-slate-600 mt-1">by {order.analyzedBy}</div>
                    </div>
                  </div>
                )}
                {order.validatedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">Results Validated</div>
                      <div className="text-xs text-slate-500">{formatDateTime(order.validatedAt)}</div>
                      <div className="text-xs text-slate-600 mt-1">by {order.validatedBy}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







