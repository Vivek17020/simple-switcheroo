import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  task: 'summary' | 'title' | 'keywords' | 'translation'
  content: string
  targetLanguage?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { task, content, targetLanguage }: AIRequest = await req.json()

    if (!content || !task) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: task and content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
    let result

    console.log(`Processing AI task: ${task} for content length: ${content.length}`)

    switch (task) {
      case 'summary':
        try {
          const summaryResult = await hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: content.slice(0, 1024), // Limit input length
            parameters: {
              max_length: 150,
              min_length: 50,
            }
          })
          result = { summary: summaryResult.summary_text }
        } catch (error) {
          console.error('Summary error:', error)
          throw new Error('Failed to generate summary')
        }
        break

      case 'title':
        try {
          const titleResult = await hf.summarization({
            model: 'google/pegasus-xsum',
            inputs: content.slice(0, 512), // Shorter input for titles
            parameters: {
              max_length: 20,
              min_length: 5,
            }
          })
          // Generate 3 title variations
          const titles = [
            titleResult.summary_text,
            titleResult.summary_text.replace(/\b\w+/g, (word) => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ),
            `${titleResult.summary_text} | Breaking News`
          ]
          result = { titles }
        } catch (error) {
          console.error('Title generation error:', error)
          throw new Error('Failed to generate titles')
        }
        break

      case 'keywords':
        try {
          const keywordResult = await hf.tokenClassification({
            model: 'ml6team/keyphrase-extraction-kbir-inspec',
            inputs: content.slice(0, 512)
          })
          
          // Extract unique keywords from the result
          const keywords = keywordResult
            .filter(item => item.entity_group === 'KEY')
            .map(item => item.word.replace(/^##/, ''))
            .filter((keyword, index, arr) => arr.indexOf(keyword) === index)
            .slice(0, 10)
          
          result = { keywords }
        } catch (error) {
          console.error('Keyword extraction error:', error)
          // Fallback to simple keyword extraction
          const simpleKeywords = content
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 4)
            .slice(0, 10)
          result = { keywords: simpleKeywords }
        }
        break

      case 'translation':
        try {
          if (targetLanguage === 'hi') {
            const translationResult = await hf.translation({
              model: 'Helsinki-NLP/opus-mt-en-hi',
              inputs: content.slice(0, 1024)
            })
            result = { translation: translationResult.translation_text }
          } else {
            throw new Error('Unsupported target language')
          }
        } catch (error) {
          console.error('Translation error:', error)
          throw new Error('Failed to translate content')
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid task type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    console.log(`AI task ${task} completed successfully`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-proxy function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})