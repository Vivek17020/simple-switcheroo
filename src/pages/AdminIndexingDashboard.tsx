import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  ExternalLink,
  Clock,
  Zap
} from "lucide-react";

export default function AdminIndexingDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [isIndexing, setIsIndexing] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const triggerBulkIndexing = async () => {
    setIsIndexing(true);
    try {
      const { data, error } = await supabase.functions.invoke('index-all-pages');
      
      if (error) throw error;
      
      toast({
        title: "Bulk Indexing Started",
        description: `Submitting ${data.stats?.totalUrls || 'all'} URLs to search engines`,
      });
      
      // Refresh logs after a delay
      setTimeout(loadLogs, 3000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setLogs(data || []);
      
      // Calculate stats
      const successCount = data?.filter(log => log.status === 'success').length || 0;
      const failedCount = data?.filter(log => log.status === 'failed').length || 0;
      
      setStats({
        total: data?.length || 0,
        success: successCount,
        failed: failedCount,
        successRate: data?.length ? Math.round((successCount / data.length) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Indexing Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage search engine indexing for all pages
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Every published article is automatically submitted to Google, Bing, and other search engines.
            Use bulk indexing to submit all existing pages at once.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Indexing Actions
            </CardTitle>
            <CardDescription>
              Manually trigger indexing for all pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={triggerBulkIndexing} 
                disabled={isIndexing}
                size="lg"
              >
                {isIndexing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Index All Pages Now
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={loadLogs}
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Logs
              </Button>

              <Button 
                variant="outline" 
                asChild
                size="lg"
              >
                <a 
                  href="https://search.google.com/search-console" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Search Console
                </a>
              </Button>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Indexing Activity
            </CardTitle>
            <CardDescription>
              Latest search engine submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No indexing activity yet</p>
                  <p className="text-sm mt-1">Publish an article or trigger bulk indexing</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.action_type}</span>
                          <Badge variant="outline">{log.service_name}</Badge>
                          {log.status === 'success' ? (
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                          {log.retry_count > 0 && ` • ${log.retry_count} retries`}
                        </div>
                        
                        {log.error_message && log.status === 'failed' && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              How to verify your indexing setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">1. Check Google Search Console</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Verify your site is connected and submit your sitemap
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://search.google.com/search-console" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open Search Console <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Verify Sitemaps</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <a 
                      href="https://www.thebulletinbriefs.in/sitemap.xml" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Main Sitemap
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <a 
                      href="https://www.thebulletinbriefs.in/news-sitemap.xml" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      News Sitemap
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <a 
                      href="https://www.thebulletinbriefs.in/robots.txt" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Robots.txt
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Test Your Pages</h4>
                <p className="text-sm text-muted-foreground">
                  Use Google's URL Inspection tool to check if pages are indexed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
