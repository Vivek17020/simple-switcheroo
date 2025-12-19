import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function OneSignalTestNotification() {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    recipients?: number;
  } | null>(null);

  const sendTestNotification = async () => {
    setSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-onesignal-notification', {
        body: {
          isTest: true,
        },
      });

      if (error) throw error;

      setLastResult({
        success: true,
        message: 'Test notification sent successfully!',
        recipients: data.recipients || 0,
      });

      toast.success('Test notification sent!', {
        description: `Delivered to ${data.recipients || 0} subscribers`,
      });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      setLastResult({
        success: false,
        message: error.message || 'Failed to send test notification',
      });
      toast.error('Failed to send notification', {
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          OneSignal Push Notifications
        </CardTitle>
        <CardDescription>
          Test web push notifications to all subscribed users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Automatic Notifications Active
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Push notifications are automatically sent when you publish a new article. 
              The notification bell appears in the bottom-right corner of your site for users to subscribe.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={sendTestNotification}
            disabled={sending}
            className="w-full"
            size="lg"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Sending Test...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Notification
              </>
            )}
          </Button>

          {lastResult && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                lastResult.success
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}
            >
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <h4
                  className={`font-medium ${
                    lastResult.success
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {lastResult.success ? 'Success!' : 'Failed'}
                </h4>
                <p
                  className={`text-sm ${
                    lastResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {lastResult.message}
                </p>
                {lastResult.success && lastResult.recipients !== undefined && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Delivered to {lastResult.recipients} subscriber{lastResult.recipients !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Configuration</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>App ID:</span>
              <span className="font-mono text-xs">1ace9244-6c2b-4b2c-852f-1583c1ff0f72</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Email Alerts:</span>
              <span className="text-muted-foreground">Disabled (Push Only)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
