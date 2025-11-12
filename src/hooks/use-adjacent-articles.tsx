import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdjacentArticle {
  slug: string;
  title: string;
}

interface AdjacentArticlesResult {
  previousArticle: AdjacentArticle | null;
  nextArticle: AdjacentArticle | null;
}

export function useAdjacentArticles(
  currentArticleId: string | undefined,
  categoryId: string | undefined
) {
  return useQuery<AdjacentArticlesResult>({
    queryKey: ["adjacent-articles", currentArticleId, categoryId],
    queryFn: async () => {
      if (!currentArticleId || !categoryId) {
        return { previousArticle: null, nextArticle: null };
      }

      try {
        // Get current article's date
        const { data: currentArticle } = await supabase
          .from("articles")
          .select("published_at, created_at")
          .eq("id", currentArticleId)
          .single();

        if (!currentArticle) {
          return { previousArticle: null, nextArticle: null };
        }

        const currentDate = currentArticle.published_at || currentArticle.created_at;

        // Get previous article (older) - Type assertion to avoid TS2589
        const prevQuery = (supabase.from("articles") as any).select("slug, title")
          .eq("category_id", categoryId)
          .eq("status", "published")
          .lt("published_at", currentDate)
          .order("published_at", { ascending: false })
          .limit(1);
        
        const { data: prevData } = await prevQuery;

        // Get next article (newer) - Type assertion to avoid TS2589
        const nextQuery = (supabase.from("articles") as any).select("slug, title")
          .eq("category_id", categoryId)
          .eq("status", "published")
          .gt("published_at", currentDate)
          .order("published_at", { ascending: true })
          .limit(1);

        const { data: nextData } = await nextQuery;

        return {
          previousArticle: (prevData && prevData[0]) || null,
          nextArticle: (nextData && nextData[0]) || null,
        };
      } catch (error) {
        console.error("Error fetching adjacent articles:", error);
        return { previousArticle: null, nextArticle: null };
      }
    },
    enabled: !!currentArticleId && !!categoryId,
  });
}
