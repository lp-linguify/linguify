// src/addons/learning/components/Lessons/AllLessonsView.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lesson } from "@/addons/learning/types";
import courseAPI from "@/addons/learning/api/courseAPI";
import progressAPI from "@/addons/progress/api/progressAPI";
import {
  Clock,
  BookOpen,
  GraduationCap,
  Video,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react";

// Helper function to get the appropriate icon for lesson type
const getLessonTypeIcon = (type: string): React.ReactNode => {
  switch (type.toLowerCase()) {
    case "video":
      return <Video className="h-5 w-5" />;
    case "quiz":
      return <GraduationCap className="h-5 w-5" />;
    case "reading":
      return <FileText className="h-5 w-5" />;
    case "vocabulary":
      return <BookOpen className="h-5 w-5" />;
    case "grammar":
      return <GraduationCap className="h-5 w-5" />;
    default:
      return <BookOpen className="h-5 w-5" />;
  }
};

interface AllLessonsViewProps {
  levelFilter: string;
  contentTypeFilter: string;
  isCompactView?: boolean;
  layout?: "list" | "grid";
}

const AllLessonsView: React.FC<AllLessonsViewProps> = ({
  levelFilter,
  contentTypeFilter,
  isCompactView = false,
  layout = "list"
}) => {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<Record<number, any>>({});

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        console.log(`AllLessonsView: Fetching lessons with contentType=${contentTypeFilter}, level=${levelFilter}`);
        
        // Modification: condition explicite pour traiter "all" correctement
        let apiContentType = contentTypeFilter;
        
        // S'assurer que même avec "all", on envoie une valeur au backend
        // Cette approche est complémentaire à la modification du backend
        if (apiContentType === "all") {
          apiContentType = ""; // Envoyer une chaîne vide pour "all"
        }
        
        const response = await courseAPI.getLessonsByContentType(
          apiContentType, 
          levelFilter
        );
        
        console.log(`API Response for "${contentTypeFilter}":`, {
          hasResults: response.results && response.results.length > 0,
          resultCount: response.results?.length || 0
        });
        
        if (response.results && response.results.length > 0) {
          setLessons(response.results);
          
          // Fetch progress data for all lessons
          const lessonIds = response.results.map(lesson => lesson.id);
          fetchLessonProgressData(lessonIds);
        } else {
          console.log(`No lessons found for content type "${contentTypeFilter}"`);
          setLessons([]);
        }
        
        setError(null);
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
        setError("Failed to load lessons. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessons();
  }, [levelFilter, contentTypeFilter]);
  
  const fetchLessonProgressData = async (lessonIds: number[]) => {
    if (!lessonIds.length) return;
    
    try {
      // Fetch progress for all lessons
      const progressMap: Record<number, any> = {};
      
      // In a real implementation, you'd fetch all progress at once
      // For now, we'll simulate batch fetching
      for (const lessonId of lessonIds) {
        const progress = await progressAPI.getLessonProgressByUnit(lessonId);
        if (progress && progress.length > 0) {
          progressMap[lessonId] = progress[0];
        }
      }
      
      setProgressData(progressMap);
    } catch (err) {
      console.error("Failed to fetch lesson progress:", err);
    }
  };
  
  const handleLessonClick = (unitId: number, lessonId: number) => {
    router.push(`/learning/${unitId}/${lessonId}`);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-purple-600 font-medium">Loading lessons...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

if (lessons.length === 0 && !loading && !error) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
      <p className="text-center">No lessons found matching your filters.</p>
      <div className="flex justify-center mt-4">
        <button 
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          onClick={() => {
            console.log("Manual refresh triggered");
            // Re-exécuter la requête manuellement
            setLoading(true);
            courseAPI.getLessonsByContentType(contentTypeFilter, levelFilter)
              .then(response => {
                console.log("Manual refresh response:", response);
                if (response.results) {
                  setLessons(response.results);
                  if (response.results.length > 0) {
                    const lessonIds = response.results.map(lesson => lesson.id);
                    fetchLessonProgressData(lessonIds);
                  }
                }
                setLoading(false);
              })
              .catch(err => {
                console.error("Manual refresh error:", err);
                setLoading(false);
                setError("Failed to load lessons. Please try again.");
              });
          }}
        >
          Refresh Lessons
        </button>
      </div>
    </div>
  );
}
  
  return (
    <div className={layout === "grid" 
      ? `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` 
      : "space-y-4"
    }>
      {lessons.map((lesson) => {
        const progress = progressData[lesson.id];
        const completionPercentage = progress ? progress.completion_percentage : 0;
        const status = progress ? progress.status : 'not_started';
        
        return (
          <Card 
            key={lesson.id}
            className={`transform transition-all duration-300 hover:scale-[1.01] cursor-pointer hover:shadow-md
              ${status === 'completed' ? 'border-l-4 border-green-500' : 
                status === 'in_progress' ? 'border-l-4 border-amber-500' : ''}`}
            onClick={() => handleLessonClick(lesson.unit_id || 0, lesson.id)}
          >
            <CardContent className={isCompactView ? "p-3" : "p-6"}>
              {isCompactView ? (
                // Compact view
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 
                    ${status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                    {status === 'completed' ? <CheckCircle className="h-4 w-4" /> : getLessonTypeIcon(lesson.lesson_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate dark:text-white">{lesson.title}</h3>
                      {lesson.unit_level && (
                        <Badge className="whitespace-nowrap bg-gray-300 text-gray-800">
                        {lesson.unit_level}
                        </Badge>
                      )}
                    </div>
                    
                    {lesson.unit_title && (
                      <p className="text-xs text-gray-600 truncate dark:text-gray-400 mt-1">
                        {lesson.unit_title}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </div>
              ) : (
                // Full view
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 
                    ${status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                    {status === 'completed' ? <CheckCircle className="h-5 w-5" /> : getLessonTypeIcon(lesson.lesson_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{lesson.title}</h3>
                          {lesson.unit_level && (
                            <Badge className="whitespace-nowrap bg-gray-300 text-gray-800">
                            Level {lesson.unit_level}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mt-1 line-clamp-2 dark:text-gray-400 mt-1">{lesson.description}</p>
                        
                        {lesson.unit_title && (
                          <p className="text-sm text-purple-600 mt-1">
                            Unit: {lesson.unit_title}
                          </p>
                        )}
                        
                        {completionPercentage > 0 && (
                          <div className="mt-2">
                            <Progress 
                              className="h-1.5 " 
                              value={completionPercentage} 
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
                      
                      {status === 'in_progress' && (
                        <span className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                          In Progress
                        </span>
                      )}
                      
                      {status === 'completed' && (
                        <span className="flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AllLessonsView;