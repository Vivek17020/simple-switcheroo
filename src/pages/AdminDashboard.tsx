import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  PlusCircle, 
  Eye, 
  Calendar,
  TrendingUp,
  Users,
  Edit3,
  Search
} from 'lucide-react';
import { AdvancedAnalytics } from '@/components/analytics/advanced-analytics';
import { VAPIDGenerator } from '@/components/pwa/vapid-generator';
import { AnalyticsExportFixed as AnalyticsExport } from '@/components/analytics/analytics-export-fixed';
import { EnhancedPushNotification } from '@/components/pwa/enhanced-push-notification';
import { SeoHealthDashboard } from '@/components/admin/seo-health-dashboard';
import { SeoVerificationDashboard } from '@/components/admin/seo-verification-dashboard';

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
}

interface RecentArticle {
  id: string;
  title: string;
  published: boolean;
  created_at: string;
  views_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
  });
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { data: articles } = await supabase
        .from('articles')
        .select('published, views_count');

      if (articles) {
        const publishedArticles = articles.filter(a => a.published).length;
        const totalViews = articles.reduce((sum, a) => sum + (a.views_count || 0), 0);
        
        setStats({
          totalArticles: articles.length,
          publishedArticles,
          draftArticles: articles.length - publishedArticles,
          totalViews,
        });
      }

      // Fetch recent articles
      const { data: recent } = await supabase
        .from('articles')
        .select('id, title, published, created_at, views_count')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent) {
        setRecentArticles(recent);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Articles',
      value: stats.totalArticles,
      icon: FileText,
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      title: 'Published',
      value: stats.publishedArticles,
      icon: Eye,
      gradient: 'from-green-500 to-blue-500',
    },
    {
      title: 'Drafts',
      value: stats.draftArticles,
      icon: Edit3,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your content.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300">
          <Link to="/admin/articles/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="mr-2 h-4 w-4" />
            SEO Health
          </TabsTrigger>
          <TabsTrigger value="verification">
            <Search className="mr-2 h-4 w-4" />
            SEO Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat) => (
              <Card key={stat.title} className="relative overflow-hidden border-border/50 hover:shadow-accent transition-all duration-300">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-bl-full`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Articles */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Articles</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/articles">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentArticles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(article.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {article.views_count || 0} views
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={article.published ? "default" : "secondary"}>
                            {article.published ? 'Published' : 'Draft'}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/articles/${article.id}/edit`}>
                              <Edit3 className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {recentArticles.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No articles yet. Create your first article to get started!</p>
                        <Button asChild className="mt-4">
                          <Link to="/admin/articles/new">Create Article</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/admin/articles/new">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create New Article
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/admin/articles">
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Articles
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/admin/settings">
                      <Users className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Database</span>
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Storage</span>
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">CDN</span>
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Online
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <AdvancedAnalytics />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VAPIDGenerator />
              <EnhancedPushNotification />
            </div>
            
            <AnalyticsExport />
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <SeoHealthDashboard />
        </TabsContent>

        <TabsContent value="verification">
          <SeoVerificationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}