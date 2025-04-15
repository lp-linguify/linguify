import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Layers,
  Check,
  Clock,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  CheckSquare,
  FileOutput,
  FileInput,
  Tag,
  Settings,
  SortAsc,
  SortDesc,
  HelpCircle,
  LoaderCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { revisionApi } from "@/addons/flashcard/api/revisionAPI";
import type { Flashcard, FlashcardDeck } from "@/addons/flashcard/types";
import EditCardModal from "../../../../../addons/flashcard/components/EditCardModal";
import ImportExcelModal from "../../../../../addons/flashcard/components/ImportExcelModal";
import DeleteProgressDialog from '../../../../../addons/flashcard/components/DeleteProgressDialog';
import { useTranslation } from "@/core/i18n/useTranslations";

// Type definitions
interface FlashcardListProps {
  cards: Flashcard[];
  deckId: number;
  onCardUpdate: () => Promise<void>;
}

interface SortConfig {
  key: 'front_text' | 'back_text' | 'learned' | 'review_count' | 'last_reviewed';
  direction: 'asc' | 'desc';
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

type FilterType = 'all' | 'new' | 'review' | 'learned';

// Constants
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

/**
 * FlashcardList Component
 * 
 * Displays a list of flashcards with filtering, sorting, and pagination capabilities.
 * Allows users to add, edit, delete, and manage flashcards.
 */
const FlashcardList: React.FC<FlashcardListProps> = ({
  cards,
  deckId,
  onCardUpdate
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // ======= State ======= 
  // Filtering and display
  const [allFilteredCards, setAllFilteredCards] = useState<Flashcard[]>(cards);
  const [displayedCards, setDisplayedCards] = useState<Flashcard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'front_text', direction: 'asc' });

