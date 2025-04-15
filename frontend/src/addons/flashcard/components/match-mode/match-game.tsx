"use client";

import React, { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAnimate } from "framer-motion";

import { Button } from "@/components/ui/button";

import { revisionApi } from "@/services/revisionAPI";
import { useToast } from "@/components/ui/use-toast";

import EndScreen from "./end-screen";
import MatchGameTimer from "./match-game-timer";
import MemoryCard from "./memory-card";
import StartScreen from "./start-screen";

// Styles pour les animations
const greenBorder = "#16a34a";
const greenBg = "#bbf7d0";
const redBorder = "#e11d48";
const redBg = "#fda4af";
const blueBg = "#bfdbfe";
const blueBorder = "#2563eb";

// Types
interface MatchCard {
  id: number;
  flashcardId: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  type: 'term' | 'definition';
}

interface MatchGameState {
  cards: MatchCard[];
  matched: number[];
  selected: number | undefined;
  stage: 'initial' | 'start' | 'finished';
  ellapsedTime: number;
}

// État initial du jeu
const initialState: MatchGameState = {
  cards: [],
  matched: [],
  selected: undefined,
  stage: 'initial',
  ellapsedTime: 0
};

// Types d'actions pour le reducer
type MatchGameAction = 
  | { type: 'setCards'; payload: MatchCard[] }
  | { type: 'setMatched'; payload: number[] }
  | { type: 'setSelected'; payload: number | undefined }
  | { type: 'setStage'; payload: 'initial' | 'start' | 'finished' }
  | { type: 'setEllapsedTime'; payload: number }
  | { type: 'clear' };

// Reducer pour la gestion d'état
function matchReducer(state: MatchGameState, action: MatchGameAction): MatchGameState {
  switch (action.type) {
    case 'setCards':
      return { ...state, cards: action.payload };
    case 'setMatched':
      return { ...state, matched: action.payload };
    case 'setSelected':
      return { ...state, selected: action.payload };
    case 'setStage':
      return { ...state, stage: action.payload };
    case 'setEllapsedTime':
      return { ...state, ellapsedTime: action.payload };
    case 'clear':
      return { ...initialState };
    default:
      return state;
  }
}

const MatchGame = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Utiliser useReducer pour la gestion d'état
  const [state, dispatch] = useReducer(matchReducer, initialState);
  const { cards, matched, selected, stage, ellapsedTime } = state;
  
  // Animations avec Framer Motion
  const [scope, animate] = useAnimate();
  
  // Effet pour charger les cartes depuis l'API
  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les cartes depuis l'API
        const response = await revisionApi.flashcards.getAll(Number(id));
        
        // Limiter à 6 cartes maximum pour le jeu
        const flashcards = response.slice(0, 6);
        
        if (flashcards.length === 0) {
          toast({
            title: "No cards found",
            description: "This deck has no cards to play with.",
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
        
        // Mettre à jour l'état
        dispatch({ type: 'setCards', payload: shuffledCards });
        
      } catch (error) {
        console.error("Failed to load flashcards:", error);
        toast({
          title: "Error",
          description: "Failed to load flashcards for the game",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      loadCards();
    }
  }, [id, toast]);

  // Effet pour vérifier si toutes les paires sont trouvées
  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      setTimeout(() => {
        dispatch({ type: 'setStage', payload: 'finished' });
      }, 300);
    }
  }, [matched, cards.length]);

  // Animation pour les correspondances réussies
  const matchAnimation = (selector: string) => {
    void animate([
      [
        selector,
        { backgroundColor: greenBg, borderColor: greenBorder },
        { duration: 0 },
      ],
      [selector, { scale: 0 }, { duration: 0.2, ease: "linear" }],
    ]);
  };

  // Animation pour les erreurs de correspondance
  const missmatchAnimation = async (selector: string) => {
    await animate([
      [
        selector,
        { backgroundColor: redBg, borderColor: redBorder },
        { duration: 0 },
      ],
      [selector, { rotate: [-2, 0, -2, 0, -2, 0] }, { duration: 0.2 }],
    ]);

    void animate(
      selector,
      {
        backgroundColor: "hsl(var(--background))",
        borderColor: "hsl(var(--border))",
      },
      { duration: 0 },
    );
  };

  // Gestion de la sélection de carte
  const selectCard = (index: number) => {
    // Si une carte est déjà dans matched, ne rien faire
    if (matched.includes(index)) return;
    
    // Si aucune carte n'est sélectionnée
    if (selected === undefined) {
      dispatch({ type: 'setSelected', payload: index });
      void animate(
        `#card-${index}`,
        {
          backgroundColor: blueBg,
          borderColor: blueBorder,
        },
        { duration: 0 },
      );
    } else {
      dispatch({ type: 'setSelected', payload: undefined });
      
      // Si on clique sur la même carte, désélectionner
      if (selected === index) {
        void animate(
          `#card-${index}`,
          {
            backgroundColor: "",
            borderColor: "",
          },
          { duration: 0 },
        );
      } else {
        // Vérifier si les cartes correspondent (même flashcardId mais type différent)
        if (cards[selected]?.flashcardId === cards[index]?.flashcardId && 
            cards[selected]?.type !== cards[index]?.type) {
          matchAnimation(`#card-${selected}`);
          matchAnimation(`#card-${index}`);
          dispatch({ type: 'setMatched', payload: [...matched, index, selected] });
        } else {
          void missmatchAnimation(`#card-${selected}`);
          void missmatchAnimation(`#card-${index}`);
        }
      }
    }
  };

  // Démarrer le jeu
  const startGame = () => {
    dispatch({ type: 'setStage', payload: 'start' });
  };

  // Rejouer une partie
  const playAgain = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer de nouvelles cartes
      const response = await revisionApi.flashcards.getAll(Number(id));
      const flashcards = response.slice(0, 6);
      
      // Transformer en cartes de jeu
      const gameCards: MatchCard[] = [];
      flashcards.forEach(card => {
        gameCards.push({
          id: gameCards.length,
          flashcardId: card.id,
          content: card.front_text,
          isFlipped: false,
          isMatched: false,
          type: 'term'
        });
        
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
      
      // Réinitialiser l'état du jeu
      dispatch({ type: 'clear' });
      dispatch({ type: 'setCards', payload: shuffledCards });
      dispatch({ type: 'setStage', payload: 'start' });
      
    } catch (error) {
      console.error("Failed to reload cards:", error);
      toast({
        title: "Error",
        description: "Failed to reload cards for the game",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le temps écoulé
  const updateEllapsedTime = (time: number) => {
    dispatch({ type: 'setEllapsedTime', payload: time });
  };

  // Utilitaire pour mélanger un tableau
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Link href={`/study-sets/${id}`}>
          <Button variant="ghost">Back to set</Button>
        </Link>
      </div>
      
      {stage === "initial" && <StartScreen startGame={startGame} />}
      
      {stage === "start" && (
        <>
          <MatchGameTimer
            updateEllapsedTime={updateEllapsedTime}
          />
          <div 
            ref={scope} 
            className="grid h-full grid-cols-3 gap-4"
          >
            {cards.map((card, index) => (
              <MemoryCard
                key={index}
                index={index}
                content={card.content}
                selectCallback={() => selectCard(index)}
              />
            ))}
          </div>
        </>
      )}
      
      {stage === "finished" && (
        <EndScreen time={ellapsedTime} playAgain={playAgain} />
      )}
    </>
  );
};

export default MatchGame;