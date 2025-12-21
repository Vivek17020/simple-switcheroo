import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface Flashcard {
  id: string;
  title: string;
  front_content: string;
  back_content: string;
  subject: string;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  article_id: string | null;
  generated_by: 'manual' | 'ai';
  source_type: 'article' | 'pyq' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface FlashcardProgress {
  id: string;
  user_id: string;
  flashcard_id: string;
  last_reviewed: string;
  mastery_level: number;
  review_count: number;
}

export const useUPSCFlashcards = (subject?: string) => {
  return useQuery({
    queryKey: ['upsc-flashcards', subject],
    queryFn: async () => {
      let query = supabase
        .from('upsc_flashcards')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (subject) {
        query = query.eq('subject', subject);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Flashcard[];
    },
  });
};

export const useAllFlashcards = () => {
  return useQuery({
    queryKey: ['upsc-flashcards-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsc_flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Flashcard[];
    },
  });
};

export const useCreateFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flashcard: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('upsc_flashcards')
        .insert([flashcard])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcards-admin'] });
    },
  });
};

export const useUpdateFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Flashcard> & { id: string }) => {
      const { data, error } = await supabase
        .from('upsc_flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcards-admin'] });
    },
  });
};

export const useDeleteFlashcard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('upsc_flashcards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcards-admin'] });
    },
  });
};

export const useFlashcardProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-flashcard-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('upsc_flashcard_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as FlashcardProgress[];
    },
    enabled: !!user?.id,
  });
};

export const useUpdateFlashcardProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ flashcard_id, mastery_level }: { flashcard_id: string; mastery_level: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('upsc_flashcard_progress')
        .upsert({
          user_id: user.id,
          flashcard_id,
          mastery_level,
          last_reviewed: new Date().toISOString(),
          review_count: 1,
        }, { onConflict: 'user_id,flashcard_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-flashcard-progress'] });
    },
  });
};
