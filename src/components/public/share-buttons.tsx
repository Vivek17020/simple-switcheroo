import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Link, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShares } from "@/hooks/use-shares";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  articleId: string;
}

export function ShareButtons({ url, title, description, articleId }: ShareButtonsProps) {
  const { toast } = useToast();
  const { trackShare, isLoading } = useShares(articleId);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      await trackShare('copy');
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform: string, shareUrl: string) => {
    await trackShare(platform);
    window.open(shareUrl, "_blank");
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('twitter', shareLinks.twitter)}
        disabled={isLoading}
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('facebook', shareLinks.facebook)}
        disabled={isLoading}
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('linkedin', shareLinks.linkedin)}
        disabled={isLoading}
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('whatsapp', shareLinks.whatsapp)}
        disabled={isLoading}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        disabled={isLoading}
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );
}