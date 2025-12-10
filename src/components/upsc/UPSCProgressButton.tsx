import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkArticleComplete, useIsCompleted } from "@/hooks/use-upsc-progress";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UPSCProgressButtonProps {
  articleId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export const UPSCProgressButton = ({
  articleId,
  variant = "default",
  size = "sm",
  showLabel = true,
  className,
}: UPSCProgressButtonProps) => {
  const { user } = useAuth();
  const isCompleted = useIsCompleted(articleId);
  const { mutate: markComplete, isPending } = useMarkArticleComplete();
  const [timeSpent, setTimeSpent] = useState(0);

  // Track time spent reading
  useEffect(() => {
    if (!user || isCompleted) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isCompleted]);

  const handleClick = () => {
    if (!user) {
      toast.error("Please login to track your progress");
      return;
    }

    markComplete(
      { article_id: articleId, time_spent_seconds: timeSpent },
      {
        onSuccess: () => {
          toast.success("Article marked as complete! +10 XP");
        },
        onError: () => {
          toast.error("Failed to mark article as complete");
        },
      }
    );
  };

  if (!user) return null;

  return (
    <Button
      variant={isCompleted ? "outline" : variant}
      size={size}
      onClick={handleClick}
      disabled={isCompleted || isPending}
      className={cn(
        isCompleted
          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
          : "bg-blue-600 text-white hover:bg-blue-700",
        className
      )}
    >
      {isCompleted ? (
        <>
          <CheckCircle2 className={cn("w-4 h-4", showLabel && "mr-1")} />
          {showLabel && "Completed"}
        </>
      ) : (
        <>
          <Circle className={cn("w-4 h-4", showLabel && "mr-1")} />
          {showLabel && (isPending ? "Marking..." : "Mark Complete")}
        </>
      )}
    </Button>
  );
};