  // Modal state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Deck info
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);

  // Loading and selection
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [isAllCardsSelected, setIsAllCardsSelected] = useState(false);

  // Deletion state
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0
  });

  // ======= Computed Values =======
  // Card statistics based on status
  const stats = useMemo(() => ({
    total: cards.length,
    new: cards.filter(c => !c.learned && c.review_count === 0).length,
    review: cards.filter(c => !c.learned && c.review_count > 0).length,
    learned: cards.filter(c => c.learned).length
  }), [cards]);

  // Check if current selection includes all displayed cards
  const isCurrentPageSelected = useMemo(() =>
    displayedCards.length > 0 &&
    displayedCards.every(card => selectedCards.includes(card.id)),
    [displayedCards, selectedCards]);

  // ======= Effects =======
  // Fetch deck details on mount
  useEffect(() => {
    const fetchDeckDetails = async () => {
      try {
        const deckData = await revisionApi.decks.getById(deckId);
        setDeck(deckData);
      } catch (error) {
        console.error("Error fetching deck details:", error);
        toast({
          title: t('dashboard.flashcards.errorTitle'),
          description: t('dashboard.flashcards.errorLoadingDeck'),
          variant: "destructive"
        });
      }
    };

    fetchDeckDetails();
  }, [deckId, toast, t]);

  // Apply filtering and sorting to cards
  useEffect(() => {
    if (!cards.length) {
      setAllFilteredCards([]);
      return;
    }

    let result = [...cards];

    // Apply filter
    if (activeFilter === 'new') {
      result = result.filter(card => !card.learned && card.review_count === 0);
    } else if (activeFilter === 'review') {
      result = result.filter(card => !card.learned && card.review_count > 0);
    } else if (activeFilter === 'learned') {
      result = result.filter(card => card.learned);
    }

    // Apply search
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      result = result.filter(
        card => card.front_text.toLowerCase().includes(trimmedQuery) ||
          card.back_text.toLowerCase().includes(trimmedQuery)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.key) {
        case 'front_text':
          return a.front_text.localeCompare(b.front_text) * direction;
        case 'back_text':
          return a.back_text.localeCompare(b.back_text) * direction;
        case 'learned':
          return (a.learned === b.learned ? 0 : a.learned ? 1 : -1) * direction;
        case 'review_count':
          return ((a.review_count || 0) - (b.review_count || 0)) * direction;
        case 'last_reviewed':
          if (!a.last_reviewed) return direction;
          if (!b.last_reviewed) return -direction;
          return (new Date(a.last_reviewed).getTime() - new Date(b.last_reviewed).getTime()) * direction;
        default:
          return 0;
      }
    });

    // Update all filtered cards
    setAllFilteredCards(result);

    // Update pagination based on filtered data
    setPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when filter/search changes
      totalItems: result.length,
      totalPages: Math.max(1, Math.ceil(result.length / prev.pageSize))
    }));

    // Reset selected cards when filter changes
    if (bulkSelectMode) {
      setIsAllCardsSelected(false);
    }
    setSelectedCards([]);
  }, [cards, activeFilter, searchQuery, sortConfig, bulkSelectMode]);

  // Apply pagination to filtered cards
  useEffect(() => {
    const startIdx = (pagination.currentPage - 1) * pagination.pageSize;
    const endIdx = startIdx + pagination.pageSize;

    setDisplayedCards(allFilteredCards.slice(startIdx, endIdx));
  }, [allFilteredCards, pagination.currentPage, pagination.pageSize]);

  // ======= Handlers =======
  const handleSort = useCallback((key: SortConfig['key']) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = parseInt(newSize);
    if (isNaN(size)) return;

    setPagination(prev => {
      const newTotalPages = Math.max(1, Math.ceil(prev.totalItems / size));
      // Adjust current page if it would be out of bounds with new size
      const newCurrentPage = Math.min(prev.currentPage, newTotalPages);

      return {
        ...prev,
        pageSize: size,
        totalPages: newTotalPages,
        currentPage: newCurrentPage
      };
    });
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  // Card Selection Handlers
  const handleToggleSelect = useCallback((cardId: number) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (bulkSelectMode) {
      // In bulk selection mode, toggle between selecting all filtered cards and none
      if (isAllCardsSelected) {
        setSelectedCards([]);
        setIsAllCardsSelected(false);
      } else {
        setSelectedCards(allFilteredCards.map(card => card.id));
        setIsAllCardsSelected(true);
      }
    } else {
      // Normal mode: select only cards on current page
      if (isCurrentPageSelected) {
        setSelectedCards(prev =>
          prev.filter(id => !displayedCards.find(card => card.id === id))
        );
      } else {
        setSelectedCards(prev => {
          const newSelection = [...prev];
          displayedCards.forEach(card => {
            if (!newSelection.includes(card.id)) {
              newSelection.push(card.id);
            }
          });
          return newSelection;
        });
      }
    }
  }, [bulkSelectMode, isAllCardsSelected, isCurrentPageSelected, allFilteredCards, displayedCards]);

  const toggleBulkSelectMode = useCallback(() => {
    setBulkSelectMode(prev => !prev);
    // Reset selection when changing modes
    setSelectedCards([]);
    setIsAllCardsSelected(false);
  }, []);

  const selectAllDeckCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const allCardIds = await revisionApi.flashcards.getAllIds(deckId);
      setSelectedCards(allCardIds);
      setIsAllCardsSelected(true);

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.allCardsSelected', { count: allCardIds.length.toString() }),
      });
    } catch (error) {
      console.error("Error selecting all cards:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.errorSelectingAll'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [deckId, toast, t]);

  // Card Management Handlers
  const handleCreateCard = useCallback(async (cardData: Partial<Flashcard>) => {
    try {
      setIsLoading(true);
      await revisionApi.flashcards.create({
        front_text: cardData.front_text || "",
        back_text: cardData.back_text || "",
        deck_id: deckId
      });

      setIsAddingCard(false);

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.createSuccess')
      });

      // Refresh the card list
      await onCardUpdate();
    } catch (error: any) {
      console.error("Error creating card:", error);
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: error.message || t('dashboard.flashcards.createError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [deckId, onCardUpdate, toast, t]);

  const handleUpdateCard = useCallback(async (cardData: Partial<Flashcard>) => {
    if (!editingCard) return;

    try {
      setIsLoading(true);
      await revisionApi.flashcards.update(editingCard.id, cardData);

      setEditingCard(null);

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t('dashboard.flashcards.updateSuccess')
      });

      // Refresh the card list
      await onCardUpdate();
    } catch (err) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.updateError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [editingCard, onCardUpdate, toast, t]);

  const handleCardStatusUpdate = useCallback(async (cardId: number, learned: boolean) => {
    try {
      setIsLoading(true);
      await revisionApi.flashcards.toggleLearned(cardId, learned);

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: learned
          ? t('dashboard.flashcards.markedKnown')
          : t('dashboard.flashcards.markedReview'),
      });

      // Refresh the card list
      await onCardUpdate();
    } catch (err) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.updateStatusError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [onCardUpdate, toast, t]);

  // Bulk Actions
  const handleBulkStatusUpdate = useCallback(async (learned: boolean) => {
    if (selectedCards.length === 0) return;

    try {
      setIsLoading(true);

      let successCount = 0;
      // Process in batches for better performance
      const batchSize = 5;

      for (let i = 0; i < selectedCards.length; i += batchSize) {
        const batch = selectedCards.slice(i, i + batchSize);

        // Process each batch in parallel
        await Promise.all(
          batch.map(async (cardId) => {
            try {
              await revisionApi.flashcards.toggleLearned(cardId, learned);
              successCount++;
            } catch (error) {
              console.error(`Failed to update card ${cardId}:`, error);
            }
          })
        );
      }

      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: t(learned ? 'dashboard.flashcards.bulkMarkedKnown' : 'dashboard.flashcards.bulkMarkedReview', { count: successCount.toString() }),
      });

      // Refresh the card list
      await onCardUpdate();

    } catch (error) {
      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.bulkUpdateError'),
        variant: "destructive"
      });
    } finally {
      setSelectedCards([]);
      setIsLoading(false);
    }
  }, [selectedCards, onCardUpdate, toast, t]);

  // Deletion Handlers
  const confirmDelete = useCallback(() => {
    if (selectedCards.length > 0) {
      // Initialize with 0 progress before showing dialog
      setDeleteProgress(0);
      setIsDeleteDialogOpen(true);

      // Debug log to verify function is called
      console.log("Delete confirmation dialog opened", { selectedCards: selectedCards.length });
    }
  }, [selectedCards]);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    // Reset deletion state after a short delay for transition
    setTimeout(() => {
      setDeleteProgress(0);
    }, 300);
  }, []);

  const handleDeleteCards = useCallback(async () => {
    if (!selectedCards.length) return;

    try {
      console.log("Starting deletion process", { count: selectedCards.length });

      // Set initial progress and reopen dialog in progress mode
      setDeleteProgress(5);

      // Short delay to ensure dialog shows progress
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log("Deletion progress started", { progress: 5 });

      setIsLoading(true);

      // Store cards to delete
      const cardsToDelete = [...selectedCards];
      const totalCards = cardsToDelete.length;

      // Optimistic update - remove cards from UI
      setAllFilteredCards(prev => prev.filter(card => !cardsToDelete.includes(card.id)));

      // Track deletion progress
      let processed = 0;
      let failed = 0;

      // Simulate deletion process with visual feedback
      const simulateProgress = () => {
        const interval = setInterval(() => {
          setDeleteProgress(prev => {
            const newProgress = Math.min(prev + 2, 90);
            console.log("Progress updated", { progress: newProgress });
            return newProgress;
          });
        }, 100);

        return interval;
      };

      const progressInterval = simulateProgress();

      // Try batch deletion first
      try {
        // Call batch API
        console.log("Attempting batch deletion");
        const result = await revisionApi.flashcards.deleteBatch(selectedCards);
        clearInterval(progressInterval);

        // Set to almost complete
        setDeleteProgress(95);
        console.log("Batch deletion successful", { progress: 95 });

        // Final update after batch completion
        setTimeout(() => {
          setDeleteProgress(100);
          console.log("Deletion complete", { progress: 100 });
        }, 500);

        processed = result.deleted || totalCards;

      } catch (batchError) {
        console.warn("Batch delete failed, using individual deletion", batchError);
        clearInterval(progressInterval);

        // Reset progress for individual approach
        setDeleteProgress(20);
        processed = 0;

        // Process in batches of 5 for better performance
        const batchSize = 5;

        for (let i = 0; i < totalCards; i += batchSize) {
          const batch = cardsToDelete.slice(i, i + batchSize);

          // Process each batch in parallel
          await Promise.all(
            batch.map(async (cardId) => {
              try {
                await revisionApi.flashcards.delete(cardId);
                processed++;
                // Update progress after each batch is processed
                const currentProgress = Math.floor((processed / totalCards) * 70) + 20; // 20% to 90%
                setDeleteProgress(currentProgress);
                console.log("Individual deletion progress", { processed, total: totalCards, progress: currentProgress });
              } catch (error) {
                console.error(`Failed to delete card ${cardId}:`, error);
                failed++;
              }
            })
          );

          // Brief pause between batches to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Final progress update
        setDeleteProgress(95);
      }

      // Ensure we show 100% 
      setDeleteProgress(100);
      console.log("Final progress set", { progress: 100 });

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset selected cards
      setSelectedCards([]);

      // Show success message
      toast({
        title: t('dashboard.flashcards.successTitle'),
        description: failed > 0
          ? t('dashboard.flashcards.partialDeleteSuccess', { success: processed.toString(), fail: failed.toString() })
          : t('dashboard.flashcards.deleteCardsSuccess', { count: processed.toString() }),
        variant: "default",
      });

      // Refresh card list
      await onCardUpdate();

    } catch (error) {
      console.error("Error deleting cards:", error);

      toast({
        title: t('dashboard.flashcards.errorTitle'),
        description: t('dashboard.flashcards.deleteError'),
        variant: "destructive"
      });

      // Close dialog on error
      setIsDeleteDialogOpen(false);

      // Rollback optimistic update
      await onCardUpdate();
    } finally {
      setIsLoading(false);
      // Dialog is closed by the user through closeDeleteDialog
    }
  }, [selectedCards, onCardUpdate, toast, t]);

  // Export Handlers
  const handleExportCSV = useCallback(() => {
    // Prepare CSV data
    const csvContent = [
      [t('dashboard.flashcards.front'), t('dashboard.flashcards.back'), t('dashboard.flashcards.status'), t('dashboard.flashcards.reviews'), t('dashboard.flashcards.lastReviewed')],
      ...allFilteredCards.map(card => [
        card.front_text.replace(/"/g, '""'),
        card.back_text.replace(/"/g, '""'),
        card.learned
          ? t('dashboard.flashcards.filter.known')
          : card.review_count > 0
            ? t('dashboard.flashcards.filter.toReview')
            : t('dashboard.flashcards.filter.new'),
        card.review_count || 0,
        card.last_reviewed ? new Date(card.last_reviewed).toLocaleDateString() : t('dashboard.flashcards.never')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Configure and trigger the download
    link.setAttribute('href', url);
    link.setAttribute('download', `${deck?.name || 'flashcards'}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t('dashboard.flashcards.exportComplete'),
      description: t('dashboard.flashcards.exportSuccess', { count: allFilteredCards.length.toString() })
    });
  }, [allFilteredCards, deck, t]);

  // ======= Render Helpers =======
  const renderTableHead = () => (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[30px] p-2">
          <div className="flex items-center">
            <Checkbox
              id="select-all-checkbox"
              checked={bulkSelectMode ? isAllCardsSelected : isCurrentPageSelected}
              onCheckedChange={handleToggleSelectAll}
              aria-label={
                bulkSelectMode
                  ? (isAllCardsSelected ? t('dashboard.flashcards.deselectAll') : t('dashboard.flashcards.selectAll'))
                  : (isCurrentPageSelected ? t('dashboard.flashcards.deselectCurrentPage') : t('dashboard.flashcards.selectCurrentPage'))
              }
            />
            {bulkSelectMode && (
              <span className="ml-2 text-xs text-purple-600">{t('dashboard.flashcards.bulk')}</span>
            )}
          </div>
        </TableHead>
        <TableHead
          className="cursor-pointer"
          onClick={() => handleSort('front_text')}
        >
          <div className="flex items-center">
            {t('dashboard.flashcards.front')}
            {sortConfig.key === 'front_text' && (
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
            {sortConfig.key === 'back_text' && (
              sortConfig.direction === 'asc'
                ? <SortAsc className="ml-1 h-4 w-4" />
                : <SortDesc className="ml-1 h-4 w-4" />
            )}
          </div>
        </TableHead>
        <TableHead
          className="cursor-pointer w-[100px]"
          onClick={() => handleSort('learned')}
        >
          <div className="flex items-center">
            {t('dashboard.flashcards.status')}
            {sortConfig.key === 'learned' && (
              sortConfig.direction === 'asc'
                ? <SortAsc className="ml-1 h-4 w-4" />
                : <SortDesc className="ml-1 h-4 w-4" />
            )}
          </div>
        </TableHead>
        <TableHead
          className="cursor-pointer w-[120px]"
          onClick={() => handleSort('review_count')}
        >
          <div className="flex items-center">
            {t('dashboard.flashcards.reviews')}
            {sortConfig.key === 'review_count' && (
              sortConfig.direction === 'asc'
                ? <SortAsc className="ml-1 h-4 w-4" />
                : <SortDesc className="ml-1 h-4 w-4" />
            )}
          </div>
        </TableHead>
        <TableHead className="w-[100px] text-right">{t('dashboard.flashcards.actions')}</TableHead>
      </TableRow>
    </TableHeader>
  );

  const renderCardRow = (card: Flashcard) => (
    <TableRow key={card.id} className="hover:bg-gray-50">
      <TableCell className="p-2">
        <Checkbox
          checked={selectedCards.includes(card.id)}
          onCheckedChange={() => handleToggleSelect(card.id)}
          aria-label={t('dashboard.flashcards.selectCard', { card: card.front_text })}
        />
      </TableCell>
      <TableCell className="font-medium">{card.front_text}</TableCell>
      <TableCell>{card.back_text}</TableCell>
      <TableCell>
        {card.learned ? (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Check className="h-3 w-3 mr-1" /> {t('dashboard.flashcards.filter.known')}
          </Badge>
        ) : card.review_count > 0 ? (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" /> {t('dashboard.flashcards.filter.toReview')}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Layers className="h-3 w-3 mr-1" /> {t('dashboard.flashcards.filter.new')}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {card.review_count || 0}
        {card.last_reviewed && (
          <span className="text-xs text-gray-500 block">
            {t('dashboard.flashcards.lastReviewedShort')}: {new Date(card.last_reviewed).toLocaleDateString()}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditingCard(card)}
          aria-label={t('dashboard.flashcards.editCard')}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleCardStatusUpdate(card.id, !card.learned)}
          aria-label={card.learned ? t('dashboard.flashcards.markForReview') : t('dashboard.flashcards.markAsLearned')}
          title={card.learned ? t('dashboard.flashcards.markForReview') : t('dashboard.flashcards.markAsLearned')}
        >
          {card.learned ? (
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center py-10">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <LoaderCircle className="animate-spin h-8 w-8 text-brand-purple" />
            <span className="ml-2">{t('dashboard.flashcards.loadingCards')}</span>
          </div>


        ) : searchQuery ? (
          <div className="flex flex-col items-center">
            <Search className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">{t('dashboard.flashcards.noMatchingSearch', { query: searchQuery })}</p>
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
            >
              {t('dashboard.flashcards.clearSearch')}
            </Button>
          </div>
        ) : activeFilter !== 'all' ? (
          <div className="flex flex-col items-center">
            <HelpCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">{t('dashboard.flashcards.noCardsInCategory')}</p>
            <Button
              variant="link"
              onClick={() => setActiveFilter('all')}
            >
              {t('dashboard.flashcards.showAllCards')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <PlusCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">{t('dashboard.flashcards.noCards')}</p>
            <Button
              onClick={() => setIsAddingCard(true)}
              className="bg-brand-purple hover:bg-brand-purple-dark mt-2"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('dashboard.flashcards.addFirstCard')}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );

  const renderActionToolbar = () => (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
      {/* Left side - Search and primary actions */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('dashboard.flashcards.searchCards')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            aria-label={t('dashboard.flashcards.searchCards')}
          />
        </div>

        {/* Primary action button */}
        <Button
          onClick={() => setIsAddingCard(true)}
          className="bg-brand-purple hover:bg-brand-purple-dark"
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('dashboard.flashcards.addCard')}
        </Button>

        {/* Filters dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title={t('dashboard.flashcards.filterOptions')}>
              <Filter className="h-4 w-4" />
              <span className="sr-only">{t('dashboard.flashcards.filterOptions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t('dashboard.flashcards.filterOptions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveFilter('all')}>
              <Layers className="mr-2 h-4 w-4" />
              {t('dashboard.flashcards.allCards')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter('new')}>
              <Tag className="mr-2 h-4 w-4 text-blue-600" />
              {t('dashboard.flashcards.newCards')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter('review')}>
              <Clock className="mr-2 h-4 w-4 text-yellow-600" />
              {t('dashboard.flashcards.reviewCards')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter('learned')}>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              {t('dashboard.flashcards.learnedCards')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side - Selection management and secondary actions */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Selection Actions - Conditional rendering based on selection state */}
        {selectedCards.length > 0 ? (
          <>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('dashboard.flashcards.deleteWithCount', { count: selectedCards.length.toString() })}
            </Button>

            {/* Only show these options if multiple cards are selected */}
            {selectedCards.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('dashboard.flashcards.bulkActions')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate(true)}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('dashboard.flashcards.markAllAsLearned')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate(false)}>
                    <RefreshCw className="mr-2 h-4 w-4 text-yellow-600" />
                    {t('dashboard.flashcards.markAllForReview')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedCards([])}>
                    {t('dashboard.flashcards.clearSelection')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Clear selection button */}
            <Button
              variant="outline"
              onClick={() => setSelectedCards([])}
              disabled={isLoading}
            >
              {t('dashboard.flashcards.clearSelection')}
            </Button>
          </>
        ) : (
          /* Actions dropdown - when no selection */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {t('dashboard.flashcards.actions')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('dashboard.flashcards.cardManagement')}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Import/Export section */}
              <DropdownMenuItem onClick={() => setIsImporting(true)}>
                <FileInput className="mr-2 h-4 w-4" />
                {t('dashboard.flashcards.importFromExcel')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportCSV}
                disabled={allFilteredCards.length === 0}
              >
                <FileOutput className="mr-2 h-4 w-4" />
                {t('dashboard.flashcards.exportToCsv')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Selection modes */}
              <DropdownMenuItem onClick={toggleBulkSelectMode}>
                <CheckSquare className="mr-2 h-4 w-4" />
                {bulkSelectMode ? t('dashboard.flashcards.normalSelectionMode') : t('dashboard.flashcards.bulkSelectionMode')}
              </DropdownMenuItem>

              {bulkSelectMode && (
                <DropdownMenuItem onClick={selectAllDeckCards}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {t('dashboard.flashcards.selectAllCardsInDeck')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  const renderPagination = () => {
    const { currentPage, totalPages, pageSize, totalItems } = pagination;

    // Calculate display ranges for better UX
    const startItem = Math.min(totalItems, (currentPage - 1) * pageSize + 1);
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-sm text-gray-500">
          {totalItems > 0
            ? t('dashboard.flashcards.showingItems', { start: startItem.toString(), end: endItem.toString(), total: totalItems.toString() })
            : t('dashboard.flashcards.noCardsToDisplay')
          }
        </div>

        {totalItems > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8"
                aria-label={t('dashboard.flashcards.firstPage')}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8"
                aria-label={t('dashboard.flashcards.previousPage')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center mx-2">
                <span className="text-sm mx-1">{t('dashboard.flashcards.page')}</span>
                <Input
                  className="h-8 w-12 text-center"
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                      goToPage(page);
                    }
                  }}
                  aria-label={t('dashboard.flashcards.pageXofY', { current: currentPage.toString(), total: totalPages.toString() })}
                />
                <span className="text-sm mx-1">{t('dashboard.flashcards.ofPages', { total: totalPages.toString() })}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
                aria-label={t('dashboard.flashcards.nextPage')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
                aria-label={t('dashboard.flashcards.lastPage')}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue placeholder={t('dashboard.flashcards.perPage')} />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {t('dashboard.flashcards.itemsPerPage', { count: size.toString() })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  // ======= Main Render =======
  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center mb-2">
            <div className="flex gap-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Tag className="h-3 w-3 mr-1" />
                {t('dashboard.flashcards.filter.new')}: {stats.new}
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <Clock className="h-3 w-3 mr-1" />
                {t('dashboard.flashcards.filter.toReview')}: {stats.review}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Check className="h-3 w-3 mr-1" />
                {t('dashboard.flashcards.filter.known')}: {stats.learned}
              </Badge>
            </div>
          </CardTitle>
          <Tabs
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as FilterType)}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="all">{t('dashboard.flashcards.filter.all')} ({stats.total})</TabsTrigger>
              <TabsTrigger value="new">{t('dashboard.flashcards.filter.new')} ({stats.new})</TabsTrigger>
              <TabsTrigger value="review">{t('dashboard.flashcards.filter.toReview')} ({stats.review})</TabsTrigger>
              <TabsTrigger value="learned">{t('dashboard.flashcards.filter.known')} ({stats.learned})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {renderActionToolbar()}

          <div className="rounded-md border">
            <Table>
              {renderTableHead()}
              <TableBody>
                {displayedCards.length > 0
                  ? displayedCards.map(renderCardRow)
                  : renderEmptyState()
                }
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {renderPagination()}
        </CardContent>
      </Card>

      {/* Add Card Modal */}
      {isAddingCard && (
        <EditCardModal
          card={{
            id: -1,
            deck: deck ? deck.id : deckId,
            front_text: "",
            back_text: "",
            learned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            review_count: 0,
            last_reviewed: "",
            next_review: null
          }}
          isOpen={isAddingCard}
          onClose={() => setIsAddingCard(false)}
          onSave={handleCreateCard}
        />
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleUpdateCard}
        />
      )}

      {/* Import Modal */}
      {isImporting && (
        <ImportExcelModal
          deckId={deckId}
          isOpen={isImporting}
          onClose={() => setIsImporting(false)}
          onImportSuccess={onCardUpdate}
        />
      )}

      {/* Delete Progress Dialog */}
      <DeleteProgressDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        progress={deleteProgress}
        totalCards={selectedCards.length}
        onConfirm={handleDeleteCards}
      />
    </>
  );
};

export default FlashcardList;