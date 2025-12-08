import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticleForm } from '@/components/admin/article-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AdminEditArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle();
    } else {
      setError('No article ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to edit articles",
          variant: "destructive",
        });
        navigate('/admin/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch article');
      }

      if (!data) {
        throw new Error('Article not found');
      }

      console.log('Article loaded successfully:', data.title);
      setArticle(data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching article:', error);
      const errorMessage = error?.message || 'Failed to fetch article';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Article not found. It may have been deleted or the ID is incorrect.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <ArticleForm article={article} onSave={fetchArticle} />
    </div>
  );
}