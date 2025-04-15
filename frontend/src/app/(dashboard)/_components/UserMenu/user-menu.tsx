'use client';

import React from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  ChevronDown,
  BookOpen,
  Settings,
  LogOut
} from "lucide-react";
import { useTranslation } from "@/core/i18n/useTranslations";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "@/core/auth/authService";

interface UserMenuProps {
  user: UserProfile;
  className?: string;
}

export function UserMenu({ user, className = "" }: UserMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const handleLogout = () => {
    // Local logout
    localStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Redirect to home
    window.location.href = '/home';

    toast({
      title: t('auth.logoutSuccess'),
      description: t('auth.comeBackSoon'),
    });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`flex items-center gap-2 ${className}`}>
          {user?.picture ? (
            <img
              src={user.picture}
              alt={t('dashboard.header.profile')}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="max-w-[100px] truncate">{user?.name || t('dashboard.header.profile')}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            {user?.picture && (
              <img
                src={user.picture}
                alt={t('dashboard.header.profile')}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/learning')}>
          <BookOpen className="h-4 w-4 mr-2" />
          {t('sidebar.learning')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          {t('sidebar.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}