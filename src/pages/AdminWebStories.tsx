import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  Calendar,
  Filter,
  BookOpen,
  RefreshCw,
  Globe,
  Loader2
} from 'lucide-react';
import { useWebStories, WebStory } from '@/hooks/use-web-stories';
import { WebStoryQueueManager } from '@/components/admin/web-story-queue-manager';

export default function AdminWebStories() {
  const { stories, loading, refetch } = useWebStories();
  const [filteredStories, setFilteredStories] = useState<WebStory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [indexingStoryId, setIndexingStoryId] = useState<string | null>(null);
  const [batchIndexing, setBatchIndexing] = useState(false);

  useEffect(() => {
    filterStories();
  }, [stories, searchTerm, statusFilter]);

  const filterStories = () => {
    let filtered = stories;

    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story.status === statusFilter);
    }

    setFilteredStories(filtered);
  };

  const handleRequestIndexing = async (storyId: string, storyTitle: string) => {
    setIndexingStoryId(storyId);
    try {
      const { data, error } = await supabase.functions.invoke('index-webstories', {
        body: { storyId, mode: 'single' }
      });

      if (error) throw error;

      toast({
        title: 'Indexing Requested',
        description: `Submitted "${storyTitle}" for search engine indexing. ${data?.urlsSubmitted || 0} URLs submitted.`,
      });
    } catch (error) {
      console.error('Error requesting indexing:', error);
      toast({
        title: 'Indexing Failed',
        description: 'Failed to submit story for indexing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIndexingStoryId(null);
    }
  };

  const handleBatchIndexing = async () => {
    setBatchIndexing(true);
    try {
      const { data, error } = await supabase.functions.invoke('index-webstories', {
        body: { mode: 'batch' }
      });

      if (error) throw error;

      toast({
        title: 'Batch Indexing Started',
        description: `Submitted ${data?.totalUrls || 0} web story URLs to search engines.`,
      });
    } catch (error) {
      console.error('Error batch indexing:', error);
      toast({
        title: 'Batch Indexing Failed',
        description: 'Failed to submit stories for indexing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBatchIndexing(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('web_stories' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Web Story Deleted',
        description: 'The web story has been successfully deleted.',
      });

      refetch();
    } catch (error) {
      console.error('Error deleting web story:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete web story',
        variant: 'destructive',
      });
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const { error } = await supabase
        .from('web_stories' as any)
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: newStatus === 'published' ? 'Story Published' : 'Story Unpublished',
        description: `The web story has been ${newStatus === 'published' ? 'published' : 'unpublished'}.`,
      });

      refetch();
    } catch (error) {
      console.error('Error updating web story:', error);
      toast({
        title: 'Error',
        description: 'Failed to update web story status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const publishedCount = stories.filter(s => s.status === 'published').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Web Stories
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage AMP-based Web Stories for Google Discover
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBatchIndexing}
            disabled={batchIndexing || publishedCount === 0}
            className="gap-2"
          >
            {batchIndexing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            Index All ({publishedCount})
          </Button>
          <Button asChild className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300">
            <Link to="/admin/web-stories/new">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Web Story
            </Link>
          </Button>
        </div>
      </div>

      <WebStoryQueueManager />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search web stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stories</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slides</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.map((story) => (
                  <TableRow key={story.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">
                          {story.title}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          /webstories/{story.category.toLowerCase()}/{story.slug}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={story.status === 'published' ? "default" : "secondary"}
                        className={story.status === 'published' ? "bg-success text-success-foreground" : ""}
                      >
                        {story.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {story.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {story.slides?.length || 0} slides
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(story.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {story.status === 'published' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRequestIndexing(story.id, story.title)}
                              disabled={indexingStoryId === story.id}
                              className="h-8 w-8 p-0"
                              title="Request Indexing"
                            >
                              {indexingStoryId === story.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                              title="View Story"
                            >
                              <a 
                                href={`/webstories/${story.category.toLowerCase()}/${story.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublishToggle(story.id, story.status)}
                          className="h-8 w-8 p-0"
                          title={story.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {story.status === 'published' ? '👁️' : '📝'}
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                          <Link to={`/admin/web-stories/${story.id}/edit`}>
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(story.id, story.title)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStories.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No stories found' : 'No web stories yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first web story to get started.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button asChild className="bg-gradient-primary hover:bg-gradient-secondary">
                  <Link to="/admin/web-stories/new">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Web Story
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
