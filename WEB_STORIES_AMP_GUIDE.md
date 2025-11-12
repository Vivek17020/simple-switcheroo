# Web Stories AMP Implementation Guide

## Overview

This document describes the complete Google Web Stories (AMP format) implementation for TheBulletinBriefs. The system generates AMP-compliant web stories that pass Google's validation and appear in Google Search, Discover, and Google News.

## Architecture

### Dual-Version Approach

We maintain two versions of each web story:

1. **Interactive React Version** (Non-AMP)
   - URL: `https://www.thebulletinbriefs.in/webstories/:category/:slug`
   - File: `src/pages/WebStoryPage.tsx`
   - Purpose: Rich, interactive experience for direct visitors
   - Features: Auto-advance, navigation controls, sharing, analytics

2. **AMP Story Version** (AMP-compliant)
   - URL: `https://www.thebulletinbriefs.in/amp-story/:slug`
   - File: `supabase/functions/web-story-amp/index.ts`
   - Purpose: Fast-loading, Google-optimized version for Search/Discover
   - Features: AMP-compliant HTML, optimized for mobile, Google requirements

## Canonical URL Strategy

### Non-AMP Version (React)
```html
<!-- Self-referencing canonical -->
<link rel="canonical" href="https://www.thebulletinbriefs.in/webstories/tech/example-story" />

<!-- Points to AMP version -->
<link rel="amphtml" href="https://www.thebulletinbriefs.in/amp-story/example-story" />
```

### AMP Version (Edge Function)
```html
<!-- Points to non-AMP version as canonical -->
<link rel="canonical" href="https://www.thebulletinbriefs.in/webstories/tech/example-story" />
```

This bidirectional linking tells Google:
- The non-AMP version is the primary/canonical version
- An AMP version exists for faster loading
- Both versions represent the same content

## AMP Validation Requirements ✅

All generated AMP stories meet these requirements:

### 1. Proper HTML Structure
```html
<!doctype html>
<html ⚡ lang="en">
```
✅ Uses `⚡` symbol (or `amp` attribute)

### 2. Required AMP Scripts
```html
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
<script async custom-element="amp-animation" src="https://cdn.ampproject.org/v0/amp-animation-0.1.js"></script>
```
✅ All mandatory scripts included

### 3. Canonical Links
✅ Canonical URL points to non-AMP version
✅ Non-AMP version has `rel="amphtml"` link

### 4. AMP Story Element
```html
<amp-story
  standalone
  title="Story Title"
  publisher="TheBulletinBriefs"
  publisher-logo-src="https://www.thebulletinbriefs.in/logo.png"
  poster-portrait-src="[featured-image]"
>
```
✅ All required attributes present

### 5. Valid AMP Components
- ✅ `<amp-story-page>` for each slide
- ✅ `<amp-story-grid-layer>` for layouts
- ✅ `<amp-img>` for images with proper dimensions
- ✅ `<amp-story-bookend>` for related content

## URL Routing Configuration

### Vercel Configuration (`vercel.json`)
```json
{
  "rewrites": [
    {
      "source": "/amp-story/:slug",
      "destination": "https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/web-story-amp?slug=:slug"
    }
  ]
}
```

This rewrite:
- Proxies requests from `/amp-story/:slug` to the Supabase edge function
- Maintains clean URLs
- Serves AMP HTML with correct headers

### React Router Configuration (`src/App.tsx`)
```tsx
<Route path="/webstories/:category/:slug" element={<WebStoryPage />} />
<Route path="/web-stories/:slug" element={<WebStoryPage />} /> {/* Legacy support */}
<Route path="/admin/web-stories/preview/:slug" element={<WebStoryPreview />} />
```

## Creating Web Stories

### Admin Interface

1. Navigate to **Admin → Web Stories**
2. Click **"New Web Story"**
3. Fill in required fields:
   - **Title** (5-70 characters recommended)
   - **Category** (Defence, Jobs, Tech, Global, Business)
   - **Description** (for SEO and social sharing)
   - **Slides** (4-30 slides recommended)

### Slide Requirements

Each slide needs:
- **Image**: 720x1280px minimum (9:16 aspect ratio)
- **Text** (optional): Short, impactful caption
- Automatic slug generation from title

### Publishing Workflow

1. **Create Story** → Saves as draft
2. **Add Slides** → Upload images (auto-optimized)
3. **Preview** → Test in mobile view
4. **Validate AMP** → Check AMP compliance (shown after saving)
5. **Publish** → Toggle publish status

## AMP Validation Tool

### In Admin Panel

After creating a story, the **AMP Story Validation** section appears:

```tsx
<WebStoryAMPValidator
  storySlug="example-story"
  storyTitle="Example Story Title"
/>
```

This component:
- Fetches the generated AMP HTML from edge function
- Validates against Google's AMP Validator API
- Shows errors and warnings
- Provides actionable feedback

### Manual Validation

Test any web story at:
```
https://search.google.com/test/amp?url=https://www.thebulletinbriefs.in/amp-story/[slug]
```

## SEO Optimization

### Structured Data (JSON-LD)

