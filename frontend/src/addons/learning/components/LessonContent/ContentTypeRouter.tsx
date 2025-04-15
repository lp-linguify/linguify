"use client";

// src/addons/learning/components/LessonContent/ContentTypeRouter.tsx

import React from 'react';
import TheoryContent from "../Theory/TheoryContent";
import VocabularyLesson from "../Exercises/VocabularyLesson";
import MultipleChoiceQuestion from "../Exercises/MultipleChoiceQuestion";
import NumberComponent from "../Exercises/Numbers";
import NumbersGame from "../Exercises/NumbersGame";
import ReorderingContent from "../Exercises/ReorderingContent";
import FillBlankExercise from "../Exercises/FillBlankExercise";
import MatchingExercise from "../Exercises/MatchingExercise";
import SpeakingPractice from "../Speaking/SpeakingPractice";
import { ContentTypeRouterProps } from "@/addons/learning/types";

/**
 * Composant qui route vers le bon composant d'exercice en fonction du type de contenu
 */
export default function ContentTypeRouter({
  contentType,
  contentId,
  language = 'en',
  unitId,
  onComplete
}: ContentTypeRouterProps) {

  // Normaliser le type de contenu
  const normalizedType = contentType.toLowerCase().trim();

  // Props communs à tous les types de contenu
  const commonProps = {
    lessonId: contentId,
    language,
    unitId,
    onComplete
  };

  // Router vers le bon composant en fonction du type de contenu
  switch (normalizedType) {
    case 'theory':
      return <TheoryContent {...commonProps} />;

    case 'vocabulary':
      return <VocabularyLesson {...commonProps} />;

    case 'vocabularylist':
      return <VocabularyLesson {...commonProps} />;
    case 'multiple choice':
      return <MultipleChoiceQuestion {...commonProps} />;

    case 'numbers':
      return <NumberComponent {...commonProps} />;

    case 'numbers_game':
      return <NumbersGame {...commonProps} />;

    case 'reordering':
      return <ReorderingContent {...commonProps} />;

    case 'fill_blank':
      return <FillBlankExercise {...commonProps} />;

    case 'matching':
      return <MatchingExercise {...commonProps} />;


    case 'speaking':
      return (
        <SpeakingPractice {...commonProps} />
      );

    default:
      return (
        <div className="p-6 text-center">
          <p className="text-red-500">
            Type de contenu non pris en charge: {contentType}
          </p>
        </div>
      );
  }
}