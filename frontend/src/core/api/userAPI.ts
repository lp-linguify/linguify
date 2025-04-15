// src/core/api/userAPI.ts
import apiClient from '@/core/api/apiClient';
import { User } from '@/core/types/user';
import { DEFAULT_USER_SETTINGS } from '@/addons/settings/constants/usersettings';

// Type pour les mises à jour partielles du profil utilisateur
export type PartialUserProfile = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

// Type pour les paramètres utilisateur
export type UserSettings = typeof DEFAULT_USER_SETTINGS;

// Définition des types pour les paramètres des requêtes
export interface ProfilePictureUploadParams {
  profile_picture: File;
}

/**
 * Service unifié pour toutes les opérations liées aux utilisateurs et leurs paramètres
 */
class UserApiService {
  private readonly BASE_URL = '/api/auth';
  
  // ===== GESTION DU PROFIL UTILISATEUR =====
  
  /**
   * Récupère le profil complet de l'utilisateur actuel depuis le backend
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/me/`);
      return response.data;
    } catch (error) {
      this.handleError('Erreur lors de la récupération du profil utilisateur', error);
      throw error;
    }
  }

  /**
   * Met à jour le profil de l'utilisateur courant
   * @param userData Données partielles du profil à mettre à jour
   */
  async updateUserProfile(userData: PartialUserProfile): Promise<User> {
    try {
      const response = await apiClient.patch(`${this.BASE_URL}/me/`, userData);
      
      // Mettre à jour le localStorage avec les changements
      this.updateLocalSettings(userData);
      
      return response.data;
    } catch (error) {
      this.handleError('Erreur lors de la mise à jour du profil utilisateur', error);
      throw error;
    }
  }

