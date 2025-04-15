// src/hooks/useTranslation.ts
import { useState, useEffect, useCallback } from 'react';

// Dynamically import translation files
const translationModules = {
  en: async () => {
    try {
      const common = await import('./translations/en/common.json');
      const footer = await import('./translations/en/footer.json');
      const sidebar = await import('./translations/en/sidebar.json');
      const dashboard = await import('./translations/en/dashboard.json');
      
      // Note the change here: dashboard is now a nested object instead of being spread
      return { 
        ...common.default, 
        ...footer.default, 
        ...sidebar.default,
        dashboard: dashboard.default
      };
    } catch (error) {
      console.error('Error loading English translations:', error);
      // Return at least an empty dashboard object in case of error
      return { dashboard: {} };
    }
  },
  fr: async () => {
    try {
      const common = await import('./translations/fr/common.json');
      const footer = await import('./translations/fr/footer.json');
      const sidebar = await import('./translations/fr/sidebar.json');
      const dashboard = await import('./translations/fr/dashboard.json');
      
      return { 
        ...common.default, 
        ...footer.default, 
        ...sidebar.default,
        dashboard: dashboard.default
      };
    } catch (error) {
      console.error('Error loading French translations:', error);
      // Use English dashboard as fallback
      const enDashboard = await import('./translations/en/dashboard.json').catch(() => ({ default: {} }));
      return { dashboard: enDashboard.default || {} };
    }
  },
  es: async () => {
    try {
      const common = await import('./translations/es/common.json');
      const footer = await import('./translations/es/footer.json');
      const sidebar = await import('./translations/es/sidebar.json');
      const dashboard = await import('./translations/es/dashboard.json');
      
      return { 
        ...common.default, 
        ...footer.default, 
        ...sidebar.default,
        dashboard: dashboard.default
      };
    } catch (error) {
      console.error('Error loading Spanish translations:', error);
      // Use English dashboard as fallback
      const enDashboard = await import('./translations/en/dashboard.json').catch(() => ({ default: {} }));
      return { dashboard: enDashboard.default || {} };
    }
  },
  nl: async () => {
    try {
      const common = await import('./translations/nl/common.json');
      const footer = await import('./translations/nl/footer.json');
      const sidebar = await import('./translations/nl/sidebar.json');
      const dashboard = await import('./translations/nl/dashboard.json');
      
      return { 
        ...common.default, 
        ...footer.default, 
        ...sidebar.default,
        dashboard: dashboard.default
      };
    } catch (error) {
      console.error('Error loading Dutch translations:', error);
      // Use English dashboard as fallback
      const enDashboard = await import('./translations/en/dashboard.json').catch(() => ({ default: {} }));
      return { dashboard: enDashboard.default || {} };
    }
  }
};

type AvailableLocales = keyof typeof translationModules;
type TranslationFunction = (key: string, params?: Record<string, string>, fallback?: string) => string;

// Create a singleton to share language state between components
let currentLocale: AvailableLocales = 'en';
const listeners: (() => void)[] = [];

// Function to notify all translation hooks of a change
const notifyLocaleChange = () => {
  listeners.forEach(listener => listener());
};

// Load saved language at module initialization
if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('language') as AvailableLocales | null;
  if (savedLanguage && translationModules[savedLanguage]) {
    currentLocale = savedLanguage;
  }
}

// Direct import of dashboard.json for fallback
let dashboardFallback = {};
if (typeof window !== 'undefined') {
  // In browser, we can try to load the dashboard.json file directly
  fetch('/dashboard.json')
    .then(response => response.json())
    .then(data => {
      dashboardFallback = data;
    })
    .catch(err => {
      console.warn('Could not load dashboard fallback:', err);
    });
}

export function useTranslation() {
  const [locale, setLocale] = useState<AvailableLocales>(currentLocale);
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to language changes
  useEffect(() => {
    const handleChange = () => {
      setLocale(currentLocale);
    };
    
    listeners.push(handleChange);
    
    return () => {
      const index = listeners.indexOf(handleChange);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  // Load translations when language changes
  useEffect(() => {
    let isMounted = true;
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        console.log('Loading translations for locale:', locale);
        const module = await translationModules[locale]();
        if (isMounted) {
          setTranslations(module);
          console.log('Translations loaded:', Object.keys(module).length, 'entries');
        }
      } catch (error) {
        console.error('Translation load error:', error);
        if (isMounted) {
          // At minimum, ensure we have a dashboard object
          setTranslations({ dashboard: dashboardFallback });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTranslations();
    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Translation function with fallback support
  const t: TranslationFunction = useCallback((key, params = {}, fallback) => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        console.debug(`Translation not found for key: ${key}, current locale: ${locale}`);
        return fallback || key;
      }
      value = value[k];
    }

    // Simple parameter replacement
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, p) => params[p] !== undefined ? params[p] : `{${p}}`);
    }

    console.debug(`No translation string found for key: ${key}, got:`, value);
    return fallback || key;
  }, [translations, locale]);

  // Language change handler
  const changeLanguage = useCallback((newLocale: AvailableLocales) => {
    console.log('Changing language to:', newLocale);
    
    // Update the singleton
    currentLocale = newLocale;
    
    // Update localStorage
    localStorage.setItem('language', newLocale);
    
    // Notify other hook instances
    notifyLocaleChange();
    
    // Emit event for other components (for backward compatibility)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('languageChanged'));
    }
  }, []);

  return {
    t,
    locale,
    changeLanguage,
    isLoading
  };
}