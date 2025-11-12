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

  // Normalize line breaks before sanitization to preserve spacing
  const normalizedHtml = html
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Add hook to validate iframe sources
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const element = node as Element;
      const src = element.getAttribute('src');
      if (src) {
        // Only allow YouTube iframes
        const isYouTube = /^(https?:)?\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(src);
        if (!isYouTube) {
          element.parentNode?.removeChild(element);
        }
      }
    }
  });

  // Add hook to preserve paragraph spacing
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Ensure empty paragraphs with <br> tags are preserved
    if (node.nodeName === 'P' && !node.textContent?.trim() && !node.querySelector('br')) {
      const br = document.createElement('br');
      node.appendChild(br);
    }
  });

  const sanitized = DOMPurify.sanitize(normalizedHtml, {
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
      'abbr', 'cite', 'kbd', 'q', 'samp', 'var',
      // Editor-specific tags
      'iframe', 'input', 'label', 'video', 'source'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'src', 'alt', 'width', 'height', 'loading', 'decoding',
      'class', 'id', 'style', 'data-*',
      'rowspan', 'colspan',
      'start', 'reversed', 'type',
      // Editor-specific attributes
      'checked', 'disabled',
      'frameborder', 'allowfullscreen', 'allow',
      'controls', 'autoplay', 'loop', 'muted', 'playsinline',
      'for'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: true,
    ADD_TAGS: ['iframe'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'oninput', 'onchange', 'onsubmit'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'textarea', 'select', 'button'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    USE_PROFILES: { html: true },
    // Preserve whitespace and structure
    IN_PLACE: false
  });

  // Remove hooks after sanitization
  DOMPurify.removeHook('uponSanitizeElement');
  DOMPurify.removeHook('afterSanitizeAttributes');

  return sanitized;
}

/**
 * Sanitizes CSS for inline styles
 * @param css - CSS content to sanitize  
 * @returns Sanitized CSS content
 */
export function sanitizeCSS(css: string): string {
  return DOMPurify.sanitize(css);
}