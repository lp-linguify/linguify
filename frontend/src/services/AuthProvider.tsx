// src/services/AuthProvider.tsx
"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from "react";
import { useRouter } from "next/navigation";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import authService, { UserProfile } from "./authService";

// Interface pour le contexte d'authentification
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  token: string | null;
  error: string | null;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// Création du contexte
const AuthContext = createContext<AuthContextType | null>(null);

// Provider parent Auth0
export function AuthProvider({ children }: { children: ReactNode }) {
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const auth0Audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  
  // Vérifier la configuration
  if (!auth0Domain || !auth0ClientId || !auth0Audience) {
    console.error('Auth0 configuration is incomplete');
    return <div>Auth0 configuration error - check .env file</div>;
  }

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: `${frontendUrl}/callback`,
        audience: auth0Audience,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <AuthContentProvider>{children}</AuthContentProvider>
    </Auth0Provider>
  );
}

// Provider interne qui implémente la logique d'authentification
function AuthContentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendRetries, setBackendRetries] = useState(0);

  // Fonction de login
  const login = useCallback(async (returnTo?: string) => {
    try {
      console.log("[Auth] Initiating login...");
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/callback`,
          // Forcer une nouvelle authentification
          prompt: 'login',
        },
        appState: returnTo ? { returnTo } : undefined
      });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      setError("Login failed. Please try again.");
    }
  }, [loginWithRedirect]);

  // Fonction de logout
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] Logging out...");
      
      // Effacer les données d'authentification locales
      authService.clearAuthData();
      setUser(null);
      setToken(null);
      
      // Déconnexion Auth0
      await auth0Logout({
        logoutParams: {
          returnTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/home`
        }
      });
    } catch (err) {
      console.error("[Auth] Logout error:", err);
      // Redirection de secours
      router.push('/home');
    }
  }, [auth0Logout, router]);

  // Fonction pour récupérer le token
  const getToken = useCallback(async (): Promise<string | null> => {
    // D'abord essayer de récupérer depuis le stockage local
    const storedToken = authService.getAuthToken();
    if (storedToken) {
      return storedToken;
    }
    
    // Si authentifié avec Auth0, essayer de récupérer un nouveau token
    if (auth0IsAuthenticated && !auth0IsLoading) {
      try {
        const newToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE as string,
          },
          // Ne pas utiliser le cache
          cacheMode: 'off'
        });
        
        // Stocker le nouveau token
        if (newToken) {
          authService.storeAuthData(newToken, user || undefined);
          setToken(newToken);
        }
        
        return newToken;
      } catch (err) {
        console.error("[Auth] Error getting token:", err);
        setError("Failed to retrieve authentication token");
        return null;
      }
    }
    
    return null;
  }, [auth0IsAuthenticated, auth0IsLoading, getAccessTokenSilently, user]);

  // Récupération du profil utilisateur
  useEffect(() => {
    let isMounted = true;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 secondes

    async function fetchUserProfile() {
      if (!isMounted) return;

      if (auth0IsAuthenticated && auth0User?.email) {
        try {
          setIsLoading(true);
          
          // Obtenir le token
          let accessToken;
          
          // Essayer d'abord le stockage local
          accessToken = authService.getAuthToken();
          
          // Si pas de token en stockage, en demander un nouveau
          if (!accessToken) {
            accessToken = await getAccessTokenSilently({
              authorizationParams: {
                audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE as string,
              }
            });
          }
          
          if (!accessToken) {
            throw new Error("Failed to get access token");
          }

          // Stocker le token
          authService.storeAuthData(accessToken);
          if (isMounted) setToken(accessToken);

          // Récupérer le profil depuis le backend
          try {
            const userProfile = await authService.fetchUserProfile(accessToken);
            
            if (isMounted) {
              setUser(userProfile);
              // Stocker le profil avec le token
              authService.storeAuthData(accessToken, userProfile);
              setBackendRetries(0); // Réinitialiser le compteur d'essais
              console.log("[Auth] User profile loaded from backend");
            }
          } catch (backendError) {
            console.error("[Auth] Backend profile fetch error:", backendError);
            
            // Implémenter la logique de réessai
            if (backendRetries < MAX_RETRIES) {
              console.log(`[Auth] Retrying backend connection (${backendRetries + 1}/${MAX_RETRIES})...`);
              if (isMounted) {
                setBackendRetries(prev => prev + 1);
                setTimeout(() => fetchUserProfile(), RETRY_DELAY);
                return;
              }
            }
            
            // Utiliser les données Auth0 en dernier recours
            if (auth0User && isMounted) {
              const fallbackUser: UserProfile = {
                id: auth0User.sub || '',
                email: auth0User.email || '',
                name: auth0User.name || '',
                username: auth0User.nickname || auth0User.email?.split('@')[0] || '',
                first_name: auth0User.given_name || '',
                last_name: auth0User.family_name || '',
                picture: auth0User.picture,
                native_language: 'EN', // Valeur par défaut
                target_language: 'FR', // Valeur par défaut
                language_level: 'A1',  // Valeur par défaut
                objectives: 'General', // Valeur par défaut
                is_coach: false,
                is_subscribed: false
              };
              
              setUser(fallbackUser);
              // Stocker le profil de secours
              authService.storeAuthData(accessToken, fallbackUser);
              setError("Using fallback user data. Backend connection failed.");
            }
          }
        } catch (err) {
          console.error("[Auth] Error in auth flow:", err);
          
          // Si un token existe dans le stockage, utiliser les données utilisateur stockées
          const storedToken = authService.getAuthToken();
          const storedUser = authService.getStoredUserData();
          
          if (storedToken && storedUser) {
            console.log("[Auth] Using cached auth data");
            setToken(storedToken);
            setUser(storedUser);
          } else {
            setError("Authentication error. Please try logging in again.");
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else if (!auth0IsLoading && isMounted) {
        // Vérifier le stockage local lorsque Auth0 n'est pas authentifié
        const storedToken = authService.getAuthToken();
        const storedUser = authService.getStoredUserData();
        
        if (storedToken && storedUser) {
          console.log("[Auth] Using stored auth data without Auth0");
          setToken(storedToken);
          setUser(storedUser);
        } else {
          setUser(null);
          setToken(null);
        }
        
        setIsLoading(false);
      }
    }

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [auth0IsAuthenticated, auth0IsLoading, auth0User, getAccessTokenSilently, backendRetries]);

  // Gestion des changements de routes pour assurer la persistance de l'authentification
  useEffect(() => {
    // Intercepter tous les changements de route
    const handleRouteChange = async () => {
      // Si authentifié mais pas de token, essayer d'en récupérer un
      if (auth0IsAuthenticated && !token) {
        const newToken = await getToken();
        if (newToken && !user) {
          try {
            // Récupérer le profil utilisateur avec le nouveau token
            const profile = await authService.fetchUserProfile(newToken);
            setUser(profile);
            authService.storeAuthData(newToken, profile);
          } catch (err) {
            console.error("[Auth] Failed to fetch user profile on route change:", err);
          }
        }
      }
    };

    // Écouter les changements de route
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [auth0IsAuthenticated, token, user, getToken]);

  // Déterminer si l'utilisateur est authentifié
  const isAuthenticated = Boolean(token && user);

  // Construire la valeur du contexte
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading: isLoading || auth0IsLoading,
    user,
    token,
    error,
    login,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte d'authentification
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}