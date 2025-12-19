import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    let apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    let cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')?.trim();

    // If individual keys not set, try parsing from CLOUDINARY_URL
    if (!apiKey || !apiSecret || !cloudName) {
      const cloudinaryUrl = Deno.env.get('CLOUDINARY_URL')?.trim() || 
                            Deno.env.get('CLOUDINARY_API_KEY')?.trim(); // User might have put URL in API_KEY field
      
      if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
        console.log('📦 Parsing CLOUDINARY_URL...');
        const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (match) {
          apiKey = match[1];
          apiSecret = match[2];
          cloudName = match[3];
          console.log('✅ Parsed from URL - Cloud:', cloudName);
        }
      }
    }

    if (!apiKey || !apiSecret || !cloudName) {
      console.error('❌ Missing Cloudinary credentials');
      throw new Error('Cloudinary credentials not configured. Provide either CLOUDINARY_URL or individual keys (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME)');
    }

    console.log('✅ Cloudinary configured - Cloud:', cloudName, 'API Key length:', apiKey.length);

    const body = await req.json();
    const { image, folder = 'articles', resourceType = 'image' } = body;

    if (!image) {
      throw new Error('No image provided');
    }

    console.log('📤 Uploading image to Cloudinary...');
    console.log('Cloud name:', cloudName);
    console.log('Folder:', folder);

    // Generate timestamp for signature
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create signature - must include ALL parameters that will be sent (alphabetically sorted)
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Prepare form data - only include parameters that are in the signature
    const formData = new FormData();
    formData.append('file', image);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Cloudinary error:', errorText);
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const result = await uploadResponse.json();
    
    console.log('✅ Image uploaded successfully:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Format:', result.format);
    console.log('Size:', result.bytes, 'bytes');

    return new Response(
      JSON.stringify({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Upload error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
