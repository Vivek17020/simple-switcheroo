import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  published_at: string;
  categories: {
    name: string;
    color: string;
  };
  trendingScore?: number;
}

export function TrendingArticles() {
  const [articles, setArticles] = useState<TrendingArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingArticles();
  }, []);

  const fetchTrendingArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          views_count,
          likes_count,
          shares_count,
          comments_count,
          published_at,
          categories:category_id (
            name,
            color
          )
        `)
        .eq('published', true)
        .order('views_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Calculate trending scores and sort
      const articlesWithScores = (data || []).map(article => {
        const likes = article.likes_count || 0;
        const shares = article.shares_count || 0;
        const views = article.views_count || 0;
        const comments = article.comments_count || 0;
        const publishedAt = new Date(article.published_at);
        
        // Calculate engagement score: likes*3 + shares*5 + views*1 + comments*7
        const engagementScore = (likes * 3) + (shares * 5) + (views * 1) + (comments * 7);
        
        // Calculate time decay (newer articles get higher scores)
        const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
        let timeDecay = 1.0;
        if (hoursAgo > 24) timeDecay = 0.8;
        if (hoursAgo > 72) timeDecay = 0.6;
        if (hoursAgo > 168) timeDecay = 0.4;
        
        const trendingScore = engagementScore * timeDecay;
        
        return {
          ...article,
          trendingScore
        };
      });
      
      // Sort by trending score and take top 5
      const topTrending = articlesWithScores
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 5);
      
      setArticles(topTrending);
    } catch (error) {
      console.error('Error fetching trending articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No trending articles found
      </div>
    );
  }

  // Group articles by category
  const articlesByCategory = articles.reduce((acc, article) => {
    const categoryName = article.categories.name;
    if (!acc[categoryName]) {
      acc[categoryName] = {
        color: article.categories.color,
        articles: []
      };
    }
    acc[categoryName].articles.push(article);
    return acc;
  }, {} as Record<string, { color: string; articles: TrendingArticle[] }>);

  return (
    <div className="space-y-8">
      {Object.entries(articlesByCategory).map(([categoryName, { color, articles: categoryArticles }]) => (
        <div key={categoryName} className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <TrendingUp className="h-5 w-5" style={{ color: color }} />
            <h3 
              className="font-bold text-lg uppercase tracking-wide"
              style={{ color: color }}
            >
              {categoryName}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryArticles.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.slug}`}
                className="block group"
              >
                <div className="p-4 rounded-lg border bg-card hover:shadow-lg transition-all">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{article.views_count}</span>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}