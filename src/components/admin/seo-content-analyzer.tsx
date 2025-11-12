import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, TrendingUp, Target, List } from 'lucide-react';
import { 
  calculateKeywordDensity, 
  keywordInFirstWords, 
  extractHeadings, 
  headingKeywordPercentage,
  extractFAQs
} from '@/utils/seo-keywords';

interface SEOContentAnalyzerProps {
  title: string;
  content: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  lsiKeywords?: string[];
  targetQueries?: string[];
  keywordDensity?: number;
}

export function SEOContentAnalyzer({ 
  title, 
  content, 
  primaryKeyword,
  secondaryKeywords,
  lsiKeywords,
  targetQueries,
  keywordDensity: dbKeywordDensity 
}: SEOContentAnalyzerProps) {
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!title || !content) return;

    // Use primary keyword from props or extract from title
    const keyword = primaryKeyword || title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 4)
      .join(' ');

    const density = calculateKeywordDensity(keyword, content);
    const inFirstWords = keywordInFirstWords(keyword, content, 100);
    const headings = extractHeadings(content);
    const h2Percentage = headingKeywordPercentage(keyword, headings.h2);
    const h3Percentage = headingKeywordPercentage(keyword, headings.h3);
    const faqs = extractFAQs(content);
    
    const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
    
    // Calculate overall SEO score
    let score = 0;
    if (density >= 3 && density <= 5) score += 25;
    else if (density >= 2 && density <= 6) score += 15;
    
    if (inFirstWords) score += 20;
    if (h2Percentage >= 50) score += 20;
    if (h3Percentage >= 30) score += 10;
    if (wordCount >= 1200) score += 15;
    if (faqs.length > 0) score += 10;

    setAnalysis({
      keyword,
      density,
      inFirstWords,
      h2Count: headings.h2.length,
      h3Count: headings.h3.length,
      h2Percentage,
      h3Percentage,
      wordCount,
      faqCount: faqs.length,
      score
    });
  }, [title, content, primaryKeyword]);

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDensityStatus = (density: number) => {
    if (density >= 3 && density <= 5) return { status: 'Optimal', color: 'bg-green-500' };
    if (density >= 2 && density <= 6) return { status: 'Good', color: 'bg-yellow-500' };
    if (density < 2) return { status: 'Too Low', color: 'bg-red-500' };
    return { status: 'Too High', color: 'bg-red-500' };
  };

  const densityStatus = getDensityStatus(analysis.density);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Real-Time SEO Analysis
        </CardTitle>
        <CardDescription>
          Optimize your content for search engines as you write
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SEO Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall SEO Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}/100
            </span>
          </div>
          <Progress value={analysis.score} className="h-2" />
        </div>

        {/* Primary Keyword */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Primary Keyword</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {analysis.keyword}
          </Badge>
        </div>

        {/* Keyword Density */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Keyword Density</span>
            <Badge className={densityStatus.color}>
              {analysis.density.toFixed(2)}% - {densityStatus.status}
            </Badge>
          </div>
          <Progress value={Math.min((analysis.density / 5) * 100, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Optimal range: 3-5%. Current: {analysis.density.toFixed(2)}%
          </p>
        </div>

        {/* Keyword Placement */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Keyword Placement</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>In first 100 words</span>
              {analysis.inFirstWords ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>H2 headings ({analysis.h2Percentage.toFixed(0)}%)</span>
              {analysis.h2Percentage >= 50 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>H3 headings ({analysis.h3Percentage.toFixed(0)}%)</span>
              {analysis.h3Percentage >= 30 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Word Count</p>
            <p className="text-lg font-semibold">
              {analysis.wordCount}
              {analysis.wordCount < 1200 && (
                <span className="text-xs text-yellow-600 ml-2">(Min: 1200)</span>
              )}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">H2 / H3 Tags</p>
            <p className="text-lg font-semibold">
              {analysis.h2Count} / {analysis.h3Count}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">FAQ Sections</p>
            <p className="text-lg font-semibold">
              {analysis.faqCount}
              {analysis.faqCount === 0 && (
                <span className="text-xs text-yellow-600 ml-2">(Add some)</span>
              )}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Reading Time</p>
            <p className="text-lg font-semibold">
              {Math.ceil(analysis.wordCount / 200)} min
            </p>
          </div>
        </div>

        {/* Database Keywords Display */}
        {(secondaryKeywords || lsiKeywords || targetQueries) && (
          <div className="pt-4 border-t border-border/50 space-y-3">
            <p className="text-sm font-medium">Database Keywords</p>
            
            {secondaryKeywords && secondaryKeywords.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Secondary Keywords ({secondaryKeywords.length})</p>
                <div className="flex flex-wrap gap-1">
                  {secondaryKeywords.slice(0, 5).map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {lsiKeywords && lsiKeywords.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">LSI Keywords ({lsiKeywords.length})</p>
                <div className="flex flex-wrap gap-1">
                  {lsiKeywords.slice(0, 5).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {targetQueries && targetQueries.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Target Queries ({targetQueries.length})</p>
                <div className="flex flex-wrap gap-1">
                  {targetQueries.slice(0, 3).map((q, i) => (
                    <Badge key={i} variant="default" className="text-xs">{q}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {dbKeywordDensity && (
              <p className="text-xs text-muted-foreground">
                DB Density: {dbKeywordDensity.toFixed(2)}%
              </p>
            )}
          </div>
        )}

        {/* Recommendations */}
        {analysis.score < 80 && (
          <div className="pt-4 border-t border-border/50 space-y-2">
            <p className="text-sm font-medium">Recommendations:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {!analysis.inFirstWords && (
                <li>• Add primary keyword in the first 100 words</li>
              )}
              {analysis.h2Percentage < 50 && (
                <li>• Include keyword in at least 50% of H2 headings</li>
              )}
              {analysis.density < 3 && (
                <li>• Increase keyword density to 3-5%</li>
              )}
              {analysis.density > 5 && (
                <li>• Reduce keyword density to avoid keyword stuffing</li>
              )}
              {analysis.wordCount < 1200 && (
                <li>• Increase content length to at least 1200 words</li>
              )}
              {analysis.faqCount === 0 && (
                <li>• Add FAQ section for featured snippet opportunities</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
