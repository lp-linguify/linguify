// src/app/(dashboard)/(apps)/progress/_components/ProgressDashboard.tsx
// Fixed version with null checking for content_details

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Sparkles, BookOpen, Award, Calendar, ArrowUp, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserProgress } from "../../../app/(dashboard)/_components/user-progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { progressService } from "@/addons/progress/api/progressAPI";
import { 
  ProgressSummary, 
  UnitProgress, 
  RecentActivity, 
} from '@/addons/progress/types/';

// Interface pour les données d'activité du graphique
interface ActivityChartData {
  date: string;
  xp: number;
  minutes: number;
}

// Define a new component for the activity chart
interface ActivityChartProps {
  data: ActivityChartData[];
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'xp' | 'minutes'>('xp');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Learning Activity</CardTitle>
          <Select value={metric} onValueChange={(value: 'xp' | 'minutes') => setMetric(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xp">XP Earned</SelectItem>
              <SelectItem value="minutes">Time Spent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>Your learning activity over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {metric === 'xp' && (
                <Area 
                  type="monotone" 
                  dataKey="xp" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorXp)" 
                />
              )}
              {metric === 'minutes' && (
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#82ca9d" 
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Achievement Card component
interface AchievementCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ title, value, icon, description, color }) => (
  <Card className={`border-l-4 ${color}`}>
    <CardContent className="p-6 flex items-center">
      <div className={`mr-4 p-2 rounded-full ${color.replace('border', 'bg')} bg-opacity-20`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

  

// Format relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

// Transformation des données d'activité pour le graphique
const transformActivityData = (activities: RecentActivity[]): ActivityChartData[] => {
  // Format pour le graphique: { date: string, xp: number, minutes: number }
  // Créer un Map pour regrouper par date
  const activityMap = new Map<string, ActivityChartData>();

  // Les 7 derniers jours
  const dateFormat = (date: Date): string => `${date.getMonth() + 1}/${date.getDate()}`;
  
  // Initialiser avec les 7 derniers jours
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    activityMap.set(dateFormat(date), { date: dateFormat(date), xp: 0, minutes: 0 });
  }
  
  // Ajouter les données réelles
  if (activities && activities.length > 0) {
    activities.forEach(activity => {
      const activityDate = new Date(activity.last_accessed);
      const dateKey = dateFormat(activityDate);
      
      if (activityMap.has(dateKey)) {
        const current = activityMap.get(dateKey)!;
        // Ajouter XP et minutes si disponibles dans les données
        current.xp += activity.xp_earned || 0;
        current.minutes += activity.time_spent ? Math.floor(activity.time_spent / 60) : 0;
        activityMap.set(dateKey, current);
      }
    });
  }
  
  // Convertir le Map en array pour le graphique
  return Array.from(activityMap.values());
};

// Get the appropriate icon for content type with null checking
const getContentTypeIcon = (contentDetails: any) => {
  // Check if contentDetails exists and has content_type property
  if (!contentDetails || !contentDetails.content_type) {
    return <FileText className="h-5 w-5 text-primary" />;
  }

  // Return appropriate icon based on content type
  switch (contentDetails.content_type.toLowerCase()) {
    case 'lesson':
      return <BookOpen className="h-5 w-5 text-primary" />;
    default:
      return <FileText className="h-5 w-5 text-primary" />;
  }
};

interface WeeklyProgressData {
  units: number;
  lessons: number;
  time: string;
  xp: number;
}

const ProgressDashboard: React.FC = () => {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [unitsByLevel, setUnitsByLevel] = useState<Record<string, UnitProgress[]>>({});
  const [activityData, setActivityData] = useState<ActivityChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Récupérer les données réelles du backend
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données de résumé
        const summaryData = await progressService.getSummary();
        setSummary(summaryData);
        
        // Si pas de données, initialiser la progression
        if (!summaryData || !summaryData.summary) {
          const initialized = await progressService.initializeProgress();
          if (initialized) {
            // Récupérer à nouveau après initialisation
            const newSummaryData = await progressService.getSummary();
            setSummary(newSummaryData);
          }
        }

        // Récupérer les unités par niveau
        const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
        const unitsData: Record<string, UnitProgress[]> = {};
        
        for (const level of levels) {
          try {
            const levelUnits = await progressService.getUnitProgressByLevel(level);
            if (levelUnits && levelUnits.length > 0) {
              unitsData[level] = levelUnits;
            }
          } catch (err) {
            console.warn(`Failed to fetch units for level ${level}:`, err);
          }
        }
        
        setUnitsByLevel(unitsData);
        
        // Transformer les données d'activité récente pour le graphique
        if (summaryData && summaryData.recent_activity) {
          const chartData = transformActivityData(summaryData.recent_activity);
          setActivityData(chartData);
        }
      } catch (err) {
        console.error("Failed to fetch progress data:", err);
        setError("We couldn't load your progress data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Learning Progress</h1>
        
        {/* Loading skeleton for stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeleton for charts */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your Learning Progress</h1>
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!summary || !summary.summary) {
    return (
      <div className="text-center p-6">
        <p className="text-lg text-gray-500">No progress data available yet. Start learning to see your progress!</p>
        <Button className="mt-4" onClick={() => progressService.initializeProgress().then(() => window.location.reload())}>
          Initialize Progress
        </Button>
      </div>
    );
  }

  const { 
    total_units, 
    completed_units, 
    total_lessons, 
    completed_lessons,
    total_time_spent_minutes,
    xp_earned
  } = summary.summary;

  const unitCompletionPercentage = total_units > 0 
    ? Math.round((completed_units / total_units) * 100) 
    : 0;
    
  const lessonCompletionPercentage = total_lessons > 0 
    ? Math.round((completed_lessons / total_lessons) * 100) 
    : 0;

  // Format time spent into hours and minutes
  const formatTimeSpent = (): string => {
    const hours = Math.floor(total_time_spent_minutes / 60);
    const minutes = Math.round(total_time_spent_minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calcul du progrès hebdomadaire (simpliste, peut être amélioré)
  const calculateWeeklyProgress = (): WeeklyProgressData => {
    if (!summary.recent_activity || summary.recent_activity.length === 0) {
      return {
        units: 0,
        lessons: 0,
        time: '0m',
        xp: 0
      };
    }

    // Filtrer les activités de la semaine passée
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyActivities = summary.recent_activity.filter(
      activity => new Date(activity.last_accessed) > oneWeekAgo
    );
    
    // Compter les unités et leçons complétées cette semaine
    const completedThisWeek = weeklyActivities.filter(a => a.status === 'completed');
    
    // Make sure content_details exists before attempting to access properties
    const unitsThisWeek = new Set(completedThisWeek
      .filter(a => a.content_details && a.content_details.content_type === 'unit')
      .map(a => a.content_details?.id)
    ).size;
    
    const lessonsThisWeek = new Set(completedThisWeek
      .filter(a => a.content_details && a.content_details.content_type === 'lesson')
      .map(a => a.content_details?.id)
    ).size;
    
    // Calculer le temps et XP
    const timeThisWeek = weeklyActivities.reduce((sum, a) => sum + (a.time_spent || 0), 0) / 60;
    const xpThisWeek = weeklyActivities.reduce((sum, a) => sum + (a.xp_earned || 0), 0);
    
    // Formater le temps
    const hours = Math.floor(timeThisWeek / 60);
    const minutes = Math.round(timeThisWeek % 60);
    const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return {
      units: unitsThisWeek,
      lessons: lessonsThisWeek,
      time: formattedTime,
      xp: xpThisWeek
    };
  };

  const weeklyProgress = calculateWeeklyProgress();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Learning Progress</h1>
      
      {/* Quick Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Units Completed
                </div>
                <div className="text-2xl font-bold">{completed_units}/{total_units}</div>
                {weeklyProgress.units > 0 && (
                  <div className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{weeklyProgress.units} this week
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Lessons Completed
                </div>
                <div className="text-2xl font-bold">
                  {completed_lessons}/{total_lessons}
                </div>
                {weeklyProgress.lessons > 0 && (
                  <div className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{weeklyProgress.lessons} this week
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Time Spent
                </div>
                <div className="text-2xl font-bold">{formatTimeSpent()}</div>
                {weeklyProgress.time !== '0m' && (
                  <div className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{weeklyProgress.time} this week
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  XP Earned
                </div>
                <div className="text-2xl font-bold">{xp_earned}</div>
                {weeklyProgress.xp > 0 && (
                  <div className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{weeklyProgress.xp} this week
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements basés sur les données réelles */}
      {summary.level_progression && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* Montrer l'accomplissement A1 s'il est complet */}
          {summary.level_progression.A1 && summary.level_progression.A1.avg_completion === 100 && (
            <AchievementCard 
              title="A1 Mastery" 
              value="100%" 
              icon={<Award className="h-6 w-6 text-yellow-500" />}
              description="You've completed all A1 level units!" 
              color="border-yellow-500"
            />
          )}
          
          {/* Montrer l'accomplissement de streak si des données récentes existent */}
          {summary.recent_activity && summary.recent_activity.length > 0 && (
            <AchievementCard 
              title="Learning Streak" 
              value="Active" 
              icon={<Calendar className="h-6 w-6 text-blue-500" />}
              description="You've been learning recently!" 
              color="border-blue-500"
            />
          )}
          
          {/* Montrer le vocabulaire si xp > 0 */}
          {xp_earned > 0 && (
            <AchievementCard 
              title="XP Earned" 
              value={`${xp_earned} XP`} 
              icon={<BookOpen className="h-6 w-6 text-green-500" />}
              description="Total experience points earned" 
              color="border-green-500"
            />
          )}
        </div>
      )}

      {/* Graphique d'activité */}
      {activityData.length > 0 && (
        <ActivityChart data={activityData} />
      )}

      {/* Tabs for detailed progress */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="levels">Level Progress</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overall Unit Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <UserProgress 
                  value={unitCompletionPercentage} 
                  label={`${completed_units} of ${total_units} units completed`}
                  size="md"
                  showIcon={true}
                  animated={true}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overall Lesson Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <UserProgress 
                  value={lessonCompletionPercentage} 
                  label={`${completed_lessons} of ${total_lessons} lessons completed`}
                  size="md"
                  showIcon={true}
                  animated={true}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Language Level Journey</CardTitle>
              <CardDescription>Your progress through each language proficiency level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(summary.level_progression || {}).map(([level, data]) => (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">{level}</Badge>
                        <span className="font-medium">Level {level}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {data.completed_units}/{data.total_units} units
                      </span>
                    </div>
                    <UserProgress 
                      value={data.avg_completion} 
                      size="sm"
                      animated={true}
                      showIcon={data.avg_completion === 100}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress by Level</CardTitle>
              <CardDescription>Units completed across different language levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(summary.level_progression || {}).map(([level, data]) => ({
                      level,
                      "Completed": data.completed_units,
                      "In Progress": data.in_progress_units,
                      "Not Started": data.total_units - (data.completed_units + data.in_progress_units),
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barSize={35}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Completed" stackId="a" fill="#4ade80" />
                    <Bar dataKey="In Progress" stackId="a" fill="#facc15" />
                    <Bar dataKey="Not Started" stackId="a" fill="#e5e7eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        
          {/* Afficher les unités par niveau quand disponibles */}
          {Object.entries(unitsByLevel).map(([level, units]) => (
            <Card key={level}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Badge variant="outline" className="mr-2">{level}</Badge>
                  Level {level} Units
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {units.map(unit => (
                    <div key={unit.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{unit.unit_details.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {unit.lesson_progress_count.completed}/{unit.lesson_progress_count.total} lessons
                          </p>
                        </div>
                        <Badge variant={unit.status === 'completed' ? 'default' : unit.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {unit.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <UserProgress 
                        value={unit.completion_percentage} 
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.recent_activity && summary.recent_activity.length > 0 ? (
                <div className="space-y-8">
                  {summary.recent_activity.map((activity) => (
                    <div key={`activity-${activity.id}`} className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          {getContentTypeIcon(activity.content_details)}
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">
                                {activity.content_details?.title_en || "Unknown Activity"}
                              </h3>
                              <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                                {activity.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.content_details?.content_type 
                                ? (activity.content_details.content_type.charAt(0).toUpperCase() + 
                                   activity.content_details.content_type.slice(1))
                                : "Unknown Type"}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getRelativeTime(activity.last_accessed)}
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <UserProgress 
                            value={activity.completion_percentage} 
                            size="sm"
                            showIcon={activity.completion_percentage === 100}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">No recent activity recorded. Start learning to see your progress!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressDashboard;