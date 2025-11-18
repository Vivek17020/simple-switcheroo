import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalUrls: number;
    categoriesCount: number;
    subcategoriesCount: number;
    articlesCount: number;
    staticPagesCount: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    // Fetch all published articles
    const { data: articles, error: articlesError } = await supabaseClient
      .from("articles")
      .select("id, slug, published, canonical_url")
      .eq("published", true);

    if (articlesError) throw articlesError;

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabaseClient
      .from("categories")
      .select("id, slug, parent_id");

    if (categoriesError) throw categoriesError;

    // Validate articles
    articles?.forEach(article => {
      if (!article.slug) {
        errors.push(`Article ${article.id} is missing a slug`);
      }
      
      if (!article.canonical_url) {
        warnings.push(`Article ${article.slug} is missing canonical URL`);
      }
    });

    // Validate categories
    categories?.forEach(category => {
      if (!category.slug) {
        errors.push(`Category ${category.id} is missing a slug`);
      }
      
      if (category.parent_id) {
        const parentExists = categories.some(c => c.id === category.parent_id);
        if (!parentExists) {
          errors.push(`Category ${category.slug} has invalid parent_id`);
        }
      }
    });

    // Check for duplicate slugs
    const articleSlugs = new Set();
    articles?.forEach(article => {
      if (articleSlugs.has(article.slug)) {
        errors.push(`Duplicate article slug: ${article.slug}`);
      }
      articleSlugs.add(article.slug);
    });

    const categorySlugs = new Set();
    categories?.forEach(category => {
      if (categorySlugs.has(category.slug)) {
        errors.push(`Duplicate category slug: ${category.slug}`);
      }
      categorySlugs.add(category.slug);
    });

    // Validate category URL structure
    const parentCategories = categories?.filter(cat => !cat.parent_id) || [];
    const childCategories = categories?.filter(cat => cat.parent_id) || [];
    
    childCategories.forEach(child => {
      const parent = parentCategories.find(p => p.id === child.parent_id);
      if (!parent) {
        errors.push(`Child category ${child.slug} has invalid parent_id`);
      }
    });

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalUrls: (articles?.length || 0) + parentCategories.length + childCategories.length + 10, // +10 for static pages
        categoriesCount: parentCategories.length,
        subcategoriesCount: childCategories.length,
        articlesCount: articles?.length || 0,
        staticPagesCount: 10
      }
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ 
      valid: false,
      error: 'Failed to validate sitemap',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
