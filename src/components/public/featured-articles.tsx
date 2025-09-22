import { useArticles } from '@/hooks/use-articles';
import { ArticleCard } from './article-card';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedArticles() {
  const { data: featuredData, isLoading } = useArticles(undefined, 1, 4);

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

  if (!featuredData?.articles || featuredData.articles.length === 0) {
    return null;
  }

  const [mainArticle, ...sideArticles] = featuredData.articles;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Main Featured Article */}
      <div className="lg:row-span-2">
        <div className="relative">
          <ArticleCard 
            article={mainArticle} 
            featured 
          />
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">1</span>
          </div>
        </div>
      </div>
      
      {/* Side Articles */}
      <div className="space-y-8">
        {sideArticles.slice(0, 2).map((article, index) => (
          <div key={article.id} className="relative">
            <ArticleCard 
              article={article}
            />
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-muted rounded-full flex items-center justify-center border-2 border-background">
              <span className="text-muted-foreground text-xs font-bold">{index + 2}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}