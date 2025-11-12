import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ToolPage {
  url: string;
  name: string;
  category?: string;
  isHub?: boolean;
}

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

const TOOL_PAGES: ToolPage[] = [
  // Main Pages
  { url: '/tools', name: 'Tools Hub', isHub: true },
  
  // Category Pages
  { url: '/tools/pdf-tools', name: 'PDF Tools Hub', category: 'pdf', isHub: true },
  { url: '/tools/image-tools', name: 'Image Tools Hub', category: 'image', isHub: true },
  { url: '/tools/video-tools', name: 'Video Tools Hub', category: 'video', isHub: true },
  
  // PDF Tools
  { url: '/tools/pdf-to-word', name: 'PDF to Word', category: 'pdf' },
  { url: '/tools/word-to-pdf', name: 'Word to PDF', category: 'pdf' },
  { url: '/tools/pdf-to-excel', name: 'PDF to Excel', category: 'pdf' },
  { url: '/tools/excel-to-pdf', name: 'Excel to PDF', category: 'pdf' },
  { url: '/tools/pdf-to-jpg', name: 'PDF to JPG', category: 'pdf' },
  { url: '/tools/jpg-to-pdf', name: 'JPG to PDF', category: 'pdf' },
  { url: '/tools/pdf-to-ppt', name: 'PDF to PowerPoint', category: 'pdf' },
  { url: '/tools/ppt-to-pdf', name: 'PowerPoint to PDF', category: 'pdf' },
  { url: '/tools/merge-pdf', name: 'Merge PDF', category: 'pdf' },
  { url: '/tools/split-pdf', name: 'Split PDF', category: 'pdf' },
  { url: '/tools/compress-pdf', name: 'Compress PDF', category: 'pdf' },
  
  // Image Tools
  { url: '/tools/jpg-to-png', name: 'JPG to PNG', category: 'image' },
  { url: '/tools/png-to-jpg', name: 'PNG to JPG', category: 'image' },
  { url: '/tools/image-compressor', name: 'Image Compressor', category: 'image' },
  { url: '/tools/image-resizer', name: 'Image Resizer', category: 'image' },
  { url: '/tools/image-cropper', name: 'Image Cropper', category: 'image' },
  { url: '/tools/convert-to-webp', name: 'Convert to WebP', category: 'image' },
  
  // Video Tools
  { url: '/tools/youtube-shorts-downloader', name: 'YouTube Shorts Downloader', category: 'video' },
  { url: '/tools/instagram-video-downloader', name: 'Instagram Video Downloader', category: 'video' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const baseUrl = 'https://www.thebulletinbriefs.in';
    const results: AuditResult[] = [];
    let totalScore = 0;
    
    console.log(`Starting audit of ${TOOL_PAGES.length} tool pages...`);

    for (const toolPage of TOOL_PAGES) {
      try {
        const fullUrl = `${baseUrl}${toolPage.url}`;
        console.log(`Auditing: ${fullUrl}`);
        
        const response = await fetch(fullUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const errors: string[] = [];
        const warnings: string[] = [];
        let pageScore = 100;

        // Check Title
        const title = doc.querySelector('title')?.textContent || '';
        const hasTitle = title.length > 0;
        const titleLength = title.length;
        if (!hasTitle) {
          errors.push('Missing title tag');
          pageScore -= 15;
        } else if (titleLength > 60) {
          warnings.push(`Title too long (${titleLength} chars, max 60)`);
          pageScore -= 5;
        } else if (titleLength < 30) {
          warnings.push(`Title too short (${titleLength} chars, min 30)`);
          pageScore -= 3;
        }

        // Check Meta Description
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const hasDescription = description.length > 0;
        const descriptionLength = description.length;
        if (!hasDescription) {
          errors.push('Missing meta description');
          pageScore -= 15;
        } else if (descriptionLength > 160) {
          warnings.push(`Description too long (${descriptionLength} chars, max 160)`);
          pageScore -= 5;
        } else if (descriptionLength < 120) {
          warnings.push(`Description too short (${descriptionLength} chars, min 120)`);
          pageScore -= 3;
        }

        // Check Canonical URL
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const hasCanonical = canonical.length > 0;
        const expectedCanonical = `${baseUrl}${toolPage.url}/`;
        const canonicalCorrect = canonical === expectedCanonical || canonical === expectedCanonical.replace(/\/$/, '');
        
        if (!hasCanonical) {
          errors.push('Missing canonical URL');
          pageScore -= 10;
        } else if (!canonicalCorrect) {
          errors.push(`Incorrect canonical URL. Expected: ${expectedCanonical}, Got: ${canonical}`);
          pageScore -= 8;
        }

        // Check Open Graph Tags
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
        const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content');
        const hasOgTags = !!(ogTitle && ogDescription && ogImage && ogUrl);
        
        if (!hasOgTags) {
          errors.push('Incomplete Open Graph tags');
          pageScore -= 10;
        }

        // Check H1
        const h1Elements = doc.querySelectorAll('h1');
        const hasH1 = h1Elements.length === 1;
        if (h1Elements.length === 0) {
          errors.push('Missing H1 tag');
          pageScore -= 10;
        } else if (h1Elements.length > 1) {
          errors.push(`Multiple H1 tags found (${h1Elements.length})`);
          pageScore -= 5;
        }

        // Check Structured Data
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        const schemas = Array.from(scripts).map(script => {
          try {
            return JSON.parse(script.textContent || '{}');
          } catch {
            return null;
          }
        }).filter(Boolean);

        const hasSoftwareSchema = !toolPage.isHub && schemas.some(s => s['@type'] === 'SoftwareApplication');
        const hasBreadcrumbSchema = schemas.some(s => s['@type'] === 'BreadcrumbList');
        
        if (!toolPage.isHub && !hasSoftwareSchema) {
          errors.push('Missing SoftwareApplication schema');
          pageScore -= 10;
        }
        
        if (!hasBreadcrumbSchema) {
          errors.push('Missing BreadcrumbList schema');
          pageScore -= 8;
        }

        // Check for Advanced SEO Component (AdvancedSEOHead)
        const hasAdvancedSEO = hasCanonical && hasOgTags && doc.querySelector('meta[name="robots"]');
        if (!hasAdvancedSEO) {
          warnings.push('Not using AdvancedSEOHead component');
          pageScore -= 5;
        }

        // Check for Breadcrumbs (visual)
        const hasBreadcrumbs = html.includes('breadcrumb') || html.includes('Breadcrumb');
        if (!hasBreadcrumbs && !toolPage.isHub) {
          warnings.push('No visual breadcrumb navigation found');
          pageScore -= 3;
        }

        // Check for Related Tools section
        const hasRelatedTools = html.includes('Related Tools') || html.includes('related-tools');
        if (!hasRelatedTools && !toolPage.isHub) {
          warnings.push('No Related Tools section found');
          pageScore -= 5;
        }

        // Check for Back Navigation
        const hasBackNavigation = html.includes('Back to') || html.includes('ArrowLeft');
        if (!hasBackNavigation && !toolPage.isHub) {
          warnings.push('No back navigation found');
          pageScore -= 2;
        }

        // Ensure score doesn't go below 0
        pageScore = Math.max(0, pageScore);
        totalScore += pageScore;

        results.push({
          url: toolPage.url,
          name: toolPage.name,
          status: response.status,
          hasTitle,
          titleLength,
          hasDescription,
          descriptionLength,
          hasCanonical,
          canonicalCorrect,
          hasOgTags,
          hasH1,
          hasBreadcrumbs,
          hasSoftwareSchema: !toolPage.isHub ? hasSoftwareSchema : true,
          hasBreadcrumbSchema,
          hasRelatedTools: !toolPage.isHub ? hasRelatedTools : true,
          hasBackNavigation: !toolPage.isHub ? hasBackNavigation : true,
          hasAdvancedSEO,
          errors,
          warnings,
          score: pageScore
        });

      } catch (error) {
        console.error(`Error auditing ${toolPage.url}:`, error);
        results.push({
          url: toolPage.url,
          name: toolPage.name,
          status: 0,
          hasTitle: false,
          titleLength: 0,
          hasDescription: false,
          descriptionLength: 0,
          hasCanonical: false,
          canonicalCorrect: false,
          hasOgTags: false,
          hasH1: false,
          hasBreadcrumbs: false,
          hasSoftwareSchema: false,
          hasBreadcrumbSchema: false,
          hasRelatedTools: false,
          hasBackNavigation: false,
          hasAdvancedSEO: false,
          errors: [`Failed to fetch: ${error.message}`],
          warnings: [],
          score: 0
        });
      }
    }

    const averageScore = Math.round(totalScore / TOOL_PAGES.length);
    const passedPages = results.filter(r => r.score >= 90).length;
    const failedPages = results.filter(r => r.score < 70).length;
    const warningPages = results.filter(r => r.score >= 70 && r.score < 90).length;

    const verdict = averageScore >= 95 ? 'READY' : averageScore >= 85 ? 'ALMOST READY' : 'NOT READY';

    const report = {
      summary: {
        totalPages: TOOL_PAGES.length,
        averageScore,
        verdict,
        passedPages,
        warningPages,
        failedPages,
        auditDate: new Date().toISOString()
      },
      results,
      recommendations: generateRecommendations(results),
      topPriorities: getTopPriorities(results),
      readinessChecklist: generateChecklist(results)
    };

    console.log(`Audit complete. Average score: ${averageScore}/100`);

    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Audit error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete audit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateRecommendations(results: AuditResult[]): string[] {
  const recommendations: string[] = [];
  
  const missingSchemas = results.filter(r => !r.hasSoftwareSchema && !r.url.includes('-tools')).length;
  if (missingSchemas > 0) {
    recommendations.push(`Add SoftwareApplicationSchema to ${missingSchemas} tool pages`);
  }

  const missingBreadcrumbs = results.filter(r => !r.hasBreadcrumbSchema).length;
  if (missingBreadcrumbs > 0) {
    recommendations.push(`Add BreadcrumbSchema to ${missingBreadcrumbs} pages`);
  }

  const missingRelated = results.filter(r => !r.hasRelatedTools && !r.url.includes('-tools')).length;
  if (missingRelated > 0) {
    recommendations.push(`Add Related Tools section to ${missingRelated} tool pages`);
  }

  const titleIssues = results.filter(r => r.titleLength > 60 || r.titleLength < 30).length;
  if (titleIssues > 0) {
    recommendations.push(`Fix title length on ${titleIssues} pages`);
  }

  const descriptionIssues = results.filter(r => r.descriptionLength > 160 || r.descriptionLength < 120).length;
  if (descriptionIssues > 0) {
    recommendations.push(`Optimize meta descriptions on ${descriptionIssues} pages`);
  }

  return recommendations;
}

function getTopPriorities(results: AuditResult[]): string[] {
  const priorities: string[] = [];
  
  const criticalErrors = results.filter(r => r.errors.length > 0);
  if (criticalErrors.length > 0) {
    priorities.push(`Fix ${criticalErrors.length} pages with critical errors`);
  }

  const lowScores = results.filter(r => r.score < 70).sort((a, b) => a.score - b.score).slice(0, 5);
  if (lowScores.length > 0) {
    priorities.push(`Priority pages needing improvement: ${lowScores.map(r => r.name).join(', ')}`);
  }

  return priorities;
}

function generateChecklist(results: AuditResult[]): Record<string, boolean> {
  return {
    'All pages have proper titles': results.every(r => r.hasTitle && r.titleLength <= 60),
    'All pages have meta descriptions': results.every(r => r.hasDescription && r.descriptionLength <= 160),
    'All pages have canonical URLs': results.every(r => r.hasCanonical && r.canonicalCorrect),
    'All pages have Open Graph tags': results.every(r => r.hasOgTags),
    'All pages have single H1 tag': results.every(r => r.hasH1),
    'All tool pages have SoftwareSchema': results.filter(r => !r.url.includes('-tools')).every(r => r.hasSoftwareSchema),
    'All pages have BreadcrumbSchema': results.every(r => r.hasBreadcrumbSchema),
    'All tool pages have Related Tools': results.filter(r => !r.url.includes('-tools')).every(r => r.hasRelatedTools),
    'All pages return 200 OK': results.every(r => r.status === 200),
    'Average score >= 95': results.reduce((sum, r) => sum + r.score, 0) / results.length >= 95
  };
}
