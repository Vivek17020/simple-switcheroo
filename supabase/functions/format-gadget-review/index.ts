import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a professional tech journalist specializing in gadget reviews for publications like TechRadar, GSMArena, NDTV Gadgets, and Android Authority.

Your task is to:
1. Transform raw content into a premium, publish-ready gadget review
2. AUTO-GENERATE all SEO metadata (title, description, tags, slug)
3. Structure content with proper sections and tables

CRITICAL FORMATTING RULES:
- Output ONLY valid HTML with semantic tags
- Use <h2> for main sections, <h3> for subsections
- Use <table> with proper <thead>/<tbody> for specs and comparisons
- Use <ul> for lists, <blockquote> for key highlights
- Keep paragraphs short (2-3 lines max)
- Professional, objective tone
- NO markdown formatting (no **, ##, etc.)`;

    const userPrompt = `Convert this raw content into a premium gadget review article.

Original Title: ${title || 'Gadget Review'}
Raw Content: ${content}

OUTPUT STRUCTURE (HTML only):

<h1>[Catchy SEO title under 60 characters]</h1>

<div class="meta-info">
<p><strong>Meta Description:</strong> [150-160 characters highlighting key features and verdict]</p>
<p><strong>Summary:</strong> [2-3 line quick overview]</p>
<p><strong>Tags:</strong> [Device name, brand, category, key specs as comma-separated keywords]</p>
<p><strong>Slug:</strong> [url-friendly-slug]</p>
</div>

<h2>Introduction</h2>
<p>[2-3 lines setting context - what is this device, who is it for, why should readers care]</p>

<h2>Quick Specifications</h2>
<table>
<thead>
<tr>
<th>Specification</th>
<th>Details</th>
</tr>
</thead>
<tbody>
<tr>
<td>Display</td>
<td>[Extract or use typical specs for this device category]</td>
</tr>
<tr>
<td>Processor</td>
<td>[Extract or placeholder]</td>
</tr>
<tr>
<td>RAM/Storage</td>
<td>[Extract or placeholder]</td>
</tr>
<tr>
<td>Camera</td>
<td>[Extract or placeholder]</td>
</tr>
<tr>
<td>Battery</td>
<td>[Extract or placeholder]</td>
</tr>
<tr>
<td>OS</td>
<td>[Extract or placeholder]</td>
</tr>
<tr>
<td>Price</td>
<td>[Extract or "Starting at ₹XX,XXX" or "To be announced"]</td>
</tr>
</tbody>
</table>

<h2>Design & Build Quality</h2>
<p>[Evaluate materials, dimensions, weight, ergonomics]</p>
<ul>
<li>[Material quality and finish]</li>
<li>[In-hand feel and ergonomics]</li>
<li>[Build durability and IP rating if applicable]</li>
<li>[Color options and aesthetics]</li>
</ul>

<h2>Display</h2>
<p>[Analyze screen quality, brightness, refresh rate, color accuracy]</p>
<ul>
<li>[Screen size and resolution]</li>
<li>[Brightness levels and outdoor visibility]</li>
<li>[Refresh rate and touch response]</li>
<li>[Display protection and features]</li>
</ul>

<h2>Performance</h2>
<p>[Assess processor, RAM, real-world performance]</p>

<h3>Processor & RAM</h3>
<p>[Details about chipset and memory configuration]</p>

<h3>Benchmark Scores</h3>
<table>
<thead>
<tr>
<th>Benchmark</th>
<th>Score</th>
</tr>
</thead>
<tbody>
<tr>
<td>AnTuTu</td>
<td>[Score or "To be tested"]</td>
</tr>
<tr>
<td>Geekbench (Single/Multi)</td>
<td>[Score or "To be tested"]</td>
</tr>
<tr>
<td>3DMark</td>
<td>[Score or "To be tested"]</td>
</tr>
</tbody>
</table>

<h3>Real-World Usage</h3>
<p>[Day-to-day performance, multitasking, app loading times]</p>

<h2>Camera Performance</h2>
<p>[Comprehensive camera analysis]</p>

<h3>Rear Camera</h3>
<ul>
<li>[Primary sensor quality and performance]</li>
<li>[Low-light photography]</li>
<li>[Video recording capabilities]</li>
<li>[Additional lenses (ultrawide, macro, telephoto)]</li>
</ul>

<h3>Front Camera</h3>
<ul>
<li>[Selfie quality]</li>
<li>[Video call performance]</li>
<li>[Portrait mode and effects]</li>
</ul>

<p><strong>📸 Sample Images:</strong> [Camera samples to be added]</p>

<h2>Battery & Charging</h2>
<p>[Battery life analysis]</p>
<ul>
<li>Battery Capacity: [mAh]</li>
<li>Screen-on Time: [Hours or "Under testing"]</li>
<li>Charging Speed: [Wattage and time to full charge]</li>
<li>Wireless Charging: [Yes/No with details]</li>
<li>Reverse Charging: [If applicable]</li>
</ul>

<h2>Software Experience</h2>
<p>[OS version, UI customization, bloatware, update policy]</p>
<ul>
<li>[Operating system and version]</li>
<li>[Custom UI features and optimizations]</li>
<li>[Pre-installed apps and bloatware]</li>
<li>[Software update commitment]</li>
</ul>

<h2>Gaming Performance</h2>
<p>[If relevant - gaming capabilities and thermal management]</p>
<ul>
<li>[Popular game performance (PUBG, Genshin Impact, etc.)]</li>
<li>[Thermal throttling and heat management]</li>
<li>[Gaming-specific features]</li>
</ul>

<h2>Connectivity & Extra Features</h2>
<ul>
<li>5G/4G: [Details]</li>
<li>Wi-Fi: [Standard and speed]</li>
<li>Bluetooth: [Version]</li>
<li>NFC: [Yes/No]</li>
<li>Audio: [Speakers, 3.5mm jack, quality]</li>
<li>Biometrics: [Fingerprint, face unlock details]</li>
<li>Additional Features: [IR blaster, FM radio, etc.]</li>
</ul>

<h2>Pros & Cons</h2>
<table>
<thead>
<tr>
<th>Pros ✅</th>
<th>Cons ❌</th>
</tr>
</thead>
<tbody>
<tr>
<td>[Key positive point 1]</td>
<td>[Key negative point 1]</td>
</tr>
<tr>
<td>[Key positive point 2]</td>
<td>[Key negative point 2]</td>
</tr>
<tr>
<td>[Key positive point 3]</td>
<td>[Key negative point 3]</td>
</tr>
<tr>
<td>[Key positive point 4]</td>
<td>[Key negative point 4]</td>
</tr>
</tbody>
</table>

<h2>Verdict</h2>
<p>[3-4 lines summarizing the device's overall value proposition, who should buy it, and final recommendation]</p>

<blockquote>
<p><strong>Rating:</strong> ⭐⭐⭐⭐ (X/5) - [One-line verdict]</p>
</blockquote>

<h2>Price & Availability</h2>
<p><strong>Starting Price:</strong> [₹XX,XXX or "To be announced"]</p>
<p><strong>Variants:</strong> [List configurations and prices]</p>
<p><strong>Availability:</strong> [Launch date, where to buy]</p>
<p><strong>Launch Offers:</strong> [If any]</p>

<h2>Alternatives to Consider</h2>

<h3>1. [Alternative Device Name]</h3>
<p>[Brief comparison - price range ₹XX,XXX - key differences]</p>

<h3>2. [Alternative Device Name]</h3>
<p>[Brief comparison - price range ₹XX,XXX - key differences]</p>

<h3>3. [Alternative Device Name]</h3>
<p>[Brief comparison - price range ₹XX,XXX - key differences]</p>

<h2>Frequently Asked Questions</h2>

<h3>Q1: Is [device name] worth buying?</h3>
<p>[Honest answer based on value proposition]</p>

<h3>Q2: What is the best feature of [device name]?</h3>
<p>[Highlight standout feature]</p>

<h3>Q3: How is the battery life?</h3>
<p>[Battery performance summary]</p>

<h3>Q4: Does it support 5G?</h3>
<p>[Connectivity answer]</p>

<h3>Q5: Should I wait for the next generation?</h3>
<p>[Buying timing advice]</p>

<h2>Final Thoughts</h2>
<p>[2-3 lines closing the review professionally]</p>

<blockquote>
<p><strong>Disclaimer:</strong> Specifications and features may vary by region. Please check official sources for accurate details.</p>
</blockquote>

REMEMBER:
• Use only HTML tags, no markdown
• Keep writing professional and objective
• Include verified specs only
• Add placeholders where data is unavailable
• Maintain TechRadar/GSMArena styling
• Ensure publish-safe formatting with no breaks`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const formattedContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ formattedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in format-gadget-review:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
