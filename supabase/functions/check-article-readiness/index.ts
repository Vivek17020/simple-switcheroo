import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleData {
  title: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  category_id?: string;
  image_url?: string;
}

interface ReadinessCheck {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const articleData: ArticleData = await req.json();
    
    console.log('Checking article readiness for:', articleData.title);

    const checks: ReadinessCheck[] = [];
    
    // 1. Content Quality Check
    const contentCheck: ReadinessCheck = {
      category: 'Content Quality',
      score: 0,
      maxScore: 100,
      issues: [],
      suggestions: []
    };

    const wordCount = articleData.content?.split(/\s+/).length || 0;
    if (wordCount >= 300) {
      contentCheck.score += 30;
    } else {
      contentCheck.issues.push(`Word count is ${wordCount}. Minimum recommended: 300 words`);
      contentCheck.suggestions.push('Add more detailed content to improve article depth');
    }

    if (articleData.content?.includes('<h2>') || articleData.content?.includes('<h3>')) {
      contentCheck.score += 20;
    } else {
      contentCheck.issues.push('No headings (H2/H3) found in content');
      contentCheck.suggestions.push('Add proper heading structure for better readability');
    }

    if (articleData.content?.includes('<strong>')) {
      contentCheck.score += 15;
    } else {
      contentCheck.issues.push('No keywords are bolded');
      contentCheck.suggestions.push('Use the "Bold Keywords" AI button to highlight important terms');
    }

    if (articleData.content?.includes('<!-- image:')) {
      contentCheck.score += 15;
    } else {
      contentCheck.issues.push('No image placeholders found');
      contentCheck.suggestions.push('Add images to make content more engaging');
    }

    const paragraphCount = (articleData.content?.match(/<p>/g) || []).length;
    if (paragraphCount >= 3) {
      contentCheck.score += 20;
    } else {
      contentCheck.issues.push(`Only ${paragraphCount} paragraphs found`);
      contentCheck.suggestions.push('Break content into more paragraphs for readability');
    }

    checks.push(contentCheck);

    // 2. SEO Optimization Check
    const seoCheck: ReadinessCheck = {
      category: 'SEO Optimization',
      score: 0,
      maxScore: 100,
      issues: [],
      suggestions: []
    };

    const titleLength = (articleData.meta_title || articleData.title || '').length;
    if (titleLength >= 30 && titleLength <= 60) {
      seoCheck.score += 25;
    } else if (titleLength > 0) {
      seoCheck.issues.push(`Title length is ${titleLength} chars. Ideal: 30-60 characters`);
      seoCheck.suggestions.push('Optimize title length for search engines');
      seoCheck.score += 15;
    } else {
      seoCheck.issues.push('No title set');
      seoCheck.suggestions.push('Add a compelling title');
    }

    const metaDescLength = (articleData.meta_description || articleData.excerpt || '').length;
    if (metaDescLength >= 120 && metaDescLength <= 160) {
      seoCheck.score += 25;
    } else if (metaDescLength > 0) {
      seoCheck.issues.push(`Meta description is ${metaDescLength} chars. Ideal: 120-160 characters`);
      seoCheck.suggestions.push('Adjust meta description length for optimal display');
      seoCheck.score += 15;
    } else {
      seoCheck.issues.push('No meta description set');
      seoCheck.suggestions.push('Add a meta description to improve click-through rate');
    }

    if (articleData.tags && articleData.tags.length >= 3) {
      seoCheck.score += 20;
    } else {
      seoCheck.issues.push(`Only ${articleData.tags?.length || 0} tags. Recommended: 3-10 tags`);
      seoCheck.suggestions.push('Add more relevant tags/keywords');
    }

    if (articleData.category_id) {
      seoCheck.score += 15;
    } else {
      seoCheck.issues.push('No category selected');
      seoCheck.suggestions.push('Select a category for better organization');
    }

    if (articleData.excerpt) {
      seoCheck.score += 15;
    } else {
      seoCheck.issues.push('No excerpt provided');
      seoCheck.suggestions.push('Add an excerpt to summarize your article');
    }

    checks.push(seoCheck);

