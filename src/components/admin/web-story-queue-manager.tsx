import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, Trash2, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface QueueItem {
  id: string;
  story_id: string;
  scheduled_at: string;
  priority: number;
  auto_publish: boolean;
  review_status: string;
  created_at: string;
  web_stories: {
    id: string;
    title: string;
    category: string;
    status: string;
  };
}

export function WebStoryQueueManager() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('web_stories_queue')
        .select(`
          *,
          web_stories (
            id,
            title,
            category,
            status
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setQueueItems(data || []);
    } catch (error: any) {
      console.error('Error fetching queue:', error);
      toast({
        title: 'Error loading queue',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to queue changes
    const subscription = supabase
      .channel('queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'web_stories_queue' },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleApprove = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('web_stories_queue')
        .update({ review_status: 'approved' })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: '✅ Story approved',
        description: 'Story will be published at scheduled time'
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        title: 'Error approving story',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('web_stories_queue')
        .update({ review_status: 'rejected' })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Story rejected',
        description: 'Story will not be published'
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        title: 'Error rejecting story',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('web_stories_queue')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Removed from queue',
        description: 'Story removed from publishing queue'
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        title: 'Error removing story',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handlePublishNow = async (item: QueueItem) => {
    setPublishing(item.id);
    
    try {
      // Update story status
      const { error: updateError } = await supabase
        .from('web_stories')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', item.story_id);

      if (updateError) throw updateError;

      // Remove from queue
      await supabase
        .from('web_stories_queue')
        .delete()
        .eq('id', item.id);

      // Trigger indexing
      await supabase.functions.invoke('google-index-now', {
        body: {
          storyId: item.story_id,
          pageType: 'webstory',
          action: 'update'
        }
      });

      toast({
        title: '✅ Story published!',
        description: 'Story is now live and indexed'
      });

      fetchQueue();
    } catch (error: any) {
      toast({
        title: 'Error publishing story',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setPublishing(null);
    }
  };

  const handleGenerateTrendingStories = async () => {
    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-trending-webstories', {
        body: {
          triggered_at: new Date().toISOString(),
          trigger: 'manual'
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Story generation started!',
        description: `AI is discovering trending topics and creating ${data?.topicsFound || 'multiple'} web stories...`,
        duration: 5000
      });

      // Refresh queue after a delay
      setTimeout(() => {
        fetchQueue();
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error generating stories',
        description: error.message || 'Failed to trigger story generation',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const pendingItems = queueItems.filter(item => item.review_status === 'pending');
  const approvedItems = queueItems.filter(item => item.review_status === 'approved');
  const rejectedItems = queueItems.filter(item => item.review_status === 'rejected');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Publishing Queue
              </CardTitle>
              <CardDescription>
                Manage scheduled and pending web stories
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateTrendingStories}
              disabled={generating}
              className="bg-gradient-primary hover:bg-gradient-secondary"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Trending Stories
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 mb-4">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                Pending: {pendingItems.length}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Approved: {approvedItems.length}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" />
                Rejected: {rejectedItems.length}
              </span>
            </div>
          </div>

          {queueItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No stories in queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{item.web_stories.title}</h4>
                      <Badge variant={
                        item.review_status === 'approved' ? 'default' :
                        item.review_status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {item.review_status}
                      </Badge>
                      <Badge variant="outline">{item.web_stories.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.scheduled_at), { addSuffix: true })}
                      </span>
                      <span>
                        {new Date(item.scheduled_at).toLocaleString()}
                      </span>
                      {item.auto_publish && (
                        <Badge variant="outline" className="text-xs">Auto-publish</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.review_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(item.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {item.review_status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishNow(item)}
                        disabled={publishing === item.id}
                      >
                        {publishing === item.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        Publish Now
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
