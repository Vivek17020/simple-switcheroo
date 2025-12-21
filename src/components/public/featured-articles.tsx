import { useArticles } from '@/hooks/use-articles';
import { ArticleCard } from './article-card';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedArticles() {
  const { data: featuredData, isLoading, error } = useArticles(undefined, 1, 4);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:row-span-2">
          <Skeleton className="w-full h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full h-44" />
          <Skeleton className="w-full h-44" />
        </div>
      </div>
    );
  }

  if (error || !featuredData?.articles || featuredData.articles.length === 0) {
    return null;
  }

  const [mainArticle, ...sideArticles] = featuredData.articles;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Main Featured Article */}
      <div className="lg:row-span-2">
        <ArticleCard 
          article={mainArticle} 
          featured 
        />
      </div>
      
      {/* Side Articles */}
      {sideArticles.length > 0 && (
        <div className="space-y-6">
          {sideArticles.slice(0, 2).map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article}
            />
          ))}
        </div>
      )}
    </div>
  );
}