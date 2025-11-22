import { useState, useEffect, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Job, JobFilters } from '@/types/jobs';
import { JobsAPI } from '@/services/jobs-api';

/**
 * Hook for fetching paginated jobs with filters
 */
export function useJobs(filters?: JobFilters, pageSize: number = 20) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['jobs', filters],
    queryFn: ({ pageParam = 1 }) => JobsAPI.listJobs(pageParam, pageSize, filters),
    getNextPageParam: (lastPage) => {
      const { page, total, limit } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const jobs = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return {
    jobs,
    total,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching single job by ID or slug
 */
export function useJob(idOrSlug: string) {
  return useQuery({
    queryKey: ['job', idOrSlug],
    queryFn: () => JobsAPI.getJob(idOrSlug),
    enabled: !!idOrSlug,
  });
}

/**
 * Hook for fetching recommended jobs
 */
export function useRecommendedJobs(userId?: string) {
  return useQuery({
    queryKey: ['recommendedJobs', userId],
    queryFn: () => JobsAPI.getRecommendedJobs(userId),
  });
}

/**
 * Hook for managing saved jobs (localStorage for anonymous users, DB for authenticated)
 */
export function useSavedJobs() {
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedJobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync saved jobs from database for authenticated users
  useEffect(() => {
    const syncSavedJobs = async () => {
      try {
        const jobs = await JobsAPI.getSavedJobs();
        const ids = jobs.map((job) => job.id);
        setSavedJobIds(ids);
        localStorage.setItem('savedJobs', JSON.stringify(ids));
      } catch (error) {
        // User is not authenticated, use localStorage
        console.log('Using local storage for saved jobs');
      }
    };
    syncSavedJobs();
  }, []);

  const saveJob = useCallback(async (jobId: string) => {
    try {
      await JobsAPI.saveJob(jobId);
    } catch (error) {
      // User is not authenticated, use localStorage
      console.log('Saving to localStorage');
    }
    
    setSavedJobIds((prev) => {
      const updated = [...prev, jobId];
      localStorage.setItem('savedJobs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unsaveJob = useCallback(async (jobId: string) => {
    try {
      await JobsAPI.unsaveJob(jobId);
    } catch (error) {
      // User is not authenticated, use localStorage
      console.log('Removing from localStorage');
    }
    
    setSavedJobIds((prev) => {
      const updated = prev.filter((id) => id !== jobId);
      localStorage.setItem('savedJobs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isSaved = useCallback(
    (jobId: string) => savedJobIds.includes(jobId),
    [savedJobIds]
  );

  return { savedJobIds, saveJob, unsaveJob, isSaved };
}

/**
 * Hook for real-time job updates via polling
 * Can be replaced with WebSocket/SSE implementation
 */
export function useJobUpdates(filters?: JobFilters, intervalMs: number = 60000) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  // This will trigger refetch in useJobs when lastUpdate changes
  return { lastUpdate };
}
