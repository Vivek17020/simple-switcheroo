import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SitemapXML() {
  const [xmlContent, setXmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('sitemap');

        if (error) {
          console.error('Error calling sitemap function:', error);
          throw error;
        }

        setXmlContent(data);
      } catch (error) {
        console.error('Failed to generate sitemap:', error);
        // Fallback to a basic sitemap
        setXmlContent(generateBasicSitemap());
      } finally {
        setIsLoading(false);
      }
    };

    generateSitemap();
  }, []);

  useEffect(() => {
    if (xmlContent && !isLoading) {
      // Create a proper XML response
      const blob = new Blob([xmlContent], { 
        type: 'application/xml; charset=utf-8' 
      });
      
      // Create object URL and redirect to it
      const url = URL.createObjectURL(blob);
      
      // Use replace to avoid back button issues
      window.location.replace(url);
      
      // Clean up the URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    }
  }, [xmlContent, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Generating Sitemap...</h1>
          <p className="text-muted-foreground">
            Please wait while we generate your dynamic sitemap.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function generateBasicSitemap() {
  const baseUrl = "https://thebulletinbriefs.in";
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/subscription</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/rss</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
}

