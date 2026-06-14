'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import { CheckCircle, Circle, FileDown } from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  item: { en: string; bm: string };
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export default function MasterChecklist() {
  const { language } = useLanguage();
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      category: 'Daily Operations',
      item: { en: 'DD register reconciliation', bm: 'Penyelarasan daftar DD' },
      completed: false,
    },
    {
      id: '2',
      category: 'Daily Operations',
      item: { en: 'Cold chain temperature monitoring', bm: 'Pemantauan suhu rantaian sejuk' },
      completed: false,
    },
    {
      id: '3',
      category: 'Patient Care',
      item: { en: 'Outpatient prescription screening', bm: 'Saringan preskripsi pesakit luar' },
      completed: true,
    },
    {
      id: '4',
      category: 'Patient Care',
      item: { en: 'Discharge (TTO) dispensing', bm: 'Pengeluaran pelepasan (TTO)' },
      completed: true,
    },
    {
      id: '5',
      category: 'Patient Care',
      item: { en: 'Medication counseling', bm: 'Kaunseling ubat' },
      completed: false,
    },
    {
      id: '6',
      category: 'VAS Services',
      item: { en: 'SPUB verification and dispensing', bm: 'Pengesahan dan pengeluaran SPUB' },
      completed: false,
    },
    {
      id: '7',
      category: 'VAS Services',
      item: { en: 'Drive-through appointments', bm: 'Temujanji pandu lalu' },
      completed: false,
    },
    {
      id: '8',
      category: 'VAS Services',
      item: { en: 'UMP parcel processing', bm: 'Pemprosesan parsel UMP' },
      completed: false,
    },
    {
      id: '9',
      category: 'VAS Services',
      item: { en: 'Locker4U loading', bm: 'Pemuatan Locker4U' },
      completed: false,
    },
    {
      id: '10',
      category: 'Clinical Services',
      item: { en: 'MTAC sessions', bm: 'Sesi MTAC' },
      completed: false,
    },
    {
      id: '11',
      category: 'Clinical Services',
      item: { en: 'Medication reconciliation', bm: 'Penyelarasan ubat' },
      completed: false,
    },
    {
      id: '12',
      category: 'Quality & Safety',
      item: { en: 'ADR monitoring and reporting', bm: 'Pemantauan dan pelaporan ADR' },
      completed: false,
    },
    {
      id: '13',
      category: 'Quality & Safety',
      item: { en: 'Near-miss incident documentation', bm: 'Dokumentasi insiden hampir berlaku' },
      completed: false,
    },
    {
      id: '14',
      category: 'Inventory',
      item: { en: 'Stock level monitoring', bm: 'Pemantauan tahap stok' },
      completed: false,
    },
    {
      id: '15',
      category: 'Inventory',
      item: { en: 'Expiry date checking', bm: 'Pemeriksaan tarikh luput' },
      completed: false,
    },
    {
      id: '16',
      category: 'Administration',
      item: { en: 'Queue management', bm: 'Pengurusan giliran' },
      completed: false,
    },
    {
      id: '17',
      category: 'Administration',
      item: { en: 'Appointment scheduling', bm: 'Penjadualan temujanji' },
      completed: false,
    },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const categories = Array.from(new Set(items.map(item => item.category)));
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleExport = () => {
    alert(language === 'en' ? 'Exporting checklist to PDF...' : 'Mengeksport senarai semak ke PDF...');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.checklist', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Comprehensive service catalogue and daily operational checklist' 
            : 'Katalog perkhidmatan menyeluruh dan senarai semak operasi harian'}
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Today\'s Progress' : 'Kemajuan Hari Ini'}
            </h2>
            <p className="text-sm text-gray-600">
              {completedCount} / {totalCount} {language === 'en' ? 'completed' : 'selesai'}
            </p>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {progress}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist by Category */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryItems = items.filter(item => item.category === category);
          const categoryCompleted = categoryItems.filter(item => item.completed).length;

          return (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {categoryCompleted} / {categoryItems.length}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                        {item.item[language]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileDown className="h-4 w-4" />
          {t('common.export', language)} PDF
        </button>
      </div>
    </div>
  );
}

