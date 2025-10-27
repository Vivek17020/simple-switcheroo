import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all published articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, slug, content, excerpt, meta_title, meta_description, seo_keywords, tags, image_url, published_at, reading_time, seo_score')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(20);

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      throw articlesError;
    }

    console.log(`Analyzing ${articles?.length || 0} articles...`);

    // Prepare article data for AI analysis
    const articlesAnalysis = articles?.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      seo_keywords: article.seo_keywords,
      tags: article.tags,
      has_image: !!article.image_url,
      reading_time: article.reading_time,
      seo_score: article.seo_score,
      content_length: article.content?.length || 0,
      content_preview: article.content?.substring(0, 500)
    })) || [];

    const systemPrompt = `You are an expert SEO and content quality auditor specializing in news websites. Analyze the provided articles and website structure for Google indexing readiness.

Focus on:
1. Content Quality: Writing quality, readability, value, uniqueness
2. SEO Elements: Meta titles, descriptions, keywords, headings
3. Technical SEO: URL structure, images, internal linking
4. Google News Compliance: Freshness, accuracy, authority
5. Indexing Issues: Duplicate content, thin content, quality signals

Provide actionable recommendations for each article and overall site improvements.`;

    const userPrompt = `Analyze these ${articlesAnalysis.length} articles from TheBulletinBriefs news website:

${JSON.stringify(articlesAnalysis, null, 2)}

Provide a comprehensive audit report with:
1. Overall Site Score (0-100)
2. Critical Issues (must fix for indexing)
3. High Priority Issues (impact ranking)
4. Medium Priority Issues (improve quality)
5. Low Priority Issues (nice to have)
6. Article-by-Article Analysis (top 5 articles with specific issues)
7. Quick Wins (easy fixes with high impact)
8. Long-term Recommendations

Format as JSON with this structure:
{
  "overallScore": number,
  "summary": "brief overview",
  "criticalIssues": [{ "issue": string, "impact": string, "fix": string }],
  "highPriority": [{ "issue": string, "impact": string, "fix": string }],
  "mediumPriority": [{ "issue": string, "impact": string, "fix": string }],
  "lowPriority": [{ "issue": string, "impact": string, "fix": string }],
  "topArticleIssues": [{ "title": string, "slug": string, "issues": string[], "recommendations": string[] }],
  "quickWins": [{ "action": string, "impact": string, "effort": string }],
  "longTermPlan": [{ "goal": string, "steps": string[], "timeline": string }]
}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const auditReport = JSON.parse(aiData.choices[0].message.content);

    console.log('Audit completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        articlesAnalyzed: articlesAnalysis.length,
        report: auditReport,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error('Audit error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});