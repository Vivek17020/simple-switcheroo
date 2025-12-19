import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Key, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VAPIDKeys {
  publicKey: string;
  privateKey: string;
}

export function VAPIDGenerator() {
  const [keys, setKeys] = useState<VAPIDKeys | null>(null);
  const [existingPublicKey, setExistingPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check for existing VAPID public key on mount
  useEffect(() => {
    const checkExistingKey = async () => {
      try {
        const { data, error } = await supabase.rpc('get_vapid_public_key');
        if (!error && data) {
          setExistingPublicKey(data);
        }
      } catch (error) {
        console.error('Error checking existing VAPID key:', error);
      } finally {
        setCheckingExisting(false);
      }
    };
    checkExistingKey();
  }, []);

  const generateVAPIDKeys = async () => {
    setLoading(true);
    try {
      // Generate VAPID key pair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
      );

      // Export keys
      const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      // Convert to base64
      const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
      const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

      setKeys({ publicKey, privateKey });
      
      toast({
        title: "VAPID Keys Generated",
        description: "Your VAPID keys have been generated successfully",
      });
    } catch (error) {
      console.error('Error generating VAPID keys:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate VAPID keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePublicKeyToDatabase = async () => {
    if (!keys) return;
    
    setSaving(true);
    try {
      // Only save the public key to the database
      // Private key should be stored in Supabase secrets
      const { error } = await supabase
        .from('vapid_config')
        .upsert({
          public_key: keys.publicKey,
          private_key: '', // Empty - private key should be stored in Supabase secrets
        });

      if (error) throw error;

      setExistingPublicKey(keys.publicKey);
      
      toast({
        title: "Public Key Saved",
        description: "VAPID public key saved. Remember to add the private key to Supabase secrets!",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (checkingExisting) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Checking existing VAPID configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>VAPID Key Generator</CardTitle>
            <CardDescription>
              Generate VAPID keys for push notifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {existingPublicKey && !keys && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                VAPID Public Key Configured
              </p>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 font-mono break-all">
              {existingPublicKey.substring(0, 40)}...
            </p>
          </div>
        )}

        {!keys ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Generate VAPID (Voluntary Application Server Identification) keys 
              to enable push notifications for your users.
            </p>
            <Button 
              onClick={generateVAPIDKeys} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  {existingPublicKey ? 'Regenerate VAPID Keys' : 'Generate VAPID Keys'}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key (Safe to store in database)</Label>
              <div className="flex gap-2">
                <Input
                  id="publicKey"
                  value={keys.publicKey}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(keys.publicKey, 'Public key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="privateKey" className="text-destructive">
                  Private Key (Store in Supabase Secrets ONLY)
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-xs"
                >
                  {showPrivateKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="privateKey"
                  value={showPrivateKey ? keys.privateKey : '••••••••••••••••••••••••••••••••'}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(keys.privateKey, 'Private key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Important: Secure Key Storage
                  </p>
                  <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                    <li>Copy the <strong>private key</strong> above</li>
                    <li>Go to Supabase Dashboard → Edge Functions → Secrets</li>
                    <li>Add a secret named <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VAPID_PRIVATE_KEY</code></li>
                    <li>Paste the private key as the value</li>
                    <li>Then click "Save Public Key" below</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={savePublicKeyToDatabase} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Public Key to Database'}
              </Button>
              <Button 
                variant="outline" 
                onClick={generateVAPIDKeys}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive mb-2">
                <strong>🔒 Security Notes:</strong> 
              </p>
              <ul className="text-sm text-destructive space-y-1">
                <li>• Private keys are <strong>never stored in the database</strong></li>
                <li>• Only the public key is saved to the database</li>
                <li>• Store private keys in Supabase Secrets for use in edge functions</li>
                <li>• The public key can be safely used in your frontend application</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
