import { useParams, useNavigate } from 'react-router-dom';
import { WebStoryForm } from '@/components/admin/web-story-form';
import { WebStoryAMPValidator } from '@/components/admin/web-story-amp-validator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useWebStory } from '@/hooks/use-web-stories';

export default function AdminEditWebStory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { story, loading } = useWebStory(id!);

  const handleSave = () => {
    navigate('/admin/web-stories');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Story Not Found</h2>
        <p className="text-muted-foreground mb-4">The web story you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/admin/web-stories')}>
          Back to Stories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/web-stories')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stories
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          Edit Web Story
        </h1>
        <p className="text-muted-foreground mt-2">
          Update your AMP-based web story
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WebStoryForm
            initialData={{
              id: story.id,
              title: story.title,
              category: story.category,
              description: story.description || '',
              slides: story.slides,
              status: story.status,
              canonical_url: story.canonical_url || '',
            }}
            onSave={handleSave}
          />
        </div>
        
        <div className="lg:col-span-1">
          {story.status === 'published' && (
            <WebStoryAMPValidator 
              storySlug={story.slug}
              storyTitle={story.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
