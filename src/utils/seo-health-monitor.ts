import { supabase } from '@/integrations/supabase/client';

export interface SEOHealthIssue {
  type: 'missing_canonical' | 'duplicate_canonical' | 'short_content' | 'missing_meta' | 'soft_404';
  severity: 'low' | 'medium' | 'high';
  description: string;
  fix?: () => void;
}

export async function checkPageSEOHealth(url: string): Promise<SEOHealthIssue[]> {
  const issues: SEOHealthIssue[] = [];
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for canonical URL
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push({
        type: 'missing_canonical',
        severity: 'high',
        description: 'Missing canonical URL tag'
      });
    }

    // Check for duplicate canonicals
    const canonicals = doc.querySelectorAll('link[rel="canonical"]');
    if (canonicals.length > 1) {
      issues.push({
        type: 'duplicate_canonical',
        severity: 'high',
        description: `Found ${canonicals.length} canonical tags, should have only one`
      });
    }

    // Check content length
    const mainContent = doc.querySelector('article, main, [role="main"]');
    const contentLength = mainContent?.textContent?.trim().length || 0;
    
    if (contentLength < 300) {
      issues.push({
        type: 'short_content',
        severity: 'high',
        description: `Content too short (${contentLength} characters). Should be at least 300 characters.`
      });
    }

    // Check meta description
    const metaDescription = doc.querySelector('meta[name="description"]');
    if (!metaDescription || !metaDescription.getAttribute('content')) {
      issues.push({
        type: 'missing_meta',
        severity: 'medium',
        description: 'Missing meta description'
      });
    }

    // Check for soft 404 indicators
    const hasNotFoundText = html.toLowerCase().includes('not found') || 
                           html.toLowerCase().includes('404') ||
                           html.toLowerCase().includes('page does not exist');
    if (hasNotFoundText && response.status === 200) {
      issues.push({
        type: 'soft_404',
        severity: 'high',
        description: 'Page appears to be 404 but returns 200 status'
      });
    }

  } catch (error) {
    console.error('SEO health check failed:', error);
  }

  return issues;
}

export async function reportSEOIssue(articleId: string, issue: SEOHealthIssue) {
  try {
    await supabase.from('seo_health_log').insert({
      url: window.location.href,
      issue_type: issue.type,
      severity: issue.severity,
      status: 'open',
      notes: issue.description
    });
  } catch (error) {
    console.error('Failed to report SEO issue:', error);
  }
}

export async function autoFixSEOIssue(articleId: string, issueType: string) {
  try {
    const { error } = await supabase.functions.invoke('trigger-seo-autofix', {
      body: { articleId, issueType }
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Auto-fix failed:', error);
    return { success: false, error };
  }
}
