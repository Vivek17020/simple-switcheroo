import { useWebStories } from '@/hooks/use-web-stories';
import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { SEOHead } from '@/utils/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar } from 'lucide-react';

export default function WebStoryIndex() {
  const { stories, loading } = useWebStories('published');

  return (
    <>
      <SEOHead
        title="Web Stories"
        description="Discover our latest visual stories. Quick, engaging, and immersive content designed for mobile viewing."
        url={`${window.location.origin}/web-stories`}
        type="website"
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12 mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Web Stories
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Immersive visual stories designed for mobile
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">No Stories Yet</h2>
                <p className="text-muted-foreground">
                  Check back soon for new web stories!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {stories.map((story) => (
                  <a
                    key={story.id}
                    href={`/webstories/${story.category.toLowerCase()}/${story.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-glow">
                      <CardContent className="p-0">
                        <div className="relative aspect-[9/16] bg-muted overflow-hidden">
                          {story.featured_image ? (
                            <img
                              src={story.featured_image}
                              alt={story.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                              <BookOpen className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-primary/90 backdrop-blur-sm">
                              {story.category}
                            </Badge>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-bold text-sm line-clamp-2 mb-2">
                              {story.title}
                            </h3>
                            <div className="flex items-center gap-2 text-white/80 text-xs">
                              <Calendar className="w-3 h-3" />
                              {new Date(story.published_at!).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
                            {story.slides?.length || 0} slides
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
