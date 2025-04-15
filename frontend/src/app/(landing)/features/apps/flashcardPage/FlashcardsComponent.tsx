// src/app/(landing)/features/apps/flashcardsPage/FlashcardsPageComponent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, Star, Smartphone, Database, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/app/(landing)/_components/LanguageSwitcher';

// Import translations
import frTranslations from '@/core/i18n/translations/fr/common.json';
import enTranslations from '@/core/i18n/translations/en/common.json';
import esTranslations from '@/core/i18n/translations/es/common.json';
import nlTranslations from '@/core/i18n/translations/nl/common.json';

// Type definitions
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = typeof enTranslations;

const FlashcardsPageComponent = () => {
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>('fr');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

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

      // Split the path (e.g., "flashcardsPage.title") into parts
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

  // Features section data
  const features = [
    {
      icon: <Brain className="h-10 w-10 text-indigo-500" />,
      title: t("flashcardsPage.features.spaced_repetition.title", "Répétition espacée"),
      description: t("flashcardsPage.features.spaced_repetition.description", "Notre algorithme intelligent adapte vos sessions de révision pour une mémorisation optimale basée sur votre performance."),
    },
    {
      icon: <Database className="h-10 w-10 text-indigo-500" />,
      title: t("flashcardsPage.features.extensive_library.title", "Bibliothèque extensive"),
      description: t("flashcardsPage.features.extensive_library.description", "Des milliers de cartes prêtes à l'emploi dans plus de 20 langues, couvrant le vocabulaire essentiel et les expressions courantes."),
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-indigo-500" />,
      title: t("flashcardsPage.features.progress_tracking.title", "Suivi de progression"),
      description: t("flashcardsPage.features.progress_tracking.description", "Visualisez votre évolution et identifiez vos points forts et vos faiblesses pour un apprentissage ciblé."),
    },
    {
      icon: <Smartphone className="h-10 w-10 text-indigo-500" />,
      title: t("flashcardsPage.features.mobile_sync.title", "Synchronisation mobile"),
      description: t("flashcardsPage.features.mobile_sync.description", "Accédez à vos flashcardsPage partout, même hors ligne. Synchronisation automatique entre tous vos appareils."),
    },
    {
      icon: <Star className="h-10 w-10 text-indigo-500" />,
      title: t("flashcardsPage.features.multimedia.title", "Contenus multimédias"),
      description: t("flashcardsPage.features.multimedia.description", "Enrichissez vos cartes avec images, audio et exemples contextuels pour un apprentissage multi-sensoriel."),
    },
    {
      icon: <Settings className="h-10 w-10 text-indigo-500" />,
      title: t("flashcardsPage.features.customization.title", "Personnalisation avancée"),
      description: t("flashcardsPage.features.customization.description", "Créez vos propres ensembles de cartes, organisez-les par thèmes et partagez-les avec la communauté."),
    },
  ];

  return (
    <>

      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 py-20 lg:py-32">

          <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')]"></div>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 25%)'
            }}
          ></div>

          <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8 z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl mb-6">
                  {t("flashcardsPage.hero.title", "FlashcardsPage intelligentes")}
                </h1>
                <p className="text-xl text-indigo-100 mb-8">
                  {t("flashcardsPage.hero.description", "Mémorisez du vocabulaire en un temps record grâce à notre système adaptatif basé sur la répétition espacée. Apprenez plus rapidement, retenez plus longtemps.")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                      {t("flashcardsPage.hero.cta_button", "Essayer gratuitement")}
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600">
                      {t("flashcardsPage.hero.learn_more", "En savoir plus")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Interactive Flashcard Demo */}
              <div className="flex justify-center lg:justify-end">
                <motion.div
                  className="w-80 h-56 relative perspective-1000 cursor-pointer"
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className="w-full h-full relative preserve-3d transition-all duration-500"
                    animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Card Front */}
                    <div className="absolute w-full h-full backface-hidden rounded-2xl bg-white shadow-xl p-6 flex items-center justify-center text-center">
                      <div>
                        <h3 className="text-2xl font-bold text-indigo-600 mb-2">
                          {t("flashcardsPage.demo.front_word", "Le chat")}
                        </h3>
                        <p className="text-gray-500">
                          {t("flashcardsPage.demo.tap_to_flip", "Cliquez pour retourner")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Card Back */}
                    <div 
                      className="absolute w-full h-full backface-hidden rounded-2xl bg-indigo-50 shadow-xl p-6 flex items-center justify-center text-center"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      <div>
                        <h3 className="text-2xl font-bold text-indigo-600 mb-2">
                          {t("flashcardsPage.demo.back_word", "The cat")}
                        </h3>
                        <p className="text-gray-500">
                          {t("flashcardsPage.demo.back_prompt", "Avez-vous eu juste ?")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                {t("flashcardsPage.features.title", "Caractéristiques principales")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("flashcardsPage.features.subtitle", "Découvrez pourquoi notre système de flashcardsPage révolutionne l'apprentissage des langues")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-indigo-50 rounded-xl p-8 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                {t("flashcardsPage.how_it_works.title", "Comment ça marche")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("flashcardsPage.how_it_works.subtitle", "Notre approche scientifique de la mémorisation en 4 étapes simples")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("flashcardsPage.how_it_works.step1.title", "Choisissez")}
                </h3>
                <p className="text-gray-600">
                  {t("flashcardsPage.how_it_works.step1.description", "Sélectionnez un ensemble préfait ou créez vos propres flashcardsPage personnalisées.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("flashcardsPage.how_it_works.step2.title", "Pratiquez")}
                </h3>
                <p className="text-gray-600">
                  {t("flashcardsPage.how_it_works.step2.description", "Révisez les cartes et évaluez honnêtement votre niveau de connaissance.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("flashcardsPage.how_it_works.step3.title", "Analysez")}
                </h3>
                <p className="text-gray-600">
                  {t("flashcardsPage.how_it_works.step3.description", "Notre algorithme identifie vos points faibles et ajuste votre programme.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">4</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("flashcardsPage.how_it_works.step4.title", "Maîtrisez")}
                </h3>
                <p className="text-gray-600">
                  {t("flashcardsPage.how_it_works.step4.description", "Consolidez vos connaissances avec des révisions optimisées au moment idéal.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-indigo-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              {t("flashcardsPage.cta.title", "Prêt à accélérer votre apprentissage ?")}
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              {t("flashcardsPage.cta.description", "Rejoignez des milliers d'apprenants qui ont transformé leur façon de mémoriser du vocabulaire grâce à nos flashcardsPage intelligentes.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                  {t("flashcardsPage.cta.button", "Commencer gratuitement")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Language Switcher (desktop only) */}
      <div className="fixed bottom-6 right-6 hidden md:block z-10">
        <LanguageSwitcher
          variant="dropdown"
          size="sm"
          className="shadow-md"
        />
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </>
  );
};

export default FlashcardsPageComponent;