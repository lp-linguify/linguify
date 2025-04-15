'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Globe,
  GraduationCap,
  Users,
  Heart
} from "lucide-react";
import FounderImage from "./_components/FounderImage";
import LanguageSwitcher from '../_components/LanguageSwitcher';

// Import translations
import frTranslations from '@/core/i18n/translations/fr/common.json';
import enTranslations from '@/core/i18n/translations/en/common.json';
import esTranslations from '@/core/i18n/translations/es/common.json';
import nlTranslations from '@/core/i18n/translations/nl/common.json';

// Type definitions
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = typeof enTranslations;

export default function Company() {
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

  // Translation helper function
  const t = useCallback((path: string, fallback: string): string => {
    try {
      // Use type assertion to bypass type checking for translations
      const translations = {
        fr: frTranslations,
        en: enTranslations,
        es: esTranslations,
        nl: nlTranslations
      } as unknown as Record<AvailableLocales, TranslationType>;

      const currentTranslation = translations[currentLocale] || translations.en;

      // Split the path (e.g., "company.title") into parts
      const keys = path.split('.');

      let value: any = currentTranslation;
      // Navigate through the object using the path
      for (const key of keys) {
        if (!value || typeof value !== 'object') {
          return fallback;
        }
        value = value[key];
      }

      return typeof value === 'string' ? value : fallback;
    } catch (error) {
      console.error('Translation error:', error);
      return fallback;
    }
  }, [currentLocale]);

  // Values with translations
  const values = useMemo(() => [
    {
      title: t("company.values.global.title", "Global Impact"),
      description: t("company.values.global.description", "Breaking down language barriers to foster international understanding and cooperation."),
      icon: <Globe className="w-6 h-6" />,
    },
    {
      title: t("company.values.education.title", "Educational Excellence"),
      description: t("company.values.education.description", "Developing innovative tools that transform how people learn and teach languages."),
      icon: <GraduationCap className="w-6 h-6" />,
    },
    {
      title: t("company.values.community.title", "Community First"),
      description: t("company.values.community.description", "Building a supportive global community of learners and educators."),
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: t("company.values.social.title", "Social Responsibility"),
      description: t("company.values.social.description", "Promoting education accessibility and professional growth worldwide."),
      icon: <Heart className="w-6 h-6" />,
    }
  ], [t]);

  // Founders with translations
  const founders = useMemo(() => [
    {
      name: t("company.founder.name", "Louis-Philippe Lalou"),
      role: t("company.founder.role", "Founder & CEO"),
      image: "/landing/img/louis-philippe.jpg",
      bio: t("company.founder.bio", "Visionary entrepreneur passionate about leveraging technology to transform education globally.")
    },
  ], [t]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white lg:text-5xl mb-6">
            {t("company.hero.title", "Empowering Global Learning")}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("company.hero.description", "Next-Corporation proudly presents Linguify - our commitment to breaking down language barriers and fostering international understanding through innovative education technology.")}
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-indigo-50 dark:bg-gray-800 rounded-2xl p-12 mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {t("company.mission.title", "Our Mission")}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t("company.mission.description", "To revolutionize language education by developing accessible, effective tools that enhance learning and teaching experiences worldwide. We believe in the power of education to transform lives and create positive global change.")}
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {t("company.values.title", "Our Values")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-indigo-600 dark:text-indigo-400">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Story Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
            {t("company.story.title", "Our Story")}
          </h2>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("company.story.paragraph1", "Founded in 2023 by Louis-Philippe Lalou and Lionel Hubaut, Linguify emerged from a shared vision to transform global education. As part of Next-Corporation, we identified the growing need for innovative language learning solutions that could bridge cultural gaps and create opportunities for people worldwide.")}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t("company.story.paragraph2", "Our focus extends beyond just language learning - we're building tools that promote international cohesion, enhance employment opportunities, and contribute to a more connected global society. Through our platform, we're making quality language education accessible to everyone, everywhere.")}
            </p>
          </div>
        </div>

        {/* Founders Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {t("company.founder.section_title", "Our Founder")}
          </h2>
          <div className="grid grid-cols-1 gap-10 max-w-3xl mx-auto">
            {founders.map((founder, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-1/3">
                  <FounderImage src={founder.image} alt={founder.name} />
                </div>
                <div className="p-6 md:w-2/3">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{founder.name}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-4">{founder.role}</p>
                  <p className="text-gray-600 dark:text-gray-400">{founder.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Language Switcher (desktop only) */}
      <div className="fixed bottom-6 right-6 hidden md:block z-10">
        <LanguageSwitcher
          variant="dropdown"
          size="sm"
          className="shadow-md"
        />
      </div>
    </div>
  );
}