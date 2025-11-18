import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML content to sanitize
 * @returns Sanitized HTML content safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
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
      'abbr', 'cite', 'kbd', 'q', 'samp', 'var'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height', 'loading', 'decoding',
      'class', 'id', 'style', 'data-*',
      'rowspan', 'colspan',
      'start', 'reversed', 'type'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: true,
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'oninput', 'onchange'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    USE_PROFILES: { html: true }
  });
}

/**
 * Sanitizes CSS for inline styles
 * @param css - CSS content to sanitize  
 * @returns Sanitized CSS content
 */
export function sanitizeCSS(css: string): string {
  return DOMPurify.sanitize(css);
}