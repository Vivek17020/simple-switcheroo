import { useRecommendedArticles } from '@/hooks/use-recommended-articles';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { ArticleCard } from './article-card';

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
      <div className="flex items-center gap-2 mb-8 text-primary">
        <ChevronRight className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard 
            key={article.id}
            article={article} 
            compact={true}
          />
        ))}
      </div>
    </section>
  );
}
