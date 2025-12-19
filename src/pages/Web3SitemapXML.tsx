import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Web3SitemapXML() {
  const { data: sitemapData, isLoading } = useQuery({
    queryKey: ["web3-sitemap"],
    queryFn: async () => {
      // Fetch Web3 category
      const { data: web3Category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", "web3forindia")
        .single();

      if (!web3Category) return null;

      // Fetch Web3 subcategories
      const { data: subcategories } = await supabase
        .from("categories")
        .select("id, slug, updated_at")
        .eq("parent_id", web3Category.id);

      const subcatIds = subcategories?.map((s) => s.id) || [];

      // Fetch all published Web3 articles with category
      const { data: articles } = await supabase
        .from("articles")
        .select(`
          slug, 
          updated_at, 
          published_at,
          categories:category_id(slug)
        `)
        .in("category_id", subcatIds)
        .eq("published", true)
        .order("updated_at", { ascending: false });

      return {
        subcategories: subcategories || [],
        articles: articles || [],
      };
    },
  });

  useEffect(() => {
    if (!isLoading && sitemapData) {
      const generateSitemap = () => {
        const baseUrl = "https://www.thebulletinbriefs.in";
        const today = new Date().toISOString().split("T")[0];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Web3 Home Page
        xml += "  <url>\n";
        xml += `    <loc>${baseUrl}/web3forindia</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += "    <changefreq>daily</changefreq>\n";
        xml += "    <priority>1.0</priority>\n";
        xml += "  </url>\n";

        // Web3 Dashboard
        xml += "  <url>\n";
        xml += `    <loc>${baseUrl}/web3forindia/dashboard</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += "    <changefreq>weekly</changefreq>\n";
        xml += "    <priority>0.8</priority>\n";
        xml += "  </url>\n";

        // Web3 About Page
        xml += "  <url>\n";
        xml += `    <loc>${baseUrl}/web3forindia/about</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += "    <changefreq>monthly</changefreq>\n";
        xml += "    <priority>0.7</priority>\n";
        xml += "  </url>\n";

        // Web3 Category Pages
        sitemapData.subcategories.forEach((category: any) => {
          xml += "  <url>\n";
          xml += `    <loc>${baseUrl}/web3forindia/${category.slug}</loc>\n`;
          xml += `    <lastmod>${
            category.updated_at?.split("T")[0] || today
          }</lastmod>\n`;
          xml += "    <changefreq>weekly</changefreq>\n";
          xml += "    <priority>0.9</priority>\n";
          xml += "  </url>\n";
        });

        // Web3 Article Pages - Updated URL structure
        sitemapData.articles.forEach((article: any) => {
          const categorySlug = article.categories?.slug || 'uncategorized';
          xml += "  <url>\n";
          xml += `    <loc>${baseUrl}/web3forindia/${categorySlug}/${article.slug}</loc>\n`;
          xml += `    <lastmod>${
            article.updated_at?.split("T")[0] || today
          }</lastmod>\n`;
          xml += "    <changefreq>monthly</changefreq>\n";
          xml += "    <priority>0.8</priority>\n";
          xml += "  </url>\n";
        });

        xml += "</urlset>";
        return xml;
      };

      const sitemap = generateSitemap();
      const blob = new Blob([sitemap], { type: "application/xml" });
      const url = URL.createObjectURL(blob);

      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = "web3-sitemap.xml";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [isLoading, sitemapData]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        {isLoading ? (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lg">Generating Web3 Sitemap...</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Web3 Sitemap Generated Successfully
            </h1>
            <p className="text-muted-foreground mb-4">
              Your sitemap has been downloaded
            </p>
            <a
              href="/web3forindia"
              className="text-primary hover:underline"
            >
              Return to Web3 for India
            </a>
          </>
        )}
      </div>
    </div>
  );
}
