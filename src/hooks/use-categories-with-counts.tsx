import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parent_id: string | null;
  article_count: number;
  subcategories?: CategoryWithCount[];
}

const MIN_ARTICLES_FOR_VISIBILITY = 3;

/**
 * Hook to fetch categories with their published article counts.
 * Returns both all categories and visible categories (those with 3+ articles).
 * Excludes web3forindia and upscbriefs from the main news categories.
 */
export const useCategoriesWithCounts = () => {
  return useQuery({
    queryKey: ["categories-with-counts"],
    queryFn: async () => {
      // Fetch all categories
      const { data: allCategories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (catError) throw catError;

      // Get article counts per category (published only)
      const { data: articleCounts, error: countError } = await supabase
        .from("articles")
        .select("category_id")
        .eq("published", true);

      if (countError) throw countError;

      // Count articles per category
      const countsMap: Record<string, number> = {};
      (articleCounts || []).forEach((article) => {
        countsMap[article.category_id] = (countsMap[article.category_id] || 0) + 1;
      });

      // Add counts to categories
      const categoriesWithCounts: CategoryWithCount[] = (allCategories || []).map((cat) => ({
        ...cat,
        article_count: countsMap[cat.id] || 0,
      }));

      // Organize into parent/child structure
      const parentCategories = categoriesWithCounts.filter((cat) => !cat.parent_id);
      const childCategories = categoriesWithCounts.filter((cat) => cat.parent_id);

      // Attach subcategories to parents
      const organized = parentCategories.map((parent) => ({
        ...parent,
        subcategories: childCategories.filter((child) => child.parent_id === parent.id),
      }));

      // Filter visible categories (3+ articles) and exclude web3/upsc from news
      const excludedSlugs = ["web3forindia", "upscbriefs"];
      
      const visibleCategories = organized
        .filter((cat) => !excludedSlugs.includes(cat.slug))
        .map((cat) => ({
          ...cat,
          subcategories: (cat.subcategories || []).filter(
            (sub) => sub.article_count >= MIN_ARTICLES_FOR_VISIBILITY
          ),
        }))
        .filter((cat) => {
          // Show category if it has 3+ articles itself, or has visible subcategories
          const hasEnoughArticles = cat.article_count >= MIN_ARTICLES_FOR_VISIBILITY;
          const hasVisibleSubcategories = (cat.subcategories || []).length > 0;
          return hasEnoughArticles || hasVisibleSubcategories;
        });

      return {
        allCategories: organized,
        visibleCategories,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};

/**
 * Get visible categories for footer sections
 * Returns the top categories with enough articles
 */
export const useVisibleCategoriesForFooter = () => {
  const { data, isLoading } = useCategoriesWithCounts();

  const footerCategories = (data?.visibleCategories || [])
    .filter((cat) => cat.article_count >= MIN_ARTICLES_FOR_VISIBILITY)
    .slice(0, 6);

  return { footerCategories, isLoading };
};
