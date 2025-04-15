// src/utils/useLocalStorage.ts
import { useState as useReactState, useEffect } from 'react';

/**
 * Hook personnalisé pour utiliser localStorage avec la gestion d'état React
 * Permet de persister les états entre les rechargements de page
 * 
 * @param key La clé utilisée pour stocker dans localStorage
 * @param initialValue La valeur initiale si aucune valeur n'est trouvée dans localStorage
 * @returns Un tuple [valeur, fonction de mise à jour] similaire à useState
 */
export function useState<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // État pour stocker notre valeur
  // Passer la fonction d'initialisation à useState pour que la logique ne s'exécute qu'une fois
  const [storedValue, setStoredValue] = useReactState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Récupérer depuis localStorage
      const item = window.localStorage.getItem(key);
      // Analyser le JSON stocké ou retourner initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // En cas d'erreur, retourner initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Fonction pour mettre à jour la valeur dans localStorage et l'état
  const setValue = (value: T) => {
    try {
      // Permettre la valeur d'être une fonction comme dans useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder l'état
      setStoredValue(valueToStore);
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Effet pour synchroniser avec d'autres onglets/fenêtres
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (e) {
          console.error(`Error parsing localStorage change for key "${key}":`, e);
        }
      }
    };
    
    // Écouter les changements dans localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Nettoyer l'écouteur d'événements
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);
  
  return [storedValue, setValue];
}

export default { useState };