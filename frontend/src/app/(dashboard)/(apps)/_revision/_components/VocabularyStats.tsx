import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Brain, Book, Clock, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface LanguageStats {
  code: string;
  name: string;
  count: number;
}

interface ProgressData {
  date: string;
  totalWords: number;
  masteredWords: number;
}

interface AccuracyData {
  date: string;
  correct: number;
  incorrect: number;
  skipped: number;
}

interface ReviewData {
  date: string;
  dueCount: number;
}

interface StatsData {
  totalWords: number;
  masteredWords: number;
  learningProgress: ProgressData[];
  reviewHistory: ReviewData[];
  accuracyByDay: AccuracyData[];
  languageDistribution?: {
    source: LanguageStats[];
    target: LanguageStats[];
  };
}

type TimeRange = 'week' | 'month' | 'year';

const VocabularyStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalWords: 0,
    masteredWords: 0,
    learningProgress: [],
    reviewHistory: [],
    accuracyByDay: [],
    languageDistribution: {
      source: [],
      target: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/revision/vocabulary/stats/?range=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data: StatsData = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Learning Statistics</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded ${
              timeRange === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded ${
              timeRange === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded ${
              timeRange === 'year' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Book className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Words</p>
                <p className="text-2xl font-bold">{stats.totalWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Mastered</p>
                <p className="text-2xl font-bold">{stats.masteredWords}</p>
                <p className="text-sm text-gray-500">
                  {((stats.masteredWords / stats.totalWords) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Learning</p>
                <p className="text-2xl font-bold">
                  {stats.totalWords - stats.masteredWords}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Due for Review</p>
                <p className="text-2xl font-bold">
                  {stats.reviewHistory[stats.reviewHistory.length - 1]?.dueCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.learningProgress}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalWords"
                  stroke="#3B82F6"
                  name="Total Words"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="masteredWords"
                  stroke="#10B981"
                  name="Mastered Words"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Review History Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Review Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.accuracyByDay}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" name="Correct" fill="#10B981" />
                <Bar dataKey="incorrect" name="Incorrect" fill="#EF4444" />
                <Bar dataKey="skipped" name="Skipped" fill="#9CA3AF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Book className="mr-2 h-5 w-5" />
            Words by Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Source Languages</h3>
              <div className="space-y-2">
                {stats.languageDistribution?.source.map((lang: LanguageStats) => (
                  <div key={lang.code} className="flex items-center">
                    <div className="w-24">{lang.name}</div>
                    <div className="flex-1 mx-2">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(lang.count / stats.totalWords) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">{lang.count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Target Languages</h3>
              <div className="space-y-2">
                {stats.languageDistribution?.target.map((lang: LanguageStats) => (
                  <div key={lang.code} className="flex items-center">
                    <div className="w-24">{lang.name}</div>
                    <div className="flex-1 mx-2">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded-full"
                          style={{ width: `${(lang.count / stats.totalWords) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">{lang.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyStats;