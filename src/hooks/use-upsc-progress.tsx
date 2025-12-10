import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface UserProgress {
  id: string;
  user_id: string;
  article_id: string;
  completed_at: string;
  time_spent_seconds: number;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export const useUserProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-user-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('upsc_user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!user?.id,
  });
};

export const useMarkArticleComplete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ article_id, time_spent_seconds = 0 }: { article_id: string; time_spent_seconds?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('upsc_user_progress')
        .upsert({
          user_id: user.id,
          article_id,
          time_spent_seconds,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,article_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-user-progress'] });
    },
  });
};

export const useBookmarks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-bookmarks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('upsc_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!user?.id,
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (article_id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if bookmark exists
      const { data: existing } = await supabase
        .from('upsc_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article_id)
        .maybeSingle();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from('upsc_bookmarks')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('upsc_bookmarks')
          .insert({ user_id: user.id, article_id });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-bookmarks'] });
    },
  });
};

export const useIsBookmarked = (article_id: string) => {
  const { data: bookmarks } = useBookmarks();
  return bookmarks?.some(b => b.article_id === article_id) ?? false;
};

export const useIsCompleted = (article_id: string) => {
  const { data: progress } = useUserProgress();
  return progress?.some(p => p.article_id === article_id) ?? false;
};
