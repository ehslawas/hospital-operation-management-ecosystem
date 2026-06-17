'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../i18n/dictionary';
import type { AdrIncident } from '../types/entities';
import { AlertTriangle, FileText, TrendingUp } from 'lucide-react';

export default function QualitySafety() {
  const { language } = useLanguage();
  const [incidents, setIncidents] = useState<AdrIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const response = await fetch('/api/pharmacy/adr-incidents');
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error('Failed to load ADR incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: language === 'en' ? 'Total ADR Reports' : 'Jumlah Laporan ADR',
      value: incidents.length,
      icon: FileText,
      color: 'blue',
    },
    {
      label: language === 'en' ? 'Investigating' : 'Dalam Siasatan',
      value: incidents.filter(i => i.status === 'investigating').length,
      icon: AlertTriangle,
      color: 'orange',
    },
    {
      label: language === 'en' ? 'Closed Cases' : 'Kes Tertutup',
      value: incidents.filter(i => i.status === 'closed').length,
      icon: TrendingUp,
      color: 'green',
    },
  ];

  const getSeverityColor = (seriousness: AdrIncident['seriousness']) => {
    switch (seriousness) {
      case 'life-threatening': return 'bg-red-100 text-red-800 border-red-300';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'mild': return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('nav.quality', language)}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === 'en' 
            ? 'Adverse drug reactions, incident reporting, and safety monitoring' 
            : 'Reaksi ubat buruk, pelaporan insiden, dan pemantauan keselamatan'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  stat.color === 'orange' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'orange' ? 'text-orange-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADR Incidents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'en' ? 'ADR Incidents' : 'Insiden ADR'}
          </h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            {language === 'en' ? 'Report New ADR' : 'Laporkan ADR Baru'}
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {loading && (
            <div className="p-6 text-center text-gray-500">
              {t('common.loading', language)}
            </div>
          )}

          {!loading && incidents.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {language === 'en' ? 'No ADR incidents reported' : 'Tiada insiden ADR dilaporkan'}
            </div>
          )}

          {!loading && incidents.map((incident) => (
            <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(incident.seriousness)}`}>
                      {incident.seriousness.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(incident.date).toLocaleDateString(language === 'en' ? 'en-MY' : 'ms-MY')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">
                    <strong>{language === 'en' ? 'Medication' : 'Ubat'}:</strong> {incident.medicationCode}
                  </p>
                  
                  <p className="text-sm text-gray-700">
                    {incident.description}
                  </p>

                  {incident.reportedTo.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {incident.reportedTo.map((to, idx) => (
                        <span key={idx} className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          {to}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {language === 'en' ? 'Reported by' : 'Dilaporkan oleh'}: {incident.reportedBy}
                  </div>
                </div>

                <div>
                  <span className={`inline-flex px-3 py-1 rounded text-xs font-medium ${
                    incident.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Near-Miss Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {language === 'en' ? 'Near-Miss / Incident Reporting' : 'Pelaporan Hampir Berlaku / Insiden'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {language === 'en' 
            ? 'Report any near-miss events or incidents for quality improvement and learning.' 
            : 'Laporkan sebarang kejadian hampir berlaku atau insiden untuk penambahbaikan kualiti dan pembelajaran.'}
        </p>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          {language === 'en' ? 'Report Near-Miss' : 'Laporkan Hampir Berlaku'}
        </button>
      </div>
    </div>
  );
}

