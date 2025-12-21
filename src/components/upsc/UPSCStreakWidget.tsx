import { Flame, Trophy, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStudyStreak, useBadges, useUserBadges } from "@/hooks/use-upsc-streaks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface UPSCStreakWidgetProps {
  compact?: boolean;
  className?: string;
}

const badgeIcons: Record<string, React.ElementType> = {
  award: Trophy,
  flame: Flame,
  trophy: Trophy,
  building: Star,
  'book-open': Star,
  star: Star,
};

export const UPSCStreakWidget = ({ compact = false, className }: UPSCStreakWidgetProps) => {
  const { data: streak, isLoading: streakLoading } = useStudyStreak();
  const { data: allBadges } = useBadges();
  const { data: userBadges } = useUserBadges();

  if (streakLoading) {
    return <Skeleton className={cn("h-32", className)} />;
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const totalXp = streak?.total_xp || 0;
  const earnedBadgeIds = userBadges?.map(ub => ub.badge_id) || [];

  // Calculate next badge progress
  const nextBadge = allBadges?.find(b => b.xp_required > totalXp);
  const prevBadgeXp = allBadges?.filter(b => b.xp_required <= totalXp).pop()?.xp_required || 0;
  const xpProgress = nextBadge 
    ? ((totalXp - prevBadgeXp) / (nextBadge.xp_required - prevBadgeXp)) * 100 
    : 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg", className)}>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-lg text-gray-900">{currentStreak}</span>
          <span className="text-sm text-gray-600">day streak</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-lg text-gray-900">{totalXp}</span>
          <span className="text-sm text-gray-600">XP</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5" />
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Streak Display */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-xs text-gray-500">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{longestStreak}</div>
            <div className="text-xs text-gray-500">Longest Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalXp}</div>
            <div className="text-xs text-gray-500">Total XP</div>
          </div>
        </div>

        {/* Next Badge Progress */}
        {nextBadge && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Next: {nextBadge.name}</span>
              <span className="text-gray-500">{totalXp}/{nextBadge.xp_required} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        )}

        {/* Earned Badges */}
        {userBadges && userBadges.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Earned Badges</div>
            <div className="flex flex-wrap gap-2">
              {userBadges.map((ub) => {
                const IconComponent = badgeIcons[ub.badge?.icon || 'star'] || Star;
                return (
                  <div
                    key={ub.id}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-full text-xs"
                    title={ub.badge?.description || ''}
                  >
                    <IconComponent className="w-3 h-3 text-yellow-600" />
                    <span className="text-gray-700">{ub.badge?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
