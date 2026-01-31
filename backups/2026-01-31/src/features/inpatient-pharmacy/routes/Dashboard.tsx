'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dictionary } from '../i18n/dictionary';
import {
  Activity,
  Users,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Pill,
  Syringe,
  Thermometer,
  Shield,
  ClipboardList,
  FileBarChart,
} from 'lucide-react';
import Link from 'next/link';

export default function InpatientDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = dictionary[language];

  // Mock KPIs
  const kpis = {
    activePatients: 85,
    pendingOrders: 23,
    ttoInProgress: 8,
    tdmCases: 12,
    cdDiscrepancies: 1,
    coldChainAlerts: 0,
  };

  const modules = [
    {
      id: 'medrec',
      title: t.medRec,
      titleBM: 'Rekonsiliasi Ubat',
      icon: ClipboardList,
      color: 'bg-blue-500',
      href: '/inpatient/medrec',
      description: language === 'en' ? 'Admission medication reconciliation' : 'Rekonsiliasi ubat kemasukan',
      count: 15,
      badge: 'Pending',
    },
    {
      id: 'screening',
      title: t.orderScreening,
      titleBM: 'Saringan Pesanan',
      icon: FileText,
      color: 'bg-purple-500',
      href: '/inpatient/screening',
      description: language === 'en' ? 'Order verification & approval' : 'Pengesahan & kelulusan pesanan',
      count: 23,
      badge: 'Awaiting Review',
    },
    {
      id: 'uod',
      title: t.uod,
      titleBM: 'UOD',
      icon: Package,
      color: 'bg-green-500',
      href: '/inpatient/uod',
      description: language === 'en' ? 'Unit-of-dose supply' : 'Bekalan mengikut dos',
      count: 156,
      badge: 'Today',
    },
    {
      id: 'tto',
      title: t.tto,
      titleBM: 'Discaj (TTO)',
      icon: Users,
      color: 'bg-orange-500',
      href: '/inpatient/tto',
      description: language === 'en' ? 'Discharge medication & counseling' : 'Ubat discaj & kaunseling',
      count: 8,
      badge: 'In Progress',
    },
    {
      id: 'tdm',
      title: t.tdm,
      titleBM: 'TDM',
      icon: Activity,
      color: 'bg-red-500',
      href: '/inpatient/tdm',
      description: language === 'en' ? 'Therapeutic drug monitoring' : 'Pemantauan terapi ubat',
      count: 12,
      badge: 'Active',
    },
    {
      id: 'ams',
      title: t.ams,
      titleBM: 'AMS',
      icon: Shield,
      color: 'bg-indigo-500',
      href: '/inpatient/ams',
      description: language === 'en' ? 'Antimicrobial stewardship' : 'Pengurusan antimikrob',
      count: 28,
      badge: 'On Antibiotics',
    },
    {
      id: 'controlled-drugs',
      title: t.controlledDrugs,
      titleBM: 'DD & Psikotropik',
      icon: Syringe,
      color: 'bg-yellow-600',
      href: '/inpatient/controlled-drugs',
      description: language === 'en' ? 'CD register & reconciliation' : 'Daftar DD & rekonsiliasi',
      count: kpis.cdDiscrepancies,
      badge: 'Discrepancies',
    },
    {
      id: 'reports',
      title: t.reports,
      titleBM: 'Laporan',
      icon: FileBarChart,
      color: 'bg-gray-600',
      href: '/inpatient/reports',
      description: language === 'en' ? 'Analytics & KPIs' : 'Analitik & KPI',
      count: null,
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'en' ? 'In-Patient Pharmacy' : 'Farmasi Pesakit Dalam'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {user?.name} • {user?.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">{language === 'en' ? 'Today' : 'Hari Ini'}</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'ms-MY', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Active Patients' : 'Pesakit Aktif'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.activePatients}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Pending Orders' : 'Pesanan Belum Selesai'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'TTO In Progress' : 'TTO Dalam Proses'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.ttoInProgress}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'TDM Cases' : 'Kes TDM'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.tdmCases}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'CD Discrepancies' : 'Percanggahan DD'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.cdDiscrepancies}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpis.cdDiscrepancies > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {kpis.cdDiscrepancies > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Cold Chain Alerts' : 'Amaran Rantaian Sejuk'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.coldChainAlerts}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpis.coldChainAlerts > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {kpis.coldChainAlerts > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <Thermometer className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Modules' : 'Modul'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={module.href}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-gray-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <module.icon className="w-7 h-7 text-white" />
                  </div>
                  {module.badge && module.count !== null && (
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-gray-900">{module.count}</span>
                      <span className="text-xs text-gray-500">{module.badge}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

