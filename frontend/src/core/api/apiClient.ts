// src/services/axiosAuthInterceptor.ts
import axios, { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios';
import authService from '../auth/authService';

/**
 * Crée une instance Axios configurée avec des intercepteurs d'authentification
 */
export function createAuthenticatedApiClient(baseURL: string): AxiosInstance {
  // Créer une instance avec la configuration de base
  const apiClient = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true // Pour envoyer les cookies
  });

  // Intercepteur pour les requêtes - ajoute le token à chaque requête
  apiClient.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
      try {
        // Récupérer le token
        const token = authService.getAuthToken();
        
        if (token) {
          // S'assurer que config.headers existe
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[API] Request ${config.method?.toUpperCase()} ${config.url} with token`);
          }
        } else {
          console.warn(`[API] Request ${config.method?.toUpperCase()} ${config.url} without token`);
        }
        
        return config;
      } catch (error) {
        console.error('[API] Error in request interceptor:', error);
        return config;
      }
    },
    (error: AxiosError) => {
      console.error('[API] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Intercepteur pour les réponses - gère les erreurs d'authentification
  apiClient.interceptors.response.use(
    (response) => {
      // Réponse réussie, la transmettre
      return response;
    },
    async (error: AxiosError) => {
      if (error.response) {
        // Erreur d'authentification (401)
        if (error.response.status === 401) {
          console.warn('[API] Authentication error (401)');
          
          // Effacer les données d'authentification
          authService.clearAuthData();
          
          // Rediriger vers la page de connexion si dans le navigateur
          if (typeof window !== 'undefined') {
            // Mémoriser la page actuelle pour y revenir après connexion
            const returnTo = window.location.pathname;
            window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
          }
        }
        
        // Erreur d'autorisation (403)
        else if (error.response.status === 403) {
          console.warn('[API] Authorization error (403)');
          // Vous pourriez rediriger vers une page "Accès refusé" ici
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse (problème réseau)
        console.error('[API] No response received:', error.request);
      } else {
        // Erreur lors de la configuration de la requête
        console.error('[API] Request error:', error.message);
      }
      
      return Promise.reject(error);
    }
  );

  return apiClient;
}

// Crée et exporte une instance par défaut
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const apiClient = createAuthenticatedApiClient(API_BASE_URL);

export default apiClient;