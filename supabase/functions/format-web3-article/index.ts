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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Search for related Web3 articles for interlinking
    const { data: relatedArticles } = await supabaseClient
      .from('articles')
      .select('id, title, slug')
      .eq('published', true)
      .or('category_id.eq.web3,tags.cs.{"web3","blockchain","defi","smart-contracts"}')
      .limit(10);

    const relatedArticlesList = relatedArticles?.map(a => `- ${a.title} (slug: ${a.slug})`).join('\n') || 'No related articles found';

    const systemPrompt = `You are an expert technical content writer specializing in Web3/Blockchain education. Your task is to transform raw article content into a professionally structured GeeksforGeeks-style article optimized for blockchain topics.

CRITICAL STRUCTURE REQUIREMENTS:

1. **SEO-Optimized H1 Title** (single, keyword-rich)
2. **Brief Introduction** (2-3 sentences explaining what the article covers)
3. **Table of Contents** (auto-generated from all H2 headings)
4. **Main Content with H2 & H3 Headings** (hierarchical structure)
5. **Bullet Points & Numbered Lists** (for steps and features)
6. **Note/Tip Boxes** (use blockquote format with 💡 emoji)
7. **Code Blocks** (for Smart Contract examples with language tags)
8. **Examples & Use Cases** (practical scenarios)
9. **Highlighted Definitions** (use bold for key terms first mention)
10. **Conclusion Section** (H2: "Conclusion")
11. **FAQ Section** (H2: "Frequently Asked Questions" with 4-6 Q&A pairs)
12. **Related Articles** (H2: "Related Articles" - use provided list)

TONE & STYLE REQUIREMENTS:
- Beginner-friendly, student-oriented language
- Clear explanations with Web3 examples (Ethereum, Polkadot, TON, Aptos, Solana, DeFi, NFTs, DAOs, etc.)
- Each concept explained with bullets + practical examples
- Use analogies when explaining complex blockchain concepts
- Conversational yet professional tone

INTERNAL LINKING STRATEGY:
Available related articles for natural interlinking:
${relatedArticlesList}

When formatting content:
- Insert 5-7 internal links naturally within paragraphs
- Use descriptive anchor text (not "click here" or raw URLs)
- Link format: <a href="/web3forindia/article/[slug]">anchor text</a>
- Distribute links evenly throughout the article
- CRITICAL: All internal links MUST use the /web3forindia/article/ prefix

CODE BLOCK FORMAT:
\`\`\`solidity
// Your smart contract code here
\`\`\`

NOTE BOX FORMAT:
> 💡 **Note:** Important information here

TIP BOX FORMAT:
> ✨ **Tip:** Helpful advice here

OUTPUT FORMAT:
Return ONLY valid HTML (no markdown). Use these tags:
- <h1>, <h2>, <h3> for headings
- <p> for paragraphs
- <ul>, <ol>, <li> for lists
- <pre><code class="language-[lang]"> for code blocks
- <blockquote> for notes/tips
- <strong> for bold, <em> for italic
- <a href="/web3forindia/article/[slug]">text</a> for internal links (ALWAYS use /web3forindia/article/ prefix)
- <table> for comparison tables when useful

DO NOT include any explanatory text outside the HTML. Return ONLY the formatted article HTML.`;

    console.log('Calling Lovable AI Gateway for Web3 article formatting...');

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
          { role: 'user', content: `Transform this content into a GeeksforGeeks-style Web3 article:\n\nTitle: ${title}\n\nContent:\n${content}` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
    let formattedContent = aiData.choices[0]?.message?.content || '';

    // Clean up markdown code blocks if present
    if (formattedContent.includes('```html')) {
      formattedContent = formattedContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    } else if (formattedContent.includes('```')) {
      formattedContent = formattedContent.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '');
    }

    console.log('Article formatted successfully');

    return new Response(JSON.stringify({ 
      formattedContent: formattedContent.trim(),
      relatedArticlesCount: relatedArticles?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Format Web3 article error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to format article',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
