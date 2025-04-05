// src/app/(dashboard)/(apps)/flashcard/_components/FlashcardDeckList.tsx
'use client';
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Plus,
  X,
  Trash2,
  CheckSquare,
  MoreVertical,
  Pencil,
  Loader2,
  List,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { revisionApi } from "@/services/revisionAPI";
import type { FlashcardDeck, EditingDeck } from "@/types/revision";
import { useTranslation } from "@/core/i18n/useTranslations";

interface FlashcardDeckListProps {
  decks: FlashcardDeck[];
  onDeckSelect: (deckId: number) => void;
  onViewAllCards?: (deckId: number) => void;  // New prop for advanced navigation
}

interface DeckWithCardCount extends FlashcardDeck {
  cardCount?: number;
}

const FlashcardDeckList: React.FC<FlashcardDeckListProps> = ({
  decks,
  onDeckSelect,
  onViewAllCards
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [decksWithCount, setDecksWithCount] = useState<DeckWithCardCount[]>([]);
  const [isAddingDeck, setIsAddingDeck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState<number[]>([]);
  const [editingDeck, setEditingDeck] = useState<EditingDeck | null>(null);
  const [newDeck, setNewDeck] = useState({
    name: "",
    description: "",
  });

  // Optimized fetchCardCounts using memoization
  const fetchCardCounts = useCallback(async () => {
    if (decks.length === 0) return;
    
    setIsLoadingCounts(true);
    try {
      const updatedDecks = await Promise.all(
        decks.map(async (deck) => {
          try {
            const cards = await revisionApi.flashcards.getAll(deck.id);
            return {
              ...deck,
              cardCount: cards.length,
            };
          } catch (error) {
            console.error(`Error fetching cards for deck ${deck.id}:`, error);
            return {
              ...deck,
              cardCount: 0,
            };
          }
        })
      );
      setDecksWithCount(updatedDecks);
    } catch (error) {
      console.error("Error fetching card counts:", error);
      // Fallback to decks without counts in case of error
      setDecksWithCount(decks.map(deck => ({ ...deck, cardCount: 0 })));
    } finally {
      setIsLoadingCounts(false);
    }
  }, [decks]);

  useEffect(() => {
    fetchCardCounts();
  }, [fetchCardCounts]);

  const handleAddDeck = async () => {
    if (!newDeck.name.trim()) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.deckNameRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await revisionApi.decks.create({
        name: newDeck.name.trim(),
        description:
          newDeck.description.trim() ||
          t('dashboard.flashcards.defaultDeckDescription', { date: new Date().toLocaleDateString() }),
      });

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.deckCreated'),
      });

      setIsAddingDeck(false);
      setNewDeck({ name: "", description: "" });
      
      // Inform parent component to refresh decks
      // This avoids duplicate API calls
      // The parent component will trigger fetchCardCounts through the decks prop update
    } catch (error) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.createDeckError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeckSelection = (deckId: number) => {
    setSelectedDecks((prev) => {
      if (prev.includes(deckId)) {
        return prev.filter((id) => id !== deckId);
      } else {
        return [...prev, deckId];
      }
    });
  };

  const handleDeleteSelectedDecks = async () => {
    if (!selectedDecks.length) return;

    if (
      !window.confirm(
        t('dashboard.flashcards.confirmDeleteDecks', { count: selectedDecks.length.toString() })
      )
    ) {
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        selectedDecks.map(async (deckId) => {
          try {
            await revisionApi.decks.delete(deckId);
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Failed to delete deck ${deckId}:`, error);
          }
        })
      );

      // Update local state to reflect deletions
      setDecksWithCount((prev) =>
        prev.filter((deck) => !selectedDecks.includes(deck.id))
      );
      setSelectedDecks([]);
      setIsSelectionMode(false);

      // Provide detailed feedback
      toast({
        title: failCount > 0 
          ? t('dashboard.flashcards.partialSuccess') 
          : t('dashboard.flashcards.successTitle'),
        description: failCount > 0
          ? t('dashboard.flashcards.partialDeleteSuccess', { success: successCount.toString(), fail: failCount.toString() })
          : t('dashboard.flashcards.deleteDecksSuccess', { count: successCount.toString() }),
        variant: failCount > 0 ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.operationFailed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDeck = async () => {
    if (!editingDeck) return;

    try {
      setIsLoading(true);
      await revisionApi.decks.update(editingDeck.id, {
        name: editingDeck.name.trim(),
        description: editingDeck.description.trim(),
      });

      // Optimistically update the UI
      setDecksWithCount((prev) =>
        prev.map((deck) =>
          deck.id === editingDeck.id
            ? {
                ...deck,
                name: editingDeck.name,
                description: editingDeck.description,
              }
            : deck
        )
      );

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.deckUpdated'),
      });

      setEditingDeck(null);
    } catch (error) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.updateDeckError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state with create button
  if (decksWithCount.length === 0 && !isAddingDeck) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4 p-6">
          <BookOpen className="h-8 w-8 text-gray-400" />
          <p className="text-gray-500 text-center">{t('dashboard.flashcards.noDecksAvailable')}</p>
          <Button
            className="bg-gradient-to-r from-brand-purple to-brand-gold"
            onClick={() => setIsAddingDeck(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.createFirstDeck')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-brand-purple to-brand-gold bg-clip-text text-transparent">
          {t('dashboard.flashcards.selectDeck')}
          {isLoadingCounts && (
            <Loader2 className="inline-block h-4 w-4 ml-2 animate-spin text-brand-purple" />
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddingDeck(true)}
            className="bg-brand-purple text-white hover:bg-purple-700 disabled:bg-purple-300"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.flashcards.newList')}
          </Button>
          {isSelectionMode ? (
            <>
              <Button
                variant="destructive"
                onClick={handleDeleteSelectedDecks}
                disabled={isLoading || selectedDecks.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('dashboard.flashcards.deleteWithCount', { count: selectedDecks.length.toString() })}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedDecks([]);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {t('dashboard.flashcards.cancel')}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="bg-brand-purple text-white hover:bg-brand-purple-dark disabled:bg-brand-purple-light"
              onClick={() => setIsSelectionMode(true)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {t('dashboard.flashcards.select')}
            </Button>
          )}
        </div>
      </div>

      {/* Decks grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {decksWithCount.map((deck) => (
          <Card
            key={deck.id}
            className={`group hover:shadow-md transition-all duration-200 cursor-pointer border
              ${
                selectedDecks.includes(deck.id)
                  ? "ring-2 ring-brand-purple"
                  : ""
              }`}
            onClick={() => !isSelectionMode && onDeckSelect(deck.id)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedDecks.includes(deck.id)}
                      onChange={() => toggleDeckSelection(deck.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  )}
                  <h3 className="font-medium group-hover:text-brand-purple transition-colors">
                    {deck.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400 group-hover:text-brand-purple transition-colors" />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDeck({
                            id: deck.id,
                            name: deck.name,
                            description: deck.description,
                          });
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('dashboard.flashcards.edit')}
                      </DropdownMenuItem>
                      {/* Option to view all cards in the deck */}
                      {onViewAllCards && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAllCards(deck.id);
                          }}
                        >
                          <List className="mr-2 h-4 w-4" />
                          {t('dashboard.flashcards.viewAllCards')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDecks([deck.id]);
                          handleDeleteSelectedDecks();
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('dashboard.flashcards.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">
                {deck.description}
              </p>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('dashboard.flashcards.cardsCount', { count: (deck.cardCount ?? 0).toString() })}</span>
                <span>
                  {t('dashboard.flashcards.createdOn', { date: new Date(deck.created_at).toLocaleDateString() })}
                </span>
              </div>
              
              {/* Shortcut button to card list view */}
              {onViewAllCards && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAllCards(deck.id);
                    }}
                  >
                    <List className="mr-1 h-4 w-4" />
                    {t('dashboard.flashcards.viewAllCards')}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit modal */}
      {editingDeck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.flashcards.editDeck')}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingDeck(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('dashboard.flashcards.name')}</Label>
                <Input
                  id="edit-name"
                  placeholder={t('dashboard.flashcards.enterDeckName')}
                  value={editingDeck.name}
                  onChange={(e) =>
                    setEditingDeck((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('dashboard.flashcards.description')}</Label>
                <Textarea
                  id="edit-description"
                  placeholder={t('dashboard.flashcards.enterDeckDescription')}
                  value={editingDeck.description}
                  onChange={(e) =>
                    setEditingDeck((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingDeck(null)}
                  disabled={isLoading}
                >
                  {t('dashboard.flashcards.cancel')}
                </Button>
                <Button
                  onClick={handleEditDeck}
                  disabled={isLoading || !editingDeck.name.trim()}
                  className="bg-gradient-to-r from-brand-purple to-brand-gold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('dashboard.flashcards.saving')}
                    </>
                  ) : t('dashboard.flashcards.saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add modal */}
      {isAddingDeck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.flashcards.createNewDeck')}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingDeck(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('dashboard.flashcards.name')}</Label>
                <Input
                  id="name"
                  placeholder={t('dashboard.flashcards.enterDeckName')}
                  value={newDeck.name}
                  onChange={(e) =>
                    setNewDeck((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('dashboard.flashcards.descriptionOptional')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('dashboard.flashcards.enterDeckDescription')}
                  value={newDeck.description}
                  onChange={(e) =>
                    setNewDeck((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingDeck(false)}
                  disabled={isLoading}
                >
                  {t('dashboard.flashcards.cancel')}
                </Button>
                <Button
                  onClick={handleAddDeck}
                  disabled={isLoading || !newDeck.name.trim()}
                  className="bg-gradient-to-r from-brand-purple to-brand-gold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('dashboard.flashcards.creating')}
                    </>
                  ) : t('dashboard.flashcards.createDeck')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FlashcardDeckList;