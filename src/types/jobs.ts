export interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  experience: string;
  jobType: string;
  description: string;
  shortDescription: string;
  tags: string[];
  applyUrl: string;
  source: string;
  postedAt: string;
  updatedAt: string;
  isNew: boolean;
  isPublished: boolean;
  recommendedScore: number;
}

export interface JobsResponse {
  data: Job[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface JobFilters {
  q?: string;
  experience?: string;
  location?: string;
  company?: string;
  jobType?: string;
  sort?: 'newest' | 'salary_desc' | 'salary_asc' | 'recommended';
}

export interface CreateJobPayload {
  slug: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  experience: string;
  jobType: string;
  shortDescription: string;
  description: string;
  tags: string[];
  applyUrl: string;
  source: string;
  postedAt: string;
  isPublished: boolean;
  recommendedScore: number;
}
