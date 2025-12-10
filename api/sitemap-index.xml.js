// api/sitemap-index.xml.js
// Sitemap Index - References all sitemaps for unified site structure

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = 'https://www.thebulletinbriefs.in';
    const today = new Date().toISOString().split('T')[0];

    // All sitemaps in the site
    const sitemaps = [
      { loc: `${baseUrl}/sitemap.xml`, lastmod: today },
      { loc: `${baseUrl}/web3-sitemap.xml`, lastmod: today },
      { loc: `${baseUrl}/upsc-sitemap.xml`, lastmod: today },
      { loc: `${baseUrl}/sitemap-tools.xml`, lastmod: today },
      { loc: `${baseUrl}/web-stories-sitemap.xml`, lastmod: today },
      { loc: `${baseUrl}/videos-sitemap.xml`, lastmod: today },
      { loc: `${baseUrl}/news-sitemap.xml`, lastmod: today },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate');
    
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Sitemap index generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}