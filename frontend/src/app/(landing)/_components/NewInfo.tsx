'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Type definitions
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = Record<string, any>;

interface NewInfoProps {
  t?: (path: string, fallback: string) => string;
  variant?: 'default' | 'compact';
  currentLocale?: AvailableLocales;
}

const NewInfo: React.FC<NewInfoProps> = ({ t: propT, variant = 'default', currentLocale: propLocale }) => {
  // Local state for managing current locale
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>(propLocale || 'fr');
  
  // Import translations
  const frTranslations = {
    future_apps: {
      title: "Nouvelles Applications Éducatives à Venir",
      description: "Nos équipes travaillent activement sur de nouvelles applications éducatives innovantes pour enrichir notre écosystème d'apprentissage. Ces outils à venir offriront encore plus de moyens pour maîtriser les langues et améliorer votre parcours d'apprentissage.",
      button: "Rejoindre la liste d'attente",
      highlights: {
        title: "À venir en 2025",
        item1: "Acquisition linguistique basée sur la neuroscience",
        item2: "Communauté de locuteurs natifs",
        item3: "Certifications reconnues par l'industrie"
      }
    }
  };
  
  const enTranslations = {
    future_apps: {
      title: "More Education Apps Coming Soon",
      description: "Our teams are actively working on innovative new education apps to expand our learning ecosystem. These upcoming tools will provide even more ways to master languages and enhance your learning journey.",
      button: "Join the waitlist",
      highlights: {
        title: "Coming in 2025",
        item1: "Neural-based language acquisition",
        item2: "Native speaker community",
        item3: "Industry-recognized certifications"
      }
    }
  };
  
  const esTranslations = {
    future_apps: {
      title: "Próximamente Nuevas Aplicaciones Educativas",
      description: "Nuestros equipos están trabajando activamente en nuevas aplicaciones educativas innovadoras para expandir nuestro ecosistema de aprendizaje. Estas próximas herramientas proporcionarán aún más formas de dominar idiomas y mejorar tu viaje de aprendizaje.",
      button: "Unirse a la lista de espera",
      highlights: {
        title: "Llegando en 2025",
        item1: "Adquisición de idiomas basada en neurociencia",
        item2: "Comunidad de hablantes nativos",
        item3: "Certificaciones reconocidas por la industria"
      }
    }
  };
  
  const nlTranslations = {
    future_apps: {
      title: "Binnenkort Meer Educatieve Apps",
      description: "Onze teams werken actief aan innovatieve nieuwe educatieve apps om ons leerecosysteem uit te breiden. Deze aankomende tools zullen nog meer manieren bieden om talen te beheersen en je leertraject te verbeteren.",
      button: "Aanmelden voor de wachtlijst",
      highlights: {
        title: "Komt in 2025",
        item1: "Op neurowetenschap gebaseerde taalverwerving",
        item2: "Gemeenschap van moedertaalsprekers",
        item3: "Door de industrie erkende certificeringen"
      }
    }
  };
  
  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && ['fr', 'en', 'es', 'nl'].includes(savedLanguage)) {
        setCurrentLocale(savedLanguage as AvailableLocales);
      }
    };

    // Initial load
    handleLanguageChange();
    
    // Listen for changes
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);
  
  // Update when prop changes
  useEffect(() => {
    if (propLocale) {
      setCurrentLocale(propLocale);
    }
  }, [propLocale]);
  
  // Internal translation function
  const internalT = useCallback((path: string, fallback: string): string => {
    try {
      const translations: Record<AvailableLocales, TranslationType> = {
        fr: frTranslations,
        en: enTranslations,
        es: esTranslations,
        nl: nlTranslations
      };
      
      const currentTranslation = translations[currentLocale] || translations.en;
      
      // Split the path (e.g., "future_apps.title") into parts
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
  
  // Use provided translation function or internal one
  const t = propT || internalT;

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Determine classes based on variant
  const containerClasses = variant === 'compact' 
    ? 'py-12'
    : 'py-16 bg-gray-50';

  const cardClasses = variant === 'compact'
    ? 'p-6 md:p-8'
    : 'p-8 md:p-12';

  return (
    <section className={containerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className={`bg-white rounded-2xl shadow-lg ${cardClasses} border border-gray-100 overflow-hidden relative`}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-100 rounded-full opacity-50"></div>
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-100 rounded-full opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 md:pr-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t("future_apps.title", "More Education Apps Coming Soon")}
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  {t("future_apps.description", "Our teams are actively working on innovative new education apps to expand our learning ecosystem. These upcoming tools will provide even more ways to master languages and enhance your learning journey.")}
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">AI Writing Assistant</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Pronunciation Trainer</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Cultural Immersion</span>
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">Grammar Checker</span>
                </div>
                <Link href="/contact">
                  <Button variant="outline" className="hover:bg-indigo-50">
                    {t("future_apps.button", "Join the waitlist")}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="mt-8 md:mt-0 md:w-1/3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                  <h3 className="font-bold text-xl mb-3">{t("future_apps.highlights.title", "Coming in 2025")}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="bg-white/20 p-1 rounded mr-2 mt-0.5">
                        <Brain className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{t("future_apps.highlights.item1", "Neural-based language acquisition")}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white/20 p-1 rounded mr-2 mt-0.5">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{t("future_apps.highlights.item2", "Native speaker community")}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white/20 p-1 rounded mr-2 mt-0.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{t("future_apps.highlights.item3", "Industry-recognized certifications")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewInfo;