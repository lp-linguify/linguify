// src/core/hooks/useLanguage.ts
import { useUserSettings } from '@/core/context/UserSettingsContext';
import { LANGUAGE_OPTIONS, LEVEL_OPTIONS } from '@/addons/settings/constants/usersettings';

/**
 * Hook pour accéder et manipuler facilement les paramètres de langue
 */
export function useLanguage() {
  const { 
    settings, 
    updateSetting, 
    isLoading,
    getTargetLanguage,
    getNativeLanguage,
    getLanguageLevel
  } = useUserSettings();

  /**
   * Met à jour la langue cible de l'utilisateur
   */
  const setTargetLanguage = async (language: string) => {
    // S'assurer que le format est correct (majuscules)
    const formattedLanguage = language.toUpperCase();
    await updateSetting('target_language', formattedLanguage);
  };

  /**
   * Met à jour la langue maternelle de l'utilisateur
   */
  const setNativeLanguage = async (language: string) => {
    // S'assurer que le format est correct (majuscules)
    const formattedLanguage = language.toUpperCase();
    await updateSetting('native_language', formattedLanguage);
  };

  /**
   * Met à jour le niveau de langue de l'utilisateur
   */
  const setLanguageLevel = async (level: string) => {
    await updateSetting('language_level', level);
  };

  /**
   * Configure les en-têtes HTTP appropriés pour les requêtes API
   * avec la langue cible de l'utilisateur
   */
  const getLanguageHeaders = (): Headers => {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    
    // Ajouter l'en-tête Accept-Language pour les API qui s'appuient sur cet en-tête
    headers.append('Accept-Language', getTargetLanguage());
    
    return headers;
  };

  /**
   * Ajoute le paramètre de langue cible à une URL d'API
   */
  const addLanguageParam = (url: URL): URL => {
    url.searchParams.append('target_language', getTargetLanguage());
    return url;
  };

  /**
   * Obtient le nom complet d'une langue à partir de son code
   */
  const getLanguageName = (code: string): string => {
    const option = LANGUAGE_OPTIONS.find(opt => 
      opt.value.toLowerCase() === code.toLowerCase()
    );
    return option ? option.label : code;
  };

  /**
   * Obtient le libellé du niveau de langue à partir du code
   */
  const getLevelName = (code: string): string => {
    const option = LEVEL_OPTIONS.find(opt => opt.value === code);
    return option ? option.label : code;
  };

  /**
   * Vérifie si deux langues sont différentes
   */
  const areDifferentLanguages = (lang1: string, lang2: string): boolean => {
    return lang1.toLowerCase() !== lang2.toLowerCase();
  };

  /**
   * Retourne toutes les langues disponibles
   */
  const getAvailableLanguages = () => {
    return LANGUAGE_OPTIONS;
  };

  /**
   * Retourne tous les niveaux de langue disponibles
   */
  const getAvailableLevels = () => {
    return LEVEL_OPTIONS;
  };

  return {
    // États
    targetLanguage: getTargetLanguage(),
    nativeLanguage: getNativeLanguage(),
    languageLevel: getLanguageLevel(),
    targetLanguageCode: settings.target_language,
    nativeLanguageCode: settings.native_language,
    isLoading,
    
    // Setters
    setTargetLanguage,
    setNativeLanguage,
    setLanguageLevel,
    
    // Helpers
    getLanguageHeaders,
    addLanguageParam,
    getLanguageName,
    getLevelName,
    areDifferentLanguages,
    getAvailableLanguages,
    getAvailableLevels,
    
    // Noms complets
    targetLanguageName: getLanguageName(getTargetLanguage()),
    nativeLanguageName: getLanguageName(getNativeLanguage()),
    languageLevelName: getLevelName(getLanguageLevel())
  };
}