import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Article } from "@/hooks/use-articles";
import { Calendar, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  compact?: boolean;
}

export function ArticleCard({ article, featured = false, compact = false }: ArticleCardProps) {
  const publishedDate = article.published_at ? new Date(article.published_at) : new Date(article.created_at);
  
  if (featured) {
    return (
      <Link to={`/article/${article.slug}`} className="group block">
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-card">
          <div className="relative flex-shrink-0">
            {article.image_url ? (
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  className="bg-primary/90 text-primary-foreground hover:bg-primary transition-colors shadow-sm"
                >
                  {article.categories?.name}
                </Badge>
              </Link>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-24"></div>
          </div>
          <CardContent className="p-8 flex-1 flex flex-col">
            <h2 className="font-headline text-2xl font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="text-muted-foreground mb-6 line-clamp-3 flex-1 leading-relaxed text-base">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t border-border/20">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{article.reading_time} min read</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.views_count}</span>
                </div>
              </div>
              <span className="font-medium text-foreground">{article.author}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article.slug}`} className="group block">
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col bg-card">
        <div className="flex-shrink-0">
          {article.image_url ? (
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <Link to={`/category/${article.categories?.slug}`} onClick={(e) => e.stopPropagation()}>
              <Badge 
                className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                {article.categories?.name}
              </Badge>
            </Link>
            <span className="text-xs text-muted-foreground font-medium">
              {formatDistanceToNow(publishedDate, { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-headline text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border/20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{article.reading_time}m</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{article.views_count}</span>
              </div>
            </div>
            <span className="font-medium text-foreground">{article.author}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}