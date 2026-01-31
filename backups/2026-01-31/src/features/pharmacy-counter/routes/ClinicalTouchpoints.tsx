'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import { Activity, Calendar, Heart, Stethoscope, Brain, Droplet } from 'lucide-react';
import type { Appointment } from '../types/entities';

export default function ClinicalTouchpoints() {
  const { language } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/pharmacy/appointments?date=${today}`);
      const data = await response.json();
      
      const mtacAppts = data.filter((a: Appointment) => a.type === 'MTAC');
      setAppointments(mtacAppts);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const mtacClinics = [
    {
      id: 'dmtac',
      name: t('mtac.dmtac', language),
      icon: Droplet,
      color: 'blue',
      count: appointments.length,
      description: language === 'en' 
        ? 'Diabetes medication therapy adherence clinic' 
        : 'Klinik pematuhan terapi ubat diabetes',
    },
    {
      id: 'wmtac',
      name: t('mtac.wmtac', language),
      icon: Activity,
      color: 'red',
      count: 0,
      description: language === 'en' 
        ? 'Warfarin monitoring and dose adjustment' 
        : 'Pemantauan warfarin dan penyesuaian dos',
    },
    {
      id: 'respiratory',
      name: t('mtac.respiratory', language),
      icon: Stethoscope,
      color: 'purple',
      count: 0,
      description: language === 'en' 
        ? 'Respiratory clinic (Asthma, COPD)' 
        : 'Klinik respiratori (Asma, COPD)',
    },
    {
      id: 'nephrology',
      name: t('mtac.nephrology', language),
      icon: Droplet,
      color: 'cyan',
      count: 0,
      description: language === 'en' 
        ? 'Renal clinic for CKD patients' 
        : 'Klinik buah pinggang untuk pesakit CKD',
    },
    {
      id: 'cardiology',
      name: t('mtac.cardiology', language),
      icon: Heart,
      color: 'pink',
      count: 1,
      description: language === 'en' 
        ? 'Cardiac medication management' 
        : 'Pengurusan ubat jantung',
    },
    {
      id: 'psychiatry',
      name: t('mtac.psychiatry', language),
      icon: Brain,
      color: 'indigo',
      count: 0,
      description: language === 'en' 
        ? 'Mental health medication support' 
        : 'Sokongan ubat kesihatan mental',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.clinical', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'MTAC sessions, medication reconciliation, and clinical pharmacy services' 
            : 'Sesi MTAC, penyelarasan ubat, dan perkhidmatan farmasi klinikal'}
        </p>
      </div>

      {/* MTAC Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mtacClinics.map((clinic) => {
          const Icon = clinic.icon;
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
            red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
            cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-300' },
            pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-300' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-300' },
          };
          const colors = colorClasses[clinic.color as keyof typeof colorClasses];

          return (
            <div
              key={clinic.id}
              className={`bg-white rounded-lg shadow-sm border-2 ${colors.border} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {clinic.count}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {clinic.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {clinic.description}
              </p>
              <button className={`w-full px-4 py-2 ${colors.text} border-2 ${colors.border} rounded-lg hover:${colors.bg} transition-colors font-medium`}>
                {language === 'en' ? 'Open Clinic' : 'Buka Klinik'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Today's MTAC Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'en' ? "Today's MTAC Sessions" : 'Sesi MTAC Hari Ini'}
          </h2>
        </div>

        {appointments.length === 0 && (
          <p className="text-gray-500 text-sm">
            {language === 'en' ? 'No MTAC sessions scheduled for today' : 'Tiada sesi MTAC dijadualkan hari ini'}
          </p>
        )}

        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(appt.dateTime).toLocaleTimeString(language === 'en' ? 'en-MY' : 'ms-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{appt.type}</p>
                  {appt.notes && <p className="text-xs text-gray-500 mt-1">{appt.notes}</p>}
                </div>
                <button className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                  {language === 'en' ? 'Start Session' : 'Mula Sesi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'en' ? 'Medication Reconciliation' : 'Penyelarasan Ubat'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'en' 
              ? 'Ensure continuity of medication therapy at transitions of care.' 
              : 'Pastikan kesinambungan terapi ubat pada peralihan penjagaan.'}
          </p>
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            {language === 'en' ? 'Start Reconciliation' : 'Mula Penyelarasan'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'en' ? 'Antimicrobial Stewardship' : 'Pengurusan Antimikrobial'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'en' 
              ? 'TDM services, dose optimization, and AMS support.' 
              : 'Perkhidmatan TDM, pengoptimuman dos, dan sokongan AMS.'}
          </p>
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            {language === 'en' ? 'View Cases' : 'Lihat Kes'}
          </button>
        </div>
      </div>
    </div>
  );
}

