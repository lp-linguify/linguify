// src/app/(dashboard)/(apps)/flashcard/_components/FlashcardMain.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCcw, Search, Globe, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import FlashcardDeckList from './FlashcardDeckList';
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import type { FlashcardDeck } from "@/addons/flashcard/types";
import { useAuthContext } from "@/core/auth/AuthProvider";
import { useTranslation } from "@/core/i18n/useTranslations";

const FlashcardMain = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<FlashcardDeck[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const router = useRouter();

  // Fetch all flashcard decks
  const fetchDecks = useCallback(async () => {
    try {
      setIsPageLoading(true);
      setLoadError(null);

      const fetchedDecks = await revisionApi.decks.getAll();
      setDecks(fetchedDecks);
      setFilteredDecks(fetchedDecks);
    } catch (error) {
      console.error('Error fetching decks:', error);
      setLoadError(t('dashboard.flashcards.errorLoading'));
    } finally {
      setIsPageLoading(false);
    }
  }, [t]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDecks(decks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = decks.filter(deck =>
        deck.name.toLowerCase().includes(query) ||
        deck.description.toLowerCase().includes(query)
      );
      setFilteredDecks(filtered);
    }
  }, [searchQuery, decks]);

  // Initial load of decks
  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Handle deck selection - UPDATED to navigate directly to all cards view
  const handleDeckSelect = (deckId: number) => {
    // Redirect directly to the flashcard list view instead of the deck details
    router.push(`/flashcard/deck/${deckId}`);
  };

  // Handle retry on error
  const handleRetry = () => {
    fetchDecks();
  };

  // Nouveau gestionnaire pour naviguer vers l'explorateur de decks publics
  const handleExplorePublicDecks = () => {
    router.push('/flashcard/explore');
  };

  // Render search bar for decks view
  const renderSearchBar = () => {
    if (isPageLoading || loadError) return null;

    return (
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10 bg-white"
          placeholder={t('dashboard.flashcards.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-gold text-transparent bg-clip-text">
          {t('dashboard.flashcards.userDecks', { name: user?.name || '' })}
        </h1>
        <div className="flex gap-2">
          {/* Nouveau bouton pour accéder à l'explorateur de decks publics */}
          <Button
            variant="outline"
            onClick={handleExplorePublicDecks}
            className="bg-white"
          >
            <Globe className="h-4 w-4 mr-2 text-green-600" />
            {t('dashboard.flashcards.explorePublicDecks')}
          </Button>

          <Button
            variant="outline"
            onClick={handleRetry}
            disabled={isPageLoading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.refresh')}
          </Button>
        </div>
      </div>

      {renderSearchBar()}

      {isPageLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-brand-purple" />
            <p className="text-sm text-gray-500">{t('dashboard.flashcards.loading')}</p>
          </div>
        </div>
      ) : loadError ? (
        <Card className="border-2 border-dashed border-red-100">
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-red-600">{loadError}</p>
            <Button
              onClick={handleRetry}
              className="mt-4"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> {t('dashboard.flashcards.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bannière de promotion des decks publics */}
          {decks.length > 0 && (
            <Card className="mb-6 border-2 border-dashed border-green-100 bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{t('dashboard.flashcards.discoverPublicTitle')}</h3>
                    <p className="text-sm text-gray-600">{t('dashboard.flashcards.discoverPublicDesc')}</p>
                  </div>
                </div>
                <Button
                  onClick={handleExplorePublicDecks}
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {t('dashboard.flashcards.exploreNow')}
                </Button>
              </CardContent>
            </Card>
          )}

          <FlashcardDeckList
            onDeckSelect={handleDeckSelect}
            decks={filteredDecks}
            onDeckUpdate={fetchDecks}
          />
        </>
      )}
    </div>
  );
};

export default FlashcardMain;