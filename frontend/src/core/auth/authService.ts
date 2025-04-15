// src/services/authService.ts
/**
 * Service d'authentification unifié pour l'application
 * Centralise toute la logique d'authentification en un seul endroit
 */

// Enable debug mode for verbose logging
const DEBUG_MODE = true;

// Constantes
const AUTH_STORAGE_KEY = 'auth_state';
const TOKEN_COOKIE_NAME = 'access_token'; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Cache en mémoire pour éviter des accès répétés au stockage
let memoryToken: string | null = null;
let memoryExpiry: number | null = null;

// Enhanced logging
function logDebug(message: string, data?: any): void {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`[Auth Debug] ${message}`, data);
    } else {
      console.log(`[Auth Debug] ${message}`);
    }
  }
}

function logInfo(message: string, data?: any): void {
  if (data) {
    console.info(`[Auth Info] ${message}`, data);
  } else {
    console.info(`[Auth Info] ${message}`);
  }
}

function logWarning(message: string, data?: any): void {
  if (data) {
    console.warn(`[Auth Warning] ${message}`, data);
  } else {
    console.warn(`[Auth Warning] ${message}`);
  }
}

function logError(message: string, error?: any): void {
  if (error) {
    console.error(`[Auth Error] ${message}`, error);
  } else {
    console.error(`[Auth Error] ${message}`);
  }
}

// Interface pour le profil utilisateur
export interface UserProfile {
  id: string;
  email: string; 
  name: string;
  username: string;
  first_name: string;
  last_name: string;
  picture?: string;
  native_language: string;
  target_language: string;
  language_level: string;
  objectives: string;
  is_coach: boolean;
  is_subscribed: boolean;
  [key: string]: any; // Pour les autres champs possibles
}

/**
 * Extrait les informations d'un token JWT
 */
export function parseJwt(token: string): { exp: number, iat: number, sub: string } | null {
  try {
    logDebug(`Attempting to parse JWT token`);
    
    // Validate token format
    if (!token || !token.includes('.')) {
      logWarning(`Invalid token format`);
      return null;
    }
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    logDebug(`JWT token parsed successfully`, {
      exp: new Date(parsed.exp * 1000).toISOString(),
      iat: new Date(parsed.iat * 1000).toISOString(),
      sub: parsed.sub
    });
    
    return parsed;
  } catch (e) {
    logError(`Failed to parse JWT token`, e);
    return null;
  }
}

/**
 * Vérifie si un token est expiré avec une marge de sécurité
 */
export function isTokenExpired(token: string): boolean {
  try {
    logDebug(`Checking if token is expired`);
    
    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      logWarning(`Token payload is invalid or missing expiration`);
      return true;
    }
    
    // Ajouter une marge de 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp <= (now + 300);
    
    if (isExpired) {
      logWarning(`Token is expired or expiring soon`, {
        expiration: new Date(payload.exp * 1000).toISOString(),
        currentTime: new Date(now * 1000).toISOString(),
        timeUntilExpiry: payload.exp - now
      });
    } else {
      logDebug(`Token is valid`, {
        expiration: new Date(payload.exp * 1000).toISOString(),
        currentTime: new Date(now * 1000).toISOString(),
        timeUntilExpiry: payload.exp - now
      });
    }
    
    return isExpired;
  } catch (e) {
    logError(`Error checking token expiration`, e);
    return true;
  }
}

/**
 * Vérifie si un token n'est pas encore valide (problème de iat)
 */
