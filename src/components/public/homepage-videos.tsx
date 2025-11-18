import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  description: string | null;
  category: string;
}

const categories = [
  { id: 'all', name: 'All Videos' },
  { id: 'sports', name: 'Sports' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'news', name: 'News' },
  { id: 'technology', name: 'Technology' },
  { id: 'business', name: 'Business' },
  { id: 'lifestyle', name: 'Lifestyle' },
];

export function HomepageVideos() {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const { data: allVideos, isLoading } = useQuery({
    queryKey: ['homepage-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_videos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Video[];
    },
  });

  const videos = activeCategory === 'all' 
    ? allVideos 
    : allVideos?.filter(v => v.category === activeCategory);

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?\s]+)/);
    return match ? match[1] : null;
  };

  const extractDuration = (description: string | null) => {
    if (!description) return null;
    const match = description.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Play className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Videos</h2>
          <span className="text-sm text-muted-foreground">›</span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Skeleton key={cat.id} className="h-10 w-24 flex-shrink-0" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="w-full aspect-video" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  const [featuredVideo, ...sideVideos] = videos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Play className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Videos</h2>
        <span className="text-sm text-muted-foreground">›</span>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(category.id)}
            className={activeCategory === category.id ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {category.name}
          </Button>
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Video - Left Side */}
        <div className="lg:col-span-2">
          <a
            href={featuredVideo.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {extractVideoId(featuredVideo.youtube_url) && (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${extractVideoId(featuredVideo.youtube_url)}/maxresdefault.jpg`}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                  
                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                    <h3 className="text-white text-xl font-bold line-clamp-2">
                      {featuredVideo.title}
                    </h3>
                  </div>
                </>
              )}
            </div>
          </a>
        </div>
        
        {/* Must Watch Sidebar - Right Side */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Must Watch</h3>
          
          <div className="space-y-3">
            {sideVideos.slice(0, 4).map((video) => {
              const videoId = extractVideoId(video.youtube_url);
              const duration = extractDuration(video.description);
              
              return (
                <a
                  key={video.id}
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-40 aspect-video bg-black rounded overflow-hidden flex-shrink-0">
                      {videoId && (
                        <>
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Play Button */}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center">
                              <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                          
                          {/* Duration Badge */}
                          {duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                              {duration}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold line-clamp-3 group-hover:text-primary transition-colors text-sm leading-tight">
                        {video.title}
                      </h4>
                      {duration && (
                        <p className="text-xs text-muted-foreground mt-1">{duration}</p>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
