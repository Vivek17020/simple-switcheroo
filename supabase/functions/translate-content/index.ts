import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'mr': 'Marathi',
  'bn': 'Bengali',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'ur': 'Urdu'
}

async function translateWithAI(texts: string[], targetLanguage: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: `You are a professional multilingual translator and localization expert. Translate the following texts to ${languageName}.

Requirements:
- Maintain the original meaning and tone of the content
- Localize idioms, dates, currency, and names appropriately for the target region
- Use SEO-friendly terms relevant to ${languageName} users
- Retain HTML structure (tags, links, and formatting) without breaking them
- Avoid literal or word-by-word translation—focus on natural readability
- For news or factual information, preserve accuracy and neutrality
- Return ONLY the translations in the same order, separated by ||SEPARATOR||
- Do not add explanations or notes

Output format: translation1||SEPARATOR||translation2||SEPARATOR||translation3` 
        },
        { 
          role: 'user', 
          content: texts.join('||SEPARATOR||')
        }
      ],
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded, please try again later.')
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.')
    }
    const errorText = await response.text()
    console.error('AI gateway error:', response.status, errorText)
    throw new Error('AI gateway error')
  }

  const data = await response.json()
  const translatedText = data.choices[0].message.content
  const translations = translatedText.split('||SEPARATOR||').map((t: string) => t.trim())
  
  return translations
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { texts, targetLanguage } = await req.json()

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid texts array' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!targetLanguage || !LANGUAGE_NAMES[targetLanguage]) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid targetLanguage' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (targetLanguage === 'en') {
      return new Response(
        JSON.stringify({ translations: texts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Translating ${texts.length} texts to ${targetLanguage}`)
    
    const translations = await translateWithAI(texts, targetLanguage)

    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in translate-content function:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
