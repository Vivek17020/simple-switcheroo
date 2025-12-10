// api/sitemap-tools.xml.js
// Tools sitemap for Vercel serverless

const BASE_URL = 'https://www.thebulletinbriefs.in';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Generating tools sitemap...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Define all tool routes with their priorities
    const toolRoutes = [
      // Main tools hub - highest priority
      { path: '/tools', priority: '1.0', changefreq: 'weekly' },
      
      // Category hubs - high priority
      { path: '/tools/pdf-tools', priority: '0.9', changefreq: 'weekly' },
      { path: '/tools/image-tools', priority: '0.9', changefreq: 'weekly' },
      { path: '/tools/video-tools', priority: '0.9', changefreq: 'weekly' },
      
      // PDF Tools - medium priority
      { path: '/tools/pdf-to-word', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/word-to-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/pdf-to-excel', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/excel-to-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/pdf-to-jpg', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/jpg-to-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/pdf-to-ppt', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/ppt-to-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/merge-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/split-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/compress-pdf', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/pdf-watermark', priority: '0.8', changefreq: 'monthly' },
      
      // Image Tools - medium priority
      { path: '/tools/image-compressor', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/image-resizer', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/image-cropper', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/jpg-to-png', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/png-to-jpg', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/convert-to-webp', priority: '0.8', changefreq: 'monthly' },
      
      // Video Tools - medium priority
      { path: '/tools/youtube-shorts-downloader', priority: '0.8', changefreq: 'monthly' },
      { path: '/tools/instagram-video-downloader', priority: '0.8', changefreq: 'monthly' },
    ];

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${toolRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    console.log(`✅ Tools sitemap generated with ${toolRoutes.length} URLs`);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate');
    
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Tools sitemap generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
