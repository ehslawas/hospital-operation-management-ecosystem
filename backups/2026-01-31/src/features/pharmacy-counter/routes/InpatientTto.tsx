'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  User,
  CheckCircle2,
  Package,
  AlertCircle,
  Printer,
  FileText,
  MessageSquare,
  ChevronRight,
  Pill,
  Calendar,
  Phone,
} from 'lucide-react';

interface TTOPatient {
  id: string;
  mrn: string;
  name: string;
  nric: string;
  ward: string;
  bed: string;
  age: number;
  sex: string;
  dischargeOrderTime: string;
  status: 'pending' | 'preparing' | 'ready' | 'counseled' | 'delivered';
  itemsCount: number;
  slaMinutes: number;
  priority: 'normal' | 'urgent';
}

export default function InpatientTto() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preparation' | 'counseling' | 'delivery'>('preparation');

  // Mock TTO patients
  const ttoPatients: TTOPatient[] = [
    {
      id: 'TTO001',
      mrn: 'HSB-24-001234',
      name: 'Ahmad bin Abdullah',
      nric: '850615-10-5234',
      ward: 'Medical 3A',
      bed: '3A-12',
      age: 39,
      sex: 'M',
      dischargeOrderTime: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'preparing',
      itemsCount: 5,
      slaMinutes: 90,
      priority: 'normal',
    },
    {
      id: 'TTO002',
      mrn: 'HSB-24-005678',
      name: 'Siti Nurhaliza binti Hassan',
      nric: '630412-08-7654',
      ward: 'Medical 3B',
      bed: '3B-08',
      age: 61,
      sex: 'F',
      dischargeOrderTime: new Date(Date.now() - 120 * 60000).toISOString(),
      status: 'ready',
      itemsCount: 7,
      slaMinutes: 90,
      priority: 'normal',
    },
    {
      id: 'TTO003',
      mrn: 'HSB-24-009012',
      name: 'Tan Mei Ling',
      nric: '920823-14-3456',
      ward: 'Maternity Ward 1',
      bed: 'MAT-05',
      age: 32,
      sex: 'F',
      dischargeOrderTime: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'pending',
      itemsCount: 3,
      slaMinutes: 60,
      priority: 'urgent',
    },
  ];

  const calculateTimeElapsed = (orderTime: string): string => {
    const elapsed = Math.floor((Date.now() - new Date(orderTime).getTime()) / 60000);
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} mins`;
  };

  const calculateSLAStatus = (orderTime: string, slaMinutes: number): { status: 'good' | 'warning' | 'overdue'; remaining: number } => {
    const elapsed = Math.floor((Date.now() - new Date(orderTime).getTime()) / 60000);
    const remaining = slaMinutes - elapsed;
    
    if (remaining > 30) return { status: 'good', remaining };
    if (remaining > 0) return { status: 'warning', remaining };
    return { status: 'overdue', remaining };
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: language === 'en' ? 'Pending' : 'Menunggu' },
      preparing: { color: 'bg-blue-100 text-blue-700', icon: Package, label: language === 'en' ? 'Preparing' : 'Menyediakan' },
      ready: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: language === 'en' ? 'Ready' : 'Sedia' },
      counseled: { color: 'bg-purple-100 text-purple-700', icon: MessageSquare, label: language === 'en' ? 'Counseled' : 'Dikaunseling' },
      delivered: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle2, label: language === 'en' ? 'Delivered' : 'Dihantar' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const mockDischargeItems = [
    {
      id: '1',
      drugName: 'Metformin',
      strength: '500mg',
      form: 'Tablet',
      dose: '500mg',
      frequency: 'BD',
      route: 'PO',
      duration: '30 days',
      quantity: 60,
      instructions: 'Take with meals',
      status: 'packed',
    },
    {
      id: '2',
      drugName: 'Amlodipine',
      strength: '5mg',
      form: 'Tablet',
      dose: '5mg',
      frequency: 'OD',
      route: 'PO',
      duration: '30 days',
      quantity: 30,
      instructions: 'Take in the morning',
      status: 'packed',
    },
    {
      id: '3',
      drugName: 'Aspirin',
      strength: '100mg',
      form: 'Tablet',
      dose: '100mg',
      frequency: 'OD',
      route: 'PO',
      duration: '30 days',
      quantity: 30,
      instructions: 'Take after food',
      status: 'packed',
    },
    {
      id: '4',
      drugName: 'Atorvastatin',
      strength: '20mg',
      form: 'Tablet',
      dose: '20mg',
      frequency: 'ON',
      route: 'PO',
      duration: '30 days',
      quantity: 30,
      instructions: 'Take at night',
      status: 'packing',
    },
    {
      id: '5',
      drugName: 'Omeprazole',
      strength: '20mg',
      form: 'Capsule',
      dose: '20mg',
      frequency: 'OD',
      route: 'PO',
      duration: '30 days',
      quantity: 30,
      instructions: 'Take before breakfast',
      status: 'pending',
    },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'en' ? 'Inpatient & Discharge (TTO)' : 'Pesakit Dalam & Discaj (TTO)'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'en' ? 'Discharge prescriptions (TTO) and ward supply management' : 'Preskripsi discaj (TTO) dan pengurusan bekalan wad'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-orange-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase">{language === 'en' ? 'Pending Discharge' : 'Menunggu Discaj'}</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {ttoPatients.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase">{language === 'en' ? 'Ready for Collection' : 'Sedia Untuk Diambil'}</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {ttoPatients.filter(p => p.status === 'ready').length}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase">{language === 'en' ? 'Dispensed Today' : 'Diserahkan Hari Ini'}</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">0</p>
              </div>
              <Package className="w-10 h-10 text-blue-500" />
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
              {language === 'en' ? 'Discharge Prescriptions (TTO)' : 'Preskripsi Discaj (TTO)'}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {ttoPatients.length} {language === 'en' ? 'patients' : 'pesakit'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {ttoPatients.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{language === 'en' ? 'No TTO prescriptions' : 'Tiada preskripsi TTO'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {ttoPatients.map((patient) => {
                  const badge = getStatusBadge(patient.status);
                  const sla = calculateSLAStatus(patient.dischargeOrderTime, patient.slaMinutes);
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
                        {patient.priority === 'urgent' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            {language === 'en' ? 'Urgent' : 'Segera'}
                          </span>
                        )}
                      </div>

                      {/* Status & Items */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${badge.color}`}>
                          <badge.icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-600">
                          {patient.itemsCount} {language === 'en' ? 'items' : 'item'}
                        </span>
                      </div>

                      {/* Time & SLA */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {calculateTimeElapsed(patient.dischargeOrderTime)} {language === 'en' ? 'elapsed' : 'berlalu'}
                        </span>
                        <span className={`font-semibold ${
                          sla.status === 'good' ? 'text-green-600' :
                          sla.status === 'warning' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {sla.remaining > 0 
                            ? `${sla.remaining} ${language === 'en' ? 'mins left' : 'min lagi'}`
                            : `${Math.abs(sla.remaining)} ${language === 'en' ? 'mins overdue' : 'min lewat'}`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Patient Details */}
        {selectedPatient ? (
          <div className="flex-1 flex flex-col bg-white">
            {(() => {
              const patient = ttoPatients.find(p => p.id === selectedPatient);
              if (!patient) return null;

              return (
                <>
                  {/* Patient Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
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
                          <Printer className="w-4 h-4" />
                          {language === 'en' ? 'Print Labels' : 'Cetak Label'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex gap-1 px-6">
                      {[
                        { key: 'preparation', label: language === 'en' ? 'Preparation' : 'Penyediaan', icon: Package },
                        { key: 'counseling', label: language === 'en' ? 'Counseling' : 'Kaunseling', icon: MessageSquare },
                        { key: 'delivery', label: language === 'en' ? 'Delivery' : 'Penghantaran', icon: CheckCircle2 },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key as any)}
                          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                            activeTab === tab.key
                              ? 'border-blue-600 text-blue-600 bg-white'
                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'preparation' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            <p className="text-sm text-blue-900 font-medium">
                              {language === 'en' 
                                ? 'SLA Target: 90 minutes from discharge order'
                                : 'Sasaran SLA: 90 minit dari pesanan discaj'}
                            </p>
                          </div>
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
                                  {language === 'en' ? 'Duration' : 'Tempoh'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                  {language === 'en' ? 'Quantity' : 'Kuantiti'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                  {language === 'en' ? 'Status' : 'Status'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {mockDischargeItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">{item.drugName}</p>
                                      <p className="text-sm text-gray-600">{item.form} {item.strength}</p>
                                      <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm text-gray-900">{item.dose} {item.frequency} {item.route}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm text-gray-900">{item.duration}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-gray-900">{item.quantity}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    {item.status === 'packed' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {language === 'en' ? 'Packed' : 'Sudah Dibungkus'}
                                      </span>
                                    )}
                                    {item.status === 'packing' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                                        <Package className="w-3 h-3" />
                                        {language === 'en' ? 'Packing' : 'Membungkus'}
                                      </span>
                                    )}
                                    {item.status === 'pending' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                                        <Clock className="w-3 h-3" />
                                        {language === 'en' ? 'Pending' : 'Menunggu'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end gap-3">
                          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                            {language === 'en' ? 'Verify Items' : 'Sahkan Item'}
                          </button>
                          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                            {language === 'en' ? 'Mark as Ready' : 'Tandakan Sedia'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'counseling' && (
                      <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {language === 'en' ? 'Counseling Checklist' : 'Senarai Semak Kaunseling'}
                          </h3>
                          <div className="space-y-3">
                            {[
                              language === 'en' ? 'Medication names and purposes explained' : 'Nama ubat dan tujuan dijelaskan',
                              language === 'en' ? 'Dosing instructions reviewed' : 'Arahan dos dikaji semula',
                              language === 'en' ? 'Side effects discussed' : 'Kesan sampingan dibincangkan',
                              language === 'en' ? 'Storage instructions provided' : 'Arahan penyimpanan diberikan',
                              language === 'en' ? 'Follow-up appointments scheduled' : 'Temujanji susulan dijadualkan',
                              language === 'en' ? 'Patient demonstrated understanding (Teach-back)' : 'Pesakit tunjuk kefahaman (Teach-back)',
                            ].map((item, idx) => (
                              <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                                <span className="text-sm text-gray-900">{item}</span>
                              </label>
                            ))}
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              {language === 'en' ? 'Counseling Notes' : 'Nota Kaunseling'}
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={language === 'en' ? 'Enter counseling notes...' : 'Masukkan nota kaunseling...'}
                            />
                          </div>

                          <div className="mt-4 flex justify-end gap-3">
                            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                              {language === 'en' ? 'Save Notes' : 'Simpan Nota'}
                            </button>
                            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                              {language === 'en' ? 'Mark as Counseled' : 'Tandakan Dikaunseling'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'delivery' && (
                      <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {language === 'en' ? 'Bedside Delivery' : 'Penghantaran Bedside'}
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                {language === 'en' ? 'Collected By' : 'Diambil Oleh'}
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={language === 'en' ? 'Patient name or representative' : 'Nama pesakit atau wakil'}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                {language === 'en' ? 'Relationship (if representative)' : 'Hubungan (jika wakil)'}
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">{language === 'en' ? 'Select...' : 'Pilih...'}</option>
                                <option value="self">{language === 'en' ? 'Patient (Self)' : 'Pesakit (Sendiri)'}</option>
                                <option value="spouse">{language === 'en' ? 'Spouse' : 'Pasangan'}</option>
                                <option value="child">{language === 'en' ? 'Child' : 'Anak'}</option>
                                <option value="parent">{language === 'en' ? 'Parent' : 'Ibu Bapa'}</option>
                                <option value="sibling">{language === 'en' ? 'Sibling' : 'Adik-beradik'}</option>
                                <option value="other">{language === 'en' ? 'Other' : 'Lain-lain'}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                {language === 'en' ? 'Contact Number' : 'No. Telefon'}
                              </label>
                              <input
                                type="tel"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+60"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-2">
                                {language === 'en' ? 'Signature' : 'Tandatangan'}
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                  {language === 'en' ? 'Click to sign' : 'Klik untuk tandatangan'}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                {language === 'en' ? 'Cancel' : 'Batal'}
                              </button>
                              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {language === 'en' ? 'Complete Delivery' : 'Selesai Penghantaran'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {language === 'en' ? 'Select a patient to view discharge details' : 'Pilih pesakit untuk lihat butiran discaj'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ward Supply Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {language === 'en' ? 'Ward Supply Requests' : 'Permintaan Bekalan Wad'}
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {language === 'en' ? 'View All' : 'Lihat Semua'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {language === 'en' 
              ? 'UOD doses, patient bin fills, and ward top-up requests appear here.'
              : 'Dos UOD, isian bekas pesakit, dan permintaan tambah nilai wad muncul di sini.'}
          </p>
        </div>
      </div>
    </div>
  );
}
