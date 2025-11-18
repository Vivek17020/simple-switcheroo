import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WebStorySlide {
  image: string;
  text: string;
}

export interface WebStory {
  id: string;
  title: string;
  category: string;
  description: string | null;
  slug: string;
  slides: WebStorySlide[];
  status: string;
  featured_image: string | null;
  canonical_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export function useWebStories(status?: string) {
  const [stories, setStories] = useState<WebStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [status]);

  const fetchStories = async () => {
    try {
      let query = supabase
        .from('web_stories' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStories((data || []) as unknown as WebStory[]);
    } catch (error) {
      console.error('Error fetching web stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch web stories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { stories, loading, refetch: fetchStories };
}

export function useWebStory(id: string) {
  const [story, setStory] = useState<WebStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStory();
    }
  }, [id]);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('web_stories' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setStory(data as unknown as WebStory);
    } catch (error) {
      console.error('Error fetching web story:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch web story',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { story, loading, refetch: fetchStory };
}

export function useWebStoryBySlug(slug: string) {
  const [story, setStory] = useState<WebStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchStory();
    }
  }, [slug]);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('web_stories' as any)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      setStory(data as unknown as WebStory);
    } catch (error) {
      console.error('Error fetching web story:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch web story',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { story, loading, refetch: fetchStory };
}
