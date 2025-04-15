'use client';

import React from 'react';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/core/i18n/useTranslations";

interface NotificationButtonProps {
  count?: number;
  className?: string;
}

export function NotificationButton({ count = 0, className = "" }: NotificationButtonProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const handleNotificationClick = () => {
    toast({
      title: t('dashboard.header.noNewNotifications'),
      description: t('dashboard.header.checkBackLater'),
    });
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleNotificationClick}
      className={`relative ${className}`}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
      )}
    </Button>
  );
}