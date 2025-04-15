// src/app/(landing)/features/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '../_components/LanguageSwitcher';
import NewInfo from '../_components/NewInfo';
import { getAppFeatures, FEATURE_ICONS, Feature } from '../constants/features';

// Import translations
import frTranslations from '@/core/i18n/translations/fr/common.json';
import enTranslations from '@/core/i18n/translations/en/common.json';
import esTranslations from '@/core/i18n/translations/es/common.json';
import nlTranslations from '@/core/i18n/translations/nl/common.json';

// Type definitions
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = typeof enTranslations;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export default function Features() {
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
      // This is a temporary fix until all translation files have the same structure
      const translations = {
        fr: frTranslations,
        en: enTranslations,
        es: esTranslations,
        nl: nlTranslations
      } as unknown as Record<AvailableLocales, TranslationType>;

      const currentTranslation = translations[currentLocale] || translations.en;

      // Split the path (e.g., "features.title") into parts
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

  // Generate features list with translations
  const features = useMemo(() => getAppFeatures(t), [t]);

  const FeatureCard = useCallback(({ feature }: { feature: Feature }) => {
    const FeatureIcon = FEATURE_ICONS[feature.id] || FEATURE_ICONS.learning;
  
    return (
      <Link href={feature.href} className="h-full">
        <motion.div
          key={feature.id}
          className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
          variants={itemVariants}
        >
          <div className="p-8 flex flex-col flex-grow">
            <div className="flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FeatureIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                {feature.title}
                <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </h3>
              <p className="text-gray-600 flex-grow">{feature.description}</p>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Main Features Grid with Gradient Background */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')]"></div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 25%), radial-gradient(circle at 70% 65%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 30%)'
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-white lg:text-5xl mb-6">
              {t("features.modules_title", "All Linguify Apps")}
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              {t("features.modules_description", "Discover all the tools Linguify offers to make your language learning journey effective and enjoyable.")}
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {features.map(feature => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </motion.div>

          <div className="text-center mt-8 text-white">
            <p>{t("features.click_to_explore", "Click on any feature to explore its dedicated application")}</p>
          </div>
        </div>
      </section>

      {/* New Info Component */}
      <NewInfo variant="default" />

      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t("features.cta.title", "Ready to transform your language learning?")}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t("features.cta.description", "Join thousands of learners who have already transformed their approach to language learning.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                  {t("features.cta.button", "Start your journey")}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  {t("features.cta.pricing_button", "View pricing")}
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <Link href="/features" className="text-indigo-600 hover:text-indigo-800 flex items-center justify-center">
                <span>{t("features.explore_all_apps", "Explore all our applications")}</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

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