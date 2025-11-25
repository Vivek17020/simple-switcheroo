import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebStorySlide {
  image: string;
  text: string;
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
      return new Response(generate404Page(), {
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

    const publisherConfig = config || {
      publisher_name: 'TheBulletinBriefs',
      publisher_logo_url: 'https://www.thebulletinbriefs.in/logo.png',
      publisher_logo_width: 600,
      publisher_logo_height: 60,
      google_analytics_id: null,
    };

    const ampHtml = generateAMPStory(story as unknown as WebStory, publisherConfig);

    return new Response(ampHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
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

function generateAMPStory(story: WebStory, config: any): string {
  const baseUrl = 'https://www.thebulletinbriefs.in';
  const storyUrl = `${baseUrl}/webstories/${story.category.toLowerCase()}/${story.slug}`;
  // Canonical must point to non-AMP version (the React preview page)
  const canonicalUrl = story.canonical_url || `${baseUrl}/web-story-preview/${story.slug}`;
  const posterImage = story.featured_image || story.slides[0]?.image || `${baseUrl}/logo.png`;
  const publishDate = new Date(story.published_at).toISOString();
  const modifiedDate = new Date(story.updated_at).toISOString();

  // Generate slides HTML
  const slidesHtml = story.slides.map((slide, index) => `
    <amp-story-page id="page-${index + 1}">
      <amp-story-grid-layer template="fill">
        <amp-img 
          src="${escapeHtml(slide.image)}" 
          width="720" 
          height="1280"
          layout="responsive"
          alt="${escapeHtml(slide.text || `Slide ${index + 1}`)}"
        ></amp-img>
      </amp-story-grid-layer>
      ${slide.text ? `
      <amp-story-grid-layer template="vertical" class="bottom">
        <div class="text-overlay">
          <h2>${escapeHtml(slide.text)}</h2>
        </div>
      </amp-story-grid-layer>` : ''}
    </amp-story-page>
  `).join('\n');

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": story.title,
    "image": posterImage,
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
    "description": story.description || story.title
  };

  return `<!doctype html>
<html ⚡ lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  
  <!-- AMP Scripts - v0.js must be first -->
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>${config.google_analytics_id ? `
  <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>` : ''}
  
  <!-- SEO Meta Tags -->
  <title>${escapeHtml(story.title)} | ${config.publisher_name}</title>
  <meta name="description" content="${escapeHtml(story.description || story.title)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  
  <!-- AMP Story Generator Metadata -->
  <meta name="amp-story-generator-name" content="${config.publisher_name}">
  <meta name="amp-story-generator-version" content="1.0.0">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(story.title)}">
  <meta property="og:description" content="${escapeHtml(story.description || story.title)}">
  <meta property="og:image" content="${escapeHtml(posterImage)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:site_name" content="${config.publisher_name}">
  <meta property="article:published_time" content="${publishDate}">
  <meta property="article:modified_time" content="${modifiedDate}">
  <meta property="article:section" content="${escapeHtml(story.category)}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(story.title)}">
  <meta name="twitter:description" content="${escapeHtml(story.description || story.title)}">
  <meta name="twitter:image" content="${escapeHtml(posterImage)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <!-- AMP Boilerplate -->
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  
  <!-- Custom Styles -->
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
    
    .text-overlay {
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%);
      padding: 32px 24px;
      width: 100%;
    }
    
    .text-overlay h2 {
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.3;
      margin: 0;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    
    .bottom {
      align-content: end;
    }
  </style>
</head>
<body>
  <amp-story
    standalone
    title="${escapeHtml(story.title)}"
    publisher="${escapeHtml(config.publisher_name)}"
    publisher-logo-src="${config.publisher_logo_url}"
    poster-portrait-src="${escapeHtml(posterImage)}"
  >
    ${config.google_analytics_id ? `
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
    
    <!-- Bookend -->
    <amp-story-bookend layout="nodisplay">
      <script type="application/json">
        {
          "bookendVersion": "v1.0",
          "shareProviders": [
            "facebook",
            "twitter",
            "whatsapp",
            "linkedin"
          ],
          "components": [
            {
              "type": "heading",
              "text": "More from ${escapeHtml(config.publisher_name)}"
            },
            {
              "type": "cta-link",
              "links": [
                {
                  "text": "Visit Homepage",
                  "url": "${baseUrl}"
                },
                {
                  "text": "More Web Stories",
                  "url": "${baseUrl}/web-stories"
                }
              ]
            }
          ]
        }
      </script>
    </amp-story-bookend>
    
    ${slidesHtml}
  </amp-story>
</body>
</html>`;
}

function generate404Page(): string {
  return `<!doctype html>
<html ⚡ lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <link rel="canonical" href="https://www.thebulletinbriefs.in/web-stories">
  <title>Story Not Found | TheBulletinBriefs</title>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 48px 24px;
      background: #000;
      color: #fff;
    }
    h1 { font-size: 32px; margin-bottom: 16px; }
    p { font-size: 18px; color: #999; }
    a { color: #fff; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Story Not Found</h1>
  <p>The web story you're looking for doesn't exist.</p>
  <p><a href="https://www.thebulletinbriefs.in/web-stories">View All Stories</a></p>
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
