// src/constants/language-options.ts

/**
 * Constants and interfaces for language settings, the user profile, and user settings
 * This file centralizes all options for reusability across components
 */

// Language options for native and target languages
export const LANGUAGE_OPTIONS = [
    { value: 'EN', label: 'English' },
    { value: 'FR', label: 'French' },
    { value: 'NL', label: 'Dutch' },
    { value: 'ES', label: 'Spanish' },
  ];
  
  export const INTERFACE_LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'nl', label: 'Nederlands' },
  ];
  
  export const LEVEL_OPTIONS = [
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Mastery' },
  ];
  
  export const OBJECTIVES_OPTIONS = [
    { value: 'Travel', label: 'Travel' },
    { value: 'Business', label: 'Business' },
    { value: 'Live Abroad', label: 'Live Abroad' },
    { value: 'Exam', label: 'Exam Preparation' },
    { value: 'For Fun', label: 'For Fun' },
    { value: 'Work', label: 'Work' },
    { value: 'School', label: 'School' },
    { value: 'Study', label: 'Study' },
    { value: 'Personal', label: 'Personal Development' },
  ];
  
  export const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
  
  export const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
  ];
  
  export interface UserSettings {
    // Account settings
    email_notifications: boolean;
    push_notifications: boolean;
    interface_language: string;
    
    // Learning settings
    daily_goal: number; // in minutes
    weekday_reminders: boolean;
    weekend_reminders: boolean;
    reminder_time: string;
    speaking_exercises: boolean;
    listening_exercises: boolean;
    reading_exercises: boolean;
    writing_exercises: boolean;
    
    // Language settings
    native_language: string;
    target_language: string;
    language_level: string;
    objectives: string;
    
    // Privacy settings
    public_profile: boolean;
    share_progress: boolean;
    share_activity: boolean;
  }
  
  // Profile data interface
  export interface ProfileData {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    bio: string | null;
    gender: string | null;
    birthday: string | null;
    native_language: string;
    target_language: string;
    language_level: string;
    objectives: string;
    is_coach: boolean;
    is_subscribed: boolean;
    profile_picture: string | null;
    
  }

  export interface ProfileFormData {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    bio: string | null;
    gender: string | null;
    birthday: string | null;
    native_language: string;
    target_language: string;
    language_level: string;
    objectives: string;
    interface_language: string;
  }
  
  export const DEFAULT_USER_SETTINGS: UserSettings = {
    email_notifications: true,
    push_notifications: true,
    interface_language: 'en',
    
    daily_goal: 15,
    weekday_reminders: true,
    weekend_reminders: false,
    reminder_time: '18:00',
    speaking_exercises: true,
    listening_exercises: true,
    reading_exercises: true,
    writing_exercises: true,
    
    native_language: 'EN',
    target_language: 'FR',
    language_level: 'A1',
    objectives: 'Travel',
    
    public_profile: true,
    share_progress: true,
    share_activity: false,
  };
  
  // Helper function to get label for a given value
  export function getLabelForValue(options: { value: string, label: string }[], value: string): string {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : 'Not specified';
  }