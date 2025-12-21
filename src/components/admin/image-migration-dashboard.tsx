import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cloud, Image, CheckCircle2, XCircle, Loader2, Play, RefreshCw, FileImage, Trash2, AlertTriangle, HardDrive } from 'lucide-react';

interface MigrationStatus {
  articles: {
    total: number;
    supabase: number;
    cloudinary: number;
    pending: number;
  };
  webStories: {
    total: number;
    supabaseImages: number;
    cloudinaryImages: number;
    pending: number;
  };
}

interface ContentMigrationStatus {
  articlesWithEmbeddedImages: number;
  totalEmbeddedImages: number;
  details: { id: string; title: string; embeddedImageCount: number }[];
}

interface StorageStatus {
  bucket: string;
  totalFiles: number;
  totalSizeMB: string;
  referencedFiles: number;
  unreferencedFiles: number;
  unreferencedSizeMB: string;
  potentialSavingsMB: string;
  sampleUnreferencedFiles: string[];
}

interface MigrationResult {
  id: string;
  title: string;
  status: 'success' | 'error';
  newUrl?: string;
  error?: string;
  imagesUpdated?: number;
}

export function ImageMigrationDashboard() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [contentStatus, setContentStatus] = useState<ContentMigrationStatus | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationType, setMigrationType] = useState<'articles' | 'webstories'>('articles');
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState('featured');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Fetch all statuses in parallel
      const [featuredRes, contentRes, storageRes] = await Promise.all([
        supabase.functions.invoke('migrate-images-to-cloudinary', { body: { mode: 'status' } }),
        supabase.functions.invoke('migrate-content-images', { body: { mode: 'status' } }),
        supabase.functions.invoke('cleanup-supabase-storage', { body: { mode: 'status' } }),
      ]);

      if (featuredRes.data?.success) {
        setStatus(featuredRes.data);
      }
      if (contentRes.data?.success) {
        setContentStatus(contentRes.data);
      }
      if (storageRes.data?.success) {
        setStorageStatus(storageRes.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch status:', err);
      toast.error('Failed to fetch migration status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const startFeaturedMigration = async () => {
    if (migrating) return;
    
    setMigrating(true);
    setResults([]);
    
    const pending = migrationType === 'articles' 
      ? status?.articles.pending || 0 
      : status?.webStories.pending || 0;
    
    setBatchProgress({ current: 0, total: pending });

    let totalMigrated = 0;

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke('migrate-images-to-cloudinary', {
          body: { mode: 'migrate', type: migrationType, batchSize: 2, offset: 0 },
        });

        if (error) throw error;

        if (data?.results) {
          setResults(prev => [...prev, ...data.results]);
          totalMigrated += data.migrated || 0;
          setBatchProgress(prev => ({ ...prev, current: totalMigrated }));
        }

        if (data?.remaining === 0 || data?.migrated === 0) {
          toast.success(`Migration complete! ${totalMigrated} ${migrationType} migrated.`);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err: any) {
      console.error('Migration error:', err);
      toast.error(`Migration failed: ${err.message}`);
    } finally {
      setMigrating(false);
      fetchStatus();
    }
  };

  const startContentMigration = async () => {
    if (migrating) return;
    
    setMigrating(true);
    setResults([]);
    setBatchProgress({ current: 0, total: contentStatus?.totalEmbeddedImages || 0 });

    let totalMigrated = 0;

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke('migrate-content-images', {
          body: { mode: 'migrate', batchSize: 2 },
        });

        if (error) throw error;

        totalMigrated += data?.migratedImages || 0;
        setBatchProgress(prev => ({ ...prev, current: totalMigrated }));

        if (data?.remaining === 0 || data?.migratedImages === 0) {
          toast.success(`Content migration complete! ${totalMigrated} embedded images migrated.`);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err: any) {
      console.error('Content migration error:', err);
      toast.error(`Migration failed: ${err.message}`);
    } finally {
      setMigrating(false);
      fetchStatus();
    }
  };

  const runCleanupDryRun = async () => {
    setMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-supabase-storage', {
        body: { mode: 'cleanup', dryRun: true, batchSize: 100 },
      });

      if (error) throw error;

      toast.info(`Dry run: Would delete ${data?.wouldDelete || 0} unreferenced files`);
      fetchStatus();
    } catch (err: any) {
      toast.error(`Dry run failed: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const runCleanup = async () => {
    if (!confirm('Are you sure you want to delete unreferenced files from Supabase storage? This cannot be undone.')) {
      return;
    }

    setMigrating(true);
    setBatchProgress({ current: 0, total: storageStatus?.unreferencedFiles || 0 });

    let totalDeleted = 0;

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke('cleanup-supabase-storage', {
          body: { mode: 'cleanup', dryRun: false, batchSize: 50 },
        });

        if (error) throw error;

        totalDeleted += data?.deletedCount || 0;
        setBatchProgress(prev => ({ ...prev, current: totalDeleted }));

        if (data?.remainingUnreferenced === 0 || data?.deletedCount === 0) {
          toast.success(`Cleanup complete! Deleted ${totalDeleted} unreferenced files.`);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err: any) {
      toast.error(`Cleanup failed: ${err.message}`);
    } finally {
      setMigrating(false);
      fetchStatus();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading migration status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const articleProgress = status?.articles 
    ? (status.articles.cloudinary / Math.max(status.articles.total, 1)) * 100 
    : 0;
  
  const storyProgress = status?.webStories 
    ? (status.webStories.cloudinaryImages / Math.max(status.webStories.supabaseImages + status.webStories.cloudinaryImages, 1)) * 100 
    : 0;

  const allMigrated = (status?.articles.pending === 0) && 
                       (status?.webStories.pending === 0) && 
                       (contentStatus?.articlesWithEmbeddedImages === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Image Migration & Storage Cleanup
          </h2>
          <p className="text-sm text-muted-foreground">
            Migrate images to Cloudinary and free up Supabase storage
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="featured">Featured Images</TabsTrigger>
          <TabsTrigger value="content">
            Content Images
            {contentStatus?.articlesWithEmbeddedImages ? (
              <Badge variant="destructive" className="ml-2">{contentStatus.articlesWithEmbeddedImages}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="cleanup">Storage Cleanup</TabsTrigger>
        </TabsList>

        {/* Featured Images Tab */}
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Featured & Web Story Images</CardTitle>
              <CardDescription>Migrate featured images from articles and web stories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Articles Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span className="font-medium">Article Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">{status?.articles.cloudinary || 0} Cloudinary</Badge>
                    <Badge variant="secondary">{status?.articles.pending || 0} pending</Badge>
                  </div>
                </div>
                <Progress value={articleProgress} className="h-2" />
              </div>

              {/* Web Stories Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    <span className="font-medium">Web Story Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">{status?.webStories.cloudinaryImages || 0} Cloudinary</Badge>
                    <Badge variant="secondary">{status?.webStories.pending || 0} pending</Badge>
                  </div>
                </div>
                <Progress value={storyProgress} className="h-2" />
              </div>

              {/* Migration Controls */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant={migrationType === 'articles' ? 'default' : 'outline'}
                    onClick={() => setMigrationType('articles')}
                    disabled={migrating}
                    size="sm"
                  >
                    Articles ({status?.articles.pending || 0})
                  </Button>
                  <Button
                    variant={migrationType === 'webstories' ? 'default' : 'outline'}
                    onClick={() => setMigrationType('webstories')}
                    disabled={migrating}
                    size="sm"
                  >
                    Web Stories ({status?.webStories.pending || 0})
                  </Button>
                </div>
                <Button 
                  onClick={startFeaturedMigration} 
                  disabled={migrating || (migrationType === 'articles' ? status?.articles.pending === 0 : status?.webStories.pending === 0)}
                  className="ml-auto"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Migration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Images Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Embedded Content Images</CardTitle>
              <CardDescription>Migrate images embedded within article content (HTML)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contentStatus?.articlesWithEmbeddedImages === 0 ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>All Done!</AlertTitle>
                  <AlertDescription>
                    All embedded content images have been migrated to Cloudinary.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Embedded Supabase URLs Found</AlertTitle>
                    <AlertDescription>
                      {contentStatus?.articlesWithEmbeddedImages} articles contain {contentStatus?.totalEmbeddedImages} embedded images still using Supabase URLs.
                    </AlertDescription>
                  </Alert>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {contentStatus?.details.map(article => (
                      <div key={article.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate flex-1">{article.title}</span>
                        <Badge variant="secondary">{article.embeddedImageCount} images</Badge>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={startContentMigration} 
                    disabled={migrating}
                    className="w-full"
                  >
                    {migrating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Migrating Embedded Images... ({batchProgress.current}/{batchProgress.total})
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Migrate {contentStatus?.totalEmbeddedImages} Embedded Images
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Cleanup Tab */}
        <TabsContent value="cleanup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Supabase Storage Cleanup
              </CardTitle>
              <CardDescription>Remove unreferenced files to free up storage space</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!allMigrated ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Migration Incomplete</AlertTitle>
                  <AlertDescription>
                    Please complete all image migrations before cleaning up storage to avoid deleting files that are still in use.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{storageStatus?.totalFiles || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Files</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{storageStatus?.totalSizeMB || '0'} MB</p>
                      <p className="text-xs text-muted-foreground">Total Size</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{storageStatus?.unreferencedFiles || 0}</p>
                      <p className="text-xs text-muted-foreground">Unreferenced Files</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{storageStatus?.potentialSavingsMB || '0'} MB</p>
                      <p className="text-xs text-muted-foreground">Potential Savings</p>
                    </div>
                  </div>

                  {storageStatus?.sampleUnreferencedFiles && storageStatus.sampleUnreferencedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sample unreferenced files:</p>
                      <div className="max-h-32 overflow-y-auto text-xs bg-muted p-2 rounded font-mono">
                        {storageStatus.sampleUnreferencedFiles.map((file, idx) => (
                          <div key={idx}>{file}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={runCleanupDryRun}
                      disabled={migrating || storageStatus?.unreferencedFiles === 0}
                    >
                      Dry Run (Preview)
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={runCleanup}
                      disabled={migrating || storageStatus?.unreferencedFiles === 0}
                      className="flex-1"
                    >
                      {migrating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting... ({batchProgress.current}/{batchProgress.total})
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete {storageStatus?.unreferencedFiles || 0} Unreferenced Files
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Migration Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span className="truncate text-sm">{result.title}</span>
                  </div>
                  {result.status === 'success' ? (
                    <Badge variant="outline" className="text-green-600 shrink-0">
                      {result.imagesUpdated ? `${result.imagesUpdated} images` : 'Migrated'}
                    </Badge>
                  ) : (
                    <span className="text-xs text-red-600 truncate max-w-[200px]">{result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
