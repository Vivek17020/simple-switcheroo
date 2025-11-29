# Stale Content Update Plan

## Overview
This document outlines the plan for updating 19 articles flagged as stale content (older than 30 days without updates) to improve SEO performance and maintain content freshness.

## Why Content Freshness Matters
- **Google Ranking Factor**: Fresh content signals relevance and currency
- **User Experience**: Outdated information damages credibility and trust
- **Click-Through Rates**: Updated publish dates and timestamps improve CTR in search results
- **Crawl Budget**: Regularly updated pages get crawled more frequently

## Identified Stale Articles
Total: 19 articles requiring updates

### Prioritization Criteria
1. **High Priority** (Update within 1 week):
   - Articles with high traffic but outdated information
   - Breaking news or time-sensitive topics
   - Articles with incorrect or deprecated information

2. **Medium Priority** (Update within 2 weeks):
   - Articles with moderate traffic
   - Evergreen content that needs minor updates
   - Articles missing current statistics or examples

3. **Low Priority** (Update within 1 month):
   - Low-traffic articles
   - Historical content that only needs timestamp updates
   - Articles that are fundamentally still accurate

## Update Checklist for Each Article

### Content Updates
- [ ] Review and update all statistics and data points
- [ ] Add current examples and case studies (2024-2025)
- [ ] Update external links (remove broken links)
- [ ] Verify technical information is still accurate
- [ ] Add new sections for recent developments
- [ ] Update images and screenshots if applicable

### SEO Updates
- [ ] Refresh meta description with current language
- [ ] Update title tag if needed (keep primary keyword)
- [ ] Add new LSI keywords based on current search trends
- [ ] Update internal links to point to newer related articles
- [ ] Ensure schema markup is current
- [ ] Update `updated_at` timestamp in database

### Quality Checks
- [ ] Run through plagiarism checker
- [ ] Verify all facts and claims
- [ ] Check readability score (aim for 60+)
- [ ] Mobile-friendly formatting check
- [ ] Image optimization and alt text verification

## Workflow Process

### Step 1: Identify Articles
```sql
-- Query to find stale articles
SELECT id, title, slug, published_at, updated_at, 
       EXTRACT(DAY FROM (NOW() - updated_at)) as days_since_update
FROM articles 
WHERE published = true 
  AND updated_at < NOW() - INTERVAL '30 days'
ORDER BY views_count DESC, published_at DESC;
```

### Step 2: Categorize by Priority
- Export list to spreadsheet
- Assign priority (High/Medium/Low) based on:
  - Traffic data (views_count)
  - Topic relevance
  - Content type (breaking news vs evergreen)
  - Current ranking position

### Step 3: Update Content
For each article:
1. Open article in admin editor
2. Review existing content
3. Research current information
4. Make necessary updates (see checklist above)
4. Update `updated_at` field
5. Save and re-publish

### Step 4: Verification
After updating:
- [ ] Check article renders correctly on frontend
- [ ] Verify updated timestamp shows on page
- [ ] Confirm sitemap regenerates with new lastmod date
- [ ] Submit updated URL to Google Search Console
- [ ] Monitor ranking changes over next 7-14 days

## Automation Recommendations

### Weekly Stale Content Report
Create automated edge function to run weekly:
```typescript
// supabase/functions/stale-content-report/index.ts
// Sends email to admins with list of articles needing updates
```

### Auto-trigger Sitemap Regeneration
Already implemented - sitemap regenerates on article update.

### Update Reminders
- Set calendar reminders for quarterly content audits
- Monitor articles approaching 30-day staleness threshold

## Success Metrics

Track the following metrics before and after updates:

1. **Search Performance**
   - Average position in Google Search Console
   - Impressions and clicks
   - CTR improvement

2. **User Engagement**
   - Time on page
   - Bounce rate
   - Pages per session

3. **Technical SEO**
   - Crawl frequency
   - Index status
   - Core Web Vitals

## Timeline

- **Week 1**: Update all High Priority articles (estimated 5-7 articles)
- **Week 2-3**: Update Medium Priority articles (estimated 8-10 articles)
- **Week 4**: Update Low Priority articles (estimated 2-4 articles)
- **Ongoing**: Weekly monitoring and quarterly full content audits

## Resources Needed

- **Time**: ~30-60 minutes per article for thorough update
- **Tools**: 
  - Google Search Console (ranking data)
  - SEO tools (keyword research)
  - Analytics platform (traffic data)
- **Team**: Assign articles to content team members based on expertise

## Notes

- **Don't just update timestamp**: Google can detect "fake" updates. Make substantial content improvements.
- **Maintain URL structure**: Never change slugs on existing articles - use 301 redirects if absolutely necessary.
- **Update related articles**: When updating one article, check for opportunities to update and interlink related articles.
- **Track changes**: Keep notes on what was updated for each article for future reference.

---

**Last Updated**: 2025-01-25
**Next Review**: Weekly (automated report)
**Owner**: Content & SEO Team
