import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ValidationResult {
  status: 'PASS' | 'FAIL';
  errors: Array<{
    severity: 'ERROR' | 'WARNING';
    message: string;
    line?: number;
    col?: number;
  }>;
}

interface WebStoryAMPValidatorProps {
  storySlug: string;
  storyTitle: string;
}

export function WebStoryAMPValidator({ storySlug, storyTitle }: WebStoryAMPValidatorProps) {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateAMP = async () => {
    setValidating(true);
    setResult(null);

    try {
      console.log('🔍 Validating AMP for story:', storySlug);

      // Get the AMP HTML from our edge function
      const ampUrl = `https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/web-story-amp?slug=${storySlug}`;
      const ampResponse = await fetch(ampUrl);
      
      if (!ampResponse.ok) {
        throw new Error('Failed to fetch AMP HTML');
      }

      const ampHtml = await ampResponse.text();

      // Use Google's AMP Validator API
      const validatorUrl = 'https://validator.ampproject.org/validate';
      const validatorResponse = await fetch(validatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/html',
        },
        body: ampHtml,
      });

      if (!validatorResponse.ok) {
        throw new Error('AMP validation service unavailable');
      }

      const validationResult = await validatorResponse.json();

      const errors = validationResult.errors?.map((err: any) => ({
        severity: err.severity,
        message: err.message,
        line: err.line,
        col: err.col,
      })) || [];

      const status = errors.filter((e: any) => e.severity === 'ERROR').length > 0 ? 'FAIL' : 'PASS';

      setResult({
        status,
        errors,
      });

      if (status === 'PASS') {
        toast({
          title: '✓ AMP Validation Passed',
          description: 'Your web story is valid AMP and ready for Google Discover!',
        });
      } else {
        toast({
          title: '✗ AMP Validation Failed',
          description: `Found ${errors.filter((e: any) => e.severity === 'ERROR').length} errors`,
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

  const errorCount = result?.errors.filter(e => e.severity === 'ERROR').length || 0;
  const warningCount = result?.errors.filter(e => e.severity === 'WARNING').length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AMP Validation</span>
          <Button
            onClick={validateAMP}
            disabled={validating}
            variant="outline"
            size="sm"
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate AMP'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !validating && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Click "Validate AMP" to check if your web story meets Google's AMP requirements.
              This ensures your story will be eligible for Google Discover.
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <>
            <Alert variant={result.status === 'PASS' ? 'default' : 'destructive'}>
              {result.status === 'PASS' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <AlertDescription>
                {result.status === 'PASS' ? (
                  <span className="text-green-600 font-medium">
                    ✓ Valid AMP! Your story is ready for Google Discover.
                  </span>
                ) : (
                  <span className="font-medium">
                    ✗ AMP Validation Failed: {errorCount} error{errorCount !== 1 ? 's' : ''}, {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Issues Found:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <Alert
                      key={index}
                      variant={error.severity === 'ERROR' ? 'destructive' : 'default'}
                      className="py-2"
                    >
                      <AlertDescription className="text-xs">
                        <span className="font-medium">
                          {error.severity === 'ERROR' ? '❌ ERROR' : '⚠️ WARNING'}
                        </span>
                        {error.line && ` (Line ${error.line}${error.col ? `, Col ${error.col}` : ''})`}
                        : {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Why AMP validation matters:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Discover only shows valid AMP web stories</li>
            <li>Valid AMP ensures fast loading and good mobile experience</li>
            <li>Proper validation increases your story's visibility in search</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
