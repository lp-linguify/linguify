// src/services/notificationService.ts
export const notificationService = {
    checkDueCards: async (userId: string): Promise<number> => {
      try {
        // Dans une application réelle, ceci ferait un appel API
        // Ici, nous simulons une réponse
        return 5; // Exemple: 5 cartes à réviser
      } catch (error) {
        console.error("Failed to check due cards:", error);
        return 0;
      }
    },
    
    showNotification: (message: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Flashcards App', {
          body: message,
          icon: '/logo.png' // Remplacer par votre logo
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Flashcards App', {
              body: message,
              icon: '/logo.png'
            });
          }
        });
      }
    },
    
    scheduleReminder: (timeInMinutes: number, message: string) => {
      return setTimeout(() => {
        notificationService.showNotification(message);
      }, timeInMinutes * 60 * 1000);
    }
  };