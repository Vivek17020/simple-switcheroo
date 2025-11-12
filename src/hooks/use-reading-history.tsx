import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const useReadingHistory = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["reading-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_reading_history")
        .select(`
          *,
          articles:article_id (
            id,
            title,
            slug,
            image_url,
            published_at,
            category_id,
            categories:category_id (
              name,
              slug,
              color
            )
          )
        `)
        .eq("user_id", user.id)
        .order("read_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useTrackReading = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      articleId, 
      duration = 0, 
      percentage = 0 
    }: {
      articleId: string;
      duration?: number;
      percentage?: number;
    }) => {
      const ipAddress = await fetch('https://api.ipify.org?format=text', {
        signal: AbortSignal.timeout(3000),
      })
        .then(response => response.ok ? response.text() : null)
        .catch(() => null);

      const { error } = await supabase
        .from("user_reading_history")
        .upsert({
          user_id: user?.id || null,
          article_id: articleId,
          ip_address: ipAddress,
          reading_duration: duration,
          read_percentage: percentage,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,article_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-history"] });
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user) {
        // For guest users, try to get by IP
        const ipAddress = await fetch('https://api.ipify.org?format=text', {
          signal: AbortSignal.timeout(3000),
        })
          .then(response => response.ok ? response.text() : null)
          .catch(() => null);
          
        if (!ipAddress) return null;
        
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("ip_address", ipAddress)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};