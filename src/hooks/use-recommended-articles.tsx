import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "./use-articles";

export const useRecommendedArticles = (limit = 5, categoryId?: string, excludeArticleId?: string) => {
  return useQuery({
    queryKey: ["recommended-articles", limit, categoryId, excludeArticleId],
    queryFn: async () => {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      let query = supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          content,
          image_url,
          published_at,
          created_at,
          updated_at,
          reading_time,
          views_count,
          likes_count,
          shares_count,
          tags,
          author,
          author_id,
          category_id,
          categories:category_id (
            id,
            name,
            slug,
            color,
            description
          )
        `)
        .eq("published", true)
        .gte("published_at", sevenDaysAgoISO);

      // Filter by category if provided
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      // Exclude current article if provided
      if (excludeArticleId) {
        query = query.neq("id", excludeArticleId);
      }

      const { data, error } = await query
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Enrich with public author profiles
      const authorIds = Array.from(new Set((data || []).map((a: any) => a.author_id).filter(Boolean)));
      let authorsMap = new Map<string, { username: string; full_name: string | null }>();
      
      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from("public_profiles")
          .select("id, username, full_name")
          .in("id", authorIds as string[]);
        
        (authors || []).forEach((p: any) => {
          authorsMap.set(p.id, { username: p.username, full_name: p.full_name });
        });
      }

      const articles = (data || []).map((a: any) => {
        const author = a.author_id ? authorsMap.get(a.author_id) : undefined;
        return {
          ...a,
          public_profiles: author,
          profiles: author,
        };
      });

      return articles as Article[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};
