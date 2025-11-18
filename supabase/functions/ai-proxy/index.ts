import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  task: 'summary' | 'title' | 'keywords' | 'translation' | 'format-seo-content' | 'humanize-content' | 'seo-optimize' | 'bold-keywords' | 'extract-tags' | 'format-and-extract-all' | 'format-cricket' | 'format-as-news' | 'format-as-listicle' | 'format-as-scheme' | 'format-as-sports' | 'suggest-external-links'
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
          const seoPrompt = `You are an expert SEO specialist optimizing content following Google Search Essentials and GeeksforGeeks standards. Analyze and enhance the following article for maximum search engine visibility and user engagement.

CRITICAL SEO OPTIMIZATION CHECKLIST:

1. **Meta Information**
   - Generate meta title (under 60 chars) with primary keyword naturally placed
   - Generate meta description (under 160 chars) with keyword + clear CTA
   - Add as HTML comments at the top: <!-- META_TITLE: ... --> and <!-- META_DESCRIPTION: ... -->

2. **Keyword Strategy**
   - Identify 3-5 primary and LSI/related keywords from content
   - Ensure main keyword appears in:
     * Title (H1) - naturally, not forced
     * First 100 words of content
     * 1-2 H2 headings
     * Meta description
   - Integrate synonyms and LSI terms naturally for semantic SEO
   - Target keyword density: 1.2-2% (natural, not stuffed)

3. **Content Optimization**
   - Fix passive voice if exceeds 20% - convert to active voice
   - Shorten paragraphs longer than 3 lines for better readability
   - Add internal linking opportunities with format: <a href="[internal-link-placeholder]">anchor text with keyword</a>
   - Include natural phrases like "Also read:", "Learn more about [keyword]", "Explore [related topic]"
   - Ensure content flows naturally - never sacrifice readability for SEO

4. **Heading Hierarchy**
   - Verify proper H1 → H2 → H3 sequence (never skip levels)
   - Ensure H1 contains primary keyword
   - Make H2s descriptive and keyword-rich where natural
   - Add missing H2s for major sections if needed
   - Every H2 should have id attribute for anchor linking

5. **Image Optimization**
   - For every <!-- image: ... --> placeholder, add descriptive alt text below it
   - Format: <!-- image: topic_keyword --> <!-- alt: "Descriptive keyword-rich alt text for accessibility and SEO" -->
   - Alt text should describe the image AND include relevant keywords naturally

6. **Readability Enhancements**
   - Use transition words and phrases
   - Break up long sentences (max 20-25 words per sentence)
   - Use bullet points (<ul>) and numbered lists (<ol>) for scannable content
   - Add <blockquote> for important tips or key takeaways

7. **Schema Markup Preparation**
   - If article has FAQ section, add JSON-LD schema as HTML comment at the end:
   <!-- FAQ_SCHEMA: {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[...]} -->

8. **Final Quality Check**
   - Keyword density: 1.2-2% for primary keyword
   - Passive voice: <20%
   - Average paragraph length: 2-3 lines
   - Internal linking: 3-5 contextual links
   - All headings properly structured
   - Image alt texts present for all images

TONE & APPROACH:
- Keep it educational, authoritative, and natural
- NEVER sacrifice readability for keyword placement
- Avoid obvious keyword stuffing or repetitive phrases
- Make content genuinely valuable and informative
- Optimize for humans first, search engines second

OUTPUT REQUIREMENTS:
- Return ONLY the optimized HTML content
- Include meta tags as HTML comments at the top
- Include FAQ schema as HTML comment at the bottom (if applicable)
- No code fences, no markdown, no explanations
- Keep all existing HTML structure intact

CONTENT TO OPTIMIZE:
${content}

OPTIMIZED HTML (with meta comments and schema):`

          const optimized = await callLovableAI(seoPrompt)
          
          // Clean any code fences
          let cleaned = optimized.trim()
          cleaned = cleaned.replace(/^```html\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          result = { result: cleaned }
        } catch (error) {
          console.error('SEO optimize error:', error)
          throw new Error('Failed to optimize content for SEO')
        }
        break

      case 'format-as-news':
        try {
          const newsPrompt = `You are a senior news editor formatting content into a professional journalistic article following NDTV / Times of India / The Hitavada standards with advanced SEO optimization for partial keyword ranking.

RETURN A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Short, impactful news headline (5-12 words, under 60 characters)",
  "excerpt": "Concise summary capturing the main story (120-160 characters)",
  "meta_title": "SEO-optimized title (max 60 characters)",
  "meta_description": "Factual summary for search engines (max 160 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content": "Full HTML article content (see structure below)"
}

SEMANTIC KEYWORD DISTRIBUTION FOR NEWS (CRITICAL):

