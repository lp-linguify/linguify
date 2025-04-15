'use client';

import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/utils';

// Language options
export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

// Type pour les locales disponibles
export type AvailableLocales = 'en' | 'fr' | 'es' | 'nl';

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  alignment?: 'start' | 'end' | 'center';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  size = 'md',
  showLabels = true,
  className,
  alignment = 'end'
}) => {
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>('fr');

  // Load language from localStorage on startup
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['fr', 'en', 'es', 'nl'].includes(savedLanguage)) {
      setCurrentLocale(savedLanguage as AvailableLocales);
    }
  }, []);

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && ['fr', 'en', 'es', 'nl'].includes(savedLanguage)) {
        setCurrentLocale(savedLanguage as AvailableLocales);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  // Définir la taille des boutons en fonction de la propriété size
  const buttonSize = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4',
  }[size];

  // Handle language change
  const setLanguage = (lang: AvailableLocales) => {
    localStorage.setItem('language', lang);
    setCurrentLocale(lang);
    // Trigger an event for other components to react
    window.dispatchEvent(new Event('languageChanged'));
  };

  // Get current language object
  const currentLangObj = LANGUAGES.find(lang => lang.code === currentLocale) || LANGUAGES[0];

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Globe className="h-4 w-4 mr-2" />
            <span className="flex items-center gap-1.5">
              <span>{currentLangObj.flag}</span>
              {showLabels && <span>{currentLangObj.name}</span>}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={alignment}>
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code as AvailableLocales)}
              className={cn(
                "cursor-pointer",
                currentLocale === lang.code ? "bg-indigo-50 dark:bg-indigo-900" : ""
              )}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Buttons variant
  return (
    <div className={cn("inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1", className)}>
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code as AvailableLocales)}
          className={cn(
            `rounded-md flex items-center gap-1.5 transition-colors ${buttonSize}`,
            currentLocale === lang.code
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          )}
          aria-label={`Switch language to ${lang.name}`}
        >
          <span>{lang.flag}</span>
          {showLabels && <span className="hidden sm:inline">{lang.name}</span>}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;