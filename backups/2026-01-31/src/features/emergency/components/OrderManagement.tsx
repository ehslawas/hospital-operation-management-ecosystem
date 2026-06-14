'use client';

import React, { useState } from 'react';
import type { EmergencyPatient, LabOrder, RadiologyOrder, PharmacyOrder } from '../types/Patient';

interface OrderManagementProps {
  patient: EmergencyPatient;
  onClose: () => void;
  onSave: (updates: Partial<EmergencyPatient>) => void;
}

export function OrderManagement({ patient, onClose, onSave }: OrderManagementProps) {
  const [activeTab, setActiveTab] = useState<'lab' | 'radiology' | 'pharmacy' | 'templates'>('templates');
  
  // New order states
  const [labTest, setLabTest] = useState('');
  const [labPriority, setLabPriority] = useState<'routine' | 'urgent' | 'stat'>('urgent');
  const [radExamType, setRadExamType] = useState('');
  const [radBodyPart, setRadBodyPart] = useState('');
  const [radIndication, setRadIndication] = useState('');
  const [radPriority, setRadPriority] = useState<'routine' | 'urgent' | 'stat'>('urgent');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('PO');
  const [frequency, setFrequency] = useState('');
  const [orderingDoctor, setOrderingDoctor] = useState(patient.assignedDoctor || '');
  
  const [labOrders, setLabOrders] = useState<LabOrder[]>(patient.labOrders || []);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>(patient.radiologyOrders || []);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>(patient.pharmacyOrders || []);
  
  // Order templates
  const labTemplates = {
    'Cardiac Panel': ['Troponin I', 'CK-MB', 'ECG'],
    'Sepsis Workup': ['Full Blood Count', 'CRP', 'Procalcitonin', 'Blood Culture', 'Urine Culture', 'Lactate'],
    'Trauma Panel': ['Full Blood Count', 'Coagulation Profile', 'GXM (Group & Crossmatch)', 'Renal Profile'],
    'DKA Workup': ['Blood Glucose', 'VBG/ABG', 'Renal Profile', 'Ketones', 'Urine Analysis'],
    'Stroke Workup': ['FBC', 'Coagulation Profile', 'Renal Profile', 'Lipid Profile', 'HbA1c'],
    'Basic Labs': ['Full Blood Count', 'Renal Profile', 'Liver Function Test'],
  };
  
  const radiologyTemplates = {
    'Trauma Series': [
      { type: 'CT Brain', part: 'Head', indication: 'Head trauma' },
      { type: 'CT C-Spine', part: 'Cervical Spine', indication: 'C-spine clearance' },
      { type: 'Chest X-Ray', part: 'Chest', indication: 'Trauma survey' },
      { type: 'Pelvic X-Ray', part: 'Pelvis', indication: 'Pelvic trauma' },
    ],
    'Chest Pain': [
      { type: 'Chest X-Ray', part: 'Chest', indication: 'Rule out cardiac failure / pneumonia' },
      { type: 'ECG', part: 'Heart', indication: 'Chest pain workup' },
    ],
    'Abdominal Pain': [
      { type: 'Ultrasound Abdomen', part: 'Abdomen', indication: 'Abdominal pain' },
      { type: 'CT Abdomen & Pelvis', part: 'Abdomen & Pelvis', indication: 'Acute abdomen' },
    ],
  };
  
  const pharmacyTemplates = {
    'Analgesia - Mild': [
      { med: 'Paracetamol', dose: '1g', route: 'PO', freq: 'TDS' },
    ],
    'Analgesia - Moderate': [
      { med: 'Tramadol', dose: '50mg', route: 'IV', freq: 'QID PRN' },
      { med: 'Paracetamol', dose: '1g', route: 'IV', freq: 'TDS' },
    ],
    'Analgesia - Severe': [
      { med: 'Morphine', dose: '5-10mg', route: 'IV', freq: 'PRN' },
      { med: 'Paracetamol', dose: '1g', route: 'IV', freq: 'TDS' },
    ],
    'Nausea & Vomiting': [
      { med: 'Ondansetron', dose: '4mg', route: 'IV', freq: 'TDS PRN' },
      { med: 'Metoclopramide', dose: '10mg', route: 'IV', freq: 'TDS PRN' },
    ],
    'Asthma/COPD Exacerbation': [
      { med: 'Salbutamol Nebulizer', dose: '5mg', route: 'Inhalation', freq: 'Q4H' },
      { med: 'Ipratropium Nebulizer', dose: '500mcg', route: 'Inhalation', freq: 'Q6H' },
      { med: 'Hydrocortisone', dose: '200mg', route: 'IV', freq: 'TDS' },
    ],
  };
  
  const addLabOrder = () => {
    if (!labTest || !orderingDoctor) return;
    
    const order: LabOrder = {
      id: `LAB${Date.now()}`,
      patientId: patient.id,
      testName: labTest,
      priority: labPriority,
      orderedBy: orderingDoctor,
      orderedAt: new Date(),
      status: 'pending',
    };
    
    setLabOrders([...labOrders, order]);
    setLabTest('');
  };
  
  const addRadiologyOrder = () => {
    if (!radExamType || !radBodyPart || !orderingDoctor) return;
    
    const order: RadiologyOrder = {
      id: `RAD${Date.now()}`,
      patientId: patient.id,
      examType: radExamType,
      bodyPart: radBodyPart,
      priority: radPriority,
      clinicalIndication: radIndication,
      orderedBy: orderingDoctor,
      orderedAt: new Date(),
      status: 'pending',
    };
    
    setRadiologyOrders([...radiologyOrders, order]);
    setRadExamType('');
    setRadBodyPart('');
    setRadIndication('');
  };
  
  const addPharmacyOrder = () => {
    if (!medication || !dosage || !frequency || !orderingDoctor) return;
    
    const order: PharmacyOrder = {
      id: `PHARM${Date.now()}`,
      patientId: patient.id,
      medication,
      dosage,
      route,
      frequency,
      orderedBy: orderingDoctor,
      orderedAt: new Date(),
      status: 'pending',
    };
    
    setPharmacyOrders([...pharmacyOrders, order]);
    setMedication('');
    setDosage('');
    setFrequency('');
  };
  
  const applyLabTemplate = (template: string) => {
    const tests = labTemplates[template as keyof typeof labTemplates];
    const newOrders = tests.map((test, idx) => ({
      id: `LAB${Date.now()}-${idx}`,
      patientId: patient.id,
      testName: test,
      priority: 'urgent' as const,
      orderedBy: orderingDoctor,
      orderedAt: new Date(),
      status: 'pending' as const,
    }));
    setLabOrders([...labOrders, ...newOrders]);
    setActiveTab('lab');
  };
  
  const applyRadTemplate = (template: string) => {
    const studies = radiologyTemplates[template as keyof typeof radiologyTemplates];
    const newOrders = studies.map((study, idx) => ({
      id: `RAD${Date.now()}-${idx}`,
      patientId: patient.id,
      examType: study.type,
      bodyPart: study.part,
      priority: 'urgent' as const,
      clinicalIndication: study.indication,
      orderedBy: orderingDoctor,
      orderedAt: new Date(),
      status: 'pending' as const,
    }));
    setRadiologyOrders([...radiologyOrders, ...newOrders]);
    setActiveTab('radiology');
  };
  
  const applyPharmTemplate = (template: string) => {
    const meds = pharmacyTemplates[template as keyof typeof pharmacyTemplates];
    const newOrders = meds.map((med, idx) => ({
      id: `PHARM${Date.now()}-${idx}`,
      patientId: patient.id,
      medication: med.med,
      dosage: med.dose,
      route: med.route,
      frequency: med.freq,
      orderedBy: orderingDoctor,
      orderedAt: new Date(),
      status: 'pending' as const,
    }));
    setPharmacyOrders([...pharmacyOrders, ...newOrders]);
    setActiveTab('pharmacy');
  };
  
  const handleSave = () => {
    onSave({
      labOrders,
      radiologyOrders,
      pharmacyOrders,
      status: patient.status === 'waiting' || patient.status === 'triaged' ? 'in-treatment' : patient.status,
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Order Management</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{patient.name}</span>
                <span>•</span>
                <span>{patient.registrationNumber}</span>
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
              { id: 'templates', label: 'Order Templates', icon: '📋', count: 0 },
              { id: 'lab', label: 'Laboratory', icon: '🧪', count: labOrders.length },
              { id: 'radiology', label: 'Radiology', icon: '📸', count: radiologyOrders.length },
              { id: 'pharmacy', label: 'Pharmacy', icon: '💊', count: pharmacyOrders.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-green-600 text-white rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ordering Doctor</label>
                <input
                  type="text"
                  value={orderingDoctor}
                  onChange={(e) => setOrderingDoctor(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Doctor's name"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Laboratory Templates</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {Object.keys(labTemplates).map(template => (
                    <button
                      key={template}
                      onClick={() => applyLabTemplate(template)}
                      disabled={!orderingDoctor}
                      className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-blue-900">{template}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {labTemplates[template as keyof typeof labTemplates].length} tests
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Radiology Templates</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {Object.keys(radiologyTemplates).map(template => (
                    <button
                      key={template}
                      onClick={() => applyRadTemplate(template)}
                      disabled={!orderingDoctor}
                      className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-purple-900">{template}</div>
                      <div className="text-xs text-purple-600 mt-1">
                        {radiologyTemplates[template as keyof typeof radiologyTemplates].length} studies
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Pharmacy Templates</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {Object.keys(pharmacyTemplates).map(template => (
                    <button
                      key={template}
                      onClick={() => applyPharmTemplate(template)}
                      disabled={!orderingDoctor}
                      className="p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-green-900">{template}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {pharmacyTemplates[template as keyof typeof pharmacyTemplates].length} medications
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'lab' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">Add Laboratory Test</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={labTest}
                      onChange={(e) => setLabTest(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Test name (e.g., Full Blood Count)"
                    />
                  </div>
                  <select
                    value={labPriority}
                    onChange={(e) => setLabPriority(e.target.value as any)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="stat">STAT</option>
                    <option value="urgent">Urgent</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
                <button
                  onClick={addLabOrder}
                  disabled={!labTest || !orderingDoctor}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Add Test
                </button>
              </div>
              
              <div className="space-y-2">
                {labOrders.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No laboratory orders</p>
                ) : (
                  labOrders.map(order => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{order.testName}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          Priority: <span className="font-semibold">{order.priority.toUpperCase()}</span> | 
                          Ordered by: {order.orderedBy}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'radiology' && (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3">Add Radiology Study</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={radExamType}
                    onChange={(e) => setRadExamType(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Exam type (e.g., CT Brain)"
                  />
                  <input
                    type="text"
                    value={radBodyPart}
                    onChange={(e) => setRadBodyPart(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Body part"
                  />
                  <input
                    type="text"
                    value={radIndication}
                    onChange={(e) => setRadIndication(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Clinical indication"
                  />
                  <select
                    value={radPriority}
                    onChange={(e) => setRadPriority(e.target.value as any)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="stat">STAT</option>
                    <option value="urgent">Urgent</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
                <button
                  onClick={addRadiologyOrder}
                  disabled={!radExamType || !radBodyPart || !orderingDoctor}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Add Study
                </button>
              </div>
              
              <div className="space-y-2">
                {radiologyOrders.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No radiology orders</p>
                ) : (
                  radiologyOrders.map(order => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{order.examType} - {order.bodyPart}</div>
                        <div className="text-sm text-slate-600 mt-1">{order.clinicalIndication}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          Priority: <span className="font-semibold">{order.priority.toUpperCase()}</span> | 
                          Ordered by: {order.orderedBy}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'pharmacy' && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-bold text-green-900 mb-3">Add Medication</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={medication}
                      onChange={(e) => setMedication(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Medication name"
                    />
                  </div>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Dosage"
                  />
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="PO">PO (Oral)</option>
                    <option value="IV">IV (Intravenous)</option>
                    <option value="IM">IM (Intramuscular)</option>
                    <option value="SC">SC (Subcutaneous)</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                  </select>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Frequency (e.g., TDS, BD, PRN)"
                  />
                </div>
                <button
                  onClick={addPharmacyOrder}
                  disabled={!medication || !dosage || !frequency || !orderingDoctor}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Add Medication
                </button>
              </div>
              
              <div className="space-y-2">
                {pharmacyOrders.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No medication orders</p>
                ) : (
                  pharmacyOrders.map(order => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{order.medication}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {order.dosage} {order.route} {order.frequency}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          Ordered by: {order.orderedBy}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'administered' ? 'bg-green-100 text-green-700' :
                        order.status === 'dispensed' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Total Orders: Lab ({labOrders.length}) | Radiology ({radiologyOrders.length}) | Pharmacy ({pharmacyOrders.length})
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Save All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

