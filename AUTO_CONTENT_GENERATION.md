# Autonomous Content Generation System

## Overview

The autonomous content generation system automatically creates and publishes trending articles for TheBulletinBriefs. The system runs on scheduled cron jobs and generates high-quality, SEO-optimized content using AI.

## Included Categories

The system generates articles for these categories:
- ✅ **Finance**: Stock market, banking, investments, RBI policies
- ✅ **Technology**: AI tools, software updates, consumer tech
- ✅ **Business**: Company news, IPOs, startups, business strategies
- ✅ **Education**: School/college news, exams, scholarships
- ✅ **Defence**: Military updates, defense equipment, national security
- ✅ **Politics**: Indian politics, government policies, elections
- ✅ **Sports**: Cricket, Olympics, tournaments, player news
- ✅ **World**: International news, global events, diplomacy

## Excluded Categories (Manual Only)

These categories are **excluded** from automation:
- ❌ **Web3 for India**: Blockchain, cryptocurrency, Web3 topics (separate manual section)
- ❌ **Government Jobs**: Job notifications, recruitment (requires manual verification)
- ❌ **Private Jobs**: Career opportunities, hiring (requires manual posting)

## System Architecture

### Components

1. **auto-generate-articles** (Edge Function)
   - Discovers trending topics using AI
   - Generates full article content
   - Creates featured images
   - Adds internal links
   - Saves to database with scheduled publish times

2. **publish-scheduled-articles** (Edge Function)
   - Runs every 30 minutes
   - Publishes articles that have reached their scheduled time
   - Updates article status from 'scheduled' to 'published'

3. **Cron Jobs**
   - Morning batch: 6:00 AM IST (generates 5 articles)
   - Evening batch: 6:00 PM IST (generates 5 articles)
   - Publishing: Every 30 minutes

### Article Generation Workflow

```
1. AI discovers trending topics (Finance, Tech, Business, etc.)
   ↓
2. Filters out duplicate topics from last 7 days
   ↓
3. AI generates full article content (800-1200 words)
   ↓
4. AI creates featured image for the article
   ↓
5. System adds internal links between articles
   ↓
6. Saves to database with scheduled publish time
   ↓
7. Publish cron picks up and publishes at scheduled time
```

## Article Quality Features

- **SEO Optimized**: Meta titles, descriptions, keywords
- **Structured Content**: H2/H3 headings, bullet points, FAQs
- **Indian Context**: Tailored for Indian audience
- **Fresh Data**: Includes current information and context
- **Internal Linking**: Automatic cross-linking between articles
- **Featured Images**: AI-generated relevant images
- **Reading Time**: Calculated automatically
- **Tags**: Relevant tags for categorization

## Schedule Configuration

Articles are spread throughout the day:
- 10 articles generated per day (5 morning + 5 evening)
- Scheduled at 2.4-hour intervals
- Example: Article 1 at 6:00 AM, Article 2 at 8:24 AM, etc.
- Auto-publishes when scheduled time is reached

## Manual Controls

From the Admin Dashboard → AI Content tab, you can:

1. **Manual Generation**
   - Generate 5 articles immediately
   - Generate 10 articles immediately
   - Custom count supported

2. **Monitor Queue**
   - View scheduled articles
   - See recent AI-generated articles
   - Check publish times

3. **Override Publishing**
   - Click "Publish Now" on any scheduled article
   - Immediately publish without waiting for schedule

## Database Tables

### Articles
- `author`: Set to "TheBulletinBriefs AI" for auto-generated
- `status`: 'scheduled' until publish time, then 'published'
- `published`: false until published
- `published_at`: Scheduled publish time

## Error Handling

The system includes robust error handling:
- API rate limiting: Delays between requests
- Failed articles: Logged but don't stop the batch
- Duplicate prevention: Checks last 7 days of content
- Invalid categories: Skipped with warnings

## Monitoring

Check system health via:
- Admin Dashboard → AI Content tab
- Edge Function logs in Supabase
- Database queries for scheduled articles
- Cron job status

## Setup Instructions

1. Ensure `LOVABLE_API_KEY` is configured in Supabase secrets
2. Run the SQL in `auto-generate-articles-cron.sql` to enable cron jobs
3. Verify category IDs in the function match your database
4. Monitor first run from Admin Dashboard

## Cost Considerations

- Uses Lovable AI (Gemini 2.5 Flash)
- Approximately 10 articles per day
- Each article: ~2-3 API calls
- Monthly cost depends on Lovable AI pricing

## Troubleshooting

**402 Error**: Out of Lovable AI credits
- Solution: Add credits in Lovable workspace

**No topics found**: AI filtering too aggressive
- Check trending topics in logs
- Adjust selection criteria if needed

**Duplicate articles**: Duplicate check failing
- Verify slug generation logic
- Check 7-day lookback query

**Wrong categories**: Category mapping issue
- Update CATEGORY_MAP in edge function
- Verify category IDs in database

## Best Practices

1. Monitor first few batches manually
2. Review generated content quality periodically
3. Adjust article count based on content quality
4. Keep excluded categories list updated
5. Check for SEO score and engagement metrics
6. Update prompts if content quality drops

## Future Enhancements

Potential improvements:
- A/B testing headlines
- Automatic image optimization
- Social media auto-posting
- Performance analytics per category
- Dynamic scheduling based on traffic patterns
- Multi-language support
