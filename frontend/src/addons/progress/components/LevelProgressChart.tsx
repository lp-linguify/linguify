// src/app/(dashboard)/(apps)/progress/_components/LevelProgressChart.tsx
"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LevelProgressChartProps } from "@/addons/progress/types/";

export const LevelProgressChart: React.FC<LevelProgressChartProps> = ({ levelProgression }) => {
  // Transform the level progression data into format recharts can use
  const chartData = Object.entries(levelProgression)
    .filter(([_, data]) => data.total_units > 0) // Only include levels with units
    .map(([level, data]) => ({
      level,
      "Completed": data.completed_units,
      "In Progress": data.in_progress_units,
      "Not Started": data.total_units - (data.completed_units + data.in_progress_units),
      avgCompletion: data.avg_completion,
    }));

  // Sort the data by level
  chartData.sort((a, b) => {
    const levelOrder = { "A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6 };
    return levelOrder[a.level as keyof typeof levelOrder] - levelOrder[b.level as keyof typeof levelOrder];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress by Level</CardTitle>
        <CardDescription>Units completed across different language levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barSize={35}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [`${value} units`, name]}
                labelFormatter={(label) => `Level ${label}`}
              />
              <Legend />
              <Bar dataKey="Completed" stackId="a" fill="#4ade80" />
              <Bar dataKey="In Progress" stackId="a" fill="#facc15" />
              <Bar dataKey="Not Started" stackId="a" fill="#e5e7eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};