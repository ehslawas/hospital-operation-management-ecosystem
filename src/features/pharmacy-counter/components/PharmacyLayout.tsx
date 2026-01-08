'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bed,
  Truck,
  Stethoscope,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  Package,
  Calendar,
  Settings,
  HelpCircle,
  Building2,
  Languages,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import { t } from '../i18n/dictionary';

const navigationItems = [
  { key: 'nav.dashboard', href: '/dispensing', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'nav.outpatient', href: '/dispensing/outpatient', icon: Users, label: 'Outpatient Counter' },
  { key: 'nav.inpatient', href: '/dispensing/inpatient', icon: Bed, label: 'Inpatient & Discharge (TTO)' },
  { key: 'nav.vas', href: '/dispensing/vas', icon: Truck, label: 'SPUB & VAS' },
  { key: 'nav.clinical', href: '/dispensing/clinical', icon: Stethoscope, label: 'Clinical Touchpoints' },
  { key: 'nav.counseling', href: '/dispensing/counseling', icon: MessageSquare, label: 'Counseling' },
  { key: 'nav.checklist', href: '/dispensing/checklist', icon: ClipboardList, label: 'Master Checklist' },
  { key: 'nav.quality', href: '/dispensing/quality', icon: AlertTriangle, label: 'Quality & Safety' },
  { key: 'nav.inventory', href: '/dispensing/inventory', icon: Package, label: 'Inventory & DD' },
  { key: 'nav.queue', href: '/dispensing/queue', icon: Calendar, label: 'Queue & Appointments' },
  { key: 'nav.settings', href: '/dispensing/settings', icon: Settings, label: 'Settings' },
  { key: 'nav.help', href: '/dispensing/help', icon: HelpCircle, label: 'Help' },
];

interface PharmacyLayoutProps {
  children: React.ReactNode;
}

export function PharmacyLayout({ children }: PharmacyLayoutProps) {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const { user, setRole } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState('FAC001');

  const facilities = [
    { id: 'FAC001', name: 'Hospital Kuala Lumpur' },
    { id: 'FAC002', name: 'Hospital Sultanah Aminah' },
    { id: 'FAC003', name: 'Hospital Queen Elizabeth' },
  ];

  const roles: { value: UserRole; label: string }[] = [
    { value: 'admin', label: t('role.admin', language) },
    { value: 'counter-pharmacist', label: t('role.counter.pharmacist', language) },
    { value: 'clinical-pharmacist', label: t('role.clinical.pharmacist', language) },
    { value: 'supervisor', label: t('role.supervisor', language) },
    { value: 'clerk', label: t('role.clerk', language) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4">
          <h1 className="text-lg font-bold text-gray-900">Counter</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">MAIN</span>
          </div>
          
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dispensing' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Building2 className="h-5 w-5 text-gray-600" />
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {/* Date */}
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString(language === 'en' ? 'en-MY' : 'ms-MY', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            {/* Role Switcher */}
            {user && (
              <select
                value={user.role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Languages className="h-4 w-4" />
              <span>{language === 'en' ? 'BM' : 'EN'}</span>
            </button>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-600">{user.credentialId}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

