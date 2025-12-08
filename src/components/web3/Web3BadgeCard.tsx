import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface Web3BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  color?: string;
  earned?: boolean;
  earnedAt?: string;
}

const colorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  purple: "from-purple-500 to-purple-600",
  green: "from-green-500 to-green-600",
  yellow: "from-yellow-500 to-yellow-600",
  pink: "from-pink-500 to-pink-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
  gold: "from-yellow-400 to-yellow-600",
  cyan: "from-cyan-500 to-cyan-600",
};

export function Web3BadgeCard({
  name,
  description,
  icon,
  points,
  category,
  color = "blue",
  earned = false,
  earnedAt,
}: Web3BadgeCardProps) {
  const IconComponent = (Icons as any)[icon] || Icons.Award;
  const gradientClass = colorMap[color] || colorMap.blue;

  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-lg",
        earned
          ? "bg-gradient-to-br from-white to-gray-50"
          : "bg-gray-100 opacity-60"
      )}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center",
            earned
              ? `bg-gradient-to-br ${gradientClass}`
              : "bg-gray-300"
          )}
        >
          <IconComponent className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {points} points
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {category}
            </Badge>
          </div>
        </div>

        {earned && earnedAt && (
          <p className="text-xs text-muted-foreground">
            Earned on {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
        
        {!earned && (
          <p className="text-xs text-muted-foreground font-medium">
            🔒 Locked
          </p>
        )}
      </div>
    </Card>
  );
}
