// src/addons/learning/services/adaptiveLearningService.ts
import { LearningMetrics } from "@/addons/learning/types";

  export class AdaptiveLearningService {
    // Assess user performance and adjust difficulty
    static assessPerformance(metrics: LearningMetrics): 'decrease' | 'maintain' | 'increase' {
      // Decrease difficulty if struggling
      if (metrics.correctAnswerRate < 0.6 || 
          metrics.consecutiveCorrectAnswers === 0) {
        return 'decrease';
      }
      
      // Increase difficulty if excelling
      if (metrics.correctAnswerRate > 0.85 && 
          metrics.consecutiveCorrectAnswers > 5 &&
          metrics.attemptedQuestions > 10) {
        return 'increase';
      }
      
      // Otherwise maintain current difficulty
      return 'maintain';
    }
    
    // Recommend specific practice areas based on mistake patterns
    static recommendFocus(metrics: LearningMetrics): string[] {
      const recommendations: string[] = [];
      const mistakePatterns = Object.entries(metrics.mistakePatterns)
        .sort((a, b) => b[1] - a[1]);
      
      // Return top 3 areas to focus on
      return mistakePatterns.slice(0, 3).map(([area]) => area);
    }
  }