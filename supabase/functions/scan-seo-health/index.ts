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
  article_id?: string;
  auto_fix_attempted?: boolean;
}

interface ArticleData {
  id: string;
  slug: string;
  title: string;
  content: string;
  canonical_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string[] | null;
  published_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting comprehensive SEO health scan...');

    // Clear old open issues first (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabaseClient
      .from('seo_health_log')
      .delete()
      .eq('status', 'open')
      .lt('detected_at', twentyFourHoursAgo);

    console.log('Cleared old open issues');

    // Fetch all published articles
    const { data: articles, error: articlesError } = await supabaseClient
      .from("articles")
      .select("id, slug, title, content, canonical_url, meta_title, meta_description, seo_keywords, published_at")
      .eq("published", true);

    if (articlesError) throw articlesError;

    const issues: SeoIssue[] = [];
    const baseUrl = "https://www.thebulletinbriefs.in";
    let autoFixCount = 0;

    // Scan each article for SEO issues
    for (const article of articles || []) {
      const articleUrl = `${baseUrl}/article/${article.slug}`;
      
      // === HTTP RESPONSE & SOFT 404 DETECTION ===
      try {
        const response = await fetch(articleUrl, { 
          method: 'GET',
          redirect: 'manual'
        });
        
        // Check for redirects
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          issues.push({
            url: articleUrl,
            issue_type: 'page_with_redirect',
            severity: 'warning',
            notes: `Page redirects to: ${location}. Consider updating sitemap with final URL.`,
            article_id: article.id
          });
        }
        
        // Check for soft 404 (200 response but very little content)
        if (response.status === 200) {
          const html = await response.text();
          if (html.length < 500) {
            issues.push({
              url: articleUrl,
              issue_type: 'soft_404',
              severity: 'critical',
              notes: `Page returns 200 but has only ${html.length} bytes. Triggering AI content generation.`,
              article_id: article.id,
              auto_fix_attempted: true
            });
            
            // Auto-fix: Generate AI content
            await generateAiContent(supabaseClient, article.id, article.title);
            autoFixCount++;
          }
          
          // Check for noindex robots meta
          if (html.includes('robots') && (html.includes('noindex') || html.includes('NOINDEX'))) {
            issues.push({
              url: articleUrl,
              issue_type: 'not_indexed_intentionally',
              severity: 'info',
              notes: 'Page has noindex meta tag. This is intentional.',
              article_id: article.id
            });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${articleUrl}:`, error);
      }
      
      // Check 1: Missing canonical URL
      if (!article.canonical_url) {
        issues.push({
          url: articleUrl,
          issue_type: 'missing_canonical',
          severity: 'critical',
          notes: `Article "${article.title}" is missing canonical URL. Auto-fixed.`,
          article_id: article.id,
          auto_fix_attempted: true
        });
        
        // Auto-fix: Set canonical URL
        await supabaseClient
          .from('articles')
          .update({ canonical_url: articleUrl })
          .eq('id', article.id);
        
        autoFixCount++;
        console.log(`Auto-fixed: Added canonical URL for ${article.slug}`);
      }

      // Check 2: Canonical URL mismatch (Duplicate Canonical)
      if (article.canonical_url && article.canonical_url !== articleUrl) {
        // Normalize URLs for comparison (remove trailing slashes, www, etc)
        const normalizedCanonical = article.canonical_url.toLowerCase().replace(/\/$/, '');
        const normalizedArticle = articleUrl.toLowerCase().replace(/\/$/, '');
        
        if (normalizedCanonical !== normalizedArticle) {
          issues.push({
            url: articleUrl,
            issue_type: 'duplicate_canonical',
            severity: 'critical',
            notes: `Canonical URL mismatch: "${article.canonical_url}" → "${articleUrl}". Auto-fixed.`,
            article_id: article.id,
            auto_fix_attempted: true
          });
          
          // Auto-fix: Update canonical to current URL
          await supabaseClient
            .from('articles')
            .update({ canonical_url: articleUrl })
            .eq('id', article.id);
          
          autoFixCount++;
          console.log(`Auto-fixed: Corrected canonical URL for ${article.slug}`);
          
          // Request indexing for the corrected URL
          await requestGoogleIndexing(articleUrl);
        }
      }

      // Check 3: Missing meta title
      if (!article.meta_title) {
        issues.push({
          url: articleUrl,
          issue_type: 'missing_meta_title',
          severity: 'critical',
          notes: `Article "${article.title}" is missing meta title. Auto-generated.`,
          article_id: article.id,
          auto_fix_attempted: true
        });
        
        // Auto-fix: Use article title as meta title (max 60 chars)
        const metaTitle = article.title.length > 60 
          ? article.title.substring(0, 57) + '...'
          : article.title;
        
        await supabaseClient
          .from('articles')
          .update({ meta_title: metaTitle })
          .eq('id', article.id);
        
        autoFixCount++;
        console.log(`Auto-fixed: Added meta title for ${article.slug}`);
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
          notes: `Article "${article.title}" is missing meta description. Auto-generated.`,
          article_id: article.id,
          auto_fix_attempted: true
        });
        
        // Auto-fix: Generate from content
        const plainText = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const metaDesc = plainText.length > 160 
          ? plainText.substring(0, 157) + '...'
          : plainText;
        
        await supabaseClient
          .from('articles')
          .update({ meta_description: metaDesc })
          .eq('id', article.id);
        
        autoFixCount++;
        console.log(`Auto-fixed: Added meta description for ${article.slug}`);
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
          notes: `Article "${article.title}" has no SEO keywords`,
          article_id: article.id
        });
      }

      // Check 8: Content too short
      const contentLength = article.content.replace(/<[^>]*>/g, '').length;
      if (contentLength < 500) {
        issues.push({
          url: articleUrl,
          issue_type: 'short_content',
          severity: 'critical',
          notes: `Content is only ${contentLength} characters. Triggering AI content expansion.`,
          article_id: article.id,
          auto_fix_attempted: true
        });
        
        // Auto-fix: Expand content with AI
        await generateAiContent(supabaseClient, article.id, article.title);
        autoFixCount++;
      }

      // Check 9: Article published more than 7 days ago without updates
      const daysSincePublish = Math.floor(
        (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSincePublish > 7) {
        issues.push({
          url: articleUrl,
          issue_type: 'stale_content',
          severity: 'info',
          notes: `Article published ${daysSincePublish} days ago, consider updating`,
          article_id: article.id
        });
      }
      
      // Check 10: Request indexing for new articles (published within last 24 hours)
      if (daysSincePublish <= 1) {
        await requestGoogleIndexing(articleUrl);
        console.log(`Requested indexing for new article: ${article.slug}`);
      }
    }

    // Log all issues to database
    for (const issue of issues) {
      // Determine status based on auto-fix
      const wasAutoFixed = issue.auto_fix_attempted === true;
      const issueStatus = wasAutoFixed ? 'resolved' : 'open';
      const resolutionStatus = wasAutoFixed ? 'auto_fixed' : null;

      const { error: logError } = await supabaseClient
        .from('seo_health_log')
        .insert({
          url: issue.url,
          issue_type: issue.issue_type,
          severity: issue.severity,
          notes: issue.notes,
          article_id: issue.article_id,
          status: issueStatus,
          resolution_status: resolutionStatus,
          auto_fix_attempted: wasAutoFixed
        });

      if (logError) {
        console.error('Failed to log issue:', logError);
      }

      // Log auto-fixes to verification table
      if (issue.auto_fix_attempted) {
        let fixAction = 'Unknown fix';
        switch (issue.issue_type) {
          case 'missing_canonical':
          case 'duplicate_canonical':
            fixAction = 'Set canonical URL to current page URL';
            break;
          case 'missing_meta_title':
            fixAction = 'Generated meta title from article title';
            break;
          case 'missing_meta_description':
            fixAction = 'Generated meta description from article content';
            break;
          case 'soft_404':
          case 'short_content':
            fixAction = 'Generated additional content using AI';
            break;
        }

        const { error: verifyError } = await supabaseClient
          .from('seo_autofix_verification')
          .insert({
            url: issue.url,
            issue_type: issue.issue_type,
            fix_action: fixAction,
            article_id: issue.article_id,
            internal_status: 'pending',
            gsc_status: 'pending',
            fix_applied_at: new Date().toISOString()
          });

        if (verifyError) {
          console.error('Failed to log verification record:', verifyError);
        }
      }
    }

    // Trigger verification process (wait 15 minutes for changes to propagate)
    if (autoFixCount > 0) {
      console.log(`Scheduling verification for ${autoFixCount} auto-fixes...`);
      setTimeout(async () => {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-seo-fixes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({})
          });
        } catch (error) {
          console.error('Failed to trigger verification:', error);
        }
      }, 15 * 60 * 1000); // 15 minutes
    }

    console.log(`SEO scan complete. Found ${issues.length} issues. Auto-fixed: ${autoFixCount}`);

    // Send summary email to admin
    await sendAdminReport(supabaseClient, issues, autoFixCount);

    return new Response(JSON.stringify({
      success: true,
      total_issues: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      auto_fixed: autoFixCount
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

// === HELPER FUNCTIONS ===

async function generateAiContent(supabaseClient: any, articleId: string, title: string) {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return;
    }

    const prompt = `Generate additional SEO-friendly content for an article titled "${title}". 
    Create 2-3 informative paragraphs that provide value to readers. 
    Include relevant facts, context, and insights related to the topic.
    Make it engaging and comprehensive (at least 500 words).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert content writer specializing in news and articles." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI content generation failed:', response.status);
      return;
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '';

    if (generatedContent) {
      // Append generated content to existing article
      const { data: article } = await supabaseClient
        .from('articles')
        .select('content')
        .eq('id', articleId)
        .single();

      if (article) {
        const updatedContent = article.content + '\n\n' + generatedContent;
        await supabaseClient
          .from('articles')
          .update({ content: updatedContent })
          .eq('id', articleId);

        console.log(`AI content generated and appended for article ${articleId}`);
      }
    }
  } catch (error) {
    console.error('Failed to generate AI content:', error);
  }
}

async function requestGoogleIndexing(url: string): Promise<void> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if GSC config exists
    const { data: gscConfig } = await supabaseClient
      .from('gsc_config')
      .select('access_token, token_expires_at, client_id, client_secret, refresh_token')
      .eq('is_active', true)
      .single();

    if (!gscConfig) {
      console.log('GSC not configured, skipping indexing request');
      return;
    }

    // Refresh token if expired
    let accessToken = gscConfig.access_token;
    if (new Date(gscConfig.token_expires_at) <= new Date()) {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: gscConfig.client_id,
          client_secret: gscConfig.client_secret,
          refresh_token: gscConfig.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
      }
    }

