import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    
    if (!content || !title) {
      throw new Error('Content and title are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert Web3/Blockchain technical content analyzer. Your task is to analyze article content and determine where code examples would significantly improve understanding.

ANALYSIS CRITERIA:
- Identify sections discussing smart contracts, protocols, or technical implementations
- Look for explanations of Web3 concepts that would benefit from code examples
- Detect discussions about blockchain transactions, APIs, or development patterns
- Find areas explaining DeFi mechanisms, NFT implementations, or DAO structures

CODE INSERTION RULES:
1. Only suggest code where it adds significant educational value
2. Code should be practical, working examples (Solidity, JavaScript, Python, Rust)
3. Each code block should be 10-30 lines maximum
4. Include inline comments explaining key concepts
5. Match the language to the blockchain/framework being discussed

RESPONSE FORMAT:
Return a JSON array of code insertions. Each insertion should have:
{
  "position": "after_paragraph_containing_text",
  "searchText": "unique text snippet from paragraph (20-50 chars)",
  "language": "solidity|javascript|python|rust|typescript",
  "code": "actual code with comments",
  "explanation": "1-2 sentence explanation of why this code helps"
}

IMPORTANT:
- Only suggest 2-4 code insertions maximum per article
- Choose the most impactful locations
- Ensure searchText is unique enough to find the right paragraph
- If no code examples are needed, return an empty array []`;

    console.log('Analyzing Web3 content for code insertion opportunities...');

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
          { role: 'user', content: `Analyze this Web3 article and suggest code insertions:\n\nTitle: ${title}\n\nContent:\n${content}` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to your workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI Gateway Error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let responseContent = aiData.choices[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '');
    }

    let codeInsertions;
    try {
      codeInsertions = JSON.parse(responseContent.trim());
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      codeInsertions = [];
    }

    console.log(`Analysis complete. Found ${codeInsertions.length} code insertion opportunities`);

    return new Response(JSON.stringify({ 
      codeInsertions,
      analysisComplete: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analyze Web3 content error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to analyze content',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
