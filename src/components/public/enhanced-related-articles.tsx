import { useEnhancedRelatedArticles } from '@/hooks/use-personalized-feed';
import { ArticleCard } from '@/components/public/article-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2 } from 'lucide-react';

interface EnhancedRelatedArticlesProps {
  articleId: string;
  categoryId: string;
  tags?: string[];
}

export function EnhancedRelatedArticles({ 
  articleId, 
  categoryId, 
  tags = [] 
}: EnhancedRelatedArticlesProps) {
  const { data: relatedArticles, isLoading } = useEnhancedRelatedArticles(
    articleId, 
    categoryId, 
    tags
  );

  if (isLoading) {
    return (
      <section className="mt-16">
        <div className="flex items-center gap-2 mb-8">
          <Link2 className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold">Related Articles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!relatedArticles || relatedArticles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-8">
        <Link2 className="h-6 w-6 text-primary" />
        <h2 className="text-3xl font-bold">You Might Also Like</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <div key={article.id} className="group">
            <ArticleCard 
              article={article} 
              compact={true}
            />
            
            {/* Relevance indicator for debugging in dev mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground mt-2 px-2">
                Relevance: {Math.round(article.relevanceScore || 0)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium">💡 Pro tip:</span> These recommendations get better as you read more articles. 
          Your reading preferences help us show you the most relevant content.
        </p>
      </div>
    </section>
  );
}