'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  FileText,
  Save,
  Printer,
  User,
  Calendar,
  Bed,
  Stethoscope,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Pill,
} from 'lucide-react';

export default function DischargeNotesPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  
  // Mock logged-in user (in production, this would come from auth context/session)
  const currentUser = {
    id: 'MO12345',
    name: 'Dr. Siti Aminah',
    designation: 'Medical Officer',
    fullName: 'Dr. Siti Aminah (MO12345)'
  };
  
  // Mock patient data (in production, this would come from API/database)
  const patient = {
    name: 'Ahmad bin Abdullah',
    ic: '800123-10-5432',
    age: 45,
    gender: 'Male',
    admissionDate: '2025-10-08 14:30',
    ward: 'General Ward A',
    bed: 'A-12',
    diagnosis: 'Community Acquired Pneumonia',
    doctor: 'Dr. Siti Aminah'
  };

  // Mock active medications (in production, this would come from patient's current medication orders)
  const activeMedications = [
    {
      id: 1,
      name: 'Cap. Amoxicillin 250mg',
      dosage: '500mg',
      frequency: 'TDS',
      duration: '7 days',
      instruction: 'After meals'
    },
    {
      id: 2,
      name: 'Tab. Paracetamol 500mg',
      dosage: '1g',
      frequency: 'PRN',
      duration: 'As needed',
      instruction: 'For fever/pain'
    },
    {
      id: 3,
      name: 'Salbutamol Inhaler 100mcg',
      dosage: '2 puffs',
      frequency: 'PRN',
      duration: 'As needed',
      instruction: 'For shortness of breath'
    }
  ];

  // Mock medication database (in production, this would come from drug formulary API)
  const medicationDatabase = [
    { name: 'Cap. Amoxicillin 250mg', defaultDosage: '500mg' },
    { name: 'Cap. Amoxicillin 500mg', defaultDosage: '500mg' },
    { name: 'Tab. Paracetamol 500mg', defaultDosage: '1g' },
    { name: 'Tab. Paracetamol 1g', defaultDosage: '1g' },
    { name: 'Tab. Metformin 500mg', defaultDosage: '500mg' },
    { name: 'Tab. Metformin 850mg', defaultDosage: '850mg' },
    { name: 'Cap. Omeprazole 20mg', defaultDosage: '20mg' },
    { name: 'Cap. Omeprazole 40mg', defaultDosage: '40mg' },
    { name: 'Syrup Paracetamol 120mg/5ml', defaultDosage: '5ml' },
    { name: 'Salbutamol Inhaler 100mcg', defaultDosage: '2 puffs' },
    { name: 'Inj. Ceftriaxone 1g', defaultDosage: '1g' },
    { name: 'Tab. Aspirin 100mg', defaultDosage: '100mg' },
    { name: 'Tab. Atorvastatin 20mg', defaultDosage: '20mg' },
  ];

  const frequencyOptions = [
    'OD (Once Daily)',
    'BD (Twice Daily)',
    'TDS (Three Times Daily)',
    'QID (Four Times Daily)',
    'PRN (When Needed)',
    'OM (Every Morning)',
    'ON (Every Night)',
    'Q4H (Every 4 Hours)',
    'Q6H (Every 6 Hours)',
    'Q8H (Every 8 Hours)',
    'Q12H (Every 12 Hours)',
    'STAT (Immediately)',
  ];

  const [dischargeMedications, setDischargeMedications] = useState(activeMedications);
  const [showMedicationEditor, setShowMedicationEditor] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    durationDate: '',
    instruction: ''
  });
  
  const [medicationSearch, setMedicationSearch] = useState('');
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const medicationDropdownRef = useRef<HTMLDivElement>(null);

  const filteredMedications = medicationDatabase.filter(med =>
    med.name.toLowerCase().includes(medicationSearch.toLowerCase())
  );

  const [formData, setFormData] = useState({
    dischargeDateTime: new Date().toISOString().slice(0, 16),
    dischargeType: 'Home',
    primaryDiagnosis: patient.diagnosis,
    secondaryDiagnosis: '',
    hospitalCourse: 'Patient admitted with community-acquired pneumonia. Treated with IV Ceftriaxone for 5 days with good response. Vital signs stabilized. Patient able to ambulate independently. Chest clear on auscultation.',
    conditionOnDischarge: 'Improved',
    followUpInstructions: '- Follow up at Medical OPD in 1 week\n- Return immediately if fever > 38°C, worsening SOB, or chest pain\n- Continue breathing exercises\n- Adequate rest and hydration',
    nextTcaDate: '',
    nextTcaFacility: '',
    dischargingDoctor: currentUser.fullName,
    dischargingDoctorId: currentUser.id,
  });

  const [facilitySearch, setFacilitySearch] = useState('');
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFacilityDropdown(false);
      }
      if (medicationDropdownRef.current && !medicationDropdownRef.current.contains(event.target as Node)) {
        setShowMedicationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock KKM facilities list
  const kkmFacilities = [
    'Hospital Kuala Lumpur',
    'Hospital Sungai Buloh',
    'Hospital Selayang',
    'Hospital Ampang',
    'Hospital Tengku Ampuan Rahimah Klang',
    'Hospital Sultanah Aminah Johor Bahru',
    'Hospital Pulau Pinang',
    'Hospital Umum Sarawak',
    'Hospital Queen Elizabeth Kota Kinabalu',
    'Klinik Kesihatan Cheras',
    'Klinik Kesihatan Setapak',
    'Klinik Kesihatan Kelana Jaya',
    'Klinik Kesihatan Bandar Baru Bangi',
    'Klinik Kesihatan Shah Alam',
  ];

  const filteredFacilities = kkmFacilities.filter(facility =>
    facility.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In production, this would save to database/API
    console.log('Saving discharge notes:', formData, 'Medications:', dischargeMedications);
    alert('Discharge notes saved successfully!');
  };

  const handleComplete = () => {
    // In production, this would complete discharge and update patient status
    console.log('Completing discharge:', formData, 'Medications:', dischargeMedications);
    alert('Discharge completed successfully!');
    router.push(`/general-ward/patient/${patientId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectMedication = (med: any) => {
    setMedicationSearch(med.name);
    setNewMedication({
      ...newMedication,
      name: med.name,
      dosage: med.defaultDosage
    });
    setShowMedicationDropdown(false);
  };

  const calculateDuration = () => {
    if (newMedication.durationDate) {
      const today = new Date();
      const endDate = new Date(newMedication.durationDate);
      const diffTime = Math.abs(endDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    }
    return newMedication.duration;
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      const duration = calculateDuration();
      setDischargeMedications([
        ...dischargeMedications,
        { ...newMedication, duration, id: Date.now() }
      ]);
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '', durationDate: '', instruction: '' });
      setMedicationSearch('');
      setShowMedicationEditor(false);
    }
  };

  const handleEditMedication = (med: any) => {
    setEditingMedication(med);
    setNewMedication({
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      durationDate: med.durationDate || '',
      instruction: med.instruction || ''
    });
    setMedicationSearch(med.name || '');
    setShowMedicationEditor(true);
  };

  const handleUpdateMedication = () => {
    if (editingMedication) {
      const duration = calculateDuration();
      setDischargeMedications(
        dischargeMedications.map(med =>
          med.id === editingMedication.id ? { ...newMedication, duration, id: med.id } : med
        )
      );
      setEditingMedication(null);
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '', durationDate: '', instruction: '' });
      setMedicationSearch('');
      setShowMedicationEditor(false);
    }
  };

  const handleDeleteMedication = (id: number) => {
    setDischargeMedications(dischargeMedications.filter(med => med.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm print:shadow-none">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Discharge Summary</h1>
                <p className="text-sm text-slate-600">Complete and finalize patient discharge documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                onClick={handleComplete}
                className="gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg"
              >
                <CheckCircle className="h-4 w-4" />
                Complete Discharge
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Patient Information Card */}
          <Card className="shadow-lg border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-blue-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Patient Information</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">Patient Name</div>
                  <div className="font-bold text-blue-900">{patient.name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">IC Number</div>
                  <div className="font-bold text-blue-900">{patient.ic}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">Age / Gender</div>
                  <div className="font-bold text-blue-900">{patient.age} / {patient.gender}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">Admission Date</div>
                  <div className="font-bold text-blue-900">{patient.admissionDate}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">Ward</div>
                  <div className="font-bold text-blue-900">{patient.ward}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700 mb-1">Bed</div>
                  <div className="font-bold text-blue-900">{patient.bed}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-blue-700 mb-1">Attending Doctor</div>
                  <div className="font-bold text-blue-900">{patient.doctor}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discharge Details */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Discharge Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discharge Date & Time *
                  </label>
                  <Input 
                    type="datetime-local" 
                    value={formData.dischargeDateTime}
                    onChange={(e) => handleInputChange('dischargeDateTime', e.target.value)}
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discharge Type *
                  </label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.dischargeType}
                    onChange={(e) => handleInputChange('dischargeType', e.target.value)}
                  >
                    <option>Home</option>
                    <option>Transfer to Another Facility</option>
                    <option>Against Medical Advice (AMA)</option>
                    <option>Death</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Summary */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-purple-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Clinical Summary</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Primary Diagnosis *
                  </label>
                  <Input 
                    placeholder="Enter primary diagnosis" 
                    value={formData.primaryDiagnosis}
                    onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Secondary Diagnosis
                  </label>
                  <Textarea 
                    placeholder="Enter secondary diagnosis if any..."
                    value={formData.secondaryDiagnosis}
                    onChange={(e) => handleInputChange('secondaryDiagnosis', e.target.value)}
                    className="min-h-24 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Hospital Course Summary *
                  </label>
                  <Textarea 
                    placeholder="Brief summary of hospital stay, treatments, and progress..."
                    value={formData.hospitalCourse}
                    onChange={(e) => handleInputChange('hospitalCourse', e.target.value)}
                    className="min-h-40 text-base"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Include admission reason, key interventions, response to treatment, and complications if any
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Condition on Discharge *
                  </label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.conditionOnDischarge}
                    onChange={(e) => handleInputChange('conditionOnDischarge', e.target.value)}
                  >
                    <option>Improved</option>
                    <option>Stable</option>
                    <option>Unchanged</option>
                    <option>Deteriorated</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discharge Plan */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Discharge Plan</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Discharge Medications *
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingMedication(null);
                        setNewMedication({ name: '', dosage: '', frequency: '', duration: '', durationDate: '', instruction: '' });
                        setMedicationSearch('');
                        setShowMedicationEditor(true);
                      }}
                      className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Medication
                    </Button>
                  </div>

                  {/* Medications List */}
                  <div className="border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700 text-xs w-8">#</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700 text-xs">Medication</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700 text-xs w-24">Dosage</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700 text-xs w-24">Frequency</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700 text-xs w-24">Duration</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-700 text-xs">Instructions</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-700 text-xs w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dischargeMedications.map((med, index) => (
                          <tr key={med.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-600 text-xs">{index + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{med.name}</td>
                            <td className="px-3 py-2 text-slate-700">{med.dosage}</td>
                            <td className="px-3 py-2 text-slate-700">{med.frequency}</td>
                            <td className="px-3 py-2 text-slate-700">{med.duration || '-'}</td>
                            <td className="px-3 py-2 text-slate-600 text-xs italic">{med.instruction || '-'}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditMedication(med)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMedication(med.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Auto-filled
                      </span>
                      <span>from active medications</span>
                    </span>
                  </div>

                  {/* Medication Editor Modal */}
                  {showMedicationEditor && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between rounded-t-lg">
                          <h3 className="text-base font-semibold text-white">
                            {editingMedication ? 'Edit Medication' : 'Add New Medication'}
                          </h3>
                          <button
                            onClick={() => {
                              setShowMedicationEditor(false);
                              setEditingMedication(null);
                              setNewMedication({ name: '', dosage: '', frequency: '', duration: '', durationDate: '', instruction: '' });
                              setMedicationSearch('');
                            }}
                            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Medication Name *
                            </label>
                            <div className="relative" ref={medicationDropdownRef}>
                              <Input
                                value={medicationSearch}
                                onChange={(e) => {
                                  setMedicationSearch(e.target.value);
                                  setNewMedication({ ...newMedication, name: e.target.value });
                                  setShowMedicationDropdown(true);
                                }}
                                onFocus={() => setShowMedicationDropdown(true)}
                                placeholder="Search medication..."
                                className="text-sm h-9"
                              />
                              {showMedicationDropdown && medicationSearch && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                  {filteredMedications.length > 0 ? (
                                    filteredMedications.map((med, index) => (
                                      <div
                                        key={index}
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                        onClick={() => handleSelectMedication(med)}
                                      >
                                        {med.name}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-slate-500">
                                      No medications found
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Type to search from formulary database
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Dosage *
                              </label>
                              <Input
                                value={newMedication.dosage}
                                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                                placeholder="e.g., 500mg"
                                className="text-sm h-9 bg-blue-50"
                              />
                              <p className="text-xs text-slate-500 mt-0.5">Auto-filled, editable</p>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Frequency *
                              </label>
                              <select
                                value={newMedication.frequency}
                                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                                className="w-full px-3 h-9 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select frequency</option>
                                {frequencyOptions.map((freq, idx) => (
                                  <option key={idx} value={freq.split(' ')[0]}>
                                    {freq}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Duration Date
                              </label>
                              <Input
                                type="date"
                                value={newMedication.durationDate}
                                onChange={(e) => setNewMedication({ ...newMedication, durationDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="text-sm h-9"
                              />
                              <p className="text-xs text-slate-500 mt-0.5">Pick end date</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Special Instructions
                            </label>
                            <Textarea
                              value={newMedication.instruction}
                              onChange={(e) => setNewMedication({ ...newMedication, instruction: e.target.value })}
                              placeholder="e.g., Take after meals, For fever/pain"
                              className="text-sm"
                              rows={2}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-50 px-4 py-3 flex items-center justify-end gap-2 border-t border-slate-200 rounded-b-lg">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowMedicationEditor(false);
                              setEditingMedication(null);
                              setNewMedication({ name: '', dosage: '', frequency: '', duration: '', durationDate: '', instruction: '' });
                              setMedicationSearch('');
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={editingMedication ? handleUpdateMedication : handleAddMedication}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                          >
                            {editingMedication ? 'Update' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Follow-up Instructions *
                  </label>
                  <Textarea 
                    placeholder="Follow-up appointments, precautions, warning signs to watch for..."
                    value={formData.followUpInstructions}
                    onChange={(e) => handleInputChange('followUpInstructions', e.target.value)}
                    className="min-h-32 text-base"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Include follow-up schedule, warning signs for immediate return, and any special precautions
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4 text-lg">
                    Next TCA (To Come Again)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        When (Date) *
                      </label>
                      <Input 
                        type="date"
                        value={formData.nextTcaDate}
                        onChange={(e) => handleInputChange('nextTcaDate', e.target.value)}
                        className="text-base"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Select follow-up appointment date
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Where (KKM Hospital/Clinic Facility) *
                      </label>
                      <div className="relative" ref={dropdownRef}>
                        <Input 
                          type="text"
                          value={facilitySearch}
                          onChange={(e) => {
                            setFacilitySearch(e.target.value);
                            setShowFacilityDropdown(true);
                          }}
                          onFocus={() => setShowFacilityDropdown(true)}
                          placeholder="Search for facility..."
                          className="text-base"
                        />
                        {showFacilityDropdown && facilitySearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredFacilities.length > 0 ? (
                              filteredFacilities.map((facility, index) => (
                                <div
                                  key={index}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                  onClick={() => {
                                    setFacilitySearch(facility);
                                    handleInputChange('nextTcaFacility', facility);
                                    setShowFacilityDropdown(false);
                                  }}
                                >
                                  {facility}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-slate-500">
                                No facilities found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Type to search for KKM facility
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discharging Physician */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discharging Doctor *
                  </label>
                  <div className="relative">
                    <Input 
                      value={formData.dischargingDoctor}
                      disabled
                      className="text-base bg-slate-50 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold">
                          Auto-filled
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Automatically populated from logged-in Medical Officer
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> Please ensure all required fields (*) are completed before finalizing discharge. 
                    This discharge summary will be part of the patient's permanent medical record.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Bottom */}
          <div className="flex items-center justify-end gap-3 pb-8 print:hidden">
            <Link href={`/general-ward/patient/${patientId}`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              onClick={handleComplete}
              className="gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg px-8"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Discharge
            </Button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

