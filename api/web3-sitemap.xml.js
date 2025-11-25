import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Web3 category
    const { data: web3Category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'web3forindia')
      .single();

    if (categoryError || !web3Category) {
      throw new Error('Web3 category not found');
    }

    // Fetch Web3 subcategories
    const { data: subcategories, error: subcatError } = await supabase
      .from('categories')
      .select('id, slug, updated_at')
      .eq('parent_id', web3Category.id);

    if (subcatError) {
      throw new Error('Error fetching subcategories');
    }

    const subcatIds = subcategories?.map((s) => s.id) || [];

    // Fetch all published Web3 articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at, title, excerpt')
      .in('category_id', subcatIds)
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (articlesError) {
      throw new Error('Error fetching articles');
    }

    // Generate XML sitemap
    const baseUrl = 'https://www.thebulletinbriefs.in';
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Web3 Home Page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/web3forindia</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Web3 Dashboard
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/web3forindia/dashboard</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // Web3 About Page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/web3forindia/about</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    // Web3 Category Pages
    subcategories?.forEach((category) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/web3forindia/${category.slug}</loc>\n`;
      xml += `    <lastmod>${category.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
    });

    // Web3 Article Pages
    articles?.forEach((article) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/web3forindia/article/${article.slug}</loc>\n`;
      xml += `    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating Web3 sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap', details: error.message });
  }
}
