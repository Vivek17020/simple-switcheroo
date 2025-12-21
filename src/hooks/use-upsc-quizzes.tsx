import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subject: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  questions: QuizQuestion[];
  is_published: boolean;
  is_daily_quiz: boolean;
  quiz_date: string | null;
  attempt_count: number;
  avg_score: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string | null;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  max_score: number;
  percentage: number;
  answers: UserAnswer[];
  is_completed: boolean;
}

export interface UserAnswer {
  question_id: string;
  selected_option: number | null;
  is_correct: boolean;
  time_spent: number;
}

export const useUPSCQuizzes = (category?: string) => {
  return useQuery({
    queryKey: ['upsc-quizzes', category],
    queryFn: async () => {
      let query = supabase
        .from('upsc_quizzes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(quiz => ({
        ...quiz,
        questions: quiz.questions as unknown as QuizQuestion[]
      })) as Quiz[];
    },
  });
};

export const useQuiz = (quizId: string | undefined) => {
  return useQuery({
    queryKey: ['upsc-quiz', quizId],
    queryFn: async () => {
      if (!quizId) return null;
      
      const { data, error } = await supabase
        .from('upsc_quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        questions: data.questions as unknown as QuizQuestion[]
      } as Quiz;
    },
    enabled: !!quizId,
  });
};

export const useDailyQuiz = () => {
  return useQuery({
    queryKey: ['upsc-daily-quiz'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('upsc_quizzes')
        .select('*')
        .eq('is_daily_quiz', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        questions: data.questions as unknown as QuizQuestion[]
      } as Quiz;
    },
  });
};

export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (attempt: Omit<QuizAttempt, 'id' | 'created_at'>) => {
      const insertData = {
        quiz_id: attempt.quiz_id,
        user_id: user?.id || null,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        time_taken_seconds: attempt.time_taken_seconds,
        total_questions: attempt.total_questions,
        attempted: attempt.attempted,
        correct: attempt.correct,
        incorrect: attempt.incorrect,
        skipped: attempt.skipped,
        score: attempt.score,
        max_score: attempt.max_score,
        percentage: attempt.percentage,
        answers: JSON.parse(JSON.stringify(attempt.answers)),
        is_completed: attempt.is_completed,
      };
      
      const { data, error } = await supabase
        .from('upsc_quiz_attempts')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-quiz-attempts'] });
    },
  });
};

export const useUserQuizAttempts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-quiz-attempts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('upsc_quiz_attempts')
        .select('*, upsc_quizzes(title, category, subject)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};
