import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface Subject {
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gsPaper: string;
  articleCount: number;
}

interface UPSCHexagonGridProps {
  subjects: Subject[];
}

const gsColors: Record<string, string> = {
  "GS1": "from-blue-500 to-blue-600",
  "GS2": "from-emerald-500 to-emerald-600",
  "GS3": "from-purple-500 to-purple-600",
  "GS4": "from-orange-500 to-orange-600",
  "CA": "from-rose-500 to-rose-600",
};

const UPSCHexagonGrid = ({ subjects }: UPSCHexagonGridProps) => {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Subject Command</h2>
          <p className="text-sm text-slate-500 mt-1">Select your battleground</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">GS1</span>
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">GS2</span>
          <span className="px-2 py-1 rounded bg-purple-100 text-purple-700">GS3</span>
          <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">GS4</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {subjects.map((subject) => (
          <Link
            key={subject.slug}
            to={`/upscbriefs/${subject.slug}`}
            className="group relative"
          >
            <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-5 transition-all duration-300 hover:border-transparent hover:shadow-xl hover:shadow-slate-300/50 hover:-translate-y-2 hover:scale-[1.02] overflow-hidden">
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gsColors[subject.gsPaper] || gsColors["CA"]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* GS Paper badge */}
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 bg-gradient-to-r ${gsColors[subject.gsPaper] || gsColors["CA"]} text-white group-hover:bg-white/20 transition-all duration-300`}>
                  {subject.gsPaper}
                </span>
                
                {/* Icon */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110"
                  style={{ backgroundColor: `${subject.color}15` }}
                >
                  <subject.icon 
                    className="w-6 h-6 transition-all duration-300 group-hover:text-white group-hover:scale-110" 
                    style={{ color: subject.color }}
                  />
                </div>
                
                {/* Title */}
                <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors duration-300 mb-1">
                  {subject.name}
                </h3>
                
                {/* Article count */}
                <p className="text-sm text-slate-500 group-hover:text-white/80 transition-colors duration-300">
                  {subject.articleCount} briefs
                </p>
                
                {/* Arrow indicator on hover */}
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-white text-lg">→</span>
                </div>
              </div>
              
              {/* Decorative corner */}
              <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-10 group-hover:opacity-30 group-hover:scale-150 transition-all duration-300" style={{ backgroundColor: subject.color }} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default UPSCHexagonGrid;
