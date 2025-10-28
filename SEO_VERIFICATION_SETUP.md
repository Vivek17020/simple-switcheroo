# SEO Auto-Fix Verification System

## Overview
This system automatically verifies that SEO fixes are successfully applied and validates them against Google Search Console data to ensure pages are properly indexed.

## Architecture

### Database Tables

1. **`seo_autofix_verification`** - Tracks all auto-fix attempts and their verification status
   - `url` - The page URL that was fixed
   - `issue_type` - Type of SEO issue (soft_404, missing_canonical, etc.)
   - `fix_action` - Description of the fix applied
   - `fix_applied_at` - When the fix was applied
   - `internal_status` - Internal verification result (pending/passed/failed)
   - `gsc_status` - Google Search Console verification status (pending/indexed/not_indexed)
   - `retry_count` - Number of verification attempts
   - `last_error` - Last error encountered during verification

2. **`gsc_config`** - Google Search Console API configuration
   - OAuth credentials for GSC API access
   - Access token and refresh token management
   - Site URL configuration

### Edge Functions

1. **`verify-seo-fixes`** - Internal verification of fixes
   - Runs 15 minutes after auto-fixes are applied
   - Performs HTTP checks to verify fixes are live
   - Updates internal_status in verification table

2. **`inspect-gsc-url`** - Google Search Console integration
   - Uses GSC URL Inspection API to verify indexing status
   - Manages OAuth token refresh
   - Triggers reindexing requests for unindexed pages
   - Updates gsc_status in verification table

3. **`recheck-seo-verification`** - Daily recheck job
   - Re-verifies URLs that failed GSC verification
   - Sends alerts for critical failures (3+ retries)
   - Sends daily digest emails

4. **`scan-seo-health`** (updated) - Main SEO scanner
   - Detects and fixes SEO issues
   - Logs all auto-fixes to verification table
   - Schedules verification checks

## Setup Instructions

### 1. Database Setup
The tables are automatically created via migration. No manual setup required.

### 2. Google Search Console API Setup

#### Prerequisites
- Verified Google Search Console property for your domain
- Google Cloud Project with Search Console API enabled

#### Steps to Configure:

1. **Create OAuth Credentials**
   ```
   - Go to Google Cloud Console
   - Enable "Google Search Console API" and "Indexing API"
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: https://developers.google.com/oauthplayground
   - Copy Client ID and Client Secret
   ```

2. **Get Refresh Token**
   ```
   - Visit https://developers.google.com/oauthplayground
   - Click settings (gear icon) → Use your own OAuth credentials
   - Enter your Client ID and Client Secret
   - In "Step 1", select:
     - Google Search Console API v1
     - https://www.googleapis.com/auth/webmasters.readonly
     - https://www.googleapis.com/auth/indexing
   - Click "Authorize APIs"
   - Complete OAuth flow
   - In "Step 2", click "Exchange authorization code for tokens"
   - Copy the Refresh Token
   ```

3. **Add Configuration to Database**
   ```sql
   INSERT INTO public.gsc_config (
     site_url,
     client_id,
     client_secret,
     refresh_token,
     is_active
   ) VALUES (
     'https://www.thebulletinbriefs.in',
     'YOUR_CLIENT_ID',
     'YOUR_CLIENT_SECRET',
     'YOUR_REFRESH_TOKEN',
     true
   );
   ```

### 3. Schedule Cron Jobs

Run this SQL to schedule the daily recheck job:

