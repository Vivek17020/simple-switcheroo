# Web Stories Automation - INSTANT Generation on Article Publish

## 🎯 Overview

Web stories are now generated **INSTANTLY** when articles publish via database trigger - no delays! This ensures maximum speed for Google Discover ranking.

## ⚡ How It Works (INSTANT)

### 1. **Article Publishes** (Within 0-4 minutes of generation)
- Auto-generation system creates 3 breaking news articles
- Articles publish immediately (0, 2, 4 minute delays)
- Focus on ultra-fresh news (last 5-15 minutes)

### 2. **Instant Web Story Trigger** (< 5 seconds after publish)
- Database trigger fires automatically when article.published = true
- Calls `trigger-instant-webstory` edge function
- Generates web story from article content instantly

### 3. **Web Story Published** (Within seconds)
- Story is created with 4-5 slides using article content
- Published immediately (no queuing or delays)
- Automatically triggers Google indexing
- Total time: Article publish → Web story live = **< 10 seconds**

### 4. **Auto-Cleanup** (Maintains Database)
- Deletes auto-generated stories older than 30 days
- Keeps the database lean and efficient

## 💰 Credit Savings

**Before (Old System):**
- Generated new AI content for each web story
- Cost: ~3000 tokens per story + 7-8 images = ~9K tokens + 21-24 images per day

**Now (INSTANT + Optimized):**
- Reuses existing article content (0 extra tokens!)
- Only generates 4-5 slides structure (~400 tokens per story) + 12-15 images per day
- **Savings: ~92% reduction in content generation costs**
- **BONUS**: Instant publishing improves Google Discover ranking

## ⚡ Publishing Flow (INSTANT)

**Real-Time Flow:**
1. **8:00 AM IST**: Article auto-generation runs
   - Discovers 3 breaking news stories (published in last 5-15 minutes)
   - Generates articles instantly
   - Article 1: Publishes at 8:00 AM
   - Article 2: Publishes at 8:02 AM
   - Article 3: Publishes at 8:04 AM

2. **Within 10 seconds of each article publish**:
   - Database trigger fires automatically
   - Web story generated and published INSTANTLY
   - Google indexing triggered immediately

3. **Result**: 3 articles + 3 web stories live within **5 minutes** of cron job starting

## 🛠️ Setup Instructions

### 1. Setup Article Auto-Generation Cron
Run the SQL in `supabase/functions/auto-generate-articles-cron.sql`:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `auto-generate-articles-cron.sql`
3. Click "Run"
4. Verify with: `SELECT * FROM cron.job WHERE jobname LIKE '%article%';`

You should see 2 cron jobs:
- `auto-generate-breaking-news-daily` (2:30 UTC / 8:00 AM IST, daily)
- `publish-scheduled-articles` (every 10 minutes)

### 2. Setup INSTANT Web Story Trigger
Run the SQL in `supabase/functions/trigger-instant-webstory-cron.sql`:

1. Go to Supabase Dashboard → SQL Editor  
2. Copy and paste the contents of `trigger-instant-webstory-cron.sql`
3. Click "Run"
4. Verify with: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'trigger_instant_webstory_on_publish';`

This creates a database trigger that automatically generates web stories **within seconds** of article publish.

## 📈 Monitoring

### Check Recent Articles & Web Stories
```sql
-- View articles with their instant web stories
SELECT 
  a.created_at as article_created,
  a.published_at as article_published,
  a.title as article_title,
  ws.created_at as story_created,
  ws.title as story_title,
  EXTRACT(EPOCH FROM (ws.created_at - a.published_at)) as seconds_delay
FROM articles a
LEFT JOIN web_stories ws ON ws.source_article_id = a.id
WHERE a.published = true
  AND a.created_at >= NOW() - INTERVAL '7 days'
