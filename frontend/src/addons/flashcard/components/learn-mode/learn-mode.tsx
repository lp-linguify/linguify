"use client";

import type { MouseEvent } from "react";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RotateCcw, Undo2, Settings, ChevronLeft, Info } from "lucide-react";

import type { Session } from "@acme/auth";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { revisionApi } from "@/services/revisionAPI";
import { useToast } from "@/components/ui/use-toast";

interface FlashcardForLearning {
  id: number;
  term: string;
  definition: string;
  answers: string[];
  difficulty: number;
  lastSeen?: Date;
  nextReview?: Date;
}

interface LearningSettings {
  cardsPerSession: number;
  prioritizeNew: boolean;
  prioritizeDifficult: boolean;
  reviewMethod: 'spaced' | 'random' | 'sequential';
}

// MultipleChoiceCard component
const MultipleChoiceCard: React.FC<{
  term: string;
  answers: string[];
  correctAnswer: string;
  index: number;
  callback: (index: number, event: MouseEvent) => void;
}> = ({ term, answers, correctAnswer, index, callback }) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{term}</CardTitle>
        <CardDescription>Choose the correct definition</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {answers.map((answer, i) => (
          <button
            key={i}
            onClick={(e) => callback(i, e)}
            className="w-full rounded-lg border-2 border-gray-200 p-4 text-left hover:border-brand-purple hover:bg-gray-50 transition-colors"
          >
            {answer}
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

// Feedback component to show after answering
const AnswerFeedback: React.FC<{
  isCorrect: boolean;
  correctAnswer: string;
  onContinue: () => void;
}> = ({ isCorrect, correctAnswer, onContinue }) => {
  return (
    <Card className={`mb-8 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {isCorrect ? (
            <>
              <div className="text-green-500 text-xl font-bold">Correct!</div>
              <p>Well done, you got it right.</p>
            </>
          ) : (
            <>
              <div className="text-red-500 text-xl font-bold">Not quite</div>
              <p>The correct answer was:</p>
              <div className="p-3 border rounded-md bg-green-50 w-full text-center">
                {correctAnswer}
              </div>
            </>
          )}
          <Button onClick={onContinue} className="mt-4">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main LearnMode component
const LearnMode = ({ session }: { session: Session | null }) => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const router = useRouter();
  
  // State for cards and learning
  const [allCards, setAllCards] = useState<FlashcardForLearning[]>([]);
  const [sessionCards, setSessionCards] = useState<FlashcardForLearning[]>([]);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  
  // State for settings
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<LearningSettings>({
    cardsPerSession: 10,
    prioritizeNew: true,
    prioritizeDifficult: true,
    reviewMethod: 'spaced'
  });
  
  // Fetch cards on initial load
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        
        if (!id) return;
        
        // Get deck details
        const deckDetails = await revisionApi.decks.getById(Number(id));
        
        // Get all flashcards in the deck
        const cards = await revisionApi.flashcards.getAll(Number(id));
        
        // Transform into learning format with difficulty and other metadata
        const learningCards: FlashcardForLearning[] = cards.map(card => ({
          id: card.id,
          term: card.front_text,
          definition: card.back_text,
          answers: [], // Will be generated when selected for session
          difficulty: card.learned ? 1 : card.review_count > 3 ? 2 : 3, // 1-3 scale (1=easy, 3=hard)
          lastSeen: card.last_reviewed ? new Date(card.last_reviewed) : undefined,
          nextReview: card.next_review ? new Date(card.next_review) : undefined
        }));
        
        setAllCards(learningCards);
        
        // Select initial cards for the session based on settings
        const initialSessionCards = selectCardsForLearning(learningCards, settings);
        setSessionCards(initialSessionCards);
        
        toast({
          title: "Ready to learn",
          description: `${deckDetails.name}: ${initialSessionCards.length} cards selected for this session`
        });
        
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        toast({
          title: "Error",
          description: "Failed to load flashcards for learning",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCards();
  }, [id, toast]);

  // Prepare a card for learning by generating answer options
  const prepareCardForLearning = (card: FlashcardForLearning, allCards: FlashcardForLearning[]): FlashcardForLearning => {
    // Get 3 random incorrect answers from other cards
    let incorrectAnswers: string[] = [];
    
    // Create a shuffled copy of all cards except the current one
    const otherCards = allCards
      .filter(c => c.id !== card.id)
      .sort(() => Math.random() - 0.5);
    
    // Take up to 3 incorrect answers
    incorrectAnswers = otherCards
      .slice(0, 3)
      .map(c => c.definition);
    
    // If we don't have enough other cards, we can generate some variations
    while (incorrectAnswers.length < 3) {
      // Create a variant by taking a substring or adding random text
      const placeholder = `Option ${incorrectAnswers.length + 1}`;
      incorrectAnswers.push(placeholder);
    }
    
    // Combine correct and incorrect answers and shuffle
    const allAnswers = [card.definition, ...incorrectAnswers].sort(() => Math.random() - 0.5);
    
    return {
      ...card,
      answers: allAnswers
    };
  };

  // Algorithm to select cards for a learning session based on settings
  const selectCardsForLearning = (cards: FlashcardForLearning[], settings: LearningSettings): FlashcardForLearning[] => {
    let candidateCards = [...cards];
    
    // Apply filters based on settings
    if (settings.prioritizeNew) {
      // Sort by lastSeen (null/undefined first, then oldest to newest)
      candidateCards.sort((a, b) => {
        if (!a.lastSeen && !b.lastSeen) return 0;
        if (!a.lastSeen) return -1;
        if (!b.lastSeen) return 1;
        return a.lastSeen.getTime() - b.lastSeen.getTime();
      });
    }
    
    if (settings.prioritizeDifficult) {
      // Sort by difficulty (high to low)
      candidateCards.sort((a, b) => b.difficulty - a.difficulty);
    }
    
    if (settings.reviewMethod === 'spaced') {
      // Prioritize cards due for review based on spaced repetition
      const now = new Date();
      candidateCards.sort((a, b) => {
        // Cards with nextReview in the past or today come first
        if (a.nextReview && a.nextReview <= now && (!b.nextReview || b.nextReview > now)) return -1;
        if (b.nextReview && b.nextReview <= now && (!a.nextReview || a.nextReview > now)) return 1;
        
        // For cards in the future, prioritize ones coming up sooner
        if (a.nextReview && b.nextReview) return a.nextReview.getTime() - b.nextReview.getTime();
        
        // If only one has nextReview, prioritize the one without (new cards)
        if (a.nextReview && !b.nextReview) return 1;
        if (!a.nextReview && b.nextReview) return -1;
        
        return 0;
      });
    } else if (settings.reviewMethod === 'random') {
      // Shuffle the cards randomly
      candidateCards.sort(() => Math.random() - 0.5);
    }
    // 'sequential' doesn't need extra sorting
    
    // Take the requested number of cards
    let selectedCards = candidateCards.slice(0, settings.cardsPerSession);
    
    // Prepare each card with answer choices
    selectedCards = selectedCards.map(card => prepareCardForLearning(card, cards));
    
    return selectedCards;
  };

  // Reset the session with new cards
  const resetSession = () => {
    const newSessionCards = selectCardsForLearning(allCards, settings);
    setSessionCards(newSessionCards);
    setCardIndex(0);
    setCorrectCount(0);
    setSelectedAnswerIndex(null);
    setShowFeedback(false);
  };

  // Handle when user selects an answer
  const handleAnswerSelect = (index: number, event: MouseEvent) => {
    if (showFeedback || !sessionCards[cardIndex]) return;
    
    const currentCard = sessionCards[cardIndex];
    const selectedAnswer = currentCard.answers[index];
    const isCorrect = selectedAnswer === currentCard.definition;
    
    // Update UI and state
    setSelectedAnswerIndex(index);
    setIsAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      
      // Update card review status in backend
      if (currentCard.id) {
        revisionApi.flashcards.toggleLearned(currentCard.id, true)
          .catch(error => console.error("Error updating card status:", error));
      }
    } else {
      // For incorrect answers, increase difficulty
      const updatedAllCards = allCards.map(card => 
        card.id === currentCard.id 
          ? { ...card, difficulty: Math.min(card.difficulty + 1, 3) }
          : card
      );
      setAllCards(updatedAllCards);
    }
  };

  // Continue to next card after feedback
  const handleContinue = () => {
    setShowFeedback(false);
    setSelectedAnswerIndex(null);
    setCardIndex(prev => prev + 1);
  };

  // Navigate back to deck view
  const handleBackToDeck = () => {
    router.push(`/flashcard/deck/${id}`);
  };

  // Apply updated settings
  const applySettings = (newSettings: LearningSettings) => {
    setSettings(newSettings);
    setSettingsOpen(false);
    // Apply new settings immediately
    resetSession();
  };

  // Get current card
  const currentCard = sessionCards[cardIndex];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Preparing your learning session...</p>
        </div>
      </div>
    );
  }

  // If there are no cards in the session
  if (sessionCards.length === 0) {
    return (
      <div className="text-center my-12">
        <h2 className="text-2xl font-bold mb-4">No cards available for learning</h2>
        <p className="mb-6 text-gray-600">This deck doesn't have any cards to study yet.</p>
        <Button onClick={handleBackToDeck}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Deck
        </Button>
      </div>
    );
  }

  // If the session is complete
  if (cardIndex >= sessionCards.length) {
    const percentCorrect = Math.round((correctCount / sessionCards.length) * 100);
    
    return (
      <>
        <div className="mb-8 text-2xl font-bold text-center">Learning Session Complete!</div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                <div className="text-xs text-gray-600">Correct</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-3xl font-bold text-red-600">{sessionCards.length - correctCount}</div>
                <div className="text-xs text-gray-600">To Review</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${percentCorrect}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1 text-center">
                {percentCorrect}% Success Rate
              </div>
            </div>
            
            {percentCorrect < 70 && (
              <p className="text-sm text-center mb-4 text-yellow-600">
                Consider reviewing these cards again to improve your understanding.
              </p>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-center gap-4 mb-8">
          <Button 
            onClick={resetSession}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RotateCcw size={20} className="mr-2" />
            Practice Again
          </Button>
          <Button 
            variant="outline" 
            onClick={handleBackToDeck}
          >
            <Undo2 size={20} className="mr-2" />
            Back to Deck
          </Button>
        </div>
        
        <Separator className="my-8" />
        
        <div>
          <h3 className="text-xl font-bold mb-4">Cards You Studied</h3>
          <div className="space-y-4">
            {sessionCards.map((card, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-4 border-r">
                    <div className="text-sm text-gray-500 mb-1">Term</div>
                    <div>{card.term}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-1">Definition</div>
                    <div>{card.definition}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Learning session in progress
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={handleBackToDeck}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Deck
        </Button>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50">
            Card {cardIndex + 1} of {sessionCards.length}
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {correctCount} correct
          </Badge>
        </div>
        <Badge variant="outline">
          {Math.round((cardIndex / sessionCards.length) * 100)}% Complete
        </Badge>
      </div>
      
      <Progress
        value={(cardIndex / sessionCards.length) * 100}
        className="mb-6"
      />
      
      {showFeedback ? (
        <AnswerFeedback 
          isCorrect={isAnswerCorrect}
          correctAnswer={currentCard.definition}
          onContinue={handleContinue}
        />
      ) : (
        <MultipleChoiceCard
          term={currentCard.term}
          answers={currentCard.answers}
          correctAnswer={currentCard.definition}
          index={cardIndex}
          callback={handleAnswerSelect}
        />
      )}
      
      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Learning Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cards per session</Label>
                <span className="text-sm text-gray-500">{settings.cardsPerSession} cards</span>
              </div>
              <Slider 
                value={[settings.cardsPerSession]} 
                min={5} 
                max={50} 
                step={5}
                onValueChange={(value) => setSettings({...settings, cardsPerSession: value[0]})}
              />
              <p className="text-xs text-gray-500">
                Adjust how many cards you want to study in each session.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Prioritize new cards</Label>
                <p className="text-xs text-gray-500">
                  Focus on cards you haven't seen before
                </p>
              </div>
              <Switch 
                checked={settings.prioritizeNew}
                onCheckedChange={(checked) => setSettings({...settings, prioritizeNew: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Prioritize difficult cards</Label>
                <p className="text-xs text-gray-500">
                  Focus on cards you've had trouble with
                </p>
              </div>
              <Switch 
                checked={settings.prioritizeDifficult}
                onCheckedChange={(checked) => setSettings({...settings, prioritizeDifficult: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Review method</Label>
              <Select
                value={settings.reviewMethod}
                onValueChange={(value) => setSettings({
                  ...settings, 
                  reviewMethod: value as 'spaced' | 'random' | 'sequential'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a review method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spaced">
                    Spaced repetition
                  </SelectItem>
                  <SelectItem value="random">
                    Random order
                  </SelectItem>
                  <SelectItem value="sequential">
                    Sequential order
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Spaced repetition shows cards at increasing intervals as you learn them.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => applySettings(settings)}>
              Apply Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LearnMode;