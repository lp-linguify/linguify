// src/app/(dashboard)/(apps)/flashcard/deck/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import type { Flashcard, FlashcardDeck } from "@/addons/flashcard/types";
import FlashcardStats from "../../../../../../addons/flashcard/components/FlashcardStats";
import StudyModes from "../../../../../../addons/flashcard/components/StudyModes";
import FlashcardList from "../../../../../../addons/flashcard/components/FlashcardList";

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadDeckAndCards = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Load deck details
        const deckData = await revisionApi.decks.getById(Number(id));
        setDeck(deckData);
        
        // Load all cards in the deck
        const cardsData = await revisionApi.flashcards.getAll(Number(id));
        setCards(cardsData);
      } catch (err) {
        console.error('Error loading deck data:', err);
        setError('Failed to load deck and flashcards. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load deck data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeckAndCards();
  }, [id, toast]);

  const handleBackToDeck = () => {
    router.push('/flashcard');
  };

  const refreshCards = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const refreshedCards = await revisionApi.flashcards.getAll(Number(id));
      setCards(refreshedCards);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh cards",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-brand-purple" />
          <p className="text-sm text-gray-500">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="text-center my-12">
        <h2 className="text-2xl font-bold mb-4">Error Loading Deck</h2>
        <p className="mb-6 text-gray-600">{error || "Deck not found"}</p>
        <Button onClick={handleBackToDeck}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Decks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-gold text-transparent bg-clip-text">
          {deck.name}
        </h1>
        <Button
          variant="outline"
          onClick={handleBackToDeck}
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Decks
        </Button>
      </div>
      
      {deck.description && (
        <p className="text-gray-600">{deck.description}</p>
      )}

      {/* Statistics Panel */}
      <FlashcardStats deckId={Number(id)} />
      
      {/* Study Modes */}
      <StudyModes deckId={Number(id)} />
      
      {/* Direct Flashcard List Integration */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Flashcards in this Deck</h2>
        <FlashcardList 
          cards={cards} 
          deckId={Number(id)} 
          onCardUpdate={refreshCards}
        />
      </div>
    </div>
  );
}