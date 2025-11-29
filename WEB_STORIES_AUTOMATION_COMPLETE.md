# Web Stories Automation - Complete Setup ✅

## Overview
Your web stories automation system is now **fully operational**! Stories are automatically generated from trending topics, scheduled for publishing, and distributed throughout the day.

---

## 🎯 How It Works

### 1. **Trending Topic Discovery**
- **AI-Powered Search**: Uses Lovable AI (Google Gemini 2.5 Flash) to search the web for trending topics
- **Focus Areas**: Indian news, Web3, blockchain, crypto, technology, government jobs, education
- **Relevance Filtering**: Only topics with 70+ relevance scores are processed
- **Duplicate Prevention**: Checks last 7 days to avoid duplicate stories

### 2. **Content Generation**
- **Detailed Articles**: AI writes 800-1000 word articles on trending topics
- **Visual Stories**: Converts articles into 5-8 slide web stories
- **Image Generation**: Creates vertical 9:16 images for each slide
- **SEO Optimization**: Generates titles, descriptions, keywords automatically

### 3. **Publishing Schedule**
- **Staggered Release**: Stories published 0, 4, and 8 hours apart
- **Queue System**: Stories added to `web_stories_queue` table for scheduled publishing
- **Auto-Approval**: Stories automatically approved with high confidence scores
- **Hourly Publishing**: `auto-publish-web-story` runs every hour to publish queued stories

### 4. **Content Lifecycle**
- **Auto-Cleanup**: Stories older than 30 days are automatically deleted
- **Status Tracking**: All auto-generated stories marked with metadata
- **Analytics**: View counts, completion rates, and time spent tracked

---

## 📅 Cron Schedule

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `auto-generate-trending-webstories` | Every 6 hours | Generates 3 trending stories |
| `auto-generate-trending-webstories-morning` | 3:30 AM UTC (9 AM IST) | Morning story generation |
| `auto-generate-trending-webstories-evening` | 12:30 PM UTC (6 PM IST) | Evening story generation |
| `auto-publish-webstories` | Every hour | Publishes queued stories |

**Expected Output**: ~6 new web stories per day

---

## 🗄️ Database Tables

### `web_stories`
Core table with automation columns:
- `auto_generated` (boolean) - Marks AI-generated stories
- `generation_source` ('article' | 'manual') - Source of generation
- `ai_confidence_score` (numeric) - AI confidence rating (0-1)
- `source_article_id` (uuid) - Links to source article if applicable

### `web_stories_queue`
Publishing queue with scheduling:
- `story_id` (uuid) - Reference to web story
- `scheduled_at` (timestamp) - When to publish
- `published_at` (timestamp) - When published
- `auto_publish` (boolean) - Enable auto-publishing
- `review_status` ('pending' | 'approved' | 'rejected')
- `priority` (integer) - Publishing priority

---

## 🔧 Edge Functions

### `auto-generate-trending-webstories`
- Searches web for trending topics
- Filters by relevance (70+)
- Generates detailed articles
- Creates web stories with images
- Schedules for staggered publishing
- Cleans up old stories

**Rate Limits**: May hit Lovable AI rate limits if called too frequently

### `generate-web-story`
- Converts articles/content to web stories
- Generates slide text and images
- Uploads images to Supabase Storage
- Creates story with SEO metadata
- Optional auto-publishing

### `auto-publish-web-story`
- Runs hourly to check queue
- Publishes stories at scheduled times
- Triggers Google indexing
- Updates queue status

---

## 🎨 Story Generation Flow

```
1. AI Web Search → Trending Topics (5 found)
2. Filter by Relevance → Top 3 Selected (70+ score)
3. Check Duplicates → Remove existing topics
4. Generate Content → 800-1000 word articles
5. Create Web Story → 5-8 slides with images
6. Schedule Publishing → 0, 4, 8 hours apart
7. Queue Storage → Added to web_stories_queue
8. Auto-Publish → Hourly cron publishes queued stories
9. Cleanup → Delete stories older than 30 days
```

---

## 📊 Monitoring

