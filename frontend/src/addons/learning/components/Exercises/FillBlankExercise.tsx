'use client';

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Volume2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getUserTargetLanguage } from "@/core/utils/languageUtils";
import lessonCompletionService from "@/addons/progress/api/lessonCompletionService";
import apiClient from "@/core/api/apiClient";
import { Exercise, FillBlankExerciseProps } from '@/addons/learning/types';

const FillBlankExercise: React.FC<FillBlankExerciseProps> = ({ 
  lessonId,
  unitId,
  language = 'en',
  onComplete
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState<string>(language);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Initialize target language
  useEffect(() => {
    if (language) {
      setTargetLanguage(language);
    } else {
      const userLang = getUserTargetLanguage();
      setTargetLanguage(userLang);
    }
  }, [language]);

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime]);

  // Fetch exercises
  useEffect(() => {
    const fetchExercises = async () => {
      if (!lessonId || !targetLanguage) return;
      
      try {
        setLoading(true);
        setApiError(false);
        
        // Use axios interceptor to handle authentication
        const response = await apiClient.get(
          `/api/v1/course/fill-blank/`, {
            params: {
              content_lesson: lessonId,
              language: targetLanguage
            },
            headers: {
              'Accept-Language': targetLanguage
            }
          }
        );

        // For debugging - understand the actual structure
        console.log('API response data:', response.data);
        
        // Handle both array or paginated results
        const exercisesArray = Array.isArray(response.data) ? response.data : (response.data.results || []);
        
        if (exercisesArray.length === 0) {
          setError('No fill in the blank exercises available for this lesson.');
        } else {
          setExercises(exercisesArray);
          
          // Initialize progress tracking
          if (unitId) {
            lessonCompletionService.updateContentProgress(
              parseInt(lessonId),
              1, // 1% progress to start
              0,
              0,
              false
            );
          }
        }
      } catch (err) {
        console.error('Error fetching fill in the blank exercises:', err);
        setError(typeof err === 'string' ? err : (err instanceof Error ? err.message : 'Failed to load exercises'));
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [lessonId, targetLanguage, unitId]);

  // Update progress when moving through exercises
  useEffect(() => {
    if (exercises.length > 0) {
      setProgress(((currentIndex + 1) / exercises.length) * 100);
    }
  }, [currentIndex, exercises.length]);

  const getCurrentExercise = (): Exercise | null => {
    if (!exercises.length || currentIndex >= exercises.length) return null;
    return exercises[currentIndex];
  };

  const formatSentenceWithBlank = (sentence: string, selectedOption: string | null = null) => {
    if (!sentence || !sentence.includes('___')) return sentence;
    
    const parts = sentence.split('___');
    
    return (
      <div className="text-lg">
        {parts[0]}
        <span className={`px-2 py-1 mx-1 rounded ${
          selectedOption 
            ? (isAnswerCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') 
            : 'border-2 border-dashed border-purple-400 text-transparent'
        }`}>
          {selectedOption || '_____'}
        </span>
        {parts[1]}
      </div>
    );
  };

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer) return; // Don't allow changing answer
    
    setSelectedAnswer(answer);
    
    const currentExercise = getCurrentExercise();
    if (!currentExercise) return;
    
    // Client-side answer checking
    const isCorrect = answer === currentExercise.correct_answer;
    setIsAnswerCorrect(isCorrect);
    setShowFeedback(true);
  };

  const handleNextExercise = async () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setShowFeedback(false);
    
    const newProgress = Math.round(((currentIndex + 2) / exercises.length) * 100);
    
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Update progress in API
      if (unitId) {
        await lessonCompletionService.updateContentProgress(
          parseInt(lessonId),
          newProgress,
          timeSpent,
          Math.floor(newProgress / 10),
          false
        );
      }
    } else {
      // This was the last exercise
      setExerciseCompleted(true);
      
      // Mark as complete in the API
      if (unitId) {
        await lessonCompletionService.updateContentProgress(
          parseInt(lessonId),
          100,
          timeSpent,
          10,
          true
        );
        
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // API Error state
  if (apiError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          There was a problem connecting to the exercise service. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // No exercises available
  if (exercises.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No fill in the blank exercises available for this lesson.</AlertDescription>
      </Alert>
    );
  }

  const currentExercise = getCurrentExercise();
  if (!currentExercise) return null;

  // Get content from the current exercise
  const instruction = currentExercise.instruction || 'Fill in the blank with the correct option';
  const sentence = currentExercise.sentence || '';
  const options = currentExercise.options || [];
  const correctAnswer = currentExercise.correct_answer || '';

  return (
    <div className="w-full space-y-6">
      {/* Progress bar */}
      <div className="mb-4">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Exercise {currentIndex + 1} of {exercises.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Main exercise card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Instruction */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{instruction}</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const utterance = new SpeechSynthesisUtterance(instruction);
                utterance.lang = targetLanguage === 'fr' ? 'fr-FR' : 
                                  targetLanguage === 'es' ? 'es-ES' :
                                  targetLanguage === 'nl' ? 'nl-NL' : 'en-US';
                window.speechSynthesis.speak(utterance);
              }}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Sentence with blank */}
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            {formatSentenceWithBlank(sentence, selectedAnswer)}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === option
                    ? isAnswerCorrect 
                      ? "outline" 
                      : "destructive" 
                    : "outline"
                }
                className={
                  selectedAnswer === option
                    ? isAnswerCorrect
                      ? "border-2 border-green-500 bg-green-50"
                      : "border-2 border-red-500 bg-red-50"
                    : selectedAnswer && option === correctAnswer
                    ? "border-2 border-green-500 bg-green-50" // Show correct answer if user was wrong
                    : ""
                }
                onClick={() => handleSelectAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
                {selectedAnswer && option === correctAnswer && (
                  <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                )}
                {selectedAnswer === option && !isAnswerCorrect && (
                  <X className="ml-2 h-4 w-4 text-red-600" />
                )}
              </Button>
            ))}
          </div>

          {/* Feedback section */}
          {showFeedback && (
            <div className={`p-4 rounded-lg mt-4 ${isAnswerCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-medium ${isAnswerCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
              </h3>
              
              {!isAnswerCorrect && (
                <p className="text-gray-700 mt-1">
                  The correct answer is: <span className="font-medium">{correctAnswer}</span>
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            
            <Button
              variant={showFeedback ? "default" : "outline"}
              disabled={!showFeedback && !exerciseCompleted}
              onClick={handleNextExercise}
              className={showFeedback ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {currentIndex === exercises.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Completion message */}
      {exerciseCompleted && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Congratulations! You've completed all the exercises.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FillBlankExercise;