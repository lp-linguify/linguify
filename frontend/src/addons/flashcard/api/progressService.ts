// src/services/progressService.ts
import { StudyProgress } from "@/addons/revision/types/revision";
import { Flashcard } from "@/addons/flashcard/types/";
export const progressService = {
  calculateProgress(cards: Flashcard[]): StudyProgress {
    const totalCards = cards.length;
    const learnedCards = cards.filter(card => card.learned).length;
    const toReviewCards = cards.filter(card => !card.learned && card.review_count > 0).length;
    const completionPercentage = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;

    return {
      totalCards,
      learnedCards,
      toReviewCards,
      completionPercentage
    };
  },

  getDueCards(cards: Flashcard[]): Flashcard[] {
    const now = new Date();
    return cards.filter(card => {
      if (!card.next_review) return true; // Jamais révisée
      return new Date(card.next_review) <= now;
    });
  },

  getStreak(reviewHistory: Date[]): number {
    if (reviewHistory.length === 0) return 0;
    
    const sortedDates = [...reviewHistory].sort((a, b) => b.getTime() - a.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Limiter à 30 jours pour éviter les boucles infinies
      const hasReviewOnDate = sortedDates.some(date => {
        const reviewDate = new Date(date);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() === currentDate.getTime();
      });
      
      if (hasReviewOnDate) {
        streak++;
        // Passer au jour précédent
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break; // Interruption de la séquence
      }
    }
    
    return streak;
  }
};