### Check Generation Logs
```sql
-- View recent automation runs
SELECT * FROM seo_automation_logs 
WHERE service_name = 'auto-generate-trending-webstories' 
ORDER BY created_at DESC LIMIT 10;
```

### Check Queue Status
```sql
-- View pending stories
SELECT q.*, ws.title 
FROM web_stories_queue q 
JOIN web_stories ws ON q.story_id = ws.id 
WHERE q.published_at IS NULL 
ORDER BY q.scheduled_at;
```

### Check Generated Stories
```sql
-- View auto-generated stories
SELECT id, title, status, auto_generated, generation_source, created_at 
FROM web_stories 
WHERE auto_generated = true 
ORDER BY created_at DESC 
LIMIT 10;
```

### View Cron Job History
```sql
-- Check cron execution history
SELECT * FROM cron.job_run_details 
WHERE jobname LIKE '%webstories%' 
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 🎛️ Configuration

### Adjust Generation Frequency
Edit cron schedules in Supabase SQL Editor:
```sql
-- Change to generate every 12 hours instead of 6
SELECT cron.alter_job('auto-generate-trending-webstories', 
  schedule := '0 */12 * * *');
```

### Change Story Count
Edit `auto-generate-trending-webstories/index.ts` line 112:
```typescript
.slice(0, 3) // Change from 3 to desired count
```

### Adjust Relevance Threshold
Edit `auto-generate-trending-webstories/index.ts` line 110:
```typescript
.filter(topic => topic.relevanceScore >= 70) // Change from 70
```

### Modify Cleanup Period
Edit `auto-generate-trending-webstories/index.ts` line 209:
```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
// Change 30 to desired days
```

---

## 🎯 Categories

Auto-generated stories are categorized into:
- `news` - General news and current affairs
- `web3` - Blockchain, crypto, Web3
- `technology` - Tech innovations and updates
- `government-jobs` - Job notifications and exams
- `education` - Educational news and updates

---

## 💰 Cost Estimation

### AI Usage (per day)
- **Topic Discovery**: ~2,000 tokens × 4 runs = 8,000 tokens
- **Content Generation**: ~3,000 tokens × 12 stories = 36,000 tokens
- **Image Generation**: ~12 images × 6 stories = 72 images
- **Total Daily**: ~44,000 tokens + 72 images

### Supabase Resources
- **Function Invocations**: ~100/day (4 generation + 24 publishing + cron overhead)
- **Database Operations**: ~50 inserts + 50 updates/day
- **Storage**: ~5 MB/day for images

---

## 🔍 Troubleshooting

### No Stories Being Generated
1. Check cron jobs are active:
   ```sql
   SELECT * FROM cron.job WHERE active = true AND jobname LIKE '%webstories%';
   ```
2. Check function logs for errors
3. Verify LOVABLE_API_KEY secret is set

### Stories Not Publishing
1. Check queue has approved stories:
   ```sql
   SELECT * FROM web_stories_queue WHERE review_status = 'approved' AND published_at IS NULL;
   ```
2. Verify `auto-publish-web-story` cron is running
3. Check function logs for errors

### Poor Story Quality
1. Increase relevance threshold (line 110)
2. Adjust AI prompts for better content
3. Filter by specific categories

---

## 🚀 Advanced Features

### Manual Override
Manually add stories to queue:
```sql
INSERT INTO web_stories_queue (story_id, scheduled_at, auto_publish, review_status, priority)
VALUES ('story-uuid', now() + interval '1 hour', true, 'approved', 100);
```

### Custom Topic Injection
Modify AI system prompt (line 42) to focus on specific topics or exclude certain subjects.

### Multi-Language Support
Enable translation by integrating with the existing `translate-content` edge function.

---

## ✅ System Status

- ✅ Database tables created
- ✅ Edge functions deployed
- ✅ Cron jobs configured
- ✅ Schema cache resolved
- ✅ Queue system operational
- ✅ Auto-cleanup enabled

**Status**: 🟢 FULLY OPERATIONAL

Your web stories automation is ready to generate engaging, trending content automatically!

---

## 📚 Related Documentation
- [WEB_STORIES_AUTOMATION_SETUP.md](./WEB_STORIES_AUTOMATION_SETUP.md)
- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
