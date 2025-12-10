import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  xp_required: number;
  criteria: Record<string, any> | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export const useStudyStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-study-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('upsc_study_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as StudyStreak | null;
    },
    enabled: !!user?.id,
  });
};

export const useBadges = () => {
  return useQuery({
    queryKey: ['upsc-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsc_badges')
        .select('*')
        .order('xp_required', { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
  });
};

export const useUserBadges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upsc-user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('upsc_user_badges')
        .select(`
          *,
          badge:upsc_badges(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user?.id,
  });
};

export const useUpdateStreak = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check if streak exists
      const { data: existing } = await supabase
        .from('upsc_study_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        // Create new streak
        const { data, error } = await supabase
          .from('upsc_study_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            total_xp: 5,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Update existing streak
      const lastDate = existing.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = existing.current_streak;
      let xpToAdd = 5;

      if (lastDate === today) {
        // Already updated today
        return existing;
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        newStreak = existing.current_streak + 1;
        xpToAdd = 10 + (newStreak >= 7 ? 5 : 0); // Bonus XP for 7+ streak
      } else {
        // Streak broken
        newStreak = 1;
      }

      const { data, error } = await supabase
        .from('upsc_study_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(existing.longest_streak, newStreak),
          last_activity_date: today,
          total_xp: existing.total_xp + xpToAdd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsc-study-streak'] });
    },
  });
};

export const useUPSCStats = () => {
  const { user } = useAuth();
  const { data: streak } = useStudyStreak();
  const { data: badges } = useUserBadges();

  return useQuery({
    queryKey: ['upsc-user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get completed articles count
      const { count: articlesCompleted } = await supabase
        .from('upsc_user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get bookmarks count
      const { count: bookmarksCount } = await supabase
        .from('upsc_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get quiz attempts
      const { data: quizAttempts } = await supabase
        .from('upsc_quiz_attempts')
        .select('score, percentage')
        .eq('user_id', user.id);

      const totalQuizzes = quizAttempts?.length || 0;
      const avgScore = totalQuizzes > 0 
        ? Math.round(quizAttempts!.reduce((acc, q) => acc + (q.percentage || 0), 0) / totalQuizzes)
        : 0;

      return {
        articlesCompleted: articlesCompleted || 0,
        bookmarksCount: bookmarksCount || 0,
        totalQuizzes,
        avgScore,
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        totalXp: streak?.total_xp || 0,
        badgesEarned: badges?.length || 0,
      };
    },
    enabled: !!user?.id,
  });
};
