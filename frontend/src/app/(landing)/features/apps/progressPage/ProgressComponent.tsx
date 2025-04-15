// src/app/(landing)/features/apps/progressPage/ProgressPageComponent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Trophy,
  LineChart,
  BarChart2,
  Share2,
  Zap
} from 'lucide-react';
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

const ProgressPageComponent = () => {
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>('fr');
  const [activeTab, setActiveTab] = useState('weekly');

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

      // Split the path (e.g., "progressPage.title") into parts
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
      icon: <BarChart2 className="h-10 w-10 text-indigo-500" />,
      title: t("progressPage.features.stats.title", "Statistiques détaillées"),
      description: t("progressPage.features.stats.description", "Suivez votre temps d'étude, votre maîtrise du vocabulaire, vos compétences en grammaire et bien plus encore avec des métriques avancées."),
    },
    {
      icon: <Target className="h-10 w-10 text-indigo-500" />,
      title: t("progressPage.features.goals.title", "Objectifs personnalisés"),
      description: t("progressPage.features.goals.description", "Définissez des objectifs quotidiens, hebdomadaires ou mensuels adaptés à votre rythme et vos ambitions linguistiques."),
    },
    {
      icon: <LineChart className="h-10 w-10 text-indigo-500" />,
      title: t("progressPage.features.trends.title", "Analyse des tendances"),
      description: t("progressPage.features.trends.description", "Identifiez vos points forts et vos faiblesses grâce à des visualisations claires de vos performances au fil du temps."),
    },
    {
      icon: <Trophy className="h-10 w-10 text-indigo-500" />,
      title: t("progressPage.features.achievements.title", "Réussites et badges"),
      description: t("progressPage.features.achievements.description", "Maintenez votre motivation avec un système de récompenses qui célèbre chaque étape de votre progressPageion."),
    },
    {
      icon: <Share2 className="h-10 w-10 text-indigo-500" />,
      title: t("progressPage.features.sharing.title", "Partage social"),
      description: t("progressPage.features.sharing.description", "Partagez vos réussites avec vos amis ou rejoignez des défis communautaires pour une motivation supplémentaire."),
    },
    {
      icon: <Zap className="h-10 w-10 text-indigo-500" />,
      title: t("progressPage.features.insights.title", "Insights personnalisés"),
      description: t("progressPage.features.insights.description", "Recevez des recommandations adaptées à votre profil d'apprentissage pour optimiser votre progressPageion."),
    },
  ];

  // Weekly progressPage data for demo visualization
  const weeklyData = [
    { day: t("progressPage.demo.weekdays.monday", "Lun"), minutes: 45, words: 32, goal: 30 },
    { day: t("progressPage.demo.weekdays.tuesday", "Mar"), minutes: 30, words: 24, goal: 30 },
    { day: t("progressPage.demo.weekdays.wednesday", "Mer"), minutes: 60, words: 48, goal: 30 },
    { day: t("progressPage.demo.weekdays.thursday", "Jeu"), minutes: 20, words: 18, goal: 30 },
    { day: t("progressPage.demo.weekdays.friday", "Ven"), minutes: 50, words: 38, goal: 30 },
    { day: t("progressPage.demo.weekdays.saturday", "Sam"), minutes: 75, words: 52, goal: 30 },
    { day: t("progressPage.demo.weekdays.sunday", "Dim"), minutes: 40, words: 29, goal: 30 },
  ];

  // Achievements data for demo
  const achievements = [
    { name: t("progressPage.demo.achievements.first_lesson", "Première leçon"), completed: true, date: "02/03/2025" },
    { name: t("progressPage.demo.achievements.week_streak", "Séquence de 7 jours"), completed: true, date: "09/03/2025" },
    { name: t("progressPage.demo.achievements.vocabulary_master", "Maître du vocabulaire"), completed: false, progressPage: 65 },
    { name: t("progressPage.demo.achievements.grammar_guru", "Gourou de la grammaire"), completed: false, progressPage: 42 },
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
                  {t("progressPage.hero.title", "Suivez votre progressPageion")}
                </h1>
                <p className="text-xl text-indigo-100 mb-8">
                  {t("progressPage.hero.description", "Visualisez vos progrès linguistiques, définissez des objectifs atteignables et restez motivé tout au long de votre parcours d'apprentissage.")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                      {t("progressPage.hero.cta_button", "Essayer gratuitement")}
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600">
                      {t("progressPage.hero.learn_more", "En savoir plus")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Interactive ProgressPage Dashboard Demo */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="bg-indigo-700 p-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-white font-medium">Linguify ProgressPage Dashboard</div>
                  <div></div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">
                      {t("progressPage.demo.summary_title", "Résumé d'activité")}
                    </h3>
                    <div className="flex border rounded-lg overflow-hidden">
                      <button 
                        className={`px-3 py-1 text-sm font-medium ${activeTab === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setActiveTab('weekly')}
                      >
                        {t("progressPage.demo.weekly", "Hebdo")}
                      </button>
                      <button 
                        className={`px-3 py-1 text-sm font-medium ${activeTab === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                        onClick={() => setActiveTab('monthly')}
                      >
                        {t("progressPage.demo.monthly", "Mensuel")}
                      </button>
                    </div>
                  </div>
                  
                  {/* Activity Chart */}
                  <div className="mb-6">
                    <div className="h-48 flex items-end space-x-2">
                      {weeklyData.map((day, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center space-y-1">
                            <div 
                              className="w-full bg-indigo-600 rounded-t"
                              style={{ height: `${(day.minutes / 75) * 100}%`, maxHeight: '100%' }}
                            ></div>
                            <div className="text-xs text-gray-500">{day.day}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                      <div className="text-2xl font-bold text-gray-800">320</div>
                      <div className="text-xs text-gray-500">{t("progressPage.demo.stats.minutes", "minutes")}</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                      <div className="text-2xl font-bold text-gray-800">241</div>
                      <div className="text-xs text-gray-500">{t("progressPage.demo.stats.words", "mots appris")}</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <Award className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                      <div className="text-2xl font-bold text-gray-800">7</div>
                      <div className="text-xs text-gray-500">{t("progressPage.demo.stats.days", "jours consécutifs")}</div>
                    </div>
                  </div>
                  
                  {/* Achievements */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">
                      {t("progressPage.demo.achievements_title", "Réussites récentes")}
                    </h4>
                    <div className="space-y-2">
                      {achievements.map((achievement, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${achievement.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {achievement.completed ? '✓' : '○'}
                            </div>
                            <span className="ml-2 text-sm">{achievement.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {achievement.completed ? achievement.date : `${achievement.progressPage}%`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                {t("progressPage.features.title", "Fonctionnalités principales")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("progressPage.features.subtitle", "Découvrez comment notre système de suivi de progressPageion transforme votre expérience d'apprentissage")}
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
                {t("progressPage.how_it_works.title", "Comment ça marche")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("progressPage.how_it_works.subtitle", "Notre approche scientifique du suivi de progressPageion en 4 étapes simples")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("progressPage.how_it_works.step1.title", "Définir")}
                </h3>
                <p className="text-gray-600">
                  {t("progressPage.how_it_works.step1.description", "Établissez des objectifs linguistiques clairs et atteignables en fonction de votre niveau et de votre disponibilité.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("progressPage.how_it_works.step2.title", "Mesurer")}
                </h3>
                <p className="text-gray-600">
                  {t("progressPage.how_it_works.step2.description", "Suivez automatiquement vos activités d'apprentissage et vos performances à travers toutes les fonctionnalités de Linguify.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("progressPage.how_it_works.step3.title", "Analyser")}
                </h3>
                <p className="text-gray-600">
                  {t("progressPage.how_it_works.step3.description", "Visualisez vos progrès et identifiez vos forces et faiblesses grâce à des graphiques et analyses détaillés.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">4</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("progressPage.how_it_works.step4.title", "Optimiser")}
                </h3>
                <p className="text-gray-600">
                  {t("progressPage.how_it_works.step4.description", "Recevez des recommandations personnalisées pour ajuster votre apprentissage et maximiser vos progrès.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                {t("progressPage.benefits.title", "Les bénéfices du suivi de progressPageion")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-indigo-700 mb-3">
                  {t("progressPage.benefits.benefit1.title", "Motivation constante")}
                </h3>
                <p className="text-gray-700">
                  {t("progressPage.benefits.benefit1.description", "Visualiser vos progrès vous aide à rester motivé même lorsque l'apprentissage devient difficile. Nos graphiques et récompenses vous rappellent constamment le chemin déjà parcouru.")}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-indigo-700 mb-3">
                  {t("progressPage.benefits.benefit2.title", "Apprentissage ciblé")}
                </h3>
                <p className="text-gray-700">
                  {t("progressPage.benefits.benefit2.description", "Ne perdez plus de temps sur des compétences déjà maîtrisées. Notre système identifie précisément les domaines qui nécessitent plus d'attention pour un apprentissage efficace.")}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-indigo-700 mb-3">
                  {t("progressPage.benefits.benefit3.title", "Responsabilisation")}
                </h3>
                <p className="text-gray-700">
                  {t("progressPage.benefits.benefit3.description", "Les objectifs et le suivi quotidien vous aident à développer une routine d'apprentissage durable. Transformez votre apprentissage linguistique en une habitude positive à long terme.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-indigo-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              {t("progressPage.cta.title", "Prêt à transformer vos objectifs en réalisations ?")}
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              {t("progressPage.cta.description", "Rejoignez des milliers d'apprenants qui ont atteint leurs objectifs linguistiques grâce à notre système de suivi de progressPageion.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                  {t("progressPage.cta.button", "Commencer gratuitement")}
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
    </>
  );
};

export default ProgressPageComponent;