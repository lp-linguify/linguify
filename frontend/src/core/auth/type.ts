// src/types/auth.ts
import { User } from '@/core/types/user';

export interface LoginOptions {
  connection?: string;
  appState?: {
    returnTo?: string;
  };
  screen_hint?: string;
}

export interface AuthState {
  token: string;
  user: User;
}

export interface AuthError extends Error {
  code?: string;
  description?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  login: (options?: LoginOptions) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}