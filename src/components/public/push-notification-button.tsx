import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
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

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        setOpen(false);
        return;
      }

      // Generate VAPID key for your app - you would get this from your push service
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YkTpvdNuoH4Wf1nAGPDR4-M6w5k9FRs8gxGI8z8VPCYb5B5l8F5kF5k';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .insert([{
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        }]);

      if (error) throw error;

      setIsSubscribed(true);
      setOpen(false);
      toast({
        title: "Notifications enabled!",
        description: "You'll receive notifications for breaking news.",
      });
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = () => {
    setOpen(false);
    toast({
      title: "Notifications blocked",
      description: "You can change this later in your browser settings.",
    });
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

  if (isSubscribed) {
    return (
      <Button
        onClick={unsubscribe}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <BellOff className="h-4 w-4" />
        Disable Notifications
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Enable Notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enable Push Notifications
          </DialogTitle>
          <DialogDescription>
            Stay updated with breaking news and important stories. We'll only send notifications for the most important news.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleBlock}
            disabled={isLoading}
          >
            Block
          </Button>
          <Button
            onClick={handleAllow}
            disabled={isLoading}
          >
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}