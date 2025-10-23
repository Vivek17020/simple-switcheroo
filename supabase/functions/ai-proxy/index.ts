import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  task: 'summary' | 'title' | 'keywords' | 'translation' | 'format-seo-content' | 'humanize-content' | 'seo-optimize' | 'bold-keywords' | 'extract-tags' | 'format-and-extract-all' | 'format-cricket'
  content: string
  title?: string
  targetLanguage?: string
}

async function callLovableAI(prompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant for content generation and SEO optimization.' },
        { role: 'user', content: prompt }
      ],
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded, please try again later.')
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.')
    }
    const errorText = await response.text()
    console.error('AI gateway error:', response.status, errorText)
    throw new Error('AI gateway error')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { task, content, title, targetLanguage }: AIRequest = await req.json()

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: task' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result

    console.log(`Processing AI task: ${task} for content length: ${content.length}`)

    switch (task) {
      case 'summary':
        try {
          const summaryPrompt = `Summarize the following content in 2-3 sentences (50-150 words). Be concise and capture the main points:\n\n${content.slice(0, 2000)}`
          const summary = await callLovableAI(summaryPrompt)
          result = { summary: summary.trim() }
        } catch (error) {
          console.error('Summary error:', error)
          throw new Error('Failed to generate summary')
        }
        break

      case 'title':
        try {
          const titlePrompt = `Generate 3 compelling news article titles for the following content. Each title should be 5-15 words, engaging, and newsworthy. Return ONLY the 3 titles, one per line, without numbering:\n\n${content.slice(0, 1000)}`
          const titlesText = await callLovableAI(titlePrompt)
          const titles = titlesText.split('\n').filter(t => t.trim()).slice(0, 3)
          result = { titles }
        } catch (error) {
          console.error('Title generation error:', error)
          throw new Error('Failed to generate titles')
        }
        break

      case 'keywords':
        try {
          const keywordPrompt = `Extract 5-10 important keywords or phrases from this content. Return ONLY the keywords, one per line:\n\n${content.slice(0, 1000)}`
          const keywordsText = await callLovableAI(keywordPrompt)
          const keywords = keywordsText.split('\n').filter(k => k.trim()).slice(0, 10)
          result = { keywords }
        } catch (error) {
          console.error('Keyword extraction error:', error)
          const simpleKeywords = content
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 4)
            .slice(0, 10)
          result = { keywords: simpleKeywords }
        }
        break

      case 'translation':
        try {
          if (targetLanguage === 'hi') {
            const translationPrompt = `Translate the following text from English to Hindi. Maintain the meaning and tone:\n\n${content.slice(0, 2000)}`
            const translation = await callLovableAI(translationPrompt)
            result = { translation: translation.trim() }
          } else {
            throw new Error('Unsupported target language')
          }
        } catch (error) {
          console.error('Translation error:', error)
          throw new Error('Failed to translate content')
        }
        break

      case 'format-seo-content':
        try {
          const prompt = `You are an SEO content editor. Rewrite the following article to sound 100% human and natural.

REQUIREMENTS:
- Keep all original facts intact
- Format properly with HTML headings (<h2> and <h3>)
- Wrap main keywords and important phrases in <strong> tags
- Add internal link suggestions using this format: <a href="[internal-link-placeholder]">keyword</a>
- Add image placeholders as HTML comments: <!-- image: topic_keyword -->
- Use proper paragraph tags (<p>)
- Create bullet lists using <ul> and <li> tags where appropriate
- Make it engaging and easy to read
- Ensure proper structure with introduction, body, and conclusion sections

Return ONLY the formatted HTML content without any explanations.

ORIGINAL CONTENT:
${content}

FORMATTED SEO-OPTIMIZED CONTENT:`

          const formattedContent = await callLovableAI(prompt)
          
          let finalContent = formattedContent.trim()
          
          if (!finalContent.includes('<h2>') && !finalContent.includes('<h3>')) {
            finalContent = `<h2>Introduction</h2>\n\n${finalContent}`
          }
          
          result = { result: finalContent }
        } catch (error) {
          console.error('Content formatting error:', error)
          const basicFormatted = content
            .split('\n\n')
            .map(para => para.trim())
            .filter(para => para.length > 0)
            .map(para => {
              if (para.length < 100 && !para.endsWith('.') && !para.endsWith('!') && !para.endsWith('?')) {
                return `<h2>${para}</h2>`
              }
              return `<p>${para}</p>`
            })
            .join('\n\n')
          
          result = { result: `<!-- image: article_hero -->\n\n${basicFormatted}\n\n<!-- image: article_conclusion -->` }
        }
        break

      case 'humanize-content':
        try {
          const humanizePrompt = `You are a professional human writer. Rewrite this article to be 99% human-written and pass Google's AI detection.

CRITICAL REQUIREMENTS:
1. Write like a real journalist - use personal observations, varied vocabulary, unexpected transitions
2. Mix short punchy sentences with longer flowing ones naturally
3. Add subtle imperfections: contractions, occasional informal phrasing, rhetorical questions
4. Use active voice predominantly, include occasional idioms or colloquialisms where appropriate
5. Show personality - add subtle opinions, human perspectives, real-world examples
6. Avoid AI patterns: no lists everywhere, no perfect symmetry, no repetitive structure
7. Keep all HTML tags (<h2>, <h3>, <p>, <strong>, <a>, etc.) exactly as they are
8. Preserve ALL factual information and data
9. Return ONLY the HTML content without markdown code fences or explanations

Write as if you're a real person sharing knowledge, not an AI generating content. Make it natural, engaging, and authentically human.

Content to humanize:
${content}

Humanized HTML (no code fences):`

          const humanized = await callLovableAI(humanizePrompt)
          
          // Strip any code fences that might be present
          let cleaned = humanized.trim()
          cleaned = cleaned.replace(/^```html\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          result = { result: cleaned }
        } catch (error) {
          console.error('Humanize content error:', error)
          throw new Error('Failed to humanize content')
        }
        break

      case 'seo-optimize':
        try {
          const seoPrompt = `Analyze the following article and optimize it for SEO by replacing weak words/phrases with stronger, more searchable alternatives.

RULES:
1. Replace generic terms with specific, keyword-rich alternatives
2. Improve readability score by simplifying complex sentences
3. Add relevant LSI keywords naturally
4. Optimize heading hierarchy and keyword placement
5. Keep all HTML structure and tags intact
6. Maintain the original meaning and flow
7. Return ONLY the HTML without code fences or explanations

Content to optimize:
${content}

SEO-optimized HTML:`

          const optimized = await callLovableAI(seoPrompt)
          result = { result: optimized.trim() }
        } catch (error) {
          console.error('SEO optimize error:', error)
          throw new Error('Failed to optimize content for SEO')
        }
        break

      case 'bold-keywords':
        try {
          const boldPrompt = `Analyze the following HTML article and identify important keywords that should be bolded for emphasis and SEO.

RULES:
1. Bold 5-15 important keywords/phrases throughout using <strong> tags
2. Focus on: main topics, important concepts, technical terms, key benefits
3. Don't over-bold - keep it natural and readable
4. Avoid bolding entire sentences or common words
5. Keep all existing HTML structure intact
6. Don't bold words already inside <strong> or <b> tags
7. Return ONLY the HTML without code fences or explanations

Content:
${content}

HTML with keywords bolded:`

          const bolded = await callLovableAI(boldPrompt)
          result = { result: bolded.trim() }
        } catch (error) {
          console.error('Bold keywords error:', error)
          throw new Error('Failed to bold keywords')
        }
        break

      case 'extract-tags':
        try {
          const textToAnalyze = title ? `${title}\n\n${content}` : content
          const extractPrompt = `Extract 8-15 relevant SEO tags/keywords from the following article content. 

RULES:
1. Focus on main topics, entities, concepts, and themes
2. Use lowercase, single or multi-word phrases
3. Prioritize specific, searchable terms over generic words
4. Return ONLY the tags as a comma-separated list, nothing else
5. No numbering, no explanations, just: tag1, tag2, tag3

Content to analyze:
${textToAnalyze.slice(0, 3000)}

Tags (comma-separated):`

          const tagsText = await callLovableAI(extractPrompt)
          const tags = tagsText
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0 && t.length < 50)
            .slice(0, 15)
          
          result = { result: tags }
        } catch (error) {
          console.error('Extract tags error:', error)
          throw new Error('Failed to extract tags')
        }
        break

      case 'format-and-extract-all':
        try {
          const allInOnePrompt = `You are an expert SEO content editor. Analyze and process the following article content to extract ALL the following information in a single response.

RETURN ONLY A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Compelling 5-15 word article title",
  "excerpt": "Engaging excerpt under 300 characters that captures the main points",
  "meta_title": "SEO-optimized title (max 60 characters)",
  "meta_description": "SEO-optimized description (120-160 characters) with target keyword",
  "tags": ["tag1", "tag2", "tag3"],
  "formatted_content": "Full SEO-formatted HTML content with proper structure"
}

REQUIREMENTS:
- Title: Compelling, newsworthy, 5-15 words
- Excerpt: Under 300 characters, captures main points concisely
- Meta Title: Max 60 chars, includes main keyword
- Meta Description: 120-160 chars, includes keyword naturally
- Tags: 8-15 lowercase, specific, searchable terms
- Formatted Content: 
  * Proper HTML headings (<h2>, <h3>)
  * Main keywords wrapped in <strong> tags
  * Proper paragraph tags (<p>)
  * Bullet lists with <ul> and <li> where appropriate
  * Internal link placeholders: <a href="[internal-link-placeholder]">keyword</a>
  * Image placeholders: <!-- image: topic_keyword -->
  * Human-readable, grammatically correct, SEO-optimized

CONTENT TO PROCESS:
${content.slice(0, 5000)}

JSON OUTPUT (no code fences):`

          const response = await callLovableAI(allInOnePrompt)
          
          // Clean any potential code fences
          let cleaned = response.trim()
          cleaned = cleaned.replace(/^```json\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          const parsed = JSON.parse(cleaned)
          
          result = {
            title: parsed.title || '',
            excerpt: parsed.excerpt || '',
            meta_title: parsed.meta_title || '',
            meta_description: parsed.meta_description || '',
            tags: parsed.tags || [],
            formatted_content: parsed.formatted_content || content
          }
        } catch (error) {
          console.error('Format and extract all error:', error)
          throw new Error('Failed to format and extract all fields')
        }
        break

      case 'format-cricket':
        try {
          const cricketPrompt = `You are a professional cricket news editor. Format the following raw cricket match notes into a complete, polished match report like those on ESPN Cricinfo, Cricbuzz, or NDTV Sports.

FORMATTING STRUCTURE:

1. **Headline**: Short and impactful (team names + outcome)
2. **Subheadline / Opening Summary**: 1–2 sentences with final scores and key performers
3. **Quick Summary**: Bullet points with 3–5 key takeaways (top scorers, wickets, turning points)
4. **Match Narrative**: Paragraphs detailing how match unfolded - batting innings, bowling spells, turning points, partnerships, collapses, momentum shifts
5. **Top Performers**: Highlight top batsmen and bowlers
6. **Post-Match Context**: Series/tournament implications and upcoming fixtures
7. **Quotes**: If any quotes included, format cleanly with attribution

STYLE GUIDELINES:
- Neutral journalistic tone
- Professional news writing
- Use HTML formatting: <h2>, <h3>, <p>, <strong>, <ul>, <li>
- Bold key player names and scores using <strong>
- Proper paragraph structure
- Return ONLY the formatted HTML without code fences

RAW MATCH NOTES:
${content}

FORMATTED CRICKET MATCH REPORT (HTML only, no code fences):`

          const formattedReport = await callLovableAI(cricketPrompt)
          
          // Clean any code fences
          let cleaned = formattedReport.trim()
          cleaned = cleaned.replace(/^```html\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          result = { result: cleaned }
        } catch (error) {
          console.error('Cricket format error:', error)
          throw new Error('Failed to format cricket match report')
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid task type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    console.log(`AI task ${task} completed successfully`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-proxy function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})