import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

interface AuditResult {
  url: string;
  name: string;
  status: number;
  hasTitle: boolean;
  titleLength: number;
  hasDescription: boolean;
  descriptionLength: number;
  hasCanonical: boolean;
  canonicalCorrect: boolean;
  hasOgTags: boolean;
  hasH1: boolean;
  hasBreadcrumbs: boolean;
  hasSoftwareSchema: boolean;
  hasBreadcrumbSchema: boolean;
  hasRelatedTools: boolean;
  hasBackNavigation: boolean;
  hasAdvancedSEO: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface AuditReport {
  summary: {
    totalPages: number;
    averageScore: number;
    verdict: string;
    passedPages: number;
    warningPages: number;
    failedPages: number;
    auditDate: string;
  };
  results: AuditResult[];
  recommendations: string[];
  topPriorities: string[];
  readinessChecklist: Record<string, boolean>;
}

export default function ToolsAuditReport() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-tools-audit');
      
      if (error) throw error;
      
      setReport(data);
      toast.success("Audit completed successfully!");
    } catch (error) {
      console.error('Audit error:', error);
      toast.error("Failed to run audit");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getVerdictBadge = (verdict: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'READY': 'default',
      'ALMOST READY': 'secondary',
      'NOT READY': 'destructive'
    };
    return <Badge variant={variants[verdict] || 'secondary'}>{verdict}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tools Section SEO Audit Report</h1>
          <p className="text-muted-foreground mb-6">
            Comprehensive validation of all tool pages, schemas, metadata, and indexing readiness.
          </p>
          
          <Button onClick={runAudit} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Complete Audit
              </>
            )}
          </Button>
        </div>

        {report && (
          <div className="space-y-6">
            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Summary</CardTitle>
                <CardDescription>
                  Completed on {new Date(report.summary.auditDate).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(report.summary.averageScore)}`}>
                      {report.summary.averageScore}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Average Score</div>
                    <Progress value={report.summary.averageScore} className="mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600">
                      {report.summary.passedPages}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Passed (≥90)</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-5xl font-bold text-yellow-600">
                      {report.summary.warningPages}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Warnings (70-89)</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-600">
                      {report.summary.failedPages}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">Failed (&lt;70)</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg">Indexing Readiness</h3>
                    <p className="text-sm text-muted-foreground">
                      Overall verdict for Google Search Console submission
                    </p>
                  </div>
                  {getVerdictBadge(report.summary.verdict)}
                </div>
              </CardContent>
            </Card>

            {/* Readiness Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Pre-Index Readiness Checklist</CardTitle>
                <CardDescription>
                  All items must pass before submitting to Google Search Console
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(report.readinessChecklist).map(([item, passed]) => (
                    <div key={item} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium">{item}</span>
                      {passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Priorities */}
            {report.topPriorities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Top Priorities
                  </CardTitle>
                  <CardDescription>
                    Critical issues that need immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.topPriorities.map((priority, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>{priority}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    Suggested improvements to boost your SEO score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Detailed Results */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Page Results</CardTitle>
                <CardDescription>
                  Individual audit results for all {report.summary.totalPages} tool pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Pages</TabsTrigger>
                    <TabsTrigger value="passed">Passed</TabsTrigger>
                    <TabsTrigger value="warnings">Warnings</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {report.results.map((result) => (
                      <ResultCard key={result.url} result={result} />
                    ))}
                  </TabsContent>

                  <TabsContent value="passed" className="space-y-4">
                    {report.results
                      .filter((r) => r.score >= 90)
                      .map((result) => (
                        <ResultCard key={result.url} result={result} />
                      ))}
                  </TabsContent>

                  <TabsContent value="warnings" className="space-y-4">
                    {report.results
                      .filter((r) => r.score >= 70 && r.score < 90)
                      .map((result) => (
                        <ResultCard key={result.url} result={result} />
                      ))}
                  </TabsContent>

                  <TabsContent value="failed" className="space-y-4">
                    {report.results
                      .filter((r) => r.score < 70)
                      .map((result) => (
                        <ResultCard key={result.url} result={result} />
                      ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ResultCard({ result }: { result: AuditResult }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{result.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{result.url}</span>
              <a
                href={`https://www.thebulletinbriefs.in${result.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Visit
              </a>
            </CardDescription>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatusItem label="Title" status={result.hasTitle} detail={`${result.titleLength} chars`} />
          <StatusItem label="Description" status={result.hasDescription} detail={`${result.descriptionLength} chars`} />
          <StatusItem label="Canonical" status={result.canonicalCorrect} />
          <StatusItem label="OG Tags" status={result.hasOgTags} />
          <StatusItem label="H1" status={result.hasH1} />
          <StatusItem label="Breadcrumbs" status={result.hasBreadcrumbs} />
          <StatusItem label="Software Schema" status={result.hasSoftwareSchema} />
          <StatusItem label="Breadcrumb Schema" status={result.hasBreadcrumbSchema} />
        </div>

        {result.errors.length > 0 && (
          <div className="mb-3">
            <h4 className="font-semibold text-sm text-red-600 mb-2">Errors:</h4>
            <ul className="space-y-1">
              {result.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-yellow-600 mb-2">Warnings:</h4>
            <ul className="space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusItem({ label, status, detail }: { label: string; status: boolean; detail?: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded border">
      {status ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{label}</div>
        {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
      </div>
    </div>
  );
}
