// Advanced SEO keyword analysis utilities

export interface LSIKeywords {
  core_terms?: string[];
  entity_keywords?: string[];
  temporal_keywords?: string[];
  action_keywords?: string[];
}

export interface CompetitorInsights {
  avg_word_count?: number;
  common_headings?: string[];
  missing_topics?: string[];
}

export interface KeywordAnalysis {
  primary: string;
  secondary: string[];
  lsi: string[] | LSIKeywords;
  variations: string[];
  density: number;
  targetQueries: string[];
  longTailOpportunities?: string[];
  questionKeywords?: string[];
  searchIntent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  keywordDifficulty?: 'easy' | 'medium' | 'hard';
  contentGaps?: string[];
  competitorInsights?: CompetitorInsights;
  recommendations?: string[];
}

// Calculate keyword density in content
export function calculateKeywordDensity(keyword: string, content: string): number {
  const cleanContent = content.toLowerCase().replace(/<[^>]*>/g, ' ');
  const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  
  let count = 0;
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const phrase = words.slice(i, i + keywordWords.length).join(' ');
    if (phrase === keyword.toLowerCase()) {
      count++;
    }
  }
  
  return words.length > 0 ? (count / words.length) * 100 : 0;
}

// Check if keyword appears in first N words
export function keywordInFirstWords(keyword: string, content: string, wordCount: number = 100): boolean {
  const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const firstWords = cleanContent.split(/\s+/).slice(0, wordCount).join(' ');
  return firstWords.includes(keyword.toLowerCase());
}

// Extract headings from HTML content
export function extractHeadings(content: string): { h2: string[]; h3: string[] } {
  const h2Matches = content.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const h3Matches = content.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
  
  return {
    h2: h2Matches.map(h => h.replace(/<[^>]*>/g, '').trim()),
    h3: h3Matches.map(h => h.replace(/<[^>]*>/g, '').trim())
  };
}

// Check percentage of headings containing keyword
export function headingKeywordPercentage(keyword: string, headings: string[]): number {
  if (headings.length === 0) return 0;
  
  const keywordLower = keyword.toLowerCase();
  const withKeyword = headings.filter(h => 
    h.toLowerCase().includes(keywordLower)
  ).length;
  
  return (withKeyword / headings.length) * 100;
}

// Generate LSI (Latent Semantic Indexing) keywords
export function generateLSIKeywords(title: string, content?: string): string[] {
  const lsiKeywords: string[] = [];
  
  // Common semantic variations for news content
  const semanticMap: { [key: string]: string[] } = {
    'news': ['updates', 'breaking', 'latest', 'report', 'coverage', 'announcement'],
    'technology': ['tech', 'digital', 'innovation', 'software', 'hardware', 'device'],
    'business': ['economy', 'market', 'financial', 'corporate', 'industry', 'trade'],
    'politics': ['government', 'policy', 'election', 'political', 'administration', 'parliament'],
    'sports': ['game', 'match', 'tournament', 'championship', 'player', 'team'],
    'health': ['medical', 'healthcare', 'wellness', 'treatment', 'disease', 'hospital'],
    'education': ['learning', 'academic', 'school', 'university', 'student', 'course'],
    'entertainment': ['celebrity', 'movie', 'music', 'show', 'performance', 'artist']
  };
  
  const combinedText = (title + ' ' + (content || '')).toLowerCase();
  
  // Find related terms based on content
  Object.entries(semanticMap).forEach(([key, values]) => {
    if (combinedText.includes(key)) {
      lsiKeywords.push(...values);
    }
  });
  
  // Add year-based variations if year is mentioned
  const currentYear = new Date().getFullYear();
  if (combinedText.includes(currentYear.toString())) {
    lsiKeywords.push(`${currentYear}`, `latest ${currentYear}`, `${currentYear} update`);
  }
  
  return [...new Set(lsiKeywords)].slice(0, 15);
}

// Analyze content for SEO keyword optimization
export function analyzeKeywords(title: string, content: string, tags?: string[]): KeywordAnalysis {
  const primary = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 4)
    .join(' ');
  
  const secondary = generateKeywordVariations(title).slice(1, 6);
  const lsi = generateLSIKeywords(title, content);
  const variations = generateKeywordVariations(title);
  const density = calculateKeywordDensity(primary, content);
  const targetQueries = [...variations, ...lsi].slice(0, 10);
  
  return {
    primary,
    secondary,
    lsi,
    variations,
    density,
    targetQueries
  };
}

// Generate keyword variations
function generateKeywordVariations(title: string): string[] {
  const variations: string[] = [];
  const words = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  variations.push(words.join(' '));
  
  for (let i = 0; i < words.length - 1; i++) {
    variations.push(`${words[i]} ${words[i + 1]}`);
  }
  
  for (let i = 0; i < words.length - 2; i++) {
    variations.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  
  variations.push(...words.filter(w => w.length > 4));
  
  return [...new Set(variations)];
}

// Extract FAQ questions from content
export function extractFAQs(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Match H3 tags that are questions
  const h3Regex = /<h3[^>]*>(.*?\?)<\/h3>/gi;
  let match;
  
  while ((match = h3Regex.exec(content)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    
    // Get the next paragraph after the question
    const afterQuestion = content.substring(match.index + match[0].length);
    const pMatch = afterQuestion.match(/<p[^>]*>(.*?)<\/p>/i);
    
    if (pMatch) {
      const answer = pMatch[1].replace(/<[^>]*>/g, '').trim();
      if (answer.length > 20) {
        faqs.push({ question, answer });
      }
    }
  }
  
  return faqs;
}

// Generate FAQ schema for SEO
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  if (faqs.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
