import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRecord {
  id: string;
  url: string;
  issue_type: string;
  fix_action: string;
  article_id?: string;
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

    console.log('Starting SEO fix verification process...');

    // Fetch recent fixes that need verification (within last 15 minutes, status = pending)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: pendingVerifications, error: fetchError } = await supabaseClient
      .from('seo_autofix_verification')
      .select('*')
      .eq('internal_status', 'pending')
      .gte('fix_applied_at', fifteenMinutesAgo)
      .order('fix_applied_at', { ascending: true });

    if (fetchError) throw fetchError;

    if (!pendingVerifications || pendingVerifications.length === 0) {
      console.log('No pending verifications found.');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending verifications',
        verified: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingVerifications.length} fixes to verify`);
    let passedCount = 0;
    let failedCount = 0;

    // Verify each URL
    for (const record of pendingVerifications) {
      const verificationResult = await verifyUrl(record);
      
      // Update verification record
      const { error: updateError } = await supabaseClient
        .from('seo_autofix_verification')
        .update({
          internal_status: verificationResult.status,
          recheck_notes: verificationResult.notes,
          rechecked_at: new Date().toISOString(),
          last_error: verificationResult.error
        })
        .eq('id', record.id);

      if (updateError) {
        console.error(`Failed to update verification record ${record.id}:`, updateError);
      }

      if (verificationResult.status === 'passed') {
        passedCount++;
      } else {
        failedCount++;
      }
    }

    // Trigger GSC verification for passed URLs
    if (passedCount > 0) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/inspect-gsc-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ triggerBatch: true })
        });
      } catch (gscError) {
        console.error('Failed to trigger GSC verification:', gscError);
      }
    }

    console.log(`Verification complete. Passed: ${passedCount}, Failed: ${failedCount}`);

    return new Response(JSON.stringify({
      success: true,
      verified: pendingVerifications.length,
      passed: passedCount,
      failed: failedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to verify SEO fixes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyUrl(record: VerificationRecord): Promise<{ 
  status: string; 
  notes: string; 
  error?: string 
}> {
  try {
    const response = await fetch(record.url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'TheBulletinBriefs-SEO-Verifier/1.0'
      }
    });

    // Verification logic based on issue type
    switch (record.issue_type) {
      case 'soft_404':
      case 'short_content':
        if (response.status === 200) {
          const html = await response.text();
          if (html.length > 500) {
            return {
              status: 'passed',
              notes: `Content length: ${html.length} bytes. Fix verified successfully.`
            };
          } else {
            return {
              status: 'failed',
              notes: `Content still too short: ${html.length} bytes.`,
              error: 'Content regeneration may have failed'
            };
          }
        } else {
          return {
            status: 'failed',
            notes: `HTTP status: ${response.status}`,
            error: `Expected 200, got ${response.status}`
          };
        }

      case 'missing_canonical':
      case 'duplicate_canonical':
        if (response.status === 200) {
          const html = await response.text();
          const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
          
          if (canonicalMatch) {
            const canonical = canonicalMatch[1];
            if (canonical === record.url || canonical === record.url + '/') {
              return {
                status: 'passed',
                notes: `Canonical tag correctly set to: ${canonical}`
              };
            } else {
              return {
                status: 'failed',
                notes: `Canonical points to: ${canonical}, expected: ${record.url}`,
                error: 'Canonical mismatch'
              };
            }
          } else {
            return {
              status: 'failed',
              notes: 'Canonical tag still missing',
              error: 'No canonical tag found in HTML'
            };
          }
        }
        break;

      case 'page_with_redirect':
        if (response.status >= 200 && response.status < 300) {
          return {
            status: 'passed',
            notes: `Redirect removed. Final status: ${response.status}`
          };
        } else if (response.status >= 300 && response.status < 400) {
          return {
            status: 'failed',
            notes: `Still redirecting: ${response.status}`,
            error: 'Redirect not removed'
          };
        }
        break;

      case 'not_indexed_intentionally':
        if (response.status === 200) {
          const html = await response.text();
          const hasNoindex = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["']/i);
          
          if (!hasNoindex) {
            return {
              status: 'passed',
              notes: 'Noindex tag removed successfully'
            };
          } else {
            return {
              status: 'failed',
              notes: 'Noindex tag still present',
              error: 'Meta robots noindex not removed'
            };
          }
        }
        break;

      default:
        // Generic verification for other types
        if (response.status === 200) {
          return {
            status: 'passed',
            notes: `Page accessible with HTTP 200`
          };
        }
    }

    return {
      status: 'failed',
      notes: `Verification incomplete for issue type: ${record.issue_type}`,
      error: 'Unknown verification result'
    };

  } catch (error) {
    console.error(`Failed to verify ${record.url}:`, error);
    return {
      status: 'failed',
      notes: 'Network error during verification',
      error: error instanceof Error ? error.message : 'Unknown network error'
    };
  }
}
