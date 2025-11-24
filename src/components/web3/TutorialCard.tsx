import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";

interface TutorialCardProps {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  readingTime?: number;
  viewsCount?: number;
  imageUrl?: string;
  tags?: string[];
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export function TutorialCard({
  title,
  excerpt,
  slug,
  readingTime = 5,
  viewsCount = 0,
  imageUrl,
  tags = [],
  difficulty = "Beginner",
}: TutorialCardProps) {
  const difficultyColors = {
    Beginner: "bg-green-100 text-green-700 border-0",
    Intermediate: "bg-yellow-100 text-yellow-700 border-0",
    Advanced: "bg-red-100 text-red-700 border-0",
  };

  return (
    <Link to={`/web3forindia/article/${slug}`} className="group block">
      <div className="h-full rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-[#6A5BFF] hover:shadow-xl hover:shadow-[#6A5BFF]/10 transition-all duration-300 overflow-hidden hover:-translate-y-1">
        {imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={difficultyColors[difficulty]}>
              {difficulty}
            </Badge>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readingTime} min
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewsCount}
              </span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#6A5BFF] transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{excerpt}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} className="text-xs bg-gray-100 text-gray-600 border-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
