import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface RelatedWebStoriesProps {
  categorySlug?: string;
  tags?: string[];
  limit?: number;
}

export function RelatedWebStories({ categorySlug, tags, limit = 4 }: RelatedWebStoriesProps) {
  const { data: stories, isLoading } = useQuery({
    queryKey: ["related-web-stories", categorySlug, tags],
    queryFn: async () => {
      let query = supabase
        .from("web_stories")
        .select("id, title, slug, category, featured_image, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      // Try to match by category first
      if (categorySlug) {
        query = query.ilike("category", `%${categorySlug}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !stories || stories.length === 0) {
    return null;
  }

  return (
    <section className="my-12 py-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Trending Web Stories</h2>
        <Link 
          to="/web-stories" 
          className="text-sm text-primary hover:underline font-medium"
        >
          View All Stories →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stories.map((story) => (
          <Link
            key={story.id}
            to={`/amp-story/${story.category.toLowerCase()}/${story.slug}`}
            className="group"
          >
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
              <CardContent className="p-0 relative">
                <div className="aspect-[9/16] relative overflow-hidden">
                  <img
                    src={story.featured_image || "/placeholder.svg"}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Play indicator */}
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary fill-primary" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {story.category}
                    </Badge>
                    <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight">
                      {story.title}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