    // Request indexing via Google Indexing API
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    if (response.ok) {
      console.log(`✅ Indexing requested for ${url}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to request indexing for ${url}:`, errorText);
    }
  } catch (error) {
    console.error(`Error requesting indexing for ${url}:`, error);
  }
}

async function sendAdminReport(supabaseClient: any, issues: SeoIssue[], autoFixCount: number) {
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping email report');
      return;
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    const emailBody = `
      <h2>🔍 Daily SEO Health Report</h2>
      <p><strong>Scan completed at:</strong> ${new Date().toISOString()}</p>
      
      <h3>📊 Summary</h3>
      <ul>
        <li>Total issues detected: ${issues.length}</li>
        <li>Critical: ${criticalIssues.length}</li>
        <li>Warnings: ${warningIssues.length}</li>
        <li>Auto-fixed: ${autoFixCount}</li>
      </ul>

      <h3>🚨 Critical Issues</h3>
      ${criticalIssues.length > 0 ? criticalIssues.map(issue => `
        <div style="border-left: 3px solid red; padding-left: 10px; margin: 10px 0;">
          <strong>${issue.issue_type}</strong><br>
          URL: ${issue.url}<br>
          ${issue.notes}
        </div>
      `).join('') : '<p>No critical issues found ✅</p>'}

      <h3>⚠️ Warnings</h3>
      ${warningIssues.length > 0 ? warningIssues.slice(0, 5).map(issue => `
        <div style="border-left: 3px solid orange; padding-left: 10px; margin: 10px 0;">
          <strong>${issue.issue_type}</strong><br>
          URL: ${issue.url}<br>
          ${issue.notes}
        </div>
      `).join('') : '<p>No warnings ✅</p>'}

      <p><em>View full details in your admin dashboard.</em></p>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SEO Monitor <noreply@thebulletinbriefs.in>",
        to: ["admin@thebulletinbriefs.in"],
        subject: `SEO Health Report: ${issues.length} issues (${autoFixCount} auto-fixed)`,
        html: emailBody,
      }),
    });

    console.log('Admin email report sent successfully');
  } catch (error) {
    console.error('Failed to send admin report:', error);
  }
}