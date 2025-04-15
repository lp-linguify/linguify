// src/app/(dashboard)/(apps)/flashcard/match/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/core/i18n/useTranslations";
import type { MatchCard } from "@/addons/flashcard/types";

export default function MatchPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Charger les cartes au démarrage
  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);

        const response = await revisionApi.flashcards.getAll(Number(id));

        // Limiter à 6 cartes pour le jeu
        const flashcards = response.slice(0, 6);

        if (flashcards.length === 0) {
          toast({
            title: t('dashboard.flashcards.modes.match.noCardsFound'),
            description: t('dashboard.flashcards.modes.match.noCardsFoundDescription'),
            variant: "destructive"
          });
          return;
        }

        // Transformer en cartes de jeu
        const gameCards: MatchCard[] = [];

        // Créer une paire pour chaque flashcard (terme + définition)
        flashcards.forEach(card => {
          // Carte pour le terme
          gameCards.push({
            id: gameCards.length,
            flashcardId: card.id,
            content: card.front_text,
            isFlipped: false,
            isMatched: false,
            type: 'term'
          });

          // Carte pour la définition
          gameCards.push({
            id: gameCards.length,
            flashcardId: card.id,
            content: card.back_text,
            isFlipped: false,
            isMatched: false,
            type: 'definition'
          });
        });

        // Mélanger les cartes
        const shuffledCards = shuffleArray([...gameCards]);
        setCards(shuffledCards);

      } catch (error) {
        console.error("Failed to load flashcards:", error);
        toast({
          title: t('dashboard.flashcards.modes.match.errorLoadingCards'),
          description: t('dashboard.flashcards.modes.match.errorLoadingCardsDescription'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadCards();
    }
  }, [id, toast, t]);

  // Mélanger un tableau
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Démarrer le jeu
  const startGame = () => {
    setGameStarted(true);
    setElapsedTime(0);

    // Démarrer le timer
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    setTimerInterval(interval);
  };

  // Gérer la sélection d'une carte
  const handleCardSelect = (index: number) => {
    // Ignorer si la carte est déjà appariée
    if (matchedPairs.includes(index)) return;

    // Si aucune carte n'est sélectionnée
    if (selectedCardIndex === null) {
      setSelectedCardIndex(index);
    } else {
      // Si la même carte est cliquée, désélectionner
      if (selectedCardIndex === index) {
        setSelectedCardIndex(null);
        return;
      }

      // Vérifier si les cartes correspondent
      const card1 = cards[selectedCardIndex];
      const card2 = cards[index];

      if (card1.flashcardId === card2.flashcardId && card1.type !== card2.type) {
        // Les cartes correspondent!
        setMatchedPairs(prev => [...prev, selectedCardIndex, index]);

        // Vérifier si le jeu est terminé
        if (matchedPairs.length + 2 === cards.length) {
          if (timerInterval) clearInterval(timerInterval);
          setGameCompleted(true);
        }
      }

      // Réinitialiser la sélection
      setSelectedCardIndex(null);
    }
  };

  // Rejouer
  const playAgain = () => {
    setSelectedCardIndex(null);
    setMatchedPairs([]);
    setGameCompleted(false);
    setGameStarted(false);
    setElapsedTime(0);

    // Mélanger les cartes
    setCards(shuffleArray([...cards]));
  };

  // Retour au deck
  const backToDeck = () => {
    if (id) {
      router.push(`/flashcard/deck/${id}`);
    } else {
      // Fallback to main flashcard page if no deck id is available
      router.push("/flashcard");
    }
  };

  // Nettoyer le timer à la destruction du composant
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Écran de démarrage
  if (!gameStarted) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="mb-6">
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.match.backToDecks')}
          </Button>
        </div>
        <h2 className="text-2xl font-bold mb-4">{t('dashboard.flashcards.modes.match.pageTitle')}</h2>
        <p className="mb-8">{t('dashboard.flashcards.modes.match.gameDescription')}</p>
        <Button onClick={startGame} className="px-8 py-4 text-lg">
          {t('dashboard.flashcards.modes.match.startGame')}
        </Button>
      </div>
    );
  }

  // Écran de fin de jeu
  if (gameCompleted) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('dashboard.flashcards.modes.match.congratulations')}</h2>
        <p className="text-xl mb-8" dangerouslySetInnerHTML={{
          __html: t('dashboard.flashcards.modes.match.completedIn', { time: elapsedTime.toFixed(1) })
        }} />

        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={playAgain}>
            {t('dashboard.flashcards.modes.match.playAgain')}
          </Button>
          <Button variant="outline" onClick={backToDeck}>
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.match.backToDecks')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={backToDeck}>
          <ChevronLeft className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.modes.match.backToDecks')}
        </Button>
        <div className="text-xl font-mono">{elapsedTime.toFixed(1)}{t('dashboard.flashcards.modes.match.seconds')}</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-200 ${selectedCardIndex === index ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${matchedPairs.includes(index) ? 'bg-green-100 border-green-500' : ''
              }`}
            onClick={() => handleCardSelect(index)}
          >
            <CardContent className="flex items-center justify-center min-h-[120px] p-4">
              <p className="text-center">{card.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}