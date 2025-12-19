import { UPSCArticleCard } from "./UPSCArticleCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  created_at: string;
  reading_time: number | null;
  category_slug: string;
  category_name: string;
  category_color: string;
}

interface UPSCArticleListProps {
  articles: Article[];
  loading?: boolean;
}

export const UPSCArticleList = ({ articles, loading }: UPSCArticleListProps) => {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="py-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No articles found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {articles.map((article) => (
        <UPSCArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};
