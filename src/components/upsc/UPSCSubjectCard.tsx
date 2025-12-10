import { Link } from "react-router-dom";
import { LucideIcon, ArrowRight } from "lucide-react";

interface UPSCSubjectCardProps {
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  color: string;
  articleCount?: number;
}

export const UPSCSubjectCard = ({
  name,
  slug,
  description,
  icon: Icon,
  color,
  articleCount = 0,
}: UPSCSubjectCardProps) => {
  return (
    <Link
      to={`/upscbriefs/${slug}`}
      className="group block p-4 md:p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm active:bg-gray-50 transition-all bg-white"
    >
      <div className="flex items-start gap-3 md:gap-3">
        {/* Icon - Slightly larger on mobile for better tap target */}
        <div
          className="w-12 h-12 md:w-10 md:h-10 rounded-xl md:rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6 md:w-5 md:h-5" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-base md:text-base">
              {name}
            </h3>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          {articleCount > 0 && (
            <p className="text-xs text-gray-400 mt-2">{articleCount} articles</p>
          )}
        </div>
      </div>
    </Link>
  );
};