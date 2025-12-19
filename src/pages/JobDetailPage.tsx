import { useParams, useNavigate } from 'react-router-dom';
import { useJob } from '@/hooks/use-jobs';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bookmark,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  DollarSign,
  Building2,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useSavedJobs } from '@/hooks/use-jobs';
import { JobsAPI } from '@/services/jobs-api';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useJob(slug || '');
  const { saveJob, unsaveJob, isSaved } = useSavedJobs();
  const [imageError, setImageError] = useState(false);

  const handleApply = () => {
    if (!job) return;
    JobsAPI.trackApplyClick(job.id);
    window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    toast.success('Good luck with your application!', {
      description: `Applying to ${job.title} at ${job.company}`,
    });
  };

  const handleSave = () => {
    if (!job) return;
    if (isSaved(job.id)) {
      unsaveJob(job.id);
      toast.success('Job removed from saved list');
    } else {
      saveJob(job.id);
      toast.success('Job saved successfully');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/private-jobs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </main>
    );
  }

  const postedDate = formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });
  const sanitizedDescription = DOMPurify.sanitize(job.description);

  return (
    <>
      <Helmet>
        <title>{job.title} at {job.company} | TheBulletinBriefs</title>
        <meta name="description" content={job.shortDescription} />
        <meta name="keywords" content={`${job.title}, ${job.company}, ${job.location}, ${job.experience}, ${job.tags.join(', ')}`} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={job.shortDescription} />
        {job.logo && <meta property="og:image" content={job.logo} />}
        <link rel="canonical" href={`https://www.thebulletinbriefs.in/private-jobs/${job.slug}`} />
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/private-jobs')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          {/* Job Header */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                {!imageError ? (
                  <img
                    src={job.logo}
                    alt={`${job.company} logo`}
                    className="w-16 h-16 object-contain rounded-lg border border-border bg-muted"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground font-semibold">
                    {job.company.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span className="text-lg">{job.company}</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {job.isNew && (
                <Badge variant="default">New</Badge>
              )}
              {job.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Job Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Briefcase className="w-4 h-4" />
                  <span>Experience</span>
                </div>
                <p className="font-medium">{job.experience}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <p className="font-medium">{job.location}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>Salary</span>
                </div>
                <p className="font-medium">{job.salary}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Job Type</span>
                </div>
                <p className="font-medium">{job.jobType}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApply}
                className="flex-1 gap-2"
                size="lg"
              >
                Apply Now
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                variant={isSaved(job.id) ? 'default' : 'outline'}
                size="lg"
                onClick={handleSave}
                className="gap-2"
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved(job.id) ? 'fill-current' : ''}`}
                />
                {isSaved(job.id) ? 'Saved' : 'Save Job'}
              </Button>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>

          {/* Additional Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Posted {postedDate}</span>
              </div>
              {job.source && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ExternalLink className="w-4 h-4" />
                  <span>Source: {job.source}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
