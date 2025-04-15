'use client';

import React from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/core/i18n/useTranslations";

interface AuthButtonsProps {
  onLogin: () => void;
  className?: string;
}

export function AuthButtons({ onLogin, className = "" }: AuthButtonsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        onClick={onLogin}
      >
        {t('auth.login')}
      </Button>
      <Button
        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
        onClick={() => router.push('/register')}
      >
        {t('auth.register')}
      </Button>
    </div>
  );
}