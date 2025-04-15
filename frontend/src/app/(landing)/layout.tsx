// src/app/(landing)/layout.tsx
'use client';

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { LanguageProvider } from "@/core/i18n/i18nProvider";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";

export default function LandingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("Landing Auth State:", { user, isLoading, pathname });
    // Si l'utilisateur est authentifié et sur /home, rediriger vers le dashboard
    if (user && !isLoading && pathname === '/home') {
      router.push("/");
    }
  }, [user, isLoading, router, pathname]);

  console.log('LandingLayoutClient Render:', {
    userExists: !!user,
    isLoading,
    pathname
  });

  return (
    <LanguageProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}