// hooks/useRevision.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionApi } from '@/addons/revision/services/revisionAPI';
import { useToast } from '@/components/ui/use-toast';

export const useVocabularyStats = (range: 'week' | 'month' | 'year' = 'week') => {
  return useQuery({
    queryKey: ['vocabularyStats', range],
    queryFn: () => revisionApi.getVocabularyStats(range),
  });
};

export const useVocabularyWords = (params?: {
  source_language?: string;
  target_language?: string;
}) => {
  return useQuery({
    queryKey: ['vocabularyWords', params],
    queryFn: () => revisionApi.getVocabularyWords(params),
  });
};

export const useDueVocabulary = (limit: number = 10) => {
  return useQuery({
    queryKey: ['dueVocabulary', limit],
    queryFn: () => revisionApi.getDueVocabulary(limit),
  });
};

export const useMarkWordReviewed = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { id: number; success: boolean }) =>
      revisionApi.markWordReviewed(params.id, params.success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dueVocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['vocabularyStats'] });
      toast({
        title: "Progress saved",
        description: "Your revision progress has been updated",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progress",
      });
    },
  });
};