import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

export function EnhancedPushNotification() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission === 'granted';
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    setLoading(true);
    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        toast({
          title: "Permission Denied",
          description: "Notifications were not enabled",
          variant: "destructive",
        });
        return;
      }

      // Get VAPID public key from database
      const { data: vapidConfig, error: vapidError } = await supabase
        .from('vapid_config')
        .select('public_key')
        .limit(1)
        .single();

      if (vapidError || !vapidConfig) {
        toast({
          title: "Configuration Error",
          description: "VAPID keys not configured. Please contact administrator.",
          variant: "destructive",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidConfig.public_key),
      });

      // Save subscription to database
      const subscriptionObject = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user?.id,
          endpoint: subscriptionObject.endpoint!,
          p256dh: subscriptionObject.keys!.p256dh!,
          auth: subscriptionObject.keys!.auth!,
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled!",
        description: "You'll now receive push notifications for breaking news",
      });
    } catch (error: any) {
      console.error('Error subscribing user:', error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to enable notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        const subscriptionObject = subscription.toJSON();
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscriptionObject.endpoint!);

        if (error) throw error;
      }

      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore",
      });
    } catch (error: any) {
      console.error('Error unsubscribing user:', error);
      toast({
        title: "Unsubscribe Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from TheBulletinBriefs',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Push notifications are not supported in this browser
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">Push Notifications</CardTitle>
            <CardDescription>
              {isSubscribed ? 'Enabled' : 'Stay updated with breaking news'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Get instant notifications for:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Breaking news alerts</li>
            <li>• New article publications</li>
            <li>• Important updates</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button 
              onClick={subscribeUser} 
              disabled={loading}
              className="flex-1"
            >
              <Bell className="mr-2 h-4 w-4" />
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={unsubscribeUser} 
                disabled={loading}
                className="flex-1"
              >
                <BellOff className="mr-2 h-4 w-4" />
                {loading ? 'Disabling...' : 'Disable'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={testNotification}
              >
                Test
              </Button>
            </>
          )}
        </div>

        {permission === 'denied' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}