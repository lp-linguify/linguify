"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GradientCard } from "@/components/ui/gradient-card";
import { GradientText } from "@/components/ui/gradient-text";
import { commonStyles } from "@/styles/gradient_style";
import { Question, MultipleChoiceProps } from "@/addons/learning/types";
import LessonCompletionModal from "../shared/LessonCompletionModal";
import lessonCompletionService from "@/addons/progress/api/lessonCompletionService";

const MultipleChoice = ({ lessonId, language = 'en', unitId, onComplete }: MultipleChoiceProps) => {
  // Main state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [answerStreak, setAnswerStreak] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Refs for tracking
  const startTimeRef = React.useRef(Date.now());
  const timeIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const mountedRef = React.useRef(true);

  // Track component mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track time spent
  useEffect(() => {
    // Clear any existing interval
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }

    startTimeRef.current = Date.now();

    // Update time spent every 30 seconds to reduce calculations
    timeIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 30000);

    // Clean up interval on unmount
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/v1/course/multiple-choice-question/?content_lesson=${lessonId}&target_language=${language}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            mode: "cors",
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        setQuestions(data);
        setError(null);

        // Initialize progress if we have a valid unitId
        if (unitId && data.length > 0) {
          try {
            const contentLessonId = parseInt(lessonId);
            await lessonCompletionService.updateContentProgress(
              contentLessonId,
              1, // 1% to start
              0,
              0,
              false
            );
          } catch (err) {
            console.error("Error initializing quiz progress:", err);
          }
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchQuestions();
    }
  }, [lessonId, language, unitId]);

  // Update progress in API
  const updateProgressInAPI = useCallback(async (completionPercentage: number) => {
    if (!lessonId || !mountedRef.current || !unitId) return;

    try {
      const contentLessonId = parseInt(lessonId);
      await lessonCompletionService.updateContentProgress(
        contentLessonId,
        completionPercentage,
        timeSpent,
        Math.round(completionPercentage / 10), // XP gained proportional to progress
        completionPercentage >= 100 // mark as completed if 100%
      );

      // If we have the unit ID and this is a completion, update the parent lesson progress too
      if (unitId && completionPercentage >= 100 && !quizCompleted) {
        await lessonCompletionService.updateLessonProgress(
          contentLessonId,
          parseInt(unitId),
          100, // 100% progress for the lesson
          timeSpent,
          true // Mark as completed
        );

        if (mountedRef.current) {
          setQuizCompleted(true);
        }
      }
    } catch (error) {
      console.error("Error updating quiz progress:", error);
    }

    return Promise.resolve(); // Always resolve to ensure UI flow continues
  }, [lessonId, unitId, timeSpent, quizCompleted]);

  // Helper to get current question
  const getCurrentQuestion = () => {
    if (!questions.length || currentIndex >= questions.length) {
      return null;
    }
    return questions[currentIndex];
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setAnswerStreak(prev => prev + 1);
    } else {
      setAnswerStreak(0);
    }

    // Update progress as we move through questions
    const progressPercentage = Math.round(((currentIndex + 1) / questions.length) * 100);
    if (progressPercentage % 25 === 0) { // Update at 25%, 50%, 75%
      updateProgressInAPI(progressPercentage);
    }
  };

  // Handle next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowHint(false);
    } else {
      // Quiz is complete, show completion modal
      handleFinishQuiz();
    }
  };

  // Handle quiz completion
  const handleFinishQuiz = useCallback(() => {
    console.log("handleFinishQuiz called - showing completion modal");

    // Play success sound (optional)
    try {
      const audio = new Audio("/success1.mp3");
      audio.volume = 0.3;
      audio.play().catch(err => console.error("Error playing sound:", err));
    } catch (error) {
      console.error("Error with audio:", error);
    }

    // Show the completion modal
    setShowCompletionModal(true);
  }, []);

  // Handle keep reviewing (try again)
  const handleTryAgain = useCallback(() => {
    console.log("handleTryAgain called - resetting quiz");
    setShowCompletionModal(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowHint(false);
  }, []);

  // Handle back to lessons
  const handleBackToLessons = useCallback(() => {
    console.log("handleBackToLessons called - completing quiz");

    // Update progress to 100%
    updateProgressInAPI(100).then(() => {
      // Close the modal
      setShowCompletionModal(false);

      // If a function onComplete has been provided, call it to trigger navigation
      if (onComplete) {
        console.log("Calling onComplete callback to return to lesson summary");
        onComplete();
      }
    }).catch(error => {
      console.error("Error updating progress:", error);
      // Even if there's an error, close the modal and try to navigate
      setShowCompletionModal(false);
      if (onComplete) onComplete();
    });
  }, [updateProgressInAPI, onComplete]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse">Loading questions...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full space-y-6">
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "No questions found for this lesson."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No questions available
  if (!questions.length) {
    return (
      <div className="w-full space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No questions available for this lesson.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) return null;

  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Completion Modal */}
      <LessonCompletionModal
        show={showCompletionModal}
        onTryAgain={handleTryAgain}
        onBackToLessons={handleBackToLessons}
        title="Quiz Complete!"
        score={`${score}/${questions.length}`}
        subtitle={score / questions.length >= 0.8
          ? "Excellent work! You've mastered this quiz!"
          : score / questions.length >= 0.6
            ? "Good job! Keep practicing to improve."
            : "Keep practicing! You'll get better with time."
        }
        type="quiz"
      />

      <GradientCard className="h-full relative overflow-hidden">
        <div className="p-6 flex flex-col gap-4 h-full relative z-10">
          {/* Progress Section */}
          <div>
            <Progress
              value={progressPercentage}
              className="h-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <div className="flex items-center gap-2">
                <span>Score: {score}/{currentIndex}</span>
                <span className="px-2 py-0.5 bg-brand-purple/10 rounded-full">
                  {answerStreak} 🔥
                </span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className={commonStyles.contentBox}>
            <div className={commonStyles.gradientBackground} />
            <div className="relative p-8 text-center">
              <GradientText className="text-2xl font-bold">
                {currentQuestion.question}
              </GradientText>
            </div>
          </div>

          {/* Answers in Grid with centered last item when count is odd */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.answers.map((answer, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                disabled={!!selectedAnswer}
                className={`w-full h-full p-4 justify-center transition-all text-purple ${selectedAnswer
                    ? answer === currentQuestion.correct_answer
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : answer === selectedAnswer
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-100 text-gray-500"
                    : "bg-transparent border-2 border-brand-purple/20 hover:bg-brand-purple/10 text-left"
                  } ${
                  /* Centrer le dernier élément si le nombre est impair et que c'est le dernier élément */
                  currentQuestion.answers.length % 2 !== 0 &&
                    index === currentQuestion.answers.length - 1
                    ? "sm:col-span-2 sm:max-w-md sm:mx-auto"
                    : ""
                  }`}
              >
                <span className="mr-3">{String.fromCharCode(65 + index)}.</span>
                {answer}
              </Button>
            ))}
          </div>
          {/* Hint Section */}
          {currentQuestion.hint && (
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowHint(!showHint)}
                className="text-brand-purple hover:text-brand-purple/80"
              >
                <Info className="h-4 w-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
              {showHint && (
                <Alert className="mt-2 bg-brand-purple/5 border-brand-purple/20">
                  <AlertDescription className="text-brand-purple">
                    {currentQuestion.hint}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end mt-auto pt-4">
            {selectedAnswer && (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-brand-purple to-brand-gold text-white hover:opacity-90"
              >
                {currentIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
              </Button>
            )}
          </div>
        </div>
      </GradientCard>
    </div>
  );
};

export default MultipleChoice;