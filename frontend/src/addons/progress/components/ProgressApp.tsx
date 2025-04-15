"use client";

import React, { useState, useEffect } from "react";
import ProgressDashboard from "./ProgressDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { progressService } from "@/addons/progress/api/progressAPI";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import VocabularyProgress from "./VocabularyProgress";

const ProgressApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("course");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Add a small delay to ensure any auth processes complete first
        await new Promise(resolve => setTimeout(resolve, 500));

        // Pre-fetch summary data to check if API is working and data exists
        const summary = await progressService.getSummary()
          .catch(err => {
            console.error("Failed to retrieve summary data", err);

            // If the error is a 404, attempt to initialize the data
            if (err.response && err.response.status === 404) {
              return null; // No existing data
            }

            // For auth errors, don't treat as fatal, just return null
            if (err.response && err.response.status === 401) {
              console.warn("Authentication issues detected - will retry automatically");
              return null;
            }

            throw err; // Propagate other errors
          });

        // If no summary data, try to initialize if possible
        if (!summary || !summary.summary) {
          try {
            await progressService.initializeProgress();
            toast({
              title: "Data Initialized",
              description: "Your progress tracking data has been initialized.",
              duration: 3000,
            });
          } catch (initErr: any) {
            // If initialization fails due to auth, just continue silently
            if (initErr.response?.status !== 401) {
              throw initErr;
            }
          }
        }

        setError(null);
      } catch (err) {
        console.error("Failed to initialize progress data:", err);

        // Handle different error types
        const error = err as { response?: { status?: number } };

        if (error.response?.status === 403) {
          setError("You don't have permission to access this resource.");
        } else {
          setError("Could not connect to the progress service. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [toast]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-4">
              <span>{error}</span>
              <Button onClick={handleRetry} variant="outline" className="self-start">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="course" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="course">Course Progress</TabsTrigger>
            <TabsTrigger value="vocabulary">Vocabulary Revision</TabsTrigger>
          </TabsList>

          <TabsContent value="course" className="mt-6">
            <ProgressDashboard />
          </TabsContent>

          <TabsContent value="vocabulary" className="mt-6">
            <VocabularyProgress />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProgressApp;