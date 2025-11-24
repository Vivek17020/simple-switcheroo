import { useState, useEffect } from 'react';
import { JobFilters } from '@/types/jobs';
import { useJobs, useSavedJobs, useRecommendedJobs } from '@/hooks/use-jobs';
import { supabase } from '@/integrations/supabase/client';
import { JobList } from '@/components/jobs/JobList';
import { JobDetail } from '@/components/jobs/JobDetail';
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Bookmark, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobCard } from '@/components/jobs/JobCard';
import { JobsAPI } from '@/services/jobs-api';
import { toast } from 'sonner';
import { Job } from '@/types/jobs';

export default function PrivateJobs() {
  const [filters, setFilters] = useState<JobFilters>({
    sort: 'newest',
  });

  const {
    jobs,
    total,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useJobs(filters);

  const { savedJobIds, saveJob, unsaveJob, isSaved } = useSavedJobs();
  const { data: recommendedJobs, isLoading: isLoadingRecommended } =
    useRecommendedJobs();
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const savedJobs = jobs.filter((job) => savedJobIds.includes(job.id));

  // Real-time updates for job changes
  useEffect(() => {
    const channel = supabase
      .channel('private-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_jobs',
          filter: 'is_published=eq.true',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleApply = (job: any) => {
    JobsAPI.trackApplyClick(job.id);
    window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    toast.success('Good luck with your application!', {
      description: `Applying to ${job.title} at ${job.company}`,
    });
  };

  const handleSave = (jobId: string) => {
    if (isSaved(jobId)) {
      unsaveJob(jobId);
      toast.success('Job removed from saved list');
    } else {
      saveJob(jobId);
      toast.success('Job saved successfully');
    }
  };

  return (
    <>
      <Helmet>
        <title>Private Jobs - Find Your Dream Career | TheBulletinBriefs</title>
        <meta
          name="description"
          content="Discover the latest private sector job opportunities. Browse jobs by experience, location, salary, and more. Apply directly and save jobs for later."
        />
        <meta
          name="keywords"
          content="private jobs, job search, careers, fresher jobs, experienced jobs, remote jobs, full-time jobs, internships"
        />
        <meta property="og:title" content="Private Jobs - Find Your Dream Career" />
        <meta
          property="og:description"
          content="Discover the latest private sector job opportunities across India."
        />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/private-jobs" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Private Jobs</h1>
            <p className="text-muted-foreground text-lg">
              Discover the latest opportunities from top companies
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load jobs. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs: All Jobs, Recommended, Saved */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="gap-2">
                All Jobs
                {total > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {total}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="recommended" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Recommended
                {recommendedJobs && recommendedJobs.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {recommendedJobs.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="w-4 h-4" />
                Saved
                {savedJobs.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {savedJobs.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* All Jobs Tab */}
            <TabsContent value="all">
              <JobList
                jobs={jobs}
                filters={filters}
                onFilterChange={setFilters}
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage}
                isLoadingMore={isFetchingNextPage}
                isLoading={isLoading}
                totalResults={total}
                savedJobIds={savedJobIds}
                onSaveJob={saveJob}
                onUnsaveJob={unsaveJob}
              />
            </TabsContent>

            {/* Recommended Jobs Tab */}
            <TabsContent value="recommended">
              {isLoadingRecommended ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recommendedJobs && recommendedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {recommendedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleApply}
                      onSave={handleSave}
                      isSaved={isSaved(job.id)}
                      onViewDetails={(job) => {
                        setSelectedJob(job);
                        setIsDetailOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No recommendations yet
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Start browsing jobs and we'll suggest personalized opportunities for
                    you.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Saved Jobs Tab */}
            <TabsContent value="saved">
              {savedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {savedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleApply}
                      onSave={handleSave}
                      isSaved={true}
                      onViewDetails={(job) => {
                        setSelectedJob(job);
                        setIsDetailOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No saved jobs</h3>
                  <p className="text-muted-foreground max-w-md">
                    Save jobs that interest you to easily access them later.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Job Detail Modal */}
        <JobDetail
          job={selectedJob}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onApply={handleApply}
          onSave={handleSave}
          isSaved={selectedJob ? isSaved(selectedJob.id) : false}
        />
      </main>
    </>
  );
}
