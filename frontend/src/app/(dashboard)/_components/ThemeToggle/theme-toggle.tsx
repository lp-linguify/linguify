'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  
  const handleThemeToggle = React.useCallback(
    (e?: React.MouseEvent) => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      
      // Check for View Transitions API support
      if (!document.startViewTransition) {
        setTheme(newTheme);
        return;
      }
      
      // Set coordinates from the click event for a ripple effect
      if (e) {
        root.style.setProperty('--x', `${e.clientX}px`);
        root.style.setProperty('--y', `${e.clientY}px`);
      }
      
      // Use View Transitions API for smooth theme change
      document.startViewTransition(() => {
        setTheme(newTheme);
      });
    },
    [theme, setTheme]
  );
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeToggle}
      className="text-gray-600 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}