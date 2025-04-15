// src/addons/flashcard/components/public/PublicDeckDetail.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Copy,
  Globe,
  BookOpen,
  Search,
  User,
  Clock,
  Check,
  Layers,
  RefreshCw,
  SortAsc,
  SortDesc,
  Loader2,
  X
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import { useTranslation } from "@/core/i18n/useTranslations";
import { useRouter } from "next/navigation";
import { FlashcardDeck, Flashcard, PublicDeckDetailProps } from "@/addons/flashcard/types";

const PublicDeckDetail: React.FC<PublicDeckDetailProps> = ({
  deckId,
  onGoBack,
  onClone
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  // État
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    field: 'front_text' | 'back_text';
    direction: 'asc' | 'desc';
  }>({ field: 'front_text', direction: 'asc' });
  const [activeTab, setActiveTab] = useState('overview');
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);

  // Statistiques
  const stats = {
    total: cards.length,
    new: cards.filter(c => !c.learned && c.review_count === 0).length,
    review: cards.filter(c => !c.learned && c.review_count > 0).length,
    learned: cards.filter(c => c.learned).length,
  };

  // Chargement initial des données
  useEffect(() => {
    const loadDeckData = async () => {
      setIsLoading(true);
      try {
        // Charger les détails du deck
        const deckData = await revisionApi.decks.getById(deckId);
        setDeck(deckData);

        // Charger les cartes
        const cardsData = await revisionApi.flashcards.getAll(deckId);
        setCards(cardsData);
        setFilteredCards(cardsData);
      } catch (error) {
        console.error('Error loading deck details:', error);
        toast({
          title: t('dashboard.flashcards.errorTitle'),
          description: t('dashboard.flashcards.errorLoadingDeck'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDeckData();
  }, [deckId, toast, t]);

  // Filtrage des cartes
  useEffect(() => {
    if (cards.length === 0) return;

    let result = [...cards];

    // Appliquer le filtre de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        card => card.front_text.toLowerCase().includes(query) ||
          card.back_text.toLowerCase().includes(query)
      );
    }

    // Appliquer le tri
    result.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      return a[sortConfig.field].localeCompare(b[sortConfig.field]) * direction;
    });

    setFilteredCards(result);
  }, [cards, searchQuery, sortConfig]);

  // Gestion du clone du deck
  const handleClone = async () => {
    if (!deck) return;

    try {
      setIsCloning(true);

      const result = await revisionApi.decks.clone(deckId);

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.deckCloneSuccess', { name: deck.name }),
      });

      // Notifier le parent
      if (onClone) {
        onClone(result.deck.id);
      }

      // Naviguer vers le nouveau deck
      if (result.deck && result.deck.id) {
        router.push(`/flashcard/deck/${result.deck.id}`);
      }
    } catch (error) {
      console.error('Error cloning deck:', error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.cloneError'),
        variant: "destructive"
      });
    } finally {
      setIsCloning(false);
    }
  };

  // Gestionnaires d'événements
  const handleSort = (field: 'front_text' | 'back_text') => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Composant de carte d'exemple
  const renderExampleCard = () => {
    if (cards.length === 0) return null;

    // Prendre une carte au hasard pour l'exemple
    const randomIndex = Math.floor(Math.random() * Math.min(cards.length, 3));
    const exampleCard = cards[randomIndex];

    return (
      <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="text-lg font-semibold text-center">{exampleCard.front_text}</div>
          <Separator />
          <div className="italic text-gray-600 text-center">{exampleCard.back_text}</div>
        </div>
      </div>
    );
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  // Si le deck n'existe pas ou n'a pas été trouvé
  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-red-50 text-red-600 p-3 rounded-full mb-4">
          <X className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">{t('dashboard.flashcards.deckNotFound')}</h2>
        <p className="text-gray-500 mb-6">{t('dashboard.flashcards.deckMayNotExist')}</p>
        <Button
          onClick={() => onGoBack ? onGoBack() : router.push('/flashcard')}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('dashboard.flashcards.backToDecks')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoBack ? onGoBack() : router.push('/flashcard')}
            className="mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('dashboard.flashcards.back')}
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            {deck.name}
            {deck.is_public && <Globe className="h-5 w-5 ml-2 text-green-600" />}
          </h1>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <User className="h-3 w-3 mr-1" />
            <span>{deck.username}</span>
            <span className="mx-2">•</span>
            <Clock className="h-3 w-3 mr-1" />
            <span>{new Date(deck.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <Button
          onClick={handleClone}
          disabled={isCloning}
          className="bg-brand-purple hover:bg-brand-purple-dark text-white"
        >
          {isCloning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('dashboard.flashcards.cloning')}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              {t('dashboard.flashcards.cloneDeck')}
            </>
          )}
        </Button>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.overview')}
          </TabsTrigger>
          <TabsTrigger value="cards">
            <Layers className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.allCards')} ({cards.length})
          </TabsTrigger>
        </TabsList>

        {/* Aperçu du deck */}
        <TabsContent value="overview" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('dashboard.flashcards.about')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {deck.description || t('dashboard.flashcards.noDescription')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-blue-600 font-semibold text-xl">{stats.total}</div>
                    <div className="text-xs text-blue-700">{t('dashboard.flashcards.totalCards')}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-purple-600 font-semibold text-xl">{stats.new}</div>
                    <div className="text-xs text-purple-700">{t('dashboard.flashcards.newCards')}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-yellow-600 font-semibold text-xl">{stats.review}</div>
                    <div className="text-xs text-yellow-700">{t('dashboard.flashcards.reviewCards')}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-green-600 font-semibold text-xl">{stats.learned}</div>
                    <div className="text-xs text-green-700">{t('dashboard.flashcards.learnedCards')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.flashcards.sampleCard')}</CardTitle>
                <CardDescription>{t('dashboard.flashcards.randomExample')}</CardDescription>
              </CardHeader>
              <CardContent>
                {cards.length > 0 ? renderExampleCard() : (
                  <div className="text-center py-6 text-gray-500">
                    {t('dashboard.flashcards.noCardsInDeck')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Appel à l'action */}
          <Card className="mt-6 bg-gradient-to-r from-brand-purple/10 to-brand-gold/10">
            <CardContent className="flex flex-col sm:flex-row justify-between items-center p-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {t('dashboard.flashcards.likeThisDeck')}
                </h3>
                <p className="text-gray-600 max-w-md">
                  {t('dashboard.flashcards.clonePrompt')}
                </p>
              </div>
              <Button
                onClick={handleClone}
                disabled={isCloning}
                className="bg-gradient-to-r from-brand-purple to-brand-gold text-white mt-4 sm:mt-0"
                size="lg"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('dashboard.flashcards.cloning')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('dashboard.flashcards.cloneToLibrary')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liste des cartes */}
        <TabsContent value="cards" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <CardTitle>{t('dashboard.flashcards.allCards')}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('dashboard.flashcards.searchCards')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCards.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('front_text')}
                        >
                          <div className="flex items-center">
                            {t('dashboard.flashcards.front')}
                            {sortConfig.field === 'front_text' && (
                              sortConfig.direction === 'asc'
                                ? <SortAsc className="ml-1 h-4 w-4" />
                                : <SortDesc className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('back_text')}
                        >
                          <div className="flex items-center">
                            {t('dashboard.flashcards.back')}
                            {sortConfig.field === 'back_text' && (
                              sortConfig.direction === 'asc'
                                ? <SortAsc className="ml-1 h-4 w-4" />
                                : <SortDesc className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">{t('dashboard.flashcards.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map(card => (
                        <TableRow key={card.id}>
                          <TableCell className="font-medium">{card.front_text}</TableCell>
                          <TableCell>{card.back_text}</TableCell>
                          <TableCell>
                            {card.learned ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <Check className="h-3 w-3 mr-1" /> {t('dashboard.flashcards.known')}
                              </Badge>
                            ) : card.review_count > 0 ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                <RefreshCw className="h-3 w-3 mr-1" /> {t('dashboard.flashcards.review')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                <Layers className="h-3 w-3 mr-1" /> {t('dashboard.flashcards.new')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">{t('dashboard.flashcards.noSearchResults')}</p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                  >
                    {t('dashboard.flashcards.clearSearch')}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">{t('dashboard.flashcards.noCardsInDeck')}</p>
                </div>
              )}
            </CardContent>
            {filteredCards.length > 0 && (
              <CardFooter className="flex justify-between items-center border-t px-6 py-4">
                <div className="text-sm text-gray-500">
                  {t('dashboard.flashcards.showingCards', {
                    count: filteredCards.length.toString(),
                    total: cards.length.toString()
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={handleClone}
                  disabled={isCloning}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t('dashboard.flashcards.cloneThisDeck')}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicDeckDetail;