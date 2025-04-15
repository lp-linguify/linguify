import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionApi } from '@/services/revisionAPI';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';

export default function VocabularyRevision() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dueWords = [], isLoading } = useQuery({
    queryKey: ['dueVocabulary'],
    queryFn: () => revisionApi.getDueVocabulary(10)
  });

  const markReviewedMutation = useMutation({
    mutationFn: (params: { id: number; success: boolean }) => 
      revisionApi.markWordReviewed(params.id, params.success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dueVocabulary'] });
      toast({
        title: "Progress saved",
        description: "Your revision progress has been updated"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progress"
      });
    }
  });

  const handleReview = async (success: boolean) => {
    if (dueWords.length === 0) return;
    
    const currentWord = dueWords[currentWordIndex];
    await markReviewedMutation.mutate({ id: currentWord.id, success });
    
    if (currentWordIndex < dueWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setShowTranslation(false);
    } else {
      toast({
        title: "Session complete!",
        description: "You've reviewed all due words for now."
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dueWords.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
            <p className="text-gray-600">No words due for revision right now.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentWord = dueWords[currentWordIndex];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Revision Session</span>
          <span className="text-sm text-gray-500">
            {currentWordIndex + 1} / {dueWords.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6 text-center py-8">
          <div className="text-2xl font-semibold">{currentWord.word}</div>
          
          {showTranslation ? (
            <div className="text-xl text-blue-600">{currentWord.translation}</div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setShowTranslation(true)}
              className="min-w-[150px]"
            >
              Show Translation
            </Button>
          )}

          {currentWord.context && (
            <div className="text-gray-600 text-sm mt-4 italic">
              Context: {currentWord.context}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="text-red-600"
          onClick={() => handleReview(false)}
          disabled={markReviewedMutation.isPending}
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          Need Review
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {showTranslation ? 'Hide' : 'Show'}
        </Button>

        <Button
          variant="outline"
          className="text-green-600"
          onClick={() => handleReview(true)}
          disabled={markReviewedMutation.isPending}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Know It
        </Button>
      </CardFooter>
    </Card>
  );
}