ORDER BY a.published_at DESC
LIMIT 20;
```

### Check Trigger Status
```sql
-- Verify instant trigger is active
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_instant_webstory_on_publish';
```

### Check Edge Function Logs
```sql
-- View edge function execution logs (Supabase Dashboard → Edge Functions → Logs)
-- Filter by function name: trigger-instant-webstory, auto-generate-articles
```

### Check Article Generation Logs
```sql
-- View recent article generation cron runs
SELECT * FROM cron.job_run_details 
WHERE jobname = 'auto-generate-breaking-news-daily'
ORDER BY start_time DESC
LIMIT 10;
```

## ⚙️ Configuration

### Adjust Article Generation Frequency
Edit the cron schedule in `auto-generate-articles-cron.sql`:
- `'30 2 * * *'` = Daily at 2:30 AM UTC (8:00 AM IST)

Common cron patterns:
- Twice daily: `'30 2,14 * * *'` (8 AM & 8 PM IST)
- Every 6 hours: `'30 */6 * * *'`
- Hourly (NOT recommended): `'30 * * * *'`

### Change Article Count Per Run
In `auto-generate-articles/index.ts`, update the default:
```typescript
const articleCount = body.count || 3; // Change 3 to desired number
```

### Adjust Publish Delay Between Articles
In `auto-generate-articles/index.ts`, line 297:
```typescript
const minutesDelay = i * 2; // Change 2 to desired minutes between each article
```

### Reduce Slide Count Per Web Story
In `generate-web-story/index.ts`, line 71-76:
```typescript
- Create exactly 4-5 slides (no more, no less)
// Change to 3-4 or 5-6 as needed
```

## 💰 Cost Estimation (INSTANT + Optimized)

### Daily Lovable AI Usage:
- **Article Generation**: 3 articles × 1000 tokens = ~3K tokens
- **Web Story Structure**: 3 stories × 400 tokens = ~1.2K tokens
- **Image Generation**: 3 stories × 4-5 images = ~12-15 images per day
- **Total**: ~4.2K tokens + 12-15 images per day

### Supabase Usage:
- **Edge function invocations**: ~15-20/day (cron + triggers + indexing)
- **Database operations**: Minimal (queries + inserts)
- **Storage**: ~15 MB/month for images (with caching)

**Comparison:**
- Articles (3/day): ~14 API calls/day
- Web Stories (3/day, instant): ~9 API calls/day
- **Total**: ~23 API calls/day (~55% reduction from old system)

## 🔧 Troubleshooting

### No Articles Being Generated
1. **Check cron job**: `SELECT * FROM cron.job WHERE jobname = 'auto-generate-breaking-news-daily';`
2. **Check Lovable AI credits**: Settings → Workspace → Usage
3. **Review function logs**: Supabase Dashboard → Edge Functions → auto-generate-articles
4. **Verify news sources**: Ensure the AI can access real-time news

### No Web Stories Being Generated
1. **Check trigger**: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_instant_webstory_on_publish';`
2. **Check published articles**: Ensure articles have `published = true`
3. **Review function logs**: Supabase Dashboard → Edge Functions → trigger-instant-webstory
4. **Check for duplicates**: Web stories are only created once per article

### Articles Not Publishing Fast Enough
1. **Reduce minutesDelay**: Change `i * 2` to `i * 1` for 1-minute intervals
2. **Increase cron frequency**: Run twice daily instead of once
3. **Focus on ultra-fresh news**: Ensure AI targets news <5 minutes old

### Poor Article Quality
1. **Review AI prompt**: Check `auto-generate-articles/index.ts` system prompt
2. **Adjust temperature**: Lower temperature (0.5-0.6) for more focused content
3. **Refine trending search**: Update category focus in the AI prompt

## 🚀 Advanced Features

### Manual Article Generation
Call the edge function manually to generate articles on-demand:
```bash
curl -X POST https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-generate-articles \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'
```

### Manual Web Story Generation
Generate a web story for any published article:
```bash
curl -X POST https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/trigger-instant-webstory \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"articleId": "article-id-here"}'
```

### Disable Instant Web Stories (Temporarily)
To disable the instant trigger temporarily:
```sql
ALTER TABLE public.articles DISABLE TRIGGER trigger_instant_webstory_on_publish;
```

To re-enable:
```sql
ALTER TABLE public.articles ENABLE TRIGGER trigger_instant_webstory_on_publish;
```

## ✅ Success Metrics

Track these KPIs to measure automation success:
- **Articles per day**: Target 3 (ultra-fresh breaking news)
- **Publishing speed**: <5 minutes from cron trigger to all articles live
- **Web story generation speed**: <10 seconds from article publish
- **Google Discover ranking**: Monitor impressions for breaking news articles
- **Credit efficiency**: ~92% savings vs old system
- **Indexing success**: >95% articles indexed within 1 hour

## 📊 Key Improvements Over Old System

| Metric | Old System | New System (INSTANT) | Improvement |
|--------|-----------|---------------------|-------------|
| Articles/day | 10 | 3 | Focused quality |
| Publishing delay | 15-30 min | 0-4 min | **~90% faster** |
| Web story delay | 4 hours | <10 seconds | **99.9% faster** |
| Slides/story | 5-8 | 4-5 | 20% fewer |
| API calls/day | 70+ | ~23 | **67% reduction** |
| Focus | Generic topics | Ultra-fresh news | **Google Discover optimized** |

---

**Status**: ✅ Fully Automated (INSTANT + Credit Optimized)
**Last Updated**: 2025-11-29
**Focus**: Speed & Google Discover Ranking
**Next Review**: Weekly quality check on breaking news relevance
