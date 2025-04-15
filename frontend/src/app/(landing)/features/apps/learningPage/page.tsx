// src/app/(landing)/features/apps/learning/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Check,
  ChevronRight,
  ArrowLeft,
  Rocket,
  GraduationCap,
  Target,
  Clock,
  Settings,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import translations
import frTranslations from '@/core/i18n/translations/fr/common.json';
import enTranslations from '@/core/i18n/translations/en/common.json';
import esTranslations from '@/core/i18n/translations/es/common.json';
import nlTranslations from '@/core/i18n/translations/nl/common.json';

// Type definitions
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = typeof enTranslations;

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LearningFeature() {
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

  // Example learning paths
  const learningPaths = [
    {
      id: 'beginner',
      title: 'Beginner Path (A1-A2)',
      description: 'Perfect for absolute beginners or those with limited vocabulary',
      units: 24,
      lessons: 120,
      hours: 50,
      icon: <Rocket className="h-6 w-6" />
    },
    {
      id: 'intermediate',
      title: 'Intermediate Path (B1-B2)',
      description: 'Expand your language skills for real-world situations',
      units: 32,
      lessons: 160,
      hours: 80,
      icon: <GraduationCap className="h-6 w-6" />
    },
    {
      id: 'advanced',
      title: 'Advanced Path (C1-C2)',
      description: 'Master complex topics and nuanced expression',
      units: 20,
      lessons: 100,
      hours: 60,
      icon: <Target className="h-6 w-6" />
    },
    {
      id: 'specialized',
      title: 'Specialized Courses',
      description: 'Focus on specific domains like business, travel, or academic',
      units: 40,
      lessons: 200,
      hours: 100,
      icon: <Settings className="h-6 w-6" />
    }
  ];

  // Benefits of the learning feature
  const benefits = [
    'Personalized learning path based on your goals and level',
    'Scientifically-proven spaced repetition system',
    'Immediate feedback from AI language tutors',
    'Real-world scenarios and cultural context',
    'Progress synchronization across all your devices',
    'Offline mode for learning anywhere'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')]"></div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 25%), radial-gradient(circle at 70% 65%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 30%)'
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <Link
            href="/features"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("features.back_to_features", "Back to all features")}
          </Link>
          <div className="text-center">


            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </div>

              <h1 className="text-4xl font-bold text-white lg:text-5xl mb-6">
                {t("learning.title", "Learning")}
              </h1>

              <p className="text-xl text-indigo-100 max-w-3xl mx-auto mb-8">
                {t("learning.detailed_description", "Our adaptive learning system tailors lessons to your pace, goals, and learning style. Master vocabulary, grammar, and practical language skills through interactive exercises.")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
                    {t("learning.start_button", "Start learning now")}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all font-medium px-8 flex items-center"
                  >
                    {t("learning.pricing_button", "View pricing")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("learning.paths_title", "Learning paths for every level")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("learning.paths_description", "Whether you're just starting or looking to perfect your skills, our structured learning paths provide a clear route to fluency.")}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {learningPaths.map((path) => (
              <motion.div
                key={path.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100"
                variants={fadeIn}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-100 rounded-full p-3 flex-shrink-0">
                    {path.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
                    <p className="text-gray-600 mb-4">{path.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{path.units} units</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>{path.lessons} lessons</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>~{path.hours} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("learning.benefits_title", "Why choose our learning system?")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("learning.benefits_description", "Built with language acquisition science at its core, our learning system offers several key advantages:")}
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-indigo-100"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-gray-700">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo or Screenshot Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn}>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t("learning.interface_title", "Intuitive learning interface")}
              </h2>
              <p className="text-gray-600 mb-6">
                {t("learning.interface_description", "Our clear, distraction-free interface keeps you focused on what matters - learning effectively. With progress tracking, spaced repetition, and instant feedback, you'll learn faster than ever before.")}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-gray-700">{t("learning.feature1", "Interactive exercises with instant feedback")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-gray-700">{t("learning.feature2", "Pronunciation practice with AI speech recognition")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-gray-700">{t("learning.feature3", "Cultural context and real-world examples")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 rounded-full p-1 flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-gray-700">{t("learning.feature4", "Adaptive difficulty based on your performance")}</p>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/register">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {t("learning.try_button", "Try it yourself")}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="bg-gray-200 rounded-xl overflow-hidden shadow-md h-96 flex items-center justify-center"
              variants={fadeIn}
            >
              <div className="text-gray-500 text-center p-6">
                <p>{t("learning.screenshot_placeholder", "Interactive learning interface")}</p>
                <p className="text-sm">{t("hero.image_placeholder", "(Image not available)")}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold mb-6">
              {t("learning.cta_title", "Ready to start your language journey?")}
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              {t("learning.cta_description", "Join thousands of learners already using our platform to master new languages efficiently and enjoyably.")}
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium px-8">
                {t("learning.cta_button", "Start learning today")}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}