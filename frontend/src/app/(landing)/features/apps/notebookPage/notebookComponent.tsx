// src/app/(landing)/features/apps/notebookPage/NotebookPageComponent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Tag, 
  Folder, 
  Share2, 
  Edit, 
  Globe, 
  BookOpen,
  Sparkles,
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

const NotebookPageComponent = () => {
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>('fr');
  const [activeNoteTab, setActiveNoteTab] = useState(0);

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

      // Split the path (e.g., "notebookPage.title") into parts
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
      icon: <Search className="h-10 w-10 text-indigo-500" />,
      title: t("notebookPage.features.smart_search.title", "Recherche intelligente"),
      description: t("notebookPage.features.smart_search.description", "Retrouvez n'importe quelle note instantanément grâce à notre puissant moteur de recherche qui comprend le contexte linguistique."),
    },
    {
      icon: <Tag className="h-10 w-10 text-indigo-500" />,
      title: t("notebookPage.features.organization.title", "Organisation intuitive"),
      description: t("notebookPage.features.organization.description", "Classez vos notes par langue, niveau, thème ou créez vos propres catégories avec notre système flexible de tags et dossiers."),
    },
    {
      icon: <Edit className="h-10 w-10 text-indigo-500" />,
      title: t("notebookPage.features.rich_formatting.title", "Formatage enrichi"),
      description: t("notebookPage.features.rich_formatting.description", "Mettez en forme vos notes avec du texte riche, des tableaux, des listes et intégrez facilement des images, audio et vidéos."),
    },
    {
      icon: <Globe className="h-10 w-10 text-indigo-500" />,
      title: t("notebookPage.features.language_tools.title", "Outils linguistiques"),
      description: t("notebookPage.features.language_tools.description", "Profitez de fonctionnalités spécifiques aux langues : dictionnaires intégrés, conjugaison, prononciation et traduction à la volée."),
    },
    {
      icon: <Share2 className="h-10 w-10 text-indigo-500" />,
      title: t("notebookPage.features.sharing.title", "Partage collaboratif"),
      description: t("notebookPage.features.sharing.description", "Partagez facilement vos notes avec d'autres apprenants ou collaborez en temps réel sur des documents d'étude communs."),
    },
  ];

  // Demo notes content
  const demoNotes = [
    {
      title: t("notebookPage.demo.note1.title", "Conjugaison - Verbes irréguliers espagnols"),
      content: t("notebookPage.demo.note1.content", "Lista de verbos irregulares más comunes:\n• Ser/Estar (être)\n• Ir (aller)\n• Tener (avoir)\n• Hacer (faire)\n\nNotas: Les verbes irréguliers suivent souvent des schémas qu'on peut regrouper..."),
      tags: ["espagnol", "grammaire", "verbes"]
    },
    {
      title: t("notebookPage.demo.note2.title", "Vocabulaire - Voyage en Italie"),
      content: t("notebookPage.demo.note2.content", "• Buongiorno = Bonjour\n• Arrivederci = Au revoir\n• Per favore = S'il vous plaît\n• Grazie = Merci\n• Quanto costa? = Combien ça coûte?\n• Dov'è...? = Où est...?"),
      tags: ["italien", "voyage", "débutant"]
    },
    {
      title: t("notebookPage.demo.note3.title", "Structure grammaticale allemande"),
      content: t("notebookPage.demo.note3.content", "Règle: En allemand, le verbe conjugué occupe toujours la deuxième position dans une phrase déclarative.\n\nExemples:\n- Ich gehe nach Hause. (Je rentre à la maison)\n- Heute gehe ich nach Hause. (Aujourd'hui je rentre à la maison)"),
      tags: ["allemand", "grammaire", "intermédiaire"]
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
                  {t("notebookPage.hero.title", "NotebookPage Linguistique")}
                </h1>
                <p className="text-xl text-indigo-100 mb-8">
                  {t("notebookPage.hero.description", "Capturez, organisez et révisez vos apprentissages linguistiques dans un espace central intelligent. Transformez vos notes en connaissances structurées.")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                      {t("notebookPage.hero.cta_button", "Essayer gratuitement")}
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600">
                      {t("notebookPage.hero.learn_more", "En savoir plus")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Interactive NotebookPage Demo */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="bg-indigo-700 p-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-white font-medium">Linguify NotebookPage</div>
                  <div></div>
                </div>
                <div className="flex border-b">
                  <div className="w-1/3 bg-indigo-50 p-2 border-r">
                    <div className="flex justify-between items-center mb-4 p-2">
                      <h3 className="font-medium text-indigo-900">{t("notebookPage.demo.folders", "Dossiers")}</h3>
                      <Folder className="h-4 w-4 text-indigo-700" />
                    </div>
                    <ul className="space-y-1 text-sm">
                      <li className="px-2 py-1 bg-indigo-200 rounded text-indigo-800 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        {t("notebookPage.demo.folder1", "Apprentissage des langues")}
                      </li>
                      <li className="px-2 py-1 hover:bg-indigo-100 rounded text-gray-700 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t("notebookPage.demo.folder2", "Vocabulaire")}
                      </li>
                      <li className="px-2 py-1 hover:bg-indigo-100 rounded text-gray-700 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t("notebookPage.demo.folder3", "Expressions idiomatiques")}
                      </li>
                    </ul>
                  </div>
                  <div className="w-2/3 p-4">
                    <div className="flex mb-4 border-b">
                      {demoNotes.map((note, index) => (
                        <button
                          key={index}
                          className={`px-4 py-2 text-sm font-medium ${
                            activeNoteTab === index
                              ? 'border-b-2 border-indigo-600 text-indigo-600'
                              : 'text-gray-600 hover:text-indigo-600'
                          }`}
                          onClick={() => setActiveNoteTab(index)}
                        >
                          {note.title}
                        </button>
                      ))}
                    </div>
                    <div className="p-2">
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {demoNotes[activeNoteTab].tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="whitespace-pre-line text-gray-800 text-sm">
                        {demoNotes[activeNoteTab].content}
                      </div>
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
                {t("notebookPage.features.title", "Fonctionnalités principales")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("notebookPage.features.subtitle", "Découvrez comment notre système de prise de notes transforme votre apprentissage des langues")}
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
                {t("notebookPage.how_it_works.title", "Comment ça marche")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("notebookPage.how_it_works.subtitle", "Notre approche de prise de notes structurée en 4 étapes simples")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("notebookPage.how_it_works.step1.title", "Capturez")}
                </h3>
                <p className="text-gray-600">
                  {t("notebookPage.how_it_works.step1.description", "Prenez des notes rapidement dans n'importe quelle langue avec notre éditeur intuitif et nos modèles prédéfinis.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("notebookPage.how_it_works.step2.title", "Organisez")}
                </h3>
                <p className="text-gray-600">
                  {t("notebookPage.how_it_works.step2.description", "Classez automatiquement vos notes avec notre système intelligent de tags, dossiers et catégories linguistiques.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("notebookPage.how_it_works.step3.title", "Connectez")}
                </h3>
                <p className="text-gray-600">
                  {t("notebookPage.how_it_works.step3.description", "Liez vos notes à d'autres ressources d'apprentissage et créez un réseau de connaissances interconnectées.")}
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-4">4</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t("notebookPage.how_it_works.step4.title", "Révisez")}
                </h3>
                <p className="text-gray-600">
                  {t("notebookPage.how_it_works.step4.description", "Transformez facilement vos notes en outils de révision grâce à l'intégration avec les flashcards et les exercices.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                {t("notebookPage.use_cases.title", "Idéal pour")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-indigo-700 mb-3">
                  {t("notebookPage.use_cases.case1.title", "Étudiants en langues")}
                </h3>
                <p className="text-gray-700">
                  {t("notebookPage.use_cases.case1.description", "Organisez les règles grammaticales, le vocabulaire et les expressions idiomatiques dans un système cohérent qui facilite la révision et la mémorisation.")}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-indigo-700 mb-3">
                  {t("notebookPage.use_cases.case2.title", "Voyageurs")}
                </h3>
                <p className="text-gray-700">
                  {t("notebookPage.use_cases.case2.description", "Créez des guides de conversation personnalisés, des listes de vocabulaire thématiques et des notes culturelles essentielles pour vos déplacements à l'étranger.")}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-indigo-700 mb-3">
                  {t("notebookPage.use_cases.case3.title", "Professionnels internationaux")}
                </h3>
                <p className="text-gray-700">
                  {t("notebookPage.use_cases.case3.description", "Développez un lexique professionnel multilingue et prenez des notes de réunions ou d'appels internationaux avec traduction intégrée.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-indigo-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              {t("notebookPage.cta.title", "Prêt à organiser votre apprentissage des langues ?")}
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              {t("notebookPage.cta.description", "Rejoignez des milliers d'utilisateurs qui ont transformé leur prise de notes linguistiques grâce à notre application NotebookPage.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-100">
                  {t("notebookPage.cta.button", "Commencer gratuitement")}
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

export default NotebookPageComponent;