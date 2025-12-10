import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SocialLoginProps {
  redirectTo?: string;
  mode?: 'signin' | 'signup';
}

export function SocialLogin({ redirectTo = '/', mode = 'signin' }: SocialLoginProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'twitter') => {
    setLoading(provider);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: "https://editor-hub-85.vercel.app/",
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      toast({
        title: "Redirecting...",
        description: `Signing ${mode === 'signin' ? 'in' : 'up'} with ${provider}`,
      });
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      toast({
        title: "Authentication failed",
        description: error.message || `Failed to ${mode === 'signin' ? 'sign in' : 'sign up'} with ${provider}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or {mode === 'signin' ? 'sign in' : 'sign up'} with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          onClick={() => handleSocialLogin('google')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'google' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleSocialLogin('twitter')}
          disabled={loading !== null}
          className="w-full"
        >
          {loading === 'twitter' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.twitter className="mr-2 h-4 w-4" />
          )}
          Continue with Twitter
        </Button>
      </div>
    </div>
  );
}