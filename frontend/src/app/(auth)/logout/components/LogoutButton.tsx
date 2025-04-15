// src/app/(auth)/logout/components/LogoutButton.tsx
"use client";

import { Button } from "@/components/ui/button";
// Supprimez l'import inutilisé
// import { useAuthContext } from "@/services/AuthProvider";

export function LogoutButton() {
  // Supprimez la déclaration inutilisée
  // const { isAuthenticated } = useAuthContext();

  const handleLogout = async () => {
    try {
      console.log("Déconnexion en cours...");
      
      // Nettoyage local
      localStorage.clear();
      
      // Effacer les cookies
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Redirection directe vers home
      window.location.href = '/home';
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      window.location.href = '/home';
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="outline"
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      Déconnexion
    </Button>
  );
}