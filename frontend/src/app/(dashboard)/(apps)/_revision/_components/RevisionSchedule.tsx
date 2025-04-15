// frontend/src/app/(dashboard)/(apps)/revision/_components/RevisionSchedule.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Brain, CheckCircle2, AlertCircle, Loader2, Plus } from "lucide-react";
import { RevisionSession } from "@/addons/revision/types/revision";
import { revisionApi } from '@/services/revisionAPI';

function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isPast(date) && !isToday(date)) return "Overdue";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function getBadgeVariant(session: RevisionSession): "default" | "secondary" | "destructive" {
  if (session.status === 'COMPLETED') return "secondary";
  if (isPast(new Date(session.scheduled_date)) && !isToday(new Date(session.scheduled_date))) {
    return "destructive";
  }
  return "default";
}

export default function RevisionSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: () => revisionApi.createRevisionSession({
      scheduled_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisionSessions'] });
      toast({
        title: "Success",
        description: "New revision session created"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create revision session"
      });
    }
  });

  // Fetch revision sessions
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['revisionSessions'],
    queryFn: revisionApi.getRevisionSessions,
    enabled: isAuthenticated, // Only fetch if authenticated
    retry: false // Don't retry on 401
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: (params: { id: number; successRate: number }) => 
      revisionApi.completeRevisionSession(params.id, params.successRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisionSessions'] });
      toast({
        title: "Session marked as complete",
        description: "Your progress has been updated"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update session status"
      });
    }
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-600">Please log in to view your revision schedule</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load revision schedule</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = sessions?.length ?? 0;
  const completedItems = sessions?.filter(item => item.status === 'COMPLETED').length ?? 0;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-sky-600" />
              Revision Progress
            </div>
            <Button
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{completedItems} completed</span>
              <span>{totalItems - completedItems} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule List */}
      <div className="space-y-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <Card 
              key={session.id} 
              className={session.status === 'COMPLETED' ? "opacity-60" : ""}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        Revision Session {session.id}
                      </h3>
                      <Badge variant={getBadgeVariant(session)}>
                        {session.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {formatDueDate(session.scheduled_date)}
                      </Badge>
                    </div>
                    {session.flashcards && (
                      <p className="text-sm text-gray-600">
                        {session.flashcards.length} cards to review
                      </p>
                    )}
                    {session.status !== 'COMPLETED' && session.due_date && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => completeSessionMutation.mutate({
                          id: session.id,
                          successRate: 100
                        })}
                        disabled={completeSessionMutation.isPending}
                      >
                        {completeSessionMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                  {session.success_rate !== null && (
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-600">
                        Success Rate
                      </span>
                      <p className="text-lg font-semibold text-sky-600">
                        {session.success_rate}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                No revision sessions scheduled. Create one to get started!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}