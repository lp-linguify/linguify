"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RotateCcw, Undo2, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

import { Session } from "@acme/auth";
import { Button } from "@acme/ui/button";
import { Progress } from "@acme/ui/progress";
import { Separator } from "@acme/ui/separator";
import { Card, CardContent } from "@acme/ui/card";

import { revisionApi } from "@/services/revisionAPI";
import { useToast } from "@/components/ui/use-toast";
import FlashcardCard from "../shared/flashcard-card";

// Interface pour les flashcards pour compatibilité entre les deux systèmes
interface ReviewFlashcard {
  id: number;
  front_text: string;
  back_text: string;
  learned: boolean;
  review_count: number;
  last_reviewed?: string | null;
}

const FlashcardReviewMode = () => {
  const { id } = useParams();
  const [flashcards, setFlashcards] = useState<ReviewFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [correct, setCorrect] = useState<number>(0);
  const [totalReviewed, setTotalReviewed] = useState<number>(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        // Charger les cartes dues pour révision
        const cards = await revisionApi.flashcards.getDue(10);
        
        // Si aucune carte n'est due, essayer de charger toutes les cartes du deck
        if (cards.length === 0 && id) {
          const allCards = await revisionApi.flashcards.getAll(Number(id));
          setFlashcards(allCards);
        } else {
          setFlashcards(cards);
        }
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        toast({
          title: "Error",
          description: "Failed to load flashcards for review",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [id, toast]);

  const currentCard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const markCardStatus = async (success: boolean) => {
    if (!currentCard) return;

    try {
      await revisionApi.flashcards.toggleLearned(currentCard.id, success);
      
      // Mettre à jour les statistiques
      if (success) {
        setCorrect((prev) => prev + 1);
      }
      setTotalReviewed((prev) => prev + 1);
      
      // Passer à la carte suivante
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
      
      toast({
        title: success ? "Good job!" : "Keep practicing!",
        description: success 
          ? "Card marked as known" 
          : "Card will be shown again later",
      });
    } catch (error) {
      console.error("Failed to update card status:", error);
      toast({
        title: "Error",
        description: "Failed to update card status",
        variant: "destructive"
      });
    }
  };

  const resetReview = async () => {
    setCurrentIndex(0);
    setCorrect(0);
    setTotalReviewed(0);
    setIsFlipped(false);
    
    try {
      const cards = await revisionApi.flashcards.getDue(10);
      setFlashcards(cards);
      
      toast({
        title: "Review Reset",
        description: "Ready for a new review session",
      });
    } catch (error) {
      console.error("Failed to reset review:", error);
      toast({
        title: "Error",
        description: "Failed to load new cards",
        variant: "destructive"
      });
    }
  };

  const backToStudySet = () => {
    router.push(`/flashcard`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center my-12">
        <h2 className="text-2xl font-bold mb-4">No cards due for review</h2>
        <p className="mb-6 text-gray-600">Great job! You've completed all your scheduled reviews.</p>
        <Button onClick={backToStudySet}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Study Sets
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={backToStudySet}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Flashcards
        </Button>
        <div className="text-sm text-gray-500">
          Card {currentIndex + 1} of {flashcards.length}
        </div>
      </div>
      
      <Progress
        value={(currentIndex / flashcards.length) * 100}
        className="mb-4"
      />
      
      {currentIndex < flashcards.length ? (
        <>
          <Card
            className="h-80 cursor-pointer transition-all duration-300 hover:shadow-lg"
            onClick={handleFlip}
          >
            <CardContent className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <div className="text-3xl font-medium">
                  {isFlipped ? currentCard.back_text : currentCard.front_text}
                </div>
                <div className="text-sm text-gray-500 mt-4">Click to flip</div>
                {currentCard.review_count > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    Reviews: {currentCard.review_count} | Last reviewed:{" "}
                    {currentCard.last_reviewed
                      ? new Date(currentCard.last_reviewed).toLocaleDateString()
                      : "Never"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 mt-6">
            <Button
              onClick={() => markCardStatus(false)}
              className="w-40 bg-red-500 hover:bg-red-600 text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Still Learning
            </Button>
            <Button
              onClick={() => markCardStatus(true)}
              className="w-40 bg-green-500 hover:bg-green-600 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Got it!
            </Button>
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(Math.max(0, currentIndex - 1));
                setIsFlipped(false);
              }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1));
                setIsFlipped(false);
              }}
              disabled={currentIndex === flashcards.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-8 text-2xl font-bold">Review completed!</div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-xl font-bold mb-4">Your Results</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-3xl font-bold text-green-600">{correct}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-3xl font-bold text-red-600">{totalReviewed - correct}</div>
                  <div className="text-sm text-gray-600">To Review</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(correct / totalReviewed) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {Math.round((correct / totalReviewed) * 100)}% Success Rate
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={resetReview}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <RotateCcw size={20} className="mr-2" />
                New Review Session
              </Button>
              <Button
                onClick={backToStudySet}
                variant="outline"
              >
                <Undo2 size={20} className="mr-2" />
                Back to Flashcards
              </Button>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div>
            <span className="mb-4 inline-block text-xl font-bold">
              Cards reviewed in this session
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((flashcard, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="font-medium text-gray-900 mb-1">{flashcard.front_text}</div>
                  <div className="text-gray-600">{flashcard.back_text}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FlashcardReviewMode;