'use client';

import { useState } from 'react';
import { useLanguage } from '@/features/pharmacy-counter/contexts/LanguageContext';
import { useAuth } from '@/features/pharmacy-counter/contexts/AuthContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  XCircle,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Shield,
  Thermometer,
  Pill,
} from 'lucide-react';

interface Order {
  id: string;
  patientMrn: string;
  patientName: string;
  ward: string;
  bed: string;
  prescriber: string;
  drugName: string;
  strength: string;
  dose: string;
  frequency: string;
  route: string;
  indication: string;
  orderTime: string;
  status: 'pending' | 'screening' | 'approved' | 'clarify';
  hamFlag: boolean;
  coldChain: boolean;
  cdFlag: boolean;
  alerts: string[];
}

export default function OrderScreening() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [screeningAction, setScreeningAction] = useState<'approve' | 'clarify' | 'alternative' | null>(null);

  // Mock orders pending screening
  const pendingOrders: Order[] = [
    {
      id: 'ORD001',
      patientMrn: 'HSB-24-001234',
      patientName: 'Ahmad bin Abdullah',
      ward: 'Medical 3A',
      bed: '3A-12',
      prescriber: 'Dr. Lim Wei Chen',
      drugName: 'Vancomycin',
      strength: '1g',
      dose: '1g',
      frequency: 'BD',
      route: 'IV',
      indication: 'Pneumonia',
      orderTime: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'pending',
      hamFlag: true,
      coldChain: false,
      cdFlag: false,
      alerts: ['Renal dosing required', 'TDM monitoring needed'],
    },
    {
      id: 'ORD002',
      patientMrn: 'HSB-24-005678',
      patientName: 'Siti Nurhaliza binti Hassan',
      ward: 'Medical 3B',
      bed: '3B-08',
      prescriber: 'Dr. Kumar Rajesh',
      drugName: 'Insulin Aspart',
      strength: '100 units/mL',
      dose: '6 units',
      frequency: 'TDS',
      route: 'SC',
      indication: 'Type 2 Diabetes',
      orderTime: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'pending',
      hamFlag: true,
      coldChain: true,
      cdFlag: false,
      alerts: ['High-risk medication', 'Cold chain required', 'Blood glucose monitoring needed'],
    },
    {
      id: 'ORD003',
      patientMrn: 'HSB-24-003456',
      patientName: 'Kumar s/o Rajan',
      ward: 'ICU',
      bed: 'ICU-03',
      prescriber: 'Dr. Ahmad Faizal',
      drugName: 'Morphine',
      strength: '10mg/mL',
      dose: '5mg',
      frequency: 'PRN Q4H',
      route: 'IV',
      indication: 'Pain control',
      orderTime: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'pending',
      hamFlag: true,
      coldChain: false,
      cdFlag: true,
      alerts: ['Controlled drug - witness required', 'Respiratory depression risk'],
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-orange-100 text-orange-700', icon: Clock, label: language === 'en' ? 'Pending' : 'Menunggu' },
      screening: { color: 'bg-blue-100 text-blue-700', icon: FileText, label: language === 'en' ? 'Screening' : 'Saringan' },
      approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: language === 'en' ? 'Approved' : 'Diluluskan' },
      clarify: { color: 'bg-yellow-100 text-yellow-700', icon: MessageSquare, label: language === 'en' ? 'Clarify' : 'Penjelasan' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'en' ? 'Order Screening & Verification' : 'Saringan & Pengesahan Pesanan'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {language === 'en' 
                ? 'Clinical screening and pharmacist verification of medication orders'
                : 'Saringan klinikal dan pengesahan farmasis untuk pesanan ubat'}
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
                <p className="text-xs font-semibold text-orange-600 uppercase">{language === 'en' ? 'Awaiting Review' : 'Menunggu Semakan'}</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingOrders.length}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase">{language === 'en' ? 'High-Risk Meds' : 'Ubat Berisiko Tinggi'}</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {pendingOrders.filter(o => o.hamFlag).length}
                </p>
              </div>
              <Shield className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase">{language === 'en' ? 'Cold Chain' : 'Rantaian Sejuk'}</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {pendingOrders.filter(o => o.coldChain).length}
                </p>
              </div>
              <Thermometer className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase">{language === 'en' ? 'Controlled Drugs' : 'Dadah Berbahaya'}</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {pendingOrders.filter(o => o.cdFlag).length}
                </p>
              </div>
              <Pill className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Orders List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              {language === 'en' ? 'Pending Orders' : 'Pesanan Menunggu'}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {pendingOrders.length} {language === 'en' ? 'orders' : 'pesanan'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {pendingOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const isSelected = selectedOrder === order.id;
                const timeAgo = Math.floor((Date.now() - new Date(order.orderTime).getTime()) / 60000);

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{order.patientName}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {order.patientMrn} • {order.ward} - {order.bed}
                        </p>
                      </div>
                    </div>

                    {/* Drug Info */}
                    <div className="mb-2">
                      <p className="font-semibold text-gray-900">{order.drugName} {order.strength}</p>
                      <p className="text-sm text-gray-600">{order.dose} {order.frequency} {order.route}</p>
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {order.hamFlag && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          <Shield className="w-3 h-3" />
                          HAM
                        </span>
                      )}
                      {order.coldChain && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          <Thermometer className="w-3 h-3" />
                          {language === 'en' ? 'Cold' : 'Sejuk'}
                        </span>
                      )}
                      {order.cdFlag && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                          <AlertCircle className="w-3 h-3" />
                          CD
                        </span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-xs text-gray-600">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {timeAgo} {language === 'en' ? 'mins ago' : 'min lalu'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details */}
        {selectedOrder ? (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            {(() => {
              const order = pendingOrders.find(o => o.id === selectedOrder);
              if (!order) return null;

              return (
                <div className="p-6">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{order.patientName}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span><strong>{language === 'en' ? 'MRN:' : 'No. MRN:'}</strong> {order.patientMrn}</span>
                          <span><strong>{language === 'en' ? 'Ward:' : 'Wad:'}</strong> {order.ward} - {order.bed}</span>
                          <span><strong>{language === 'en' ? 'Prescriber:' : 'Pegawai Preskrib:'}</strong> {order.prescriber}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {language === 'en' ? 'Order Details' : 'Butiran Pesanan'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          {language === 'en' ? 'Medication' : 'Ubat'}
                        </label>
                        <p className="text-sm text-gray-900 font-medium">{order.drugName} {order.strength}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          {language === 'en' ? 'Dose' : 'Dos'}
                        </label>
                        <p className="text-sm text-gray-900 font-medium">{order.dose}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          {language === 'en' ? 'Frequency' : 'Kekerapan'}
                        </label>
                        <p className="text-sm text-gray-900 font-medium">{order.frequency}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          {language === 'en' ? 'Route' : 'Laluan'}
                        </label>
                        <p className="text-sm text-gray-900 font-medium">{order.route}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          {language === 'en' ? 'Indication' : 'Petunjuk'}
                        </label>
                        <p className="text-sm text-gray-900 font-medium">{order.indication}</p>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Alerts */}
                  {order.alerts.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-yellow-900 mb-2">
                            {language === 'en' ? 'Clinical Alerts' : 'Amaran Klinikal'}
                          </h4>
                          <ul className="space-y-1">
                            {order.alerts.map((alert, idx) => (
                              <li key={idx} className="text-sm text-yellow-900">• {alert}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Screening Actions */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {language === 'en' ? 'Screening Decision' : 'Keputusan Saringan'}
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <button
                        onClick={() => setScreeningAction('approve')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          screeningAction === 'approve'
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-900 text-center">
                          {language === 'en' ? 'Approve' : 'Luluskan'}
                        </p>
                      </button>

                      <button
                        onClick={() => setScreeningAction('clarify')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          screeningAction === 'clarify'
                            ? 'border-yellow-600 bg-yellow-50'
                            : 'border-gray-200 hover:border-yellow-300'
                        }`}
                      >
                        <MessageSquare className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-900 text-center">
                          {language === 'en' ? 'Clarify' : 'Penjelasan'}
                        </p>
                      </button>

                      <button
                        onClick={() => setScreeningAction('alternative')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          screeningAction === 'alternative'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-900 text-center">
                          {language === 'en' ? 'Alternative' : 'Alternatif'}
                        </p>
                      </button>
                    </div>

                    {screeningAction && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          {language === 'en' ? 'Notes' : 'Nota'}
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={language === 'en' ? 'Enter screening notes...' : 'Masukkan nota saringan...'}
                        />

                        <div className="flex justify-end gap-3 mt-4">
                          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                            {language === 'en' ? 'Cancel' : 'Batal'}
                          </button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            {language === 'en' ? 'Submit Decision' : 'Hantar Keputusan'}
                          </button>
                        </div>
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
                {language === 'en' ? 'Select an order to begin screening' : 'Pilih pesanan untuk mulakan saringan'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

