import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Info, Wrench, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface SeoHealthIssue {
  id: string;
  url: string;
  issue_type: string;
  severity: 'critical' | 'warning' | 'info';
  notes: string;
  article_id: string;
  status: string;
  detected_at: string;
  article?: {
    title: string;
    slug: string;
  };
}

export function SeoHealthDashboard() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'with_issues' | 'resolved'>('all');
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'issues' | 'audit'>('issues');
  const queryClient = useQueryClient();

  // Fetch SEO health issues
  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['seo-health-issues', selectedFilter],
    queryFn: async () => {
      let query = supabase
        .from('seo_health_log')
        .select(`
          *,
          article:articles!seo_health_log_article_id_fkey(title, slug)
        `)
        .order('detected_at', { ascending: false });

      if (selectedFilter === 'with_issues') {
        query = query.eq('status', 'open');
      } else if (selectedFilter === 'resolved') {
        query = query.eq('status', 'resolved');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SeoHealthIssue[];
    }
  });

  // Scan all articles mutation
  const scanAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('scan-article-seo', {
        body: { scanAll: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('SEO scan completed successfully');
      queryClient.invalidateQueries({ queryKey: ['seo-health-issues'] });
    },
    onError: (error: any) => {
      toast.error('Failed to scan articles: ' + error.message);
    }
  });

  // Comprehensive audit mutation
  const auditMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('comprehensive-seo-audit');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Audit completed! ${data.metrics.auto_fixed} issues auto-fixed`);
      queryClient.invalidateQueries({ queryKey: ['seo-health-issues'] });
      queryClient.invalidateQueries({ queryKey: ['audit-reports'] });
    },
    onError: (error: any) => {
      toast.error('Audit failed: ' + error.message);
    }
  });

  // Fetch latest audit report
  const { data: latestAudit } = useQuery({
    queryKey: ['audit-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_audit_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Auto-fix mutation
  const autoFixMutation = useMutation({
    mutationFn: async ({ articleId, issueType, issueId }: { articleId: string; issueType: string; issueId: string }) => {
      setFixingIssues(prev => new Set(prev).add(issueId));
      
      const { data, error } = await supabase.functions.invoke('trigger-seo-autofix', {
        body: { articleId, issueType }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Auto-fix applied successfully');
      
      // Wait 15 seconds then refresh
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['seo-health-issues'] });
        setFixingIssues(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.issueId);
          return newSet;
        });
      }, 15000);
    },
    onError: (error: any, variables) => {
      toast.error('Failed to apply auto-fix: ' + error.message);
      setFixingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.issueId);
        return newSet;
      });
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-600 text-yellow-600">Warning</Badge>;
      case 'info':
        return <Badge variant="outline" className="border-blue-600 text-blue-600">Info</Badge>;
      default:
        return null;
    }
  };

  const getIssueTypeLabel = (issueType: string) => {
    const labels: Record<string, string> = {
      'missing_canonical': 'Missing Canonical',
      'duplicate_canonical': 'Duplicate Canonical',
      'missing_meta_title': 'Missing Meta Title',
      'meta_title_too_long': 'Meta Title Too Long',
      'missing_meta_description': 'Missing Meta Description',
      'meta_description_too_long': 'Meta Description Too Long',
      'missing_seo_keywords': 'Missing SEO Keywords',
      'short_content': 'Short Content',
      'soft_404': 'Soft 404',
      'not_indexed': 'Not Indexed',
      'crawled_not_indexed': 'Crawled - Not Indexed',
      'page_with_redirect': 'Page with Redirect'
    };
    return labels[issueType] || issueType;
  };

  const canAutoFix = (issueType: string) => {
    const autoFixable = [
      'missing_canonical',
      'duplicate_canonical',
      'missing_meta_title',
      'missing_meta_description',
      'short_content',
      'soft_404',
      'not_indexed',
      'crawled_not_indexed'
    ];
    return autoFixable.includes(issueType);
  };

  const groupedIssues = issues?.reduce((acc, issue) => {
    const articleId = issue.article_id;
    if (!acc[articleId]) {
      acc[articleId] = [];
    }
    acc[articleId].push(issue);
    return acc;
  }, {} as Record<string, SeoHealthIssue[]>);

  const stats = {
    total: issues?.length || 0,
    critical: issues?.filter(i => i.severity === 'critical').length || 0,
    warnings: issues?.filter(i => i.severity === 'warning').length || 0,
    resolved: issues?.filter(i => i.status === 'resolved').length || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI SEO Health Checker</h2>
          <p className="text-muted-foreground">
            Automated detection, fixing, and monitoring of SEO issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => scanAllMutation.mutate()}
            disabled={scanAllMutation.isPending}
            variant="outline"
          >
            {scanAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Quick Scan
              </>
            )}
          </Button>
          <Button
            onClick={() => auditMutation.mutate()}
            disabled={auditMutation.isPending}
          >
            {auditMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Run Full Audit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList>
          <TabsTrigger value="issues">SEO Issues</TabsTrigger>
          <TabsTrigger value="audit">Audit Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          {/* Issues Sub-tabs */}
          <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="with_issues">With Issues</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedFilter} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !groupedIssues || Object.keys(groupedIssues).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold">All Clear!</p>
                <p className="text-muted-foreground">No SEO issues found</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedIssues).map(([articleId, articleIssues]) => {
              const firstIssue = articleIssues[0];
              const articleTitle = firstIssue.article?.title || 'Unknown Article';
              const articleSlug = firstIssue.article?.slug || '';
              const allResolved = articleIssues.every(i => i.status === 'resolved');

              return (
                <Card key={articleId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {allResolved && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {articleTitle}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <a 
                            href={`https://www.thebulletinbriefs.in/article/${articleSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            /article/{articleSlug}
                          </a>
                        </CardDescription>
                      </div>
                      {allResolved && (
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          ✅ Healthy
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {articleIssues.map((issue) => {
                      const isFixing = fixingIssues.has(issue.id);
                      const isResolved = issue.status === 'resolved';

                      return (
                        <div
                          key={issue.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {getIssueTypeLabel(issue.issue_type)}
                                </span>
                                {getSeverityBadge(issue.severity)}
                                {isResolved && (
                                  <Badge variant="outline" className="border-green-600 text-green-600">
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {issue.notes}
                              </p>
                            </div>
                          </div>
                          {!isResolved && canAutoFix(issue.issue_type) && (
                            <Button
                              size="sm"
                              onClick={() =>
                                autoFixMutation.mutate({
                                  articleId: issue.article_id,
                                  issueType: issue.issue_type,
                                  issueId: issue.id
                                })
                              }
                              disabled={isFixing}
                            >
                              {isFixing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Fixing...
                                </>
                              ) : (
                                <>
                                  <Wrench className="mr-2 h-4 w-4" />
                                  Resolve Automatically
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Latest Audit Summary */}
          {latestAudit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Latest Audit Report
                </CardTitle>
                <CardDescription>
                  Completed {new Date(latestAudit.audit_completed_at || latestAudit.created_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Performance Metrics */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Detection Accuracy</span>
                      <span className={latestAudit.ai_detection_accuracy >= 90 ? 'text-green-600' : 'text-yellow-600'}>
                        {latestAudit.ai_detection_accuracy}%
                      </span>
                    </div>
                    <Progress value={latestAudit.ai_detection_accuracy} />
                    <p className="text-xs text-muted-foreground">
                      Target: ≥ 90% {latestAudit.ai_detection_accuracy >= 90 ? '✅' : '❌'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Auto-Fix Success Rate</span>
                      <span className={latestAudit.auto_fix_success_rate >= 95 ? 'text-green-600' : 'text-yellow-600'}>
                        {latestAudit.auto_fix_success_rate}%
                      </span>
                    </div>
                    <Progress value={latestAudit.auto_fix_success_rate} />
                    <p className="text-xs text-muted-foreground">
                      Target: ≥ 95% {latestAudit.auto_fix_success_rate >= 95 ? '✅' : '❌'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reindex Success Rate</span>
                      <span className={latestAudit.reindex_success_rate >= 90 ? 'text-green-600' : 'text-yellow-600'}>
                        {latestAudit.reindex_success_rate}%
                      </span>
                    </div>
                    <Progress value={latestAudit.reindex_success_rate} />
                    <p className="text-xs text-muted-foreground">
                      Target: ≥ 90% {latestAudit.reindex_success_rate >= 90 ? '✅' : '❌'}
                    </p>
                  </div>
                </div>

                {/* Issue Breakdown */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Issue Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Articles Scanned</span>
                        <span className="font-semibold">{latestAudit.total_articles_scanned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issues Found</span>
                        <span className="font-semibold">{latestAudit.total_issues_found}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-destructive">Critical</span>
                        <span className="font-semibold text-destructive">{latestAudit.critical_issues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-600">Warnings</span>
                        <span className="font-semibold text-yellow-600">{latestAudit.warning_issues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Info</span>
                        <span className="font-semibold text-blue-600">{latestAudit.info_issues}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Resolution Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto-Fixed</span>
                        <span className="font-semibold text-green-600">{latestAudit.issues_auto_fixed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-semibold">{latestAudit.issues_remaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Fix Time</span>
                        <span className="font-semibold">{latestAudit.average_fix_time_seconds}s</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quality Gates */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Quality Gates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>AI Detection Accuracy ≥ 90%</span>
                        {latestAudit.ai_detection_accuracy >= 90 ? (
                          <Badge variant="outline" className="border-green-600 text-green-600">✅ PASS</Badge>
                        ) : (
                          <Badge variant="destructive">❌ FAIL</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Auto-Fix Success Rate ≥ 95%</span>
                        {latestAudit.auto_fix_success_rate >= 95 ? (
                          <Badge variant="outline" className="border-green-600 text-green-600">✅ PASS</Badge>
                        ) : (
                          <Badge variant="destructive">❌ FAIL</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Reindex Success ≥ 90%</span>
                        {latestAudit.reindex_success_rate >= 90 ? (
                          <Badge variant="outline" className="border-green-600 text-green-600">✅ PASS</Badge>
                        ) : (
                          <Badge variant="destructive">❌ FAIL</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>No Critical Issues</span>
                        {latestAudit.critical_issues === 0 ? (
                          <Badge variant="outline" className="border-green-600 text-green-600">✅ PASS</Badge>
                        ) : (
                          <Badge variant="destructive">❌ FAIL</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {!latestAudit && (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold">No Audit Reports Yet</p>
                <p className="text-muted-foreground mb-4">Run your first comprehensive audit to see detailed metrics</p>
                <Button onClick={() => auditMutation.mutate()} disabled={auditMutation.isPending}>
                  {auditMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Audit...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Run Full Audit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
