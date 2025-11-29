import { Job, JobFilters as JobFiltersType } from '@/types/jobs';
import { JobCard } from './JobCard';
import { JobCardSkeleton } from './JobCardSkeleton';
import { JobFilters } from './JobFilters';
import { JobDetail } from './JobDetail';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { JobsAPI } from '@/services/jobs-api';
import { toast } from 'sonner';

interface JobListProps {
  jobs: Job[];
  filters: JobFiltersType;
  onFilterChange: (filters: JobFiltersType) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isLoading?: boolean;
  totalResults?: number;
  savedJobIds: string[];
  onSaveJob: (jobId: string) => void;
  onUnsaveJob: (jobId: string) => void;
}

export function JobList({
  jobs,
  filters,
  onFilterChange,
  onLoadMore,
  hasMore,
  isLoadingMore,
  isLoading,
  totalResults,
  savedJobIds,
  onSaveJob,
  onUnsaveJob,
}: JobListProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleApply = (job: Job) => {
    // Track analytics
    JobsAPI.trackApplyClick(job.id);

    // Open apply URL in new tab
    window.open(job.applyUrl, '_blank', 'noopener,noreferrer');

    toast.success('Good luck with your application!', {
      description: `Applying to ${job.title} at ${job.company}`,
    });
  };

  const handleSave = (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    if (isSaved) {
      onUnsaveJob(jobId);
      toast.success('Job removed from saved list');
    } else {
      onSaveJob(jobId);
      toast.success('Job saved successfully');
    }
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <>
        <JobFilters filters={filters} onFilterChange={onFilterChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div>
      {/* Filters */}
      <JobFilters
        filters={filters}
        onFilterChange={onFilterChange}
        totalResults={totalResults}
      />

      {/* Jobs Grid */}
      {jobs.length > 0 ? (
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            data-jobs-grid
          >
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={handleApply}
                onSave={handleSave}
                isSaved={savedJobIds.includes(job.id)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                size="lg"
                variant="outline"
                className="gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Jobs'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            We couldn't find any jobs matching your filters. Try broadening your search
            criteria.
          </p>
          <Button variant="outline" onClick={() => onFilterChange({})}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetail
        job={selectedJob}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onApply={handleApply}
        onSave={handleSave}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
      />
    </div>
  );
}
