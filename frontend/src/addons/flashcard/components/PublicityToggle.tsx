// src/addons/flashcard/components/PublicityToggle.tsx
'use client';
import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Lock, AlertTriangle, Loader2, Info } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useTranslation } from "@/core/i18n/useTranslations";
import { PublicityToggleProps } from "@/addons/flashcard/types";  

const PublicityToggle: React.FC<PublicityToggleProps> = ({
  deckId,
  isPublic,
  isArchived = false,
  onStatusChange,
  disabled = false
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);

  // Si le deck est archivé, désactiver le toggle automatiquement
  const isDisabled = disabled || isArchived || loading;

  const handleToggleClick = (newState: boolean) => {
    if (newState === true && !isPublic) {
      // Confirmer si on veut rendre public
      setPendingState(true);
      setConfirmDialogOpen(true);
    } else {
      // Peut rendre privé sans confirmation
      updatePublicStatus(newState);
    }
  };

  const updatePublicStatus = async (makePublic: boolean) => {
    try {
      setLoading(true);

      await revisionApi.decks.togglePublic(deckId, makePublic);

      // Notification
      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: makePublic
          ? t('dashboard.flashcards.deckMadePublic')
          : t('dashboard.flashcards.deckMadePrivate'),
      });

      // Notifier le parent si besoin
      if (onStatusChange) {
        onStatusChange(makePublic);
      }
    } catch (error) {
      console.error('Error updating deck publicity status:', error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.publicityUpdateError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setPendingState(null);
      setConfirmDialogOpen(false);
    }
  };

  const handleConfirmMakePublic = () => {
    if (pendingState !== null) {
      updatePublicStatus(pendingState);
    }
  };

  const handleCancelMakePublic = () => {
    setPendingState(null);
    setConfirmDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id="public-toggle"
          checked={isPublic}
          onCheckedChange={handleToggleClick}
          disabled={isDisabled}
        />
        <Label htmlFor="public-toggle" className="text-sm cursor-pointer">
          {isPublic ? (
            <span className="flex items-center text-green-600">
              <Globe className="h-4 w-4 mr-1" />
              Public
            </span>
          ) : (
            <span className="flex items-center text-gray-500">
              <Lock className="h-4 w-4 mr-1" />
              {t('dashboard.flashcards.privateDeck')}
            </span>
          )}
        </Label>

        {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}

        {isArchived && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-amber-500 ml-2" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('dashboard.flashcards.archivedDeckCantBePublic')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-600" />
              {t('dashboard.flashcards.confirmMakePublicTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">{t('dashboard.flashcards.confirmMakePublicDesc')}</p>

              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex">
                <AlertTriangle className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">{t('dashboard.flashcards.publicNotice')}</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{t('dashboard.flashcards.publicNotice1')}</li>
                    <li>{t('dashboard.flashcards.publicNotice2')}</li>
                    <li>{t('dashboard.flashcards.publicNotice3')}</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelMakePublic}>
              {t('dashboard.flashcards.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmMakePublic}
              className="bg-green-600 hover:bg-green-700"
            >
              {t('dashboard.flashcards.confirmMakePublic')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PublicityToggle;