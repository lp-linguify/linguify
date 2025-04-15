'use client';

import React from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  BookOpen,
  Trophy,
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/core/i18n/useTranslations";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}

const NavItem = ({ href, icon: Icon, label, onClick }: NavItemProps) => (
  <Link
    href={href}
    className="flex items-center p-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    onClick={onClick}
  >
    <Icon className="h-4 w-4 mr-3" />
    {label}
  </Link>
);

interface MobileMenuProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onToggle: (isOpen: boolean) => void;
  isOpen: boolean;
  className?: string;
}

export function MobileMenu({ 
  isAuthenticated, 
  onLogin, 
  onLogout,
  onToggle,
  isOpen,
  className = ""
}: MobileMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  // If the menu is not open, don't render anything
  if (!isOpen) return null;
  
  const handleClose = () => {
    onToggle(false);
  };
  
  const handleLogout = () => {
    // Clear localStorage and cookies
    localStorage.clear();
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Navigate to home
    window.location.href = '/home';
    
    // Close the menu
    handleClose();
    
    // Call the parent's logout handler
    onLogout();
  };
  
  return (
    <div className={`md:hidden border-t dark:border-gray-700/20 absolute w-full bg-background/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg ${className}`}>
      <div className="p-4 space-y-3">
        <NavItem href="/learning" icon={BookOpen} label={t('sidebar.learning')} onClick={handleClose} />
        <NavItem href="/progress" icon={Trophy} label={t('sidebar.progress')} onClick={handleClose} />

        {isAuthenticated ? (
          <>
            <NavItem href="/profile" icon={User} label={t('dashboard.header.profile')} onClick={handleClose} />
            <NavItem href="/settings" icon={Settings} label={t('sidebar.settings')} onClick={handleClose} />
            <div className="pt-2">
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                onLogin();
                handleClose();
              }}
            >
              {t('auth.login')}
            </Button>
            <Button
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
              onClick={() => {
                router.push('/register');
                handleClose();
              }}
            >
              {t('auth.register')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileMenuToggle({ 
  isOpen, 
  onToggle, 
  className = "" 
}: { 
  isOpen: boolean; 
  onToggle: (isOpen: boolean) => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`md:hidden ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!isOpen);
      }}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}