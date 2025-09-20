import { useEffect } from 'react';

/**
 * Security component that sets Content Security Policy headers
 * Helps prevent XSS attacks and other code injection vulnerabilities
 */
export function CSPHeaders() {
  useEffect(() => {
    // Set Content Security Policy via meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.ampproject.org https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https:",
      "connect-src 'self' https://tadcyglvsjycpgsjkywj.supabase.co wss://tadcyglvsjycpgsjkywj.supabase.co",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
    
    // Remove existing CSP meta tag if present
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }
    
    document.head.appendChild(cspMeta);

    // Add additional security headers via meta tags
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityHeaders.forEach(header => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      
      // Remove existing if present
      const existing = document.querySelector(`meta[http-equiv="${header.name}"]`);
      if (existing) {
        existing.remove();
      }
      
      document.head.appendChild(meta);
    });

    return () => {
      // Cleanup is handled by React's effect cleanup
      // Meta tags will persist for security
    };
  }, []);

  return null; // This component doesn't render anything
}