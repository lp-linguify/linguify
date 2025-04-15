// src/app/(dashboard)/(apps)/progress/_components/RecentActivityList.tsx
"use client";

import React from 'react';
import { format } from 'date-fns';
import { BookOpen, BookText, GraduationCap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserProgress } from "../../../app/(dashboard)/_components/user-progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecentActivityListProps } from '@/addons/progress/types/';

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No recent activity found</p>
        </CardContent>
      </Card>
    );
  }

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
      return 'just now';
    }
  };

  // Get appropriate icon for content type
  const getContentIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'unit':
        return <BookOpen className="h-4 w-4" />;
      case 'lesson':
        return <GraduationCap className="h-4 w-4" />;
      case 'contentlesson':
      case 'theory':
      case 'vocabulary':
      case 'grammar':
        return <BookText className="h-4 w-4" />;
      default:
        return <BookText className="h-4 w-4" />;
    }
  };

  // Get appropriate color for badge based on status
  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default'; // Using default as success
      case 'in_progress':
        return 'secondary'; // Using secondary as warning
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-8">
            {activities.map((activity) => (
              <div key={`${activity.content_details.content_type}-${activity.id}`} className="flex">
                <div className="flex-shrink-0 mr-4">
                  <Avatar className="h-9 w-9 border border-muted">
                    <AvatarFallback className="bg-primary/10">
                      {getContentIcon(activity.content_details.content_type)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {activity.content_details.title_en}
                        </h3>
                        <Badge variant={getStatusColor(activity.status)}>
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.content_details.content_type.charAt(0).toUpperCase() + 
                         activity.content_details.content_type.slice(1)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      <time title={format(new Date(activity.last_accessed), 'PPpp')}>
                        {getRelativeTime(activity.last_accessed)}
                      </time>
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};