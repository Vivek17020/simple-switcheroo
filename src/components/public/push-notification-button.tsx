import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
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

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Request notification permission first
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get VAPID public key from database
      const { data: vapidConfig, error: vapidError } = await supabase
        .from('vapid_config')
        .select('public_key')
        .limit(1)
        .single();

      if (vapidError || !vapidConfig) {
        console.error('VAPID config error:', vapidError);
        toast({
          title: "Configuration error",
          description: "Notification system not configured. Please contact administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidConfig.public_key)
      });

      // Save subscription to database
      const subscriptionObject = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: subscriptionObject.endpoint!,
          p256dh: subscriptionObject.keys!.p256dh!,
          auth: subscriptionObject.keys!.auth!,
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Notifications enabled!",
        description: "You'll receive notifications for breaking news.",
      });
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        if (error) throw error;
      }

      setIsSubscribed(false);
      toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications anymore.",
      });
    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Unsubscribe failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0"
    >
      {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      <span className="sr-only">
        {isSubscribed ? 'Disable' : 'Enable'} Notifications
      </span>
    </Button>
  );
}