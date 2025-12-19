import { Job, JobsResponse, JobFilters, CreateJobPayload } from '@/types/jobs';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert database record to Job type
function mapDbToJob(dbJob: any): Job {
  return {
    id: dbJob.id,
    slug: dbJob.slug,
    title: dbJob.title,
    company: dbJob.company,
    logo: dbJob.logo,
    location: dbJob.location,
    salary: dbJob.salary,
    experience: dbJob.experience,
    jobType: dbJob.job_type,
    description: dbJob.description,
    shortDescription: dbJob.short_description,
    tags: dbJob.tags || [],
    applyUrl: dbJob.apply_url,
    source: dbJob.source,
    postedAt: dbJob.posted_at,
    updatedAt: dbJob.updated_at,
    isNew: dbJob.is_new,
    isPublished: dbJob.is_published,
    recommendedScore: dbJob.recommended_score,
  };
}

// Helper function to convert Job payload to database format
function mapJobToDb(job: CreateJobPayload): any {
  return {
    slug: job.slug,
    title: job.title,
    company: job.company,
    logo: job.logo,
    location: job.location,
    salary: job.salary,
    experience: job.experience,
    job_type: job.jobType,
    description: job.description,
    short_description: job.shortDescription,
    tags: job.tags,
    apply_url: job.applyUrl,
    source: job.source,
    posted_at: job.postedAt,
    is_published: job.isPublished,
    recommended_score: job.recommendedScore,
  };
}

export class JobsAPI {
  /**
   * Fetch paginated and filtered jobs list from Supabase
   */
  static async listJobs(
    page: number = 1,
    limit: number = 20,
    filters?: JobFilters
  ): Promise<JobsResponse> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('private_jobs')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .range(from, to);

    // Apply filters
    if (filters?.q) {
      query = query.or(`title.ilike.%${filters.q}%,company.ilike.%${filters.q}%,short_description.ilike.%${filters.q}%`);
    }
    if (filters?.experience) {
      query = query.eq('experience', filters.experience);
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters?.company) {
      query = query.ilike('company', `%${filters.company}%`);
    }
    if (filters?.jobType) {
      query = query.eq('job_type', filters.jobType);
    }

    // Apply sorting
    switch (filters?.sort) {
      case 'recommended':
        query = query.order('recommended_score', { ascending: false });
        break;
      case 'salary_desc':
        query = query.order('salary', { ascending: false });
        break;
      case 'salary_asc':
        query = query.order('salary', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('posted_at', { ascending: false });
        break;
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    return {
      data: (data || []).map(mapDbToJob),
      meta: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Fetch single job by ID or slug from Supabase
   */
  static async getJob(idOrSlug: string): Promise<Job> {
    // Try to fetch by ID first, then by slug
    let query = supabase
      .from('private_jobs')
      .select('*')
      .eq('is_published', true);

    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.single();

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    // Increment view count
    await this.incrementViews(data.id);

    return mapDbToJob(data);
  }

  /**
   * Increment job views count
   */
  private static async incrementViews(jobId: string): Promise<void> {
    try {
      await supabase.rpc('increment_job_views', { job_uuid: jobId });
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }

  /**
   * Create new job (admin only) in Supabase
   */
  static async createJob(payload: CreateJobPayload): Promise<Job> {
    const { data, error } = await supabase
      .from('private_jobs')
      .insert([mapJobToDb(payload)])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return mapDbToJob(data);
  }

  /**
   * Update existing job (admin only) in Supabase
   */
  static async updateJob(id: string, payload: Partial<CreateJobPayload>): Promise<Job> {
    const { data, error } = await supabase
      .from('private_jobs')
      .update(mapJobToDb(payload as CreateJobPayload))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return mapDbToJob(data);
  }

  /**
   * Publish job (admin only) in Supabase
   */
  static async publishJob(id: string): Promise<Job> {
    const { data, error } = await supabase
      .from('private_jobs')
      .update({ is_published: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to publish job: ${error.message}`);
    }

    return mapDbToJob(data);
  }

  /**
   * Unpublish job (admin only) in Supabase
   */
  static async unpublishJob(id: string): Promise<Job> {
    const { data, error } = await supabase
      .from('private_jobs')
      .update({ is_published: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to unpublish job: ${error.message}`);
    }

    return mapDbToJob(data);
  }

  /**
   * Delete job (admin only)
   */
  static async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('private_jobs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  /**
   * Track apply click in Supabase
   */
  static async trackApplyClick(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_job_applies', { job_uuid: id });
    } catch (error) {
      console.error('Failed to track apply click:', error);
    }
  }

  /**
   * Get recommended jobs for user from Supabase
   */
  static async getRecommendedJobs(userId?: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('private_jobs')
      .select('*')
      .eq('is_published', true)
      .order('recommended_score', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch recommended jobs: ${error.message}`);
    }

    return (data || []).map(mapDbToJob);
  }

  /**
   * Save job for user (authenticated users)
   */
  static async saveJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_jobs')
      .insert([{ job_id: jobId }]);

    if (error) {
      throw new Error(`Failed to save job: ${error.message}`);
    }
  }

  /**
   * Unsave job for user (authenticated users)
   */
  static async unsaveJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId);

    if (error) {
      throw new Error(`Failed to unsave job: ${error.message}`);
    }
  }

  /**
   * Get saved jobs for user (authenticated users)
   */
  static async getSavedJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        job_id,
        private_jobs (*)
      `)
      .order('saved_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch saved jobs: ${error.message}`);
    }

    return (data || []).map((item: any) => mapDbToJob(item.private_jobs));
  }
}
