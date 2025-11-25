import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebStory } from '@/hooks/use-web-stories';

const categories = ['Latest', 'Defence', 'Jobs', 'Tech', 'Global', 'Business'];

export function WebStoriesSection() {
  const [stories, setStories] = useState<WebStory[]>([]);
  const [activeCategory, setActiveCategory] = useState('Latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [activeCategory]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('web_stories' as any)
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activeCategory !== 'Latest') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStories((data || []) as unknown as WebStory[]);
    } catch (error) {
      console.error('Error fetching web stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && stories.length === 0) {
    return null;
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        {/* Header with Categories */}
        <div className="flex items-center justify-between mb-6">
          <a 
            href="/web-stories"
            className="text-2xl font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            Web Stories
            <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </a>

          {/* Category Tabs */}
          <div className="hidden md:flex items-center gap-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-sm font-medium transition-all duration-300 pb-1 ${
                  activeCategory === category
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Category Tabs */}
        <div className="flex md:hidden overflow-x-auto gap-3 mb-6 pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-sm font-medium whitespace-nowrap px-4 py-2 rounded-full transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stories Grid - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-4">
            {stories.map((story) => (
              <a
                key={story.id}
                href={`/webstories/${story.category.toLowerCase()}/${story.slug}`}
                className="group flex-shrink-0 w-64 relative rounded-lg overflow-hidden bg-muted hover-scale"
              >
                {/* Story Image */}
                <div className="relative aspect-[9/16] overflow-hidden">
                  <img
                    src={story.featured_image || story.slides[0]?.image || '/placeholder.svg'}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Progress Indicator */}
                  <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
                    {story.slides.slice(0, 8).map((_, index) => (
                      <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full" />
                    ))}
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-white/80 text-xs">
                      {new Date(story.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
