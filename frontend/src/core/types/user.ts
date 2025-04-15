// src/types/user.ts
export enum Gender {
    MALE = 'M',
    FEMALE = 'F',
    OTHER = 'O',
  }
  
  export enum Language {
    ENGLISH = 'en',
    FRENCH = 'fr',
    SPANISH = 'es',
    DUTCH = 'nl',
  }
  
  export interface User {
    public_id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    birthday: string | null;
    gender: Gender | null;
    is_active: boolean;
    is_subscribed: boolean;
    is_superuser: boolean;
    is_staff: boolean;
    created_at: string;
    updated_at: string;
    profile_picture: string | null;
    bio: string | null;
    native_language: Language;
    target_language: Language;
    language_level: string;
    objectives: string;
    is_coach: boolean;
    name: string;
    age: number | null;
  }