    // 3. Human-Like Content Check
    const humanCheck: ReadinessCheck = {
      category: 'Human-Like Quality',
      score: 0,
      maxScore: 100,
      issues: [],
      suggestions: []
    };

    // Check for varied sentence structure
    const sentences = articleData.content?.split(/[.!?]+/).filter(s => s.trim().length > 0) || [];
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / (sentences.length || 1);
    
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      humanCheck.score += 30;
    } else {
      humanCheck.issues.push(`Average sentence length: ${Math.round(avgSentenceLength)} words`);
      humanCheck.suggestions.push('Use the "Humanize Content" AI button to improve natural flow');
      humanCheck.score += 15;
    }

    // Check for contractions (sign of human writing)
    const hasContractions = /\b(can't|won't|don't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|shouldn't|couldn't)\b/i.test(articleData.content || '');
    if (hasContractions) {
      humanCheck.score += 20;
    } else {
      humanCheck.suggestions.push('Consider adding natural contractions for more conversational tone');
    }

    // Check for personal pronouns (engagement)
    const hasPersonalTouch = /\b(we|our|you|your|I|my)\b/i.test(articleData.content || '');
    if (hasPersonalTouch) {
      humanCheck.score += 25;
    } else {
      humanCheck.issues.push('Content lacks personal engagement');
      humanCheck.suggestions.push('Add personal perspective or address the reader directly');
    }

    // Check for varied vocabulary
    const words = articleData.content?.toLowerCase().split(/\W+/).filter(w => w.length > 3) || [];
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / (words.length || 1);
    
    if (vocabularyRichness > 0.5) {
      humanCheck.score += 25;
    } else {
      humanCheck.issues.push('Vocabulary could be more diverse');
      humanCheck.suggestions.push('Use the "SEO Optimize" button to enrich word variety');
      humanCheck.score += 10;
    }

    checks.push(humanCheck);

    // 4. Media & Engagement Check
    const mediaCheck: ReadinessCheck = {
      category: 'Media & Engagement',
      score: 0,
      maxScore: 100,
      issues: [],
      suggestions: []
    };

    if (articleData.image_url) {
      mediaCheck.score += 40;
    } else {
      mediaCheck.issues.push('No featured image set');
      mediaCheck.suggestions.push('Add a featured image to attract readers');
    }

    const hasInlineImages = articleData.content?.includes('<!-- image:') || false;
    if (hasInlineImages) {
      mediaCheck.score += 30;
    } else {
      mediaCheck.suggestions.push('Add inline images with AI-generated placeholders');
    }

    const hasLinks = articleData.content?.includes('<a href=') || false;
    if (hasLinks) {
      mediaCheck.score += 30;
    } else {
      mediaCheck.issues.push('No internal/external links found');
      mediaCheck.suggestions.push('Add relevant links to improve authority and user experience');
    }

    checks.push(mediaCheck);

    // Calculate overall score
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const totalMaxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
    const overallScore = Math.round((totalScore / totalMaxScore) * 100);

    let readinessLevel: string;
    let readinessColor: string;
    let readinessMessage: string;

    if (overallScore >= 90) {
      readinessLevel = 'Excellent';
      readinessColor = 'green';
      readinessMessage = '🎉 Your article is ready to publish! All quality checks passed.';
    } else if (overallScore >= 75) {
      readinessLevel = 'Good';
      readinessColor = 'blue';
      readinessMessage = '✅ Your article is in good shape. Address minor issues for best results.';
    } else if (overallScore >= 60) {
      readinessLevel = 'Fair';
      readinessColor = 'yellow';
      readinessMessage = '⚠️ Article needs improvements before publishing. Review suggestions below.';
    } else {
      readinessLevel = 'Needs Work';
      readinessColor = 'red';
      readinessMessage = '❌ Article requires significant improvements. Follow the suggestions below.';
    }

    const response = {
      overallScore,
      readinessLevel,
      readinessColor,
      readinessMessage,
      checks,
      timestamp: new Date().toISOString()
    };

    console.log('Article readiness check complete:', { overallScore, readinessLevel });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking article readiness:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check article readiness',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
