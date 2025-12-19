import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribedToNotifications,
} from '@/lib/onesignal-init';

export function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check subscription status when OneSignal is ready
    const checkStatus = async () => {
      try {
        // Wait for OneSignal to be ready
        if (typeof window !== 'undefined' && window.OneSignal) {
          const subscribed = await isSubscribedToNotifications();
          setIsSubscribed(subscribed);
          setIsReady(true);
        } else {
          // Try again after a short delay
          setTimeout(checkStatus, 500);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setIsReady(true);
      }
    };

    checkStatus();
  }, []);

  const handleToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        await unsubscribeFromNotifications();
        setIsSubscribed(false);
        toast({
          title: "Notifications disabled",
          description: "You won't receive notifications for new articles.",
        });
      } else {
        // Subscribe
        const success = await subscribeToNotifications();
        if (success) {
          setIsSubscribed(true);
          toast({
            title: "Notifications enabled! 🔔",
            description: "You'll get notified when we publish new articles.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0"
      onClick={handleToggle}
      disabled={loading}
      title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
    >
      {isSubscribed ? (
        <Bell className="h-4 w-4 fill-current" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isSubscribed ? 'Disable' : 'Enable'} notifications
      </span>
    </Button>
  );
}
