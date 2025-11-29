import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InternalLinkRequest {
  content: string
  title: string
  currentArticleId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content, title, currentArticleId }: InternalLinkRequest = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract keywords and entities
    const keywords = extractKeywords(content, title)
    const entities = extractEntities(content)
    const headings = extractHeadings(content)
    
    console.log('Extracted keywords:', keywords.slice(0, 10))
    console.log('Extracted entities:', entities.slice(0, 5))

    // Query database for related articles
    let query = supabase
      .from('articles')
      .select('id, slug, title, excerpt, tags, primary_keyword')
      .eq('published', true)
      .limit(30)
    
    if (currentArticleId) {
      query = query.neq('id', currentArticleId)
    }
    
    const { data: articles, error } = await query

    if (error) {
      console.error('Database query error:', error)
      throw error
    }

    // Score and rank articles
    const scoredArticles = articles
      .map(article => {
        let score = 0
        const articleText = `${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')} ${article.primary_keyword || ''}`.toLowerCase()
        
        keywords.forEach(keyword => {
          if (articleText.includes(keyword.toLowerCase())) {
            score += 10
          }
        })
        
        entities.forEach(entity => {
          if (articleText.includes(entity.toLowerCase())) {
            score += 15
          }
        })
        
        headings.forEach(heading => {
          if (articleText.includes(heading.toLowerCase())) {
            score += 12
          }
        })
        
        const articleTags = (article.tags || []).map((t: string) => t.toLowerCase())
        keywords.forEach(keyword => {
          if (articleTags.some((tag: string) => tag.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(tag))) {
            score += 20
          }
        })
        
        return { ...article, relevanceScore: score }
      })
      .filter(article => article.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15)

    console.log('Found related articles:', scoredArticles.length)

    // Insert links into content
    const { modifiedContent, linksInserted } = insertLinks(
      content,
      scoredArticles,
      keywords,
      entities,
      headings
    )

    // Add related articles section
    const finalContent = addRelatedArticlesSection(modifiedContent, scoredArticles.slice(0, 5))

    return new Response(
      JSON.stringify({ 
        content: finalContent,
        linksInserted,
        relatedArticlesFound: scoredArticles.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auto insert internal links error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function extractKeywords(content: string, title: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
    'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 
    'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 
    'this', 'that', 'these', 'those', 'it', 'its', 'as', 'not', 'all', 'your', 'more', 
    'about', 'exam', 'form', 'notification', 'apply', 'article'
  ])
  
  const text = `${title} ${stripHtml(content)}`.toLowerCase()
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
  
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
}

function extractEntities(content: string): string[] {
  const text = stripHtml(content)
  const entities: string[] = []
  
  // Extract capitalized phrases (likely proper nouns/entities)
  const capitalizedPattern = /\b[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b/g
  const matches = text.match(capitalizedPattern) || []
  
  const entityFrequency: Record<string, number> = {}
  matches.forEach(match => {
    if (match.length > 3 && !isCommonWord(match)) {
      entityFrequency[match] = (entityFrequency[match] || 0) + 1
    }
  })
  
  return Object.entries(entityFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([entity]) => entity)
}

function extractHeadings(content: string): string[] {
  const headingPattern = /<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi
  const matches = content.matchAll(headingPattern)
  const headings: string[] = []
  
  for (const match of matches) {
    const heading = stripHtml(match[1]).trim()
    if (heading.length > 3) {
      headings.push(heading)
    }
  }
  
  return headings
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function isCommonWord(word: string): boolean {
  const common = ['The', 'This', 'That', 'These', 'Those', 'Here', 'There', 'When', 'Where', 'What', 'Which', 'Who', 'How']
  return common.includes(word)
}

function insertLinks(
  content: string,
  articles: any[],
  keywords: string[],
  entities: string[],
  headings: string[]
): { modifiedContent: string; linksInserted: number } {
  let modifiedContent = content
  let linksInserted = 0
  const maxLinks = 8
  const minWordsBetweenLinks = 100
  const linkedAnchors = new Set<string>()
  
  // Calculate word count to determine max links
  const wordCount = stripHtml(content).split(/\s+/).length
  const targetLinks = Math.min(maxLinks, Math.floor(wordCount / minWordsBetweenLinks))
  
  // Build potential anchor texts for each article
  const linkOpportunities: Array<{
    article: any
    anchorText: string
    priority: number
  }> = []

  articles.forEach(article => {
    const opportunities: string[] = []
    
    // Priority 1: Article title words in headings
    headings.forEach(heading => {
      const titleWords = article.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      titleWords.forEach((word: string) => {
        if (heading.toLowerCase().includes(word)) {
          opportunities.push(heading)
        }
      })
    })
    
    // Priority 2: Entities matching article title
    entities.forEach(entity => {
      if (article.title.toLowerCase().includes(entity.toLowerCase())) {
        opportunities.push(entity)
      }
    })
    
    // Priority 3: Keywords in article title
    keywords.forEach(keyword => {
      if (article.title.toLowerCase().includes(keyword)) {
        opportunities.push(keyword)
      }
    })
    
    // Priority 4: Article primary keyword
    if (article.primary_keyword && stripHtml(content).toLowerCase().includes(article.primary_keyword.toLowerCase())) {
      opportunities.push(article.primary_keyword)
    }
    
    // Add unique opportunities
    const uniqueOpportunities = [...new Set(opportunities)]
    uniqueOpportunities.forEach((anchor, index) => {
      linkOpportunities.push({
        article,
        anchorText: anchor,
        priority: index === 0 ? 1 : index < 3 ? 2 : 3
      })
    })
  })
  
  // Sort by priority and relevance
  linkOpportunities.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return b.article.relevanceScore - a.article.relevanceScore
  })
  
  // Insert links
  linkOpportunities.forEach(({ article, anchorText }) => {
    if (linksInserted >= targetLinks) return
    
    const anchorLower = anchorText.toLowerCase().trim()
    if (linkedAnchors.has(anchorLower)) return
    if (anchorText.length < 4) return
    
    // Find first occurrence in content (case-insensitive, whole word)
    const pattern = new RegExp(`\\b${escapeRegex(anchorText)}\\b`, 'i')
    const match = modifiedContent.match(pattern)
    
    if (match) {
      const matchedText = match[0]
      const link = `<a href="/article/${article.slug}" class="internal-link">${matchedText}</a>`
      
      // Check if this position is already inside a link
      const beforeMatch = modifiedContent.substring(0, match.index!)
      const openLinks = (beforeMatch.match(/<a /g) || []).length
      const closeLinks = (beforeMatch.match(/<\/a>/g) || []).length
      
      if (openLinks === closeLinks) {
        // Not inside an existing link, safe to insert
        modifiedContent = modifiedContent.replace(pattern, link)
        linkedAnchors.add(anchorLower)
        linksInserted++
        console.log(`Inserted link #${linksInserted}: "${matchedText}" -> ${article.slug}`)
      }
    }
  })
  
  return { modifiedContent, linksInserted }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function addRelatedArticlesSection(content: string, articles: any[]): string {
  if (articles.length === 0) return content
  
  const relatedSection = `
<h2>Related Articles</h2>
<div class="related-articles">
${articles.map(article => `
  <div class="related-article-item">
    <h3><a href="/article/${article.slug}">${article.title}</a></h3>
    ${article.excerpt ? `<p>${article.excerpt}</p>` : ''}
  </div>
`).join('')}
</div>
`
  
  return content + '\n\n' + relatedSection
}