Both versions include NewsArticle schema:
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Story Title",
  "image": "https://...",
  "datePublished": "2025-01-10T10:00:00Z",
  "author": { "@type": "Organization", "name": "TheBulletinBriefs" },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "TheBulletinBriefs",
    "logo": { "@type": "ImageObject", "url": "..." }
  }
}
```

### Meta Tags

All stories include:
- Open Graph tags (Facebook, LinkedIn)
- Twitter Cards
- News-specific meta tags
- Google Discover optimization tags

### Image Optimization

Images are automatically:
- Resized to appropriate dimensions
- Compressed for web delivery
- Served with proper caching headers
- Alt text added for accessibility

## Google Discovery

### Requirements for Google Discover

✅ **Valid AMP Story**: Passes AMP validation
✅ **High-quality images**: 1200px+ wide, 9:16 aspect ratio
✅ **Proper metadata**: Publisher info, dates, descriptions
✅ **Mobile-optimized**: Responsive design, fast loading
✅ **HTTPS**: Secure connection
✅ **Indexed**: Submitted to Google Search Console

### Submission Process

1. **Create & Publish** story via admin panel
2. **Validate AMP** using built-in validator
3. **Submit to Google**:
   - Stories automatically included in sitemap
   - Sitemap URL: `https://www.thebulletinbriefs.in/web-stories-sitemap.xml`
   - Submit sitemap in Google Search Console

### Monitoring

Track performance in:
- **Google Search Console** → Performance → Web Stories
- **Admin Panel** → Analytics (if implemented)
- **Web Stories Analytics** table in database

## Technical Details

### Edge Function (Supabase)

Location: `supabase/functions/web-story-amp/index.ts`

Key features:
- Generates AMP HTML server-side
- Fetches story data from database
- Applies AMP-compliant templates
- Returns HTML with proper headers
- Caches responses (1 hour)

### Database Schema

Table: `web_stories`
```sql
- id (uuid)
- title (text)
- slug (text, unique)
- category (text)
- description (text)
- slides (jsonb[])
- status (text: 'draft' | 'published')
- featured_image (text)
- canonical_url (text)
- published_at (timestamp)
- updated_at (timestamp)
```

### Analytics Tracking

Table: `web_stories_analytics`
```sql
- story_id (uuid)
- event_type (text: 'view' | 'share' | 'complete')
- device_type (text)
- timestamp (timestamp)
```

## Best Practices

### Content Guidelines

1. **Title Length**: 40-70 characters (displays well in Search)
2. **Slide Count**: 4-20 slides (optimal engagement)
3. **Text Per Slide**: 1-2 sentences max
4. **Image Quality**: High-resolution, properly cropped
5. **Category**: Choose the most relevant category

### Design Guidelines

1. **Consistent Branding**: Use brand colors and logo
2. **Readable Text**: High contrast, large fonts
3. **Visual Hierarchy**: Clear focal points
4. **Animation**: Subtle, purposeful (built-in)
5. **Mobile-First**: Design for 9:16 portrait

### SEO Guidelines

1. **Descriptive Titles**: Include keywords naturally
2. **Meta Descriptions**: 120-160 characters
3. **Alt Text**: Describe images accurately
4. **Internal Links**: Link from articles to stories
5. **Social Sharing**: Encourage shares with good UX

## Troubleshooting

### AMP Validation Errors

**Error**: "Referenced AMP URL is not an AMP"
- **Solution**: Check that `/amp-story/:slug` returns valid AMP HTML
- **Verify**: Edge function is deployed and accessible

**Error**: "Mandatory tag missing"
- **Solution**: Review edge function template
- **Check**: All required AMP scripts are included

**Error**: "Invalid attribute"
- **Solution**: HTML entities must be escaped
- **Check**: `escapeHtml()` function is used correctly

### Common Issues

**Issue**: Story not appearing in Google Discover
- **Check**: AMP validation passes
- **Check**: Story is published (not draft)
- **Check**: Sitemap submitted to Search Console
- **Wait**: Can take 24-48 hours for indexing

**Issue**: Images not loading
- **Check**: Image URLs are absolute (include domain)
- **Check**: Images are publicly accessible
- **Check**: Proper CORS headers

**Issue**: Canonical link errors
- **Check**: Both versions have correct canonical links
- **Check**: URLs match exactly (including www)

## Validation Checklist

Before publishing, verify:

- [ ] Story has 4+ slides with images
- [ ] Title is compelling and SEO-friendly
- [ ] Description is present and descriptive
- [ ] Category is selected
- [ ] All images load properly
- [ ] AMP validation passes (use validator tool)
- [ ] Preview looks good on mobile
- [ ] Canonical links are correct
- [ ] Story is set to "published"

## Resources

- [AMP Story Documentation](https://amp.dev/documentation/components/amp-story/)
- [Google Search Guidelines for Web Stories](https://developers.google.com/search/docs/appearance/web-stories)
- [AMP Validator](https://validator.ampproject.org/)
- [Google Search Console](https://search.google.com/search-console)

## Support

For issues or questions:
1. Check this guide first
2. Use the AMP Validator in admin panel
3. Review error messages carefully
4. Check browser console for details

---

**Last Updated**: 2025-01-10
**Version**: 1.0
