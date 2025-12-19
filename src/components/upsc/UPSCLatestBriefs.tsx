import { Link } from "react-router-dom";
import { Clock, ArrowRight, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface UPSCLatestBriefsProps {
  articles: Article[];
}

const UPSCLatestBriefs = ({ articles }: UPSCLatestBriefsProps) => {
  // Skip first 5 as they're shown in Daily Briefing
  const briefArticles = articles.slice(5);
  
  if (briefArticles.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Latest Briefs</h2>
        <Link 
          to="/upscbriefs/upsc-daily-ca"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {briefArticles.map((article) => (
          <Link
            key={article.id}
            to={`/upscbriefs/${article.category_slug}/${article.slug}`}
            className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300"
          >
            {/* Classification header */}
            <div className="flex items-center justify-between mb-3">
              <span 
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-300 group-hover:scale-105"
                style={{ 
                  backgroundColor: `${article.category_color}15`,
                  color: article.category_color 
                }}
              >
                <Tag className="w-3 h-3" />
                {article.category_name}
              </span>
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {/* Subject line */}
            <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 mb-2">
              {article.title}
            </h3>
            
            {/* Key points preview */}
            {article.excerpt && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 group-hover:text-slate-600 transition-colors duration-300">
                {article.excerpt}
              </p>
            )}
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 group-hover:border-blue-100 transition-colors duration-300">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.reading_time || 5} min
              </span>
              <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                Read Brief <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default UPSCLatestBriefs;
