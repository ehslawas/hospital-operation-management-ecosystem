'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { DrugInteraction } from '../types/entities';
import { useLanguage } from '../contexts/LanguageContext';

interface InteractionAlertProps {
  interactions: DrugInteraction[];
  onAcknowledge?: (interactionId: string, reason: string) => void;
}

export function InteractionAlert({ interactions, onAcknowledge }: InteractionAlertProps) {
  const { language } = useLanguage();

  if (interactions.length === 0) return null;

  const getSeverityConfig = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'contraindicated':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          label: { en: 'CONTRAINDICATED', bm: 'KONTRAINDIKASI' },
        };
      case 'major':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
          label: { en: 'MAJOR', bm: 'MAJOR' },
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          label: { en: 'MODERATE', bm: 'SEDERHANA' },
        };
      case 'minor':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: Info,
          iconColor: 'text-blue-600',
          label: { en: 'MINOR', bm: 'MINOR' },
        };
    }
  };

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => {
        const config = getSeverityConfig(interaction.severity);
        const Icon = config.icon;

        return (
          <div
            key={interaction.id}
            className={`${config.bg} ${config.border} border rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex px-2 py-0.5 ${config.bg} ${config.text} text-xs font-bold rounded border ${config.border}`}>
                    {config.label[language]}
                  </span>
                  <span className={`text-sm font-semibold ${config.text}`}>
                    {language === 'en' ? 'Drug Interaction Detected' : 'Interaksi Ubat Dikesan'}
                  </span>
                </div>

                <div className={`text-sm ${config.text} mb-2`}>
                  <strong>{interaction.message[language]}</strong>
                </div>

                <div className={`text-sm ${config.text} mb-3`}>
                  <strong>{language === 'en' ? 'Recommendation:' : 'Cadangan:'}</strong>{' '}
                  {interaction.recommendation[language]}
                </div>

                {onAcknowledge && (
                  <button
                    onClick={() => {
                      const reason = prompt(
                        language === 'en'
                          ? 'Please provide a reason for proceeding despite this interaction:'
                          : 'Sila berikan sebab untuk meneruskan walaupun interaksi ini:'
                      );
                      if (reason) {
                        onAcknowledge(interaction.id, reason);
                      }
                    }}
                    className={`px-3 py-1.5 bg-white ${config.text} border ${config.border} rounded text-xs font-medium hover:bg-gray-50 transition-colors`}
                  >
                    {language === 'en' ? 'Acknowledge & Proceed' : 'Akui & Teruskan'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

