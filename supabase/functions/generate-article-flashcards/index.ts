import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId } = await req.json();

    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the article with category
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, content, category_id, categories(name, slug)')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      console.error('Article not found:', articleError);
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Strip HTML tags from content
    const plainContent = article.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Determine subject from category - handle both object and array
    const category = Array.isArray(article.categories) ? article.categories[0] : article.categories;
    const categoryName = category?.name || 'General';
    const categorySlug = (category?.slug || '').toLowerCase();
    
    const subjectMapping: Record<string, string> = {
      'polity': 'Polity',
      'geography': 'Geography',
      'economy': 'Economy',
      'history': 'History',
      'environment': 'Environment',
      'science': 'Science & Technology',
      'current-affairs': 'Current Affairs',
      'ethics': 'Ethics',
      'art-culture': 'Art & Culture',
    };
    
    let subject = 'General';
    for (const [key, value] of Object.entries(subjectMapping)) {
      if (categorySlug.includes(key) || categoryName.toLowerCase().includes(key)) {
        subject = value;
        break;
      }
    }

    console.log(`Generating flashcards for article: ${article.title}, Subject: ${subject}`);

    // Call Lovable AI to generate flashcards
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a friendly UPSC exam tutor creating flashcards for Indian students preparing for civil services exams.

Your job is to create 5-8 flashcards from the given article content.

RULES FOR FLASHCARDS:
1. Write like a supportive teacher talking to students, NOT like a robot
2. Use simple, clear language that students can understand easily
3. You can use common Hindi-English mix phrases if it helps (like "yaad rakhein", "important hai")
4. Keep questions crisp - one clear question per flashcard
5. Make answers memorable using:
   - Mnemonics when possible (like "LAMPS" for listing things)
   - Real-world examples from India
   - "Remember this because..." or "Trick to remember:" phrases
   - Comparisons students can relate to
6. Focus ONLY on UPSC-relevant facts
7. Avoid jargon - explain terms simply
8. Each answer should be 2-4 sentences max, but packed with value

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Short descriptive title (e.g., 'Article 14 - Equality')",
    "front_content": "Clear question starting with What/When/Why/Who/How/Which",
    "back_content": "Memorable answer with tricks/examples if possible",
    "difficulty": "easy|medium|hard",
    "topic": "Specific topic within the subject"
  }
]

DIFFICULTY GUIDE:
- easy: Basic facts, definitions, dates
- medium: Understanding concepts, relationships between things
- hard: Analysis, application, exceptions to rules`
          },
          {
            role: "user",
            content: `Create flashcards from this UPSC ${subject} article:

TITLE: ${article.title}

CONTENT:
${plainContent.substring(0, 8000)}

Generate 5-8 student-friendly flashcards focusing on the most important UPSC-relevant points.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate flashcards' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', aiContent);

    // Parse the JSON from AI response
    let flashcards: any[] = [];
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse flashcard data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert flashcards into database
    const flashcardsToInsert = flashcards.map((fc: any) => ({
      title: fc.title,
      front_content: fc.front_content,
      back_content: fc.back_content,
      subject: subject,
      topic: fc.topic || null,
      difficulty: fc.difficulty || 'medium',
      article_id: articleId,
      generated_by: 'ai',
      source_type: 'article',
      is_published: false, // Admin needs to review before publishing
    }));

    const { data: insertedFlashcards, error: insertError } = await supabase
      .from('upsc_flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (insertError) {
      console.error('Failed to insert flashcards:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save flashcards' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully created ${insertedFlashcards?.length} flashcards for article ${articleId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      flashcards: insertedFlashcards,
      count: insertedFlashcards?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in generate-article-flashcards:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
