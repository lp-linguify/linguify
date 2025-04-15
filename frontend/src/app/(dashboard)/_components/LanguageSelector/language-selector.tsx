'use client';

import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { useTranslation } from "@/core/i18n/useTranslations";
import { useToast } from "@/components/ui/use-toast";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { t, locale, changeLanguage } = useTranslation();
  const { toast } = useToast();
  
  const handleLanguageChange = (value: string) => {
    changeLanguage(value as any);
    toast({
      title: t('dashboard.header.languageChanged'),
      description: t('dashboard.header.languageSetTo', { language: value.toUpperCase() }),
    });
  };
  
  return (
    <Select onValueChange={handleLanguageChange} defaultValue={locale}>
      <SelectTrigger 
        className={`w-32 dark:bg-transparent dark:border-none dark:text-gray-200 ${className}`}>
        <SelectValue placeholder={t('dashboard.header.language')} />
      </SelectTrigger>
      <SelectContent
        className="w-32 bg-background dark:bg-gray-900/70 backdrop-blur-xl shadow-lg border dark:border-gray-700/20"
      >
        <SelectItem value="en">{t('dashboard.header.english')}</SelectItem>
        <SelectItem value="fr">{t('dashboard.header.french')}</SelectItem>
        <SelectItem value="es">{t('dashboard.header.spanish')}</SelectItem>
        <SelectItem value="nl">{t('dashboard.header.dutch')}</SelectItem>
      </SelectContent>
    </Select>
  );
}