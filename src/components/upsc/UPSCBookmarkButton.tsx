import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleBookmark, useIsBookmarked } from "@/hooks/use-upsc-progress";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UPSCBookmarkButtonProps {
  articleId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export const UPSCBookmarkButton = ({
  articleId,
  variant = "ghost",
  size = "sm",
  showLabel = true,
  className,
}: UPSCBookmarkButtonProps) => {
  const { user } = useAuth();
  const isBookmarked = useIsBookmarked(articleId);
  const { mutate: toggleBookmark, isPending } = useToggleBookmark();

  const handleClick = () => {
    if (!user) {
      toast.error("Please login to bookmark articles");
      return;
    }
    
    toggleBookmark(articleId, {
      onSuccess: (result) => {
        if (result.action === 'added') {
          toast.success("Article bookmarked!");
        } else {
          toast.success("Bookmark removed");
        }
      },
      onError: () => {
        toast.error("Failed to update bookmark");
      },
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        isBookmarked && "text-yellow-600 hover:text-yellow-700",
        className
      )}
    >
      <Bookmark
        className={cn(
          "w-4 h-4",
          showLabel && "mr-1",
          isBookmarked && "fill-current"
        )}
      />
      {showLabel && (isBookmarked ? "Saved" : "Save")}
    </Button>
  );
};
