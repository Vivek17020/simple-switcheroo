import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  topic: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, numberOfQuestions = 5 } = await req.json();

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: "Article ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the article
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, title, content, category_id, categories(name, slug)")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      console.error("Article fetch error:", articleError);
      return new Response(
        JSON.stringify({ error: "Article not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip HTML tags from content for AI processing
    const plainContent = article.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit content length

    const categoryName = (article.categories as any)?.name || "General";

    // Determine subject from category
    const subjectMapping: Record<string, string> = {
      "polity": "Polity & Governance",
      "economy": "Economy",
      "geography": "Geography",
      "history": "History",
      "environment": "Environment & Ecology",
      "science": "Science & Technology",
      "current-affairs": "Current Affairs",
      "international-relations": "International Relations",
    };

    const categorySlug = (article.categories as any)?.slug || "";
    const subject = subjectMapping[categorySlug] || "General Studies";

    console.log(`Generating ${numberOfQuestions} MCQs for article: ${article.title}`);

    // Call Lovable AI to generate MCQs
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
            content: `You are an expert UPSC exam question paper setter. Generate high-quality MCQs (Multiple Choice Questions) in UPSC Prelims format.

Each question must:
1. Test conceptual understanding, not just memorization
2. Have exactly 4 options (A, B, C, D)
3. Have only ONE correct answer
4. Include a detailed explanation of why the correct answer is right
5. Be based on the article content provided

Output format must be valid JSON array with this structure:
[
  {
    "question": "The complete question text",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_answer": 0,
    "explanation": "Detailed explanation of the answer",
    "topic": "Specific topic from the article"
  }
]

The correct_answer is the 0-indexed position (0=A, 1=B, 2=C, 3=D).`
          },
          {
            role: "user",
            content: `Generate exactly ${numberOfQuestions} UPSC-style MCQs based on this article:

Title: ${article.title}
Subject: ${subject}
Category: ${categoryName}

Article Content:
${plainContent}

Return ONLY the JSON array, no additional text.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content returned from AI");
    }

    // Parse the JSON response
    let questions: MCQQuestion[];
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      questions = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Failed to parse MCQ response from AI");
    }

    // Validate and format questions
    const formattedQuestions = questions.map((q, index) => ({
      id: crypto.randomUUID(),
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      topic: q.topic || subject,
    }));

    // Create a quiz in the database
    const quizTitle = `MCQs: ${article.title.slice(0, 100)}`;
    const quizDescription = `Practice MCQs generated from the article "${article.title}"`;

    const { data: quiz, error: quizError } = await supabase
      .from("upsc_quizzes")
      .insert({
        title: quizTitle,
        description: quizDescription,
        category: categorySlug || "general-studies",
        subject: subject,
        difficulty: "medium",
        duration_minutes: Math.ceil(formattedQuestions.length * 1.5), // 1.5 min per question
        total_marks: formattedQuestions.length,
        negative_marking: 0.33,
        questions: formattedQuestions,
        is_published: true,
        is_daily_quiz: false,
      })
      .select()
      .single();

    if (quizError) {
      console.error("Quiz insert error:", quizError);
      throw new Error("Failed to save quiz to database");
    }

    console.log(`Successfully generated quiz with ${formattedQuestions.length} MCQs: ${quiz.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        quizId: quiz.id,
        quizTitle: quizTitle,
        questionsGenerated: formattedQuestions.length,
        message: `Successfully generated ${formattedQuestions.length} MCQs`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("MCQ generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
