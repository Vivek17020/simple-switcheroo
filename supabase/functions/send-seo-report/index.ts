import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    console.log('Generating SEO weekly report...');

    // Get issues from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentIssues, error: issuesError } = await supabaseClient
      .from('seo_health_log')
      .select('*')
      .gte('detected_at', sevenDaysAgo.toISOString())
      .order('detected_at', { ascending: false });

    if (issuesError) throw issuesError;

    // Calculate statistics
    const totalIssues = recentIssues?.length || 0;
    const criticalIssues = recentIssues?.filter(i => i.severity === 'critical').length || 0;
    const warningIssues = recentIssues?.filter(i => i.severity === 'warning').length || 0;
    const autoFixed = recentIssues?.filter(i => i.auto_fix_attempted && i.resolution_status === 'auto-fixed').length || 0;
    const openIssues = recentIssues?.filter(i => i.status === 'open').length || 0;

    // Group issues by type
    const issuesByType: { [key: string]: number } = {};
    recentIssues?.forEach(issue => {
      issuesByType[issue.issue_type] = (issuesByType[issue.issue_type] || 0) + 1;
    });

    // Get admin email
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'admin')
      .single();

    if (!adminProfile?.email) {
      console.log('No admin email found, skipping report');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'No admin email configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build email HTML
    const issueTypeRows = Object.entries(issuesByType)
      .map(([type, count]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${type.replace(/_/g, ' ').toUpperCase()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${count}</td>
        </tr>
      `).join('');

    const topIssuesRows = recentIssues?.slice(0, 10).map(issue => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          <a href="${issue.url}" style="color: #2563eb; text-decoration: none;">${issue.url}</a>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background-color: ${
            issue.severity === 'critical' ? '#fee2e2' : 
            issue.severity === 'warning' ? '#fef3c7' : '#dbeafe'
          }; color: ${
            issue.severity === 'critical' ? '#991b1b' : 
            issue.severity === 'warning' ? '#92400e' : '#1e40af'
          };">
            ${issue.severity.toUpperCase()}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">
          ${issue.issue_type.replace(/_/g, ' ')}
        </td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="padding: 16px; text-align: center; color: #6b7280;">No issues detected</td></tr>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly SEO Health Report</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📊 Weekly SEO Health Report</h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px;">TheBulletinBriefs</p>
            </div>

            <!-- Summary Cards -->
            <div style="padding: 24px; background-color: #f9fafb;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total Issues</div>
                  <div style="font-size: 32px; font-weight: 700; color: #1f2937; margin-top: 4px;">${totalIssues}</div>
                </div>
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Critical</div>
                  <div style="font-size: 32px; font-weight: 700; color: #1f2937; margin-top: 4px;">${criticalIssues}</div>
                </div>
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Auto-Fixed</div>
                  <div style="font-size: 32px; font-weight: 700; color: #1f2937; margin-top: 4px;">${autoFixed}</div>
                </div>
                <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Open Issues</div>
                  <div style="font-size: 32px; font-weight: 700; color: #1f2937; margin-top: 4px;">${openIssues}</div>
                </div>
              </div>
            </div>

            <!-- Issues by Type -->
            <div style="padding: 24px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #1f2937;">Issues by Type</h2>
              <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase;">Issue Type</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase;">Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${issueTypeRows}
                </tbody>
              </table>
            </div>

            <!-- Top Issues -->
            <div style="padding: 24px; background-color: #f9fafb;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #1f2937;">Recent Issues</h2>
              <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase;">URL</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase;">Severity</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase;">Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${topIssuesRows}
                </tbody>
              </table>
            </div>

            <!-- Recommendations -->
            <div style="padding: 24px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #1f2937;">📌 Recommendations</h2>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                ${criticalIssues > 0 ? '<li style="margin-bottom: 8px;">⚠️ <strong>Address critical issues immediately</strong> - they impact indexing</li>' : ''}
                ${warningIssues > 5 ? '<li style="margin-bottom: 8px;">⚠️ Review warning-level issues to optimize SEO performance</li>' : ''}
                ${openIssues > 10 ? '<li style="margin-bottom: 8px;">📋 Consider a bulk fix session for open issues</li>' : ''}
                <li style="margin-bottom: 8px;">✅ ${autoFixed} issues were auto-fixed this week</li>
                <li style="margin-bottom: 8px;">🔍 Run manual checks for pages with stale content</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="padding: 24px; background-color: #1f2937; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Generated automatically by TheBulletinBriefs SEO Monitor
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                <a href="https://www.thebulletinbriefs.in/admin/dashboard" style="color: #60a5fa; text-decoration: none;">View SEO Dashboard →</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "TheBulletinBriefs <noreply@thebulletinbriefs.in>",
      to: [adminProfile.email],
      subject: `📊 Weekly SEO Report - ${totalIssues} Issues (${criticalIssues} Critical)`,
      html: emailHtml,
    });

    console.log('SEO report sent:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      auto_fixed: autoFixed,
      email_sent: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending SEO report:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send SEO report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});