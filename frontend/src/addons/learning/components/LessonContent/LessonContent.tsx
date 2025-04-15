"use client";

// src/addons/learning/components/LessonContent/LessonContent.tsx

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  CheckCircle
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { getUserTargetLanguage } from "@/core/utils/languageUtils";
import courseAPI from "@/addons/learning/api/courseAPI";
import progressAPI from "@/addons/progress/api/progressAPI";
import lessonCompletionService from "@/addons/progress/api/lessonCompletionService";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ContentLesson, LessonContentProps } from "@/addons/learning/types";
import { useTranslation } from "@/core/i18n/useTranslations";
import ContentTypeRouter from "./ContentTypeRouter";

// Map content types to icons (moved to ContentTypeRouter.tsx)
const getContentTypeIcon = (contentType: string): React.ReactNode => {
  const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
    'theory': <BookOpen className="h-4 w-4" />,
    'vocabulary': <FileText className="h-4 w-4" />,
    'vocabularylist': <FileText className="h-4 w-4" />,
    'multiple choice': <GraduationCap className="h-4 w-4" />,
    'numbers': <Calculator className="h-4 w-4" />,
    'numbers_game': <Gamepad2 className="h-4 w-4" />,
    'reordering': <ArrowRightLeft className="h-4 w-4" />,
    'fill_blank': <PencilLine className="h-4 w-4" />,
    'matching': <Infinity className="h-4 w-4" />,
    'speaking': <Mic className="h-4 w-4" />
  };
  
  return CONTENT_TYPE_ICONS[contentType] || <FileText className="h-4 w-4" />;
};
import {
  FileText,
  GraduationCap,
  Calculator,
  Gamepad2,
  ArrowRightLeft,
  PencilLine,
  Infinity,
  BookOpen,
  Mic
} from "lucide-react";

