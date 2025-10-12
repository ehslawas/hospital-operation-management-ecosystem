'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import type { Appointment, Prescription } from '../types/entities';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';

export default function QueueAppointments() {
  const { language } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [apptsRes, rxRes] = await Promise.all([
        fetch(`/api/pharmacy/appointments?date=${today}`),
        fetch('/api/pharmacy/prescriptions'),
      ]);

      const apptsData = await apptsRes.json();
      const rxData = await rxRes.json();

      setAppointments(apptsData);
      setPrescriptions(rxData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQueue = prescriptions.filter(
    p => p.status === 'new' || p.status === 'screening' || p.status === 'verified'
  ).length;

  const stats = [
    {
      label: language === 'en' ? 'Current Queue' : 'Giliran Semasa',
      value: currentQueue,
      icon: Users,
      color: 'blue',
    },
    {
      label: language === 'en' ? "Today's Appointments" : 'Temujanji Hari Ini',
      value: appointments.length,
      icon: Calendar,
      color: 'green',
    },
    {
      label: language === 'en' ? 'Completed Today' : 'Selesai Hari Ini',
      value: appointments.filter(a => a.status === 'completed').length,
      icon: CheckCircle,
      color: 'purple',
    },
    {
      label: language === 'en' ? 'Avg Wait Time' : 'Masa Tunggu Purata',
      value: '15 min',
      icon: Clock,
      color: 'orange',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.queue', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Queue management and pharmacy appointment scheduling' 
            : 'Pengurusan giliran dan penjadualan temujanji farmasi'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointments Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'en' ? "Today's Appointments" : 'Temujanji Hari Ini'}
          </h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            {language === 'en' ? 'New Appointment' : 'Temujanji Baru'}
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {loading && (
            <div className="p-6 text-center text-gray-500">
              {t('common.loading', language)}
            </div>
          )}

          {!loading && appointments.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {language === 'en' ? 'No appointments scheduled' : 'Tiada temujanji dijadualkan'}
            </div>
          )}

          {!loading && appointments.map((appt) => (
            <div key={appt.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">
                        {new Date(appt.dateTime).toLocaleTimeString(language === 'en' ? 'en-MY' : 'ms-MY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        appt.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        appt.status === 'scheduled' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{appt.type}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {language === 'en' ? 'Channel' : 'Saluran'}: {appt.channel}
                    </p>
                    {appt.notes && (
                      <p className="text-xs text-gray-500 mt-1">{appt.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                    {t('common.view', language)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'en' ? 'Queue Management' : 'Pengurusan Giliran'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {language === 'en' 
            ? 'Real-time queue tracking with priority tagging for urgent prescriptions, elderly patients, and controlled drugs.' 
            : 'Penjejakan giliran masa nyata dengan penandaan keutamaan untuk preskripsi mendesak, pesakit tua, dan ubat terkawal.'}
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {language === 'en' ? 'Call Next Patient' : 'Panggil Pesakit Seterusnya'}
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            {language === 'en' ? 'Queue Display' : 'Paparan Giliran'}
          </button>
        </div>
      </div>
    </div>
  );
}

