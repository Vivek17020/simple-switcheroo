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

    // Generate story structure using Lovable AI
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
            content: `You are a visual storytelling expert for web stories (AMP stories). Transform content into 5-8 compelling slides.
            
Rules:
- Each slide has a punchy headline (max 50 characters)
- Describe an engaging image for each slide
- Create a logical narrative flow
- Focus on key takeaways and visual moments
- Make it shareable and engaging

Return ONLY valid JSON in this format:
{
  "slides": [
    {"text": "Headline text", "imagePrompt": "Description for image generation", "order": 1}
  ],
  "title": "Catchy web story title (max 60 chars)",
  "description": "SEO description (max 150 chars)",
  "keywords": ["keyword1", "keyword2"]
}`
          },
          {
            role: 'user',
            content: `Transform this into a web story:\n\nTitle: ${storyTitle}\n\nContent: ${storyContent.substring(0, 3000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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

    // Generate images for each slide using Lovable AI
    const slidesWithImages = await Promise.all(
      storyData.slides.map(async (slide: SlideData, index: number) => {
        try {
          console.log(`🎨 Generating image ${index + 1}/${storyData.slides.length}...`);
          
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
                  content: `Create a vertical 9:16 aspect ratio image for a web story slide. ${slide.imagePrompt}. Professional, high-quality, engaging visual.`
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (!imageResponse.ok) {
            console.warn(`⚠️ Image generation failed for slide ${index + 1}, using placeholder`);
            return {
              ...slide,
              image: `https://placehold.co/720x1280/6366f1/white?text=Slide+${index + 1}`
            };
          }

          const imageData = await imageResponse.json();
          const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!base64Image) {
            console.warn(`⚠️ No image in response for slide ${index + 1}`);
            return {
              ...slide,
              image: `https://placehold.co/720x1280/6366f1/white?text=Slide+${index + 1}`
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

          console.log(`✅ Image uploaded for slide ${index + 1}`);
          
          return {
            text: slide.text,
            image: publicUrl
          };
        } catch (error) {
          console.error(`❌ Error processing slide ${index + 1}:`, error);
          return {
            ...slide,
            image: `https://placehold.co/720x1280/6366f1/white?text=Slide+${index + 1}`
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

    // Create web story
    const { data: story, error: createError } = await supabase
      .from('web_stories')
      .insert({
        title: storyData.title,
        slug: `${slug}-${Date.now()}`,
        description: storyData.description,
        category: storyCategory,
        slides: slidesWithImages,
        status: autoPublish ? 'published' : 'draft',
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        auto_generated: true,
        generation_source: articleId ? 'article' : 'manual',
        ai_confidence_score: 0.85,
        source_article_id: articleId || null,
        featured_image: slidesWithImages[0]?.image,
        published_at: autoPublish ? new Date().toISOString() : null
      })
      .select()
      .single();

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
