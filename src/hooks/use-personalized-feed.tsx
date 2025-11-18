import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserPreferences } from "@/hooks/use-reading-history";
import { Article } from "@/hooks/use-articles";

export const usePersonalizedFeed = (limit = 12) => {
  const { user } = useAuth();
  const { data: preferences } = useUserPreferences();

  return useQuery({
    queryKey: ["personalized-feed", user?.id, preferences?.id],
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
        .eq("published", true);

      // If user has preferences, prioritize based on them
      if (preferences?.preferred_categories?.length) {
        // Get preferred articles first
        const { data: preferredArticles, error: prefError } = await query
          .in("category_id", preferences.preferred_categories)
          .order("published_at", { ascending: false })
          .limit(Math.ceil(limit * 0.7)); // 70% from preferred categories

        if (prefError) throw prefError;

        // Get remaining trending articles
        const { data: trendingArticles, error: trendError } = await supabase
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
          .not("id", "in", `(${preferredArticles.map(a => a.id).join(",")})`)
          .order("views_count", { ascending: false })
          .order("likes_count", { ascending: false })
          .limit(Math.floor(limit * 0.3)); // 30% trending

        if (trendError) throw trendError;

        // Combine and sort by a personalized score
        const combinedArticles = [...preferredArticles, ...trendingArticles];
        
        return combinedArticles
          .sort((a, b) => {
            const aScore = calculatePersonalizedScore(a, preferences);
            const bScore = calculatePersonalizedScore(b, preferences);
            return bScore - aScore;
          })
          .slice(0, limit);
      }

      // For users without preferences or guest users, show trending + recent mix
      const { data: articles, error } = await query
        .order("published_at", { ascending: false })
        .limit(limit * 2); // Get more to sort properly

      if (error) throw error;

      return articles
        .sort((a, b) => {
          const aScore = calculateEngagementScore(a);
          const bScore = calculateEngagementScore(b);
          return bScore - aScore;
        })
        .slice(0, limit);
    },
  });
};

function calculatePersonalizedScore(article: Article, preferences: any): number {
  let score = 0;
  
  // Base engagement score
  score += (article.likes_count || 0) * 3;
  score += (article.shares_count || 0) * 5;
  score += (article.comments_count || 0) * 7;
  score += (article.views_count || 0) * 1;
  
  // Category preference boost
  if (preferences?.preferred_categories?.includes(article.category_id)) {
    score += 50;
  }
  
  // Tag preference boost
  if (article.tags && preferences?.preferred_tags) {
    const matchingTags = article.tags.filter(tag => 
      preferences.preferred_tags.includes(tag)
    );
    score += matchingTags.length * 10;
  }
  
  // Freshness bonus
  const hoursOld = (Date.now() - new Date(article.published_at || article.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursOld <= 24) score *= 1.5;
  else if (hoursOld <= 72) score *= 1.2;
  
  return score;
}

function calculateEngagementScore(article: Article): number {
  const engagement = (article.likes_count || 0) * 3 + 
                   (article.shares_count || 0) * 5 + 
                   (article.comments_count || 0) * 7 + 
                   (article.views_count || 0) * 1;
  
  const hoursOld = (Date.now() - new Date(article.published_at || article.created_at).getTime()) / (1000 * 60 * 60);
  const freshnessMultiplier = hoursOld <= 24 ? 1.5 : hoursOld <= 72 ? 1.2 : 1;
  
  return engagement * freshnessMultiplier;
}

export const useEnhancedRelatedArticles = (
  articleId: string, 
  categoryId: string, 
  tags: string[] = []
) => {
  const { user } = useAuth();
  const { data: preferences } = useUserPreferences();

  return useQuery({
    queryKey: ["enhanced-related-articles", articleId, categoryId, tags, user?.id],
    queryFn: async () => {
      // Get articles from same category
      const { data: categoryArticles, error: catError } = await supabase
        .from("articles")
        .select(`
          *,
          categories:category_id (
            id,
            name,
            slug,
            color
          )
        `)
        .eq("published", true)
        .eq("category_id", categoryId)
        .neq("id", articleId)
        .order("published_at", { ascending: false })
        .limit(10);

      if (catError) throw catError;

      // Get articles with similar tags
      let tagArticles = [];
      if (tags.length > 0) {
        const { data: tagData, error: tagError } = await supabase
          .from("articles")
          .select(`
            *,
            categories:category_id (
              id,
              name,
              slug,
              color
            )
          `)
          .eq("published", true)
          .neq("id", articleId)
          .overlaps("tags", tags)
          .order("published_at", { ascending: false })
          .limit(5);

        if (tagError) throw tagError;
        tagArticles = tagData || [];
      }

      // Combine and deduplicate
      const allArticles = [...categoryArticles, ...tagArticles];
      const uniqueArticles = allArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.id === article.id)
      );

      // Score and sort articles
      const scoredArticles = uniqueArticles.map(article => ({
        ...article,
        relevanceScore: calculateRelevanceScore(article, categoryId, tags, preferences)
      }));

      return scoredArticles
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
    },
  });
};

function calculateRelevanceScore(
  article: Article, 
  targetCategoryId: string, 
  targetTags: string[], 
  preferences: any
): number {
  let score = 0;

  // Same category bonus
  if (article.category_id === targetCategoryId) {
    score += 100;
  }

  // Tag similarity
  if (article.tags && targetTags.length > 0) {
    const matchingTags = article.tags.filter(tag => targetTags.includes(tag));
    score += matchingTags.length * 25;
  }

  // User preference bonus
  if (preferences?.preferred_categories?.includes(article.category_id)) {
    score += 30;
  }

  // Engagement score
  score += (article.likes_count || 0) * 2;
  score += (article.shares_count || 0) * 3;
  score += (article.comments_count || 0) * 4;
  score += (article.views_count || 0) * 0.5;

  // Freshness bonus
  const daysOld = (Date.now() - new Date(article.published_at || article.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld <= 7) score += 20;
  else if (daysOld <= 30) score += 10;

  return score;
}