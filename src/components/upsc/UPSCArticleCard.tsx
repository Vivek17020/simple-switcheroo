import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

interface UPSCArticleCardProps {
  article: Article;
}

export const UPSCArticleCard = ({ article }: UPSCArticleCardProps) => {
  return (
    <article className="py-4 group">
      <Link
        to={`/upscbriefs/${article.category_slug}/${article.slug}`}
        className="block"
      >
        <div className="flex items-start gap-3">
          <Badge
            variant="secondary"
            className="text-xs shrink-0 mt-1"
            style={{
              backgroundColor: `${article.category_color}15`,
              color: article.category_color,
              borderColor: `${article.category_color}30`,
            }}
          >
            {article.category_name}
          </Badge>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
              {article.title}
            </h3>

            {article.excerpt && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(article.created_at), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.reading_time || 5} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
