export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    res.status(400).send('Missing slug parameter');
    return;
  }

  try {
    const supabaseUrl = `https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/web-story-amp?slug=${encodeURIComponent(slug)}`;
    
    const response = await fetch(supabaseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });

    const html = await response.text();

    // Set proper headers for AMP HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(response.status).send(html);
  } catch (error) {
    console.error('Error fetching AMP story:', error);
    res.status(500).send('Error fetching AMP story');
  }
}
