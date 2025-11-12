import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Link2, TrendingUp, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InternalLinkSuggesterProps {
  currentArticleId?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  categoryId?: string;
}

interface SuggestedArticle {
  id: string;
  title: string;
  slug: string;
  primary_keyword: string;
  excerpt: string;
  relevance_score: number;
}

export function InternalLinkSuggester({
  currentArticleId,
  primaryKeyword,
  secondaryKeywords = [],
  categoryId
}: InternalLinkSuggesterProps) {
  const [suggestions, setSuggestions] = useState<SuggestedArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (primaryKeyword || secondaryKeywords.length > 0) {
      fetchSuggestions();
    }
  }, [primaryKeyword, secondaryKeywords, categoryId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const allKeywords = [primaryKeyword, ...secondaryKeywords].filter(Boolean);
      
      if (allKeywords.length === 0) {
        setSuggestions([]);
        return;
      }

      // Query for related articles based on keywords
      let query = supabase
        .from('articles')
        .select('id, title, slug, primary_keyword, excerpt, secondary_keywords, lsi_keywords')
        .eq('published', true)
        .limit(10);

      // Exclude current article if editing
      if (currentArticleId) {
        query = query.neq('id', currentArticleId);
      }

      // Prefer same category
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: articles, error } = await query;

      if (error) throw error;

      if (!articles) {
        setSuggestions([]);
        return;
      }

      // Calculate relevance score for each article
      const scoredArticles = articles
        .map(article => {
          let score = 0;
          const articleKeywords = [
            article.primary_keyword,
            ...(article.secondary_keywords || []),
            ...(article.lsi_keywords || [])
          ].filter(Boolean).map(k => k.toLowerCase());

          // Score based on keyword matches
          allKeywords.forEach(keyword => {
            const kw = keyword.toLowerCase();
            if (articleKeywords.some(ak => ak.includes(kw) || kw.includes(ak))) {
              score += 10;
            }
          });

          // Bonus for exact primary keyword match
          if (primaryKeyword && article.primary_keyword?.toLowerCase().includes(primaryKeyword.toLowerCase())) {
            score += 20;
          }

          return {
            ...article,
            relevance_score: score
          };
        })
        .filter(article => article.relevance_score > 0)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 5);

      setSuggestions(scoredArticles);
    } catch (error) {
      console.error('Error fetching link suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInternalLink = (article: SuggestedArticle, anchorText: string) => {
    const linkHtml = `<a href="https://www.thebulletinbriefs.in/article/${article.slug}">${anchorText}</a>`;
    navigator.clipboard.writeText(linkHtml);
    toast({
      title: 'Link copied!',
      description: 'Internal link HTML copied to clipboard. Paste it into your content.',
    });
  };

  const generateAnchorText = (article: SuggestedArticle): string => {
    // Use article's primary keyword as anchor text
    return article.primary_keyword || article.title.substring(0, 50);
  };

  if (!primaryKeyword && secondaryKeywords.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Internal Link Suggestions</CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            SEO Boost
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Finding related articles...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No related articles found. Add more content to build your internal linking network.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              Add these internal links to boost SEO and keep readers engaged:
            </p>
            <div className="space-y-3">
              {suggestions.map((article) => {
                const anchorText = generateAnchorText(article);
                return (
                  <div
                    key={article.id}
                    className="p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{article.title}</h4>
                        {article.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {article.excerpt}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        Score: {article.relevance_score}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Anchor:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                          {anchorText}
                        </code>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInternalLink(article, anchorText)}
                          className="flex-1 text-xs"
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Copy HTML Link
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="shrink-0"
                        >
                          <a
                            href={`/article/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Pro Tip:</strong> Add 3-5 internal links per article using keyword-rich anchor text for better rankings.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
