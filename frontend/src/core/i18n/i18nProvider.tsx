// src/core/i18n/i18nProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types des langues disponibles
type AvailableLocales = 'en' | 'fr' | 'es' | 'nl';

// Structure des traductions
type Translations = Record<string, any>;

// Type pour le contexte de langue
type LanguageContextType = {
  currentLanguage: AvailableLocales;
  translations: Translations;
  setLanguage: (lang: AvailableLocales) => void;
  t: (key: string, params?: Record<string, string>) => string;
};

// Dictionnaire des modules de traduction
const translationModules = {
  en: async () => {
    try {
      const common = await import('./translations/en/common.json');
      const footer = await import('./translations/en/footer.json');
      return { ...common.default, ...footer.default };
    } catch (error) {
      console.error('Failed to load English translations:', error);
      return {};
    }
  },
  fr: async () => {
    try {
      const common = await import('./translations/fr/common.json');
      const footer = await import('./translations/fr/footer.json');
      return { ...common.default, ...footer.default };
    } catch (error) {
      console.error('Failed to load French translations:', error);
      return {};
    }
  },
  es: async () => {
    try {
      const common = await import('./translations/es/common.json');
      const footer = await import('./translations/es/footer.json');
      return { ...common.default, ...footer.default };
    } catch (error) {
      console.error('Failed to load Spanish translations:', error);
      return {};
    }
  },
  nl: async () => {
    try {
      const common = await import('./translations/nl/common.json');
      const footer = await import('./translations/nl/footer.json');
      return { ...common.default, ...footer.default };
    } catch (error) {
      console.error('Failed to load Dutch translations:', error);
      return {};
    }
  }
};

// Créer le contexte avec des valeurs par défaut
const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'fr',
  translations: {},
  setLanguage: () => {},
  t: (key) => key,
});

// Hook personnalisé pour utiliser le contexte de langue
export const useLanguage = () => useContext(LanguageContext);

// Fournisseur du contexte
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // État local pour stocker la langue courante
  const [currentLanguage, setCurrentLanguage] = useState<AvailableLocales>('fr');
  // État pour stocker les traductions
  const [translations, setTranslations] = useState<Translations>({});

  // Charger la langue depuis localStorage au démarrage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as AvailableLocales;
    if (savedLanguage && translationModules[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Charger les traductions quand la langue change
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        console.log('Loading translations for language:', currentLanguage);
        const module = await translationModules[currentLanguage]();
        setTranslations(module);
        console.log('Translations loaded successfully');
      } catch (error) {
        console.error('Error loading translations:', error);
        setTranslations({});
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  // Fonction pour changer la langue
  const setLanguage = (lang: AvailableLocales) => {
    console.log('Setting language to:', lang);
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    // Déclencher un événement pour que d'autres composants puissent réagir
    window.dispatchEvent(new Event('languageChanged'));
  };

  // Fonction de traduction
  const t = (key: string, params: Record<string, string> = {}) => {
    const keys = key.split('.');
    let value: any = translations;

    // Parcourir la hiérarchie des clés
    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        console.debug(`Translation not found for key: ${key}`);
        return key;
      }
      value = value[k];
    }

    // Remplacer les paramètres
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, p) => params[p] || _);
    }

    console.debug(`No string found for key: ${key}`);
    return key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, translations, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};