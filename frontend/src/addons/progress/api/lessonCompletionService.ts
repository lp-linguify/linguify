// src/services/lessonCompletionService.ts
import progressAPI from "@/addons/progress/api/progressAPI";

import { toast } from '@/components/ui/use-toast';

/**
 * Service pour gérer la progression des leçons et unités
 */
const lessonCompletionService = {
  /**
   * Met à jour la progression d'une leçon et actualise la progression de l'unité parente
   * @param lessonId - ID de la leçon complétée ou en progression
   * @param unitId - ID de l'unité parente
   * @param completionPercentage - Pourcentage de complétion (0-100)
   * @param timeSpent - Temps passé en secondes (optionnel)
   * @param complete - Marquer comme complété si true
   */
  async updateLessonProgress(
    lessonId: number,

    completionPercentage: number = 100,
    timeSpent?: number,
    complete: boolean = false,
    contentLessonId?: number
  ): Promise<void> {
    try {
      // 1. Mettre à jour la progression de la leçon
      await progressAPI.updateLessonProgress({
        lesson_id: lessonId,
        content_lesson_id: contentLessonId || 0, // Providing a default value if not specified
        completion_percentage: completionPercentage,
        time_spent: timeSpent,
        mark_completed: complete
      });

      // 2. L'API backend met automatiquement à jour l'unité parente
      // Mais on peut le forcer si nécessaire
      if (complete) {
        // L'API backend met à jour automatiquement l'unité parente
        // On ne force plus la mise à jour car la méthode n'existe pas dans l'API

        toast({
          title: "Leçon terminée !",
          description: "Votre progression a été enregistrée.",
          duration: 3000
        });
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer votre progression. Veuillez réessayer.",
        variant: "destructive",
        duration: 4000
      });
    }
  },

  /**
   * Met à jour la progression d'un contenu de leçon spécifique
   * @param contentLessonId - ID du contenu de leçon
   * @param completionPercentage - Pourcentage de complétion (0-100)
   * @param timeSpent - Temps passé en secondes (optionnel)
   * @param xpEarned - Points d'expérience gagnés (optionnel)
   * @param complete - Marquer comme complété si true
   */
  async updateContentProgress(
    contentLessonId: number,
    lessonId: number,
    completionPercentage: number = 100,
    timeSpent?: number,
    xpEarned?: number,
    complete: boolean = false
  ): Promise<void> {
    try {
      await progressAPI.updateContentLessonProgress({
        content_lesson_id: contentLessonId,
        lesson_id: lessonId,
        completion_percentage: completionPercentage,
        time_spent: timeSpent,
        xp_earned: xpEarned,
        mark_completed: complete
      });

      // Note: l'API backend mettra automatiquement à jour la leçon parent et l'unité

      if (complete) {
        toast({
          title: "Contenu terminé !",
          description: "Votre progression a été enregistrée.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression du contenu:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer votre progression. Veuillez réessayer.",
        variant: "destructive",
        duration: 4000
      });
    }
  }
};

export default lessonCompletionService;