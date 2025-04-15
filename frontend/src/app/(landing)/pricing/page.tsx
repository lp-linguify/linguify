'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Container } from "../_components/Container";
import { Check, X } from "lucide-react";
import LanguageSwitcher from '../_components/LanguageSwitcher';

// Import translations
import frTranslations from '@/core/i18n/translations/fr/common.json';
import enTranslations from '@/core/i18n/translations/en/common.json';
import esTranslations from '@/core/i18n/translations/es/common.json';
import nlTranslations from '@/core/i18n/translations/nl/common.json';

// Type definitions
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = typeof enTranslations;

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false);
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

            // Split the path (e.g., "pricingPage.title") into parts
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

    const plans = [
        {
            name: t("pricingPage.plans.free.name", "Free"),
            description: t("pricingPage.plans.free.description", "Perfect for getting started with language learning"),
            price: {
                monthly: 0,
                annually: 0
            },
            features: [
                {
                    included: true,
                    text: t("pricingPage.plans.free.features.basic_modules", "Access to basic learning modules"),
                    tooltip: t("pricingPage.plans.free.tooltips.basic_modules", "Learn fundamentals in your chosen language")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.free.features.core_vocabulary", "Core vocabulary exercises"),
                    tooltip: t("pricingPage.plans.free.tooltips.core_vocabulary", "Practice essential words and phrases")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.free.features.basic_tracking", "Basic progress tracking"),
                    tooltip: t("pricingPage.plans.free.tooltips.basic_tracking", "Monitor your learning journey")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.free.features.limited_exercises", "Limited practice exercises"),
                    tooltip: t("pricingPage.plans.free.tooltips.limited_exercises", "Access to beginner-level exercises")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.free.features.community", "Community forum access"),
                    tooltip: t("pricingPage.plans.free.tooltips.community", "Connect with fellow learners")
                },
                {
                    included: false,
                    text: t("pricingPage.plans.free.features.tutoring", "Live tutoring sessions"),
                    tooltip: t("pricingPage.plans.free.tooltips.tutoring", "One-on-one sessions with native speakers")
                },
                {
                    included: false,
                    text: t("pricingPage.plans.free.features.analytics", "Advanced analytics"),
                    tooltip: t("pricingPage.plans.free.tooltips.analytics", "Detailed insights into your learning")
                },
                {
                    included: false,
                    text: t("pricingPage.plans.free.features.offline", "Offline access"),
                    tooltip: t("pricingPage.plans.free.tooltips.offline", "Learn without internet connection")
                }
            ]
        },
        {
            name: t("pricingPage.plans.premium.name", "Premium"),
            description: t("pricingPage.plans.premium.description", "Full access to all Linguify features"),
            price: {
                monthly: 15,
                annually: 150
            },
            features: [
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.all_free", "All Free features"),
                    tooltip: t("pricingPage.plans.premium.tooltips.all_free", "Everything in the Free plan")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.unlimited", "Unlimited language courses"),
                    tooltip: t("pricingPage.plans.premium.tooltips.unlimited", "Learn multiple languages simultaneously")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.tutoring", "Live tutoring sessions"),
                    tooltip: t("pricingPage.plans.premium.tooltips.tutoring", "Weekly sessions with native speakers")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.analytics", "Advanced progress analytics"),
                    tooltip: t("pricingPage.plans.premium.tooltips.analytics", "Detailed insights and recommendations")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.personalized", "Personalized learning path"),
                    tooltip: t("pricingPage.plans.premium.tooltips.personalized", "AI-powered custom curriculum")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.offline", "Offline mode"),
                    tooltip: t("pricingPage.plans.premium.tooltips.offline", "Learn anywhere, anytime")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.support", "Priority support"),
                    tooltip: t("pricingPage.plans.premium.tooltips.support", "24/7 dedicated assistance")
                },
                {
                    included: true,
                    text: t("pricingPage.plans.premium.features.certificate", "Certificate of completion"),
                    tooltip: t("pricingPage.plans.premium.tooltips.certificate", "Official certification for completed courses")
                }
            ],
            popular: true
        }
    ];

    return (
        <Container>
            <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-12">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                        {t("pricingPage.header.subtitle", "PricingPage Plans")}
                    </p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white lg:text-5xl mb-4">
                        {t("pricingPage.header.title", "Choose Your Learning Journey")}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {t("pricingPage.header.description", "Start for free and upgrade when you're ready to unlock all features")}
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center gap-3 mb-12 bg-gray-50 dark:bg-gray-800 p-2 rounded-full">
                    <button
                        className={`px-4 py-2 rounded-full transition-all ${!isAnnual
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}
                        onClick={() => setIsAnnual(false)}
                    >
                        {t("pricingPage.billing.monthly", "Monthly")}
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full transition-all ${isAnnual
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400'
                            }`}
                        onClick={() => setIsAnnual(true)}
                    >
                        {t("pricingPage.billing.annually", "Annually")}
                        <span className="ml-2 inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                            {t("pricingPage.billing.discount", "Save 17%")}
                        </span>
                    </button>
                </div>

                {/* PricingPage Cards */}
                <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col p-8 bg-white dark:bg-gray-800 rounded-xl ${plan.popular
                                ? 'border-2 border-indigo-600 shadow-xl'
                                : 'border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-0 w-full flex justify-center">
                                    <span className="inline-block bg-indigo-600 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
                                        {t("pricingPage.popular_badge", "Most Popular")}
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {plan.name}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-end">
                                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                                        €{isAnnual ? plan.price.annually : plan.price.monthly}
                                    </span>
                                    {plan.price.monthly > 0 && (
                                        <span className="text-gray-600 dark:text-gray-400 ml-2 mb-2">
                                            /{isAnnual 
                                              ? t("pricingPage.period.yearly", "year") 
                                              : t("pricingPage.period.monthly", "month")}
                                        </span>
                                    )}
                                </div>
                                {plan.popular && isAnnual && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                        {t("pricingPage.monthly_equivalent", "€12.50/month billed annually")}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 group relative"
                                        title={feature.tooltip}
                                    >
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <X className="w-5 h-5 text-red-500" />)}
                                        <span className={`${feature.included
                                            ? 'text-gray-600 dark:text-gray-300'
                                            : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                            {feature.text}
                                        </span>

                                        {/* Tooltip */}
                                        <div className="absolute left-0 -top-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bg-gray-900 text-white text-sm rounded p-2 -translate-y-full ml-8">
                                            {feature.tooltip}
                                            <div className="absolute left-0 top-full w-2 h-2 bg-gray-900 transform rotate-45 translate-x-6 -translate-y-1"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all transform hover:scale-[1.02] ${plan.popular
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {plan.price.monthly === 0 
                                  ? t("pricingPage.cta.free", "Get Started Free") 
                                  : t("pricingPage.cta.premium", "Get Premium Access")}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-20 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {t("pricingPage.faq.title", "Common Questions")}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 space-x-1">
                        <span>{t("pricingPage.faq.need_more", "Need more info?")}</span>
                        <a href="/faq" className="text-indigo-600 hover:text-indigo-500 underline">
                            {t("pricingPage.faq.visit_faq", "Visit our FAQ")}
                        </a>
                        <span>{t("pricingPage.faq.or", "or")}</span>
                        <a href="/contact" className="text-indigo-600 hover:text-indigo-500 underline">
                            {t("pricingPage.faq.contact", "contact our team")}
                        </a>
                    </p>
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
        </Container>
    );
}