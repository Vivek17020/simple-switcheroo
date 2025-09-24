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
 * Sanitizes CSS for inline styles with strict rules
 * @param css - CSS content to sanitize  
 * @returns Sanitized CSS content
 */
export function sanitizeCSS(css: string): string {
  return DOMPurify.sanitize(css, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror', 'onmouseover', 'javascript'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'style'],
    USE_PROFILES: { html: false }
  });
}

/**
 * Validates and sanitizes user input for comments
 * @param input - User input to validate
 * @returns Sanitized and validated input
 */
export function validateUserInput(input: string): { isValid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];
  
  // Length validation
  if (input.length > 10000) {
    errors.push('Content too long (max 10,000 characters)');
  }
  
  if (input.trim().length < 3) {
    errors.push('Content too short (min 3 characters)');
  }
  
  // Rate limiting check (basic)
  const suspiciousPatterns = [
    /(.)\1{50,}/g, // Repeated characters
    /(https?:\/\/[^\s]+){10,}/g, // Too many URLs
    /[A-Z]{100,}/g, // Excessive caps
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      errors.push('Content contains suspicious patterns');
      break;
    }
  }
  
  // Sanitize the input
  const sanitized = sanitizeHtml(input);
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
}