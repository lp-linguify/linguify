// src/components/ui/ErrorWithRetry.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, WifiOff, Server, ShieldAlert, FileX } from "lucide-react";
import { ErrorType } from '@/services/errorHandlingService';

interface ErrorWithRetryProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  errorType?: ErrorType;
  title?: string;
  className?: string;
  hideRetryButton?: boolean;
}

export const ErrorWithRetry: React.FC<ErrorWithRetryProps> = ({ 
  message, 
  onRetry, 
  isRetrying = false,
  errorType = ErrorType.UNKNOWN,
  title,
  className = "",
  hideRetryButton = false
}) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return <WifiOff className="h-4 w-4" />;
      case ErrorType.SERVER:
        return <Server className="h-4 w-4" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <ShieldAlert className="h-4 w-4" />;
      case ErrorType.NOT_FOUND:
        return <FileX className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getDefaultTitle = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return "Problème de connexion";
      case ErrorType.SERVER:
        return "Erreur serveur";
      case ErrorType.AUTHENTICATION:
        return "Session expirée";
      case ErrorType.AUTHORIZATION:
        return "Accès refusé";
      case ErrorType.NOT_FOUND:
        return "Ressource introuvable";
      case ErrorType.VALIDATION:
        return "Données invalides";
      default:
        return "Une erreur est survenue";
    }
  };

  return (
    <Alert 
      variant="destructive" 
      className={`my-4 ${className}`}
    >
      {getErrorIcon()}
      
      <div className="w-full">
        <AlertTitle>{title || getDefaultTitle()}</AlertTitle>
        <div className="flex items-center justify-between w-full">
          <AlertDescription className="mr-4">
            {message}
          </AlertDescription>
          
          {!hideRetryButton && onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex-shrink-0 bg-white text-red-600 hover:bg-red-50"
              size="sm"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Réessai...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default ErrorWithRetry;