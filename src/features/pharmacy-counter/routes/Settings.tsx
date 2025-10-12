'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import { Users, Building2, Package, FileText, Tag } from 'lucide-react';

export default function Settings() {
  const { language } = useLanguage();

  const settingSections = [
    {
      id: 'users',
      name: language === 'en' ? 'Users & Roles' : 'Pengguna & Peranan',
      icon: Users,
      description: language === 'en' 
        ? 'Manage user accounts, roles, and permissions' 
        : 'Urus akaun pengguna, peranan, dan kebenaran',
      color: 'blue',
    },
    {
      id: 'facilities',
      name: language === 'en' ? 'Facilities' : 'Fasiliti',
      icon: Building2,
      description: language === 'en' 
        ? 'Configure facilities, departments, and locations' 
        : 'Konfigurasi fasiliti, jabatan, dan lokasi',
      color: 'green',
    },
    {
      id: 'medications',
      name: language === 'en' ? 'Medication Master' : 'Induk Ubat',
      icon: Package,
      description: language === 'en' 
        ? 'Manage medication database, DD/psychotropic flags, LASA tags' 
        : 'Urus pangkalan data ubat, bendera DD/psikotropik, tag LASA',
      color: 'purple',
    },
    {
      id: 'labels',
      name: language === 'en' ? 'Labels & Templates' : 'Label & Templat',
      icon: Tag,
      description: language === 'en' 
        ? 'Configure bilingual labels, cautionary statements, and leaflet templates' 
        : 'Konfigurasi label dwibahasa, pernyataan amaran, dan templat risalah',
      color: 'orange',
    },
    {
      id: 'system',
      name: language === 'en' ? 'System Settings' : 'Tetapan Sistem',
      icon: FileText,
      description: language === 'en' 
        ? 'General system configuration and preferences' 
        : 'Konfigurasi sistem umum dan keutamaan',
      color: 'gray',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.settings', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Configure users, facilities, medications, and system preferences' 
            : 'Konfigurasi pengguna, fasiliti, ubat, dan keutamaan sistem'}
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
            green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
            gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
          };
          const colors = colorClasses[section.color as keyof typeof colorClasses];

          return (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg} flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {section.description}
                  </p>
                  <button className={`px-4 py-2 ${colors.text} border-2 ${colors.border} rounded-lg hover:${colors.bg} transition-colors text-sm font-medium`}>
                    {language === 'en' ? 'Configure' : 'Konfigurasi'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'en' ? 'Quick Actions' : 'Tindakan Pantas'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            {language === 'en' ? 'Backup Database' : 'Sandaran Pangkalan Data'}
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            {language === 'en' ? 'Export Reports' : 'Eksport Laporan'}
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            {language === 'en' ? 'System Logs' : 'Log Sistem'}
          </button>
        </div>
      </div>
    </div>
  );
}

