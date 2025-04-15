// src/app/(dashboard)/(apps)/learning/_components/Lessons.tsx
'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { getUserTargetLanguage } from "@/core/utils/languageUtils";
import { Lesson, LessonsProps } from "@/addons/learning/types";
import courseAPI from "@/addons/learning/api/courseAPI";
import progressAPI from "@/addons/progress/api/progressAPI";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Video,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getLessonTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "video":
      return <Video className="w-5 h-5" />;
    case "quiz":
      return <GraduationCap className="w-5 h-5" />;
    case "reading":
      return <FileText className="w-5 h-5" />;
    case "vocabulary":
      return <BookOpen className="w-5 h-5" />;
    case "grammar":
      return <GraduationCap className="w-5 h-5" />;
    case "theory":
      return <FileText className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
};

export default function Lessons({ unitId }: LessonsProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitProgress, setUnitProgress] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [unitTitle, setUnitTitle] = useState('');
  const [lessonsWithProgress, setLessonsWithProgress] = useState<(Lesson & { progress?: number, status?: string })[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Récupérer la langue cible au chargement du composant
    const userLang = getUserTargetLanguage();
    setTargetLanguage(userLang);
    console.log('Component: User target language set to:', userLang);
  }, []);

  // Charger les données de progression
  useEffect(() => {
    const loadProgressData = async () => {
      if (!unitId) return;
      
      try {
        // Charger la progression de l'unité
        const unitProgressData = await progressAPI.getUnitProgress();
        if (unitProgressData && Array.isArray(unitProgressData)) {
          const thisUnitProgress = unitProgressData.find(item => item.unit === parseInt(unitId));
          if (thisUnitProgress) {
            setUnitProgress(thisUnitProgress.completion_percentage);
          }
        }
        
        // Charger la progression des leçons
        const lessonsProgressData = await progressAPI.getLessonProgressByUnit(parseInt(unitId));
        
        // Associer les progressions aux leçons
        if (lessonsProgressData && Array.isArray(lessonsProgressData) && lessons.length > 0) {
          const updatedLessons = lessons.map(lesson => {
            const lessonProgress = lessonsProgressData.find(p => p.lesson_details.id === lesson.id);
            return {
              ...lesson,
              progress: lessonProgress?.completion_percentage || 0,
              status: lessonProgress?.status || 'not_started'
            };
          });
          
          setLessonsWithProgress(updatedLessons);
        }
      } catch (err) {
        console.error("Failed to load progress data:", err);
      }
    };
    
    if (lessons.length > 0) {
      loadProgressData();
    }
  }, [unitId, lessons]);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!unitId || !targetLanguage) return;
      
      try {
        setLoading(true);
        console.log(`Component: Fetching lessons for unit ${unitId} with language: ${targetLanguage}`);
        
        // Passer explicitement la langue
        const data = await courseAPI.getLessons(parseInt(unitId), targetLanguage);
        
        // Charger les données de l'unité pour récupérer le titre
        const unitsData = await courseAPI.getUnits(undefined, targetLanguage);
        if (Array.isArray(unitsData)) {
          const unit = unitsData.find(u => u.id === parseInt(unitId));
          if (unit) {
            setUnitTitle(unit.title);
          }
        }
        
        // Vérifier les données reçues
        if (!data || !Array.isArray(data)) {
          console.error('Component: Invalid data received:', data);
          setError("Received invalid data format from API");
          return;
        }
        
        // Traiter les données
        const sortedLessons = data.sort((a: Lesson, b: Lesson) => a.order - b.order);
        
        // Afficher un échantillon de données pour debug
        if (sortedLessons.length > 0) {
          console.log('Component: First lesson received:', {
            id: sortedLessons[0].id,
            title: sortedLessons[0].title,
            language: targetLanguage
          });
        } else {
          console.log('Component: No lessons received for unit', unitId);
        }
        
        setLessons(sortedLessons);
        setLessonsWithProgress(sortedLessons.map(lesson => ({
          ...lesson,
          progress: 0,
          status: 'not_started'
        })));
        setError(null);
      } catch (err) {
        console.error("Component: Error fetching lessons:", err);
        setError(err instanceof Error ? err.message : "Failed to load lessons");
      } finally {
        setLoading(false);
      }
    };
  
    fetchLessons();
  }, [unitId, targetLanguage]);

  const handleBack = () => {
    router.push("/learning");
  };

  const handleLessonClick = (lessonId: number) => {
    router.push(`/learning/${unitId}/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-purple-600 font-medium">
            Loading your learning journey...
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen w-full bg-purple-50">
      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <BackButton
            onClick={handleBack}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Units
          </BackButton>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 text-transparent bg-clip-text">
            {unitTitle || `Unit ${unitId}`}
          </h1>
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-white px-3 py-1.5">
              {targetLanguage.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-gray-600">
                {lessons.reduce(
                  (acc, lesson) => acc + lesson.estimated_duration,
                  0
                )}{" "}
                min total
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Unit Progress
            </span>
            <span className="text-sm font-medium text-purple-600">
              {unitProgress}%
            </span>
          </div>
          <Progress 
            value={unitProgress} 
            className="h-2 bg-purple-100"
            style={{
              "--progress-background": "linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234), rgb(244, 114, 182))"
            } as React.CSSProperties}
          />
        </div>

        {/* Lessons Grid */}
        <div className="space-y-4">
          {lessonsWithProgress.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No lessons available yet.</AlertDescription>
            </Alert>
          ) : (
            lessonsWithProgress.map((lesson, index) => (
              <Card
                key={lesson.id}
                className={`transform transition-all duration-300 hover:scale-[1.01] cursor-pointer hover:shadow-md bg-white ${lesson.status === 'completed'
                    ? 'border-l-4 border-green-500'
                    : lesson.status === 'in_progress'
                      ? 'border-l-4 border-amber-500'
                      : ''
                  }`}
                onClick={() => handleLessonClick(lesson.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${lesson.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-purple-100 text-purple-600'
                      }`}>
                      {lesson.status === 'completed'
                        ? <CheckCircle className="h-5 w-5" />
                        : getLessonTypeIcon(lesson.lesson_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {lesson.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {lesson.description}
                          </p>
                          
                          {/* Progress indicator if available */}
                          {lesson.progress !== undefined && lesson.progress > 0 && (
                            <div className="mt-2">
                              <Progress 
                                className="h-1.5" 
                                value={lesson.progress}
                                style={{
                                  "--progress-background": "linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234))"
                                } as React.CSSProperties}
                              />
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <span className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {lesson.estimated_duration} min
                        </span>
                        <span className="flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                          {getLessonTypeIcon(lesson.lesson_type)}
                          {lesson.lesson_type}
                        </span>
                        
                        {lesson.status === 'in_progress' && (
                          <span className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                            In Progress
                          </span>
                        )}
                        
                        {lesson.status === 'completed' && (
                          <span className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completed
                          </span>
                        )}
                        
                        {index === 0 && lesson.status === 'not_started' && (
                          <span className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Start Here
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}