  /**
   * Upload d'une photo de profil
   * @param file Fichier image à uploader
   */
  async uploadProfilePicture(file: File): Promise<{ profile_picture: string }> {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
  
      const response = await apiClient.post(`${this.BASE_URL}/profile-picture/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return response.data;
    } catch (error) {
      this.handleError('Erreur lors de l\'upload de la photo de profil', error);
      throw error;
    }
  }

  // ===== GESTION DES PARAMÈTRES UTILISATEUR =====
  
  /**
   * Récupère tous les paramètres utilisateur depuis le backend
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/me/settings/`);
      
      // Enregistrer dans localStorage pour accès hors ligne
      this.saveLocalSettings(response.data);
      
      return response.data;
    } catch (error) {
      this.handleError('Erreur lors de la récupération des paramètres utilisateur', error);
      
      // En cas d'erreur, essayer de charger depuis localStorage
      const localSettings = this.getLocalSettings();
      return localSettings;
    }
  }
  
  /**
   * Met à jour les paramètres utilisateur
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // Séparer les paramètres de langue des autres paramètres
      const languageSettings: Record<string, any> = {};
      const otherSettings: Record<string, any> = {};
      
      Object.entries(settings).forEach(([key, value]) => {
        if (['native_language', 'target_language', 'language_level', 'objectives'].includes(key)) {
          languageSettings[key] = value;
        } else {
          otherSettings[key] = value;
        }
      });
      
      // Mettre à jour les paramètres en local immédiatement pour une UI réactive
      this.updateLocalSettings(settings);
      
      // Effectuer les appels API nécessaires
      const promises = [];
      
      if (Object.keys(languageSettings).length > 0) {
        promises.push(
          apiClient.patch(`${this.BASE_URL}/me/`, languageSettings)
        );
      }
      
      if (Object.keys(otherSettings).length > 0) {
        promises.push(
          apiClient.post(`${this.BASE_URL}/me/settings/`, otherSettings)
        );
      }
      
      const results = await Promise.all(promises);
      
      // Fusionner les résultats
      const mergedSettings = { ...DEFAULT_USER_SETTINGS };
      
      // S'il y a au moins un résultat, mettre à jour les paramètres fusionnés
      if (results.length > 0) {
        for (const result of results) {
          if (result?.data) {
            // Si c'est un objet settings spécifique
            if (result.data.settings) {
              Object.assign(mergedSettings, result.data.settings);
            } 
            // Si c'est une réponse directe avec des champs
            else {
              Object.assign(mergedSettings, result.data);
            }
          }
        }
      }
      
      // Enregistrer dans localStorage
      this.saveLocalSettings(mergedSettings);
      
      return mergedSettings;
    } catch (error) {
      this.handleError('Erreur lors de la mise à jour des paramètres utilisateur', error);
      throw error;
    }
  }
  
  /**
   * Met à jour un paramètre utilisateur spécifique
   */
  async updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<UserSettings> {
    return this.updateSettings({ [key]: value } as Partial<UserSettings>);
  }
  
  /**
   * Récupère les préférences d'apprentissage de l'utilisateur
   */
  async getLearningPreferences(): Promise<{
    native_language: string;
    target_language: string;
    language_level: string;
    objectives: string;
  }> {
    try {
      // On peut utiliser me/ car ces infos sont dans le profil
      const response = await apiClient.get(`${this.BASE_URL}/me/`);
      
      // Extraire uniquement les informations de langue
      const { native_language, target_language, language_level, objectives } = response.data;
      
      return { native_language, target_language, language_level, objectives };
    } catch (error) {
      this.handleError('Erreur lors de la récupération des préférences d\'apprentissage', error);
      
      // Essayer de récupérer depuis localStorage
      const localSettings = this.getLocalSettings();
      return {
        native_language: localSettings.native_language,
        target_language: localSettings.target_language,
        language_level: localSettings.language_level,
        objectives: localSettings.objectives
      };
    }
  }

  /**
   * Met à jour les préférences d'apprentissage de l'utilisateur
   */
  async updateLearningPreferences(preferences: {
    native_language?: string;
    target_language?: string;
    language_level?: string;
    objectives?: string;
  }): Promise<{
    native_language: string;
    target_language: string;
    language_level: string;
    objectives: string;
  }> {
    try {
      // Mettre à jour en local immédiatement
      this.updateLocalSettings(preferences);
      
      // Envoyer au backend via me/ car ces champs sont dans le profil
      const response = await apiClient.patch(`${this.BASE_URL}/me/`, preferences);
      
      // Extraire uniquement les informations de langue mises à jour
      const { native_language, target_language, language_level, objectives } = response.data;
      
      return { native_language, target_language, language_level, objectives };
    } catch (error) {
      this.handleError('Erreur lors de la mise à jour des préférences d\'apprentissage', error);
      throw error;
    }
  }
  
  // ===== AUTRES FONCTIONNALITÉS =====
  
  /**
   * Vérifie si l'utilisateur actuel est abonné à un plan premium
   */
  async checkSubscriptionStatus(): Promise<{ is_subscribed: boolean; plan_type?: string; expires_at?: string }> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/user/subscription/`);
      return response.data;
    } catch (error) {
      this.handleError('Erreur lors de la vérification du statut d\'abonnement', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique d'activité de l'utilisateur
   */
  async getUserActivity(limit: number = 10): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/user/activity/`, {
        params: { limit }
      });
      return response.data.results;
    } catch (error) {
      this.handleError('Erreur lors de la récupération de l\'historique d\'activité', error);
      throw error;
    }
  }
  
  // ===== GESTION DU STOCKAGE LOCAL =====
  
  /**
   * Enregistre des paramètres dans le stockage local
   */
  saveLocalSettings(settings: Partial<UserSettings>): void {
    try {
      const currentSettings = this.getLocalSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('[UserAPI] Erreur lors de l\'enregistrement des paramètres locaux:', error);
    }
  }
  
  /**
   * Met à jour les paramètres dans le stockage local
   */
  updateLocalSettings(settings: Record<string, any>): void {
    try {
      const storedData = localStorage.getItem('userSettings');
      
      if (storedData) {
        const currentSettings = JSON.parse(storedData);
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      } else {
        // Si aucun paramètre n'existe encore, créer avec les valeurs par défaut
        const newSettings = { ...DEFAULT_USER_SETTINGS, ...settings };
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error('[UserAPI] Erreur lors de la mise à jour des paramètres locaux:', error);
    }
  }
  
  /**
   * Récupère les paramètres depuis le stockage local
   */
  getLocalSettings(): UserSettings {
    try {
      const storedData = localStorage.getItem('userSettings');
      
      if (storedData) {
        const parsedSettings = JSON.parse(storedData);
        return { ...DEFAULT_USER_SETTINGS, ...parsedSettings };
      }
      
      return { ...DEFAULT_USER_SETTINGS };
    } catch (error) {
      console.error('[UserAPI] Erreur lors de la récupération des paramètres locaux:', error);
      return { ...DEFAULT_USER_SETTINGS };
    }
  }
  
  /**
   * Synchronise les paramètres locaux avec le backend
   * Utile quand l'utilisateur vient de se connecter
   */
  async syncLocalSettings(): Promise<void> {
    try {
      const localSettings = this.getLocalSettings();
      await this.updateSettings(localSettings);
      console.log('[UserAPI] Paramètres locaux synchronisés avec le backend');
    } catch (error) {
      this.handleError('Erreur lors de la synchronisation des paramètres locaux', error);
    }
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(message: string, error: any): void {
    console.error(`[UserAPI] ${message}:`, {
      error,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

// Exporter une instance singleton du service
export const userApiService = new UserApiService();

// ===== ADAPTATEURS DE COMPATIBILITÉ =====

/**
 * Interface de compatibilité pour l'ancien service userSettingsService
 */
export interface LegacyUserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    bio: string | null;
  };
  language: {
    nativeLanguage: string;
    targetLanguage: string;
    level: string;
  };
  learning: {
    objectives: string;
  };
  account: {
    isCoach: boolean;
    isSubscribed: boolean;
  };
}

export type PartialUserSettings = Partial<LegacyUserSettings>;

/**
 * Adaptateur pour maintenir la compatibilité avec l'ancien format de paramètres
 */
class LegacyUserSettingsAdapter {
  async getUserSettings(): Promise<LegacyUserSettings> {
    try {
      const userData = await userApiService.getCurrentUser();
      return this.transformUserToSettings(userData);
    } catch (error) {
      console.error('[UserSettingsAdapter] Error fetching user settings', error);
      throw error;
    }
  }

  async updateUserSettings(settings: PartialUserSettings): Promise<LegacyUserSettings> {
    try {
      const payload = this.transformSettingsToUserData(settings);
      const userData = await userApiService.updateUserProfile(payload);
      return this.transformUserToSettings(userData);
    } catch (error) {
      console.error('[UserSettingsAdapter] Error updating user settings', error);
      throw error;
    }
  }

  private transformUserToSettings(userData: User): LegacyUserSettings {
    return {
      profile: {
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        bio: userData.bio,
      },
      language: {
        nativeLanguage: userData.native_language || '',
        targetLanguage: userData.target_language || '',
        level: userData.language_level || '',
      },
      learning: {
        objectives: userData.objectives || '',
      },
      account: {
        isCoach: Boolean(userData.is_coach),
        isSubscribed: Boolean(userData.is_subscribed),
      },
    };
  }

  private transformSettingsToUserData(settings: PartialUserSettings): PartialUserProfile {
    const userData: PartialUserProfile = {};

    if (settings.profile) {
      if (settings.profile.firstName !== undefined) userData.first_name = settings.profile.firstName;
      if (settings.profile.lastName !== undefined) userData.last_name = settings.profile.lastName;
      if (settings.profile.bio !== undefined) userData.bio = settings.profile.bio;
    }

    if (settings.language) {
      if (settings.language.nativeLanguage !== undefined) userData.native_language = settings.language.nativeLanguage as any;
      if (settings.language.targetLanguage !== undefined) userData.target_language = settings.language.targetLanguage as any;
      if (settings.language.level !== undefined) userData.language_level = settings.language.level;
    }

    if (settings.learning?.objectives !== undefined) {
      userData.objectives = settings.learning.objectives;
    }

    return userData;
  }
}

// Exportation de l'adaptateur pour compatibilité
export const userSettingsService = new LegacyUserSettingsAdapter();

// Exportation de l'ancien service pour compatibilité
export default userApiService;