import { useNavigate } from 'react-router-dom';
import { WebStoryForm } from '@/components/admin/web-story-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AdminNewWebStory() {
  const navigate = useNavigate();

  const handleSave = () => {
    navigate('/admin/web-stories');
  };

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
          Create New Web Story
        </h1>
        <p className="text-muted-foreground mt-2">
          Create an AMP-based web story for Google Discover
        </p>
      </div>

      <WebStoryForm onSave={handleSave} />
    </div>
  );
}
