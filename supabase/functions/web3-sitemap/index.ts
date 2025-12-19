import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🌐 Generating Web3 sitemap...');

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
    const { data: articles } = await supabase
      .from('articles')
      .select(`
        slug, 
        updated_at, 
        published_at, 
        title,
        categories:category_id(slug)
      `)
      .in('category_id', subcatIds)
      .eq('published', true)
      .order('updated_at', { ascending: false });

    // Fetch Web3 learning paths
    const { data: learningPaths } = await supabase
      .from('web3_learning_paths')
      .select('slug, updated_at')
      .order('display_order');

    // Fetch Web3 code snippets
    const { data: codeSnippets } = await supabase
      .from('web3_code_snippets')
      .select('slug, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    console.log(`✅ Found ${articles?.length || 0} articles, ${learningPaths?.length || 0} learning paths, ${codeSnippets?.length || 0} snippets`);

    const baseUrl = 'https://www.thebulletinbriefs.in';
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Web3 Home Page
    xml += `  <url>
    <loc>${baseUrl}/web3forindia</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // Web3 Dashboard
    xml += `  <url>
    <loc>${baseUrl}/web3forindia/dashboard</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;

    // Web3 About Page
    xml += `  <url>
    <loc>${baseUrl}/web3forindia/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

    // Web3 Code Playground
    xml += `  <url>
    <loc>${baseUrl}/web3forindia/playground</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

    // Web3 Category Pages
    subcategories?.forEach((category) => {
      xml += `  <url>
    <loc>${baseUrl}/web3forindia/${category.slug}</loc>
    <lastmod>${category.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    // Web3 Article Pages - Updated URL structure
    articles?.forEach((article: any) => {
      const categorySlug = article.categories?.slug || 'uncategorized';
      xml += `  <url>
    <loc>${baseUrl}/web3forindia/${categorySlug}/${article.slug}</loc>
    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Web3 Learning Paths
    learningPaths?.forEach((path) => {
      xml += `  <url>
    <loc>${baseUrl}/web3forindia/learning-path/${path.slug}</loc>
    <lastmod>${path.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    });

    // Web3 Code Snippets
    codeSnippets?.forEach((snippet) => {
      xml += `  <url>
    <loc>${baseUrl}/web3forindia/snippet/${snippet.slug}</loc>
    <lastmod>${snippet.updated_at?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    });

    xml += '</urlset>';

    console.log('✅ Web3 sitemap generated successfully');

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error('❌ Error generating Web3 sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
