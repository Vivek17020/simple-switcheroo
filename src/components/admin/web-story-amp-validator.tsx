import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink }  from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

interface WebStoryAMPValidatorProps {
  storySlug: string;
  storyTitle: string;
  storyCategory?: string;
}

export function WebStoryAMPValidator({ storySlug, storyTitle, storyCategory }: WebStoryAMPValidatorProps) {
  const [validating, setValidating] = useState(false);
  const [checks, setChecks] = useState<ValidationCheck[]>([]);

  const validateAMP = async () => {
    setValidating(true);
    setChecks([]);

    try {
      console.log('🔍 Validating AMP for story:', storySlug);
      const validationChecks: ValidationCheck[] = [];

      // Get the AMP HTML from our edge function
      const categorySlug = (storyCategory || 'news').toLowerCase();
      const ampUrl = `https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/web-story-amp?slug=${storySlug}`;
      
      const ampResponse = await fetch(ampUrl);
      
      if (!ampResponse.ok) {
        validationChecks.push({
          name: 'AMP Endpoint',
          status: 'fail',
          message: 'Failed to fetch AMP HTML from edge function'
        });
        setChecks(validationChecks);
        return;
      }

      const ampHtml = await ampResponse.text();

      // Check 1: AMP HTML structure
      const hasAmpAttribute = ampHtml.includes('⚡') || ampHtml.includes('amp=');
      validationChecks.push({
        name: 'AMP Attribute',
        status: hasAmpAttribute ? 'pass' : 'fail',
        message: hasAmpAttribute ? 'HTML has ⚡ attribute' : 'Missing ⚡ attribute in <html>'
      });

      // Check 2: AMP Boilerplate
      const hasBoilerplate = ampHtml.includes('style amp-boilerplate');
      validationChecks.push({
        name: 'AMP Boilerplate CSS',
        status: hasBoilerplate ? 'pass' : 'fail',
        message: hasBoilerplate ? 'AMP boilerplate CSS present' : 'Missing required AMP boilerplate CSS'
      });

      // Check 3: AMP Runtime Script
      const hasRuntime = ampHtml.includes('cdn.ampproject.org/v0.js');
      validationChecks.push({
        name: 'AMP Runtime',
        status: hasRuntime ? 'pass' : 'fail',
        message: hasRuntime ? 'AMP runtime script loaded' : 'Missing AMP runtime script'
      });

      // Check 4: amp-story component
      const hasStoryComponent = ampHtml.includes('amp-story-1.0.js');
      validationChecks.push({
        name: 'AMP Story Component',
        status: hasStoryComponent ? 'pass' : 'fail',
        message: hasStoryComponent ? 'amp-story component loaded' : 'Missing amp-story component script'
      });

      // Check 5: Canonical URL
      const hasCanonical = ampHtml.includes('rel="canonical"');
      validationChecks.push({
        name: 'Canonical URL',
        status: hasCanonical ? 'pass' : 'fail',
        message: hasCanonical ? 'Canonical URL present' : 'Missing canonical URL (required for SEO)'
      });

      // Check 6: Structured Data
      const hasStructuredData = ampHtml.includes('application/ld+json');
      validationChecks.push({
        name: 'Structured Data',
        status: hasStructuredData ? 'pass' : 'fail',
        message: hasStructuredData ? 'JSON-LD structured data present' : 'Missing structured data'
      });

      // Check 7: Publisher Logo (must be square)
      const logoMatch = ampHtml.match(/publisher-logo-src="([^"]+)"/);
      const hasSquareLogo = logoMatch && (ampHtml.includes('favicon') || ampHtml.includes('96'));
      validationChecks.push({
        name: 'Publisher Logo (Square)',
        status: hasSquareLogo ? 'pass' : 'warning',
        message: hasSquareLogo 
          ? 'Square publisher logo configured' 
          : 'Publisher logo should be square (96x96px min) for Google Discover'
      });

      // Check 8: Poster Image
      const hasPosterPortrait = ampHtml.includes('poster-portrait-src');
      const hasPosterSquare = ampHtml.includes('poster-square-src');
      const hasPosterLandscape = ampHtml.includes('poster-landscape-src');
      validationChecks.push({
        name: 'Poster Images',
        status: hasPosterPortrait && hasPosterSquare && hasPosterLandscape ? 'pass' : 'warning',
        message: hasPosterPortrait && hasPosterSquare && hasPosterLandscape
          ? 'All poster formats present (portrait, square, landscape)'
          : 'Missing some poster formats - add all 3 for best Discover visibility'
      });

      // Check 9: Title length (< 90 chars)
      const titleMatch = ampHtml.match(/<title>([^<]+)<\/title>/);
      const titleLength = titleMatch ? titleMatch[1].length : 0;
      validationChecks.push({
        name: 'Title Length',
        status: titleLength > 0 && titleLength < 90 ? 'pass' : 'warning',
        message: titleLength < 90 
          ? `Title is ${titleLength} characters (good, under 90)` 
          : `Title is ${titleLength} characters (should be under 90)`
      });

      // Check 10: Slide count
      const slideCount = (ampHtml.match(/amp-story-page/g) || []).length;
      const goodSlideCount = slideCount >= 4 && slideCount <= 30;
      validationChecks.push({
        name: 'Slide Count',
        status: goodSlideCount ? 'pass' : slideCount > 30 ? 'fail' : 'warning',
        message: goodSlideCount 
          ? `${slideCount} slides (optimal: 4-30)` 
          : `${slideCount} slides - Google requires 4-30 slides`
      });

      // Check 11: Meta description
      const hasMetaDesc = ampHtml.includes('name="description"');
      validationChecks.push({
        name: 'Meta Description',
        status: hasMetaDesc ? 'pass' : 'warning',
        message: hasMetaDesc ? 'Meta description present' : 'Add meta description for better SEO'
      });

      // Check 12: Open Graph tags
      const hasOG = ampHtml.includes('og:title') && ampHtml.includes('og:image');
      validationChecks.push({
        name: 'Open Graph Tags',
        status: hasOG ? 'pass' : 'warning',
        message: hasOG ? 'Open Graph tags present' : 'Add OG tags for social sharing'
      });

      setChecks(validationChecks);

      const failCount = validationChecks.filter(c => c.status === 'fail').length;
      const warnCount = validationChecks.filter(c => c.status === 'warning').length;

      if (failCount === 0 && warnCount === 0) {
        toast({
          title: '✅ All Checks Passed!',
          description: 'Your web story meets all Google Discover requirements',
        });
      } else if (failCount === 0) {
        toast({
          title: '⚠️ Passed with Warnings',
          description: `${warnCount} recommendations to improve Discover visibility`,
        });
      } else {
        toast({
          title: '❌ Validation Failed',
          description: `${failCount} critical issues must be fixed`,
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('❌ AMP validation error:', error);
      toast({
        title: 'Validation Error',
        description: error.message || 'Failed to validate AMP',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  const passCount = checks.filter(c => c.status === 'pass').length;

  const categorySlug = (storyCategory || 'news').toLowerCase();
  const googleValidatorUrl = `https://search.google.com/test/amp?url=${encodeURIComponent(`https://www.thebulletinbriefs.in/amp-story/${categorySlug}/${storySlug}`)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Discover Readiness</span>
          <div className="flex gap-2">
            <Button
              onClick={validateAMP}
              disabled={validating}
              variant="outline"
              size="sm"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Run Checks'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={googleValidatorUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Google AMP Test
              </a>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.length === 0 && !validating && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Click "Run Checks" to verify your web story meets Google's requirements for indexing and Discover eligibility.
            </AlertDescription>
          </Alert>
        )}

        {checks.length > 0 && (
          <>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">✓ {passCount} passed</span>
              {warnCount > 0 && <span className="text-yellow-600 font-medium">⚠ {warnCount} warnings</span>}
              {failCount > 0 && <span className="text-red-600 font-medium">✗ {failCount} failed</span>}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {checks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    check.status === 'pass' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
                    check.status === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
                    'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                  }`}
                >
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : check.status === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{check.name}</p>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Google Discover Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Valid AMP format with all required scripts</li>
            <li>Square publisher logo (96x96px minimum)</li>
            <li>Poster images in all 3 formats (portrait, square, landscape)</li>
            <li>4-30 slides per story</li>
            <li>NewsArticle structured data</li>
            <li>Title under 90 characters</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
