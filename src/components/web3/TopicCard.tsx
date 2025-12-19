import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface TopicCardProps {
  title: string;
  description: string;
  slug: string;
  icon: LucideIcon;
  articleCount: number;
  color?: string;
}

export function TopicCard({ title, description, slug, icon: Icon, articleCount }: TopicCardProps) {
  return (
    <Link to={`/web3forindia/${slug}`} className="group block">
      <div className="h-full p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-[#6A5BFF] hover:shadow-xl hover:shadow-[#6A5BFF]/10 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#6A5BFF]/20 to-[#4AC4FF]/20 group-hover:from-[#6A5BFF]/30 group-hover:to-[#4AC4FF]/30 transition-colors">
            <Icon className="w-7 h-7 text-[#6A5BFF]" />
          </div>
          <Badge className="bg-gray-100 text-gray-700 border-0">
            {articleCount} tutorials
          </Badge>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#6A5BFF] transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center gap-2 text-[#6A5BFF] font-medium text-sm group-hover:gap-3 transition-all">
          <span>Explore</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
