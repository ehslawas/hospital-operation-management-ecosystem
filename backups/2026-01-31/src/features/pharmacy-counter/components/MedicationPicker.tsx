'use client';

import { useState, useEffect } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import type { Medication } from '../types/entities';

interface MedicationPickerProps {
  onSelect: (medication: Medication, defaults: {
    dose: string;
    frequency: string;
    route: string;
  }) => void;
  disabled?: boolean;
}

export function MedicationPicker({ onSelect, disabled }: MedicationPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Medication[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchMedications = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/pharmacy/medications?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to search medications:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchMedications, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (medication: Medication) => {
    // Auto-fill defaults from medication rules
    const defaults = {
      dose: medication.defaultDoseRules.adult || medication.strength,
      frequency: extractFrequency(medication.defaultDoseRules.adult || ''),
      route: getRouteFromForm(medication.form),
    };

    onSelect(medication, defaults);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search medication by name or code..."
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {showResults && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          )}

          {!isSearching && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No medications found
            </div>
          )}

          {!isSearching && results.map((med) => (
            <button
              key={med.id}
              onClick={() => handleSelect(med)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {med.nameFull}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {med.genericName} • {med.code}
                  </div>
                  {med.defaultDoseRules.adult && (
                    <div className="text-xs text-gray-500 mt-1">
                      Default: {med.defaultDoseRules.adult}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {med.ddFlag && (
                    <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded">
                      DD
                    </span>
                  )}
                  {med.psychotropicFlag && (
                    <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                      PSY
                    </span>
                  )}
                  {med.coldChainFlag && (
                    <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                      ❄️
                    </span>
                  )}
                  {med.lasaFlag && (
                    <span className="inline-flex px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                      LASA
                    </span>
                  )}
                  {med.highAlertFlag && (
                    <span className="inline-flex px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      HIGH
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
function extractFrequency(doseRule: string): string {
  const patterns = [
    { regex: /\bOD\b/i, value: 'OD' },
    { regex: /\bBD\b/i, value: 'BD' },
    { regex: /\bTDS\b/i, value: 'TDS' },
    { regex: /\bQID\b/i, value: 'QID' },
    { regex: /\bQ\d+H\b/i, value: doseRule.match(/Q\d+H/i)?.[0] || 'OD' },
    { regex: /\bPRN\b/i, value: 'PRN' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(doseRule)) {
      return pattern.value;
    }
  }

  return 'OD';
}

function getRouteFromForm(form: string): string {
  const formLower = form.toLowerCase();
  
  if (formLower.includes('tablet') || formLower.includes('capsule') || formLower.includes('syrup')) {
    return 'PO';
  }
  if (formLower.includes('injection') || formLower.includes('inj')) {
    return 'IV/IM/SC';
  }
  if (formLower.includes('inhaler') || formLower.includes('inh')) {
    return 'Inhalation';
  }
  if (formLower.includes('cream') || formLower.includes('ointment')) {
    return 'Topical';
  }
  if (formLower.includes('drops')) {
    return 'Eye/Ear';
  }
  
  return 'PO';
}

