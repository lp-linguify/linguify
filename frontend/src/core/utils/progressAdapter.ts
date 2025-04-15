// src/utils/progressAdapter.ts

import { 
    UnitProgress as ApiUnitProgress,
    LessonProgress as ApiLessonProgress,
    ContentLessonProgress as ApiContentProgress
  } from "@/services/progressAPI";
  
  import {
    UnitProgress,
    LessonProgress, 
    ContentLessonProgress,
    ProgressStatus
  } from "@/types/progress";
  
  /**
   * Convertit une chaîne de statut en ProgressStatus typé sécurisé
   * @param status - Chaîne de statut provenant de l'API
   * @returns Un statut de progression valide
   */
  export function convertToProgressStatus(status: string): ProgressStatus {
    // Vérification stricte pour garantir l'intégrité des données
    switch (status) {
      case 'not_started':
      case 'in_progress':
      case 'completed':
        return status as ProgressStatus;
      default:
        console.warn(`Statut de progression invalide reçu: "${status}", utilisation de "not_started" par défaut`);
        return 'not_started';
    }
  }
  
  /**
   * Convertit un objet de progression d'unité de l'API vers le type interne
   * @param apiProgress - Objet de progression d'unité provenant de l'API
   * @returns Objet de progression d'unité correctement typé
   */
  export function convertUnitProgress(apiProgress: ApiUnitProgress): UnitProgress {
    return {
      ...apiProgress,
      status: convertToProgressStatus(apiProgress.status)
    };
  }
  
  /**
   * Convertit un tableau d'objets de progression d'unité de l'API vers les types internes
   * @param apiProgressItems - Tableau d'objets de progression d'unité provenant de l'API
   * @returns Tableau d'objets de progression d'unité correctement typés
   */
  export function convertUnitProgressArray(apiProgressItems: ApiUnitProgress[]): UnitProgress[] {
    return apiProgressItems.map(item => convertUnitProgress(item));
  }
  
  /**
   * Convertit un objet de progression de leçon de l'API vers le type interne
   * @param apiProgress - Objet de progression de leçon provenant de l'API
   * @returns Objet de progression de leçon correctement typé
   */
  export function convertLessonProgress(apiProgress: ApiLessonProgress): LessonProgress {
    return {
      ...apiProgress,
      status: convertToProgressStatus(apiProgress.status)
    };
  }
  
  /**
   * Convertit un tableau d'objets de progression de leçon de l'API vers les types internes
   * @param apiProgressItems - Tableau d'objets de progression de leçon provenant de l'API
   * @returns Tableau d'objets de progression de leçon correctement typés
   */
  export function convertLessonProgressArray(apiProgressItems: ApiLessonProgress[]): LessonProgress[] {
    return apiProgressItems.map(item => convertLessonProgress(item));
  }
  
  /**
   * Convertit un objet de progression de contenu de leçon de l'API vers le type interne
   * @param apiProgress - Objet de progression de contenu de leçon provenant de l'API
   * @returns Objet de progression de contenu de leçon correctement typé
   */
  export function convertContentProgress(apiProgress: ApiContentProgress): ContentLessonProgress {
    return {
      ...apiProgress,
      status: convertToProgressStatus(apiProgress.status)
    };
  }
  
  /**
   * Convertit un tableau d'objets de progression de contenu de leçon de l'API vers les types internes
   * @param apiProgressItems - Tableau d'objets de progression de contenu de leçon provenant de l'API
   * @returns Tableau d'objets de progression de contenu de leçon correctement typés
   */
  export function convertContentProgressArray(apiProgressItems: ApiContentProgress[]): ContentLessonProgress[] {
    return apiProgressItems.map(item => convertContentProgress(item));
  }
  
  /**
   * Génère une map d'objets de progression indexée par ID à partir d'un tableau
   * @param progressItems - Tableau d'objets de progression
   * @param idField - Nom du champ à utiliser comme clé (par défaut: 'id')
   * @returns Map d'objets de progression indexée par ID
   */
  export function createProgressMap<T>(progressItems: T[], idField: keyof T = 'id' as keyof T): Record<number, T> {
    const progressMap: Record<number, T> = {};
    
    progressItems.forEach(item => {
      const id = Number(item[idField]);
      if (!isNaN(id)) {
        progressMap[id] = item;
      }
    });
    
    return progressMap;
  }
  
  /**
   * Convertit un tableau d'objets de progression en une map indexée par ID d'unité
   * @param apiProgressItems - Tableau d'objets de progression d'unité provenant de l'API
   * @returns Map d'objets de progression d'unité correctement typés indexée par ID d'unité
   */
  export function createUnitProgressMap(apiProgressItems: ApiUnitProgress[]): Record<number, UnitProgress> {
    const items = convertUnitProgressArray(apiProgressItems);
    return createProgressMap(items, 'unit');
  }
  
  /**
   * Convertit un tableau d'objets de progression en une map indexée par ID de leçon
   * @param apiProgressItems - Tableau d'objets de progression de leçon provenant de l'API
   * @returns Map d'objets de progression de leçon correctement typés indexée par ID de leçon
   */
  export function createLessonProgressMap(apiProgressItems: ApiLessonProgress[]): Record<number, LessonProgress> {
    const items = convertLessonProgressArray(apiProgressItems);
    return createProgressMap(items, 'lesson');
  }
  
  /**
   * Convertit un tableau d'objets de progression en une map indexée par ID de contenu de leçon
   * @param apiProgressItems - Tableau d'objets de progression de contenu de leçon provenant de l'API
   * @returns Map d'objets de progression de contenu de leçon correctement typés indexée par ID de contenu
   */
  export function createContentProgressMap(apiProgressItems: ApiContentProgress[]): Record<number, ContentLessonProgress> {
    const items = convertContentProgressArray(apiProgressItems);
    // Utiliser l'ID du contenu depuis le champ content_lesson_details
    return items.reduce((map, item) => {
      if (item.content_lesson_details && item.content_lesson_details.id) {
        map[item.content_lesson_details.id] = item;
      }
      return map;
    }, {} as Record<number, ContentLessonProgress>);
  }