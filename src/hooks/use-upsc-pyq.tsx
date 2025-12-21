import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface PYQQuestion {
  id: string;
  article_id: string | null;
  section_title: string;
  question_number: number;
  question_type: 'mcq' | 'assertion_reason' | 'match_list' | 'chronological' | 'passage_based';
  question_text: string;
  passage: string | null;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: 'a' | 'b' | 'c' | 'd' | 'unknown' | null;
  explanation: string | null;
  additional_media: { image_urls: string[]; tables: any[] } | null;
  year: number | null;
  exam_name: string | null;
  subject: string | null;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PYQAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  attempted_at: string;
}

export const usePYQQuestions = (filters?: {
  articleId?: string;
  examName?: string;
  year?: number;
  subject?: string;
  isPublished?: boolean;
}) => {
  return useQuery({
    queryKey: ['upsc-pyq-questions', filters],
    queryFn: async () => {
      let query = supabase
        .from('upsc_pyq_questions')
        .select('*')
        .order('section_title')
        .order('question_number');

      if (filters?.articleId) {
        query = query.eq('article_id', filters.articleId);
      }
      if (filters?.examName) {
        query = query.eq('exam_name', filters.examName);
      }
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters?.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PYQQuestion[];
    },
  });
};

export const usePYQQuestion = (id: string) => {
  return useQuery({
    queryKey: ['upsc-pyq-question', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsc_pyq_questions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as PYQQuestion;
    },
    enabled: !!id,
  });
};

export const useCreatePYQQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<PYQQuestion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('upsc_pyq_questions')
        .insert(question)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-pyq-questions'] });
    },
  });
};

export const useUpdatePYQQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PYQQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('upsc_pyq_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-pyq-questions'] });
    },
  });
};

export const useDeletePYQQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('upsc_pyq_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-pyq-questions'] });
    },
  });
};

export const usePYQAttempts = (questionIds?: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-pyq-attempts', user?.id, questionIds],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('upsc_pyq_attempts')
        .select('*')
        .eq('user_id', user.id);

      if (questionIds && questionIds.length > 0) {
        query = query.in('question_id', questionIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PYQAttempt[];
    },
    enabled: !!user?.id,
  });
};

export const useSubmitPYQAttempt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpentSeconds,
    }: {
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      timeSpentSeconds: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('upsc_pyq_attempts')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_spent_seconds: timeSpentSeconds,
          attempted_at: new Date().toISOString(),
        }, { onConflict: 'user_id,question_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-pyq-attempts'] });
    },
  });
};

export const useBulkCreatePYQQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questions: Omit<PYQQuestion, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('upsc_pyq_questions')
        .insert(questions)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-pyq-questions'] });
    },
  });
};