export function isTokenNotYetValid(token: string): boolean {
  try {
    logDebug(`Checking if token is not yet valid (iat issue)`);
    
    const payload = parseJwt(token);
    if (!payload || !payload.iat) {
      logWarning(`Token payload is invalid or missing issued at time`);
      return false;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const isNotYetValid = payload.iat > now;
    
    if (isNotYetValid) {
      logWarning(`Token is not yet valid - possible clock skew issue`, {
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        currentTime: new Date(now * 1000).toISOString(),
        timeDifference: payload.iat - now
      });
    }
    
    return isNotYetValid;
  } catch (e) {
    logError(`Error checking token validity timing`, e);
    return false;
  }
}

/**
 * Stocke le token d'authentification et les métadonnées associées
 */
export function storeAuthData(token: string, user?: UserProfile): void {
  logInfo(`Attempting to store auth data`);
  
  if (!token || typeof token !== 'string') {
    logError(`Invalid token, cannot store`);
    return;
  }

  try {
    // Vérifier si le token n'est pas encore valide (iat > now)
    if (isTokenNotYetValid(token)) {
      logWarning(`Warning: Storing a token that's not yet valid`);
    }
    
    // Vérifier l'expiration
    const payload = parseJwt(token);
    if (!payload) {
      logError(`Failed to parse token payload, cannot store auth data`);
      return;
    }
    
    const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + 86400000; // 24h par défaut
    logDebug(`Token expires at ${new Date(expiresAt).toISOString()}`);

    // Mettre à jour le cache mémoire
    memoryToken = token;
    memoryExpiry = expiresAt;
    logDebug(`Updated memory cache with token`);

    // Stocker dans localStorage avec métadonnées
    const authData = {
      token,
      expiresAt,
      user,
      lastUpdated: Date.now()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    logDebug(`Stored auth data in localStorage`);

    // Définir un cookie pour l'accès côté serveur et cross-tab
    document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
    logDebug(`Set auth cookie ${TOKEN_COOKIE_NAME}`);
    
    logInfo(`Auth data stored successfully`);
    
    if (user) {
      logDebug(`User profile stored with auth data`, {
        email: user.email,
        name: user.name,
        roles: user.is_coach ? ['coach'] : []
      });
    }
  } catch (error) {
    logError(`Error storing auth data`, error);
  }
}

/**
 * Efface toutes les données d'authentification
 */
export function clearAuthData(): void {
  logInfo(`Clearing all auth data`);
  try {
    // Effacer le cache mémoire
    memoryToken = null;
    memoryExpiry = null;
    logDebug(`Cleared memory token cache`);

    // Effacer localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    logDebug(`Removed auth data from localStorage`);

    // Effacer le cookie
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    logDebug(`Cleared auth cookie`);
    
    // Log other potential auth cookies for debugging
    const cookies = document.cookie.split(';');
    if (cookies.length > 0 && cookies[0] !== '') {
      logDebug(`Remaining cookies after clearAuthData:`, cookies);
    }
    
    logInfo(`Auth data cleared successfully`);
  } catch (error) {
    logError(`Error clearing auth data`, error);
  }
}

/**
 * Récupère le token d'authentification depuis toutes les sources possibles
 * Stratégie de récupération : mémoire > localStorage > cookies
 */
export function getAuthToken(): string | null {
  logDebug(`Attempting to get auth token from available sources`);
  try {
    // 1. Vérifier d'abord le cache mémoire
    if (memoryToken && memoryExpiry && memoryExpiry > Date.now()) {
      logDebug(`Using token from memory cache, expires at ${new Date(memoryExpiry).toISOString()}`);
      return memoryToken;
    } else if (memoryToken) {
      logDebug(`Memory token exists but ${memoryExpiry ? 'is expired' : 'has no expiry'}`);
    }

    // 2. Essayer localStorage ensuite
    const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedData) {
      logDebug(`Found stored auth data in localStorage`);
      try {
        const authData = JSON.parse(storedData);
        if (authData.token && typeof authData.token === 'string') {
          // Vérifier l'expiration
          if (!authData.expiresAt || authData.expiresAt > Date.now()) {
            logDebug(`Using valid token from localStorage${authData.expiresAt ? ', expires at ' + new Date(authData.expiresAt).toISOString() : ''}`);
            
            // Vérifier si le token est valide en termes de JWT (iat)
            if (isTokenNotYetValid(authData.token)) {
              logWarning(`Token from localStorage is not yet valid (iat > now), possible clock skew`);
            }
            
            // Mettre à jour le cache mémoire
            memoryToken = authData.token;
            memoryExpiry = authData.expiresAt;
            return authData.token;
          } else {
            logInfo(`Stored token in localStorage is expired, expiry: ${new Date(authData.expiresAt).toISOString()}`);
          }
        } else {
          logWarning(`Invalid token format in localStorage`);
        }
      } catch (e) {
        logError(`Error parsing stored auth data from localStorage`, e);
      }
    } else {
      logDebug(`No auth data found in localStorage`);
    }

    // 3. Enfin, essayer les cookies
    logDebug(`Checking cookies for auth token`);
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === TOKEN_COOKIE_NAME && value) {
        logDebug(`Found auth token in cookie ${TOKEN_COOKIE_NAME}`);
        const token = decodeURIComponent(value);
        
        // Vérifier si le token est valide et non-expiré
        if (!isTokenExpired(token)) {
          logDebug(`Cookie token is valid and not expired`);
          
          // Vérifier si le token est valide en termes de JWT (iat)
          if (isTokenNotYetValid(token)) {
            logWarning(`Token from cookie is not yet valid (iat > now), possible clock skew`);
          }
          
          // Restaurer dans localStorage et le cache mémoire pour cohérence
          const payload = parseJwt(token);
          if (!payload) {
            logWarning(`Could not parse payload from cookie token`);
            continue;
          }
          
          const expiresAt = payload.exp ? payload.exp * 1000 : null;
          
          memoryToken = token;
          memoryExpiry = expiresAt;
          logDebug(`Updated memory cache with cookie token`);
          
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            token,
            expiresAt,
            lastUpdated: Date.now()
          }));
          logDebug(`Updated localStorage with cookie token`);
          
          return token;
        }
        
        logInfo(`Cookie token is expired`);
      }
    }

    // Aucun token valide trouvé
    logInfo(`No valid auth token found in any storage`);
    return null;
  } catch (error) {
    logError(`Error retrieving auth token`, error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated(): boolean {
  const isAuth = getAuthToken() !== null;
  logDebug(`Authentication check: ${isAuth ? 'User is authenticated' : 'User is not authenticated'}`);
  return isAuth;
}

/**
 * Récupère le profil utilisateur du backend
 */
export async function fetchUserProfile(token: string): Promise<UserProfile> {
  logInfo(`Fetching user profile from backend`);
  try {
    // Vérifier que le token est valide
    if (!token) {
      logError(`No token provided to fetchUserProfile`);
      throw new Error('No token provided');
    }
    
    if (isTokenExpired(token)) {
      logError(`Token is expired, cannot fetch user profile`);
      throw new Error('Token is expired');
    }
    
    if (isTokenNotYetValid(token)) {
      logWarning(`Token is not yet valid (iat > now), attempting to fetch profile anyway`);
    }

    logDebug(`Making API request to /api/auth/me/`);
    const response = await fetch(`${BACKEND_URL}/api/auth/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      logError(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const profileData = await response.json();
    logInfo(`User profile fetched successfully`, {
      email: profileData.email,
      roles: profileData.is_coach ? ['coach'] : [],
    });
    return profileData;
  } catch (error) {
    logError(`Error fetching user profile`, error);
    throw error;
  }
}

/**
 * Prépare les en-têtes d'authentification pour les requêtes API
 */
export function getAuthHeaders(): Record<string, string> {
  logDebug(`Preparing auth headers for API request`);
  const token = getAuthToken();
  if (!token) {
    logWarning(`No token available for auth headers`);
    return {};
  }
  
  logDebug(`Auth headers prepared with token`);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Récupère les données utilisateur stockées
 */
export function getStoredUserData(): UserProfile | null {
  logDebug(`Retrieving stored user data from localStorage`);
  try {
    const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedData) {
      const authData = JSON.parse(storedData);
      if (authData.user) {
        logDebug(`User data found in localStorage`, {
          email: authData.user.email,
          roles: authData.user.is_coach ? ['coach'] : []
        });
        return authData.user;
      } else {
        logDebug(`No user data found in auth storage`);
      }
    } else {
      logDebug(`No auth data found in localStorage`);
    }
    return null;
  } catch (error) {
    logError(`Error retrieving user data from localStorage`, error);
    return null;
  }
}

/**
 * Utilitaire pour les requêtes authentifiées
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  logDebug(`Making authenticated fetch request to ${url}`);
  const token = getAuthToken();
  
  if (!token) {
    logWarning(`No auth token available for request to ${url}`);
  }
  
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };
  
  logDebug(`Request headers prepared`, headers);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      logWarning(`Request to ${url} failed with status ${response.status}`, {
        status: response.status,
        statusText: response.statusText
      });
    } else {
      logDebug(`Request to ${url} successful with status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    logError(`Fetch error for ${url}`, error);
    throw error;
  }
}

/**
 * Tente de rafraîchir le token à partir de Auth0
 * À implémenter avec votre logique de refresh token
 */
export async function refreshToken(): Promise<string | null> {
  logInfo(`Attempting to refresh auth token`);
  // Cette fonction devrait implémenter votre logique de refresh token
  // avec Auth0 ou un autre fournisseur d'identité
  
  // Pour l'instant, on retourne simplement null
  logWarning(`Token refresh not implemented`);
  return null;
}

const authService = {
  storeAuthData,
  clearAuthData,
  getAuthToken,
  fetchUserProfile,
  isAuthenticated,
  getAuthHeaders,
  getStoredUserData,
  authenticatedFetch,
  refreshToken,
  // Expose debugging helpers
  parseJwt,
  isTokenExpired,
  isTokenNotYetValid
};

export default authService;