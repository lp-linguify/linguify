"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, } from "@/components/ui/card";
import { BookOpen, BarChart, Brain, NotebookPen, Settings, User, HandHelping } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useTranslation } from "@/core/i18n/useTranslations";
import { useLanguage } from "@/core/hooks/useLanguage";
import { Button } from "@/components/ui/button";


export default function DashboardHome() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { t } = useTranslation();
  const {
    languageLevel,
    targetLanguageName,
    isLoading: langLoading
  } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Define quick item cards with explicit fallbacks
  const menuItems = [
    {
      titleKey: "dashboard.learningCard.title",
      fallbackTitle: "Learning",
      icon: BookOpen,
      href: "/learning",
      color: "bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
    },
    {
      titleKey: "dashboard.flashcardsCard.title",
      fallbackTitle: "Flashcards",
      icon: Brain,
      href: "/flashcard",
      color: "bg-purple-50 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400"
    },
    {
      titleKey: "dashboard.notesCard.title",
      fallbackTitle: "Notes",
      icon: NotebookPen,
      href: "/notebook",
      color: "bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400"
    },
    {
      titleKey: "dashboard.progressCard.title",
      fallbackTitle: "Progress",
      icon: BarChart,
      href: "/progress",
      color: "bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400"
    },
    {
      titleKey: "dashboard.helpCard.title",
      fallbackTitle: "Help",
      icon: HandHelping,
      href: "/help",
      color: "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
    },
    {
      titleKey: "dashboard.settingsCard.title",
      fallbackTitle: "Settings",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400"
    }
  ];

  // Show loading state if any data is still loading
  if (authLoading || langLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-pulse font-poppins">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto font-poppins">
      {/* Compact User Profile Card */}
      <Card className="w-full dark:bg-transparent">
        <CardContent className="p-4 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium font-montserrat">{user?.name || "User"}</h3>
                <p className="text-sm text-muted-foreground font-inter">
                  {t('dashboard.learning', {}, "Learning")}: {targetLanguageName} ({languageLevel})
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="font-inter">
              <Link
                href="/settings"
                className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 text-white hover:text-white">
                {t('dashboard.editProfile.editProfileName', {}, "Edit Profile")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spacing adjustment here - adding much more margin-top */}
      <div style={{ marginTop: '10vh' }}
        className="flex justify-center px-4 sm:px-6 lg:px-8">
        {/* Quick items Section - Optimized for 100% view with international design standards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 justify-items-center w-full max-w-7xl">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="w-full">
              <div className="flex flex-col items-center group">
                <div className="w-full max-w-[100px] aspect-square bg-gradient-to-r from-indigo-800 via-purple-550 to-pink-400 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 hover:bg-purple-200 dark:hover:bg-gray-600 group-hover:transform group-hover:scale-105">
                  <item.icon className="w-16 h-16 text-white" />
                </div>
                <span className="
                  text-center 
                  font-medium 
                  text-sm font-sans 
                  tracking-tight 
                  text-[#374151] 
                  dark:text-white 
                  group-hover:text-[#944189] 
                  transition-all duration-300">
                  {t(item.titleKey, {}, item.fallbackTitle)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}