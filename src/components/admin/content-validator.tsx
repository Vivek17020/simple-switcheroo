import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ContentValidation {
  isValid: boolean;
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
  }[];
  stats: {
    wordCount: number;
    paragraphCount: number;
    headingCount: number;
    imageCount: number;
  };
}

interface ContentValidatorProps {
  content: string;
  onValidationChange?: (validation: ContentValidation) => void;
}

export function ContentValidator({ content, onValidationChange }: ContentValidatorProps) {
  const [validation, setValidation] = useState<ContentValidation>({
    isValid: true,
    issues: [],
    stats: { wordCount: 0, paragraphCount: 0, headingCount: 0, imageCount: 0 }
  });

  useEffect(() => {
    validateContent(content);
  }, [content]);

  const validateContent = (html: string) => {
    const issues: ContentValidation['issues'] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Extract text for word count
    const text = tempDiv.textContent || '';
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Count elements
    const paragraphs = tempDiv.querySelectorAll('p');
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const images = tempDiv.querySelectorAll('img');

    // Validation rules
    if (wordCount < 100) {
      issues.push({
        type: 'warning',
        message: `Content is too short (${wordCount} words). Aim for at least 300 words for better SEO.`
      });
    }

    if (paragraphs.length === 0) {
      issues.push({
        type: 'error',
        message: 'No paragraphs found. Content should be properly formatted with paragraph tags.'
      });
    }

    if (headings.length === 0 && wordCount > 200) {
      issues.push({
        type: 'warning',
        message: 'No headings found. Use headings (H2, H3) to structure your content.'
      });
    }

    // Check for empty paragraphs
    const emptyParagraphs = Array.from(paragraphs).filter(p => !p.textContent?.trim());
    if (emptyParagraphs.length > 0) {
      issues.push({
        type: 'warning',
        message: `${emptyParagraphs.length} empty paragraph(s) found. Remove unnecessary empty elements.`
      });
    }

    // Check images
    const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt'));
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'warning',
        message: `${imagesWithoutAlt.length} image(s) missing alt text. Add descriptive alt text for SEO and accessibility.`
      });
    }

    // Check for proper HTML structure
    if (!html.includes('<p>') && !html.includes('<h') && wordCount > 50) {
      issues.push({
        type: 'error',
        message: 'Content appears to be plain text without HTML formatting. Use the rich text editor to format your content.'
      });
    }

    const newValidation: ContentValidation = {
      isValid: !issues.some(i => i.type === 'error'),
      issues,
      stats: {
        wordCount,
        paragraphCount: paragraphs.length,
        headingCount: headings.length,
        imageCount: images.length
      }
    };

    setValidation(newValidation);
    onValidationChange?.(newValidation);
  };

  if (validation.issues.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle>Content looks good!</AlertTitle>
        <AlertDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{validation.stats.wordCount} words</Badge>
            <Badge variant="outline">{validation.stats.paragraphCount} paragraphs</Badge>
            <Badge variant="outline">{validation.stats.headingCount} headings</Badge>
            <Badge variant="outline">{validation.stats.imageCount} images</Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {validation.issues.map((issue, index) => (
        <Alert 
          key={index} 
          variant={issue.type === 'error' ? 'destructive' : 'default'}
        >
          {issue.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
          <AlertTitle className="capitalize">{issue.type}</AlertTitle>
          <AlertDescription>{issue.message}</AlertDescription>
        </Alert>
      ))}
      
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{validation.stats.wordCount} words</Badge>
        <Badge variant="outline">{validation.stats.paragraphCount} paragraphs</Badge>
        <Badge variant="outline">{validation.stats.headingCount} headings</Badge>
        <Badge variant="outline">{validation.stats.imageCount} images</Badge>
      </div>
    </div>
  );
}