export default function LessonContent({ lessonId, unitId, language }: LessonContentProps) {
  const router = useRouter();
  const [contents, setContents] = useState<ContentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<{
    type: string;
    id: number;
  } | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<'en' | 'fr' | 'es' | 'nl'>('en');
  const [completedContents, setCompletedContents] = useState<Set<number>>(new Set());
  const [lessonProgress, setLessonProgress] = useState(0);
  const [lessonTitle, setLessonTitle] = useState("");
  const [validUnitId, setValidUnitId] = useState<number | null>(null);
  const { t } = useTranslation();

  // Validate and parse unitId
  useEffect(() => {
    if (unitId) {
      const parsedId = parseInt(unitId);
      if (!isNaN(parsedId)) {
        setValidUnitId(parsedId);
      } else {
        console.error("Invalid unitId provided:", unitId);
        setError("Invalid unit ID. Please check the URL.");
      }
    } else {
      // If no unitId is provided, we'll try to continue without it
      console.warn("No unitId provided to LessonContent component");
    }
  }, [unitId]);

  // Détecter la langue au chargement du composant
  useEffect(() => {
    if (language && ['en', 'fr', 'es', 'nl'].includes(language)) {
      setTargetLanguage(language);
    } else {
      const userLang = getUserTargetLanguage();
      setTargetLanguage(userLang as 'en' | 'fr' | 'es' | 'nl');
    }
  }, [language]);

  // Fetch content lessons
  useEffect(() => {
    const fetchContents = async () => {
      if (!lessonId || !targetLanguage) return;

      try {
        console.log(`Fetching content for lesson ${lessonId} with language: ${targetLanguage}`);

        // Fetch lesson title first - only if we have a valid unitId
        if (validUnitId !== null) {
          try {
            const lessonResponse = await courseAPI.getLessons(validUnitId, targetLanguage);
            if (Array.isArray(lessonResponse)) {
              const lesson = lessonResponse.find(l => l.id === parseInt(lessonId));
              if (lesson) {
                setLessonTitle(lesson.title);
              }
            }
          } catch (err) {
            console.warn("Could not fetch lesson title:", err);
          }
        }

        const data = await courseAPI.getContentLessons(parseInt(lessonId), targetLanguage);

        if (!data || !Array.isArray(data)) {
          setError("Received invalid data format from API");
          return;
        }

        const sortedContents = data.sort((a, b) => a.order - b.order);

        setContents(sortedContents);
        setError(null);

        // Une fois que nous avons les contenus, récupérer les progressions
        fetchProgressData(sortedContents);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson content");
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [lessonId, targetLanguage, validUnitId]);

  // Récupérer les données de progression
  const fetchProgressData = async (contents: ContentLesson[]) => {
    try {
      const progressData = await progressAPI.getContentLessonProgress(parseInt(lessonId));

      // Créer un ensemble des IDs de contenus complétés
      const completedSet = new Set<number>();
      let totalCompletion = 0;

      if (progressData && Array.isArray(progressData)) {
        progressData.forEach(item => {
          if (item.status === 'completed') {
            completedSet.add(item.content_lesson_details.id);
          }

          // Calculer la progression totale de la leçon
          if (item.content_lesson_details.lesson_id === parseInt(lessonId)) {
            totalCompletion += item.completion_percentage;
          }
        });

        // Calculer le pourcentage global
        const lessonCompletion = contents.length > 0
          ? Math.round(totalCompletion / contents.length)
          : 0;

        setLessonProgress(lessonCompletion);
        setCompletedContents(completedSet);
      }
    } catch (err) {
      console.error("Error fetching progress data:", err);
    }
  };

  const handleBack = () => {
    if (selectedContent) {
      // Si un contenu est sélectionné, revenir à la liste des contenus de la leçon
      setSelectedContent(null);
  
      // Lors du retour au sommaire, rafraîchir les données de progression
      if (contents.length > 0) {
        fetchProgressData(contents);
      }
    } else {
      // Si on est déjà dans la liste des contenus, revenir directement à la page principale
      // au lieu de passer par la page des leçons
      if (lessonProgress > 0 && validUnitId !== null) {
        lessonCompletionService.updateLessonProgress(
          parseInt(lessonId),
          validUnitId,
          lessonProgress,
          undefined,
          lessonProgress === 100
        ).then(() => {
          // Rediriger directement vers la page principale des unités
          router.push(`/learning`);
        });
      } else {
        // Rediriger directement vers la page principale des unités
        router.push(`/learning`);
      }
    }
  };

  const handleContentClick = (contentType: string, contentId: number) => {
    setSelectedContent({ type: contentType, id: contentId });
  };

  const handleContentComplete = async (contentId: number) => {
    // Marquer le contenu comme complété
    await lessonCompletionService.updateContentProgress(
      contentId,
      100,
      undefined,
      10,
      true
    );

    // Mettre à jour notre état local
    setCompletedContents(prev => new Set(prev).add(contentId));

    // Recalculer la progression de la leçon
    const newCompletedCount = completedContents.size + (completedContents.has(contentId) ? 0 : 1);
    const newProgress = Math.round((newCompletedCount / contents.length) * 100);
    setLessonProgress(newProgress);

    // Si tous les contenus sont complétés, mettre à jour la leçon
    if (newCompletedCount === contents.length && validUnitId !== null) {
      await lessonCompletionService.updateLessonProgress(
        parseInt(lessonId),
        validUnitId,
        100,
        undefined,
        true
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-purple-600 font-medium">{t('dashboard.learning.loadingContent')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-purple-50 p-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render selected content using ContentTypeRouter
  if (selectedContent) {
    return (
      <div className="w-full space-y-6 bg-transparent">
        <div className="w-full p-6">
          <BackButton
            onClick={handleBack}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            {t('dashboard.learning.backTo')}
          </BackButton>

          <div className="mt-4 mb-8 flex flex-wrap items-center gap-2">
            <Badge className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white">
              {targetLanguage.toUpperCase()}
            </Badge>

            <Badge className="bg-transparent text-purple-600 border border-purple-200">
              {t(`dashboard.learning.contentTypes.${selectedContent.type}`)}
            </Badge>
          </div>

          {/* Use ContentTypeRouter to select the appropriate component */}
          <ContentTypeRouter
            contentType={selectedContent.type}
            contentId={selectedContent.id.toString()}
            parentLessonId={lessonId}
            language={targetLanguage}
            unitId={validUnitId?.toString()}
            onComplete={() => handleContentComplete(selectedContent.id)}
          />
        </div>
      </div>
    );
  }

  // Main content list
  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <div className="mb-8">
          <BackButton
            onClick={handleBack}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            {t('dashboard.learning.backTo')}
          </BackButton>
        </div>

        {/* Header avec titre et progression */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 text-transparent bg-clip-text">
            {lessonTitle || "Lesson Content"}
          </h1>

          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white px-3 py-1.5">
              {targetLanguage.toUpperCase()}
            </Badge>

            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {contents.length} {t('dashboard.learning.modules')}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-transparent rounded-lg p-4 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t('dashboard.learning.lessonProgress')}
            </span>
            <span className="text-sm font-medium text-purple-600">{lessonProgress}%</span>
          </div>
          <Progress
            value={lessonProgress}
            className="h-2 bg-purple-100"
            style={{
              "--progress-background": "linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234), rgb(244, 114, 182))"
            } as React.CSSProperties}
          />
        </div>

        {/* Contents List */}
        <div className="space-y-4">
          {contents.length === 0 ? (
            <div className="bg-transparent rounded-lg p-6 shadow-sm text-center">
              <AlertCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-gray-700">
                {t('dashboard.learning.noContentFound')}
              </p>
            </div>
          ) : (
            contents.map((content, index) => {
              const isClickable = true; // All content types are now handled by ContentTypeRouter
              const fallbackTitle = content.title.en || "Content Title";
              const fallbackInstruction = content.instruction.en || "Content Instructions";
              const title = content.title[targetLanguage] || fallbackTitle;
              const instruction = content.instruction[targetLanguage] || fallbackInstruction;
              const usingFallback = !content.title[targetLanguage] || !content.instruction[targetLanguage];
              const isCompleted = completedContents.has(content.id);

              return (
                <Card
                  key={content.id}
                  className={`overflow-hidden border-2 transition-all duration-300 shadow-sm hover:shadow-md ${isClickable ? 'cursor-pointer' : ''
                    } ${isCompleted ? 'border-green-400' : 'border-transparent hover:border-brand-purple/20'}`}
                  onClick={() => {
                    if (isClickable) {
                      handleContentClick(content.content_type, content.id);
                    }
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Content Type Icon */}
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${isCompleted
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-400/10 text-purple-600'
                        }`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : getContentTypeIcon(content.content_type)}
                      </div>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {title}
                              </h3>

                              {isCompleted && (
                                <Badge className="bg-green-100 text-green-700 border-none">
                                  {t('dashboard.learning.badges.completed')}
                                </Badge>
                              )}

                              {usingFallback && (
                                <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                                  {t('dashboard.learning.badges.fallback')}
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-600 mt-1 line-clamp-2">
                              {instruction}
                            </p>
                          </div>

                          {isClickable && <ArrowRightLeft className="h-4 w-4 text-purple-400 shrink-0 mt-1" />}
                        </div>

                        {/* Vocabulary Preview Section (conditionally) */}
                        {content.vocabulary_lists && content.vocabulary_lists.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm text-purple-600">
                                Vocabulary Preview
                              </h4>
                              <span className="text-xs text-gray-500">
                                {content.vocabulary_lists.length} words
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {content.vocabulary_lists.slice(0, 4).map((vocab) => (
                                <div key={vocab.id} className="bg-gray-50 p-2 rounded-md text-sm">
                                  <span className="font-medium text-purple-800">{vocab.word_en}</span>
                                  <span className="text-gray-500 ml-2">- {vocab.definition_en.substring(0, 30)}{vocab.definition_en.length > 30 ? '...' : ''}</span>
                                </div>
                              ))}
                            </div>

                            {content.vocabulary_lists.length > 4 && (
                              <p className="text-xs text-purple-600 mt-2">
                                + {content.vocabulary_lists.length - 4} more words
                              </p>
                            )}
                          </div>
                        )}

                        {/* Bottom badges/info */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-400/10 text-purple-700">
                            {getContentTypeIcon(content.content_type)}
                            {t(`dashboard.learning.contentTypes.${content.content_type.toLowerCase()}`)}
                          </span>

                          {index === 0 && !isCompleted && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              <CheckCircle className="h-3 w-3" />
                              {t('dashboard.learning.badges.startHere')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}