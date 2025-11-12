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
          const prompt = `You are an expert SEO content strategist who creates content that ranks #1 on Google. Format this content to dominate search rankings.

CRITICAL RANKING FACTORS (Google's Algorithm):

1. KEYWORD PLACEMENT (Highest Priority):
   - Extract primary keyword from title (2-4 words - the most searchable phrase)
   - PRIMARY KEYWORD MUST appear in:
     * FIRST 50 WORDS (critical for rankings)
     * At least 60% of H2 headings (use exact match AND variations)
     * First sentence and last paragraph (content bookends)
     * Image alt text descriptions
   - Maintain 4-6% keyword density (higher than typical 3-5% for better ranking)
   - Use 2-word and 3-word partial keyword combinations throughout

2. SEMANTIC SEO & LSI KEYWORDS:
   - Add 15+ semantically related terms (LSI keywords)
   - Include synonyms, related concepts, and topic variations
   - Use industry-specific terminology
   - Add context words that Google associates with the topic
   - Examples: If primary = "mobile apps", use "application development", "smartphone software", "iOS Android", "app store"

3. HEADING OPTIMIZATION (Featured Snippet Strategy):
   - Create 6-8 H2 headings minimum
   - 70%+ H2 tags MUST contain primary keyword or close variations
   - Format H3 as questions for featured snippets: "How to...", "What is...", "Why does...", "When should..."
   - Use comparison headings: "X vs Y", "Best [keyword] for..."
   - Include numbered lists and tables where relevant

4. CONTENT DEPTH (1500+ words target):
   - First paragraph: 100+ words with primary keyword in first sentence
   - Each H2 section: 200-300 words minimum
   - Add comparison tables, statistics, examples
   - Include step-by-step guides where relevant
   - End with comprehensive FAQ section (5+ questions)

5. INTERNAL LINKING STRUCTURE:
   - Add 3-5 internal link placeholders: <a href="[related-article-placeholder]">keyword-rich anchor text</a>
   - Use keyword variations as anchor text
   - Example: "Learn more about [secondary keyword]"

6. FEATURED SNIPPET OPTIMIZATION:
   - Start sections with direct answers (40-60 words)
   - Use definition format: "X is..."
   - Add numbered/bulleted lists (Google loves these)
   - Create comparison tables
   - Format FAQ with question-answer pairs

ALLOWED HTML TAGS:
- Headings: <h2>, <h3>, <h4>
- Text: <p>, <strong>, <em>, <u>, <mark>
- Lists: <ul>, <ol>, <li>
- Tables: <table>, <thead>, <tbody>, <tr>, <th>, <td>
- Links: <a href="[internal-link-placeholder]">anchor</a>
- Images: <div class="image-placeholder" data-topic="descriptive-keyword-topic"></div>
- Other: <blockquote>, <code>, <pre>, <hr>

OPTIMIZED STRUCTURE:
<div class="image-placeholder" data-topic="hero_primary_keyword"></div>

<p><strong>[PRIMARY KEYWORD]</strong>: [First sentence with primary keyword]. [100+ words introduction with keyword density 5-6%, include secondary keywords and LSI terms]...</p>

<h2>[Primary Keyword]: Complete Guide</h2>
<p>[Direct answer for featured snippet - 40-60 words]</p>
<p>[Detailed explanation with LSI keywords, 200+ words]</p>
<ul>
  <li><strong>Key point with keyword variation</strong></li>
</ul>

<div class="image-placeholder" data-topic="primary_keyword_example"></div>

<h2>How to [Primary Keyword] - Step by Step</h2>
<ol>
  <li><strong>Step 1</strong>: [With keyword]</li>
</ol>

<h2>[Secondary Keyword] vs [Alternative]</h2>
<table>
  <thead><tr><th>Feature</th><th>[Keyword]</th></tr></thead>
  <tbody><tr><td>...</td><td>...</td></tr></tbody>
</table>

<h2>Best Practices for [Primary Keyword]</h2>
<p>Learn more about <a href="[related-article-placeholder]">[secondary keyword topic]</a>...</p>

<h2>Frequently Asked Questions</h2>
<h3>How does [primary keyword] work?</h3>
<p>[Direct 40-word answer]</p>

<h3>What is the best way to [keyword action]?</h3>
<p>[Direct answer]</p>

<h3>Why should I [keyword action]?</h3>
<p>[Benefits answer]</p>

<h3>When to use [primary keyword]?</h3>
<p>[Timing/scenario answer]</p>

<h3>Where can I find [keyword resource]?</h3>
<p>[Location/source answer]</p>

<p><strong>Conclusion</strong>: [Summary with primary keyword in first and last sentence]</p>

Return ONLY the formatted HTML (no code fences, no explanations).

${title ? `ARTICLE TITLE: ${title}\n\n` : ''}CONTENT TO OPTIMIZE:
${content}

SEO-OPTIMIZED HTML:`

          const formattedContent = await callLovableAI(prompt)
          
          let finalContent = formattedContent.trim()
          
          // Remove any code fences
          finalContent = finalContent.replace(/^```html\n?/i, '')
          finalContent = finalContent.replace(/^```\n?/i, '')
          finalContent = finalContent.replace(/\n?```$/i, '')
          
          // Ensure minimum structure
          if (!finalContent.includes('<h2>')) {
            finalContent = `<div class="image-placeholder" data-topic="hero"></div>\n\n${finalContent}`
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
          
          result = { result: `<div class="image-placeholder" data-topic="article_hero"></div>\n\n${basicFormatted}\n\n<div class="image-placeholder" data-topic="article_conclusion"></div>` }
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
          const seoPrompt = `You are an SEO expert who specializes in first-page Google rankings. Optimize this article to rank for individual keywords, not just the full title.

GOOGLE RANKING OPTIMIZATION:

1. KEYWORD DOMINANCE (Fix keyword ranking issues):
   - Identify primary keyword from title (the most searchable 2-4 word phrase)
   - PRIMARY KEYWORD MUST appear in:
     * First sentence AND first 50 words (3-5 times in opening)
     * 70%+ of H2 headings (exact match OR close variations)
     * Last paragraph conclusion
     * Throughout content with 5-7% density (aggressive for ranking)
   - Add 2-word and 3-word partial keyword combinations
   - Example: If title is "Best Mobile Apps for Students 2025"
     Primary: "mobile apps" (most searchable)
     Use: "mobile apps", "best apps", "apps for students", "student mobile apps"

2. LSI & SEMANTIC KEYWORDS (20+ additions):
   - Add extensive semantic variations
   - Industry terminology and related concepts
   - Synonyms and alternative phrasings
   - Topic-related entities and brands
   - Year-specific terms (2025, latest, new, updated)

3. RANKING-FOCUSED STRUCTURE:
   - Increase H2 count to 7-10 headings
   - Each H2 MUST be keyword-rich
   - Add comparison sections: "X vs Y", "Top [keyword] options"
   - Create "Ultimate Guide", "Complete Overview" sections
   - Add tables and lists (Google ranks these higher)

4. FEATURED SNIPPET TARGETING:
   - Start each section with a 40-60 word direct answer
   - Format as definition, list, or table
   - Use question format in H3 tags
   - Add "People Also Ask" style FAQs

5. INTERNAL LINKING:
   - Add 5+ internal link placeholders
   - Use keyword-rich anchor text
   - Link to related topics with variations

6. CONTENT EXPANSION:
   - Expand to 1500+ words if below
   - Add detailed examples, case studies
   - Include statistics and data points
   - Create comprehensive subsections

KEEP ALL HTML TAGS. Return ONLY the optimized HTML.

${title ? `TITLE (Extract primary keyword from this): ${title}\n\n` : ''}CONTENT TO OPTIMIZE:
${content}

RANKING-OPTIMIZED HTML:`

          const optimized = await callLovableAI(seoPrompt)
          
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
          const allInOnePrompt = `You are an elite SEO strategist and human content writer. Your mission: Create a perfectly optimized, naturally-written article that ranks on Google's first page while sounding 100% human-written.

RETURN ONLY A VALID JSON OBJECT with these exact keys (no markdown, no code fences):

{
  "title": "Compelling 5-15 word article title",
  "excerpt": "Engaging excerpt under 160 characters",
  "meta_title": "SEO-optimized title (max 60 characters, includes primary keyword)",
  "meta_description": "SEO-optimized description (150-160 characters) with target keyword",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Sports|Technology|Politics|Jobs|Education|Entertainment|Business|Health|Science|Other",
  "formatted_content": "Full SEO-optimized, humanized HTML content"
}

═══════════════════════════════════════════════════════════════
🎯 CRITICAL SEO OPTIMIZATION REQUIREMENTS (FIRST PAGE RANKING)
═══════════════════════════════════════════════════════════════

1. **PRIMARY KEYWORD PLACEMENT** (MANDATORY):
   ✓ Extract primary keyword from content (2-4 word phrase)
   ✓ Include primary keyword in FIRST SENTENCE (not just first 100 words)
   ✓ Use primary keyword in 60%+ of H2 headings
   ✓ Maintain 3-5% keyword density throughout
   ✓ Include primary keyword in first H2 heading
   ✓ Add primary keyword to conclusion paragraph

2. **CONTENT LENGTH TARGET** (CRITICAL):
   ✓ Minimum 1500 words (expand content if needed)
   ✓ Target 1800-2200 words for competitive keywords
   ✓ Add depth, examples, explanations to reach word count
   ✓ Never sacrifice quality for length

3. **HEADING STRUCTURE** (SEO + USER EXPERIENCE):
   ✓ Create 6-8 H2 headings minimum
   ✓ 60%+ of H2 tags MUST contain primary keyword or variations
   ✓ Use H3 for subsections (2-3 H3s per H2 section)
   ✓ Make headings compelling and keyword-rich
   ✓ Format questions as H3: "How to...", "What is...", "Why does..."

4. **LSI & SEMANTIC KEYWORDS** (TOPICAL AUTHORITY):
   ✓ Inject 20-30 LSI keywords naturally throughout
   ✓ Include entity keywords (people, places, organizations)
   ✓ Add temporal keywords: "2025", "latest", "updated", "current"
   ✓ Use action keywords: "how to", "guide", "tutorial", "tips"
   ✓ Include industry-specific terminology

5. **INTERNAL LINKING** (CRITICAL FOR RANKINGS):
   ✓ Add 5-10 internal link placeholders: <a href="[internal-link-placeholder]" data-keyword="exact keyword">anchor text</a>
   ✓ Use keyword-rich anchor text
   ✓ Place links naturally in context
   ✓ Link to related topics, guides, and resources

6. **FAQ SECTION** (FEATURED SNIPPET OPTIMIZATION):
   ✓ Create dedicated FAQ section with H2: "Frequently Asked Questions"
   ✓ Include 5-8 question-answer pairs minimum
   ✓ Format each question as H3
   ✓ Answer each question in 2-3 sentences
   ✓ Use "People Also Ask" style questions
   ✓ Include primary keyword in 60% of questions
   ✓ Examples: "How do I [keyword]?", "What is the best [keyword]?", "Why is [keyword] important?"

7. **IMAGE OPTIMIZATION**:
   ✓ Add hero image at start: <div class="image-placeholder" data-topic="primary_keyword_hero"></div>
   ✓ Add 3-5 contextual images throughout
   ✓ Place images after every 2-3 paragraphs
   ✓ Use keyword-rich data-topic attributes

═══════════════════════════════════════════════════════════════
✍️ HUMANIZATION REQUIREMENTS (99% HUMAN SCORE)
═══════════════════════════════════════════════════════════════

1. **WRITING STYLE**:
   ✓ Write like a real journalist/expert, NOT an AI
   ✓ Use personal observations: "I've noticed...", "In my experience..."
   ✓ Add subtle opinions and perspectives
   ✓ Include real-world examples and case studies
   ✓ Use storytelling elements where appropriate

2. **SENTENCE VARIETY**:
   ✓ Mix short punchy sentences (5-8 words) with longer flowing ones (20-30 words)
   ✓ Vary sentence structure naturally
   ✓ Use rhetorical questions occasionally
   ✓ Add transitional phrases: "However", "Meanwhile", "In fact", "Interestingly"

3. **NATURAL LANGUAGE**:
   ✓ Use contractions naturally: "it's", "you're", "don't"
   ✓ Include occasional informal phrasing (but stay professional)
   ✓ Add idioms or colloquialisms where appropriate
   ✓ Use active voice predominantly (80%+)
   ✓ Show personality - make it engaging

4. **AVOID AI PATTERNS**:
   ✗ No perfect symmetry in structure
   ✗ No repetitive list format everywhere
   ✗ No robotic transitions
   ✗ No generic conclusions like "In conclusion, [topic] is important..."
   ✗ No overly formal corporate speak

5. **IMPERFECTIONS** (Make it human):
   ✓ Occasional slight informality
   ✓ Natural flow with unexpected transitions
   ✓ Varied paragraph lengths (some short, some long)
   ✓ Conversational tone where appropriate

═══════════════════════════════════════════════════════════════
🧹 CONTENT CLEANING & FORMATTING
═══════════════════════════════════════════════════════════════

1. **SPACING & GRAMMAR**:
   ✓ Fix ALL merged words (e.g., "Malayalamfilm" → "Malayalam film")
   ✓ Proper spaces after punctuation
   ✓ Remove duplicate words/phrases/sentences
   ✓ Fix grammar, punctuation, capitalization
   ✓ Each paragraph in separate <p></p> tags

2. **STRUCTURE**:
   ✓ Intro (150-200 words with keyword in first sentence)
   ✓ Main body sections (6-8 H2 sections)
   ✓ FAQ section (5-8 Q&As)
   ✓ Conclusion (100-150 words with CTA)

3. **ALLOWED HTML TAGS ONLY**:
   ✓ Headings: <h2>, <h3>
   ✓ Text: <p>, <strong>, <em>, <u>
   ✓ Lists: <ul>, <ol>, <li>
   ✓ Links: <a href="[internal-link-placeholder]" data-keyword="keyword">anchor text</a>
   ✓ Images: <div class="image-placeholder" data-topic="keyword"></div>
   ✓ Other: <blockquote>, <table>, <tr>, <td>, <th>
   ✗ DO NOT USE: HTML comments, script, iframe, form, input

═══════════════════════════════════════════════════════════════
📋 OUTPUT STRUCTURE TEMPLATE
═══════════════════════════════════════════════════════════════

Title: [Compelling 5-15 word headline with primary keyword]

Excerpt: [Engaging 150-160 character summary]

Meta Title: [60 char SEO title with primary keyword]

Meta Description: [150-160 char description with keyword + CTA]

Tags: [8-15 lowercase, specific, searchable terms]

Category: [Single most relevant category]

Formatted Content:

<div class="image-placeholder" data-topic="primary_keyword_hero"></div>

<p>[First paragraph with PRIMARY KEYWORD IN FIRST SENTENCE. Engaging hook that makes readers want to continue. Natural, conversational tone. 150-200 words total.]</p>

<h2>[Main Topic Heading with Primary Keyword]</h2>
<p>[2-3 paragraphs with LSI keywords, examples, depth. Natural writing style.]</p>

<div class="image-placeholder" data-topic="relevant_topic_1"></div>

<h2>[Second Topic with Keyword Variation]</h2>
<p>[Content with internal links: <a href="[internal-link-placeholder]" data-keyword="related topic">anchor text</a>]</p>
<p>[More detailed explanation...]</p>

<h2>[Third Topic Heading]</h2>
<h3>[Subsection Question or Topic]</h3>
<p>[Detailed explanation with LSI keywords...]</p>

[Continue with 4-6 more H2 sections, each with 2-4 paragraphs]

<div class="image-placeholder" data-topic="relevant_topic_2"></div>

<h2>Frequently Asked Questions</h2>

<h3>How do I [primary keyword]?</h3>
<p>[Direct, helpful 2-3 sentence answer with keyword]</p>

<h3>What is the best [keyword variation]?</h3>
<p>[Clear, concise answer]</p>

<h3>Why is [keyword] important in 2025?</h3>
<p>[Answer with temporal relevance]</p>

[Continue with 2-5 more FAQs]

<h2>Conclusion</h2>
<p>[Strong 100-150 word conclusion summarizing key points, including primary keyword, with clear CTA or next steps]</p>

═══════════════════════════════════════════════════════════════

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