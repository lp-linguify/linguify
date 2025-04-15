// addons/progress/types/index.ts


export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UnitInfo {
  id: number;
  title: string;
  description: string;
  level: string;
  order: number;
}

export interface RecentActivity {
  id: number;
  content_details: {
    id: number;
    content_type: string;
    title_en: string;
  };
  status: string;
  completion_percentage: number;
  last_accessed: string;
  xp_earned?: number;
  time_spent?: number;
}

export interface ContentLessonInfo {
  id: number;
  title: string;
  content_type: string;
  lesson_id: number;
  lesson_title: string;
  order: number;
}
export interface LevelProgress {
  total_units: number;
  completed_units: number;
  in_progress_units: number;
  avg_completion: number;
}

export interface UnitProgress {
  id: number;
  user: number;
  unit: number;
  unit_details: {
    id: number;
    title: string;
    description: string;
    level: string;
    order: number;
  };
  status: string;
  completion_percentage: number;
  score: number;
  time_spent: number;
  last_accessed: string;
  started_at: string | null;
  completed_at: string | null;
  lesson_progress_count: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
  };
}

export interface LessonInfo {
  id: number;
  title: string;
  description: string;
  lesson_type: string;
  estimated_duration: number;
  order: number;
  unit_id: number;
  unit_title: string;
}

export interface LessonProgress {
  id: number;
  user: number;
  lesson: number;
  lesson_details: {
    id: number;
    title: string;
    description: string;
    lesson_type: string;
    estimated_duration: number;
    order: number;
    unit_id: number;
    unit_title: string;
  };
  status: string;
  completion_percentage: number;
  score: number;
  time_spent: number;
  last_accessed: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ContentLessonProgress {
  id: number;
  user: number;
  content_lesson_details: {
    id: number;
    title: string;
    content_type: string;
    lesson_id: number;
    lesson_title: string;
    order: number;
  };
  status: string;
  completion_percentage: number;
  score: number;
  time_spent: number;
  last_accessed: string;
  started_at: string | null;
  completed_at: string | null;
  xp_earned: number;
}

export interface ContentDetails {
  id: number;
  content_type: string;
  title_en: string;
  title_fr?: string;
  title_es?: string;
  title_nl?: string;
}

export interface UpdateContentProgressRequest {
  content_lesson_id: number;
  lesson_id: number;
  completion_percentage?: number;
  score?: number;
  time_spent?: number;
  mark_completed?: boolean;
  xp_earned?: number;
}

export interface ContentLessonProgress {
  id: number;
  user: number;
  content_lesson_details: {
    id: number;
    title: string;
    content_type: string;
    lesson_id: number;
    lesson_title: string;
    order: number;
  };
  status: string;
  completion_percentage: number;
  score: number;
  time_spent: number;
  last_accessed: string;
  started_at: string | null;
  completed_at: string | null;
  xp_earned: number;
}

export interface UpdateLessonProgressRequest {
  lesson_id: number;
  content_lesson_id: number;
  completion_percentage?: number;
  score?: number;
  time_spent?: number;
  mark_completed?: boolean;
  xp_earned?: number;
}

export interface LevelStats {
  total_units: number;
  completed_units: number;
  in_progress_units: number;
  avg_completion: number;
}

export interface ProgressSummary {
  summary: {
    total_units: number;
    completed_units: number;
    total_lessons: number;
    completed_lessons: number;
    total_time_spent_minutes: number;
    xp_earned: number;
  };
  level_progression: {
    [key: string]: LevelStats;
  };
  recent_activity: RecentActivity[];
}

export interface ProgressSummary {
  summary: {
    total_units: number;
    completed_units: number;
    total_lessons: number;
    completed_lessons: number;
    total_time_spent_minutes: number;
    xp_earned: number;
  };
  level_progression: {
    [level: string]: {
      total_units: number;
      completed_units: number;
      in_progress_units: number;
      avg_completion: number;
    };
  };
  recent_activity: RecentActivity[];
}

export interface ApiOptions {
  showErrorToast?: boolean;
  retryOnNetworkError?: boolean;
  maxRetries?: number;
  fallbackData?: any;
  cacheResults?: boolean;
  params?: Record<string, string>;
}

export interface DashboardStats {
  totalWords: number;
  masteredWords: number;
  dueSoon: number;
  streak: number;
  todayProgress: number;
}

export interface AccuracyDay {
  date: string;
  correct: number;
  incorrect: number;
  skipped: number;
}

export interface ReviewHistoryItem {
  date: string;
  dueCount: number;
}

export interface StatsResponse {
  totalWords: number;
  masteredWords: number;
  reviewHistory: ReviewHistoryItem[];
  accuracyByDay: AccuracyDay[];
}

export interface ActivityItem {
  id: number;
  content_details: {
    id: number;
    content_type: string;
    title_en: string;
    title_fr?: string;
    title_es?: string;
    title_nl?: string;
  };
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  last_accessed: string; // ISO date string
}

export interface RecentActivityListProps {
  activities: RecentActivity[];
}

export interface ActivityChartData {
  date: string;
  xp: number;
  minutes: number;
}

export interface ActivityChartProps {
  data: ActivityChartData[];
}

export interface LevelProgressChartProps {
  levelProgression: {
    [level: string]: {
      total_units: number;
      completed_units: number;
      in_progress_units: number;
      avg_completion: number;
    };
  };
}

export interface AchievementCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export interface WeeklyProgressData {
  units: number;
  lessons: number;
  time: string;
  xp: number;
}







































