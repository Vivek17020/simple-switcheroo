import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebStorySlide {
  image: string;
  text: string;
  subtext?: string;
  slideType?: 'cover' | 'content' | 'cta' | 'summary';
  ctaText?: string;
  ctaUrl?: string;
}

interface WebStory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  slides: WebStorySlide[];
  featured_image: string | null;
  canonical_url: string | null;
  published_at: string;
  updated_at: string;
}

interface RelatedStory {
  title: string;
  slug: string;
  category: string;
  featured_image: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: story, error } = await supabaseClient
      .from('web_stories')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !story) {
      console.error('Error fetching web story:', error);
      return new Response(generate404Page(slug), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // Fetch publisher config
    const { data: config } = await supabaseClient
      .from('web_stories_config')
      .select('*')
      .limit(1)
      .single();

    // Fetch related stories from the same category (excluding current story)
    const { data: relatedStories } = await supabaseClient
      .from('web_stories')
      .select('title, slug, category, featured_image')
      .eq('status', 'published')
      .eq('category', story.category)
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(4);

    // Google requires SQUARE publisher logo (96x96 minimum)
    const publisherConfig = config || {
      publisher_name: 'TheBulletinBriefs',
      publisher_logo_url: 'https://www.thebulletinbriefs.in/tb-briefs-favicon.png',
      publisher_logo_width: 96,
      publisher_logo_height: 96,
      google_analytics_id: null,
    };

    const ampHtml = generateAMPStory(
      story as unknown as WebStory, 
      publisherConfig, 
      (relatedStories || []) as RelatedStory[]
    );

    return new Response(ampHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('AMP generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate AMP story' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate poster images with proper aspect ratios
// Google requirements:
// - poster-portrait-src: 3:4 ratio, minimum 640x853px (recommended 720x960)
// - poster-square-src: 1:1 ratio, minimum 640x640px  
// - poster-landscape-src: 4:3 ratio, minimum 853x640px
function generatePosterImages(baseImageUrl: string): { portrait: string; square: string; landscape: string } {
  // If using Supabase storage, we can add transform parameters
  // For external images, return the same URL with logging
  const isSupabaseStorage = baseImageUrl.includes('supabase.co/storage');
  
  if (isSupabaseStorage) {
    // Supabase Storage image transformations
    const baseWithoutParams = baseImageUrl.split('?')[0];
    return {
      portrait: `${baseWithoutParams}?width=720&height=960&resize=cover`,
      square: `${baseWithoutParams}?width=640&height=640&resize=cover`,
      landscape: `${baseWithoutParams}?width=853&height=640&resize=cover`,
    };
  }
  
  // For external images (like Unsplash), try to use their resize API if available
  if (baseImageUrl.includes('unsplash.com')) {
    const baseUrl = baseImageUrl.split('?')[0];
    return {
      portrait: `${baseUrl}?w=720&h=960&fit=crop&auto=format`,
      square: `${baseUrl}?w=640&h=640&fit=crop&auto=format`,
      landscape: `${baseUrl}?w=853&h=640&fit=crop&auto=format`,
    };
  }
  
  // For other images, log a warning and use the same image
  console.log(`[AMP] Using same image for all poster sizes: ${baseImageUrl.substring(0, 100)}...`);
  console.log('[AMP] Consider using Supabase Storage or Unsplash for proper image transformations');
  
  return {
    portrait: baseImageUrl,
    square: baseImageUrl,
    landscape: baseImageUrl,
  };
}

function generateAMPStory(story: WebStory, config: any, relatedStories: RelatedStory[]): string {
  const baseUrl = 'https://www.thebulletinbriefs.in';
  const categorySlug = story.category.toLowerCase();
  
  // CRITICAL: AMP Web Stories must be self-canonical (point to themselves)
  const ampStoryUrl = `${baseUrl}/amp-story/${categorySlug}/${story.slug}`;
  const canonicalUrl = ampStoryUrl;
  
  // Get the base poster image
  const basePosterImage = story.featured_image || story.slides[0]?.image || `${baseUrl}/logo.png`;
  
  // Generate properly sized poster images for each aspect ratio
  const posterImages = generatePosterImages(basePosterImage);
  
  const publishDate = new Date(story.published_at).toISOString();
  const modifiedDate = new Date(story.updated_at).toISOString();
  
  // Title should be under 70 characters for Google
  const truncatedTitle = story.title.length > 70 ? story.title.substring(0, 67) + '...' : story.title;
  const metaDescription = (story.description || story.title).substring(0, 160);

  // Generate slides HTML
  const slidesHtml = story.slides.map((slide, index) => {
    const isCta = slide.slideType === 'cta';
    const isCover = slide.slideType === 'cover' || index === 0;
    const autoAdvance = isCta ? '' : 'auto-advance-after="6s"';
    const altText = escapeHtml(slide.text || `${story.title} - Slide ${index + 1}`);
    
    return `
    <amp-story-page id="page-${index + 1}" ${autoAdvance}>
      <amp-story-grid-layer template="fill">
        <amp-img 
          src="${escapeHtml(slide.image)}" 
          width="720" 
          height="1280"
          layout="responsive"
          alt="${altText}"
        ></amp-img>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="bottom">
        <div class="${isCta ? 'cta-overlay' : 'text-overlay'}">
          ${isCover ? `<p class="publisher-tag">${escapeHtml(config.publisher_name)}</p>` : ''}
          ${slide.text ? `<h2>${escapeHtml(slide.text)}</h2>` : ''}
          ${slide.subtext ? `<p class="subtext">${escapeHtml(slide.subtext)}</p>` : ''}
          ${isCta && slide.ctaUrl ? `<a href="${escapeHtml(slide.ctaUrl)}" class="cta-button">${escapeHtml(slide.ctaText || 'Read More')}</a>` : ''}
        </div>
      </amp-story-grid-layer>
    </amp-story-page>`;
  }).join('\n');

  // Generate bookend with related stories
  const bookendComponents = generateBookendComponents(config.publisher_name, baseUrl, relatedStories);

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": truncatedTitle,
    "description": metaDescription,
    "image": [
      {
        "@type": "ImageObject",
        "url": posterImages.portrait,
        "width": 720,
        "height": 960
      },
      {
        "@type": "ImageObject", 
        "url": posterImages.square,
        "width": 640,
        "height": 640
      },
      {
        "@type": "ImageObject",
        "url": posterImages.landscape,
        "width": 853,
        "height": 640
      }
    ],
    "datePublished": publishDate,
    "dateModified": modifiedDate,
    "author": {
      "@type": "Organization",
      "name": config.publisher_name,
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": config.publisher_name,
      "logo": {
        "@type": "ImageObject",
        "url": config.publisher_logo_url,
        "width": config.publisher_logo_width,
        "height": config.publisher_logo_height
      }
    },
    "articleSection": story.category,
    "inLanguage": "en",
    "isAccessibleForFree": true
  };

  return `<!DOCTYPE html>
<html ⚡ lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  
  <!-- Canonical URL - MUST point to itself for Web Stories -->
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="https://www.thebulletinbriefs.in/tb-briefs-favicon.png">
  <link rel="apple-touch-icon" href="https://www.thebulletinbriefs.in/tb-briefs-favicon.png">
  
  <!-- AMP Runtime Script - MUST be first script -->
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  
  <!-- AMP Story Component Script -->
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  ${config.google_analytics_id ? `
  <!-- AMP Analytics Component -->
  <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>` : ''}
  
  <!-- SEO Meta Tags -->
  <title>${escapeHtml(truncatedTitle)} | ${escapeHtml(config.publisher_name)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <meta name="robots" content="max-image-preview:large">
  
  <!-- AMP Story Generator Metadata -->
  <meta name="amp-story-generator-name" content="${escapeHtml(config.publisher_name)}">
  <meta name="amp-story-generator-version" content="1.0.0">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(truncatedTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${escapeHtml(posterImages.portrait)}">
  <meta property="og:image:width" content="720">
  <meta property="og:image:height" content="960">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:site_name" content="${escapeHtml(config.publisher_name)}">
  <meta property="article:published_time" content="${publishDate}">
  <meta property="article:modified_time" content="${modifiedDate}">
  <meta property="article:section" content="${escapeHtml(story.category)}">
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(truncatedTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${escapeHtml(posterImages.portrait)}">
  
  <!-- Structured Data for Google -->
  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <!-- AMP Boilerplate CSS - REQUIRED in exact format -->
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  
  <!-- Custom Styles for Story Appearance -->
  <style amp-custom>
    amp-story {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    
    amp-story-page {
      background-color: #000;
    }
    
    amp-story-grid-layer[template="fill"] amp-img {
      object-fit: cover;
    }
    
    .bottom {
      align-content: end;
    }
    
    .text-overlay {
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, transparent 100%);
      padding: 40px 24px 32px;
      width: 100%;
    }
    
    .publisher-tag {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 8px 0;
    }
    
    .text-overlay h2 {
      color: #fff;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.25;
      margin: 0 0 12px 0;
      text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    }
    
    .subtext {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
      font-weight: 400;
      line-height: 1.5;
      margin: 0;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }
    
    .cta-overlay {
      background: linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.5) 80%, transparent 100%);
      padding: 48px 24px 40px;
      width: 100%;
      text-align: center;
    }
    
    .cta-overlay h2 {
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.3;
      margin: 0 0 12px 0;
    }
    
    .cta-overlay .subtext {
      margin-bottom: 20px;
    }
    
    .cta-button {
      display: inline-block;
      background: #fff;
      color: #000;
      padding: 14px 32px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <!-- AMP Story Container - standalone attribute is REQUIRED -->
  <amp-story
    standalone
    title="${escapeHtml(truncatedTitle)}"
    publisher="${escapeHtml(config.publisher_name)}"
    publisher-logo-src="${escapeHtml(config.publisher_logo_url)}"
    poster-portrait-src="${escapeHtml(posterImages.portrait)}"
    poster-square-src="${escapeHtml(posterImages.square)}"
    poster-landscape-src="${escapeHtml(posterImages.landscape)}"
  >
    <!-- Story Pages (Slides) -->
${slidesHtml}
    
    <!-- Bookend with sharing options and related stories -->
    <amp-story-bookend layout="nodisplay">
      <script type="application/json">
${bookendComponents}
      </script>
    </amp-story-bookend>
    ${config.google_analytics_id ? `
    <!-- Google Analytics Tracking -->
    <amp-analytics type="gtag" data-credentials="include">
      <script type="application/json">
      {
        "vars": {
          "gtag_id": "${escapeHtml(config.google_analytics_id)}",
          "config": {
            "${escapeHtml(config.google_analytics_id)}": {
              "groups": "default"
            }
          }
        },
        "triggers": {
          "storyProgress": {
            "on": "story-page-visible",
            "request": "event",
            "vars": {
              "event_name": "web_story_view",
              "event_category": "Web Stories",
              "event_label": "${escapeHtml(story.title)}"
            }
          },
          "storyEnd": {
            "on": "story-last-page-visible",
            "request": "event",
            "vars": {
              "event_name": "web_story_complete",
              "event_category": "Web Stories",
              "event_label": "${escapeHtml(story.title)}"
            }
          }
        }
      }
      </script>
    </amp-analytics>
    ` : ''}
  </amp-story>
</body>
</html>`;
}

function generateBookendComponents(publisherName: string, baseUrl: string, relatedStories: RelatedStory[]): string {
  const components: any[] = [
    {
      "type": "heading",
      "text": `More from ${publisherName}`
    }
  ];

  // Add related stories as "small" type cards if available
  if (relatedStories.length > 0) {
    relatedStories.forEach((story) => {
      const categorySlug = story.category.toLowerCase();
      const storyUrl = `${baseUrl}/amp-story/${categorySlug}/${story.slug}`;
      const thumbnail = story.featured_image || `${baseUrl}/logo.png`;
      
      components.push({
        "type": "small",
        "title": story.title.length > 50 ? story.title.substring(0, 47) + '...' : story.title,
        "url": storyUrl,
        "image": thumbnail
      });
    });
  }

  // Add CTA links
  components.push({
    "type": "cta-link",
    "links": [
      {
        "text": "Visit Homepage",
        "url": baseUrl
      },
      {
        "text": "More Web Stories",
        "url": `${baseUrl}/web-stories`
      }
    ]
  });

  const bookend = {
    "bookendVersion": "v1.0",
    "shareProviders": [
      "facebook",
      "twitter",
      "whatsapp",
      "linkedin",
      "email"
    ],
    "components": components
  };

  return JSON.stringify(bookend, null, 8);
}

// 404 page - Valid simple AMP page (not amp-story) with self-canonical
function generate404Page(slug: string): string {
  const baseUrl = 'https://www.thebulletinbriefs.in';
  // 404 page should be self-canonical to its own URL pattern
  const canonicalUrl = `${baseUrl}/amp-story/not-found/${slug}`;
  
  return `<!DOCTYPE html>
<html ⚡ lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  
  <!-- Favicon -->
  <link rel="icon" href="https://www.thebulletinbriefs.in/tb-briefs-favicon.png" type="image/png">
  
  <!-- Self-canonical URL -->
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  
  <!-- AMP Runtime Script -->
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  
  <title>Story Not Found | TheBulletinBriefs</title>
  <meta name="description" content="The web story you're looking for could not be found. Browse our collection of web stories.">
  <meta name="robots" content="noindex, follow">
  
  <!-- AMP Boilerplate CSS -->
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  
  <style amp-custom>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 48px 24px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0;
    }
    .error-code {
      font-size: 120px;
      font-weight: 800;
      color: rgba(255,255,255,0.1);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 0;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    h1 { 
      font-size: 28px; 
      margin-bottom: 16px;
      font-weight: 700;
    }
    p { 
      font-size: 16px; 
      color: rgba(255,255,255,0.7);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      background: #fff;
      color: #1a1a2e;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 8px;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: scale(1.05);
    }
    .btn-outline {
      background: transparent;
      border: 2px solid rgba(255,255,255,0.3);
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="error-code">404</div>
  <div class="content">
    <h1>Story Not Found</h1>
    <p>The web story you're looking for doesn't exist or may have been removed.</p>
    <a href="${baseUrl}/web-stories" class="btn">Browse All Stories</a>
    <a href="${baseUrl}" class="btn btn-outline">Go to Homepage</a>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
