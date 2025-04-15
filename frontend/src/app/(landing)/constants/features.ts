// src/app/(landing)/constants/features.ts
import {
  BookOpen,
  NotebookPen,
  Brain,
  Users,
  MessageCircle,
  UserCog,
  Clock,
  Award
} from 'lucide-react';


// Définition du type Feature
export interface Feature {
  id: keyof typeof FEATURE_ICONS;
  title: string;
  description: string;
  href: string;
}

// Définition des icônes des fonctionnalités
export const FEATURE_ICONS = {
  learning: BookOpen,
  flashcards: Brain,
  notebook: NotebookPen,
  progress: Clock,
  community: Users,
  chat: MessageCircle,
  coaching: UserCog,
  certification: Award,
  adaptive_learning: Clock
};

// Fonctions pour générer les features avec le bon formatage pour les traductions
export const getAppFeatures = (t: (key: string, fallback: string) => string): Feature[] => [
  {
    id: 'learning',
    title: t("learning.title", "Learning"),
    description: t("learning.description", "Interactive learning modules tailored to your pace"),
    href: "/features/apps/learningPage"
  },
  {
    id: 'flashcards',
    title: t("flashcards.title", "Flashcards"),
    description: t("flashcards.description", "Effective memory tools for quick retention"),
    href: "/features/apps/flashcardPage"
  },
  {
    id: 'notebook',
    title: t("notebook.title", "Notebook"),
    description: t("notebook.description", "Centralized note-taking with smart organization"),
    href: "/features/apps/notebookPage"
  },
  {
    id: 'progress',
    title: t("progress.title", "Progress tracking"),
    description: t("progress.description", "Visualize your progress and set achievable goals"),
    href: "/features/apps/progressPage"
  }
];