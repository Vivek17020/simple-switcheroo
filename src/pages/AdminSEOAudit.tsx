import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  FileText,
  Zap,
  Globe,
  AlertTriangle,
  Info
} from "lucide-react";

export default function AdminSEOAudit() {
  const { user, isAdmin, loading } = useAuth();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [seoIssues, setSeoIssues] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isAdmin) {
      loadLatestAudit();
      loadSEOIssues();
      loadVerifications();
    }
  }, [user, isAdmin]);

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

  const runComprehensiveAudit = async () => {
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-seo-audit');
      
      if (error) throw error;
      
      toast({
        title: "SEO Audit Started",
        description: "Running comprehensive SEO analysis...",
      });
      
      // Refresh data after audit
      setTimeout(() => {
        loadLatestAudit();
        loadSEOIssues();
        loadVerifications();
      }, 10000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const loadLatestAudit = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_audit_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      setAuditReport(data);
    } catch (error) {
      console.error('Error loading audit report:', error);
    }
  };

  const loadSEOIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_health_log')
        .select('*')
        .eq('status', 'open')
        .order('detected_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setSeoIssues(data || []);
    } catch (error) {
      console.error('Error loading SEO issues:', error);
    }
  };

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_autofix_verification')
        .select('*')
        .order('fix_applied_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">SEO Audit Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive SEO analysis, indexing status, and automated fixes
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          This audit checks for SEO issues, verifies auto-fixes, monitors Google Search Console integration,
          and ensures optimal search engine indexing.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Audit Actions
          </CardTitle>
          <CardDescription>
            Run comprehensive SEO analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runComprehensiveAudit} 
            disabled={isAuditing}
            size="lg"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Comprehensive SEO Audit
              </>
            )}
          </Button>

          {/* Latest Audit Stats */}
          {auditReport && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{auditReport.total_articles_scanned}</div>
                <div className="text-sm text-muted-foreground">Articles Scanned</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{auditReport.critical_issues}</div>
                <div className="text-sm text-muted-foreground">Critical Issues</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{auditReport.warning_issues}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{auditReport.issues_auto_fixed}</div>
                <div className="text-sm text-muted-foreground">Auto-Fixed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {auditReport.auto_fix_success_rate ? `${auditReport.auto_fix_success_rate}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Fix Success Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open SEO Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Open SEO Issues ({seoIssues.length})
          </CardTitle>
          <CardDescription>
            Active SEO problems that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {seoIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p>No open SEO issues found!</p>
                <p className="text-sm mt-1">Your site is optimized</p>
              </div>
            ) : (
              seoIssues.map((issue) => (
                <div 
                  key={issue.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {getSeverityIcon(issue.severity)}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{issue.issue_type}</span>
                        {getSeverityBadge(issue.severity)}
                        {issue.auto_fix_attempted && (
                          <Badge variant="outline">Auto-fix Attempted</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-1">
                        URL: <span className="text-primary">{issue.url}</span>
                      </div>
                      
                      {issue.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {issue.notes}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Detected: {new Date(issue.detected_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Auto-Fix Verification Status
          </CardTitle>
          <CardDescription>
            Recent automated fixes and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {verifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No verification records yet</p>
              </div>
            ) : (
              verifications.map((verification) => (
                <div 
                  key={verification.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{verification.issue_type}</span>
                      {getStatusBadge(verification.internal_status)}
                      {verification.gsc_status && verification.gsc_status !== 'pending' && (
                        <Badge variant="outline">GSC: {verification.gsc_status}</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-1">
                      {verification.fix_action}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      URL: <span className="text-primary">{verification.url}</span>
                    </div>
                    
                    {verification.retry_count > 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        Retries: {verification.retry_count}
                      </div>
                    )}
                    
                    {verification.last_error && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {verification.last_error}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-right">
                    {new Date(verification.fix_applied_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            SEO Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Submit Sitemap to Google Search Console</h4>
                <p className="text-sm text-muted-foreground">
                  Make sure your sitemap.xml is submitted at{" "}
                  <a 
                    href="https://search.google.com/search-console" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Search Console
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Enable Auto-Fix for Common Issues</h4>
                <p className="text-sm text-muted-foreground">
                  The system automatically fixes canonical URLs, meta descriptions, and other SEO issues
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Schedule Regular Audits</h4>
                <p className="text-sm text-muted-foreground">
                  Run comprehensive audits weekly to catch and fix issues early
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
