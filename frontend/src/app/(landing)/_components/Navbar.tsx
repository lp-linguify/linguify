'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/utils/utils";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuthContext } from "@/core/auth/AuthProvider";

// Import translations
import enTranslations from "@/core/i18n/translations/en/common.json";
import frTranslations from "@/core/i18n/translations/fr/common.json";
import esTranslations from "@/core/i18n/translations/es/common.json";
import nlTranslations from "@/core/i18n/translations/nl/common.json";

// Type definitions for our translations
type AvailableLocales = 'fr' | 'en' | 'es' | 'nl';
type TranslationType = typeof enTranslations;

export const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<AvailableLocales>('fr');

  const { login, isAuthenticated, logout } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const t = (path: string, fallback: string): string => {
    try {
      const translations: Record<AvailableLocales, TranslationType> = {
        fr: frTranslations,
        en: enTranslations,
        es: esTranslations,
        nl: nlTranslations
      };

      const currentTranslation = translations[currentLocale] || translations.en;

      // Split the path (e.g., "nav.home") into parts
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

  // Get navigation items with translations
  const navItems = [
    { name: t("nav.home", "Home"), href: "/home" },
    { name: t("nav.features", "Features"), href: "/features" },
    { name: t("nav.pricing", "Pricing"), href: "/pricing" },
    { name: t("nav.company", "Company"), href: "/company" },
    { name: t("nav.contact", "Contact"), href: "/contact" },
  ];

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await login();
      // The redirect will happen automatically
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/home"
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent font-montserrat hover:opacity-80 transition-opacity"
              aria-label="Linguify Home"
            >
              Linguify
            </Link>


            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <Link href={item.href} legacyBehavior passHref>
                        <NavigationMenuLink
                          className={cn(
                            navigationMenuTriggerStyle(),
                            pathname === item.href
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                        >
                          {item.name}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Desktop Auth Buttons and Language Switcher */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {/* Language Switcher - Desktop */}
            <LanguageSwitcher variant="dropdown" size="sm" showLabels={true} />

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? t("auth.logOutProgress", "Logging out...") : t("auth.logOut", "Log Out")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? t("auth.signInProgress", "Logging in...") : t("auth.signIn", "Sign In")}
                </Button>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-800 dark:hover:bg-purple-900"
                  >
                    {t("auth.tryFree", "Try it free")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute top-0 right-0 w-64 h-full bg-white dark:bg-gray-900 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <Link
                href="/home"
                className="font-bold text-xl text-gray-900 dark:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Linguify
              </Link>
            </div>
            <nav className="p-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                      pathname === item.href
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Language Switcher - Mobile */}
              <div className="mt-6 border-t pt-4">
                <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("mobile.language", "Language")}
                </div>
                <div className="mt-2">
                  <LanguageSwitcher
                    variant="buttons"
                    size="sm"
                    showLabels={true}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="mt-6 space-y-2">
                {isAuthenticated ? (
                  <Button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full"
                    variant="destructive"
                  >
                    {isLoading ? t("auth.logOutProgress", "Logging out...") : t("auth.logOut", "Log Out")}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? t("auth.signInProgress", "Logging in...") : t("auth.signIn", "Log In")}
                    </Button>
                    <Link
                      href="/register"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full">{t("auth.register", "Register")}</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};