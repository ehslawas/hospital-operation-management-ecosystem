'use client';

import { useState } from 'react';
import { useLanguage } from '@/features/pharmacy-counter/contexts/LanguageContext';
import { useAuth } from '@/features/pharmacy-counter/contexts/AuthContext';
import {
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Pill,
  Calendar,
  Save,
  Send,
  X,
  Plus,
} from 'lucide-react';

interface MedRecPatient {
  id: string;
  mrn: string;
  name: string;
  nric: string;
  ward: string;
  bed: string;
  age: number;
  sex: string;
  admitTime: string;
  status: 'pending' | 'in_progress' | 'completed';
  hoursElapsed: number;
}

export default function MedRec() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);

  // Mock patients needing MedRec
  const medRecPatients: MedRecPatient[] = [
    {
      id: 'MR001',
      mrn: 'HSB-24-001234',
      name: 'Ahmad bin Abdullah',
      nric: '850615-10-5234',
      ward: 'Medical 3A',
      bed: '3A-12',
      age: 39,
      sex: 'M',
      admitTime: new Date(Date.now() - 5 * 3600000).toISOString(),
      status: 'in_progress',
      hoursElapsed: 5,
    },
    {
      id: 'MR002',
      mrn: 'HSB-24-005678',
      name: 'Siti Nurhaliza binti Hassan',
      nric: '630412-08-7654',
      ward: 'Medical 3B',
      bed: '3B-08',
      age: 61,
      sex: 'F',
      admitTime: new Date(Date.now() - 18 * 3600000).toISOString(),
      status: 'pending',
      hoursElapsed: 18,
    },
    {
      id: 'MR003',
      mrn: 'HSB-24-009012',
      name: 'Tan Mei Ling',
      nric: '920823-14-3456',
      ward: 'Maternity Ward 1',
      bed: 'MAT-05',
      age: 32,
      sex: 'F',
      admitTime: new Date(Date.now() - 2 * 3600000).toISOString(),
      status: 'pending',
      hoursElapsed: 2,
    },
    {
      id: 'MR004',
      mrn: 'HSB-24-003456',
      name: 'Kumar s/o Rajan',
      nric: '880305-10-1234',
      ward: 'ICU',
      bed: 'ICU-03',
      age: 36,
      sex: 'M',
      admitTime: new Date(Date.now() - 36 * 3600000).toISOString(),
      status: 'completed',
      hoursElapsed: 36,
    },
  ];

  const mockHomeMedications = [
    {
      id: '1',
      drugName: 'Metformin',
      strength: '500mg',
      form: 'Tablet',
      dose: '500mg',
      frequency: 'BD',
      route: 'PO',
      indication: 'Type 2 Diabetes Mellitus',
      lastDose: '2025-01-10 08:00',
      source: 'SPUB Record',
      continued: true,
    },
    {
      id: '2',
      drugName: 'Amlodipine',
      strength: '5mg',
      form: 'Tablet',
      dose: '5mg',
      frequency: 'OD',
      route: 'PO',
      indication: 'Hypertension',
      lastDose: '2025-01-10 08:00',
      source: 'Patient Interview',
      continued: true,
    },
    {
      id: '3',
      drugName: 'Aspirin',
      strength: '100mg',
      form: 'Tablet',
      dose: '100mg',
      frequency: 'OD',
      route: 'PO',
      indication: 'Cardiovascular prophylaxis',
      lastDose: '2025-01-10 08:00',
      source: 'GP Letter',
      continued: false,
      reason: 'Holding due to surgery',
    },
  ];

  const mockDiscrepancies = [
    {
      id: 'D1',
      type: 'unintentional' as const,
      description: 'Home medication Aspirin 100mg OD not ordered on admission',
      homeMed: 'Aspirin 100mg OD',
      inpatientOrder: null,
      resolved: false,
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: language === 'en' ? 'Pending' : 'Menunggu' },
      in_progress: { color: 'bg-blue-100 text-blue-700', icon: FileText, label: language === 'en' ? 'In Progress' : 'Dalam Proses' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: language === 'en' ? 'Completed' : 'Selesai' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const get24HourStatus = (hours: number) => {
    if (hours < 12) return { color: 'text-green-600', message: language === 'en' ? 'On track' : 'Mengikut jadual' };
    if (hours < 24) return { color: 'text-orange-600', message: language === 'en' ? 'Approaching deadline' : 'Hampir tamat tempoh' };
    return { color: 'text-red-600', message: language === 'en' ? 'Overdue' : 'Lewat' };
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'en' ? 'Medication Reconciliation (MedRec)' : 'Rekonsiliasi Ubat (MedRec)'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'en' 
                ? 'Best Possible Medication History (BPMH) & admission reconciliation'
                : 'Sejarah Ubat Terbaik (BPMH) & rekonsiliasi kemasukan'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-orange-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase">{language === 'en' ? 'Pending' : 'Menunggu'}</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {medRecPatients.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase">{language === 'en' ? 'In Progress' : 'Dalam Proses'}</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {medRecPatients.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase">{language === 'en' ? 'Completed (24h)' : 'Selesai (24j)'}</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {medRecPatients.filter(p => p.status === 'completed' && p.hoursElapsed <= 24).length}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase">{language === 'en' ? 'Discrepancies' : 'Percanggahan'}</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {mockDiscrepancies.filter(d => !d.resolved).length}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Patient List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              {language === 'en' ? 'Patients Requiring MedRec' : 'Pesakit Memerlukan MedRec'}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {medRecPatients.length} {language === 'en' ? 'admissions' : 'kemasukan'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {medRecPatients.map((patient) => {
                const badge = getStatusBadge(patient.status);
                const timeStatus = get24HourStatus(patient.hoursElapsed);
                const isSelected = selectedPatient === patient.id;

                return (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    {/* Patient Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{patient.name}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {patient.mrn} • {patient.ward} - {patient.bed}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${badge.color}`}>
                        <badge.icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>

                    {/* Time Since Admission */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {patient.hoursElapsed}h {language === 'en' ? 'since admission' : 'sejak masuk'}
                      </span>
                      <span className={`font-semibold ${timeStatus.color}`}>
                        {timeStatus.message}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Patient Details */}
        {selectedPatient ? (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            {(() => {
              const patient = medRecPatients.find(p => p.id === selectedPatient);
              if (!patient) return null;

              return (
                <div className="p-6">
                  {/* Patient Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span><strong>{language === 'en' ? 'MRN:' : 'No. MRN:'}</strong> {patient.mrn}</span>
                          <span><strong>{language === 'en' ? 'IC:' : 'KP:'}</strong> {patient.nric}</span>
                          <span><strong>{language === 'en' ? 'Age/Sex:' : 'Umur/Jantina:'}</strong> {patient.age}Y / {patient.sex}</span>
                          <span><strong>{language === 'en' ? 'Ward:' : 'Wad:'}</strong> {patient.ward} - {patient.bed}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {language === 'en' ? 'Save Progress' : 'Simpan Kemajuan'}
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          {language === 'en' ? 'Complete' : 'Selesai'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BPMH Sources */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {language === 'en' ? 'BPMH Sources' : 'Sumber BPMH'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'patient', label: language === 'en' ? 'Patient Interview' : 'Wawancara Pesakit', checked: true },
                        { key: 'spub', label: 'SPUB Record', checked: true },
                        { key: 'caregiver', label: language === 'en' ? 'Caregiver' : 'Penjaga', checked: false },
                        { key: 'gp', label: language === 'en' ? 'GP Letter' : 'Surat GP', checked: true },
                        { key: 'pharmacy', label: language === 'en' ? 'Community Pharmacy' : 'Farmasi Komuniti', checked: false },
                        { key: 'discharge', label: language === 'en' ? 'Previous Discharge Summary' : 'Ringkasan Discaj Terdahulu', checked: false },
                      ].map((source) => (
                        <label key={source.key} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={source.checked}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-900">{source.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Home Medications */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {language === 'en' ? 'Home Medications' : 'Ubat di Rumah'}
                      </h3>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        {language === 'en' ? 'Add Medication' : 'Tambah Ubat'}
                      </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                              {language === 'en' ? 'Medication' : 'Ubat'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                              {language === 'en' ? 'Dose & Frequency' : 'Dos & Kekerapan'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                              {language === 'en' ? 'Indication' : 'Petunjuk'}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                              {language === 'en' ? 'Source' : 'Sumber'}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                              {language === 'en' ? 'Continue?' : 'Teruskan?'}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                              {language === 'en' ? 'Action' : 'Tindakan'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {mockHomeMedications.map((med) => (
                            <tr key={med.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-semibold text-gray-900">{med.drugName}</p>
                                  <p className="text-sm text-gray-600">{med.form} {med.strength}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-900">{med.dose} {med.frequency} {med.route}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-900">{med.indication}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                  {med.source}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {med.continued ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                ) : (
                                  <div>
                                    <X className="w-5 h-5 text-red-600 mx-auto" />
                                    {med.reason && (
                                      <p className="text-xs text-red-600 mt-1">{med.reason}</p>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                  {language === 'en' ? 'Edit' : 'Sunting'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Discrepancies */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {language === 'en' ? 'Discrepancies' : 'Percanggahan'}
                      </h3>
                      <button 
                        onClick={() => setShowDiscrepancyModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {language === 'en' ? 'Add Discrepancy' : 'Tambah Percanggahan'}
                      </button>
                    </div>

                    {mockDiscrepancies.length > 0 ? (
                      <div className="space-y-3">
                        {mockDiscrepancies.map((disc) => (
                          <div key={disc.id} className={`border rounded-lg p-4 ${
                            disc.type === 'unintentional' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase ${
                                    disc.type === 'unintentional' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                                  }`}>
                                    {disc.type === 'unintentional' ? 
                                      (language === 'en' ? 'Unintentional' : 'Tidak Sengaja') :
                                      (language === 'en' ? 'Intentional' : 'Sengaja')
                                    }
                                  </span>
                                  {!disc.resolved && (
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-900 font-medium mb-1">{disc.description}</p>
                                <p className="text-xs text-gray-600">
                                  <strong>{language === 'en' ? 'Home:' : 'Rumah:'}</strong> {disc.homeMed || '-'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>{language === 'en' ? 'Inpatient:' : 'Pesakit Dalam:'}</strong> {disc.inpatientOrder || '-'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!disc.resolved && (
                                  <button className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
                                    {language === 'en' ? 'Resolve' : 'Selesaikan'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-900 font-medium">
                          {language === 'en' ? 'No discrepancies identified' : 'Tiada percanggahan dikenal pasti'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {language === 'en' ? 'Select a patient to begin medication reconciliation' : 'Pilih pesakit untuk mulakan rekonsiliasi ubat'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

