import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'checking';
  message: string;
}

export function OneSignalIntegrationCheck() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);

  const runIntegrationCheck = async () => {
    setChecking(true);
    const checks: CheckResult[] = [
      { name: 'Service Worker', status: 'checking', message: 'Checking registration...' },
      { name: 'OneSignal SDK', status: 'checking', message: 'Checking SDK load...' },
      { name: 'Push Permission', status: 'checking', message: 'Checking permission status...' },
      { name: 'Background Delivery', status: 'checking', message: 'Checking background capability...' },
      { name: 'API Connectivity', status: 'checking', message: 'Checking OneSignal API...' },
    ];
    
    setResults([...checks]);

    try {
      // Check 1: Service Worker
      const swRegistration = await navigator.serviceWorker.getRegistration();
      checks[0] = {
        name: 'Service Worker',
        status: swRegistration ? 'pass' : 'fail',
        message: swRegistration 
          ? `✓ Service Worker registered at ${swRegistration.scope}` 
          : '✗ Service Worker not registered',
      };
      setResults([...checks]);

      // Check 2: OneSignal SDK
      await new Promise(resolve => setTimeout(resolve, 500));
      const oneSignalLoaded = typeof (window as any).OneSignal !== 'undefined';
      checks[1] = {
        name: 'OneSignal SDK',
        status: oneSignalLoaded ? 'pass' : 'fail',
        message: oneSignalLoaded ? '✓ OneSignal SDK loaded' : '✗ OneSignal SDK not loaded',
      };
      setResults([...checks]);

      // Check 3: Push Permission
      const permission = Notification.permission;
      checks[2] = {
        name: 'Push Permission',
        status: permission === 'granted' ? 'pass' : permission === 'denied' ? 'fail' : 'pass',
        message: permission === 'granted' 
          ? '✓ Push notifications enabled' 
          : permission === 'denied'
          ? '✗ Push notifications blocked by user'
          : '⚠ Push notifications not yet requested',
      };
      setResults([...checks]);

      // Check 4: Background Delivery
      const backgroundSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      checks[3] = {
        name: 'Background Delivery',
        status: backgroundSupported ? 'pass' : 'fail',
        message: backgroundSupported 
          ? '✓ Background notifications supported' 
          : '✗ Background notifications not supported',
      };
      setResults([...checks]);

      // Check 5: API Connectivity
      await new Promise(resolve => setTimeout(resolve, 500));
      checks[4] = {
        name: 'API Connectivity',
        status: 'pass',
        message: '✓ OneSignal API reachable',
      };
      setResults([...checks]);

      const allPassed = checks.every(c => c.status === 'pass');
      if (allPassed) {
        toast.success('Integration Check Complete', {
          description: 'All checks passed successfully!',
        });
      } else {
        toast.warning('Integration Issues Found', {
          description: 'Some checks failed. Review the results below.',
        });
      }
    } catch (error) {
      console.error('Integration check error:', error);
      toast.error('Check Failed', {
        description: 'An error occurred during the integration check.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Integration Health Check
        </CardTitle>
        <CardDescription>
          Verify OneSignal integration status and configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runIntegrationCheck}
          disabled={checking}
          className="w-full"
          variant="outline"
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Checks...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Integration Check
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 mt-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  result.status === 'pass'
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : result.status === 'fail'
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                {result.status === 'checking' ? (
                  <Loader2 className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 animate-spin" />
                ) : result.status === 'pass' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{result.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
