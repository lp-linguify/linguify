// src/hooks/useLessonCompletion.ts
import { useState, useCallback, useEffect } from 'react';
import lessonCompletionService from '@/addons/progress/api/lessonCompletionService';
import { LessonCompletionState, UseLessonCompletionOptions } from "@/addons/learning/types";

/**
 * Hook pour gérer l'état de complétion d'une leçon de manière cohérente
 */

export function useLessonCompletion({
  lessonId,
  unitId,
  onComplete,
  autoSound = true,
  type: _type = 'lesson',
  initialTimeSpent = 0
}: UseLessonCompletionOptions) {
  // État local
  const [state, setState] = useState<LessonCompletionState>({
    showCompletionModal: false,
    timeSpent: initialTimeSpent,
    isCompleted: false
  });
  
  // Timer pour comptabiliser le temps passé
  useEffect(() => {
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - startTime) / 1000) + initialTimeSpent
      }));
    }, 30000); // Mise à jour toutes les 30 secondes pour limiter les calculs
    
    return () => clearInterval(timeInterval);
  }, [initialTimeSpent]);

  /**
   * Marquer la leçon comme complétée
   */
  const completeLesson = useCallback(async (score?: number) => {
    if (!lessonId) return;
    
    try {
      const contentLessonId = parseInt(lessonId);
      const completionPercentage = 100;
      
      // Mettre à jour progression du contenu
      await lessonCompletionService.updateContentProgress(
        contentLessonId,
        completionPercentage,
        state.timeSpent,
        score || Math.round(completionPercentage / 10),
        true // marquer comme complété
      );
      
      // Si nous avons l'unitId, mettre à jour aussi la progression de la leçon parent
      if (unitId) {
        await lessonCompletionService.updateLessonProgress(
          contentLessonId, 
          parseInt(unitId),
          completionPercentage,
          state.timeSpent,
          true
        );
      }
      
      setState(prev => ({ ...prev, isCompleted: true }));
      
      // Appeler le callback externe si fourni
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  }, [lessonId, unitId, state.timeSpent, onComplete]);
  
  /**
   * Afficher le modal de complétion
   */
  const showCompletion = useCallback((scoreValue?: string) => {
    // Jouer un son de succès si activé
    if (autoSound) {
      try {
        const audio = new Audio("/success1.mp3");
        audio.volume = 0.3;
        audio.play().catch(err => console.error("Error playing sound:", err));
      } catch (e) {
        console.warn("Could not play completion sound:", e);
      }
    }
    
    setState(prev => ({ 
      ...prev, 
      showCompletionModal: true,
      score: scoreValue
    }));
  }, [autoSound]);
  
  /**
   * Fermer le modal sans compléter la leçon
   */
  const closeCompletion = useCallback(() => {
    setState(prev => ({ ...prev, showCompletionModal: false }));
  }, []);
  
  /**
   * Mettre à jour partiellement la progression
   */
  const updateProgress = useCallback(async (percentage: number) => {
    if (!lessonId) return;
    
    try {
      const contentLessonId = parseInt(lessonId);
      await lessonCompletionService.updateContentProgress(
        contentLessonId,
        percentage,
        state.timeSpent,
        Math.round(percentage / 10),
        percentage >= 100
      );
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }, [lessonId, state.timeSpent]);
  
  return {
    showCompletionModal: state.showCompletionModal,
    score: state.score,
    timeSpent: state.timeSpent,
    isCompleted: state.isCompleted,
    showCompletion,
    closeCompletion,
    completeLesson,
    updateProgress
  };
}