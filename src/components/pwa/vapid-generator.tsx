import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Key, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VAPIDKeys {
  publicKey: string;
  privateKey: string;
}

export function VAPIDGenerator() {
  const [keys, setKeys] = useState<VAPIDKeys | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

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

  const saveKeysToDatabase = async () => {
    if (!keys) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vapid_config')
        .upsert({
          public_key: keys.publicKey,
          private_key: keys.privateKey,
        });

      if (error) throw error;

      toast({
        title: "Keys Saved",
        description: "VAPID keys have been saved to the database",
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
                  Generate VAPID Keys
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
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
                <Label htmlFor="privateKey">Private Key</Label>
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

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={saveKeysToDatabase} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save to Database'}
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
                <strong>🔒 Security Warning:</strong> 
              </p>
              <ul className="text-sm text-destructive space-y-1">
                <li>• Store private keys only in server-side environment variables</li>
                <li>• Never expose private keys in client-side code or version control</li>
                <li>• Only admins should have access to VAPID key generation</li>
                <li>• The public key can be safely used in your frontend application</li>
                <li>• Private keys are hidden by default for security</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}