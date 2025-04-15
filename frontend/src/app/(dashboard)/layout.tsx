// src/app/(dashboard)/layout.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import Header from "./_components/header";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useTranslation } from "@/core/i18n/useTranslations";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuthContext();
  const pathname = usePathname();
  const { t, isLoading: translationsLoading } = useTranslation();

  // Créer une map de correspondance entre les chemins et les clés de traduction
  const titleMap = useMemo(() => ({
    '/': "Linguify",
    '/flashcard': 'dashboard.layoutpathname.flashcard',
    '/notebook': 'dashboard.layoutpathname.notebook',
    '/settings': 'dashboard.layoutpathname.settings',
    '/learning': 'dashboard.layoutpathname.learning',
    '/progress': 'dashboard.layoutpathname.progress',
  }), []);

  useEffect(() => {
    // Fonction pour déterminer le titre de la page
    const getPageTitle = () => {
      // Pages publiques qui n'ont pas besoin de traduction pour le titre
      const publicPages = ["/home", "/login", "/register", "/callback"];
      if (publicPages.includes(pathname)) {
        return "Linguify";
      }

      // Trouver la correspondance de chemin la plus spécifique
      const matchingPath = Object.keys(titleMap).find(path =>
        path !== '/' ? pathname.startsWith(path) : pathname === '/'
      ) as keyof typeof titleMap | undefined;

      const titleKey = matchingPath ? titleMap[matchingPath] : "Linguify";

      // Si c'est une clé de traduction et que les traductions sont chargées, traduire
      if (titleKey !== "Linguify" && !translationsLoading) {
        try {
          const translatedTitle = t(titleKey);
          // Vérifier si la traduction est valide (pas une clé de traduction)
          if (translatedTitle && !translatedTitle.includes('dashboard.layoutpathname')) {
            return translatedTitle;
          }
        } catch (e) {
          console.warn(`Translation failed for key: ${titleKey}`);
        }
      }

      return titleKey;
    };

    // Définir le titre de la page
    document.title = getPageTitle();

    // Pages publiques pour la logique d'authentification
    const publicPages = ["/home", "/login", "/register", "/callback"];
    const isPublicPage = publicPages.includes(pathname);

    if (!isLoading && !isAuthenticated && !isPublicPage) {
      // Rediriger vers la page de connexion en préservant l'URL de retour
      login(pathname);
    }
  }, [isAuthenticated, isLoading, pathname, login, t, titleMap, translationsLoading]);

  // Afficher l'indicateur de chargement pendant la vérification d'authentification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background with overlay for light mode */}
      <div className="absolute inset-0 bg-[url('/static/background_light/light2.jpg')] bg-cover bg-no-repeat bg-fixed opacity-10 dark:hidden"></div>
      {/* Background with overlay for dark mode */}
      <div className="absolute inset-0 bg-[url('/static/background_dark/dark.jpg')] bg-cover bg-no-repeat bg-fixed opacity-70 hidden dark:block"></div>
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        {/* Main Content */}
        <main className="flex-1 dark:text-white">
          <div className="pt-2 p-6 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}