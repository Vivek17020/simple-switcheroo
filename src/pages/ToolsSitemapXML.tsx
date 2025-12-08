import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ToolsSitemapXML() {
  const [sitemapContent, setSitemapContent] = useState<string>("");

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('tools-sitemap');
        
        if (error) {
          console.error('Error generating tools sitemap:', error);
          return;
        }

        // The edge function returns XML as text
        const xmlContent = typeof data === 'string' ? data : new XMLSerializer().serializeToString(data);
        setSitemapContent(xmlContent);
      } catch (err) {
        console.error('Failed to fetch tools sitemap:', err);
      }
    };

    generateSitemap();
  }, []);

  useEffect(() => {
    if (sitemapContent) {
      // Create a Blob with XML content type
      const blob = new Blob([sitemapContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Clean up on unmount
      return () => URL.revokeObjectURL(url);
    }
  }, [sitemapContent]);

  if (!sitemapContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <pre style={{ 
      margin: 0, 
      padding: 0, 
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }}>
      {sitemapContent}
    </pre>
  );
}
