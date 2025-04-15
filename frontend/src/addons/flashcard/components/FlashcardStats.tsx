// src/app/(dashboard)/(apps)/flashcard/_components/FlashcardStats.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, BookOpen, GraduationCap, Flame } from "lucide-react";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useTranslation } from "@/core/i18n/useTranslations";
import { FlashcardStatsProps, StudyProgress } from "@/addons/flashcard/types/";



const FlashcardStats = ({ deckId }: FlashcardStatsProps) => {
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const cards = await revisionApi.flashcards.getAll(deckId);

        const totalCards = cards.length;
        const learnedCards = cards.filter(card => card.learned).length;
        const toReviewCards = cards.filter(card => !card.learned && card.review_count > 0).length;
        const completionPercentage = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;

        setProgress({
          totalCards,
          learnedCards,
          toReviewCards,
          completionPercentage
        });

        setStreak(3);
      } catch (error) {
        console.error("Failed to load statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (deckId) {
      fetchStats();
    }
  }, [deckId]);

  if (isLoading || !progress) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-2">{t('dashboard.flashcards.studyProgress')}</h3>

        {/* Progression globale */}
        <div className="mb-3">
          <div className="flex justify-between mb-1 text-xs">
            <span className="text-gray-600">{t('dashboard.flashcards.overallCompletion')}</span>
            <span className="font-medium">{progress.completionPercentage}%</span>
          </div>
          <Progress value={progress.completionPercentage} className="h-1.5" />
        </div>

        {/* Statistiques détaillées en ligne */}
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="rounded-full p-1.5 bg-gradient-to-r from-indigo-600/80 via-purple-500/80 to-pink-400/80 mr-2">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className="font-medium text-sm block leading-none">{progress.totalCards}</span>
              <span className="text-xs text-gray-500 leading-none">{t('dashboard.flashcards.total')}</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="rounded-full p-1.5 bg-gradient-to-r from-indigo-600/80 via-purple-500/80 to-pink-400/80 mr-2">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className="font-medium text-sm block leading-none">{progress.learnedCards}</span>
              <span className="text-xs text-gray-500 leading-none">{t('dashboard.flashcards.learned')}</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="rounded-full p-1.5 bg-gradient-to-r from-indigo-600/80 via-purple-500/80 to-pink-400/80 mr-2">
              <Dumbbell className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className="font-medium text-sm block leading-none">{progress.toReviewCards}</span>
              <span className="text-xs text-gray-500 leading-none">{t('dashboard.flashcards.review')}</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="rounded-full p-1.5 bg-gradient-to-r from-indigo-600/80 via-purple-500/80 to-pink-400/80 mr-2">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className="font-medium text-sm block leading-none">{streak}</span>
              <span className="text-xs text-gray-500 leading-none">{t('dashboard.flashcards.streak')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlashcardStats;