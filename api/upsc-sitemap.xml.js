import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tadcyglvsjycpgsjkywj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU';
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = 'https://www.thebulletinbriefs.in';

export default async function handler(req, res) {
  try {
    // Get UPSC parent category
    const { data: parentCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'upscbriefs')
      .single();

    if (!parentCategory) {
      return res.status(404).send('UPSC category not found');
    }

    // Get all UPSC subcategories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, name, updated_at')
      .eq('parent_id', parentCategory.id);

    const categoryIds = categories?.map(c => c.id) || [];

    // Get all published UPSC articles
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at, category_id')
      .in('category_id', categoryIds)
      .eq('published', true)
      .order('updated_at', { ascending: false });

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += `  <url>
    <loc>${baseUrl}/upscbriefs</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // About page
    xml += `  <url>
    <loc>${baseUrl}/upscbriefs/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

    // Category pages
    for (const category of categories || []) {
      xml += `  <url>
    <loc>${baseUrl}/upscbriefs/${category.slug}</loc>
    <lastmod>${new Date(category.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    }

    // Article pages
    for (const article of articles || []) {
      const category = categories?.find(c => c.id === article.category_id);
      if (category) {
        xml += `  <url>
    <loc>${baseUrl}/upscbriefs/${category.slug}/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      }
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('UPSC sitemap error:', error);
    return res.status(500).send('Error generating sitemap');
  }
}
