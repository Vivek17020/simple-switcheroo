import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body = await req.json().catch(() => ({}));
    const count = body.count || 1;

    // Get current date for context
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log(`🔍 AI Gathering breaking news for ${dateStr}...`);

    // Discover trending breaking news
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
            content: `You are a breaking news reporter for TheBulletinBriefs. Current time: ${dateStr}.

MISSION: Find ${count} BREAKING NEWS story happening RIGHT NOW (published in the last 5-15 minutes).

CRITICAL REQUIREMENTS:
✓ Must be ULTRA-FRESH: published within last 5-15 minutes (REAL-TIME breaking news)
✓ Must be breaking/developing news with high urgency
✓ Must be from verified news sources (PTI, ANI, Reuters, TOI, Hindustan Times, Economic Times, etc.)
✓ Must be trending RIGHT NOW with high Google Discover potential

IMPORTANT EXCLUSIONS:
❌ NO Web3/Blockchain/Crypto topics
❌ NO Government Jobs/Recruitment topics
❌ NO Private Jobs/Career topics

Focus on HIGH-IMPACT categories:
- Finance: BREAKING market crashes/rallies, RBI announcements, stock alerts
- Technology: MAJOR tech launches, AI breakthroughs, app updates
- Business: BIG company announcements, mergers, IPO news, startup funding
- Education: MAJOR exam results, admission deadlines
- Defence: BREAKING military operations, security threats
- Politics: MAJOR political developments, PM/CM announcements
- Sports: LIVE cricket/football scores, India victories
- World: BREAKING international crises, natural disasters

Return ONLY valid JSON:
{
  "title": "Breaking news headline (55-60 chars)",
  "content": "Detailed breaking news article (600-900 words) with proper HTML formatting <h2>, <h3>, <p>, <strong>, <ul>, <li>. Start with BREAKING: or JUST IN: Include WHO, WHAT, WHEN, WHERE in first paragraph. Use inverted pyramid style. Include timestamp and source.",
  "category": "finance|technology|business|education|defence|politics|sports|world",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "sourceUrl": "Original news source URL",
  "publishedMinutesAgo": 5
}`
          },
          {
            role: 'user',
            content: `Search the web for ${count} BREAKING NEWS published in the LAST 10 MINUTES (${dateStr}).

CRITICAL: Find news published 5-10 minutes ago from major Indian/international news sources.

Focus on: Finance, Technology, Business, Education, Defence, Politics, Sports, World news.

REQUIREMENTS:
✓ Published within last 5-10 minutes (verify timestamp)
✓ Breaking news or just-announced developments
✓ From verified sources (PTI, ANI, Reuters, TOI, Hindu, NDTV, ET, etc.)
✓ Trending RIGHT NOW in India

EXCLUDE:
- Web3/Blockchain/Cryptocurrency
- Government job notifications
- Private job postings
- Old news (older than 10 minutes)

Write a complete, ready-to-publish article with proper HTML formatting.
Include the source URL and exact publish time.`
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      }),
    });

    if (!trendingResponse.ok) {
      const errorText = await trendingResponse.text();
      console.error('❌ Trending API error:', trendingResponse.status, errorText);
      throw new Error(`Trending search failed: ${trendingResponse.status}`);
    }

    const trendingData = await trendingResponse.json();
    const aiContent = trendingData.choices[0].message.content;
    
    let newsItem: any;
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      newsItem = JSON.parse(jsonStr);
    } catch (e) {
      console.error('❌ Failed to parse news item:', aiContent);
      throw new Error('Failed to parse AI response for news');
    }

    console.log(`✅ Found breaking news: ${newsItem.title}`);

    return new Response(
      JSON.stringify({
        success: true,
        news: newsItem
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in ai-gather-news:', error);
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
