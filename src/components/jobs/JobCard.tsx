import { Job } from '@/types/jobs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, MapPin, Briefcase, Clock, ExternalLink, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  isSaved?: boolean;
  onViewDetails: (job: Job) => void;
}

export function JobCard({ job, onApply, onSave, isSaved, onViewDetails }: JobCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply(job);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(job.id);
  };

  const postedDate = formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border hover:border-primary/50"
      onClick={() => onViewDetails(job)}
      data-job-id={job.id}
      data-job-slug={job.slug}
    >
      <CardContent className="p-4 md:p-6">
        {/* Header: Logo, Title, Company, Save Button */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {!imageError ? (
              <img
                src={job.logo}
                alt={`${job.company} logo`}
                className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-lg border border-border bg-muted"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
                {job.company.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base md:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveClick}
                className="flex-shrink-0"
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
              >
                <Bookmark
                  className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Badges: New, Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {job.isNew && (
            <Badge variant="default" className="text-xs">
              New
            </Badge>
          )}
          {job.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Short Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {job.shortDescription}
        </p>

        {/* Job Meta: Experience, Location, Salary, Job Type */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs md:text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.experience}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.salary}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.jobType}</span>
          </div>
        </div>

        {/* Footer: Posted Date, Source, Apply Button */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <span>{postedDate}</span>
            {job.source && <span className="ml-2">• {job.source}</span>}
          </div>

          <Button
            size="sm"
            onClick={handleApplyClick}
            className="gap-1.5"
            data-apply-url={job.applyUrl}
          >
            Apply
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
