import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  Sparkles,
  Target,
  TrendingUp,
  Image,
  MessageSquare,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

interface DiscoverScore {
  title_ctr: number;
  readability: number;
  freshness: number;
  entity_strength: number;
  emotional_appeal: number;
  eeat_score: number;
  overall: number;
}

interface DiscoverChecklist {
  has_large_image: boolean;
  title_length_optimal: boolean;
  has_entities: boolean;
  has_emotion: boolean;
  is_fresh: boolean;
  has_eeat: boolean;
  has_key_highlights: boolean;
  mobile_friendly: boolean;
}

interface ImageRecommendations {
  overlay_text: string;
  composition: string;
  colors: string[];
}

interface SocialPack {
  tweet: string;
  instagram: string;
  whatsapp: string;
}

interface DiscoverData {
  discover_score: DiscoverScore;
  optimized_titles: string[];
  meta_descriptions: string[];
  optimized_content: string;
  key_highlights: string[];
  entities_extracted: string[];
  image_recommendations: ImageRecommendations;
  social_pack: SocialPack;
  discover_checklist: DiscoverChecklist;
  discover_probability: number;
  improvement_suggestions: string[];
}

interface DiscoverOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DiscoverData | null;
  onApply: (title: string, metaDescription: string, content: string) => void;
}

export function DiscoverOptimizationModal({
  open,
  onOpenChange,
  data,
  onApply,
}: DiscoverOptimizationModalProps) {
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [selectedMeta, setSelectedMeta] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!data) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApply = () => {
    onApply(
      data.optimized_titles[selectedTitle],
      data.meta_descriptions[selectedMeta],
      data.optimized_content
    );
    onOpenChange(false);
    toast.success('Discover optimizations applied!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Google Discover Optimization Results
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="scores" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="titles">Titles</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            {/* Scores Tab */}
            <TabsContent value="scores" className="space-y-6">
              {/* Main Probability */}
              <div className="text-center p-6 rounded-lg bg-muted/50">
                <div className={`text-6xl font-bold ${getScoreColor(data.discover_probability)}`}>
                  {data.discover_probability}%
                </div>
                <p className="text-muted-foreground mt-2">Discover Probability</p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(data.discover_score).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className={`font-bold ${getScoreColor(value)}`}>
                        {value}%
                      </span>
                    </div>
                    <Progress value={value} className={`h-2 ${getScoreBg(value)}`} />
                  </div>
                ))}
              </div>

              {/* Entities */}
              {data.entities_extracted?.length > 0 && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Extracted Entities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.entities_extracted.map((entity, i) => (
                      <Badge key={i} variant="secondary">{entity}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {data.improvement_suggestions?.length > 0 && (
                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Improvement Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {data.improvement_suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* Titles Tab */}
            <TabsContent value="titles" className="space-y-4">
              <h4 className="font-semibold">Select Optimized Title</h4>
              {data.optimized_titles?.map((title, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTitle === i
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setSelectedTitle(i)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {title.length} characters
                        {title.length >= 40 && title.length <= 59 && (
                          <Badge className="ml-2" variant="outline">Optimal Length</Badge>
                        )}
                      </p>
                    </div>
                    {selectedTitle === i && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}

              <h4 className="font-semibold mt-6">Select Meta Description</h4>
              {data.meta_descriptions?.map((meta, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMeta === i
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setSelectedMeta(i)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p>{meta}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {meta.length} characters
                      </p>
                    </div>
                    {selectedMeta === i && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {/* Key Highlights */}
              {data.key_highlights?.length > 0 && (
                <div className="p-4 rounded-lg border bg-primary/5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Key Highlights
                  </h4>
                  <ul className="space-y-2">
                    {data.key_highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Image Recommendations */}
              {data.image_recommendations && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Image Recommendations
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Overlay Text:</strong> {data.image_recommendations.overlay_text}</p>
                    <p><strong>Composition:</strong> {data.image_recommendations.composition}</p>
                    <div className="flex items-center gap-2">
                      <strong>Suggested Colors:</strong>
                      {data.image_recommendations.colors?.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Optimized Content Preview */}
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-3">Optimized Content Preview</h4>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: data.optimized_content || '' }}
                />
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-4">
              <div className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Twitter/X
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(data.social_pack?.tweet || '', 'tweet')}
                  >
                    {copiedField === 'tweet' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm">{data.social_pack?.tweet}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.social_pack?.tweet?.length || 0}/280 characters
                </p>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Instagram
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(data.social_pack?.instagram || '', 'instagram')}
                  >
                    {copiedField === 'instagram' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{data.social_pack?.instagram}</p>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(data.social_pack?.whatsapp || '', 'whatsapp')}
                  >
                    {copiedField === 'whatsapp' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{data.social_pack?.whatsapp}</p>
              </div>
            </TabsContent>

            {/* Checklist Tab */}
            <TabsContent value="checklist" className="space-y-4">
              <div className="grid gap-3">
                {data.discover_checklist && Object.entries(data.discover_checklist).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border flex items-center justify-between ${
                      value ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    <span className="capitalize font-medium">
                      {key.replace(/_/g, ' ')}
                    </span>
                    {value ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Warning if image is missing */}
              {data.discover_checklist && !data.discover_checklist.has_large_image && (
                <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-500">Image Warning</p>
                      <p className="text-sm mt-1">
                        Google Discover requires high-quality images at least 1200px wide.
                        Consider using the AI Image Generator to create an optimized featured image.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            <Sparkles className="h-4 w-4 mr-2" />
            Apply Optimizations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
