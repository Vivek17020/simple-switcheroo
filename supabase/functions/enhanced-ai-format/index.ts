import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, content, title, articleId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Enhanced prompts with SEO keyword optimization
    if (task === 'format') {
      systemPrompt = `You are a professional news article editor and SEO expert. Your task is to format raw content into a well-structured, SEO-optimized HTML article.

CRITICAL SEO REQUIREMENTS:
1. KEYWORD OPTIMIZATION:
   - Identify the primary keyword from the title (2-4 word phrase)
   - Include primary keyword in first 100 words
   - Use primary keyword and variations in 60%+ of H2 headings
   - Add keyword variations throughout (3-5% density)
   - Include LSI (semantic) keywords related to the topic

2. HEADING STRUCTURE:
   - Use H2 for main sections (4-6 per article)
   - At least 60% of H2 tags must contain primary keyword or variations
   - Use H3 for subsections
   - Create FAQ section with H3 questions (format: "How...", "What...", "Why...")
   
3. CONTENT OPTIMIZATION:
   - First paragraph must contain primary keyword
   - Minimum 1200 words for competitive keywords
   - Add keyword-rich image alt text suggestions in comments
   - Natural keyword placement (avoid stuffing)

4. FORMATTING:
   - Use <p> tags for paragraphs
   - Use <strong> for emphasis (include keywords when natural)
   - Use bullet points <ul><li> for lists
   - Add proper spacing

Return ONLY the formatted HTML content with no wrapper tags or explanations.`;
      
      userPrompt = `Format this content into an SEO-optimized article:

Title: ${title || 'No title provided'}

Content:
${content}

Remember: Include primary keyword from title in first paragraph and 60%+ of H2 headings.`;
    }
    else if (task === 'humanize') {
      systemPrompt = 'You are an expert content humanizer. Transform AI-generated or robotic text into natural, engaging human writing while preserving the core message and SEO keywords. Make it conversational, add personality, but maintain keyword placement. Return ONLY the humanized HTML content.';
      userPrompt = `Humanize this content while keeping SEO keywords intact:\n\n${content}`;
    }
    else if (task === 'seo-optimize') {
      systemPrompt = `You are an SEO optimization specialist. Your task is to enhance content for search engine rankings.

OPTIMIZATION CHECKLIST:
1. Primary keyword in first 100 words ✓
2. Primary keyword in 60%+ of H2 headings ✓
3. Add LSI keywords (semantic variations)
4. Optimize heading hierarchy
5. Add FAQ section with questions
6. Keyword density 3-5%
7. Improve readability
8. Add keyword-rich subheadings

Return ONLY the optimized HTML content with improved SEO structure.`;
      userPrompt = `SEO optimize this article. Title: ${title}\n\nContent:\n${content}`;
    }
    else if (task === 'extract-keywords') {
      systemPrompt = 'You are an SEO keyword extraction expert. Extract the most important keywords from the article including primary keyword, secondary keywords, and LSI keywords. Return as JSON.';
      userPrompt = `Extract SEO keywords from this article:\n\nTitle: ${title}\n\nContent: ${content}`;
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid task type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const result = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced-ai-proxy:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
