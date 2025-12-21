import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { useWeb3Progress } from "@/hooks/use-web3-progress";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Web3ProgressButtonProps {
  articleId: string;
  readingTime?: number;
  variant?: "default" | "outline" | "ghost";
}

export function Web3ProgressButton({
  articleId,
  readingTime,
  variant = "default",
}: Web3ProgressButtonProps) {
  const { user } = useAuth();
  const { articleProgress, markComplete, isMarkingComplete } =
    useWeb3Progress(articleId);
  const [timeSpent, setTimeSpent] = useState(0);

  // Track time spent on page
  useEffect(() => {
    if (!user) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleMarkComplete = () => {
    if (!user) {
      toast.error("Please login to track your progress");
      return;
    }

    markComplete({
      articleId,
      readingTime: timeSpent || readingTime,
    });
  };

  const isCompleted = articleProgress?.completed;

  if (!user) return null;

  return (
    <Button
      onClick={handleMarkComplete}
      disabled={isCompleted || isMarkingComplete}
      variant={isCompleted ? "outline" : variant}
      className={
        isCompleted
          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
          : "bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white hover:opacity-90"
      }
    >
      {isCompleted ? (
        <>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Completed
        </>
      ) : (
        <>
          <Circle className="w-4 h-4 mr-2" />
          {isMarkingComplete ? "Marking..." : "Mark as Complete"}
        </>
      )}
    </Button>
  );
}
