'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import type { DdRegister } from '../types/entities';
import { Package, Thermometer, AlertTriangle, FileText } from 'lucide-react';

export default function InventoryDd() {
  const { language } = useLanguage();
  const [ddRegisters, setDdRegisters] = useState<DdRegister[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDdRegisters();
  }, []);

  const loadDdRegisters = async () => {
    try {
      const response = await fetch('/api/pharmacy/dd-registers');
      const data = await response.json();
      setDdRegisters(data);
    } catch (error) {
      console.error('Failed to load DD registers:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestBalance = ddRegisters.length > 0 ? ddRegisters[0].runningBalance : 0;

  const stats = [
    {
      label: language === 'en' ? 'DD Register Entries' : 'Entri Daftar DD',
      value: ddRegisters.length,
      icon: FileText,
      color: 'blue',
    },
    {
      label: language === 'en' ? 'Current DD Balance' : 'Baki DD Semasa',
      value: latestBalance,
      icon: Package,
      color: 'green',
    },
    {
      label: language === 'en' ? 'Cold Chain Items' : 'Item Rantaian Sejuk',
      value: 5,
      icon: Thermometer,
      color: 'cyan',
    },
    {
      label: language === 'en' ? 'LASA Alerts' : 'Amaran LASA',
      value: 3,
      icon: AlertTriangle,
      color: 'yellow',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.inventory', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'DD register, cold chain monitoring, and inventory management' 
            : 'Daftar DD, pemantauan rantaian sejuk, dan pengurusan inventori'}
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
                  stat.color === 'cyan' ? 'bg-cyan-100' : 'bg-yellow-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'cyan' ? 'text-cyan-600' : 'text-yellow-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DD Register */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('pharmacy.dangerous.drugs', language)}
          </h2>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
            {language === 'en' ? 'New DD Entry' : 'Entri DD Baru'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Date' : 'Tarikh'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Medication' : 'Ubat'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Movement' : 'Pergerakan'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Quantity' : 'Kuantiti'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Balance' : 'Baki'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  {language === 'en' ? 'Witness' : 'Saksi'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {t('common.loading', language)}
                  </td>
                </tr>
              )}

              {!loading && ddRegisters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {language === 'en' ? 'No DD register entries' : 'Tiada entri daftar DD'}
                  </td>
                </tr>
              )}

              {!loading && ddRegisters.map((register) => (
                <tr key={register.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(register.date).toLocaleDateString(language === 'en' ? 'en-MY' : 'ms-MY')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {register.medicationCode}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      register.movement === 'receipt' ? 'bg-green-100 text-green-800' :
                      register.movement === 'issue' ? 'bg-blue-100 text-blue-800' :
                      register.movement === 'return' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {register.movement.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {register.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-bold">
                    {register.runningBalance}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {register.witness}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'en' ? 'DD Reconciliation' : 'Penyelarasan DD'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'en' 
              ? 'End-of-day DD register reconciliation wizard.' 
              : 'Panduan penyelarasan daftar DD akhir hari.'}
          </p>
          <button className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            {language === 'en' ? 'Start Reconciliation' : 'Mula Penyelarasan'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('pharmacy.cold.chain', language)}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'en' 
              ? 'Temperature monitoring and cold chain compliance.' 
              : 'Pemantauan suhu dan pematuhan rantaian sejuk.'}
          </p>
          <button className="w-full px-4 py-2 border border-cyan-600 text-cyan-600 rounded-lg hover:bg-cyan-50 transition-colors">
            {language === 'en' ? 'Temperature Log' : 'Log Suhu'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('pharmacy.lasa', language)}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'en' 
              ? 'LASA medication segregation and safety alerts.' 
              : 'Pengasingan ubat LASA dan amaran keselamatan.'}
          </p>
          <button className="w-full px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors">
            {language === 'en' ? 'View LASA List' : 'Lihat Senarai LASA'}
          </button>
        </div>
      </div>
    </div>
  );
}

