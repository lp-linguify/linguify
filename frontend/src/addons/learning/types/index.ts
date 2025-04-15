// src/types/learning.ts

/**
 * This file contains TypeScript interfaces and types used in the learning module of the application.
 * These interfaces define the structure of various entities such as units, lessons, vocabulary items, and exercises.
 */

export interface Unit {
  id: number;
  title: string;
  description: string;
  level: string;
  order: number;
}

export interface ExpandableUnitCardProps {
  unit: Unit;
  onLessonClick: (unitId: number, lessonId: number) => void;
  showLevelBadge?: boolean;
  refreshTrigger?: number;
  cacheTTL?: number;
}

export interface LevelGroup {
  level: string;
  units: Unit[];
}


export interface Lesson {
  id: number;
  title: string;
  description: string;
  lesson_type: string;
  estimated_duration: number;
  unit_id?: number;
  unit_title?: string;
  unit_level?: string;
  content_count?: number;
  order: number;
}

export interface LessonsProps {
  unitId: string;
}

export interface ContentLesson {
  id: number;
  title: {
    en: string;
    fr: string;
    es: string;
    nl: string;
  };
  instruction: {
    en: string;
    fr: string;
    es: string;
    nl: string;
  };
  content_type: string;
  vocabulary_lists?: Array<{
    id: number;
    word_en: string;
    definition_en: string;
  }>;
  order: number;
}

export interface LessonsByContentResponse {
  results: Lesson[];
  metadata: {
    content_type: string;
    target_language: string;
    available_levels: string[];
    total_count: number;
    error?: string;
  };
}

export interface LessonContentProps {
  lessonId: string;
  unitId?: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
}

export interface VocabularyItem {
  id: number;
  content_lesson: number;
  word: string;
  definition: string;
  example_sentence: string;
  word_type: string;
  synonymous: string;
  antonymous: string;
  word_en: string;
  word_fr: string;
  word_es: string;
  word_nl: string;
  definition_en: string;
  definition_fr: string;
  definition_es: string;
  definition_nl: string;
  example_sentence_en: string;
  example_sentence_fr: string;
  example_sentence_es: string;
  example_sentence_nl: string;
  word_type_en: string;
  word_type_fr: string;
  word_type_es: string;
  word_type_nl: string;
  synonymous_en: string;
  synonymous_fr: string;
  synonymous_es: string;
  synonymous_nl: string;
  antonymous_en: string;
  antonymous_fr: string;
  antonymous_es: string;
  antonymous_nl: string;
}

export interface VocabularyLessonProps {
  lessonId: string;
  unitId?: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
  onComplete?: () => void;
}

export interface Question {
  id: number;
  question: string;
  answers: string[];
  correct_answer: string;
  hint: string;
}

export interface MultipleChoiceProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
  unitId?: string;          
  onComplete?: () => void;  
}

export interface Number {
  id: number;
  number: string;
  number_en: string;
  number_fr: string;
  number_es: string;
  number_nl: string;
  is_reviewed: boolean;
}

export interface NumbersLessonProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
}

export interface NumberProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
}

export interface FlashcardProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
}

export interface ReorderingExerciseProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
}

export interface MatchingExercise {
  id: number;
  content_lesson: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pairs_count: number;
  order: number;
  exercise_data: MatchingExerciseData;
}

export interface MatchingExerciseProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
  unitId?: string;
  onComplete?: () => void;
}

export interface MatchingExerciseData {
  id: number;
  title: string;
  instruction: string;
  difficulty: string;
  target_language: string;
  native_language: string;
  target_words: string[];
  native_words: string[];
  total_pairs: number;
}

export interface MatchingAnswers {
  [targetWord: string]: string;
}

export interface MatchingResult {
  score: number;
  message: string;
  correct_count: number;
  wrong_count: number;
  total_count: number;
  is_successful: boolean;
  success_threshold: number;

  feedback: {
    [targetWord: string]: {
      is_correct: boolean;
      user_answer: string;
      correct_answer: string;
    }
  }
}

export interface FillBlankExercise {
  id: number;
  content_lesson: number;
  order: number;
  difficulty: string;
  instructions: Record<string, string>;
  sentences: Record<string, string>;
  answer_options: Record<string, string[]>;
  correct_answers: Record<string, string>;
  hints?: Record<string, string>;
  explanations?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: number;
  content_lesson: number;
  order: number;
  difficulty: string;
  language?: string;
  instruction?: string;
  sentence?: string;
  options?: string[];
  correct_answer?: string;
  sentence_en: string;
  sentence_fr: string;
  sentence_es: string;
  sentence_nl: string;
  explanation: string;
  hint: string;
}

