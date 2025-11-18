import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  FileText, 
  Hash, 
  Languages, 
  ChevronDown, 
  Copy, 
  Loader2,
  ArrowRight
} from 'lucide-react';

interface AIAssistantPanelProps {
  content: string;
  onInsertSummary?: (summary: string) => void;
  onInsertTitle?: (title: string) => void;
  onInsertKeywords?: (keywords: string[]) => void;
  onTranslationGenerated?: (translation: string) => void;
}

export function AIAssistantPanel({ 
  content, 
  onInsertSummary, 
  onInsertTitle, 
  onInsertKeywords,
  onTranslationGenerated
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [titles, setTitles] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [translation, setTranslation] = useState<string>('');

  const callAIProxy = async (task: string, targetLanguage?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: {
          task,
          content: content.slice(0, 2000), // Limit content length
          targetLanguage
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('AI Proxy error:', error);
      throw error;
    }
  };

  const generateSummary = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content before generating a summary.",
        variant: "destructive"
      });
      return;
    }

    setLoading('summary');
    try {
      const result = await callAIProxy('summary');
      setSummary(result.summary);
      toast({
        title: "Summary Generated",
        description: "AI has generated a summary for your article."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const generateTitles = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content before generating titles.",
        variant: "destructive"
      });
      return;
    }

    setLoading('titles');
    try {
      const result = await callAIProxy('title');
      setTitles(result.titles);
      toast({
        title: "Titles Generated",
        description: "AI has generated SEO-optimized titles for your article."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate titles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const generateKeywords = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content before extracting keywords.",
        variant: "destructive"
      });
      return;
    }

    setLoading('keywords');
    try {
      const result = await callAIProxy('keywords');
      setKeywords(result.keywords);
      toast({
        title: "Keywords Extracted",
        description: "AI has extracted relevant keywords from your content."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extract keywords. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const translateToHindi = async () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please add some content before translating.",
        variant: "destructive"
      });
      return;
    }

    setLoading('translation');
    try {
      const result = await callAIProxy('translation', 'hi');
      setTranslation(result.translation);
      toast({
        title: "Translation Generated",
        description: "AI has translated your article to Hindi."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to translate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Assistant
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Summary Generation */}
            <div className="space-y-2">
              <Button 
                onClick={generateSummary}
                disabled={loading === 'summary'}
                className="w-full justify-start"
                variant="outline"
              >
                {loading === 'summary' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Summary
              </Button>
              
              {summary && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm">{summary}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(summary)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    {onInsertSummary && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onInsertSummary(summary)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Insert
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Title Generation */}
            <div className="space-y-2">
              <Button 
                onClick={generateTitles}
                disabled={loading === 'titles'}
                className="w-full justify-start"
                variant="outline"
              >
                {loading === 'titles' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Suggest SEO Titles
              </Button>
              
              {titles.length > 0 && (
                <div className="space-y-2">
                  {titles.map((title, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                      <p className="text-sm font-medium">{title}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => copyToClipboard(title)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        {onInsertTitle && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => onInsertTitle(title)}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Use Title
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Keyword Extraction */}
            <div className="space-y-2">
              <Button 
                onClick={generateKeywords}
                disabled={loading === 'keywords'}
                className="w-full justify-start"
                variant="outline"
              >
                {loading === 'keywords' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Hash className="h-4 w-4 mr-2" />
                )}
                Extract Keywords
              </Button>
              
              {keywords.length > 0 && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(keywords.join(', '))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All
                    </Button>
                    {onInsertKeywords && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onInsertKeywords(keywords)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Use Keywords
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Translation */}
            <div className="space-y-2">
              <Button 
                onClick={translateToHindi}
                disabled={loading === 'translation'}
                className="w-full justify-start"
                variant="outline"
              >
                {loading === 'translation' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4 mr-2" />
                )}
                Translate to Hindi
              </Button>
              
              {translation && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm" dir="rtl">{translation}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(translation)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    {onTranslationGenerated && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onTranslationGenerated(translation)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Create Hindi Article
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}