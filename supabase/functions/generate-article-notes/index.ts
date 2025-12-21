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

    // Fetch the article
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

    // Check if notes already exist
    const { data: existingNote } = await supabase
      .from('upsc_article_notes')
      .select('id')
      .eq('article_id', articleId)
      .maybeSingle();

    if (existingNote) {
      return new Response(JSON.stringify({ error: 'Notes already exist for this article', existing: true }), {
        status: 400,
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

    console.log(`Generating notes for article: ${article.title}, Subject: ${subject}`);

    // Call Lovable AI to generate notes
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
            content: `You are a brilliant UPSC preparation mentor creating study notes for Indian students.

Your notes should feel like they're written by a senior student who just cracked the exam and is helping their juniors.

RULES:
1. Write in simple, conversational language - like you're explaining to a friend
2. Use Hindi-English mix naturally when it helps (like "ye bahut important hai")
3. Focus ONLY on UPSC-relevant information
4. Make it memorable and easy to revise quickly before exam
5. Include practical exam tips that actually help

OUTPUT FORMAT (JSON):
{
  "key_points": [
    "5-7 bullet points - most important takeaways",
    "Start with action verbs or key terms",
    "Each point should be self-contained and memorable"
  ],
  "summary": "200-300 word summary in student-friendly language. Explain the topic as if teaching a friend. Use simple examples. Avoid bureaucratic/AI language.",
  "mnemonics": [
    "Memory tricks like 'LAMPS' for lists",
    "Funny associations that stick",
    "Number tricks (e.g., '1947-1950 = 3 years for Constitution')"
  ],
  "important_terms": [
    {"term": "Term name", "definition": "Simple 1-2 line definition a student would understand"},
    {"term": "Another term", "definition": "Clear explanation without jargon"}
  ],
  "exam_tips": [
    "How this topic is usually asked in UPSC",
    "Common traps/mistakes to avoid",
    "What to focus on for Prelims vs Mains",
    "Related topics to link for answer writing"
  ],
  "related_topics": ["List of related UPSC topics to study together"]
}

TONE: Supportive, practical, like a helpful senior - NOT robotic or textbook-like.`
          },
          {
            role: "user",
            content: `Create comprehensive study notes from this UPSC ${subject} article:

TITLE: ${article.title}

CONTENT:
${plainContent.substring(0, 10000)}

Generate student-friendly notes that will help aspirants understand and remember this topic for their exam.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate notes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', aiContent);

    // Parse the JSON from AI response
    let notesData: any = {};
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        notesData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse notes data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate word count
    const allText = [
      notesData.summary || '',
      ...(notesData.key_points || []),
      ...(notesData.mnemonics || []),
      ...(notesData.exam_tips || []),
    ].join(' ');
    const wordCount = allText.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute

    // Insert notes into database
    const noteToInsert = {
      article_id: articleId,
      title: article.title,
      subject: subject,
      topic: null,
      key_points: notesData.key_points || [],
      summary: notesData.summary || null,
      mnemonics: notesData.mnemonics || [],
      important_terms: notesData.important_terms || [],
      exam_tips: notesData.exam_tips || [],
      related_topics: notesData.related_topics || [],
      word_count: wordCount,
      reading_time: readingTime,
      generated_by: 'ai',
      is_published: false, // Admin needs to review before publishing
    };

    const { data: insertedNote, error: insertError } = await supabase
      .from('upsc_article_notes')
      .insert([noteToInsert])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert notes:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save notes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully created notes for article ${articleId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      note: insertedNote
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in generate-article-notes:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
