import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  MousePointer, 
  Eye, 
  TrendingUp, 
  Settings,
  Crown,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

const MetricCard = ({ title, value, change, icon, trend }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
        {change}
      </p>
    </CardContent>
  </Card>
);

export const MonetizationDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    adRevenue: 0,
    affiliateRevenue: 0,
    subscriptionRevenue: 0,
    totalSubscribers: 0,
    activeSubscribers: 0,
    adImpressions: 0,
    adClicks: 0,
    affiliateClicks: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(timeRange.replace('d', ''));
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      // Check if tables exist first and handle permission errors gracefully
      const queries = await Promise.allSettled([
        // Fetch revenue data with error handling
        supabase
          .from('monetization_analytics')
          .select('event_type, revenue_amount, created_at')
          .gte('created_at', startDate)
          .not('revenue_amount', 'is', null),

        // Fetch subscriber count with error handling
        supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),

        // Fetch ad impressions
        supabase
          .from('monetization_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'ad_impression')
          .gte('created_at', startDate),

        // Fetch ad clicks  
        supabase
          .from('monetization_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'ad_click')
          .gte('created_at', startDate),

        // Fetch affiliate clicks
        supabase
          .from('monetization_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'affiliate_click')
          .gte('created_at', startDate)
      ]);

      // Extract results with fallbacks for failed queries
      const revenueData = queries[0].status === 'fulfilled' ? queries[0].value.data : [];
      const totalSubs = queries[1].status === 'fulfilled' ? queries[1].value.count : 0;
      const adImpressions = queries[2].status === 'fulfilled' ? queries[2].value.count : 0;
      const adClicks = queries[3].status === 'fulfilled' ? queries[3].value.count : 0;
      const affiliateClicks = queries[4].status === 'fulfilled' ? queries[4].value.count : 0;

      // Log any permission errors for debugging
      queries.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Monetization query ${index} failed:`, result.reason);
        }
      });

      // Calculate metrics
      const totalRevenue = revenueData?.reduce((sum, record) => sum + (record.revenue_amount || 0), 0) || 0;
      const adRevenue = revenueData?.filter(r => r.event_type === 'ad_click').reduce((sum, record) => sum + (record.revenue_amount || 0), 0) || 0;
      const affiliateRevenue = revenueData?.filter(r => r.event_type === 'affiliate_click').reduce((sum, record) => sum + (record.revenue_amount || 0), 0) || 0;
      const subscriptionRevenue = revenueData?.filter(r => r.event_type === 'subscription_purchase').reduce((sum, record) => sum + (record.revenue_amount || 0), 0) || 0;
      const ctr = (adImpressions && adImpressions > 0) ? (adClicks || 0) / adImpressions * 100 : 0;

      setMetrics({
        totalRevenue,
        adRevenue,
        affiliateRevenue,
        subscriptionRevenue,
        totalSubscribers: totalSubs || 0,
        activeSubscribers: totalSubs || 0,
        adImpressions: adImpressions || 0,
        adClicks: adClicks || 0,
        affiliateClicks: affiliateClicks || 0,
        conversionRate: ctr
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentTransactions = [
    { id: 1, type: 'Subscription', user: 'john@example.com', amount: 9.99, date: '2024-01-15' },
    { id: 2, type: 'Affiliate', product: 'Tech Gadget Bundle', amount: 4.99, date: '2024-01-15' },
    { id: 3, type: 'Ad Revenue', clicks: 23, amount: 12.45, date: '2024-01-14' },
    { id: 4, type: 'Subscription', user: 'sarah@example.com', amount: 99.99, date: '2024-01-14' },
  ];

  const topAffiliateProducts = [
    { name: 'Premium News App', clicks: 89, conversions: 12, revenue: 59.88 },
    { name: 'Financial Planning Guide', clicks: 76, conversions: 8, revenue: 119.92 },
    { name: 'Tech Gadget Bundle', clicks: 69, conversions: 6, revenue: 299.94 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Monetization Dashboard</h1>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          change="+12.5% from last month"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <MetricCard
          title="Subscribers"
          value={metrics.totalSubscribers}
          change="+8 new this week"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <MetricCard
          title="Ad CTR"
          value={`${(metrics.adClicks / metrics.adImpressions * 100).toFixed(2)}%`}
          change="+0.3% from last week"
          icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change="-0.5% from last week"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="down"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="advertising">Advertising</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ad Revenue</span>
                    <span className="font-medium">${metrics.adRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Affiliate Revenue</span>
                    <span className="font-medium">${metrics.affiliateRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Subscription Revenue</span>
                    <span className="font-medium">${metrics.subscriptionRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{transaction.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {'user' in transaction ? transaction.user : 
                           'product' in transaction ? transaction.product : 
                           `${transaction.clicks} clicks`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${transaction.amount}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Subscribers"
              value={metrics.totalSubscribers}
              change="+8 new this week"
              icon={<Crown className="h-4 w-4 text-muted-foreground" />}
              trend="up"
            />
            <MetricCard
              title="Active Subscribers"
              value={metrics.activeSubscribers}
              change="91% retention rate"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              trend="up"
            />
            <MetricCard
              title="MRR"
              value={`$${(metrics.subscriptionRevenue * 4).toFixed(2)}`}
              change="+15% from last month"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              trend="up"
            />
          </div>
        </TabsContent>

        <TabsContent value="advertising" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Ad Impressions"
              value={metrics.adImpressions.toLocaleString()}
              change="+2,340 from yesterday"
              icon={<Eye className="h-4 w-4 text-muted-foreground" />}
              trend="up"
            />
            <MetricCard
              title="Ad Clicks"
              value={metrics.adClicks}
              change="+45 from yesterday"
              icon={<MousePointer className="h-4 w-4 text-muted-foreground" />}
              trend="up"
            />
            <MetricCard
              title="Ad Revenue"
              value={`$${metrics.adRevenue.toFixed(2)}`}
              change="+$23.50 from yesterday"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              trend="up"
            />
          </div>
        </TabsContent>

        <TabsContent value="affiliate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Affiliate Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAffiliateProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{product.clicks} clicks</span>
                        <span>{product.conversions} conversions</span>
                        <span>{((product.conversions / product.clicks) * 100).toFixed(1)}% CVR</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${product.revenue.toFixed(2)}</p>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};