import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🎯 Starting daily quiz generation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Check if daily quiz already exists for today
    const { data: existingQuiz } = await supabase
      .from('upsc_quizzes')
      .select('id')
      .eq('is_daily_quiz', true)
      .eq('quiz_date', today)
      .maybeSingle();

    if (existingQuiz) {
      console.log("✅ Daily quiz already exists for today");
      return new Response(
        JSON.stringify({ success: true, message: "Daily quiz already exists", quizId: existingQuiz.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch random questions from existing quizzes
    const { data: allQuizzes, error: quizzesError } = await supabase
      .from('upsc_quizzes')
      .select('questions')
      .eq('is_published', true)
      .eq('is_daily_quiz', false);

    if (quizzesError) {
      throw new Error(`Failed to fetch quizzes: ${quizzesError.message}`);
    }

    // Collect all questions
    const allQuestions: any[] = [];
    for (const quiz of allQuizzes || []) {
      if (Array.isArray(quiz.questions)) {
        allQuestions.push(...quiz.questions);
      }
    }

    if (allQuestions.length < 10) {
      console.log("⚠️ Not enough questions available for daily quiz");
      
      // Create quiz with sample questions
      const sampleQuestions = [
        {
          question: "Which Article of the Indian Constitution deals with the Right to Equality?",
          options: ["Article 14", "Article 19", "Article 21", "Article 32"],
          correct: 0,
          explanation: "Article 14 guarantees equality before law and equal protection of laws within the territory of India."
        },
        {
          question: "The term 'Secular' was added to the Preamble by which Constitutional Amendment?",
          options: ["42nd Amendment", "44th Amendment", "52nd Amendment", "73rd Amendment"],
          correct: 0,
          explanation: "The 42nd Constitutional Amendment Act, 1976 added the words 'Socialist' and 'Secular' to the Preamble."
        },
        {
          question: "Which Five Year Plan is known as the 'Mahalanobis Plan'?",
          options: ["First Plan", "Second Plan", "Third Plan", "Fourth Plan"],
          correct: 1,
          explanation: "The Second Five Year Plan (1956-1961) was based on the Mahalanobis Model focusing on rapid industrialization."
        },
        {
          question: "The Himalayas are geologically young and structurally fold mountains. They extend from?",
          options: ["Indus to Brahmaputra", "Sutlej to Ganga", "Indus to Ganga", "Sutlej to Brahmaputra"],
          correct: 0,
          explanation: "The Himalayas extend from the Indus river in the west to the Brahmaputra river in the east."
        },
        {
          question: "Which battle established British supremacy in India?",
          options: ["Battle of Plassey", "Battle of Buxar", "Battle of Panipat III", "Battle of Wandiwash"],
          correct: 1,
          explanation: "The Battle of Buxar (1764) established British military superiority in India as they defeated combined forces."
        },
        {
          question: "Which protocol aims to cut greenhouse gas emissions?",
          options: ["Montreal Protocol", "Kyoto Protocol", "Vienna Convention", "Rio Declaration"],
          correct: 1,
          explanation: "The Kyoto Protocol (1997) is an international treaty to reduce greenhouse gas emissions."
        },
        {
          question: "ISRO's headquarters is located in?",
          options: ["Chennai", "Bangalore", "Hyderabad", "Thiruvananthapuram"],
          correct: 1,
          explanation: "Indian Space Research Organisation (ISRO) has its headquarters in Bangalore, Karnataka."
        },
        {
          question: "Which dance form is associated with Odisha?",
          options: ["Bharatanatyam", "Kathak", "Odissi", "Kuchipudi"],
          correct: 2,
          explanation: "Odissi is a classical dance form that originated in the temples of Odisha."
        },
        {
          question: "United Nations Headquarters is located in?",
          options: ["Geneva", "Vienna", "New York", "Paris"],
          correct: 2,
          explanation: "The United Nations Headquarters is located in New York City, USA."
        },
        {
          question: "Which caste-based movement was led by Jyotiba Phule?",
          options: ["Self-Respect Movement", "Satya Shodhak Samaj", "Temple Entry Movement", "Anti-Brahmin Movement"],
          correct: 1,
          explanation: "Satya Shodhak Samaj was founded by Jyotiba Phule in 1873 to liberate lower castes from Brahminical domination."
        }
      ];

      // Create daily quiz with sample questions
      const { data: newQuiz, error: createError } = await supabase
        .from('upsc_quizzes')
        .insert({
          title: `Daily Challenge - ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          description: "Test your UPSC preparation with today's daily quiz covering all major subjects.",
          category: 'General Studies',
          difficulty: 'medium',
          duration_minutes: 15,
          questions: sampleQuestions,
          total_marks: sampleQuestions.length,
          negative_marking: 0.33,
          is_daily_quiz: true,
          quiz_date: today,
          is_published: true,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create quiz: ${createError.message}`);
      }

      console.log(`✅ Daily quiz created with sample questions: ${newQuiz.id}`);
      return new Response(
        JSON.stringify({ success: true, message: "Daily quiz created with sample questions", quizId: newQuiz.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Shuffle and pick 10 random questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 10);

    // Create the daily quiz
    const { data: newQuiz, error: createError } = await supabase
      .from('upsc_quizzes')
      .insert({
        title: `Daily Challenge - ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        description: "Test your UPSC preparation with today's daily quiz covering all major subjects.",
        category: 'Mixed',
        difficulty: 'medium',
        duration_minutes: 15,
        questions: selectedQuestions,
        total_marks: selectedQuestions.length,
        negative_marking: 0.33,
        is_daily_quiz: true,
        quiz_date: today,
        is_published: true,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create quiz: ${createError.message}`);
    }

    console.log(`✅ Daily quiz created successfully: ${newQuiz.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Daily quiz generated successfully", 
        quizId: newQuiz.id,
        questionsCount: selectedQuestions.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error generating daily quiz:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
