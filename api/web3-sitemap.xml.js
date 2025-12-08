import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = 'https://tadcyglvsjycpgsjkywj.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
      throw new Error('Missing Supabase service role key');
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

    // Fetch all published Web3 articles with category info
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select(`
        slug, 
        updated_at, 
        published_at, 
        title, 
        excerpt,
        categories:category_id(slug)
      `)
      .in('category_id', subcatIds)
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (articlesError) {
      throw new Error('Error fetching articles');
    }

    // Fetch Web3 learning paths
    const { data: learningPaths, error: pathsError } = await supabase
      .from('web3_learning_paths')
      .select('slug, updated_at')
      .order('display_order');

    // Fetch Web3 code snippets (for playground)
    const { data: codeSnippets, error: snippetsError } = await supabase
      .from('web3_code_snippets')
      .select('slug, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // Generate XML sitemap
    const baseUrl = 'https://www.thebulletinbriefs.in';
    const today = new Date().toISOString().split('T')[0];

    console.log(`Generating Web3 sitemap:
      - ${articles?.length || 0} articles
      - ${subcategories?.length || 0} categories
      - ${learningPaths?.length || 0} learning paths
      - ${codeSnippets?.length || 0} code snippets`);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `<!-- Web3 for India Sitemap - Generated ${today} -->\n`;
    xml += `<!-- Includes ${articles?.length || 0} articles, ${subcategories?.length || 0} categories, ${learningPaths?.length || 0} learning paths, ${codeSnippets?.length || 0} snippets -->\n\n`;

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

    // Web3 Article Pages - using category/article URL structure
    articles?.forEach((article) => {
      const categorySlug = article.categories?.slug || 'uncategorized';
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/web3forindia/${categorySlug}/${article.slug}</loc>\n`;
      xml += `    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Web3 Code Playground
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/web3forindia/playground</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';

    // Web3 Learning Paths
    learningPaths?.forEach((path) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/web3forindia/learning-path/${path.slug}</loc>\n`;
      xml += `    <lastmod>${path.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Web3 Code Snippets
    codeSnippets?.forEach((snippet) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/web3forindia/snippet/${snippet.slug}</loc>\n`;
      xml += `    <lastmod>${snippet.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    console.log(`✅ Web3 sitemap generated successfully with ${articles?.length || 0} articles`);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('❌ Error generating Web3 sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap', details: error.message });
  }
}
