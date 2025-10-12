'use client';

import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import type { Patient } from '../types/entities';
import { useLanguage } from '../contexts/LanguageContext';

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
  disabled?: boolean;
}

export function PatientSearch({ onSelect, disabled }: PatientSearchProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchPatients = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/pharmacy/patients?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to search patients:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
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
          placeholder={language === 'en' ? 'Search by MRN, NRIC, or name...' : 'Cari dengan MRN, No. KP, atau nama...'}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {showResults && query.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-center text-gray-500">
              {language === 'en' ? 'Searching...' : 'Mencari...'}
            </div>
          )}

          {!isSearching && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {language === 'en' ? 'No patients found' : 'Tiada pesakit dijumpai'}
            </div>
          )}

          {!isSearching && results.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelect(patient)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {patient.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    MRN: {patient.mrn} • {language === 'en' ? 'NRIC' : 'No. KP'}: {patient.nric}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {patient.age} {language === 'en' ? 'years' : 'tahun'}, {patient.gender} • {patient.phone}
                  </div>
                  {patient.allergies.length > 0 && (
                    <div className="text-xs text-red-600 font-semibold mt-1">
                      ⚠️ {language === 'en' ? 'Allergies' : 'Alahan'}: {patient.allergies.join(', ')}
                    </div>
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

