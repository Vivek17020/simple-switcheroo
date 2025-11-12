const BASE_URL = 'https://www.thebulletinbriefs.in';

export default async function handler(req, res) {
  const currentDate = new Date().toISOString();
  
  // Define all tool routes with their priorities
  const toolRoutes = [
    // Main tools hub - highest priority
    { url: `${BASE_URL}/tools`, priority: '1.0', lastmod: currentDate },
    
    // Category hubs - high priority
    { url: `${BASE_URL}/tools/pdf-tools`, priority: '0.9', lastmod: currentDate },
    { url: `${BASE_URL}/tools/image-tools`, priority: '0.9', lastmod: currentDate },
    { url: `${BASE_URL}/tools/video-tools`, priority: '0.9', lastmod: currentDate },
    
    // PDF Tools - medium priority
    { url: `${BASE_URL}/tools/pdf-to-word`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/word-to-pdf`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/pdf-to-excel`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/excel-to-pdf`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/pdf-to-jpg`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/jpg-to-pdf`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/pdf-to-ppt`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/ppt-to-pdf`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/merge-pdf`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/split-pdf`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/compress-pdf`, priority: '0.8', lastmod: currentDate },
    
    // Image Tools - medium priority
    { url: `${BASE_URL}/tools/image-compressor`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/image-resizer`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/image-cropper`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/jpg-to-png`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/png-to-jpg`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/convert-to-webp`, priority: '0.8', lastmod: currentDate },
    
    // Video Tools - medium priority
    { url: `${BASE_URL}/tools/youtube-shorts-downloader`, priority: '0.8', lastmod: currentDate },
    { url: `${BASE_URL}/tools/instagram-video-downloader`, priority: '0.8', lastmod: currentDate },
  ];

  // Generate XML sitemap
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${toolRoutes.map(route => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(xmlContent);
}
