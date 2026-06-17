'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../i18n/dictionary';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('pharmacy-language') as Language | null;
    if (saved === 'en' || saved === 'bm') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pharmacy-language', lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'bm' : 'en';
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { language } = useLanguage();
  return { language, t: (key: string, dict: Record<Language, string>) => dict[language] };
}

