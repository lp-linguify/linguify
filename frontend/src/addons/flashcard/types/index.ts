// src/addons/flashcard/types/index.ts

/**
 * DeleteConfimationDialog Component
 */
export interface DeleteProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  totalCards: number;
  progress: number;
}

/**
 * EditCardModal Component
 */

export interface EditCardModalProps {
  card: Flashcard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Partial<Flashcard>) => Promise<void>;
}

/**
 * FlashcardDeckList Component
 */

export interface FlashcardDeckListProps {
  decks: FlashcardDeck[];
  onDeckSelect: (deckId: number) => void;
  onViewAllCards?: (deckId: number) => void;  // New prop for advanced navigation
  onDeckUpdate?: () => void;  // Callback when decks are updated
}

export interface DeckWithCardCount extends FlashcardDeck {
  cardCount?: number;
  is_archived?: boolean;
}

export interface EditingDeck {
  id: number;
  name: string;
  description: string;
}

/**
 * FlashcardList Component
 */

export interface FlashcardListProps {
  cards: Flashcard[];
  deckId: number;
  onCardUpdate: () => Promise<void>;
}

export interface SortConfig {
  key: 'front_text' | 'back_text' | 'learned' | 'review_count' | 'last_reviewed';
  direction: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export type FilterType = 'all' | 'new' | 'review' | 'learned';

/**
 * FlashCards Component
 */
export interface Flashcard {
  id: number;
  deck: number;
  front_text: string;
  back_text: string;
  learned: boolean;
  created_at: string;
  updated_at: string;
  last_reviewed: string | null;
  review_count: number;
  next_review: string | null;
}

export interface FlashcardDeck {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  user?: any;
  card_count?: number;
  learned_count?: number;
  cards?: Flashcard[];
  is_public?: boolean;
  username?: string;
  is_archived?: boolean;
  is_cloned?: boolean;
  is_cloning?: boolean;
  is_cloning_error?: boolean;
  deck: number;
  front_text: string;
  back_text: string;
  learned: boolean;
  last_reviewed: string | null;
  review_count: number;
  next_review: string | null;

}

export interface FlashcardAppProps {
  selectedDeck: FlashcardDeck;
  onCardUpdate: () => void;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

export interface FormData {
  frontText: string;
  backText: string;
}

/**
 * FlashcardStats Component
 */

export interface FlashcardStatsProps {
  deckId: number;
}

export interface StudyProgress {
  totalCards: number;
  learnedCards: number;
  toReviewCards: number;
  completionPercentage: number;
}

/**
 * ImportExcelModal Component
 */

export interface ImportExcelModalProps {
  deckId: number;
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export interface ColumnMapping {
  frontColumn: string;
  backColumn: string;
}

/**
 * PublicityToggle Component
 */

export interface PublicityToggleProps {
  deckId: number;
  isPublic: boolean;
  isArchived?: boolean;
  onStatusChange?: (isPublic: boolean) => void;
  disabled?: boolean;
}

/**
 * StudyModes Component
 */


export interface StudyModeProps {
  deckId: number;
}

export interface StudyModeCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  deckId: number;
}

/**
 * Addons/flashcard/api/revisionAPI.tsx Component
 */

export interface SearchParams {
  search?: string;
  username?: string;
  sort_by?: 'popularity' | 'recent' | 'alphabetical';
  public?: boolean;
  mine?: boolean;
  archived?: boolean;
  limit?: number;
}

/**
 * PublicDeckDetail Component
 */

export interface PublicDeckDetailProps {
  deckId: number;
  onGoBack?: () => void;
  onClone?: (deckId: number) => void;
}

/**
 * PublicDeckExplorer Component
 */

export interface PublicDeckExplorerProps {
  onDeckClone?: () => void;
  initialTab?: 'popular' | 'recent' | 'search';
}

/**
 * Flashcard Pages
 */

export interface LearnQuestion {
  id: number;
  term: string;
  correctAnswer: string;
  allOptions: string[];
}

export interface LearnSettings {
  cardLimit: number;
  cardSource: "all" | "new" | "review" | "difficult";
  shuffleQuestions: boolean;
}

export interface MatchCard {
  id: number;
  flashcardId: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  type: 'term' | 'definition';
}









