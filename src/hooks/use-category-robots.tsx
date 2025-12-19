import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MINIMUM_ARTICLES_FOR_INDEX = 3;

interface UseCategoryRobotsResult {
  articleCount: number;
  isLoading: boolean;
  shouldIndex: boolean;
  robotsContent: string;
}

/**
 * Hook to determine robots meta tag based on published article count in a category.
 * Returns noindex if fewer than 3 articles, index if 3 or more.
 * 
 * @param categoryId - The category UUID to check
 * @param includeSubcategories - Whether to include subcategory article counts
 */
export function useCategoryRobots(
  categoryId?: string,
  includeSubcategories = false
): UseCategoryRobotsResult {
  const { data, isLoading } = useQuery({
    queryKey: ["category-article-count", categoryId, includeSubcategories],
    queryFn: async () => {
      if (!categoryId) return { count: 0 };

      let categoryIds = [categoryId];

      // If including subcategories, fetch them
      if (includeSubcategories) {
        const { data: subcategories } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", categoryId);

        if (subcategories?.length) {
          categoryIds = [...categoryIds, ...subcategories.map((s) => s.id)];
        }
      }

      const { count, error } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .in("category_id", categoryIds)
        .eq("published", true);

      if (error) throw error;
      return { count: count || 0 };
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const articleCount = data?.count || 0;
  const shouldIndex = articleCount >= MINIMUM_ARTICLES_FOR_INDEX;

  return {
    articleCount,
    isLoading,
    shouldIndex,
    robotsContent: shouldIndex ? "index, follow" : "noindex, follow",
  };
}
