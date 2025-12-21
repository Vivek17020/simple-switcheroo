/**
 * HTML Validator and Repair Utility
 * Pre-validates and auto-fixes common HTML issues before saving to database
 */

interface ValidationResult {
  isValid: boolean;
  repaired: string;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    fixed: boolean;
  }>;
  stats: {
    originalLength: number;
    repairedLength: number;
    changesApplied: number;
  };
}

/**
 * Validates and repairs HTML content
 * Fixes common issues that cause bold text and links to break
 */
export function validateAndRepairHtml(html: string): ValidationResult {
  const issues: ValidationResult['issues'] = [];
  let repaired = html;
  let changesApplied = 0;
  const originalLength = html.length;

  // 1. Fix unclosed tags
  const unclosedTagsFixed = fixUnclosedTags(repaired);
  if (unclosedTagsFixed !== repaired) {
    repaired = unclosedTagsFixed;
    changesApplied++;
    issues.push({
      type: 'warning',
      message: 'Fixed unclosed HTML tags',
      fixed: true,
    });
  }

  // 2. Normalize bold tags (use <strong> consistently)
  const boldNormalized = repaired.replace(/<b(\s|>)/gi, '<strong$1').replace(/<\/b>/gi, '</strong>');
  if (boldNormalized !== repaired) {
    repaired = boldNormalized;
    changesApplied++;
    issues.push({
      type: 'info',
      message: 'Normalized <b> tags to <strong>',
      fixed: true,
    });
  }

  // 3. Normalize italic tags (use <em> consistently)
  const italicNormalized = repaired.replace(/<i(\s|>)/gi, '<em$1').replace(/<\/i>/gi, '</em>');
  if (italicNormalized !== repaired) {
    repaired = italicNormalized;
    changesApplied++;
    issues.push({
      type: 'info',
      message: 'Normalized <i> tags to <em>',
      fixed: true,
    });
  }

  // 4. Fix nested formatting (bold inside links, etc.)
  const nestedFixed = fixNestedFormatting(repaired);
  if (nestedFixed !== repaired) {
    repaired = nestedFixed;
    changesApplied++;
    issues.push({
      type: 'warning',
      message: 'Fixed nested formatting issues',
      fixed: true,
    });
  }

  // 5. Clean up link attributes (remove TipTap classes)
  const linksCleaned = repaired.replace(/<a([^>]*?)class="[^"]*?"([^>]*?)>/gi, '<a$1$2>');
  if (linksCleaned !== repaired) {
    repaired = linksCleaned;
    changesApplied++;
    issues.push({
      type: 'info',
      message: 'Removed unnecessary CSS classes from links',
      fixed: true,
    });
  }

  // 6. Ensure links have proper rel attributes
  const linksWithRel = repaired.replace(
    /<a\s+(?!.*rel=)([^>]*href="http[^"]*"[^>]*)>/gi,
    '<a $1 rel="noopener noreferrer">'
  );
  if (linksWithRel !== repaired) {
    repaired = linksWithRel;
    changesApplied++;
    issues.push({
      type: 'info',
      message: 'Added rel attributes to external links',
      fixed: true,
    });
  }

  // 7. Fix malformed paragraphs
  const paragraphsFixed = fixMalformedParagraphs(repaired);
  if (paragraphsFixed !== repaired) {
    repaired = paragraphsFixed;
    changesApplied++;
    issues.push({
      type: 'warning',
      message: 'Fixed malformed paragraph structures',
      fixed: true,
    });
  }

  // 8. Check for potential issues that can't be auto-fixed
  const criticalIssues = detectCriticalIssues(repaired);
  issues.push(...criticalIssues);

  const isValid = !issues.some(issue => issue.type === 'error');

  return {
    isValid,
    repaired,
    issues,
    stats: {
      originalLength,
      repairedLength: repaired.length,
      changesApplied,
    },
  };
}

/**
 * Fixes unclosed HTML tags
 */
