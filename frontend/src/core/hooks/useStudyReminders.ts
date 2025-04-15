// src/hooks/useStudyReminders.ts
import { useState, useEffect } from 'react';
import { notificationService } from '@/core/api/notificationService';

export function useStudyReminders(userId: string | null) {
  const [dueCards, setDueCards] = useState(0);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Vérifier les cartes dues
    const checkDue = async () => {
      const count = await notificationService.checkDueCards(userId);
      setDueCards(count);
      
      if (count > 0 && !reminderSet) {
        // Configurer un rappel dans 4 heures si l'utilisateur a des cartes dues
        notificationService.scheduleReminder(
          240, 
          `You have ${count} flashcards to review. Don't break your streak!`
        );
        setReminderSet(true);
      }
    };

    checkDue();
    
    // Vérifier périodiquement
    const interval = setInterval(checkDue, 3600000); // Toutes les heures
    
    return () => clearInterval(interval);
  }, [userId, reminderSet]);

  return { dueCards };
}