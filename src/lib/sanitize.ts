import DOMPurify from 'dompurify';

const isDevelopment = import.meta.env.DEV;

/**
 * Enhanced sanitization configuration to prevent content loss
 * Specifically configured to preserve bold text and links
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'td', 'th', 'caption',
    'div', 'span', 'section', 'article',
    'hr', 'sub', 'sup', 'mark', 'del', 'ins',
    'figure', 'figcaption',
    'dl', 'dt', 'dd',
    'abbr', 'cite', 'kbd', 'q', 'samp', 'var', 'time'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title',
    'src', 'alt', 'width', 'height', 'loading', 'decoding',
    'class', 'id',
    'rowspan', 'colspan',
    'start', 'reversed', 'type', 'datetime',
    'language' // Allow language attribute for code blocks
  ],
  // Enhanced URI regex to support relative URLs (internal links)
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|\/|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false, // Disabled to prevent XSS via data attributes
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'oninput', 'onchange', 'style'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: true, // Prevent removal of safe content
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false,
  SAFE_FOR_TEMPLATES: false,
  USE_PROFILES: { html: true }
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Enhanced version with logging and content preservation
 * @param html - Raw HTML content to sanitize
 * @returns Sanitized HTML content safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const originalLength = html.length;
  const sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  const sanitizedLength = sanitized.length;
  
  // Log if significant content was removed (dev only)
  if (isDevelopment && sanitizedLength < originalLength * 0.95) {
    const percentRemoved = ((originalLength - sanitizedLength) / originalLength * 100).toFixed(1);
    console.warn(`[Sanitizer] Removed ${percentRemoved}% of content (${originalLength} → ${sanitizedLength} chars)`);
  }

  return sanitized;
}

/**
 * Sanitizes HTML with detailed logging for debugging
 * Only use during development/debugging
 */
export function sanitizeWithLogging(html: string): { 
  sanitized: string; 
  removed: string[]; 
  originalLength: number; 
  sanitizedLength: number; 
} {
  if (!html || typeof html !== 'string') {
    return { sanitized: '', removed: [], originalLength: 0, sanitizedLength: 0 };
  }

  const removed: string[] = [];
  const originalLength = html.length;
  
  // Configure DOMPurify to track removed elements
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.allowedTags[data.tagName] === false) {
      removed.push(`<${data.tagName}>`);
    }
  });

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (!data.attrValue || data.forceKeepAttr) return;
    if (!data.allowedAttributes[data.attrName]) {
      removed.push(`${data.attrName}="${data.attrValue}"`);
    }
  });

  const sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  const sanitizedLength = sanitized.length;

  // Remove hooks after use
  DOMPurify.removeAllHooks();

  return { sanitized, removed, originalLength, sanitizedLength };
}

/**
 * Sanitizes CSS for inline styles
 * @param css - CSS content to sanitize  
 * @returns Sanitized CSS content
 */
export function sanitizeCSS(css: string): string {
  return DOMPurify.sanitize(css);
}