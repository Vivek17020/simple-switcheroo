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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const systemPrompt = `You are a specialist in formatting exam notifications (CTET, JEE, NEET, SSC, Banking, UPSC, etc.) in the style of NTA, CBSE, SSC, and GeeksforGeeks Edu articles.

Your task is to:
1. Convert the given text into a clean, SEO-optimized exam notification format
2. AUTO-GENERATE all SEO metadata
3. Structure the content following the exam notification template

CRITICAL FORMATTING RULES:
- Output ONLY valid HTML with proper tags
- Use semantic HTML5 tags
- NO markdown formatting (no **, ##, etc.)
- Use <h2> for main sections, <h3> for subsections
- Use <ul> and <ol> for lists
- Use <table> with <thead> and <tbody> for data tables
- Use <blockquote> for important notes
- Keep paragraphs short (2-3 lines max)
- Add proper spacing with <br> tags where needed`;

    const userPrompt = `Convert the following text into a properly formatted exam notification article.

Original Title: ${title || 'Exam Notification'}
Content: ${content}

OUTPUT STRUCTURE (use HTML tags):

<h1>[SEO-optimized title under 60 characters]</h1>

<div class="meta-info">
<p><strong>Meta Description:</strong> [150-160 characters summarizing the notification]</p>
<p><strong>Excerpt:</strong> [Brief 1-2 line summary]</p>
<p><strong>Tags:</strong> [Comma-separated relevant keywords]</p>
<p><strong>Slug:</strong> [URL-friendly slug]</p>
</div>

<h2>Table of Contents</h2>
<ul>
<li><a href="#overview">Exam Overview</a></li>
<li><a href="#conducting-body">Conducting Body</a></li>
<li><a href="#important-dates">Important Dates</a></li>
<li><a href="#application">Application Form Details</a></li>
<li><a href="#eligibility">Eligibility Criteria</a></li>
<li><a href="#exam-pattern">Exam Pattern</a></li>
<li><a href="#syllabus">Syllabus</a></li>
<li><a href="#fee">Registration Fee</a></li>
<li><a href="#apply">How to Apply</a></li>
<li><a href="#official-website">Official Website</a></li>
<li><a href="#previous-papers">Previous Year Papers</a></li>
<li><a href="#faqs">FAQs</a></li>
</ul>

<h2 id="overview">Exam Overview</h2>
<p>[2-3 line introduction about the exam, its importance, and who should appear]</p>

<h2 id="conducting-body">Conducting Body</h2>
<p>[Name and brief info about the organization conducting the exam]</p>

<h2 id="important-dates">Important Dates</h2>
<table>
<thead>
<tr>
<th>Event</th>
<th>Date</th>
</tr>
</thead>
<tbody>
<tr>
<td>Notification Release</td>
<td>[Extract or use "To be announced"]</td>
</tr>
<tr>
<td>Application Start Date</td>
<td>[Extract or use "To be announced"]</td>
</tr>
<tr>
<td>Application End Date</td>
<td>[Extract or use "To be announced"]</td>
</tr>
<tr>
<td>Admit Card Release</td>
<td>[Extract or use "To be announced"]</td>
</tr>
<tr>
<td>Exam Date</td>
<td>[Extract or use "To be announced"]</td>
</tr>
<tr>
<td>Result Date</td>
<td>[Extract or use "To be announced"]</td>
</tr>
</tbody>
</table>

<h2 id="application">Application Form Details</h2>
<p>[Brief overview of application process]</p>
<ul>
<li>Application mode: [Online/Offline]</li>
<li>Required documents: [List key documents]</li>
<li>Photo and signature specifications</li>
</ul>

<h2 id="eligibility">Eligibility Criteria</h2>

<h3>Educational Qualification</h3>
<ul>
<li>[Extract or provide common qualification for this exam type]</li>
</ul>

<h3>Age Limit</h3>
<ul>
<li>Minimum Age: [Extract or use "As per notification"]</li>
<li>Maximum Age: [Extract or use "As per notification"]</li>
<li>Age relaxation for reserved categories as per government norms</li>
</ul>

<h3>Nationality</h3>
<ul>
<li>[Standard nationality criteria]</li>
</ul>

<h2 id="exam-pattern">Exam Pattern</h2>
<table>
<thead>
<tr>
<th>Subject/Paper</th>
<th>Questions</th>
<th>Marks</th>
<th>Duration</th>
</tr>
</thead>
<tbody>
[Create rows based on extracted info or typical pattern for this exam]
</tbody>
</table>

<blockquote>
<p><strong>Note:</strong> Negative marking may apply. Refer to official notification for detailed marking scheme.</p>
</blockquote>

<h2 id="syllabus">Syllabus</h2>
<p>The syllabus typically includes the following sections:</p>

<h3>[Subject 1]</h3>
<ul>
<li>[Topic 1]</li>
<li>[Topic 2]</li>
<li>[Topic 3]</li>
</ul>

<h3>[Subject 2]</h3>
<ul>
<li>[Topic 1]</li>
<li>[Topic 2]</li>
<li>[Topic 3]</li>
</ul>

<p><strong>📥 Download Detailed Syllabus PDF:</strong> <a href="#">[Official Syllabus Link]</a></p>

<h2 id="fee">Registration Fee</h2>
<table>
<thead>
<tr>
<th>Category</th>
<th>Fee Amount</th>
</tr>
</thead>
<tbody>
<tr>
<td>General/OBC</td>
<td>[Amount or "As per notification"]</td>
</tr>
<tr>
<td>SC/ST/PwD</td>
<td>[Reduced amount or exemption]</td>
</tr>
</tbody>
</table>

<p><strong>Payment Mode:</strong> Online (Credit/Debit Card, Net Banking, UPI)</p>

<h2 id="apply">How to Apply</h2>
<ol>
<li>Visit the official website</li>
<li>Click on the application link</li>
<li>Register with valid email and mobile number</li>
<li>Fill in personal and educational details</li>
<li>Upload required documents (photo, signature)</li>
<li>Pay the application fee</li>
<li>Submit the form and save the confirmation page</li>
<li>Take a printout for future reference</li>
</ol>

<blockquote>
<p><strong>Important:</strong> Keep your registration number and password safe for future login.</p>
</blockquote>

<h2 id="official-website">Official Website</h2>
<p>🔗 <strong>Official Website:</strong> <a href="#">[Extract domain or use placeholder]</a></p>
<p>🔗 <strong>Direct Application Link:</strong> <a href="#">[To be updated]</a></p>

<h2 id="previous-papers">Previous Year Question Papers</h2>
<ul>
<li>📄 <a href="#">[Exam Name] 2024 Question Paper</a></li>
<li>📄 <a href="#">[Exam Name] 2023 Question Paper</a></li>
<li>📄 <a href="#">[Exam Name] 2022 Question Paper</a></li>
</ul>

<h2 id="faqs">Frequently Asked Questions (FAQs)</h2>

<h3>Q1: When will the application form be released?</h3>
<p>[Answer based on extracted info or general timeline]</p>

<h3>Q2: What is the eligibility criteria?</h3>
<p>[Brief answer with link to detailed eligibility section]</p>

<h3>Q3: Is there negative marking in the exam?</h3>
<p>[Answer based on exam type or "Refer to official notification"]</p>

<h3>Q4: Can I apply offline?</h3>
<p>[Answer based on exam pattern]</p>

<h3>Q5: Where can I download the admit card?</h3>
<p>Admit cards will be available on the official website. Candidates need to login with their registration credentials.</p>

<h2>Conclusion</h2>
<p>[2-3 lines summarizing the notification and encouraging candidates to prepare well and apply on time]</p>

<blockquote>
<p><strong>Disclaimer:</strong> This article is for informational purposes. Please refer to the official notification for accurate and complete details.</p>
</blockquote>

REMEMBER:
• Use only HTML tags, no markdown
• Keep content structured and scannable
• Use verified information only
• Add placeholders for links and dates if not available
• Maintain professional tone
• Ensure all tables are properly formatted`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const formattedContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ formattedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in format-exam-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