1. **Primary Keyword & Variations**
   - Extract main keyword from title/content
   - Generate 5-8 news-specific variations
   - Example: "Budget 2026" → "union budget", "budget announcement", "finance ministry budget", "budget allocation"
   - Distribute in: headline, subheadline, first paragraph, 2 body paragraphs, conclusion

2. **LSI Keywords for News (15-20 keywords)**
   - Core Terms (5-7): Event, announcement, report, update, statement
   - Entity Keywords (4-6): Organizations, officials, locations, ministries
   - Action Keywords (2-3): Announces, reveals, launches, implements
   - Temporal Keywords (2-3): Today, 2026, latest, breaking
   - Context Keywords (2-3): Impact, implications, significance

3. **Heading Optimization**
   - Subheadline (H2): Include keyword variation different from main headline
   - Body H2s (if long article): Use partial keywords and question-based headings

ARTICLE STRUCTURE (for the "content" field):

1. **Subheadline (H2)** — Quick summary with keyword variation
   - Who, what, when in concise form
   - Must include primary keyword variation (different from title)
   - Example: <h2>Ministry Announces Budget Allocation for 2026</h2>

2. **Intro Paragraph** — Lead paragraph answering 5 W's
   - MUST include primary keyword in first sentence
   - Who, What, When, Where, Why
   - Most important information first (inverted pyramid)
   - 2-3 sentences maximum
   - Include 2-3 LSI keywords naturally

3. **Body Paragraphs** — 3-5 short paragraphs
   - Each paragraph: 2-3 lines only
   - One idea per paragraph
   - Use active voice throughout
   - Include facts, data, context with entity keywords
   - Integrate LSI keywords naturally (1-2 per paragraph)
   - Chronological or importance-based order

4. **Quote Section (if applicable)**
   - Add relevant quote from authority, official, or data source
   - Format: <blockquote>"Quote text here with keyword variation" - Source Name, Title</blockquote>

5. **Quick Facts Box (NEW - MANDATORY)**
   - Add a facts box with key information using entity keywords:
   <div class="news-quick-facts">
     <h3>Quick Facts</h3>
     <ul>
       <li><strong>Event:</strong> [Primary keyword]</li>
       <li><strong>Date:</strong> [Temporal keyword]</li>
       <li><strong>Authority:</strong> [Entity keyword]</li>
       <li><strong>Impact:</strong> [Context keyword]</li>
     </ul>
   </div>

6. **Related Stories Section (with internal links)**
   - Add "Related Stories:" section with 3-5 internal link placeholders
   - Use partial keyword variations as anchor text
   - Format: 
   <div class="related-stories">
     <h3>Related Stories</h3>
     <ul>
       <li><a href="[INTERNAL:related-1]">Keyword Variation Story Title</a></li>
       <li><a href="[INTERNAL:related-2]">Another Keyword Variation</a></li>
       <li><a href="[INTERNAL:related-3]">Third Related Topic</a></li>
     </ul>
   </div>

7. **People Also Ask (if article >300 words)**
   <div class="news-paa">
     <h3>People Also Ask</h3>
     <h4>What is [primary keyword]?</h4>
     <p>Brief 1-2 line answer...</p>
     <h4>When will [keyword variation] happen?</h4>
     <p>Brief answer...</p>
     [3-5 questions total]
   </div>

8. **Conclusion** — Wrap-up or next steps
   - 1-2 lines
   - Future implications or ongoing developments
   - Include primary keyword + LSI keyword

IMAGE OPTIMIZATION:
- For any image references: <!-- image: news_topic_keyword --> <!-- alt: "Descriptive news image with keyword" -->

TONE & STYLE:
- Newsroom tone: neutral, objective, factual
- Active voice (avoid passive constructions)
- Short sentences (15-20 words average)
- No opinion or editorial bias
- Crisp, professional language
- Present tense for recent events, past tense for completed actions

KEYWORD DISTRIBUTION CHECKLIST (NEWS):
✓ Primary keyword in: Headline (H1), subheadline (H2), first sentence, meta title
✓ Keyword variation in: Subheadline, body paragraphs, conclusion
✓ 15-20 LSI keywords distributed across all paragraphs
✓ Entity keywords in: Intro, quotes, quick facts, body
✓ Question keywords in: "People Also Ask" section
✓ Partial keyword variations in: Related stories anchor texts
✓ Temporal keywords in: Dates, timestamps, quick facts
✓ Keyword density: 1.5-2.0% (natural, news-appropriate)

METADATA REQUIREMENTS:
- Title: Short, impactful, 5-12 words, under 60 characters with primary keyword
- Excerpt: 120-160 characters capturing main story with LSI keywords
- Meta Title: Max 60 chars, SEO-optimized with primary keyword
- Meta Description: Max 160 chars with keyword + LSI keywords + impact/benefit
- Tags: 5-8 lowercase tags covering all keyword variations

