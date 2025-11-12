/**
 * Content Optimization Utility
 * Enhances article content for better partial search visibility
 */

interface ContentOptimizationOptions {
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  lsiKeywords?: string[];
  targetQueries?: string[];
}

/**
 * Extract FAQ questions and answers from HTML content
 */
export function extractFAQs(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Match H2/H3 tags that end with "?"
  const headingRegex = /<h[23][^>]*>(.*?\?)<\/h[23]>/gi;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    
    // Get the next paragraph or list after the question
    const afterQuestion = content.substring(match.index + match[0].length);
    const answerMatch = afterQuestion.match(/<p[^>]*>(.*?)<\/p>/i) || 
                       afterQuestion.match(/<ul[^>]*>(.*?)<\/ul>/is) ||
                       afterQuestion.match(/<ol[^>]*>(.*?)<\/ol>/is);
    
    if (answerMatch) {
      let answer = answerMatch[1]
        .replace(/<li[^>]*>/gi, '')
        .replace(/<\/li>/gi, '. ')
        .replace(/<[^>]*>/g, '')
        .trim();
      
      // Limit answer length to 300 characters for schema
      if (answer.length > 300) {
        answer = answer.substring(0, 297) + '...';
      }
      
      if (answer.length > 20) {
        faqs.push({ question, answer });
      }
    }
  }
  
  return faqs;
}

/**
 * Generate FAQ Schema from content
 */
export function generateFAQSchema(content: string, targetQueries?: string[]) {
  const faqs = extractFAQs(content);
  
  // Add FAQs from target queries if provided
  if (targetQueries && targetQueries.length > 0) {
    targetQueries.forEach(query => {
      if (query.includes('?') && !faqs.some(faq => faq.question.toLowerCase().includes(query.toLowerCase()))) {
        // Try to find answer in content for this query
        const queryWords = query.toLowerCase().replace(/[?]/g, '').split(' ');
        const contentLower = content.toLowerCase();
        
        // Simple heuristic: find paragraph containing most query words
        const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gi) || [];
        let bestMatch = '';
        let bestScore = 0;
        
        paragraphs.forEach(p => {
          const pText = p.toLowerCase();
          const score = queryWords.filter(word => pText.includes(word)).length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = p.replace(/<[^>]*>/g, '').trim();
          }
        });
        
        if (bestMatch && bestMatch.length > 20) {
          if (bestMatch.length > 300) {
            bestMatch = bestMatch.substring(0, 297) + '...';
          }
          faqs.push({ question: query, answer: bestMatch });
        }
      }
    });
  }
  
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

/**
 * Enhance content with keyword-rich headings and semantic variations
 */
export function enhanceContentStructure(
  content: string,
  options: ContentOptimizationOptions
): string {
  if (!content) return content;
  
  let enhancedContent = content;
  const { primaryKeyword, secondaryKeywords, lsiKeywords, targetQueries } = options;
  
  // Check if content already has rich headings
  const hasH2 = /<h2/i.test(content);
  const hasH3 = /<h3/i.test(content);
  
  // If content lacks structure, don't inject (manual content should be preserved)
  if (!hasH2 && !hasH3 && content.length > 500) {
    // Add a semantic introduction section if primary keyword exists
    if (primaryKeyword && !content.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      const intro = `<p><strong>${primaryKeyword}</strong> is an important topic that requires understanding.</p>`;
      enhancedContent = intro + enhancedContent;
    }
  }
  
  return enhancedContent;
}

/**
 * Generate optimized image alt text with keywords
 */
export function generateOptimizedAltText(
  originalAlt: string,
  context: string,
  primaryKeyword?: string,
  lsiKeywords?: string[]
): string {
  // If alt text is already descriptive (>20 chars), enhance it
  if (originalAlt && originalAlt.length > 20) {
    if (primaryKeyword && !originalAlt.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      return `${originalAlt} - ${primaryKeyword}`;
    }
    return originalAlt;
  }
  
  // Generate new alt text
  const parts: string[] = [];
  
  if (primaryKeyword) {
    parts.push(primaryKeyword);
  }
  
  // Add context
  if (context && context.length < 50) {
    parts.push(context);
  }
  
  // Add LSI keyword if available
  if (lsiKeywords && lsiKeywords.length > 0 && parts.length < 3) {
    parts.push(lsiKeywords[0]);
  }
  
  return parts.join(' - ') || originalAlt || 'Article image';
}

/**
 * Calculate keyword density in content
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  if (!content || !keyword) return 0;
  
  const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  
  let occurrences = 0;
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const phrase = words.slice(i, i + keywordWords.length).join(' ');
    if (phrase === keyword.toLowerCase()) {
      occurrences++;
    }
  }
  
  return words.length > 0 ? (occurrences / words.length) * 100 : 0;
}

/**
 * Check if primary keyword appears in first 100 words
 */
export function hasKeywordInIntro(content: string, keyword: string): boolean {
  if (!content || !keyword) return false;
  
  const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = plainText.split(/\s+/).filter(w => w.length > 0).slice(0, 100);
  const first100Words = words.join(' ');
  
  return first100Words.includes(keyword.toLowerCase());
}

/**
 * Extract all headings from content
 */
export function extractHeadings(content: string): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, '').trim()
    });
  }
  
  return headings;
}

/**
 * Check if keywords are present in headings
 */
export function hasKeywordsInHeadings(
  content: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[]
): { primary: boolean; secondary: number } {
  const headings = extractHeadings(content);
  const headingText = headings.map(h => h.text.toLowerCase()).join(' ');
  
  const hasPrimary = primaryKeyword ? headingText.includes(primaryKeyword.toLowerCase()) : false;
  
  let secondaryCount = 0;
  if (secondaryKeywords) {
    secondaryKeywords.forEach(kw => {
      if (headingText.includes(kw.toLowerCase())) {
        secondaryCount++;
      }
    });
  }
  
  return { primary: hasPrimary, secondary: secondaryCount };
}

/**
 * Generate content optimization score
 */
export function calculateOptimizationScore(
  content: string,
  options: ContentOptimizationOptions
): number {
  let score = 0;
  const { primaryKeyword, secondaryKeywords, lsiKeywords, targetQueries } = options;
  
  // Check primary keyword in intro (20 points)
  if (primaryKeyword && hasKeywordInIntro(content, primaryKeyword)) {
    score += 20;
  }
  
  // Check keyword density (20 points)
  if (primaryKeyword) {
    const density = calculateKeywordDensity(content, primaryKeyword);
    if (density >= 0.5 && density <= 2.5) {
      score += 20;
    } else if (density > 0 && density < 0.5) {
      score += 10;
    }
  }
  
  // Check keywords in headings (20 points)
  const headingCheck = hasKeywordsInHeadings(content, primaryKeyword, secondaryKeywords);
  if (headingCheck.primary) score += 10;
  if (headingCheck.secondary > 0) score += Math.min(10, headingCheck.secondary * 5);
  
  // Check for FAQ sections (20 points)
  const faqs = extractFAQs(content);
  if (faqs.length > 0) {
    score += Math.min(20, faqs.length * 5);
  }
  
  // Check for LSI keywords (10 points)
  if (lsiKeywords && lsiKeywords.length > 0) {
    const plainText = content.toLowerCase();
    const presentLSI = lsiKeywords.filter(kw => plainText.includes(kw.toLowerCase()));
    score += Math.min(10, presentLSI.length * 2);
  }
  
  // Check content length (10 points)
  const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount >= 500) {
    score += 10;
  } else if (wordCount >= 300) {
    score += 5;
  }
  
  return Math.min(100, score);
}
