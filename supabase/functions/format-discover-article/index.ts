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
    const { content, title, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert Google Discover optimization specialist. Your job is to transform articles to maximize their chances of appearing in Google Discover.

GOOGLE DISCOVER RANKING FACTORS TO OPTIMIZE:
1. **Title (40-59 characters ideal)**: Must trigger curiosity + emotion. Use power words like "Reveals", "Shocking", "Breaking", "Secret", "Finally"
2. **E-E-A-T Signals**: Add expert quotes, authority phrases, credible sources
3. **Entity Strength**: Extract and emphasize people, organizations, places, events
4. **Freshness**: Add time-sensitive language ("2024", "Today", "Just Released", "Breaking")
5. **Emotional Appeal**: Use curiosity gaps, surprise elements, urgency
6. **Visual Content**: Recommend compelling image compositions
7. **Key Highlights**: Create scannable bullet points
8. **Readability**: Short paragraphs, subheadings every 2-3 paragraphs

CRITICAL JSON RULES:
- Return ONLY valid JSON, no markdown
- Escape all quotes in HTML content with \\"
- Keep HTML simple: h2, h3, p, ul, li, strong, em, a tags only
- No nested quotes that could break JSON

Return this EXACT JSON structure:

{
  "discover_score": {
    "title_ctr": 0-100,
    "readability": 0-100,
    "freshness": 0-100,
    "entity_strength": 0-100,
    "emotional_appeal": 0-100,
    "eeat_score": 0-100,
    "overall": 0-100
  },
  "optimized_titles": [
    "Title 1 (40-59 chars, high CTR)",
    "Title 2 (curiosity-driven)",
    "Title 3 (emotion-driven)",
    "Title 4 (news-style)",
    "Title 5 (question format)"
  ],
  "meta_descriptions": [
    "Meta 1 (140-155 chars with keyword)",
    "Meta 2 (action-oriented)"
  ],
  "optimized_content": "<h2>Compelling Introduction</h2><p>Opening paragraph with hook...</p><h2>Key Findings</h2><p>Content...</p>",
  "key_highlights": [
    "Key point 1 with specific data",
    "Key point 2 with expert insight",
    "Key point 3 with actionable info",
    "Key point 4 with trending angle",
    "Key point 5 with impact statement"
  ],
  "entities_extracted": ["Person Name", "Organization", "Location", "Event"],
  "image_recommendations": {
    "overlay_text": "Suggested text overlay for image",
    "composition": "Recommended composition style",
    "colors": ["#hex1", "#hex2"]
  },
  "social_pack": {
    "tweet": "Twitter caption under 280 chars with hashtags",
    "instagram": "Instagram caption with emojis and hashtags",
    "whatsapp": "WhatsApp forward-friendly message"
  },
  "discover_checklist": {
    "has_large_image": true/false,
    "title_length_optimal": true/false,
    "has_entities": true/false,
    "has_emotion": true/false,
    "is_fresh": true/false,
    "has_eeat": true/false,
    "has_key_highlights": true/false,
    "mobile_friendly": true/false
  },
  "discover_probability": 0-100,
  "improvement_suggestions": [
    "Suggestion 1",
    "Suggestion 2",
    "Suggestion 3"
  ]
}

CONTENT OPTIMIZATION RULES:
1. Rewrite content to be 800-1200 words
2. Add "Why This Matters" section
3. Include expert-sounding quotes (attributed to "industry experts" or "analysts")
4. Add FAQ section with 3-4 trending questions
5. Use bullet points for key information
6. Add internal linking placeholders like [INTERNAL_LINK:related-topic]
7. Ensure every paragraph is under 3 sentences
8. Add subheadings every 150-200 words`;

    const userPrompt = `Optimize this article for Google Discover:

Title: ${title}
Featured Image URL: ${imageUrl || 'Not provided'}

Article Content:
${content}

Analyze and return the optimized JSON response.`;

    console.log('Sending request to AI gateway...');
    console.log('Content length:', content?.length || 0);
    
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    console.log('AI gateway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('402 Payment Required - Not enough credits');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response length:', aiResponse.length);
    
    // Extract JSON from markdown code blocks if present
    let jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (!jsonMatch) {
      jsonMatch = aiResponse.match(/```\n?([\s\S]*?)\n?```/);
    }
    
    let jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
    jsonString = jsonString.trim();
    
    try {
      const discoverData = JSON.parse(jsonString);
      console.log('✓ JSON parsed successfully');
      console.log('Discover probability:', discoverData.discover_probability);
      
      return new Response(
        JSON.stringify(discoverData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Failed JSON (first 1000 chars):', jsonString.substring(0, 1000));
      
      // Try to fix common JSON issues
      try {
        // Remove any trailing commas before closing brackets
        let fixedJson = jsonString.replace(/,\s*([}\]])/g, '$1');
        // Try parsing again
        const discoverData = JSON.parse(fixedJson);
        console.log('✓ JSON parsed after fix');
        return new Response(
          JSON.stringify(discoverData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch {
        return new Response(
          JSON.stringify({ 
            error: 'AI returned invalid JSON format',
            details: parseError instanceof Error ? parseError.message : 'Parse failed',
            suggestion: 'Please try again - the AI will retry with a cleaner response'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error) {
    console.error('Error in format-discover-article:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
