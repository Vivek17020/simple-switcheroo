import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  RefreshCw,
  TrendingUp,
  FileText,
  Calendar,
  Zap
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ScheduledArticle {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  status: string;
  published_at: string;
  created_at: string;
  category_id: string;
}

interface GenerationResult {
  success: boolean;
  summary?: {
    topicsFound: number;
    articlesGenerated: number;
    articlesFailed: number;
    articlesSaved: number;
  };
  articles?: Array<{
    id: string;
    title: string;
    slug: string;
    scheduledAt: string;
  }>;
  error?: string;
}

export function AutoContentDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  const [recentGenerated, setRecentGenerated] = useState<ScheduledArticle[]>([]);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      // Fetch scheduled articles
      const { data: scheduled } = await supabase
        .from('articles')
        .select('id, title, slug, published, status, published_at, created_at, category_id')
        .eq('status', 'scheduled')
        .eq('published', false)
        .order('published_at', { ascending: true })
        .limit(20);

      // Fetch recently auto-generated articles (last 7 days)
      const { data: recent } = await supabase
        .from('articles')
        .select('id, title, slug, published, status, published_at, created_at, category_id')
        .eq('author', 'TheBulletinBriefs AI')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      setScheduledArticles(scheduled || []);
      setRecentGenerated(recent || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGeneration = async (count: number = 10) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setLastResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 5, 90));
    }, 2000);

    try {
      toast({
        title: "Starting article generation...",
        description: `Generating ${count} trending articles. This may take 2-5 minutes.`,
      });

      const { data, error } = await supabase.functions.invoke('auto-generate-articles', {
        body: { count }
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) throw error;

      setLastResult(data);
      
      toast({
        title: "Articles generated successfully!",
        description: `Generated ${data.summary?.articlesGenerated || 0} articles, ${data.summary?.articlesSaved || 0} saved.`,
      });

      // Refresh the article list
      await fetchArticles();

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Generation error:', error);
      
      setLastResult({
        success: false,
        error: error.message
      });

      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handlePublishNow = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          published: true,
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (error) throw error;

      toast({ title: "Article published!" });
      fetchArticles();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (article: ScheduledArticle) => {
    if (article.published) {
      return <Badge className="bg-green-500">Published</Badge>;
    }
    if (article.status === 'scheduled') {
      return <Badge className="bg-blue-500">Scheduled</Badge>;
    }
    return <Badge variant="secondary">{article.status}</Badge>;
  };

  const stats = {
    scheduled: scheduledArticles.length,
    generated: recentGenerated.length,
    published: recentGenerated.filter(a => a.published).length,
    pending: recentGenerated.filter(a => !a.published).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Autonomous Content Generator
          </h2>
          <p className="text-muted-foreground">
            AI-powered trending article generation for Finance, Tech, Business, Sports, Politics & more
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            ⚠️ Excludes: Web3, Jobs (manual content only)
          </p>
        </div>
        <Button onClick={() => fetchArticles()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.generated}</p>
                <p className="text-sm text-muted-foreground">Generated (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Manual Generation
          </CardTitle>
          <CardDescription>
            Trigger article generation manually. Articles will be scheduled throughout the day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleManualGeneration(5)} 
              disabled={isGenerating}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Generate 5 Articles
            </Button>
            <Button 
              onClick={() => handleManualGeneration(10)} 
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate 10 Articles
            </Button>
          </div>

          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating articles... This may take 2-5 minutes.
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          )}

          {lastResult && (
            <div className={`mt-4 p-4 rounded-lg ${lastResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              {lastResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Generation Complete!</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Topics found: {lastResult.summary?.topicsFound}</p>
                    <p>Articles generated: {lastResult.summary?.articlesGenerated}</p>
                    <p>Articles saved: {lastResult.summary?.articlesSaved}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>Error: {lastResult.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Article Lists */}
      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled ({stats.scheduled})
          </TabsTrigger>
          <TabsTrigger value="recent">
            <FileText className="h-4 w-4 mr-2" />
            Recent ({stats.generated})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Articles</CardTitle>
              <CardDescription>Articles waiting to be published</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : scheduledArticles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No scheduled articles. Generate some!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledArticles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{article.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(article.published_at), 'MMM d, h:mm a')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(article)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublishNow(article.id)}
                          >
                            Publish Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recently Generated</CardTitle>
              <CardDescription>AI-generated articles from the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : recentGenerated.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No articles generated yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentGenerated.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{article.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(article)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Automation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Morning Batch</p>
                <p className="text-muted-foreground">6:00 AM IST - 5 articles</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Evening Batch</p>
                <p className="text-muted-foreground">6:00 PM IST - 5 articles</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Included Categories
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Finance, Technology, Business, Education, Defence, Politics, Sports, World
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                🚫 Excluded Categories (Manual Only)
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Web3 for India, Government Jobs, Private Jobs
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Articles are automatically published every 30 minutes based on their scheduled time.
              To enable automation, run the SQL in <code>auto-generate-articles-cron.sql</code> in your Supabase SQL Editor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
