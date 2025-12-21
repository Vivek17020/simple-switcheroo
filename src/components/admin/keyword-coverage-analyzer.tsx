import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface KeywordCoverageAnalyzerProps {
  content: string;
  title: string;
  metaDescription?: string;
  tags?: string[];
}

export function KeywordCoverageAnalyzer({ content, title, metaDescription, tags = [] }: KeywordCoverageAnalyzerProps) {
  const analysis = useMemo(() => {
    const text = content.toLowerCase();
    const titleLower = title.toLowerCase();
    const metaLower = (metaDescription || '').toLowerCase();
    
    // Extract primary keyword from title
    const titleWords = title.split(' ').filter(w => w.length > 3);
    const primaryKeyword = titleWords.slice(0, 2).join(' ').toLowerCase();
    
    // Count word frequency for LSI keyword estimation
    const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
    
    const totalWords = words.length;
    const uniqueKeywords = Object.keys(wordFreq).length;
    
    // Calculate keyword density
    const primaryKeywordCount = (text.match(new RegExp(primaryKeyword, 'gi')) || []).length;
    const keywordDensity = totalWords > 0 ? (primaryKeywordCount / totalWords) * 100 : 0;
    
    // Count headings
    const h2Count = (content.match(/<h2/gi) || []).length;
    const h3Count = (content.match(/<h3/gi) || []).length;
    
    // Check for important sections
    const hasFAQ = /faq|frequently asked questions/i.test(content);
    const hasPeopleAlsoAsk = /people also ask/i.test(content);
    const hasInternalLinks = (content.match(/href="\[INTERNAL:/gi) || []).length;
    
    // Primary keyword placement checks
    const primaryInTitle = titleLower.includes(primaryKeyword);
    const primaryInFirst100 = text.slice(0, 500).includes(primaryKeyword);
    const primaryInMeta = metaLower.includes(primaryKeyword);
    const primaryInH2 = (content.match(new RegExp(`<h2[^>]*>.*${primaryKeyword}.*</h2>`, 'i')) || []).length > 0;
    
    // Calculate scores
    let keywordCoverageScore = 0;
    keywordCoverageScore += uniqueKeywords >= 20 ? 20 : uniqueKeywords;
    keywordCoverageScore += primaryInTitle ? 15 : 0;
    keywordCoverageScore += primaryInFirst100 ? 10 : 0;
    keywordCoverageScore += primaryInMeta ? 10 : 0;
    keywordCoverageScore += primaryInH2 ? 10 : 0;
    keywordCoverageScore += keywordDensity >= 1.2 && keywordDensity <= 2.5 ? 15 : 5;
    keywordCoverageScore += h2Count >= 8 ? 10 : (h2Count * 1.25);
    keywordCoverageScore += hasFAQ ? 5 : 0;
    keywordCoverageScore += hasPeopleAlsoAsk ? 5 : 0;
    
    let rankingPotentialScore = 0;
    rankingPotentialScore += totalWords >= 1800 ? 25 : (totalWords / 72);
    rankingPotentialScore += uniqueKeywords >= 20 ? 20 : uniqueKeywords;
    rankingPotentialScore += h2Count >= 8 ? 15 : (h2Count * 1.875);
    rankingPotentialScore += hasInternalLinks >= 5 ? 15 : (hasInternalLinks * 3);
    rankingPotentialScore += hasFAQ ? 10 : 0;
    rankingPotentialScore += hasPeopleAlsoAsk ? 10 : 0;
    rankingPotentialScore += tags.length >= 5 ? 5 : tags.length;
    
    return {
      totalWords,
      uniqueKeywords,
      primaryKeyword,
      keywordDensity,
      h2Count,
      h3Count,
      hasFAQ,
      hasPeopleAlsoAsk,
      hasInternalLinks,
      primaryInTitle,
      primaryInFirst100,
      primaryInMeta,
      primaryInH2,
      keywordCoverageScore: Math.min(100, keywordCoverageScore),
      rankingPotentialScore: Math.min(100, rankingPotentialScore),
    };
  }, [content, title, metaDescription, tags]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Keyword Coverage & Ranking Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Scores */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Keyword Coverage Score</span>
              <span className={`text-lg font-bold ${getScoreColor(analysis.keywordCoverageScore)}`}>
                {Math.round(analysis.keywordCoverageScore)}%
              </span>
            </div>
            <Progress value={analysis.keywordCoverageScore} className="h-2" />
            <p className="text-xs text-muted-foreground">{getScoreStatus(analysis.keywordCoverageScore)}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ranking Potential Score</span>
              <span className={`text-lg font-bold ${getScoreColor(analysis.rankingPotentialScore)}`}>
                {Math.round(analysis.rankingPotentialScore)}%
              </span>
            </div>
            <Progress value={analysis.rankingPotentialScore} className="h-2" />
            <p className="text-xs text-muted-foreground">{getScoreStatus(analysis.rankingPotentialScore)}</p>
          </div>
        </div>

        {/* Primary Keyword Analysis */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm">Primary Keyword: "{analysis.primaryKeyword}"</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              {analysis.primaryInTitle ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span>In Title (H1)</span>
            </div>
            <div className="flex items-center gap-2">
              {analysis.primaryInFirst100 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span>First 100 Words</span>
            </div>
            <div className="flex items-center gap-2">
              {analysis.primaryInH2 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span>In H2 Heading</span>
            </div>
            <div className="flex items-center gap-2">
              {analysis.primaryInMeta ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <span>Meta Description</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs">Keyword Density:</span>
            <Badge variant={analysis.keywordDensity >= 1.2 && analysis.keywordDensity <= 2.5 ? "default" : "destructive"}>
              {analysis.keywordDensity.toFixed(2)}% {analysis.keywordDensity >= 1.2 && analysis.keywordDensity <= 2.5 ? '✓' : '⚠'}
            </Badge>
          </div>
        </div>

        {/* Content Structure */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Content Structure</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-2xl font-bold">{analysis.totalWords}</div>
              <div className="text-xs text-muted-foreground">Words</div>
              <div className="text-xs mt-1">{analysis.totalWords >= 1800 ? '✓' : `Need ${1800 - analysis.totalWords}`}</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-2xl font-bold">{analysis.uniqueKeywords}</div>
              <div className="text-xs text-muted-foreground">LSI Keywords</div>
              <div className="text-xs mt-1">{analysis.uniqueKeywords >= 20 ? '✓' : `Need ${20 - analysis.uniqueKeywords}`}</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-2xl font-bold">{analysis.h2Count}</div>
              <div className="text-xs text-muted-foreground">H2 Sections</div>
              <div className="text-xs mt-1">{analysis.h2Count >= 8 ? '✓' : `Need ${8 - analysis.h2Count}`}</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded">
              <div className="text-2xl font-bold">{analysis.hasInternalLinks}</div>
              <div className="text-xs text-muted-foreground">Internal Links</div>
              <div className="text-xs mt-1">{analysis.hasInternalLinks >= 5 ? '✓' : `Need ${5 - analysis.hasInternalLinks}`}</div>
            </div>
          </div>
        </div>

        {/* SEO Features Checklist */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">SEO Features Checklist</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <span className="text-sm">People Also Ask Section</span>
              {analysis.hasPeopleAlsoAsk ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" /> Present
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" /> Missing
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <span className="text-sm">FAQ Section</span>
              {analysis.hasFAQ ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" /> Present
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" /> Missing
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <span className="text-sm">Internal Links (5-10 target)</span>
              {analysis.hasInternalLinks >= 5 ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" /> {analysis.hasInternalLinks} links
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" /> {analysis.hasInternalLinks} links
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        {analysis.rankingPotentialScore < 80 && (
          <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Improvement Opportunities
            </h4>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {analysis.totalWords < 1800 && <li>Expand content to 1800-2500 words for better ranking</li>}
              {analysis.uniqueKeywords < 20 && <li>Add more LSI keywords (target: 20-30)</li>}
              {analysis.h2Count < 8 && <li>Add more H2 sections (target: 8-12)</li>}
              {!analysis.hasPeopleAlsoAsk && <li>Include "People Also Ask" section</li>}
              {!analysis.hasFAQ && <li>Add FAQ section with 8-10 questions</li>}
              {analysis.hasInternalLinks < 5 && <li>Add {5 - analysis.hasInternalLinks} more internal links</li>}
              {!(analysis.keywordDensity >= 1.2 && analysis.keywordDensity <= 2.5) && <li>Adjust keyword density to 1.2-2.5%</li>}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
