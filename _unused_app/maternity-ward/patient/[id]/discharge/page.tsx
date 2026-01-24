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
} from 'lucide-react';

export default function DischargeNotesPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  
  // Mock logged-in user (in production, this would come from auth context/session)
  const currentUser = {
    id: 'MO23456',
    name: 'Dr. Noor Azlina',
    designation: 'Medical Officer',
    fullName: 'Dr. Noor Azlina (MO23456)'
  };
  
  // Mock patient data (in production, this would come from API/database)
  const patient = {
    name: 'Siti Fatimah binti Rahman',
    ic: '890515-08-6789',
    age: 36,
    gender: 'Female',
    admissionDate: '2025-10-10 06:30',
    ward: 'Maternity Ward',
    bed: 'M-08',
    diagnosis: 'Normal Vaginal Delivery',
    doctor: 'Dr. Noor Azlina'
  };

  const [formData, setFormData] = useState({
    dischargeDateTime: new Date().toISOString().slice(0, 16),
    dischargeType: 'Home',
    primaryDiagnosis: patient.diagnosis,
    secondaryDiagnosis: '',
    hospitalCourse: 'Patient admitted in active labour. Had spontaneous vaginal delivery of a healthy baby boy weighing 3.2kg. Mother and baby are doing well post-delivery. No complications noted.',
    conditionOnDischarge: 'Improved',
    dischargeMedications: '1. Tab Ferrous Sulphate 200mg OD x 1 month\n2. Tab Paracetamol 1g PRN fever/pain\n3. Continue prenatal vitamins',
    followUpInstructions: '- Follow up at Postnatal Clinic in 6 weeks\n- Watch for excessive bleeding, fever, or foul-smelling discharge\n- Exclusive breastfeeding recommended\n- Return immediately if severe abdominal pain or heavy bleeding',
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
    console.log('Saving discharge notes:', formData);
    alert('Discharge notes saved successfully!');
  };

  const handleComplete = () => {
    console.log('Completing discharge:', formData);
    alert('Discharge completed successfully!');
    router.push(`/maternity-ward/patient/${patientId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm print:shadow-none">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-3 rounded-xl shadow-lg">
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
          <Card className="shadow-lg border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-pink-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Patient Information</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-pink-50 to-purple-100 rounded-xl border border-pink-200">
                <div>
                  <div className="text-xs font-semibold text-pink-700 mb-1">Patient Name</div>
                  <div className="font-bold text-pink-900">{patient.name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-pink-700 mb-1">IC Number</div>
                  <div className="font-bold text-pink-900">{patient.ic}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-pink-700 mb-1">Age / Gender</div>
                  <div className="font-bold text-pink-900">{patient.age} / {patient.gender}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-pink-700 mb-1">Admission Date</div>
                  <div className="font-bold text-pink-900">{patient.admissionDate}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-pink-700 mb-1">Ward</div>
                  <div className="font-bold text-pink-900">{patient.ward}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-pink-700 mb-1">Bed</div>
                  <div className="font-bold text-pink-900">{patient.bed}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-pink-700 mb-1">Attending Doctor</div>
                  <div className="font-bold text-pink-900">{patient.doctor}</div>
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                    Include admission reason, delivery details, response to treatment, and complications if any
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Condition on Discharge *
                  </label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discharge Medications *
                  </label>
                  <Textarea 
                    placeholder="List all medications to continue at home with dosage and duration..."
                    value={formData.dischargeMedications}
                    onChange={(e) => handleInputChange('dischargeMedications', e.target.value)}
                    className="min-h-32 text-base font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Include medication name, dosage, frequency, and duration
                  </p>
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
                                  className="px-4 py-2 hover:bg-pink-50 cursor-pointer text-sm"
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
            <Link href={`/maternity-ward/patient/${patientId}`}>
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

