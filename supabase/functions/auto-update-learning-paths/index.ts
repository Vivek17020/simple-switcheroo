import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticlePayload {
  articleId: string;
  categoryId: string;
  slug: string;
  title: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId, categoryId, slug, title } = await req.json() as ArticlePayload;

    console.log('Processing article for learning path update:', { articleId, slug, title });

    // Get the article's category and check if it's a Web3 category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id, slug, parent_id, name')
      .eq('id', categoryId)
      .single();

    if (catError) {
      console.error('Error fetching category:', catError);
      throw catError;
    }

    // Check if this is a Web3 category or subcategory
    let isWeb3Category = category.slug === 'web3forindia';
    
    if (!isWeb3Category && category.parent_id) {
      const { data: parentCat } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', category.parent_id)
        .single();
      
      isWeb3Category = parentCat?.slug === 'web3forindia';
    }

    if (!isWeb3Category) {
      console.log('Not a Web3 article, skipping learning path update');
      return new Response(
        JSON.stringify({ success: true, message: 'Not a Web3 article' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Web3 article detected, finding matching learning paths');

    // Find learning paths that match this category
    const { data: learningPaths, error: pathError } = await supabase
      .from('web3_learning_paths')
      .select('*')
      .contains('category_ids', [categoryId]);

    if (pathError) {
      console.error('Error fetching learning paths:', pathError);
      throw pathError;
    }

    if (!learningPaths || learningPaths.length === 0) {
      console.log('No matching learning paths found for category');
      return new Response(
        JSON.stringify({ success: true, message: 'No matching learning paths' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${learningPaths.length} matching learning paths`);

    const updates: any[] = [];

    // Update each matching learning path
    for (const path of learningPaths) {
      const steps = (path.steps as any[]) || [];
      
      // Check if article already exists in steps
      const articleExists = steps.some(step => step.article_slug === slug);
      
      if (articleExists) {
        console.log(`Article already in learning path: ${path.title}`);
        continue;
      }

      // Find the best position to insert the new article
      // For now, we'll add it at the end, but you could add logic to determine placement
      const newStep = {
        title: title,
        description: `Learn about ${title.toLowerCase()}`,
        article_slug: slug,
        required: true
      };

      const updatedSteps = [...steps, newStep];

      // Update the learning path
      const { error: updateError } = await supabase
        .from('web3_learning_paths')
        .update({ steps: updatedSteps, updated_at: new Date().toISOString() })
        .eq('id', path.id);

      if (updateError) {
        console.error(`Error updating learning path ${path.title}:`, updateError);
        continue;
      }

      console.log(`Successfully added article to learning path: ${path.title}`);
      updates.push({
        pathId: path.id,
        pathTitle: path.title,
        stepAdded: newStep
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} learning paths`,
        updates
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in auto-update-learning-paths:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});