// src/app/%28dashboard%29/%28apps%29/revision/types/revision.ts

export type LanguageCode = 'EN' | 'FR' | 'ES' | 'NL';



export interface RevisionSession {
  id: number;
  scheduled_date: string;
  completed_date?: string;
  success_rate?: number;
  cards_reviewed: number;
  due_cards: number;
}


export interface VocabularyWord {
  id: number;
  word: string;
  translation: string;
  source_language: LanguageCode;
  target_language: LanguageCode;
  context?: string;
  notes?: string;
  created_at: string;
  last_reviewed: string | null;
  review_count: number;
  mastery_level: number;
}

export interface VocabularyList {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  words: VocabularyWord[];
  word_count: number;
}

export interface CreateRevisionList {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface AddField {
  id: number;
  field_1: string;
  field_2: string;
  created_at: string;
  last_reviewed: string | null;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  word: VocabularyWord;
}
export interface EditingDeck {
  id: number;
  name: string;
  description: string;
}

export interface StudyProgress {
  totalCards: number;
  learnedCards: number;
  toReviewCards: number;
  completionPercentage: number;
}

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

export interface FormData {
  frontText: string;
  backText: string;
}