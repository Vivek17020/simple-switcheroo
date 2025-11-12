import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Remove AdminLayout import as it's handled by routing
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Share, 
  MessageSquare, 
  Eye, 
  TrendingUp,
  Users,
  Bell,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArticleEngagement {
  id: string;
  title: string;
  slug: string;
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  published_at: string;
  categories: {
    name: string;
    color: string;
  };
}

interface EngagementStats {
  total_articles: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  total_subscribers: number;
}

export default function AdminEngagement() {
  const [articles, setArticles] = useState<ArticleEngagement[]>([]);
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEngagementData();
  }, []);

  const fetchEngagementData = async () => {
    try {
      // Fetch articles with engagement data
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          views_count,
          likes_count,
          shares_count,
          comments_count,
          published_at,
          categories:category_id(name, color)
        `)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(20);

      if (articlesError) throw articlesError;

      // Calculate total stats
      const totalViews = articlesData?.reduce((sum, article) => sum + (article.views_count || 0), 0) || 0;
      const totalLikes = articlesData?.reduce((sum, article) => sum + (article.likes_count || 0), 0) || 0;
      const totalShares = articlesData?.reduce((sum, article) => sum + (article.shares_count || 0), 0) || 0;
      const totalComments = articlesData?.reduce((sum, article) => sum + (article.comments_count || 0), 0) || 0;

      // Get subscriber count
      const { count: subscriberCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setArticles(articlesData || []);
      setStats({
        total_articles: articlesData?.length || 0,
        total_views: totalViews,
        total_likes: totalLikes,
        total_shares: totalShares,
        total_comments: totalComments,
        total_subscribers: subscriberCount || 0,
      });
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEngagementScore = (article: ArticleEngagement) => {
    const likes = article.likes_count || 0;
    const shares = article.shares_count || 0;
    const views = article.views_count || 0;
    const comments = article.comments_count || 0;
    
    return (likes * 3) + (shares * 5) + (views * 1) + (comments * 7);
  };

  const topEngaged = [...articles]
    .sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a))
    .slice(0, 10);

  const sendTestNotification = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notifications', {
        body: {
          articleId: 'test',
          title: 'Test Notification',
          excerpt: 'This is a test push notification from The Bulletin Briefs admin panel.'
        }
      });
      
      if (error) throw error;
      alert('Test notification sent successfully!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Engagement Analytics</h1>
            <p className="text-muted-foreground">
              Track user engagement across your articles
            </p>
          </div>
          <Button onClick={sendTestNotification} className="gap-2">
            <Bell className="h-4 w-4" />
            Test Push Notification
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_articles || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_views || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_likes || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <Share className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_shares || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_comments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_subscribers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Article Tables */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Articles</TabsTrigger>
            <TabsTrigger value="trending">Top Performing</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Articles</CardTitle>
                <CardDescription>
                  Engagement metrics for all published articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div key={article.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-medium line-clamp-2">{article.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {article.categories.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{article.views_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>{article.likes_count || 0} likes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Share className="h-4 w-4 text-muted-foreground" />
                          <span>{article.shares_count || 0} shares</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{article.comments_count || 0} comments</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performing Articles
                </CardTitle>
                <CardDescription>
                  Articles ranked by engagement score (likes×3 + shares×5 + views×1 + comments×7)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topEngaged.map((article, index) => (
                    <div key={article.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                            {index + 1}
                          </div>
                          <div className="space-y-1 flex-1">
                            <h3 className="font-medium line-clamp-2">{article.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {article.categories.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Score: {calculateEngagementScore(article)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{article.views_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>{article.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Share className="h-4 w-4 text-muted-foreground" />
                          <span>{article.shares_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{article.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}