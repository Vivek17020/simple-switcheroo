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
    const baseUrl = 'https://www.thebulletinbriefs.in';
    const today = new Date().toISOString().split('T')[0];

    // Get UPSC parent category
    const { data: parentCategory, error: parentError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'upscbriefs')
      .single();

    if (parentError || !parentCategory) {
      throw new Error('UPSC category not found');
    }

    // Get all UPSC subcategories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, slug, name, updated_at')
      .eq('parent_id', parentCategory.id);

    if (catError) {
      throw new Error('Error fetching categories');
    }

    const categoryIds = categories?.map(c => c.id) || [];

    // Get all published UPSC articles with category info
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select(`
        slug, 
        updated_at, 
        published_at,
        title,
        categories:category_id(slug)
      `)
      .in('category_id', categoryIds)
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (articlesError) {
      throw new Error('Error fetching articles');
    }

    // Get UPSC flashcards
    const { data: flashcards } = await supabase
      .from('upsc_flashcards')
      .select('id, subject, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    // Get UPSC quizzes
    const { data: quizzes } = await supabase
      .from('upsc_quizzes')
      .select('id, slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    // Get UPSC notes
    const { data: notes } = await supabase
      .from('upsc_notes')
      .select('id, subject, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    // Get PYQ questions (grouped by year)
    const { data: pyqYears } = await supabase
      .from('upsc_pyq_questions')
      .select('year')
      .eq('is_published', true)
      .order('year', { ascending: false });

    const uniqueYears = [...new Set(pyqYears?.map(q => q.year).filter(Boolean))];

    console.log(`Generating UPSC sitemap:
      - ${articles?.length || 0} articles
      - ${categories?.length || 0} categories
      - ${flashcards?.length || 0} flashcards
      - ${quizzes?.length || 0} quizzes
      - ${notes?.length || 0} notes
      - ${uniqueYears?.length || 0} PYQ years`);

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `<!-- UPSC Briefs Sitemap - Generated ${today} -->\n`;
    xml += `<!-- Includes ${articles?.length || 0} articles, ${categories?.length || 0} categories -->\n\n`;

    // UPSC Homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/upscbriefs</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Static pages
    const staticPages = [
      { path: 'about', changefreq: 'monthly', priority: '0.7' },
      { path: 'contact', changefreq: 'monthly', priority: '0.6' },
      { path: 'prelims', changefreq: 'weekly', priority: '0.9' },
      { path: 'mains', changefreq: 'weekly', priority: '0.9' },
      { path: 'optional', changefreq: 'weekly', priority: '0.8' },
      { path: 'current-affairs', changefreq: 'daily', priority: '0.9' },
      { path: 'practice', changefreq: 'daily', priority: '0.9' },
      { path: 'practice/pyq', changefreq: 'daily', priority: '0.8' },
      { path: 'practice/quizzes', changefreq: 'daily', priority: '0.8' },
      { path: 'practice/flashcards', changefreq: 'daily', priority: '0.8' },
      { path: 'resources', changefreq: 'weekly', priority: '0.8' },
      { path: 'dashboard', changefreq: 'weekly', priority: '0.7' },
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/upscbriefs/${page.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Category pages
    categories?.forEach(category => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/upscbriefs/${category.slug}</loc>\n`;
      xml += `    <lastmod>${category.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
    });

    // Article pages - using category/article URL structure
    articles?.forEach(article => {
      const categorySlug = article.categories?.slug || 'uncategorized';
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/upscbriefs/${categorySlug}/${article.slug}</loc>\n`;
      xml += `    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Quiz pages
    quizzes?.forEach(quiz => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/upscbriefs/practice/quiz/${quiz.slug || quiz.id}</loc>\n`;
      xml += `    <lastmod>${quiz.updated_at?.split('T')[0] || today}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // PYQ year pages
    uniqueYears?.forEach(year => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/upscbriefs/practice/pyq/${year}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    console.log(`✅ UPSC sitemap generated successfully with ${articles?.length || 0} articles`);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Short cache (2 minutes) for near-instant updates when articles are published
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=120, stale-while-revalidate=60');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('❌ Error generating UPSC sitemap:', error);
    return res.status(500).json({ error: 'Failed to generate sitemap', details: error.message });
  }
}
