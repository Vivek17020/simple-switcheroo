import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditMetrics {
  totalArticles: number;
  issuesFound: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  autoFixed: number;
  aiDetectionAccuracy: number;
  autoFixSuccessRate: number;
  reindexSuccessRate: number;
  averageFixTime: number;
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

    console.log('🔍 Starting comprehensive SEO audit...');
    const auditStartTime = Date.now();

    // Create audit report record
    const { data: auditReport, error: reportError } = await supabaseClient
      .from('seo_audit_reports')
      .insert({
        audit_status: 'in_progress',
        audit_started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (reportError) throw reportError;
    const auditId = auditReport.id;

    try {
      // === STEP 1: RUN SEO HEALTH SCAN ===
      console.log('Step 1: Running SEO health scan...');
      const { data: scanResult, error: scanError } = await supabaseClient.functions.invoke('scan-seo-health');
      
      if (scanError) throw scanError;

      // Wait for scan to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // === STEP 2: VERIFY AUTO-FIXES ===
      console.log('Step 2: Verifying auto-fixes...');
      const { data: verifyResult, error: verifyError } = await supabaseClient.functions.invoke('verify-seo-fixes');
      
      // Non-critical error, continue audit
      if (verifyError) {
        console.error('Verification error (non-critical):', verifyError);
      }

      // === STEP 3: GSC INTEGRATION CHECK ===
      console.log('Step 3: Google Search Console integration check...');
      const { data: gscResult, error: gscError } = await supabaseClient.functions.invoke('inspect-gsc-url', {
        body: { triggerBatch: true }
      });

      // Non-critical error, continue audit
      if (gscError) {
        console.error('GSC error (non-critical):', gscError);
      }

      // === STEP 4: COLLECT METRICS ===
      console.log('Step 4: Collecting audit metrics...');
      
      // Fetch total published articles
      const { count: totalArticles } = await supabaseClient
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

      // Fetch all SEO issues
      const { data: allIssues, error: issuesError } = await supabaseClient
        .from('seo_health_log')
        .select('*')
        .order('detected_at', { ascending: false });

      if (issuesError) throw issuesError;

      // Fetch verification records
      const { data: verifications, error: verificationsError } = await supabaseClient
        .from('seo_autofix_verification')
        .select('*')
        .order('fix_applied_at', { ascending: false });

      if (verificationsError) throw verificationsError;

      // Calculate metrics
      const metrics = calculateMetrics(allIssues || [], verifications || [], totalArticles || 0);

      // === STEP 5: DETECT FALSE POSITIVES (AI ACCURACY) ===
      console.log('Step 5: Calculating AI detection accuracy...');
      const aiAccuracy = await calculateAiAccuracy(supabaseClient, allIssues || []);
      metrics.aiDetectionAccuracy = aiAccuracy;

      // === STEP 6: UPDATE AUDIT REPORT ===
      const auditEndTime = Date.now();
      const auditDuration = Math.floor((auditEndTime - auditStartTime) / 1000);

      const { error: updateError } = await supabaseClient
        .from('seo_audit_reports')
        .update({
          audit_completed_at: new Date().toISOString(),
          total_articles_scanned: metrics.totalArticles,
          total_issues_found: metrics.issuesFound,
          critical_issues: metrics.criticalIssues,
          warning_issues: metrics.warningIssues,
          info_issues: metrics.infoIssues,
          issues_auto_fixed: metrics.autoFixed,
          issues_remaining: metrics.issuesFound - metrics.autoFixed,
          ai_detection_accuracy: metrics.aiDetectionAccuracy,
          auto_fix_success_rate: metrics.autoFixSuccessRate,
          reindex_success_rate: metrics.reindexSuccessRate,
          average_fix_time_seconds: metrics.averageFixTime,
          audit_status: 'completed'
        })
        .eq('id', auditId);

      if (updateError) {
        console.error('Failed to update audit report:', updateError);
      }

      // === STEP 7: SEND AUDIT REPORT EMAIL ===
      console.log('Step 7: Sending audit report email...');
      await sendAuditReportEmail(supabaseClient, metrics, auditDuration);

      console.log(`✅ Comprehensive SEO audit completed in ${auditDuration}s`);

      return new Response(JSON.stringify({
        success: true,
        auditId,
        duration_seconds: auditDuration,
        metrics: {
          total_articles_scanned: metrics.totalArticles,
          total_issues_found: metrics.issuesFound,
          critical: metrics.criticalIssues,
          warnings: metrics.warningIssues,
          info: metrics.infoIssues,
          auto_fixed: metrics.autoFixed,
          remaining: metrics.issuesFound - metrics.autoFixed,
          ai_detection_accuracy: `${metrics.aiDetectionAccuracy}%`,
          auto_fix_success_rate: `${metrics.autoFixSuccessRate}%`,
          reindex_success_rate: `${metrics.reindexSuccessRate}%`,
          average_fix_time: `${metrics.averageFixTime}s`
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (auditError) {
      // Mark audit as failed
      await supabaseClient
        .from('seo_audit_reports')
        .update({
          audit_status: 'failed',
          error_details: auditError instanceof Error ? auditError.message : 'Unknown error'
        })
        .eq('id', auditId);

      throw auditError;
    }

  } catch (error) {
    console.error('Comprehensive SEO audit error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete comprehensive SEO audit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// === HELPER FUNCTIONS ===

function calculateMetrics(issues: any[], verifications: any[], totalArticles: number): AuditMetrics {
  const now = Date.now();
  const last24Hours = now - (24 * 60 * 60 * 1000);

  // Filter recent issues
  const recentIssues = issues.filter(i => new Date(i.detected_at).getTime() > last24Hours);

  const criticalIssues = recentIssues.filter(i => i.severity === 'critical').length;
  const warningIssues = recentIssues.filter(i => i.severity === 'warning').length;
  const infoIssues = recentIssues.filter(i => i.severity === 'info').length;

  // Count auto-fixed issues
  const autoFixed = recentIssues.filter(i => i.status === 'resolved' && i.auto_fix_attempted).length;

  // Calculate auto-fix success rate
  const autoFixAttempts = recentIssues.filter(i => i.auto_fix_attempted).length;
  const autoFixSuccessRate = autoFixAttempts > 0 
    ? Math.round((autoFixed / autoFixAttempts) * 100) 
    : 0;

  // Calculate reindex success rate from verification records
  const recentVerifications = verifications.filter(v => 
    new Date(v.fix_applied_at).getTime() > last24Hours
  );
  const indexedCount = recentVerifications.filter(v => v.gsc_status === 'indexed').length;
  const reindexSuccessRate = recentVerifications.length > 0
    ? Math.round((indexedCount / recentVerifications.length) * 100)
    : 0;

  // Calculate average fix time (time from detection to resolution)
  const resolvedIssues = recentIssues.filter(i => i.status === 'resolved' && i.updated_at && i.detected_at);
  let totalFixTime = 0;
  resolvedIssues.forEach(issue => {
    const detectedTime = new Date(issue.detected_at).getTime();
    const resolvedTime = new Date(issue.updated_at).getTime();
    totalFixTime += (resolvedTime - detectedTime) / 1000; // Convert to seconds
  });
  const averageFixTime = resolvedIssues.length > 0 
    ? Math.round(totalFixTime / resolvedIssues.length)
    : 0;

  return {
    totalArticles,
    issuesFound: recentIssues.length,
    criticalIssues,
    warningIssues,
    infoIssues,
    autoFixed,
    aiDetectionAccuracy: 0, // Will be calculated separately
    autoFixSuccessRate,
    reindexSuccessRate,
    averageFixTime
  };
}

async function calculateAiAccuracy(supabaseClient: any, issues: any[]): Promise<number> {
  // Sample 5 random articles to verify AI detection accuracy
  const sampleSize = Math.min(5, issues.length);
  if (sampleSize === 0) return 100;

  const sampleIssues = issues
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  let correctDetections = 0;

  for (const issue of sampleIssues) {
    if (!issue.article_id) continue;

    // Fetch article to verify issue
    const { data: article } = await supabaseClient
      .from('articles')
      .select('title, content, canonical_url, meta_title, meta_description, seo_keywords')
      .eq('id', issue.article_id)
      .single();

    if (!article) continue;

    // Verify detection was correct
    let isCorrect = false;
    switch (issue.issue_type) {
      case 'missing_canonical':
        isCorrect = !article.canonical_url;
        break;
      case 'missing_meta_title':
        isCorrect = !article.meta_title;
        break;
      case 'missing_meta_description':
        isCorrect = !article.meta_description;
        break;
      case 'short_content':
        const contentLength = article.content.replace(/<[^>]*>/g, '').length;
        isCorrect = contentLength < 500;
        break;
      case 'missing_seo_keywords':
        isCorrect = !article.seo_keywords || article.seo_keywords.length === 0;
        break;
      default:
        isCorrect = true; // Assume other detections are correct
    }

    if (isCorrect) correctDetections++;
  }

  return Math.round((correctDetections / sampleSize) * 100);
}

async function sendAuditReportEmail(supabaseClient: any, metrics: AuditMetrics, duration: number) {
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping email report');
      return;
    }

    // Determine status emoji
    const statusEmoji = metrics.criticalIssues === 0 ? '✅' : metrics.criticalIssues < 5 ? '⚠️' : '🚨';

    const emailBody = `
      <h2>${statusEmoji} SEO Audit Report</h2>
      <p><strong>Audit completed at:</strong> ${new Date().toISOString()}</p>
      <p><strong>Duration:</strong> ${duration} seconds</p>
      
      <h3>📊 Overall Statistics</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Articles Scanned</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${metrics.totalArticles}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Issues Found</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${metrics.issuesFound}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Critical Issues</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: ${metrics.criticalIssues > 0 ? 'red' : 'green'};">
            ${metrics.criticalIssues}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Warning Issues</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${metrics.warningIssues}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Info Issues</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${metrics.infoIssues}</td>
        </tr>
      </table>

      <h3>🤖 AI Performance Metrics</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Issues Auto-Fixed</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: green;">${metrics.autoFixed}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Remaining Issues</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${metrics.issuesFound - metrics.autoFixed}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>AI Detection Accuracy</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: ${metrics.aiDetectionAccuracy >= 90 ? 'green' : 'orange'};">
            ${metrics.aiDetectionAccuracy}%
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Auto-Fix Success Rate</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: ${metrics.autoFixSuccessRate >= 95 ? 'green' : 'orange'};">
            ${metrics.autoFixSuccessRate}%
          </td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Reindex Success Rate</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: ${metrics.reindexSuccessRate >= 90 ? 'green' : 'orange'};">
            ${metrics.reindexSuccessRate}%
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Average Fix Time</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${metrics.averageFixTime}s</td>
        </tr>
      </table>

      <h3>✅ Quality Gates</h3>
      <ul>
        <li>AI Detection Accuracy ≥ 90%: ${metrics.aiDetectionAccuracy >= 90 ? '✅ PASS' : '❌ FAIL'}</li>
        <li>Auto-Fix Success Rate ≥ 95%: ${metrics.autoFixSuccessRate >= 95 ? '✅ PASS' : '❌ FAIL'}</li>
        <li>Reindex Success ≥ 90%: ${metrics.reindexSuccessRate >= 90 ? '✅ PASS' : '❌ FAIL'}</li>
        <li>No Critical Issues: ${metrics.criticalIssues === 0 ? '✅ PASS' : '❌ FAIL'}</li>
      </ul>

      <p><em>View full details in your admin dashboard → SEO Health tab</em></p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        This is an automated report from your SEO monitoring system.
      </p>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SEO Audit <noreply@thebulletinbriefs.in>",
        to: ["admin@thebulletinbriefs.in"],
        subject: `${statusEmoji} SEO Audit Complete: ${metrics.issuesFound} issues (${metrics.autoFixed} auto-fixed)`,
        html: emailBody,
      }),
    });

    console.log('Audit report email sent successfully');
  } catch (error) {
    console.error('Failed to send audit report:', error);
  }
}
