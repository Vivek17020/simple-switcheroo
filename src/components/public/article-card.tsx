import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Article } from "@/hooks/use-articles";
import { Calendar, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getFirstName } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  compact?: boolean;
}

export function ArticleCard({ article, featured = false, compact = false }: ArticleCardProps) {
  const publishedDate = article.published_at ? new Date(article.published_at) : new Date(article.created_at);
  const queryClient = useQueryClient();
  
  // Prefetch article data on hover for instant navigation
  const prefetchArticle = () => {
    queryClient.prefetchQuery({
      queryKey: ["article", article.slug],
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
              description,
              parent_id
            )
          `)
          .eq("slug", article.slug)
          .eq("published", true)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };
  
  if (featured) {
    return (
      <Link to={`/article/${article.slug}`} className="group block" onMouseEnter={prefetchArticle}>
        <Card className="overflow-hidden border-border/50 hover:shadow-accent transition-all duration-300 h-full flex flex-col">
          <div className="relative flex-shrink-0">
            {article.image_url ? (
            <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={article.image_url}
                  alt={article.title}
                  width="1200"
                  height="675"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ contain: 'layout style paint' }}
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold text-lg">
                      {article.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground line-clamp-2">
                    {article.title}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <Link to={`/category/${article.categories?.slug}`} onClick={(e) => e.stopPropagation()}>
                <Badge 
                  className={`bg-${article.categories?.color || 'primary'} text-${article.categories?.color || 'primary'}-foreground hover:opacity-80 transition-opacity`}
                >
                  {article.categories?.name}
                </Badge>
              </Link>
            </div>
          </div>
          <CardContent className="p-6 flex-1 flex flex-col">
            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-auto" data-no-translate>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{article.reading_time} min read</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article.slug}`} className="group block" onMouseEnter={prefetchArticle}>
      <Card className="overflow-hidden border-border/50 hover:shadow-accent transition-all duration-300 h-full flex flex-col">
        <div className="flex-shrink-0">
          {article.image_url ? (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                width="800"
                height="450"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ contain: 'layout style paint' }}
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold">
                    {article.title.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {article.categories?.name}
                </span>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Link to={`/category/${article.categories?.slug}`} onClick={(e) => e.stopPropagation()}>
              <Badge 
                variant="secondary"
                className="text-xs hover:bg-primary/10 transition-colors"
              >
                {article.categories?.name}
              </Badge>
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(publishedDate, { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-auto" data-no-translate>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{article.reading_time}m</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}