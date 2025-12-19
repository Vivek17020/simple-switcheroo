import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArticleCard } from "./article-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Article } from "@/hooks/use-articles";
import { useQuery } from "@tanstack/react-query";

interface ArticleGridProps {
  categorySlug?: string;
}

const ARTICLES_PER_PAGE = 12;

export function ArticleGrid({ categorySlug }: ArticleGridProps) {
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["articles-paginated", categorySlug, page],
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
        // Get the category and its subcategories
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id, subcategories:categories!parent_id(id)")
          .eq("slug", categorySlug)
          .single();
        
        if (categoryData) {
          // Include both parent category and all subcategories
          const categoryIds = [categoryData.id];
          const subcategories = categoryData.subcategories as any;
          if (Array.isArray(subcategories) && subcategories.length > 0) {
            categoryIds.push(...subcategories.map((sub: any) => sub.id));
          }
          query = query.in("category_id", categoryIds);
        }
      }

      const from = (page - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;
      
      const { data: articles, error, count } = await query.range(from, to);

      if (error) throw error;
      
      return {
        articles: articles as Article[],
        totalCount: count || 0,
        hasMore: (count || 0) > page * ARTICLES_PER_PAGE
      };
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  // Listen for article publish events to auto-refresh
  useEffect(() => {
    const handleArticlePublished = () => {
      refetch();
    };
    
    window.addEventListener('article-published', handleArticlePublished);
    return () => window.removeEventListener('article-published', handleArticlePublished);
  }, [refetch]);

  // Update all articles when new data comes in
  useEffect(() => {
    if (data?.articles) {
      if (page === 1) {
        setAllArticles(data.articles);
      } else {
        setAllArticles(prev => [...prev, ...data.articles]);
      }
    }
  }, [data, page]);

  // Reset when category changes
  useEffect(() => {
    setPage(1);
    setAllArticles([]);
  }, [categorySlug]);

  // Handle hydration to prevent layout shifts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // Keyboard shortcut for loading more articles
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'l' && (event.metaKey || event.ctrlKey) && data?.hasMore && !isFetching) {
        event.preventDefault();
        loadMore();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [loadMore, data?.hasMore, isFetching]);

  if (isLoading && page === 1) {
    return (
      <div className="articles-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="article-card-container">
            <div className="article-card space-y-3">
              <div className="aspect-[16/9] bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2 p-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error loading articles. Please try again.</p>
      </div>
    );
  }

  if (allArticles.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {categorySlug ? "No articles found in this category." : "No articles found."}
        </p>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="articles-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="article-card-container">
            <div className="article-card space-y-3">
              <div className="aspect-[16/9] bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2 p-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="articles-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allArticles.map((article) => (
          <div key={article.id} className="article-card-container">
            <ArticleCard article={article} />
          </div>
        ))}
      </div>

      {data?.hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isFetching}
            variant="outline"
            size="lg"
            className="px-8 py-3 text-base"
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more articles...
              </>
            ) : (
              <>
                Load More Articles
                <span className="ml-2 text-xs text-muted-foreground">
                  ({allArticles.length} of {data?.totalCount || 0})
                </span>
                <span className="ml-2 text-xs text-muted-foreground opacity-60">
                  • Press Ctrl+L
                </span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* End of articles message */}
      {!data?.hasMore && allArticles.length > 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-muted-foreground text-sm">
            <span>🎉</span>
            <span>You've reached the end! You've viewed all {allArticles.length} articles.</span>
          </div>
        </div>
      )}

      {isFetching && page > 1 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more articles...</span>
          </div>
        </div>
      )}
    </div>
  );
}