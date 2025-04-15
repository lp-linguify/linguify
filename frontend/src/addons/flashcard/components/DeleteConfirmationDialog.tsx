// src/app/(dashboard)/(apps)/flashcard/_components/DeleteConfirmationDialog.tsx
/**
 * DeleteConfirmationDialog Component
 * 
 * A dialog that shows the progress of a deletion operation or asks for confirmation.
 * Acts as both a confirmation dialog before deletion and a progress monitor during deletion.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Trash2, AlertTriangle, LoaderCircle, Check, Timer } from "lucide-react";
import { useTranslation } from "@/core/i18n/useTranslations";
import { DeleteProgressDialogProps } from "@/addons/flashcard/types";



const DeleteProgressDialog: React.FC<DeleteProgressDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalCards,
  progress
}) => {
  const { t } = useTranslation();

  // Determine if we're in deletion progress mode or confirmation mode
  const isDeleting = progress > 0;

  // Calculate the estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (progress < 5 || progress >= 100) return null;

    // Simple estimate - assumes deletion rate is constant
    const percentageRemaining = 100 - progress;

    // Time in seconds, assuming about 10% progress per second (rough estimate)
    const secondsRemaining = Math.ceil(percentageRemaining / 10);

    if (secondsRemaining <= 0) return null;

    if (secondsRemaining < 60) {
      return t('dashboard.flashcards.secondsRemaining', { seconds: String(secondsRemaining) });
    } else {
      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = secondsRemaining % 60;
      if (seconds > 0) {
        return t('dashboard.flashcards.minutesSecondsRemaining', { minutes: String(minutes), seconds: String(seconds) });
      } else {
        return t('dashboard.flashcards.minutesRemaining', { minutes: String(minutes) });
      }
    }
  };

  // Get the appropriate status message based on progress
  const getStatusMessage = () => {
    if (progress <= 0) return t('dashboard.flashcards.preparingToDelete');
    if (progress < 25) return t('dashboard.flashcards.startingDeletion');
    if (progress < 50) return t('dashboard.flashcards.deletingCards');
    if (progress < 75) return t('dashboard.flashcards.continuingToProcess');
    if (progress < 100) return t('dashboard.flashcards.finalizingDeletion');
    return t('dashboard.flashcards.deletionComplete');
  };

  // Get progress bar style class based on progress
  const getProgressBarClass = () => {
    if (progress < 30) return "bg-blue-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const estimatedTime = getEstimatedTimeRemaining();
  const processedCards = Math.round((progress / 100) * totalCards);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            {isDeleting && progress >= 100 ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            {isDeleting && progress >= 100
              ? t('dashboard.flashcards.deletionComplete')
              : t('dashboard.flashcards.confirmDeletion')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeleting ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p>{getStatusMessage()}</p>
                  <span className="text-lg font-bold text-blue-600">
                    {progress}%
                  </span>
                </div>

                {/* Styled progress bar */}
                <Progress
                  value={progress}
                  className={`h-4 ${progress === 100 ? "bg-green-100" : "bg-gray-100"} ${getProgressBarClass()} transition-all duration-200`}
                />

                {/* Percentage display under the progress bar */}
                <div className="w-full flex justify-center">
                  <div className="bg-gray-100 px-4 py-1 rounded-full -mt-2 shadow-sm">
                    <span className="font-bold">{progress}%</span> {t('dashboard.flashcards.complete')}
                  </div>
                </div>

                {/* Card Progress Counter */}
                <div className="text-center py-2 text-sm">
                  <p className="font-semibold">
                    {t('dashboard.flashcards.cardsProcessed', { processed: String(processedCards), total: String(totalCards) })}
                  </p>

                  {estimatedTime && progress < 100 && (
                    <div className="flex items-center justify-center mt-2 text-gray-500">
                      <Timer className="h-4 w-4 mr-1" />
                      <span>{estimatedTime}</span>
                    </div>
                  )}
                </div>

                {/* Animated loader to show activity */}
                {progress < 100 && (
                  <div className="flex justify-center mt-2">
                    <LoaderCircle className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                )}

                {/* Success message */}
                {progress >= 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col items-center justify-center mt-2 text-green-600">
                    <Check className="h-8 w-8 mb-2" />
                    <p className="font-medium text-center">
                      <span className="text-lg font-bold">{t('dashboard.flashcards.percentComplete', { percent: String(100) })}</span><br />
                      {t('dashboard.flashcards.successfullyDeleted', { count: String(totalCards) })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="mb-2">
                  {t('dashboard.flashcards.deleteConfirmationQuestion', { count: String(totalCards) })}
                </p>
                <p className="text-red-500 font-medium">
                  {t('dashboard.flashcards.actionCannotBeUndone')}
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isDeleting && onConfirm && (
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dashboard.flashcards.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('dashboard.flashcards.deleteCountFlashcards', { count: String(totalCards) })}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}

        {isDeleting && progress === 100 && (
          <AlertDialogFooter>
            <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Check className="h-4 w-4 mr-2" />
              {t('dashboard.flashcards.done')}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProgressDialog;