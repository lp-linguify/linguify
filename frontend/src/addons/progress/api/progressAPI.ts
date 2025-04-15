// src/services/progressAPI.ts
import apiClient from '@/core/api/apiClient';
import { handleApiError, waitForNetwork } from '@/core/api/errorHandling';
import { 
  ProgressSummary, 
  UnitProgress, 
  LessonProgress, 
  ContentLessonProgress, 
  UpdateLessonProgressRequest,
  UpdateContentProgressRequest,
  ApiOptions 
} from '@/addons/progress/types';
 
// Configurer un cache pour stocker les résultats
const apiCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Mets en cache ou récupère des données du cache
 */
function withCache<T>(cacheKey: string, data: T, shouldCache: boolean): T {
  if (shouldCache) {
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  return data;
}

/**
 * Récupère les données du cache
 */
function getFromCache<T>(cacheKey: string): T | null {
  const cached = apiCache.get(cacheKey);
  if (!cached) return null;
  
  // Vérifier si le cache est expiré
  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    apiCache.delete(cacheKey);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Active le mode hors ligne pour tester
 */
function enableOfflineMode(durationMs: number = 10000) {
  console.warn(`Mode hors ligne activé pour ${durationMs}ms (test uniquement)`);
  
  // Sauvegarde de la méthode originale
  const originalSend = XMLHttpRequest.prototype.send;
  
  // Redefine the send method to simulate offline behavior
  XMLHttpRequest.prototype.send = function() {
    setTimeout(() => {
      this.dispatchEvent(new Event('error'));
    }, 500);
  };
  
  // Restore the original send method after the specified duration
  setTimeout(() => {
    XMLHttpRequest.prototype.send = originalSend;
    console.warn('Mode hors ligne désactivé');
  }, durationMs);
}

// Queue pour les opérations en attente de connexion
const pendingOperations: Array<() => Promise<any>> = [];

// Fonction pour exécuter les opérations en attente
async function processPendingOperations() {
  if (!navigator.onLine || pendingOperations.length === 0) return;
  
  console.log(`Traitement de ${pendingOperations.length} opérations en attente...`);
  
  while (pendingOperations.length > 0 && navigator.onLine) {
    const operation = pendingOperations.shift();
    if (operation) {
      try {
        await operation();
        console.log('Opération en attente traitée avec succès');
      } catch (error) {
        console.error('Échec du traitement de l\'opération en attente', error);
        // Si c'est une erreur réseau, remettre l'opération dans la queue
        if (error instanceof Error && error.message.includes('Network Error')) {
          pendingOperations.push(operation);
          break;
        }
      }
    }
  }
}

// Exécuter les opérations en attente quand on revient en ligne
if (typeof window !== 'undefined') {
  window.addEventListener('online', processPendingOperations);
}

// Service principal de progression
export const progressService = {
  /**
   * Récupère un résumé de la progression
   */
  getSummary: async (options: ApiOptions = {}): Promise<ProgressSummary> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 3,
      cacheResults = true,
      params = {}, // Ajout du paramètre params pour les paramètres supplémentaires
      fallbackData = {
        summary: {
          total_units: 0,
          completed_units: 0,
          total_lessons: 0,
          completed_lessons: 0,
          total_time_spent_minutes: 0,
          xp_earned: 0
        },
        level_progression: {},
        recent_activity: []
      } as ProgressSummary
    } = options;
  
    // Construction de la clé de cache personnalisée incluant la langue cible
    const targetLanguage = params.target_language;
    const cacheKey = targetLanguage 
      ? `progress-summary-${targetLanguage}` 
      : 'progress-summary';
    
    // Vérifier d'abord le cache
    if (cacheResults) {
      const cachedData = getFromCache<ProgressSummary>(cacheKey);
      if (cachedData) {
        console.log(`Résumé de progression récupéré depuis le cache (langue: ${targetLanguage || 'toutes'})`);
        return cachedData;
      }
    }
  
    // Construction de l'URL avec les paramètres
    let url = '/api/v1/progress/summary/';
    const queryParams: Record<string, string> = {};
    
    // Ajouter le paramètre de langue s'il est spécifié
    if (targetLanguage) {
      queryParams.target_language = targetLanguage;
    }
    
    // Fonction pour effectuer la requête
    const fetchData = async (retryCount = 0): Promise<ProgressSummary> => {
      try {
        // Utiliser apiClient.get avec les paramètres
        const response = await apiClient.get<ProgressSummary>(url, { params: queryParams });
        return withCache(cacheKey, response.data, cacheResults);
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error && 
          error.message.includes('Network Error') && 
          retryOnNetworkError && 
          retryCount < maxRetries
        ) {
          console.log(`Tentative de récupération du résumé (${retryCount + 1}/${maxRetries})...`);
          
          // Attendre que le réseau soit disponible
          const isNetworkAvailable = await waitForNetwork(5000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          // Réessayer avec un délai exponentiel
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchData(retryCount + 1);
        }
  
        // Gérer l'erreur avec notre utilitaire
        const result = handleApiError<ProgressSummary>(
          error,
          'Erreur lors de la récupération du résumé de progression',
          {
            showToast: showErrorToast,
            fallbackData,
            retryCallback: () => fetchData(0)
          }
        );
  
        return result.fallbackData as ProgressSummary;
      }
    };
  
    return fetchData();
  },

  /**
   * Initialise la progression pour un nouvel utilisateur
   */
  initializeProgress: async (options: ApiOptions = {}): Promise<boolean> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 3
    } = options;

    // Fonction pour effectuer la requête
    const performInitialization = async (retryCount = 0): Promise<boolean> => {
      try {
        await apiClient.post('/api/v1/progress/initialize/');
        
        // Vider le cache après l'initialisation
        apiCache.clear();
        
        return true;
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error && 
          error.message.includes('Network Error') && 
          retryOnNetworkError && 
          retryCount < maxRetries
        ) {
          console.log(`Tentative d'initialisation (${retryCount + 1}/${maxRetries})...`);
          
          // Attendre que le réseau soit disponible
          const isNetworkAvailable = await waitForNetwork(5000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          // Réessayer avec un délai exponentiel
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return performInitialization(retryCount + 1);
        }

        // Gérer l'erreur
        handleApiError(
          error, 
          'Erreur lors de l\'initialisation des données de progression',
          { showToast: showErrorToast }
        );
        
        return false;
      }
    };

    return performInitialization();
  },

  /**
   * Récupère la progression des unités
   */
  getUnitProgress: async (unitId?: number, options: ApiOptions = {}): Promise<UnitProgress[]> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 2,
      cacheResults = true,
      fallbackData = [] as UnitProgress[]
    } = options;

    const cacheKey = unitId ? `unit-progress-${unitId}` : 'all-units-progress';
    
    // Vérifier d'abord le cache
    if (cacheResults) {
      const cachedData = getFromCache<UnitProgress[]>(cacheKey);
      if (cachedData) {
        console.log(`Progression des unités récupérée depuis le cache${unitId ? ` pour l'unité ${unitId}` : ''}`);
        return cachedData;
      }
    }

    // Construire l'URL en fonction des paramètres
    const url = unitId 
      ? `/api/v1/progress/units/?unit_id=${unitId}` 
      : '/api/v1/progress/units/';

    // Fonction pour effectuer la requête
    const fetchData = async (retryCount = 0): Promise<UnitProgress[]> => {
      try {
        const response = await apiClient.get<UnitProgress[]>(url);
        return withCache(cacheKey, response.data, cacheResults);
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error && 
          error.message.includes('Network Error') && 
          retryOnNetworkError && 
          retryCount < maxRetries
        ) {
          console.log(`Tentative de récupération des unités (${retryCount + 1}/${maxRetries})...`);
          
          // Attendre que le réseau soit disponible (avec un timeout plus court)
          const isNetworkAvailable = await waitForNetwork(3000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          // Réessayer avec un délai exponentiel
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchData(retryCount + 1);
        }

        // Gérer l'erreur
        const result = handleApiError<UnitProgress[]>(
          error,
          `Erreur lors de la récupération de la progression des unités${unitId ? ` pour l'unité ${unitId}` : ''}`,
          {
            showToast: showErrorToast,
            fallbackData,
            retryCallback: () => fetchData(0)
          }
        );

        return result.fallbackData as UnitProgress[];
      }
    };

    return fetchData();
  },

  /**
   * Récupère la progression des unités par niveau
   */
  getUnitProgressByLevel: async (level: string, options: ApiOptions = {}): Promise<UnitProgress[]> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 2,
      cacheResults = true,
      fallbackData = [] as UnitProgress[]
    } = options;

    const cacheKey = `unit-progress-level-${level}`;
    
    // Vérifier d'abord le cache
    if (cacheResults) {
      const cachedData = getFromCache<UnitProgress[]>(cacheKey);
      if (cachedData) {
        console.log(`Progression des unités pour le niveau ${level} récupérée depuis le cache`);
        return cachedData;
      }
    }

    // Fonction pour effectuer la requête
    const fetchData = async (retryCount = 0): Promise<UnitProgress[]> => {
      try {
        const response = await apiClient.get<UnitProgress[]>(`/api/v1/progress/units/by_level/?level=${level}`);
        return withCache(cacheKey, response.data, cacheResults);
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error && 
          error.message.includes('Network Error') && 
          retryOnNetworkError && 
          retryCount < maxRetries
        ) {
          console.log(`Tentative de récupération des unités du niveau ${level} (${retryCount + 1}/${maxRetries})...`);
          
          // Réessayer avec un délai exponentiel après avoir vérifié la connexion
          const isNetworkAvailable = await waitForNetwork(3000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchData(retryCount + 1);
        }

        // Gérer l'erreur
        const result = handleApiError<UnitProgress[]>(
          error,
          `Erreur lors de la récupération de la progression pour le niveau ${level}`,
          {
            showToast: showErrorToast,
            fallbackData,
            retryCallback: () => fetchData(0)
          }
        );

        return result.fallbackData as UnitProgress[];
      }
    };

    return fetchData();
  },

  /**
   * Récupère la progression des leçons par unité
   */
  getLessonProgressByUnit: async (unitId: number, options: ApiOptions = {}): Promise<LessonProgress[]> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 2,
      cacheResults = true,
      fallbackData = [] as LessonProgress[]
    } = options;

    const cacheKey = `lesson-progress-unit-${unitId}`;
    
    // Vérifier d'abord le cache
    if (cacheResults) {
      const cachedData = getFromCache<LessonProgress[]>(cacheKey);
      if (cachedData) {
        console.log(`Progression des leçons pour l'unité ${unitId} récupérée depuis le cache`);
        return cachedData;
      }
    }

    // Fonction pour effectuer la requête
    const fetchData = async (retryCount = 0): Promise<LessonProgress[]> => {
      try {
        const response = await apiClient.get<LessonProgress[]>(`/api/v1/progress/lessons/by_unit/?unit_id=${unitId}`);
        return withCache(cacheKey, response.data, cacheResults);
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error && 
          error.message.includes('Network Error') && 
          retryOnNetworkError && 
          retryCount < maxRetries
        ) {
          console.log(`Tentative de récupération des leçons pour l'unité ${unitId} (${retryCount + 1}/${maxRetries})...`);
          
          // Réessayer avec un délai exponentiel après avoir vérifié la connexion
          const isNetworkAvailable = await waitForNetwork(3000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchData(retryCount + 1);
        }

        // Gérer l'erreur
        const result = handleApiError<LessonProgress[]>(
          error,
          `Erreur lors de la récupération des leçons pour l'unité ${unitId}`,
          {
            showToast: showErrorToast,
            fallbackData,
            retryCallback: () => fetchData(0)
          }
        );

        return result.fallbackData as LessonProgress[];
      }
    };

    return fetchData();
  },

  /**
   * Récupère la progression des contenus de leçon
   */
  getContentLessonProgress: async (lessonId: number, options: ApiOptions = {}): Promise<ContentLessonProgress[]> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 2,
      cacheResults = true,
      fallbackData = [] as ContentLessonProgress[]
    } = options;

    const cacheKey = `content-lesson-progress-${lessonId}`;
    
    // Vérifier d'abord le cache
    if (cacheResults) {
      const cachedData = getFromCache<ContentLessonProgress[]>(cacheKey);
      if (cachedData) {
        console.log(`Progression des contenus pour la leçon ${lessonId} récupérée depuis le cache`);
        return cachedData;
      }
    }

    // Fonction pour effectuer la requête
    const fetchData = async (retryCount = 0): Promise<ContentLessonProgress[]> => {
      try {
        const response = await apiClient.get<ContentLessonProgress[]>(
          `/api/v1/progress/content-lessons/by_lesson/?lesson_id=${lessonId}`
        );
        return withCache(cacheKey, response.data, cacheResults);
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error && 
          error.message.includes('Network Error') && 
          retryOnNetworkError && 
          retryCount < maxRetries
        ) {
          console.log(`Tentative de récupération des contenus pour la leçon ${lessonId} (${retryCount + 1}/${maxRetries})...`);
          
          // Réessayer avec un délai exponentiel après avoir vérifié la connexion
          const isNetworkAvailable = await waitForNetwork(3000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchData(retryCount + 1);
        }

        // Gérer l'erreur
        const result = handleApiError<ContentLessonProgress[]>(
          error,
          `Erreur lors de la récupération des contenus pour la leçon ${lessonId}`,
          {
            showToast: showErrorToast,
            fallbackData,
            retryCallback: () => fetchData(0)
          }
        );

        return result.fallbackData as ContentLessonProgress[];
      }
    };

    return fetchData();
  },

  /**
   * Met à jour la progression d'une leçon avec gestion hors ligne
   */
  updateLessonProgress: async (
    data: UpdateLessonProgressRequest, 
    options: ApiOptions = {}
  ): Promise<LessonProgress | null> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 3
    } = options;

    // Stocker la requête dans le localStorage pour la persistance entre les rechargements
    const addToPendingUpdates = () => {
      try {
        const pendingUpdates = JSON.parse(localStorage.getItem('pendingProgressUpdates') || '[]');
        pendingUpdates.push({
          type: 'lesson',
          data,
          timestamp: Date.now()
        });
        localStorage.setItem('pendingProgressUpdates', JSON.stringify(pendingUpdates));
        console.log('Mise à jour de la leçon mise en file d\'attente pour synchronisation ultérieure');
      } catch (storageError) {
        console.error('Erreur lors de la mise en file d\'attente de la mise à jour', storageError);
      }
    };

    // Fonction pour effectuer la requête
    const performUpdate = async (retryCount = 0): Promise<LessonProgress | null> => {
      try {
        // Vider le cache pour cette leçon car les données vont changer
        const cacheKey = `lesson-progress-unit-${data.lesson_id}`;
        apiCache.delete(cacheKey);
        
        const response = await apiClient.post<LessonProgress>('/api/v1/progress/lessons/update_progress/', data);
        
        // Vider d'autres caches potentiellement affectés
        apiCache.delete('progress-summary');
        apiCache.delete(`unit-progress-level-A1`); // Exemple, idéalement on viderait le cache pour tous les niveaux
        
        return response.data;
      } catch (error: unknown) {
        // Si c'est une erreur réseau
        if (error instanceof Error && error.message.includes('Network Error')) {
          // Stocker pour synchronisation ultérieure
          addToPendingUpdates();
          
          // Si on doit réessayer immédiatement
          if (retryOnNetworkError && retryCount < maxRetries) {
            console.log(`Tentative de mise à jour de la leçon ${data.lesson_id} (${retryCount + 1}/${maxRetries})...`);
            
            // Attendre que le réseau soit disponible
            const isNetworkAvailable = await waitForNetwork(3000);
            if (!isNetworkAvailable) {
              // Retourner un faux succès, la synchronisation se fera plus tard
              return null;
            }
            
            // Réessayer avec un délai exponentiel
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return performUpdate(retryCount + 1);
          }
          
          // Retourner un "succès" même si on est hors ligne
          // La mise à jour sera synchronisée quand on sera en ligne
          return null;
        }

        // Gérer les autres types d'erreurs
        handleApiError(
          error,
          `Erreur lors de la mise à jour de la progression de la leçon ${data.lesson_id}`,
          {
            showToast: showErrorToast,
            retryCallback: retryOnNetworkError ? () => performUpdate(0) : undefined
          }
        );
        
        return null;
      }
    };

    // Ajouter l'opération à la file d'attente si on est hors ligne
    if (!navigator.onLine) {
      addToPendingUpdates();
      return null;
    }

    return performUpdate();
  },

  /**
   * Met à jour la progression d'un contenu de leçon avec gestion hors ligne
   */
  updateContentLessonProgress: async (
    data: UpdateContentProgressRequest, 
    options: ApiOptions = {}
  ): Promise<ContentLessonProgress | null> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 3
    } = options;

    // Stocker la requête dans le localStorage pour la persistance entre les rechargements
    const addToPendingUpdates = () => {
      try {
        const pendingUpdates = JSON.parse(localStorage.getItem('pendingProgressUpdates') || '[]');
        pendingUpdates.push({
          type: 'content',
          data,
          timestamp: Date.now()
        });
        localStorage.setItem('pendingProgressUpdates', JSON.stringify(pendingUpdates));
        console.log('Mise à jour du contenu mise en file d\'attente pour synchronisation ultérieure');
      } catch (storageError) {
        console.error('Erreur lors de la mise en file d\'attente de la mise à jour', storageError);
      }
    };

    // Fonction pour effectuer la requête
    const performUpdate = async (retryCount = 0): Promise<ContentLessonProgress | null> => {
      try {
        // Vider le cache pour ce contenu car les données vont changer
        apiCache.clear(); // On vide tout le cache pour simplifier
        
        const response = await apiClient.post<ContentLessonProgress>(
          '/api/v1/progress/content-lessons/update_progress/', 
          data
        );
        
        return response.data;
      } catch (error: unknown) {
        // Si c'est une erreur réseau
        if (error instanceof Error && error.message.includes('Network Error')) {
          // Stocker pour synchronisation ultérieure
          addToPendingUpdates();
          
          // Si on doit réessayer immédiatement
          if (retryOnNetworkError && retryCount < maxRetries) {
            console.log(`Tentative de mise à jour du contenu ${data.content_lesson_id} (${retryCount + 1}/${maxRetries})...`);
            
            // Attendre que le réseau soit disponible
            const isNetworkAvailable = await waitForNetwork(3000);
            if (!isNetworkAvailable) {
              // Retourner un faux succès, la synchronisation se fera plus tard
              return null;
            }
            
            // Réessayer avec un délai exponentiel
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return performUpdate(retryCount + 1);
          }
          
          // Retourner un "succès" même si on est hors ligne
          // La mise à jour sera synchronisée quand on sera en ligne
          return null;
        }

        // Gérer les autres types d'erreurs
        handleApiError(
          error,
          `Erreur lors de la mise à jour du contenu de leçon ${data.content_lesson_id}`,
          {
            showToast: showErrorToast,
            retryCallback: retryOnNetworkError ? () => performUpdate(0) : undefined
          }
        );
        
        return null;
      }
    };

    // Ajouter l'opération à la file d'attente si on est hors ligne
    if (!navigator.onLine) {
      addToPendingUpdates();
      return null;
    }

    return performUpdate();
  },

  /**
   * Récupère l'historique d'activités pour les graphiques
   */
  getActivityHistory: async (
    period: 'week' | 'month' | 'year' = 'week', 
    options: ApiOptions = {}
  ): Promise<any> => {
    const {
      showErrorToast = true,
      retryOnNetworkError = true,
      maxRetries = 2,
      cacheResults = true,
      fallbackData = { activities: [] }
    } = options;

    const cacheKey = `activity-history-${period}`;
    
    // Vérifier d'abord le cache
    if (cacheResults) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        console.log(`Historique d'activités pour la période ${period} récupéré depuis le cache`);
        return cachedData;
      }
    }

    // Fonction pour effectuer la requête
    const fetchData = async (retryCount = 0): Promise<any> => {
      try {
        const response = await apiClient.get(`/api/v1/progress/activity-history/?period=${period}`);
        return withCache(cacheKey, response.data, cacheResults);
      } catch (error: unknown) {
        // Si c'est une erreur réseau et qu'on a encore des essais
        if (
          error instanceof Error &&
          error.message.includes('Network Error') &&
          retryOnNetworkError &&
          retryCount < maxRetries
        ) {
          console.log(`Tentative de récupération de l'historique (${retryCount + 1}/${maxRetries})...`);
          
          // Réessayer avec un délai exponentiel après avoir vérifié la connexion
          const isNetworkAvailable = await waitForNetwork(3000);
          if (!isNetworkAvailable) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return fetchData(retryCount + 1);
        }

        // Gérer l'erreur
        const result = handleApiError(
          error,
          `Erreur lors de la récupération de l'historique d'activités`,
          {
            showToast: showErrorToast,
            fallbackData,
            retryCallback: () => fetchData(0)
          }
        );

        return result.fallbackData;
      }
    };

    return fetchData();
  },

  /**
   * Synchronise les mises à jour en attente
   */
  syncPendingUpdates: async (): Promise<boolean> => {
    if (!navigator.onLine) {
      console.log('Impossible de synchroniser les mises à jour : hors ligne');
      return false;
    }
    
    try {
      const pendingUpdates = JSON.parse(localStorage.getItem('pendingProgressUpdates') || '[]');
      
      if (pendingUpdates.length === 0) {
        console.log('Aucune mise à jour en attente à synchroniser');
        return true;
      }
      
      console.log(`Synchronisation de ${pendingUpdates.length} mises à jour en attente...`);
      
      // Traiter chaque mise à jour
      for (const update of pendingUpdates) {
        try {
          if (update.type === 'lesson') {
            await apiClient.post('/api/v1/progress/lessons/update_progress/', update.data);
          } else if (update.type === 'content') {
            await apiClient.post('/api/v1/progress/content-lessons/update_progress/', update.data);
          }
          
          // Supprimer cette mise à jour de la liste
          const index = pendingUpdates.indexOf(update);
          if (index > -1) {
            pendingUpdates.splice(index, 1);
          }
          
          // Mettre à jour le stockage
          localStorage.setItem('pendingProgressUpdates', JSON.stringify(pendingUpdates));
        } catch (error: unknown) {
          console.error('Erreur lors de la synchronisation d\'une mise à jour', error);
          // Si c'est une erreur réseau, arrêter la synchronisation
          if (error instanceof Error && error.message.includes('Network Error')) {
            return false;
          }
        }
      }
      
      // Effacer le stockage si toutes les mises à jour ont été traitées
      localStorage.setItem('pendingProgressUpdates', JSON.stringify([]));
      console.log('Synchronisation des mises à jour terminée avec succès');
      
      // Vider le cache après synchronisation
      apiCache.clear();
      
      return true;
    } catch (error: unknown) {
      console.error('Erreur lors de la synchronisation des mises à jour', error);
      return false;
    }
  },
  
  /**
   * Vide le cache API
   */
  clearCache: (): void => {
    apiCache.clear();
    console.log('Cache de progression vidé');
  },
  
  /**
   * Active le mode de test hors ligne (pour le développement uniquement)
   */
  testOfflineMode: (durationMs = 10000): void => {
    if (process.env.NODE_ENV === 'development') {
      enableOfflineMode(durationMs);
    }
  }
};

// Fonction d'initialisation qui tente de synchroniser les mises à jour en attente
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      progressService.syncPendingUpdates();
    }, 2000);
  });
}

export default progressService;