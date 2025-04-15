// src/app/(dashboard)/(apps)/flashcard/learn/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Settings,
  Dices
} from "lucide-react";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/core/i18n/useTranslations";
import { LearnQuestion, LearnSettings } from "@/addons/flashcard/types";

export default function LearnPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [deckInfo, setDeckInfo] = useState<{ name: string; description: string }>({
    name: "Flashcards", 
    description: ""
  });
  const [allFlashcards, setAllFlashcards] = useState<any[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<any[]>([]);
  const [questions, setQuestions] = useState<LearnQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState<{[id: number]: boolean}>({});
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    known: 0,
    reviewing: 0,
    new: 0,
    difficult: 0
  });
  const [settings, setSettings] = useState<LearnSettings>({
    cardLimit: 20,
    cardSource: "all",
    shuffleQuestions: true
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load cards and deck information
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        
        // Get deck information
        const deckData = await revisionApi.decks.getById(Number(id));
        setDeckInfo({
          name: deckData.name,
          description: deckData.description || ""
        });

        // Get all the flashcards
        const cards = await revisionApi.flashcards.getAll(Number(id));
        setAllFlashcards(cards);
        
        // Calculate statistics for the deck
        updateStatistics(cards);
        
        // Show settings dialog on initial load
        if (isInitialLoad) {
          setShowSettings(true);
          setIsInitialLoad(false);
        } else {
          // Apply current settings to filter cards
          applySettings(settings, cards);
        }
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        toast({
          title: t('dashboard.flashcards.modes.learn.errorTitle'),
          description: t('dashboard.flashcards.modes.learn.errorDescription'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, toast, isInitialLoad, t]);

  // Update statistics for deck
  const updateStatistics = (cards: any[]) => {
    const known = cards.filter(card => card.learned).length;
    const reviewing = cards.filter(card => !card.learned && card.review_count > 0).length;
    const newCards = cards.filter(card => !card.learned && card.review_count === 0).length;
    const difficult = cards.filter(card => !card.learned && card.review_count > 2).length;
    
    setStats({
      total: cards.length,
      known,
      reviewing,
      new: newCards,
      difficult
    });
  };
  
  // Apply settings to filter cards
  const applySettings = (newSettings: LearnSettings, cardsData = allFlashcards) => {
    let filtered;
    
    // Filter by card status
    switch(newSettings.cardSource) {
      case "new":
        filtered = cardsData.filter(card => !card.learned && card.review_count === 0);
        break;
      case "review":
        filtered = cardsData.filter(card => !card.learned && card.review_count > 0);
        break;
      case "difficult":
        filtered = cardsData.filter(card => !card.learned && card.review_count > 2);
        break;
      case "all":
      default:
        filtered = [...cardsData];
        break;
    }
    
    // Shuffle cards if enabled
    if (newSettings.shuffleQuestions) {
      filtered = shuffleArray(filtered);
    }
    
    // Limit the number of cards
    filtered = filtered.slice(0, newSettings.cardLimit);
    
    setFilteredFlashcards(filtered);
    
    // Generate questions from the filtered cards
    if (filtered.length > 0) {
      const generatedQuestions = generateQuestions(filtered);
      setQuestions(generatedQuestions);
    } else {
      setQuestions([]);
    }
    
    // Reset learning session
    resetLearningSession();
    
    return filtered;
  };

  // Save settings and apply them
  const saveSettings = () => {
    applySettings(settings);
    setShowSettings(false);
  };

  // Generate multiple choice questions
  const generateQuestions = (cards: any[]): LearnQuestion[] => {
    return cards.map(card => {
      // Get 3 random incorrect answers
      const incorrectAnswers = getRandomIncorrectAnswers(allFlashcards, card, 3);
      
      // Shuffle all options
      const allOptions = shuffleArray([card.back_text, ...incorrectAnswers]);
      
      return {
        id: card.id,
        term: card.front_text,
        correctAnswer: card.back_text,
        allOptions
      };
    });
  };

  // Get random incorrect answers
  const getRandomIncorrectAnswers = (allCards: any[], currentCard: any, count: number): string[] => {
    const otherCards = allCards.filter(card => card.id !== currentCard.id);
    
    // If there aren't enough cards, duplicate some
    if (otherCards.length < count) {
      return [...otherCards.map(card => card.back_text)];
    }
    
    // Otherwise, take random cards
    return shuffleArray(otherCards).slice(0, count).map(card => card.back_text);
  };

  // Shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Handle selection of an answer option
  const handleOptionSelect = async (option: string) => {
    if (isCorrect !== null) return; // Already answered
    
    const correct = option === questions[currentIndex].correctAnswer;
    setSelectedOption(option);
    setIsCorrect(correct);
    
    // Update the score
    if (correct) {
      setScore(score + 1);
    }
    
    // Mark this question as answered
    setAnsweredQuestions({
      ...answeredQuestions,
      [questions[currentIndex].id]: correct
    });
    
    // Update card status in the backend
    try {
      await revisionApi.flashcards.toggleLearned(questions[currentIndex].id, correct);
    } catch (error) {
      console.error("Failed to update card status:", error);
    }
    
    // Move to the next question after a delay
    setTimeout(() => {
      setSelectedOption(null);
      setIsCorrect(null);
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 1500);
  };

  // Reset learning session
  const resetLearningSession = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setAnsweredQuestions({});
  };

  // Restart learning session with same questions
  const restartLearning = () => {
    resetLearningSession();
    
    // Shuffle questions for a new attempt if enabled
    if (settings.shuffleQuestions) {
      setQuestions(shuffleArray([...questions]));
    }
    
    toast({
      title: t('dashboard.flashcards.modes.learn.learningSessionRestarted'),
      description: t('dashboard.flashcards.modes.learn.startingSession', { count: String(questions.length) }),
    });
  };

  // Restart with new random cards
  const newCardSet = () => {
    // Re-apply settings to get a new set of cards
    applySettings(settings);
    
    toast({
      title: t('dashboard.flashcards.modes.learn.cardSetGenerated'),
      description: t('dashboard.flashcards.modes.learn.createdCardSet', { 
        count: String(Math.min(settings.cardLimit, filteredFlashcards.length)) 
      }),
    });
  };

  // Return to the deck list
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-brand-purple" />
          <p className="text-gray-600">{t('dashboard.flashcards.modes.learn.loading')}</p>
        </div>
      </div>
    );
  }

  // No cards state
  if (questions.length === 0 && !showSettings) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{deckInfo.name}</h1>
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.learn.backToDecks')}
          </Button>
        </div>
        
        <Card className="text-center p-6 mb-6">
          <CardHeader>
            <CardTitle>{t('dashboard.flashcards.modes.learn.noFlashcards')}</CardTitle>
            <CardDescription>
              {t('dashboard.flashcards.modes.learn.noFlashcardsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="bg-blue-50">{t('dashboard.flashcards.modes.learn.all')}: {stats.total}</Badge>
                <Badge variant="outline" className="bg-green-50">{t('dashboard.flashcards.modes.learn.known')}: {stats.known}</Badge>
                <Badge variant="outline" className="bg-yellow-50">{t('dashboard.flashcards.modes.learn.reviewing')}: {stats.reviewing}</Badge>
                <Badge variant="outline" className="bg-purple-50">{t('dashboard.flashcards.modes.learn.new')}: {stats.new}</Badge>
                <Badge variant="outline" className="bg-red-50">{t('dashboard.flashcards.modes.learn.difficult')}: {stats.difficult}</Badge>
              </div>
              <Button 
                onClick={() => setShowSettings(true)}
                className="mt-4"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('dashboard.flashcards.modes.learn.adjustSettings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen when all questions have been answered
  if (currentIndex >= questions.length && questions.length > 0) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('dashboard.flashcards.modes.learn.learningComplete')}</h1>
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.learn.backToDecks')}
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{deckInfo.name}</CardTitle>
            <CardDescription>{t('dashboard.flashcards.modes.learn.sessionResults')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-3xl font-bold text-green-600">{score}</div>
                <div className="text-xs text-gray-600">{t('dashboard.flashcards.modes.learn.correct')}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-3xl font-bold text-red-600">{questions.length - score}</div>
                <div className="text-xs text-gray-600">{t('dashboard.flashcards.modes.learn.incorrect')}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1 text-center">
                {percentage}{t('dashboard.flashcards.modes.learn.percentCorrect')}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg mt-4">
              {percentage >= 80 
                ? t('dashboard.flashcards.modes.learn.excellentResult')
                : percentage >= 60 
                  ? t('dashboard.flashcards.modes.learn.goodResult')
                  : t('dashboard.flashcards.modes.learn.keepPracticing')}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={restartLearning} className="bg-purple-600 hover:bg-purple-700 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.learn.restartSameCards')}
          </Button>
          <Button 
            onClick={newCardSet}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Dices className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.learn.newCardSet')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.learn.settings')}
          </Button>
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.learn.backToDecks')}
          </Button>
        </div>
        
        <Separator className="my-8" />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.flashcards.modes.learn.termsStudied')}</h3>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  answeredQuestions[question.id] 
                    ? 'bg-green-50 border-green-100' 
                    : 'bg-red-50 border-red-100'
                }`}
              >
                <div className="flex justify-between">
                  <div className="font-medium">{question.term}</div>
                  <div>
                    {answeredQuestions[question.id] 
                      ? <CheckCircle2 className="text-green-500 h-5 w-5" /> 
                      : <XCircle className="text-red-500 h-5 w-5" />}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{question.correctAnswer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Learning session settings
  if (showSettings) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{deckInfo.name}</h1>
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.learn.backToDecks')}
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.flashcards.modes.learn.sessionSettings')}</CardTitle>
            <CardDescription>
              {t('dashboard.flashcards.modes.learn.customizeExp')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="cardLimit">{t('dashboard.flashcards.modes.learn.cardLimit')}</Label>
                <Badge>{settings.cardLimit} {t('dashboard.flashcards.modes.learn.cards')}</Badge>
              </div>
              <Slider
                id="cardLimit"
                value={[settings.cardLimit]}
                min={5}
                max={Math.min(100, allFlashcards.length)}
                step={5}
                onValueChange={(value) => 
                  setSettings({...settings, cardLimit: value[0]})
                }
              />
              <p className="text-xs text-gray-500">
                {t('dashboard.flashcards.modes.learn.chooseCards', { 
                  min: '5', 
                  max: String(Math.min(100, allFlashcards.length)) 
                })}
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="cardSource">{t('dashboard.flashcards.modes.learn.cardSelection')}</Label>
              <Select
                value={settings.cardSource}
                onValueChange={(value: "all" | "new" | "review" | "difficult") => 
                  setSettings({...settings, cardSource: value})
                }
              >
                <SelectTrigger id="cardSource">
                  <SelectValue placeholder={t('dashboard.flashcards.modes.learn.cardSelection')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('dashboard.flashcards.modes.learn.allCards')} ({stats.total})</SelectItem>
                  <SelectItem value="new">{t('dashboard.flashcards.modes.learn.newCards')} ({stats.new})</SelectItem>
                  <SelectItem value="review">{t('dashboard.flashcards.modes.learn.cardsToReview')} ({stats.reviewing})</SelectItem>
                  <SelectItem value="difficult">{t('dashboard.flashcards.modes.learn.difficultCards')} ({stats.difficult})</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {t('dashboard.flashcards.modes.learn.chooseCardsInclude')}
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shuffleCards">{t('dashboard.flashcards.modes.learn.shuffleCards')}</Label>
                <p className="text-xs text-gray-500">
                  {t('dashboard.flashcards.modes.learn.randomlyArrange')}
                </p>
              </div>
              <Switch
                id="shuffleCards"
                checked={settings.shuffleQuestions}
                onCheckedChange={(checked) => 
                  setSettings({...settings, shuffleQuestions: checked})
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSettings(false);
                if (questions.length === 0) {
                  backToDeck();
                }
              }}
            >
              {t('dashboard.flashcards.modes.learn.cancel')}
            </Button>
            <Button 
              onClick={saveSettings}
              className="bg-brand-purple hover:bg-brand-purple-dark text-white"
            >
              {t('dashboard.flashcards.modes.learn.startLearning')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main learning interface with current question
  const currentQuestion = questions[currentIndex];

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{deckInfo.name}</h1>
          {deckInfo.description && <p className="text-sm text-gray-600">{deckInfo.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.modes.learn.settings')}
          </Button>
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.learn.back')}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="bg-blue-50">
          {t('dashboard.flashcards.modes.learn.learningMode')} ({filteredFlashcards.length} {t('dashboard.flashcards.modes.learn.cards')})
        </Badge>
        <div className="text-sm text-gray-500">
          {t('dashboard.flashcards.modes.learn.question', { current: String(currentIndex + 1), total: String(questions.length) })}
        </div>
      </div>
      
      <Progress
        value={((currentIndex) / questions.length) * 100}
        className="mb-8"
      />
      
      <Card className="mb-8 shadow-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-500 mb-2">{t('dashboard.flashcards.modes.learn.term')}</h3>
          <div className="text-2xl font-bold p-4 bg-gray-50 rounded-lg mb-6">{currentQuestion.term}</div>
          
          <h3 className="text-lg font-medium text-gray-500 mb-2">{t('dashboard.flashcards.modes.learn.chooseDefinition')}</h3>
          <div className="space-y-4">
            {currentQuestion.allOptions.map((option, index) => (
              <button
                key={index}
                className={`w-full p-4 text-left rounded-lg border ${
                  selectedOption === option
                    ? isCorrect
                      ? 'bg-green-100 border-green-500'
                      : 'bg-red-100 border-red-500'
                    : 'hover:bg-gray-50 border-gray-200'
                } ${
                  selectedOption !== null && option === currentQuestion.correctAnswer && !isCorrect
                    ? 'bg-green-100 border-green-500'
                    : ''
                } transition-colors`}
                onClick={() => handleOptionSelect(option)}
                disabled={selectedOption !== null}
              >
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          {isCorrect !== null && (
            <div className={`mt-4 p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="flex items-center">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-600">{t('dashboard.flashcards.modes.learn.correctAnswer')}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-600">
                      {t('dashboard.flashcards.modes.learn.incorrectAnswer', { answer: currentQuestion.correctAnswer })}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {t('dashboard.flashcards.modes.learn.score', { score: String(score), total: String(currentIndex) })}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={restartLearning}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> {t('dashboard.flashcards.modes.learn.restart')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {t('dashboard.flashcards.modes.learn.settings')}
          </Button>
        </div>
      </div>
    </div>
  );
}