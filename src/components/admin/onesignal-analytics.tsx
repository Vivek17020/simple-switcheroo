import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MousePointer, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  date: string;
  delivered: number;
  clicks: number;
  ctr: number;
}

export function OneSignalAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalDelivered: 0,
    totalClicks: 0,
    avgCtr: 0,
    subscribers: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Fetch analytics from push_analytics table
      const { data, error } = await supabase
        .from('push_analytics' as any)
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (error) throw error;

      if (data) {
        const formattedData = data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          delivered: d.delivered || 0,
          clicks: d.clicks || 0,
          ctr: d.ctr || 0,
        })).reverse();

        setAnalytics(formattedData);

        // Calculate totals
        const totalDelivered = data.reduce((sum: number, d: any) => sum + (d.delivered || 0), 0);
        const totalClicks = data.reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
        const avgCtr = totalDelivered > 0 ? (totalClicks / totalDelivered) * 100 : 0;

        const latestData = data[0] as any;
        setTotals({
          totalDelivered,
          totalClicks,
          avgCtr: Math.round(avgCtr * 10) / 10,
          subscribers: latestData?.subscribers || 0,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Push Notification Analytics
        </CardTitle>
        <CardDescription>
          Last 7 days delivery and engagement metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-700 dark:text-blue-300">Subscribers</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {totals.subscribers.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-700 dark:text-green-300">Delivered</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {totals.totalDelivered.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <MousePointer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-700 dark:text-purple-300">Clicks</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {totals.totalClicks.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs text-orange-700 dark:text-orange-300">Avg CTR</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {totals.avgCtr}%
            </p>
          </div>
        </div>

        {/* Chart */}
        {analytics.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="#3b82f6" name="Delivered" />
                <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No analytics data available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