```sql
-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily recheck at 3 AM UTC
SELECT cron.schedule(
  'daily-seo-verification-recheck',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/recheck-seo-verification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

## How It Works

### Verification Workflow

1. **SEO Scan & Auto-Fix**
   - `scan-seo-health` runs daily (2 AM UTC)
   - Detects issues and applies auto-fixes
   - Logs each fix to `seo_autofix_verification` table with status = 'pending'

2. **Internal Verification (15 minutes later)**
   - `verify-seo-fixes` runs automatically
   - Fetches all pending verifications from last 15 minutes
   - Performs HTTP checks based on issue type:
     - **Soft 404**: Checks content length > 500 bytes
     - **Canonical**: Verifies canonical tag points to self
     - **Redirect**: Ensures no redirect chain
     - **Noindex**: Confirms noindex tag removed
   - Updates `internal_status` to 'passed' or 'failed'

3. **GSC Verification**
   - `inspect-gsc-url` runs after internal verification passes
   - Uses Google Search Console API to inspect URLs
   - Checks indexing status and canonical validation
   - Updates `gsc_status` to 'indexed' or 'not_indexed'
   - Triggers reindexing request if not indexed

4. **Daily Recheck (3 AM UTC)**
   - `recheck-seo-verification` runs daily
   - Re-inspects URLs with `gsc_status = 'not_indexed'`
   - Retries up to 3 times
   - Sends alert email for critical failures (3+ retries)
   - Sends daily digest to admin

## Admin Dashboard

### SEO Verification Tab
Access via: Admin Dashboard → SEO Verification tab

**Features:**
- Real-time statistics dashboard
- Verification table with all fixes
- Color-coded status indicators
- Manual recheck button per URL
- Force reindex button for failed URLs
- Exportable data

**Status Indicators:**
- 🟢 Green: Passed/Indexed
- 🔴 Red: Failed/Not Indexed
- 🟡 Yellow: Pending
- Failed rows highlighted in red background

## Email Notifications

### Critical Failure Alert
Sent when URLs fail 3+ verification attempts and remain unindexed for 3+ days.

**Contains:**
- List of failed URLs
- Issue types
- Last errors
- Action required notice

### Daily Digest
Sent daily at 3 AM UTC after recheck job.

**Contains:**
- Total fixes in last 24 hours
- Internal verification pass/fail counts
- GSC indexing statistics
- Summary of pending items

## Verification Rules

### Internal Verification Checks

| Issue Type | Verification Logic |
|------------|-------------------|
| soft_404 | HTTP 200 + content > 500 bytes |
| short_content | HTTP 200 + content > 500 bytes |
| missing_canonical | Canonical tag exists and points to self |
| duplicate_canonical | Canonical tag points to self (not external) |
| page_with_redirect | HTTP 200-299 (no redirect) |
| not_indexed_intentionally | No noindex meta tag present |

### GSC Verification

- Uses URL Inspection API to check indexing status
- Validates canonical URLs match
- Confirms coverage state = "Submitted and indexed"
- Triggers reindexing for unindexed pages

## Troubleshooting

### Common Issues

1. **GSC API Not Configured**
   - System continues with internal verification only
   - Set up GSC OAuth credentials (see Setup Instructions)

2. **Access Token Expired**
   - System automatically refreshes using refresh token
   - Check `gsc_config.token_expires_at` if issues persist

3. **Verification Stuck in Pending**
   - Wait 15 minutes for initial verification
   - Check edge function logs for errors
   - Manually trigger recheck from dashboard

4. **URLs Not Getting Indexed**
   - Verify GSC API credentials are correct
   - Check if URL is in sitemap.xml
   - Review GSC coverage report manually
   - Check for robots.txt blocks

5. **Email Notifications Not Sent**
   - Verify RESEND_API_KEY is configured
   - Check edge function logs
   - Confirm email address in code matches admin email

## Monitoring & Maintenance

### Regular Checks
- Review dashboard daily for critical failures
- Monitor retry counts (3+ indicates persistent issues)
- Check email alerts for critical failures
- Verify GSC token hasn't expired

### Performance Optimization
- Verification batch size: 20 URLs per run
- Rate limiting: 1 second between GSC API calls
- Retry limit: 3 attempts before alerting
- Cron frequency: Daily (can adjust if needed)

## API Endpoints

### Manual Triggers

1. **Verify Specific Record**
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/verify-seo-fixes \
     -H "Authorization: Bearer [key]" \
     -d '{"recordId": "uuid"}'
   ```

2. **Inspect Specific URL**
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/inspect-gsc-url \
     -H "Authorization: Bearer [key]" \
     -d '{"url": "https://example.com/page"}'
   ```

3. **Trigger Batch Verification**
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/verify-seo-fixes \
     -H "Authorization: Bearer [key]" \
     -d '{}'
   ```

## Integration with Existing Systems

### Sitemap Regeneration
- Automatically triggered after successful fixes
- Updates sitemap.xml with corrected URLs
- Pings Google for sitemap refresh

### Analytics Integration
- Verification data available in `seo_autofix_verification` table
- Join with `articles` table for article-level insights
- Track fix effectiveness over time

### Security
- All edge functions require service role key
- GSC credentials stored encrypted in database
- RLS policies restrict access to admins only

## Future Enhancements

- [ ] Performance comparison (before vs after fix)
- [ ] A/B testing for fix strategies
- [ ] Predictive issue detection using ML
- [ ] Slack/Discord webhook notifications
- [ ] Custom verification rules per issue type
- [ ] Bulk fix operations from dashboard
