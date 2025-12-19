import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  category: string;
}

const VIDEO_CATEGORIES = [
  { value: 'all', label: 'All Videos' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'news', label: 'News' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

export default function AdminVideos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newVideo, setNewVideo] = useState({
    title: '',
    youtube_url: '',
    description: '',
    category: 'all',
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_videos')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Video[];
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = videos?.reduce((max, v) => Math.max(max, v.display_order), 0) || 0;
      
      const { error } = await supabase
        .from('homepage_videos')
        .insert({
          title: newVideo.title,
          youtube_url: newVideo.youtube_url,
          description: newVideo.description || null,
          display_order: maxOrder + 1,
          category: newVideo.category,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      setNewVideo({ title: '', youtube_url: '', description: '', category: 'all' });
      toast({ title: 'Video added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add video', variant: 'destructive' });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('homepage_videos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast({ title: 'Video deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete video', variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('homepage_videos')
        .update({ is_active: !is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast({ title: 'Video status updated' });
    },
  });

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Manage Homepage Videos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Video Title"
            value={newVideo.title}
            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
          />
          <Input
            placeholder="YouTube URL (https://www.youtube.com/watch?v=...)"
            value={newVideo.youtube_url}
            onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
          />
          <Textarea
            placeholder="Description (optional)"
            value={newVideo.description}
            onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
          />
          <Select
            value={newVideo.category}
            onValueChange={(value) => setNewVideo({ ...newVideo, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => addVideoMutation.mutate()}
            disabled={!newVideo.title || !newVideo.youtube_url || addVideoMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Current Videos</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : videos && videos.length > 0 ? (
          <div className="grid gap-4">
            {videos.map((video) => {
              const videoId = extractVideoId(video.youtube_url);
              return (
                <Card key={video.id} className={!video.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                      
                      {videoId && (
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold">{video.title}</h3>
                        <p className="text-xs font-medium text-primary">
                          {VIDEO_CATEGORIES.find(c => c.value === video.category)?.label || video.category}
                        </p>
                        {video.description && (
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{video.youtube_url}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={video.is_active ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ id: video.id, is_active: video.is_active })}
                        >
                          {video.is_active ? 'Active' : 'Inactive'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteVideoMutation.mutate(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No videos added yet</p>
        )}
      </div>
    </div>
  );
}