CONTENT DEPTH (NEWS):
- Target: 400-800 words for breaking news, 800-1500 for detailed coverage
- 3-5 body paragraphs
- 3-5 internal link opportunities
- Quick Facts box
- Related Stories section
- People Also Ask (3-5 questions) if article >300 words

CONTENT TO FORMAT:
${content}

JSON OUTPUT (no code fences):`

          const formatted = await callLovableAI(newsPrompt)
          
          // Clean any code fences
          let cleaned = formatted.trim()
          cleaned = cleaned.replace(/^```json\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          // Parse the JSON response
          const parsed = JSON.parse(cleaned)
          
          result = { 
            title: parsed.title || '',
            excerpt: parsed.excerpt || '',
            meta_title: parsed.meta_title || parsed.title || '',
            meta_description: parsed.meta_description || parsed.excerpt || '',
            tags: parsed.tags || [],
            result: parsed.content || ''
          }
        } catch (error) {
          console.error('Format as news error:', error)
          throw new Error('Failed to format content as news')
        }
        break

      case 'format-as-listicle':
        try {
          const listiclePrompt = `You are a BuzzFeed/IndiaToday-style listicle writer. Transform the given content into a fun, engaging, SEO-optimized listicle article.

RETURN A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Catchy listicle title (under 60 characters, use numbers)",
  "excerpt": "Brief summary for preview (120-150 characters)",
  "meta_title": "SEO-optimized title (max 60 characters)",
  "meta_description": "Engaging summary for search engines (150-160 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "slug": "url-friendly-slug-of-title",
  "content": "Full HTML article content (see structure below)"
}

LISTICLE STRUCTURE (for the "content" field):

1. **Introduction (2–3 lines)**
   - Hook the reader immediately with a question or bold statement
   - Explain what they'll discover in this list
   - Keep it conversational: use "you", "your", "we"
   - Format: <p>Introduction text here...</p>

2. **Numbered List Items** (Main Content)
   For each item in the list:
   
   <h3>1. Bold, Catchy Title for Item</h3>
   <p>2–4 line description explaining why this item matters. Keep it conversational and engaging. Use active voice.</p>
   <!-- image: descriptive_keyword --> <!-- alt: "Keyword-rich descriptive alt text" -->
   
   Repeat for each list item (minimum 5 items, maximum 15)

3. **Quick Summary Table** (if applicable)
   - Create a comparison table when useful (pros/cons, features, specifications)
   - Use proper HTML table structure
   - Keep it simple and visual
   - Example:
   <table>
     <thead>
       <tr><th>Item</th><th>Key Feature</th><th>Best For</th></tr>
     </thead>
     <tbody>
       <tr><td>Item 1</td><td>Feature</td><td>Use case</td></tr>
     </tbody>
   </table>

4. **Conclusion (2–3 lines)**
   - Wrap up the key takeaway
   - Add a call-to-action or engaging question
   - Example: "Which one will you try first?" or "Let us know in the comments!"
   - Format: <h2>Final Thoughts</h2><p>Conclusion text...</p>

5. **FAQs (Optional, 3–5 questions)**
   - Address common questions related to the topic
   - Keep answers brief (2–3 lines each)
   - Format:
   <h2>Frequently Asked Questions</h2>
   <h3>Question 1?</h3>
   <p>Brief answer here...</p>

STYLE GUIDELINES:
- Friendly, conversational tone (use "you", "your", casual language)
- Short paragraphs (2-3 lines maximum)
- Strong readability with clear numbering
- Use emojis sparingly for emphasis (1-2 maximum, if appropriate)
- Clean heading hierarchy: H1 (auto-added from title) > H2 > H3
- Active voice throughout, avoid jargon
- Make it shareable and engaging

SEO OPTIMIZATION:
- Primary keyword in title, first paragraph, and 2-3 list items
- Natural keyword density (1-2%)
- Include internal linking opportunities: <a href="[link-placeholder]">related topic</a>
- Image ALT text with keywords for every placeholder
- Meta title and description optimized for clicks

TONE EXAMPLES:
✅ "Wondering which option is best? Here are the top 5 picks that won't disappoint!"
✅ "Let's dive into the most surprising facts you never knew about..."
❌ "This article will discuss various aspects of the subject matter"
❌ "In conclusion, one can observe that..."

CONTENT TO FORMAT:
${content}

JSON OUTPUT (no code fences):`

          const formatted = await callLovableAI(listiclePrompt)
          
          // Clean any code fences
          let cleaned = formatted.trim()
          cleaned = cleaned.replace(/^```json\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          // Parse the JSON response
          const parsed = JSON.parse(cleaned)
          
          result = { 
            title: parsed.title || '',
            excerpt: parsed.excerpt || '',
            meta_title: parsed.meta_title || parsed.title || '',
            meta_description: parsed.meta_description || parsed.excerpt || '',
            tags: parsed.tags || [],
            slug: parsed.slug || '',
            result: parsed.content || ''
          }
        } catch (error) {
          console.error('Format as listicle error:', error)
          throw new Error('Failed to format content as listicle')
        }
        break

      case 'format-as-scheme':
        try {
          const schemePrompt = `You are an expert Government Scheme article formatter. Rewrite and format the given content in a clean, SEO-optimized, government-style structure similar to MyGov, PIB, and Sarkari Yojana portals.

RETURN A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Scheme Name + Latest Update (under 60 characters)",
  "excerpt": "Short summary in 25-30 words",
  "meta_title": "SEO title under 60 characters",
  "meta_description": "SEO description 130-155 characters",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "content": "Full HTML article content following government scheme structure"
}

ARTICLE STRUCTURE (for the "content" field):

Follow this exact structure using clean HTML:

<h1>Title of the Scheme + Latest Update</h1>
<p>2–3 line introduction explaining the scheme.</p>

<h2>Table of Contents</h2>

<h2>What is the Scheme?</h2>
<p>Explain what the scheme is.</p>

<h2>Objectives</h2>
<ul>
<li>Objective point 1</li>
<li>Objective point 2</li>
<li>Objective point 3</li>
<li>Objective point 4 (if applicable)</li>
<li>Objective point 5 (if applicable)</li>
</ul>

<h2>Benefits</h2>
<ul>
<li>Benefit point 1</li>
<li>Benefit point 2</li>
<li>Benefit point 3</li>
<li>Benefit point 4 (if applicable)</li>
<li>Benefit point 5 (if applicable)</li>
<li>Benefit point 6 (if applicable)</li>
</ul>

<h2>Eligibility Criteria</h2>
<ul>
<li>Eligibility point 1</li>
<li>Eligibility point 2</li>
<li>Eligibility point 3</li>
<li>Eligibility point 4 (if applicable)</li>
<li>Eligibility point 5 (if applicable)</li>
<li>Eligibility point 6 (if applicable)</li>
</ul>

<h2>Required Documents</h2>
<ul>
<li>Document 1</li>
<li>Document 2</li>
<li>Document 3</li>
<li>Document 4 (if applicable)</li>
<li>Document 5 (if applicable)</li>
<li>Document 6 (if applicable)</li>
</ul>

<h2>How to Apply</h2>
<ol>
<li>Step 1</li>
<li>Step 2</li>
<li>Step 3</li>
<li>Step 4 (if applicable)</li>
<li>Step 5 (if applicable)</li>
</ol>

<h2>Important Dates</h2>
<ul>
<li>Start date (if available)</li>
<li>Last date (if available)</li>
<li>Other important dates</li>
</ul>

<h2>Latest Updates</h2>
<p>Write latest update lines (2-3 sentences).</p>

<h2>Official Website</h2>
<p>Domain name only (no links).</p>

<h2>Conclusion</h2>
<p>Summarize benefits and importance (2-3 sentences).</p>

CRITICAL RULES:
• No fake data - only use information from the provided content
• No broken sentences or jumbled text
• No CSS or inline styles
• Use clean HTML only (<h1>, <h2>, <p>, <ul>, <ol>, <li>)
• Ensure sentences do NOT jumble after publishing
• Maintain clarity, readability, and government tone
• Use formal, official language
• Keep sentences complete and grammatically correct

CONTENT TO FORMAT:
${content}

JSON OUTPUT (no code fences):`

          const formatted = await callLovableAI(schemePrompt)
          
          // Clean any code fences
          let cleaned = formatted.trim()
          cleaned = cleaned.replace(/^```json\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          // Parse the JSON response
          const parsed = JSON.parse(cleaned)
          
          result = { 
            title: parsed.title || '',
            excerpt: parsed.excerpt || '',
            meta_title: parsed.meta_title || parsed.title || '',
            meta_description: parsed.meta_description || parsed.excerpt || '',
            tags: parsed.tags || [],
            result: parsed.content || ''
          }
        } catch (error) {
          console.error('Format as scheme error:', error)
          throw new Error('Failed to format content as government scheme')
        }
        break

      case 'format-as-sports':
        try {
          const sportsPrompt = `You are a professional sports journalist. Format the article into an SEO-rich, clean, and energetic sports news style like ESPNcricinfo, TOI Sports, or Cricbuzz.

RETURN A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Punchy sports headline (under 60 characters)",
  "excerpt": "Strong summary in 25-30 words",
  "meta_title": "SEO title under 60 characters",
  "meta_description": "SEO description 130-155 characters",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "content": "Full HTML article content following sports news structure"
}

ARTICLE STRUCTURE (for the "content" field):

Follow this exact structure using clean HTML:

<h1>Punchy Sports Headline</h1>
<h2>Short Subheadline (1–2 line summary)</h2>
<p>Strong introduction covering score/event/highlight (2-3 sentences).</p>

<h2>Match Highlights</h2>
<ul>
<li>Top moment 1</li>
<li>Top moment 2</li>
<li>Top moment 3</li>
<li>Turning point 1</li>
<li>Turning point 2</li>
</ul>

<h2>Key Player Performances</h2>
<p>Analysis of important players and their contributions (2-3 paragraphs).</p>

<h2>Team Summary</h2>
<p>Summary for Team A performance.</p>
<p>Summary for Team B performance.</p>

<h2>Stats & Records</h2>
<ul>
<li>Milestone 1</li>
<li>Milestone 2</li>
<li>Record 1</li>
<li>Record 2</li>
</ul>

<h2>Reactions</h2>
<p>Coach/player comments (generic quotes allowed if no actual quotes available).</p>

<h2>Upcoming Fixtures</h2>
<ul>
<li>Next match detail 1</li>
<li>Next match detail 2</li>
</ul>

<h2>Conclusion</h2>
<p>Short wrap-up line (1-2 sentences).</p>

CRITICAL RULES:
• HTML must be clean and safe for WordPress/Editor
• No broken paragraphs or sentences
• Keep the tone dynamic and journalistic
• No external links
• Use energetic, exciting language
• No CSS or inline styles
• Maintain proper HTML structure
• Ensure sentences are complete and don't jumble after publishing

CONTENT TO FORMAT:
${content}

JSON OUTPUT (no code fences):`

          const formatted = await callLovableAI(sportsPrompt)
          
          // Clean any code fences
          let cleaned = formatted.trim()
          cleaned = cleaned.replace(/^```json\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          // Parse the JSON response
          const parsed = JSON.parse(cleaned)
          
          result = { 
            title: parsed.title || '',
            excerpt: parsed.excerpt || '',
            meta_title: parsed.meta_title || parsed.title || '',
            meta_description: parsed.meta_description || parsed.excerpt || '',
            tags: parsed.tags || [],
            result: parsed.content || ''
          }
        } catch (error) {
          console.error('Format as sports error:', error)
          throw new Error('Failed to format content as sports article')
        }
        break

      case 'bold-keywords':
        try {
          console.log('Bold keywords - Original content length:', content.length)
          
          // Validate input
          if (!content || content.trim().length < 20) {
            throw new Error('Content too short to bold keywords')
          }
          
          const boldPrompt = `Analyze the following HTML article and identify important keywords that should be bolded for emphasis and SEO.

CRITICAL RULES - READ CAREFULLY:
1. Bold ONLY 5-15 important keywords/phrases using <strong> tags
2. Focus on: main topics, important concepts, technical terms, key benefits
3. You MUST preserve EVERY SINGLE WORD and character from the original content
4. You MUST keep ALL existing HTML tags intact (<p>, <h1>, <h2>, <ul>, <li>, <a>, etc.)
5. Only ADD <strong></strong> tags around specific words - DO NOT remove, modify, or rearrange ANY text
6. Don't bold words already inside <strong> or <b> tags
7. Don't bold entire sentences or common words like "the", "and", "is", "are"
8. Return the COMPLETE article with ALL content intact
9. Return ONLY the HTML without code fences, explanations, or markdown

VERIFICATION CHECKLIST:
- Is EVERY word from the original still present? ✓
- Are ALL HTML tags still there? ✓
- Did you ONLY add <strong> tags without changing anything else? ✓

Content:
${content}

HTML with keywords bolded (COMPLETE article with ALL text preserved):`

          const bolded = await callLovableAI(boldPrompt)
          console.log('Bold keywords - AI response length:', bolded.length)
          
          // Clean any code fences that might be added
          let cleaned = bolded.trim()
          cleaned = cleaned.replace(/^```html\n?/i, '')
          cleaned = cleaned.replace(/^```\n?/i, '')
          cleaned = cleaned.replace(/\n?```$/i, '')
          
          console.log('Bold keywords - Cleaned content length:', cleaned.length)
          
          // Validate output length is similar to input (allow up to 10% difference for <strong> tags)
          const lengthDiff = Math.abs(cleaned.length - content.length)
          const percentDiff = (lengthDiff / content.length) * 100
          
          if (percentDiff > 50) { // If length changed by more than 50%, something went wrong
            console.error('Bold keywords - Length validation failed:', {
              original: content.length,
              cleaned: cleaned.length,
              diff: percentDiff.toFixed(1) + '%'
            })
            throw new Error('Content integrity check failed - significant length change detected')
          }
          
          result = { result: cleaned }
          console.log('Bold keywords - Success')
        } catch (error) {
          console.error('Bold keywords error:', error)
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          throw new Error('Failed to bold keywords: ' + errorMsg)
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
          const allInOnePrompt = `You are an expert SEO content editor following GeeksforGeeks editorial standards with advanced semantic keyword optimization for partial query ranking.

RETURN ONLY A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Compelling 5-15 word article title (breaking-news style if it contains scores/events/updates)",
  "excerpt": "Engaging excerpt under 160 characters that captures the main points",
  "meta_title": "SEO-optimized title (max 60 characters, includes important keywords)",
  "meta_description": "SEO-optimized description (150-160 characters) with target keyword",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Sports|Technology|Politics|Jobs|Education|Entertainment|Business|Health|Science|Other",
  "formatted_content": "Full SEO-formatted HTML content with proper structure"
}

CRITICAL SPACING & CLEANING REQUIREMENTS:
1. ALWAYS maintain proper spaces between all words - NEVER merge words together
2. Remove ALL duplicate or repeated words, phrases, sentences, or paragraphs
3. Fix all grammar, punctuation, and sentence structure errors
4. Maintain proper paragraph spacing - every paragraph must be in separate <p> tags
5. Remove unwanted symbols, broken words, and unnecessary spaces
6. Each sentence should appear only ONCE - eliminate all redundant content

SEMANTIC KEYWORD DISTRIBUTION STRATEGY (CRITICAL FOR PARTIAL QUERY RANKING):

1. **Primary Keyword Extraction & Mapping**
   - Identify the main keyword from title/content
   - Generate 5-10 primary keyword variations
   - Example: "CTET 2026" → "CTET exam", "teacher eligibility test", "NTA CTET", "central TET"
   - Distribute throughout content:
     * First 100 words: Primary keyword (2x) + 2-3 LSI keywords
     * Each H2 section: Primary keyword variation + 3-4 LSI keywords
     * Each paragraph: 1-2 LSI keywords naturally integrated
     * Last 100 words: Primary keyword (1x) + 2-3 LSI keywords
   - Target keyword density: 1.5-2.5% (natural, not stuffed)

2. **LSI Keyword Integration (20-30 keywords total)**
   Generate and distribute these keyword types naturally:
   - Core Terms (8-10): Related to main topic [exam, date, schedule, notification, form, apply]
   - Entity Keywords (5-7): Organizations, brands, people [NTA, CBSE, board, ministry]
   - Action Keywords (3-5): User intent [register, download, check, apply, submit]
   - Temporal Keywords (2-3): Time-related [2026, latest, upcoming, new]
   - Question Keywords (2-3): Search queries [eligibility, pattern, syllabus, how to]

3. **Heading Optimization for Partial Queries (MANDATORY)**
   Each H2 MUST target a DIFFERENT keyword variation:
   - H2 Example 1: "CTET 2026 Exam Date and Schedule" (full primary keyword)
   - H2 Example 2: "How to Apply for CTET Exam Online" (question-based keyword)
   - H2 Example 3: "NTA Teacher Eligibility Test Pattern" (entity + related keyword)
   - H2 Example 4: "CTET Application Form: Registration Process" (partial keyword)
   - H2 Example 5: "Eligibility Criteria for Central TET" (question keyword)
   - Ensure 8-12 H2 sections total, each with unique keyword focus

4. **People Also Ask Section (MANDATORY - Add after intro)**
   <h2 id="people-also-ask">People Also Ask</h2>
   <div class="faq-quick">
     <h3>When is [primary keyword] exam?</h3>
     <p>Brief 2-line answer with keyword variation...</p>
     <h3>How to apply for [keyword variation]?</h3>
     <p>Brief 2-line answer...</p>
     <h3>What is [entity keyword] eligibility?</h3>
     <p>Brief 2-line answer...</p>
     [Include 5-8 questions covering different partial keyword queries]
   </div>

5. **Internal Linking Strategy (5-10 placeholders)**
   Generate contextual internal link opportunities with partial keyword anchors:
   - "Learn more about <a href="[INTERNAL:related-topic-slug]">keyword variation</a>"
   - "Check the complete <a href="[INTERNAL:exam-pattern]">exam pattern and syllabus</a>"
   - "Download <a href="[INTERNAL:admit-card]">admit card details</a>"
   - "Explore <a href="[INTERNAL:preparation-tips]">preparation strategies</a>"
   [Place 5-10 throughout content at natural points]

6. **Semantic Content Clusters**
   For each main section, structure with:
   - Main topic paragraph with primary keyword
   - 2-3 subtopics (H3) with LSI keywords
   - Related terms and synonyms naturally integrated
   - Examples/data with entity keywords
   - Comparison with alternatives (if relevant)

GEEKSFORGEEKS STRUCTURE TEMPLATE (MANDATORY):

1. **Intro Paragraph** (2–3 lines)
   - MUST include primary keyword in first sentence
   - Include 2-3 LSI keywords naturally
   - Format: <p>Intro text here...</p>

2. **Table of Contents** (auto-generated)
   <h2>Table of Contents</h2>
   <ul>
     <li><a href="#section-slug">Section Name with Keyword Variation</a></li>
   </ul>

3. **Main Body**
   - Use <h2> for main topics with id attributes (e.g., <h2 id="section-slug">Section Name</h2>)
   - Use <h3> for subtopics (15-20 H3s total for long-tail keywords)
   - Keep paragraphs SHORT (2–3 lines max in <p> tags)
   - Use <ul> and <ol> for lists or steps
   - Add <blockquote> for notes/tips/important information
   - Bold important terms: <strong>keyword</strong> (10-15 total)
   - Add image placeholders: <!-- image: topic_keyword -->

4. **Comparison/Related Section (before FAQs)**
   <h2 id="related-topics">Related [Main Topic] Resources</h2>
   <p>If you're interested in [primary keyword], you might also want to check...</p>
   <ul>
     <li><a href="[INTERNAL:related-1]">Related Topic 1 with Keyword</a></li>
     <li><a href="[INTERNAL:related-2]">Related Topic 2 with Keyword</a></li>
     <li><a href="[INTERNAL:related-3]">Related Topic 3 with Keyword</a></li>
   </ul>

5. **FAQs Section (8–10 questions)**
   Focus on question-based partial keyword queries:
   <h2 id="faqs">Frequently Asked Questions</h2>
   <h3>Q1: What is [primary keyword] exam date?</h3>
   <p>Answer with keyword variation...</p>
   <h3>Q2: How to apply for [keyword variation]?</h3>
   <p>Answer...</p>
   [8-10 questions total covering different search intents]

6. **Conclusion** (3–4 lines)
   - Summarize with primary keyword + 2 LSI keywords
   <h2 id="conclusion">Conclusion</h2>
   <p>Summary text here...</p>

CONTENT DEPTH REQUIREMENTS (MANDATORY):
- Target: 1800-2500 words (comprehensive coverage for ranking)
- 8-12 H2 sections (each targeting different keyword variation)
- 15-20 H3 subsections (for long-tail keywords)
- 5-10 internal link opportunities with partial keyword anchors
- 8-10 FAQs (question-based keywords)
- "People Also Ask" section (5-8 quick answers)
- Related topics section (entity keywords)
- 20-30 LSI keywords distributed naturally throughout

KEYWORD PLACEMENT CHECKLIST (MUST VERIFY):
✓ Primary keyword in: H1, first 100 words, 2-3 H2s, meta title, meta description
✓ 20-30 LSI keywords distributed naturally throughout all sections
✓ Question keywords in FAQs and "People Also Ask"
✓ Entity keywords in intro, body, and related sections
✓ Temporal keywords in dates, schedules, timelines
✓ Long-tail keywords in H3 subheadings
✓ Partial keyword variations in internal link anchor texts
✓ Keyword density: 1.5-2.5% (natural distribution)

METADATA REQUIREMENTS:
- Title: Compelling, newsworthy, 5-15 words with primary keyword
- Excerpt: Under 160 characters, captures main points with LSI keywords
- Meta Title: Max 60 chars, includes primary keyword naturally
- Meta Description: 150-160 chars, includes primary keyword + LSI keywords + CTA
- Tags: 8-15 lowercase, specific, searchable terms covering all keyword variations
- Category: Select most relevant from: Sports, Technology, Politics, Jobs, Education, Entertainment, Business, Health, Science, Other

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
          
          // Post-processing: Fix any remaining spacing issues in formatted_content
          if (parsed.formatted_content) {
            let fixedContent = parsed.formatted_content
            
            // Fix merged words by ensuring space after common HTML tags
            fixedContent = fixedContent.replace(/<\/(p|h[1-6]|li|strong|em|a)>(?=[A-Z])/g, '</$1> ')
            
            // Fix duplicate consecutive words
            fixedContent = fixedContent.replace(/\b(\w+)\s+\1\b/gi, '$1')
            
            // Ensure proper spacing after punctuation
            fixedContent = fixedContent.replace(/([.!?])(?=[A-Za-z])/g, '$1 ')
            
            // Remove multiple consecutive spaces
            fixedContent = fixedContent.replace(/\s{2,}/g, ' ')
            
            // Remove duplicate consecutive sentences (basic check)
            const sentences = fixedContent.split(/(?<=[.!?])\s+/)
            const uniqueSentences = [...new Set(sentences)]
            if (uniqueSentences.length < sentences.length) {
              fixedContent = uniqueSentences.join(' ')
            }
            
            parsed.formatted_content = fixedContent.trim()
          }
          
          result = {
            title: parsed.title || '',
            excerpt: parsed.excerpt || '',
            meta_title: parsed.meta_title || '',
            meta_description: parsed.meta_description || '',
            tags: parsed.tags || [],
            category: parsed.category || '',
            formatted_content: parsed.formatted_content || content
          }
        } catch (error) {
          console.error('Format and extract all error:', error)
          throw new Error('Failed to format and extract all fields')
        }
        break

      case 'format-cricket':
        try {
          const cricketPrompt = `You are a professional cricket journalist and formatting expert. Your goal is to convert raw or jumbled cricket match text into a clean, well-structured, and publication-ready report for a sports news website.

Follow these strict formatting and content guidelines:

1. **Clean Up**
   - Remove all duplicate phrases or repeated words.
   - Fix spacing between words and after punctuation.
   - Remove incomplete or broken sentences.
   - Maintain consistent capitalization for proper nouns (e.g., Australia, England, ICC, Ashleigh Gardner).

2. **Structure**
   Organize every article into the following clear sections, each separated by a blank line:

   **Title**
   - Use a strong, concise headline describing the key outcome.
   - Capitalize properly and avoid all caps.
   - Format as <h1>Title Here</h1>

   **Quick Summary**
   - 4–5 short bullet points summarizing match highlights (scores, performers, milestones).
   - Format as <h2>Quick Summary</h2> followed by <ul><li> items
   - Bold player names and stats: <strong>Player Name – Runs/Wickets (Balls)</strong>

   **Match Narrative**
   - 2–3 paragraphs describing key phases of the match (early collapse, partnerships, turning points).
   - Mention both batting and bowling efforts.
   - Format as <h2>Match Narrative</h2> followed by <p> paragraphs
   - Bold all player names, team names, and key stats

   **Top Performers**
   - Bullet list of top player stats in the format:
     <strong>Player Name – Runs/Wickets (Balls)</strong>
     Example: <strong>Ashleigh Gardner – 104* (73)</strong>, <strong>Annabel Sutherland – 98* (112)</strong>
   - Format as <h2>Top Performers</h2> followed by <ul><li> items

   **Post-Match Context**
   - 1–2 paragraphs explaining how the result affects the standings or tournament scenario.
   - Format as <h2>Post-Match Context</h2> followed by <p> paragraphs

   **Conclusion**
   - End with a strong paragraph summarizing the importance of the win and key takeaways.
   - Can be included in Post-Match Context or as a final paragraph

3. **Formatting Rules**
   - Add **one blank line** between all paragraphs in HTML (proper spacing between tags).
   - Bold player names, team names, and major stats using <strong> tags.
   - Use short, crisp sentences for readability.
   - Avoid extra symbols, brackets, or unnecessary line breaks.
   - Never merge all content into one block of text.
   - Maintain a professional, news-style tone.

4. **Content Accuracy**
   - Retain all factual details from the input (runs, overs, players, match outcomes).
   - Do not invent or modify statistics.

5. **Output**
   - Output clean HTML ready for CMS input.
   - Preserve all paragraph breaks exactly as specified.
   - Return ONLY the formatted HTML without code fences or markdown.

RAW MATCH NOTES:
${content}

FORMATTED CRICKET MATCH REPORT (clean HTML only, no code fences):`

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

      case 'suggest-external-links':
        try {
          const systemPrompt = `You are an SEO and research assistant. Your job is to suggest 3-5 authoritative external sources for an article.

STRICT RULES:
- Only suggest official sources: government portals (.gov.in, .nic.in), official exam boards (SSC, UPSC, WBCHSE, CBSE, etc.), trusted news outlets (Indian Express, Times of India, Hindustan Times, The Hindu, etc.)
- DO NOT copy any content from these sites
- Only provide: title, URL, source type, and brief relevance note
- Maximum 5 suggestions
- No blogs, unofficial sites, or low-authority sources

Return ONLY a JSON object with this structure:
{
  "suggestions": [
    {
      "title": "Exact title from the source",
      "url": "https://official-url.com",
      "source": "Government/News/Official",
      "reason": "Why this source is relevant (1 line)"
    }
  ]
}

Base suggestions on the article topic. If no authoritative sources are relevant, return empty array.`;
          
          const userPrompt = `Article Title: ${title}\n\nArticle Content:\n${content.substring(0, 2000)}`;
          
          const aiResponse = await callLovableAI(systemPrompt + '\n\n' + userPrompt);
          let parsed = JSON.parse(aiResponse.trim());
          
          // Ensure suggestions is always an array
          if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
            parsed = { suggestions: [] };
          }
          
          result = parsed;
        } catch (error) {
          console.error('External links suggestion error:', error);
          result = { suggestions: [] };
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