import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  fullName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, fullName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending welcome email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "The Bulletin Briefs <welcome@thebulletinbriefs.com>",
      to: [email],
      subject: "Welcome to The Bulletin Briefs! 📰",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to The Bulletin Briefs!</h1>
          </div>
          
          <div style="background: white; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${fullName || 'there'}! 👋</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              Thank you for joining The Bulletin Briefs! We're excited to have you as part of our community of informed readers.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">What's next?</h3>
              <ul style="color: #555; line-height: 1.6;">
                <li>📰 Stay updated with breaking news and trending stories</li>
                <li>💌 Get our newsletter delivered straight to your inbox</li>
                <li>🔔 Enable push notifications for instant updates</li>
                <li>💬 Join the conversation with comments and discussions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://107da7ce-f26e-4ff3-b60e-d2d83e58e2e2.lovableproject.com" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Start Reading Now
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              You're receiving this email because you signed up for The Bulletin Briefs.<br>
              <a href="#" style="color: #667eea;">Manage your preferences</a> | 
              <a href="#" style="color: #667eea;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send welcome email' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});