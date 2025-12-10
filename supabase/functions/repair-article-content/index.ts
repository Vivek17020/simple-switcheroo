import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface RepairResult {
  articleId: string;
  title: string;
  hadIssues: boolean;
  issuesFixed: string[];
  originalLength: number;
  repairedLength: number;
}

/**
 * Edge Function to repair existing articles with malformed HTML
 * Fixes bold text and link issues across all published articles
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { articleIds, dryRun = true, batchSize = 50 } = await req.json();

    console.log(`[Repair] Starting content repair - Dry run: ${dryRun}`);

    // Build query for articles to repair
    let query = supabaseClient
      .from('articles')
      .select('id, title, content, slug')
      .eq('published', true);

    // If specific article IDs provided, only repair those
    if (articleIds && Array.isArray(articleIds) && articleIds.length > 0) {
      query = query.in('id', articleIds);
    }

    query = query.limit(batchSize);

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No articles to repair',
          results: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Repair] Found ${articles.length} articles to check`);

    const results: RepairResult[] = [];
    let repairedCount = 0;

    for (const article of articles) {
      try {
        const repairResult = repairArticleContent(article.content);
        
        if (repairResult.hadIssues) {
          results.push({
            articleId: article.id,
            title: article.title,
            hadIssues: true,
            issuesFixed: repairResult.issuesFixed,
            originalLength: repairResult.originalLength,
            repairedLength: repairResult.repairedLength,
          });

          // Only update if not dry run
          if (!dryRun) {
            const { error: updateError } = await supabaseClient
              .from('articles')
              .update({
                content: repairResult.repairedContent,
                updated_at: new Date().toISOString(),
              })
              .eq('id', article.id);

            if (updateError) {
              console.error(`[Repair] Failed to update article ${article.id}:`, updateError);
            } else {
              repairedCount++;
              console.log(`[Repair] ✓ Repaired: ${article.title}`);
            }
          }
        } else {
          results.push({
            articleId: article.id,
            title: article.title,
            hadIssues: false,
            issuesFixed: [],
            originalLength: article.content.length,
            repairedLength: article.content.length,
          });
        }
      } catch (error) {
        console.error(`[Repair] Error processing article ${article.id}:`, error);
        results.push({
          articleId: article.id,
          title: article.title,
          hadIssues: true,
          issuesFixed: ['Error: ' + (error instanceof Error ? error.message : String(error))],
          originalLength: 0,
          repairedLength: 0,
        });
      }
    }

    const articlesWithIssues = results.filter(r => r.hadIssues).length;

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        summary: {
          totalChecked: articles.length,
          articlesWithIssues,
          articlesRepaired: repairedCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Repair] Function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Repairs article content HTML
 */
function repairArticleContent(html: string): {
  repairedContent: string;
  hadIssues: boolean;
  issuesFixed: string[];
  originalLength: number;
  repairedLength: number;
} {
  const issuesFixed: string[] = [];
  let repaired = html;
  const originalLength = html.length;

  // 1. Normalize bold tags (b -> strong)
  const beforeBold = repaired;
  repaired = repaired.replace(/<b(\s|>)/gi, '<strong$1').replace(/<\/b>/gi, '</strong>');
  if (repaired !== beforeBold) {
    issuesFixed.push('Normalized <b> to <strong>');
  }

  // 2. Normalize italic tags (i -> em)
  const beforeItalic = repaired;
  repaired = repaired.replace(/<i(\s|>)/gi, '<em$1').replace(/<\/i>/gi, '</em>');
  if (repaired !== beforeItalic) {
    issuesFixed.push('Normalized <i> to <em>');
  }

  // 3. Fix broken nested formatting (strong inside broken links)
  const beforeNested = repaired;
  repaired = repaired.replace(
    /<strong>\s*(<a[^>]*>)(.*?)<\/strong>\s*<\/a>/gi,
    '$1<strong>$2</strong></a>'
  );
  repaired = repaired.replace(
    /<em>\s*(<a[^>]*>)(.*?)<\/em>\s*<\/a>/gi,
    '$1<em>$2</em></a>'
  );
  if (repaired !== beforeNested) {
    issuesFixed.push('Fixed nested formatting');
  }

  // 4. Remove TipTap classes from links
  const beforeClasses = repaired;
  repaired = repaired.replace(/<a([^>]*?)class="[^"]*?"([^>]*?)>/gi, '<a$1$2>');
  if (repaired !== beforeClasses) {
    issuesFixed.push('Removed TipTap classes');
  }

  // 5. Ensure external links have rel attribute
  const beforeRel = repaired;
  repaired = repaired.replace(
    /<a\s+(?!.*rel=)([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi,
    '<a $1 rel="noopener noreferrer">'
  );
  if (repaired !== beforeRel) {
    issuesFixed.push('Added rel attributes to links');
  }

  // 6. Fix empty paragraphs
  const beforeEmpty = repaired;
  repaired = repaired.replace(/<p>\s*<\/p>/gi, '');
  if (repaired !== beforeEmpty) {
    issuesFixed.push('Removed empty paragraphs');
  }

  // 7. Fix unclosed tags (basic)
  const beforeUnclosed = repaired;
  repaired = fixBasicUnclosedTags(repaired);
  if (repaired !== beforeUnclosed) {
    issuesFixed.push('Fixed unclosed tags');
  }

  const hadIssues = issuesFixed.length > 0;
  const repairedLength = repaired.length;

  return {
    repairedContent: repaired,
    hadIssues,
    issuesFixed,
    originalLength,
    repairedLength,
  };
}

/**
 * Basic unclosed tag fixer
 */
function fixBasicUnclosedTags(html: string): string {
  const stack: string[] = [];
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
  
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const matches = Array.from(html.matchAll(tagRegex));
  
  for (const match of matches) {
    const tagName = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    
    if (!selfClosing.includes(tagName)) {
      if (!isClosing) {
        stack.push(tagName);
      } else {
        if (stack[stack.length - 1] === tagName) {
          stack.pop();
        }
      }
    }
  }
  
  // Add missing closing tags
  if (stack.length > 0) {
    const closingTags = stack.reverse().map(tag => `</${tag}>`).join('');
    return html + closingTags;
  }
  
  return html;
}
