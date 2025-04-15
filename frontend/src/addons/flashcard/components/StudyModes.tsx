// src/app/(dashboard)/(apps)/flashcard/_components/StudyModes.tsx

/**
 * StudyModeCard Component
 * @description 
 * Card component for each study mode in the flashcard app.
 * It displays the name, description, and icon of the study mode.
 * It also provides a link to the corresponding study mode page.
 */

import React from "react";
import Link from "next/link";
import { Clock, BookOpen, Dumbbell, Layers } from "lucide-react";
import { useTranslation } from "@/core/i18n/useTranslations";
import { StudyModeProps, StudyModeCardProps } from "@/addons/flashcard/types";

const StudyModeCard = ({
  name,
  description,
  icon,
  path,
  deckId,
}: StudyModeCardProps) => {
  return (
    <Link
      href={`/flashcard/${path}/${deckId}`}
      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="rounded-md p-2 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-sm">{name}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </Link>
  );
};

export default function StudyModes({ deckId }: StudyModeProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold mb-4">{t('dashboard.flashcards.studyModes')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StudyModeCard
          name={t('dashboard.flashcards.modes.flashcards.name')}
          description={t('dashboard.flashcards.modes.flashcards.description')}
          icon={<Layers className="h-5 w-5 text-white" />}
          path="flashcards"
          deckId={deckId}
        />
        <StudyModeCard
          name={t('dashboard.flashcards.modes.learn.name')}
          description={t('dashboard.flashcards.modes.learn.description')}
          icon={<BookOpen className="h-5 w-5 text-white" />}
          path="learn"
          deckId={deckId}
        />
        <StudyModeCard
          name={t('dashboard.flashcards.modes.match.name')}
          description={t('dashboard.flashcards.modes.match.description')}
          icon={<Clock className="h-5 w-5 text-white" />}
          path="match"
          deckId={deckId}
        />
        <StudyModeCard
          name={t('dashboard.flashcards.modes.review.name')}
          description={t('dashboard.flashcards.modes.review.description')}
          icon={<Dumbbell className="h-5 w-5 text-white" />}
          path="review"
          deckId={deckId}
        />
      </div>
    </div>
  );
}