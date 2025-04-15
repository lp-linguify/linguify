// src/app/(landing)/home/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import NewInfo from '../_components/NewInfo';
import LanguageSwitcher from '../_components/LanguageSwitcher';
import { getAppFeatures } from '../constants/features';
// Import translations
import enTranslations from "@/core/i18n/translations/en/common.json";
import frTranslations from "@/core/i18n/translations/fr/common.json";
import esTranslations from "@/core/i18n/translations/es/common.json";
import nlTranslations from "@/core/i18n/translations/nl/common.json";

// Type definitions for our translations
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
// Instead of using the exact structure, make a more flexible type
type TranslationType = {
  [key: string]: any;
};

export default function Home() {
  const [activeLanguage, setActiveLanguage] = useState('spanish');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>('fr');

  // Available languages
  const languages = [
    { id: 'spanish', code: 'es', name: 'Español', flag: '🇪🇸', color: 'bg-red-500' },
    { id: 'english', code: 'en', name: 'English', flag: '🇬🇧', color: 'bg-blue-600' },
    { id: 'french', code: 'fr', name: 'Français', flag: '🇫🇷', color: 'bg-indigo-500' },
    { id: 'dutch', code: 'nl', name: 'Nederlands', flag: '🇳🇱', color: 'bg-orange-500' },
  ];

  // Load language from localStorage on startup
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['fr', 'en', 'es', 'nl'].includes(savedLanguage)) {
      setCurrentLocale(savedLanguage as AvailableLocales);

      // Also set the active language based on the UI language
      const matching = languages.find(l => l.code === savedLanguage);
      if (matching) {
        setActiveLanguage(matching.id);
      }
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
  const t = (path: string, fallback: string): string => {
    try {
      const translations: Record<AvailableLocales, TranslationType> = {
        fr: frTranslations,
        en: enTranslations,
        es: esTranslations,
        nl: nlTranslations,

      };

      const currentTranslation = translations[currentLocale] || translations.en;

      // Split the path (e.g., "hero.title") into parts
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
  };

  // Testimonials
  const testimonials = useMemo(() => [
    {
      name: 'Louis',
      role: t('testimonials.louis.role', 'Customer Service Manager'),
      text: t('testimonials.louis.text', "Linguify a transformé mon apprentissage du français. En 3 mois, j'ai atteint un niveau que je n'aurais jamais cru possible !"),
      avatar: '/img/avatar1.png',
    },
    {
      name: 'Victor',
      role: t('testimonials.victor.role', 'Project Director'),
      text: t('testimonials.victor.text', "Les flashcards et les exercices interactifs m'ont aidé à mémoriser facilement du vocabulaire technique en allemand."),
      avatar: '/img/avatar2.png',
    },
    {
      name: 'Camille',
      role: t('testimonials.camille.role', 'Risk and Strategic Analyst'),
      text: t('testimonials.camille.text', "Grâce à Linguify, j'ai pu communiquer avec les locaux lors de mon voyage à travers l'Espagne. Une expérience incroyable !"),
      avatar: '/img/avatar3.png',
    },
  ], [currentLocale, t]);

  // Features
  const features = useMemo(() => getAppFeatures(t), [t]);
  // Pricing plans
  const pricingPlans = useMemo(() => [
    {
      name: t('pricing.free.name', "Gratuit"),
      price: t('pricing.free.price', "0€"),
      period: t('pricing.free.period', "pour toujours"),
      description: t('pricing.free.description', "Parfait pour débuter et tester l'application"),
      features: [
        t('pricing.free.feature1', "1 langue au choix"),
        t('pricing.free.feature2', "Accès aux leçons de base"),
        t('pricing.free.feature3', "5 minutes de chat par jour"),
        t('pricing.free.feature4', "Révisions limitées")
      ],
      cta: t('pricing.free.cta', "Commencer gratuitement"),
      popular: false
    },
    {
      name: t('pricing.premium.name', "Premium"),
      price: t('pricing.premium.price', "9,99€"),
      period: t('pricing.premium.period', "par mois"),
      description: t('pricing.premium.description', "Notre formule la plus populaire pour progresser"),
      features: [
        t('pricing.premium.feature1', "Toutes les langues accessibles"),
        t('pricing.premium.feature2', "Leçons avancées et spécialisées"),
        t('pricing.premium.feature3', "Chat illimité avec l'IA"),
        t('pricing.premium.feature4', "Système complet de révision"),
        t('pricing.premium.feature5', "Coaching hebdomadaire")
      ],
      cta: t('pricing.premium.cta', "Essai gratuit de 7 jours"),
      popular: true
    },
    {
      name: t('pricing.enterprise.name', "Entreprise"),
      price: t('pricing.enterprise.price', "Sur mesure"),
      period: t('pricing.enterprise.period', ""),
      description: t('pricing.enterprise.description', "Solution complète pour les équipes"),
      features: [
        t('pricing.enterprise.feature1', "Formations personnalisées"),
        t('pricing.enterprise.feature2', "Tableau de bord d'entreprise"),
        t('pricing.enterprise.feature3', "Suivi des progrès de l'équipe"),
        t('pricing.enterprise.feature4', "Intégration LMS"),
        t('pricing.enterprise.feature5', "Support dédié")
      ],
      cta: t('pricing.enterprise.cta', "Contacter les ventes"),
      popular: false
    }
  ], [currentLocale, t]);

  // Stats
  const stats = useMemo(() => [
    { figure: "4", label: t('stats.languages', "Langues disponibles") },
    { figure: "100+", label: t('stats.units', "Unités d'apprentissage dans chaque langue") },
    { figure: "500+", label: t('stats.lessons', "Leçons interactives") },
    { figure: "10000+", label: t('stats.words', "Mots et expressions à apprendre") },
  ], [currentLocale, t]);

  // Smooth fadeIn animation for sections
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Handle video play
  const playVideo = () => {
    setIsVideoPlaying(true);
    // Logic to play video would go here
  };

  // Change active language
  // Handle language change - also changes UI language when selecting a language to learn
  const handleLanguageChange = (langId: string) => {
    setActiveLanguage(langId);
    // Find and set the UI language based on selected learning language
    const lang = languages.find(l => l.id === langId);
    if (lang && lang.code) {
      localStorage.setItem('language', lang.code);
      setCurrentLocale(lang.code as AvailableLocales);
      window.dispatchEvent(new Event('languageChanged'));
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Enhanced with animated gradient */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')]"></div>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 25%), radial-gradient(circle at 70% 65%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 30%)'
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white z-10">
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-10 pb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-100 whitespace-normal break-words"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t('hero.title', 'Apprenez une nouvelle langue à votre rythme !')}
          </motion.h1>



          <motion.p
            className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-indigo-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('hero.subtitle', "Tout ce dont vous avez besoin pour apprendre une langue étrangère, à votre rythme et où que vous soyez.")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium px-8">
                {t('hero.start_button', 'Commencer gratuitement')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all font-medium px-8 flex items-center"
              >
                <Globe className="mr-2 h-5 w-5" />
                {t('hero.discover_button', 'Découvrir nos applications')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Interactive app demo */}
          <motion.div
            className="relative mx-auto w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className="bg-white p-1 rounded-2xl">
              <div className="relative w-full aspect-video">
                {isVideoPlaying ? (
                  <div className="w-full h-full bg-black">
                    {/* Video player would go here */}
                    <iframe
                      className="w-full h-full"
                      src="landing/video/intro.mp4"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl">
                      <div className="text-center">
                        <p>{t('hero.screenshot_alt', "Capture d'écran de l'application")}</p>
                        <p className="text-sm">{t('hero.image_placeholder', "(Image non disponible)")}</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={playVideo}
                        className="bg-black/60 rounded-full p-4 cursor-pointer hover:bg-black/70 transition-colors transform hover:scale-105"
                      >
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Language Selector */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {t('languages.choose', 'Quelle langue souhaitez-vous apprendre ?')}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {languages.map((lang) => (
                <motion.button
                  key={lang.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${activeLanguage === lang.id
                      ? `${lang.color} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  onClick={() => handleLanguageChange(lang.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section - Improved visual presentation */}
      <section className="py-16 bg-gradient-to-b from-indigo-50 to-white flex justify-center items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 rounded-lg bg-white shadow-sm border border-indigo-50"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.figure}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>




      {/* Features Section - Enhanced with animations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              {t('features.title', 'Pourquoi choisir Linguify ?')}
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('features.subtitle', 'Notre plateforme a été conçue par des experts en linguistique et en pédagogie pour maximiser votre progression.')}
            </motion.p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                variants={fadeIn}
                transition={{ duration: 0.5 }}
              >

                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/features">
              <Button variant="outline" size="lg" className="text-indigo-600 border-indigo-600 hover:bg-indigo-50">
                {t('features.learn_more', 'En savoir plus sur nos fonctionnalités')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* New Info Component */}
      <NewInfo variant="compact" />


      {/* Testimonials Section - Improved with animated cards */}
      <section className="py-20 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              {t('testimonials.title', 'Ce que nos utilisateurs disent')}
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('testimonials.subtitle', "Rejoignez des milliers d'apprenants satisfaits qui ont transformé leur approche des langues.")}
            </motion.p>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow relative"
                variants={fadeIn}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="absolute -top-6 left-8">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-200">
                    {/* Placeholder for avatar if image fails to load */}
                    <div className="flex items-center justify-center h-full text-gray-400">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-6">{testimonial.text}</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              {t('pricing.title', 'Des forfaits adaptés à vos besoins')}
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('pricing.subtitle', "Choisissez l'offre qui correspond à vos objectifs et à votre rythme d'apprentissage.")}
            </motion.p>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                className={`bg-white rounded-xl overflow-hidden ${plan.popular
                    ? 'border-2 border-indigo-500 shadow-lg relative'
                    : 'border border-gray-200 shadow-sm'
                  }`}
                variants={fadeIn}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-indigo-500 text-white m-4">
                      {t('pricing.most_popular', 'Le plus populaire')}
                    </Badge>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-end">
                    <div className="text-4xl font-bold">{plan.price}</div>
                    {plan.period && (
                      <div className="text-gray-500 ml-1 mb-1">{plan.period}</div>
                    )}
                  </div>
                  <p className="mt-4 text-gray-600">{plan.description}</p>

                  <div className="mt-6 space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Link href={index === 2 ? "/contact" : "/register"}>
                      <Button
                        className={`w-full ${plan.popular
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                          }`}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            {t('cta.title', 'Prêt à commencer votre voyage linguistique ?')}
          </motion.h2>
          <motion.p
            className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('cta.subtitle', "Rejoignez notre communauté d'apprenants et commencez à maîtriser une nouvelle langue dès aujourd'hui.")}
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium px-8">
                {t('cta.start_button', 'Commencer gratuitement')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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