function fixUnclosedTags(html: string): string {
  const stack: string[] = [];
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
  let fixed = html;

  // Simple tag matching (not perfect but catches most cases)
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const tags: Array<{ tag: string; isClosing: boolean; index: number }> = [];

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    
    if (!selfClosing.includes(tagName)) {
      tags.push({ tag: tagName, isClosing, index: match.index });
    }
  }

  // Track unclosed tags
  for (const { tag, isClosing } of tags) {
    if (!isClosing) {
      stack.push(tag);
    } else {
      if (stack[stack.length - 1] === tag) {
        stack.pop();
      }
    }
  }

  // Add closing tags for unclosed elements
  if (stack.length > 0) {
    const closingTags = stack.reverse().map(tag => `</${tag}>`).join('');
    fixed = fixed + closingTags;
  }

  return fixed;
}

/**
 * Fixes nested formatting issues
 * Example: <a><strong>text</strong></a> is valid
 * But malformed nesting like <strong><a>text</strong></a> is fixed
 */
function fixNestedFormatting(html: string): string {
  // This is a simplified fix - real implementation would use a proper HTML parser
  // For now, ensure common patterns are correct
  
  // Fix: <strong><a> ... </strong></a> -> <a><strong> ... </strong></a>
  let fixed = html.replace(
    /<strong>\s*(<a[^>]*>)(.*?)<\/strong>\s*<\/a>/gi,
    '$1<strong>$2</strong></a>'
  );

  // Fix: <em><a> ... </em></a> -> <a><em> ... </em></a>
  fixed = fixed.replace(
    /<em>\s*(<a[^>]*>)(.*?)<\/em>\s*<\/a>/gi,
    '$1<em>$2</em></a>'
  );

  return fixed;
}

/**
 * Fixes malformed paragraph structures
 */
function fixMalformedParagraphs(html: string): string {
  // Remove empty paragraphs
  let fixed = html.replace(/<p>\s*<\/p>/gi, '');
  
  // Fix paragraphs with only whitespace
  fixed = fixed.replace(/<p>(\s+)<\/p>/gi, '');
  
  // Ensure paragraph tags are properly closed
  fixed = fixed.replace(/<p([^>]*)>([^<]*?)(?=<p|$)/gi, (match, attrs, content) => {
    if (!match.includes('</p>')) {
      return `<p${attrs}>${content}</p>`;
    }
    return match;
  });

  return fixed;
}

/**
 * Detects critical issues that can't be auto-fixed
 * NOTE: Inline event handler detection is disabled to allow code examples in articles
 */
function detectCriticalIssues(html: string): ValidationResult['issues'] {
  const issues: ValidationResult['issues'] = [];

  // DISABLED: Inline event handler detection was blocking code examples in tutorials
  // Code examples like onclick="..." in <pre> or <code> tags are valid educational content
  // Real XSS protection is handled by DOMPurify in sanitize.ts

  // Check for very large content that might cause rendering issues
  if (html.length > 500000) {
    issues.push({
      type: 'warning',
      message: 'Content is very large (may cause performance issues)',
      fixed: false,
    });
  }

  // Check for excessive nesting depth
  const maxNestingDepth = getMaxNestingDepth(html);
  if (maxNestingDepth > 20) {
    issues.push({
      type: 'warning',
      message: `Excessive HTML nesting depth (${maxNestingDepth} levels)`,
      fixed: false,
    });
  }

  return issues;
}

/**
 * Calculates maximum nesting depth of HTML
 */
function getMaxNestingDepth(html: string): number {
  let maxDepth = 0;
  let currentDepth = 0;
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    
    if (!selfClosing.includes(tagName)) {
      if (!isClosing) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
  }

  return maxDepth;
}

/**
 * Quick validation check without repair
 * NOTE: Inline event handler check removed to allow code examples
 */
export function quickValidateHtml(html: string): boolean {
  try {
    // Basic checks for common issues
    if (!html || typeof html !== 'string') return false;
    // DISABLED: Inline handler check was blocking code examples
    // if (html.match(/on\w+\s*=/i)) return false;
    if (html.length > 1000000) return false; // Too large
    
    // Check for balanced tags (simplified)
    const openTags = (html.match(/<(?!\/)[a-z][a-z0-9]*[^>]*>/gi) || []).length;
    const closeTags = (html.match(/<\/[a-z][a-z0-9]*>/gi) || []).length;
    const selfClosing = (html.match(/<(br|hr|img|input|meta|link)[^>]*>/gi) || []).length;
    
    // Rough balance check
    return Math.abs(openTags - closeTags - selfClosing) < 3;
  } catch {
    return false;
  }
}
