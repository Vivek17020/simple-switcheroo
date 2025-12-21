import { Brain, Target, TrendingUp, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlashcardProgress } from "@/hooks/use-upsc-flashcards";

interface UPSCFlashcardStatsProps {
  totalCards: number;
  progress: FlashcardProgress[];
  sessionStats: {
    viewed: number;
    mastered: number;
    learning: number;
  };
}

export const UPSCFlashcardStats = ({ 
  totalCards, 
  progress,
  sessionStats 
}: UPSCFlashcardStatsProps) => {
  // Calculate overall mastery
  const masteredCards = progress.filter(p => p.mastery_level >= 4).length;
  const learningCards = progress.filter(p => p.mastery_level > 0 && p.mastery_level < 4).length;
  const newCards = totalCards - masteredCards - learningCards;
  const masteryPercentage = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

  // Calculate average mastery level
  const avgMastery = progress.length > 0 
    ? progress.reduce((acc, p) => acc + p.mastery_level, 0) / progress.length 
    : 0;

  const stats = [
    {
      label: "Total Cards",
      value: totalCards,
      icon: Brain,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Mastered",
      value: masteredCards,
      icon: Star,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Learning",
      value: learningCards,
      icon: Target,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "New",
      value: newCards,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall mastery progress */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Mastery</span>
            <span className="text-sm font-bold text-green-600">{Math.round(masteryPercentage)}%</span>
          </div>
          <Progress value={masteryPercentage} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{masteredCards} mastered</span>
            <span>{totalCards - masteredCards} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Session stats */}
      {sessionStats.viewed > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">This Session</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{sessionStats.viewed}</div>
                <div className="text-xs text-gray-500">Reviewed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{sessionStats.mastered}</div>
                <div className="text-xs text-gray-500">Mastered</div>
              </div>
              <div>
                <div className="text-xl font-bold text-amber-600">{sessionStats.learning}</div>
                <div className="text-xs text-gray-500">Learning</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mastery level indicator */}
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-8 h-2 rounded-full transition-colors ${
              level <= Math.round(avgMastery)
                ? "bg-green-500"
                : "bg-gray-200"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-500">
          Avg: {avgMastery.toFixed(1)}/5
        </span>
      </div>
    </div>
  );
};
