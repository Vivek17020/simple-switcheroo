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
    <article className="py-4 md:py-4 group">
      <Link
        to={`/upscbriefs/${article.category_slug}/${article.slug}`}
        className="block active:bg-gray-50 -mx-4 px-4 py-3 md:mx-0 md:px-4 md:py-3 rounded-lg transition-all duration-300 hover:bg-blue-50/50 hover:shadow-sm hover:-translate-y-0.5"
      >
        {/* Mobile: Stack layout */}
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
          {/* Badge - Full width on mobile, shrink on desktop */}
          <Badge
            variant="secondary"
            className="text-xs w-fit md:shrink-0 md:mt-1 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: `${article.category_color}15`,
              color: article.category_color,
              borderColor: `${article.category_color}30`,
            }}
          >
            {article.category_name}
          </Badge>

          <div className="flex-1 min-w-0">
            {/* Title - Larger on mobile for better readability */}
            <h3 className="text-base md:text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2 leading-snug relative inline-block">
              {article.title}
              <span className="absolute -bottom-0.5 left-0 h-0.5 bg-blue-600 transition-all duration-300 w-0 group-hover:w-full"></span>
            </h3>

            {/* Excerpt - Show only on larger screens to save space on mobile */}
            {article.excerpt && (
              <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 hidden sm:block group-hover:text-gray-700 transition-colors duration-300">
                {article.excerpt}
              </p>
            )}

            {/* Meta info - More spacing on mobile */}
            <div className="flex items-center gap-4 mt-2.5 md:mt-2 text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(article.created_at), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {article.reading_time || 5} min
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};