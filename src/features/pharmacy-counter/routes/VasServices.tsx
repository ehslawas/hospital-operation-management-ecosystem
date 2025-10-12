'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import { Truck, Package, MapPin, Calendar, Car } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VasServices() {
  const { language } = useLanguage();
  const router = useRouter();

  const services = [
    {
      id: 'spub',
      name: t('vas.spub', language),
      icon: Truck,
      color: 'blue',
      count: 12,
      description: language === 'en' 
        ? 'Inter-facility medication transfers with balance tracking' 
        : 'Pemindahan ubat antara fasiliti dengan penjejakan baki',
      path: '/spub',
    },
    {
      id: 'drive-through',
      name: t('vas.drive.through', language),
      icon: Car,
      color: 'green',
      count: 8,
      description: language === 'en' 
        ? 'Pre-scheduled drive-through pickup service' 
        : 'Perkhidmatan pengambilan pandu lalu berjadual',
    },
    {
      id: 'ump',
      name: t('vas.ump', language),
      icon: Package,
      color: 'purple',
      count: 5,
      description: language === 'en' 
        ? 'Medication delivery via postal service' 
        : 'Penghantaran ubat melalui perkhidmatan pos',
    },
    {
      id: 'locker4u',
      name: t('vas.locker', language),
      icon: MapPin,
      color: 'orange',
      count: 6,
      description: language === 'en' 
        ? '24/7 automated locker pickup service' 
        : 'Perkhidmatan pengambilan loker automatik 24/7',
    },
    {
      id: 'appointment',
      name: t('vas.appointment.system', language),
      icon: Calendar,
      color: 'indigo',
      count: 15,
      description: language === 'en' 
        ? 'Pre-packed refills for scheduled appointments' 
        : 'Isian semula pra-pek untuk temujanji berjadual',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.vas', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Value-Added Services for enhanced patient convenience' 
            : 'Perkhidmatan Nilai Tambah untuk kemudahan pesakit yang lebih baik'}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
            green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-50' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-50' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:bg-indigo-50' },
          };
          const colors = colorClasses[service.color as keyof typeof colorClasses];

          return (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (service.path) {
                  router.push(service.path);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {service.count}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>
              <p className="text-sm text-gray-600">
                {service.description}
              </p>
              <button 
                className={`mt-4 w-full px-4 py-2 border-2 ${colors.text} rounded-lg ${colors.hover} transition-colors font-medium`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (service.path) {
                    router.push(service.path);
                  }
                }}
              >
                {t('common.view', language)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

