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
  public_profiles?: {
    username: string;
    full_name: string | null;
  };
  profiles?: {
    username: string;
    full_name: string | null;
  };
}

export const useArticles = (categorySlug?: string, page = 1, limit = 12, sortOrder?: 'oldest' | 'newest') => {
  return useQuery({
    queryKey: ["articles", categorySlug, page, limit, sortOrder],
    queryFn: async () => {
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
          tags,
          author,
          author_id,
          categories:category_id (
            id,
            name,
            slug,
            color,
            description
          )
        `, { count: 'exact' })
        .eq("published", true)
        .order("published_at", { ascending: sortOrder === 'oldest' });

      if (categorySlug) {
        query = query.eq("category_id", (await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle()).data?.id || "");
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      
      // Enrich with public author profiles without touching restricted profiles table
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
          profiles: author, // for backward compatibility
        };
      });

      return {
        articles: articles as Article[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
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

      // Fetch author public profile
      let authorProfile: { username: string; full_name: string | null } | undefined = undefined;
      if (data.author_id) {
        const { data: author } = await supabase
          .from("public_profiles")
          .select("id, username, full_name")
          .eq("id", data.author_id)
          .maybeSingle();
        if (author) {
          authorProfile = { username: author.username, full_name: author.full_name };
        }
      }

      // Increment view count (best-effort)
      await supabase
        .from("articles")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", data.id);

      const article = {
        ...data,
        public_profiles: authorProfile,
        profiles: authorProfile, // backward compatibility
      } as Article;

      return article;
    },
    staleTime: 1000 * 60 * 5, // Cache article for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
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
          author,
          author_id,
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

      const enriched = (data || []).map((a: any) => ({
        ...a,
        public_profiles: a.author_id ? authorsMap.get(a.author_id) : undefined,
        profiles: a.author_id ? authorsMap.get(a.author_id) : undefined,
      }));

      return enriched as Article[];
    },
    staleTime: 1000 * 60 * 3, // Cache for 3 minutes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parent_id: string | null;
  subcategories?: Category[];
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      
      // Organize into parent/child structure
      const categories = data as Category[];
      const parentCategories = categories.filter(cat => !cat.parent_id);
      const childCategories = categories.filter(cat => cat.parent_id);
      
      // Attach subcategories to parents
      const organized = parentCategories.map(parent => ({
        ...parent,
        subcategories: childCategories.filter(child => child.parent_id === parent.id)
      }));
      
      return organized;
    },
    staleTime: 1000 * 60 * 10, // Cache categories for 10 minutes (rarely change)
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
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
          id,
          title,
          slug,
          excerpt,
          image_url,
          published_at,
          reading_time,
          views_count,
          likes_count,
          author,
          author_id,
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

      const enriched = (data || []).map((a: any) => ({
        ...a,
        public_profiles: a.author_id ? authorsMap.get(a.author_id) : undefined,
        profiles: a.author_id ? authorsMap.get(a.author_id) : undefined,
      }));

      return enriched as Article[];
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
};