// src/app/(dashboard)/_components/header.tsx
'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useTranslation } from "@/core/i18n/useTranslations";

// Import refactored components
import { ModeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { NotificationButton } from "./NotificationButton";
import { UserMenu } from "./UserMenu";
import { AuthButtons } from "./AuthButtons";
import LogoSection from "@/app/(dashboard)/_components/LogoSection/logo-section";
import { MobileMenu, MobileMenuToggle } from "./MobileMenu";

// Import icons for page configurations
import {
  BookOpen,
  Brain,
  BarChart,
  NotebookPen,
  HandHelping,
  Settings,
} from "lucide-react";

// Define types for page configuration
interface PageConfig {
  title: string;
  icon: React.ElementType | null;
}

interface PagesConfig {
  [path: string]: PageConfig;
}

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, login } = useAuthContext();
  const { t } = useTranslation();
  
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Define page configuration
  const PAGE_CONFIG: PagesConfig = {
    '/': { title: 'Linguify', icon: null },
    '/home': { title: 'Linguify', icon: null },
    '/learning': { title: t('dashboard.layoutpathname.learning'), icon: BookOpen },
    '/flashcard': { title: t('dashboard.layoutpathname.flashcard'), icon: Brain },
    '/progress': { title: t('dashboard.layoutpathname.progress'), icon: BarChart },
    '/notebook': { title: t('dashboard.layoutpathname.notebook'), icon: NotebookPen },
    '/help': { title: t('dashboard.helpCard.title'), icon: HandHelping },
    '/settings': { title: t('dashboard.layoutpathname.settings'), icon: Settings },
  };
  
  // Get current page config with fallback
  const currentPage = PAGE_CONFIG[pathname] || { title: 'Linguify', icon: null };
  const isHomePage = pathname === '/' || pathname === '/home';
  
  // Set client-side state as early as possible
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Manage mobile menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMenuOpen) setIsMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);
  
  // Navigation functions
  const handleBackToHome = () => {
    router.push('/');
  };
  
  const handleLogout = () => {
    // Handled inside the UserMenu component
  };
  
  // Render a skeleton header with the correct title even before hydration
  if (!isClient) {
    return (
      <header className="sticky top-0 z-50 w-full h-14 bg-background">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent font-montserrat">
              {currentPage.title}
            </span>
          </div>
        </div>
      </header>
    );
  }
  
  // Get the icon component for the current page
  const CurrentPageIcon = currentPage.icon;

  return (
    <header className="sticky top-0 z-50 w-full h-14 dark:border-gray-800/20 bg-transparent dark:bg-transparent ">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Logo Section */}
        <LogoSection 
          title={currentPage.title} 
          icon={CurrentPageIcon && <CurrentPageIcon />} 
          isHomePage={isHomePage} 
          onNavigateHome={handleBackToHome}
          className="h-full"
        />

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ModeToggle />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Auth-dependent UI */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationButton count={1} />

              {/* User Menu */}
              <UserMenu user={user} />
            </div>
          ) : (
            <AuthButtons onLogin={login} />
          )}

          {/* Mobile Menu Toggle */}
          <MobileMenuToggle isOpen={isMenuOpen} onToggle={setIsMenuOpen} />
        </div>
      </div>

      {/* Mobile menu */}
      <MobileMenu 
        isAuthenticated={isAuthenticated}
        onLogin={login}
        onLogout={handleLogout}
        onToggle={setIsMenuOpen}
        isOpen={isMenuOpen}
      />
    </header>
  );
};

export default Header;