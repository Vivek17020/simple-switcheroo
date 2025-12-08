import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UPSCArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string[] | null;
  category_id: string;
  published: boolean;
}

interface FormattedArticle extends UPSCArticle {
  category_slug: string;
  category_name: string;
  category_color: string;
}

export const useUPSCCategories = () => {
  return useQuery({
    queryKey: ["upsc-categories"],
    queryFn: async () => {
      // Get the UPSC parent category
      const { data: parentCategory, error: parentError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "upscbriefs")
        .single();

      if (parentError) throw parentError;

      // Get all subcategories
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentCategory.id);

      if (error) throw error;
      return categories;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUPSCArticles = (categorySlug?: string, limit?: number) => {
  return useQuery({
    queryKey: ["upsc-articles", categorySlug, limit],
    queryFn: async (): Promise<FormattedArticle[]> => {
      // Get the UPSC parent category
      const { data: parentCategory, error: parentError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "upscbriefs")
        .single();

      if (parentError) throw parentError;

      // Get all UPSC subcategories
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("id, slug, name, color")
        .eq("parent_id", parentCategory.id);

      if (catError) throw catError;

      const categoryIds = categories?.map((c) => c.id) || [];
      
      // If filtering by category, get that specific category ID
      let filterCategoryIds = categoryIds;
      if (categorySlug) {
        const targetCategory = categories?.find((c) => c.slug === categorySlug);
        if (targetCategory) {
          filterCategoryIds = [targetCategory.id];
        }
      }

      // Get articles
      let query = supabase
        .from("articles")
        .select("*")
        .in("category_id", filterCategoryIds)
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: articles, error } = await query;
      if (error) throw error;

      // Map articles with category info
      const formattedArticles: FormattedArticle[] = (articles || []).map((article) => {
        const category = categories?.find((c) => c.id === article.category_id);
        return {
          ...article,
          category_slug: category?.slug || "",
          category_name: category?.name || "",
          category_color: category?.color || "#1E3A8A",
        };
      });

      return formattedArticles;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUPSCArticle = (categorySlug: string, articleSlug: string) => {
  return useQuery({
    queryKey: ["upsc-article", categorySlug, articleSlug],
    queryFn: async (): Promise<FormattedArticle | null> => {
      // Get category
      const { data: category, error: catError } = await supabase
        .from("categories")
        .select("id, slug, name, color")
        .eq("slug", categorySlug)
        .single();

      if (catError) return null;

      // Get article
      const { data: article, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", articleSlug)
        .eq("category_id", category.id)
        .eq("published", true)
        .single();

      if (error) return null;

      return {
        ...article,
        category_slug: category.slug,
        category_name: category.name,
        category_color: category.color || "#1E3A8A",
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUPSCCategoryArticleCount = () => {
  return useQuery({
    queryKey: ["upsc-category-counts"],
    queryFn: async () => {
      // Get parent category
      const { data: parentCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "upscbriefs")
        .single();

      if (!parentCategory) return {};

      // Get subcategories
      const { data: categories } = await supabase
        .from("categories")
        .select("id, slug")
        .eq("parent_id", parentCategory.id);

      if (!categories) return {};

      // Count articles per category
      const counts: Record<string, number> = {};
      for (const cat of categories) {
        const { count } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("category_id", cat.id)
          .eq("published", true);

        counts[cat.slug] = count || 0;
      }

      return counts;
    },
    staleTime: 1000 * 60 * 10,
  });
};
