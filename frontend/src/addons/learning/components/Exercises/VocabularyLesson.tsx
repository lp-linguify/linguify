"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradientText } from "@/components/ui/gradient-text";
import { GradientCard } from "@/components/ui/gradient-card";
import { commonStyles } from "@/styles/gradient_style";
import { motion, AnimatePresence } from "framer-motion";
import lessonCompletionService from "@/addons/progress/api/lessonCompletionService";
import { VocabularyItem, VocabularyLessonProps } from "@/addons/learning/types";
import useSpeechSynthesis from '@/core/speech/useSpeechSynthesis';

// API base URL from environment variable or default to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Type for tracking which element is being read
type SpeakingElement = 'word' | 'example' | null;

// Progress milestone percentages for API updates
const PROGRESS_MILESTONES = [1, 25, 50, 75, 100];

const VocabularyLesson = ({ lessonId, unitId, onComplete }: VocabularyLessonProps) => {
  // Main state
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [userSettings, setUserSettings] = useState({
    native_language: 'EN',
    target_language: 'EN',
  });
  const [timeSpent, setTimeSpent] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [selectedTab, setSelectedTab] = useState("definition");
  const [speakingElement, setSpeakingElement] = useState<SpeakingElement>(null);
  
  // Use the speech synthesis hook
  const { speak, stop, isSpeaking } = useSpeechSynthesis(userSettings.target_language);
  
  // Refs for tracking component lifecycle
  const dataLoadedRef = useRef(false);
  const progressInitializedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const celebrationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate current progress percentage
  const progressPercentage = useMemo(() => {
    if (!vocabulary.length) return 0;
    return Math.round(((currentIndex + 1) / vocabulary.length) * 100);
  }, [currentIndex, vocabulary.length]);
  
  // Memoize current word to prevent unnecessary re-renders
  const currentWord = useMemo(() => 
    vocabulary[currentIndex] || null
  , [vocabulary, currentIndex]);
  
  // Helper function to get user settings from localStorage - centralized
  const getUserSettings = useCallback(() => {
    try {
      const userSettingsStr = localStorage.getItem('userSettings');
      if (!userSettingsStr) return { native_language: 'EN', target_language: 'EN' };
      
      const settings = JSON.parse(userSettingsStr);
      return {
        native_language: settings.native_language || 'EN',
        target_language: settings.target_language || 'EN',
      };
    } catch (e) {
      console.error("Error parsing user settings:", e);
      return { native_language: 'EN', target_language: 'EN' };
    }
  }, []);
  
  // Function to update progress in API - wrapped in useCallback to prevent recreation
  const updateProgressInAPI = useCallback(async (completionPercentage: number) => {
    if (!lessonId || !mountedRef.current) return;
    
    try {
      const contentLessonId = parseInt(lessonId);
      await lessonCompletionService.updateContentProgress(
        contentLessonId,
        completionPercentage,
        timeSpent,
        Math.round(completionPercentage / 10), // XP gained proportional to progress
        completionPercentage >= 100 // mark as completed if 100%
      );
      
      // If we also have the unit ID, update the parent lesson progress
      if (unitId && completionPercentage >= 100 && !lessonCompleted) {
        // Update parent lesson progress too
        await lessonCompletionService.updateLessonProgress(
          contentLessonId, 
          parseInt(unitId),
          100, // 100% progress
          timeSpent,
          true // Mark as completed
        );
        
        if (mountedRef.current) {
          setLessonCompleted(true);
        }
      }
      
      // If completed and we have a completion callback
      if (completionPercentage >= 100 && onComplete && !lessonCompleted && mountedRef.current) {
        setLessonCompleted(true);
      }
    } catch (error) {
      console.error("Error updating vocabulary progress:", error);
    }
  }, [lessonId, unitId, timeSpent, onComplete, lessonCompleted]);

  // Track lesson mount/unmount status
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track time spent on this lesson - fixed with refs
  useEffect(() => {
    // Clear any existing interval
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    
    startTimeRef.current = Date.now();
    
    // Update time spent every 30 seconds to reduce API calls
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
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  // Load user preferences on startup
  useEffect(() => {
    const settings = getUserSettings();
    setUserSettings(settings);
  }, [getUserSettings]);

  // Reset speaking when changing words
  useEffect(() => {
    // Stop any ongoing speech when changing words
    stop();
    setSpeakingElement(null);
  }, [currentIndex, stop]);

  // Update speaking element state when isSpeaking changes
  useEffect(() => {
    if (!isSpeaking && mountedRef.current) {
      setSpeakingElement(null);
    }
  }, [isSpeaking]);

  // Function to dynamically get content in the specified language
  const getWordInLanguage = useCallback((word: VocabularyItem | null, field: string, language: string) => {
    if (!word) return '';
    
    // Convert to lowercase to match "_en", "_fr", etc. format
    const lang = language.toLowerCase();
    const fieldName = `${field}_${lang}`;
    
    // If the field exists in the word object, return it, otherwise return the English version
    return word[fieldName as keyof VocabularyItem] || word[`${field}_en` as keyof VocabularyItem] || '';
  }, []);

  // Function to get content in native language
  const getWordInNativeLanguage = useCallback((word: VocabularyItem | null, field: string) => {
    return getWordInLanguage(word, field, userSettings.native_language);
  }, [getWordInLanguage, userSettings.native_language]);

  // Function to get content in target language
  const getWordInTargetLanguage = useCallback((word: VocabularyItem | null, field: string) => {
    return getWordInLanguage(word, field, userSettings.target_language);
  }, [getWordInLanguage, userSettings.target_language]);

  // Effect to update progress based on current position
  useEffect(() => {
    if (vocabulary.length > 0 && currentIndex >= 0) {
      // Only update progress in API at significant milestones to reduce API calls
      if (PROGRESS_MILESTONES.includes(progressPercentage)) {
        updateProgressInAPI(progressPercentage);
      }
      
      // Check if we've reached the last word and show celebration
      if (currentIndex === vocabulary.length - 1 && !lessonCompleted && mountedRef.current) {
        // Use a promise-based approach for more reliable audio
        const playSuccessSound = async () => {
          try {
            // Pre-load the audio
            const audio = new Audio("/success1.mp3");
            audio.volume = 0.3;
            
            // Wait for audio to load with timeout
            const loadPromise = new Promise<void>((resolve) => {
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => {
                console.error("Error loading audio");
                resolve();
              };
            });
            
            // Set a timeout in case loading hangs
            const timeoutPromise = new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 2000);
            });
            
            // Race the promises to handle either case
            await Promise.race([loadPromise, timeoutPromise]);
            
            // Play the audio - wrapped in try/catch
            if (mountedRef.current) {
              await audio.play().catch(err => console.error("Error playing sound:", err));
            }
          } catch (error) {
            console.error("Error with audio:", error);
          }
        };
        
        // Only play sound and show celebration if component is still mounted
        if (mountedRef.current) {
          playSuccessSound();
          setShowCelebration(true);
          
          celebrationTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setShowCompletionMessage(true);
              setShowCelebration(false);
            }
          }, 1500);
          
          updateProgressInAPI(100);
        }
      }
    }
  }, [currentIndex, vocabulary.length, progressPercentage, updateProgressInAPI, lessonCompleted]);

  // Fetch vocabulary data - only once
  useEffect(() => {
    // Only fetch if we haven't already loaded data
    if (dataLoadedRef.current || !lessonId) return;
    
    const fetchVocabulary = async () => {
      if (!mountedRef.current) return;
      
      console.log("Fetching vocabulary for lesson:", lessonId);
      setLoading(true);
      setError(null);
      
      try {
        // Get user settings
        const settings = getUserSettings();
        const targetLanguage = settings.target_language || 'EN';
        
        const response = await fetch(
          `${API_BASE_URL}/api/v1/course/vocabulary-list/?content_lesson=${lessonId}&target_language=${targetLanguage.toLowerCase()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            mode: "cors",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch vocabulary content: ${response.status}`
          );
        }

        const data = await response.json();
        
        if (mountedRef.current) {
          if (data.results && data.results.length > 0) {
            setVocabulary(data.results);
            dataLoadedRef.current = true;
            
            // Initialize progress to 1% just once
            if (!progressInitializedRef.current) {
              updateProgressInAPI(1);
              progressInitializedRef.current = true;
            }
          } else {
            setError("No vocabulary items found for this lesson");
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          console.error("Fetch error:", err);
          setError(`Failed to load vocabulary content: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchVocabulary();
  }, [lessonId, getUserSettings, updateProgressInAPI]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, vocabulary.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);
  
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
  }, []);
  
  // Handle tab selection
  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value);
  }, []);
  
  // Handle lesson completion
  const handleComplete = useCallback(() => {
    updateProgressInAPI(100);
    setShowCompletionMessage(false);
    
    if (onComplete) {
      onComplete();
    }
  }, [updateProgressInAPI, onComplete]);
  
  // Handle speech button clicks with element tracking
  const handleSpeakClick = useCallback((text: string, elementType: SpeakingElement) => {
    // If already speaking
    if (isSpeaking) {
      // Stop speech
      stop();
      setSpeakingElement(null);
      return;
    }
    
    // Otherwise start speaking and record the element being read
    speak(text);
    setSpeakingElement(elementType);
  }, [isSpeaking, speak, stop]);

  // Loading state
  if (loading) {
    return (
      <div className={commonStyles.container}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse">Loading vocabulary...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !vocabulary.length) {
    return (
      <div className={commonStyles.container}>
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "No vocabulary items found for this lesson."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-9rem)] flex flex-col">
      <GradientCard className="flex-1 flex flex-col relative overflow-hidden">
        {/* Celebration Overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              key="celebration"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-50"
              style={{ pointerEvents: 'none' }}
            >
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, -5, 0],
                }}
                transition={{ duration: 0.8 }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 p-6 rounded-lg shadow-xl text-white text-2xl font-bold z-50 flex items-center gap-3"
              >
                <Sparkles className="h-6 w-6" />
                Lesson Complete!
                <Sparkles className="h-6 w-6" />
              </motion.div>
            </motion.div>
          )}

          {showCompletionMessage && (
            <motion.div
              key="completion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40"
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="bg-white p-8 rounded-lg shadow-xl z-50 text-center space-y-4 max-w-md"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-transparent bg-clip-text">
                  🎉 Vocabulary Mastered! 🎉
                </h3>
                <p className="text-gray-600">
                  Great work! You've completed all the vocabulary in this
                  lesson.
                </p>
                <div className="pt-2 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompletionMessage(false)}
                    className="border-brand-purple text-brand-purple hover:bg-brand-purple/10"
                  >
                    Keep Reviewing
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white border-none"
                  >
                    Complete Lesson
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 flex flex-col h-full relative z-10">
          {/* Progress Section */}
          <div className="mb-2">
            <Progress
              value={progressPercentage}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Word {currentIndex + 1} of {vocabulary.length}
            </p>
          </div>

          {/* Main Content - flexbox with flex-1 to take available space */}
          <div className="flex-1 flex flex-col justify-between overflow-auto">
            {/* Word Card - more compact */}
            <div className="py-3">
              <div className={commonStyles.gradientBackground} />
              <div className="relative p-4 text-center">
                <div className="text-sm font-medium text-brand-purple mb-1">
                  {getWordInTargetLanguage(currentWord, 'word_type')}
                </div>
                <GradientText className="text-4xl font-bold block mb-2">
                  {getWordInTargetLanguage(currentWord, 'word')}
                </GradientText>
                <p className="text-xl text-muted-foreground">
                  {getWordInNativeLanguage(currentWord, 'word')}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSpeakClick(String(getWordInTargetLanguage(currentWord, 'word')), 'word')}
                  className={`mt-2 relative z-10 px-3 py-1 ${speakingElement === 'word' ? 'bg-brand-purple/10' : 'hover:bg-brand-purple/10'}`}
                  type="button"
                >
                  {speakingElement === 'word' ? (
                    <>
                      <span className="animate-pulse">
                        <Volume2 className="h-4 w-4 mr-1" />
                      </span>
                      Speaking...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-1" />
                      Listen
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Example Section - more compact */}
            {currentWord && getWordInTargetLanguage(currentWord, 'example_sentence') && (
              <div className={`${commonStyles.exampleBox} flex flex-col items-center text-center p-3 relative my-2`}>
                <div className="w-full flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-semibold text-brand-purple text-sm">Example:</h3>
                  
                  {/* Button with explicit z-index and styling */}
                  <button
                    onClick={() => handleSpeakClick(String(getWordInTargetLanguage(currentWord, 'example_sentence')), 'example')}
                    className={`z-20 inline-flex items-center justify-center rounded-md text-sm font-medium
                      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                      focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
                      ${speakingElement === 'example' ? 'bg-brand-purple/20' : 'hover:bg-brand-purple/10'} 
                      p-1.5 cursor-pointer`}
                    style={{ pointerEvents: 'auto' }}
                    type="button"
                  >
                    {speakingElement === 'example' ? (
                      <div className="flex items-center">
                        <span className="animate-pulse mr-1">
                          <Volume2 className="h-3 w-3" />
                        </span>
                        <span className="text-xs">Speaking...</span>
                      </div>
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
                
                <p className="text-base mb-1">
                  {getWordInTargetLanguage(currentWord, 'example_sentence')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getWordInNativeLanguage(currentWord, 'example_sentence')}
                </p>
              </div>
            )}

            {/* Tabs Section - more compact */}
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="relative z-10 mt-auto">
              <TabsList className={commonStyles.tabsList}>
                <TabsTrigger value="definition" className={commonStyles.tabsTrigger}>
                  Definition
                </TabsTrigger>
                <TabsTrigger value="synonyms" className={commonStyles.tabsTrigger}>
                  Synonyms
                </TabsTrigger>
                <TabsTrigger value="antonyms" className={commonStyles.tabsTrigger}>
                  Antonyms
                </TabsTrigger>
              </TabsList>

              <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg mt-2">
                <TabsContent value="definition" className="m-0">
                  <p className="text-base mb-1">
                    {getWordInTargetLanguage(currentWord, 'definition')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getWordInNativeLanguage(currentWord, 'definition')}
                  </p>
                </TabsContent>

                <TabsContent value="synonyms" className="m-0">
                  <p className="text-base mb-1">
                    {getWordInTargetLanguage(currentWord, 'synonymous') || "No synonyms available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getWordInNativeLanguage(currentWord, 'synonymous') || "No synonyms available"}
                  </p>
                </TabsContent>

                <TabsContent value="antonyms" className="m-0">
                  <p className="text-base mb-1">
                    {getWordInTargetLanguage(currentWord, 'antonymous') || "No antonyms available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getWordInNativeLanguage(currentWord, 'antonymous') || "No antonyms available"}
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Navigation - fixed at bottom */}
          <div className="flex justify-between mt-4 relative z-10">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="flex items-center gap-2 border-brand-purple/20 hover:bg-brand-purple/10"
              type="button"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={handleReset}
              className="px-2"
              title="Reset to first word"
              type="button"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === vocabulary.length - 1}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white hover:opacity-90"
              type="button"
              size="sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Fixed completion button */}
        {currentIndex === vocabulary.length - 1 && !lessonCompleted && (
          <div className="absolute bottom-4 right-4 z-20">
            <Button 
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 hover:from-purple-700 hover:to-blue-700"
              onClick={handleComplete}
              type="button"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        )}
      </GradientCard>
    </div>
  );
};

export default VocabularyLesson;