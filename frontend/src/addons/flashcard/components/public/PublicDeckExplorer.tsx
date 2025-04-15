// src/addons/flashcard/components/PublicDeckExplorer.tsx
/**
 * PublicDeckExplorer Component
 * 
 * This component allows users to explore public decks of flashcards.
 * It provides functionalities to view popular and recent decks,
 * search for decks by name or username, and clone decks.
 * 
 * Props:
 * - onDeckClone: Callback function triggered when a deck is cloned.
 */
'use client';
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search,
  Copy,
  Award,
  Clock,
  User,
  Tag,
  Loader2,
  RefreshCw,
  Globe
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useTranslation } from "@/core/i18n/useTranslations";
import { useRouter } from "next/navigation";
import { PublicDeckExplorerProps } from "@/addons/flashcard/types";

const PublicDeckExplorer: React.FC<PublicDeckExplorerProps> = ({
  onDeckClone,
  initialTab = 'popular'
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  // États
  const [popularDecks, setPopularDecks] = useState<any[]>([]);
  const [recentDecks, setRecentDecks] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [clonedDecks, setClonedDecks] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    search: '',
    username: '',
    sort: 'popularity' as 'popularity' | 'recent' | 'alphabetical'
  });

  // Mise à jour d'un filtre individuel
  const updateFilter = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Récupération des decks populaires
  const fetchPopularDecks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await revisionApi.decks.getPopular(12);
      setPopularDecks(data);
    } catch (error) {
      console.error("Error fetching popular decks:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.failedToFetchPopularDecks'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  // Récupération des decks récents
  const fetchRecentDecks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await revisionApi.decks.getRecent(12);
      setRecentDecks(data);
    } catch (error) {
      console.error("Error fetching recent decks:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.failedToFetchRecentDecks'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  // Recherche de decks
  const searchDecks = useCallback(async () => {
    if (!filters.search && !filters.username) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const data = await revisionApi.decks.search({
        search: filters.search,
        username: filters.username,
        sort_by: filters.sort,
        public: true
      });
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching decks:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.searchError'),
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [filters, toast, t]);

  // Clonage d'un deck
  const handleCloneDeck = useCallback(async (deck: any) => {
    try {
      setClonedDecks(prev => new Set(prev).add(deck.id));

      await revisionApi.decks.clone(deck.id);

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.deckCloneSuccess', { name: deck.name }),
      });

      // Notifier le parent si nécessaire
      if (onDeckClone) {
        onDeckClone();
      }
    } catch (error) {
      console.error("Error cloning deck:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.cloneError'),
        variant: "destructive"
      });
    } finally {
      // Retirer l'indicateur de chargement spécifique à ce deck
      setClonedDecks(prev => {
        const newSet = new Set(prev);
        newSet.delete(deck.id);
        return newSet;
      });
    }
  }, [toast, t, onDeckClone]);

  // Navigation vers le détail d'un deck
  const handleViewDeck = (deckId: number) => {
    router.push(`/flashcard/explore?id=${deckId}`);
  };

  // Chargement initial
  useEffect(() => {
    if (activeTab === 'popular') {
      fetchPopularDecks();
    } else if (activeTab === 'recent') {
      fetchRecentDecks();
    }
  }, [activeTab, fetchPopularDecks, fetchRecentDecks]);

  // Déclenchement de la recherche
  useEffect(() => {
    // Utiliser un debounce pour éviter trop de requêtes
    const timer = setTimeout(() => {
      if (activeTab === 'search') {
        searchDecks();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, activeTab, searchDecks]);

  // Rendu d'un deck individuel
  const renderDeckCard = (deck: any) => {
    const isCloning = clonedDecks.has(deck.id);
    const cardCount = deck.card_count || 0;
    const learnedCount = deck.learned_count || 0;
    const completionRate = cardCount > 0 ? Math.round((learnedCount / cardCount) * 100) : 0;

    return (
      <Card
        key={deck.id}
        className="h-full flex flex-col transition-all duration-200 hover:shadow-md"
        onClick={() => handleViewDeck(deck.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold text-brand-purple flex items-center">
              {deck.name}
              <Globe className="h-3.5 w-3.5 ml-1.5 text-green-600" />
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {cardCount} {t('dashboard.flashcards.cards')}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-500 mt-1">
            <User className="h-3 w-3 mr-1" />
            <span>{deck.username || 'Anonymous'}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <p className="text-gray-600 text-sm line-clamp-3">
            {deck.description || t('dashboard.flashcards.noDescription')}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t('dashboard.flashcards.completion')}:</span>
              <span className={completionRate > 50 ? "text-green-600" : "text-orange-500"}>
                {completionRate}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-brand-purple to-brand-gold h-1.5 rounded-full"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {t('dashboard.flashcards.createdOn', {
                  date: new Date(deck.created_at).toLocaleDateString()
                })}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloneDeck(deck);
                }}
                disabled={isCloning}
                className="opacity-80 hover:opacity-100"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {t('dashboard.flashcards.cloning')}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    {t('dashboard.flashcards.clone')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Rendu des filtres de recherche
  const renderSearchFilters = () => (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('dashboard.flashcards.searchDecks')}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="relative sm:w-64">
          <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('dashboard.flashcards.filterByUsername')}
            value={filters.username}
            onChange={(e) => updateFilter('username', e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filters.sort === 'popularity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort', 'popularity')}
            className="flex-1 sm:flex-none"
          >
            <Award className="h-4 w-4 mr-1" />
            {t('dashboard.flashcards.popular')}
          </Button>

          <Button
            variant={filters.sort === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort', 'recent')}
            className="flex-1 sm:flex-none"
          >
            <Clock className="h-4 w-4 mr-1" />
            {t('dashboard.flashcards.recent')}
          </Button>

          <Button
            variant={filters.sort === 'alphabetical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort', 'alphabetical')}
            className="flex-1 sm:flex-none"
          >
            <Tag className="h-4 w-4 mr-1" />
            {t('dashboard.flashcards.az')}
          </Button>
        </div>
      </div>
    </div>
  );

  // Méthode pour rendre la grille de decks avec un état de chargement/vide
  const renderDeckGrid = (decks: any[], isLoadingState: boolean, emptyMessage: string, emptyIcon: React.ReactNode, refreshAction: () => void) => {
    if (isLoadingState) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        </div>
      );
    }

    if (decks.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto mb-3 text-gray-300">
            {emptyIcon}
          </div>
          <p className="text-gray-500 mb-4">{emptyMessage}</p>
          <Button onClick={refreshAction}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.tryAgain')}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map(renderDeckCard)}
      </div>
    );
  };

  // Rendu principal
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="popular">
            <Award className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.popular')}
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.recent')}
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.search')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="popular">
          {renderDeckGrid(
            popularDecks,
            isLoading,
            t('dashboard.flashcards.noPopularDecks'),
            <Award className="h-12 w-12" />,
            fetchPopularDecks
          )}
        </TabsContent>

        <TabsContent value="recent">
          {renderDeckGrid(
            recentDecks,
            isLoading,
            t('dashboard.flashcards.noRecentDecks'),
            <Clock className="h-12 w-12" />,
            fetchRecentDecks
          )}
        </TabsContent>

        <TabsContent value="search">
          {renderSearchFilters()}

          {isSearching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                {filters.search || filters.username
                  ? t('dashboard.flashcards.noSearchResults')
                  : t('dashboard.flashcards.searchPrompt')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(renderDeckCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicDeckExplorer;