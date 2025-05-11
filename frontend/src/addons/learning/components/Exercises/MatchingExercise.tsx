// src/app/(dashboard)/(apps)/learning/_components/MatchingExercise.tsx
/**
 * This file contains the MatchingExercise component, which is a React component used to create and manage a matching exercise in a language learning application.
 * The component allows users to match words in the target language with their translations in the native language.
 * It handles loading exercise data, tracking user progress, checking answers, and providing feedback on the exercise results.
 */
'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import courseAPI from "@/addons/learning/api/courseAPI";
import lessonCompletionService from "@/addons/progress/api/lessonCompletionService";
import { MatchingAnswers, MatchingExerciseProps } from "@/addons/learning/types";

const MatchingExercise: React.FC<MatchingExerciseProps> = ({
  lessonId,
  language = 'en',
  unitId,
  onComplete
}) => {
  // States
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchingAnswers>({});
  const [result, setResult] = useState<any>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [_exerciseCompleted, setExerciseCompleted] = useState<boolean>(false);

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Load exercise data
  useEffect(() => {
    const loadExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Loading matching exercises for content lesson: ${lessonId}`);
        const exercises = await courseAPI.getMatchingExercises(lessonId, language);

        // If exercises exist, use the first one
        if (exercises && exercises.length > 0) {
          setExercise(exercises[0]);
        }
        // Otherwise, try to create one automatically
        else {
          console.log("No matching exercises found, attempting to create one");
          const createdExercise = await courseAPI.createMatchingExercise(lessonId);

          if (createdExercise) {
            setExercise(createdExercise);
          } else {
            // Check if the lesson contains vocabulary words
            const vocabData = await courseAPI.getVocabularyContent(lessonId, language);

            if (vocabData && vocabData.results && vocabData.results.length > 0) {
              // Collect vocabulary IDs
              const vocabIds = vocabData.results.map((item: any) => item.id);
              // Try to create with specific IDs
              const newExercise = await courseAPI.createMatchingExercise(
                lessonId,
                vocabIds.slice(0, 8) // Limit to 8 words maximum
              );

              if (newExercise) {
                setExercise(newExercise);
              } else {
                setError("Unable to create a matching exercise. No vocabulary available.");
              }
            } else {
              setError("Unable to create a matching exercise. This lesson doesn't contain vocabulary.");
            }
          }
        }

        // Initialize progress tracking
        if (parseInt(lessonId)) {
          lessonCompletionService.updateContentProgress(
            parseInt(lessonId),
            1, // 1% to indicate start
            0,
            0,
            0
          ).catch(err => console.error('Error updating initial progress:', err));
        }
      } catch (err) {
        console.error("Error loading or creating matching exercise:", err);
        setError("An error occurred while loading or creating the exercise");
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [lessonId, language]);

  // Handle word selection
  const handleWordSelect = (word: string, wordType: 'target' | 'native') => {
    // Don't allow selection if exercise is completed
    if (result) return;

    if (wordType === 'target') {
      // If a target word is selected
      setSelectedWord(word);
    } else if (wordType === 'native' && selectedWord) {
      // If a native word is selected while a target word is already selected
      // Create the match
      setMatches(prev => ({
        ...prev,
        [selectedWord]: word
      }));

      // Reset selection
      setSelectedWord(null);
    }
  };

  // Check answers
  const checkAnswers = async () => {
    if (!exercise) return;

    try {
      const result = await courseAPI.checkMatchingAnswers(exercise.id, matches);
      setResult(result);

      // Vérifier si le score est suffisant pour considérer l'exercice comme réussi
      const isSuccessful = result.is_successful === true;
      setExerciseCompleted(isSuccessful);

      // Mettre à jour la progression dans la base de données
      await lessonCompletionService.updateContentProgress(
        parseInt(lessonId),
        isSuccessful ? 100 : Math.round(result.score), // 100% si réussi, sinon le score actuel
        timeSpent,
        Math.round(result.score / 10), // XP basé sur le score
        isSuccessful // Use boolean value instead of 1/0
      );

      // Mettre à jour la leçon parente si unitId est fourni
      if (unitId) {
        await lessonCompletionService.updateLessonProgress(
          parseInt(unitId),
          isSuccessful ? 100 : Math.round(result.score), // Use same logic as content progress
          timeSpent,
          isSuccessful, // Use direct boolean instead of Boolean() wrapper
          parseInt(lessonId)
        );
      }

      // Notifier que l'exercice est terminé uniquement si réussi
      if (isSuccessful && onComplete) {
        onComplete();
      }

    } catch (err) {
      console.error("Error checking answers:", err);
      setError("An error occurred while checking answers");
    }
  };

  // Reset exercise
  const resetExercise = () => {
    setMatches({});
    setSelectedWord(null);
    setResult(null);
    setExerciseCompleted(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-purple"></div>
        <p className="text-brand-purple animate-pulse font-medium">Loading matching exercise...</p>
      </div>
    );
  }

  // Error state
  if (error || !exercise || !exercise.exercise_data) {
    return (
      <Alert variant="destructive" className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 shadow-sm">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
          {error || "Unable to load matching exercise"}
        </AlertDescription>
      </Alert>
    );
  }

  // Exercise data
  const { target_words = [], native_words = [] } = exercise.exercise_data;

  // Calculate completion percentage
  const completionPercentage = Object.keys(matches).length / target_words.length * 100;

  // Check if all words are matched
  const allMatched = Object.keys(matches).length === target_words.length;

  return (
    <div className="w-full space-y-6">
      {/* Progress bar */}
      <div className="w-full">
        <Progress
          value={completionPercentage}
          className="h-2 bg-gray-100 dark:bg-gray-700"
          style={{
            '--progress-background': 'linear-gradient(to right, var(--brand-purple), var(--brand-gold))'
          } as React.CSSProperties}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{Object.keys(matches).length} / {target_words.length} matched</span>
          <span className="font-medium text-brand-purple">{completionPercentage.toFixed(0)}% completed</span>
        </div>
      </div>

      {/* Main card */}
      <Card className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-brand-purple to-brand-gold bg-clip-text text-transparent text-2xl font-bold">
            {exercise.exercise_data.title || "Match words with their translations"}
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {exercise.exercise_data.instruction || "Match each word in the language you're learning with its translation in your native language."}
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Target language words column */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-purple">
                Words to learn ({exercise.exercise_data.target_language?.toUpperCase() || "ES"})
              </h3>

              <div className="space-y-2 min-h-[300px]">
                {target_words.map((word: string, index: number) => (
                  <div
                    key={`target-${index}`}
                    onClick={() => handleWordSelect(word, 'target')}
                    className={`
                      p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all
                      ${selectedWord === word ? 'bg-brand-purple/10 border-brand-purple' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                      ${matches[word] ? 'border-brand-purple' : ''}
                      ${result?.feedback?.[word]?.is_correct === true ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                      ${result?.feedback?.[word]?.is_correct === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                      hover:bg-brand-purple/10
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{word}</span>

                      {matches[word] && (
                        <div className="flex items-center text-brand-purple">
                          <ArrowRight className="h-4 w-4 mx-1" />
                          <Badge
                            variant="outline"
                            className={`
                              ${result?.feedback?.[word]?.is_correct ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                result?.feedback?.[word]?.is_correct === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                                  'border-brand-purple/30 bg-brand-purple/10 text-brand-purple'}
                            `}
                          >
                            {matches[word]}
                          </Badge>
                        </div>
                      )}

                      {result?.feedback?.[word]?.is_correct === true && (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}

                      {result?.feedback?.[word]?.is_correct === false && (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    {/* Show correct answer if wrong */}
                    {result?.feedback?.[word]?.is_correct === false && (
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        Correct: <span className="font-semibold">{result.feedback[word].correct_answer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Native language translations column */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-brand-gold">
                Translations ({exercise.exercise_data.native_language?.toUpperCase() || "EN"})
              </h3>

              <div className="space-y-2 min-h-[300px]">
                {native_words.map((word: string, index: number) => (
                  <div
                    key={`native-${index}`}
                    onClick={() => handleWordSelect(word, 'native')}
                    className={`
                      p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all
                      ${Object.values(matches).includes(word) ? 'border-brand-gold bg-brand-gold/10' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                      ${selectedWord ? 'hover:bg-brand-gold/10' : ''}
                      ${!selectedWord && Object.values(matches).includes(word) ? 'opacity-75' : ''}
                      ${result ? 'cursor-default' : ''}
                    `}
                  >
                    <span className="font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected word indicator */}
          {selectedWord && !result && (
            <div className="mt-4 p-2 bg-brand-purple/10 border border-brand-purple/20 rounded-md">
              <p className="text-brand-purple">
                Selected: <span className="font-bold">{selectedWord}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">— Now select a translation</span>
              </p>
            </div>
          )}

          {/* Exercise results */}
          {result && (
            <div className={`mt-8 p-6 rounded-lg shadow-sm ${result.is_successful
                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
                : 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20'
              }`}>
              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-brand-purple to-brand-gold bg-clip-text text-transparent">
                Result: {result.score.toFixed(1)}%
              </h3>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="font-medium">
                  {result.correct_count}/{result.total_count} correct
                </span>

                {result.is_successful ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 ml-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 ml-2" />
                )}
              </div>

              <div className="mt-4">
                <p className={result.is_successful ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}>
                  {result.message}
                </p>
                {!result.is_successful && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    You need a score of at least {result.success_threshold}% to complete this exercise.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between mt-10">
            <Button
              variant="outline"
              onClick={resetExercise}
              className="border-brand-purple text-brand-purple hover:bg-brand-purple/10"
              disabled={Object.keys(matches).length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button
              onClick={checkAnswers}
              disabled={!allMatched || result !== null}
              className="bg-gradient-to-r from-brand-purple to-brand-gold text-white hover:opacity-90"
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complete exercise button */}
      <div className="mt-8 flex justify-end">
        {result && result.is_successful ? (
          <Button
            onClick={() => {
              // Ensure the progress is marked as completed when clicking this button
              lessonCompletionService.updateContentProgress(
                parseInt(lessonId),
                100,  // 100% completion
                timeSpent,
                Math.round(result.score / 10),
                true  // Explicitly mark as completed
              ).then(() => {
                if (onComplete) onComplete();
              }).catch(err => {
                console.error("Error updating final progress:", err);
                // Still call onComplete even if there's an error
                if (onComplete) onComplete();
              });
            }}
            className="bg-gradient-to-r from-brand-purple to-brand-gold text-white hover:opacity-90 shadow-md"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Exercise
          </Button>
        ) : result && (
          <Button
            onClick={resetExercise}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 shadow-md"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default MatchingExercise;