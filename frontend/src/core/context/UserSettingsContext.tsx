// src/core/context/UserSettingsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/core/api/apiClient';
import { useAuthContext } from '@/core/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';
import { DEFAULT_USER_SETTINGS } from '@/addons/settings/constants/usersettings';

// Type du contexte
export interface UserSettingsContextType {
  settings: typeof DEFAULT_USER_SETTINGS;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateSetting: <K extends keyof typeof DEFAULT_USER_SETTINGS>(
    key: K, 
    value: typeof DEFAULT_USER_SETTINGS[K]
  ) => Promise<void>;
  updateSettings: (newSettings: Partial<typeof DEFAULT_USER_SETTINGS>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  
  // Getters pour faciliter l'accès aux paramètres courants
  getTargetLanguage: () => string;
  getNativeLanguage: () => string;
  getLanguageLevel: () => string;
}

// Création du contexte
const UserSettingsContext = createContext<UserSettingsContextType | null>(null);

// Provider Component
export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, token, isLoading: authLoading } = useAuthContext();
  const [settings, setSettings] = useState<typeof DEFAULT_USER_SETTINGS>({ ...DEFAULT_USER_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Charger les paramètres initiaux
  useEffect(() => {
    // Fonction pour charger les paramètres
    const loadSettings = async () => {
      // Déjà en cours de chargement, ne pas recharger
      if (isLoading && initialized) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Si authentifié, essayer de charger depuis le backend
        if (isAuthenticated && token) {
          try {
            const response = await apiClient.get('/api/auth/me/settings/');
            
            if (response.data) {
              // Fusionner avec les valeurs par défaut
              const mergedSettings = { ...DEFAULT_USER_SETTINGS, ...response.data };
              setSettings(mergedSettings);
              
              // Mettre à jour localStorage
              localStorage.setItem('userSettings', JSON.stringify(mergedSettings));
              console.log('[UserSettings] Loaded settings from backend', mergedSettings);
            }
          } catch (apiError) {
            console.error('[UserSettings] Error loading from API:', apiError);
            
            // En cas d'erreur API, essayer de charger depuis localStorage
            const storedData = localStorage.getItem('userSettings');
            if (storedData) {
              try {
                const parsedSettings = JSON.parse(storedData);
                setSettings({ ...DEFAULT_USER_SETTINGS, ...parsedSettings });
                console.log('[UserSettings] Loaded settings from localStorage', parsedSettings);
              } catch (parseError) {
                console.error('[UserSettings] Error parsing stored settings:', parseError);
              }
            }
          }
        } 
        // Si non authentifié, charger depuis localStorage
        else {
          const storedData = localStorage.getItem('userSettings');
          if (storedData) {
            try {
              const parsedSettings = JSON.parse(storedData);
              setSettings({ ...DEFAULT_USER_SETTINGS, ...parsedSettings });
              console.log('[UserSettings] Loaded settings from localStorage', parsedSettings);
            } catch (parseError) {
              console.error('[UserSettings] Error parsing stored settings:', parseError);
            }
          }
        }
      } catch (e) {
        console.error('[UserSettings] Error loading settings:', e);
        setError('Failed to load user settings');
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    // Si l'authentification est chargée, charger les paramètres
    if (!authLoading) {
      loadSettings();
    }
  }, [isAuthenticated, authLoading, token]);

  // Si l'utilisateur est connecté, utiliser les données du profil
  useEffect(() => {
    if (user) {
      const userLanguageSettings = {
        native_language: user.native_language,
        target_language: user.target_language,
        language_level: user.language_level,
        objectives: user.objectives,
      };
      
      // Mettre à jour les paramètres avec les données utilisateur
      setSettings(prev => ({ ...prev, ...userLanguageSettings }));
      
      // Mettre à jour localStorage
      const storedData = localStorage.getItem('userSettings');
      if (storedData) {
        try {
          const parsedSettings = JSON.parse(storedData);
          const updatedSettings = { ...parsedSettings, ...userLanguageSettings };
          localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
        } catch (e) {
          console.error('[UserSettings] Error updating localStorage with user profile data:', e);
        }
      } else {
        localStorage.setItem('userSettings', JSON.stringify({ 
          ...DEFAULT_USER_SETTINGS, 
          ...userLanguageSettings 
        }));
      }
    }
  }, [user]);

  // Mettre à jour un paramètre individuel
  const updateSetting = async <K extends keyof typeof DEFAULT_USER_SETTINGS>(
    key: K, 
    value: typeof DEFAULT_USER_SETTINGS[K]
  ) => {
    // Mettre à jour d'abord en local pour une interface réactive
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Mettre à jour dans localStorage
    const currentSettings = { ...settings, [key]: value };
    localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    
    // Si authentifié, synchroniser avec le backend
    if (isAuthenticated && token) {
      setIsSaving(true);
      
      try {
        // Format spécial pour les paramètres de langue qui vont dans le profil
        if (['native_language', 'target_language', 'language_level', 'objectives'].includes(key as string)) {
          await apiClient.patch('/api/auth/profile/', { [key]: value });
        } else {
          // Autres paramètres via l'endpoint settings
          await apiClient.post('/api/auth/me/settings/', { [key]: value });
        }
        
        console.log(`[UserSettings] Successfully updated ${String(key)} to ${String(value)}`);
      } catch (error) {
        console.error(`[UserSettings] Error updating ${String(key)}:`, error);
        // Restaurer l'ancienne valeur en cas d'erreur
        setSettings(prev => ({ ...prev, [key]: prev[key] }));
        
        // Afficher une notification d'erreur
        toast({
          title: "Settings Update Failed",
          description: `Failed to update ${String(key)}. Please try again.`,
          variant: "destructive",
        });
        
        throw error;
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Mettre à jour plusieurs paramètres à la fois
  const updateSettings = async (newSettings: Partial<typeof DEFAULT_USER_SETTINGS>) => {
    // Mettre à jour d'abord en local
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Mettre à jour dans localStorage
    const currentSettings = { ...settings, ...newSettings };
    localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    
    // Si authentifié, synchroniser avec le backend
    if (isAuthenticated && token) {
      setIsSaving(true);
      
      try {
        // Séparer les paramètres de langue des autres paramètres
        const languageSettings: Record<string, any> = {};
        const otherSettings: Record<string, any> = {};
        
        Object.entries(newSettings).forEach(([key, value]) => {
          if (['native_language', 'target_language', 'language_level', 'objectives'].includes(key)) {
            languageSettings[key] = value;
          } else {
            otherSettings[key] = value;
          }
        });
        
        // Mise à jour parallèle si nécessaire
        const promises = [];
        
        if (Object.keys(languageSettings).length > 0) {
          promises.push(apiClient.patch('/api/auth/profile/', languageSettings));
        }
        
        if (Object.keys(otherSettings).length > 0) {
          promises.push(apiClient.post('/api/auth/me/settings/', otherSettings));
        }
        
        await Promise.all(promises);
        
        toast({
          title: "Settings Updated",
          description: "Your settings have been updated successfully.",
        });
        
      } catch (error) {
        console.error('[UserSettings] Error updating multiple settings:', error);
        
        // Restaurer les anciens paramètres en cas d'erreur
        await refreshSettings();
        
        toast({
          title: "Settings Update Failed",
          description: "Failed to update settings. Please try again.",
          variant: "destructive",
        });
        
        throw error;
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Recharger les paramètres depuis le serveur
  const refreshSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated && token) {
        const response = await apiClient.get('/api/auth/me/settings/');
        
        if (response.data) {
          const mergedSettings = { ...DEFAULT_USER_SETTINGS, ...response.data };
          setSettings(mergedSettings);
          
          // Mettre à jour localStorage
          localStorage.setItem('userSettings', JSON.stringify(mergedSettings));
        }
      } else {
        // Si non authentifié, charger depuis localStorage
        const storedData = localStorage.getItem('userSettings');
        if (storedData) {
          const parsedSettings = JSON.parse(storedData);
          setSettings({ ...DEFAULT_USER_SETTINGS, ...parsedSettings });
        }
      }
    } catch (e) {
      console.error('[UserSettings] Error refreshing settings:', e);
      setError('Failed to refresh user settings');
      
      toast({
        title: "Error",
        description: "Failed to refresh settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction helper pour obtenir la langue cible formatée
  const getTargetLanguage = () => {
    return settings.target_language.toLowerCase();
  };

  // Fonction helper pour obtenir la langue maternelle formatée
  const getNativeLanguage = () => {
    return settings.native_language.toLowerCase();
  };

  // Fonction helper pour obtenir le niveau de langue
  const getLanguageLevel = () => {
    return settings.language_level;
  };

  // Valeur du contexte
  const contextValue: UserSettingsContextType = {
    settings,
    isLoading,
    isSaving,
    error,
    updateSetting,
    updateSettings,
    refreshSettings,
    getTargetLanguage,
    getNativeLanguage,
    getLanguageLevel
  };

  return (
    <UserSettingsContext.Provider value={contextValue}>
      {children}
    </UserSettingsContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  
  return context;
};