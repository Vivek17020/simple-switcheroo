import { Job, JobsResponse, JobFilters, CreateJobPayload } from '@/types/jobs';

// Replace with your actual CMS base URL
const CMS_BASE_URL = import.meta.env.VITE_CMS_BASE_URL || 'https://cms.example.com/api';

export class JobsAPI {
  /**
   * Fetch paginated and filtered jobs list
   * GET /api/jobs
   */
  static async listJobs(
    page: number = 1,
    limit: number = 20,
    filters?: JobFilters
  ): Promise<JobsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.q) params.append('q', filters.q);
    if (filters?.experience) params.append('experience', filters.experience);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.company) params.append('company', filters.company);
    if (filters?.jobType) params.append('jobType', filters.jobType);
    if (filters?.sort) params.append('sort', filters.sort);

    const response = await fetch(`${CMS_BASE_URL}/jobs?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch single job by ID or slug
   * GET /api/jobs/:id_or_slug
   */
  static async getJob(idOrSlug: string): Promise<Job> {
    const response = await fetch(`${CMS_BASE_URL}/jobs/${idOrSlug}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new job (admin only)
   * POST /api/jobs
   */
  static async createJob(payload: CreateJobPayload): Promise<Job> {
    const response = await fetch(`${CMS_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if required
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update existing job (admin only)
   * PUT /api/jobs/:id
   */
  static async updateJob(id: string, payload: Partial<CreateJobPayload>): Promise<Job> {
    const response = await fetch(`${CMS_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if required
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Publish job (admin only)
   * PUT /api/jobs/:id/publish
   */
  static async publishJob(id: string): Promise<Job> {
    const response = await fetch(`${CMS_BASE_URL}/jobs/${id}/publish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to publish job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Unpublish job (admin only)
   * PUT /api/jobs/:id/unpublish
   */
  static async unpublishJob(id: string): Promise<Job> {
    const response = await fetch(`${CMS_BASE_URL}/jobs/${id}/unpublish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: false }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unpublish job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Track apply click (optional analytics)
   * POST /api/jobs/:id/apply-click
   */
  static async trackApplyClick(id: string): Promise<void> {
    try {
      await fetch(`${CMS_BASE_URL}/jobs/${id}/apply-click`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track apply click:', error);
    }
  }

  /**
   * Get recommended jobs for user
   * GET /api/jobs/recommended
   */
  static async getRecommendedJobs(userId?: string): Promise<Job[]> {
    const params = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${CMS_BASE_URL}/jobs/recommended${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recommended jobs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  }
}
