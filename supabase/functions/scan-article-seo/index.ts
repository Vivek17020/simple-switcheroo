import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SeoIssue {
  url: string;
  issue_type: string;
  severity: 'critical' | 'warning' | 'info';
  notes: string;
  article_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, scanAll } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log(`Starting SEO scan for ${scanAll ? 'all articles' : `article ${articleId}`}`);

    // Fetch articles
    let query = supabaseClient
      .from("articles")
      .select("id, slug, title, content, canonical_url, meta_title, meta_description, seo_keywords")
      .eq("published", true);

    if (!scanAll && articleId) {
      query = query.eq('id', articleId);
    }

    const { data: articles, error: articlesError } = await query;

    if (articlesError) throw articlesError;

    const issues: SeoIssue[] = [];
    const baseUrl = "https://www.thebulletinbriefs.in";

    // Scan each article for SEO issues
    for (const article of articles || []) {
      const articleUrl = `${baseUrl}/article/${article.slug}`;
      
      // Check 1: Missing canonical URL
      if (!article.canonical_url) {
        issues.push({
          url: articleUrl,
          issue_type: 'missing_canonical',
          severity: 'critical',
          notes: `Missing canonical URL`,
          article_id: article.id
        });
      }

      // Check 2: Canonical URL mismatch
      if (article.canonical_url && article.canonical_url !== articleUrl) {
        issues.push({
          url: articleUrl,
          issue_type: 'duplicate_canonical',
          severity: 'critical',
          notes: `Canonical URL points elsewhere (${article.canonical_url})`,
          article_id: article.id
        });
      }

      // Check 3: Missing meta title
      if (!article.meta_title) {
        issues.push({
          url: articleUrl,
          issue_type: 'missing_meta_title',
          severity: 'critical',
          notes: `Missing meta title`,
          article_id: article.id
        });
      }

      // Check 4: Meta title too long
      if (article.meta_title && article.meta_title.length > 60) {
        issues.push({
          url: articleUrl,
          issue_type: 'meta_title_too_long',
          severity: 'warning',
          notes: `Meta title is ${article.meta_title.length} characters (should be ≤60)`,
          article_id: article.id
        });
      }

      // Check 5: Missing meta description
      if (!article.meta_description) {
        issues.push({
          url: articleUrl,
          issue_type: 'missing_meta_description',
          severity: 'critical',
          notes: `Missing meta description`,
          article_id: article.id
        });
      }

      // Check 6: Meta description too long
      if (article.meta_description && article.meta_description.length > 160) {
        issues.push({
          url: articleUrl,
          issue_type: 'meta_description_too_long',
          severity: 'warning',
          notes: `Meta description is ${article.meta_description.length} characters (should be ≤160)`,
          article_id: article.id
        });
      }

      // Check 7: Missing SEO keywords
      if (!article.seo_keywords || article.seo_keywords.length === 0) {
        issues.push({
          url: articleUrl,
          issue_type: 'missing_seo_keywords',
          severity: 'warning',
          notes: `No SEO keywords`,
          article_id: article.id
        });
      }

      // Check 8: Content too short
      const contentLength = article.content.replace(/<[^>]*>/g, '').length;
      if (contentLength < 400) {
        issues.push({
          url: articleUrl,
          issue_type: 'short_content',
          severity: 'critical',
          notes: `Content is only ${contentLength} characters (risk of Soft 404)`,
          article_id: article.id
        });
      }
    }

    // Clear previous issues for scanned articles
    const articleIds = articles?.map(a => a.id) || [];
    if (articleIds.length > 0) {
      await supabaseClient
        .from('seo_health_log')
        .delete()
        .in('article_id', articleIds)
        .eq('status', 'open');
    }

    // Log all issues to database
    for (const issue of issues) {
      await supabaseClient
        .from('seo_health_log')
        .insert({
          url: issue.url,
          issue_type: issue.issue_type,
          severity: issue.severity,
          notes: issue.notes,
          article_id: issue.article_id,
          status: 'open',
          auto_fix_attempted: false
        });
    }

    console.log(`SEO scan complete. Found ${issues.length} issues.`);

    return new Response(JSON.stringify({
      success: true,
      total_issues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      issues
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SEO scan error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete SEO scan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
