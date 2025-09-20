import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  summary: string | null;
  author: string;
  author_id: string | null;
  image_url: string | null;
  published: boolean;
  featured: boolean;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  reading_time: number;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  seo_keywords: string[] | null;
  category_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    description: string | null;
  };
}

export const useArticles = (categorySlug?: string, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ["articles", categorySlug, page, limit],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color,
            description
          )
        `)
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (categorySlug) {
        query = query.eq("categories.slug", categorySlug);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      
      return {
        articles: data as Article[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    },
  });
};

export const useArticle = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color,
            description
          )
        `)
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from("articles")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", data.id);

      return data as Article;
    },
  });
};

export const useRelatedArticles = (articleId: string, categoryId: string, tags: string[] = []) => {
  return useQuery({
    queryKey: ["related-articles", articleId, categoryId, tags],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          slug,
          excerpt,
          image_url,
          published_at,
          reading_time,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .eq("published", true)
        .neq("id", articleId)
        .eq("category_id", categoryId)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

// Hook for infinite scrolling articles
export const useInfiniteArticles = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["infinite-articles", categorySlug],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color,
            description
          )
        `)
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (categorySlug) {
        // First get the category ID
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();
        
        if (categoryData) {
          query = query.eq("category_id", categoryData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as Article[];
    },
  });
};