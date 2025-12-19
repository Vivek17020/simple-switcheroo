import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Newspaper } from "lucide-react";
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

interface UPSCDailyBriefingProps {
  articles: Article[];
}

const UPSCDailyBriefing = ({ articles }: UPSCDailyBriefingProps) => {
  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1, 5);
  
  if (!featuredArticle) return null;

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-900 rounded-lg">
          <Newspaper className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Daily Intelligence Brief</h2>
          <p className="text-sm text-slate-500">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Featured article - newspaper style */}
        <div className="lg:col-span-3">
          <Link 
            to={`/upscbriefs/${featuredArticle.category_slug}/${featuredArticle.slug}`}
            className="group block bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 h-full hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <span 
                className="px-3 py-1 text-xs font-semibold rounded-full text-white transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: featuredArticle.category_color }}
              >
                {featuredArticle.category_name}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {featuredArticle.reading_time || 5} min read
              </span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-amber-400 transition-colors duration-300 leading-tight">
              {featuredArticle.title}
            </h3>
            
            {featuredArticle.excerpt && (
              <p className="text-slate-300 text-base mb-6 line-clamp-3 group-hover:text-slate-200 transition-colors duration-300">
                {featuredArticle.excerpt}
              </p>
            )}
            
            <div className="flex items-center text-amber-400 font-medium group-hover:gap-3 transition-all duration-300">
              <span>Read Full Brief</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </Link>
        </div>
        
        {/* Other articles - compact list */}
        <div className="lg:col-span-2 space-y-3">
          {otherArticles.map((article, index) => (
            <Link
              key={article.id}
              to={`/upscbriefs/${article.category_slug}/${article.slug}`}
              className="group flex gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                {index + 2}
              </div>
              <div className="flex-1 min-w-0">
                <span 
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 transition-transform duration-300 group-hover:scale-105"
                  style={{ 
                    backgroundColor: `${article.category_color}15`,
                    color: article.category_color 
                  }}
                >
                  {article.category_name}
                </span>
                <h4 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 text-sm">
                  {article.title}
                </h4>
              </div>
            </Link>
          ))}
          
          <Link
            to="/upscbriefs/upsc-daily-ca"
            className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-slate-600 hover:text-blue-600 bg-slate-50 rounded-xl hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            View All Current Affairs
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UPSCDailyBriefing;
