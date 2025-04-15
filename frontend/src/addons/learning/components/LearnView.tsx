// src/addons/learning/components/LearnView.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, BookOpen, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import courseAPI from "@/addons/learning/api/courseAPI";
import progressAPI from "@/addons/progress/api/progressAPI";
import LearningJourney from "./LearnHeader/LearnHeader";
import AllLessonsView from "./Lessons/AllLessonsView";
import { Unit, Lesson, FilteredUnit, FilteredLesson, FilteredContentLesson, LevelGroupType, LessonResult } from "@/addons/learning/types";
import { UnitProgress, LessonProgress, ContentLessonProgress } from "@/addons/progress/types";
import {
  createUnitProgressMap,
  createLessonProgressMap,
  createContentProgressMap
} from "@/core/utils/progressAdapter";

export default function LearningView() {
  const router = useRouter();
  const [units, setUnits] = useState<FilteredUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [viewMode, setViewMode] = useState<"units" | "lessons">("units");
  const [isCompactView, setIsCompactView] = useState<boolean>(false);
  const [unitProgressData, setUnitProgressData] = useState<Record<number, UnitProgress>>({});
  const [lessonProgressData, setLessonProgressData] = useState<Record<number, LessonProgress>>({});
  const [_contentProgressData, setContentProgressData] = useState<Record<number, ContentLessonProgress>>({});
  const [_progressLoading, setProgressLoading] = useState<boolean>(true);

  // Create a map to track which units have already had their lessons loaded
  const loadedUnitsRef = useRef<Set<number>>(new Set());

  // Declare loadContentProgress first to avoid circular dependency
  const loadContentProgress = useCallback(async (lessonId: number) => {
    try {
      const contentProgressItems = await progressAPI.getContentLessonProgress(lessonId);

      // If no progression data is available, exit
      if (!contentProgressItems || contentProgressItems.length === 0) return;

      // Create a map of content progressions with appropriate conversion
      const contentProgressMap = createContentProgressMap(contentProgressItems);

      // Update progression data in state
      setContentProgressData(prev => ({ ...prev, ...contentProgressMap }));

      // Update contents with their progressions
      setUnits(prevUnits =>
        prevUnits.map(unit => ({
          ...unit,
          lessons: unit.lessons.map(lesson => {
            if (lesson.id !== lessonId) return lesson;

            // Update contents of this lesson with their progressions
            const updatedContents = lesson.contentLessons.map(content => {
              const contentProgress = contentProgressMap[content.id];
              if (!contentProgress) return content;

              // Ensure status is correctly typed
              let status: 'not_started' | 'in_progress' | 'completed' | undefined;
              if (contentProgress.status === 'not_started' ||
                contentProgress.status === 'in_progress' ||
                contentProgress.status === 'completed') {
                status = contentProgress.status;
              } else {
                status = 'not_started'; // Default value if invalid status
              }

              return {
                ...content,
                progress: contentProgress.completion_percentage,
                status: status
              };
            });

            return { ...lesson, contentLessons: updatedContents };
          })
        }))
      );
    } catch (err) {
      console.error(`Error loading content progression for lesson ${lessonId}:`, err);
    }
  }, []);

  // Now declare loadContentLessonsForLesson which depends on loadContentProgress
  const loadContentLessonsForLesson = useCallback(async (lessonId: number) => {
    try {
      console.log(`Loading contents for lesson ${lessonId}...`);

      const contentData = await courseAPI.getContentLessons(lessonId);

      if (!Array.isArray(contentData) || contentData.length === 0) {
        console.log(`No content found for lesson ${lessonId}`);
        return;
      }

      console.log(`Found ${contentData.length} contents for lesson ${lessonId}`);

      // Log some debugging information about content types
      const contentTypes = contentData.map(c => c.content_type);
      const uniqueTypes = [...new Set(contentTypes)];
      console.log(`Content types found: ${uniqueTypes.join(', ')}`);

      const formattedContents: FilteredContentLesson[] = (contentData as any[]).map(content => {
        // Extract title correctly
        let title = '';
        if (typeof content.title === 'object') {
          // Try fr language first, then en if available
          title = content.title.fr || content.title.en || 'No title';
        } else {
          title = content.title || 'No title';
        }

        // Normalize content type for consistent matching
        // Important: make sure it's a string and convert to lowercase
        const normalizedContentType = String(content.content_type).toLowerCase();

        return {
          id: content.id,
          title: title,
          content_type: normalizedContentType,
          lesson_id: lessonId,
          order: content.order || 0,
          // Progression data to be filled later
          progress: 0,
          status: 'not_started'
        };
      });

      // Update the unit with its contents
      setUnits(prevUnits =>
        prevUnits.map(unit => ({
          ...unit,
          lessons: unit.lessons.map(lesson =>
            lesson.id === lessonId
              ? { ...lesson, contentLessons: formattedContents }
              : lesson
          )
        }))
      );

      // Load content progression for this lesson
      await loadContentProgress(lessonId);
    } catch (err) {
      console.error(`Error loading contents for lesson ${lessonId}:`, err);
    }
  }, [loadContentProgress]);

  // Load lessons for a specific unit
  const loadLessonsForUnit = useCallback(async (unitId: number): Promise<void> => {
    // Check if this unit has already been loaded
    if (loadedUnitsRef.current.has(unitId)) {
      // If unit already loaded, check if lessons are actually in the state
      const unit = units.find(u => u.id === unitId);
      if (unit && unit.lessons.length > 0) {
        console.log(`Unit ${unitId} lessons already loaded, skipping`);
        return;
      }
    }

    try {
      console.log(`Loading lessons for unit ${unitId}...`);
      const lessonsData = await courseAPI.getLessons(unitId);

      // Enrich with empty lists for contents and progression data
      const formattedLessons: FilteredLesson[] = (lessonsData as Lesson[]).map(lesson => {
        const lessonProgress = lessonProgressData[lesson.id];

        // Ensure status is correctly typed
        let status: 'not_started' | 'in_progress' | 'completed' | undefined;
        if (lessonProgress?.status === 'not_started' ||
          lessonProgress?.status === 'in_progress' ||
          lessonProgress?.status === 'completed') {
          status = lessonProgress.status;
        } else {
          status = undefined;
        }

        return {
          id: lesson.id,
          title: lesson.title,
          lesson_type: lesson.lesson_type,
          unit_id: unitId,
          estimated_duration: lesson.estimated_duration,
          contentLessons: [],
          // Add progression data if it exists
          progress: lessonProgress?.completion_percentage,
          status: status
        };
      });

      // Update the unit with its lessons
      setUnits(prevUnits =>
        prevUnits.map(unit =>
          unit.id === unitId
            ? { ...unit, lessons: formattedLessons }
            : unit
        )
      );

      // Mark this unit as having its lessons loaded
      loadedUnitsRef.current.add(unitId);

      // For each lesson, load lesson contents
      const contentPromises = formattedLessons.map(lesson =>
        loadContentLessonsForLesson(lesson.id)
      );

      // Wait for all content to load for this unit
      await Promise.all(contentPromises);

      console.log(`Successfully loaded all lessons and content for unit ${unitId}`);
    } catch (err) {
      console.error(`Error loading lessons for unit ${unitId}:`, err);
      throw err; // Re-throw to be handled by caller
    }
  }, [loadContentLessonsForLesson, lessonProgressData, units]);

  // Function to group units by level
  const groupUnitsByLevel = useCallback((units: FilteredUnit[]): LevelGroupType[] => {
    // Structure to store units by level
    const groupedByLevel: Record<string, FilteredUnit[]> = {};

    // Group units by level
    units.forEach(unit => {
      if (!groupedByLevel[unit.level]) {
        groupedByLevel[unit.level] = [];
      }
      groupedByLevel[unit.level].push(unit);
    });

    // Convert to sorted array by level (A1, A2, B1, B2, etc.)
    return Object.entries(groupedByLevel)
      .sort(([levelA], [levelB]) => {
        // Intelligent sorting of language levels
        const levelAKey = levelA.charAt(0) + parseInt(levelA.substring(1));
        const levelBKey = levelB.charAt(0) + parseInt(levelB.substring(1));
        return levelAKey.localeCompare(levelBKey);
      })
      .map(([level, units]) => ({
        level,
        units: units.sort((a, b) => a.order - b.order) // Sort by order within level
      }));
  }, []);

  // Load unit data
  const loadUnits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get units
      const unitsData = await courseAPI.getUnits();

      // Extract available levels
      const levels = Array.from(new Set((unitsData as Unit[]).map(unit => unit.level)));
      setAvailableLevels(levels.sort());

      // Transform to enriched format with empty lists for lessons
      const formattedUnits: FilteredUnit[] = (unitsData as Unit[]).map(unit => ({
        id: unit.id,
        title: unit.title,
        level: unit.level,
        lessons: [],
        order: unit.order || 0,
      }));

      setUnits(formattedUnits);

      // Load progression data
      await loadProgressData();
    } catch (err) {
      console.error("Error loading units:", err);
      setError("Impossible de charger les unités d'apprentissage. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load progression data
  const loadProgressData = async () => {
    try {
      setProgressLoading(true);

      // 1. Load unit progressions
      const unitProgressItems = await progressAPI.getUnitProgress();

      // Convert to map for easy access
      const unitProgressMap = createUnitProgressMap(unitProgressItems);
      setUnitProgressData(unitProgressMap);

      // 2. If we already have loaded lessons, also load their progressions
      const unitIds = Object.keys(unitProgressMap).map(id => parseInt(id));

      // For each unit with progression, load lesson progressions
      const lessonProgressPromises = unitIds.map(unitId =>
        progressAPI.getLessonProgressByUnit(unitId)
      );

      // Wait for all promises to resolve
      const lessonProgressResults = await Promise.all(lessonProgressPromises);

      // Merge all results into a single map
      const lessonProgressMap = {};
      lessonProgressResults.forEach(lessonProgresses => {
        const convertedMap = createLessonProgressMap(lessonProgresses);
        Object.assign(lessonProgressMap, convertedMap);
      });

      setLessonProgressData(lessonProgressMap);

    } catch (err) {
      console.error("Error loading progression data:", err);
    } finally {
      setProgressLoading(false);
    }
  };

  // Function to calculate average progression of a level
  const calculateLevelProgress = (units: FilteredUnit[]): number => {
    const totalUnits = units.length;
    if (totalUnits === 0) return 0;

    let totalProgress = 0;
    let unitsWithProgress = 0;

    units.forEach(unit => {
      if (unitProgressData[unit.id]) {
        totalProgress += unitProgressData[unit.id].completion_percentage;
        unitsWithProgress++;
      }
    });

    return unitsWithProgress > 0 ? Math.round(totalProgress / unitsWithProgress) : 0;
  };

  // Initial effect to load units
  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // Get layout preferences from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem("units_layout_preference");
    if (savedLayout === "list" || savedLayout === "grid") {
      setLayout(savedLayout as "list" | "grid");
    }

    // Get view mode preference
    const savedViewMode = localStorage.getItem("units_view_mode");
    if (savedViewMode === "units" || savedViewMode === "lessons") {
      setViewMode(savedViewMode as "units" | "lessons");
    }

    // Get compact view preference
    const savedCompactView = localStorage.getItem("units_compact_view");
    if (savedCompactView === "true") {
      setIsCompactView(true);
    }
  }, []);
  useEffect(() => {
    // Précharger toutes les leçons lorsqu'on passe en mode "lessons"
    if (viewMode === "lessons") {
      console.log("Preloading lessons for lessons view mode");
      // On peut appeler API ici si nécessaire
      // Par exemple:

      // Exemple (à adapter selon votre API) :
      courseAPI.getLessonsByContentType("all", levelFilter)
        .then(response => {
          console.log(`Preloaded ${response.results?.length || 0} lessons`);
        })
        .catch(err => {
          console.error("Error preloading lessons:", err);
        });
    }
  }, [viewMode, levelFilter]);
  // Filter units by level
  const filteredUnits = useMemo(() => {
    return levelFilter === "all"
      ? units
      : units.filter(unit => unit.level === levelFilter);
  }, [units, levelFilter]);

  // Content type change
  const handleContentTypeChange = (value: string) => {
    console.log(`Content type filter changing to: ${value}`);
    setContentTypeFilter(value);
    
    // Si on sélectionne un filtre spécifique, on peut automatiquement 
    // passer en mode leçons pour plus de cohérence
    if (value !== "all" && viewMode !== "lessons") {
      console.log("Automatically switching to lessons view mode due to content filter");
      setViewMode("lessons");
      localStorage.setItem("units_view_mode", "lessons");
    }
  };

  // Handler for view mode change
  const handleViewModeChange = (mode: "units" | "lessons") => {
    console.log(`Changing view mode to: ${mode}`);
    setViewMode(mode);
    localStorage.setItem("units_view_mode", mode);
  };

  // Navigate to a lesson
  const handleLessonClick = (unitId: number, lessonId: number) => {
    router.push(`/learning/${unitId}/${lessonId}`);
  };

  const handleCompactViewChange = (value: boolean) => {
    setIsCompactView(value);
    localStorage.setItem("units_compact_view", value ? "true" : "false");
  };

  // Change layout
  const handleLayoutChange = (newLayout: "list" | "grid") => {
    setLayout(newLayout);
    localStorage.setItem("units_layout_preference", newLayout);
  };

  // Initial loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-brand-purple">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Préparation de votre parcours d'apprentissage...</p>
      </div>
    );
  }

  // Error handling
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            onClick={loadUnits}
            className="ml-4 bg-gradient-to-r from-brand-purple to-brand-gold text-white hover:opacity-90"
          >
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <div className="sticky top-8 z-50 p-6">
        <LearningJourney
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          availableLevels={availableLevels}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onContentTypeChange={handleContentTypeChange}
          isCompactView={isCompactView}
          onCompactViewChange={handleCompactViewChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6 py-4">
          {/* Units display (default mode) */}
          {viewMode === "units" && filteredUnits.length > 0 && (
            <div className="relative bg-transparent rounded-lg p-6 shadow-sm border border-purple-100">
              {/* Use level grouping */}
              {groupUnitsByLevel(filteredUnits).map((levelGroup) => (
                <div key={levelGroup.level} className="mb-12 last:mb-0">
                  {/* Level header with progression */}
                  <div className="flex items-center mb-6">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h2 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-transparent bg-clip-text">
                          Niveau {levelGroup.level}
                        </h2>

                        <div className="flex items-center ml-4">
                          <Badge className="bg-purple-100 text-purple-800 font-medium">
                            {levelGroup.units.length} unités
                          </Badge>

                          <div className="flex items-center ml-3">
                            <span className="text-sm text-muted-foreground mr-2">
                              {calculateLevelProgress(levelGroup.units)}%
                            </span>
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                style={{ width: `${calculateLevelProgress(levelGroup.units)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-400/20 ml-4"></div>
                  </div>

                  {/* Display level units */}
                  <div className="space-y-6">
                    {levelGroup.units.map((unit) => (
                      <div key={unit.id} className="mb-8 last:mb-0">
                        {/* Main unit card - without repeating level */}
                        <Card
                          className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => loadLessonsForUnit(unit.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium">{unit.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {loadedUnitsRef.current.has(unit.id) && unit.lessons.length > 0
                                      ? `${unit.lessons.length} leçons disponibles`
                                      : "Cliquez pour afficher les leçons"
                                    }
                                  </p>
                                </div>
                              </div>

                              <div>
                                {unitProgressData[unit.id] && (
                                  <div className="flex items-center text-sm">
                                    <span className="text-muted-foreground mr-2">Progression:</span>
                                    <span className="font-medium">
                                      {unitProgressData[unit.id].completion_percentage}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>


                          </CardContent>
                        </Card>

                        {/* Unit lessons (if loaded) */}
                        {loadedUnitsRef.current.has(unit.id) && unit.lessons.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {unit.lessons.map(lesson => (
                              <Card
                                key={lesson.id}
                                className={`cursor-pointer hover:shadow-md transition-shadow ${lesson.status === 'completed'
                                  ? 'border-l-4 border-purple-500'
                                  : lesson.status === 'in_progress'
                                    ? 'border-l-4 border-amber-500'
                                    : ''
                                  }`}
                                onClick={() => handleLessonClick(unit.id, lesson.id)}
                              >
                                <CardContent className={isCompactView ? 'p-2' : 'p-4'}>
                                  {isCompactView ? (
                                    // Vue compacte
                                    <div className="flex items-center gap-2 justify-between">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${lesson.status === 'completed'
                                          ? 'bg-green-100'
                                          : 'bg-purple-100'
                                          }`}>
                                          {lesson.status === 'completed'
                                            ? <CheckCircle className="h-3 w-3 text-green-600" />
                                            : <BookOpen className="h-3 w-3 text-purple-600" />
                                          }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
                                        </div>
                                      </div>
                                      {lesson.status && (
                                        <Badge className={`text-xs ${lesson.status === 'completed'
                                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                                          : lesson.status === 'in_progress'
                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                            : 'bg-gray-100 text-gray-800'
                                          }`}>
                                          {lesson.status === 'completed' ? 'Terminé' : lesson.status === 'in_progress' ? 'En cours' : ''}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    // Vue normale (existante)
                                    <div className="flex items-start gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${lesson.status === 'completed'
                                        ? 'bg-green-100'
                                        : 'bg-purple-100'
                                        }`}>
                                        {lesson.status === 'completed'
                                          ? <CheckCircle className="h-5 w-5 text-green-600" />
                                          : <BookOpen className="h-5 w-5 text-purple-600" />
                                        }
                                      </div>
                                      <div>
                                        <h4 className="font-medium">{lesson.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                          <Badge variant="outline" className="text-xs">
                                            {lesson.lesson_type}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {lesson.estimated_duration} min
                                          </span>

                                          {lesson.status === 'in_progress' && (
                                            <Badge className="bg-amber-100 text-amber-800">
                                              En cours
                                            </Badge>
                                          )}

                                          {lesson.status === 'completed' && (
                                            <Badge className="bg-purple-100 text-purple-800">
                                              Terminé
                                            </Badge>
                                          )}
                                        </div>


                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lessons display (when in lessons view mode) */}
          {viewMode === "lessons" && (
            <div className="relative bg-transparent rounded-lg p-6 shadow-sm border border-purple-100">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-400 text-transparent bg-clip-text">
                  Leçons {contentTypeFilter !== "all" && `de type "${contentTypeFilter}"`}
                </h2>
              </div>

              {/* Utiliser AllLessonsView avec les props correctes */}
              <AllLessonsView
                levelFilter={levelFilter}
                contentTypeFilter={contentTypeFilter}
                isCompactView={isCompactView}
                layout={layout}
              />
            </div>
          )}

          {/* Message if no units are available */}
          {filteredUnits.length === 0 && viewMode === "units" && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold mt-4 bg-gradient-to-r from-brand-purple to-brand-gold text-transparent bg-clip-text">
                  Démarrez votre parcours
                </h3>
                <p className="text-muted-foreground mt-2">
                  Votre parcours d'apprentissage apparaîtra ici une fois que des unités seront disponibles.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}