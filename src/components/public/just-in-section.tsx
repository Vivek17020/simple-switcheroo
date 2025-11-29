import { useArticles } from '@/hooks/use-articles';
import { ArticleCard } from './article-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export function JustInSection() {
  const { data: latestData, isLoading } = useArticles(undefined, 1, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Just In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!latestData?.articles || latestData.articles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Just In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestData.articles.slice(0, 3).map((article) => (
          <div key={article.id} className="border-b last:border-b-0 pb-4 last:pb-0">
            <ArticleCard article={article} compact />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}