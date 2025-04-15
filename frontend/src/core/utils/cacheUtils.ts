// src/utils/cacheUtils.ts
// Cette nouvelle classe de cache pourrait être extraite dans un fichier utils séparé

/**
 * Une entrée dans le cache avec TTL
 */
interface CacheEntry<T> {
    timestamp: number;
    data: T;
  }
  
  /**
   * Classe de gestion du cache avec durée de vie pour les données
   */
  export class Cache {
    // Cache global partagé entre les instances de composants
    private static cache: Record<string, CacheEntry<any>> = {};
    
    // Durée de vie par défaut: 5 minutes (en ms)
    private static DEFAULT_TTL = 5 * 60 * 1000;
  
    /**
     * Récupère une valeur du cache si elle existe et n'est pas expirée
     */
    static get<T>(key: string, ttl: number = Cache.DEFAULT_TTL): T | null {
      const entry = this.cache[key];
      
      if (!entry) return null;
      
      const now = Date.now();
      if (now - entry.timestamp > ttl) {
        // Entrée expirée, la supprimer du cache
        delete this.cache[key];
        return null;
      }
      
      return entry.data;
    }
  
    /**
     * Stocke une valeur dans le cache
     */
    static set<T>(key: string, data: T): void {
      this.cache[key] = {
        timestamp: Date.now(),
        data
      };
    }
  
    /**
     * Vérifie si une clé existe dans le cache et est encore valide
     */
    static has(key: string, ttl: number = Cache.DEFAULT_TTL): boolean {
      const entry = this.cache[key];
      if (!entry) return false;
      
      const now = Date.now();
      return now - entry.timestamp <= ttl;
    }
  
    /**
     * Supprime une entrée du cache
     */
    static invalidate(key: string): void {
      delete this.cache[key];
    }
  
    /**
     * Invalide toutes les entrées liées à l'unité spécifiée
     */
    static invalidateUnit(unitId: number): void {
      const unitPrefix = `unit_${unitId}`;
      
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith(unitPrefix)) {
          delete this.cache[key];
        }
      });
    }
  }