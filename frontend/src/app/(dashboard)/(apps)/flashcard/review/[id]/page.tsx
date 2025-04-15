// src/app/(dashboard)/(apps)/flashcard/review/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  Check, 
  X, 
  RotateCcw, 
  RefreshCw, 
  Clock,
  Award,
  Calendar,
  Undo2
} from "lucide-react";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/core/utils/utils";
import { Flashcard } from "@/addons/flashcard/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/core/i18n/useTranslations";

export default function ReviewPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewStartTime, setReviewStartTime] = useState<Date | null>(null);
  const [reviewHistory, setReviewHistory] = useState<Array<{id: number, result: boolean}>>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [streak, setStreak] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  // Load cards from API
  const loadCards = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get all cards from the specified deck
      if (id) {
        const allCards = await revisionApi.flashcards.getAll(Number(id));
        // Filter cards that are due for review based on some criteria
        // For now, just use all cards but limit to 10 if needed
        const dueCards = allCards.slice(0, 10);
        setFlashcards(dueCards);
      } else {
        // No deck id specified, use an empty array
        setFlashcards([]);
        console.warn("No deck ID provided for flashcard review");
      }
      
      // Initialize review start time
      setReviewStartTime(new Date());
      
      // Try to fetch user streak if such API exists
      try {
        // This is a placeholder - implement your actual streak API call
        const streakData = await fetch('/api/user/streak').then(res => res.json());
        setStreak(streakData?.streak || 0);
      } catch (error) {
        console.error("Failed to load user streak:", error);
        // Default to 0 if API doesn't exist
        setStreak(0);
      }
    } catch (error) {
      console.error("Failed to load flashcards:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.modes.review.failedToLoadReview'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast, t]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if we're actively reviewing cards
      if (currentIndex < flashcards.length) {
        if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
          // Space or F to flip card
          handleFlip();
        } else if ((e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') && isFlipped) {
          // Right arrow or J for "Got it" (only when card is flipped)
          markCardStatus(true);
        } else if ((e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') && isFlipped) {
          // Left arrow or K for "Still Learning" (only when card is flipped)
          markCardStatus(false);
        } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
          // ? or H to toggle keyboard shortcuts help
          setShowKeyboardShortcuts(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, flashcards.length, isFlipped]);

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const markCardStatus = async (success: boolean) => {
    if (!currentCard) return;

    try {
      await revisionApi.flashcards.toggleLearned(currentCard.id, success);
      
      // Update statistics
      if (success) {
        setCorrect(prev => prev + 1);
      }
      setTotalReviewed(prev => prev + 1);
      
      // Add to review history
      setReviewHistory(prev => [...prev, { id: currentCard.id, result: success }]);
      
      // Move to next card
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
      
      toast({
        title: success ? t('dashboard.flashcards.modes.review.goodJob') : t('dashboard.flashcards.modes.review.keepPracticing'),
        description: success 
          ? t('dashboard.flashcards.markedKnown') 
          : t('dashboard.flashcards.modes.review.cardForLater'),
      });
    } catch (error) {
      console.error("Failed to update card status:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.updateStatusError'),
        variant: "destructive"
      });
    }
  };

  const getTotalReviewTime = (): string => {
    if (!reviewStartTime) return t('dashboard.flashcards.modes.review.na');
    
    const now = new Date();
    const diffMs = now.getTime() - reviewStartTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return t('dashboard.flashcards.modes.review.timeFormat', { minutes: String(diffMins), seconds: String(diffSecs) });
  };

  const restartReview = () => {
    setCurrentIndex(0);
    setCorrect(0);
    setTotalReviewed(0);
    setIsFlipped(false);
    setReviewHistory([]);
    setReviewStartTime(new Date());
  };

  const loadNewCards = () => {
    loadCards();
    setCurrentIndex(0);
    setCorrect(0);
    setTotalReviewed(0);
    setIsFlipped(false);
    setReviewHistory([]);
  };

  const backToDeck = () => {
    if (id) {
      router.push(`/flashcard/deck/${id}`);
    } else {
      // Fallback to main flashcard page if no deck id is available
      router.push("/flashcard");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={backToDeck} disabled>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.review.backToDecks')}
          </Button>
          <div className="text-sm text-gray-500">
            {t('dashboard.flashcards.modes.review.loadingCards')}
          </div>
        </div>
        
        <Skeleton className="h-2 w-full mb-4" />
        
        <Skeleton className="h-80 w-full mb-8" />
        
        <div className="flex justify-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    );
  }

  // No cards available
  if (flashcards.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6 max-w-lg mx-auto text-center">
          <CardHeader>
            <Badge className="w-fit mx-auto mb-2" variant="outline">
              <Award className="h-4 w-4 mr-2 text-yellow-500" />
              {t('dashboard.flashcards.modes.review.noCardsDue')}
            </Badge>
            <h2 className="text-2xl font-bold mb-2">{t('dashboard.flashcards.modes.review.allCaughtUp')}</h2>
            <p className="text-gray-600">
              {t('dashboard.flashcards.modes.review.greatJobCompleted')}
              {t('dashboard.flashcards.modes.review.currentStreak', { count: String(streak) })}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              {t('dashboard.flashcards.modes.review.comeBackLater')}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pt-4">
            <Button onClick={backToDeck}>
              <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.review.backToDecks')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Results after completing all cards
  if (currentIndex >= flashcards.length) {
    const successRate = totalReviewed > 0 ? Math.round((correct / totalReviewed) * 100) : 0;
    
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">{t('dashboard.flashcards.modes.review.reviewCompleted')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-green-100">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-500">{t('dashboard.flashcards.modes.review.correctCards')}</h3>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{correct}</div>
              <div className="text-sm text-gray-500">
                {t('dashboard.flashcards.modes.review.successRate', { rate: String(Math.round((correct / totalReviewed) * 100)) })}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-100">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-500">{t('dashboard.flashcards.modes.review.cardsToReview')}</h3>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totalReviewed - correct}</div>
              <div className="text-sm text-gray-500">
                {t('dashboard.flashcards.modes.review.willBeShownAgain')}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-gray-500">{t('dashboard.flashcards.modes.review.reviewTime')}</h3>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{getTotalReviewTime()}</div>
              <div className="text-sm text-gray-500">
                {t('dashboard.flashcards.modes.review.cardsPerMinute', { 
                  rate: String(Math.round(totalReviewed / (Math.max(1, (new Date().getTime() - (reviewStartTime?.getTime() || 0)) / 60000))))
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-bold">{t('dashboard.flashcards.modes.review.performanceSummary')}</h3>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-sm font-medium mb-2">{t('dashboard.flashcards.modes.review.successRate')}</div>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className={cn("text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full", 
                      successRate >= 80 ? "bg-green-200 text-green-800" : 
                      successRate >= 60 ? "bg-yellow-200 text-yellow-800" : 
                      "bg-red-200 text-red-800"
                    )}>
                      {successRate}%
                    </span>
                  </div>
                  <div className="text-xs text-right">
                    {successRate >= 80 ? t('dashboard.flashcards.modes.review.excellent') : 
                     successRate >= 60 ? t('dashboard.flashcards.modes.review.goodProgress') : 
                     t('dashboard.flashcards.modes.review.keepPracticing')}
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div 
                    style={{ width: `${successRate}%` }} 
                    className={cn("shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center",
                      successRate >= 80 ? "bg-green-500" : 
                      successRate >= 60 ? "bg-yellow-500" : 
                      "bg-red-500"
                    )}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium mb-2">{t('dashboard.flashcards.streak')}</div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                  <span className="text-xl font-bold">{t('dashboard.flashcards.modes.review.daysCount', { count: String(streak) })}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">{t('dashboard.flashcards.modes.review.timePerCard')}</div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-indigo-500" />
                  <span className="text-xl font-bold">
                    {reviewStartTime ? 
                      t('dashboard.flashcards.modes.review.secondsValue', { 
                        seconds: String(Math.round((new Date().getTime() - reviewStartTime.getTime()) / (totalReviewed * 1000)))
                      }) : "0s"
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mt-4">
              {successRate >= 80 
                ? t('dashboard.flashcards.modes.review.excellentWorkMessage') 
                : successRate >= 60 
                  ? t('dashboard.flashcards.modes.review.goodProgressMessage') 
                  : t('dashboard.flashcards.modes.review.keepPracticingMessage')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-bold">{t('dashboard.flashcards.modes.review.cardsReviewed')}</h3>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="space-y-2">
              {flashcards.map((card) => {
                const reviewResult = reviewHistory.find(h => h.id === card.id);
                return (
                  <div key={card.id} className="flex items-center p-3 rounded-lg border">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center mr-3",
                      reviewResult?.result ? "bg-green-100" : "bg-red-100"
                    )}>
                      {reviewResult?.result ? 
                        <Check className="h-4 w-4 text-green-600" /> : 
                        <X className="h-4 w-4 text-red-600" />
                      }
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-medium truncate">{card.front_text}</div>
                      <div className="text-xs text-gray-500 truncate">{card.back_text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            variant="default" 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={restartReview}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.review.reviewAgain')}
          </Button>
          <Button 
            variant="outline" 
            onClick={loadNewCards}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.review.loadNewCards')}
          </Button>
          <Button 
            variant="outline" 
            onClick={backToDeck}
          >
            <Undo2 className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.review.backToDecks')}
          </Button>
        </div>
      </div>
    );
  }

  // Main review interface
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={backToDeck}>
          <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.review.backToDecks')}
        </Button>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {getTotalReviewTime()}
          </Badge>
          <div className="text-sm bg-gray-100 rounded-full px-3 py-1">
            {t('dashboard.flashcards.modes.review.cardPosition', { current: String(currentIndex + 1), total: String(flashcards.length) })}
          </div>
        </div>
      </div>
      
      <Progress
        value={(currentIndex / flashcards.length) * 100}
        className="mb-4 h-2"
      />
      
      <Card
        className={cn(
          "relative h-80 cursor-pointer transition-all duration-300 hover:shadow-lg mb-8",
          isFlipped ? "bg-blue-50 border-blue-200" : ""
        )}
        onClick={handleFlip}
      >
        <CardContent className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <div className="absolute top-4 left-4 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {isFlipped ? t('dashboard.flashcards.modes.review.definition') : t('dashboard.flashcards.modes.review.term')}
            </div>
            
            <div className="text-3xl font-medium">
              {isFlipped ? currentCard.back_text : currentCard.front_text}
            </div>
            
            <div className="text-sm text-gray-500 mt-4">
              {t('dashboard.flashcards.modes.review.clickToFlip')}
            </div>
            
            {currentCard.review_count > 0 && (
              <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                <Badge variant="outline" className="mr-2">
                  {t('dashboard.flashcards.reviews')}: {currentCard.review_count}
                </Badge>
                {currentCard.last_reviewed && (
                  <Badge variant="outline">
                    {t('dashboard.flashcards.lastReviewedShort')}: {new Date(currentCard.last_reviewed).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => markCardStatus(false)}
                className="w-full sm:w-40 bg-red-500 hover:bg-red-600 text-white"
                disabled={!isFlipped}
              >
                <X className="w-4 h-4 mr-2" />
                {t('dashboard.flashcards.modes.review.stillLearning')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('dashboard.flashcards.modes.review.markAsStillLearning')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => markCardStatus(true)}
                className="w-full sm:w-40 bg-green-500 hover:bg-green-600 text-white"
                disabled={!isFlipped}
              >
                <Check className="w-4 h-4 mr-2" />
                {t('dashboard.flashcards.modes.review.gotIt')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('dashboard.flashcards.modes.review.markAsGotIt')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {showKeyboardShortcuts ? t('dashboard.flashcards.modes.review.hideKeyboardShortcuts') : t('dashboard.flashcards.modes.review.showKeyboardShortcuts')}
        </Button>
      </div>
      
      {showKeyboardShortcuts && (
        <Card className="mt-4 bg-gray-50 mx-auto max-w-md">
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium mb-2">{t('dashboard.flashcards.modes.review.keyboardShortcuts')}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white rounded border mr-2">Space</kbd>
                <span>{t('dashboard.flashcards.modes.review.flipCard')}</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white rounded border mr-2">→</kbd>
                <span>{t('dashboard.flashcards.modes.review.markAsGotIt')}</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white rounded border mr-2">←</kbd>
                <span>{t('dashboard.flashcards.modes.review.markAsStillLearning')}</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white rounded border mr-2">?</kbd>
                <span>{t('dashboard.flashcards.modes.review.toggleShortcuts')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm">
          <strong>{t('dashboard.flashcards.modes.review.currentStreak')}:</strong> {t('dashboard.flashcards.modes.review.daysCount', { count: String(streak) })}
        </div>
        <div className="text-sm text-right">
          <strong>{t('dashboard.flashcards.modes.review.correct')}:</strong> {correct}/{totalReviewed} 
          {totalReviewed > 0 && ` (${Math.round((correct / totalReviewed) * 100)}%)`}
        </div>
      </div>
    </div>
  );
}