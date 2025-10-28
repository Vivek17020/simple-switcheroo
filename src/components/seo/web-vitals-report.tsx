import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, XCircle, Gauge } from "lucide-react";

interface WebVitalsMetrics {
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  inp: number | null;
  ttfb: number | null;
}

export function WebVitalsReport() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: null,
    cls: null,
    fid: null,
    inp: null,
    ttfb: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('PerformanceObserver' in window) {
      // Monitor LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.log('LCP monitoring not supported');
      }

      // Monitor CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const clsEntry = entry as any;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('CLS monitoring not supported');
      }

      // Monitor FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any;
            if (fidEntry.processingStart) {
              const fid = fidEntry.processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, fid }));
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.log('FID monitoring not supported');
      }

      // Get TTFB from Navigation Timing
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          setMetrics(prev => ({ ...prev, ttfb }));
        }
      } catch (e) {
        console.log('TTFB not available');
      }

      setTimeout(() => setIsLoading(false), 2000);
    }
  }, []);

  const getMetricStatus = (metric: string, value: number | null) => {
    if (value === null) return { status: 'unknown', color: 'secondary', icon: AlertCircle };
    
    switch (metric) {
      case 'lcp':
        if (value < 2500) return { status: 'good', color: 'success', icon: CheckCircle2 };
        if (value < 4000) return { status: 'needs improvement', color: 'warning', icon: AlertCircle };
        return { status: 'poor', color: 'destructive', icon: XCircle };
      
      case 'cls':
        if (value < 0.1) return { status: 'good', color: 'success', icon: CheckCircle2 };
        if (value < 0.25) return { status: 'needs improvement', color: 'warning', icon: AlertCircle };
        return { status: 'poor', color: 'destructive', icon: XCircle };
      
      case 'fid':
      case 'inp':
        if (value < 100) return { status: 'good', color: 'success', icon: CheckCircle2 };
        if (value < 300) return { status: 'needs improvement', color: 'warning', icon: AlertCircle };
        return { status: 'poor', color: 'destructive', icon: XCircle };
      
      case 'ttfb':
        if (value < 800) return { status: 'good', color: 'success', icon: CheckCircle2 };
        if (value < 1800) return { status: 'needs improvement', color: 'warning', icon: AlertCircle };
        return { status: 'poor', color: 'destructive', icon: XCircle };
      
      default:
        return { status: 'unknown', color: 'secondary', icon: AlertCircle };
    }
  };

  const formatValue = (metric: string, value: number | null) => {
    if (value === null) return 'Measuring...';
    
    switch (metric) {
      case 'lcp':
      case 'fid':
      case 'inp':
      case 'ttfb':
        return `${Math.round(value)}ms`;
      case 'cls':
        return value.toFixed(3);
      default:
        return value.toString();
    }
  };

  const metrics_data = [
    {
      key: 'lcp',
      name: 'Largest Contentful Paint (LCP)',
      description: 'Measures loading performance. Should occur within 2.5s.',
      value: metrics.lcp,
    },
    {
      key: 'cls',
      name: 'Cumulative Layout Shift (CLS)',
      description: 'Measures visual stability. Should maintain a score below 0.1.',
      value: metrics.cls,
    },
    {
      key: 'fid',
      name: 'First Input Delay (FID)',
      description: 'Measures interactivity. Should be less than 100ms.',
      value: metrics.fid,
    },
    {
      key: 'ttfb',
      name: 'Time to First Byte (TTFB)',
      description: 'Measures server response time. Should be less than 800ms.',
      value: metrics.ttfb,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          <CardTitle>Core Web Vitals Report</CardTitle>
        </div>
        <CardDescription>
          Real-time performance metrics for this page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <Alert>
            <AlertDescription>
              Collecting performance metrics... Please wait.
            </AlertDescription>
          </Alert>
        )}
        
        {metrics_data.map((metric) => {
          const status = getMetricStatus(metric.key, metric.value);
          const StatusIcon = status.icon;
          
          return (
            <div key={metric.key} className="space-y-2 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 text-${status.color}`} />
                  <h3 className="font-semibold">{metric.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {formatValue(metric.key, metric.value)}
                  </span>
                  <Badge variant={status.color as any}>
                    {status.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{metric.description}</p>
            </div>
          );
        })}

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> These metrics are measured in real-time on your device. 
            Actual user experience may vary based on device, network, and browser.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
