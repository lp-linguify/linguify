// src/app/(auth)/logout/page.tsx
"use client";

import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  // Supprimez les variables non utilisées (router et isLoading/setIsLoading)
  const [status, setStatus] = React.useState("Déconnexion en cours...");

  useEffect(() => {
    // Déconnexion locale uniquement
    const performLogout = () => {
      try {
        console.log("Déconnexion locale en cours...");
        
        // Effacer toutes les données d'authentification
        localStorage.clear();
        
        // Effacer tous les cookies pertinents
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        setStatus("Déconnexion réussie, redirection...");
        console.log("Déconnexion locale réussie, redirection vers /home");
        
        // Redirection vers home
        setTimeout(() => {
          window.location.href = '/home';
        }, 1000);
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        setStatus("Erreur lors de la déconnexion, redirection...");
        // Redirection de secours
        window.location.href = '/home';
      }
    };

    performLogout();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto" />
        <h2 className="text-xl font-semibold mb-2">Déconnexion</h2>
        <p className="text-gray-600">
          {status}
        </p>
      </div>
    </div>
  );
}