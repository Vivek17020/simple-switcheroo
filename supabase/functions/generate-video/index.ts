import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Scene {
  text: string;
  imageUrl: string;
}

interface VideoRequest {
  voice: string;
  scenes: Scene[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { voice, scenes }: VideoRequest = await req.json()

    if (!voice || !scenes || scenes.length === 0) {
      throw new Error('Voice and scenes are required')
    }

    console.log(`Generating video with voice: ${voice} and ${scenes.length} scenes`)

    // Generate audio for each scene using OpenAI TTS
    const audioFiles: string[] = []
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      console.log(`Generating audio for scene ${i + 1}: ${scene.text.substring(0, 50)}...`)

      const audioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: scene.text,
          voice: voice,
          response_format: 'mp3',
        }),
      })

      if (!audioResponse.ok) {
        const error = await audioResponse.json()
        throw new Error(`Failed to generate audio for scene ${i + 1}: ${error.error?.message}`)
      }

      // Convert audio buffer to base64
      const arrayBuffer = await audioResponse.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      audioFiles.push(base64Audio)
    }

    // For now, we'll return the audio files and scene data
    // In a production setup, you'd combine these with the images to create an actual video
    // using a service like FFmpeg or a video processing API
    
    const videoData = {
      scenes: scenes.map((scene, index) => ({
        text: scene.text,
        imageUrl: scene.imageUrl,
        audioBase64: audioFiles[index],
      })),
      voice,
      status: 'generated',
      message: 'Audio files generated successfully. Video composition would happen here.',
    }

    console.log('Video generation completed successfully')

    return new Response(
      JSON.stringify(videoData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error generating video:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})