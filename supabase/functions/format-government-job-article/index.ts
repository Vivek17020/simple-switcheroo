import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { content, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert government job content writer. Rewrite and format the given content into a professional, SEO-optimized Jobs/Recruitment article.

AUTO-GENERATE the following in your response:
• Perfect SEO Title (50-60 characters)
• Meta Description (150-160 characters)
• Short Excerpt (100-150 characters)
• Auto-extracted Keywords/Tags (comma-separated)
• Clean URL slug

STRUCTURE THE ARTICLE WITH PROPER HTML FORMATTING:
1. Introduction (2-3 crisp lines in <p> tag)
2. Job Summary Table (use <table> with proper headers)
3. Important Dates Table
4. Vacancy Details (Category-wise, Post-wise in tables)
5. Eligibility Criteria (Education, Age Limit with <h3> subheadings)
6. Age Relaxation Table
7. Selection Process (use <ul> or <ol> for steps)
8. Salary & Benefits (Pay Level, Allowances)
9. Application Fee (table format)
10. How to Apply (step-by-step in <ol>)
11. Required Documents (use <ul>)
12. Official Notification PDF link placeholder: <a href="#notification">Download Official Notification PDF</a>
13. Apply Online link placeholder: <a href="#apply">Apply Online Here</a>
14. Important FAQs (use <h3> for questions, <p> for answers)

Use <h2> for main sections and <h3> for subsections. Make tables responsive with proper headers. Keep language professional and highly readable.

Return ONLY valid JSON in this exact format:
{
  "seo_title": "string (50-60 chars)",
  "meta_description": "string (150-160 chars)",
  "excerpt": "string (100-150 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "slug": "url-friendly-slug",
  "formatted_content": "full HTML content with all sections"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Title: ${title}\n\nRaw Content:\n${content}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (!jsonMatch) {
      jsonMatch = aiResponse.match(/```\n?([\s\S]*?)\n?```/);
    }
    
    const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
    const formattedData = JSON.parse(jsonString.trim());

    return new Response(
      JSON.stringify(formattedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in format-government-job-article:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
