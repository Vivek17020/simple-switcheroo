import { useRecommendedArticles } from '@/hooks/use-recommended-articles';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Calendar, Clock, Eye, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ShareButtons } from './share-buttons';
import { LikeButton } from './like-button';

interface RecommendedForYouProps {
  categoryId: string;
  currentArticleId: string;
}

export function RecommendedForYou({ categoryId, currentArticleId }: RecommendedForYouProps) {
  const { data: articles, isLoading } = useRecommendedArticles(5, categoryId, currentArticleId);

  if (isLoading) {
    return (
      <section className="mt-16 border-t-2 border-primary/20 pt-16">
        <div className="flex items-center gap-2 mb-8 text-primary">
          <ChevronRight className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-[16/9] w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t-2 border-primary/20 pt-16">
      <div className="flex items-center gap-2 mb-12 text-primary">
        <ChevronRight className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>

      <div className="space-y-16">
        {articles.map((article, index) => {
          const publishedDate = article.published_at 
            ? new Date(article.published_at) 
            : new Date(article.created_at);
          const canonicalUrl = `https://www.thebulletinbriefs.in/article/${article.slug}`;
          const authorUsername = article.public_profiles?.username || article.profiles?.username;

          return (
            <article key={article.id} className={index > 0 ? "border-t border-border pt-16" : ""}>
              {/* Article Header */}
              <header className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">
                    {article.categories?.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(publishedDate, "MMMM d, yyyy")}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  {article.title}
                </h2>
                
                {article.excerpt && (
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" data-no-translate>
                    {authorUsername && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span>By {authorUsername}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={publishedDate.toISOString()}>
                        {formatDistanceToNow(publishedDate, { addSuffix: true })}
                      </time>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{article.reading_time} min read</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>{article.views_count} views</span>
                    </div>
                  </div>
                  
                  <ShareButtons 
                    url={canonicalUrl}
                    title={article.title}
                    description={article.excerpt || ""}
                    articleId={article.id}
                  />
                </div>
              </header>

              {/* Featured Image */}
              {article.image_url && (
                <div className="mb-8 overflow-hidden rounded-lg">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full aspect-[16/9] object-cover"
                    width="1200"
                    height="675"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert mb-8 article-content">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Section */}
              <div className="border-t border-border pt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <LikeButton articleId={article.id} />
                    <h3 className="text-lg font-semibold">Share this article</h3>
                  </div>
                  <ShareButtons 
                    url={canonicalUrl}
                    title={article.title}
                    description={article.excerpt || ""}
                    articleId={article.id}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
