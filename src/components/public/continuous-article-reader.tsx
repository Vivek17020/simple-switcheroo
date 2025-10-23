import { useEnhancedRelatedArticles } from '@/hooks/use-personalized-feed';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeHtml } from '@/lib/sanitize';
import { Calendar, Clock, Eye, User, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ShareButtons } from './share-buttons';
import { LikeButton } from './like-button';
import { useEffect, useRef, useState } from 'react';

interface ContinuousArticleReaderProps {
  articleId: string;
  categoryId: string;
  tags?: string[];
  depth?: number;
  visitedArticles?: Set<string>;
}

export function ContinuousArticleReader({ 
  articleId, 
  categoryId, 
  tags = [],
  depth = 0,
  visitedArticles = new Set()
}: ContinuousArticleReaderProps) {
  const [localVisited] = useState(() => new Set(visitedArticles));
  
  // Limit depth to prevent infinite recursion and performance issues
  const MAX_DEPTH = 3;
  
  useEffect(() => {
    localVisited.add(articleId);
  }, [articleId, localVisited]);
  const { data: relatedArticles, isLoading } = useEnhancedRelatedArticles(
    articleId, 
    categoryId, 
    tags
  );

  if (isLoading) {
    return (
      <section className="mt-16 border-t border-border pt-16">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <Skeleton className="aspect-[16/9] w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </section>
    );
  }

  if (!relatedArticles || relatedArticles.length === 0 || depth >= MAX_DEPTH) {
    return null;
  }

  // Find first article that hasn't been visited
  const nextArticle = relatedArticles.find(article => !localVisited.has(article.id));
  
  if (!nextArticle) {
    return null;
  }

  const publishedDate = nextArticle.published_at 
    ? new Date(nextArticle.published_at) 
    : new Date(nextArticle.created_at);
  const canonicalUrl = `https://www.thebulletinbriefs.in/article/${nextArticle.slug}`;
  const authorUsername = nextArticle.public_profiles?.username || nextArticle.profiles?.username;

  return (
    <section className="mt-16 border-t-2 border-primary/20 pt-16">
      <div className="flex items-center gap-2 mb-8 text-primary">
        <ChevronRight className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Continue Reading</h2>
      </div>

      <article className="mb-12">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {nextArticle.categories?.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(publishedDate, "MMMM d, yyyy")}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            {nextArticle.title}
          </h1>
          
          {nextArticle.excerpt && (
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {nextArticle.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {authorUsername && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>By {authorUsername}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{nextArticle.reading_time} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{nextArticle.views_count} views</span>
              </div>
            </div>
            
            <ShareButtons 
              url={canonicalUrl}
              title={nextArticle.title}
              description={nextArticle.excerpt || ""}
              articleId={nextArticle.id}
            />
          </div>
        </header>

        {/* Featured Image */}
        {nextArticle.image_url && (
          <div className="mb-8 overflow-hidden rounded-lg">
            <img
              src={nextArticle.image_url}
              alt={nextArticle.title}
              className="w-full aspect-[16/9] object-cover"
              width="1200"
              height="675"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        {/* Article Content - Show preview */}
        <div className="prose prose-lg max-w-none dark:prose-invert mb-8 article-content">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(nextArticle.content) }} />
        </div>

        {/* Tags */}
        {nextArticle.tags && nextArticle.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {nextArticle.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Section */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <LikeButton articleId={nextArticle.id} />
              <h3 className="text-lg font-semibold">Share this article</h3>
            </div>
            <ShareButtons 
              url={canonicalUrl}
              title={nextArticle.title}
              description={nextArticle.excerpt || ""}
              articleId={nextArticle.id}
            />
          </div>
        </div>
      </article>

      {/* Recursive call for next article */}
      {depth < MAX_DEPTH && (
        <ContinuousArticleReader 
          articleId={nextArticle.id}
          categoryId={nextArticle.category_id}
          tags={nextArticle.tags || []}
          depth={depth + 1}
          visitedArticles={localVisited}
        />
      )}
    </section>
  );
}
