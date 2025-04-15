// src/addons/learning/components/index.ts

// Re-export all components from subdirectories
export * from './Exercises';
export * from './LearnHeader';
export * from './LessonContent';
export * from './Lessons';
export * from './Theory'; 
export * from './Units';

// Export main view component
export { default as LearningView } from './LearnView';

// Export types
export type { 
  Unit, 
  Lesson, 
  ContentLesson,
  LearningViewProps
} from '@/addons/learning/types';