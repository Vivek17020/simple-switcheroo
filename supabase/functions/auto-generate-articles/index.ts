import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface TrendingTopic {
  title: string;
  description: string;
  category: 'finance' | 'technology' | 'business' | 'education' | 'defence' | 'politics' | 'sports' | 'world';
  keywords: string[];
  searchVolume: 'high' | 'medium';
  competition: 'low' | 'medium';
}

interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  category_id: string;
  scheduled_at: string;
}

// Excluded categories: web3forindia, government-jobs (manual content only)
const CATEGORY_MAP: Record<string, string> = {
  'finance': '4007ef58-8f28-4887-b523-1c1d42b55bc7',
  'technology': '1e9c9ba9-619c-4cae-897d-222e68d5b7d5',
  'business': 'c144a744-2464-40b6-88d0-1f61931c276f',
  'education': '8f4e3a91-2d5b-4c6f-9a8e-7d1c4b2e3f5a',
  'defence': '2a9c8d7e-4f1b-3e5a-8d9c-1b4e7a3f2c5d',
  'politics': '5e8c9d2a-7f3b-4c1e-9d8a-3f5b2e1c4d7a',
  'sports': '3d7f9c2e-5a1b-4e8d-7c9a-2f4e1b3c5d8e',
  'world': '9c2e5d8a-3f7b-4c1e-8d9a-5f2b3e1c4d7a',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const articleCount = body.count || 3;

    // Get current date for context
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const monthYear = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    console.log(`🚀 Starting article generation for ${dateStr} (${articleCount} articles)...`);

    // Step 1: Discover trending topics
    console.log('🔍 Step 1: Discovering trending topics in Finance & Tech...');
    
    const trendingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a real-time news analyst for TheBulletinBriefs, an Indian news website. Current time: ${dateStr}.

MISSION: Find ${articleCount} BREAKING NEWS STORIES happening RIGHT NOW - news published in the LAST 5-15 MINUTES.

CRITICAL REQUIREMENTS:
✓ Must be ULTRA-FRESH: published within the last 5-15 minutes (REAL-TIME breaking news)
✓ Must be breaking/developing news with high urgency and trending potential
✓ Must be from verified news sources (PTI, ANI, Reuters, TOI, Hindustan Times, Economic Times, etc.)
✓ Must be trending RIGHT NOW in India with high Google Discover potential

IMPORTANT EXCLUSIONS:
❌ NO Web3/Blockchain/Crypto topics (separate section)
❌ NO Government Jobs/Recruitment topics (manual only)
❌ NO Private Jobs/Career topics (manual only)

Focus on HIGH-IMPACT categories for Google Discover:
- Finance: BREAKING market crashes/rallies, RBI announcements, stock alerts (Sensex/Nifty movements)
- Technology: MAJOR tech launches, AI breakthroughs, app updates from big companies
- Business: BIG company announcements, mergers worth ₹100Cr+, IPO news, startup funding
- Education: MAJOR exam results (JEE, NEET, UPSC), admission deadlines
- Defence: BREAKING military operations, security threats, India-Pakistan/China tensions
- Politics: MAJOR political developments, PM/CM announcements, election news
- Sports: LIVE cricket/football scores, India victories, player controversies
- World: BREAKING international crises, natural disasters, global conflicts

Return ONLY valid JSON with the actual news source and timestamp:
{
  "topics": [
    {
      "title": "Exact breaking news headline (55-60 chars)",
      "description": "What just happened - with source and time (100 chars)",
      "category": "finance|technology|business|education|defence|politics|sports|world",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "searchVolume": "high|medium",
      "competition": "low|medium",
      "sourceUrl": "Original news source URL",
      "publishedMinutesAgo": 5
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Search the web for ${articleCount} BREAKING NEWS published in the LAST 10 MINUTES (${dateStr}).

CRITICAL: Find news published 5-10 minutes ago from major Indian/international news sources.

Focus on: Finance, Technology, Business, Education, Defence, Politics, Sports, World news.

REQUIREMENTS:
✓ Published within last 5-10 minutes (verify timestamp)
✓ Breaking news or just-announced developments
✓ From verified sources (PTI, ANI, Reuters, TOI, Hindu, NDTV, etc.)
✓ Trending RIGHT NOW in India

EXCLUDE:
- Web3/Blockchain/Cryptocurrency topics
- Government job notifications
- Private job postings
- Old news (older than 10 minutes)

Include the source URL and exact publish time for each story.`
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      }),
    });

    if (!trendingResponse.ok) {
      const errorText = await trendingResponse.text();
      console.error('❌ Trending API error:', trendingResponse.status, errorText);
      throw new Error(`Trending search failed: ${trendingResponse.status}`);
    }

    const trendingData = await trendingResponse.json();
    const aiContent = trendingData.choices[0].message.content;
    
    let topics: TrendingTopic[];
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      const parsed = JSON.parse(jsonStr);
      topics = parsed.topics || [];
    } catch (e) {
      console.error('❌ Failed to parse trending topics:', aiContent);
      throw new Error('Failed to parse AI response for topics');
    }

    console.log(`✅ Found ${topics.length} trending topics`);

    // Step 2: Check for duplicate titles/slugs
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title, slug')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const existingTitles = new Set(existingArticles?.map(a => a.title.toLowerCase()) || []);
    const existingSlugs = new Set(existingArticles?.map(a => a.slug) || []);

    // Filter out duplicates
    const uniqueTopics = topics.filter(topic => {
      const slug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      return !existingTitles.has(topic.title.toLowerCase()) && !existingSlugs.has(slug);
    }).slice(0, articleCount);

    console.log(`📝 Processing ${uniqueTopics.length} unique topics...`);

    // Step 3: Generate articles
    const generatedArticles: GeneratedArticle[] = [];
    const results: any[] = [];

    for (let i = 0; i < uniqueTopics.length; i++) {
      const topic = uniqueTopics[i];
      console.log(`\n📄 [${i + 1}/${uniqueTopics.length}] Generating: ${topic.title}`);

      try {
        // Generate article content
        const articleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a breaking news writer for TheBulletinBriefs, an Indian news website. Write timely, accurate articles based on JUST-PUBLISHED news.

WRITING RULES:
1. Write fast but accurate - this is breaking news
2. Lead with the most important information (inverted pyramid style)
3. Include time context: "Breaking News", "Just In", "Minutes Ago"
4. Cite the original source clearly
5. Use simple, direct language - readers want facts quickly
6. Write for E-E-A-T (expertise, experience, authority, trust)

STRUCTURE (mandatory for breaking news):
- Start with "BREAKING:" or "JUST IN:" in the intro
- First paragraph: WHO, WHAT, WHEN, WHERE (the core facts)
- Include timestamp: "According to [Source] just minutes ago..."
- Use H2 and H3 headings for quick scanning
- Add bullet points for key facts
- Include a "What We Know So Far" section
- End with "This is a developing story, more updates soon"
- Total length: 600-900 words (quick, scannable)

HTML FORMATTING:
- Use <h2> for main sections, <h3> for subsections
- Use <p> for paragraphs
- Use <ul><li> for bullet lists of key facts
- Use <strong> for critical information
- Add <blockquote> for direct quotes from sources

Return ONLY valid JSON:
{
  "title": "Breaking news title with urgency (55-60 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "What just happened - compelling hook (150 chars)",
  "content": "Full HTML article content",
  "meta_title": "Breaking: [News] - SEO title (≤60 chars)",
  "meta_description": "Just In: [Key fact] - Read now (≤160 chars)",
  "tags": ["breaking-news", "tag2", "tag3", "tag4", "tag5"]
}`
              },
              {
                role: 'user',
                content: `Write a breaking news article about: "${topic.title}"

CRITICAL: This news was published MINUTES AGO (${dateStr}). Write with urgency.

Topic description: ${topic.description}
Original source: ${(topic as any).sourceUrl || 'Major news outlet'}
Published: ${(topic as any).publishedMinutesAgo || '5-10'} minutes ago
Target keywords: ${topic.keywords.join(', ')}
Category: ${topic.category}
Target audience: Indian readers wanting immediate news

Requirements:
- Start with "BREAKING:" or "JUST IN:" 
- First paragraph: WHO, WHAT, WHEN, WHERE
- Cite the original source clearly
- Include timestamp: "reported just minutes ago"
- Make it scannable with bullet points for key facts
- Add urgency and timeliness throughout
- Optimize for Google Discover's "breaking news" signals`
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          }),
        });

        if (!articleResponse.ok) {
          console.warn(`⚠️ Article generation failed for: ${topic.title}`);
          results.push({ success: false, topic: topic.title, error: 'Generation failed' });
          continue;
        }

        const articleData = await articleResponse.json();
        const articleContent = articleData.choices[0].message.content;

        let article: any;
        try {
          const jsonMatch = articleContent.match(/```json\n?([\s\S]*?)\n?```/) || articleContent.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : articleContent;
          article = JSON.parse(jsonStr);
        } catch (e) {
          console.warn(`⚠️ Failed to parse article JSON for: ${topic.title}`);
          results.push({ success: false, topic: topic.title, error: 'Parse failed' });
          continue;
        }

        // Publish IMMEDIATELY for speed (critical for Google Discover ranking)
        // Stagger by just 2 minutes each to avoid overwhelming the system
        const minutesDelay = i * 2; // Publish within 0-4 minutes
        const scheduledAt = new Date(Date.now() + minutesDelay * 60 * 1000);

          // Double-check: Ensure we're not accidentally using excluded categories
          const categoryId = CATEGORY_MAP[topic.category];
          if (!categoryId) {
            console.warn(`⚠️ Skipping article - invalid category: ${topic.category}`);
            continue;
          }

          generatedArticles.push({
            title: article.title,
            slug: article.slug || topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            excerpt: article.excerpt,
            content: article.content,
            meta_title: article.meta_title,
            meta_description: article.meta_description,
            tags: article.tags || topic.keywords,
            category_id: categoryId,
            scheduled_at: scheduledAt.toISOString(),
          });

        console.log(`✅ Generated: ${article.title}`);
        results.push({ success: true, topic: topic.title, scheduledAt: scheduledAt.toISOString() });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`❌ Error generating article for ${topic.title}:`, error);
        results.push({ success: false, topic: topic.title, error: error.message });
      }
    }

    // Step 4: Add internal links between articles
    console.log('\n🔗 Step 4: Adding internal links...');

    if (generatedArticles.length >= 2) {
      for (let i = 0; i < generatedArticles.length; i++) {
        const article = generatedArticles[i];
        const otherArticles = generatedArticles.filter((_, idx) => idx !== i);
        
        // Link to 2 random related articles
        const linksToAdd = otherArticles.slice(0, 2);
        
        let linkedContent = article.content;
        for (const linkArticle of linksToAdd) {
          // Find a good place to insert the link (after first paragraph)
          const firstPEnd = linkedContent.indexOf('</p>');
          if (firstPEnd > 0) {
            const relatedLink = `<p><strong>Related:</strong> <a href="/article/${linkArticle.slug}">${linkArticle.title}</a></p>`;
            linkedContent = linkedContent.slice(0, firstPEnd + 4) + relatedLink + linkedContent.slice(firstPEnd + 4);
          }
        }
        article.content = linkedContent;
      }
    }

    // Step 5: Save articles to database
    console.log('\n💾 Step 5: Saving articles to database...');

    const savedArticles: any[] = [];
    for (const article of generatedArticles) {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          tags: article.tags,
          seo_keywords: article.tags,
          category_id: article.category_id,
          image_url: null, // No featured images for auto-generated articles
          published: false, // Will be published by scheduler
          author: 'TheBulletinBriefs AI',
          status: 'scheduled',
          published_at: article.scheduled_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to save: ${article.title}`, error);
      } else {
        savedArticles.push(data);
        console.log(`✅ Saved: ${article.title} (scheduled for ${article.scheduled_at})`);
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`\n✅ COMPLETE: ${successCount} articles generated, ${failedCount} failed, ${savedArticles.length} saved`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          topicsFound: topics.length,
          articlesGenerated: successCount,
          articlesFailed: failedCount,
          articlesSaved: savedArticles.length,
        },
        articles: savedArticles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          scheduledAt: a.published_at,
        })),
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in auto-generate-articles:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
