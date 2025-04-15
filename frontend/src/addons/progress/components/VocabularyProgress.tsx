// src/app/(dashboard)/(apps)/progress/_components/VocabularyProgress.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Progress
} from "@/components/ui/progress";
import { DashboardStats, AccuracyDay, StatsResponse } from "@/addons/progress/types/";

const VocabularyProgress = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWords: 0,
    masteredWords: 0,
    dueSoon: 0,
    streak: 0,
    todayProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(
        "/api/v1/revision/vocabulary/stats/?range=today"
      );
      if (!response.ok) throw new Error("Failed to fetch statistics");
      const data: StatsResponse = await response.json();

      setStats({
        totalWords: data.totalWords,
        masteredWords: data.masteredWords,
        dueSoon:
          data.reviewHistory[data.reviewHistory.length - 1]?.dueCount || 0,
        streak: calculateStreak(data.accuracyByDay),
        todayProgress: calculateTodayProgress(data.accuracyByDay),
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (accuracyData: AccuracyDay[]): number => {
    return (
      accuracyData?.reduce((streak: number, day: AccuracyDay) => {
        return day.correct > 0 ? streak + 1 : 0;
      }, 0) || 0
    );
  };

  const calculateTodayProgress = (accuracyData: AccuracyDay[]): number => {
    if (!accuracyData?.length) return 0;
    const today = accuracyData[accuracyData.length - 1];
    const total = today.correct + today.incorrect + today.skipped;
    return total > 0 ? Math.round((today.correct / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vocabulary Revision</h1>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Total Words
                </div>
                <div className="text-2xl font-bold">{stats.totalWords}</div>
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
                  Words Mastered
                </div>
                <div className="text-2xl font-bold">
                  {stats.masteredWords}
                </div>
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
                  Due Today
                </div>
                <div className="text-2xl font-bold">{stats.dueSoon}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Day Streak
                </div>
                <div className="text-2xl font-bold">{stats.streak}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-sky-600" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={stats.todayProgress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{stats.todayProgress}% completed</span>
              <span>{stats.dueSoon} words remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyProgress;