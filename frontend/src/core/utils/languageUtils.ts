// src/core/utils/languageUtils.ts
// Ce fichier fournit des fonctions statiques pour les composants non-React
// ou les parties de code qui ne peuvent pas utiliser de hooks React

import { LANGUAGE_OPTIONS, LEVEL_OPTIONS } from '@/addons/settings/constants/usersettings';

/**
 * Récupère la langue cible de l'utilisateur depuis les paramètres stockés
 * Normalise la langue au format attendu par l'API (en, fr, es, nl)
 */
export function getUserTargetLanguage(): string {
  try {
    // Récupérer depuis localStorage
    const userSettingsStr = localStorage.getItem('userSettings');
    if (userSettingsStr) {
      const userSettings = JSON.parse(userSettingsStr);
      if (userSettings.target_language) {
        // Normaliser le format (EN -> en, FR -> fr, etc.)
        const lang = userSettings.target_language.toLowerCase();
        // Vérifier que c'est une langue supportée
        if (['en', 'fr', 'es', 'nl'].includes(lang)) {
          return lang;
        }
      }
    }
  } catch (error) {
    console.error('Error getting user target language:', error);
  }
  // Retourner 'fr' par défaut
  return 'fr';
}

/**
 * Configure les en-têtes HTTP appropriés pour les requêtes API
 * avec la langue cible de l'utilisateur
 */
export function getLanguageHeaders(targetLanguage?: string): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  
  // Utiliser la langue spécifiée ou récupérer depuis les paramètres utilisateur
  const lang = targetLanguage || getUserTargetLanguage();
  
  // Ajouter l'en-tête Accept-Language pour les API qui s'appuient sur cet en-tête
  headers.append('Accept-Language', lang);
  
  return headers;
}

/**
 * Ajoute le paramètre de langue cible à une URL d'API
 */
export function addLanguageParam(url: URL, targetLanguage?: string): URL {
  const lang = targetLanguage || getUserTargetLanguage();
  url.searchParams.append('target_language', lang);
  return url;
}

/**
 * Récupère la langue maternelle de l'utilisateur depuis les paramètres stockés
 */
export function getUserNativeLanguage(): string {
  // Récupérer depuis localStorage ou utiliser 'en' par défaut
  const userSettingsStr = localStorage.getItem('userSettings');
  if (userSettingsStr) {
    try {
      const settings = JSON.parse(userSettingsStr);
      return settings.native_language?.toLowerCase() || 'en';
    } catch (e) {
      console.error("Error parsing user settings:", e);
    }
  }
  // Retourner 'en' par défaut
  return 'en';
}

/**
 * Enregistre les paramètres de langue dans localStorage
 * Utile pour les modules qui ne peuvent pas utiliser les hooks React
 */
export function saveLanguageSettings(settings: {
  target_language?: string;
  native_language?: string;
  language_level?: string;
}): void {
  try {
    // Lire les paramètres actuels
    const userSettingsStr = localStorage.getItem('userSettings');
    let userSettings = {};
    
    if (userSettingsStr) {
      userSettings = JSON.parse(userSettingsStr);
    }
    
    // Mettre à jour avec les nouveaux paramètres
    const updatedSettings = { 
      ...userSettings, 
      ...settings 
    };
    
    // Enregistrer dans localStorage
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    
    console.log('Language settings saved locally:', settings);
  } catch (error) {
    console.error('Error saving language settings:', error);
  }
}

/**
 * Obtient le nom complet d'une langue à partir de son code
 */
export function getLanguageName(code: string): string {
  const option = LANGUAGE_OPTIONS.find(opt => 
    opt.value.toLowerCase() === code.toLowerCase()
  );
  return option ? option.label : code;
}

/**
 * Obtient le libellé du niveau de langue à partir du code
 */
export function getLevelName(code: string): string {
  const option = LEVEL_OPTIONS.find(opt => opt.value === code);
  return option ? option.label : code;
}

// Exporter aussi un objet pour les cas où l'importation d'objets est préférée
export const languageUtils = {
  getUserTargetLanguage,
  getUserNativeLanguage,
  getLanguageHeaders,
  addLanguageParam,
  saveLanguageSettings,
  getLanguageName,
  getLevelName,
  
  // Retourne toutes les informations de langue en une seule fonction
  getLanguageInfo() {
    return {
      targetLanguage: getUserTargetLanguage(),
      nativeLanguage: getUserNativeLanguage(),
      targetLanguageName: getLanguageName(getUserTargetLanguage()),
      nativeLanguageName: getLanguageName(getUserNativeLanguage())
    };
  }
};

export default languageUtils;