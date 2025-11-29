import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface PathStep {
  title: string;
  description?: string;
  article_slug?: string;
  completed?: boolean;
}

interface LearningPathProps {
  title: string;
  description: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  steps: PathStep[];
  slug?: string;
}

export function LearningPath({ title, description, duration, level, steps, slug }: LearningPathProps) {
  const levelColors = {
    Beginner: "bg-green-100 text-green-700",
    Intermediate: "bg-yellow-100 text-yellow-700",
    Advanced: "bg-red-100 text-red-700",
  };

  const content = (
    <div className="h-full p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-[#6A5BFF] hover:shadow-lg transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <Badge className={`${levelColors[level]} border-0`}>{level}</Badge>
        <span className="text-xs text-gray-500 font-medium">{duration}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#6A5BFF] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      
      <div className="space-y-3 mb-6">
        {steps.slice(0, 4).map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            {step.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${step.completed ? "text-gray-900 font-medium" : "text-gray-600"}`}>
              {step.title}
            </span>
          </div>
        ))}
        {steps.length > 4 && (
          <p className="text-xs text-gray-500 ml-8">+{steps.length - 4} more steps</p>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full group-hover:bg-[#6A5BFF] group-hover:text-white group-hover:border-[#6A5BFF] transition-colors"
      >
        Start Learning
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  if (slug) {
    return <Link to={`/web3forindia/learning-path/${slug}`}>{content}</Link>;
  }

  return content;
}
