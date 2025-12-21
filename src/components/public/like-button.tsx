import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLikes } from '@/hooks/use-likes';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  articleId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

export function LikeButton({ 
  articleId, 
  showCount = true, 
  size = 'md',
  variant = 'ghost'
}: LikeButtonProps) {
  const { isLiked, likesCount, toggleLike, isLoading } = useLikes(articleId);

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <Button
      variant={variant}
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={toggleLike}
      disabled={isLoading}
      className={cn(
        "gap-2 transition-all duration-200",
        isLiked && "text-red-500 hover:text-red-600"
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          isLiked && "fill-current"
        )} 
      />
      {showCount && (
        <span className="text-sm font-medium">
          {likesCount > 0 ? likesCount : ''}
        </span>
      )}
    </Button>
  );
}