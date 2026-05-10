'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { en } from '@/i18n/en';
import { id } from '@/i18n/id';

type Language = 'en' | 'id';

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('care-connect-lang');
      if (stored === 'en' || stored === 'id') return stored;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('care-connect-lang', lang);
  };

  const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
    return (path.split('.').reduce((acc: unknown, part: string) =>
      acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      obj
    ) as string) || path;
  };

  const t = (key: string): string => {
    const dict = language === 'en' ? en : id;
    return getNestedValue(dict, key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
