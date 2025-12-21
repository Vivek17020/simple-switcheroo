import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

interface SlideData {
  text: string;
  imagePrompt: string;
  order: number;
}

interface GenerateStoryRequest {
  articleId?: string;
  content?: string;
  title?: string;
  category?: string;
  autoPublish?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { articleId, content, title, category, autoPublish = false }: GenerateStoryRequest = await req.json();

    console.log('🎬 Generating web story...', { articleId, hasContent: !!content });

    let articleData: any;
    let storyContent = content || '';
    let storyTitle = title || '';
    let storyCategory = category || 'news';

    // Fetch article data if articleId provided
    if (articleId) {
      const { data: article, error } = await supabase
        .from('articles')
        .select('*, categories(name, slug)')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      if (!article) throw new Error('Article not found');

      articleData = article;
      storyContent = article.content;
      storyTitle = article.title;
      storyCategory = article.categories?.slug || 'news';
    }

    // Generate story structure using Lovable AI with Discover-optimized guidelines
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a visual storytelling expert for web stories (AMP stories) optimized for Google Discover. Transform content into 6-7 compelling slides.
            
CRITICAL TITLE RULES (Google Discover Optimized):
- Title MUST be under 70 characters (strict limit)
- Use engaging hooks: "Shocking:", "Revealed:", "Breaking:", "Secret:", "Why", "How"
- Create curiosity gaps that make users want to tap
- Avoid clickbait but maximize engagement
- Front-load important keywords

SLIDE RULES:
- Create exactly 6-7 slides (no more, no less)
- Each slide headline: max 50 characters, punchy and scannable
- Each slide should have a supporting subtext (20-40 words)
- Describe detailed, photorealistic images for each slide
- Image prompts should be specific about lighting, composition, and mood
- Create a logical narrative flow with beginning, middle, end
- Include a CTA slide at the end

Return ONLY valid JSON in this format:
{
  "slides": [
    {"text": "Punchy headline", "subtext": "Supporting detail text", "imagePrompt": "Detailed photorealistic image description with lighting, composition, mood", "order": 1, "slideType": "cover|content|summary|cta"}
  ],
  "title": "Engaging title under 70 chars with hook",
  "description": "SEO meta description 140-155 chars with primary keyword",
  "keywords": ["primary_keyword", "secondary_keyword", "lsi_keyword"]
}`
          },
          {
            role: 'user',
            content: `Transform this into a Google Discover-optimized web story:\n\nTitle: ${storyTitle}\n\nContent: ${storyContent.substring(0, 4000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('❌ Lovable AI error:', error);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse AI response
    let storyData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      storyData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('❌ Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('✅ Generated story structure:', storyData);

    // Helper function to create consistent hash from prompt
    const hashPrompt = async (prompt: string): Promise<string> => {
      const encoder = new TextEncoder();
      const data = encoder.encode(prompt.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Ensure title is under 70 characters
    let finalTitle = storyData.title || storyTitle;
    if (finalTitle.length > 70) {
      finalTitle = finalTitle.substring(0, 67) + '...';
      console.log('⚠️ Title truncated to 70 characters:', finalTitle);
    }

    // Generate high-quality 1200x1600 images for each slide (Google Discover recommended)
    const slidesWithImages = await Promise.all(
      storyData.slides.map(async (slide: SlideData & { subtext?: string; slideType?: string }, index: number) => {
        try {
          // Enhanced prompt for 1200x1600px high-quality images (3:4 portrait ratio)
          const enhancedPrompt = `Create a high-resolution 1200x1600 pixel vertical portrait image (3:4 aspect ratio) for a web story. ${slide.imagePrompt}. Requirements: NO TEXT, NO OVERLAY, NO CAPTIONS, NO WATERMARKS. Ultra high quality, sharp focus, professional photography style, vibrant colors, excellent lighting, 4K resolution quality.`;
          
          // Check cache first
          const promptHash = await hashPrompt(enhancedPrompt);
          console.log(`🔍 Checking cache for slide ${index + 1}...`);
          
          const { data: cachedImage, error: cacheError } = await supabase
            .from('web_story_image_cache')
            .select('image_url, id')
            .eq('prompt_hash', promptHash)
            .maybeSingle();

          if (cachedImage && !cacheError) {
            // Reuse cached image
            console.log(`♻️ Reusing cached image for slide ${index + 1}`);
            
            // Update usage stats - increment usage_count via RPC
            const { error: updateError } = await supabase.rpc('increment_image_cache_usage', { 
              cache_id: cachedImage.id 
            });
            
            if (updateError) {
              console.warn('Failed to update cache usage:', updateError);
            }

            return {
              text: slide.text,
              image: cachedImage.image_url
            };
          }

          // Generate new image
          console.log(`🎨 Generating new image ${index + 1}/${storyData.slides.length}...`);
          
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: enhancedPrompt
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (!imageResponse.ok) {
            console.warn(`⚠️ Image generation failed for slide ${index + 1}, using placeholder`);
            return {
              text: slide.text,
              subtext: slide.subtext || '',
              slideType: slide.slideType || 'content',
              image: `https://placehold.co/1200x1600/6366f1/white?text=Slide+${index + 1}`
            };
          }

          const imageData = await imageResponse.json();
          const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!base64Image) {
            console.warn(`⚠️ No image in response for slide ${index + 1}`);
            return {
              text: slide.text,
              subtext: slide.subtext || '',
              slideType: slide.slideType || 'content',
              image: `https://placehold.co/1200x1600/6366f1/white?text=Slide+${index + 1}`
            };
          }

          // Upload to Supabase Storage
          const fileName = `web-story-${Date.now()}-slide-${index + 1}.png`;
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(`web-stories/${fileName}`, buffer, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) {
            console.error(`❌ Upload failed for slide ${index + 1}:`, uploadError);
            return {
              ...slide,
              image: `https://placehold.co/720x1280/6366f1/white?text=Slide+${index + 1}`
            };
          }

          const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(`web-stories/${fileName}`);

          // Cache the newly generated image
          try {
            await supabase
              .from('web_story_image_cache')
              .insert({
                prompt_hash: promptHash,
                image_url: publicUrl,
                prompt_text: enhancedPrompt
              });
            console.log(`💾 Cached image for slide ${index + 1}`);
          } catch (cacheInsertError) {
            console.warn(`⚠️ Failed to cache image:`, cacheInsertError);
          }

          console.log(`✅ High-quality 1200x1600 image uploaded for slide ${index + 1}`);
          
          return {
            text: slide.text,
            subtext: slide.subtext || '',
            slideType: slide.slideType || 'content',
            image: publicUrl
          };
        } catch (error) {
          console.error(`❌ Error processing slide ${index + 1}:`, error);
          return {
            text: slide.text,
            subtext: slide.subtext || '',
            slideType: slide.slideType || 'content',
            image: `https://placehold.co/1200x1600/6366f1/white?text=Slide+${index + 1}`
          };
        }
      })
    );

    // Generate slug
    const slug = storyData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Create web story with Discover-optimized title
    const { data: story, error: createError } = await supabase
      .from('web_stories')
      .insert({
        title: finalTitle,
        slug: `${slug}-${Date.now()}`,
        description: storyData.description?.substring(0, 160) || '',
        category: storyCategory,
        slides: slidesWithImages,
        status: autoPublish ? 'published' : 'draft',
        user_id: userId || null,
        auto_generated: true,
        generation_source: articleId ? 'article' : 'manual',
        ai_confidence_score: 0.85,
        source_article_id: articleId || null,
        featured_image: slidesWithImages[0]?.image,
        published_at: autoPublish ? new Date().toISOString() : null
      })
      .select()
      .single();

    console.log(`✅ Web story created with Discover-optimized title (${finalTitle.length} chars): ${finalTitle}`);

    if (createError) throw createError;

    console.log('✅ Web story created:', story.id);

    // If auto-publish is enabled, trigger indexing
    if (autoPublish) {
      try {
        await supabase.functions.invoke('google-index-now', {
          body: {
            storyId: story.id,
            pageType: 'webstory',
            action: 'update'
          }
        });
        console.log('✅ Indexing triggered');
      } catch (indexError) {
        console.warn('⚠️ Indexing failed:', indexError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        story,
        message: autoPublish ? 'Web story published successfully' : 'Web story created as draft'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error generating web story:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
