'use client';
// src/app/Providers.tsx
import React from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { UserSettingsProvider } from '@/core/context/UserSettingsContext';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <UserSettingsProvider>
          <OnboardingProvider>
            {children}
            <Toaster />
          </OnboardingProvider>
        </UserSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}