import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, articleId } = await req.json();
    
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use AI to generate advanced keyword analysis with competitive intelligence
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an advanced SEO expert with deep knowledge of search engine algorithms and competitive analysis. Analyze the article and return ONLY a JSON object with this exact structure:

{
  "primary_keyword": "main 2-4 word keyword phrase",
  "secondary_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "lsi_keywords": {
    "core_terms": ["semantic1", "semantic2", "semantic3", "semantic4", "semantic5", "semantic6", "semantic7", "semantic8", "semantic9", "semantic10"],
    "entity_keywords": ["person1", "organization1", "place1", "brand1", "product1"],
    "temporal_keywords": ["2025", "latest", "updated", "recent", "current"],
    "action_keywords": ["how to", "guide to", "steps to", "ways to", "tips for", "best practices"]
  },
  "target_queries": ["query1", "query2", "query3", "query4", "query5", "query6", "query7", "query8", "query9", "query10"],
  "long_tail_opportunities": ["specific phrase 1", "specific phrase 2", "specific phrase 3", "specific phrase 4", "specific phrase 5"],
  "question_keywords": ["How does X work?", "What is the best Y?", "Why should I Z?", "When to use X?", "Where to find Y?"],
  "search_intent": "informational|commercial|transactional|navigational",
  "keyword_difficulty": "easy|medium|hard",
  "content_gaps": ["Missing subtopic 1", "Missing subtopic 2", "Missing comparison with X", "Add section about Y"],
  "keyword_density": 3.5,
  "competitor_insights": {
    "avg_word_count": 1800,
    "common_headings": ["Common H2 1", "Common H2 2", "Common H2 3"],
    "missing_topics": ["Topic X", "Topic Y"]
  },
  "recommendations": [
    "Add primary keyword to first sentence (currently missing)",
    "Include 'how to' question in H2 for featured snippet opportunity",
    "Add comparison table for commercial intent keywords",
    "Expand content to 1500+ words to match competitor average",
    "Include FAQ section with 5+ questions",
    "Add internal links with keyword anchor text"
  ]
}

CRITICAL ANALYSIS REQUIREMENTS:

1. **PRIMARY KEYWORD** (2-4 words):
   - Extract the main topic/focus from the title
   - Should be searchable and have commercial/informational value

2. **SECONDARY KEYWORDS** (8 variations):
   - Plural/singular forms
   - Synonym variations
   - Related phrases
   - Long-tail variations

3. **LSI KEYWORDS** (20-30 total, grouped):
   - **core_terms**: 10+ semantically related terms (context words)
   - **entity_keywords**: 5+ proper nouns (people, brands, places, organizations)
   - **temporal_keywords**: 5+ time-related terms (2025, latest, updated, recent)
   - **action_keywords**: 5+ action phrases (how to, guide to, steps to)

4. **TARGET QUERIES** (10+ search queries):
   - What users would actually type into Google
   - Include question-based queries
   - Mix of short and long-tail

5. **LONG-TAIL OPPORTUNITIES** (5+ phrases):
   - 3-5 word specific phrases with lower competition
   - More specific than primary keyword
   - Natural language queries

6. **QUESTION KEYWORDS** (5+ questions):
   - Format for featured snippets
   - Start with: How, What, Why, When, Where, Which
   - Based on "People Also Ask" patterns

7. **SEARCH INTENT** (classify as one):
   - **informational**: User wants to learn/understand
   - **commercial**: User researching before purchase
   - **transactional**: User ready to buy/take action
   - **navigational**: User looking for specific site/brand

8. **KEYWORD DIFFICULTY**:
   - **easy**: Niche topic, low competition, <500 word content ranks
   - **medium**: Moderate competition, need 1000-1500 words + good SEO
   - **hard**: High competition, need 2000+ words + authority + backlinks

9. **CONTENT GAPS** (4+ missing elements):
   - Identify what top-ranking articles have that this content lacks
   - Suggest missing subtopics, comparisons, examples
   - Point out structural improvements

10. **COMPETITOR INSIGHTS**:
    - Estimate average word count of top 10 results
    - Identify common H2 headings across top articles
    - List topics competitors cover but this article doesn't

11. **KEYWORD DENSITY**: Calculate as percentage (target: 3-5%)

12. **RECOMMENDATIONS** (6-10 actionable items):
    - Prioritize by impact (high-impact items first)
    - Be specific and actionable
    - Focus on quick wins for ranking improvements

Return ONLY the JSON object, no explanations or markdown.`
          },
          {
            role: 'user',
            content: `Perform comprehensive SEO keyword analysis with competitive intelligence for this article:

TITLE: ${title}

CONTENT: ${content.substring(0, 5000)}

Provide deep analysis including search intent, keyword difficulty, LSI keyword grouping (20-30 total), long-tail opportunities, content gaps, and competitive insights. Focus on actionable recommendations for first-page rankings.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI keyword analysis');
    }

    // If articleId provided, update the article with keyword data
    if (articleId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Flatten LSI keywords for database storage
      const allLsiKeywords = [
        ...(analysis.lsi_keywords?.core_terms || []),
        ...(analysis.lsi_keywords?.entity_keywords || []),
        ...(analysis.lsi_keywords?.temporal_keywords || []),
        ...(analysis.lsi_keywords?.action_keywords || [])
      ];

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          primary_keyword: analysis.primary_keyword,
          secondary_keywords: analysis.secondary_keywords,
          lsi_keywords: allLsiKeywords,
          target_queries: analysis.target_queries,
          keyword_density: analysis.keyword_density,
        })
        .eq('id', articleId);

      if (updateError) {
        console.error('Failed to update article:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          primaryKeyword: analysis.primary_keyword,
          secondaryKeywords: analysis.secondary_keywords,
          lsiKeywords: analysis.lsi_keywords,
          targetQueries: analysis.target_queries,
          longTailOpportunities: analysis.long_tail_opportunities || [],
          questionKeywords: analysis.question_keywords || [],
          searchIntent: analysis.search_intent || 'informational',
          keywordDifficulty: analysis.keyword_difficulty || 'medium',
          contentGaps: analysis.content_gaps || [],
          keywordDensity: analysis.keyword_density,
          competitorInsights: analysis.competitor_insights || {},
          recommendations: analysis.recommendations || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-keywords:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
