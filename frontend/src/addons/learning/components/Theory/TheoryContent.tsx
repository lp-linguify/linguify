'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  BookOpen,
  Code,
  FileText,
  AlertTriangle,
  Volume2,
  CheckCircle,
  Clock,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TheoryData, TheoryContentProps } from "@/addons/learning/types";
import courseAPI from "@/addons/learning/api/courseAPI";
import lessonCompletionService from "@/addons/progress/api/lessonCompletionService";
import { useRouter } from "next/navigation";

// Animation variants
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

export default function TheoryContent({ lessonId, language = 'en', unitId, onComplete }: TheoryContentProps) {
  const router = useRouter();
  const [theory, setTheory] = useState<TheoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('content');
  const [progress, setProgress] = useState(0);
  const [readSections, setReadSections] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Sound effects
  const audioComplete = typeof Audio !== 'undefined' ? new Audio('/sounds/complete.mp3') : null;
  const audioTab = typeof Audio !== 'undefined' ? new Audio('/sounds/tab.mp3') : null;

  // Helper to get content in current language
  const getLanguageContent = useCallback((field: string, defaultValue: string = ''): string => {
    if (!theory) return defaultValue;

    // Try using new JSON format first
    if (theory.using_json_format && 
        theory.language_specific_content && 
        theory.language_specific_content[language]) {
      return theory.language_specific_content[language][field] || defaultValue;
    }

    // Fall back to old format if needed
    const oldFormatField = `${field}_${language}` as keyof TheoryData;
    return (theory[oldFormatField] as string) || defaultValue;
  }, [theory, language]);

  // Effect to fetch theory content
  useEffect(() => {
    const fetchTheory = async () => {
      try {
        setLoading(true);
        const data = await courseAPI.getTheoryContent(parseInt(lessonId), language);

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No theory content found');
        }

        setTheory(data[0]);
        
        // Initialize progress tracking
        await lessonCompletionService.updateContentProgress(
          parseInt(lessonId),
          1, // Initial 1% progress
          0,
          0,
          false
        );
        
        setShouldAnimate(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching theory:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchTheory();
    }
  }, [lessonId, language]);

  // Track study time
  useEffect(() => {
    const timer = setInterval(() => {
      setStudyTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Determine available sections
  const getAvailableSections = useCallback(() => {
    if (!theory) return ['content'];
    
    const sections = ['content'];
    
    // Add formula section if available
    if (getLanguageContent('formula')) sections.push('formula');
    
    // Add examples section if available
    if (getLanguageContent('example')) sections.push('examples');
    
    // Add exceptions section if available
    if (getLanguageContent('exception')) sections.push('exceptions');
    
    return sections;
  }, [theory, getLanguageContent]);

  // Update progress when sections are read
  useEffect(() => {
    if (readSections.length > 0 && theory) {
      const newProgress = Math.round((readSections.length / getAvailableSections().length) * 100);
      setProgress(newProgress);
      
      // Calculate XP earned - base + streak bonus
      const baseXp = 2;
      const streakBonus = Math.min(readSections.length - 1, 3); // Max 3 XP bonus
      const earnedXp = baseXp + streakBonus;
      setXpEarned(earnedXp);
      
      // Update progress in backend if changed significantly
      if (newProgress % 25 === 0 || newProgress === 100) {
        updateProgressInBackend(newProgress, earnedXp);
      }
      
      // Set completed if all sections are read
      if (newProgress === 100 && !isCompleted) {
        setIsCompleted(true);
        setShowConfetti(true);
        if (audioComplete) audioComplete.play().catch(e => console.log('Audio error:', e));
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
        handleComplete(earnedXp);
      }
    }
  }, [readSections, theory, getAvailableSections]);

  // Update progress in backend
  const updateProgressInBackend = async (newProgress: number, earnedXp: number) => {
    try {
      await lessonCompletionService.updateContentProgress(
        parseInt(lessonId),
        newProgress,
        studyTime,
        earnedXp,
        newProgress === 100
      );
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  // Text-to-speech functionality
  const speak = useCallback((text: string | null) => {
    if (!text) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'fr' ? 'fr-FR' : 
                     language === 'es' ? 'es-ES' :
                     language === 'nl' ? 'nl-NL' : 'en-GB';
    window.speechSynthesis.speak(utterance);
  }, [language]);

  // Mark a section as read
  const markAsRead = useCallback((section: string) => {
    if (audioTab) audioTab.play().catch(e => console.log('Audio error:', e));
    
    setReadSections(prev => {
      if (!prev.includes(section)) {
        return [...prev, section];
      }
      return prev;
    });
  }, []);

  // Handle completion
  const handleComplete = async (earnedXp: number) => {
    try {
      await lessonCompletionService.updateContentProgress(
        parseInt(lessonId),
        100,
        studyTime,
        earnedXp + 5, // Bonus XP for completion
        true
      );
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error marking content as complete:', err);
    }
  };

  const handleBack = () => {
    if (unitId) {
      router.push(`/learning/${unitId}/${lessonId}`);
    } else {
      router.push("/learning");
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"/>
          <p className="text-gray-500">Loading content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !theory) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Failed to load theory content"}</AlertDescription>
      </Alert>
    );
  }

  // Available sections for tabs
  const availableSections = getAvailableSections();

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Back button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="text-gray-500 hover:text-gray-700 px-2 py-1"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lesson
        </Button>
      </div>
      
      {/* Language badge */}
      <div className="mb-5">
        <Badge className="bg-indigo-100 text-indigo-800 font-medium uppercase">
          {language}
        </Badge>
        <Badge className="ml-2 bg-gray-100 text-gray-600 font-medium">
          theory
        </Badge>
      </div>
      
      <motion.div
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={contentVariants}
        className="mb-10"
      >
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="p-6 space-y-6">
            {/* Header with title and progress */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                      {theory?.content_lesson.title[language] || "Theory Content"}
                    </h1>
                    <button 
                      onClick={() => speak(theory?.content_lesson.title[language] || '')}
                      className="ml-2 text-indigo-600 hover:text-indigo-800 focus:outline-none"
                      aria-label="Listen to pronunciation"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(studyTime)}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {readSections.length}/{availableSections.length} sections
                    </div>
                    {xpEarned > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 font-medium text-xs">
                        +{xpEarned} XP
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-48">
                  <Progress 
                    value={progress} 
                    className="h-2" 
                    style={{
                      background: "linear-gradient(to right, rgba(79, 70, 229, 1) 0%, rgba(147, 51, 234, 1) 50%, rgba(236, 72, 153, 1) 100%)"
                    }}
                  />
                </div>
              </div>
              <p className="text-gray-600">
                {theory?.content_lesson.instruction[language] || "Learn the theory by reading through all sections."}
              </p>
            </div>

            {/* Section tabs */}
            <Tabs defaultValue="content" value={currentTab} onValueChange={(value) => {
              setCurrentTab(value);
              markAsRead(value);
            }}>
              <TabsList className="w-full grid grid-cols-4 bg-gray-50 rounded-lg p-1">
                <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Content</span>
                    {readSections.includes('content') && (
                      <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
                
                <TabsTrigger value="formula" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  <div className="flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    <span>Formula</span>
                    {readSections.includes('formula') && (
                      <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
                
                <TabsTrigger value="examples" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>Examples</span>
                    {readSections.includes('examples') && (
                      <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
                
                <TabsTrigger value="exceptions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Exceptions</span>
                    {readSections.includes('exceptions') && (
                      <CheckCircle className="h-3 w-3 ml-2 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={tabVariants}
                  className="mt-4"
                >
                  <TabsContent value="content" className="focus:outline-none mt-0">
                    <div className="bg-white rounded-lg overflow-hidden">
                      {/* Title */}
                      <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                          Règle grammaticale : {theory?.content_lesson.title[language]}
                        </h2>
                        <button 
                          onClick={() => speak(getLanguageContent('content'))}
                          className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                          aria-label="Listen to content"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        {getLanguageContent('content') ? (
                          <div className="space-y-4">
                            {getLanguageContent('content')
                              .split('\\n')
                              .map((line: string, index: number) => (
                                <p key={index} className="text-gray-700">{line}</p>
                              ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No content available</p>
                        )}
                      </div>
                      
                      {/* Explanation */}
                      <div className="bg-gray-50 p-6 mt-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">Explanation</h3>
                        {getLanguageContent('explanation') ? (
                          <div className="space-y-3">
                            {getLanguageContent('explanation')
                              .split('\\n')
                              .map((line: string, index: number) => (
                                <p key={index} className="text-gray-700">{line}</p>
                              ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No explanation available</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="formula" className="focus:outline-none mt-0">
                    <div className="bg-white rounded-lg overflow-hidden">
                      {/* Title */}
                      <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Formula</h2>
                        <button 
                          onClick={() => speak(getLanguageContent('formula'))}
                          className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                          aria-label="Listen to formula"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        {getLanguageContent('formula') ? (
                          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            {getLanguageContent('formula')
                              .split('\\n')
                              .map((line: string, index: number) => (
                                <p key={index} className="text-gray-800 mb-2">{line}</p>
                              ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No formula available for this topic.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="examples" className="focus:outline-none mt-0">
                    <div className="bg-white rounded-lg overflow-hidden">
                      {/* Title */}
                      <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Examples</h2>
                        <button 
                          onClick={() => speak(getLanguageContent('example'))}
                          className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                          aria-label="Listen to examples"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        {getLanguageContent('example') ? (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            {getLanguageContent('example')
                              .split('\\n')
                              .map((line: string, index: number) => (
                                <p key={index} className="text-gray-800 mb-2">{line}</p>
                              ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No examples available for this topic.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="exceptions" className="focus:outline-none mt-0">
                    <div className="bg-white rounded-lg overflow-hidden">
                      {/* Title */}
                      <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Exceptions</h2>
                        <button 
                          onClick={() => speak(getLanguageContent('exception'))}
                          className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                          aria-label="Listen to exceptions"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6">
                        {getLanguageContent('exception') ? (
                          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                            {getLanguageContent('exception')
                              .split('\\n')
                              .map((line: string, index: number) => (
                                <p key={index} className="text-gray-800 mb-2">{line}</p>
                              ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>No exceptions noted for this topic.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>

            {/* Navigation and status */}
            <div className="flex justify-between items-center mt-8 border-t pt-4">
              <Button 
                variant="outline" 
                className="text-gray-500"
                onClick={handleBack}
              >
                Previous
              </Button>
              
              <div className="flex items-center">
                {progress === 100 ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Completed</span>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {readSections.length}/{availableSections.length} sections
                  </div>
                )}
              </div>
              
              <Button 
                className={`font-medium ${isCompleted 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-indigo-600 hover:bg-indigo-700'}`}
                disabled={progress === 100}
                onClick={() => handleComplete(xpEarned + 5)}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                {isCompleted ? "Completed" : "Complete"}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {Array.from({ length: 50 }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-5%`,
                    backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${Math.random() * 3 + 2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}