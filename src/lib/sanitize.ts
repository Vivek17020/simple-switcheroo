import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML content to sanitize
 * @returns Sanitized HTML content safe for rendering
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'div', 'span',
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror', 'onmouseover'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
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