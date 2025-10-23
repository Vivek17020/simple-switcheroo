import React, { useEffect } from 'react';

/**
 * Security component that sets Content Security Policy headers
 * Helps prevent XSS attacks and other code injection vulnerabilities
 */
export function CSPHeaders() {
  useEffect(() => {
    const isDev = import.meta.env.DEV;

    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';

    const prodDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.ampproject.org https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https:",
      // Allow Supabase and same-origin connections in production
      "connect-src 'self' https://tadcyglvsjycpgsjkywj.supabase.co wss://tadcyglvsjycpgsjkywj.supabase.co",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ];

    const devDirectives = [
      "default-src 'self' blob: data:",
      // Allow eval and blob scripts during dev for tooling (Vite, SWC)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https:",
      // Permit websocket/HMR and API calls during dev
      "connect-src 'self' ws: wss: https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    cspMeta.content = (isDev ? devDirectives : prodDirectives).join('; ');

    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) existingCSP.remove();
    document.head.appendChild(cspMeta);

    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
    ];

    securityHeaders.forEach((header) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      const existing = document.querySelector(`meta[http-equiv="${header.name}"]`);
      if (existing) existing.remove();
      document.head.appendChild(meta);
    });

    return () => {
      // Persist headers
    };
  }, []);

  return null;
}