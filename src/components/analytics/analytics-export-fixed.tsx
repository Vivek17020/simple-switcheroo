import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Download, FileText, Table } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

interface ExportData {
  articles: any[];
  analytics: any[];
  engagement: any[];
}

export function AnalyticsExportFixed() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [exportType, setExportType] = useState<string>('analytics');
  const [formatType, setFormatType] = useState<string>('csv');
  const [loading, setLoading] = useState(false);

  const fetchExportData = async (): Promise<ExportData> => {
    const startDate = dateRange?.from?.toISOString();
    const endDate = dateRange?.to?.toISOString();

    const [articlesResult, analyticsResult, engagementResult] = await Promise.all([
      supabase
        .from('articles')
        .select(`
          id, title, slug, author, published_at, views_count, 
          likes_count, shares_count, comments_count, reading_time,
          categories (name)
        `)
        .gte('published_at', startDate)
        .lte('published_at', endDate)
        .eq('published', true),
      
      supabase
        .from('user_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      supabase
        .from('monetization_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    return {
      articles: articlesResult.data || [],
      analytics: analyticsResult.data || [],
      engagement: engagementResult.data || []
    };
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a date range for export",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchExportData();
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      
      let exportData: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'analytics':
          exportData = data.analytics;
          filename = `analytics-${dateStr}`;
          break;
        case 'articles':
          exportData = data.articles.map(article => ({
            ...article,
            category: article.categories?.name || 'Uncategorized'
          }));
          filename = `articles-${dateStr}`;
          break;
        case 'engagement':
          exportData = data.engagement;
          filename = `engagement-${dateStr}`;
          break;
        case 'summary':
          // Create summary report
          const totalViews = data.articles.reduce((sum, a) => sum + (a.views_count || 0), 0);
          const totalLikes = data.articles.reduce((sum, a) => sum + (a.likes_count || 0), 0);
          const totalShares = data.articles.reduce((sum, a) => sum + (a.shares_count || 0), 0);
          const totalComments = data.articles.reduce((sum, a) => sum + (a.comments_count || 0), 0);
          
          exportData = [{
            period: `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`,
            total_articles: data.articles.length,
            total_views: totalViews,
            total_likes: totalLikes,
            total_shares: totalShares,
            total_comments: totalComments,
            total_analytics_events: data.analytics.length,
            avg_views_per_article: data.articles.length > 0 ? Math.round(totalViews / data.articles.length) : 0,
            engagement_rate: totalViews > 0 ? `${((totalLikes + totalShares + totalComments) / totalViews * 100).toFixed(2)}%` : '0%'
          }];
          filename = `summary-${dateStr}`;
          break;
      }

      if (exportData.length === 0) {
        toast({
          title: "No Data Found",
          description: "No data available for the selected criteria",
          variant: "destructive",
        });
        return;
      }

      if (formatType === 'csv') {
        const csvContent = convertToCSV(exportData);
        downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      } else {
        // JSON export
        const jsonContent = JSON.stringify(exportData, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
      }

      toast({
        title: "Export Successful",
        description: `${exportData.length} records exported as ${formatType.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Analytics Export</CardTitle>
            <CardDescription>
              Export analytics data in CSV or JSON format
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <DatePickerWithRange 
            date={dateRange} 
            setDate={setDateRange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Export Type</label>
          <Select value={exportType} onValueChange={setExportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analytics">User Analytics</SelectItem>
              <SelectItem value="articles">Article Performance</SelectItem>
              <SelectItem value="engagement">Engagement Metrics</SelectItem>
              <SelectItem value="summary">Summary Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <Select value={formatType} onValueChange={setFormatType}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  CSV (Excel Compatible)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={loading || !dateRange?.from || !dateRange?.to}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? 'Exporting...' : `Export ${exportType.charAt(0).toUpperCase() + exportType.slice(1)}`}
        </Button>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            📊 Export includes detailed analytics data for the selected time period. 
            CSV format is recommended for use with Excel or Google Sheets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}