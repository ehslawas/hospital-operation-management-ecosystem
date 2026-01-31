'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import type { Prescription, Appointment } from '../types/entities';
import {
  Users,
  Calendar,
  Truck,
  Bed,
  AlertTriangle,
  Thermometer,
  Activity,
  ClipboardCheck,
} from 'lucide-react';

interface DashboardStats {
  currentQueue: number;
  appointmentsToday: number;
  ttoDue: number;
  ddAlerts: number;
  coldChainExceptions: number;
  adrThisWeek: number;
  mtacToday: number;
  pendingScreening: number;
  readyForCollection: number;
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    currentQueue: 0,
    appointmentsToday: 0,
    ttoDue: 0,
    ddAlerts: 0,
    coldChainExceptions: 0,
    adrThisWeek: 0,
    mtacToday: 0,
    pendingScreening: 0,
    readyForCollection: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch prescriptions
      const prescriptionsRes = await fetch('/api/pharmacy/prescriptions');
      const prescriptions: Prescription[] = await prescriptionsRes.json();

      // Fetch appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsRes = await fetch(`/api/pharmacy/appointments?date=${today}`);
      const appointments: Appointment[] = await appointmentsRes.json();

      // Calculate stats
      const newStats: DashboardStats = {
        currentQueue: prescriptions.filter(
          (p) => p.status === 'new' || p.status === 'screening' || p.status === 'verified'
        ).length,
        appointmentsToday: appointments.filter((a) => a.status !== 'cancelled').length,
        ttoDue: prescriptions.filter(
          (p) => p.source === 'Ward' && (p.status === 'new' || p.status === 'screening')
        ).length,
        ddAlerts: 2, // Mock for now
        coldChainExceptions: 1, // Mock for now
        adrThisWeek: 3, // Mock for now
        mtacToday: appointments.filter((a) => a.type === 'MTAC').length,
        pendingScreening: prescriptions.filter((p) => p.status === 'new' || p.status === 'screening').length,
        readyForCollection: prescriptions.filter((p) => p.status === 'ready').length,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t('common.loading', language)}</div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('dashboard.queue.now', language),
      value: stats.currentQueue,
      icon: Users,
      color: 'blue',
      href: '/dispensing/queue',
    },
    {
      title: t('dashboard.appointments.today', language),
      value: stats.appointmentsToday,
      icon: Calendar,
      color: 'green',
      href: '/dispensing/queue',
    },
    {
      title: t('dashboard.tto.due', language),
      value: stats.ttoDue,
      icon: Bed,
      color: 'purple',
      href: '/dispensing/inpatient',
    },
    {
      title: t('dashboard.dd.alerts', language),
      value: stats.ddAlerts,
      icon: AlertTriangle,
      color: 'red',
      href: '/dispensing/inventory',
    },
    {
      title: t('dashboard.cold.chain', language),
      value: stats.coldChainExceptions,
      icon: Thermometer,
      color: 'cyan',
      href: '/dispensing/inventory',
    },
    {
      title: language === 'en' ? 'ADR This Week' : 'ADR Minggu Ini',
      value: stats.adrThisWeek,
      icon: Activity,
      color: 'orange',
      href: '/dispensing/quality',
    },
    {
      title: language === 'en' ? 'MTAC Today' : 'MTAC Hari Ini',
      value: stats.mtacToday,
      icon: ClipboardCheck,
      color: 'indigo',
      href: '/dispensing/clinical',
    },
    {
      title: language === 'en' ? 'Pending Screening' : 'Menunggu Saringan',
      value: stats.pendingScreening,
      icon: ClipboardCheck,
      color: 'yellow',
      href: '/dispensing/outpatient',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.dashboard', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Overview of pharmacy counter operations' 
            : 'Gambaran keseluruhan operasi kaunter farmasi'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            red: 'bg-red-100 text-red-600',
            cyan: 'bg-cyan-100 text-cyan-600',
            orange: 'bg-orange-100 text-orange-600',
            indigo: 'bg-indigo-100 text-indigo-600',
            yellow: 'bg-yellow-100 text-yellow-600',
          };

          return (
            <a
              key={index}
              href={card.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* VAS Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'en' ? 'Value-Added Services (VAS) Today' : 'Perkhidmatan Nilai Tambah (VAS) Hari Ini'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">12</div>
            <div className="text-xs text-gray-600 mt-1">
              {language === 'en' ? 'SPUB' : 'SPUB'}
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">8</div>
            <div className="text-xs text-gray-600 mt-1">
              {language === 'en' ? 'Drive-Through' : 'Pandu Lalu'}
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">5</div>
            <div className="text-xs text-gray-600 mt-1">
              {language === 'en' ? 'UMP' : 'UMP'}
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">6</div>
            <div className="text-xs text-gray-600 mt-1">
              {language === 'en' ? 'Locker4U' : 'Locker4U'}
            </div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-700">15</div>
            <div className="text-xs text-gray-600 mt-1">
              {language === 'en' ? 'Appointments' : 'Temujanji'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'en' ? 'Quick Actions' : 'Tindakan Pantas'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/dispensing/outpatient"
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
          >
            {language === 'en' ? 'New Prescription' : 'Preskripsi Baru'}
          </a>
          <a
            href="/dispensing/counseling"
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
          >
            {language === 'en' ? 'Counseling' : 'Kaunseling'}
          </a>
          <a
            href="/dispensing/inventory"
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
          >
            {language === 'en' ? 'DD Register' : 'Daftar DD'}
          </a>
          <a
            href="/dispensing/queue"
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center font-medium"
          >
            {language === 'en' ? 'Queue Management' : 'Pengurusan Giliran'}
          </a>
        </div>
      </div>
    </div>
  );
}

