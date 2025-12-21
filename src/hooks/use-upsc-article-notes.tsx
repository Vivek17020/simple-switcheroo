import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ImportantTerm {
  term: string;
  definition: string;
}

export interface ArticleNote {
  id: string;
  article_id: string;
  title: string;
  subject: string;
  topic: string | null;
  key_points: string[];
  summary: string | null;
  mnemonics: string[];
  important_terms: ImportantTerm[];
  exam_tips: string[];
  related_topics: string[];
  word_count: number;
  reading_time: number;
  generated_by: 'manual' | 'ai';
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to convert DB response to ArticleNote
const parseArticleNote = (data: any): ArticleNote => ({
  ...data,
  important_terms: (data.important_terms as ImportantTerm[]) || [],
  generated_by: data.generated_by as 'manual' | 'ai',
});

export const useArticleNote = (articleId?: string) => {
  return useQuery({
    queryKey: ['upsc-article-note', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      
      const { data, error } = await supabase
        .from('upsc_article_notes')
        .select('*')
        .eq('article_id', articleId)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return data ? parseArticleNote(data) : null;
    },
    enabled: !!articleId,
  });
};

export const useAllArticleNotes = () => {
  return useQuery({
    queryKey: ['upsc-article-notes-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsc_article_notes')
        .select('*, articles(title, slug)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...parseArticleNote(item),
        articles: item.articles as { title: string; slug: string },
      }));
    },
  });
};

export const useCreateArticleNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Omit<ArticleNote, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('upsc_article_notes')
        .insert([{
          ...note,
          important_terms: note.important_terms as unknown as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return parseArticleNote(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-article-notes-admin'] });
    },
  });
};

export const useUpdateArticleNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ArticleNote> & { id: string }) => {
      const dbUpdates: any = { ...updates };
      if (updates.important_terms) {
        dbUpdates.important_terms = updates.important_terms as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('upsc_article_notes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return parseArticleNote(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-article-notes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['upsc-article-note'] });
    },
  });
};

export const useDeleteArticleNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('upsc_article_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-article-notes-admin'] });
    },
  });
};
