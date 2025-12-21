import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play } from "lucide-react";

interface RelatedVideosProps {
  category?: string;
  limit?: number;
}

// Extract YouTube video ID from URL (handles Shorts, regular watch URLs, and youtu.be)
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?\s]+)/);
  return match ? match[1] : null;
}

export function RelatedVideos({ category, limit = 3 }: RelatedVideosProps) {
  const queryClient = useQueryClient();
  
  const { data: videos, isLoading } = useQuery({
    queryKey: ["related-videos", category],
    queryFn: async () => {
      let query = supabase
        .from("homepage_videos")
        .select("id, title, youtube_url, category, description")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(limit);

      // Filter by category if provided
      if (category) {
        query = query.ilike("category", `%${category}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // If no category match, get any videos
      if (!data || data.length === 0) {
        const { data: anyVideos } = await supabase
          .from("homepage_videos")
          .select("id, title, youtube_url, category, description")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(limit);
        return anyVideos || [];
      }
      
      return data;
    },
    staleTime: 0, // Always fetch fresh data
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('related-videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'homepage_videos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['related-videos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading || !videos || videos.length === 0) {
    return null;
  }

  return (
    <section className="my-12 py-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Play className="h-6 w-6 text-destructive" />
          <h2 className="text-2xl font-bold">Watch Related Videos</h2>
        </div>
        <a 
          href="/#videos" 
          className="text-sm text-primary hover:underline font-medium"
        >
          More Videos →
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((video) => {
          const videoId = getYouTubeId(video.youtube_url);
          const thumbnailUrl = videoId 
            ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            : "/placeholder.svg";
          
          return (
            <a
              key={video.id}
              href={video.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to mqdefault if maxresdefault doesn't exist
                    const target = e.target as HTMLImageElement;
                    if (videoId && target.src.includes('maxresdefault')) {
                      target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }
                  }}
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 bg-destructive rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="h-7 w-7 text-white ml-1" fill="currentColor" />
                  </div>
                </div>
                
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                  <span className="inline-block bg-destructive/90 text-white text-xs px-2 py-0.5 rounded mb-2">
                    {video.category}
                  </span>
                  <h3 className="text-white font-semibold line-clamp-2 text-sm">
                    {video.title}
                  </h3>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
