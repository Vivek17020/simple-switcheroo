import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface VerificationRecord {
  id: string;
  url: string;
  issue_type: string;
  fix_action: string;
  fix_applied_at: string;
  internal_status: string;
  gsc_status: string;
  recheck_notes: string | null;
  rechecked_at: string | null;
  retry_count: number;
  last_error: string | null;
  article_id: string | null;
}

interface Stats {
  total: number;
  internalPassed: number;
  internalFailed: number;
  gscIndexed: number;
  gscNotIndexed: number;
  pending: number;
}

export function SeoVerificationDashboard() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    internalPassed: 0,
    internalFailed: 0,
    gscIndexed: 0,
    gscNotIndexed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      console.log('Fetching SEO verifications...');
      const { data, error } = await supabase
        .from('seo_autofix_verification')
        .select('*')
        .order('fix_applied_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Verification records fetched:', data?.length || 0);
      setRecords(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const internalPassed = data?.filter(r => r.internal_status === 'passed').length || 0;
      const internalFailed = data?.filter(r => r.internal_status === 'failed').length || 0;
      const gscIndexed = data?.filter(r => r.gsc_status === 'indexed').length || 0;
      const gscNotIndexed = data?.filter(r => r.gsc_status === 'not_indexed').length || 0;
      const pending = data?.filter(r => r.internal_status === 'pending' || r.gsc_status === 'pending').length || 0;

      setStats({
        total,
        internalPassed,
        internalFailed,
        gscIndexed,
        gscNotIndexed,
        pending
      });

      toast.success(`Loaded ${total} verification records`);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verification data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecheck = async (id: string) => {
    setRefreshing(true);
    try {
      console.log('Triggering recheck for record:', id);
      const { data, error } = await supabase.functions.invoke('verify-seo-fixes', {
        body: { recordId: id }
      });

      if (error) {
        console.error('Recheck error:', error);
        throw error;
      }

      console.log('Recheck response:', data);
      toast.success('Recheck triggered successfully');
      
      // Wait a bit before refreshing to allow the edge function to complete
      setTimeout(async () => {
        await fetchVerifications();
      }, 2000);
    } catch (error) {
      console.error('Error rechecking:', error);
      toast.error('Failed to trigger recheck: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceReindex = async (url: string) => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('inspect-gsc-url', {
        body: { url, forceReindex: true }
      });

      if (error) throw error;

      toast.success('Reindexing request sent to Google');
      await fetchVerifications();
    } catch (error) {
      console.error('Error requesting reindex:', error);
      toast.error('Failed to request reindexing');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'indexed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'failed':
      case 'not_indexed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading verification data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Internal Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.internalPassed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Internal Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.internalFailed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">GSC Indexed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.gscIndexed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">GSC Not Indexed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.gscNotIndexed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>SEO Auto-Fix & Verification</CardTitle>
              <CardDescription>Monitor and verify all automated SEO fixes</CardDescription>
            </div>
            <Button 
              onClick={() => {
                setRefreshing(true);
                fetchVerifications().finally(() => setRefreshing(false));
              }} 
              disabled={refreshing} 
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Fix Action</TableHead>
                  <TableHead>Internal Status</TableHead>
                  <TableHead>GSC Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No verification records found</p>
                        <p className="text-sm text-muted-foreground">
                          Go to the "SEO Health" tab to trigger auto-fixes, which will then appear here for verification.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className={record.internal_status === 'failed' || record.gsc_status === 'not_indexed' ? 'bg-red-50 dark:bg-red-950/10' : ''}>
                      <TableCell className="max-w-xs truncate">
                        <a href={record.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                          {record.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.issue_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm">{record.fix_action}</TableCell>
                      <TableCell>{getStatusBadge(record.internal_status)}</TableCell>
                      <TableCell>{getStatusBadge(record.gsc_status)}</TableCell>
                      <TableCell className="text-sm">
                        {record.rechecked_at ? format(new Date(record.rechecked_at), 'MMM d, HH:mm') : 'Not checked'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.retry_count >= 3 ? 'destructive' : 'secondary'}>
                          {record.retry_count}/3
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRecheck(record.id)}
                            disabled={refreshing}
                          >
                            Recheck
                          </Button>
                          {(record.gsc_status === 'not_indexed' || record.gsc_status === 'pending') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleForceReindex(record.url)}
                              disabled={refreshing}
                            >
                              Force Reindex
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