export interface FillBlankExerciseProps {
  lessonId: string;
  unitId?: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
  onComplete?: () => void;
}

export interface TheoryData {
  id: number;
  content_lesson: {
    id: number;
    title: {
      [key: string]: string; // Support pour toutes les langues
    };
    instruction: {
      [key: string]: string; // Support pour toutes les langues
    };
    content_type: string;
  };
  
  // Nouvelle structure JSON
  using_json_format: boolean;
  available_languages: string[];
  language_specific_content: {
    [lang: string]: {
      content: string;
      explanation: string;
      formula?: string;
      example?: string;
      exception?: string;
      [key: string]: any; // Support pour des champs supplémentaires spécifiques à une langue
    }
  };
  
  // Ancienne structure (pour compatibilité)
  content_en?: string;
  content_fr?: string;
  content_es?: string;
  content_nl?: string;
  explication_en?: string;
  explication_fr?: string;
  explication_es?: string;
  explication_nl?: string;
  formula_en?: string;
  formula_fr?: string;
  formula_es?: string;
  formula_nl?: string;
  example_en?: string;
  example_fr?: string;
  example_es?: string;
  example_nl?: string;
  exception_en?: string;
  exception_fr?: string;
  exception_es?: string;
  exception_nl?: string;
  
  [key: string]: any; // Index signature pour permettre l'accès dynamique
}

export interface TheoryContentProps {
  lessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
  unitId?: string;
  onComplete?: () => void;
}

export interface LearningJourneyProps {
  levelFilter?: string;
  onLevelFilterChange?: (level: string) => void;
  availableLevels?: string[];
  layout?: "list" | "grid";
  onLayoutChange?: (layout: "list" | "grid") => void;
}

export interface EnhancedLearningJourneyProps extends LearningJourneyProps {
  onContentTypeChange?: (type: string) => void;
  isCompactView?: boolean;
  onCompactViewChange?: (isCompact: boolean) => void;
}

export interface LearningViewProps {
  initialLevelFilter?: string;
  showLoadingState?: boolean;
  userId?: string;

}

export interface SpeakingPracticeProps {
  lessonId: string;
  language?: "en" | "fr" | "es" | "nl";
  targetLanguage?: "en" | "fr" | "es" | "nl";
  unitId?: string;
  onComplete?: () => void;
}

export interface PronunciationFeedback {
  score: number;
  mistakes: string[];
  correctPronunciation: string;
  suggestions: string;
}

export interface FilteredUnit {
  id: number;
  title: string;
  level: string;
  lessons: FilteredLesson[];
  progress?: number;
  order: number;
}

export interface FilteredLesson {
  id: number;
  title: string;
  lesson_type: string;
  unit_id: number;
  estimated_duration: number;
  contentLessons: FilteredContentLesson[];
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  unitTitle?: string;
  unitLevel?: string;
  filteredContents?: FilteredContentLesson[];
}

export interface FilteredContentLesson {
  id: number;
  title: string;
  content_type: string;
  lesson_id: number;
  order: number;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface LevelGroupType {
  level: string;
  units: FilteredUnit[];
}

export interface LessonResult {
  id: number;
  title: string;
  lesson_type: string;
  estimated_duration: number;
  unit_id?: number;
  unit_title?: string;
  unit_level?: string;
  content_count?: number;
}

export interface CulturalContextProps {
  languageCode: 'en' | 'fr' | 'es' | 'nl';
  lessonId?: string;
  theme?: string; // e.g., "Greetings", "Food", "Holidays"
}

export interface ContentTypeRouterProps {
  contentType: string;
  contentId: string;
  parentLessonId: string;
  language?: 'en' | 'fr' | 'es' | 'nl';
  unitId?: string; 
  onComplete?: () => void;
}

export interface LessonCompletionModalProps {
    show: boolean;
    onKeepReviewing?: () => void;
    onComplete?: () => void;
    onTryAgain?: () => void;
    onBackToLessons?: () => void;
    title?: string;
    subtitle?: string;
    score?: string;
    type?: "lesson" | "quiz" | "exercise";
    completionMessage?: string;
  }

  export interface UseLessonCompletionOptions {
    lessonId: string;
    unitId?: string;
    onComplete?: () => void;
    autoSound?: boolean;
    type?: 'lesson' | 'quiz' | 'exercise';
    initialTimeSpent?: number;
  }
  
  export interface LessonCompletionState {
    showCompletionModal: boolean;
    score?: string;
    timeSpent: number;
    isCompleted: boolean;
  }

  export interface LearningMetrics {
      correctAnswerRate: number;
      timeSpentPerItem: number;
      mistakePatterns: Record<string, number>;
      consecutiveCorrectAnswers: number;
      attemptedQuestions: number;
    }