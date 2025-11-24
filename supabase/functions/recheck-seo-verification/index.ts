import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

    console.log('Starting daily SEO verification recheck...');

    // Find URLs that need rechecking (not indexed after 24+ hours, retry count < 3)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: failedVerifications, error: fetchError } = await supabaseClient
      .from('seo_autofix_verification')
      .select('*')
      .eq('gsc_status', 'not_indexed')
      .lt('retry_count', 3)
      .lte('rechecked_at', oneDayAgo)
      .order('rechecked_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!failedVerifications || failedVerifications.length === 0) {
      console.log('No failed verifications to recheck.');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No failed verifications to recheck',
        rechecked: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Rechecking ${failedVerifications.length} failed verifications...`);

    // Trigger GSC inspection for these URLs
    const gscResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/inspect-gsc-url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ triggerBatch: true })
      }
    );

    const gscResult = await gscResponse.json();

    // Check for URLs that have failed 3 times
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: criticalFailures, error: criticalError } = await supabaseClient
      .from('seo_autofix_verification')
      .select('*, articles(title)')
      .eq('gsc_status', 'not_indexed')
      .gte('retry_count', 3)
      .lte('fix_applied_at', threeDaysAgo);

    if (!criticalError && criticalFailures && criticalFailures.length > 0) {
      // Send alert email for critical failures
      await sendCriticalFailureAlert(supabaseClient, criticalFailures);
    }

    // Send daily digest
    await sendDailyDigest(supabaseClient);

    return new Response(JSON.stringify({
      success: true,
      rechecked: failedVerifications.length,
      gsc_inspected: gscResult.inspected || 0,
      critical_failures: criticalFailures?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Recheck error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to recheck verifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendCriticalFailureAlert(supabaseClient: any, failures: any[]) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping alert email');
    return;
  }

  const emailBody = `
    <h2>🚨 Critical SEO Verification Failures</h2>
    <p>The following URLs have failed verification 3+ times and remain unindexed:</p>
    
    <table style="border-collapse: collapse; width: 100%;">
      <tr style="background: #f5f5f5;">
        <th style="padding: 10px; border: 1px solid #ddd;">URL</th>
        <th style="padding: 10px; border: 1px solid #ddd;">Issue Type</th>
        <th style="padding: 10px; border: 1px solid #ddd;">Fix Applied</th>
        <th style="padding: 10px; border: 1px solid #ddd;">Last Error</th>
      </tr>
      ${failures.map(f => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${f.url}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${f.issue_type}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${new Date(f.fix_applied_at).toLocaleDateString()}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${f.last_error || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
    
    <p><strong>Action Required:</strong> Please manually review these URLs and take corrective action.</p>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SEO Monitor <noreply@thebulletinbriefs.in>",
        to: ["admin@thebulletinbriefs.in"],
        subject: `🚨 Critical: ${failures.length} SEO verification failures`,
        html: emailBody,
      }),
    });
    console.log('Critical failure alert sent successfully');
  } catch (error) {
    console.error('Failed to send critical failure alert:', error);
  }
}

async function sendDailyDigest(supabaseClient: any) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) return;

  // Get statistics for last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: stats } = await supabaseClient
    .from('seo_autofix_verification')
    .select('internal_status, gsc_status')
    .gte('fix_applied_at', oneDayAgo);

  if (!stats || stats.length === 0) return;

  const internalPassed = stats.filter((s: any) => s.internal_status === 'passed').length;
  const internalFailed = stats.filter((s: any) => s.internal_status === 'failed').length;
  const gscIndexed = stats.filter((s: any) => s.gsc_status === 'indexed').length;
  const gscNotIndexed = stats.filter((s: any) => s.gsc_status === 'not_indexed').length;

  const emailBody = `
    <h2>📊 Daily SEO Verification Digest</h2>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h3>Internal Verification (Last 24 Hours)</h3>
    <ul>
      <li>✅ Passed: ${internalPassed}</li>
      <li>❌ Failed: ${internalFailed}</li>
    </ul>
    
    <h3>Google Search Console Status</h3>
    <ul>
      <li>🟢 Indexed: ${gscIndexed}</li>
      <li>🔴 Not Indexed: ${gscNotIndexed}</li>
    </ul>
    
    <p><em>View full details in your admin dashboard.</em></p>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SEO Monitor <noreply@thebulletinbriefs.in>",
        to: ["admin@thebulletinbriefs.in"],
        subject: `Daily SEO Verification Report - ${new Date().toLocaleDateString()}`,
        html: emailBody,
      }),
    });
  } catch (error) {
    console.error('Failed to send daily digest:', error);
  }
}
