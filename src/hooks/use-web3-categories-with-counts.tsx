import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Blocks, Code, Landmark, Palette, FileCode, Coins, Shield } from "lucide-react";
import { LucideIcon } from "lucide-react";

const MIN_ARTICLES_FOR_VISIBILITY = 3;

export interface Web3CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  article_count: number;
  icon?: LucideIcon;
}

// Icon mappings for Web3 categories
const categoryIcons: Record<string, LucideIcon> = {
  "blockchain-basics": Blocks,
  "smart-contracts": Code,
  "defi": Landmark,
  "nfts": Palette,
  "web3-development": FileCode,
  "crypto-fundamentals": Coins,
  "blockchain-india": Shield,
};

/**
 * Hook to fetch all Web3 categories with article counts.
 * Categories are filtered for visibility based on MIN_ARTICLES_FOR_VISIBILITY.
 */
export const useWeb3CategoriesWithCounts = () => {
  return useQuery({
    queryKey: ["web3-categories-with-counts"],
    queryFn: async () => {
      // Get parent category
      const { data: parentCategory, error: parentError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "web3forindia")
        .maybeSingle();

      if (parentError) throw parentError;
      if (!parentCategory) return { allCategories: [], visibleCategories: [] };

      // Get all subcategories
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentCategory.id);

      if (catError) throw catError;

      const categoryIds = (categories || []).map((c) => c.id);

      // Get article counts
      const { data: articleCounts, error: countError } = await supabase
        .from("articles")
        .select("category_id")
        .in("category_id", categoryIds)
        .eq("published", true);

      if (countError) throw countError;

      // Count articles per category
      const countsMap: Record<string, number> = {};
      (articleCounts || []).forEach((article) => {
        countsMap[article.category_id] = (countsMap[article.category_id] || 0) + 1;
      });

      // Add counts and icons to categories
      const categoriesWithCounts: Web3CategoryWithCount[] = (categories || []).map((cat) => ({
        ...cat,
        article_count: countsMap[cat.id] || 0,
        icon: categoryIcons[cat.slug] || Blocks,
      }));

      // Filter visible categories
      const visibleCategories = categoriesWithCounts.filter(
        (cat) => cat.article_count >= MIN_ARTICLES_FOR_VISIBILITY
      );

      return {
        allCategories: categoriesWithCounts,
        visibleCategories,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for Web3 navbar links - returns visible categories
 */
export const useWeb3NavLinks = () => {
  const { data, isLoading } = useWeb3CategoriesWithCounts();
  
  // Static links that should always appear
  const staticLinks = [
    { name: "← Main Site", href: "/", isStatic: true },
    { name: "Home", href: "/web3forindia", isStatic: true },
    { name: "My Dashboard", href: "/web3forindia/dashboard", isStatic: true },
  ];

  // Dynamic category links (only visible ones)
  const categoryLinks = (data?.visibleCategories || []).map((cat) => ({
    name: cat.name,
    href: `/web3forindia/${cat.slug}`,
    isStatic: false,
  }));

  // Static links that appear at the end
  const endLinks = [
    { name: "Code Playground", href: "/web3forindia/playground", isStatic: true },
    { name: "About", href: "/web3forindia/about", isStatic: true },
  ];

  return {
    navLinks: [...staticLinks, ...categoryLinks, ...endLinks],
    isLoading,
  };
};

/**
 * Hook for Web3 footer quick links
 */
export const useWeb3FooterCategories = () => {
  const { data, isLoading } = useWeb3CategoriesWithCounts();
  
  return {
    categories: data?.visibleCategories || [],
    isLoading,
  };
};
