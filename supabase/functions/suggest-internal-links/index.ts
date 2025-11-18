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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract keywords from content and title
    const keywords = extractKeywords(content, title)
    
    if (keywords.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Query database for related articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, slug, title, excerpt, tags')
      .eq('published', true)
      .neq('id', currentArticleId || '')
      .limit(20)

    if (error) {
      console.error('Database query error:', error)
      throw error
    }

    // Score and rank articles by relevance
    const scoredArticles = articles
      .map(article => {
        let score = 0
        const articleText = `${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')}`.toLowerCase()
        
        // Score based on keyword matches
        keywords.forEach(keyword => {
          if (articleText.includes(keyword.toLowerCase())) {
            score += 10
          }
        })
        
        // Bonus for tag matches
        const articleTags = (article.tags || []).map((t: string) => t.toLowerCase())
        keywords.forEach(keyword => {
          if (articleTags.some((tag: string) => tag.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(tag))) {
            score += 15
          }
        })
        
        return { ...article, relevanceScore: score }
      })
      .filter(article => article.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)

    // Generate contextual anchor texts with partial keywords
    const suggestions = scoredArticles.map(article => {
      const anchorVariations = generateAnchorText(article, keywords)
      return {
        slug: article.slug,
        title: article.title,
        suggestedAnchors: anchorVariations,
        relevanceScore: article.relevanceScore
      }
    })

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Suggest internal links error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function extractKeywords(content: string, title: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'as', 'not', 'all', 'your', 'more', 'about'])
  
  // Combine title and content
  const text = `${title} ${content}`.toLowerCase()
  
  // Extract words
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
  
  // Count frequency
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  // Get top 15 keywords
  const sortedKeywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
  
  // Extract multi-word phrases (2-3 words)
  const phrases: string[] = []
  const contentWords = content.toLowerCase().split(/\s+/)
  for (let i = 0; i < contentWords.length - 1; i++) {
    const twoWord = `${contentWords[i]} ${contentWords[i + 1]}`
    if (!twoWord.split(' ').some(w => stopWords.has(w) || w.length < 3)) {
      phrases.push(twoWord)
    }
    
    if (i < contentWords.length - 2) {
      const threeWord = `${contentWords[i]} ${contentWords[i + 1]} ${contentWords[i + 2]}`
      if (!threeWord.split(' ').some(w => stopWords.has(w) || w.length < 3)) {
        phrases.push(threeWord)
      }
    }
  }
  
  // Count phrase frequency
  const phraseFrequency: Record<string, number> = {}
  phrases.forEach(phrase => {
    phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1
  })
  
  // Get top 5 phrases
  const topPhrases = Object.entries(phraseFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase)
  
  return [...sortedKeywords, ...topPhrases]
}

function generateAnchorText(article: any, contentKeywords: string[]): string[] {
  const anchors: string[] = []
  const title = article.title.toLowerCase()
  const tags = (article.tags || []).map((t: string) => t.toLowerCase())
  
  // Extract main topic from title (first 2-3 significant words)
  const titleWords = article.title.split(' ').filter((w: string) => w.length > 3).slice(0, 3)
  const mainTopic = titleWords.join(' ')
  
  // Find matching keywords from content
  const matchingKeywords = contentKeywords.filter(kw => 
    title.includes(kw) || tags.some((tag: string) => tag.includes(kw) || kw.includes(tag))
  )
  
  // Generate anchor variations
  if (matchingKeywords.length > 0) {
    const primaryKeyword = matchingKeywords[0]
    anchors.push(`Learn more about ${primaryKeyword}`)
    anchors.push(`Complete guide to ${primaryKeyword}`)
    anchors.push(`Check the latest ${primaryKeyword}`)
  }
  
  anchors.push(`Learn about ${mainTopic.toLowerCase()}`)
  anchors.push(`Read: ${article.title}`)
  anchors.push(`Check out ${mainTopic.toLowerCase()}`)
  
  if (tags.length > 0) {
    anchors.push(`Explore ${tags[0]}`)
  }
  
  return anchors.slice(0, 3) // Return top 3 variations
}
