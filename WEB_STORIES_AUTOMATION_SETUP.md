# Web Stories Automation - Article Content Reuse

## 🎯 Overview

Your web stories system generates **3 stories per day** by reusing existing article content - **saving AI credits** and ensuring consistency. Stories are auto-generated from the most recent published articles in 3 key categories.

## 📂 Target Categories

**Only 3 categories, 1 story each per day:**
1. **Entertainment** - OTT releases, celebrity trends, entertainment news
2. **Technology** - New phones, AI tools, app updates, tech news  
3. **Government Jobs** - Exam notifications, job alerts, result updates

## 🔄 How It Works

### 1. **Find Recent Articles** (Once Daily at 10 AM IST)
- Fetches the most recent published articles from the 3 target categories
- Checks for existing web stories to avoid duplicates
- Selects one article per category (3 total)

### 2. **Generate Web Stories from Article Content** (Credit Efficient!)
- **Reuses the article's existing content** - no new AI generation needed
- Transforms article into 6-7 visual slides with images
- Images are generated once and cached for reuse
- Auto-approves and schedules for publishing

### 3. **Auto-Publish Stories** (Every 30 Minutes)
- Stories publish throughout the day (0, 8, 16 hours apart)
- Automatically triggers Google indexing
- Removes from queue after publishing

### 4. **Auto-Cleanup** (Maintains Database)
- Deletes auto-generated stories older than 30 days
- Keeps the database lean and efficient

## 💰 Credit Savings

**Before (Old System):**
- Generated new AI content for each web story
- Cost: ~3000 tokens per story + 7 images = ~9K tokens + 21 images per day

**Now (Optimized):**
- Reuses existing article content (0 extra tokens!)
- Only generates 6-7 slides structure (~500 tokens per story) + 21 images per day
- **Savings: ~90% reduction in content generation costs**

## 🗓️ Publishing Schedule

**Daily Timeline:**
- **10:00 AM IST**: Cron job runs
  - Fetches 3 recent articles (Entertainment, Tech, Jobs)
  - Generates 3 web stories from article content
  - Story 1: Published immediately
  - Story 2: Scheduled for 6:00 PM
  - Story 3: Scheduled for 2:00 AM next day

**Result**: 3 web stories per day, evenly distributed

## 🛠️ Setup Instructions

### Update Cron Jobs
The cron job runs **once daily at 10:00 AM IST** to generate 3 web stories from articles.

Run the SQL in `supabase/functions/auto-generate-webstories-cron.sql`:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `auto-generate-webstories-cron.sql`
3. Click "Run"
4. Verify with: `SELECT * FROM cron.job WHERE jobname LIKE '%webstories%';`

You should see 2 cron jobs:
- `auto-generate-webstories-from-articles` (4:30 UTC / 10:00 AM IST, daily)
- `invoke-auto-publish-web-story` (every 30 minutes)

## 📈 Monitoring

### Check Web Story Generation
```sql
-- View recent web stories generated from articles
SELECT 
  ws.created_at,
  ws.title,
  ws.category,
  ws.auto_generated,
  ws.source_article_id,
  a.title as source_article_title
FROM web_stories ws
LEFT JOIN articles a ON a.id = ws.source_article_id
WHERE ws.auto_generated = true
ORDER BY ws.created_at DESC
LIMIT 20;
```

### Check Queue Status
```sql
-- View pending publications
SELECT 
  ws.title,
  wq.scheduled_at,
  wq.priority,
  wq.review_status
FROM web_stories_queue wq
JOIN web_stories ws ON ws.id = wq.story_id
WHERE wq.review_status = 'approved'
ORDER BY wq.scheduled_at;
```

### Check Cron Job History
```sql
-- View cron job execution history
SELECT * FROM cron.job_run_details 
WHERE jobname LIKE '%webstories%'
ORDER BY start_time DESC
LIMIT 20;
```

## ⚙️ Configuration

### Adjust Generation Schedule
Edit the cron schedule in `auto-generate-webstories-cron.sql`:
- `'30 4 * * *'` = Daily at 4:30 AM UTC (10:00 AM IST)

Common cron patterns:
- Twice daily: Add a second `cron.schedule` call
- Every 12 hours: `'0 */12 * * *'`
- Once weekly: `'0 0 * * 0'` (Sundays at midnight)

### Change Target Categories
In `auto-generate-trending-webstories/index.ts`, line 50:
```typescript
.in('categories.slug', ['entertainment', 'technology', 'government-jobs'])
// Modify this array to change which categories are used
```

### Adjust Story Count Per Day
Currently set to 3 stories (1 per category). To change:
1. Modify the category array above (more/fewer categories)
2. Adjust the `categoryMap.size` check on line 82

### Reduce Slide Count
In `generate-web-story/index.ts`, line 71-76:
```typescript
- Create exactly 6-7 slides (no more, no less)
// Change to 4-5 or 8-10 as needed
```

## 🎨 Content Categories

Stories are automatically generated from these article categories:
- **Entertainment**: OTT releases, celebrity news, entertainment trends
- **Technology**: New phones, AI tools, app updates, tech launches
- **Government Jobs**: Exam notifications, job alerts, admit cards, results

## 💰 Cost Estimation (Optimized)

### Lovable AI Usage (per day):
- **Article content reuse**: 0 tokens (uses existing articles!)
- **Story structure generation**: 3 stories × 500 tokens = ~1.5K tokens
- **Image generation**: 3 stories × 7 images = ~21 images per day
- **Total**: ~1.5K tokens + 21 images per day

**Savings vs old system**: ~90% reduction in token usage!

### Supabase Usage:
- **Edge function invocations**: ~50/day (cron + indexing + generation)
- **Database operations**: Minimal (queries + inserts)
- **Storage**: ~20 MB/month for images (with caching)

## 🔧 Troubleshooting

### No Stories Being Generated
1. **Check if articles exist**: Verify you have recent published articles in Entertainment, Tech, and Jobs categories
2. Check Lovable AI credits: Settings → Workspace → Usage
3. Verify cron jobs are running: `SELECT * FROM cron.job_run_details`
4. Check function logs in Supabase Dashboard

### Stories Not Publishing
1. Verify `auto-publish-web-story` cron is active
2. Check queue status: `SELECT * FROM web_stories_queue`
3. Ensure stories have `review_status = 'approved'`

### Poor Story Quality
1. Ensure source articles have good content
2. Check image generation quality in `generate-web-story` function
3. Adjust slide count if needed (currently 6-7)

## 🚀 Advanced Features

### Manual Trigger
You can manually trigger web story generation:
1. Go to Admin → Web Stories
2. Click "Generate from Article" next to any article
3. Story will be created and scheduled

### Image Caching
The system caches generated images to save credits:
- Images with same prompts are reused
- Check cache stats: `SELECT COUNT(*) FROM web_story_image_cache`

## ✅ Success Metrics

Track these KPIs to measure automation success:
- **Stories generated per day**: Target 3 (1 per category)
- **Publishing consistency**: Stories published at scheduled times (0, 8, 16 hours apart)
- **Source article reuse**: 100% (no new content generation)
- **Indexing success**: >95% stories indexed within 24 hours
- **Storage efficiency**: Auto-cleanup maintaining <500 stories
- **Credit efficiency**: ~90% savings vs standalone generation

---

**Status**: ✅ Fully Automated (Credit Optimized)
**Last Updated**: 2025-11-29
**Next Review**: Weekly quality check on source articles and story output
