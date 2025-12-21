import { Job } from '@/types/jobs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bookmark,
  MapPin,
  Briefcase,
  Clock,
  ExternalLink,
  DollarSign,
  Building2,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import DOMPurify from 'dompurify';

interface JobDetailProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  isSaved?: boolean;
}

export function JobDetail({
  job,
  open,
  onOpenChange,
  onApply,
  onSave,
  isSaved,
}: JobDetailProps) {
  const [imageError, setImageError] = useState(false);

  if (!job) return null;

  const postedDate = formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });
  const sanitizedDescription = DOMPurify.sanitize(job.description);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Company Logo & Info */}
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
              <DialogTitle className="text-2xl mb-1">{job.title}</DialogTitle>
              <DialogDescription className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {job.company}
              </DialogDescription>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {job.isNew && (
              <Badge variant="default" className="text-xs">
                New
              </Badge>
            )}
            {job.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Job Meta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
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

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 py-4">
          <Button
            onClick={() => onApply(job)}
            className="flex-1 gap-2"
            size="lg"
          >
            Apply Now
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="lg"
            onClick={() => onSave(job.id)}
            className="gap-2"
          >
            <Bookmark
              className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
            />
            {isSaved ? 'Saved' : 'Save Job'}
          </Button>
        </div>

        <Separator />

        {/* Job Description */}
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-4">Job Description</h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        </div>

        <Separator />

        {/* Additional Info */}
        <div className="py-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Posted {postedDate}</span>
          </div>
          {job.source && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Source: {job.source}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
