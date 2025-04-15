// src/components/ui/OfflineBanner.tsx
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { useIsOnline } from '@/services/errorHandlingService';
import { Button } from './button';

interface OfflineBannerProps {
  showReconnectButton?: boolean;
  className?: string;
  onReconnect?: () => Promise<void>;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  showReconnectButton = true,
  className = "",
  onReconnect
}) => {
  const isOnline = useIsOnline();
  const [wasOffline, setWasOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Gérer la réapparition/disparition du banner avec un petit délai
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (!isOnline) {
      // Afficher immédiatement le banner quand on passe hors ligne
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Si on était hors ligne et qu'on revient en ligne, afficher un message positif
      timeout = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOnline, wasOffline]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    
    try {
      if (onReconnect) {
        await onReconnect();
      } else {
        // Tenter de recharger les données de base
        // Par défaut, on recharge simplement la page après une petite pause
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
      }
    } catch (error) {
      console.error("Erreur lors de la tentative de reconnexion", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  if (!showBanner) return null;

  if (isOnline && wasOffline) {
    return (
      <Alert 
        variant="default" 
        className={`bg-green-50 border-green-200 text-green-700 ${className}`}
      >
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription>
          Connexion rétablie. Vos données sont à jour.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert 
      variant="destructive" 
      className={`bg-amber-50 border-amber-200 text-amber-700 ${className}`}
    >
      <WifiOff className="h-4 w-4 text-amber-600" />
      <div className="flex items-center justify-between w-full">
        <AlertDescription>
          Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.
        </AlertDescription>
        
        {showReconnectButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={handleReconnect}
            disabled={isReconnecting}
          >
            {isReconnecting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Reconnexion...
              </>
            ) : (
              <>Réessayer</>
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default OfflineBanner;