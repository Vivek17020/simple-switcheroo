import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2, 
  TrendingUp,
  FileText,
  Zap,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/utils/seo";
import { toast } from "sonner";

interface AuditIssue {
  issue: string;
  impact: string;
  fix: string;
}

interface ArticleIssue {
  title: string;
  slug: string;
  issues: string[];
  recommendations: string[];
}

interface QuickWin {
  action: string;
  impact: string;
  effort: string;
}

interface LongTermGoal {
  goal: string;
  steps: string[];
  timeline: string;
}

interface AuditReport {
  overallScore: number;
  summary: string;
  criticalIssues: AuditIssue[];
  highPriority: AuditIssue[];
  mediumPriority: AuditIssue[];
  lowPriority: AuditIssue[];
  topArticleIssues: ArticleIssue[];
  quickWins: QuickWin[];
  longTermPlan: LongTermGoal[];
}

export default function AuditReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [articlesAnalyzed, setArticlesAnalyzed] = useState(0);

  const runAudit = async () => {
    setIsLoading(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke('audit-website');

      if (error) {
        console.error('Audit error:', error);
        toast.error('Failed to run audit. Please try again.');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data?.report) {
        setReport(data.report);
        setArticlesAnalyzed(data.articlesAnalyzed);
        toast.success('Audit completed successfully!');
      }
    } catch (err) {
      console.error('Audit error:', err);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <>
      <SEOHead
        title="AI Website Audit Report"
        description="Comprehensive AI-powered audit of your website's content and SEO readiness for Google indexing"
        canonicalUrl={`${window.location.origin}/admin/audit-report`}
      />
      
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">AI-Powered Website Audit</h1>
          <p className="text-muted-foreground mb-6">
            Comprehensive analysis of your content and SEO readiness
          </p>
          
          <Button 
            onClick={runAudit} 
            disabled={isLoading}
            size="lg"
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Run AI Audit
              </>
            )}
          </Button>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Analyzing your website...</p>
              <p className="text-sm text-muted-foreground">
                AI is reviewing your articles, SEO elements, and content quality
              </p>
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Overall SEO Score
                </CardTitle>
                <CardDescription>
                  Analyzed {articlesAnalyzed} articles • {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(report.overallScore)}`}>
                    {report.overallScore}
                  </div>
                  <Progress value={report.overallScore} className="h-3 mb-4" />
                  <p className="text-muted-foreground">{report.summary}</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="critical" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="high">High</TabsTrigger>
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
                <TabsTrigger value="long-term">Long Term</TabsTrigger>
              </TabsList>

              <TabsContent value="critical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Critical Issues
                    </CardTitle>
                    <CardDescription>Must fix immediately for indexing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.criticalIssues.map((issue, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{issue.issue}</AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="font-medium">Impact: {issue.impact}</p>
                          <p className="mt-2">Fix: {issue.fix}</p>
                        </AlertDescription>
                      </Alert>
                    ))}
                    {report.criticalIssues.length === 0 && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>No critical issues found!</AlertTitle>
                        <AlertDescription>Your site is in good shape for indexing.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="high" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      High Priority Issues
                    </CardTitle>
                    <CardDescription>Significant impact on rankings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.highPriority.map((issue, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          {getSeverityIcon('high')}
                          <h4 className="font-semibold">{issue.issue}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Impact:</span> {issue.impact}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Fix:</span> {issue.fix}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-yellow-600" />
                      Medium Priority Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.mediumPriority.map((issue, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          {getSeverityIcon('medium')}
                          <h4 className="font-semibold">{issue.issue}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Impact:</span> {issue.impact}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Fix:</span> {issue.fix}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="articles" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Top Articles Analysis
                    </CardTitle>
                    <CardDescription>Detailed issues for individual articles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.topArticleIssues.map((article, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{article.title}</h3>
                        <Badge variant="outline" className="mb-3">/{article.slug}</Badge>
                        
                        {article.issues.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-2">Issues:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {article.issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Recommendations:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-primary">
                            {article.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quick-wins" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      Quick Wins
                    </CardTitle>
                    <CardDescription>Easy fixes with high impact</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.quickWins.map((win, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{win.action}</h4>
                          <Badge variant="outline">{win.effort} effort</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Impact:</span> {win.impact}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="long-term" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Long-term Improvement Plan
                    </CardTitle>
                    <CardDescription>Strategic recommendations for sustained growth</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.longTermPlan.map((goal, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-lg">{goal.goal}</h4>
                          <Badge>{goal.timeline}</Badge>
                        </div>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          {goal.steps.map((step, i) => (
                            <li key={i} className="text-muted-foreground">{step}</li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}